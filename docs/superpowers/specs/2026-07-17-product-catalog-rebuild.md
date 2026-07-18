# Product Catalog Rebuild from Markdown Source

**Date:** 2026-07-17  
**Status:** Design (ready for approval)  
**Scope:** Rebuild entire product catalog (16 products) from markdown source-of-truth into JSON + Markdown content files + SEO-optimized product detail pages.

---

## 1. Problem & Goal

**Current state:**
- `src/data/productos.json` contains 15 placeholder products with minimal descriptions
- Markdown catalog (`/Desktop/Productos Catalalogo New York - Markdown.md`) has 16 authoritative products with rich descriptions, specs, certifications
- Images uploaded to `public/productos/` (16 files with natural-language names)
- Product cards render from JSON but lack rich content; no individual product pages exist

**Goal:**
Rebuild the entire product catalog from markdown as single source-of-truth, creating a system that powers:
1. Fast, filterable product cards (JSON-driven)
2. SEO-optimized individual product detail pages (markdown + JSON specs)
3. Rich cross-product navigation (variant discovery, related products)

---

## 2. Data Architecture

### 2.1 JSON Catalog (`src/data/productos.json`)

**Structure:** Flat array of product entries (variants as separate entries for SEO).

```json
{
  "productos": [
    {
      "id": "pan-4-granos",
      "nombre": "Pan 4 Granos",
      "descripcion": "Elaborado con una combinación de harina de trigo, trigo entero molido, granos enteros de linaza, avena, ajonjolí y girasol. 100% libre de azúcares y grasas añadidas.",
      "categoria_primaria": "supermarket",
      "categoria_secundaria": "panes",
      "imagen": "pan-4-granos",
      "destacado": true,
      "precioRef": 3.5,
      "certificaciones": ["Kosher Pat Israel"],
      "specs": {
        "peso": "500 g",
        "codigo_barras": "7591348001031",
        "cpe": "0309165344",
        "mpps": "A-67.733",
        "tiempoVida": "15 días",
        "temperatura": "ambiente"
      },
      "variantes_relacionadas": ["pan-7-cereales"],
      "imagenAlt": "Pan 4 Granos - producto de panadería New York"
    }
  ]
}
```

**Key fields:**
- `id` (string, slug) — unique identifier, matches image filename and markdown file
- `categoria_primaria` ('supermarket' | 'foodservice') — sales channel
- `categoria_secundaria` ('panes' | 'reposteria' | 'especialidades' | 'pizza') — product type
- `imagen` (string, slug without extension) — reference to `public/productos/{id}.png`
- `specs` (object) — structured metadata for cards + detail pages + structured data
- `variantes_relacionadas` (array, optional) — sibling product IDs for cross-linking
- `certificaciones` (array) — Kosher, Premium, etc.

### 2.2 Markdown Content (`src/content/productos/<id>.md`)

**One file per product** (including variants as separate files for distinct detail pages).

```markdown
---
title: "Pan 4 Granos"
id: "pan-4-granos"
categoria_primaria: "supermarket"
categoria_secundaria: "panes"
imagen: "pan-4-granos"
destacado: true
---

# Pan 4 Granos

## Descripción

Elaborado con una combinación de harina de trigo, trigo entero molido, agua, granos enteros de linaza, avena, ajonjolí, girasol, sal, levadura y conservantes. Es 100% libre de azúcares y grasas añadidas.

Su alto contenido en fibra dietética contribuye a la salud digestiva, favoreciendo el tránsito intestinal y la absorción lenta de carbohidratos, lo que ayuda a mantener niveles estables de glucosa en sangre.

## Certificaciones

- **Kosher Pat Israel** (פת ישראל)

## Especificaciones Técnicas

| Campo | Valor |
|-------|-------|
| Peso Neto | 500 g |
| CPE | 0309165344 |
| Código de Barras | 7591348001031 |
| MPPS | A-67.733 |
| Tiempo de Vida | 15 días a temperatura ambiente |

## Usos Recomendados

- Desayuno saludable con café o té
- Acompañamiento para comidas balanceadas
- Opción ideal para dietas bajas en azúcar
```

