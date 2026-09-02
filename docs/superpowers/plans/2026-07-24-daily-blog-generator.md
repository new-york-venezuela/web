# Automated Daily Blog Post Generator Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a production-grade Python pipeline that runs daily via GitHub Actions to find scheduled blog-post issues, parse their metadata/relationships, call Claude/OpenAI APIs, and auto-generate SEO-optimized markdown posts with internal cross-links.

**Architecture:** The system consists of five independent components: (1) Python environment setup with pinned versions via uv, (2) a stateless blog generator script that queries GitHub issues and the local blog directory, (3) environment configuration for API credentials, (4) a GitHub Actions workflow that triggers daily and creates PRs, and (5) Astro schema validation to ensure all generated posts match the content model. Each component is decoupled; the script works standalone for local testing via `make run`.

**Tech Stack:** Python 3.12.3, uv (package manager), PyGithub (issue queries), OpenAI Python SDK (LLM calls), GitHub Actions (orchestration), Astro (content framework).

## Global Constraints

- **Python version:** Strictly pinned to `3.12.3` in `.python-version`, `Makefile`, and GitHub Actions.
- **Package manager:** Use native `venv` with `uv` for installation; no Poetry/Pipenv.
- **Dependencies pinned exactly:** `pygithub==2.1.1`, `openai==1.3.9`, `python-dotenv==1.0.0`, `typing-extensions==4.8.0`.
- **Astro schema fields:** `title` (string), `description` (string), `pubDate` (date), `author` (string, default 'eugenio'), `draft` (boolean, default false), `tags` (array of strings).
- **Frontmatter format:** YAML with triple-dash delimiters; no HTML or JSON frontmatter.
- **Blog output directory:** `src/content/blog/` (Astro standard).
- **GitHub secrets required:** `GITHUB_TOKEN` (automatic in Actions), `OPENAI_API_KEY` or `AI_PROVIDER_API_KEY` (for LLM).

---

## Task 1: Create Python Version Pin and Makefile

**Files:**
- Create: `.python-version`
- Create: `Makefile`

**Interfaces:**
- Produces: `.venv` directory (local), `Makefile` targets (`setup`, `run`, `test`).

- [ ] **Step 1: Create `.python-version` file**

```bash
echo "3.12.3" > .python-version
```

- [ ] **Step 2: Verify file content**

```bash
cat .python-version
```

Expected: `3.12.3` (single line, no trailing text).

- [ ] **Step 3: Create `Makefile`**

```makefile
.PHONY: setup run test clean help

help:
	@echo "Available targets:"
	@echo "  make setup    - Create .venv and install dependencies"
	@echo "  make run      - Run blog generator locally"
	@echo "  make test     - Run pytest on scripts/"
	@echo "  make clean    - Remove .venv and cache"

setup:
	@echo "Creating .venv with Python 3.12.3 using uv..."
	uv venv --python 3.12.3
	@echo "Installing dependencies via uv..."
	.venv/bin/uv pip install -r requirements.txt
	@echo "✓ Setup complete. Run 'source .venv/bin/activate' to activate."

run:
	@echo "Running blog generator..."
	.venv/bin/python scripts/generate_blog.py

test:
	@echo "Running tests..."
	.venv/bin/python -m pytest scripts/tests/ -v

clean:
	@echo "Removing .venv and cache..."
	rm -rf .venv __pycache__ .pytest_cache
	find . -type d -name "__pycache__" -exec rm -rf {} +
	@echo "✓ Clean complete."
```

- [ ] **Step 4: Verify Makefile syntax**

```bash
make help
```

Expected: Help output listing `setup`, `run`, `test`, `clean` targets.

- [ ] **Step 5: Commit**

```bash
git add .python-version Makefile
git commit -m "build: add Python 3.12.3 version pin and Makefile with uv workflow"
```

---

## Task 2: Create Requirements and Environment Config

**Files:**
- Create: `requirements.txt`
- Create: `.env.example`
- Create: `.gitignore` entry for `.env` (append if exists)

**Interfaces:**
- Produces: Pinned dependency list for uv/pip; environment template for local and CI use.

- [ ] **Step 1: Create `requirements.txt` with exact pinned versions**

```txt
pygithub==2.1.1
openai==1.3.9
python-dotenv==1.0.0
typing-extensions==4.8.0
```

- [ ] **Step 2: Verify requirements file**

```bash
cat requirements.txt
```

Expected: Four lines, each with `package==X.Y.Z` (no extras, no ranges).

- [ ] **Step 3: Create `.env.example` template**

```bash
cat > .env.example << 'EOF'
# GitHub API token (required for issue queries)
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# LLM Provider Configuration
# Choose one provider and set the corresponding variables below

# OpenAI (default)
AI_MODEL=gpt-4
AI_PROVIDER_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Claude (Anthropic)
# AI_MODEL=claude-3-5-sonnet-20241022
# AI_PROVIDER_API_KEY=sk-ant-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
# AI_BASE_URL=https://api.anthropic.com/v1

# Local/Custom (e.g., Ollama, vLLM)
# AI_MODEL=mistral
# AI_BASE_URL=http://localhost:8000/v1
# AI_PROVIDER_API_KEY=not-used

# Repository and output paths
GITHUB_REPO=eugenio/new-york-venezuela-web
BLOG_OUTPUT_DIR=src/content/blog

# Blog generation settings
ISSUE_LABEL=blog-post-idea
DEBUG=false
EOF
```

