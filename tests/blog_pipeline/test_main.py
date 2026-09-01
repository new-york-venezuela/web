import pytest
import yaml
from unittest.mock import patch, MagicMock
from scripts.blog_pipeline.main import (
    _build_context,
    _resolve_cross_links,
    _parse_issue_metadata,
    _get_existing_post_slugs,
)
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


_SAMPLE_ISSUE_BODY = """**ID:** `post-030` | **Semana:** 26 | **Fecha sugerida:** 2027-03-02

### Detalle de Estrategia
* **Pilar:** Panaderia & Tendencias Gastronomicas
* **Audiencia:** B2B & B2C
* **Keyword Principal:** `fermentacion natural panaderia caracas`

---

### Resumen Ejecutivo
Explicacion pedagogica sobre como el respeto al tiempo de reposo de las masas mejora la digestibilidad y aroma del pan.

---

### Sugerencia de Imagen
* **Tipo:** Fotografia Macro Artesanal
* **Descripción:** Masa fermentada en reposo mostrando burbujas de aire naturales antes del formado e ingrediente harina espolvoreada.

---

### Enlazado Interno Sugerido
* post-005
* post-030
"""


def test_parse_issue_metadata_new_format():
    meta = _parse_issue_metadata(_SAMPLE_ISSUE_BODY)
    assert meta.post_id == "post-030"
    assert meta.week == 26
    assert meta.scheduled_date == "2027-03-02"
    assert meta.pilar == "Panaderia & Tendencias Gastronomicas"
    assert meta.audience == "B2B & B2C"
    assert meta.primary_keyword == "fermentacion natural panaderia caracas"
    assert meta.prerequisites == ["post-005", "post-030"]


def test_get_existing_post_slugs(tmp_path):
    blog_dir = tmp_path / "blog"
    blog_dir.mkdir()
    (blog_dir / "fermentacion-natural.md").write_text(
        '---\ntitle: "x"\npostId: "post-005"\n---\ncuerpo', encoding="utf-8"
    )
    (blog_dir / "sin-post-id.md").write_text(
        '---\ntitle: "y"\n---\ncuerpo', encoding="utf-8"
    )
    slugs = _get_existing_post_slugs(blog_dir)
    assert slugs == {"post-005": "fermentacion-natural"}


def test_resolve_cross_links_known_and_unknown():
    existing = {"post-005": "fermentacion-natural"}
    links = _resolve_cross_links(["post-005", "post-999"], existing)
    assert links["post-005"] == {"title": "fermentacion-natural", "url": "/blog/fermentacion-natural"}
    assert links["post-999"] == {"title": "post-999", "url": None}


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
