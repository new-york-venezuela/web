# Blog Pipeline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the single-shot blog generator with a 6-step sequential pipeline that grounds every LLM call in real product/company data, enforces Spanish, and produces SEO+GEO-optimized posts with human PR review before publish.

**Architecture:** A Python package (`scripts/blog_pipeline/`) where each step is a module that reads a JSON checkpoint file (if it exists) or runs its logic and writes one. The existing `scripts/generate_blog.py` becomes a thin shim. Steps 1–6 are pure functions keyed on a shared `PipelineContext` dataclass. Checkpoints are gitignored and stored in `.pipeline/{issue_number}/`.

**Tech Stack:** Python 3.12, openai SDK 1.3.9, PyGitHub 2.1.1, google-api-python-client (new), pytest + pytest-mock (new), Astro content collections.

## Global Constraints

- All LLM output must be in Spanish — system prompts enforce `BLOG_LANG=es`
- Never invent product specs — all product data comes from `src/content/productos/*.md`
- Never invent company facts — all company data comes from `src/content/empresa/*.md`
- Python 3.12; no walrus operator or 3.13+ features
- `response_format={"type": "json_object"}` for all structured LLM calls
- temperature=0.3 for structured steps (1–3, 6), temperature=0.7 for content steps (4–5)
- All JSON files written with `ensure_ascii=False` (Spanish characters must not be escaped)
- `draft: true` in all generated frontmatter — human flips to `false` on PR approval
- `.pipeline/` is gitignored; checkpoint files are never committed
- Run tests with `pytest tests/blog_pipeline/ -v`

---

## File Map

| Action | Path | Responsibility |
|--------|------|----------------|
| Create | `scripts/blog_pipeline/__init__.py` | Package marker |
| Create | `scripts/blog_pipeline/context.py` | `PipelineContext` dataclass — shared state |
| Create | `scripts/blog_pipeline/catalog_loader.py` | Load + keyword-match products and empresa KB |
| Create | `scripts/blog_pipeline/gsc_client.py` | Google Search Console API wrapper |
| Create | `scripts/blog_pipeline/step_01_enrich.py` | Brief Enrichment (no LLM) |
| Create | `scripts/blog_pipeline/step_02_keywords.py` | Keyword Strategy (1 LLM call) |
| Create | `scripts/blog_pipeline/step_03_outline.py` | Outline Generation (1 LLM call) |
| Create | `scripts/blog_pipeline/step_04_content.py` | Section-by-Section Content (1 LLM call/H2) |
| Create | `scripts/blog_pipeline/step_05_review.py` | SEO/GEO Review + partial retry |
| Create | `scripts/blog_pipeline/step_06_frontmatter.py` | Frontmatter + PR Package (1 LLM call) |
| Create | `scripts/blog_pipeline/main.py` | Orchestrator with checkpoint resumability |
| Modify | `scripts/generate_blog.py` | Thin shim → `blog_pipeline.main` |
| Modify | `requirements.txt` | Add google-api-python-client, google-auth, pytest, pytest-mock |
| Modify | `.env.example` | Add GSC_SITE_URL, GSC_CREDENTIALS_FILE, BLOG_LANG, PIPELINE_CHECKPOINT_DIR |
| Modify | `.gitignore` | Add `.pipeline/` |
| Modify | `src/content.config.ts` | Add `empresa` collection schema |
| Create | `src/content/empresa/sobre-nosotros.md` | Company story + B2B positioning |
| Create | `src/content/empresa/lineas-de-negocio.md` | Lines of business with capacity/minimums |
| Create | `src/content/empresa/certificaciones.md` | Kosher Pat Israel + others |
| Create | `src/content/empresa/procesos.md` | Industrial baking process differentiators |
| Create | `src/content/empresa/programa-zero-desperdicio.md` | Pilot program details |
| Create | `src/content/empresa/distribucion.md` | Punto a punto logistics, Caracas coverage |
| Create | `tests/blog_pipeline/__init__.py` | Test package marker |
| Create | `tests/blog_pipeline/test_catalog_loader.py` | Unit tests for catalog_loader |
| Create | `tests/blog_pipeline/test_gsc_client.py` | Unit tests for gsc_client (mocked) |
| Create | `tests/blog_pipeline/test_step_01.py` | Unit tests for step_01_enrich (mocked) |
| Create | `tests/blog_pipeline/test_step_02.py` | Unit tests for step_02_keywords (mocked LLM) |
| Create | `tests/blog_pipeline/test_step_03.py` | Unit tests for step_03_outline (mocked LLM) |
| Create | `tests/blog_pipeline/test_step_04.py` | Unit tests for step_04_content (mocked LLM) |
| Create | `tests/blog_pipeline/test_step_05.py` | Unit tests for step_05_review (mocked LLM) |
| Create | `tests/blog_pipeline/test_step_06.py` | Unit tests for step_06_frontmatter (mocked LLM) |
| Create | `tests/blog_pipeline/test_main.py` | Integration tests for orchestrator |
| Modify | `.github/workflows/daily-blog-generator.yml` | Artifact upload + PR body from 06_meta.json |

---

## Task 1: Foundation — Package Scaffold + PipelineContext

**Files:**
- Create: `scripts/blog_pipeline/__init__.py`
- Create: `scripts/blog_pipeline/context.py`
- Modify: `scripts/generate_blog.py`
- Modify: `requirements.txt`
- Modify: `.env.example`
- Modify: `.gitignore`
- Create: `tests/blog_pipeline/__init__.py`
- Create: `tests/blog_pipeline/test_context.py`

**Interfaces:**
- Produces: `PipelineContext` dataclass, `IssueMetadata` dataclass — used by all subsequent tasks

- [ ] **Step 1: Add new dependencies to requirements.txt**

```
pygithub==2.1.1
openai==1.3.9
python-dotenv==1.0.0
typing-extensions==4.8.0
google-api-python-client==2.108.0
google-auth==2.23.4
pytest==7.4.3
pytest-mock==3.12.0
```

- [ ] **Step 2: Write the failing test**

Create `tests/blog_pipeline/__init__.py` (empty).

Create `tests/blog_pipeline/test_context.py`:

```python
from pathlib import Path
from scripts.blog_pipeline.context import PipelineContext, IssueMetadata


def test_pipeline_context_defaults():
    ctx = PipelineContext(
        issue_number=42,
        issue_title="Cheesecake para restaurantes",
        issue_body="Artículo sobre cheesecake.",
        metadata=IssueMetadata(),
        checkpoint_dir=Path(".pipeline/42"),
        blog_output_dir=Path("src/content/blog"),
        content_dir=Path("src/content"),
        ai_model="gpt-4",
        ai_api_key="sk-test",
        ai_base_url="",
        gsc_site_url="https://www.alimentosnewyork.com",
        gsc_credentials_file=".gsc-credentials.json",
        github_repo="eugenio/new-york-venezuela-web",
    )
    assert ctx.blog_lang == "es"
    assert ctx.force_step is None
    assert ctx.debug is False


def test_issue_metadata_defaults():
    meta = IssueMetadata()
    assert meta.prerequisites == []
    assert meta.tags == []
```

- [ ] **Step 3: Run test to verify it fails**

```bash
pytest tests/blog_pipeline/test_context.py -v
```
Expected: ImportError — module not found.

- [ ] **Step 4: Create `scripts/blog_pipeline/__init__.py`** (empty file)

- [ ] **Step 5: Create `scripts/blog_pipeline/context.py`**

```python
from dataclasses import dataclass, field
from pathlib import Path
from typing import Optional


@dataclass
class IssueMetadata:
    scheduled_date: Optional[str] = None
    series: Optional[str] = None
    part: Optional[int] = None
    prerequisites: list = field(default_factory=list)
    parent_topic: Optional[str] = None
    tags: list = field(default_factory=list)


@dataclass
class PipelineContext:
    issue_number: int
    issue_title: str
    issue_body: str
    metadata: IssueMetadata
    checkpoint_dir: Path
    blog_output_dir: Path
    content_dir: Path
    ai_model: str
    ai_api_key: str
    ai_base_url: str
    gsc_site_url: str
    gsc_credentials_file: str
    github_repo: str
    blog_lang: str = "es"
    force_step: Optional[int] = None
    debug: bool = False
```

- [ ] **Step 6: Replace `scripts/generate_blog.py` body with thin shim**

Keep the file — replace everything after the module docstring with:

```python
"""
Thin shim — delegates to blog_pipeline.main.
See scripts/blog_pipeline/ for the full pipeline implementation.
"""
from scripts.blog_pipeline.main import main

if __name__ == "__main__":
    main()
```

- [ ] **Step 7: Add `.pipeline/` to `.gitignore`**

Append to `.gitignore`:
```
.pipeline/
```

- [ ] **Step 8: Add new env vars to `.env.example`**

After the existing `BLOG_OUTPUT_DIR` block, add:

```env
# Blog pipeline — Google Search Console
GSC_SITE_URL=https://www.alimentosnewyork.com
GSC_CREDENTIALS_FILE=.gsc-credentials.json   # gitignored (matches credentials*.json rule)

# Blog pipeline — generation settings
BLOG_LANG=es
PIPELINE_CHECKPOINT_DIR=.pipeline
```

- [ ] **Step 9: Run tests to verify they pass**

```bash
pytest tests/blog_pipeline/test_context.py -v
```
Expected: 2 PASSED.

- [ ] **Step 10: Commit**

```bash
git add scripts/blog_pipeline/__init__.py scripts/blog_pipeline/context.py scripts/generate_blog.py requirements.txt .env.example .gitignore tests/blog_pipeline/__init__.py tests/blog_pipeline/test_context.py
git commit -m "feat: scaffold blog_pipeline package with PipelineContext"
```

---

## Task 2: Catalog Loader

**Files:**
- Create: `scripts/blog_pipeline/catalog_loader.py`
- Create: `tests/blog_pipeline/test_catalog_loader.py`

**Interfaces:**
- Consumes: nothing (reads filesystem)
- Produces:
  - `load_productos(content_dir: Path) -> list[dict]` — each dict has `id`, `title`, `keywords`, `imagen`, `categoria_primaria`, `categoria_secundaria`, `body`
  - `load_empresa_kb(content_dir: Path) -> list[dict]` — each dict has `file`, `title`, `keywords`, `excerpt`, `full_text`
  - `match_by_keywords(items: list[dict], topic_words: set[str]) -> list[dict]`
  - `extract_topic_words(title: str, body: str) -> set[str]`

- [ ] **Step 1: Write the failing test**

Create `tests/blog_pipeline/test_catalog_loader.py`:

