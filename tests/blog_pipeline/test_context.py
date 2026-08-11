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
