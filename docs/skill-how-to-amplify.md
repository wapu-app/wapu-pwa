# Skill: Configurar y deployar en AWS Amplify (WapuPay frontend)

Guía operativa para gestionar los hostings de Amplify del frontend **sin re-explorar**.
Cubre: identificar apps, inspeccionar config, **repointear una app a otro repo**, **agregar una
rama nueva**, **repointear un subdominio a otra rama**, disparar builds, monitorearlos, leer
logs de fallo, **editar archivos en ramas protegidas**, y los **gotchas** conocidos.

> Escrita a partir de un repoint real de `staging.wapu.app` desde el repo `survivors`
> (monorepo) al repo `wapu-pwa` (flat), con auto-deploy funcionando end-to-end.
> Ampliada tras repointear también `my.wapu.app` (prod) a `wapu-pwa`, donde se descubrió que
> el buildSpec configurado por API **no siempre gana** — ver el warning de §2 y §7.
> Revisada en **septiembre 2026** tras desarmar el flujo de la rama `staging` y armar el mail
> de build de `develop`. Esa pasada corrigió cinco afirmaciones falsas de esta doc: el estado
> del `amplify.yml` de `main` (§2), el fix de notificaciones (§4 y §9), la numeración de los
> `jobId` (§7), y los límites del perfil `claude-mcp-infra` (§0 y §7).

---

## 0. Datos fijos del entorno

> 🔓 **Este repositorio es PÚBLICO.** No escribas en esta doc el account ID de AWS, ARNs
> completos, direcciones de mail, IDs de suscripción, tokens ni URLs presignadas. Usá los
> placeholders `<ACCOUNT_ID>`, `<APP_ID>`, `<BRANCH>`, `<MAIL>`, o mejor, derivá el valor en
> tiempo de ejecución (`aws sts get-caller-identity`). Si pegás la salida de un comando,
> borrale los identificadores antes de guardar.

- **Región:** `sa-east-1` (todas las apps viven acá; las otras regiones están vacías).
- **Cuenta AWS:** no se escribe acá. Obtenela con
  `aws sts get-caller-identity --query Account --output text`.
- **Perfiles AWS CLI:**
  - `claude-mcp-readonly` → para inspección (get/list). Usar por defecto.
    **No puede leer IAM** (`list-attached-user-policies` devuelve `InvalidClientTokenId`),
    así que los límites de permisos recién aparecen cuando una llamada se rechaza.
  - `claude-mcp-infra` → para mutaciones (update-app, start-job). Usar solo al escribir.
    ⚠️ **Tiene un deny explícito:** la política `DenyDestructiveActions` niega
    `amplify:DeleteBranch`. Un deny explícito no se sortea con otra política. Ver §7.
- **Cómo fijar perfil y región** (forma recomendada; evita el gotcha de `$P`/`$I` de §7):
  ```bash
  export AWS_PROFILE=claude-mcp-readonly AWS_REGION=sa-east-1   # inspección
  export AWS_PROFILE=claude-mcp-infra    AWS_REGION=sa-east-1   # mutaciones
  ```
  El resto de la doc usa `$P`/`$I` por brevedad. Leelos como "los flags de perfil y región".
- **Token GitHub:** disponible vía `$(gh auth token)` (scope `repo`, alcanza para
  crear webhooks). **Nunca** imprimir el token; pasarlo siempre por command substitution.

### Apps Amplify (actualizado septiembre 2026)

| App | `appId` | Rama que sirve el dominio | Dominio | Mail de build | Repo origen |
|-----|---------|------|---------|-----|-------------|
| `qa.wapu.app` | `d18uhpruqe7n23` | `qa` | qa.wapu.app | no | `wapu-app/survivors` |
| `staging.wapu.app` | `d1lgqpvaq2avf` | `develop` | staging.wapu.app | sí, en `develop` (§9) | `wapu-app/wapu-pwa` (repointeada) |
| `my.wapu.app` (prod) | `dp0d93u99g05p` | `main` | my.wapu.app | sí | `wapu-app/wapu-pwa` (repointeada, ver §8 sobre el fix de `amplify.yml` vía PR) |

Todas son `platform: WEB_COMPUTE` (Next.js SSR).

Flujo de deploy: push a la rama trackeada → webhook → build automático → deploy.
Observado el 2026-09-06: `wapu-pwa` tiene **un solo webhook**
(`amplify-webhooks.sa-east-1.amazonaws.com/github/repository-webhook`, evento `push`), y las
dos apps que apuntan a ese repo reciben igual sus builds. No hace falta un webhook por app.