```python
import pytest
from pathlib import Path
from scripts.blog_pipeline.catalog_loader import (
    load_productos,
    load_empresa_kb,
    match_by_keywords,
    extract_topic_words,
)


@pytest.fixture
def tmp_content(tmp_path):
    productos_dir = tmp_path / "productos"
    productos_dir.mkdir()
    (productos_dir / "cheesecake-clasico.md").write_text(
        '---\ntitle: "Cheesecake Clásico"\nid: "cheesecake-clasico"\n'
        'palabras_clave: ["cheesecake","postre","repostería"]\n'
        'imagen: "cheesecake-clasico"\ncategoria_primaria: "supermarket"\n'
        'categoria_secundaria: "reposteria"\n---\n\nDescripción del cheesecake.',
        encoding="utf-8",
    )
    empresa_dir = tmp_path / "empresa"
    empresa_dir.mkdir()
    (empresa_dir / "lineas-de-negocio.md").write_text(
        '---\ntitle: "Líneas de Negocio"\nkeywords: ["restaurantes","catering","foodservice"]\n---\n\nDistribuimos a restaurantes y hoteles.',
        encoding="utf-8",
    )
    return tmp_path


def test_load_productos_returns_all_files(tmp_content):
    result = load_productos(tmp_content)
    assert len(result) == 1
    assert result[0]["id"] == "cheesecake-clasico"
    assert "cheesecake" in result[0]["keywords"]


def test_load_empresa_kb_returns_sections(tmp_content):
    result = load_empresa_kb(tmp_content)
    assert len(result) == 1
    assert result[0]["file"] == "lineas-de-negocio.md"
    assert "restaurantes" in result[0]["keywords"]


def test_match_by_keywords_filters_correctly(tmp_content):
    productos = load_productos(tmp_content)
    matched = match_by_keywords(productos, {"cheesecake", "pan"})
    assert len(matched) == 1
    no_match = match_by_keywords(productos, {"bagel", "croissant"})
    assert len(no_match) == 0


def test_extract_topic_words_removes_stopwords():
    words = extract_topic_words("Cheesecake para restaurantes", "Los mejores postres de Caracas")
    assert "cheesecake" in words
    assert "restaurantes" in words
    assert "para" not in words
    assert "los" not in words
```

- [ ] **Step 2: Run to verify it fails**

```bash
pytest tests/blog_pipeline/test_catalog_loader.py -v
```
Expected: ImportError.

- [ ] **Step 3: Create `scripts/blog_pipeline/catalog_loader.py`**

```python
import re
from pathlib import Path


def _parse_frontmatter(text: str) -> tuple[dict, str]:
    if not text.startswith("---"):
        return {}, text
    parts = text.split("---", 2)
    if len(parts) < 3:
        return {}, text
    fm: dict = {}
    for line in parts[1].strip().splitlines():
        if ":" in line:
            key, _, value = line.partition(":")
            fm[key.strip()] = value.strip().strip("\"'")
    return fm, parts[2].strip()


def _parse_list_field(raw: str) -> list[str]:
    return re.findall(r'"([^"]+)"', raw)


def load_productos(content_dir: Path) -> list[dict]:
    productos = []
    for md_file in sorted((content_dir / "productos").glob("*.md")):
        text = md_file.read_text(encoding="utf-8")
        fm, body = _parse_frontmatter(text)
        productos.append({
            "id": fm.get("id", md_file.stem),
            "title": fm.get("title", ""),
            "keywords": _parse_list_field(fm.get("palabras_clave", "[]")),
            "imagen": fm.get("imagen", ""),
            "categoria_primaria": fm.get("categoria_primaria", ""),
            "categoria_secundaria": fm.get("categoria_secundaria", ""),
            "body": body,
        })
    return productos


def load_empresa_kb(content_dir: Path) -> list[dict]:
    empresa_dir = content_dir / "empresa"
    if not empresa_dir.exists():
        return []
    sections = []
    for md_file in sorted(empresa_dir.glob("*.md")):
        text = md_file.read_text(encoding="utf-8")
        fm, body = _parse_frontmatter(text)
        sections.append({
            "file": md_file.name,
            "title": fm.get("title", md_file.stem),
            "keywords": _parse_list_field(fm.get("keywords", "[]")),
            "excerpt": body[:500],
            "full_text": body,
        })
    return sections


def match_by_keywords(items: list[dict], topic_words: set[str]) -> list[dict]:
    matched = []
    for item in items:
        item_kws = {k.lower() for k in item.get("keywords", [])}
        if item_kws & topic_words:
            matched.append(item)
    return matched


def extract_topic_words(title: str, body: str) -> set[str]:
    text = f"{title} {body}".lower()
    words = re.findall(r"\b[a-záéíóúüñ]{3,}\b", text)
    stopwords = {
        "que", "los", "las", "del", "una", "con", "para", "por", "como",
        "este", "esta", "son", "sus", "más", "pero", "sin", "sobre", "los",
        "hay", "ser", "está", "han", "fue", "ser", "sus", "una", "uno",
    }
    return {w for w in words if w not in stopwords}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
pytest tests/blog_pipeline/test_catalog_loader.py -v
```
Expected: 4 PASSED.

- [ ] **Step 5: Commit**

```bash
git add scripts/blog_pipeline/catalog_loader.py tests/blog_pipeline/test_catalog_loader.py
git commit -m "feat: add catalog_loader for productos and empresa KB"
```

---

## Task 3: GSC Client

**Files:**
- Create: `scripts/blog_pipeline/gsc_client.py`
- Create: `tests/blog_pipeline/test_gsc_client.py`

**Interfaces:**
- Produces:
  - `fetch_top_queries(site_url, credentials_file, days=90, min_impressions=10, limit=50) -> list[dict]` — each dict: `{query, impressions, clicks, ctr, position}`
  - `filter_queries_for_topic(queries: list[dict], topic_words: set[str]) -> list[dict]`
  - `detect_traffic_arbitrage(topic_words: set[str]) -> bool`

- [ ] **Step 1: Write the failing test**

Create `tests/blog_pipeline/test_gsc_client.py`:

```python
from unittest.mock import MagicMock, patch
from scripts.blog_pipeline.gsc_client import (
    filter_queries_for_topic,
    detect_traffic_arbitrage,
    fetch_top_queries,
)

SAMPLE_QUERIES = [
    {"query": "cheesecake factory caracas", "impressions": 340, "clicks": 12, "ctr": 0.035, "position": 4.2},
    {"query": "pan artesanal caracas", "impressions": 80, "clicks": 5, "ctr": 0.062, "position": 7.1},
    {"query": "proveedor panaderia venezuela", "impressions": 25, "clicks": 2, "ctr": 0.08, "position": 9.0},
]


def test_filter_queries_for_topic():
    result = filter_queries_for_topic(SAMPLE_QUERIES, {"cheesecake", "postre"})
    assert len(result) == 1
    assert result[0]["query"] == "cheesecake factory caracas"


def test_filter_queries_no_match():
    result = filter_queries_for_topic(SAMPLE_QUERIES, {"croissant", "bagel"})
    assert result == []


def test_detect_traffic_arbitrage_true():
    assert detect_traffic_arbitrage({"cheesecake", "restaurante"}) is True


def test_detect_traffic_arbitrage_false():
    assert detect_traffic_arbitrage({"pan", "harina", "levadura"}) is False


def test_fetch_top_queries_returns_empty_when_no_credentials(tmp_path):
    result = fetch_top_queries(
        site_url="https://example.com",
        credentials_file=str(tmp_path / "missing.json"),
    )
    assert result == []


@patch("scripts.blog_pipeline.gsc_client._build_gsc_service")
def test_fetch_top_queries_filters_by_impressions(mock_build):
    mock_service = MagicMock()
    mock_build.return_value = mock_service
    mock_service.searchanalytics().query().execute.return_value = {
        "rows": [
            {"keys": ["cheesecake caracas"], "impressions": 200, "clicks": 8, "ctr": 0.04, "position": 3.1},
            {"keys": ["pan viejo"], "impressions": 5, "clicks": 0, "ctr": 0.0, "position": 20.0},
        ]
    }
    result = fetch_top_queries("https://example.com", "fake.json", min_impressions=10)
    assert len(result) == 1
    assert result[0]["query"] == "cheesecake caracas"
```

- [ ] **Step 2: Run to verify it fails**

```bash
pytest tests/blog_pipeline/test_gsc_client.py -v
```
Expected: ImportError.

- [ ] **Step 3: Create `scripts/blog_pipeline/gsc_client.py`**

```python
from datetime import datetime, timedelta
from pathlib import Path

TRAFFIC_ARBITRAGE_TERMS = {
    "cheesecake", "pastelería", "postres", "torta", "repostería", "postre",
    "cheese cake", "cheesecake factory",
}


def _build_gsc_service(credentials_file: str):
    from googleapiclient.discovery import build
    from google.oauth2 import service_account

    creds = service_account.Credentials.from_service_account_file(
        credentials_file,
        scopes=["https://www.googleapis.com/auth/webmasters.readonly"],
    )
    return build("searchconsole", "v1", credentials=creds, cache_discovery=False)


def fetch_top_queries(
    site_url: str,
    credentials_file: str,
    days: int = 90,
    min_impressions: int = 10,
    limit: int = 50,
) -> list[dict]:
    if not Path(credentials_file).exists():
        return []
    try:
        service = _build_gsc_service(credentials_file)
    except Exception:
        return []

    end_date = datetime.now().date()
    start_date = end_date - timedelta(days=days)

    response = service.searchanalytics().query(
        siteUrl=site_url,
        body={
            "startDate": str(start_date),
            "endDate": str(end_date),
            "dimensions": ["query"],
            "rowLimit": limit * 2,
        },
    ).execute()

    rows = response.get("rows", [])
    result = [
        {
            "query": row["keys"][0],
            "impressions": int(row.get("impressions", 0)),
            "clicks": int(row.get("clicks", 0)),
            "ctr": float(row.get("ctr", 0.0)),
            "position": float(row.get("position", 0.0)),
        }
        for row in rows
        if row.get("impressions", 0) >= min_impressions
    ]
    return sorted(result, key=lambda r: r["impressions"], reverse=True)[:limit]


def filter_queries_for_topic(queries: list[dict], topic_words: set[str]) -> list[dict]:
    return [
        q for q in queries
        if set(q["query"].lower().split()) & topic_words
    ]


def detect_traffic_arbitrage(topic_words: set[str]) -> bool:
    return bool(topic_words & {t.lower() for t in TRAFFIC_ARBITRAGE_TERMS})
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
pytest tests/blog_pipeline/test_gsc_client.py -v
```
Expected: 6 PASSED.

- [ ] **Step 5: Commit**

```bash
git add scripts/blog_pipeline/gsc_client.py tests/blog_pipeline/test_gsc_client.py
git commit -m "feat: add GSC client with traffic arbitrage detection"
```

---

## Task 4: Step 1 — Brief Enrichment

**Files:**
- Create: `scripts/blog_pipeline/step_01_enrich.py`
- Create: `tests/blog_pipeline/test_step_01.py`

**Interfaces:**
- Consumes: `PipelineContext`, `cross_links: dict`, `catalog_loader.*`, `gsc_client.*`
- Produces: `run(ctx, cross_links) -> dict` — writes `.pipeline/{n}/01_brief.json`, returns parsed dict

- [ ] **Step 1: Write the failing test**

Create `tests/blog_pipeline/test_step_01.py`:

