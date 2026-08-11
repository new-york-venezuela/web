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
from datetime import datetime


def _parse_issue_metadata(body: str) -> IssueMetadata:
    meta = IssueMetadata()
    m = re.search(r"scheduled:\s*(\d{4}-\d{2}-\d{2})", body)
    if m:
        meta.scheduled_date = m.group(1)
    m = re.search(r'series:\s*["\']([^"\']+)["\']', body)
    if m:
        meta.series = m.group(1)
    m = re.search(r"part:\s*(\d+)", body)
    if m:
        meta.part = int(m.group(1))
    m = re.search(r"tags:\s*\[(.*?)\]", body)
    if m:
        meta.tags = [t.strip().strip("\"'") for t in m.group(1).split(",")]
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


def _resolve_cross_links(gh: "Github", prerequisites: list[int], existing_slugs: dict[int, str], github_repo: str) -> dict:
    links: dict = {}
    repo = gh.get_repo(github_repo)
    for num in prerequisites:
        if num in existing_slugs:
            links[str(num)] = {"title": f"Issue #{num}", "url": f"/blog/{existing_slugs[num]}"}
        else:
            try:
                issue = repo.get_issue(num)
                links[str(num)] = {"title": issue.title, "url": None}
            except Exception:
                links[str(num)] = {"title": f"Issue #{num}", "url": None}
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
        ai_model=os.getenv("AI_MODEL", "gpt-4"),
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
    cross_links = _resolve_cross_links(gh, metadata.prerequisites, existing_slugs, github_repo)

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
