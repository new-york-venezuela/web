# Product Image Carousel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add multi-image carousel support to product cards and detail pages, allowing users to browse product variants (e.g., product photo + package).

**Architecture:** Create a reusable `ImageCarousel` component that manages carousel state with vanilla JS. Update the `Producto` type to support multiple images via optional `imagenes` array, falling back to single `imagen` if absent. Integrate carousel into ProductCard and detail page, maintaining 5:4 aspect ratio across all screen sizes.

**Tech Stack:** Astro (static generation), vanilla JavaScript (carousel state), CSS (mobile-first responsive design)

## Global Constraints

- Image aspect ratio: 5:4 (350×280px native)
- Mobile-first responsive design; no external carousel library
- Arrow button navigation (no thumbnails, no dots)
- Keyboard support: arrow keys to navigate
- Reduced motion respected (`prefers-reduced-motion: reduce`)
- Backward compatible: products without `imagenes` fall back to single `imagen`

---

### Task 1: Update `Producto` type to support multiple images

**Files:**
- Modify: `src/utils/loadProductos.ts`

**Interfaces:**
- Produces: `Producto` type with optional `imagenes: string[]` field

- [ ] **Step 1: Add `imagenes` field to Producto interface**

Open `src/utils/loadProductos.ts` and update the `Produto` interface (after line 10):

```typescript
export interface Produto {
  id: string;
  nome: string;
  descricao: string;
  descricao_seo?: string;
  categoria_primaria: 'supermarket' | 'foodservice';
  categoria_secundaria: 'panes' | 'reposteria' | 'especialidades' | 'pizza';
  imagen: string;
  imagenAlt?: string;
  imagenes?: string[];  // NEW: array of image slugs for carousel
  palabras_clave?: string[];
  destacado?: boolean;
  precioRef?: number;
  certificaciones?: string[];
  specs?: {
    peso?: string;
    codigo_barras?: string;
    cpe?: string;
    mpps?: string;
    tiempoVida?: string;
    temperatura?: string;
  };
  variantes_relacionadas?: string[];
}
```

- [ ] **Step 2: Add validation for `imagenes` field**

In the `validateProducto` function (around line 86, after the `specs` validation), add:

```typescript
  if (producto.imagenes !== undefined) {
    if (!Array.isArray(producto.imagenes)) {
      throw new Error(`Producto ${producto.id}: imagenes debe ser array`);
    }
    if (producto.imagenes.length < 1) {
      throw new Error(`Producto ${producto.id}: imagenes debe contener al menos 1 imagen`);
    }
    if (!producto.imagenes.every((img: any) => typeof img === 'string')) {
      throw new Error(`Producto ${producto.id}: todos los elementos de imagenes deben ser strings`);
    }
  }
```

Add this right before the final `return true;` statement (before line 100).

- [ ] **Step 3: Commit**

```bash
git add src/utils/loadProductos.ts
git commit -m "feat: add imagenes field to Producto type with validation"
```

---

### Task 2: Create ImageCarousel component

**Files:**
- Create: `src/components/ImageCarousel.astro`

**Interfaces:**
- Consumes: `Producto.imagenes` (array of image slugs)
- Produces: Carousel component with props `imagenes: string[]`, `alt: string`, `class?: string`

- [ ] **Step 1: Create the component file**

Create `src/components/ImageCarousel.astro`:

```astro
---
interface Props {
  imagenes: string[];
  alt: string;
  class?: string;
}

const { imagenes, alt, class: className } = Astro.props;

// Validate at least one image
if (!imagenes || imagenes.length === 0) {
  throw new Error('ImageCarousel requires at least one image');
}
---

<div class:list={['carousel', className]}>
  <button
    class="carousel__button carousel__button--prev"
    aria-label="Previous image"
    data-action="prev"
  >
    ←
  </button>

  <div class="carousel__viewport">
    <img
      src={`/productos/${imagenes[0]}.png`}
      alt={alt}
      class="carousel__image"
      data-carousel-image
    />
  </div>

  <button
    class="carousel__button carousel__button--next"
    aria-label="Next image"
    data-action="next"
  >
    →
  </button>

  <div class="carousel__counter" data-carousel-counter>
    1 / {imagenes.length}
  </div>
</div>

<script define:vars={{ imagenes }}>
  (function initCarousel() {
    const carousel = document.currentScript.closest('.carousel');
    if (!carousel) return;

    let currentIndex = 0;

    const image = carousel.querySelector('[data-carousel-image]');
    const counter = carousel.querySelector('[data-carousel-counter]');
    const prevBtn = carousel.querySelector('[data-action="prev"]');
    const nextBtn = carousel.querySelector('[data-action="next"]');

    function updateImage() {
      const slug = imagenes[currentIndex];
      image.src = `/productos/${slug}.png`;
      counter.textContent = `${currentIndex + 1} / ${imagenes.length}`;
    }

    function handlePrev() {
      currentIndex = (currentIndex - 1 + imagenes.length) % imagenes.length;
      updateImage();
    }

    function handleNext() {
      currentIndex = (currentIndex + 1) % imagenes.length;
      updateImage();
    }

    function handleKeydown(e) {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleNext();
      }
    }

    prevBtn.addEventListener('click', handlePrev);
    nextBtn.addEventListener('click', handleNext);
    carousel.addEventListener('keydown', handleKeydown);

    // Cleanup
    return () => {
      prevBtn.removeEventListener('click', handlePrev);
      nextBtn.removeEventListener('click', handleNext);
      carousel.removeEventListener('keydown', handleKeydown);
    };
  })();
</script>

<style>
  .carousel {
    display: flex;
    flex-direction: column;
    gap: var(--space-s);
    align-items: center;
  }

  .carousel__viewport {
    width: 100%;
    aspect-ratio: 5 / 4;
    overflow: hidden;
    background-color: var(--color-milk);
    border-radius: 0.5rem;
  }

  .carousel__image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
    transition: opacity 0.2s ease;
  }

  @media (prefers-reduced-motion: reduce) {
    .carousel__image {
      transition: none;
    }
  }

  .carousel__button {
    background: transparent;
    border: none;
    color: var(--color-charcoal);
    font-size: 1.5rem;
    cursor: pointer;
    padding: 0.5rem;
    line-height: 1;
    transition: color 0.2s ease;
  }

  .carousel__button:hover {
    color: var(--color-accent);
  }

  .carousel__button:focus {
    outline: 2px solid var(--color-charcoal);
    outline-offset: 2px;
  }

  .carousel__counter {
    font-size: 0.875rem;
    color: var(--color-charcoal-soft);
  }

  /* Mobile: buttons stack below image */
  @media (max-width: 39.9375rem) {
    .carousel {
      gap: var(--space-s);
    }

    .carousel__button {
      order: 2;
    }

    .carousel__button--prev {
      margin-right: var(--space-s);
    }

    .carousel__button--next {
      margin-left: var(--space-s);
    }

    .carousel__counter {
      order: 3;
    }

    .carousel__viewport {
      order: 1;
    }

    /* Buttons side-by-side on mobile */
    .carousel {
      align-items: center;
    }
  }

  /* Desktop: buttons flank image horizontally */
  @media (min-width: 40rem) {
    .carousel {
      flex-direction: row;
      align-items: center;
      justify-content: center;
    }

    .carousel__viewport {
      flex: 0 1 auto;
      max-width: 100%;
    }

    .carousel__button {
      flex-shrink: 0;
    }

    .carousel__button--prev {
      order: 1;
      margin-right: var(--space-m);
    }

    .carousel__viewport {
      order: 2;
    }

    .carousel__button--next {
      order: 3;
      margin-left: var(--space-m);
    }

    .carousel__counter {
      order: 4;
      position: absolute;
      bottom: -2rem;
      left: 50%;
      transform: translateX(-50%);
    }
  }
</style>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/ImageCarousel.astro
git commit -m "feat: create ImageCarousel component with arrow navigation"
```

---

### Task 3: Update ProductCard to use ImageCarousel

**Files:**
- Modify: `src/components/ProductCard.astro`

**Interfaces:**
- Consumes: `ImageCarousel` component, `Producto` with optional `imagenes` field
- Produces: ProductCard rendering carousel for multi-image products

- [ ] **Step 1: Import ImageCarousel and update media rendering**

Open `src/components/ProductCard.astro`. Update the frontmatter section and add the import:

```astro
---
import type { Producto } from '../data/catalogo';
import ImageCarousel from './ImageCarousel.astro';

interface Props {
  producto: Producto;
}

const { producto } = Astro.props;

const categoriasSecundarias: Record<string, string> = {
  'panes': 'Panes',
  'reposteria': 'Repostería',
  'especialidades': 'Especialidades',
  'pizza': 'Pizzas',
};

const imagenUrl = `/productos/${producto.imagen}.png`;
const imagenes = producto.imagenes || [producto.imagen];
const tieneMultiplesImagenes = imagenes.length > 1;
---
```

- [ ] **Step 2: Update the card media section**

Replace the `<div class="card__media">` block (around lines 22-24) with:

```astro
    <div class="card__media">
      {tieneMultiplesImagenes ? (
        <ImageCarousel imagenes={imagenes} alt={producto.imagenAlt || producto.nombre} />
      ) : (
        <img src={imagenUrl} alt={producto.imagenAlt || producto.nombre} loading="lazy" />
      )}
    </div>
```

- [ ] **Step 3: Update card__media aspect ratio in styles**

Change the `.card__media` CSS rule to use 5:4 aspect ratio instead of 4:3:

```css
  .card__media {
    aspect-ratio: 5 / 4;
    background-color: var(--color-milk);
    border-bottom: 1px solid var(--color-border);
  }
```

- [ ] **Step 4: Add carousel styling**

After the `.card__media img` rule, add:

```css
  .carousel {
    width: 100%;
    height: 100%;
  }
```

- [ ] **Step 5: Commit**

```bash
git add src/components/ProductCard.astro
git commit -m "feat: integrate ImageCarousel into ProductCard for multi-image products"
```

