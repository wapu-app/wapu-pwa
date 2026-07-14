# Skill: Configurar y deployar en AWS Amplify (WapuPay frontend)

Guía operativa para gestionar los hostings de Amplify del frontend **sin re-explorar**.
Cubre: identificar apps, inspeccionar config, **repointear una app a otro repo**, **agregar una
rama nueva**, **repointear un subdominio a otra rama**, disparar builds, monitorearlos, leer
logs de fallo, **editar archivos en ramas protegidas**, y los **gotchas** conocidos.

> Escrita a partir de un repoint real de `staging.wapu.app` desde el repo `survivors`
> (monorepo) al repo `wapu-pwa` (flat), con auto-deploy funcionando end-to-end.
> Ampliada tras repointear también `my.wapu.app` (prod) a `wapu-pwa`, donde se descubrió que
> el buildSpec configurado por API **no siempre gana** — ver el warning de §2 y §7.

---

## 0. Datos fijos del entorno

- **Región:** `sa-east-1` (todas las apps viven acá; las otras regiones están vacías).
- **Cuenta AWS:** `****190145`.
- **Perfiles AWS CLI:**
  - `claude-mcp-readonly` → para inspección (get/list). Usar por defecto.
  - `claude-mcp-infra` → para mutaciones (update-app, start-job). Usar solo al escribir.
- **Token GitHub:** disponible vía `$(gh auth token)` (scope `repo`, alcanza para
  crear webhooks). **Nunca** imprimir el token; pasarlo siempre por command substitution.

### Apps Amplify (actualizado julio 2026)

| App | `appId` | Rama que sirve el dominio | Dominio | Repo origen |
|-----|---------|------|---------|-------------|
| `qa.wapu.app` | `d18uhpruqe7n23` | `qa` | qa.wapu.app | `wapu-app/survivors` |
| `staging.wapu.app` | `d1lgqpvaq2avf` | `develop` | staging.wapu.app | `wapu-app/wapu-pwa` (repointeada) |
| `my.wapu.app` (prod) | `dp0d93u99g05p` | `main` | my.wapu.app | `wapu-app/wapu-pwa` (repointeada, ver §8 sobre el fix de `amplify.yml` vía PR) |

Todas son `platform: WEB_COMPUTE` (Next.js SSR).

Flujo de deploy: push a la rama trackeada → webhook → build automático → deploy.
**Ojo, esto cambió respecto a versiones previas de esta doc:**
- `staging.wapu.app` ya **no** depende de mergear a una rama `staging` — el subdominio `staging` de
  `wapu.app` fue repointeado (§5) para servir directo la rama `develop`. La rama Amplify
  `staging` en la app `d1lgqpvaq2avf` sigue existiendo (con auto-build activo) pero **ya no tiene
  dominio custom asociado** — quedó huérfana, solo accesible por su URL default de Amplify.
- `my.wapu.app` (prod) ya no se alimenta de `wapu-app/survivors#main` sino de
  `wapu-app/wapu-pwa#main` — cualquier merge a `survivors#main` **ya no dispara deploy a prod**.

---

## 1. Inspección (read-only)

```bash
P="--profile claude-mcp-readonly --region sa-east-1"

# Listar todas las apps de la región
aws amplify list-apps $P \
  --query 'apps[].{name:name,appId:appId,repo:repository}' --output json

# Config de una app (repo, clone method, buildSpec inline, env vars)
aws amplify get-app $P --app-id <APP_ID> \
  --query 'app.{repo:repository,cloneMethod:repositoryCloneMethod,platform:platform,buildSpec:buildSpec,envVars:environmentVariables}'

# Ramas y si tienen auto-build
aws amplify list-branches $P --app-id <APP_ID> \
  --query 'branches[].{branch:branchName,autoBuild:enableAutoBuild,framework:framework,activeJob:activeJobId}'

# Historial de builds de una rama
aws amplify list-jobs $P --app-id <APP_ID> --branch-name <BRANCH> --max-items 8 \
  --query 'jobSummaries[].{job:jobId,status:status,commit:commitId,msg:commitMessage}'
```

