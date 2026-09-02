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
