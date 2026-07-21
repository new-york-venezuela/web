# Task 1: Add HubSpot Environment Variables to .env.example

## Implementation

Added two HubSpot environment variable definitions to `.env.example` after the Google Forms section:
- `PUBLIC_HUBSPOT_PORTAL_ID=` (empty, ready for user to fill in)
- `PUBLIC_HUBSPOT_FORM_ID=` (empty, ready for user to fill in)

Both variables follow the existing naming convention and documentation style. The section header `# --- HubSpot Forms ---` provides clear context for the variables.

**File modified:** `.env.example`

Changes:
- Added 4 lines after the Google Forms section
- Positioned before the "Datos de contacto parametrizables" section
- Both environment variables are empty and ready for user configuration

## Testing

Verified the changes with:
```bash
git diff .env.example
```

Output confirms 4 lines added: the comment header and two variable definitions with empty values.

## Self-Review

No concerns. The implementation is straightforward and follows the existing patterns in the file. The variables are properly positioned after the Google Forms section and before the contact data section, as required. Variables use the PUBLIC_ prefix consistent with other client-exposed variables.

---

**Commit:** `a590b0c` (base7)  
**Status:** DONE  
**Test summary:** Changes verified with git diff; environment variables added correctly to .env.example
