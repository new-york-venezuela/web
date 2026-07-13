# Lead Capture Forms Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a B2B lead capture system with strategic CTAs across key pages that drive visitors to a phone/callback request form, converting interest into qualified leads without exposing the form in main navigation.

**Architecture:** 
- Create a dedicated lead capture form page at `/solicitar-llamada/` (not in navigation, but accessible via CTA links)
- Build a reusable form component with validation, success confirmation, and form submission handling
- Place strategic CTAs on home page (hero + after featured products), catalog page, and about page
- Configure `robots.txt` to exclude the form page from indexing (private landing page)
- Form submissions stored/integrated for lead management workflow

**Tech Stack:** 
- Astro (static site with form submission via API endpoint or serverless function)
- Astro Actions or fetch API for form submission
- Client-side validation with native HTML5 + optional JS enhancement
- Email notification on submission (future: Webhook to CRM)

## Global Constraints

- No prices displayed on public pages (already implemented)
- Form page must be accessible via links only, not indexed in robots.txt
- Target B2B personas: supermarket managers, restaurant/hotel decision-makers, catering businesses
- Language: Spanish only
- Form must collect: full name, phone, business type, company name (optional details)
- CTA text should emphasize "Solicitar llamada" or "Consultar disponibilidad y precios"

---

## File Structure

```
src/
├── pages/
│   ├── solicitar-llamada.astro          [NEW] Lead capture form landing page
│   ├── index.astro                      [MODIFY] Add CTA in hero + after featured products
│   ├── catalogo.astro                   [MODIFY] Add CTA section before footer
│   ├── sobre-nosotros.astro             [MODIFY] Add CTA before footer
│   └── api/
│       └── submit-lead.ts               [NEW] Lightweight API route for Google Sheets submission
├── components/
│   ├── LeadForm.astro                   [NEW] Reusable lead capture form component
│   └── CTASection.astro                 [NEW] Reusable CTA banner component
├── data/
│   └── formConfig.ts                    [NEW] Form field definitions & validation rules
└── utils/
    ├── formValidation.ts                [NEW] Validation utility functions
    └── googleSheets.ts                  [NEW] Google Sheets API integration

public/
└── robots.txt                           [MODIFY] Disallow /solicitar-llamada/

.env
└── [MODIFY] Add Google Sheets credentials (see Task 8)
```

---

## Task 1: Create Form Configuration & Validation Utilities

**Files:**
- Create: `src/data/formConfig.ts`
- Create: `src/utils/formValidation.ts`
- Test: Manual validation testing

**Interfaces:**
- Produces: 
  - `FormField` interface with name, label, type, required, pattern, placeholder
  - `validateForm(data: FormData)` → `{ valid: boolean, errors: Record<string, string> }`
  - `LEAD_FORM_FIELDS: FormField[]` array with predefined fields

- [ ] **Step 1: Create formConfig.ts with field definitions**

```typescript
// src/data/formConfig.ts

export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'tel' | 'select' | 'textarea';
  required: boolean;
  placeholder?: string;
  pattern?: string;
  options?: Array<{ value: string; label: string }>;
}

export const LEAD_FORM_FIELDS: FormField[] = [
  {
    name: 'fullName',
    label: 'Nombre Completo',
    type: 'text',
    required: true,
    placeholder: 'Tu nombre completo',
  },
  {
    name: 'phone',
    label: 'Teléfono de Contacto',
    type: 'tel',
    required: true,
    placeholder: '+58 (412) XXX-XXXX',
    pattern: '^[+\\d\\s()\\-]+$',
  },
  {
    name: 'email',
    label: 'Correo Electrónico',
    type: 'email',
    required: true,
    placeholder: 'tu@empresa.com',
  },
  {
    name: 'businessType',
    label: '¿Cuál es tu tipo de negocio?',
    type: 'select',
    required: true,
    options: [
      { value: '', label: 'Selecciona una opción' },
      { value: 'supermarket', label: 'Supermercado' },
      { value: 'restaurant', label: 'Restaurante' },
      { value: 'hotel', label: 'Hotel' },
      { value: 'catering', label: 'Catering' },
      { value: 'other', label: 'Otro' },
    ],
  },
  {
    name: 'companyName',
    label: 'Nombre de tu empresa',
    type: 'text',
    required: false,
    placeholder: 'Nombre de tu empresa (opcional)',
  },
  {
    name: 'message',
    label: 'Mensaje o consulta específica',
    type: 'textarea',
    required: false,
    placeholder: 'Cuéntanos qué productos te interesan o tus necesidades específicas',
  },
];

export const BUSINESS_TYPE_LABELS: Record<string, string> = {
  supermarket: 'Supermercado',
  restaurant: 'Restaurante',
  hotel: 'Hotel',
  catering: 'Catering',
  other: 'Otro',
};
```

