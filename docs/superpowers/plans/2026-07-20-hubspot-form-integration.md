# HubSpot Form Embed Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace custom form with HubSpot embed on `/solicitar-llamada` page, keeping site styling via CSS overrides.

**Architecture:** Component wraps HubSpot's embed script + container div. Env vars supply portal/form IDs. Global CSS targets HubSpot's standard form classes (`.hs-input`, `.hs-button`, etc.) to override colors/focus states. Old form infrastructure (LeadForm, formConfig, validation, API endpoint) removed.

**Tech Stack:** Astro (static site), HubSpot Forms embed API, CSS custom properties

## Global Constraints

- Portal ID and Form ID from environment variables (`PUBLIC_HUBSPOT_PORTAL_ID`, `PUBLIC_HUBSPOT_FORM_ID`)
- Design system: cream (#fdfbf7), charcoal (#2c2a29), gold accent (#b08d57)
- CSS-only styling override (no JS manipulation of HubSpot DOM)
- Static site — no backend form handling needed

---

### Task 1: Add HubSpot env vars to `.env.example`

**Files:**
- Modify: `.env.example`

**Interfaces:**
- Consumes: nothing
- Produces: `PUBLIC_HUBSPOT_PORTAL_ID` and `PUBLIC_HUBSPOT_FORM_ID` env var documentation

- [ ] **Step 1: Open `.env.example` and add HubSpot variables**

```bash
# Add these lines after the Google Forms section:

# --- HubSpot Forms ---
PUBLIC_HUBSPOT_PORTAL_ID=
PUBLIC_HUBSPOT_FORM_ID=
```

- [ ] **Step 2: Commit**

```bash
git add .env.example
git commit -m "config: add HubSpot env variables to .env.example"
```

---

### Task 2: Create `HubSpotForm.astro` component

**Files:**
- Create: `src/components/HubSpotForm.astro`

**Interfaces:**
- Consumes: `PUBLIC_HUBSPOT_PORTAL_ID` and `PUBLIC_HUBSPOT_FORM_ID` from env
- Produces: `<HubSpotForm />` component that renders HubSpot embed script + container

- [ ] **Step 1: Create the component file**

```bash
touch /Users/eugenio/repos/new-york-venezuela/web/src/components/HubSpotForm.astro
```

- [ ] **Step 2: Write the component**

```astro
---
const portalId = import.meta.env.PUBLIC_HUBSPOT_PORTAL_ID as string;
const formId = import.meta.env.PUBLIC_HUBSPOT_FORM_ID as string;

if (!portalId || !formId) {
  throw new Error('HubSpot Portal ID and Form ID are required. Check PUBLIC_HUBSPOT_PORTAL_ID and PUBLIC_HUBSPOT_FORM_ID in .env');
}
---

<div class="hubspot-form-wrapper">
  <div id="hubspot-form-container"></div>
</div>

<script define:vars={{ portalId, formId }}>
  // Load HubSpot embed script if not already loaded
  if (!window.hbspt) {
    const script = document.createElement('script');
    script.src = 'https://js.hsforms.net/forms/embed/v2.js';
    script.async = true;
    script.onload = () => {
      if (window.hbspt) {
        window.hbspt.forms.create({
          region: 'na1',
          portalId: portalId,
          formId: formId,
          target: '#hubspot-form-container'
        });
      }
    };
    document.body.appendChild(script);
  }
</script>

<style>
  .hubspot-form-wrapper {
    width: 100%;
  }
</style>
```

- [ ] **Step 3: Commit**

```bash
git add src/components/HubSpotForm.astro
git commit -m "feat: create HubSpotForm component with embed script"
```

---

### Task 3: Update `/solicitar-llamada.astro` to use HubSpotForm

**Files:**
- Modify: `src/pages/solicitar-llamada.astro`

**Interfaces:**
- Consumes: `HubSpotForm` component from Task 2
- Produces: updated page that embeds HubSpot form instead of custom LeadForm

- [ ] **Step 1: Open `solicitar-llamada.astro` and replace import**

Read current file to see exact line numbers.

- [ ] **Step 2: Replace the LeadForm import with HubSpotForm**

Change:
```astro
import LeadForm from '../components/LeadForm.astro';
```

To:
```astro
import HubSpotForm from '../components/HubSpotForm.astro';
```

- [ ] **Step 3: Replace the LeadForm component usage with HubSpotForm**

Find the line where `<LeadForm />` is rendered and replace with `<HubSpotForm />`. (Exact line number will be visible in the file.)

- [ ] **Step 4: Remove the success message prop and related comments**

Remove any JSDoc or comments about success query params (HubSpot handles its own submission flow).

- [ ] **Step 5: Commit**

```bash
git add src/pages/solicitar-llamada.astro
git commit -m "refactor: replace LeadForm with HubSpotForm component"
```

---

### Task 4: Add HubSpot CSS overrides to global styles

**Files:**
- Modify: `src/styles/global.css`

**Interfaces:**
- Consumes: design system vars already in global.css (--color-cream, --color-charcoal, --color-accent, --color-border)
- Produces: CSS rules targeting HubSpot form classes

- [ ] **Step 1: Open global.css and add HubSpot form styling section at the end**

Append this block before the media query section (after the visually-hidden class):

```css
/* --- HubSpot Forms --- */

.hs-form {
  width: 100%;
}

.hs-form .hs-fieldtype-text input,
.hs-form .hs-fieldtype-email input,
.hs-form .hs-fieldtype-tel input,
.hs-form .hs-fieldtype-textarea textarea,
.hs-form .hs-fieldtype-select select,
.hs-form input.hs-input,
.hs-form textarea.hs-input,
.hs-form select.hs-input {
  padding: 0.875rem 1rem;
  border: 1px solid var(--color-border);
  background-color: var(--color-cream);
  color: var(--color-charcoal);
  font-family: var(--font-body);
  font-size: 1rem;
  border-radius: 0;
  appearance: none;
}

.hs-form input.hs-input:focus,
.hs-form textarea.hs-input:focus,
.hs-form select.hs-input:focus {
  outline: 2px solid var(--color-charcoal);
  outline-offset: 1px;
  border-color: var(--color-charcoal);
}

.hs-form .hs-button {
  padding: 0.875rem 2.25rem;
  border: 1px solid var(--color-charcoal);
  background-color: var(--color-charcoal);
  color: var(--color-cream);
  font-family: var(--font-body);
  font-size: 0.875rem;
  font-weight: 500;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  cursor: pointer;
  transition: background-color 0.25s ease, color 0.25s ease;
  border-radius: 0;
}

.hs-form .hs-button:hover {
  background-color: var(--color-charcoal-soft);
}

.hs-form .hs-fieldtype-select select {
  background-image: url('data:image/svg+xml;charset=UTF-8,%3Csvg xmlns="http://www.w3.org/2000/svg" width="12" height="8" viewBox="0 0 12 8"%3E%3Cpath fill="%232c2a29" d="M1 1l5 5 5-5"/%3E%3C/svg%3E');
  background-repeat: no-repeat;
  background-position: right 1rem center;
  padding-right: 2.5rem;
}

.hs-form .hs-label {
  font-size: 0.9375rem;
  font-weight: 500;
}

.hs-form .hs-error-msgs {
  color: #d9534f;
  font-size: 0.875rem;
}

.hs-form .hs-richtext {
  font-size: 0.9375rem;
  line-height: 1.6;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/styles/global.css
git commit -m "style: add HubSpot form CSS overrides for design consistency"
```

---

### Task 5: Delete old form infrastructure files

**Files:**
- Delete: `src/components/LeadForm.astro`
- Delete: `src/data/formConfig.ts`
- Delete: `src/utils/formValidation.ts`
- Delete: `src/utils/formValidation.manual-test.ts`
- Delete: `src/pages/api/submit-lead.ts` (if exists)
- Check: `src/scripts/google-form.ts` (delete only if confirmed unused)

**Interfaces:**
- Consumes: nothing
- Produces: cleaner codebase with removed form files

- [ ] **Step 1: Check if `/api/submit-lead.ts` exists**

```bash
ls -la /Users/eugenio/repos/new-york-venezuela/web/src/pages/api/
```

- [ ] **Step 2: Delete LeadForm component**

```bash
rm /Users/eugenio/repos/new-york-venezuela/web/src/components/LeadForm.astro
```

- [ ] **Step 3: Delete formConfig**

```bash
rm /Users/eugenio/repos/new-york-venezuela/web/src/data/formConfig.ts
```

- [ ] **Step 4: Delete form validation files**

```bash
rm /Users/eugenio/repos/new-york-venezuela/web/src/utils/formValidation.ts
rm /Users/eugenio/repos/new-york-venezuela/web/src/utils/formValidation.manual-test.ts
```

- [ ] **Step 5: Delete API endpoint (if it exists)**

```bash
# Check first
ls -la /Users/eugenio/repos/new-york-venezuela/web/src/pages/api/submit-lead.ts 2>/dev/null && rm /Users/eugenio/repos/new-york-venezuela/web/src/pages/api/submit-lead.ts || echo "File doesn't exist"
```

- [ ] **Step 6: Check google-form.ts for usage**

```bash
grep -r "google-form" /Users/eugenio/repos/new-york-venezuela/web/src --include="*.astro" --include="*.ts" --include="*.tsx"
```

If no results, delete it. If results exist, keep it.

- [ ] **Step 7: Commit deletions**

```bash
git add -A
git commit -m "refactor: remove old form infrastructure (LeadForm, formConfig, validation, API endpoint)"
```

---

### Task 6: Test the HubSpot embed in browser

**Files:**
- None (testing only)

**Interfaces:**
- Consumes: completed Tasks 1-5
- Produces: verified working HubSpot form on `/solicitar-llamada`

- [ ] **Step 1: Build the site**

```bash
cd /Users/eugenio/repos/new-york-venezuela/web
npm run build
```

- [ ] **Step 2: Start dev server**

```bash
npm run dev
```

- [ ] **Step 3: Navigate to `/solicitar-llamada` in browser**

Open `http://localhost:3000/solicitar-llamada` (or whatever port the dev server uses).

- [ ] **Step 4: Verify HubSpot form appears**

- Form should render with cream background, charcoal text
- Inputs should have cream background, charcoal border
- Submit button should be charcoal with cream text
- Focus states should show charcoal outline
- No console errors about missing env vars

- [ ] **Step 5: Test form interaction (optional)**

- Click inputs and verify focus state works
- Try selecting a dropdown (if form has one)
- Verify styling is applied

- [ ] **Step 6: If all works, no commit needed**

(This is verification, not code change.)

---