- [ ] **Step 4: Verify `.env.example`**

```bash
cat .env.example
```

Expected: Template with all required and optional environment variables documented.

- [ ] **Step 5: Append `.env` to `.gitignore` (check if file exists first)**

```bash
if [ -f .gitignore ]; then
  grep -q "^\.env$" .gitignore || echo ".env" >> .gitignore
else
  echo ".env" > .gitignore
fi
```

- [ ] **Step 6: Verify `.gitignore`**

```bash
tail -5 .gitignore
```

Expected: `.env` appears in the file (either newly created or appended).

- [ ] **Step 7: Commit**

```bash
git add requirements.txt .env.example .gitignore
git commit -m "build: add pinned dependencies and environment configuration template"
```

---

## Task 3: Create Main Blog Generator Script

**Files:**
- Create: `scripts/generate_blog.py`

**Interfaces:**
- Consumes: `.env` file (via `python-dotenv`), GitHub API (via `PyGithub`), local `src/content/blog/` directory.
- Produces: Markdown file at `src/content/blog/{slug}.md`, outputs `issue_number`, `issue_title`, `slug` to `$GITHUB_OUTPUT` (or stdout if not in Actions).

- [ ] **Step 1: Create `scripts/` directory if it doesn't exist**

```bash
mkdir -p scripts
```

- [ ] **Step 2: Create `scripts/generate_blog.py` main script**

```python
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
        with open(md_file, "r", encoding="utf-8") as f:
            content = f.read()
            # Extract frontmatter
            if content.startswith("---"):
                _, frontmatter, _ = content.split("---", 2)
                # Look for issue reference in frontmatter (e.g., relatedIssue: 123)
                issue_match = re.search(r"relatedIssue:\s*(\d+)", frontmatter)
                if issue_match:
                    issue_num = int(issue_match.group(1))
                    slug = md_file.stem
                    slug_map[issue_num] = slug
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
            except:
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

    frontmatter = f"""---
title: "{title}"
description: "{description}"
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
```

- [ ] **Step 3: Make script executable**

```bash
chmod +x scripts/generate_blog.py
```

- [ ] **Step 4: Verify script syntax (without running)**

```bash
python3 -m py_compile scripts/generate_blog.py
```

Expected: No output (success).

- [ ] **Step 5: Create `scripts/__init__.py` for Python package structure**

```bash
touch scripts/__init__.py
```

- [ ] **Step 6: Commit**

```bash
git add scripts/generate_blog.py scripts/__init__.py
git commit -m "feat: add blog generator script with GitHub issue parsing and LLM integration"
```

---

## Task 4: Create GitHub Actions Workflow

**Files:**
- Create: `.github/workflows/daily-blog-generator.yml`

**Interfaces:**
- Consumes: Python script (`scripts/generate_blog.py`), GitHub secrets (`GITHUB_TOKEN`, `OPENAI_API_KEY` or equivalent).
- Produces: PR on branch `blog/issue-${issue_number}`, links issue with `Closes #${issue_number}`.

- [ ] **Step 1: Create `.github/workflows/` directory if it doesn't exist**

```bash
mkdir -p .github/workflows
```

- [ ] **Step 2: Create `daily-blog-generator.yml` workflow**

```yaml
name: Daily Blog Post Generator

on:
  schedule:
    # Daily at 8:00 AM UTC
    - cron: '0 8 * * *'
  workflow_dispatch:

permissions:
  contents: write
  pull-requests: write
  issues: write

jobs:
  generate-blog:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version-file: '.python-version'
          cache: 'pip'

      - name: Install uv
        run: pip install uv

      - name: Install dependencies
        run: uv pip install --system -r requirements.txt

      - name: Run blog generator
        id: generate
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
          AI_MODEL: gpt-4
          AI_PROVIDER_API_KEY: ${{ secrets.OPENAI_API_KEY }}
          GITHUB_REPO: ${{ github.repository }}
          BLOG_OUTPUT_DIR: src/content/blog
          ISSUE_LABEL: blog-post-idea
        run: python scripts/generate_blog.py

      - name: Check for changes
        id: check
        run: |
          if git diff --quiet; then
            echo "has_changes=false" >> $GITHUB_OUTPUT
          else
            echo "has_changes=true" >> $GITHUB_OUTPUT
          fi

      - name: Create Pull Request
        if: steps.check.outputs.has_changes == 'true'
        uses: peter-evans/create-pull-request@v6
        with:
          commit-message: 'blog: auto-generate post for issue #${{ steps.generate.outputs.issue_number }}'
          title: 'blog: add "${{ steps.generate.outputs.issue_title }}"'
          body: |
            Automated blog post generation.
            
            - Issue: #${{ steps.generate.outputs.issue_number }}
            - Slug: `${{ steps.generate.outputs.slug }}`
            
            Closes #${{ steps.generate.outputs.issue_number }}
          branch: blog/issue-${{ steps.generate.outputs.issue_number }}
          delete-branch: true
          labels: |
            blog
            automated
```