**Ojo, esto cambió respecto a versiones previas de esta doc:**
- `staging.wapu.app` ya **no** depende de mergear a una rama `staging` — el subdominio `staging` de
  `wapu.app` fue repointeado (§5) para servir directo la rama `develop`.
- **La rama Amplify `staging` quedó desarmada (septiembre 2026).** Tiene
  `enableAutoBuild: false` y `enableNotification: false`, y ya no tiene ni topic SNS ni regla
  de EventBridge. Los merges a la rama git `staging` **no disparan ningún build**. La rama
  sigue existiendo en Amplify porque `claude-mcp-infra` no puede borrarla (§7); hay que
  eliminarla desde la consola. Mientras siga ahí, su URL default
  `staging.d1lgqpvaq2avf.amplifyapp.com` sirve el último deploy que alcanzó a hacer, que ya
  no se actualiza. Chequeá qué commit es con `curl` a su `/version.json` (§1); no confíes en
  este párrafo para eso.
- `my.wapu.app` (prod) ya no se alimenta de `wapu-app/survivors#main` sino de
  `wapu-app/wapu-pwa#main` — cualquier merge a `survivors#main` **ya no dispara deploy a prod**.

> **Mito desmentido (septiembre 2026):** "el deploy de `develop` sale solo cuando alguien
> mergea a `staging`". Es falso. Se midió push por push contra `list-jobs`: cada push a
> `develop` disparó su build entre 1 y 3 segundos después, y ningún push a `staging` disparó
> jamás un build de `develop`. La confusión viene de que un merge `develop` → `staging` produce
> **dos builds del mismo commit con ~1 minuto de diferencia** (uno por rama), y en la consola
> parece que el segundo causó al primero. Para desambiguar, comparar
> `gh api repos/wapu-app/wapu-pwa/events` (los `PushEvent` con su `ref`) contra los
> `startTime` de `list-jobs` de cada rama.

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

# Historial de builds de una rama (startTime sirve para correlacionar con los push)
aws amplify list-jobs $P --app-id <APP_ID> --branch-name <BRANCH> --max-items 8 \
  --query 'jobSummaries[].{job:jobId,status:status,start:startTime,commit:commitId,msg:commitMessage}'

# Qué rama sirve cada subdominio (NO asumir que prefix == branchName)
aws amplify get-domain-association $P --app-id <APP_ID> --domain-name <DOMINIO_RAIZ> \
  --query 'domainAssociation.subDomains[].subDomainSetting'
```

Para inspeccionar el mail de build hay que salir de la API de Amplify — son piezas de SNS y
EventBridge (§9):

```bash
# Topics de notificación (uno por rama con mail activo)
aws sns list-topics $P --query 'Topics[?contains(TopicArn,`<APP_ID>`)].TopicArn' --output text

# Reglas que traducen el evento de build en un publish al topic
aws events list-rules $P --query 'Rules[?contains(Name,`<APP_ID>`)].{name:Name,state:State}'

# Quién recibe el mail, y si confirmó la suscripción.
# Derivá el ARN del list-topics de arriba, así no hace falta escribir la cuenta.
TOPIC=$(aws sns list-topics $P \
  --query 'Topics[?contains(TopicArn,`amplify-<APP_ID>_<BRANCH>`)]|[0].TopicArn' --output text)
aws sns list-subscriptions-by-topic $P --topic-arn "$TOPIC" \
  --query 'Subscriptions[].{endpoint:Endpoint,arn:SubscriptionArn}'
```

> Una `SubscriptionArn` con el valor literal `PendingConfirmation` significa que la persona
> nunca hizo clic en el mail de confirmación. Con ese estado **no llega ningún aviso**.

**Qué sirve de verdad cada ambiente** (más confiable que `activeJobId`, porque
`scripts/generate-version.js` sella el commit en cada build):

```bash
curl -s -H 'Cache-Control: no-cache' "https://<domain>/version.json"
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

**Estado (verificado el 2026-09-06):** el `case` dinámico ya está en `main` **y** en `develop`,
con contenido idéntico. Comprobalo así, sin clonar nada:

```bash
diff <(git show origin/main:amplify.yml) <(git show origin/develop:amplify.yml) && echo IDENTICOS
```

Esto corrige la versión previa de esta doc, que decía que `main` seguía con el `amplify.yml`
de emergencia (`env:prod` hardcodeado sin `case`). Ya no es así: el mecanismo dinámico se
extendió a `main` y la divergencia entre ramas desapareció.

