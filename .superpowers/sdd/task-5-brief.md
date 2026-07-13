# Task 5: Add CTAs to Home Page

**Where this fits:** Adds strategic CTAs to home page using CTASection component from Task 4.

**Files:**
- Modify: `src/pages/index.astro`

**Modifications:**

1. **Add import** at top of file:
```astro
import CTASection from '../components/CTASection.astro';
```

2. **Modify hero section** (find `<div class="hero__actions">`):

Change from:
```astro
<div class="hero__actions">
  <a href="/catalogo/" class="btn btn--solid">Ver catálogo</a>
  <a href="/sobre-nosotros/" class="btn">Nuestra historia</a>
</div>
```

Change to:
```astro
<div class="hero__actions">
  <a href="/catalogo/" class="btn btn--solid">Ver catálogo</a>
  <a href="/solicitar-llamada/" class="btn btn--solid">Solicitar llamada</a>
  <a href="/sobre-nosotros/" class="btn">Nuestra historia</a>
</div>
```

3. **Add CTASection after featured products section** - locate the section ending with `</section>` after `.section__cta` div, then add this right after:

```astro
<CTASection
  title="¿Necesitas precios y disponibilidad?"
  description="Nuestro equipo te ofrecerá presupuestos personalizados según tu volumen y tipo de negocio."
  ctaText="Solicitar una Llamada"
/>
```

**Result:**
- Hero has 3 buttons: "Ver catálogo", "Solicitar llamada", "Nuestra historia"
- After featured products, CTASection banner appears