---

### Task 4: Update detail page to use ImageCarousel

**Files:**
- Modify: `src/pages/productos/[id].astro`

**Interfaces:**
- Consumes: `ImageCarousel` component, `Producto` with optional `imagenes` field
- Produces: Detail page with carousel in media section

- [ ] **Step 1: Import ImageCarousel**

At the top of `src/pages/productos/[id].astro`, after the BaseLayout import (around line 2), add:

```astro
import ImageCarousel from '../../components/ImageCarousel.astro';
```

- [ ] **Step 2: Update detail-media section**

Replace lines 50-52 (the single image render in detail-media) with:

```astro
        <div class="detail-media">
          {
            const imagenes = producto.imagenes || [producto.imagen];
            imagenes.length > 1 ? (
              <ImageCarousel imagenes={imagenes} alt={producto.imagenAlt || producto.nombre} />
            ) : (
              <img src={`/productos/${producto.imagen}.png`} alt={producto.imagenAlt || producto.nombre} />
            )
          }
        </div>
```

- [ ] **Step 3: Update detail-media CSS**

In the styles section (around line 179), update the `.detail-media img` rule and add carousel styling:

```css
  .detail-media img {
    width: 100%;
    height: auto;
    border-radius: 0.5rem;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  .carousel {
    width: 100%;
  }

  .carousel__viewport {
    border-radius: 0.5rem;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }
```

- [ ] **Step 4: Commit**

```bash
git add src/pages/productos/[id].astro
git commit -m "feat: integrate ImageCarousel into product detail page"
```

---

### Task 5: Add `imagenes` arrays to productos.json

**Files:**
- Modify: `src/data/productos.json`

**Interfaces:**
- Consumes: `Producto` type with `imagenes` field
- Produces: Updated JSON with `imagenes` arrays for products with package variants

- [ ] **Step 1: Add imagenes for pan-4-granos**

Find the product with `"id": "pan-4-granos"` in `src/data/productos.json`. After the `imagenAlt` line, add:

```json
      "imagenes": ["pan-4-granos", "pan-4-granos-paquete"],
```

- [ ] **Step 2: Add imagenes for pan-7-cereales**

Find the product with `"id": "pan-7-cereales"`. After `imagenAlt`, add:

```json
      "imagenes": ["pan-7-cereales", "pan-7-cereales-paquete"],
```

- [ ] **Step 3: Add imagenes for pan-blanco-especial**

Find the product with `"id": "pan-blanco-especial"`. After `imagenAlt`, add:

```json
      "imagenes": ["pan-blanco-especial", "pan-blanco-especial-paquete"],
```

- [ ] **Step 4: Add imagenes for magdalenas**

Find the product with `"id": "magdalenas"`. After `imagenAlt`, add:

```json
      "imagenes": ["magdalenas", "magdalenas-paquete"],
```

- [ ] **Step 5: Verify JSON is valid**

```bash
cat src/data/productos.json | jq . > /dev/null && echo "JSON valid"
```

Expected: `JSON valid`

- [ ] **Step 6: Commit**

```bash
git add src/data/productos.json
git commit -m "data: add imagenes arrays for products with package variants"
```

---

### Task 6: Test carousel functionality

**No new files; testing with the running app**

- [ ] **Step 1: Build and start dev server**

```bash
npm run build && npm run dev
```

Expected: Build succeeds, dev server starts

- [ ] **Step 2: Test carousel on catalog page**

Navigate to `http://localhost:3000/catalogo/`. Check:
- Product cards display at 5:4 aspect ratio
- Cards with multiple images show carousel with arrow buttons
- Clicking → advances to next image
- Counter updates (e.g., "1 / 2")
- Wrapping works (last image → first when clicking →)
- No console errors

- [ ] **Step 3: Test carousel on detail page**

Click on "Pan 4 Granos" to visit `/productos/pan-4-granos/`. Check:
- Carousel displays in media section
- Arrows and counter visible
- Navigation works
- Sticky positioning still functions

- [ ] **Step 4: Test mobile responsive**

Resize browser to ~375px width. Verify:
- Carousel adapts to mobile layout
- Buttons position correctly
- No layout shift

- [ ] **Step 5: Test keyboard navigation**

Focus carousel and press `ArrowRight` / `ArrowLeft`. Verify images advance.

- [ ] **Step 6: Test reduced motion**

In DevTools, enable `prefers-reduced-motion: reduce`. Verify transitions are instant.

- [ ] **Step 7: Verify no errors**

Open browser console. Check for no errors or warnings related to carousel.

---

### Task 7: Final validation

**No code changes; wrap-up checks**

- [ ] **Step 1: Run type check**

```bash
npx tsc --noEmit
```

Expected: No TypeScript errors

- [ ] **Step 2: Verify all commits are present**

```bash
git log --oneline -7
```

Expected: 7 commits (including design spec) related to carousel

- [ ] **Step 3: Commit any uncommitted work**

```bash
git status
```

Expected: Working tree clean

Done! All tasks complete.
