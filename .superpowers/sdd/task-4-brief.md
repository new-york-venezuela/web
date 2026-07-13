# Task 4: Create Reusable CTA Section Component

**Where this fits:** Reusable component for strategically placed CTAs on multiple pages (Tasks 5-7). Independent of other tasks.

**Files:**
- Create: `src/components/CTASection.astro`

**Interfaces:**
- Consumes: Props for title, description, ctaText, variant
- Produces: Reusable CTA banner component with two style variants

## Implementation

**File:** `src/components/CTASection.astro`

```astro
---
interface Props {
  title?: string;
  description?: string;
  ctaText?: string;
  variant?: 'primary' | 'secondary';
}

const {
  title = '¿Listo para hacer tu pedido?',
  description = 'Solicita una llamada de nuestro equipo de ventas. Te contactaremos con precios personalizados y disponibilidad.',
  ctaText = 'Solicitar Llamada',
  variant = 'primary',
} = Astro.props;
---

<section class:list={['cta-section', `cta-section--${variant}`]}>
  <div class="container cta-container">
    <div class="cta-content">
      <h2>{title}</h2>
      <p>{description}</p>
    </div>
    <div class="cta-action">
      <a href="/solicitar-llamada/" class="btn btn--solid">
        {ctaText}
      </a>
    </div>
  </div>
</section>

<style>
  .cta-section {
    padding: var(--space-l);
    background-color: var(--color-milk);
    border-top: 2px solid var(--color-border);
    border-bottom: 2px solid var(--color-border);
  }

  .cta-section--secondary {
    background-color: var(--color-cream);
  }

  .cta-container {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-l);
  }

  .cta-content {
    flex: 1;
  }

  .cta-content h2 {
    margin-bottom: var(--space-s);
    font-size: 1.5rem;
  }

  .cta-content p {
    margin: 0;
    line-height: 1.5;
    color: var(--color-charcoal-soft);
  }

  .cta-action {
    flex-shrink: 0;
  }

  @media (max-width: 44rem) {
    .cta-container {
      flex-direction: column;
      align-items: flex-start;
      gap: var(--space-m);
      text-align: center;
    }

    .cta-content h2 {
      font-size: 1.25rem;
    }
  }
</style>
```

**Key details:**
- Props: title, description, ctaText, variant (all optional with defaults)
- Variants: 'primary' (milk background) and 'secondary' (cream background)
- Always links to `/solicitar-llamada/`
- Responsive: horizontal on desktop (flex row), vertical stack on mobile (max-width: 44rem)
- Uses design system CSS variables
- All text in Spanish (defaults + props)
