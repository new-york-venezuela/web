import pytest
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
