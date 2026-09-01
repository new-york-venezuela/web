/**
 * generateProductMetadata.ts
 *
 * Generate JSON-LD schemas and SEO metadata for products
 */

// Canonical Producto type lives in loadProductos.ts. Re-export it so existing
// imports from this module keep working without duplicating the definition.
import type { Producto } from './loadProductos';
import { COMPANY } from '../data/company';
export type { Producto };

export function generateProductSchema(
  producto: Producto,
  baseUrl: string,
  company?: typeof COMPANY,
  imageUrl?: string
): string {
  const resolvedImage = imageUrl
    ? (/^https?:\/\//.test(imageUrl) ? imageUrl : `${baseUrl}${imageUrl}`)
    : `${baseUrl}/productos/${producto.imagen}.png`;

  const schema: any = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: producto.nombre,
    description: producto.descripcion_seo || producto.descripcion,
    image: resolvedImage,
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

export interface ArticleSchemaInput {
  title: string;
  description: string;
  pubDate: Date;
  author: string;
  url: string;
  imageUrl?: string;
}

export function generateArticleSchema(
  article: ArticleSchemaInput,
  baseUrl: string
): string {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.description,
    datePublished: article.pubDate.toISOString(),
    author: {
      '@type': 'Person',
      name: article.author,
    },
    publisher: {
      '@type': 'Organization',
      name: COMPANY.name,
      logo: {
        '@type': 'ImageObject',
        url: `${baseUrl}${COMPANY.logo}`,
      },
    },
    url: article.url.startsWith('http') ? article.url : `${baseUrl}${article.url}`,
    ...(article.imageUrl && {
      image: article.imageUrl.startsWith('http')
        ? article.imageUrl
        : `${baseUrl}${article.imageUrl}`,
    }),
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
