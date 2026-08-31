# Blog Issue Format, Quality & SEO Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Standardize GH blog issue format to YAML front matter, improve generated content quality (tighter prose, no hallucinations, image briefs at end), add Article structured data to blog posts, and fix sitemap/robots for GSC visibility.

**Architecture:** Three parallel tracks: (1) a GH issue form template + parser refactor that replaces fragile regex with `yaml.safe_load()`; (2) pipeline prompt improvements in steps 03–05 that enforce word budgets and move image briefs to a trailing comment block; (3) Astro-side SEO fixes (Article JSON-LD, sitemap includes blog posts, robots.txt URL). All three are independent and can be implemented in any order.

**Tech Stack:** Python 3.12, `pyyaml` (new dep), pytest 7.4, GitHub YAML issue forms, Astro 5, TypeScript.

**Spec:** `docs/superpowers/specs/2026-08-10-blog-pipeline-design.md`

## Global Constraints

- Python 3.12; run tests with `pytest tests/blog_pipeline/ -v`
- All JSON written with `ensure_ascii=False`
- New parser must fall back to legacy regex for old-format issues (no breaking changes while issues are migrated)
- `pyyaml` must be added to `requirements.txt`
- Never touch `.pipeline/` or `src/content/blog/` files in commits (those are runtime artifacts)
- TypeScript changes follow existing patterns in `src/utils/generateProductMetadata.ts`
- Astro component changes follow existing patterns in `src/components/StructuredData.astro`

---

## File Map

| Action | Path | Responsibility |
|--------|------|----------------|
| Create | `.github/ISSUE_TEMPLATE/blog-post.yml` | GH issue form with YAML metadata textarea |
| Modify | `requirements.txt` | Add `pyyaml>=6.0` |
| Modify | `scripts/blog_pipeline/context.py` | Add `image_url`, `image_brief`, `related_posts` to `IssueMetadata` |
| Modify | `scripts/blog_pipeline/main.py` | Refactor `_parse_issue_metadata` → YAML-first with regex fallback; update cross-link resolution |
| Modify | `scripts/blog_pipeline/step_01_enrich.py` | Include `image_url`/`image_brief` from metadata in brief output |
| Modify | `scripts/blog_pipeline/step_03_outline.py` | Add `word_budget` per section to JSON schema; forbid testimonials in system prompt |
| Modify | `scripts/blog_pipeline/step_04_content.py` | Enforce word budget in per-section prompt; collect image briefs and append as trailing comment block |
| Modify | `scripts/blog_pipeline/step_05_review.py` | Add repetition and fabricated-testimonial checks to reviewer prompt |
| Modify | `src/utils/generateProductMetadata.ts` | Add `generateArticleSchema()` function |
| Modify | `src/components/StructuredData.astro` | Add `article` type that calls `generateArticleSchema` |
| Modify | `src/pages/blog/[slug].astro` | Pass `article` type to `StructuredData` + pass `type="article"` to `BaseLayout` |
| Modify | `src/pages/sitemap.xml.ts` | Include blog collection posts |
| Modify | `public/robots.txt` | Fix sitemap URL to `https://www.alimentosnewyork.com/sitemap.xml` |
| Modify | `tests/blog_pipeline/test_main.py` | Update `test_parse_issue_metadata_new_format` for YAML format; add fallback test |
| Modify | `tests/blog_pipeline/test_step_01.py` | Add test for `image_url`/`image_brief` in brief output |
| Modify | `tests/blog_pipeline/test_step_04.py` | Add test for trailing image-brief comment block |
| Create | `scripts/migrate_issues.py` | One-off script: reads existing GH issues, rewrites body to YAML format |

---

## Task 1: YAML Issue Format — Template + IssueMetadata + Parser

**Files:**
- Create: `.github/ISSUE_TEMPLATE/blog-post.yml`
- Modify: `requirements.txt`
- Modify: `scripts/blog_pipeline/context.py`
- Modify: `scripts/blog_pipeline/main.py`
- Modify: `tests/blog_pipeline/test_main.py`

**Interfaces:**
- Produces: `IssueMetadata` with new optional fields `image_url: Optional[str]`, `image_brief: Optional[str]`, `related_posts: list[int]`; keeps `prerequisites: list[str]` for backward compat
- Produces: `_parse_issue_metadata(body: str) -> IssueMetadata` — YAML-first, regex fallback
- Produces: `_resolve_cross_links_by_issue(related_posts: list[int], existing_slugs: dict[int, str]) -> dict` — new function
- Consumes: `pyyaml` added to `requirements.txt`

- [ ] **Step 1: Add pyyaml to requirements.txt**

```
# requirements.txt — add this line after existing deps
pyyaml>=6.0
```