- [ ] **Step 2: Create formValidation.ts with validation logic**

```typescript
// src/utils/formValidation.ts

export interface ValidationError {
  field: string;
  message: string;
}

export interface FormValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[+\d\s()\-]+$/;

export function validateEmail(email: string): boolean {
  return EMAIL_REGEX.test(email.trim());
}

export function validatePhone(phone: string): boolean {
  // Remove whitespace for length check
  const cleaned = phone.replace(/\s/g, '');
  return PHONE_REGEX.test(phone) && cleaned.length >= 7;
}

export function validateRequired(value: string | undefined): boolean {
  return value !== undefined && value.trim().length > 0;
}

export function validateFormData(formData: {
  fullName?: string;
  phone?: string;
  email?: string;
  businessType?: string;
  companyName?: string;
  message?: string;
}): FormValidationResult {
  const errors: ValidationError[] = [];

  // Validate fullName
  if (!validateRequired(formData.fullName)) {
    errors.push({ field: 'fullName', message: 'El nombre completo es requerido' });
  } else if (formData.fullName!.length < 3) {
    errors.push({ field: 'fullName', message: 'El nombre debe tener al menos 3 caracteres' });
  }

  // Validate phone
  if (!validateRequired(formData.phone)) {
    errors.push({ field: 'phone', message: 'El teléfono es requerido' });
  } else if (!validatePhone(formData.phone!)) {
    errors.push({ field: 'phone', message: 'Formato de teléfono inválido' });
  }

  // Validate email
  if (!validateRequired(formData.email)) {
    errors.push({ field: 'email', message: 'El correo electrónico es requerido' });
  } else if (!validateEmail(formData.email!)) {
    errors.push({ field: 'email', message: 'Correo electrónico inválido' });
  }

  // Validate businessType
  if (!validateRequired(formData.businessType)) {
    errors.push({ field: 'businessType', message: 'Debes seleccionar un tipo de negocio' });
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
```

- [ ] **Step 3: Verify validation logic with manual test cases**

Test cases to verify (manually in browser console or via test file):
- Valid form: all required fields filled correctly → `valid: true`
- Invalid email: "notanemail" → error on email field
- Invalid phone: "123" → error on phone field
- Empty required fields → errors on each empty field
- Optional fields (companyName, message) can be empty → no errors

Run: Create a test file locally or use browser console to test `validateFormData()`

---

## Task 2: Create LeadForm Component

**Files:**
- Create: `src/components/LeadForm.astro`
- Depends on: Task 1 (formConfig.ts, formValidation.ts)

**Interfaces:**
- Consumes: `FormField[]` from formConfig, validation functions
- Produces: Rendered form HTML with validation attributes, form submission handler prep

- [ ] **Step 1: Create LeadForm.astro component**

