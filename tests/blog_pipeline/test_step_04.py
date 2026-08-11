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