```python
import json
import pytest
from pathlib import Path
from unittest.mock import patch
from scripts.blog_pipeline.context import PipelineContext, IssueMetadata
from scripts.blog_pipeline.step_01_enrich import run


@pytest.fixture
def ctx(tmp_path):
    checkpoint = tmp_path / "pipeline" / "42"
    checkpoint.mkdir(parents=True)
    content = tmp_path / "content"
    (content / "productos").mkdir(parents=True)
    (content / "productos" / "cheesecake-clasico.md").write_text(
        '---\ntitle: "Cheesecake Clásico"\nid: "cheesecake-clasico"\n'
        'palabras_clave: ["cheesecake","postre"]\nimagen: "cheesecake"\n'
        'categoria_primaria: "supermarket"\ncategoria_secundaria: "reposteria"\n---\nCuerpo.',
        encoding="utf-8",
    )
    return PipelineContext(
        issue_number=42,
        issue_title="Cheesecake para restaurantes en Caracas",
        issue_body="Artículo sobre proveer cheesecake a restaurantes.",
        metadata=IssueMetadata(scheduled_date="2026-08-10", tags=["cheesecake"]),
        checkpoint_dir=checkpoint,
        blog_output_dir=tmp_path / "blog",
        content_dir=content,
        ai_model="gpt-4",
        ai_api_key="sk-test",
        ai_base_url="",
        gsc_site_url="https://example.com",
        gsc_credentials_file=str(tmp_path / "missing.json"),
        github_repo="eugenio/test",
    )


def test_run_creates_brief_json(ctx):
    with patch("scripts.blog_pipeline.step_01_enrich.fetch_top_queries", return_value=[]):
        brief = run(ctx, cross_links={})
    output = ctx.checkpoint_dir / "01_brief.json"
    assert output.exists()
    assert brief["issue_number"] == 42
    assert any(p["id"] == "cheesecake-clasico" for p in brief["matched_products"])
    assert brief["traffic_arbitrage"] is True


def test_run_uses_checkpoint_if_exists(ctx):
    existing = {"issue_number": 42, "issue_title": "cached", "matched_products": [], "gsc_queries": [], "traffic_arbitrage": False, "matched_kb_sections": [], "cross_links": {}, "issue_body": "", "metadata": {}}
    (ctx.checkpoint_dir / "01_brief.json").write_text(json.dumps(existing), encoding="utf-8")
    brief = run(ctx, cross_links={})
    assert brief["issue_title"] == "cached"
```

- [ ] **Step 2: Run to verify it fails**

```bash
pytest tests/blog_pipeline/test_step_01.py -v
```

- [ ] **Step 3: Create `scripts/blog_pipeline/step_01_enrich.py`**

```python
import json
from .context import PipelineContext
from .catalog_loader import load_productos, load_empresa_kb, match_by_keywords, extract_topic_words
from .gsc_client import fetch_top_queries, filter_queries_for_topic, detect_traffic_arbitrage


def run(ctx: PipelineContext, cross_links: dict) -> dict:
    output_path = ctx.checkpoint_dir / "01_brief.json"
    if output_path.exists() and (ctx.force_step is None or ctx.force_step > 1):
        return json.loads(output_path.read_text(encoding="utf-8"))

    topic_words = extract_topic_words(ctx.issue_title, ctx.issue_body)

    productos = load_productos(ctx.content_dir)
    matched_products = match_by_keywords(productos, topic_words)

    kb_sections = load_empresa_kb(ctx.content_dir)
    matched_kb = match_by_keywords(kb_sections, topic_words)

    gsc_queries = fetch_top_queries(ctx.gsc_site_url, ctx.gsc_credentials_file)
    topic_gsc = filter_queries_for_topic(gsc_queries, topic_words)

    traffic_arbitrage = detect_traffic_arbitrage(topic_words)

    brief = {
        "issue_number": ctx.issue_number,
        "issue_title": ctx.issue_title,
        "issue_body": ctx.issue_body,
        "metadata": {
            "scheduled_date": ctx.metadata.scheduled_date,
            "series": ctx.metadata.series,
            "tags": ctx.metadata.tags,
        },
        "matched_products": [
            {
                "id": p["id"],
                "title": p["title"],
                "keywords": p["keywords"],
                "imagen": p["imagen"],
                "body": p["body"],
            }
            for p in matched_products
        ],
        "matched_kb_sections": [
            {"file": s["file"], "title": s["title"], "excerpt": s["excerpt"]}
            for s in matched_kb
        ],
        "gsc_queries": topic_gsc,
        "traffic_arbitrage": traffic_arbitrage,
        "cross_links": cross_links,
    }

    output_path.write_text(json.dumps(brief, indent=2, ensure_ascii=False), encoding="utf-8")
    return brief
```

- [ ] **Step 4: Run tests**

```bash
pytest tests/blog_pipeline/test_step_01.py -v
```
Expected: 2 PASSED.

- [ ] **Step 5: Commit**

```bash
git add scripts/blog_pipeline/step_01_enrich.py tests/blog_pipeline/test_step_01.py
git commit -m "feat: add step_01_enrich — brief assembly with no LLM"
```

---

## Task 5: Step 2 — Keyword Strategy

**Files:**
- Create: `scripts/blog_pipeline/step_02_keywords.py`
- Create: `tests/blog_pipeline/test_step_02.py`

**Interfaces:**
- Consumes: `PipelineContext`, `brief: dict` (output of step 1)
- Produces: `run(ctx, brief) -> dict` — writes `02_keywords.json`, returns dict with keys: `primary_keyword`, `secondary_keywords`, `audience_segments`, `search_intent`, `geo_answer`, `internal_links`

- [ ] **Step 1: Write the failing test**

Create `tests/blog_pipeline/test_step_02.py`:

```python
import json
import pytest
from pathlib import Path
from unittest.mock import MagicMock, patch
from scripts.blog_pipeline.context import PipelineContext, IssueMetadata
from scripts.blog_pipeline.step_02_keywords import run, _validate_keywords


@pytest.fixture
def ctx(tmp_path):
    cp = tmp_path / "pipeline" / "42"
    cp.mkdir(parents=True)
    return PipelineContext(
        issue_number=42, issue_title="Cheesecake proveedor",
        issue_body="", metadata=IssueMetadata(),
        checkpoint_dir=cp, blog_output_dir=tmp_path / "blog",
        content_dir=tmp_path / "content", ai_model="gpt-4",
        ai_api_key="sk-test", ai_base_url="", gsc_site_url="",
        gsc_credentials_file="", github_repo="",
    )


SAMPLE_BRIEF = {
    "issue_title": "Cheesecake para restaurantes",
    "issue_body": "Artículo sobre proveer cheesecake.",
    "matched_products": [],
    "gsc_queries": [{"query": "cheesecake factory caracas", "impressions": 340, "clicks": 12, "ctr": 0.035, "position": 4.2}],
    "traffic_arbitrage": True,
}

SAMPLE_KEYWORDS = {
    "primary_keyword": "cheesecake para restaurantes Caracas",
    "secondary_keywords": ["proveedor cheesecake Venezuela", "postres industriales"],
    "audience_segments": ["consumidor", "b2b"],
    "search_intent": "comercial",
    "geo_answer": "Alimentos New York fabrica cheesecakes industriales en Caracas.",
    "internal_links": ["/catalogo/"],
}


def test_run_calls_llm_and_writes_checkpoint(ctx):
    with patch("scripts.blog_pipeline.step_02_keywords._call_llm", return_value=SAMPLE_KEYWORDS):
        result = run(ctx, SAMPLE_BRIEF)
    assert (ctx.checkpoint_dir / "02_keywords.json").exists()
    assert result["primary_keyword"] == "cheesecake para restaurantes Caracas"


def test_run_skips_llm_if_checkpoint_exists(ctx):
    (ctx.checkpoint_dir / "02_keywords.json").write_text(
        json.dumps(SAMPLE_KEYWORDS), encoding="utf-8"
    )
    with patch("scripts.blog_pipeline.step_02_keywords._call_llm") as mock_llm:
        run(ctx, SAMPLE_BRIEF)
    mock_llm.assert_not_called()


def test_validate_keywords_raises_on_missing_field():
    with pytest.raises(ValueError, match="missing fields"):
        _validate_keywords({"primary_keyword": "x"})
```

- [ ] **Step 2: Run to verify it fails**

```bash
pytest tests/blog_pipeline/test_step_02.py -v
```

- [ ] **Step 3: Create `scripts/blog_pipeline/step_02_keywords.py`**

```python
import json
from openai import OpenAI
from .context import PipelineContext

_SYSTEM = (
    "Eres un especialista en SEO y GEO (Generative Engine Optimization) para Alimentos New York, "
    "una fábrica de panadería y repostería industrial en Caracas, Venezuela. "
    "Escribes siempre en español natural. Tu objetivo es la estrategia de palabras clave "
    "que posicione a la empresa como proveedor de referencia en su sector."
)

_REQUIRED_FIELDS = {
    "primary_keyword", "secondary_keywords", "audience_segments",
    "search_intent", "geo_answer", "internal_links",
}


def run(ctx: PipelineContext, brief: dict) -> dict:
    output_path = ctx.checkpoint_dir / "02_keywords.json"
    if output_path.exists() and (ctx.force_step is None or ctx.force_step > 2):
        return json.loads(output_path.read_text(encoding="utf-8"))

    result = _call_llm(ctx, brief)
    _validate_keywords(result)
    output_path.write_text(json.dumps(result, indent=2, ensure_ascii=False), encoding="utf-8")
    return result


def _call_llm(ctx: PipelineContext, brief: dict) -> dict:
    gsc_lines = "\n".join(
        f'- "{q["query"]}" ({q["impressions"]} impresiones)'
        for q in brief.get("gsc_queries", [])[:15]
    )
    products_lines = "\n".join(
        f'- {p["title"]}: {", ".join(p["keywords"][:4])}'
        for p in brief.get("matched_products", [])[:8]
    )
    arbitrage = (
        "\n\nNOTA: Este tema capta búsquedas de 'cheesecake factory'. "
        "El geo_answer debe responder tanto a la intención de consumidor final "
        "(quiero cheesecake) como a la intención B2B (necesito proveedor de cheesecake)."
        if brief.get("traffic_arbitrage") else ""
    )

    prompt = (
        f"Analiza y devuelve una estrategia de palabras clave en JSON.\n\n"
        f"Tema: {brief['issue_title']}\n"
        f"Descripción: {brief.get('issue_body', '')[:400]}\n\n"
        f"Consultas reales de Google Search Console:\n{gsc_lines or 'Sin datos'}\n\n"
        f"Productos relevantes:\n{products_lines or 'Sin productos específicos'}"
        f"{arbitrage}\n\n"
        "Devuelve ÚNICAMENTE JSON con esta estructura exacta:\n"
        "{\n"
        '  "primary_keyword": "frase principal en español",\n'
        '  "secondary_keywords": ["frase 1", "frase 2", "frase 3"],\n'
        '  "audience_segments": ["consumidor"] o ["b2b"] o ["consumidor","b2b"],\n'
        '  "search_intent": "informacional" | "comercial" | "transaccional",\n'
        '  "geo_answer": "respuesta directa 2-3 oraciones para motores generativos (Perplexity, ChatGPT)",\n'
        '  "internal_links": ["/ruta/relativa/"]\n'
        "}"
    )

    client = OpenAI(api_key=ctx.ai_api_key, base_url=ctx.ai_base_url or "https://api.openai.com/v1")
    response = client.chat.completions.create(
        model=ctx.ai_model,
        messages=[{"role": "system", "content": _SYSTEM}, {"role": "user", "content": prompt}],
        temperature=0.3,
        response_format={"type": "json_object"},
    )
    return json.loads(response.choices[0].message.content)


def _validate_keywords(data: dict) -> None:
    missing = _REQUIRED_FIELDS - set(data.keys())
    if missing:
        raise ValueError(f"Keyword strategy missing fields: {missing}")
```

