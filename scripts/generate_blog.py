#!/usr/bin/env python3
"""
Thin shim — delegates to blog_pipeline.main.
See scripts/blog_pipeline/ for the full pipeline implementation.
"""
from scripts.blog_pipeline.main import main

if __name__ == "__main__":
    main()
