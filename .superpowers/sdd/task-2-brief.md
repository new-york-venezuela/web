# Task 2: Create LeadForm Component

**Where this fits:** Second task. Builds the reusable form component used by the landing page (Task 3). Depends on Task 1 (formConfig, validation utilities).

**Files:**
- Create: `src/components/LeadForm.astro`
- Depends on: Task 1 outputs (formConfig.ts, formValidation.ts)

**Interfaces:**
- Consumes: `LEAD_FORM_FIELDS` from formConfig, validation functions from formValidation
- Produces: Astro component that renders form with two states (form / success confirmation)

**Key requirements:**
- Render form with all fields from LEAD_FORM_FIELDS
- Support form submission via fetch to `/api/submit-lead` (POST)
- On success, redirect to `/solicitar-llamada/?success=true`
- On success state, show success message and confirmation
- Validate HTML5 form constraints (required, type, pattern attributes)
- All text in Spanish
- Style with CSS variables (var(--space-*), var(--color-*)) for consistency

## Step 1: Create LeadForm.astro component

**File:** `src/components/LeadForm.astro`

Key features:
- Props: `showSuccess?: boolean`, `successMessage?: string` (with defaults)
- Maps over LEAD_FORM_FIELDS to render each field
- Handles select, textarea, and input types
- Success state shows checkmark icon, title, messages
- Form state shows all fields with required indicators (*), submit button, note
- Client-side script handles form submission (fetch to /api/submit-lead)
- On error, shows alert to user
- Styling: form layout with flex, spacing, input styling with focus states

**Complete code in the brief below:**

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

## Step 2: Verify component renders

After creating the file:
- Component should import without errors
- No TypeScript errors in IDE
- Ready to be used by Task 3 (landing page)
