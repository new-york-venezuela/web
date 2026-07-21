# Dev-Mode Conditional Rendering

**Date:** 2026-07-20  
**Scope:** Add query-param-based dev-mode toggle to conditionally show/hide placeholder content  
**Status:** Approved

## Overview

Implement a general-purpose dev-mode pattern that starts by conditionally rendering image/video placeholder suggestions in `src/pages/sobre-nosotros.astro`. When `?dev-mode=true` is present in the URL, placeholders display; otherwise they are removed from the DOM entirely.

## Requirements

- Dev-mode activated via URL query parameter only (`?dev-mode=true`)
- No persistence (localStorage, cookies) — per-request only
- Placeholder divs completely removed from DOM when dev-mode is OFF
- General pattern that can extend to other dev features in the future

## Architecture

### 1. Utility Function: `src/utils/devMode.ts`

```typescript
export function isDevMode(url: URL): boolean {
  return url.searchParams.get('dev-mode') === 'true'
}
```

**Purpose:** Centralized dev-mode check, extensible for future dev helpers  
**Input:** `Astro.url` (from page context)  
**Output:** `boolean`  
**Usage:** Called from pages/components that need dev-specific rendering

### 2. Integration: `src/pages/sobre-nosotros.astro`

**Changes:**
- Import `isDevMode` utility
- Call `isDevMode(Astro.url)` at the top of the component
- Wrap three `.image-placeholder` divs (lines ~37, ~62, ~80) with conditional rendering:
  ```astro
  {isDevMode && <div class="image-placeholder">...</div>}
  ```

**Placeholders affected:**
1. "📸 RECOMENDACIÓN VISUAL: EL ORIGEN" (origin/cheesecake section)
2. "🍞 RECOMENDACIÓN VISUAL: LA MAESTRÍA DEL PAN" (bread mastery section)
3. "🛡️ RECOMENDACIÓN VISUAL: SELLO DE CALIDAD" (quality seal section)

## Behavior

| State | URL Example | Result |
|-------|-------------|--------|
| Dev OFF (default) | `/sobre-nosotros/` | Placeholders hidden, DOM clean |
| Dev ON | `/sobre-nosotros/?dev-mode=true` | Placeholders visible |
| Dev ON (other params) | `/sobre-nosotros/?foo=bar&dev-mode=true` | Placeholders visible |

## Future Extensibility

As more dev features are needed, add helpers to `devMode.ts`:

```typescript
export function isDevMode(url: URL): boolean { ... }
export function getDevFeatures(url: URL): Set<string> { ... }
export function logDebugInfo(message: string, data?: any): void { ... }
```

All dev utilities remain centralized and easy to discover.

## Testing

- Load `/sobre-nosotros/` → confirm placeholders absent
- Load `/sobre-nosotros/?dev-mode=true` → confirm placeholders visible
- Verify other page features unaffected
