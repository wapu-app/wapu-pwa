# Skill: Configurar y deployar en AWS Amplify (WapuPay frontend)

Guía operativa para gestionar los hostings de Amplify del frontend **sin re-explorar**.
Cubre: identificar apps, inspeccionar config, **repointear una app a otro repo**, disparar
builds, monitorearlos, leer logs de fallo, y los **gotchas** conocidos.

> Escrita a partir de un repoint real de `staging.wapu.app` desde el repo `survivors`
> (monorepo) al repo `wapu-pwa` (flat), con auto-deploy funcionando end-to-end.

---

## 0. Datos fijos del entorno

- **Región:** `sa-east-1` (todas las apps viven acá; las otras regiones están vacías).
- **Cuenta AWS:** `****190145`.
- **Perfiles AWS CLI:**
  - `claude-mcp-readonly` → para inspección (get/list). Usar por defecto.
  - `claude-mcp-infra` → para mutaciones (update-app, start-job). Usar solo al escribir.
- **Token GitHub:** disponible vía `$(gh auth token)` (scope `repo`, alcanza para
  crear webhooks). **Nunca** imprimir el token; pasarlo siempre por command substitution.

### Apps Amplify (a julio 2026)

| App | `appId` | Rama | Dominio | Repo origen |
|-----|---------|------|---------|-------------|
| `qa.wapu.app` | `d18uhpruqe7n23` | `qa` | qa.wapu.app | `wapu-app/survivors` |
| `staging.wapu.app` | `d1lgqpvaq2avf` | `staging` | staging.wapu.app | `wapu-app/wapu-pwa` (repointeada) |
| `my.wapu.app` (prod) | `dp0d93u99g05p` | `main` | my.wapu.app | `wapu-app/survivors` |

Todas son `platform: WEB_COMPUTE` (Next.js SSR).

Flujo de deploy: push a la rama trackeada → webhook → build automático → deploy.
Prod deploya vía merges `staging → main` (release-based, cadencia baja);
staging deploya vía merges `develop → staging` (cadencia alta).

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

**Precedencia:** el buildSpec **inline** guardado en la app **pisa** el `amplify.yml` del repo.
Por eso, al cambiar de un repo monorepo a uno flat hay que **reescribir el buildSpec inline**
(o alinearlo con el `amplify.yml` del repo nuevo) — no alcanza con cambiar el repo.

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
aws amplify get-branch $P --app-id <APP_ID> --branch-name <BRANCH> --query 'branch.{autoBuild:enableAutoBuild}'
gh api repos/wapu-app/<REPO>/hooks --jq '.[] | {url: .config.url, events, active}'   # webhook de auto-deploy
gh api repos/wapu-app/<REPO>/keys  --jq '.[] | {title, read_only}'                    # deploy key (si clone=SSH)
```

---

## 4. Disparar y monitorear un build

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

### Confirmar deploy activo + sitio arriba

```bash
aws amplify get-branch $P --app-id <APP_ID> --branch-name <BRANCH> --query 'branch.activeJobId'
curl -s -o /dev/null -w "status=%{http_code}\n" -L --max-time 25 https://<domain>
```

> Un `status=000` (curl exit 56) justo tras el deploy suele ser un cold-start transitorio
> del SSR; reintentar antes de asumir que falló.

---

## 5. Gotchas conocidos

- **zsh glob con `?`:** las URLs de `gh api ...?ref=...` deben ir **entre comillas**, o zsh
  tira `no matches found`.
- **buildSpec inline pisa el del repo:** al migrar entre repos con estructura distinta
  (monorepo ↔ flat) hay que reescribir el buildSpec inline. Ver §2.
- **Bug `config/environment/current/` en `wapu-pwa`:** el `.gitignore` ignora el archivo
  `config/environment/current/index.js`, y como es el único archivo de ese dir, **el
  directorio no se trackea** → en un clone limpio no existe. El script
  `scripts/set_environment.sh` hace `cp ... config/environment/current/index.js` y falla
  (`cp: No such file or directory`), luego `next.config.js` hace `readFileSync` de ese path
  → **ENOENT y build roto**. En `survivors` no pasaba porque ahí el `index.js` está
  committeado (force-added). **Fix aplicado:** agregar `mkdir -p config/environment/current`
  antes del `cp` en `set_environment.sh` (commit `b7bc3bc` en `wapu-pwa/staging`).
  **Pendiente:** propagar ese fix al resto de ramas de `wapu-pwa` (`main`, `qa`, `develop`)
  o cualquier build limpio de ellas romperá igual.
- **`start-job` con job ya numerado:** los `jobId` continúan la numeración de la app; no se
  reinician al cambiar de repo.
```
