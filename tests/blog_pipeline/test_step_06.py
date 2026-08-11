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
    pr = (ctx.checkpoint_dir / "pr_body.md").read_text(encoding="utf-8")
    assert "Sección X: sin keyword" in pr  # warning forwarded
    assert "Foto de repartidor" in pr       # lifestyle brief
    assert "draft: true" in pr             # checklist item
