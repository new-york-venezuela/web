# SEO/GEO Metadata Setup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task.

**Goal:** Add comprehensive SEO/GEO metadata, E-E-A-T signals, social sharing cards, and local SEO optimization for Venezuela/Caracas market with FAQ schema support.

**Architecture:** 
- Centralize company metadata in `src/data/company.ts`
- Extend product schema with distribuida_en, proveedores, FAQ fields
- Create `SeoHead.astro` component to manage all meta/og/twitter tags in one place
- Enhance schema generators to produce Product + FAQ + LocalBusiness schemas
- Update BaseLayout to use SeoHead for consistent header metadata across all pages
- Add FAQ section to product detail pages with proper schema markup

**Tech Stack:** Astro, TypeScript, JSON-LD schema.org, Open Graph, Twitter Cards

## Global Constraints

- All product fields are optional (backward compatible with existing data)
- Company founded year: 1980 (45 years in market)
- Primary market: Venezuela (locale: es_VE, coordinates: Caracas)
- Logo fallback: `/public/logo.png`
- Product images: use `producto.imagen` (never imagenes array)

---

## File Map

| File | Responsibility |
|------|---|
| `src/data/company.ts` | Company constants (name, founded, location, E-E-A-T) |
| `src/utils/generateProductMetadata.ts` | Extended schema generators (Product, FAQ, LocalBusiness) |
| `src/components/SeoHead.astro` | Centralized meta/og/twitter/canonical tag management |
| `src/layouts/BaseLayout.astro` | Updated to use SeoHead component |
| `src/pages/productos/[id].astro` | Product detail with FAQ section + schema |
| `src/data/productos.json` | New fields: distribuida_en, proveedores, preguntas_frecuentes |
| `src/components/StructuredData.astro` | No changes needed (already accepts FAQ type) |

---

## Task 1: Create Company Constants

**Files:**
- Create: `src/data/company.ts`

**Produces:**
```typescript
COMPANY: {
  name: string;
  founded: number;
  location: { city: string; region: string; country: string };
  logo: string;
  description: string;
}
```

- [ ] **Step 1: Create company.ts with constants**

```bash
cat > /Users/eugenio/conductor/workspaces/web/hyderabad/src/data/company.ts << 'EOF'
/**
 * Company metadata for SEO, E-E-A-T, and structured data
 */

export const COMPANY = {
  name: 'New York Alimentos Premium',
  founded: 1980,
  location: {
    city: 'Caracas',
    region: 'DF',
    country: 'VE'
  },
  logo: '/logo.png',
  description: 'Panadería y pastelería premium en Caracas, Venezuela. 45 años de experiencia en alimentos de calidad superior.'
};
EOF
```

- [ ] **Step 2: Verify file exists**

```bash
cat /Users/eugenio/conductor/workspaces/web/hyderabad/src/data/company.ts
```

Expected: File shows COMPANY object with all fields.

- [ ] **Step 3: Commit**

```bash
cd /Users/eugenio/conductor/workspaces/web/hyderabad
git add src/data/company.ts
git commit -m "feat: add company constants for E-E-A-T and metadata"
```

---

## Task 2: Extend Product TypeScript Interfaces

**Files:**
- Modify: `src/utils/generateProductMetadata.ts` (lines 7-29)

**Produces:**
```typescript
interface Producto {
  // ... existing fields
  distribuida_en?: string[];
  proveedores?: string[];
  preguntas_frecuentes?: Array<{ pregunta: string; respuesta: string; }>;
}
```

- [ ] **Step 1: Read current interface**

```bash
head -30 /Users/eugenio/conductor/workspaces/web/hyderabad/src/utils/generateProductMetadata.ts
```

- [ ] **Step 2: Update Producto interface with new fields**

Update the interface definition in `src/utils/generateProductMetadata.ts` to add:
- `distribuida_en?: string[]`
- `proveedores?: string[]`
- `preguntas_frecuentes?: Array<{ pregunta: string; respuesta: string; }>`

- [ ] **Step 3: Verify interface updated**

```bash
sed -n '7,35p' /Users/eugenio/conductor/workspaces/web/hyderabad/src/utils/generateProductMetadata.ts
```

Expected: Shows new fields `distribuida_en`, `proveedores`, `preguntas_frecuentes`.

- [ ] **Step 4: Commit**

```bash
cd /Users/eugenio/conductor/workspaces/web/hyderabad
git add src/utils/generateProductMetadata.ts
git commit -m "feat: extend Producto interface with distribuida_en, proveedores, FAQ"
```

---

## Task 3: Extend Schema Generators

**Files:**
- Modify: `src/utils/generateProductMetadata.ts` (add 3 new functions)

**Produces:**
```typescript
generateProductSchema(producto, baseUrl, company?): string
generateFaqSchema(faqs, baseUrl): string
generateLocalBusinessSchema(baseUrl, company?): string
```

- [ ] **Step 1: Add FAQ schema generator**

Add a new function `generateFaqSchema` that takes an array of FAQ objects and returns JSON-LD FAQPage schema:

```typescript
export function generateFaqSchema(faqs: Array<{ pregunta: string; respuesta: string }>, baseUrl: string): string {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(faq => ({
      '@type': 'Question',
      name: faq.pregunta,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.respuesta
      }
    }))
  };
  return JSON.stringify(schema);
}
```

- [ ] **Step 2: Update generateProductSchema to accept company parameter**

Modify `generateProductSchema` to:
- Accept optional `company` parameter
- Add brand, manufacturer (E-E-A-T signals)
- Add certifications as an array
- Add distributors from `distribuida_en`

- [ ] **Step 3: Update generateLocalBusinessSchema to use company data**

Modify to:
- Accept optional `company` parameter
- Calculate years in business from founded year
- Include foundingDate in schema

- [ ] **Step 4: Verify all functions are present**

```bash
grep -n "^export function" /Users/eugenio/conductor/workspaces/web/hyderabad/src/utils/generateProductMetadata.ts
```

Expected: Shows `generateProductSchema`, `generateFaqSchema`, `generateBreadcrumbSchema`, `generateLocalBusinessSchema`.

- [ ] **Step 5: Commit**

```bash
cd /Users/eugenio/conductor/workspaces/web/hyderabad
git add src/utils/generateProductMetadata.ts
git commit -m "feat: enhance schema generators with FAQ, E-E-A-T, and distributor info"
```

---

## Task 4: Create SeoHead Component

**Files:**
- Create: `src/components/SeoHead.astro`

**Produces:**
```astro
<SeoHead 
  title: string
  description: string
  image?: string
  url?: string
  type?: 'website' | 'product' | 'article'
  noindex?: boolean
/>
```

**Requirements:**
- Import COMPANY from `src/data/company`
- Fallback image to COMPANY.logo if not provided
- Generate absolute URLs for og:image and og:url
- Include og:locale as es_VE
- Include both Open Graph and Twitter Card meta tags
- No viewport meta tag (handled by BaseLayout)

- [ ] **Step 1: Create SeoHead.astro**

Create the component with the Props interface, handle URL absolutization, and render all meta tags.

- [ ] **Step 2: Verify file created**

```bash
head -20 /Users/eugenio/conductor/workspaces/web/hyderabad/src/components/SeoHead.astro
```

Expected: Shows meta tags and imports.

- [ ] **Step 3: Commit**

```bash
cd /Users/eugenio/conductor/workspaces/web/hyderabad
git add src/components/SeoHead.astro
git commit -m "feat: create SeoHead component for centralized metadata management"
```

---

## Task 5: Update BaseLayout to Use SeoHead

**Files:**
- Modify: `src/layouts/BaseLayout.astro`

**Consumes:**
- SeoHead component (from Task 4)

**Produces:**
- BaseLayout accepts `title`, `description`, `image`, `url`, `type` props
- All existing functionality preserved
- SeoHead component replaces individual meta tags

**Requirements:**
- Add `image?`, `url?`, `type?` to Props interface
- Import SeoHead component
- Replace individual og:* meta tags with `<SeoHead />` call
- Keep all other elements (fonts, PostHog, Header, Footer)

- [ ] **Step 1: Read current BaseLayout**

```bash
cat /Users/eugenio/conductor/workspaces/web/hyderabad/src/layouts/BaseLayout.astro
```

- [ ] **Step 2: Update BaseLayout Props interface**

Add new optional props: `image`, `url`, `type`

- [ ] **Step 3: Replace meta tags with SeoHead component**

Remove individual `<meta>` tags for og:* and description, replace with `<SeoHead />` component call.

- [ ] **Step 4: Verify BaseLayout syntax**

```bash
cat /Users/eugenio/conductor/workspaces/web/hyderabad/src/layouts/BaseLayout.astro
```

Expected: Shows SeoHead import and component usage with props.

- [ ] **Step 5: Commit**

```bash
cd /Users/eugenio/conductor/workspaces/web/hyderabad
git add src/layouts/BaseLayout.astro
git commit -m "feat: integrate SeoHead component into BaseLayout for centralized metadata"
```

---

## Task 6: Update Product Detail Page with FAQ & Enhanced Metadata

**Files:**
- Modify: `src/pages/productos/[id].astro`

**Consumes:**
- Extended Producto interface (from Task 2)
- generateFaqSchema function (from Task 3)
- COMPANY constants (from Task 1)
- SeoHead via BaseLayout (from Task 5)

**Produces:**
- Product detail pages with og:image, FAQ section, FAQ schema

**Requirements:**
- Import COMPANY from `src/data/company`
- Pass og:image to BaseLayout using `producto.imagen`
- Set type="product" for og:type
- Add FAQ section with collapsible details elements
- Add suppliers section (proveedores)
- Add distribution section (distribuida_en)
- Include StructuredData for FAQ schema when available
- Add CSS styles for FAQ, suppliers, distribution sections

- [ ] **Step 1: Read current product detail page**

```bash
head -40 /Users/eugenio/conductor/workspaces/web/hyderabad/src/pages/productos/[id].astro
```

- [ ] **Step 2: Import COMPANY and update schema generator call**

Add import for COMPANY.

