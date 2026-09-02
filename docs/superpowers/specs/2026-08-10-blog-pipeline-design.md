# Blog Pipeline — Design Spec

**Date:** 2026-08-10
**Status:** Approved
**Branch:** automated-daily-blog-generator

---

## Context

Alimentos New York (New York Cheese Cake C.A.) is a Venezuelan industrial bakery and pastry manufacturer supplying supermarkets, bodegones, foodservice/HORECA, and corporate clients in Caracas. The blog is in Spanish and serves two audiences: end consumers and B2B buyers (procurement managers, restaurant owners, catering operators).

The existing pipeline is a single-shot Python script (`scripts/generate_blog.py`) that takes a GitHub issue and sends one generic prompt to OpenAI. It has no grounding in real company data, no keyword strategy, no outline validation, and produces content with high hallucination risk. This spec replaces it with a 6-step sequential pipeline.

**Key SEO opportunity:** "cheesecake factory" is currently the site's top search term. The pipeline is designed to leverage this traffic arbitrage — capturing both consumer intent (I want cheesecake) and B2B intent (I need a cheesecake supplier) on every cheesecake-adjacent post.

---

## Goals

- Reduce hallucinations by grounding every LLM call in real company/product data
- Optimize all posts for SEO (Spanish keyword strategy) and GEO (generative engine optimization — direct answers surfaced by Perplexity, ChatGPT, etc.)
- Position Alimentos New York as a supplier with distinct lines of business
- Build authority across four content pillars in priority order: consumer (D), foodservice/HORECA (B), retail/supermercados (A), industrial/ingredients (C)
- Human-in-the-loop review before publish (currently); path to hybrid automation later

---

## Architecture

A 6-step sequential pipeline. Each step saves a JSON or markdown artifact to `.pipeline/{issue_number}/`. If the pipeline crashes or is interrupted, it resumes from the last successful checkpoint.

```
GitHub Issue
     │
     ▼
Step 1: Brief Enrichment          → .pipeline/{issue}/01_brief.json
     │  (GSC queries + products + company KB + signals)
     ▼
Step 2: Keyword Strategy          → .pipeline/{issue}/02_keywords.json
     │  (primary kw, secondary, intent, audience segment)
     ▼
Step 3: Outline Generation        → .pipeline/{issue}/03_outline.json
     │  (GEO-optimized structure, H2/H3, internal links)
     ▼
Step 4: Section-by-Section Gen    → .pipeline/{issue}/04_draft.md
     │  (one LLM call per H2, grounded with real facts)
     ▼
Step 5: SEO/GEO Review            → .pipeline/{issue}/05_polished.md
     │  (keyword density, fact validation, Spanish fluency)
     │
     ├─ pass → Step 6
     └─ fail → Step 4 retry (flagged sections only, review feedback injected)
                    │
                    └─ Step 5 retry
                          ├─ pass → Step 6
                          └─ fail → Step 6 with PR warnings
     ▼
Step 6: Frontmatter + PR Package  → src/content/blog/{slug}.md
        (title, meta, JSON-LD schema, image briefs, PR body)
```

**Resumability:** each step checks for its output file before running. Pass `--force-step N` to re-run from step N onward.

**Language:** Spanish is enforced across all LLM calls. `BLOG_LANG=es` is injected into every system prompt. No Spanglish, no machine-translation patterns.

---

## File Structure

```
scripts/
└── blog_pipeline/
    ├── __init__.py
    ├── context.py              # shared PipelineContext dataclass
    ├── step_01_enrich.py
    ├── step_02_keywords.py
    ├── step_03_outline.py
    ├── step_04_content.py
    ├── step_05_review.py
    ├── step_06_frontmatter.py
    ├── gsc_client.py           # Google Search Console API wrapper
    ├── catalog_loader.py       # loads productos + empresa KB
    └── main.py                 # orchestrator

scripts/
└── generate_blog.py            # kept as thin shim → blog_pipeline/main.py

src/content/
└── empresa/                    # new Astro content collection (public KB)
    ├── sobre-nosotros.md
    ├── lineas-de-negocio.md
    ├── certificaciones.md
    ├── procesos.md
    ├── programa-zero-desperdicio.md
    └── distribucion.md

.pipeline/                      # gitignored, checkpoint artifacts
└── {issue_number}/
    ├── 01_brief.json
    ├── 02_keywords.json
    ├── 03_outline.json
    ├── 04_draft.md
    ├── 05_polished.md
    └── 06_meta.json

public/
└── blog/                       # human-added blog images
```

---

## Data Sources

### 1. Product Catalog (`src/content/productos/*.md`)

