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
