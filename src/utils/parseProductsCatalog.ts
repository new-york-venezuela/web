/**
 * parseProductsCatalog.ts
 *
 * Utility to parse product catalog and create work manifest with all 25 products.
 * This includes 16 base products and 9 variants for SEO coverage.
 *
 * Specs extracted from: docs/superpowers/specs/2026-07-17-product-catalog-rebuild.md
 */

export interface ProductSpecs {
  peso?: string;
  codigo_barras?: string;
  cpe?: string;
  mpps?: string;
  tiempoVida?: string;
  temperatura?: string;
}

export interface ProductWorkItem {
  id: string;
  nombre: string;
  categoria_primaria: 'supermarket' | 'foodservice';
  categoria_secundaria: 'panes' | 'reposteria' | 'especialidades' | 'pizza';
  imagen: string; // slug without extension
  destacado?: boolean;
  precioRef?: number;
  certificaciones?: string[];
  specs: ProductSpecs;
  variantes_relacionadas?: string[];
  imagenAlt?: string;
}

export interface WorkManifest {
  productos: ProductWorkItem[];
  totalProducts: number; // base products (16)
  variantCount: number; // total entries including variants (25)
  imageRenamingMap: Record<string, string>; // original filename -> normalized slug
  generatedAt: string;
}

/**
 * Define all 25 products from the catalog specification
 */
