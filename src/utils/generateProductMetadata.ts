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
  distribuida_en?: string[];
  proveedores?: string[];
  preguntas_frecuentes?: Array<{
    pregunta: string;
    respuesta: string;
  }>;
}

export function generateProductSchema(producto: Producto, baseUrl: string, company?: any): string {
  const schema: any = {
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

  // E-E-A-T: Add manufacturer/brand info
  if (company) {
    schema.brand = {
      '@type': 'Brand',
      name: company.name
    };
    schema.manufacturer = {
      '@type': 'Organization',
      name: company.name,
      image: `${baseUrl}${company.logo}`
    };
  }

  // E-E-A-T: Add certifications as claims
  if (producto.certificaciones && producto.certificaciones.length > 0) {
    schema.certifications = producto.certificaciones;
  }

  // Add distributors (where to buy)
  if (producto.distribuida_en && producto.distribuida_en.length > 0) {
    schema.distributor = producto.distribuida_en.map(distributor => ({
      '@type': 'LocalBusiness',
      name: distributor
    }));
  }

  return JSON.stringify(schema);
}

export function generateFaqSchema(faqs: Array<{ pregunta: string; respuesta: string }>, baseUrl: string): string {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(faq => ({
      '@type': 'Question',
      name: faq.pregunta,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.respuesta
      }
    }))
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
  const schema: any = {
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
    priceRange: '$$',
    sameAs: [
      'https://www.instagram.com/alimentosnewyork',
      'https://www.facebook.com/alimentosnewyork'
    ]
  };

  if (contact?.phone) {
    schema.telephone = contact.phone;
  }
  if (contact?.email) {
    schema.email = contact.email;
  }

  return JSON.stringify(schema);
}
