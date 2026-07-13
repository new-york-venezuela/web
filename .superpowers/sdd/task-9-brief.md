# Task 9: Configure robots.txt to Hide Form Page from Indexing

**Where this fits:** Final configuration task. Excludes the form page from search engine indexing.

**Files:**
- Modify: `public/robots.txt`

**Implementation:**

Read current `public/robots.txt` and verify it exists. Then ensure it has these directives:

```
User-agent: *
Disallow: /api/
Disallow: /solicitar-llamada/

Sitemap: https://www.alimentosnewyork.com/sitemap.xml
```

**Key requirement:**
- `/solicitar-llamada/` must be in Disallow list
- `/api/` should also be disallowed (not user-facing)
- Keep existing sitemap directive

**Verification:**
- File is readable at `/robots.txt` in browser
- Disallow rules are correct
- No syntax errors