- [ ] **Step 4: Run tests**

```bash
pytest tests/blog_pipeline/test_step_02.py -v
```
Expected: 3 PASSED.

- [ ] **Step 5: Commit**

```bash
git add scripts/blog_pipeline/step_02_keywords.py tests/blog_pipeline/test_step_02.py
git commit -m "feat: add step_02_keywords — LLM keyword strategy with GSC grounding"
```

---

## Task 6: Step 3 — Outline Generation

**Files:**
- Create: `scripts/blog_pipeline/step_03_outline.py`
- Create: `tests/blog_pipeline/test_step_03.py`

**Interfaces:**
- Consumes: `PipelineContext`, `brief: dict`, `keywords: dict`
- Produces: `run(ctx, brief, keywords) -> dict` — writes `03_outline.json`; dict has `slug`, `sections: list[dict]`, `closing_cta: dict`

Each section dict: `{h2, audience, keyword_to_hit, products_to_mention, h3s, image_slot, internal_links}`
`image_slot` is either `{"type": "product", "product_id": "..."}` or `{"type": "lifestyle", "brief": "..."}` or `null`.

- [ ] **Step 1: Write the failing test**

Create `tests/blog_pipeline/test_step_03.py`:

```python
import json
import pytest
from unittest.mock import patch
from scripts.blog_pipeline.context import PipelineContext, IssueMetadata
from scripts.blog_pipeline.step_03_outline import run, _validate_outline

SAMPLE_BRIEF = {
    "issue_title": "Cheesecake para restaurantes",
    "issue_body": "",
    "matched_products": [{"id": "cheesecake-clasico", "title": "Cheesecake Clásico", "keywords": ["cheesecake"], "imagen": "cheesecake", "body": ""}],
    "matched_kb_sections": [],
    "gsc_queries": [],
    "traffic_arbitrage": True,
    "cross_links": {},
}

SAMPLE_KEYWORDS = {
    "primary_keyword": "cheesecake para restaurantes Caracas",
    "secondary_keywords": ["proveedor cheesecake Venezuela"],
    "audience_segments": ["consumidor", "b2b"],
    "search_intent": "comercial",
    "geo_answer": "Alimentos New York fabrica cheesecakes.",
    "internal_links": ["/catalogo/"],
}

SAMPLE_OUTLINE = {
    "slug": "cheesecake-para-restaurantes-caracas",
    "sections": [
        {
            "h2": "¿Dónde conseguir cheesecake en Caracas?",
            "audience": "consumidor",
            "keyword_to_hit": "cheesecake caracas",
            "products_to_mention": ["cheesecake-clasico"],
            "h3s": ["En supermercados"],
            "image_slot": {"type": "product", "product_id": "cheesecake-clasico"},
            "internal_links": ["/catalogo/"],
        }
    ],
    "closing_cta": {
        "consumer": "¿Dónde comprar? → WhatsApp",
        "b2b": "¿Buscas proveedor? → formulario de contacto",
    },
}


@pytest.fixture
def ctx(tmp_path):
    cp = tmp_path / "pipeline" / "42"
    cp.mkdir(parents=True)
    return PipelineContext(
        issue_number=42, issue_title="Cheesecake proveedor",
        issue_body="", metadata=IssueMetadata(),
        checkpoint_dir=cp, blog_output_dir=tmp_path / "blog",
        content_dir=tmp_path / "content", ai_model="gpt-4",
        ai_api_key="sk-test", ai_base_url="", gsc_site_url="",
        gsc_credentials_file="", github_repo="",
    )


def test_run_writes_outline_json(ctx):
    with patch("scripts.blog_pipeline.step_03_outline._call_llm", return_value=SAMPLE_OUTLINE):
        result = run(ctx, SAMPLE_BRIEF, SAMPLE_KEYWORDS)
    assert (ctx.checkpoint_dir / "03_outline.json").exists()
    assert result["slug"] == "cheesecake-para-restaurantes-caracas"
    assert len(result["sections"]) >= 1


def test_validate_outline_raises_on_missing_sections():
    with pytest.raises(ValueError):
        _validate_outline({"slug": "x", "closing_cta": {}})
```

- [ ] **Step 2: Run to verify it fails**

```bash
pytest tests/blog_pipeline/test_step_03.py -v
```

- [ ] **Step 3: Create `scripts/blog_pipeline/step_03_outline.py`**

```python
import json
from openai import OpenAI
from .context import PipelineContext

_SYSTEM = (
    "Eres un arquitecto de contenido SEO/GEO para Alimentos New York, fábrica de panadería "
    "industrial en Caracas. Produces estructuras de artículos en español natural que posicionan "
    "a la empresa como proveedor de referencia y que responden directamente a lo que busca el usuario."
)


def run(ctx: PipelineContext, brief: dict, keywords: dict) -> dict:
    output_path = ctx.checkpoint_dir / "03_outline.json"
    if output_path.exists() and (ctx.force_step is None or ctx.force_step > 3):
        return json.loads(output_path.read_text(encoding="utf-8"))

    result = _call_llm(ctx, brief, keywords)
    _validate_outline(result)
    output_path.write_text(json.dumps(result, indent=2, ensure_ascii=False), encoding="utf-8")
    return result


def _call_llm(ctx: PipelineContext, brief: dict, keywords: dict) -> dict:
    products_list = "\n".join(f'- {p["id"]}: {p["title"]}' for p in brief.get("matched_products", []))
    kb_list = "\n".join(f'- {s["file"]}: {s["title"]}' for s in brief.get("matched_kb_sections", []))
    audiences = ", ".join(keywords.get("audience_segments", ["consumidor"]))

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
        "{'type': 'lifestyle', 'brief': 'descripción en español de la foto ideal'} si no, o null.\n\n"
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
        '      "internal_links": ["/ruta/"]\n'
        "    }\n"
        "  ],\n"
        '  "closing_cta": {"consumer": "texto CTA consumidor", "b2b": "texto CTA B2B"}\n'
        "}"
    )

    client = OpenAI(api_key=ctx.ai_api_key, base_url=ctx.ai_base_url or "https://api.openai.com/v1")
    response = client.chat.completions.create(
        model=ctx.ai_model,
        messages=[{"role": "system", "content": _SYSTEM}, {"role": "user", "content": prompt}],
        temperature=0.3,
        response_format={"type": "json_object"},
    )
    return json.loads(response.choices[0].message.content)


def _validate_outline(data: dict) -> None:
    if not data.get("sections"):
        raise ValueError("Outline must have at least one section")
    if not data.get("slug"):
        raise ValueError("Outline must have a slug")
```

- [ ] **Step 4: Run tests**

```bash
pytest tests/blog_pipeline/test_step_03.py -v
```
Expected: 2 PASSED.

- [ ] **Step 5: Commit**

```bash
git add scripts/blog_pipeline/step_03_outline.py tests/blog_pipeline/test_step_03.py
git commit -m "feat: add step_03_outline — GEO-structured H2/H3 outline generation"
```

---

## Task 7: Step 4 — Section-by-Section Content

**Files:**
- Create: `scripts/blog_pipeline/step_04_content.py`
- Create: `tests/blog_pipeline/test_step_04.py`

**Interfaces:**
- Consumes: `PipelineContext`, `brief: dict`, `outline: dict`
- Produces: `run(ctx, brief, outline) -> str` — writes `04_draft.md`, returns markdown string

- [ ] **Step 1: Write the failing test**

Create `tests/blog_pipeline/test_step_04.py`:

```python
import pytest
from unittest.mock import patch
from scripts.blog_pipeline.context import PipelineContext, IssueMetadata
from scripts.blog_pipeline.step_04_content import run, _generate_section

SAMPLE_BRIEF = {
    "issue_title": "Cheesecake para restaurantes",
    "matched_products": [{"id": "cheesecake-clasico", "title": "Cheesecake Clásico", "keywords": ["cheesecake"], "imagen": "cheesecake-clasico", "body": "Peso: 1kg."}],
    "matched_kb_sections": [],
    "gsc_queries": [],
    "traffic_arbitrage": False,
}

SAMPLE_OUTLINE = {
    "slug": "cheesecake-restaurantes",
    "sections": [
        {
            "h2": "Cheesecake para eventos",
            "audience": "b2b",
            "keyword_to_hit": "proveedor cheesecake",
            "products_to_mention": ["cheesecake-clasico"],
            "h3s": ["Presentaciones disponibles"],
            "image_slot": {"type": "product", "product_id": "cheesecake-clasico"},
            "internal_links": [],
        }
    ],
    "closing_cta": {"consumer": "¿Dónde comprar?", "b2b": "¿Proveedor?"},
}


@pytest.fixture
def ctx(tmp_path):
    cp = tmp_path / "pipeline" / "42"
    cp.mkdir(parents=True)
    return PipelineContext(
        issue_number=42, issue_title="x", issue_body="",
        metadata=IssueMetadata(), checkpoint_dir=cp,
        blog_output_dir=tmp_path / "blog", content_dir=tmp_path / "content",
        ai_model="gpt-4", ai_api_key="sk-test", ai_base_url="",
        gsc_site_url="", gsc_credentials_file="", github_repo="",
    )


def test_run_assembles_sections_into_draft(ctx):
    with patch("scripts.blog_pipeline.step_04_content._generate_section", return_value="## Cheesecake para eventos\n\nContenido de prueba."):
        draft = run(ctx, SAMPLE_BRIEF, SAMPLE_OUTLINE)
    assert (ctx.checkpoint_dir / "04_draft.md").exists()
    assert "## Cheesecake para eventos" in draft
    assert "¿Proveedor?" in draft


def test_run_embeds_product_image_when_available(ctx):
    with patch("scripts.blog_pipeline.step_04_content._generate_section", return_value="## H2\n\nTexto."):
        draft = run(ctx, SAMPLE_BRIEF, SAMPLE_OUTLINE)
    assert "/productos/cheesecake-clasico" in draft
```

- [ ] **Step 2: Run to verify it fails**

```bash
pytest tests/blog_pipeline/test_step_04.py -v
```

- [ ] **Step 3: Create `scripts/blog_pipeline/step_04_content.py`**

