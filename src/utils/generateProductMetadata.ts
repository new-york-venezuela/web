/**
 * generateProductMetadata.ts
 *
 * Generate JSON-LD schemas and SEO metadata for products
 */

export interface Producto {
  id: string;
  nombre: string;
  descripcion: string;
  descripcion_seo?: string;
  categoria_primaria: 'supermarket' | 'foodservice';
  categoria_secundaria: 'panes' | 'reposteria' | 'especialidades' | 'pizza';
  imagen: string;
  imagenAlt?: string;
  palabras_clave?: string[];
  destacado?: boolean;
  precioRef?: number;
  certificaciones?: string[];
  specs?: {
    peso?: string;
    codigo_barras?: string;
    cpe?: string;
    mpps?: string;
    tiempoVida?: string;
    temperatura?: string;
  };
  variantes_relacionadas?: string[];
}

export function generateProductSchema(producto: Producto, baseUrl: string): string {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: producto.nombre,
    description: producto.descripcion_seo || producto.descripcion,
    image: `${baseUrl}/public/productos/${producto.imagen}.png`,
    offers: {
      '@type': 'Offer',
      priceCurrency: 'USD',
      price: producto.precioRef?.toString() || '0',
      availability: 'https://schema.org/InStock'
    }
  };
  return JSON.stringify(schema);
}

export function generateBreadcrumbSchema(breadcrumbs: Array<{ name: string; url: string }>, baseUrl: string): string {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbs.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: `${baseUrl}${item.url}`
    }))
  };
  return JSON.stringify(schema);
}

export function generateLocalBusinessSchema(
  baseUrl: string,
  contact?: { phone?: string; email?: string }
): string {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: 'Alimentos New York',
    alternateName: [
      'Panadería Nueva York',
      'New York Bakery',
      'Pastelería New York',
      'New York'
    ],
    url: baseUrl,
    logo: `${baseUrl}/logo.png`,
    image: `${baseUrl}/og-image.png`,
    description: 'Panadería y pastelería industrial premium con más de 40 años. Panes artesanales, cheesecake estilo Nueva York, pizzas congeladas y especialidades. Distribución B2B/B2C en Caracas. Certificado Kosher Parve.',
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Caracas',
      addressRegion: 'DF',
      addressCountry: 'VE'
    },
    areaServed: {
      '@type': 'City',
      name: 'Caracas'
    },
    ...(contact?.phone && { telephone: contact.phone }),
    ...(contact?.email && { email: contact.email }),
    priceRange: '$$',
    sameAs: [
      'https://www.instagram.com/alimentosnewyork',
      'https://www.facebook.com/alimentosnewyork'
    ]
  };
  return JSON.stringify(schema);
}
