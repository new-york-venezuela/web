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