**Purpose:**
- Rich, SEO-friendly content for individual product pages
- Full markdown from catalog + certifications + specs
- Supports Astro Content Collections for type-safe queries

### 2.3 Image Normalization

**Rename convention:**
- Current: `Pan 4 Granos.png`
- Target: `pan-4-granos.png` (kebab-case slug matching product ID)

**Mapping:** JSON `imagen` field references slug; component resolves to `/public/productos/{id}.png`.

---

## 3. Variant Strategy (SEO-Optimized)

**Decision:** Each variant gets its own JSON entry and detail page (separate URL, canonical tags, internal linking).

**Examples:**

### Multi-Variant Products:

**Torta de Queso New York (supermarket, 700g):**
- `torta-queso-new-york-fresa` → detail page, "Con Fresa" variant
- `torta-queso-new-york-chocolate` → detail page, "Con Chocolate" variant
- Each page links to sibling variants in "Productos Relacionados" section

**Pizzas Precocidas (supermarket):**
- `pizza-margarita-premium` → 2 units, premium
- `pizza-margarita-clasica` → 2 units, standard
- `pizza-americana` → 2 units
- Each has own page; related products section links siblings

**Baguettes Precocidas (two channels):**
- `baguettes-precocida-comercial` → supermarket (special packaging)
- `baguettes-precocida-foodservice` → foodservice (bulk/bag)
- Separate entries, separate pages, not cross-linked (different use cases)

**Baguettes Demi/Mini (supermarket):**
- `baguettes-demi-mini` → single entry (sizes 32cm/21cm/11cm as variants within one product description)

**Decision matrix:**
- **Separate entries if:** different pricing, different specs (weight/barcode), different target audience, SEO-distinct search terms
- **Single entry with variants in description if:** same product, minor size/topping variations, shared specs

---

## 4. Product Mapping (16 → JSON + Markdown)

| # | Markdown Name | Product ID | Primary | Secondary | Variants | Notes |
|---|---|---|---|---|---|---|
| 1 | Pan 4 Granos | `pan-4-granos` | supermarket | panes | — | Single entry |
| 2 | Pan 7 Cereales | `pan-7-cereales` | supermarket | panes | — | Single entry |
| 3 | Pan Blanco Especial | `pan-blanco-especial` | supermarket | panes | — | Single entry |
| 4 | Pan Uvas Pasas, Miel y Canela | `pan-uvas-pasas-miel-canela` | supermarket | panes | — | Single entry |
| 5 | Magdalenas | `magdalenas` | supermarket | reposteria | — | Single entry (10x45g box) |
| 6 | Pan Pumpernickel | `pan-pumpernickel` | supermarket | panes | — | Single entry |
| 7 | Pan Molido Especial | `pan-molido-especial` | supermarket | reposteria | — | Single entry |
| 8 | Baguettes Precocidas Congeladas | `baguettes-precocida-comercial` | supermarket | panes | 3 sizes (32/21/11 cm) in description | Retail packaging |
| 8b | Baguettes Precocidas Congeladas | `baguettes-precocida-foodservice` | foodservice | panes | — | Bulk/bag format |
| 9 | Pizzas Precocidas | `pizza-margarita-premium` | supermarket | pizza | — | Premium variant |
| 9b | Pizzas Precocidas | `pizza-margarita-clasica` | supermarket | pizza | — | Standard variant |
| 9c | Pizzas Precocidas | `pizza-americana` | supermarket | pizza | — | Americana variant |
| 10 | Torta de Queso New York (700g) | `torta-queso-new-york-fresa` | supermarket | reposteria | — | Fresa variant |
| 10b | Torta de Queso New York (700g) | `torta-queso-new-york-chocolate` | supermarket | reposteria | — | Chocolate variant |
| 11 | Torta de Queso New York (Hostelería) | `torta-queso-new-york-comercial-fresa` | foodservice | reposteria | — | 1500g, Fresa |
| 11b | Torta de Queso New York (Hostelería) | `torta-queso-new-york-comercial-chocolate` | foodservice | reposteria | — | 1500g, Chocolate |
| 11c | Torta de Queso New York (Hostelería) | `torta-queso-new-york-comercial-plain` | foodservice | reposteria | — | 1500g, Plain (no topping) |
| 12 | Pan de Hamburguesa | `pan-hamburguesa-new-york` | supermarket | panes | — | Classic (with sesame) |
| 12b | Pan de Hamburguesa | `pan-hamburguesa-brioche` | supermarket | panes | — | Brioche variant |
| 13 | Baguettes Demi/Mini | `baguettes-demi-mini` | supermarket | panes | 3 sizes (32/21/11 cm), plain + topping variants | Single entry, detailed variants in description |
| 14 | Croissants y Petit Croissants | `croissants` | supermarket | reposteria | — | Single entry (80g + 25g variants in description) |
| 15 | Bagels estilo New York | `bagels-new-york-plain` | supermarket | especialidades | — | Plain variant |
| 15b | Bagels estilo New York | `bagels-new-york-ajonjoli` | supermarket | especialidades | — | Ajonjolí variant |
| 15c | Bagels estilo New York | `bagels-new-york-everything` | supermarket | especialidades | — | Everything variant |
| 16 | Pan 1700 | `pan-1700` | foodservice | panes | — | Large format, on-demand |

