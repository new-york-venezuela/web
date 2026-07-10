# Mobile-first CSS + responsive image pipeline — Design

**Date:** 2026-07-09 · **Status:** approved

## Goal

Make the site explicitly mobile-first, and put image infrastructure + written
guidelines in place *before* product photos arrive, so any dev or AI agent adds
images correctly (right resolutions, right formats, right markup) on the first try.

## Context

- Astro ^5.12, `output: 'static'`, Bun-only, Spanish content (see `AGENTS.md`).
- No raster images exist yet; `ProductCard` renders a monogram placeholder.
- CSS is already fluid (`clamp()`, `auto-fit` grids) but has no mobile-first
  convention, desktop-scaled section padding, a cramped two-row header at
  ~360px, and sub-44px touch targets on nav links.
- Astro 5.10 stabilized responsive images: `<Image>`/`<Picture>` from
  `astro:assets` + `image.layout` config auto-generate `srcset`/`sizes` and
  webp/avif via sharp at build time.

## Decisions

1. **Image pipeline: built-in `astro:assets` only.** No third-party image
   tooling (astro-imagetools is redundant post-5.10), no image CDN (external
   service on a fully static site). Zero new dependencies.
2. **No JS hamburger menu.** Header stacks (brand row over nav row, centered)
   on small screens and becomes a single row from 40rem up. CSS-only, no JS.
3. **Mobile-first CSS convention:** base styles target mobile; enhancements use
   `min-width` media queries only. Shared breakpoints: `40rem` and `64rem`.

## Changes

### Config (`astro.config.mjs`)
- `image: { layout: 'constrained', responsiveStyles: true }` — every
  `<Image>` gets automatic `srcset`/`sizes` and responsive styles by default.

### Assets
- New `src/assets/productos/` directory for image originals (processed by the
  build; never served raw). `public/` stays reserved for favicon/OG images.
- Short Spanish README in `src/assets/` stating the drop-in conventions.

### Data layer (`src/data/catalogo.ts`)
- `Producto` gains optional `imagen?: ImageMetadata` and `imagenAlt?: string`
  (Spanish alt required whenever `imagen` is set). Products without a photo
  keep working — card falls back to the monogram.

### Components
- `ProductCard.astro`: renders `<Image>` (4:3, `object-fit: cover`, correct
  `sizes` for the card grid, lazy) when `producto.imagen` exists; monogram
  placeholder otherwise.
- `Header.astro`: mobile-first stacked→row layout; nav links get ≥44px touch
  targets; fits 320px viewports without wrapping mid-link.
- `Footer.astro`: touch-target padding on links.

### Global CSS (`src/styles/global.css`)
- `--space-l` / `--space-xl` become fluid (`clamp()`) so section rhythm
  compresses on small screens.
- Header comment documenting the mobile-first convention + breakpoints.

### Documentation
- `AGENTS.md`: new **Images** section (rules for agents): originals ≥1600px
  wide in `src/assets/`, JPEG/PNG source (build emits webp/avif), never
  hand-write `<img>` for content images, never put content images in
  `public/`, Spanish `alt` always, `width`/`height` always (CLS), `priority`
  for the LCP/hero image, lazy default below the fold, adjust `sizes` when the
  image is not full-width. Codebase map updated with `src/assets/`.
- `INSTRUCTIONS.md`: new Spanish **Imágenes** section for humans: export
  resolution per slot (product card 4:3 ≥1200×900; future hero ≥1920px wide),
  file naming, where to drop files, "the build resizes everything" note.
  Publish checklist gains an image item.

## Testing

`bun run check` (0 errors) and `bun run build` must pass. Manual: preview at
320/375/768/1280px widths — header single-column then row, no horizontal
scroll, touch targets comfortable.

## Out of scope

Actual product photography, OG image generation, art direction
(`<Picture>` per-breakpoint crops) until real photos exist.