Install and verify: `pip install pyyaml` (or `bun` won't work here — use `.venv`: `.venv/bin/pip install pyyaml`).

- [ ] **Step 2: Write failing tests for new parser and cross-link resolver**

Add to `tests/blog_pipeline/test_main.py`:

```python
import yaml  # add at top

_YAML_ISSUE_BODY = """
### Metadata

```yaml
post_id: post-030
week: 26
scheduled_date: "2027-03-02"
pilar: "Panadería & Tendencias Gastronómicas"
audience: "ambos"
primary_keyword: "fermentacion natural panaderia caracas"
tags: ["panadería", "fermentación"]
image_url: null
image_brief: "Masa fermentada mostrando burbujas naturales antes del formado"
related_posts: [17, 28]
```

### Resumen Ejecutivo

Explicación pedagógica sobre fermentación lenta.
"""

def test_parse_issue_metadata_yaml_format():
    meta = _parse_issue_metadata(_YAML_ISSUE_BODY)
    assert meta.post_id == "post-030"
    assert meta.week == 26
    assert meta.scheduled_date == "2027-03-02"
    assert meta.pilar == "Panadería & Tendencias Gastronómicas"
    assert meta.audience == "ambos"
    assert meta.primary_keyword == "fermentacion natural panaderia caracas"
    assert meta.tags == ["panadería", "fermentación"]
    assert meta.image_url is None
    assert meta.image_brief == "Masa fermentada mostrando burbujas naturales antes del formado"
    assert meta.related_posts == [17, 28]

def test_parse_issue_metadata_yaml_with_image_url():
    body = """
### Metadata

```yaml
post_id: post-001
week: 1
scheduled_date: "2026-08-14"
pilar: "Panadería & Tendencias Gastronómicas"
audience: "b2b"
primary_keyword: "pan brioche hamburguesas"
tags: []
image_url: "/productos/pan-brioche.jpg"
image_brief: null
related_posts: []
```
"""
    meta = _parse_issue_metadata(body)
    assert meta.image_url == "/productos/pan-brioche.jpg"
    assert meta.image_brief is None
    assert meta.related_posts == []

def test_parse_issue_metadata_legacy_fallback():
    # Old format must still parse (backward compat)
    meta = _parse_issue_metadata(_SAMPLE_ISSUE_BODY)  # existing fixture in the file
    assert meta.post_id == "post-030"
    assert meta.scheduled_date == "2027-03-02"
    assert meta.related_posts == []  # legacy issues have no related_posts

def test_resolve_cross_links_by_issue():
    from scripts.blog_pipeline.main import _resolve_cross_links_by_issue
    existing_slugs = {17: "pan-brioche-hamburguesas", 28: "cadena-de-frio"}
    links = _resolve_cross_links_by_issue([17, 28, 99], existing_slugs)
    assert links[17] == {"title": "pan-brioche-hamburguesas", "url": "/blog/pan-brioche-hamburguesas"}
    assert links[28] == {"title": "cadena-de-frio", "url": "/blog/cadena-de-frio"}
    assert links[99] == {"title": "99", "url": None}
```

- [ ] **Step 3: Run tests to verify they fail**

```bash
cd /Users/eugenio/conductor/workspaces/web/regina && .venv/bin/pytest tests/blog_pipeline/test_main.py::test_parse_issue_metadata_yaml_format tests/blog_pipeline/test_main.py::test_parse_issue_metadata_legacy_fallback tests/blog_pipeline/test_main.py::test_resolve_cross_links_by_issue -v
```

Expected: FAIL (ImportError or AssertionError).

- [ ] **Step 4: Update `IssueMetadata` in `context.py`**

```python
# scripts/blog_pipeline/context.py — replace the IssueMetadata dataclass
@dataclass
class IssueMetadata:
    post_id: Optional[str] = None
    week: Optional[int] = None
    scheduled_date: Optional[str] = None
    pilar: Optional[str] = None
    audience: Optional[str] = None
    primary_keyword: Optional[str] = None
    prerequisites: list = field(default_factory=list)   # legacy: post-XXX ids
    related_posts: list = field(default_factory=list)   # new: GH issue numbers (int)
    tags: list = field(default_factory=list)
    image_url: Optional[str] = None
    image_brief: Optional[str] = None
```

Keep `Optional` import from `typing` at the top (it's already there).

- [ ] **Step 5: Refactor `_parse_issue_metadata` in `main.py`**

Replace the current function with:

```python
import yaml  # add to imports at top of main.py

def _parse_issue_metadata(body: str) -> IssueMetadata:
    yaml_match = re.search(r"```yaml\s*\n(.*?)\n```", body, re.S)
    if yaml_match:
        try:
            data = yaml.safe_load(yaml_match.group(1)) or {}
            return IssueMetadata(
                post_id=str(data["post_id"]) if data.get("post_id") else None,
                week=int(data["week"]) if data.get("week") else None,
                scheduled_date=str(data["scheduled_date"]) if data.get("scheduled_date") else None,
                pilar=str(data.get("pilar", "")),
                audience=str(data.get("audience", "")),
                primary_keyword=str(data.get("primary_keyword", "")),
                tags=list(data.get("tags") or []),
                image_url=str(data["image_url"]) if data.get("image_url") else None,
                image_brief=str(data["image_brief"]) if data.get("image_brief") else None,
                related_posts=[int(n) for n in (data.get("related_posts") or [])],
            )
        except (yaml.YAMLError, ValueError, KeyError):
            pass  # fall through to legacy parser

    return _parse_issue_metadata_legacy(body)


def _parse_issue_metadata_legacy(body: str) -> IssueMetadata:
    """Regex-based parser for issues written before the YAML template."""
    meta = IssueMetadata()
    m = re.search(r"\*\*ID:\*\*\s*`?([\w-]+)`?", body)
    if m:
        meta.post_id = m.group(1)
    m = re.search(r"\*\*Semana:\*\*\s*(\d+)", body)
    if m:
        meta.week = int(m.group(1))
    m = re.search(r"\*\*Fecha sugerida:\*\*\s*(\d{4}-\d{2}-\d{2})", body)
    if m:
        meta.scheduled_date = m.group(1)
    m = re.search(r"\*\*Pilar:\*\*\s*(.+)", body)
    if m:
        meta.pilar = m.group(1).strip()
    m = re.search(r"\*\*Audiencia:\*\*\s*(.+)", body)
    if m:
        meta.audience = m.group(1).strip()
    m = re.search(r"\*\*Keyword Principal:\*\*\s*`?([^`\n]+)`?", body)
    if m:
        meta.primary_keyword = m.group(1).strip()
    section = re.search(r"Enlazado Interno Sugerido\s*\n(.+?)(?:\n---|\n###|\Z)", body, re.S)
    if section:
        meta.prerequisites = re.findall(r"post-\d+", section.group(1))
    return meta
```

- [ ] **Step 6: Add `_resolve_cross_links_by_issue` to `main.py`**

Add after `_resolve_cross_links`:

```python
def _resolve_cross_links_by_issue(
    related_posts: list[int], existing_slugs: dict[int, str]
) -> dict:
    links: dict = {}
    for issue_num in related_posts:
        slug = existing_slugs.get(issue_num)
        if slug:
            links[issue_num] = {"title": slug, "url": f"/blog/{slug}"}
        else:
            links[issue_num] = {"title": str(issue_num), "url": None}
    return links
```

- [ ] **Step 7: Update `main()` to use new cross-link resolution**

In the `main()` function, replace the cross-link block:

```python
# Before: always used _resolve_cross_links(metadata.prerequisites, existing_post_slugs)
# After:
existing_slugs = _get_existing_slugs(blog_output_dir)
existing_post_slugs = _get_existing_post_slugs(blog_output_dir)

if metadata.related_posts:
    cross_links = _resolve_cross_links_by_issue(metadata.related_posts, existing_slugs)
else:
    # Legacy fallback: resolve by post-XXX id
    cross_links = _resolve_cross_links(metadata.prerequisites, existing_post_slugs)
```

- [ ] **Step 8: Run tests to verify they pass**

```bash
cd /Users/eugenio/conductor/workspaces/web/regina && .venv/bin/pytest tests/blog_pipeline/test_main.py -v
```

Expected: all pass, including existing tests.

- [ ] **Step 9: Create `.github/ISSUE_TEMPLATE/blog-post.yml`**

```yaml
name: Blog Post
description: Proponer un artículo de blog para Alimentos New York
labels: ["blog-post-idea"]
body:
  - type: markdown
    attributes:
      value: |
        Completa todos los campos. El bloque `Metadata` debe ser YAML válido — no cambies los nombres de los campos.
  - type: textarea
    id: metadata
    attributes:
      label: Metadata
      render: yaml
      description: Metadatos estructurados del artículo.
      value: |
        post_id: post-XXX           # Reemplaza XXX con el número secuencial
        week: 1                     # Semana de publicación (1-52)
        scheduled_date: "YYYY-MM-DD"
        pilar: "Panadería & Tendencias Gastronómicas"
        audience: "b2b"             # b2b | b2c | ambos
        primary_keyword: "keyword principal en español"
        tags: []                    # ["etiqueta1", "etiqueta2"]
        image_url: null             # /productos/imagen.jpg si el asset ya existe; null si no
        image_brief: "Descripción de la foto ideal para este artículo"
        related_posts: []           # Números de issue relacionados: [17, 28]
    validations:
      required: true
  - type: textarea
    id: resumen
    attributes:
      label: Resumen Ejecutivo
      description: Ángulo editorial, objetivo del artículo y contexto comercial (1-3 párrafos).
    validations:
      required: true
  - type: textarea
    id: contexto
    attributes:
      label: Contexto Adicional
      description: Restricciones, ideas adicionales, o notas para el generador. Opcional.
    validations:
      required: false
```

- [ ] **Step 10: Commit**

```bash
git add requirements.txt scripts/blog_pipeline/context.py scripts/blog_pipeline/main.py tests/blog_pipeline/test_main.py .github/ISSUE_TEMPLATE/blog-post.yml
git commit -m "feat: YAML-first issue parser with GH issue form template"
```

---

## Task 2: Enrich Brief with Image Metadata from Issue

**Files:**
- Modify: `scripts/blog_pipeline/step_01_enrich.py`
- Modify: `tests/blog_pipeline/test_step_01.py`

**Interfaces:**
- Consumes: `IssueMetadata.image_url`, `IssueMetadata.image_brief` (from Task 1)
- Produces: `brief["metadata"]["image_url"]` and `brief["metadata"]["image_brief"]` — consumed by step_03 outline

- [ ] **Step 1: Write failing test**

Add to `tests/blog_pipeline/test_step_01.py`:

```python
def test_run_includes_image_metadata_in_brief(ctx):
    ctx.metadata.image_url = "/productos/pan-brioche.jpg"
    ctx.metadata.image_brief = "Pan brioche cortado mostrando la miga"
    with patch("scripts.blog_pipeline.step_01_enrich.fetch_top_queries", return_value=[]):
        brief = run(ctx, cross_links={})
    assert brief["metadata"]["image_url"] == "/productos/pan-brioche.jpg"
    assert brief["metadata"]["image_brief"] == "Pan brioche cortado mostrando la miga"

def test_run_image_metadata_none_when_not_set(ctx):
    with patch("scripts.blog_pipeline.step_01_enrich.fetch_top_queries", return_value=[]):
        brief = run(ctx, cross_links={})
    assert brief["metadata"]["image_url"] is None
    assert brief["metadata"]["image_brief"] is None
```

- [ ] **Step 2: Run to verify failure**

```bash
cd /Users/eugenio/conductor/workspaces/web/regina && .venv/bin/pytest tests/blog_pipeline/test_step_01.py::test_run_includes_image_metadata_in_brief tests/blog_pipeline/test_step_01.py::test_run_image_metadata_none_when_not_set -v
```

Expected: FAIL (KeyError on `brief["metadata"]["image_url"]`).

- [ ] **Step 3: Update `step_01_enrich.py` brief dict**

In `run()`, find the `"metadata": { ... }` block inside `brief` and add the two new fields:

```python
"metadata": {
    "post_id": ctx.metadata.post_id,
    "week": ctx.metadata.week,
    "scheduled_date": ctx.metadata.scheduled_date,
    "pilar": ctx.metadata.pilar,
    "audience": ctx.metadata.audience,
    "primary_keyword": ctx.metadata.primary_keyword,
    "tags": ctx.metadata.tags,
    "image_url": ctx.metadata.image_url,         # NEW
    "image_brief": ctx.metadata.image_brief,     # NEW
},
```

- [ ] **Step 4: Run tests to verify pass**

```bash
cd /Users/eugenio/conductor/workspaces/web/regina && .venv/bin/pytest tests/blog_pipeline/test_step_01.py -v
```

Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add scripts/blog_pipeline/step_01_enrich.py tests/blog_pipeline/test_step_01.py
git commit -m "feat: include image_url and image_brief from issue metadata in brief"
```

---

## Task 3: Content Quality — Tighter Prose, No Hallucinations, Image Briefs at End

**Files:**
- Modify: `scripts/blog_pipeline/step_03_outline.py`
- Modify: `scripts/blog_pipeline/step_04_content.py`
- Modify: `scripts/blog_pipeline/step_05_review.py`
- Modify: `tests/blog_pipeline/test_step_03.py`
- Modify: `tests/blog_pipeline/test_step_04.py`
- Modify: `tests/blog_pipeline/test_step_05.py`

**Interfaces:**
- Consumes: `brief["metadata"]["image_url"]`, `brief["metadata"]["image_brief"]` (from Task 2)
- Produces: `outline["sections"][n]["word_budget"]` (int, default 180) — consumed by step_04
- Produces: draft with NO inline `<!-- IMAGE_BRIEF: ... -->` comments; instead a single trailing `<!-- IMAGE BRIEFS\n...\n-->` block
- Produces: reviewer prompt checks for repetition and fabricated testimonials

- [ ] **Step 1: Write failing test for outline word_budget field**

In `tests/blog_pipeline/test_step_03.py`, add:

```python
def test_outline_sections_have_word_budget(mock_ctx):
    # Each section returned by the outline must have a word_budget integer
    import json
    outline_json = {
        "slug": "test-slug",
        "sections": [
            {
                "h2": "Sección 1",
                "audience": "b2b",
                "keyword_to_hit": "test",
                "products_to_mention": [],
                "h3s": [],
                "image_slot": None,
                "internal_links": [],
                "word_budget": 180
            }
        ],
        "closing_cta": {"consumer": "Cta consumer", "b2b": "Cta b2b"}
    }
    with patch("scripts.blog_pipeline.step_03_outline._call_llm", return_value=outline_json):
        result = run(mock_ctx, brief={
            "issue_title": "Test",
            "matched_products": [],
            "matched_kb_sections": [],
        }, keywords={
            "primary_keyword": "test",
            "secondary_keywords": [],
            "audience_segments": ["b2b"],
            "geo_answer": "Test answer.",
        })
    assert all("word_budget" in s for s in result["sections"])
    assert result["sections"][0]["word_budget"] == 180
```

- [ ] **Step 2: Write failing test for image-brief trailing block**

In `tests/blog_pipeline/test_step_04.py`, add:

```python
def test_lifestyle_image_brief_goes_to_trailing_block(ctx):
    outline_with_lifestyle = {
        "slug": "test-slug",
        "sections": [
            {
                "h2": "Sección principal",
                "audience": "ambos",
                "keyword_to_hit": "test kw",
                "products_to_mention": [],
                "h3s": [],
                "image_slot": {"type": "lifestyle", "brief": "Foto de una panadería artesanal"},
                "internal_links": [],
                "word_budget": 180,
            }
        ],
        "closing_cta": {"consumer": "Visítanos", "b2b": "Contáctanos"},
    }
    with patch("scripts.blog_pipeline.step_04_content._generate_section", return_value="## Sección principal\n\nTexto."):
        draft = run(ctx, SAMPLE_BRIEF, outline_with_lifestyle)

    # Old inline format must not appear anywhere
    assert "<!-- IMAGE_BRIEF:" not in draft
    # New trailing comment block must appear
    assert "<!-- IMAGE BRIEFS" in draft
    assert "Foto de una panadería artesanal" in draft

def test_issue_image_brief_used_as_lifestyle_slot(ctx):
    """When brief has image_brief from issue, step_04 must use it as the lifestyle brief."""
    brief_with_issue_image = dict(SAMPLE_BRIEF)
    brief_with_issue_image["metadata"] = {
        **SAMPLE_BRIEF.get("metadata", {}),
        "image_url": None,
        "image_brief": "Brioche dorado recién horneado sobre tabla de madera",
    }
    outline_no_slot = {
        "slug": "test",
        "sections": [
            {
                "h2": "Sección",
                "audience": "b2b",
                "keyword_to_hit": "kw",
                "products_to_mention": [],
                "h3s": [],
                "image_slot": None,
                "internal_links": [],
                "word_budget": 180,
            }
        ],
        "closing_cta": {"consumer": "A", "b2b": "B"},
    }
    with patch("scripts.blog_pipeline.step_04_content._generate_section", return_value="## Sección\n\nTexto."):
        draft = run(ctx, brief_with_issue_image, outline_no_slot)
    assert "Brioche dorado recién horneado sobre tabla de madera" in draft
    assert "<!-- IMAGE BRIEFS" in draft
```

- [ ] **Step 3: Run to verify failure**

```bash
cd /Users/eugenio/conductor/workspaces/web/regina && .venv/bin/pytest tests/blog_pipeline/test_step_03.py::test_outline_sections_have_word_budget tests/blog_pipeline/test_step_04.py::test_lifestyle_image_brief_goes_to_trailing_block tests/blog_pipeline/test_step_04.py::test_issue_image_brief_used_as_lifestyle_slot -v
```

Expected: FAIL.

- [ ] **Step 4: Update `step_03_outline.py` — word budget + no testimonials**

In `_call_llm`, update the `prompt` to add word budgets and anti-testimonial instruction:

```python
prompt = (
    f"Crea el esquema (outline) del artículo en JSON.\n\n"
    f"Título del artículo: {brief['issue_title']}\n"
    f"Keyword principal: {keywords['primary_keyword']}\n"
    f"Keywords secundarias: {', '.join(keywords.get('secondary_keywords', []))}\n"
    f"Segmentos de audiencia: {audiences}\n"
    f"Respuesta GEO (va al inicio): {keywords['geo_answer']}\n\n"
    f"Productos disponibles para mencionar:\n{products_list or 'Ninguno'}\n\n"
    f"Secciones de KB de empresa disponibles:\n{kb_list or 'Ninguna'}\n\n"
    "INSTRUCCIONES:\n"
    "- El primer H2 introduce la respuesta GEO directa al inicio del artículo.\n"
    "- Cada H2 tiene exactamente un campo 'audience': 'consumidor', 'b2b' o 'ambos'.\n"
    "- Si el artículo tiene dos audiencias, alterna secciones o crea un bloque B2B explícito.\n"
    "- El cierre (closing_cta) siempre tiene 'consumer' y 'b2b' separados.\n"
    "- image_slot: {'type': 'product', 'product_id': '...'} si el producto tiene imagen, "
    "{'type': 'lifestyle', 'brief': 'descripción en español de la foto ideal'} si no, o null.\n"
    "- word_budget: número de palabras objetivo para esa sección H2 (incluyendo sus H3). "
    "Máximo 180 palabras por sección. Primer H2 (GEO intro): 80 palabras. "
    "Si solo hay 1 sección de contenido, 250 palabras.\n"
    "- PROHIBIDO: Incluir secciones de 'testimonios', 'opiniones de clientes', o 'reseñas'. "
    "No cites ni inventes testimonios. No uses frases como 'según nuestros clientes' o similares.\n"
    "- PROHIBIDO: Más de 4 secciones H2 en total (incluyendo intro GEO). "
    "Artículos de 3 secciones son preferidos.\n\n"
    "Devuelve ÚNICAMENTE este JSON:\n"
    "{\n"
    '  "slug": "slug-en-minusculas-con-guiones",\n'
    '  "sections": [\n'
    '    {\n'
    '      "h2": "Título de sección en español",\n'
    '      "audience": "consumidor|b2b|ambos",\n'
    '      "keyword_to_hit": "frase a incluir en esta sección",\n'
    '      "products_to_mention": ["product-id"],\n'
    '      "h3s": ["Subtítulo 1", "Subtítulo 2"],\n'
    '      "image_slot": null,\n'
    '      "internal_links": ["/ruta/"],\n'
    '      "word_budget": 180\n'
    "    }\n"
    "  ],\n"
    '  "closing_cta": {"consumer": "texto CTA consumidor", "b2b": "texto CTA B2B"}\n'
    "}"
)
```

In `_validate_outline`, add:

```python
def _validate_outline(data: dict) -> None:
    if not data.get("sections"):
        raise ValueError("Outline must have at least one section")
    if not data.get("slug"):
        raise ValueError("Outline must have a slug")
    cta = data.get("closing_cta", {})
    if not cta.get("consumer") or not cta.get("b2b"):
        raise ValueError("Outline closing_cta must have non-empty 'consumer' and 'b2b' keys")
    for section in data["sections"]:
        if "word_budget" not in section:
            section["word_budget"] = 180  # default if LLM omits it
```

- [ ] **Step 5: Update `step_04_content.py` — word budget in prompt + trailing image block**

Replace `run()` entirely:

```python
def run(ctx: PipelineContext, brief: dict, outline: dict) -> str:
    output_path = ctx.checkpoint_dir / "04_draft.md"
    if output_path.exists() and (ctx.force_step is None or ctx.force_step > 4):
        return output_path.read_text(encoding="utf-8")

    products_by_id = {p["id"]: p for p in brief.get("matched_products", [])}
    parts = []
    image_briefs: list[dict] = []

    for section in outline["sections"]:
        section_products = [
            products_by_id[pid]
            for pid in section.get("products_to_mention", [])
            if pid in products_by_id
        ]
        section_md = _generate_section(ctx, section, section_products, brief.get("matched_kb_sections", []))

        image_slot = section.get("image_slot")
        if image_slot and image_slot.get("type") == "product":
            product_id = image_slot.get("product_id", "")
            product = products_by_id.get(product_id)
            if product and product.get("imagen"):
                img_path = f"/productos/{product['imagen']}"
                img_alt = product.get("title", product_id)
                section_md += f"\n\n![{img_alt}]({img_path})"
        elif image_slot and image_slot.get("type") == "lifestyle":
            image_briefs.append({
                "section": section["h2"],
                "brief": image_slot["brief"],
            })

        parts.append(section_md)

    cta = outline.get("closing_cta", {})
    closing = (
        "\n\n---\n\n"
        f"**Para consumidores:** {cta.get('consumer', '')}\n\n"
        f"**Para negocios:** {cta.get('b2b', '')}"
    )
    parts.append(closing)

    # Append image from issue metadata if no product image was embedded and no lifestyle slots
    issue_image_brief = brief.get("metadata", {}).get("image_brief")
    issue_image_url = brief.get("metadata", {}).get("image_url")
    if issue_image_url:
        # A real asset exists: embed it in the first section
        post_title = outline["sections"][0]["h2"] if outline["sections"] else "Post"
        parts[0] += f"\n\n![{post_title}]({issue_image_url})"
    elif issue_image_brief and not image_briefs:
        # No asset, but issue has an image description: use it as a lifestyle brief
        image_briefs.append({
            "section": outline["sections"][0]["h2"] if outline["sections"] else "Post",
            "brief": issue_image_brief,
        })

    # Trailing comment block with all lifestyle image briefs
    if image_briefs:
        brief_lines = ["<!-- IMAGE BRIEFS"]
        for ib in image_briefs:
            brief_lines.append(f"  Section: {ib['section']}")
            brief_lines.append(f"  Brief:   {ib['brief']}")
        brief_lines.append("-->")
        parts.append("\n".join(brief_lines))

    draft = "\n\n".join(parts)
    output_path.write_text(draft, encoding="utf-8")
    return draft
```

Update `_generate_section` to use `word_budget`:

```python
def _generate_section(ctx: PipelineContext, section: dict, products: list[dict], kb_sections: list[dict]) -> str:
    h3s_text = "\n".join(f"  - ### {h}" for h in section.get("h3s", []))
    products_text = "\n".join(
        f"- **{p['title']}**: {p['body'][:300]}" for p in products
    ) or "Sin productos específicos para esta sección."
    kb_text = "\n".join(
        f"[{s['title']}]: {s['excerpt']}" for s in kb_sections[:3]
    ) or ""
    audience_map = {
        "consumidor": "tono cálido y cercano",
        "b2b": "tono profesional y directo",
        "ambos": "equilibra ambos tonos",
    }
    tone = audience_map.get(section.get("audience", "ambos"), "equilibra ambos tonos")
    word_budget = section.get("word_budget", 180)

    prompt = (
        f"Escribe la sección del artículo con este encabezado H2: {section['h2']}\n\n"
        f"Subtítulos H3 a desarrollar:\n{h3s_text or '(sin subtítulos, desarrolla en párrafos)'}\n\n"
        f"Keyword a incluir naturalmente: {section.get('keyword_to_hit', '')}\n"
        f"Tono: {tone}\n"
        f"Límite de palabras: {word_budget} palabras para esta sección completa. "
        f"Sé conciso y directo. No rellenes con frases genéricas.\n\n"
        f"Datos de productos (cita SÓLO estos):\n{products_text}\n\n"
        f"Contexto de empresa:\n{kb_text}\n\n"
        "REGLAS:\n"
        "- Empieza directamente con el encabezado ## (no con H1).\n"
        "- No añadas frontmatter.\n"
        "- Escribe en prosa fluida en español. Evita listas largas.\n"
        "- No inventes datos, precios, ni testimonios que no estén en los datos de producto.\n"
        "- No repitas información que ya aparece en el título del artículo.\n"
        "- No uses frases de relleno como 'En conclusión', 'En resumen', 'Sin duda alguna'."
    )

    client = OpenAI(api_key=ctx.ai_api_key, base_url=ctx.ai_base_url or "https://api.openai.com/v1")
    response = client.chat.completions.create(
        model=ctx.ai_model,
        messages=[{"role": "system", "content": _SYSTEM}, {"role": "user", "content": prompt}],
        temperature=0.7,
    )
    return response.choices[0].message.content.strip()
```

- [ ] **Step 6: Update `step_05_review.py` — add repetition and fabrication checks**

In `_call_reviewer`, update the `prompt` to add two new checks:

```python
prompt = (
    f"Revisa el siguiente artículo de blog en español.\n\n"
    f"Keyword principal a verificar: '{primary_kw}'\n"
    f"Respuesta GEO que debe aparecer al inicio: '{geo_answer}'\n"
    f"Audiencias requeridas: {audiences}\n\n"
    f"ARTÍCULO:\n{draft}\n\n"
    "Verifica (devuelve problemas sólo si están presentes):\n"
    "1. La keyword principal aparece en los primeros 100 caracteres Y en al menos 2 encabezados H2.\n"
    "2. La respuesta GEO (o paráfrasis cercana) aparece en el primer párrafo.\n"
    "3. No hay datos de producto inventados (precios, especificaciones no proporcionadas).\n"
    "4. No hay testimonios inventados, citas de clientes o frases como 'según nuestros clientes'.\n"
    "5. El español es fluido y natural, sin anglicismos innecesarios.\n"
    "6. Si se requieren dos audiencias, ambas están representadas.\n"
    "7. No hay repetición de ideas entre secciones H2 — cada sección aporta información nueva.\n"
    "8. Hay un CTA al final con secciones separadas para consumidor y B2B.\n\n"
    "Devuelve ÚNICAMENTE este JSON:\n"
    "{\n"
    '  "pass": true|false,\n'
    '  "issues": [\n'
    '    {"section": "nombre del H2 afectado o \\"global\\"", "problem": "descripción concisa", "suggestion": "cómo corregirlo"}\n'
    "  ],\n"
    '  "polished": "artículo completo corregido si hay problemas menores de redacción (null si pass=true)"\n'
    "}"
)
```

- [ ] **Step 7: Run all affected tests**

```bash
cd /Users/eugenio/conductor/workspaces/web/regina && .venv/bin/pytest tests/blog_pipeline/test_step_03.py tests/blog_pipeline/test_step_04.py tests/blog_pipeline/test_step_05.py -v
```

Expected: all pass.

- [ ] **Step 8: Commit**

```bash
git add scripts/blog_pipeline/step_03_outline.py scripts/blog_pipeline/step_04_content.py scripts/blog_pipeline/step_05_review.py tests/blog_pipeline/test_step_03.py tests/blog_pipeline/test_step_04.py tests/blog_pipeline/test_step_05.py
git commit -m "feat: tighter prose budgets, no-testimonial rule, image briefs in trailing comment block"
```

---

## Task 4: Article Structured Data for Blog Posts

**Files:**
- Modify: `src/utils/generateProductMetadata.ts`
- Modify: `src/components/StructuredData.astro`
- Modify: `src/pages/blog/[slug].astro`

**Interfaces:**
- Produces: `generateArticleSchema(article, baseUrl) => string` — JSON-LD `Article` type
- Consumes: Astro blog post `data` fields: `title`, `description`, `pubDate`, `author`, `ogImage`

No unit tests for TypeScript/Astro (no test infra in this project for front-end). Manual verification: run `bun run build` and inspect the rendered HTML for `<script type="application/ld+json">` with `@type: Article`.

- [ ] **Step 1: Add `generateArticleSchema` to `src/utils/generateProductMetadata.ts`**

Append after `generateBreadcrumbSchema`:

```typescript
export interface ArticleSchemaInput {
  title: string;
  description: string;
  pubDate: Date;
  author: string;
  url: string;
  imageUrl?: string;
}

export function generateArticleSchema(
  article: ArticleSchemaInput,
  baseUrl: string
): string {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.description,
    datePublished: article.pubDate.toISOString(),
    author: {
      '@type': 'Person',
      name: article.author,
    },
    publisher: {
      '@type': 'Organization',
      name: COMPANY.name,
      logo: {
        '@type': 'ImageObject',
        url: `${baseUrl}${COMPANY.logo}`,
      },
    },
    url: article.url,
    ...(article.imageUrl && {
      image: article.imageUrl.startsWith('http')
        ? article.imageUrl
        : `${baseUrl}${article.imageUrl}`,
    }),
  };
  return JSON.stringify(schema);
}
```

- [ ] **Step 2: Add `article` type to `src/components/StructuredData.astro`**

In the `Props` interface, add `article?: ArticleSchemaInput` and `'article'` to the `type` union:

```astro
---
import {
  generateProductSchema,
  generateBreadcrumbSchema,
  generateLocalBusinessSchema,
  generateFaqSchema,
  generateArticleSchema,
} from '../utils/generateProductMetadata';
import type { Producto, ArticleSchemaInput } from '../utils/generateProductMetadata';
import { COMPANY } from '../data/company';

interface Props {
  producto?: Producto;
  breadcrumbs?: Array<{ name: string; url: string }>;
  faqs?: Array<{ pregunta: string; respuesta: string }>;
  article?: ArticleSchemaInput;
  type?: 'product' | 'breadcrumb' | 'organization' | 'faq' | 'article';
  imageUrl?: string;
}

const { producto, breadcrumbs, faqs, article, type = 'product', imageUrl } = Astro.props;
const baseUrl = Astro.url.origin;

let schema = '';

if (type === 'product' && producto) {
  schema = generateProductSchema(producto, baseUrl, undefined, imageUrl);
} else if (type === 'breadcrumb' && breadcrumbs) {
  schema = generateBreadcrumbSchema(breadcrumbs, baseUrl);
} else if (type === 'organization') {
  const contact = {
    phone: import.meta.env.PUBLIC_WHATSAPP_NUMBER,
    email: import.meta.env.PUBLIC_CONTACT_EMAIL
  };
  schema = generateLocalBusinessSchema(baseUrl, contact);
} else if (type === 'faq' && faqs) {
  schema = generateFaqSchema(faqs, baseUrl);
} else if (type === 'article' && article) {
  schema = generateArticleSchema(article, baseUrl);
}
---

{schema && (
  <script type="application/ld+json" set:html={schema} />
)}
```

- [ ] **Step 3: Update `src/pages/blog/[slug].astro` to include Article schema**

Replace the current `<BaseLayout>` call and add the Article `StructuredData`:

```astro
---
import { getCollection, render } from 'astro:content';
import BaseLayout from '../../layouts/BaseLayout.astro';
import StructuredData from '../../components/StructuredData.astro';
import type { ArticleSchemaInput } from '../../utils/generateProductMetadata';

export async function getStaticPaths() {
  const posts = await getCollection('blog', ({ data }) => !data.draft);
  return posts.map((post) => ({
    params: { slug: post.id },
    props: { post },
  }));
}

const { post } = Astro.props;
const { Content } = await render(post);

const dateFormatter = new Intl.DateTimeFormat('es-VE', { dateStyle: 'long' });

const breadcrumbs = [
  { name: 'Inicio', url: '/' },
  { name: 'Blog', url: '/blog/' },
  { name: post.data.title, url: `/blog/${post.id}/` },
];

const articleSchema: ArticleSchemaInput = {
  title: post.data.title,
  description: post.data.description,
  pubDate: post.data.pubDate,
  author: post.data.author ?? 'eugenio',
  url: `/blog/${post.id}/`,
  imageUrl: post.data.ogImage,
};
---

<BaseLayout
  title={post.data.title}
  description={post.data.description}
  image={post.data.ogImage}
  type="article"
>
  <StructuredData breadcrumbs={breadcrumbs} type="breadcrumb" />
  <StructuredData article={articleSchema} type="article" />

  <article class="post-detail">
  <!-- rest of existing template unchanged -->
```

Note: the closing `</article>`, styles, and the rest of the template remain exactly as they are. Only the frontmatter and the opening `<BaseLayout>` + new `<StructuredData>` line change.

- [ ] **Step 4: Verify build passes**

```bash
cd /Users/eugenio/conductor/workspaces/web/regina && bun run build 2>&1 | tail -20
```

Expected: no TypeScript errors, build succeeds. If `ogImage` is not in the blog collection schema, it'll be `undefined` (that's fine — the `...(article.imageUrl && {...})` guard handles it).

- [ ] **Step 5: Commit**

```bash
git add src/utils/generateProductMetadata.ts src/components/StructuredData.astro src/pages/blog/\[slug\].astro
git commit -m "feat: add Article JSON-LD structured data to blog posts"
```

---

## Task 5: Sitemap + Robots.txt Fixes

**Files:**
- Modify: `src/pages/sitemap.xml.ts`
- Modify: `public/robots.txt`

No unit tests — verified by inspecting the generated `sitemap.xml` output during `bun run build`.

- [ ] **Step 1: Fix `public/robots.txt`**

Change line:
```
Sitemap: https://alimentosnewyork.com/sitemap.xml
```
to:
```
Sitemap: https://www.alimentosnewyork.com/sitemap.xml
```

- [ ] **Step 2: Add blog posts to `src/pages/sitemap.xml.ts`**

Replace the file content:

```typescript
import productosData from '../data/productos.json';
import { getCollection } from 'astro:content';

export async function GET() {
  const baseUrl = 'https://www.alimentosnewyork.com';

  const staticRoutes = [
    { url: '/', priority: '1.0', changefreq: 'weekly' },
    { url: '/catalogo/', priority: '0.9', changefreq: 'weekly' },
    { url: '/blog/', priority: '0.8', changefreq: 'daily' },
    { url: '/sobre-nosotros/', priority: '0.7', changefreq: 'monthly' },
    { url: '/contacto/', priority: '0.8', changefreq: 'monthly' },
    { url: '/solicitar-llamada/', priority: '0.7', changefreq: 'monthly' },
  ];

  const productRoutes = productosData.productos.map((producto) => ({
    url: `/productos/${producto.id}/`,
    priority: '0.8',
    changefreq: 'monthly',
    lastmod: undefined as string | undefined,
  }));

  const blogPosts = await getCollection('blog', ({ data }) => !data.draft);
  const blogRoutes = blogPosts.map((post) => ({
    url: `/blog/${post.id}/`,
    priority: '0.7',
    changefreq: 'monthly',
    lastmod: post.data.pubDate.toISOString().split('T')[0],
  }));

  const allRoutes = [...staticRoutes, ...productRoutes, ...blogRoutes];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allRoutes
  .map(
    (route) => `  <url>
    <loc>${baseUrl}${route.url}</loc>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>${
      'lastmod' in route && route.lastmod
        ? `\n    <lastmod>${route.lastmod}</lastmod>`
        : ''
    }
  </url>`
  )
  .join('\n')}
</urlset>`;

  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml' },
  });
}
```

- [ ] **Step 3: Verify build and sitemap output**

```bash
cd /Users/eugenio/conductor/workspaces/web/regina && bun run build 2>&1 | tail -10
```

Then check the generated sitemap:
```bash
grep "/blog/" /Users/eugenio/conductor/workspaces/web/regina/dist/sitemap.xml | head -10
```

Expected: blog post URLs appear in the sitemap.

- [ ] **Step 4: Commit**

```bash
git add src/pages/sitemap.xml.ts public/robots.txt
git commit -m "fix: add blog posts to sitemap, correct robots.txt sitemap URL to www"
```

---

## Task 6: Issue Migration Script

This is a one-off helper — run it manually, review the diffs in GH, then delete the script.

**Files:**
- Create: `scripts/migrate_issues.py`

- [ ] **Step 1: Create migration script**

```python
#!/usr/bin/env python3
"""
One-off script: rewrites existing GH blog post issues to the new YAML format.
Run with: python scripts/migrate_issues.py --dry-run   (preview only)
           python scripts/migrate_issues.py             (actually update issues)

Review all changes in GH before merging any PRs that depend on the new format.
Delete this script after migration is complete.
"""
import os
import re
import sys
import argparse
import yaml
from github import Github
import dotenv