---

## 2. Cómo Amplify decide **qué carpeta** buildea (CRÍTICO)

Dos mecanismos, y **tienen que estar alineados**:

1. **Formato del buildSpec:**
   - **Monorepo** → tiene `applications:` + `appRoot: <subdir>`. Buildea desde esa subcarpeta.
     Es lo que usa el repo `survivors` (appRoot: `survivors`).
   - **Flat** → tiene `frontend:` en la raíz, sin `appRoot`. Buildea desde la **raíz del repo**.
     Es lo que necesita `wapu-pwa`.
2. **Env var `AMPLIFY_MONOREPO_APP_ROOT`** → refuerza la subcarpeta del monorepo.

**Precedencia (según docs de AWS):** el buildSpec **inline** guardado en la app pisa el
`amplify.yml` del repo, y un buildSpec inline a nivel **rama** pisa al de nivel **app**.

> ⚠️ **Esto no se cumplió en la práctica** al repointear `my.wapu.app` (julio 2026): con
> `app.buildSpec` y `branch.buildSpec` seteados por API a `npm run env:prod`, el build real
> siguió ejecutando `npm run env:stg` — exactamente lo que decía el `amplify.yml` versionado
> en el repo. Pasó igual en dos jobs distintos (uno probando el override a nivel app, otro a
> nivel rama), así que no fue un fluke. **No asumas la precedencia de la doc de AWS — verificá
> siempre contra el log real del build (§5) antes de dar por buena una config.** Si el repo
> tiene su propio `amplify.yml`, la única forma confiable de cambiar qué comando corre es
> **editar ese archivo en el repo**, no el buildSpec por API. Ver §6.

Por eso, al cambiar de un repo monorepo a uno flat hay que **reescribir el buildSpec inline**
(o alinearlo con el `amplify.yml` del repo nuevo) — no alcanza con cambiar el repo, y ni
siquiera alcanza con el buildSpec inline si el repo tiene su propio `amplify.yml` en esa rama.

### La solución recomendada: `amplify.yml` dinámico por `AWS_BRANCH`

Dado que el `amplify.yml` del repo es lo que realmente manda (warning de arriba), la forma
correcta de evitar que `main` y `develop` necesiten contenidos **distintos** (y por lo tanto
diverjan en cada release, con el riesgo de que un merge pise el fix de prod) es tener **un solo
`amplify.yml`, idéntico en todas las ramas**, que elija el ambiente en tiempo de build usando
`AWS_BRANCH` (env var que Amplify inyecta solo, con el nombre de la rama que está buildeando).
Patrón tomado del repo hermano/legacy `wapu-app/survivors`, adaptado a la topología real de
`wapu-pwa` (¡ojo, el mapeo de `survivors` no sirve tal cual — ver más abajo!):

```yaml
    build:
      commands:
        - |
          echo "Selecting frontend environment for AWS_BRANCH=${AWS_BRANCH:-unknown}"
          case "${AWS_BRANCH:-}" in
            main|prod|production)
              npm run env:prod
              ;;
            develop|staging)
              npm run env:stg
              ;;
            qa)
              npm run env:qa
              ;;
            *)
              echo "Unknown AWS_BRANCH='${AWS_BRANCH:-}'. Falling back to qa (non-prod)."
              npm run env:qa
              ;;
          esac
        - npm run build
```

- **El mapeo de `wapu-pwa` NO es el de `survivors`.** `survivors` mapea `develop|qa → env:qa`.
  En `wapu-pwa`, `develop` alimenta `staging.wapu.app` (necesita `env:stg`), no QA. Copiar el
  mapeo de `survivors` literal rompe staging (sirve contra `be-qa.wapu.app` en vez de
  `be-stage.wapu.app`) — de hecho ya pasó: la rama `dinamic-deploy` (PR #1, mayo 2026, cerrado
  sin mergear) tenía exactamente ese bug. Se corrigió y se reabrió como PR #7 contra `develop`.