```astro
---
import { LEAD_FORM_FIELDS } from '../data/formConfig';

interface Props {
  showSuccess?: boolean;
  successMessage?: string;
}

const { 
  showSuccess = false,
  successMessage = '¡Gracias! Nos pondremos en contacto pronto para confirmar tu solicitud de llamada.'
} = Astro.props;
---

<div class="lead-form">
  {
    showSuccess ? (
      <div class="form-success">
        <div class="success-icon">✓</div>
        <h3>¡Solicitud Enviada!</h3>
        <p>{successMessage}</p>
        <p class="success-note">Te llamaremos en las próximas 24 horas para confirmar disponibilidad y precios.</p>
      </div>
    ) : (
      <form class="form" id="lead-capture-form" method="POST" action="/api/submit-lead">
        <fieldset class="form-group">
          <legend class="form-legend">Información de Contacto</legend>
          
          {LEAD_FORM_FIELDS.map((field) => (
            <div class="form-field">
              <label for={field.name} class="form-label">
                {field.label}
                {field.required && <span class="required-indicator">*</span>}
              </label>
              
              {field.type === 'select' ? (
                <select
                  id={field.name}
                  name={field.name}
                  required={field.required}
                  class="form-input form-select"
                >
                  {field.options?.map((option) => (
                    <option value={option.value}>{option.label}</option>
                  ))}
                </select>
              ) : field.type === 'textarea' ? (
                <textarea
                  id={field.name}
                  name={field.name}
                  placeholder={field.placeholder}
                  required={field.required}
                  class="form-input form-textarea"
                  rows="4"
                />
              ) : (
                <input
                  id={field.name}
                  type={field.type}
                  name={field.name}
                  placeholder={field.placeholder}
                  pattern={field.pattern}
                  required={field.required}
                  class="form-input"
                />
              )}
            </div>
          ))}
        </fieldset>

        <div class="form-actions">
          <button type="submit" class="btn btn--solid">
            Solicitar Llamada
          </button>
          <p class="form-note">
            Te contactaremos para confirmar disponibilidad y precios personalizados.
          </p>
        </div>
      </form>
    )
  }
</div>

<script>
  const form = document.getElementById('lead-capture-form') as HTMLFormElement | null;
  
  if (form) {
    form.addEventListener('submit', async (e: SubmitEvent) => {
      e.preventDefault();
      
      const formData = new FormData(form);
      const data = {
        fullName: formData.get('fullName'),
        phone: formData.get('phone'),
        email: formData.get('email'),
        businessType: formData.get('businessType'),
        companyName: formData.get('companyName'),
        message: formData.get('message'),
      };
      
      try {
        const response = await fetch('/api/submit-lead', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        
        if (response.ok) {
          // Reload page or show success state
          window.location.href = '/solicitar-llamada/?success=true';
        } else {
          alert('Error al enviar el formulario. Por favor intenta nuevamente.');
        }
      } catch (error) {
        console.error('Form submission error:', error);
        alert('Error de conexión. Por favor intenta nuevamente.');
      }
    });
  }
</script>

<style>
  .lead-form {
    max-width: 100%;
  }

  .form {
    display: flex;
    flex-direction: column;
    gap: var(--space-l);
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: var(--space-m);
    border: none;
    padding: 0;
    margin: 0;
  }

  .form-legend {
    font-size: 1.25rem;
    font-weight: 600;
    margin-bottom: var(--space-s);
    padding: 0;
  }

  .form-field {
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
  }

  .form-label {
    font-size: 0.9375rem;
    font-weight: 500;
  }

  .required-indicator {
    color: var(--color-accent);
    font-weight: 700;
  }

  .form-input {
    padding: var(--space-xs) var(--space-s);
    border: 1px solid var(--color-border);
    border-radius: 0.25rem;
    font-size: 1rem;
    font-family: inherit;
    background-color: white;
    color: var(--color-charcoal);
  }

  .form-input:focus {
    outline: none;
    border-color: var(--color-accent);
    box-shadow: 0 0 0 2px rgba(212, 164, 79, 0.1);
  }

  .form-textarea {
    resize: vertical;
    min-height: 6rem;
  }

  .form-actions {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-m);
    margin-top: var(--space-s);
  }

  .form-note {
    font-size: 0.8125rem;
    color: var(--color-charcoal-soft);
    line-height: 1.4;
    max-width: 28rem;
  }

  /* Success state */
  .form-success {
    text-align: center;
    padding: var(--space-l);
    background-color: var(--color-milk);
    border-radius: 0.5rem;
    border: 2px solid var(--color-accent);
  }

  .success-icon {
    font-size: 3rem;
    color: var(--color-accent);
    margin-bottom: var(--space-m);
    font-weight: 700;
  }

  .form-success h3 {
    font-size: 1.5rem;
    margin-bottom: var(--space-s);
  }

  .form-success p {
    margin-bottom: var(--space-s);
    line-height: 1.5;
  }

  .success-note {
    font-size: 0.875rem;
    color: var(--color-charcoal-soft);
  }
</style>
```

- [ ] **Step 2: Test LeadForm renders correctly**

