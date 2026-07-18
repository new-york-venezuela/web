# Product Image Carousel Design

**Date:** 2026-07-18  
**Status:** Approved  
**Scope:** Add multi-image carousel support to catalog cards and product detail pages

---

## Overview

Currently, products display only a single image. This spec adds support for multiple images per product (e.g., product photo + package variant), with a carousel UI for browsing them. The carousel uses arrow navigation and appears on both catalog cards and the detail page.

---

## Data Structure

### Product JSON Schema Update

Add `imagenes` array to `Producto` type in `src/utils/loadProductos.ts`:

```typescript
imagenes?: string[];  // Array of image slugs (e.g., ["pan-4-granos", "pan-4-granos-paquete"])
```

**Rules:**
- `imagenes` is optional; if absent, fall back to single `imagen` field
- If `imagenes` is present, it should contain at least 1 slug (validated)
- Each slug maps to `/productos/{slug}.png`
- Order matters — first image is the "primary" shown in carousels

**In `productos.json`:**
```json
{
  "id": "pan-4-granos",
  "nombre": "Pan 4 Granos",
  "imagen": "pan-4-granos",
  "imagenes": ["pan-4-granos", "pan-4-granos-paquete"],
  ...
}
```

### Validation

- `imagenes` must be an array of strings
- Each string must be a valid image slug (no extension)
- Minimum 1 image; recommend max 4–5 (practical limit for product variants)

---

## Components

### ImageCarousel.astro (new)

**Purpose:** Reusable carousel component for displaying multiple product images.

**Props:**
```typescript
interface Props {
  imagenes: string[];
  alt: string;
  class?: string;
}
```

**Behavior:**
- Display current image in 5:4 aspect ratio (350×280px native, responsive)
- Arrow buttons (← →) to navigate between images
- Image counter below carousel ("1 / 3")
- Keyboard support: `ArrowLeft` / `ArrowRight` to navigate
- Reduced motion: disables transitions if `prefers-reduced-motion: reduce`

**Markup Structure:**
```html
<div class="carousel">
  <button class="carousel__button carousel__button--prev" aria-label="Previous image">
    ←
  </button>
  <div class="carousel__viewport">
    <img src={currentImage} alt={alt} />
  </div>
  <button class="carousel__button carousel__button--next" aria-label="Next image">
    →
  </button>
  <div class="carousel__counter">{currentIndex + 1} / {imagenes.length}</div>
</div>
```

**Styling:**
- Container uses `display: flex` with centered layout
- Image container: fixed 5:4 `aspect-ratio`, `overflow: hidden`
- Image uses `object-fit: cover` (no distortion, fills 5:4 box)
- Buttons: minimal, charcoal text, transparent bg, accent color on hover
- Counter: small text, centered, below carousel
- Mobile-first: buttons stack vertically below image on small screens; at desktop (`min-width: 40rem`), buttons flank the image horizontally
- Transitions: smooth fade or opacity change (0.2s), respects `prefers-reduced-motion`

**State:**
- Single `currentIndex` state (0-based), incremented/decremented by buttons
- Wraps around (last image → first, first → previous)

**No external dependencies** — vanilla JS only.

---

### ProductCard.astro (updated)

**Changes:**
- Check if product has `imagenes` array with >1 image
- If yes: render `<ImageCarousel imagenes={producto.imagenes} alt={...} />`
- If no: render single `<img>` (existing behavior)
- Media container: lock to 5:4 `aspect-ratio` (removes `aspect-ratio: 4 / 3`)
- Carousel inherits card styling (border, background)

**No layout shift** — carousel and single-image containers are the same size.

---

### Product Detail Page ([id].astro) (updated)

**Changes:**
- Replace single `<img src={imagenUrl} alt={...} />` with:
  ```astro
  <ImageCarousel imagenes={producto.imagenes || [producto.imagen]} alt={...} />
  ```
- Detail media container maintains 5:4 ratio
- Same carousel styling as cards, scaled up (wider container on desktop)

**Sticky positioning** — carousel can remain sticky while scrolling (existing `.detail-media` behavior unchanged).

---

## Image Dimensions & Responsive Behavior

**Native image size:** 350×280px (5:4 aspect ratio)

**Catalog cards:**
- Container width: fluid (grid `minmax(18rem, 1fr)`)
- Carousel height: `aspect-ratio: 5 / 4` — automatically scales with width
- Small screens: ~100% of card width (constrained by grid minimum 18rem)
- Large screens: scales proportionally

**Detail page:**
- Container width: ~50% on desktop (detail-grid: 2 columns), 100% on mobile
- Same 5:4 aspect ratio scaling

**Result:** Images never distort; aspect ratio is preserved at all screen sizes. No layout shift because container size is locked.

---

## Data Migration

Products that should have multiple images:
- Identify files ending in `-paquete.png` (package variants)
- Map to base product IDs
- Update `productos.json` to add `imagenes` array

Example:
```json
{
  "id": "pan-4-granos",
  "imagen": "pan-4-granos",
  "imagenes": ["pan-4-granos", "pan-4-granos-paquete"]
}
```

Products without variants keep single `imagen` field (backward compatible).

---

## Accessibility

- Buttons have `aria-label` ("Previous image", "Next image")
- Image alt text passed through (`alt` prop)
- Keyboard navigation (arrow keys)
- Reduced motion respected (no transitions)
- Counter text is semantic (not just visual indicator)

---

## Testing

- **Carousel navigation:** Verify prev/next buttons cycle through all images
- **Keyboard:** Arrow keys navigate (with browser focused on carousel)
- **Wrapping:** Last image → first, first → previous
- **Single image:** Products with one image still display correctly
- **Responsive:** Carousel scales properly from mobile (18rem) to desktop (full-width)
- **No shift:** Layout remains stable when switching images
- **Reduced motion:** Transitions are instant if `prefers-reduced-motion` is enabled

---

## Files to Modify

1. `src/utils/loadProductos.ts` — update `Producto` type, add validation
2. `src/components/ImageCarousel.astro` — new component
3. `src/components/ProductCard.astro` — integrate carousel
4. `src/pages/productos/[id].astro` — integrate carousel on detail page
5. `src/data/productos.json` — add `imagenes` arrays for products with variants

---

## Future Considerations

- Touch swipe support (not required for v1)
- Image lazy-loading optimization (images are already lazy in Astro)
- Analytics tracking (which images are viewed most)