**Los buildSpec inline siguen desalineados, y no importa.** A propósito, quedaron viejos:

| App | `app.buildSpec` inline | Qué corre de verdad |
|-----|------------------------|---------------------|
| `d1lgqpvaq2avf` | `npm run env:stg` fijo, sin `case` | el `amplify.yml` del repo |
| `dp0d93u99g05p` | `npm run env:prod` fijo, sin `case` (también a nivel rama) | el `amplify.yml` del repo |

Hoy es inocuo, porque el `case` del repo llega al mismo comando para `develop` y para `main`.
Pasa a ser una trampa el día que se agregue a una de estas apps una rama con otro ambiente:
el inline diría una cosa y el build haría otra. No leas el inline para saber qué corre — leé
el log (§6).

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
> igual, pero dejás de recibir el mail de "build corriendo".
>
> **La versión previa de esta doc daba el fix equivocado.** Decía que alcanzaba con:
> ```bash
> aws amplify update-branch $I --app-id <APP_ID> --branch-name <BRANCH> --enable-notification
> ```
> **Ese flag no crea nada.** El mail son tres piezas de SNS y EventBridge que la consola web
> crea juntas y la API **no**. Confirmado el 2026-09-06: la rama `develop` de `d1lgqpvaq2avf`
> tenía `enableNotification: true` desde julio y jamás mandó un mail, porque no existían ni el
> topic ni la regla. El flag es necesario pero no suficiente. **Armá las tres piezas: ver §9.**
>
> Y no valides el resultado con `get-branch`: devuelve `true` igual, exista o no la plomería.

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

- **zsh glob con `?`:** **cualquier** URL con `?` tiene que ir entre comillas, o zsh tira
  `no matches found`. Aplica a `gh api ...?ref=...` y también a `curl`
  (`curl "https://staging.wapu.app/version.json?cb=1"`). El comando ni siquiera se ejecuta,
  así que el error es de la shell, no de la herramienta.
- **El buildSpec del repo puede ganarle al inline, aunque la doc de AWS diga lo contrario:**
  ver el warning de §2. Confirmado empíricamente en `dp0d93u99g05p` (`my.wapu.app`): con
  `app.buildSpec` y `branch.buildSpec` seteados por API a `env:prod`, dos builds distintos
  siguieron corriendo `env:stg` (lo que decía el `amplify.yml` del repo). **Siempre verificar
  contra el log real (§6) después de cualquier cambio de buildSpec** — no alcanza con leer
  la respuesta de `get-app`/`get-branch`. Si el repo tiene su propio `amplify.yml`, editá ese
  archivo (§8) en vez de pelear con `update-app`/`update-branch --build-spec`.
- **`enableNotification: true` no significa que llegue el mail.** El flag de la API no crea
  el topic SNS ni la regla de EventBridge, así que puede estar en `true` durante meses sin
  mandar un solo aviso. Es el error que tenía esta doc hasta septiembre 2026. Para
  diagnosticar "no me llega el mail" no mires `get-branch`: corré `sns list-topics` y
  `events list-rules` y buscá el par de la rama (§1). Para armarlo, §9.
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
- **Los `jobId` se numeran por RAMA, no por app.** La versión previa de esta doc decía
  "continúan la numeración de la app" — es falso. En la misma app `d1lgqpvaq2avf`, la rama
  `develop` iba por el job 13 mientras `staging` iba por el 92. Sí es cierto que no se
  reinician al cambiar de repo. No uses el número de job para deducir orden cronológico
  entre ramas distintas: para eso está `startTime`.
- **Amplify colapsa los builds encolados.** Si llega un push mientras corre un build de la
  misma rama, el commit nuevo puede **reemplazar** al encolado en vez de sumarse. Pasó el
  2026-09-02: `d2ad1ee` se pusheó a `develop` a las `03:38:48Z` y nunca tuvo job propio,
  porque `d6b20ec` llegó 71 segundos después y lo contenía. No se pierde código, pero
  **no esperes un job por commit** al auditar el historial.
- **Variables `$P`/`$I` con los flags de perfil/región pueden fallar** dentro de un bloque de
  bash multilínea (`Unknown options: --profile ... --region ...`, como si todo el valor de la
  variable se pasara como un solo argumento). Si un comando falla así, no insistas con la
  variable: **poné los flags inline**, o mejor todavía, usá
  `export AWS_PROFILE=... AWS_REGION=...` al principio del bloque (§0). El export no sufre
  este problema y deja los comandos más cortos.