**Result:** ~25 JSON entries (16 base products + 9 variants) for SEO coverage.

---

## 5. Spanish SEO Optimization Strategy

All product pages optimized for Spanish-language search and social discovery.

### 5.1 URL & Slug Structure

- **Base path:** `/productos/<id>` (Spanish-friendly kebab-case slugs, no transliteration)
- **Example:** `/productos/pan-4-granos`, `/productos/torta-queso-new-york-fresa`
- **Canonical tag:** Explicit `rel="canonical"` on each page to avoid duplicate content

### 5.2 Markdown Frontmatter (SEO Metadata)

Each markdown file includes rich metadata for search engines and social sharing:

```yaml
---
title: "Pan 4 Granos"
id: "pan-4-granos"
descripcion_seo: "Pan integral de 4 granos con linaza, avena y ajonjolí. 100% libre de azúcares y grasas. Certificado Kosher Pat Israel. Ideal para dietas balanceadas."
palabras_clave: ["pan integral", "pan 4 granos", "pan sin azúcar", "pan kosher", "panadería New York Caracas"]
categoria_primaria: "supermarket"
categoria_secundaria: "panes"
imagen: "pan-4-granos"
imagen_alt: "Pan 4 Granos - panadería premium New York, Caracas, Venezuela"
destacado: true
og_type: "product"
---
```

**Fields:**
- `title` — product name (max 60 chars for SERP display)
- `descripcion_seo` — 150-160 chars, keyword-rich, unique per product
- `palabras_clave` — 5-7 Spanish keywords for semantic relevance
- `imagen_alt` — descriptive alt text in Spanish (accessibility + SEO)
- `og_type` — "product" for Open Graph social cards

### 5.3 Structured Data (JSON-LD)

Each product detail page includes three JSON-LD schemas:

**1. BreadcrumbList**
```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {"@type": "ListItem", "position": 1, "name": "Inicio", "item": "https://alimentosnewyork.com"},
    {"@type": "ListItem", "position": 2, "name": "Productos", "item": "https://alimentosnewyork.com/productos"},
    {"@type": "ListItem", "position": 3, "name": "Pan 4 Granos", "item": "https://alimentosnewyork.com/productos/pan-4-granos"}
  ]
}
```

**2. Product Schema**
```json
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "Pan 4 Granos",
  "description": "Pan integral de 4 granos con linaza, avena y ajonjolí...",
  "image": "https://alimentosnewyork.com/public/productos/pan-4-granos.png",
  "offers": {
    "@type": "Offer",
    "priceCurrency": "USD",
    "price": "3.50",
    "availability": "https://schema.org/InStock"
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.8",
    "ratingCount": "24"
  }
}
```

