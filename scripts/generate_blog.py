#!/usr/bin/env python3
"""
Automated blog post generator for Astro.

Finds scheduled GitHub issues, parses metadata/relationships, and generates
SEO-optimized markdown posts using Claude/OpenAI APIs.
"""

"""
Thin shim — delegates to blog_pipeline.main.
See scripts/blog_pipeline/ for the full pipeline implementation.
"""
from scripts.blog_pipeline.main import main

if __name__ == "__main__":
    main()