- El fallback (rama no reconocida) **nunca** debe ser prod — usar `env:qa` como default seguro.
- El arm `main|prod|production` queda documentado en el archivo para cuando se decida llevar
  este mismo fix a `main` — **eso es una acción separada y explícita, no algo que se hace de
  arrastre** al arreglar `develop`. Ver el gotcha de alcance en §7.

**Estado (julio 2026):** aplicado a `develop` vía PR #7 (verificar estado actual con
`gh pr view 7 --repo wapu-app/wapu-pwa`). `main` sigue con el `amplify.yml` de emergencia
(`env:prod` hardcodeado sin `case`, del incidente de repoint de prod) — a propósito, hasta
validar el mecanismo dinámico en staging y que alguien pida explícitamente extenderlo a `main`.

---

## 3. Repointear una app a OTRO repo (operación destructiva)

> Cambia el origen de un entorno vivo. Confirmar con el usuario antes.
> Solo funciona limpio por CLI si `repositoryCloneMethod` es `TOKEN` (o `SSH`); si la app
> usa la **GitHub App**, la re-vinculación se hace por consola.

### Pre-chequeos

```bash
# 1. Clone method de la app actual (debe ser TOKEN o SSH para CLI)
aws amplify get-app $P --app-id <APP_ID> --query 'app.repositoryCloneMethod'

# 2. El repo nuevo y su rama existen
gh repo view wapu-app/<REPO> --json name,defaultBranchRef,visibility
gh api "repos/wapu-app/<REPO>/branches/<BRANCH>" --jq '.name'

# 3. Estructura del repo nuevo: ¿flat o monorepo? ¿tiene amplify.yml?
gh api "repos/wapu-app/<REPO>/contents?ref=<BRANCH>" --jq '.[].name'   # OJO: comillas por el '?' (zsh glob)
gh api "repos/wapu-app/<REPO>/contents/amplify.yml?ref=<BRANCH>" --jq '.content' | base64 -d
```

### Ejecutar el repoint (perfil infra)

```bash
I="--profile claude-mcp-infra --region sa-east-1"

# Guardar el amplify.yml del repo nuevo como buildSpec (si es flat)
gh api "repos/wapu-app/<REPO>/contents/amplify.yml?ref=<BRANCH>" --jq '.content' | base64 -d > /tmp/spec.yml

aws amplify update-app $I --app-id <APP_ID> \
  --repository "https://github.com/wapu-app/<REPO>" \
  --access-token "$(gh auth token)" \
  --build-spec "file:///tmp/spec.yml" \
  --environment-variables AMPLIFY_DIFF_DEPLOY=false   # OJO: reemplaza TODO el mapa de env vars
```

Notas clave:
- `--environment-variables` **reemplaza el mapa completo**. Para *quitar*
  `AMPLIFY_MONOREPO_APP_ROOT`, simplemente no lo incluís (dejá solo lo que debe quedar).
- Pasar `--access-token` puede cambiar `repositoryCloneMethod` a `SSH`: Amplify crea un
  **deploy key read-only** (`<APP_ID>:amplify@aws`) + un **webhook** de push en el repo. Es normal.
- La rama existente (ej. `staging`) se conserva con su `enableAutoBuild`; tras el repoint
  trackea la rama homónima del repo nuevo.

### Verificar que el rewire quedó completo

```bash
aws amplify get-app $P --app-id <APP_ID> --query 'app.{repo:repository,clone:repositoryCloneMethod,buildSpec:buildSpec,env:environmentVariables}'
aws amplify get-branch $P --app-id <APP_ID> --branch-name <BRANCH> --query 'branch.{autoBuild:enableAutoBuild,enableNotification:enableNotification}'
gh api repos/wapu-app/<REPO>/hooks --jq '.[] | {url: .config.url, events, active}'   # webhook de auto-deploy
gh api repos/wapu-app/<REPO>/keys  --jq '.[] | {title, read_only}'                    # deploy key (si clone=SSH)
```