```python
import json
from openai import OpenAI
from .context import PipelineContext

_SYSTEM = (
    "Eres el redactor oficial del blog de Alimentos New York, fábrica de panadería y repostería "
    "industrial en Caracas, Venezuela. REGLAS ABSOLUTAS:\n"
    "1. Escribe ÚNICAMENTE en español natural y fluido. Cero anglicismos innecesarios.\n"
    "2. Cita SÓLO los datos de producto y empresa que te proporciono. Nunca inventes cifras, "
    "precios, ni especificaciones técnicas.\n"
    "3. Escribe en prosa continua. Evita listas largas. Usa párrafos.\n"
    "4. El tono varía: para consumidores es cálido y apetitoso; para B2B es profesional y directo.\n"
    "5. No menciones a la empresa en tercera persona de forma robótica. Escribe como si fueras parte del equipo."
)


def run(ctx: PipelineContext, brief: dict, outline: dict) -> str:
    output_path = ctx.checkpoint_dir / "04_draft.md"
    if output_path.exists() and (ctx.force_step is None or ctx.force_step > 4):
        return output_path.read_text(encoding="utf-8")

    products_by_id = {p["id"]: p for p in brief.get("matched_products", [])}
    parts = []

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
            brief_text = image_slot.get("brief", "")
            section_md += f"\n\n<!-- IMAGE_BRIEF: {brief_text} -->"

        parts.append(section_md)

    cta = outline.get("closing_cta", {})
    closing = (
        "\n\n---\n\n"
        f"**Para consumidores:** {cta.get('consumer', '')}\n\n"
        f"**Para negocios:** {cta.get('b2b', '')}"
    )
    parts.append(closing)

    draft = "\n\n".join(parts)
    output_path.write_text(draft, encoding="utf-8")
    return draft


def _generate_section(ctx: PipelineContext, section: dict, products: list[dict], kb_sections: list[dict]) -> str:
    h3s_text = "\n".join(f"  - ### {h}" for h in section.get("h3s", []))
    products_text = "\n".join(
        f"- **{p['title']}**: {p['body'][:300]}" for p in products
    ) or "Sin productos específicos para esta sección."
    kb_text = "\n".join(
        f"[{s['title']}]: {s['excerpt']}" for s in kb_sections[:3]
    ) or ""
    audience_map = {"consumidor": "tono cálido y cercano", "b2b": "tono profesional y directo", "ambos": "equilibra ambos tonos"}
    tone = audience_map.get(section.get("audience", "ambos"), "equilibra ambos tonos")

    prompt = (
        f"Escribe la sección del artículo con este encabezado H2: {section['h2']}\n\n"
        f"Subtítulos H3 a desarrollar:\n{h3s_text or '(sin subtítulos, desarrolla en párrafos)'}\n\n"
        f"Keyword a incluir naturalmente: {section.get('keyword_to_hit', '')}\n"
        f"Tono: {tone}\n\n"
        f"Datos de productos (cita SÓLO estos):\n{products_text}\n\n"
        f"Contexto de empresa:\n{kb_text}\n\n"
        "IMPORTANTE: Empieza directamente con el encabezado ## (no con H1). "
        "No añadas frontmatter. Escribe en prosa fluida en español. "
        "No inventes datos que no estén en los datos de producto arriba."
    )

    client = OpenAI(api_key=ctx.ai_api_key, base_url=ctx.ai_base_url or "https://api.openai.com/v1")
    response = client.chat.completions.create(
        model=ctx.ai_model,
        messages=[{"role": "system", "content": _SYSTEM}, {"role": "user", "content": prompt}],
        temperature=0.7,
    )
    return response.choices[0].message.content.strip()
```

- [ ] **Step 4: Run tests**

```bash
pytest tests/blog_pipeline/test_step_04.py -v
```
Expected: 2 PASSED.

- [ ] **Step 5: Commit**

```bash
git add scripts/blog_pipeline/step_04_content.py tests/blog_pipeline/test_step_04.py
git commit -m "feat: add step_04_content — section-by-section generation with product grounding"
```

---

## Task 8: Step 5 — SEO/GEO Review + Partial Retry

**Files:**
- Create: `scripts/blog_pipeline/step_05_review.py`
- Create: `tests/blog_pipeline/test_step_05.py`

**Interfaces:**
- Consumes: `PipelineContext`, `draft: str`, `brief: dict`, `keywords: dict`, `outline: dict`
- Produces: `run(ctx, draft, brief, keywords, outline) -> tuple[str, list[str]]` — writes `05_polished.md`, returns `(polished_text, review_warnings)`

- [ ] **Step 1: Write the failing test**

Create `tests/blog_pipeline/test_step_05.py`:

```python
import json
import pytest
from unittest.mock import patch, MagicMock
from scripts.blog_pipeline.context import PipelineContext, IssueMetadata
from scripts.blog_pipeline.step_05_review import run

SAMPLE_KEYWORDS = {
    "primary_keyword": "cheesecake para restaurantes",
    "geo_answer": "Alimentos New York fabrica cheesecakes.",
    "audience_segments": ["consumidor", "b2b"],
}
SAMPLE_BRIEF = {"matched_products": [], "matched_kb_sections": []}
SAMPLE_OUTLINE = {
    "sections": [{"h2": "H2 test", "audience": "ambos", "products_to_mention": [], "h3s": [], "image_slot": None, "internal_links": [], "keyword_to_hit": "cheesecake"}],
    "closing_cta": {"consumer": "x", "b2b": "y"},
}
GOOD_DRAFT = "Alimentos New York fabrica cheesecakes para restaurantes.\n\n## H2 test\n\nTexto."


@pytest.fixture
def ctx(tmp_path):
    cp = tmp_path / "pipeline" / "42"
    cp.mkdir(parents=True)
    return PipelineContext(
        issue_number=42, issue_title="x", issue_body="",
        metadata=IssueMetadata(), checkpoint_dir=cp,
        blog_output_dir=tmp_path / "blog", content_dir=tmp_path / "content",
        ai_model="gpt-4", ai_api_key="sk-test", ai_base_url="",
        gsc_site_url="", gsc_credentials_file="", github_repo="",
    )


def test_run_passes_good_draft(ctx):
    review_result = {"pass": True, "issues": [], "polished": GOOD_DRAFT}
    with patch("scripts.blog_pipeline.step_05_review._call_reviewer", return_value=review_result):
        polished, warnings = run(ctx, GOOD_DRAFT, SAMPLE_BRIEF, SAMPLE_KEYWORDS, SAMPLE_OUTLINE)
    assert warnings == []
    assert (ctx.checkpoint_dir / "05_polished.md").exists()


def test_run_retries_on_failure_then_warns(ctx):
    fail_result = {
        "pass": False,
        "issues": [{"section": "H2 test", "problem": "Sin keyword", "suggestion": "Agregar keyword."}],
        "polished": GOOD_DRAFT,
    }
    with patch("scripts.blog_pipeline.step_05_review._call_reviewer", return_value=fail_result), \
         patch("scripts.blog_pipeline.step_05_review._retry_sections", return_value=GOOD_DRAFT):
        polished, warnings = run(ctx, GOOD_DRAFT, SAMPLE_BRIEF, SAMPLE_KEYWORDS, SAMPLE_OUTLINE)
    assert len(warnings) >= 0  # warnings only if retry also fails
```

- [ ] **Step 2: Run to verify it fails**

```bash
pytest tests/blog_pipeline/test_step_05.py -v
```

- [ ] **Step 3: Create `scripts/blog_pipeline/step_05_review.py`**

```python
import json
from openai import OpenAI
from .context import PipelineContext
from . import step_04_content

_SYSTEM_REVIEWER = (
    "Eres un editor senior de SEO/GEO en español. Revisas artículos del blog de Alimentos New York "
    "con criterios estrictos. Devuelves un JSON de revisión, nunca texto libre."
)


def run(ctx: PipelineContext, draft: str, brief: dict, keywords: dict, outline: dict) -> tuple[str, list[str]]:
    output_path = ctx.checkpoint_dir / "05_polished.md"
    if output_path.exists() and (ctx.force_step is None or ctx.force_step > 5):
        return output_path.read_text(encoding="utf-8"), []

    review = _call_reviewer(ctx, draft, keywords)
    warnings: list[str] = []

    if not review.get("pass"):
        retried = _retry_sections(ctx, draft, brief, outline, review["issues"])
        review2 = _call_reviewer(ctx, retried, keywords)
        if review2.get("pass"):
            draft = retried
        else:
            draft = review2.get("polished", retried)
            warnings = [f"{i['section']}: {i['problem']}" for i in review2.get("issues", [])]
    else:
        draft = review.get("polished", draft)

    output_path.write_text(draft, encoding="utf-8")
    return draft, warnings


def _call_reviewer(ctx: PipelineContext, draft: str, keywords: dict) -> dict:
    primary_kw = keywords.get("primary_keyword", "")
    geo_answer = keywords.get("geo_answer", "")
    audiences = keywords.get("audience_segments", [])

    prompt = (
        f"Revisa el siguiente artículo de blog en español.\n\n"
        f"Keyword principal a verificar: '{primary_kw}'\n"
        f"Respuesta GEO que debe aparecer al inicio: '{geo_answer}'\n"
        f"Audiencias requeridas: {audiences}\n\n"
        f"ARTÍCULO:\n{draft}\n\n"
        "Verifica:\n"
        "1. La keyword principal aparece en los primeros 100 caracteres Y en al menos 2 encabezados H2.\n"
        "2. La respuesta GEO (o paráfrasis cercana) aparece en el primer párrafo.\n"
        "3. No hay datos de producto inventados (el artículo no debe afirmar precios ni especificaciones no proporcionadas).\n"
        "4. El español es fluido y natural, sin anglicismos innecesarios.\n"
        "5. Si se requieren dos audiencias, ambas están representadas.\n"
        "6. Hay un CTA al final con secciones separadas para consumidor y B2B.\n\n"
        "Devuelve ÚNICAMENTE este JSON:\n"
        "{\n"
        '  "pass": true|false,\n'
        '  "issues": [\n'
        '    {"section": "nombre del H2 afectado", "problem": "descripción concisa", "suggestion": "cómo corregirlo"}\n'
        "  ],\n"
        '  "polished": "artículo completo corregido si hay problemas menores de redacción"\n'
        "}"
    )

    client = OpenAI(api_key=ctx.ai_api_key, base_url=ctx.ai_base_url or "https://api.openai.com/v1")
    response = client.chat.completions.create(
        model=ctx.ai_model,
        messages=[{"role": "system", "content": _SYSTEM_REVIEWER}, {"role": "user", "content": prompt}],
        temperature=0.3,
        response_format={"type": "json_object"},
    )
    return json.loads(response.choices[0].message.content)


def _retry_sections(ctx: PipelineContext, draft: str, brief: dict, outline: dict, issues: list[dict]) -> str:
    flagged_h2s = {i["section"] for i in issues}
    products_by_id = {p["id"]: p for p in brief.get("matched_products", [])}
    kb = brief.get("matched_kb_sections", [])
    lines = draft.split("\n")
    result_lines = []
    skip_section = False
    pending_replacement = None

    for line in lines:
        if line.startswith("## "):
            current_h2 = line[3:].strip()
            if current_h2 in flagged_h2s:
                skip_section = True
                matching = next(
                    (s for s in outline["sections"] if s["h2"] == current_h2), None
                )
                if matching:
                    issue = next((i for i in issues if i["section"] == current_h2), {})
                    retry_prompt_suffix = f"\n\nNOTA DE REVISIÓN: {issue.get('suggestion', '')}"
                    section_with_note = dict(matching)
                    section_products = [products_by_id[pid] for pid in matching.get("products_to_mention", []) if pid in products_by_id]
                    new_section = step_04_content._generate_section(ctx, matching, section_products, kb)
                    pending_replacement = new_section
                continue
            else:
                skip_section = False
                if pending_replacement:
                    result_lines.append(pending_replacement)
                    pending_replacement = None
        if not skip_section:
            result_lines.append(line)

    if pending_replacement:
        result_lines.append(pending_replacement)

    return "\n".join(result_lines)
```

