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
  const cleaned = phone.replace(/\D/g, '');
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