> ⚠️ **Esto NO es suficiente.** `get-app`/`get-branch` solo muestran lo que la API tiene
> *guardado*, no lo que el build va a *ejecutar de verdad* (ver el warning de §2). Después de
> un repoint, disparar un build y leer el log real (§6) para confirmar qué `npm run env:*`
> corrió, antes de dar el repoint por terminado.

---

## 4. Agregar una rama nueva a una app existente (sin repointear el repo)

Para que un ambiente nuevo (ej. una rama `develop` que hoy no tiene su propio hosting) empiece
a auto-deployar dentro de una app **que ya está conectada al repo correcto** — no hace falta
tocar `repository`/`buildSpec` de la app, alcanza con `create-branch`:

```bash
aws amplify create-branch $I --app-id <APP_ID> \
  --branch-name <BRANCH> \
  --framework "Next.js - SSR" \
  --stage DEVELOPMENT \
  --enable-auto-build
```

> ⚠️ **Gotcha:** `create-branch` deja `enableNotification` en `false` por default, aunque no
> lo pidas explícito. Si la rama vieja que reemplaza (o la rama "hermana") tenía notificaciones
> por mail activadas, esta rama nueva las pierde silenciosamente — el auto-deploy funciona
> igual, pero dejás de recibir el mail de "build corriendo". Fix:
> ```bash
> aws amplify update-branch $I --app-id <APP_ID> --branch-name <BRANCH> --enable-notification
> ```
> Chequealo siempre comparando contra una rama de referencia:
> `aws amplify get-branch $P --app-id <APP_ID> --branch-name <REF_BRANCH> --query 'branch.enableNotification'`

Si esta rama nueva va a servir un dominio custom que hoy usa otra rama, ver §5.

---

## 5. Repointear un subdominio existente a otra rama (sin cambiar de repo)

Caso: `staging.wapu.app` apuntaba a la rama Amplify `staging`, y ahora tiene que servir el
código de la rama `develop` — sin crear un dominio nuevo. En Amplify, un `subDomainSetting`
(`prefix` + `branchName`) apunta a **una sola rama a la vez**; no se puede compartir entre dos
ramas. Repointear = reasignar ese `branchName`.

```bash
# 1. La rama nueva tiene que existir en la app (ver §4) y tener auto-build activo
aws amplify get-branch $P --app-id <APP_ID> --branch-name <BRANCH_NUEVA> --query 'branch.enableAutoBuild'

# 2. Ver el subDomainSetting actual (qué prefix apunta a qué rama)
aws amplify get-domain-association $P --app-id <APP_ID> --domain-name <DOMINIO_RAIZ> \
  --query 'domainAssociation.subDomains'

# 3. Reasignar (reemplaza TODO el mapa de subDomains, igual que --environment-variables)
aws amplify update-domain-association $I --app-id <APP_ID> --domain-name <DOMINIO_RAIZ> \
  --sub-domain-settings prefix=<PREFIX>,branchName=<BRANCH_NUEVA>
```

Notas:
- `domainStatus` pasa a `UPDATING` un rato (revalidación de CNAME/cert); no genera downtime
  porque el CNAME de CloudFront no cambia si ambas ramas cuelgan de la misma app.
- La rama vieja (`<BRANCH_VIEJA>` en el ejemplo) sigue existiendo con su auto-build activo,
  solo pierde el dominio custom — queda accesible por su URL default de Amplify
  (`<branch>.<appId>.amplifyapp.com`). Si no se va a usar más, plantear con el usuario si
  conviene desactivarle `enableAutoBuild` o eliminarla — no asumir.
- Después de repointear, la rama nueva necesita al menos un build **exitoso** para que el
  dominio sirva contenido real; si no va a haber un push inmediato, disparar uno manual
  (§6) para no dejar el dominio con un deploy viejo/inconsistente.

---

## 6. Disparar y monitorear un build