All 27 product files are loaded at startup. Each pipeline run receives only products relevant to the post topic — matched by keyword overlap between the issue title/body and each product's `palabras_clave` field. No LLM call needed for this matching — pure string intersection.

### 2. Company Knowledge Base (`src/content/empresa/*.md`)

A new Astro content collection written once and maintained. Sections:

| File | Content |
|------|---------|
| `sobre-nosotros.md` | Founding story, mission, B2B positioning statement |
| `lineas-de-negocio.md` | Supermercados, foodservice/HORECA, corporate, retail; capacity, minimums, distribution zones |
| `certificaciones.md` | Kosher Pat Israel and any others |
| `procesos.md` | Industrial baking process, what differentiates production at scale |
| `programa-zero-desperdicio.md` | Pilot program details for supermarkets (5-day window, credit notes, special labeling) |
| `distribucion.md` | Punto a punto logistics, Caracas coverage zones |

These files are also public web content — indexed by Google and crawled by LLMs, providing a double benefit (grounding + GEO presence).

Relevant sections are selected per post using the same keyword matching as the product catalog.

### 3. Google Search Console

Fetched once per pipeline run via the GSC Data API. Returns top 50 queries from the last 90 days filtered to ≥10 impressions. Clustered by semantic similarity to the post topic for Step 2.

The "cheesecake factory" cluster (and variants: "cheesecake caracas", "donde comprar cheesecake", "fabrica de cheesecake venezuela") is always surfaced when the topic involves cheesecake, pastelería, or postres. The pipeline flags `traffic_arbitrage: true` and downstream steps insert a GEO-optimized direct answer block targeting both consumer and B2B intent from this cluster.

---

## Step Details

### Step 1 — Brief Enrichment *(no LLM call)*

Assembles all grounding data into `01_brief.json`. No LLM involved — pure data fetching and matching.

Output schema:
```json
{
  "issue_number": 42,
  "issue_title": "...",
  "issue_body": "...",
  "metadata": { "scheduled_date": "...", "series": null, "tags": [] },
  "matched_products": [ { "id": "...", "title": "...", "keywords": [], "specs": {} } ],
  "matched_kb_sections": [ { "file": "lineas-de-negocio.md", "excerpt": "..." } ],
  "gsc_queries": [ { "query": "cheesecake factory caracas", "impressions": 340, "clicks": 12 } ],
  "traffic_arbitrage": true,
  "cross_links": { "12": { "title": "...", "url": "/blog/..." } }
}
```

### Step 2 — Keyword Strategy *(1 LLM call, in Spanish)*

LLM receives `01_brief.json` and returns a structured keyword strategy.

Output schema:
```json
{
  "primary_keyword": "cheesecake para restaurantes Caracas",
  "secondary_keywords": ["proveedor de cheesecake Venezuela", "cheesecake industrial", "postres congelados Caracas"],
  "audience_segments": ["consumidor", "b2b"],
  "search_intent": "comercial",
  "geo_answer": "Alimentos New York fabrica y distribuye cheesecakes industriales en Caracas, disponibles en cadenas de supermercados y como proveedor directo para restaurantes y catering.",
  "internal_links": ["/catalogo/", "/blog/..."]
}
```

The `geo_answer` is the 2–3 sentence direct answer optimized for generative engines. It will appear verbatim (or as close paraphrase) at the top of the post.

### Step 3 — Outline Generation *(1 LLM call, in Spanish)*

Produces a structured outline where every H2 is tagged with audience, keyword target, products to mention, and image slot.

Output schema:
```json
{
  "slug": "cheesecake-proveedor-caracas",
  "sections": [
    {
      "h2": "¿Dónde conseguir cheesecake en Caracas?",
      "audience": "consumidor",
      "keyword_to_hit": "cheesecake caracas",
      "products_to_mention": ["cheesecake-clasico", "cheesecake-chocolate"],
      "h3s": ["En supermercados", "Para eventos y celebraciones"],
      "image_slot": { "type": "product", "product_id": "cheesecake-clasico" },
      "internal_links": ["/catalogo/"]
    },
    {
      "h2": "Cheesecake para restaurantes y catering",
      "audience": "b2b",
      "keyword_to_hit": "proveedor cheesecake Venezuela",
      "products_to_mention": ["cheesecake-clasico"],
      "h3s": ["Formatos y presentaciones", "Condiciones de distribución"],
      "image_slot": { "type": "lifestyle", "brief": "Bandeja de cheesecakes en presentación foodservice, cocina profesional de fondo" },
      "internal_links": []
    }
  ],
  "closing_cta": {
    "consumer": "¿Dónde comprar? → WhatsApp / puntos de venta",
    "b2b": "¿Buscas proveedor? → formulario de contacto"
  }
}
```