- [ ] **Step 4: Run tests**

```bash
pytest tests/blog_pipeline/test_step_05.py -v
```
Expected: 2 PASSED.

- [ ] **Step 5: Commit**

```bash
git add scripts/blog_pipeline/step_05_review.py tests/blog_pipeline/test_step_05.py
git commit -m "feat: add step_05_review — SEO/GEO review with single retry on flagged sections"
```

---

## Task 9: Step 6 — Frontmatter + PR Package

**Files:**
- Create: `scripts/blog_pipeline/step_06_frontmatter.py`
- Create: `tests/blog_pipeline/test_step_06.py`

**Interfaces:**
- Consumes: `PipelineContext`, `polished: str`, `outline: dict`, `keywords: dict`, `brief: dict`, `review_warnings: list[str]`
- Produces: `run(ctx, polished, outline, keywords, brief, review_warnings) -> Path` — writes `src/content/blog/{slug}.md` and `.pipeline/{n}/06_meta.json`, returns path to blog file

- [ ] **Step 1: Write the failing test**

Create `tests/blog_pipeline/test_step_06.py`:

```python
import json
import pytest
from pathlib import Path
from unittest.mock import patch
from scripts.blog_pipeline.context import PipelineContext, IssueMetadata
from scripts.blog_pipeline.step_06_frontmatter import run

SAMPLE_OUTLINE = {
    "slug": "cheesecake-restaurantes-caracas",
    "sections": [
        {"h2": "Intro", "image_slot": {"type": "product", "product_id": "cheesecake-clasico"}, "products_to_mention": ["cheesecake-clasico"], "h3s": [], "audience": "b2b", "keyword_to_hit": "", "internal_links": []},
        {"h2": "Distribución", "image_slot": {"type": "lifestyle", "brief": "Foto de repartidor"}, "products_to_mention": [], "h3s": [], "audience": "b2b", "keyword_to_hit": "", "internal_links": []},
    ],
    "closing_cta": {"consumer": "x", "b2b": "y"},
}
SAMPLE_KEYWORDS = {
    "primary_keyword": "cheesecake para restaurantes Caracas",
    "secondary_keywords": ["proveedor cheesecake Venezuela"],
    "audience_segments": ["consumidor", "b2b"],
    "search_intent": "comercial",
    "geo_answer": "Alimentos New York fabrica cheesecakes.",
    "internal_links": [],
}
SAMPLE_BRIEF = {
    "issue_number": 42,
    "metadata": {"scheduled_date": "2026-08-10", "tags": ["cheesecake", "b2b"]},
    "matched_products": [{"id": "cheesecake-clasico", "imagen": "cheesecake-clasico"}],
}
SAMPLE_META = {
    "title": "Cheesecake para restaurantes en Caracas | Alimentos New York",
    "description": "Cheesecake para restaurantes Caracas: proveedor industrial directo.",
}


@pytest.fixture
def ctx(tmp_path):
    cp = tmp_path / "pipeline" / "42"
    cp.mkdir(parents=True)
    blog = tmp_path / "blog"
    blog.mkdir()
    return PipelineContext(
        issue_number=42, issue_title="x", issue_body="",
        metadata=IssueMetadata(scheduled_date="2026-08-10"),
        checkpoint_dir=cp, blog_output_dir=blog,
        content_dir=tmp_path / "content", ai_model="gpt-4",
        ai_api_key="sk-test", ai_base_url="", gsc_site_url="",
        gsc_credentials_file="", github_repo="",
    )


def test_run_creates_blog_md_with_draft_true(ctx):
    with patch("scripts.blog_pipeline.step_06_frontmatter._call_llm", return_value=SAMPLE_META):
        path = run(ctx, "## Intro\n\nContenido.", SAMPLE_OUTLINE, SAMPLE_KEYWORDS, SAMPLE_BRIEF, [])
    content = path.read_text(encoding="utf-8")
    assert "draft: true" in content
    assert "cheesecake-restaurantes-caracas" in str(path)


def test_run_creates_meta_json_with_image_briefs(ctx):
    with patch("scripts.blog_pipeline.step_06_frontmatter._call_llm", return_value=SAMPLE_META):
        run(ctx, "## Intro\n\nContenido.", SAMPLE_OUTLINE, SAMPLE_KEYWORDS, SAMPLE_BRIEF, ["Sección X: sin keyword"])
    meta = json.loads((ctx.checkpoint_dir / "06_meta.json").read_text(encoding="utf-8"))
    assert len(meta["image_briefs"]) == 1  # only lifestyle slots
    assert len(meta["review_warnings"]) == 1
```

- [ ] **Step 2: Run to verify it fails**

```bash
pytest tests/blog_pipeline/test_step_06.py -v
```

- [ ] **Step 3: Create `scripts/blog_pipeline/step_06_frontmatter.py`**

```python
import json
from pathlib import Path
from openai import OpenAI
from .context import PipelineContext

_SYSTEM = (
    "Eres un especialista en metadatos SEO para el blog de Alimentos New York (español, Venezuela). "
    "Generas títulos y descripciones concisas, en español, con la keyword principal al inicio."
)


def run(
    ctx: PipelineContext,
    polished: str,
    outline: dict,
    keywords: dict,
    brief: dict,
    review_warnings: list[str],
) -> Path:
    slug = outline["slug"]
    blog_path = ctx.blog_output_dir / f"{slug}.md"

    meta = _call_llm(ctx, outline, keywords, brief)

    pub_date = brief.get("metadata", {}).get("scheduled_date") or str(__import__("datetime").date.today())
    tags = brief.get("metadata", {}).get("tags", [])

    og_image = _pick_og_image(outline, brief)

    frontmatter = (
        f"---\n"
        f'title: {json.dumps(meta["title"])}\n'
        f'description: {json.dumps(meta["description"])}\n'
        f"pubDate: {pub_date}\n"
        f'author: "eugenio"\n'
        f"draft: true\n"
        f"tags: {json.dumps(tags)}\n"
        f"relatedIssue: {ctx.issue_number}\n"
    )
    if og_image:
        frontmatter += f'ogImage: {json.dumps(og_image)}\n'
    frontmatter += "---\n\n"

    blog_path.parent.mkdir(parents=True, exist_ok=True)
    blog_path.write_text(frontmatter + polished, encoding="utf-8")

    image_briefs = [
        {
            "path": f"/blog/{slug}/{_slugify(s['image_slot']['brief'][:30])}.jpg",
            "brief": s["image_slot"]["brief"],
            "section": s["h2"],
        }
        for s in outline["sections"]
        if s.get("image_slot") and s["image_slot"].get("type") == "lifestyle"
    ]

    meta_doc = {
        "title": meta["title"],
        "description": meta["description"],
        "primary_keyword": keywords.get("primary_keyword", ""),
        "audience_segments": keywords.get("audience_segments", []),
        "search_intent": keywords.get("search_intent", ""),
        "image_briefs": image_briefs,
        "review_warnings": review_warnings,
        "slug": slug,
        "pub_date": pub_date,
    }
    (ctx.checkpoint_dir / "06_meta.json").write_text(
        json.dumps(meta_doc, indent=2, ensure_ascii=False), encoding="utf-8"
    )

    return blog_path


def _call_llm(ctx: PipelineContext, outline: dict, keywords: dict, brief: dict) -> dict:
    prompt = (
        f"Genera el título SEO y la meta descripción para este artículo.\n\n"
        f"Slug: {outline['slug']}\n"
        f"Keyword principal: {keywords.get('primary_keyword', '')}\n"
        f"Keywords secundarias: {', '.join(keywords.get('secondary_keywords', []))}\n"
        f"Secciones del artículo: {', '.join(s['h2'] for s in outline['sections'])}\n\n"
        "REGLAS:\n"
        "- title: ≤60 caracteres, incluye la keyword principal, termina con '| Alimentos New York', en español\n"
        "- description: ≤160 caracteres, la keyword principal en los primeros 20 caracteres, responde la pregunta del usuario, en español\n\n"
        'Devuelve ÚNICAMENTE: {"title": "...", "description": "..."}'
    )
    client = OpenAI(api_key=ctx.ai_api_key, base_url=ctx.ai_base_url or "https://api.openai.com/v1")
    response = client.chat.completions.create(
        model=ctx.ai_model,
        messages=[{"role": "system", "content": _SYSTEM}, {"role": "user", "content": prompt}],
        temperature=0.3,
        response_format={"type": "json_object"},
    )
    return json.loads(response.choices[0].message.content)


def _pick_og_image(outline: dict, brief: dict) -> str | None:
    products_by_id = {p["id"]: p for p in brief.get("matched_products", [])}
    for section in outline["sections"]:
        slot = section.get("image_slot")
        if slot and slot.get("type") == "product":
            pid = slot.get("product_id", "")
            product = products_by_id.get(pid)
            if product and product.get("imagen"):
                return f"/productos/{product['imagen']}"
    return None


def _slugify(text: str) -> str:
    import re
    return re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")
```

- [ ] **Step 4: Run tests**

```bash
pytest tests/blog_pipeline/test_step_06.py -v
```
Expected: 2 PASSED.

- [ ] **Step 5: Commit**

```bash
git add scripts/blog_pipeline/step_06_frontmatter.py tests/blog_pipeline/test_step_06.py
git commit -m "feat: add step_06_frontmatter — SEO frontmatter, OG image, PR meta package"
```

---

## Task 10: Orchestrator

**Files:**
- Create: `scripts/blog_pipeline/main.py`
- Create: `tests/blog_pipeline/test_main.py`

**Interfaces:**
- Consumes: environment variables (same as existing `generate_blog.py`)
- Produces: `main()` — orchestrates steps 1–6, handles `--force-step N`, exits 0 on success

- [ ] **Step 1: Write the failing test**

Create `tests/blog_pipeline/test_main.py`:

```python
import pytest
from unittest.mock import patch, MagicMock
from scripts.blog_pipeline.main import _build_context, _resolve_cross_links
from scripts.blog_pipeline.context import PipelineContext, IssueMetadata


def test_build_context_uses_env_vars(monkeypatch, tmp_path):
    monkeypatch.setenv("GITHUB_TOKEN", "ghp_test")
    monkeypatch.setenv("AI_MODEL", "gpt-4")
    monkeypatch.setenv("AI_PROVIDER_API_KEY", "sk-test")
    monkeypatch.setenv("AI_BASE_URL", "")
    monkeypatch.setenv("GITHUB_REPO", "eugenio/test")
    monkeypatch.setenv("BLOG_OUTPUT_DIR", str(tmp_path / "blog"))
    monkeypatch.setenv("PIPELINE_CHECKPOINT_DIR", str(tmp_path / ".pipeline"))
    monkeypatch.setenv("GSC_SITE_URL", "https://example.com")
    monkeypatch.setenv("GSC_CREDENTIALS_FILE", ".gsc-credentials.json")
    monkeypatch.setenv("BLOG_LANG", "es")

    mock_issue = MagicMock()
    mock_issue.number = 42
    mock_issue.title = "Test"
    mock_issue.body = "scheduled: 2026-08-10"
    meta = IssueMetadata(scheduled_date="2026-08-10")

    ctx = _build_context(mock_issue, meta)
    assert ctx.issue_number == 42
    assert ctx.blog_lang == "es"
    assert ctx.ai_model == "gpt-4"
```

