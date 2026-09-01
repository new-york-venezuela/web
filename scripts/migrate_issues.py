#!/usr/bin/env python3
"""
One-off script: rewrites existing GH blog post issues to the new YAML format.
Run with: python scripts/migrate_issues.py --dry-run   (preview only)
           python scripts/migrate_issues.py             (actually update issues)

Review all changes in GH before merging any PRs that depend on the new format.
Delete this script after migration is complete.
"""
import os
import re
import sys
import argparse
import yaml
from github import Github
import dotenv

dotenv.load_dotenv()

_POST_ID_RE = re.compile(r"\*\*ID:\*\*\s*`?([\w-]+)`?")
_WEEK_RE = re.compile(r"\*\*Semana:\*\*\s*(\d+)")
_DATE_RE = re.compile(r"\*\*Fecha sugerida:\*\*\s*(\d{4}-\d{2}-\d{2})")
_PILAR_RE = re.compile(r"\*\*Pilar:\*\*\s*(.+)")
_AUDIENCE_RE = re.compile(r"\*\*Audiencia:\*\*\s*(.+)")
_KEYWORD_RE = re.compile(r"\*\*Keyword Principal:\*\*\s*`?([^`\n]+)`?")
_IMAGE_TYPE_RE = re.compile(r"\*\*Tipo:\*\*\s*(.+)")
_IMAGE_DESC_RE = re.compile(r"\*\*Descripción:\*\*\s*(.+)")
_PREREQ_RE = re.compile(r"post-\d+")
_RESUMEN_RE = re.compile(r"###\s*Resumen Ejecutivo\s*\n(.+?)(?:\n---|\n###|\Z)", re.S)


def _parse_old_body(body: str) -> dict:
    def first(pattern):
        m = pattern.search(body)
        return m.group(1).strip() if m else None

    prereq_section = re.search(r"Enlazado Interno Sugerido\s*\n(.+?)(?:\n---|\n###|\Z)", body, re.S)
    prereqs = _PREREQ_RE.findall(prereq_section.group(1)) if prereq_section else []

    resumen_m = _RESUMEN_RE.search(body)
    resumen = resumen_m.group(1).strip() if resumen_m else ""

    return {
        "post_id": first(_POST_ID_RE),
        "week": int(first(_WEEK_RE)) if first(_WEEK_RE) else None,
        "scheduled_date": first(_DATE_RE),
        "pilar": first(_PILAR_RE),
        "audience": first(_AUDIENCE_RE),
        "primary_keyword": first(_KEYWORD_RE),
        "image_brief": first(_IMAGE_DESC_RE),
        "prerequisites": prereqs,
        "resumen": resumen,
    }


def _build_new_body(data: dict) -> str:
    meta = {
        "post_id": data["post_id"] or "post-XXX",
        "week": data["week"] or 0,
        "scheduled_date": data["scheduled_date"] or "YYYY-MM-DD",
        "pilar": data["pilar"] or "",
        "audience": data["audience"] or "ambos",
        "primary_keyword": data["primary_keyword"] or "",
        "tags": [],
        "image_url": None,
        "image_brief": data["image_brief"] or "",
        "related_posts": [],  # can't auto-resolve post-XXX → issue# without a lookup table
    }
    # Emit with block-style for readability
    meta_yaml = yaml.dump(meta, allow_unicode=True, default_flow_style=False, sort_keys=False)

    resumen = data["resumen"] or "_Sin resumen ejecutivo._"

    # Note any old prerequisites so the author can manually fill related_posts
    prereq_note = ""
    if data["prerequisites"]:
        ids = ", ".join(data["prerequisites"])
        prereq_note = f"\n\n> **Nota migración:** `related_posts` no pudo resolverse automáticamente. "
        prereq_note += f"Posts relacionados originales: {ids}. Actualiza `related_posts` con los números de issue correctos."

    return f"""### Metadata

```yaml
{meta_yaml.rstrip()}
```

### Resumen Ejecutivo

{resumen}{prereq_note}
"""


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true", help="Print changes without updating issues")
    args = parser.parse_args()

    token = os.getenv("GITHUB_TOKEN")
    repo_name = os.getenv("GITHUB_REPO", "new-york-venezuela/web")
    if not token:
        print("ERROR: GITHUB_TOKEN required")
        sys.exit(1)

    gh = Github(token)
    repo = gh.get_repo(repo_name)
    issues = list(repo.get_issues(state="open", labels=["blog-post-idea"]))
    print(f"Found {len(issues)} issues to migrate.")

    for issue in issues:
        body = issue.body or ""
        # Skip already-migrated issues (have YAML block)
        if "```yaml" in body:
            print(f"  #{issue.number} already in new format, skipping.")
            continue

        data = _parse_old_body(body)
        new_body = _build_new_body(data)

        print(f"\n--- Issue #{issue.number}: {issue.title[:60]} ---")
        print(new_body[:400])

        if not args.dry_run:
            issue.edit(body=new_body)
            print(f"  Updated #{issue.number}")
        else:
            print("  [DRY RUN — not updated]")

    print("\nDone.")


if __name__ == "__main__":
    main()
