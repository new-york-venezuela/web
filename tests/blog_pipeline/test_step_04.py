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