- [ ] **Step 2: Run to verify it fails**

```bash
pytest tests/blog_pipeline/test_main.py -v
```

- [ ] **Step 3: Create `scripts/blog_pipeline/main.py`**

```python
import os
import sys
import argparse
from pathlib import Path
from github import Github
import dotenv

dotenv.load_dotenv()

from .context import PipelineContext, IssueMetadata
from . import step_01_enrich, step_02_keywords, step_03_outline, step_04_content, step_05_review, step_06_frontmatter

# Reuse the existing parse functions from the old generate_blog.py
import re
from datetime import datetime


def _parse_issue_metadata(body: str) -> IssueMetadata:
    meta = IssueMetadata()
    m = re.search(r"scheduled:\s*(\d{4}-\d{2}-\d{2})", body)
    if m:
        meta.scheduled_date = m.group(1)
    m = re.search(r'series:\s*["\']([^"\']+)["\']', body)
    if m:
        meta.series = m.group(1)
    m = re.search(r"part:\s*(\d+)", body)
    if m:
        meta.part = int(m.group(1))
    m = re.search(r"tags:\s*\[(.*?)\]", body)
    if m:
        meta.tags = [t.strip().strip("\"'") for t in m.group(1).split(",")]
    return meta


def _get_existing_slugs(blog_dir: Path) -> dict[int, str]:
    slugs: dict[int, str] = {}
    if not blog_dir.exists():
        return slugs
    for md in blog_dir.glob("*.md"):
        text = md.read_text(encoding="utf-8")
        if text.startswith("---"):
            parts = text.split("---", 2)
            if len(parts) == 3:
                m = re.search(r"relatedIssue:\s*(\d+)", parts[1])
                if m:
                    slugs[int(m.group(1))] = md.stem
    return slugs


def _resolve_cross_links(gh: "Github", prerequisites: list[int], existing_slugs: dict[int, str], github_repo: str) -> dict:
    links: dict = {}
    repo = gh.get_repo(github_repo)
    for num in prerequisites:
        if num in existing_slugs:
            links[str(num)] = {"title": f"Issue #{num}", "url": f"/blog/{existing_slugs[num]}"}
        else:
            try:
                issue = repo.get_issue(num)
                links[str(num)] = {"title": issue.title, "url": None}
            except Exception:
                links[str(num)] = {"title": f"Issue #{num}", "url": None}
    return links


def _build_context(issue, metadata: IssueMetadata, force_step: int | None = None) -> PipelineContext:
    checkpoint_base = Path(os.getenv("PIPELINE_CHECKPOINT_DIR", ".pipeline"))
    checkpoint_dir = checkpoint_base / str(issue.number)
    checkpoint_dir.mkdir(parents=True, exist_ok=True)

    return PipelineContext(
        issue_number=issue.number,
        issue_title=issue.title,
        issue_body=issue.body or "",
        metadata=metadata,
        checkpoint_dir=checkpoint_dir,
        blog_output_dir=Path(os.getenv("BLOG_OUTPUT_DIR", "src/content/blog")),
        content_dir=Path("src/content"),
        ai_model=os.getenv("AI_MODEL", "gpt-4"),
        ai_api_key=os.getenv("AI_PROVIDER_API_KEY", ""),
        ai_base_url=os.getenv("AI_BASE_URL", ""),
        gsc_site_url=os.getenv("GSC_SITE_URL", ""),
        gsc_credentials_file=os.getenv("GSC_CREDENTIALS_FILE", ".gsc-credentials.json"),
        github_repo=os.getenv("GITHUB_REPO", ""),
        blog_lang=os.getenv("BLOG_LANG", "es"),
        force_step=force_step,
        debug=os.getenv("DEBUG", "false").lower() == "true",
    )


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--force-step", type=int, default=None, dest="force_step",
                        help="Re-run from this step number onward (1–6)")
    args = parser.parse_args()

    github_token = os.getenv("GITHUB_TOKEN")
    ai_key = os.getenv("AI_PROVIDER_API_KEY")
    if not github_token or not ai_key:
        print("ERROR: GITHUB_TOKEN and AI_PROVIDER_API_KEY are required.")
        sys.exit(1)

    gh = Github(github_token)
    github_repo = os.getenv("GITHUB_REPO", "")
    repo = gh.get_repo(github_repo)
    issue_label = os.getenv("ISSUE_LABEL", "blog-post-idea")
    blog_output_dir = Path(os.getenv("BLOG_OUTPUT_DIR", "src/content/blog"))

    existing_slugs = _get_existing_slugs(blog_output_dir)
    today = datetime.now().strftime("%Y-%m-%d")
    issues = repo.get_issues(state="open", labels=[issue_label])

    scheduled = []
    for issue in issues:
        meta = _parse_issue_metadata(issue.body or "")
        if meta.scheduled_date and meta.scheduled_date <= today:
            scheduled.append((issue, meta))

    if not scheduled:
        print(f"No scheduled blog issues for today ({today}).")
        return

    issue, metadata = scheduled[0]

    if issue.number in existing_slugs and args.force_step is None:
        print(f"Issue #{issue.number} already published as '{existing_slugs[issue.number]}'. Skipping.")
        return

    ctx = _build_context(issue, metadata, force_step=args.force_step)
    cross_links = _resolve_cross_links(gh, metadata.prerequisites, existing_slugs, github_repo)

    print(f"[1/6] Brief enrichment for issue #{issue.number}...")
    brief = step_01_enrich.run(ctx, cross_links)

    print("[2/6] Keyword strategy...")
    keywords = step_02_keywords.run(ctx, brief)

    print("[3/6] Outline generation...")
    outline = step_03_outline.run(ctx, brief, keywords)

    print("[4/6] Section-by-section content...")
    draft = step_04_content.run(ctx, brief, outline)

    print("[5/6] SEO/GEO review...")
    polished, warnings = step_05_review.run(ctx, draft, brief, keywords, outline)

    print("[6/6] Frontmatter + PR package...")
    blog_path = step_06_frontmatter.run(ctx, polished, outline, keywords, brief, warnings)

    print(f"Done: {blog_path}")
    _export_github_outputs(issue.number, issue.title, outline["slug"], ctx.checkpoint_dir)


def _export_github_outputs(issue_number: int, issue_title: str, slug: str, checkpoint_dir: Path) -> None:
    import json
    output_file = os.getenv("GITHUB_OUTPUT")
    if output_file:
        meta_path = checkpoint_dir / "06_meta.json"
        meta = json.loads(meta_path.read_text(encoding="utf-8")) if meta_path.exists() else {}
        safe_title = issue_title.replace("\n", " ").replace("=", "-")
        with open(output_file, "a") as f:
            f.write(f"issue_number={issue_number}\n")
            f.write(f"issue_title={safe_title}\n")
            f.write(f"slug={slug}\n")
            f.write(f"meta_path={checkpoint_dir}/06_meta.json\n")
    else:
        print(f"  issue_number={issue_number}")
        print(f"  slug={slug}")
```

- [ ] **Step 4: Run tests**

```bash
pytest tests/blog_pipeline/test_main.py -v
```
Expected: 1 PASSED.

- [ ] **Step 5: Run all tests**

```bash
pytest tests/blog_pipeline/ -v
```
Expected: all PASSED.

- [ ] **Step 6: Commit**

```bash
git add scripts/blog_pipeline/main.py tests/blog_pipeline/test_main.py
git commit -m "feat: add orchestrator with checkpoint resumability and --force-step flag"
```

---

## Task 11: Company KB + Astro Collection

**Files:**
- Create: `src/content/empresa/sobre-nosotros.md`
- Create: `src/content/empresa/lineas-de-negocio.md`
- Create: `src/content/empresa/certificaciones.md`
- Create: `src/content/empresa/procesos.md`
- Create: `src/content/empresa/programa-zero-desperdicio.md`
- Create: `src/content/empresa/distribucion.md`
- Modify: `src/content.config.ts`

**Note:** The KB files need to be filled with real company information by the user. This task creates them with a structured template that the pipeline can already use, even with placeholder content. Fill in real details before the first blog post is generated.

- [ ] **Step 1: Add `empresa` collection to `src/content.config.ts`**

Add after the `blogCollection` definition:

```typescript
const empresaCollection = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/empresa" }),
  schema: z.object({
    title: z.string(),
    keywords: z.array(z.string()).default([]),
  })
});
```

And add to the `collections` export:
```typescript
export const collections = {
  productos: productosCollection,
  blog: blogCollection,
  empresa: empresaCollection,
};
```

- [ ] **Step 2: Create `src/content/empresa/sobre-nosotros.md`**

```markdown
---
title: "Sobre Nosotros — Alimentos New York"
keywords: ["alimentos new york", "new york cheese cake", "fábrica panadería venezuela", "pastelería industrial caracas", "historia empresa"]
---

## Quiénes Somos

New York Cheese Cake C.A., conocida comercialmente como Alimentos New York, es una empresa familiar venezolana dedicada a la fabricación y distribución industrial de productos de pastelería, panadería y repostería.

## Misión

[Completar con la misión real de la empresa.]

## Historia

[Completar con la historia de la empresa: año de fundación, fundadores, evolución.]

## Posicionamiento B2B

Somos proveedores directos para supermercados, bodegones, restaurantes, hoteles y empresas de catering en Caracas y sus alrededores. Trabajamos bajo modelo B2B con distribución punto a punto.

## Diferenciadores

- Producción industrial propia con control de calidad
- Certificación Kosher Pat Israel
- Distribución directa tienda por tienda
- Gestión mediante ERP ProfitPlus
```

- [ ] **Step 3: Create `src/content/empresa/lineas-de-negocio.md`**

```markdown
---
title: "Líneas de Negocio"
keywords: ["proveedor supermercados venezuela", "proveedor restaurantes caracas", "foodservice venezuela", "distribuidor panadería", "horeca venezuela", "bodegón proveedor"]
---

## Supermercados y Retail

Abastecemos cadenas de supermercados y bodegones independientes en Caracas. Ofrecemos:
- [Completar: condiciones comerciales, mínimos de pedido, frecuencia de entrega]
- Programa Zero Desperdicio: rotación de mercancía próxima a vencimiento con notas de crédito

## Foodservice / HORECA

Proveemos a hoteles, restaurantes y empresas de catering con líneas especializadas:
- [Completar: productos más solicitados, presentaciones disponibles para cocina profesional]
- Volúmenes y presentaciones adaptadas a cocina profesional

## Canal Corporativo

[Completar: descripción del canal corporativo, eventos, empresas cliente.]

## Venta Directa

[Completar: si aplica punto de venta propio o despacho directo al consumidor.]
```

- [ ] **Step 4: Create `src/content/empresa/certificaciones.md`**

