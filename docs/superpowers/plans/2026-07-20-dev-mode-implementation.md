# Dev-Mode Conditional Rendering Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a dev-mode query-param toggle that conditionally renders image placeholder suggestions in `sobre-nosotros.astro`, with extensible infrastructure for future dev features.

**Architecture:** Create a centralized utility module (`src/utils/devMode.ts`) that checks for `?dev-mode=true` in the URL, then integrate it into the page by wrapping three placeholder divs with conditional Astro rendering. The utility is designed to scale — additional dev helpers can be added to the same module without scattering logic.

**Tech Stack:** Astro, TypeScript, URL API (built-in)

## Global Constraints

- Dev-mode activated via URL query parameter only (`?dev-mode=true`)
- No localStorage or cookie persistence
- Placeholders completely removed from DOM when dev-mode is OFF
- General pattern that extends to future dev features

---

### Task 1: Create Dev-Mode Utility Module

**Files:**
- Create: `src/utils/devMode.ts`

**Interfaces:**
- Produces: `isDevMode(url: URL): boolean` — Returns true if `dev-mode=true` in query params

- [ ] **Step 1: Create the utility file with the isDevMode function**

```typescript
export function isDevMode(url: URL): boolean {
  return url.searchParams.get('dev-mode') === 'true'
}
```

- [ ] **Step 2: Verify the file is created**

Run: `ls -la src/utils/devMode.ts`
Expected: File exists with correct content

- [ ] **Step 3: Commit**

```bash
git add src/utils/devMode.ts
git commit -m "feat: create dev-mode utility for conditional rendering"
```

---

### Task 2: Integrate Dev-Mode into sobre-nosotros.astro

**Files:**
- Modify: `src/pages/sobre-nosotros.astro` (lines 1-4 for imports, 37-44, 62-69, 80-87 for placeholders)

**Interfaces:**
- Consumes: `isDevMode(url: URL): boolean` from `src/utils/devMode.ts`

- [ ] **Step 1: Import the isDevMode utility at the top of the script section**

Read the current frontmatter, then add:

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import CTASection from '../components/CTASection.astro';
import { isDevMode } from '../utils/devMode';

const showDevPlaceholders = isDevMode(Astro.url);
---
```

- [ ] **Step 2: Verify imports and variable are in place**

Read `src/pages/sobre-nosotros.astro` lines 1-10, confirm `isDevMode` is imported and `showDevPlaceholders` is defined

- [ ] **Step 3: Wrap the first placeholder (EL ORIGEN) with conditional rendering**

Find the comment `<!-- SUGERENCIA DE IMAGEN/VÍDEO 1 -->` at line 37. Replace lines 37-44:

```astro
      {showDevPlaceholders && (
        <>
          <!-- SUGERENCIA DE IMAGEN/VÍDEO 1 -->
          <div class="image-placeholder">
            <p class="placeholder-title">📸 RECOMENDACIÓN VISUAL: EL ORIGEN</p>
            <p>
              Ideal para: El vídeo de Sergio contando la historia, o en su defecto, una fotografía antigua de los inicios, 
              de los hermanos Doñaque, o un bodegón clásico y emotivo de la Cheesecake original estilo New York.
            </p>
          </div>
        </>
      )}
```

- [ ] **Step 4: Verify first placeholder is wrapped**

Read `src/pages/sobre-nosotros.astro` lines 37-45, confirm the div is wrapped and `showDevPlaceholders` guard is in place

- [ ] **Step 5: Wrap the second placeholder (LA MAESTRÍA DEL PAN)**

Read `src/pages/sobre-nosotros.astro` around line 62 to find `<!-- SUGERENCIA DE IMAGEN 2 -->`. Wrap lines 62-69:

```astro
      {showDevPlaceholders && (
        <>
          <!-- SUGERENCIA DE IMAGEN 2 -->
          <div class="image-placeholder">
            <p class="placeholder-title">🍞 RECOMENDACIÓN VISUAL: LA MAESTRÍA DEL PAN</p>
            <p>
              Ideal para: Una cuadrícula o foto de alta calidad que muestre la variedad de panes (el Pumpernickel oscuro, las Baguettes crujientes, 
              los panes integrales), resaltando la textura, los cortes artesanales y la calidad de la producción.
            </p>
          </div>
        </>
      )}
