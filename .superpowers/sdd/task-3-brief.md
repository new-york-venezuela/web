# Task 3: Create Lead Capture Landing Page

**Where this fits:** Creates the landing page at `/solicitar-llamada/` where users land after clicking CTAs. Uses LeadForm component from Task 2.

**Files:**
- Create: `src/pages/solicitar-llamada.astro`
- Depends on: Task 2 (LeadForm component)

**Interfaces:**
- Consumes: LeadForm component, BaseLayout
- Produces: Public landing page at `/solicitar-llamada/` route

## Implementation

**File:** `src/pages/solicitar-llamada.astro`

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import LeadForm from '../components/LeadForm.astro';

const showSuccess = Astro.url.searchParams.get('success') === 'true';
---

<BaseLayout
  title="Solicitar Llamada — New York Alimentos Premium"
  description="Solicita una llamada de nuestro equipo de ventas. Consulta precios personalizados y disponibilidad de productos."
>
  <section class="section hero-form">
    <div class="container">
      <div class="form-container">
        <div class="form-intro">
          <span class="eyebrow">Contacto Directo</span>
          <h1>Solicita una Llamada de Nuestro Equipo</h1>
          <p class="lead">
            Completa este formulario y nuestro equipo se pondrá en contacto contigo
            en las próximas 24 horas para discutir tus necesidades y ofrecerte
            precios personalizados según tu tipo de negocio.
          </p>
          <div class="benefits">
            <div class="benefit-item">
              <span class="benefit-icon">📞</span>
              <p><strong>Llamada directa</strong> — Tu asesor personal se contactará</p>
            </div>
            <div class="benefit-item">
              <span class="benefit-icon">💰</span>
              <p><strong>Precios personalizados</strong> — Según volumen y perfil</p>
            </div>
            <div class="benefit-item">
              <span class="benefit-icon">📦</span>
              <p><strong>Disponibilidad confirmada</strong> — Plazos de entrega reales</p>
            </div>
          </div>
        </div>
        
        <div class="form-wrapper">
          <LeadForm showSuccess={showSuccess} />
        </div>
      </div>
    </div>
  </section>
</BaseLayout>

<style>
  .hero-form {
    padding-block: var(--space-xl);
  }

  .form-container {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--space-xl);
    align-items: start;
  }

  .form-intro {
    padding-right: var(--space-m);
  }

  .form-intro h1 {
    margin-bottom: var(--space-m);
  }

  .form-intro .lead {
    margin-bottom: var(--space-l);
    line-height: 1.6;
  }

  .benefits {
    display: flex;
    flex-direction: column;
    gap: var(--space-m);
    margin-top: var(--space-l);
  }

  .benefit-item {
    display: flex;
    gap: var(--space-s);
  }

  .benefit-icon {
    font-size: 1.5rem;
    flex-shrink: 0;
  }

  .benefit-item p {
    margin: 0;
    line-height: 1.4;
    font-size: 0.9375rem;
  }

  .form-wrapper {
    background-color: var(--color-cream);
    padding: var(--space-l);
    border: 1px solid var(--color-border);
    border-radius: 0.5rem;
  }

  @media (max-width: 64rem) {
    .form-container {
      grid-template-columns: 1fr;
      gap: var(--space-l);
    }

    .form-intro {
      padding-right: 0;
    }
  }
</style>
```

**Key details:**
- Page checks for `?success=true` query param and passes to LeadForm
- Responsive grid layout: 2 columns on desktop, 1 column on mobile (max-width: 64rem)
- Left side: intro text with benefits (3 items with icons)
- Right side: form wrapper with styling
- Uses BaseLayout for consistent page structure
- All text in Spanish
