# Task 6: Add CTA to Catalog Page

**Where this fits:** Adds CTASection to catalog page (before footer).

**Files:**
- Modify: `src/pages/catalogo.astro`

**Modifications:**

1. **Add import** at top of file:
```astro
import CTASection from '../components/CTASection.astro';
```

2. **Replace final section** - find the last `<section>` that contains "¿Listo para ordenar?" text, and replace the entire section with:

```astro
<CTASection
  title="Consulta precios y disponibilidad"
  description="Completa nuestro formulario y recibirás una llamada en las próximas 24 horas con presupuestos personalizados según tu tipo de negocio."
  ctaText="Solicitar Información de Precios"
  variant="secondary"
/>

<section class="section">
  <div class="container pedido">
    <h2>Otras preguntas</h2>
    <p>
      ¿Tienes consultas específicas sobre toppings, volúmenes mínimos o plazos?
      Escríbenos por la página de contacto.
    </p>
    <a href="/contacto/" class="btn">Ir a Contacto</a>
  </div>
</section>
```

**Result:**
- CTASection appears before footer with variant="secondary" (cream background)
- Secondary section for additional contact questions remains
- Maintains existing styling and flow
