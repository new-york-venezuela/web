#!/usr/bin/env python3
"""
Automated blog post generator for Astro.

Finds scheduled GitHub issues, parses metadata/relationships, and generates
SEO-optimized markdown posts using Claude/OpenAI APIs.
"""

import os
import re
import json
import sys
from datetime import datetime
from pathlib import Path
from typing import Optional
from dataclasses import dataclass

import dotenv
from github import Github
from openai import OpenAI, AzureOpenAI

dotenv.load_dotenv()

# Configuration from environment
GITHUB_TOKEN = os.getenv("GITHUB_TOKEN")
GITHUB_REPO = os.getenv("GITHUB_REPO", "eugenio/new-york-venezuela-web")
AI_MODEL = os.getenv("AI_MODEL", "gpt-4")
AI_PROVIDER_API_KEY = os.getenv("AI_PROVIDER_API_KEY")
AI_BASE_URL = os.getenv("AI_BASE_URL", "")
BLOG_OUTPUT_DIR = Path(os.getenv("BLOG_OUTPUT_DIR", "src/content/blog"))
ISSUE_LABEL = os.getenv("ISSUE_LABEL", "blog-post-idea")
DEBUG = os.getenv("DEBUG", "false").lower() == "true"


@dataclass
class IssueMetadata:
    """Parsed metadata from an issue body."""
    scheduled_date: Optional[str] = None
    series: Optional[str] = None
    part: Optional[int] = None
    prerequisites: list = None
    parent_topic: Optional[str] = None
    tags: list = None

    def __post_init__(self):
        if self.prerequisites is None:
            self.prerequisites = []
        if self.tags is None:
            self.tags = []


def parse_issue_metadata(issue_body: str) -> IssueMetadata:
    """Extract structured metadata from issue body."""
    metadata = IssueMetadata()

    # scheduled: YYYY-MM-DD
    scheduled_match = re.search(r"scheduled:\s*(\d{4}-\d{2}-\d{2})", issue_body)
    if scheduled_match:
        metadata.scheduled_date = scheduled_match.group(1)

    # series: "Series Name"
    series_match = re.search(r'series:\s*["\']([^"\']+)["\']', issue_body)
    if series_match:
        metadata.series = series_match.group(1)

    # part: N
    part_match = re.search(r"part:\s*(\d+)", issue_body)
    if part_match:
        metadata.part = int(part_match.group(1))

    # prerequisites: [#12, #15]
    prereq_match = re.search(r"prerequisites:\s*\[(.*?)\]", issue_body)
    if prereq_match:
        prereq_str = prereq_match.group(1)
        metadata.prerequisites = [
            int(m.group(1))
            for m in re.finditer(r"#(\d+)", prereq_str)
        ]

    # parent_topic: "#10"
    parent_match = re.search(r'parent_topic:\s*"?#?(\d+)"?', issue_body)
    if parent_match:
        metadata.parent_topic = f"#{parent_match.group(1)}"

    # tags: [tag1, tag2]
    tags_match = re.search(r"tags:\s*\[(.*?)\]", issue_body)
    if tags_match:
        tags_str = tags_match.group(1)
        metadata.tags = [
            tag.strip().strip("\"'")
            for tag in tags_str.split(",")
        ]

    return metadata


def get_existing_blog_slugs() -> dict:
    """Map issue numbers to blog post slugs from existing markdown files."""
    slug_map = {}
    if not BLOG_OUTPUT_DIR.exists():
        return slug_map

    for md_file in BLOG_OUTPUT_DIR.glob("*.md"):
        try:
            with open(md_file, "r", encoding="utf-8") as f:
                content = f.read()
                # Extract frontmatter
                if content.startswith("---"):
                    parts = content.split("---", 2)
                    if len(parts) == 3:  # Must have opening and closing ---
                        _, frontmatter, _ = parts
                        # Look for issue reference in frontmatter (e.g., relatedIssue: 123)
                        issue_match = re.search(r"relatedIssue:\s*(\d+)", frontmatter)
                        if issue_match:
                            issue_num = int(issue_match.group(1))
                            slug = md_file.stem
                            slug_map[issue_num] = slug
        except (ValueError, OSError) as e:
            if DEBUG:
                print(f"Warning: Could not parse {md_file}: {e}")
            continue
    return slug_map