- [ ] **Step 3: Update BaseLayout call with og:image and type**

Pass `image` and `type="product"` to BaseLayout.

- [ ] **Step 4: Update StructuredData for product schema with COMPANY**

Pass company parameter to product schema call, and add FAQ schema call when FAQs exist.

- [ ] **Step 5: Add FAQ section before closing article tag**

Add HTML markup for FAQ section with `<details>` elements, suppliers section, and distribution section.

- [ ] **Step 6: Add CSS styles for FAQ, suppliers, and distribution sections**

Add styles for:
- `.faq-section`, `.faq-list`, `.faq-item`, `.faq-question`, `.faq-answer`
- `.suppliers-section`, `.supplier-list`
- `.distribution-section`, `.distribution-list`
- Mobile responsive adjustments

- [ ] **Step 7: Verify product page syntax**

```bash
grep -n "faq-section\|suppliers-section\|distribution-section" /Users/eugenio/conductor/workspaces/web/hyderabad/src/pages/productos/[id].astro | head -10
```

Expected: Shows new sections added.

- [ ] **Step 8: Commit**

```bash
cd /Users/eugenio/conductor/workspaces/web/hyderabad
git add src/pages/productos/[id].astro
git commit -m "feat: add FAQ, suppliers, and distribution sections to product pages with enhanced metadata"
```

---

## Task 7: Update StructuredData Component to Support FAQ

**Files:**
- Modify: `src/components/StructuredData.astro`

**Consumes:**
- generateFaqSchema (from Task 3)
- COMPANY constants (from Task 1)

**Produces:**
- StructuredData component accepts `type: 'faq'`
- generateProductSchema called with COMPANY parameter

**Requirements:**
- Import generateFaqSchema
- Import COMPANY
- Add `faqs?` prop to Props interface
- Add `company?` prop to Props interface (with default COMPANY)
- Add `type: 'faq'` to type union
- Handle FAQ schema generation in the schema selection logic
- Pass company parameter to generateProductSchema and generateLocalBusinessSchema

- [ ] **Step 1: Read current StructuredData**

```bash
cat /Users/eugenio/conductor/workspaces/web/hyderabad/src/components/StructuredData.astro
```

- [ ] **Step 2: Update StructuredData interface and imports**

Add imports for generateFaqSchema and COMPANY, add props for faqs and company.

- [ ] **Step 3: Update schema generation logic**

Add FAQ schema generation, pass company to product and organization schemas.

- [ ] **Step 4: Verify StructuredData updated**

```bash
cat /Users/eugenio/conductor/workspaces/web/hyderabad/src/components/StructuredData.astro
```

Expected: Shows new imports, FAQ type, and company parameter handling.

- [ ] **Step 5: Commit**

```bash
cd /Users/eugenio/conductor/workspaces/web/hyderabad
git add src/components/StructuredData.astro
git commit -m "feat: extend StructuredData component to support FAQ schema and company data"
```

---

## Task 8: Add Sample Product Data with New Fields

**Files:**
- Modify: `src/data/productos.json` (add new fields to at least 2-3 products as examples)

**Produces:**
- Sample products with `distribuida_en`, `proveedores`, `preguntas_frecuentes` fields

**Requirements:**
- Add sample data to at least 2-3 existing products
- Use realistic Venezuelan distributor names and suppliers
- FAQ questions/answers should be product-relevant
- Data should be optional (maintain backward compatibility)

- [ ] **Step 1: Read current productos.json to see structure**

```bash
head -100 /Users/eugenio/conductor/workspaces/web/hyderabad/src/data/productos.json
```

- [ ] **Step 2: Add new fields to at least 2-3 products for testing**

Update 2-3 sample products with:
- `distribuida_en`: array of distributor names
- `proveedores`: array of supplier names
- `preguntas_frecuentes`: array of FAQ objects with pregunta/respuesta

- [ ] **Step 3: Verify sample data loads without errors**

```bash
cd /Users/eugenio/conductor/workspaces/web/hyderabad
npm run build 2>&1 | grep -i "error\|warning" | head -20
```

Expected: No schema validation errors.

- [ ] **Step 4: Commit sample data**

```bash
cd /Users/eugenio/conductor/workspaces/web/hyderabad
git add src/data/productos.json
git commit -m "docs: add sample E-E-A-T and distribution data to products"
```

---

## Plan Summary

**Spec Coverage:**
✅ Schema extensions for distribuida_en, proveedores, FAQ  
✅ E-E-A-T signals (company founding year, certifications, suppliers)  
✅ Social cards (og:image, Twitter Card)  
✅ Local SEO (Caracas/Venezuela in schema + LocalBusiness markup)  
✅ GEO (Generative Engine Optimization) via FAQ schema + structured content  
✅ FAQ section on product pages with collapsible details  
✅ Company constants centralized  
✅ SeoHead component for reusable metadata  

**Implementation Order:**
1. Company constants (foundation)
2. Type extensions (schema)
3. Schema generators (content)
4. SeoHead component (UI)
5. BaseLayout integration (global)
6. Product page updates (feature)
7. StructuredData update (schema)
8. Sample data (testing)
