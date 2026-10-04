/**
 * generateProductMetadata.ts
 *
 * Generate JSON-LD schemas and SEO metadata for products
 */

// Canonical Producto type lives in loadProductos.ts. Re-export it so existing
// imports from this module keep working without duplicating the definition.
import type { Producto } from './loadProductos';
import { COMPANY, AUTHOR } from '../data/company';
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

  // Sin `offers`: los precios son de referencia ($ Ref) y se cotizan B2B; publicar un
  // Offer.price en el schema sería engañoso para Google.
  const brandName = company?.name ?? COMPANY.name;
  const schema: any = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: producto.nombre,
    description: producto.descripcion_seo || producto.descripcion,
    image: resolvedImage,
    url: `${baseUrl}/productos/${producto.id}/`,
    brand: { '@type': 'Brand', name: brandName },
    manufacturer: {
      '@type': 'Organization',
      name: COMPANY.legalName,
      alternateName: brandName,
      logo: `${baseUrl}${COMPANY.logo}`
    }
  };

  // E-E-A-T: certificaciones como additionalProperty (schema.org no define `certifications` en Product)
  if (producto.certificaciones && producto.certificaciones.length > 0) {
    schema.additionalProperty = producto.certificaciones.map((valor) => ({
      '@type': 'PropertyValue',
      name: 'Certificación',
      value: valor
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
    dateModified: article.pubDate.toISOString(),
    mainEntityOfPage: article.url.startsWith('http') ? article.url : `${baseUrl}${article.url}`,
    inLanguage: 'es-VE',
    author: {
      '@type': 'Person',
      name: article.author,
      jobTitle: AUTHOR.jobTitle,
      url: `${baseUrl}${AUTHOR.url}`,
      worksFor: { '@type': 'Organization', name: COMPANY.name, url: baseUrl },
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
    image: (() => {
      const img = article.imageUrl ?? COMPANY.ogImage;
      return img.startsWith('http') ? img : `${baseUrl}${img}`;
    })(),
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
    image: `${baseUrl}${COMPANY.ogImage}`,
    legalName: 'New York Cheese Cake C.A.',
    foundingDate: '1980',
    description: 'Panadería y pastelería industrial premium desde 1980. Panes artesanales, cheesecake estilo Nueva York, pizzas congeladas y especialidades. Distribución B2B/B2C en Caracas. Certificado Kosher Parve.',
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Calle 10, Edif. J. M., Piso 2, La Urbina',
      addressLocality: 'Caracas',
      addressRegion: 'DF',
      addressCountry: 'VE'
    },
    areaServed: {
      '@type': 'City',
      name: 'Caracas'
    },
    priceRange: '$$',
    knowsAbout: [
      'panadería industrial',
      'cheesecake estilo Nueva York',
      'productos Kosher Parve',
      'pan precocido congelado'
    ],
    // TODO(entidad): sameAs solo debe contener URLs REALES y verificadas (Instagram, Facebook,
    // LinkedIn, Google Business Profile, Wikidata). Ver docs/seo/ENTITY-BUILDING.md.
    // Los enlaces actuales no están verificados; reemplazarlos o retirarlos.
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
