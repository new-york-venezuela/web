import os
import sys
import argparse
from pathlib import Path
from github import Github
import dotenv

dotenv.load_dotenv()

from .context import PipelineContext, IssueMetadata
from . import step_01_enrich, step_02_keywords, step_03_outline, step_04_content, step_05_review, step_06_frontmatter

import re
import yaml
from datetime import datetime


def _parse_issue_metadata(body: str) -> IssueMetadata:
    yaml_match = re.search(r"```yaml\s*\n(.*?)\n```", body, re.S)
    if yaml_match:
        try:
            data = yaml.safe_load(yaml_match.group(1)) or {}
            return IssueMetadata(
                post_id=str(data["post_id"]) if data.get("post_id") else None,
                week=int(data["week"]) if data.get("week") else None,
                scheduled_date=str(data["scheduled_date"]) if data.get("scheduled_date") else None,
                pilar=str(data.get("pilar", "")),
                audience=str(data.get("audience", "")),
                primary_keyword=str(data.get("primary_keyword", "")),
                tags=list(data.get("tags") or []),
                image_url=str(data["image_url"]) if data.get("image_url") else None,
                image_brief=str(data["image_brief"]) if data.get("image_brief") else None,
                related_posts=[int(n) for n in (data.get("related_posts") or [])],
            )
        except (yaml.YAMLError, ValueError, KeyError):
            pass  # fall through to legacy parser

    return _parse_issue_metadata_legacy(body)


def _parse_issue_metadata_legacy(body: str) -> IssueMetadata:
    """Regex-based parser for issues written before the YAML template."""
    meta = IssueMetadata()
    m = re.search(r"\*\*ID:\*\*\s*`?([\w-]+)`?", body)
    if m:
        meta.post_id = m.group(1)
    m = re.search(r"\*\*Semana:\*\*\s*(\d+)", body)
    if m:
        meta.week = int(m.group(1))
    m = re.search(r"\*\*Fecha sugerida:\*\*\s*(\d{4}-\d{2}-\d{2})", body)
    if m:
        meta.scheduled_date = m.group(1)
    m = re.search(r"\*\*Pilar:\*\*\s*(.+)", body)
    if m:
        meta.pilar = m.group(1).strip()
    m = re.search(r"\*\*Audiencia:\*\*\s*(.+)", body)
    if m:
        meta.audience = m.group(1).strip()
    m = re.search(r"\*\*Keyword Principal:\*\*\s*`?([^`\n]+)`?", body)
    if m:
        meta.primary_keyword = m.group(1).strip()
    section = re.search(r"Enlazado Interno Sugerido\s*\n(.+?)(?:\n---|\n###|\Z)", body, re.S)
    if section:
        meta.prerequisites = re.findall(r"post-\d+", section.group(1))
    return meta


def _get_existing_slugs(blog_dir: Path) -> dict[int, str]:
    slugs: dict[int, str] = {}
    if not blog_dir.exists():
        return slugs
    for md in blog_dir.glob("*.md"):
        text = md.read_text(encoding="utf-8")
        if text.startswith("---"):
            parts = text.split("---", 2)
            if len(parts) == 3:
                m = re.search(r"relatedIssue:\s*(\d+)", parts[1])
                if m:
                    slugs[int(m.group(1))] = md.stem
    return slugs


def _get_existing_post_slugs(blog_dir: Path) -> dict[str, str]:
    slugs: dict[str, str] = {}
    if not blog_dir.exists():
        return slugs
    for md in blog_dir.glob("*.md"):
        text = md.read_text(encoding="utf-8")
        if text.startswith("---"):
            parts = text.split("---", 2)
            if len(parts) == 3:
                m = re.search(r"postId:\s*['\"]?(post-\d+)['\"]?", parts[1])
                if m:
                    slugs[m.group(1)] = md.stem
    return slugs


def _resolve_cross_links(prerequisites: list[str], existing_post_slugs: dict[str, str]) -> dict:
    links: dict = {}
    for post_id in prerequisites:
        if post_id in existing_post_slugs:
            slug = existing_post_slugs[post_id]
            links[post_id] = {"title": slug, "url": f"/blog/{slug}"}
        else:
            links[post_id] = {"title": post_id, "url": None}
    return links


def _resolve_cross_links_by_issue(
    related_posts: list[int], existing_slugs: dict[int, str]
) -> dict:
    links: dict = {}
    for issue_num in related_posts:
        slug = existing_slugs.get(issue_num)
        if slug:
            links[issue_num] = {"title": slug, "url": f"/blog/{slug}"}
        else:
            links[issue_num] = {"title": str(issue_num), "url": None}
    return links