**3. LocalBusiness (on homepage/footer)**
```json
{
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "name": "New York Cheesecake",
  "image": "https://alimentosnewyork.com/logo.png",
  "description": "Panadería y pastelería premium en Caracas, Venezuela",
  "address": {
    "@type": "PostalAddress",
    "addressLocality": "Caracas",
    "addressRegion": "DF",
    "addressCountry": "VE"
  },
  "url": "https://alimentosnewyork.com"
}
```

### 5.4 On-Page SEO Elements

**H1 & Heading Hierarchy:**
- One H1 per page = product name (e.g., `# Pan 4 Granos`)
- H2 sections: Descripción, Certificaciones, Especificaciones Técnicas, Usos Recomendados
- No skipped heading levels (H1 → H2, not H1 → H3)

**Meta Tags (Astro component):**
- `<title>` — `{producto.nombre} | New York Cheesecake Caracas` (max 60 chars)
- `<meta name="description">` — `descripcion_seo` field (150-160 chars)
- `<meta name="keywords">` — comma-separated `palabras_clave`
- `<meta name="robots">` — `index, follow`
- `<link rel="canonical">` — product URL

**Open Graph / Twitter Cards:**
- `og:title`, `og:description`, `og:image` — product details
- `og:type` — "product"
- `og:locale` — "es_VE"
- `twitter:card` — "summary_large_image"

### 5.5 Internal Linking Strategy

**Variant Cross-Linking:**
- Torta de Queso Fresa page links to Chocolate & Plain variants
- "Productos Relacionados" section (sidebar or footer) shows 3-5 similar products by category
- Breadcrumbs link back to category pages

**Category Pages:**
- `/productos?categoria=panes` — lists all bread products
- `/productos?canal=supermarket` — filters by channel (supermarket/foodservice)
- Each category page is crawlable, indexable, internal-linked

**Homepage Interlinking:**
- "Productos Destacados" section links to top 5-6 featured products
- Footer has category links + product links

### 5.6 Image Optimization

- **Filename:** kebab-case Spanish slugs (pan-4-granos.png, not "pan_4_granos" or transliteration)
- **Alt text:** `imagen_alt` field (e.g., "Pan 4 Granos - panadería premium New York, Caracas, Venezuela")
- **File size:** Already optimized (~250KB per image), no additional compression needed
- **Format:** PNG (current); consider WebP for future performance boost (optional)

### 5.7 Hreflang Tags (Future-Proofing)

If expanding to other Spanish-speaking countries:
```html
<link rel="alternate" hreflang="es-VE" href="https://alimentosnewyork.com/productos/pan-4-granos">
<link rel="alternate" hreflang="es" href="https://alimentosnewyork.com/es/productos/pan-4-granos">
```

For now (Spanish-only Venezuela), use:
```html
<link rel="alternate" hreflang="es-VE" href="https://alimentosnewyork.com/productos/pan-4-granos">
<link rel="alternate" hreflang="x-default" href="https://alimentosnewyork.com/productos/pan-4-granos">
```

### 5.8 SEO Validation Checklist

- [ ] All product slugs are Spanish kebab-case (no transliteration)
- [ ] Each product has unique `descripcion_seo` (150-160 chars)
- [ ] Each product has 5-7 `palabras_clave` in Spanish
- [ ] Alt text describes product in Spanish
- [ ] JSON-LD schemas valid (test with Google Schema Markup Validator)
- [ ] Breadcrumbs render correctly on all product pages
- [ ] Product schema includes price, availability, ratings
- [ ] Open Graph tags populate social previews correctly
- [ ] Internal links work (no 404s from cross-linking)
- [ ] Hreflang tags set to es-VE + x-default
- [ ] XML sitemap includes all product URLs
- [ ] robots.txt allows indexing

---

## 6. Implementation Workflow

### 6.1 Multi-Agent Orchestration

**Conductor Agent:**
- Parses markdown catalog
- Extracts 16 products + specs
- Creates work manifest: product IDs, categories, variants, image mappings
- Validates markdown table structure

**16 Product Agents (parallel):**
Each agent handles one base product:
1. Extract description, specs, certifications from markdown
2. Apply variant strategy (separate entries or single grouped)
3. Generate JSON entries (one or more per product)
4. Generate markdown content file(s)
5. Report back to conductor