```bash
# Disparar build manual (RELEASE = toma el HEAD de la rama)
aws amplify start-job $I --app-id <APP_ID> --branch-name <BRANCH> --job-type RELEASE \
  --query 'jobSummary.{job:jobId,status:status}'

# Poll hasta que termine (correr en background; los builds tardan ~6 min)
until s=$(aws amplify get-job $P --app-id <APP_ID> --branch-name <BRANCH> --job-id <JOB> \
  --query 'job.summary.status' --output text); \
  [ "$s" = SUCCEED ] || [ "$s" = FAILED ] || [ "$s" = CANCELLED ]; do \
  echo "status=$s"; sleep 20; done; echo "FINAL=$s"
```

El auto-deploy se dispara **solo** con cualquier `push` a la rama trackeada (no hace falta
`start-job`); usar `start-job` solo para validar sin pushear.

### Leer el log de un build fallido

```bash
# Ver en qué step falló
aws amplify get-job $P --app-id <APP_ID> --branch-name <BRANCH> --job-id <JOB> \
  --query 'job.steps[].{step:stepName,status:status}'

# Bajar el log de BUILD (logUrl es un presigned S3, expira ~1h)
URL=$(aws amplify get-job $P --app-id <APP_ID> --branch-name <BRANCH> --job-id <JOB> \
  --query 'job.steps[?stepName==`BUILD`].logUrl' --output text)
curl -s "$URL" | tail -40
```

### Verificar que el buildSpec REAL coincide con el configurado (CRÍTICO)

No confíes en `get-app`/`get-branch` para saber qué comando corrió — pueden mostrar un
buildSpec que la API aceptó pero que el build **no usó** (ver warning de §2). La única
fuente de verdad es el log:

```bash
URL=$(aws amplify get-job $P --app-id <APP_ID> --branch-name <BRANCH> --job-id <JOB> \
  --query 'job.steps[?stepName==`BUILD`].logUrl' --output text)
curl -s "$URL" | grep -n -A3 "Starting phase: build\|Executing command: npm run env"
```

Tiene que decir `npm run env:<ambiente esperado>` (ej. `env:prod` para `my.wapu.app`). Si dice
otra cosa, el buildSpec que "ganó" fue el `amplify.yml` versionado en el repo — andá a §8 para
corregirlo ahí, no sigas peleando con `update-app`/`update-branch --build-spec`.

### Confirmar deploy activo + sitio arriba

```bash
aws amplify get-branch $P --app-id <APP_ID> --branch-name <BRANCH> --query 'branch.activeJobId'
curl -s -o /dev/null -w "status=%{http_code}\n" -L --max-time 25 https://<domain>
```

> Un `status=000` (curl exit 56) justo tras el deploy suele ser un cold-start transitorio
> del SSR; reintentar antes de asumir que falló.

---

## 7. Gotchas conocidos

- **zsh glob con `?`:** las URLs de `gh api ...?ref=...` deben ir **entre comillas**, o zsh
  tira `no matches found`.
- **El buildSpec del repo puede ganarle al inline, aunque la doc de AWS diga lo contrario:**
  ver el warning de §2. Confirmado empíricamente en `dp0d93u99g05p` (`my.wapu.app`): con
  `app.buildSpec` y `branch.buildSpec` seteados por API a `env:prod`, dos builds distintos
  siguieron corriendo `env:stg` (lo que decía el `amplify.yml` del repo). **Siempre verificar
  contra el log real (§6) después de cualquier cambio de buildSpec** — no alcanza con leer
  la respuesta de `get-app`/`get-branch`. Si el repo tiene su propio `amplify.yml`, editá ese
  archivo (§8) en vez de pelear con `update-app`/`update-branch --build-spec`.
- **`create-branch` deja `enableNotification` en `false` por default:** ver §4. Si la rama
  reemplaza a otra que sí tenía mail de build activado, hay que prenderlo a mano con
  `update-branch --enable-notification`.