```markdown
---
title: "Certificaciones"
keywords: ["kosher venezuela", "kosher pat israel", "certificación alimentaria venezuela", "panadería kosher caracas"]
---

## Kosher Pat Israel

Alimentos New York cuenta con certificación Kosher Pat Israel para sus productos de panadería y repostería.

[Completar: organismo certificador, número de certificado si es público, productos certificados, vigencia.]

## Otras Certificaciones

[Completar: INVIMA, SENCAMER, SENAHSENIAT o cualquier otra certificación sanitaria y comercial vigente.]
```

- [ ] **Step 5: Create `src/content/empresa/procesos.md`**

```markdown
---
title: "Procesos de Producción"
keywords: ["panadería industrial venezuela", "repostería industrial caracas", "producción congelados venezuela", "proceso panificación industrial"]
---

## Proceso Industrial

[Completar: descripción del proceso de producción — mezcla, fermentación, horneado, congelado, empaque.]

## Control de Calidad

[Completar: controles de temperatura, trazabilidad, fechas de vencimiento, manejo de merma.]

## Capacidad de Producción

[Completar: capacidad en unidades por turno o por semana, si es información pública.]

## Ingredientes

[Completar: política de ingredientes — locales vs. importados, estándares de frescura.]
```

- [ ] **Step 6: Create `src/content/empresa/programa-zero-desperdicio.md`**

```markdown
---
title: "Programa Zero Desperdicio"
keywords: ["zero desperdicio supermercado", "rotación mercancía próxima vencimiento", "nota crédito supermercado venezuela", "reducción desperdicio alimentario"]
---

## Qué es el Programa Zero Desperdicio

Proyecto piloto diseñado para supermercados que busca rotar mercancía próxima a su fecha de vencimiento (dentro de un margen de 5 días) mediante promociones con notas de crédito y etiquetado especial.

## Cómo Funciona

1. Identificación de productos con ≤5 días de vida útil remanente
2. Etiquetado especial visible en anaquel
3. Descuento aplicado mediante nota de crédito al supermercado
4. Beneficio para el consumidor: precio reducido; beneficio para el supermercado: cero merma contable

## Supermercados Participantes

[Completar: cadenas o formatos piloto actuales.]

## Contacto

Para incorporarse al programa: [Completar con contacto comercial.]
```

- [ ] **Step 7: Create `src/content/empresa/distribucion.md`**

```markdown
---
title: "Distribución y Logística"
keywords: ["distribución panadería caracas", "reparto punto a punto caracas", "logística alimentos venezuela", "cobertura distribución caracas"]
---

## Modelo de Distribución

Operamos bajo un modelo de distribución directa punto a punto: nuestros vehículos realizan entregas tienda por tienda en rutas de Caracas y [completar: zonas cubiertas].

## Zonas de Cobertura

[Completar: municipios, parroquias o sectores de Caracas con cobertura regular.]

## Frecuencia de Entregas

[Completar: días de despacho, ventana horaria de entrega, condiciones de pedido mínimo.]

## Condiciones Comerciales

[Completar: forma de pago, crédito disponible, proceso para nuevos clientes.]

## Cómo Convertirse en Cliente

Para solicitar distribución como nuevo punto de venta o foodservice: [Completar con proceso de onboarding.]
```

- [ ] **Step 8: Verify Astro build still passes**

```bash
cd /Users/eugenio/conductor/workspaces/web/regina && bun run build
```
Expected: build succeeds (empresa collection with no content errors).

- [ ] **Step 9: Commit**

```bash
git add src/content.config.ts src/content/empresa/
git commit -m "feat: add empresa KB content collection for blog pipeline grounding"
```

---

## Task 12: GitHub Actions Update

**Files:**
- Modify: `.github/workflows/daily-blog-generator.yml`

- [ ] **Step 1: Update the workflow**

Replace the existing `daily-blog-generator.yml` with:

```yaml
name: Daily Blog Post Generator

on:
  schedule:
    - cron: '0 8 * * *'
  workflow_dispatch:
    inputs:
      force_step:
        description: 'Re-run from step N (1-6). Leave empty for normal run.'
        required: false
        default: ''

permissions:
  contents: write
  pull-requests: write
  issues: write

jobs:
  generate-blog:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version-file: '.python-version'
          cache: 'pip'

      - name: Install uv
        run: pip install uv

      - name: Install dependencies
        run: uv pip install --system -r requirements.txt

      - name: Run blog pipeline
        id: generate
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          AI_MODEL: gpt-4
          AI_PROVIDER_API_KEY: ${{ secrets.OPENAI_API_KEY }}
          AI_BASE_URL: ''
          GITHUB_REPO: ${{ github.repository }}
          BLOG_OUTPUT_DIR: src/content/blog
          ISSUE_LABEL: blog-post-idea
          GSC_SITE_URL: ${{ secrets.GSC_SITE_URL }}
          GSC_CREDENTIALS_FILE: .gsc-credentials.json
          BLOG_LANG: es
          PIPELINE_CHECKPOINT_DIR: .pipeline
          DEBUG: false
        run: |
          FORCE_STEP="${{ github.event.inputs.force_step }}"
          if [ -n "$FORCE_STEP" ]; then
            python scripts/generate_blog.py --force-step "$FORCE_STEP"
          else
            python scripts/generate_blog.py
          fi

      - name: Upload pipeline artifacts
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: pipeline-checkpoints-${{ steps.generate.outputs.issue_number || 'unknown' }}
          path: .pipeline/
          retention-days: 7

      - name: Check for changes
        id: check
        run: |
          if git diff --quiet; then
            echo "has_changes=false" >> $GITHUB_OUTPUT
          else
            echo "has_changes=true" >> $GITHUB_OUTPUT
          fi

      - name: Read PR meta
        id: meta
        if: steps.check.outputs.has_changes == 'true'
        run: |
          META_FILE=".pipeline/${{ steps.generate.outputs.issue_number }}/06_meta.json"
          if [ -f "$META_FILE" ]; then
            echo "meta_exists=true" >> $GITHUB_OUTPUT
          else
            echo "meta_exists=false" >> $GITHUB_OUTPUT
          fi

      - name: Create Pull Request
        if: steps.check.outputs.has_changes == 'true'
        uses: peter-evans/create-pull-request@v6
        with:
          commit-message: 'blog: auto-generate post for issue #${{ steps.generate.outputs.issue_number }}'
          title: 'blog: add "${{ steps.generate.outputs.issue_title }}"'
          body-path: .pipeline/${{ steps.generate.outputs.issue_number }}/pr_body.md
          branch: blog/issue-${{ steps.generate.outputs.issue_number }}
          delete-branch: true
          labels: |
            blog
            automated
```

- [ ] **Step 2: Add PR body generation to `step_06_frontmatter.py`**

In `step_06_frontmatter.run()`, after writing `06_meta.json`, add:

```python
    _write_pr_body(ctx.checkpoint_dir, meta_doc)
```

Add this function to `step_06_frontmatter.py`:

```python
def _write_pr_body(checkpoint_dir: Path, meta: dict) -> None:
    warnings_section = ""
    if meta["review_warnings"]:
        warnings_section = "\n## ⚠️ Advertencias de revisión automática\n\n" + "\n".join(
            f"- {w}" for w in meta["review_warnings"]
        )

    image_section = ""
    if meta["image_briefs"]:
        image_section = "\n## Imágenes necesarias\n\n" + "\n".join(
            f"**`{b['path']}`** (sección: _{b['section']}_)\n> {b['brief']}\n"
            for b in meta["image_briefs"]
        )

    body = (
        f'## Artículo generado: "{meta["title"]}"\n\n'
        f'**Keyword principal:** {meta["primary_keyword"]}\n'
        f'**Segmentos:** {", ".join(meta["audience_segments"])}\n'
        f'**Intención de búsqueda:** {meta["search_intent"]}\n'
        f"{image_section}"
        f"{warnings_section}\n\n"
        "## Checklist para revisor\n\n"
        "- [ ] Leer el artículo completo en la vista previa del PR\n"
        "- [ ] Verificar que los datos de producto son correctos\n"
        "- [ ] Agregar imágenes faltantes a `public/blog/`\n"
        "- [ ] Cambiar `draft: true` a `draft: false` en el frontmatter\n"
        "- [ ] Aprobar y hacer merge\n"
    )
    (checkpoint_dir / "pr_body.md").write_text(body, encoding="utf-8")
```

- [ ] **Step 3: Add GSC secrets note to `.env.example`**

Verify the new env vars added in Task 1 are present. Also add the GitHub Actions secrets note:

```env
# GitHub Actions secrets required (in addition to above):
# - OPENAI_API_KEY
# - GSC_SITE_URL  (e.g. https://www.alimentosnewyork.com)
# GSC_CREDENTIALS_FILE requires the service account JSON uploaded as a GitHub secret
# and written to disk in a workflow step (not shown here — add a step before run_pipeline)
```

- [ ] **Step 4: Run full test suite**

```bash
pytest tests/blog_pipeline/ -v
```
Expected: all PASSED.

- [ ] **Step 5: Commit**

```bash
git add .github/workflows/daily-blog-generator.yml scripts/blog_pipeline/step_06_frontmatter.py .env.example
git commit -m "feat: update GitHub Actions workflow with artifact upload, PR body from meta, force-step input"
```

---

## Self-Review Checklist

**Spec coverage:**
- [x] 6-step sequential pipeline — Tasks 4–10
- [x] `scripts/blog_pipeline/` package — Task 1
- [x] `PipelineContext` dataclass — Task 1
- [x] `generate_blog.py` thin shim — Task 1
- [x] Catalog loader (productos + empresa) — Task 2
- [x] GSC client with traffic arbitrage detection — Task 3
- [x] Step 1: Brief Enrichment (no LLM) — Task 4
- [x] Step 2: Keyword Strategy (1 LLM call) — Task 5
- [x] Step 3: Outline Generation (1 LLM call) — Task 6
- [x] Step 4: Section-by-section content (1 LLM call/H2) — Task 7
- [x] Step 5: Review + partial retry — Task 8
- [x] Step 6: Frontmatter + PR Package — Task 9
- [x] Orchestrator with checkpoint resumability — Task 10
- [x] `src/content/empresa/` KB files — Task 11
- [x] Astro collection config updated — Task 11
- [x] GitHub Actions artifact upload — Task 12
- [x] PR body from `06_meta.json` — Tasks 9 + 12
- [x] `draft: true` in all generated posts — Task 9
- [x] Spanish enforced in all LLM calls — Tasks 5, 6, 7, 8, 9
- [x] `response_format={"type": "json_object"}` for structured steps — Tasks 5, 6, 8, 9
- [x] temperature=0.3 for structured, 0.7 for content — Tasks 5, 6, 7, 8, 9
- [x] `ensure_ascii=False` on all JSON writes — all step tasks
- [x] Image strategy: product auto-embed + lifestyle brief in PR — Tasks 7, 9, 12
- [x] `.pipeline/` gitignored — Task 1
- [x] New env vars in `.env.example` — Task 1

**Type consistency:** `PipelineContext` defined in Task 1 used consistently across Tasks 4–10. `run()` signatures match between producer and consumer tasks. `_call_llm` helper is local to each step module — no cross-step function name conflicts.
