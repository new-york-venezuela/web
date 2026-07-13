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