```

- [ ] **Step 6: Verify second placeholder is wrapped**

Read `src/pages/sobre-nosotros.astro` around line 62-72, confirm the div is wrapped

- [ ] **Step 7: Wrap the third placeholder (SELLO DE CALIDAD)**

Read `src/pages/sobre-nosotros.astro` around line 80 to find `<!-- SUGERENCIA DE IMAGEN 3 -->`. Wrap lines 80-87:

```astro
      {showDevPlaceholders && (
        <>
          <!-- SUGERENCIA DE IMAGEN 3 -->
          <div class="image-placeholder">
            <p class="placeholder-title">🛡️ RECOMENDACIÓN VISUAL: SELLO DE CALIDAD</p>
            <p>
              Ideal para: Un plano detalle de un pan siendo rebanado en un ambiente familiar/cálido, o una composición limpia 
              donde se visualice discretamente el sello decorativo de "Certificado Kosher Parve" y "Alimentos Premium".
            </p>
          </div>
        </>
      )}
```

- [ ] **Step 8: Verify third placeholder is wrapped**

Read `src/pages/sobre-nosotros.astro` around line 80-90, confirm the div is wrapped

- [ ] **Step 9: Verify all changes are syntactically correct**

Run: `npm run build` (or your project's type-check command)
Expected: No TypeScript or build errors

- [ ] **Step 10: Commit**

```bash
git add src/pages/sobre-nosotros.astro
git commit -m "feat: conditionally render image placeholders based on dev-mode query param"
```

---

### Task 3: Manual Testing

**Files:**
- Test: `src/pages/sobre-nosotros.astro` (browser testing, no files created)

- [ ] **Step 1: Start the development server**

Run: `npm run dev` (or your project's dev command)
Expected: Server starts, typically on `http://localhost:3000` or `http://localhost:4321` for Astro

- [ ] **Step 2: Load the page without dev-mode**

Navigate to: `http://localhost:YOUR_PORT/sobre-nosotros/`
Expected: No image placeholder divs visible; page content displays without the yellow/gold placeholder boxes

- [ ] **Step 3: Load the page with dev-mode enabled**

Navigate to: `http://localhost:YOUR_PORT/sobre-nosotros/?dev-mode=true`
Expected: Three image placeholder divs are visible (📸 EL ORIGEN, 🍞 LA MAESTRÍA DEL PAN, 🛡️ SELLO DE CALIDAD)

- [ ] **Step 4: Verify dev-mode with other query params**

Navigate to: `http://localhost:YOUR_PORT/sobre-nosotros/?foo=bar&dev-mode=true`
Expected: Placeholders still visible (order doesn't matter)

- [ ] **Step 5: Verify dev-mode is case-sensitive**

Navigate to: `http://localhost:YOUR_PORT/sobre-nosotros/?dev-mode=True`
Expected: Placeholders NOT visible (must be lowercase `true`)

- [ ] **Step 6: Verify other page sections unaffected**

Scroll entire page with and without dev-mode.
Expected: All content (text, CTA section, styles) identical; only placeholders differ

- [ ] **Step 7: Document testing results**

Note: Testing is manual in-browser. If the project has e2e tests, add tests for:
- `/sobre-nosotros/` has no `.image-placeholder` elements
- `/sobre-nosotros/?dev-mode=true` has 3 `.image-placeholder` elements

---

## Self-Review Checklist

✓ **Spec coverage:** 
- Dev-mode via query param only → Task 1 (utility) + Task 2 (integration)
- Placeholders removed from DOM when OFF → Task 2, Step 3-8 use conditional rendering
- General pattern for future features → `devMode.ts` is open-ended, comments suggest extensibility
- All three placeholders wrapped → Task 2, Steps 3/5/7

✓ **Placeholder scan:**
- No "TBD", "TODO", incomplete sections
- All code shown in full
- Exact file paths and line numbers provided
- Testing commands specified

✓ **Type consistency:**
- `isDevMode` function signature: `isDevMode(url: URL): boolean` — used consistently
- Variable name: `showDevPlaceholders` — used consistently in all three wraps
- No naming conflicts

✓ **No silent truncations:**
- All three placeholders explicitly wrapped (Steps 3, 5, 7)
- Commit messages clear

---

## Plan complete and saved to `docs/superpowers/plans/2026-07-20-dev-mode-implementation.md`

Two execution options:

**1. Subagent-Driven (recommended)** — I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** — Execute tasks in this session using executing-plans, batch execution with checkpoints

Which approach?
