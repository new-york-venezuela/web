import json
import pytest
from pathlib import Path
from unittest.mock import patch
from scripts.blog_pipeline.context import PipelineContext, IssueMetadata
from scripts.blog_pipeline.step_01_enrich import run


@pytest.fixture
def ctx(tmp_path):
    checkpoint = tmp_path / "pipeline" / "42"
    checkpoint.mkdir(parents=True)
    content = tmp_path / "content"
    (content / "productos").mkdir(parents=True)
    (content / "productos" / "cheesecake-clasico.md").write_text(
        '---\ntitle: "Cheesecake Clásico"\nid: "cheesecake-clasico"\n'
        'palabras_clave: ["cheesecake","postre"]\nimagen: "cheesecake"\n'
        'categoria_primaria: "supermarket"\ncategoria_secundaria: "reposteria"\n---\nCuerpo.',
        encoding="utf-8",
    )
    return PipelineContext(
        issue_number=42,
        issue_title="Cheesecake para restaurantes en Caracas",
        issue_body="Artículo sobre proveer cheesecake a restaurantes.",
        metadata=IssueMetadata(scheduled_date="2026-08-10", tags=["cheesecake"]),
        checkpoint_dir=checkpoint,
        blog_output_dir=tmp_path / "blog",
        content_dir=content,
        ai_model="gpt-4",
        ai_api_key="sk-test",
        ai_base_url="",
        gsc_site_url="https://example.com",
        gsc_credentials_file=str(tmp_path / "missing.json"),
        github_repo="eugenio/test",
    )


def test_run_creates_brief_json(ctx):
    with patch("scripts.blog_pipeline.step_01_enrich.fetch_top_queries", return_value=[]):
        brief = run(ctx, cross_links={})
    output = ctx.checkpoint_dir / "01_brief.json"
    assert output.exists()
    assert brief["issue_number"] == 42
    assert any(p["id"] == "cheesecake-clasico" for p in brief["matched_products"])
    assert brief["traffic_arbitrage"] is True


def test_run_uses_checkpoint_if_exists(ctx):
    existing = {"issue_number": 42, "issue_title": "cached", "matched_products": [], "gsc_queries": [], "traffic_arbitrage": False, "matched_kb_sections": [], "cross_links": {}, "issue_body": "", "metadata": {}}
    (ctx.checkpoint_dir / "01_brief.json").write_text(json.dumps(existing), encoding="utf-8")
    brief = run(ctx, cross_links={})
    assert brief["issue_title"] == "cached"


def test_run_includes_image_metadata_in_brief(ctx):
    ctx.metadata.image_url = "/productos/pan-brioche.jpg"
    ctx.metadata.image_brief = "Pan brioche cortado mostrando la miga"
    with patch("scripts.blog_pipeline.step_01_enrich.fetch_top_queries", return_value=[]):
        brief = run(ctx, cross_links={})
    assert brief["metadata"]["image_url"] == "/productos/pan-brioche.jpg"
    assert brief["metadata"]["image_brief"] == "Pan brioche cortado mostrando la miga"


def test_run_image_metadata_none_when_not_set(ctx):
    with patch("scripts.blog_pipeline.step_01_enrich.fetch_top_queries", return_value=[]):
        brief = run(ctx, cross_links={})
    assert brief["metadata"]["image_url"] is None
    assert brief["metadata"]["image_brief"] is None