- **`claude-mcp-infra` NO puede borrar ramas de Amplify.** La política
  `DenyDestructiveActions` niega `amplify:DeleteBranch` con un deny **explícito**, que ninguna
  otra política puede sortear:
  ```
  AccessDeniedException ... not authorized to perform: amplify:DeleteBranch
  ... with an explicit deny in an identity-based policy:
  arn:aws:iam::<ACCOUNT_ID>:policy/DenyDestructiveActions
  ```
  **Verificado el 2026-09-06 que sí funcionan:** `amplify:UpdateBranch`, y todo SNS y
  EventBridge (`CreateTopic`, `SetTopicAttributes`, `Subscribe`, `DeleteTopic`, `PutRule`,
  `PutTargets`, `RemoveTargets`, `DeleteRule`). El deny apunta a los borrados de Amplify, no
  a SNS ni a EventBridge. `amplify:UpdateApp` (§3), `amplify:UpdateDomainAssociation` (§5) y
  `amplify:StartJob` (§6) se usaron con éxito en pasadas anteriores, pero no se volvieron a
  probar en esta.
  **Plan alternativo cuando piden "borrar una rama":** apagar el flujo con
  `update-branch --no-enable-auto-build --no-enable-notification` y desarmar sus
  notificaciones (§9). Eso detiene los builds, pero **la rama y su URL default siguen vivas**
  sirviendo el último deploy. Avisar que la eliminación real necesita la consola web
  (Amplify → app → Branches → rama → Delete) o que alguien levante el deny. No presentarlo
  como equivalente a borrar.
- **Antes de borrar una rama, chequear que no sirva un subdominio — y ojo con los nombres.**
  El `prefix` de un subdominio y el `branchName` **no tienen por qué coincidir**: en
  `d1lgqpvaq2avf` el prefix `staging` apunta a la rama `develop`. Borrar la rama llamada
  `staging` ahí es inofensivo; borrar `develop` tiraría `staging.wapu.app`. Verificar siempre
  con `get-domain-association` (§1) antes de tocar cualquier rama.
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

---

## 9. Mail de build de una rama (SNS + EventBridge)

El "email notification" de Amplify **no vive en la API de Amplify**. Son tres piezas
independientes que la consola web crea juntas, y que por CLI hay que armar a mano:

| # | Pieza | Nombre |
|---|-------|--------|
| 1 | Topic SNS, con policy que permite `sns:Publish` a `events.amazonaws.com` | `amplify-<APP_ID>_<BRANCH>` |
| 2 | Suscripción `email` en ese topic, **confirmada por la persona** | una por destinatario |
| 3 | Regla EventBridge que traduce el evento de build en un publish | `amplify-<APP_ID>-<BRANCH>-branch-notification` |

El flag `enableNotification` de la rama es un cuarto requisito, y el único que sí está en la
API de Amplify. **Ninguno de los tres se crea solo al prenderlo** — ver el gotcha de §4.

### Diagnosticar "no me llega el mail"

Corré los tres `list-*` de §1. El diagnóstico sale de qué falta:

- Falta el **topic** → nunca se configuró por consola. Armá las tres piezas.
- Falta la **regla** → el topic existe pero nadie publica en él. Creá la regla y el target.
- La suscripción dice **`PendingConfirmation`** → la plomería está bien, falta el clic.
- Está todo y no llega → mirá la métrica de publicaciones (más abajo) para saber si el
  problema está antes o después de SNS.

### Armar las tres piezas

Copiá siempre la forma de una rama que **ya funcione** (`aws events describe-rule` +
`list-targets-by-rule` + `sns get-topic-attributes`), en vez de inventar la config.