def resolve_cross_links(
    gh: Github,
    prerequisites: list,
    existing_slugs: dict,
) -> dict:
    """Resolve prerequisite issue numbers to blog post slugs and links."""
    links = {}
    repo = gh.get_repo(GITHUB_REPO)

    for issue_num in prerequisites:
        if issue_num in existing_slugs:
            slug = existing_slugs[issue_num]
            links[issue_num] = {
                "title": f"Issue #{issue_num}",
                "url": f"/blog/{slug}",
            }
        else:
            try:
                issue = repo.get_issue(issue_num)
                links[issue_num] = {
                    "title": issue.title,
                    "url": None,  # Not yet published
                }
            except Exception as e:  # Catch API errors but not SystemExit/KeyboardInterrupt
                if DEBUG:
                    print(f"Warning: Could not fetch issue #{issue_num}: {e}")
                links[issue_num] = {
                    "title": f"Issue #{issue_num}",
                    "url": None,
                }

    return links


def build_generation_prompt(
    issue_title: str,
    issue_body: str,
    metadata: IssueMetadata,
    cross_links: dict,
) -> str:
    """Build a prompt for the LLM to generate the blog post."""
    links_text = ""
    if cross_links:
        links_text = "\n\nRelated posts:\n"
        for issue_num, link_info in cross_links.items():
            if link_info["url"]:
                links_text += f"- [{link_info['title']}]({link_info['url']})\n"

    series_info = ""
    if metadata.series:
        series_info = f"\nThis is part {metadata.part} of the series '{metadata.series}'."

    prompt = f"""Write a detailed, SEO-optimized blog post for a generative search engine (like Perplexity, ChatGPT web) based on this issue:

Title: {issue_title}
Body: {issue_body}{series_info}

Requirements:
1. Write for generative search engines (GEO): provide direct, comprehensive answers upfront.
2. Structure with H2 and H3 headings logically (no H1; the page title is H1).
3. Include internal links to these related posts: {links_text or "None yet"}
4. Use HTML comments to suggest image placements: <!-- IMAGE SUGGESTION: [description of what image would help here] -->
5. Write naturally, not like a list. Use paragraphs and flowing prose.
6. Assume the reader is learning this topic for the first time.
7. Include practical examples or use cases where relevant.
8. End with a "Next Steps" or "Learn More" section.

Output ONLY the markdown body (no YAML frontmatter, no triple dashes). Start writing the content directly."""

    return prompt


def generate_blog_post(
    issue_title: str,
    issue_body: str,
    metadata: IssueMetadata,
    cross_links: dict,
) -> str:
    """Call the LLM to generate the blog post body."""
    prompt = build_generation_prompt(issue_title, issue_body, metadata, cross_links)

    # Initialize the appropriate LLM client
    if "claude" in AI_MODEL.lower():
        # Anthropic Claude
        client = OpenAI(
            api_key=AI_PROVIDER_API_KEY,
            base_url=AI_BASE_URL or "https://api.anthropic.com/v1",
        )
    else:
        # OpenAI or OpenAI-compatible
        if AI_BASE_URL and "azure" in AI_BASE_URL.lower():
            client = AzureOpenAI(
                api_key=AI_PROVIDER_API_KEY,
                azure_endpoint=AI_BASE_URL,
                api_version="2024-02-15-preview",  # Required for Azure
            )
        else:
            client = OpenAI(
                api_key=AI_PROVIDER_API_KEY,
                base_url=AI_BASE_URL or "https://api.openai.com/v1",
            )

    response = client.chat.completions.create(
        model=AI_MODEL,
        messages=[
            {
                "role": "system",
                "content": "You are an expert technical writer for a blog about Venezuelan food and New York culture.",
            },
            {
                "role": "user",
                "content": prompt,
            }
        ],
        temperature=0.7,
        max_tokens=2000,
    )

    return response.choices[0].message.content.strip()


