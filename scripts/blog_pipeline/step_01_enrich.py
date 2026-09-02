import json
from .context import PipelineContext
from .catalog_loader import load_productos, load_empresa_kb, match_by_keywords, extract_topic_words
from .gsc_client import fetch_top_queries, filter_queries_for_topic, detect_traffic_arbitrage


def run(ctx: PipelineContext, cross_links: dict) -> dict:
    output_path = ctx.checkpoint_dir / "01_brief.json"
    if output_path.exists() and (ctx.force_step is None or ctx.force_step > 1):
        try:
            return json.loads(output_path.read_text(encoding="utf-8"))
        except (json.JSONDecodeError, OSError):
            pass  # fall through to recompute

    topic_words = extract_topic_words(ctx.issue_title, ctx.issue_body)

    try:
        productos = load_productos(ctx.content_dir)
    except Exception:
        productos = []

    try:
        matched_products = match_by_keywords(productos, topic_words)
    except Exception:
        matched_products = []

    try:
        kb_sections = load_empresa_kb(ctx.content_dir)
        matched_kb = match_by_keywords(kb_sections, topic_words)
    except Exception:
        kb_sections = []
        matched_kb = []

    try:
        gsc_queries = fetch_top_queries(ctx.gsc_site_url, ctx.gsc_credentials_file)
        topic_gsc = filter_queries_for_topic(gsc_queries, topic_words)
    except Exception:
        topic_gsc = []

    traffic_arbitrage = detect_traffic_arbitrage(topic_words)

    brief = {
        "issue_number": ctx.issue_number,
        "issue_title": ctx.issue_title,
        "issue_body": ctx.issue_body,
        "metadata": {
            "post_id": ctx.metadata.post_id,
            "week": ctx.metadata.week,
            "scheduled_date": ctx.metadata.scheduled_date,
            "pilar": ctx.metadata.pilar,
            "audience": ctx.metadata.audience,
            "primary_keyword": ctx.metadata.primary_keyword,
            "tags": ctx.metadata.tags,
            "image_url": ctx.metadata.image_url,
            "image_brief": ctx.metadata.image_brief,
        },
        "matched_products": [
            {
                "id": p["id"],
                "title": p["title"],
                "keywords": p["keywords"],
                "imagen": p["imagen"],
                "body": p["body"],
            }
            for p in matched_products
        ],
        "matched_kb_sections": [
            {"file": s["file"], "title": s["title"], "excerpt": s["excerpt"]}
            for s in matched_kb
        ],
        "gsc_queries": topic_gsc,
        "traffic_arbitrage": traffic_arbitrage,
        "cross_links": cross_links,
    }

    output_path.write_text(json.dumps(brief, indent=2, ensure_ascii=False), encoding="utf-8")
    return brief