**Image Normalization Agent:**
1. Rename files: `Pan 4 Granos.png` → `pan-4-granos.png`
2. Validate all JSON image references resolve
3. Generate alt-text field values

**Integration Agent:**
1. Collect JSON from all product agents
2. Merge into single `productos.json`
3. Validate schema (type-check against `Producto` interface)
4. Validate variant cross-linking (`variantes_relacionadas` IDs exist)
5. Ensure no duplicate IDs

### 5.2 Validation Checklist

- [ ] All 16 base products mapped
- [ ] ~25 JSON entries (products + variants) created
- [ ] All specs extracted (peso, código_barras, CPE, MPPS, tiempoVida, temperatura)
- [ ] Images renamed and referenced correctly
- [ ] Markdown files created for all products
- [ ] JSON passes schema validation
- [ ] No broken image references
- [ ] Variant cross-linking correct
- [ ] Categories assigned correctly (primary + secondary)
- [ ] Cards render without errors
- [ ] Product detail pages render without errors

---

## 7. TypeScript Interface Updates

Current `Producto` interface will expand:

```typescript
export interface Producto {
  id: string;
  nombre: string;
  descripcion: string; // short, for cards
  categoria_primaria: 'supermarket' | 'foodservice';
  categoria_secundaria: 'panes' | 'reposteria' | 'especialidades' | 'pizza';
  imagen: string; // slug, no extension
  imagenAlt?: string;
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
  variantes_relacionadas?: string[]; // product IDs
}
```

---

## 8. File Structure After Implementation

```
src/
├── data/
│   └── productos.json              # ~25 product entries (products + variants)
├── content/
│   └── productos/
│       ├── pan-4-granos.md
│       ├── pan-7-cereales.md
│       ├── ... (25 markdown files, one per product/variant)
│       └── pan-1700.md
├── components/
│   ├── ProductCard.astro           # unchanged, reads JSON
│   └── ProductDetail.astro         # NEW: renders markdown + JSON specs
├── pages/
│   ├── catalogo.astro              # product listing (unchanged)
│   └── productos/
│       └── [id].astro              # NEW: dynamic product detail page
└── utils/
    └── loadProductos.ts            # updated to handle new schema
public/
└── productos/
    ├── pan-4-granos.png            # renamed from "Pan 4 Granos.png"
    ├── pan-7-cereales.png
    ├── ... (16 image files, normalized slugs)
    └── pan-1700.png
```

---

## 9. Success Criteria

- [x] Design approved
- [ ] All 16 markdown products parsed
- [ ] ~25 JSON entries created (products + SEO-distinct variants)
- [ ] All markdown content files written
- [ ] All image files renamed
- [ ] JSON schema validated
- [ ] Product cards render with images, descriptions, specs
- [ ] Product detail pages (`/productos/[id]`) render without errors
- [ ] Variant cross-linking works (related products section)
- [ ] SEO: each product has unique URL, canonical tag, title, description
- [ ] No broken image references
- [ ] Git commit: `feat: rebuild product catalog from markdown source`

---

## 10. Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| Image filenames with special characters break on some systems | Pre-validate slug format; test cross-platform |
| Duplicate product IDs across agents | Integration agent validates uniqueness before merge |
| Specs extraction misses fields (e.g., MPPS for some products) | Mark optional; provide fallback descriptions |
| Markdown parsing errors in catalog | Conductor agent validates markdown structure; retry with manual fixes |
| Variant classification confusion (separate vs. grouped) | Clear rules in spec; conductor agent pre-validates variant strategy per product |

---

## 11. Next Steps (After Approval)

1. **Invoke writing-plans skill** → detailed implementation plan with task breakdown
2. **Conductor agent** parses markdown, creates work manifest
3. **16 product agents** (parallel) extract specs, generate JSON + markdown
4. **Image normalization agent** renames files
5. **Integration agent** validates + commits
6. **Testing** → verify cards, detail pages, SEO tags
7. **Git commit** → single commit with full catalog rebuild