dotenv.load_dotenv()

_POST_ID_RE = re.compile(r"\*\*ID:\*\*\s*`?([\w-]+)`?")
_WEEK_RE = re.compile(r"\*\*Semana:\*\*\s*(\d+)")
_DATE_RE = re.compile(r"\*\*Fecha sugerida:\*\*\s*(\d{4}-\d{2}-\d{2})")
_PILAR_RE = re.compile(r"\*\*Pilar:\*\*\s*(.+)")
_AUDIENCE_RE = re.compile(r"\*\*Audiencia:\*\*\s*(.+)")
_KEYWORD_RE = re.compile(r"\*\*Keyword Principal:\*\*\s*`?([^`\n]+)`?")
_IMAGE_TYPE_RE = re.compile(r"\*\*Tipo:\*\*\s*(.+)")
_IMAGE_DESC_RE = re.compile(r"\*\*Descripción:\*\*\s*(.+)")
_PREREQ_RE = re.compile(r"post-\d+")
_RESUMEN_RE = re.compile(r"###\s*Resumen Ejecutivo\s*\n(.+?)(?:\n---|\n###|\Z)", re.S)


def _parse_old_body(body: str) -> dict:
    def first(pattern):
        m = pattern.search(body)
        return m.group(1).strip() if m else None

    prereq_section = re.search(r"Enlazado Interno Sugerido\s*\n(.+?)(?:\n---|\n###|\Z)", body, re.S)
    prereqs = _PREREQ_RE.findall(prereq_section.group(1)) if prereq_section else []

    resumen_m = _RESUMEN_RE.search(body)
    resumen = resumen_m.group(1).strip() if resumen_m else ""

    return {
        "post_id": first(_POST_ID_RE),
        "week": int(first(_WEEK_RE)) if first(_WEEK_RE) else None,
        "scheduled_date": first(_DATE_RE),
        "pilar": first(_PILAR_RE),
        "audience": first(_AUDIENCE_RE),
        "primary_keyword": first(_KEYWORD_RE),
        "image_brief": first(_IMAGE_DESC_RE),
        "prerequisites": prereqs,
        "resumen": resumen,
    }


