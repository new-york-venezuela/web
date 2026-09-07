export const WHATSAPP_PHONE = '584141552433';

export function generateWhatsAppLink(message: string): string {
  const encoded = encodeURIComponent(message);
  return `https://wa.me/${WHATSAPP_PHONE}?text=${encoded}`;
}

export function generateLeadMessage(
  name: string,
  businessType: string,
  email: string
): string {
  return `Hola! Estoy interesado en ser cliente:

Nombre: ${name}
Negocio: ${businessType}
Correo: ${email}`;
}

export function generateLeadPrompt(): string {
  return `Hola! Quisiera información sobre vuestros productos.

Por favor, comparte lo siguiente:
1. Tu nombre
2. Tipo de negocio (Supermercado, Restaurante, Hotel, Catering, etc.)
3. Tu correo electrónico`;
}
