# Task 6: Add CTA to Catalog Page — COMPLETED

**Status:** COMPLETED

## Changes Applied

### 1. Added CTASection import
- **File:** `src/pages/catalogo.astro`
- **Line 4:** Added `import CTASection from '../components/CTASection.astro';`

### 2. Replaced final section
- **File:** `src/pages/catalogo.astro`
- **Lines 59-75:** Replaced the old "¿Listo para ordenar?" section with:
  - **CTASection component** with variant="secondary" (cream background)
    - Title: "Consulta precios y disponibilidad"
    - Description: Custom message about 24-hour callback with personalized quotes
    - CTA Text: "Solicitar Información de Precios"
  - **Secondary "Otras preguntas" section** for additional contact queries
    - Simplified button text to "Ir a Contacto"

## Result
- CTASection now appears before the footer with cream background variant
- Secondary section provides alternative contact path for specific questions
- Maintains existing styling and responsive behavior
- All imports and component usage properly configured

## Files Modified
- `/Users/eugenio/conductor/workspaces/web/islamabad/src/pages/catalogo.astro`

## Component Dependencies
- `src/components/CTASection.astro` - Already exists and functional
- CTASection supports variant prop for styling (primary/secondary)
