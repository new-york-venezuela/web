# Task 3: Manual Testing Guide — Dev-Mode Feature

## Quick Start

The dev-mode feature has been implemented and committed. You now need to **manually test it in your browser**.

**Dev server is running at:** `http://localhost:4321`

## The Feature

When you visit `/sobre-nosotros/?dev-mode=true`, three yellow/gold placeholder boxes should appear showing where images should be added to the page. These placeholders are hidden by default and only show when the query parameter is present with exact value `true` (lowercase).

## 5 Test Cases to Run (5-10 minutes total)

### Test 1: Normal page (no dev-mode)
1. Open: `http://localhost:4321/sobre-nosotros/`
2. Look for any yellow/gold boxes with "RECOMENDACIÓN VISUAL" text
3. **Expected:** None visible
4. **Result:** ✅ PASS / ❌ FAIL

### Test 2: With dev-mode enabled
1. Open: `http://localhost:4321/sobre-nosotros/?dev-mode=true`
2. Look for yellow/gold boxes
3. **Expected:** See exactly 3 boxes:
   - "📸 RECOMENDACIÓN VISUAL: EL ORIGEN"
   - "🍞 RECOMENDACIÓN VISUAL: LA MAESTRÍA DEL PAN"
   - "🛡️ RECOMENDACIÓN VISUAL: SELLO DE CALIDAD"
4. **Result:** ✅ PASS / ❌ FAIL

### Test 3: With dev-mode + other params
1. Open: `http://localhost:4321/sobre-nosotros/?foo=bar&dev-mode=true`
2. **Expected:** All 3 placeholders still visible
3. **Result:** ✅ PASS / ❌ FAIL

### Test 4: Case sensitivity
1. Open: `http://localhost:4321/sobre-nosotros/?dev-mode=True` (capital T)
2. **Expected:** Placeholders NOT visible
3. Open: `http://localhost:4321/sobre-nosotros/?dev-mode=true` (lowercase)
4. **Expected:** Placeholders visible
5. **Result:** ✅ PASS / ❌ FAIL

### Test 5: No regressions
1. Visit both URLs (with and without dev-mode)
2. Scroll the entire page on each
3. **Check:** Text reads properly, links work, no layout issues
4. **Result:** ✅ PASS / ❌ FAIL

## What to Look For

### Visual Appearance
- Boxes should have a light beige background with gold dashed border
- Text should be centered and readable
- Boxes should appear between sections of the editorial content

### Correct Locations
- Placeholder 1: After "La Chispa" section (about the cheesecake origin)
- Placeholder 2: After "La Evolución" section (about bread making)
- Placeholder 3: After "El Compromiso" section (about quality & Kosher certification)

### No Errors
- Page should load normally
- No JavaScript errors in browser console (F12 → Console tab)
- All regular content should display correctly

## If Something's Wrong

### Placeholders don't show with dev-mode=true
1. **Hard refresh:** Ctrl+Shift+R (or Cmd+Shift+R on Mac)
2. **Check console:** F12 → Console, should show no errors
3. **Check URL:** Make sure it's exactly `?dev-mode=true` (lowercase)
4. **Check server:** Make sure dev server is still running

### Placeholders show when they shouldn't
1. **Check URL:** Make sure you're not using `?dev-mode=true`
2. **Check browser:** Try different browser or clear cache
3. **Check server:** Restart dev server: `npm run dev`

## Recording Your Results

After testing, update the table in `/Users/eugenio/repos/new-york-venezuela/web/.superpowers/sdd/task-3-report.md`:

```markdown
| Test Case | Result | Notes |
|-----------|--------|-------|
| Test 1: No dev-mode | ✅ PASS | No placeholders visible |
| Test 2: With dev-mode | ✅ PASS | All 3 placeholders visible |
| Test 3: Other params | ✅ PASS | Works with foo=bar parameter |
| Test 4a: dev-mode=True | ✅ PASS | Case-sensitive, uppercase doesn't work |
| Test 4b: dev-mode=true | ✅ PASS | Lowercase 'true' works correctly |
| Test 5: No regressions | ✅ PASS | All content and layout intact |
```

## After Testing

If all tests pass:
- Update the report file with your results
- The feature is ready for merge
- Document any issues if found

If any test fails:
- Document what went wrong
- Check the browser console for errors
- Report issues and we can debug further

## Technical Details (Optional Reading)

The implementation uses:
1. **Three HTML divs** with `class="image-placeholder"` and `style="display: none;"`
2. **Client-side script** that runs when page loads
3. **Query parameter detection** using `URLSearchParams`
4. **Case-sensitive check** ensuring only `dev-mode=true` (lowercase) works
5. **Display toggle** by removing inline style to show hidden elements

The script is small (~150 bytes minified) and doesn't impact page performance.

---

**Estimated Time:** 10 minutes  
**Difficulty:** Easy (just navigate and look)  
**Instructions:** Follow the 5 test cases above, document results
