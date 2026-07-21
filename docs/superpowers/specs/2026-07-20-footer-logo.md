# Footer Logo Implementation

**Date:** 2026-07-20  
**Status:** Approved

## Overview

Add the classic logo to the footer, positioned below the navigation links (Catálogo, Nosotros, Contacto) in the right column of the footer layout.

## Placement & Layout

- Logo placed below nav links in the right footer column
- Maintains existing flex layout structure (left: brand/contact info, right: nav + logo)
- On wrapped/mobile layouts, logo stays grouped with nav (right-justified)

## Logo Specifications

| Property | Value |
|----------|-------|
| Image file | `/public/logos/classic.png` |
| Size | ~120-150px width |
| Aspect ratio | Maintained (auto height) |
| Link behavior | None (static image) |
| Alt text | "New York Alimentos Premium" |

## Implementation Details

**Component changes:**
- Add `<img>` element after the nav `<ul>` in Footer.astro
- Create new CSS class `.site-footer__logo` for sizing and spacing
- Add margin-top to create visual separation from nav links

**Styling:**
- Width: 120-150px (will auto-scale height)
- Margin-top: space-m or space-s for breathing room
- No additional styling needed (inherit from footer context)

## Testing

- Verify logo displays at correct size on desktop
- Verify logo wraps/aligns properly on mobile
- Confirm no visual regression in footer layout