View in browser at `/solicitar-llamada/` (will create page in Task 3)
- All form fields visible
- Labels associated with inputs
- Submit button visible
- Styles applied correctly (form spacing, input styling)

---

## Task 3: Create Lead Capture Landing Page

**Files:**
- Create: `src/pages/solicitar-llamada.astro`
- Depends on: Task 2 (LeadForm.astro)

**Interfaces:**
- Consumes: LeadForm component, BaseLayout
- Produces: Public-facing landing page at `/solicitar-llamada/` route

- [ ] **Step 1: Create solicitar-llamada.astro page**

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

  /* Responsive: Stack on mobile */
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

- [ ] **Step 2: Test page renders correctly**

View in browser:
- Page accessible at `/solicitar-llamada/`
- Form visible with all fields
- Success state shows when `?success=true` is in URL
- Page title and description visible in browser tab

---

## Task 4: Create Reusable CTA Section Component

**Files:**
- Create: `src/components/CTASection.astro`

**Interfaces:**
- Consumes: Props for customizable text/styling
- Produces: Reusable CTA banner component with consistent styling

- [ ] **Step 1: Create CTASection.astro component**

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

  /* Responsive: Stack on mobile */
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

- [ ] **Step 2: Verify component renders**

Component will be used in Tasks 5-7, visual verification happens there.

---

## Task 5: Add CTA to Home Page (index.astro)

**Files:**
- Modify: `src/pages/index.astro`
- Depends on: Task 4 (CTASection.astro)

**Interfaces:**
- Consumes: CTASection component
- Produces: Updated home page with CTAs in hero and after featured products

- [ ] **Step 1: Add CTA button to hero section**

Modify `src/pages/index.astro` hero section to include CTA alongside existing buttons:

```astro
// In the hero section, change this:
<div class="hero__actions">
  <a href="/catalogo/" class="btn btn--solid">Ver catálogo</a>
  <a href="/sobre-nosotros/" class="btn">Nuestra historia</a>
</div>

// To this:
<div class="hero__actions">
  <a href="/catalogo/" class="btn btn--solid">Ver catálogo</a>
  <a href="/solicitar-llamada/" class="btn btn--solid btn--accent">Solicitar llamada</a>
  <a href="/sobre-nosotros/" class="btn">Nuestra historia</a>
</div>
```

- [ ] **Step 2: Import CTASection component**

At top of `src/pages/index.astro`, add import:

```astro
import CTASection from '../components/CTASection.astro';
```

- [ ] **Step 3: Add CTASection after featured products**

In the featured products section, after the grid with `section__cta`, add:

```astro
{/* Keep existing button */}
<div class="section__cta">
  <a href="/catalogo/" class="btn">Explorar el catálogo completo</a>
</div>
```

Then add new section after closing `</section>`:

```astro
<CTASection
  title="¿Necesitas precios y disponibilidad?"
  description="Nuestro equipo te ofrecerá presupuestos personalizados según tu volumen y tipo de negocio."
  ctaText="Solicitar una Llamada"
/>
```

- [ ] **Step 4: Test home page renders correctly**

View in browser at `/`:
- Hero section shows 3 buttons (Catálogo, Solicitar llamada, Nuestra historia)
- CTASection visible after featured products
- All links point to correct destinations
- Styling consistent with page design

---

## Task 6: Add CTA to Catalog Page (catalogo.astro)

**Files:**
- Modify: `src/pages/catalogo.astro`
- Depends on: Task 4 (CTASection.astro)

**Interfaces:**
- Consumes: CTASection component
- Produces: Updated catalog page with CTA before footer

- [ ] **Step 1: Import CTASection component**

At top of `src/pages/catalogo.astro`, add import:

```astro
import CTASection from '../components/CTASection.astro';
```

- [ ] **Step 2: Add CTASection before final section**

Locate the final `<section>` with the "¿Listo para ordenar?" text. Keep it but enhance by replacing it with:

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

- [ ] **Step 3: Test catalog page renders correctly**

View in browser at `/catalogo/`:
- Products display as before
- CTASection visible before footer
- Secondary variant styling applied (cream background)
- Links work correctly

---

## Task 7: Add CTA to About Page (sobre-nosotros.astro)

**Files:**
- Modify: `src/pages/sobre-nosotros.astro`
- Depends on: Task 4 (CTASection.astro)

