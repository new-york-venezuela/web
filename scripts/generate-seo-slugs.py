#!/usr/bin/env python3
"""Generate SEO-optimized slugs for blog post issues."""

import json
import re
import subprocess
import sys
from typing import Optional

def extract_metadata(body: str) -> dict:
    """Extract post_id, primary_keyword, and pilar from issue body."""
    metadata = {}

    # Extract post_id
    match = re.search(r'post_id:\s*([^\n]+)', body)
    if match:
        metadata['post_id'] = match.group(1).strip().strip('"\'')

    # Extract primary_keyword
    match = re.search(r'primary_keyword:\s*([^\n]+)', body)
    if match:
        metadata['primary_keyword'] = match.group(1).strip().strip('"\'')

    # Extract pilar
    match = re.search(r'pilar:\s*([^\n]+)', body)
    if match:
        metadata['pilar'] = match.group(1).strip().strip('"\'')

    return metadata

def generate_seo_slug(title: str, primary_keyword: Optional[str] = None, pilar: Optional[str] = None) -> str:
    """
    Generate SEO-optimized slug from title and metadata.

    Strategy:
    1. Start with primary_keyword if available (highest SEO value)
    2. Extract main topic from title
    3. Keep max 45 chars, hyphen-separated, lowercase
    """

    # Clean title: remove "Blog Post:" prefix and clean up
    clean_title = re.sub(r'^Blog Post:\s*', '', title).strip()

    # If primary_keyword exists, use it as base
    if primary_keyword:
        # Clean keyword: lowercase, remove accents, replace spaces/special chars
        slug_base = primary_keyword.lower()
        slug_base = re.sub(r'[áä]', 'a', slug_base)
        slug_base = re.sub(r'[éè]', 'e', slug_base)
        slug_base = re.sub(r'[íì]', 'i', slug_base)
        slug_base = re.sub(r'[óò]', 'o', slug_base)
        slug_base = re.sub(r'[úù]', 'u', slug_base)
        slug_base = re.sub(r'[ñn]', 'n', slug_base)
        slug_base = re.sub(r'[^a-z0-9\s]', '', slug_base)
        slug_base = re.sub(r'\s+', '-', slug_base.strip())
        slug_base = re.sub(r'-+', '-', slug_base)
    else:
        # Fall back to title-based slug
        slug_base = clean_title.lower()
        # Remove accents
        slug_base = re.sub(r'[áä]', 'a', slug_base)
        slug_base = re.sub(r'[éè]', 'e', slug_base)
        slug_base = re.sub(r'[íì]', 'i', slug_base)
        slug_base = re.sub(r'[óò]', 'o', slug_base)
        slug_base = re.sub(r'[úù]', 'u', slug_base)
        slug_base = re.sub(r'[ñn]', 'n', slug_base)
        slug_base = re.sub(r'[^a-z0-9\s]', '', slug_base)
        slug_base = re.sub(r'\s+', '-', slug_base.strip())
        slug_base = re.sub(r'-+', '-', slug_base)
        # Truncate to first 2-3 words
        parts = slug_base.split('-')
        slug_base = '-'.join(parts[:3])

    # Truncate to max 45 chars
    slug = slug_base[:45].rstrip('-')

    return slug

def main():
    """Fetch all blog issues and generate/apply SEO slugs."""

    # Fetch all blog-post-idea issues
    result = subprocess.run(
        ['gh', 'issue', 'list', '--repo', 'new-york-venezuela/web',
         '--label', 'blog-post-idea', '--state', 'open',
         '--json', 'number,title,body'],
        capture_output=True,
        text=True,
        check=True
    )

    issues = json.loads(result.stdout)
    slugs_generated = []

    for issue in issues:
        number = issue['number']
        title = issue['title']
        body = issue['body']

        # Extract metadata
        metadata = extract_metadata(body)

        # Generate slug
        slug = generate_seo_slug(
            title,
            primary_keyword=metadata.get('primary_keyword'),
            pilar=metadata.get('pilar')
        )

        slugs_generated.append({
            'number': number,
            'title': title,
            'post_id': metadata.get('post_id', 'unknown'),
            'primary_keyword': metadata.get('primary_keyword', ''),
            'slug': slug
        })

        print(f"#{number}: {slug} (from '{title[:50]}...')")

    # Save to JSON for inspection
    with open('.context/seo-slugs.json', 'w') as f:
        json.dump(slugs_generated, f, indent=2, ensure_ascii=False)

    print(f"\n✓ Generated {len(slugs_generated)} slugs. Saved to .context/seo-slugs.json")

    return slugs_generated

if __name__ == '__main__':
    main()
