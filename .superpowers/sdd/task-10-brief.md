# Task 10: Integration Testing — Complete Lead Capture Flow

**Where this fits:** Final task. Comprehensive testing of the entire lead capture system across all pages and flows.

**Test checklist:**

## 1. Navigation from CTAs

- [ ] Home page (`/`) → Click "Solicitar llamada" button in hero → Redirects to `/solicitar-llamada/` with form visible
- [ ] Catalog page (`/catalogo/`) → Scroll to CTASection → Click button → Redirects to `/solicitar-llamada/`
- [ ] About page (`/sobre-nosotros/`) → Scroll to CTASection → Click button → Redirects to `/solicitar-llamada/`

## 2. Form Rendering & Validation

- [ ] Form page `/solicitar-llamada/` loads with form visible (not success state)
- [ ] All 6 fields render: fullName, phone, email, businessType (select), companyName, message
- [ ] Required fields marked with `*` indicator
- [ ] Optional fields (companyName, message) don't have `*`
- [ ] Submit button says "Solicitar Llamada"

## 3. Client-side Validation

- [ ] Submit with empty required fields → Browser shows HTML5 validation error
- [ ] Submit with invalid email (e.g., "notanemail") → Error message or browser validation
- [ ] Submit with short phone (e.g., "123") → Validation prevents submission
- [ ] Enter valid data, submit → No errors

## 4. Form Submission Success Flow

- [ ] Fill all required fields correctly:
  - fullName: "Test User"
  - phone: "+58 (412) 555-1234"
  - email: "test@example.com"
  - businessType: "restaurant" (select one)
  - (optional fields can be empty)
- [ ] Click "Solicitar Llamada" button
- [ ] Page redirects to `/solicitar-llamada/?success=true`
- [ ] Success message displays: "¡Solicitud Enviada!"
- [ ] Success state shows confirmation text and "Te llamaremos en las próximas 24 horas..."

## 5. Responsive Design

- [ ] Desktop view (>64rem): Form page shows 2-column layout (intro left, form right)
- [ ] Tablet view (44-64rem): CTASection stacks vertically
- [ ] Mobile view (<44rem): All CTASections stack vertically, form page single column
- [ ] All buttons and links functional on mobile

## 6. Page Accessibility

- [ ] Form page accessible directly at `/solicitar-llamada/` (linkable, no 404)
- [ ] Not in main navigation header (verify Header.astro)
- [ ] CTAs on home, catalog, about pages link correctly

## 7. Search Engine Exclusion

- [ ] Check `/robots.txt` visible in browser
- [ ] Verify `/solicitar-llamada/` in Disallow list
- [ ] Verify `/api/` in Disallow list
- [ ] Sitemap directive present

## 8. Visual Consistency

- [ ] All text in Spanish
- [ ] Colors match design system (cream, milk, accent)
- [ ] Spacing consistent with other pages (var(--space-*))
- [ ] No broken styles or misaligned elements

## Test Report Format

After testing, document:
- Total checks: 30+
- Passed: ✓ count
- Failed: ✗ count
- Blocked: any environment issues?

List any failures with steps to reproduce.

**Status:** All tests pass = DONE