**Interfaces:**
- Consumes: CTASection component
- Produces: Updated about page with CTA before footer

- [ ] **Step 1: Read sobre-nosotros.astro to understand structure**

View the file to see where best to place CTA (typically before footer).

- [ ] **Step 2: Import CTASection component**

At top of `src/pages/sobre-nosotros.astro`, add import:

```astro
import CTASection from '../components/CTASection.astro';
```

- [ ] **Step 3: Add CTASection before last section**

Before the final `</BaseLayout>` tag, add:

```astro
<CTASection
  title="¿Interesado en nuestros productos?"
  description="Ya sea para tu supermercado, restaurante, hotel o servicio de catering, nuestro equipo está listo para ofrecerte soluciones personalizadas."
  ctaText="Solicitar Información"
  variant="secondary"
/>
```

- [ ] **Step 4: Test about page renders correctly**

View in browser at `/sobre-nosotros/`:
- Existing content displays as before
- CTASection visible before footer
- All styling consistent
- Links work correctly

---

## Task 8: Integrate Form Submission with Google Sheets

**Files:**
- Create: `src/utils/googleSheets.ts` — Google Sheets API integration utility
- Modify: `src/components/LeadForm.astro` — Update form submission endpoint to Google Sheets

**Interfaces:**
- Consumes: FormData from LeadForm POST request
- Produces: Rows appended to Google Sheet; client receives success/error response via fetch

**Setup Requirements:**
Before implementation:
1. Create a Google Sheet at https://sheets.google.com/ 
2. Get the Sheet ID from the URL (format: `/d/{SHEET_ID}/edit`)
3. Create a Google Cloud Project and enable Google Sheets API
4. Generate a service account JSON key
5. Share the Google Sheet with the service account email
6. Add these environment variables to `.env`:
   - `GOOGLE_SHEET_ID` — The Sheet ID
   - `GOOGLE_SERVICE_ACCOUNT_EMAIL` — Service account email
   - `GOOGLE_PRIVATE_KEY` — Private key from JSON (newlines as `\n`)

- [ ] **Step 1: Create googleSheets.ts utility for API integration**

```typescript
// src/utils/googleSheets.ts

import { google } from 'googleapis';

const sheets = google.sheets('v4');

async function getAuth() {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      type: 'service_account',
      project_id: process.env.GOOGLE_PROJECT_ID,
      private_key_id: process.env.GOOGLE_PRIVATE_KEY_ID,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      client_id: process.env.GOOGLE_CLIENT_ID,
      auth_uri: 'https://accounts.google.com/o/oauth2/auth',
      token_uri: 'https://oauth2.googleapis.com/token',
      auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  return auth;
}

export async function appendLeadToSheet(leadData: {
  fullName: string;
  phone: string;
  email: string;
  businessType: string;
  companyName?: string;
  message?: string;
}): Promise<boolean> {
  try {
    const auth = await getAuth();
    const sheetId = process.env.GOOGLE_SHEET_ID;

    if (!sheetId) {
      throw new Error('GOOGLE_SHEET_ID not configured');
    }

    const timestamp = new Date().toISOString();
    const row = [
      timestamp,
      leadData.fullName,
      leadData.phone,
      leadData.email,
      leadData.businessType,
      leadData.companyName || '',
      leadData.message || '',
    ];

    await sheets.spreadsheets.values.append({
      auth,
      spreadsheetId: sheetId,
      range: 'Sheet1!A:G',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [row],
      },
    });

    return true;
  } catch (error) {
    console.error('Google Sheets API error:', error);
    throw error;
  }
}
```

- [ ] **Step 2: Update LeadForm.astro to submit to Google Sheets endpoint**

In the form's submit handler (the `<script>` section), change the fetch endpoint:

```javascript
// Old:
const response = await fetch('/api/forms/lead-capture', {

// New:
const response = await fetch('/api/submit-lead', {
```

Create a lightweight API route at `src/pages/api/submit-lead.ts`:

