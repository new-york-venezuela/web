# GitHub Actions .env Generation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend the GitHub Actions deploy workflow to dynamically generate `.env` from repository/environment variables before the build step.

**Architecture:** Add a shell script step in the `build` job that validates mandatory vars exist, then writes only defined vars to `.env`. This keeps configuration out of code and git history while ensuring builds fail loudly if required config is missing.

**Tech Stack:** GitHub Actions Variables, shell script, YAML workflow.

## Global Constraints

- Only use GitHub Actions **Variables** (not Secrets) for configuration
- Mandatory vars: `PUBLIC_HUBSPOT_PORTAL_ID`, `PUBLIC_HUBSPOT_FORM_ID`, `PUBLIC_WHATSAPP_NUMBER`, `PUBLIC_CONTACT_EMAIL`, `PUBLIC_POSTHOG_KEY`, `PUBLIC_POSTHOG_HOST`
- Optional vars: `PUBLIC_POSTHOG_HOST`, `PUBLIC_GOOGLE_FORM_ID`, `PUBLIC_GFORM_ENTRY_NOMBRE`, `PUBLIC_GFORM_ENTRY_TELEFONO`, `PUBLIC_GFORM_ENTRY_PRODUCTO`, `PUBLIC_GFORM_ENTRY_MENSAJE`, `PUBLIC_HUBSPOT_PORTAL_ID`, `PUBLIC_HUBSPOT_FORM_ID`
- Build must fail if any mandatory var is missing
- Only write defined vars to `.env`; skip undefined optional ones
- Vars must be scoped to `github-pages` environment (used at deploy time)

---

## Task 1: Add .env generation step to build job

**Files:**
- Modify: `.github/workflows/deploy.yml:19-30`

**Interfaces:**
- Consumes: GitHub Actions Variables from `github-pages` environment
- Produces: `.env` file with mandatory and optional vars

**Steps:**

- [ ] **Step 1: Add shell step before `bun install` in build job**

Insert this step after `actions/checkout@v4` and before `oven-sh/setup-bun@v2`:

```yaml
      - name: Generate .env from GitHub Actions vars
        run: |
          # Mandatory vars
          MANDATORY_VARS=(
            "PUBLIC_HUBSPOT_PORTAL_ID"
            "PUBLIC_HUBSPOT_FORM_ID"
            "PUBLIC_WHATSAPP_NUMBER"
            "PUBLIC_CONTACT_EMAIL"
            "PUBLIC_POSTHOG_KEY"
            "PUBLIC_POSTHOG_HOST"
          )
          
          # Check all mandatory vars are set
          for var in "${MANDATORY_VARS[@]}"; do
            if [ -z "${!var}" ]; then
              echo "ERROR: Required variable $var is not set"
              exit 1
            fi
          done
          
          # Optional vars (only write if defined)
          OPTIONAL_VARS=(
            "PUBLIC_GOOGLE_FORM_ID"
            "PUBLIC_GFORM_ENTRY_NOMBRE"
            "PUBLIC_GFORM_ENTRY_TELEFONO"
            "PUBLIC_GFORM_ENTRY_PRODUCTO"
            "PUBLIC_GFORM_ENTRY_MENSAJE"
          )
          
          # Start .env file
          {
            # Write all mandatory vars
            for var in "${MANDATORY_VARS[@]}"; do
              echo "$var=${!var}"
            done
            
            # Write optional vars only if defined
            for var in "${OPTIONAL_VARS[@]}"; do
              if [ -n "${!var}" ]; then
                echo "$var=${!var}"
              fi
            done
            
            # Add SITE_URL (already hardcoded below in build step)
            echo "SITE_URL=https://www.alimentosnewyork.com"
          } > .env
          
          echo ".env generated successfully"
        env:
          PUBLIC_HUBSPOT_PORTAL_ID: ${{ vars.PUBLIC_HUBSPOT_PORTAL_ID }}
          PUBLIC_HUBSPOT_FORM_ID: ${{ vars.PUBLIC_HUBSPOT_FORM_ID }}
          PUBLIC_WHATSAPP_NUMBER: ${{ vars.PUBLIC_WHATSAPP_NUMBER }}
          PUBLIC_CONTACT_EMAIL: ${{ vars.PUBLIC_CONTACT_EMAIL }}
          PUBLIC_POSTHOG_KEY: ${{ vars.PUBLIC_POSTHOG_KEY }}
          PUBLIC_POSTHOG_HOST: ${{ vars.PUBLIC_POSTHOG_HOST }}
          PUBLIC_GOOGLE_FORM_ID: ${{ vars.PUBLIC_GOOGLE_FORM_ID }}
          PUBLIC_GFORM_ENTRY_NOMBRE: ${{ vars.PUBLIC_GFORM_ENTRY_NOMBRE }}
          PUBLIC_GFORM_ENTRY_TELEFONO: ${{ vars.PUBLIC_GFORM_ENTRY_TELEFONO }}
          PUBLIC_GFORM_ENTRY_PRODUCTO: ${{ vars.PUBLIC_GFORM_ENTRY_PRODUCTO }}
          PUBLIC_GFORM_ENTRY_MENSAJE: ${{ vars.PUBLIC_GFORM_ENTRY_MENSAJE }}
```