const CATALOG_PRODUCTS: ProductWorkItem[] = [
  // 1. Pan 4 Granos
  {
    id: 'pan-4-granos',
    nombre: 'Pan 4 Granos',
    categoria_primaria: 'supermarket',
    categoria_secundaria: 'panes',
    imagen: 'pan-4-granos',
    destacado: true,
    precioRef: 3.5,
    certificaciones: ['Kosher Pat Israel'],
    specs: {
      peso: '500 g',
      codigo_barras: '7591348001031',
      cpe: '0309165344',
      mpps: 'A-67.733',
      tiempoVida: '15 días',
      temperatura: 'ambiente'
    },
    imagenAlt: 'Pan 4 Granos - producto de panadería New York'
  },

  // 2. Pan 7 Cereales
  {
    id: 'pan-7-cereales',
    nombre: 'Pan 7 Cereales',
    categoria_primaria: 'supermarket',
    categoria_secundaria: 'panes',
    imagen: 'pan-7-cereales',
    precioRef: 4.2,
    specs: {
      peso: '600 g',
      tiempoVida: '15 días',
      temperatura: 'ambiente'
    },
    variantes_relacionadas: ['pan-4-granos'],
    imagenAlt: 'Pan 7 Cereales - panadería premium New York'
  },

  // 3. Pan Blanco Especial
  {
    id: 'pan-blanco-especial',
    nombre: 'Pan Blanco Especial',
    categoria_primaria: 'supermarket',
    categoria_secundaria: 'panes',
    imagen: 'pan-blanco-especial',
    precioRef: 3.8,
    specs: {
      peso: '600 g',
      tiempoVida: '15 días',
      temperatura: 'ambiente'
    },
    imagenAlt: 'Pan Blanco Especial - panadería New York'
  },

  // 4. Pan Uvas Pasas, Miel y Canela
  {
    id: 'pan-uvas-pasas-miel-canela',
    nombre: 'Pan Uvas Pasas, Miel y Canela',
    categoria_primaria: 'supermarket',
    categoria_secundaria: 'panes',
    imagen: 'pan-uvas-pasas-miel-canela',
    precioRef: 4.5,
    specs: {
      peso: '600 g',
      tiempoVida: '15 días',
      temperatura: 'ambiente'
    },
    imagenAlt: 'Pan Uvas Pasas, Miel y Canela - panadería New York'
  },

  // 5. Magdalenas
  {
    id: 'magdalenas',
    nombre: 'Magdalenas',
    categoria_primaria: 'supermarket',
    categoria_secundaria: 'reposteria',
    imagen: 'magdalenas',
    precioRef: 5.0,
    specs: {
      peso: '10x45g',
      tiempoVida: '20 días',
      temperatura: 'ambiente'
    },
    imagenAlt: 'Magdalenas - repostería artesanal New York'
  },

  // 6. Pan Pumpernickel
  {
    id: 'pan-pumpernickel',
    nombre: 'Pan Pumpernickel',
    categoria_primaria: 'supermarket',
    categoria_secundaria: 'panes',
    imagen: 'pan-pumpernickel',
    precioRef: 3.2,
    specs: {
      peso: '210 g',
      tiempoVida: '15 días',
      temperatura: 'ambiente'
    },
    imagenAlt: 'Pan Pumpernickel - panadería New York'
  },

  // 7. Pan Molido Especial
  {
    id: 'pan-molido-especial',
    nombre: 'Pan Molido Especial',
    categoria_primaria: 'supermarket',
    categoria_secundaria: 'reposteria',
    imagen: 'pan-molido-especial',
    precioRef: 4.0,
    specs: {
      peso: '500 g',
      tiempoVida: '20 días',
      temperatura: 'ambiente'
    },
    imagenAlt: 'Pan Molido Especial - panadería New York'
  },

  // 8. Baguettes Precocida Comercial (supermarket)
  {
    id: 'baguettes-precocida-comercial',
    nombre: 'Baguettes Precocida Congelada - Comercial',
    categoria_primaria: 'supermarket',
    categoria_secundaria: 'panes',
    imagen: 'baguettes-precocida-comercial',
    precioRef: 2.5,
    specs: {
      peso: '225 g',
      tiempoVida: '120 días',
      temperatura: 'congelado'
    },
    imagenAlt: 'Baguettes Precocida Congelada - panadería New York'
  },

  // 8b. Baguettes Precocida Foodservice
  {
    id: 'baguettes-precocida-foodservice',
    nombre: 'Baguettes Precocida Congelada - Foodservice',
    categoria_primaria: 'foodservice',
    categoria_secundaria: 'panes',
    imagen: 'baguettes-precocida-foodservice',
    precioRef: 2.8,
    specs: {
      peso: '225 g',
      tiempoVida: '120 días',
      temperatura: 'congelado'
    },
    imagenAlt: 'Baguettes Precocida Foodservice - panadería New York'
  },

  // 9. Pizza Margarita Premium
  {
    id: 'pizza-margarita-premium',
    nombre: 'Pizza Margarita Premium',
    categoria_primaria: 'supermarket',
    categoria_secundaria: 'pizza',
    imagen: 'pizza-margarita-premium',
    precioRef: 8.0,
    specs: {
      peso: '2 unidades',
      tiempoVida: '90 días',
      temperatura: 'congelado'
    },
    variantes_relacionadas: ['pizza-margarita-clasica', 'pizza-americana'],
    imagenAlt: 'Pizza Margarita Premium - panadería New York'
  },

  // 9b. Pizza Margarita Clásica
  {
    id: 'pizza-margarita-clasica',
    nombre: 'Pizza Margarita Clásica',
    categoria_primaria: 'supermarket',
    categoria_secundaria: 'pizza',
    imagen: 'pizza-margarita-clasica',
    precioRef: 7.5,
    specs: {
      peso: '2 unidades',
      tiempoVida: '90 días',
      temperatura: 'congelado'
    },
    variantes_relacionadas: ['pizza-margarita-premium', 'pizza-americana'],
    imagenAlt: 'Pizza Margarita Clásica - panadería New York'
  },

  // 9c. Pizza Americana
  {
    id: 'pizza-americana',
    nombre: 'Pizza Americana',
    categoria_primaria: 'supermarket',
    categoria_secundaria: 'pizza',
    imagen: 'pizza-americana',
    precioRef: 8.5,
    specs: {
      peso: '2 unidades',
      tiempoVida: '90 días',
      temperatura: 'congelado'
    },
    variantes_relacionadas: ['pizza-margarita-premium', 'pizza-margarita-clasica'],
    imagenAlt: 'Pizza Americana - panadería New York'
  },

  // 10. Torta de Queso New York - Fresa
  {
    id: 'torta-queso-new-york-fresa',
    nombre: 'Torta de Queso New York - Fresa',
    categoria_primaria: 'supermarket',
    categoria_secundaria: 'reposteria',
    imagen: 'torta-queso-new-york-fresa',
    destacado: true,
    precioRef: 12.0,
    specs: {
      peso: '700 g',
      tiempoVida: '30 días',
      temperatura: 'refrigerado'
    },
    variantes_relacionadas: ['torta-queso-new-york-chocolate'],
    imagenAlt: 'Torta de Queso New York Fresa - repostería premium New York'
  },

  // 10b. Torta de Queso New York - Chocolate
  {
    id: 'torta-queso-new-york-chocolate',
    nombre: 'Torta de Queso New York - Chocolate',
    categoria_primaria: 'supermarket',
    categoria_secundaria: 'reposteria',
    imagen: 'torta-queso-new-york-chocolate',
    destacado: true,
    precioRef: 12.0,
    specs: {
      peso: '700 g',
      tiempoVida: '30 días',
      temperatura: 'refrigerado'
    },
    variantes_relacionadas: ['torta-queso-new-york-fresa'],
    imagenAlt: 'Torta de Queso New York Chocolate - repostería premium New York'
  },

  // 11. Torta de Queso New York Comercial - Fresa (foodservice)
  {
    id: 'torta-queso-new-york-comercial-fresa',
    nombre: 'Torta de Queso New York Comercial - Fresa',
    categoria_primaria: 'foodservice',
    categoria_secundaria: 'reposteria',
    imagen: 'torta-queso-new-york-comercial-fresa',
    precioRef: 22.0,
    specs: {
      peso: '1500 g',
      tiempoVida: '30 días',
      temperatura: 'refrigerado'
    },
    variantes_relacionadas: ['torta-queso-new-york-comercial-chocolate', 'torta-queso-new-york-comercial-plain'],
    imagenAlt: 'Torta de Queso New York Comercial Fresa - repostería profesional'
  },

  // 11b. Torta de Queso New York Comercial - Chocolate
  {
    id: 'torta-queso-new-york-comercial-chocolate',
    nombre: 'Torta de Queso New York Comercial - Chocolate',
    categoria_primaria: 'foodservice',
    categoria_secundaria: 'reposteria',
    imagen: 'torta-queso-new-york-comercial-chocolate',
    precioRef: 22.0,
    specs: {
      peso: '1500 g',
      tiempoVida: '30 días',
      temperatura: 'refrigerado'
    },
    variantes_relacionadas: ['torta-queso-new-york-comercial-fresa', 'torta-queso-new-york-comercial-plain'],
    imagenAlt: 'Torta de Queso New York Comercial Chocolate - repostería profesional'
  },

  // 11c. Torta de Queso New York Comercial - Plain
  {
    id: 'torta-queso-new-york-comercial-plain',
    nombre: 'Torta de Queso New York Comercial - Plain',
    categoria_primaria: 'foodservice',
    categoria_secundaria: 'reposteria',
    imagen: 'torta-queso-new-york-comercial-plain',
    precioRef: 20.0,
    specs: {
      peso: '1500 g',
      tiempoVida: '30 días',
      temperatura: 'refrigerado'
    },
    variantes_relacionadas: ['torta-queso-new-york-comercial-fresa', 'torta-queso-new-york-comercial-chocolate'],
    imagenAlt: 'Torta de Queso New York Comercial Plain - repostería profesional'
  },

  // 12. Pan Hamburguesa New York
  {
    id: 'pan-hamburguesa-new-york',
    nombre: 'Pan Hamburguesa New York',
    categoria_primaria: 'supermarket',
    categoria_secundaria: 'panes',
    imagen: 'pan-hamburguesa-new-york',
    precioRef: 3.0,
    specs: {
      peso: '8 unidades',
      tiempoVida: '15 días',
      temperatura: 'ambiente'
    },
    variantes_relacionadas: ['pan-hamburguesa-brioche'],
    imagenAlt: 'Pan Hamburguesa New York - panadería premium'
  },

  // 12b. Pan Hamburguesa Brioche
  {
    id: 'pan-hamburguesa-brioche',
    nombre: 'Pan Hamburguesa Brioche',
    categoria_primaria: 'supermarket',
    categoria_secundaria: 'panes',
    imagen: 'pan-hamburguesa-brioche',
    precioRef: 3.2,
    specs: {
      peso: '8 unidades',
      tiempoVida: '15 días',
      temperatura: 'ambiente'
    },
    variantes_relacionadas: ['pan-hamburguesa-new-york'],
    imagenAlt: 'Pan Hamburguesa Brioche - panadería premium'
  },

  // 13. Baguettes Demi Mini
  {
    id: 'baguettes-demi-mini',
    nombre: 'Baguettes Demi Mini',
    categoria_primaria: 'supermarket',
    categoria_secundaria: 'panes',
    imagen: 'baguettes-demi-mini',
    precioRef: 2.0,
    specs: {
      peso: '225 g (variantes: 32cm, 21cm, 11cm)',
      tiempoVida: '15 días',
      temperatura: 'ambiente'
    },
    imagenAlt: 'Baguettes Demi Mini - panadería New York'
  },

  // 14. Croissants
  {
    id: 'croissants',
    nombre: 'Croissants y Petit Croissants',
    categoria_primaria: 'supermarket',
    categoria_secundaria: 'reposteria',
    imagen: 'croissants',
    precioRef: 4.5,
    specs: {
      peso: '80g y 25g variantes',
      tiempoVida: '15 días',
      temperatura: 'ambiente'
    },
    imagenAlt: 'Croissants y Petit Croissants - repostería artesanal New York'
  },

  // 15. Bagels New York - Plain
  {
    id: 'bagels-new-york-plain',
    nombre: 'Bagels estilo New York - Plain',
    categoria_primaria: 'supermarket',
    categoria_secundaria: 'especialidades',
    imagen: 'bagels-new-york-plain',
    precioRef: 3.5,
    specs: {
      peso: '100 g',
      tiempoVida: '15 días',
      temperatura: 'ambiente'
    },
    variantes_relacionadas: ['bagels-new-york-ajonjoli', 'bagels-new-york-everything'],
    imagenAlt: 'Bagels estilo New York Plain - especialidades panadería'
  },

  // 15b. Bagels New York - Ajonjolí
  {
    id: 'bagels-new-york-ajonjoli',
    nombre: 'Bagels estilo New York - Ajonjolí',
    categoria_primaria: 'supermarket',
    categoria_secundaria: 'especialidades',
    imagen: 'bagels-new-york-ajonjoli',
    precioRef: 3.6,
    specs: {
      peso: '100 g',
      tiempoVida: '15 días',
      temperatura: 'ambiente'
    },
    variantes_relacionadas: ['bagels-new-york-plain', 'bagels-new-york-everything'],
    imagenAlt: 'Bagels estilo New York Ajonjolí - especialidades panadería'
  },

  // 15c. Bagels New York - Everything
  {
    id: 'bagels-new-york-everything',
    nombre: 'Bagels estilo New York - Everything',
    categoria_primaria: 'supermarket',
    categoria_secundaria: 'especialidades',
    imagen: 'bagels-new-york-everything',
    destacado: true,
    precioRef: 3.8,
    specs: {
      peso: '100 g',
      tiempoVida: '15 días',
      temperatura: 'ambiente'
    },
    variantes_relacionadas: ['bagels-new-york-plain', 'bagels-new-york-ajonjoli'],
    imagenAlt: 'Bagels estilo New York Everything - especialidades panadería'
  },

  // 16. Pan 1700 (foodservice)
  {
    id: 'pan-1700',
    nombre: 'Pan 1700',
    categoria_primaria: 'foodservice',
    categoria_secundaria: 'panes',
    imagen: 'pan-1700',
    precioRef: 8.0,
    specs: {
      peso: '1700 g',
      tiempoVida: '15 días',
      temperatura: 'ambiente'
    },
    imagenAlt: 'Pan 1700 - panadería profesional New York'
  }
];