```typescript
// src/pages/api/submit-lead.ts

import type { APIRoute } from 'astro';
import { validateFormData } from '../../utils/formValidation';
import { appendLeadToSheet } from '../../utils/googleSheets';

export const POST: APIRoute = async ({ request }) => {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await request.json();

    // Validate form data
    const validation = validateFormData(body);
    if (!validation.valid) {
      return new Response(JSON.stringify({ error: 'Validation failed', errors: validation.errors }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Append to Google Sheet
    await appendLeadToSheet(body);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Solicitud recibida. Nos pondremos en contacto pronto.',
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Form submission error:', error);
    return new Response(
      JSON.stringify({ error: 'Error al procesar la solicitud' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
```

- [ ] **Step 3: Verify Google Sheets integration**

After deploying:
- Submit test form data
- Check Google Sheet for new row with timestamp, name, phone, email, business type
- Verify all fields populated correctly
- Test with missing optional fields (companyName, message) — should show empty cells

---

## Task 9: Configure robots.txt to Hide Form Page from Indexing

**Files:**
- Modify: `public/robots.txt`

**Interfaces:**
- Consumes: Current robots.txt content
- Produces: Updated robots.txt with /solicitar-llamada/ disallowed for search engines

- [ ] **Step 1: Check current robots.txt content**

Read `public/robots.txt` to see what's already there.

- [ ] **Step 2: Update robots.txt**

Add disallow rule for lead capture page. File should look like:

```
User-agent: *
Disallow: /api/
Disallow: /solicitar-llamada/

Sitemap: https://www.alimentosnewyork.com/sitemap.xml
```

- [ ] **Step 3: Verify robots.txt syntax**

View in browser at `/robots.txt` — should display plain text with correct format.

---

## Task 10: Test Complete Lead Capture Flow

**Files:**
- Test: All created/modified files

**Interfaces:**
- No new code — integration testing only

- [ ] **Step 1: Test CTA navigation from home page**

- Go to `/`
- Click "Solicitar llamada" button in hero
- Verify redirects to `/solicitar-llamada/`
- Form displays correctly

- [ ] **Step 2: Test CTA from catalog page**

- Go to `/catalogo/`
- Scroll to CTASection
- Click CTA button
- Verify redirects to `/solicitar-llamada/`

- [ ] **Step 3: Test CTA from about page**

- Go to `/sobre-nosotros/`
- Scroll to CTASection
- Click CTA button
- Verify redirects to `/solicitar-llamada/`

- [ ] **Step 4: Test form submission success flow**

- Go to `/solicitar-llamada/`
- Fill all required fields correctly
- Submit form
- Verify redirects to `/solicitar-llamada/?success=true`
- Success confirmation message displays

- [ ] **Step 5: Test form validation errors**

- Go to `/solicitar-llamada/`
- Submit form with empty required fields
- Verify browser shows HTML5 validation errors
- Submit with invalid email format
- Verify error message displays

- [ ] **Step 6: Verify page not indexed**

- Check `/robots.txt`
- Verify `/solicitar-llamada/` is in Disallow list
- Page is accessible by direct link but not suggested by search engines

- [ ] **Step 7: Test responsive design**

- View all pages (home, catalog, about, form page) on mobile (max-width: 44rem)
- Verify CTASection stacks vertically
- Verify form displays correctly on mobile
- All buttons and links functional

---

## Integration Notes

**Included in this plan:**
- ✅ Google Sheets API integration (leads stored in spreadsheet)
- ✅ Server-side validation (Astro API route)
- ✅ Client-side validation (HTML5 + custom validators)
- ✅ Success confirmation with redirect

**Future Enhancements (not in this plan):**
- Email notification on form submission (integrate Mailgun, SendGrid, etc.)
- CRM integration (Pipedrive, HubSpot, Zoho) to sync leads automatically
- Slack notification when new lead arrives
- Analytics tracking (PostHog already installed — add form submission event)
- Phone number validation with intl-tel-input library for international formats
- reCAPTCHA for spam prevention (if needed)
- Form field pre-population from URL params (e.g., business type)

**Deployment Checklist:**
- ✅ Google Sheets API credentials configured in `.env`
- ✅ Google Sheet created and shared with service account
- ✅ Form submissions append rows to Google Sheet
- ✅ /solicitar-llamada/ excluded from search engine indexing (robots.txt)
- ✅ CTAs visible and functional on all pages (home, catalog, about)
- ✅ Mobile experience tested and working
- ✅ Success redirect flow working end-to-end