### Step 4 — Section-by-Section Content Generation *(1 LLM call per H2)*

For each section in `03_outline.json`, a focused LLM call receives only:
- The section's H2/H3 structure
- The products relevant to that section (specs, keywords)
- The company KB excerpts relevant to that section
- The keyword to hit
- The audience tone (consumidor / b2b / ambos)
- System instruction in Spanish: cite only facts from the provided data, never invent statistics or product specs, write in fluent natural Spanish prose (not lists), avoid machine-translation patterns

Sections are assembled in order into `04_draft.md`. This is the primary hallucination guard — the LLM writes around real facts rather than generating them.

### Step 5 — SEO/GEO Review & Partial Retry *(1 LLM call as reviewer)*

Reviewer LLM reads `04_draft.md` against `02_keywords.json` and `01_brief.json`. Checks:

- Primary keyword in first 100 words and at least 2 H2 headings
- `geo_answer` present at the top (verbatim or close paraphrase)
- No product spec present that isn't in `matched_products`
- Spanish fluency — no Spanglish, no obvious anglicisms, natural prose
- Both audience segments addressed if `audience_segments` contained both
- Image slots have structured briefs (not bare HTML comments)
- Closing CTA present and split by audience

On failure: re-runs flagged sections of Step 4 with review feedback appended to that section's prompt. Max one retry cycle. Surviving failures go into `review_warnings` list.

### Step 6 — Frontmatter + PR Package *(1 LLM call)*

Generates final `{slug}.md` with:

```yaml
---
title: "..."                    # primary keyword + brand, ≤60 chars, Spanish
description: "..."              # primary keyword in first 20 chars, ≤160 chars, GEO snippet
pubDate: YYYY-MM-DD
author: "eugenio"
draft: true                     # human flips to false on PR approval
tags: [...]
relatedIssue: 42
ogImage: "/productos/..."       # first matched product image, or null
schema: |                       # JSON-LD Article schema
  { "@context": "...", ... }
---
```

Also writes `06_meta.json` with:
- Keyword strategy summary
- Image briefs list (one per lifestyle image slot)
- `review_warnings` (if any)
- Human reviewer checklist

The GitHub Actions PR body is populated from `06_meta.json`. The PR body template:

```markdown
## Artículo generado: "{title}"

**Keyword principal:** {primary_keyword}
**Segmentos:** {audience_segments}
**Intención:** {search_intent}

## Imágenes necesarias

{image_briefs — one per lifestyle slot, with exact brief and target path}

## Checklist para revisor

- [ ] Leer el artículo completo en la vista previa del PR
- [ ] Verificar que los datos de producto son correctos
- [ ] Agregar imágenes faltantes a `public/blog/`
- [ ] Cambiar `draft: true` a `draft: false` en el frontmatter
- [ ] Aprobar y hacer merge

{review_warnings if any}
```

---

## Image Strategy

**Product images (auto):** When a section references a product that has an image in `public/productos/`, the pipeline embeds it directly using the existing `imagen` field from the product's markdown frontmatter. No human action needed.

**Lifestyle/context images (structured brief):** When the outline specifies a lifestyle image slot, the pipeline generates a precise written brief (not an HTML comment) that appears in the PR body. The human reviewer sources or shoots the photo, drops it in `public/blog/`, and updates the path before merging.

Image brief format:
```
Slot: /blog/cheesecake-proveedor-caracas/cocina-profesional.jpg
Descripción: Bandeja de cheesecakes en presentación foodservice sobre mesón de acero inoxidable, cocina profesional de fondo. Luz natural, estética limpia y apetitosa.
Dimensiones sugeridas: 1200×630px (OG-compatible)
```

---

## Configuration

New environment variables:

```env
GSC_SITE_URL=https://www.alimentosnewyork.com
GSC_CREDENTIALS_FILE=.gsc-credentials.json
BLOG_LANG=es
PIPELINE_CHECKPOINT_DIR=.pipeline
```

`generate_blog.py` stays as a thin shim:
```python
from blog_pipeline.main import main
if __name__ == "__main__":
    main()
```

GitHub Actions workflow changes:
- Upload `.pipeline/{issue_number}/` as artifact for debugging
- PR body populated from `06_meta.json`
- No other workflow changes required

`.pipeline/` and `.gsc-credentials.json` added to `.gitignore`.

---

## Out of Scope

- Parallel/async execution (can be added later, no benefit at 1 post/day)
- Vector database / RAG (27 products fit in context window directly)
- AI-generated images (brand credibility risk for a food supplier)
- Auto-merge (human review required; may move to hybrid automation later)
- Multi-language support (Spanish only)
- Comment moderation or social syndication

---

## Open Questions

None. All design decisions confirmed.