/**
 * Generate mapping from original image filenames to normalized slugs
 * This map supports image renaming in a downstream task
 */
function generateImageRenamingMap(): Record<string, string> {
  const map: Record<string, string> = {};

  // Map each product's potential original filenames to normalized slug
  const mappings = [
    { originals: ['Pan 4 Granos.png', 'Pan 4 Granos.jpg'], slug: 'pan-4-granos' },
    { originals: ['Pan 7 Cereales.png', 'Pan 7 Cereales.jpg'], slug: 'pan-7-cereales' },
    { originals: ['Pan Blanco Especial.png', 'Pan Blanco Especial.jpg'], slug: 'pan-blanco-especial' },
    { originals: ['Uvas Pasas, Miel y Canela.png', 'Uvas Pasas, Miel y Canela.jpg'], slug: 'pan-uvas-pasas-miel-canela' },
    { originals: ['Magdalenas.png', 'Magdalenas.jpg'], slug: 'magdalenas' },
    { originals: ['Pan pumpernickel.png', 'Pan pumpernickel.jpg'], slug: 'pan-pumpernickel' },
    { originals: ['Pan Molido Especial.png', 'Pan Molido Especial.jpg'], slug: 'pan-molido-especial' },
    { originals: ['Baguettes Precocida Congelada - Comercial.png', 'Baguettes Precocida Congelada - Comercial.jpg'], slug: 'baguettes-precocida-comercial' },
    { originals: ['Baguettes Precocida Congelada - Foodservice.png', 'Baguettes Precocida Congelada - Foodservice.jpg'], slug: 'baguettes-precocida-foodservice' },
    { originals: ['Pizzas Precocidas Congeladas - Premium.png', 'Pizzas Precocidas Congeladas - Premium.jpg'], slug: 'pizza-margarita-premium' },
    { originals: ['Pizzas Precocidas Congeladas - Clásica.png', 'Pizzas Precocidas Congeladas - Clásica.jpg'], slug: 'pizza-margarita-clasica' },
    { originals: ['Pizzas Precocidas Congeladas - Americana.png', 'Pizzas Precocidas Congeladas - Americana.jpg'], slug: 'pizza-americana' },
    { originals: ['Torta de Queso New York - Fresa.png', 'Torta de Queso New York - Fresa.jpg'], slug: 'torta-queso-new-york-fresa' },
    { originals: ['Torta de Queso New York - Chocolate.png', 'Torta de Queso New York - Chocolate.jpg'], slug: 'torta-queso-new-york-chocolate' },
    { originals: ['Torta de Queso New York Comercial - Fresa.png', 'Torta de Queso New York Comercial - Fresa.jpg'], slug: 'torta-queso-new-york-comercial-fresa' },
    { originals: ['Torta de Queso New York Comercial - Chocolate.png', 'Torta de Queso New York Comercial - Chocolate.jpg'], slug: 'torta-queso-new-york-comercial-chocolate' },
    { originals: ['Torta de Queso New York Comercial - Plain.png', 'Torta de Queso New York Comercial - Plain.jpg'], slug: 'torta-queso-new-york-comercial-plain' },
    { originals: ['Pan de hamburguesa.png', 'Pan de hamburguesa.jpg'], slug: 'pan-hamburguesa-new-york' },
    { originals: ['Pan de hamburguesa Brioche.png', 'Pan de hamburguesa Brioche.jpg'], slug: 'pan-hamburguesa-brioche' },
    { originals: ['Baguettes - Demi - Mini.png', 'Baguettes - Demi - Mini.jpg'], slug: 'baguettes-demi-mini' },
    { originals: ['Croissants y Petit Croissants.png', 'Croissants y Petit Croissants.jpg'], slug: 'croissants' },
    { originals: ['Bagels estilo New York - Plain.png', 'Bagels estilo New York - Plain.jpg'], slug: 'bagels-new-york-plain' },
    { originals: ['Bagels estilo New York - Ajonjolí.png', 'Bagels estilo New York - Ajonjolí.jpg'], slug: 'bagels-new-york-ajonjoli' },
    { originals: ['Bagels estilo New York - Everything.png', 'Bagels estilo New York - Everything.jpg'], slug: 'bagels-new-york-everything' },
    { originals: ['Pan 1700.png', 'Pan 1700.jpg'], slug: 'pan-1700' }
  ];

  for (const mapping of mappings) {
    for (const original of mapping.originals) {
      map[original] = mapping.slug;
    }
  }

  return map;
}