def _build_new_body(data: dict) -> str:
    meta = {
        "post_id": data["post_id"] or "post-XXX",
        "week": data["week"] or 0,
        "scheduled_date": data["scheduled_date"] or "YYYY-MM-DD",
        "pilar": data["pilar"] or "",
        "audience": data["audience"] or "ambos",
        "primary_keyword": data["primary_keyword"] or "",
        "tags": [],
        "image_url": None,
        "image_brief": data["image_brief"] or "",
        "related_posts": [],  # can't auto-resolve post-XXX → issue# without a lookup table
    }
    # Emit with block-style for readability
    meta_yaml = yaml.dump(meta, allow_unicode=True, default_flow_style=False, sort_keys=False)

    resumen = data["resumen"] or "_Sin resumen ejecutivo._"

    # Note any old prerequisites so the author can manually fill related_posts
    prereq_note = ""
    if data["prerequisites"]:
        ids = ", ".join(data["prerequisites"])
        prereq_note = f"\n\n> **Nota migración:** `related_posts` no pudo resolverse automáticamente. "
        prereq_note += f"Posts relacionados originales: {ids}. Actualiza `related_posts` con los números de issue correctos."

    return f"""### Metadata

```yaml
{meta_yaml.rstrip()}
```

### Resumen Ejecutivo

{resumen}{prereq_note}
"""


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true", help="Print changes without updating issues")
    args = parser.parse_args()

    token = os.getenv("GITHUB_TOKEN")
    repo_name = os.getenv("GITHUB_REPO", "new-york-venezuela/web")
    if not token:
        print("ERROR: GITHUB_TOKEN required")
        sys.exit(1)

    gh = Github(token)
    repo = gh.get_repo(repo_name)
    issues = list(repo.get_issues(state="open", labels=["blog-post-idea"]))
    print(f"Found {len(issues)} issues to migrate.")

    for issue in issues:
        body = issue.body or ""
        # Skip already-migrated issues (have YAML block)
        if "```yaml" in body:
            print(f"  #{issue.number} already in new format, skipping.")
            continue

        data = _parse_old_body(body)
        new_body = _build_new_body(data)

        print(f"\n--- Issue #{issue.number}: {issue.title[:60]} ---")
        print(new_body[:400])

        if not args.dry_run:
            issue.edit(body=new_body)
            print(f"  Updated #{issue.number}")
        else:
            print("  [DRY RUN — not updated]")

    print("\nDone.")


if __name__ == "__main__":
    main()
```

- [ ] **Step 2: Dry-run the script**

```bash
cd /Users/eugenio/conductor/workspaces/web/regina && .venv/bin/python scripts/migrate_issues.py --dry-run 2>&1 | head -100
```

Review the output. Verify the YAML looks correct for at least 3 issues (check post_id, scheduled_date, primary_keyword, image_brief).

- [ ] **Step 3: Run migration**

Only run after verifying dry-run output looks correct:

```bash
cd /Users/eugenio/conductor/workspaces/web/regina && .venv/bin/python scripts/migrate_issues.py
```

- [ ] **Step 4: Verify on GitHub**

Open 3–4 issues in GH and confirm:
- The YAML block renders with syntax highlighting
- `post_id`, `scheduled_date`, `primary_keyword`, `image_brief` are populated
- A "Nota migración" note appears where `related_posts` couldn't be auto-resolved
- Update `related_posts` manually on issues where you know the related issue numbers

- [ ] **Step 5: Commit the migration script (for audit trail), then delete it**

```bash
git add scripts/migrate_issues.py
git commit -m "chore: add one-off issue migration script (run and delete)"
# After successful migration:
git rm scripts/migrate_issues.py
git commit -m "chore: remove migration script after use"
```
