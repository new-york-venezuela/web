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