def _build_context(issue, metadata: IssueMetadata, force_step: int | None = None) -> PipelineContext:
    checkpoint_base = Path(os.getenv("PIPELINE_CHECKPOINT_DIR", ".pipeline"))
    checkpoint_dir = checkpoint_base / str(issue.number)
    checkpoint_dir.mkdir(parents=True, exist_ok=True)

    return PipelineContext(
        issue_number=issue.number,
        issue_title=issue.title,
        issue_body=issue.body or "",
        metadata=metadata,
        checkpoint_dir=checkpoint_dir,
        blog_output_dir=Path(os.getenv("BLOG_OUTPUT_DIR", "src/content/blog")),
        content_dir=Path("src/content"),
        ai_model=os.getenv("AI_MODEL", "gpt-4o"),
        ai_api_key=os.getenv("AI_PROVIDER_API_KEY", ""),
        ai_base_url=os.getenv("AI_BASE_URL", ""),
        gsc_site_url=os.getenv("GSC_SITE_URL", ""),
        gsc_credentials_file=os.getenv("GSC_CREDENTIALS_FILE", ".gsc-credentials.json"),
        github_repo=os.getenv("GITHUB_REPO", ""),
        blog_lang=os.getenv("BLOG_LANG", "es"),
        force_step=force_step,
        debug=os.getenv("DEBUG", "false").lower() == "true",
    )


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--force-step", type=int, default=None, dest="force_step",
                        help="Re-run from this step number onward (1–6)")
    args = parser.parse_args()

    github_token = os.getenv("GITHUB_TOKEN")
    ai_key = os.getenv("AI_PROVIDER_API_KEY")
    if not github_token or not ai_key:
        print("ERROR: GITHUB_TOKEN and AI_PROVIDER_API_KEY are required.")
        sys.exit(1)

    gh = Github(github_token)
    github_repo = os.getenv("GITHUB_REPO", "")
    repo = gh.get_repo(github_repo)
    issue_label = os.getenv("ISSUE_LABEL", "blog-post-idea")
    blog_output_dir = Path(os.getenv("BLOG_OUTPUT_DIR", "src/content/blog"))

    existing_slugs = _get_existing_slugs(blog_output_dir)
    today = datetime.now().strftime("%Y-%m-%d")
    issues = repo.get_issues(state="open", labels=[issue_label])

    scheduled = []
    for issue in issues:
        meta = _parse_issue_metadata(issue.body or "")
        if meta.scheduled_date and meta.scheduled_date <= today:
            scheduled.append((issue, meta))

    if not scheduled:
        print(f"No scheduled blog issues for today ({today}).")
        return

    issue, metadata = scheduled[0]

    if issue.number in existing_slugs and args.force_step is None:
        print(f"Issue #{issue.number} already published as '{existing_slugs[issue.number]}'. Skipping.")
        return

    ctx = _build_context(issue, metadata, force_step=args.force_step)
    existing_post_slugs = _get_existing_post_slugs(blog_output_dir)

    if metadata.related_posts:
        cross_links = _resolve_cross_links_by_issue(metadata.related_posts, existing_slugs)
    else:
        # Legacy fallback: resolve by post-XXX id
        cross_links = _resolve_cross_links(metadata.prerequisites, existing_post_slugs)

    print(f"[1/6] Brief enrichment for issue #{issue.number}...")
    brief = step_01_enrich.run(ctx, cross_links)

    print("[2/6] Keyword strategy...")
    keywords = step_02_keywords.run(ctx, brief)

    print("[3/6] Outline generation...")
    outline = step_03_outline.run(ctx, brief, keywords)

    print("[4/6] Section-by-section content...")
    draft = step_04_content.run(ctx, brief, outline)

    print("[5/6] SEO/GEO review...")
    polished, warnings = step_05_review.run(ctx, draft, brief, keywords, outline)

    print("[6/6] Frontmatter + PR package...")
    blog_path = step_06_frontmatter.run(ctx, polished, outline, keywords, brief, warnings)

    print(f"Done: {blog_path}")
    _export_github_outputs(issue.number, issue.title, outline["slug"], ctx.checkpoint_dir)


def _export_github_outputs(issue_number: int, issue_title: str, slug: str, checkpoint_dir: Path) -> None:
    import json
    output_file = os.getenv("GITHUB_OUTPUT")
    if output_file:
        meta_path = checkpoint_dir / "06_meta.json"
        meta = json.loads(meta_path.read_text(encoding="utf-8")) if meta_path.exists() else {}
        safe_title = issue_title.replace("\n", " ").replace("=", "-")
        with open(output_file, "a") as f:
            f.write(f"issue_number={issue_number}\n")
            f.write(f"issue_title={safe_title}\n")
            f.write(f"slug={slug}\n")
            f.write(f"meta_path={checkpoint_dir}/06_meta.json\n")
    else:
        print(f"  issue_number={issue_number}")
        print(f"  slug={slug}")
