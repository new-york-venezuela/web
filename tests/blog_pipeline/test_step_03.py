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


def test_validate_outline_raises_on_missing_closing_cta():
    with pytest.raises(ValueError):
        _validate_outline({"slug": "x", "sections": [{"h2": "H2"}], "closing_cta": {}})


def test_outline_sections_have_word_budget(ctx):
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
        result = run(ctx, brief={
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
