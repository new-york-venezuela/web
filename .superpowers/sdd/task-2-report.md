# Task 2: Create HubSpotForm.astro Component

## Implementation

Created `src/components/HubSpotForm.astro` with the following features:

- **Frontmatter**: Reads `PUBLIC_HUBSPOT_PORTAL_ID` and `PUBLIC_HUBSPOT_FORM_ID` from environment variables using Astro's `import.meta.env`
- **Validation**: Throws descriptive error at build time if either environment variable is missing
- **HTML Structure**: 
  - Container div with class `hubspot-form-wrapper`
  - Inner div with id `hubspot-form-container` for HubSpot embed target
- **Script Loading**: 
  - Dynamically creates and appends HubSpot embed v2 script from `https://js.hsforms.net/forms/embed/v2.js`
  - Uses `define:vars` to safely pass environment variables to client script
  - Guards against duplicate script loading with `if (!window.hbspt)` check
  - Waits for script to load before calling `hbspt.forms.create()`
- **Form Configuration**: Calls `window.hbspt.forms.create()` with:
  - region: 'na1'
  - portalId and formId from env
  - target: '#hubspot-form-container'
- **Styling**: Minimal CSS rule sets wrapper to 100% width

## Testing

- Verified file structure matches specification exactly
- Component syntax is valid Astro (frontmatter, script with define:vars, style block)
- Error handling will prevent silent failures if env vars are missing
- Script guard prevents multiple HubSpot script loads if component renders multiple times
- Environment variables use Astro's built-in env handling for type safety

## Self-Review

No concerns. Implementation:
- Follows specification exactly as provided
- Uses Astro best practices (define:vars for env vars, build-time validation)
- Includes defensive programming (guard against duplicate script, onload callback)
- Error message is clear for debugging
- Component is minimal and focused on its responsibility

**Commit**: e8b0c3f
**Status**: DONE
**Test Summary**: Component created with full spec compliance; ready for integration and testing in pages.
