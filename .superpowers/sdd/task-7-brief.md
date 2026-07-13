# Task 7: Add CTA to About Page

**Where this fits:** Adds CTASection to about page (before footer).

**Files:**
- Modify: `src/pages/sobre-nosotros.astro`

**Modifications:**

1. **Add import** at top of file:
```astro
import CTASection from '../components/CTASection.astro';
```

2. **Add CTASection before final closing tag** - Add this before the closing `</BaseLayout>` tag:

```astro
<CTASection
  title="¿Interesado en nuestros productos?"
  description="Ya sea para tu supermercado, restaurante, hotel o servicio de catering, nuestro equipo está listo para ofrecerte soluciones personalizadas."
  ctaText="Solicitar Información"
  variant="secondary"
/>
```

**Result:**
- CTASection appears near bottom of page, before footer
- Uses variant="secondary" (cream background)
- Maintains page structure and flow
