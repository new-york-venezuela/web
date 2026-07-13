# Task 1: Create Form Configuration & Validation Utilities

**Where this fits:** First task in lead capture system. Creates the foundation for form fields and validation logic used by all downstream components (LeadForm, API route).

**Files:**
- Create: `src/data/formConfig.ts`
- Create: `src/utils/formValidation.ts`
- Test: Manual validation testing

**Interfaces:**
- Produces: 
  - `FormField` interface with name, label, type, required, pattern, placeholder
  - `validateForm(data: FormData)` → `{ valid: boolean, errors: ValidationError[] }`
  - `LEAD_FORM_FIELDS: FormField[]` array with predefined fields
  - `BUSINESS_TYPE_LABELS: Record<string, string>` mapping

## Step 1: Create formConfig.ts with field definitions

**File:** `src/data/formConfig.ts`

```typescript
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

## Step 2: Create formValidation.ts with validation logic

**File:** `src/utils/formValidation.ts`

```typescript
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

  if (!validateRequired(formData.fullName)) {
    errors.push({ field: 'fullName', message: 'El nombre completo es requerido' });
  } else if (formData.fullName!.length < 3) {
    errors.push({ field: 'fullName', message: 'El nombre debe tener al menos 3 caracteres' });
  }

  if (!validateRequired(formData.phone)) {
    errors.push({ field: 'phone', message: 'El teléfono es requerido' });
  } else if (!validatePhone(formData.phone!)) {
    errors.push({ field: 'phone', message: 'Formato de teléfono inválido' });
  }

  if (!validateRequired(formData.email)) {
    errors.push({ field: 'email', message: 'El correo electrónico es requerido' });
  } else if (!validateEmail(formData.email!)) {
    errors.push({ field: 'email', message: 'Correo electrónico inválido' });
  }

  if (!validateRequired(formData.businessType)) {
    errors.push({ field: 'businessType', message: 'Debes seleccionar un tipo de negocio' });
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
```

## Step 3: Verify validation logic

Test cases:
- Valid form (all required fields correct) → `valid: true, errors: []`
- Invalid email → error on email field
- Invalid phone (too short) → error on phone field
- Empty required fields → errors on each empty field
- Optional fields empty → no errors

After implementation, test manually or via simple Node.js script.