- [ ] **Step 3: Verify YAML syntax**

```bash
python3 -m yaml .github/workflows/daily-blog-generator.yml 2>&1 | head -20 || echo "✓ YAML valid"
```

Expected: Valid YAML (no parse errors).

- [ ] **Step 4: Commit**

```bash
git add .github/workflows/daily-blog-generator.yml
git commit -m "ci: add daily blog post generator workflow"
```

---

## Task 5: Verify/Create Astro Content Schema

**Files:**
- Check/Create: `src/content/config.ts`

**Interfaces:**
- Produces: Astro collection schema that validates blog post frontmatter.

- [ ] **Step 1: Check if `src/content/config.ts` exists**

```bash
if [ ! -f src/content/config.ts ]; then
  echo "File does not exist; will create."
else
  echo "File exists; will verify."
fi
```

- [ ] **Step 2: Read existing file or create new one**

If `src/content/config.ts` does NOT exist, create it:

```typescript
import { z, defineCollection } from "astro:content";

const blogCollection = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    author: z.string().default("eugenio"),
    draft: z.boolean().default(false),
    tags: z.array(z.string()).default([]),
  }),
});

export const collections = {
  blog: blogCollection,
};
```

If the file DOES exist, open it and verify that the `blogCollection` schema includes at minimum:
- `title: z.string()`
- `description: z.string()`
- `pubDate: z.coerce.date()`
- `author: z.string().default("eugenio")`
- `draft: z.boolean().default(false)`
- `tags: z.array(z.string()).default([])`

If any field is missing, add it to the schema object.

- [ ] **Step 3: Verify schema file**

```bash
cat src/content/config.ts
```

Expected: TypeScript file with Astro collection schema defining `blog` with required fields.

- [ ] **Step 4: Commit (if changes made)**

```bash
git add src/content/config.ts
git commit -m "config: ensure Astro blog collection schema matches generator output"
```

---

## Task 6: Test the Pipeline Locally

**Files:**
- No new files; testing existing setup.

**Interfaces:**
- Tests: Environment setup, script execution, blog post generation, GitHub API integration.

- [ ] **Step 1: Run `make setup` to create venv and install dependencies**

```bash
make setup
```

Expected: Output shows venv creation and dependency installation; `.venv/` directory created.

- [ ] **Step 2: Create a test `.env` file based on `.env.example`**

```bash
cp .env.example .env
# Edit .env with real values (GITHUB_TOKEN and OPENAI_API_KEY)
```

- [ ] **Step 3: Verify `.venv` and dependencies are installed**

```bash
.venv/bin/python -c "import github; import openai; import dotenv; print('✓ All dependencies imported successfully')"
```

Expected: `✓ All dependencies imported successfully`.

- [ ] **Step 4: Dry-run the script (check parsing without LLM call)**

```bash
# Edit scripts/generate_blog.py temporarily to add early exit after parse_issue_metadata()
# Or, if no scheduled issues exist, it will exit gracefully
.venv/bin/python scripts/generate_blog.py
```

Expected: Script exits cleanly; either "No scheduled blog issues found" or generates a blog post.

- [ ] **Step 5: Verify generated blog post (if one was created)**

```bash
ls -la src/content/blog/ | head -5
```

Expected: New markdown file in `src/content/blog/` directory with `.md` extension.

- [ ] **Step 6: Check frontmatter in generated file**

```bash
head -20 src/content/blog/your-generated-slug.md
```

Expected: YAML frontmatter with `title`, `description`, `pubDate`, `author: "eugenio"`, `draft: false`, `tags`, `relatedIssue`.

- [ ] **Step 7: Commit test results (optional; cleanup after)**

```bash
# If you want to keep test outputs:
git add src/content/blog/
git commit -m "test: verify blog generator produces valid markdown"

# Or clean up and commit cleanup:
git clean -fd src/content/blog/
git commit -m "test: clean up test blog posts"
```

---

## Spec Coverage Checklist

- [x] **1. Modern Python Setup** → Task 1 (`.python-version`, `Makefile`), Task 2 (`requirements.txt`).
- [x] **2. Relational Issue Parser** → Task 3 (`generate_blog.py` with metadata parsing, cross-linking, LLM prompt).
- [x] **3. GitHub Actions Workflow** → Task 4 (daily cron, PR creation, issue linking).
- [x] **4. Astro Schema Verification** → Task 5 (`src/content/config.ts`).
- [x] **Environment Configuration** → Task 2 (`.env.example`), Task 4 (GitHub secrets).
- [x] **Version Pinning** → Task 1 (`.python-version`), Task 2 (`requirements.txt`).