```bash
export AWS_PROFILE=claude-mcp-infra AWS_REGION=sa-east-1
APP=<APP_ID>; BR=<BRANCH>
ACCT=$(aws sts get-caller-identity --query Account --output text)   # nunca hardcodear
ARN="arn:aws:sns:$AWS_REGION:$ACCT:amplify-${APP}_${BR}"

# 1. Topic
aws sns create-topic --name "amplify-${APP}_${BR}"

# 2. Policy: sin esta statement, EventBridge no puede publicar y el mail nunca sale
cat > /tmp/topic-policy.json <<JSON
{"Version":"2008-10-17","Id":"__default_policy_ID","Statement":[
 {"Sid":"__default_statement_ID","Effect":"Allow","Principal":{"AWS":"*"},
  "Action":["SNS:GetTopicAttributes","SNS:SetTopicAttributes","SNS:AddPermission",
            "SNS:RemovePermission","SNS:DeleteTopic","SNS:Subscribe",
            "SNS:ListSubscriptionsByTopic","SNS:Publish"],
  "Resource":"$ARN","Condition":{"StringEquals":{"AWS:SourceOwner":"$ACCT"}}},
 {"Sid":"Allow_Publish_Events$ARN","Effect":"Allow",
  "Principal":{"Service":"events.amazonaws.com"},"Action":"sns:Publish","Resource":"$ARN"}]}
JSON
aws sns set-topic-attributes --topic-arn "$ARN" --attribute-name Policy \
  --attribute-value file:///tmp/topic-policy.json

# 3. Suscripción (queda en PendingConfirmation hasta que la persona haga clic)
aws sns subscribe --topic-arn "$ARN" --protocol email --notification-endpoint <MAIL>

# 4. Regla EventBridge
cat > /tmp/rule-pattern.json <<JSON
{"detail":{"appId":["$APP"],"branchName":["$BR"],
           "jobStatus":["SUCCEED","FAILED","STARTED"]},
 "detail-type":["Amplify Deployment Status Change"],"source":["aws.amplify"]}
JSON
aws events put-rule --name "amplify-${APP}-${BR}-branch-notification" --state ENABLED \
  --event-pattern file:///tmp/rule-pattern.json \
  --description "AWS Amplify build notifications for : App: $APP Branch: $BR"

# 5. Target: el topic, con el InputTransformer que arma el texto del mail
cat > /tmp/rule-targets.json <<JSON
[{"Id":"$BR","Arn":"$ARN","InputTransformer":{
  "InputPathsMap":{"appId":"\$.detail.appId","branch":"\$.detail.branchName",
                   "jobId":"\$.detail.jobId","region":"\$.region",
                   "status":"\$.detail.jobStatus"},
  "InputTemplate":"\"Build notification from the AWS Amplify Console for app: https://<branch>.<appId>.amplifyapp.com/. Your build status is <status>. Go to https://console.aws.amazon.com/amplify/apps/<appId>/branches/<branch>?region=<region> to view details on your build. \""}}]
JSON
aws events put-targets --rule "amplify-${APP}-${BR}-branch-notification" \
  --targets file:///tmp/rule-targets.json     # tiene que devolver FailedEntryCount: 0

# 6. El flag de Amplify
aws amplify update-branch --app-id "$APP" --branch-name "$BR" --enable-notification
```

`jobStatus` incluye `STARTED`, así que llega un mail al arrancar el build y otro al terminar.
Si solo querés el resultado, sacá `STARTED` del patrón.

### Desarmar las notificaciones de una rama

```bash
aws events remove-targets --rule "amplify-${APP}-${BR}-branch-notification" --ids "$BR"
aws events delete-rule   --name "amplify-${APP}-${BR}-branch-notification"
aws sns    delete-topic  --topic-arn "$ARN"
aws amplify update-branch --app-id "$APP" --branch-name "$BR" --no-enable-notification
```

> ⚠️ Borrar el topic **borra todas sus suscripciones**, no solo la tuya. Antes de borrarlo,
> listá los destinatarios (§1) y avisá a quién va a dejar de recibir avisos. Si alguna de esas
> personas tiene que seguir informada, suscribila al topic de la rama que ahora sirve el
> dominio — y tené en cuenta que va a recibir un mail de confirmación nuevo.

### Verificar (dos niveles, no confundirlos)

1. **La plomería publica.** Independiente del clic de confirmación:
   ```bash
   aws cloudwatch get-metric-statistics --namespace AWS/SNS \
     --metric-name NumberOfMessagesPublished \
     --dimensions Name=TopicName,Value="amplify-${APP}_${BR}" \
     --start-time <ISO> --end-time <ISO> --period 300 --statistics Sum
   ```
   Un datapoint tras un build prueba que la regla y la policy están bien. `[]` significa que
   EventBridge no publicó: revisá el patrón y la statement de `events.amazonaws.com`.
2. **El mail llega.** Solo después de que la persona confirme la suscripción. Recién entonces
   disparás un build de prueba con `start-job` (§6) y confirmás la recepción.

**No hagas el build de prueba antes de la confirmación:** SNS descarta el mensaje para una
suscripción pendiente, así que gastás el build sin poder concluir nada. La regla se aplica
también al revés: una regla creada **después** de que un build terminó no ve ese evento; hace
falta un build nuevo.