- **Bug `config/environment/current/` en `wapu-pwa`:** el `.gitignore` ignora el archivo
  `config/environment/current/index.js`, y como es el único archivo de ese dir, **el
  directorio no se trackea** → en un clone limpio no existe. El script
  `scripts/set_environment.sh` hace `cp ... config/environment/current/index.js` y falla
  (`cp: No such file or directory`), luego `next.config.js` hace `readFileSync` de ese path
  → **ENOENT y build roto**. En `survivors` no pasaba porque ahí el `index.js` está
  committeado (force-added). **Fix aplicado:** agregar `mkdir -p config/environment/current`
  antes del `cp` en `set_environment.sh` (commit `b7bc3bc` en `wapu-pwa/staging`).
  **Estado (verificado julio 2026):** el fix ya está presente en `wapu-pwa/main` (confirmado
  leyendo `scripts/set_environment.sh` desde GitHub antes de repointear prod). No se verificó
  en `qa` — chequear antes de asumir que está propagado ahí también.
- **`start-job` con job ya numerado:** los `jobId` continúan la numeración de la app; no se
  reinician al cambiar de repo.
- **Variables `$P`/`$I` con los flags de perfil/región pueden fallar** dentro de un bloque de
  bash multilínea (`Unknown options: --profile ... --region ...`, como si todo el valor de la
  variable se pasara como un solo argumento). Si un comando falla así, no insistas con la
  variable: **poné los flags inline** en cada invocación de `aws`.
- **No arrastrar `main`/prod a un fix pensado para `develop`/staging, aunque sea "el mismo
  cambio".** Al armar el fix de `amplify.yml` dinámico (§2), el plan original proponía abrir PR
  a `develop` y a `main` en la misma pasada, ya que el archivo final iba a ser idéntico. El
  usuario lo frenó explícitamente: probarlo primero en `develop`/staging, y tocar `main` es una
  acción **separada y a pedido explícito**, nunca de arrastre — aunque técnicamente sea "lo
  mismo" y elimine divergencia a futuro. Por default, alcance cualquier fix de infra a la rama
  de menor riesgo primero.

---

## 8. Editar un archivo en una rama protegida (ej. corregir `amplify.yml` en `main`)

`main` (y probablemente otras ramas "de release") tiene **branch protection**: escribir un
archivo directo por la Contents API de GitHub falla con `409` aunque el token tenga scope
`repo`:

```
{"message":"Could not update file: Changes must be made through a pull request.", "status":"409"}
```

Chequear esto **antes** de intentar un fix rápido (evita el round-trip del error):

```bash
gh api repos/wapu-app/<REPO>/branches/<BRANCH>/protection \
  --jq '{reviews: .required_pull_request_reviews.required_approving_review_count, code_owners: .required_pull_request_reviews.require_code_owner_reviews}'
```

Si devuelve algo (no 404), la rama está protegida — el único camino es rama + PR:

```bash
# 1. Crear rama desde el HEAD de la protegida
MAIN_SHA=$(gh api repos/wapu-app/<REPO>/git/refs/heads/<BRANCH> --jq '.object.sha')
gh api repos/wapu-app/<REPO>/git/refs -f ref="refs/heads/fix/lo-que-sea" -f sha="$MAIN_SHA"

# 2. Commitear el archivo corregido en la rama nueva (no protegida)
SHA=$(gh api "repos/wapu-app/<REPO>/contents/<PATH>?ref=<BRANCH>" --jq '.sha')
CONTENT_B64=$(base64 < /path/al/archivo/corregido | tr -d '\n')
gh api -X PUT "repos/wapu-app/<REPO>/contents/<PATH>" \
  -f message="fix: <descripción>" \
  -f content="$CONTENT_B64" \
  -f sha="$SHA" \
  -f branch="fix/lo-que-sea"

# 3. Abrir el PR
gh pr create --repo wapu-app/<REPO> --base <BRANCH> --head fix/lo-que-sea \
  --title "..." --body "..."
```

No hay atajo por CLI para saltarse la review — necesita aprobación humana (y de code owner si
`require_code_owner_reviews` es `true`) antes de mergear y que el fix llegue a producción.
Si el fix es urgente (ej. prod sirviendo con backend equivocado), avisar explícitamente la
urgencia en el título/cuerpo del PR para que se priorice la review.