/**
 * Parse the product catalog and return a structured work manifest
 */
export function parseProductsCatalog(): WorkManifest {
  const imageRenamingMap = generateImageRenamingMap();

  return {
    productos: CATALOG_PRODUCTS,
    totalProducts: 16, // base products
    variantCount: CATALOG_PRODUCTS.length, // 25 total entries
    imageRenamingMap,
    generatedAt: new Date().toISOString()
  };
}

/**
 * Utility function to get all product IDs (for validation)
 */
export function getAllProductIds(): string[] {
  return CATALOG_PRODUCTS.map(p => p.id);
}

/**
 * Utility function to get products by category
 */
export function getProductsByCategory(
  primaria: 'supermarket' | 'foodservice',
  secundaria?: 'panes' | 'reposteria' | 'especialidades' | 'pizza'
): ProductWorkItem[] {
  return CATALOG_PRODUCTS.filter(p => {
    if (p.categoria_primaria !== primaria) return false;
    if (secundaria && p.categoria_secundaria !== secundaria) return false;
    return true;
  });
}

/**
 * Utility function to validate all product variant references
 */
export function validateVariantReferences(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const allIds = new Set(getAllProductIds());

  for (const producto of CATALOG_PRODUCTS) {
    if (producto.variantes_relacionadas) {
      for (const variantId of producto.variantes_relacionadas) {
        if (!allIds.has(variantId)) {
          errors.push(`Producto "${producto.id}": variant reference "${variantId}" no existe`);
        }
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