- [ ] **Step 2: Remove SITE_URL from existing build step**

Modify the `bun run build` step (line 29–31) to remove the `env:` block:

**Before:**
```yaml
      - run: bun run build
        env:
          SITE_URL: https://www.alimentosnewyork.com
```

**After:**
```yaml
      - run: bun run build
```

(The `SITE_URL` is now in `.env` from the generation step.)

- [ ] **Step 3: Commit workflow changes**

```bash
git add .github/workflows/deploy.yml
git commit -m "feat: generate .env from GitHub Actions vars in deploy workflow"
```

---

## Task 2: Document required GitHub Actions Variables setup

**Files:**
- Modify: `INSTRUCTIONS.md` (add section on CI setup)

**Interfaces:**
- Consumes: Workflow definition from Task 1
- Produces: Documentation for operators setting up the workflow

**Steps:**

- [ ] **Step 1: Add CI setup section to INSTRUCTIONS.md**

Add this section after section "6. Adaptar el sitio a otro cliente" and before "7. Imágenes":

```markdown
## 6.5 Configuración de CI/CD con GitHub Actions

El workflow de deploy automático genera `.env` desde **GitHub Actions Variables**
asignadas al entorno `github-pages`. No se requieren Secrets — todas las variables
son públicas (IDs de formulario, teléfono, correo).

### Variables requeridas

Crear estas variables en **Settings → Environments → github-pages → Environment
variables**:

| Variable | Ejemplo | Descripción |
| --- | --- | --- |
| `PUBLIC_HUBSPOT_PORTAL_ID` | `27123456` | ID de portal HubSpot |
| `PUBLIC_HUBSPOT_FORM_ID` | `a1b2c3d4-e5f6-789g` | ID del formulario HubSpot |
| `PUBLIC_WHATSAPP_NUMBER` | `584120000000` | Número WhatsApp sin `+` |
| `PUBLIC_CONTACT_EMAIL` | `hola@example.com` | Correo de contacto |
| `PUBLIC_POSTHOG_KEY` | `phc_XXXXX` | Clave del proyecto PostHog |
| `PUBLIC_POSTHOG_HOST` | `https://us.i.posthog.com` | Host de PostHog |

### Variables opcionales

Crear en el mismo lugar si se usan:

| Variable | Ejemplo | Descripción |
| --- | --- | --- |
| `PUBLIC_GOOGLE_FORM_ID` | `1FAIpQL...` | ID del Google Form |
| `PUBLIC_GFORM_ENTRY_NOMBRE` | `1234567890` | ID campo nombre |
| `PUBLIC_GFORM_ENTRY_TELEFONO` | `1234567891` | ID campo teléfono |
| `PUBLIC_GFORM_ENTRY_PRODUCTO` | `1234567892` | ID campo producto |
| `PUBLIC_GFORM_ENTRY_MENSAJE` | `1234567893` | ID campo mensaje |

El workflow falla si falta alguna variable requerida. Las variables opcionales
se omiten de `.env` si no están definidas.
```

- [ ] **Step 2: Commit documentation**

```bash
git add INSTRUCTIONS.md
git commit -m "docs: add GitHub Actions Variables setup guide"
```

---

## Self-Review

1. **Spec coverage:** ✓ Generates .env from vars before build, ✓ validates mandatory vars, ✓ skips undefined optional ones, ✓ uses github-pages environment, ✓ documents setup
2. **Placeholder scan:** None found
3. **Type consistency:** Var names match `.env.example` exactly
4. **Gaps:** None

Plan complete and saved to `docs/superpowers/plans/2026-07-20-github-actions-env-generation.md`.

**Two execution options:**

**1. Subagent-Driven (recommended)** — Fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** — Execute tasks in this session using executing-plans

Which approach?