def generate_slug(title: str) -> str:
    """Convert title to URL-friendly slug."""
    slug = re.sub(r"[^\w\s-]", "", title.lower())
    slug = re.sub(r"[-\s]+", "-", slug)
    return slug.strip("-")


def write_blog_post(
    slug: str,
    title: str,
    description: str,
    pub_date: str,
    tags: list,
    body: str,
    issue_number: int,
) -> Path:
    """Write the blog post to markdown file."""
    BLOG_OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    # Use json.dumps to escape title and description safely
    frontmatter = f"""---
title: {json.dumps(title)}
description: {json.dumps(description)}
pubDate: {pub_date}
author: "eugenio"
draft: false
tags: {json.dumps(tags)}
relatedIssue: {issue_number}
---

"""

    file_path = BLOG_OUTPUT_DIR / f"{slug}.md"
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(frontmatter + body)

    return file_path


def export_outputs(issue_number: int, issue_title: str, slug: str) -> None:
    """Export outputs for GitHub Actions."""
    output_file = os.getenv("GITHUB_OUTPUT")
    if output_file:
        with open(output_file, "a") as f:
            f.write(f"issue_number={issue_number}\n")
            f.write(f"issue_title={issue_title}\n")
            f.write(f"slug={slug}\n")
    else:
        # Fallback for local testing
        print(f"\nGenerated blog post:")
        print(f"  issue_number={issue_number}")
        print(f"  issue_title={issue_title}")
        print(f"  slug={slug}")


def main():
    """Main entry point."""
    if not GITHUB_TOKEN or not AI_PROVIDER_API_KEY:
        print("ERROR: Missing required environment variables.")
        print("  GITHUB_TOKEN:", "set" if GITHUB_TOKEN else "NOT SET")
        print("  AI_PROVIDER_API_KEY:", "set" if AI_PROVIDER_API_KEY else "NOT SET")
        sys.exit(1)

    gh = Github(GITHUB_TOKEN)
    repo = gh.get_repo(GITHUB_REPO)

    # Get existing blog slugs for cross-linking
    existing_slugs = get_existing_blog_slugs()

    # Find scheduled issues
    today = datetime.now().strftime("%Y-%m-%d")
    query = f"repo:{GITHUB_REPO} label:{ISSUE_LABEL} is:open"
    issues = repo.get_issues(state="open", labels=[ISSUE_LABEL])

    scheduled_issues = []
    for issue in issues:
        metadata = parse_issue_metadata(issue.body or "")
        if metadata.scheduled_date and metadata.scheduled_date <= today:
            scheduled_issues.append((issue, metadata))

    if not scheduled_issues:
        print(f"No scheduled blog issues found for today ({today}).")
        return

    # Process the first scheduled issue (only one per day)
    issue, metadata = scheduled_issues[0]

    if DEBUG:
        print(f"Processing issue #{issue.number}: {issue.title}")
        print(f"  Scheduled date: {metadata.scheduled_date}")
        print(f"  Prerequisites: {metadata.prerequisites}")

    # Resolve cross-links
    cross_links = resolve_cross_links(gh, metadata.prerequisites, existing_slugs)

    # Generate blog post
    print(f"Generating blog post for issue #{issue.number}...")
    body = generate_blog_post(
        issue.title,
        issue.body or "",
        metadata,
        cross_links,
    )

    # Generate slug and write file
    slug = generate_slug(issue.title)
    description = issue.body.split("\n")[0][:160] if issue.body else issue.title
    pub_date = metadata.scheduled_date or today
    tags = metadata.tags + (["series"] if metadata.series else [])

    file_path = write_blog_post(
        slug=slug,
        title=issue.title,
        description=description,
        pub_date=pub_date,
        tags=tags,
        body=body,
        issue_number=issue.number,
    )

    print(f"✓ Blog post written to {file_path}")

    # Export outputs for GitHub Actions
    export_outputs(issue.number, issue.title, slug)


if __name__ == "__main__":
    main()
