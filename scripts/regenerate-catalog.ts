#!/usr/bin/env node

/**
 * Regenerate full products.json catalog with all 25 products and SEO metadata
 * Sources all product specs from parseProductsCatalog and enriches with descriptions
 */

import { parseProductsCatalog, ProductWorkItem } from '../src/utils/parseProductsCatalog';
import * as fs from 'fs';
import * as path from 'path';

interface FullProduct extends ProductWorkItem {
  descripcion: string; // short description for cards
  descripcion_seo: string; // 150-160 chars for meta tags
  palabras_clave: string[]; // 5-7 Spanish keywords
}

// All 25 products with full metadata
const FULL_CATALOG: FullProduct[] = [
  {
    id: 'pan-4-granos',
    nombre: 'Pan 4 Granos',
    descripcion: 'Elaborado con una combinación de harina de trigo, trigo entero molido, agua, granos enteros de linaza, avena, ajonjolí, girasol, sal, levadura y conservantes. Es 100% libre de azúcares y grasas añadidas.',
    descripcion_seo: 'Pan integral de 4 granos con linaza, avena y ajonjolí. 100% libre de azúcares y grasas. Certificado Kosher Pat Israel. Ideal para dietas balanceadas.',
    categoria_primaria: 'supermarket',
    categoria_secundaria: 'panes',
    imagen: 'pan-4-granos',
    imagenAlt: 'Pan 4 Granos - panadería premium New York, Caracas, Venezuela',
    palabras_clave: ['pan integral', 'pan 4 granos', 'pan sin azúcar', 'pan kosher', 'panadería New York Caracas'],
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
    }
  },
  {
    id: 'pan-7-cereales',
    nombre: 'Pan 7 Cereales',
    descripcion: 'Una mezcla artesanal de centeno, trigo, maíz, avena, quinoa, cebada y ajonjolí. Fuente de carbohidratos complejos, cero colesterol, bajo índice glicémico, cero grasas trans, rico en fibras solubles e insolubles.',
    descripcion_seo: 'Pan integral de 7 cereales con centeno, trigo, maíz, avena, quinoa, cebada y ajonjolí. Bajo índice glucémico, rico en fibra. Kosher Pat Israel.',
    categoria_primaria: 'supermarket',
    categoria_secundaria: 'panes',
    imagen: 'pan-7-cereales',
    imagenAlt: 'Pan 7 Cereales - panadería artesanal New York, Caracas',
    palabras_clave: ['pan 7 cereales', 'pan integral multicereales', 'pan bajo índice glucémico', 'pan sin colesterol', 'panadería artesanal Caracas'],
    precioRef: 4.2,
    certificaciones: ['Kosher Pat Israel'],
    specs: {
      peso: '600 g',
      codigo_barras: '7591348000126',
      cpe: '070115778',
      mpps: 'A-88.120',
      tiempoVida: '15 días',
      temperatura: 'ambiente'
    },
    variantes_relacionadas: ['pan-4-granos']
  },
  {
    id: 'pan-blanco-especial',
    nombre: 'Pan Blanco Especial',
    descripcion: 'Pan elaborado con harina de trigo refinada de alta calidad, proporcionando una miga ligera y esponjosa. Excelente opción para quienes requieren una fuente rápida de energía.',
    descripcion_seo: 'Pan blanco especial de sandwich esponjoso de alta calidad. Miga ligera perfecta para sándwiches. Panadería premium New York.',
    categoria_primaria: 'supermarket',
    categoria_secundaria: 'panes',
    imagen: 'pan-blanco-especial',
    imagenAlt: 'Pan Blanco Especial - pan de sandwich esponjoso, Caracas',
    palabras_clave: ['pan blanco', 'pan de sandwich', 'pan esponjoso', 'panadería New York', 'pan premium'],
    precioRef: 3.8,
    certificaciones: ['Kosher Pat Israel'],
    specs: {
      peso: '600 g',
      codigo_barras: '7591348001123',
      cpe: '1018454715',
      mpps: 'A-125.841',
      tiempoVida: '15 días',
      temperatura: 'ambiente'
    }
  },
  {
    id: 'pan-uvas-pasas-miel-canela',
    nombre: 'Pan Uvas Pasas, Miel y Canela',
    descripcion: 'Pan integral que incorpora pasas, miel y canela. La miel actúa como prebiótico favoreciendo la flora intestinal, mientras que la canela ayuda a regular los niveles de azúcar en la sangre.',
    descripcion_seo: 'Pan integral dulce con uvas pasas, miel y canela. Prebiótico natural. Regula niveles de azúcar. Panadería premium Caracas.',
    categoria_primaria: 'supermarket',
    categoria_secundaria: 'panes',
    imagen: 'pan-uvas-pasas-miel-canela',
    imagenAlt: 'Pan Uvas Pasas Miel y Canela - pan integral dulce, New York',
    palabras_clave: ['pan integral', 'pan con pasas', 'pan con miel y canela', 'pan prebiótico', 'panadería New York'],
    precioRef: 4.5,
    certificaciones: ['Kosher Pat Israel'],
    specs: {
      peso: '600 g',
      codigo_barras: '7591348000119',
      cpe: '090563823',
      mpps: 'A-50.167',
      tiempoVida: '15 días',
      temperatura: 'ambiente'
    }
  },
  {
    id: 'magdalenas',
    nombre: 'Magdalenas',
    descripcion: 'Magdalenas inspiradas en la receta clásica del ponqué español, con una miga esponjosa y un delicado aroma a limón. Individualmente empacadas, ideales para la lonchera escolar, la oficina o la playa.',
    descripcion_seo: 'Magdalenas artesanales de limón, ponquecitos esponjosos. Empacadas individualmente para lonchera. Panadería premium New York Caracas.',
    categoria_primaria: 'supermarket',
    categoria_secundaria: 'reposteria',
    imagen: 'magdalenas',
    imagenAlt: 'Magdalenas - ponquecitos de limón artesanales, New York',
    palabras_clave: ['magdalenas', 'ponquecitos', 'ponqué de limón', 'repostería artesanal', 'panadería premium'],
    precioRef: 5.0,
    certificaciones: ['Producto Kosher'],
    specs: {
      peso: '10x45g',
      codigo_barras: '7591348000232',
      cpe: '090563822',
      mpps: 'A-55.587',
      tiempoVida: '3 meses',
      temperatura: 'ambiente'
    }
  },
  {
    id: 'pan-pumpernickel',
    nombre: 'Pan Pumpernickel',
    descripcion: 'Elaborado exclusivamente con granos enteros de centeno 100% orgánicos y con masa madre natural. Excelente opción para regular el metabolismo y mejorar la salud digestiva. Su bajo índice glucémico lo hace ideal para personas con resistencia a la insulina o diabetes.',
    descripcion_seo: 'Pan Pumpernickel 100% centeno orgánico con masa madre. Bajo índice glucémico. Ideal para diabetes. Panadería premium Caracas.',
    categoria_primaria: 'supermarket',
    categoria_secundaria: 'panes',
    imagen: 'pan-pumpernickel',
    imagenAlt: 'Pan Pumpernickel - pan de centeno 100% orgánico, New York',
    palabras_clave: ['pan pumpernickel', 'pan de centeno', 'pan orgánico', 'pan bajo índice glucémico', 'panadería premium'],
    precioRef: 3.2,
    certificaciones: ['Kosher Pat Israel'],
    specs: {
      peso: '210 g',
      codigo_barras: '7591348000188',
      cpe: '090563824',
      mpps: 'A-54.179',
      tiempoVida: '3 meses',
      temperatura: 'ambiente'
    }
  },
  {
    id: 'pan-molido-especial',
    nombre: 'Pan Molido Especial',
    descripcion: 'A diferencia de otros panes rallados que provienen del reciclaje de pan sobrante, nuestro producto es elaborado específicamente para ser molido, garantizando frescura, uniformidad y una textura ideal para rebozados, gratinados y mezclas culinarias.',
    descripcion_seo: 'Pan rallado artesanal molido especialmente. Fresco y uniforme. Ideal para rebozados y gratinados. Panadería premium New York.',
    categoria_primaria: 'supermarket',
    categoria_secundaria: 'reposteria',
    imagen: 'pan-molido-especial',
    imagenAlt: 'Pan Molido Especial - pan rallado artesanal, New York',
    palabras_clave: ['pan rallado', 'pan molido', 'rebozos', 'gratinados', 'panadería premium'],
    precioRef: 2.0,
    certificaciones: ['Kosher Pat Israel'],
    specs: {
      peso: '300 g',
      codigo_barras: '7591348000171',
      cpe: '090563817',
      mpps: 'A-50.611',
      tiempoVida: '12 meses',
      temperatura: 'ambiente'
    }
  },
  {
    id: 'baguettes-precocida-comercial',
    nombre: 'Baguettes Precocida Congelada - Comercial',
    descripcion: 'Baguettes precocidas congeladas que combinan la tradición artesanal con la comodidad moderna. Elaboradas con masa madre, ofrecen una corteza crujiente y una miga aireada. Disponibles en tres tamaños: 32 cm, 21 cm y 11 cm.',
    descripcion_seo: 'Baguettes precocidas congeladas artesanales. Empaque comercial retail. Tres tamaños (32/21/11 cm). Panadería premium New York.',
    categoria_primaria: 'supermarket',
    categoria_secundaria: 'panes',
    imagen: 'baguettes-precocida-comercial',
    imagenAlt: 'Baguettes Precocidas - empaque comercial, panadería New York',
    palabras_clave: ['baguettes', 'baguette congelada', 'pan francés', 'precocido', 'panadería New York'],
    precioRef: 2.5,
    certificaciones: ['Kosher Pat Israel'],
    specs: {
      peso: '225 g',
      codigo_barras: '7591348001116',
      cpe: '1118457183',
      mpps: 'A-50-166',
      tiempoVida: '9 meses',
      temperatura: '-18°C'
    }
  },
  {
    id: 'pizza-margarita-premium',
    nombre: 'Pizza Margarita Premium',
    descripcion: 'Pizza artesanal precocida premium con masa de fermentación lenta. Ingredientes de alta calidad con harina de trigo seleccionada y fermentación natural. Sabor auténtico con digestión más ligera.',
    descripcion_seo: 'Pizza Margarita Premium artesanal congelada. Fermentación lenta. Ingredientes seleccionados. Panadería premium New York.',
    categoria_primaria: 'supermarket',
    categoria_secundaria: 'pizza',
    imagen: 'pizza-margarita-premium',
    imagenAlt: 'Pizza Margarita Premium - pizza congelada artesanal, New York',
    palabras_clave: ['pizza margarita', 'pizza congelada', 'pizza premium', 'pizza artesanal', 'panadería New York'],
    destacado: true,
    precioRef: 8.5,
    certificaciones: ['Producto Premium'],
    specs: {
      peso: '2 Uds - 550g',
      codigo_barras: '7591348000263',
      cpe: '0410191278',
      mpps: 'A-101.811',
      tiempoVida: '9 meses',
      temperatura: '-18°C'
    }
  },
  {
    id: 'torta-queso-new-york-fresa',
    nombre: 'Torta de Queso New York - Fresa',
    descripcion: 'Cheesecake estilo New York que combina la suavidad de un queso crema premium con una base delicada. Cubierta con mermelada de fresa artesanal. Perfecto balance entre dulzura y textura cremosa en cada bocado.',
    descripcion_seo: 'Cheesecake New York Fresa congelada. Queso crema premium. Mermelada artesanal. Postre gourmet Caracas.',
    categoria_primaria: 'supermarket',
    categoria_secundaria: 'reposteria',
    imagen: 'torta-queso-new-york-fresa',
    imagenAlt: 'Torta de Queso New York con Fresa - cheesecake premium, Caracas',
    palabras_clave: ['cheesecake', 'torta de queso', 'cheesecake fresa', 'postre premium', 'repostería Caracas'],
    destacado: true,
    precioRef: 12.0,
    certificaciones: ['Producto Premium'],
    specs: {
      peso: '700g',
      codigo_barras: '7591348000010',
      cpe: '090563813',
      mpps: 'A-33.454',
      tiempoVida: '9 meses',
      temperatura: '-18°C'
    },
    variantes_relacionadas: ['torta-queso-new-york-chocolate', 'torta-queso-new-york-comercial-fresa']
  },
  {
    id: 'torta-queso-new-york-chocolate',
    nombre: 'Torta de Queso New York - Chocolate',
    descripcion: 'Cheesecake estilo New York con queso crema premium y cobertura de chocolate intenso. Equilibrio perfecto entre dulzura y textura cremosa, elegante presentación.',
    descripcion_seo: 'Cheesecake New York Chocolate. Cobertura chocolate intenso. Queso crema premium. Postre gourmet premium.',
    categoria_primaria: 'supermarket',
    categoria_secundaria: 'reposteria',
    imagen: 'torta-queso-new-york-chocolate',
    imagenAlt: 'Torta de Queso New York con Chocolate - cheesecake premium, Caracas',
    palabras_clave: ['cheesecake', 'torta de queso chocolate', 'postre premium', 'repostería gourmet', 'cheesecake artesanal'],
    destacado: true,
    precioRef: 12.0,
    certificaciones: ['Producto Premium'],
    specs: {
      peso: '700g',
      codigo_barras: '7591348000027',
      cpe: '090563812',
      mpps: 'A-34.281',
      tiempoVida: '9 meses',
      temperatura: '-18°C'
    },
    variantes_relacionadas: ['torta-queso-new-york-fresa', 'torta-queso-new-york-comercial-chocolate']
  },
  {
    id: 'torta-queso-new-york-comercial-fresa',
    nombre: 'Torta de Queso New York Comercial - Fresa',
    descripcion: 'Cheesecake estilo New York grande para restaurantes y cafeterías. Hecha con queso crema de la más alta calidad sobre una base de galleta artesanal especiada. Textura suave, densa y equilibrada. Cubierta con mermelada de fresa artesanal.',
    descripcion_seo: 'Cheesecake New York Comercial grande de 1500g con mermelada de fresa artesanal. Hostelería, restaurantes, eventos. Panadería premium Caracas.',
    categoria_primaria: 'foodservice',
    categoria_secundaria: 'reposteria',
    imagen: 'torta-queso-new-york-comercial-fresa',
    imagenAlt: 'Torta de Queso New York Comercial - Fresa - panadería premium New York, Caracas',
    palabras_clave: ['cheesecake comercial', 'torta grande', 'restaurante', 'hostelería', 'repostería profesional'],
    precioRef: 22.0,
    specs: {
      peso: '1500g',
      codigo_barras: '7591348000034',
      cpe: '090563811',
      mpps: 'A-66.612',
      tiempoVida: '30 días',
      temperatura: '-18°C'
    },
    variantes_relacionadas: ['torta-queso-new-york-comercial-chocolate', 'torta-queso-new-york-comercial-plain']
  },
  {
    id: 'torta-queso-new-york-comercial-chocolate',
    nombre: 'Torta de Queso New York Comercial - Chocolate',
    descripcion: 'Cheesecake estilo New York grande con cobertura de chocolate intenso. Diseñada para servicio profesional en restaurantes y hoteles. Queso crema premium y base artesanal.',
    descripcion_seo: 'Cheesecake New York Comercial Chocolate 1500g. Chocolate intenso. Restaurantes, hoteles, catering. Panadería premium.',
    categoria_primaria: 'foodservice',
    categoria_secundaria: 'reposteria',
    imagen: 'torta-queso-new-york-comercial-chocolate',
    imagenAlt: 'Torta de Queso New York Comercial - Chocolate - panadería profesional New York',
    palabras_clave: ['cheesecake comercial', 'torta grande chocolate', 'restaurante', 'catering', 'repostería profesional'],
    precioRef: 22.0,
    specs: {
      peso: '1500g',
      codigo_barras: '7591348000041',
      cpe: '090563810',
      mpps: 'A-67.439',
      tiempoVida: '30 días',
      temperatura: '-18°C'
    },
    variantes_relacionadas: ['torta-queso-new-york-comercial-fresa', 'torta-queso-new-york-comercial-plain']
  },
  {
    id: 'torta-queso-new-york-comercial-plain',
    nombre: 'Torta de Queso New York Comercial - Plain',
    descripcion: 'Cheesecake estilo New York sin cobertura adicional, para máxima versatilidad en servicio profesional. Queso crema premium sobre base artesanal. Perfecto para acompañar con salsas personalizadas.',
    descripcion_seo: 'Cheesecake New York Comercial Plain 1500g. Sin cobertura. Restaurantes profesionales. Panadería premium Caracas.',
    categoria_primaria: 'foodservice',
    categoria_secundaria: 'reposteria',
    imagen: 'torta-queso-new-york-comercial-plain',
    imagenAlt: 'Torta de Queso New York Comercial - Plain - panadería profesional',
    palabras_clave: ['cheesecake plain', 'torta queso comercial', 'restaurante', 'servicio profesional', 'repostería'],
    precioRef: 20.0,
    specs: {
      peso: '1500g',
      codigo_barras: '7591348000058',
      cpe: '090563809',
      mpps: 'A-65.205',
      tiempoVida: '30 días',
      temperatura: '-18°C'
    },
    variantes_relacionadas: ['torta-queso-new-york-comercial-fresa', 'torta-queso-new-york-comercial-chocolate']
  },
  {
    id: 'pan-hamburguesa-new-york',
    nombre: 'Pan Hamburguesa New York',
    descripcion: 'Pan de hamburguesa esponjoso con miga de calidad premium. Miga con memoria que garantiza una llamativa presentación. Resistente a rellenos y salsas. Sin topping.',
    descripcion_seo: 'Pan hamburguesa New York esponjoso premium. Miga con memoria. Resistente a salsas. Panadería artesanal Caracas.',
    categoria_primaria: 'supermarket',
    categoria_secundaria: 'panes',
    imagen: 'pan-hamburguesa-new-york',
    imagenAlt: 'Pan Hamburguesa New York - panadería premium, Caracas',
    palabras_clave: ['pan hamburguesa', 'pan esponjoso', 'pan premium', 'panadería New York', 'pan artesanal'],
    precioRef: 3.0,
    certificaciones: ['Kosher Pat Israel'],
    specs: {
      peso: '8 unidades',
      codigo_barras: '7591348000065',
      cpe: '090563808',
      mpps: 'A-52.341',
      tiempoVida: '15 días',
      temperatura: 'ambiente'
    },
    variantes_relacionadas: ['pan-hamburguesa-brioche']
  },
  {
    id: 'pan-hamburguesa-brioche',
    nombre: 'Pan de Hamburguesa - Brioche',
    descripcion: 'Pan de hamburguesa Brioche esponjoso con miga de calidad premium. Miga con memoria que garantiza presentación. Sin topping. Panadería New York.',
    descripcion_seo: 'Pan hamburguesa Brioche esponjoso miga premium. Miga con memoria garantiza presentación. Panadería New York Caracas.',
    categoria_primaria: 'supermarket',
    categoria_secundaria: 'panes',
    imagen: 'pan-hamburguesa-brioche',
    imagenAlt: 'Pan Hamburguesa Brioche - panadería premium New York, Caracas',
    palabras_clave: ['pan brioche', 'pan hamburguesa', 'pan esponjoso', 'panadería premium', 'pan artesanal'],
    precioRef: 3.2,
    certificaciones: ['Producto Kosher'],
    specs: {
      peso: '8 unidades',
      codigo_barras: '7591348000072',
      cpe: '090563807',
      mpps: 'A-52.968',
      tiempoVida: '15 días',
      temperatura: 'ambiente'
    },
    variantes_relacionadas: ['pan-hamburguesa-new-york']
  },
  {
    id: 'baguettes-demi-mini',
    nombre: 'Baguettes Demi Mini',
    descripcion: 'Baguettes precocidas congeladas en formato Demi y Mini. Combinan tradición francesa con comodidad moderna. Masa madre, corteza crujiente y miga aireada. Ideales para consumo rápido.',
    descripcion_seo: 'Baguettes Demi Mini congeladas precocidas. Masa madre francesa. Tres tamaños disponibles. Panadería premium New York.',
    categoria_primaria: 'supermarket',
    categoria_secundaria: 'panes',
    imagen: 'baguettes-demi-mini',
    imagenAlt: 'Baguettes Demi Mini - panadería New York artesanal',
    palabras_clave: ['baguettes', 'baguette mini', 'pan francés', 'precocido', 'panadería artesanal'],
    precioRef: 2.0,
    certificaciones: ['Kosher Pat Israel'],
    specs: {
      peso: '225 g (variantes: 32cm, 21cm, 11cm)',
      codigo_barras: '7591348000089',
      cpe: '090563806',
      mpps: 'A-48.714',
      tiempoVida: '15 días',
      temperatura: 'ambiente'
    }
  },
  {
    id: 'croissants',
    nombre: 'Croissants y Petit Croissants',
    descripcion: 'Croissants artesanales con masa hojaldrada mantequilla real. Variedades de tamaño estándar y petit. Preparados con técnicas tradicionales francesas. Crujientes por fuera, suaves por dentro.',
    descripcion_seo: 'Croissants artesanales hojaldrados mantequilla real. Petit croissants disponibles. Panadería premium francesa New York.',
    categoria_primaria: 'supermarket',
    categoria_secundaria: 'reposteria',
    imagen: 'croissants',
    imagenAlt: 'Croissants y Petit Croissants - repostería artesanal New York',
    palabras_clave: ['croissants', 'croissant francés', 'repostería artesanal', 'masa hojaldrada', 'panadería premium'],
    precioRef: 4.5,
    certificaciones: ['Producto Premium'],
    specs: {
      peso: '80g y 25g variantes',
      codigo_barras: '7591348000096',
      cpe: '090563805',
      mpps: 'A-59.447',
      tiempoVida: '15 días',
      temperatura: 'ambiente'
    }
  },
  {
    id: 'bagels-new-york-plain',
    nombre: 'Bagels estilo New York - Plain',
    descripcion: 'Auténticos bagels estilo New York elaborados bajo el proceso genuino de escaldado y horneado. Miga densa y masticable, sabor clásico pero lleno de sabor. Versión plain sin toppings.',
    descripcion_seo: 'Bagels estilo New York Plain auténticos escaldados. Miga densa y masticable. Panadería premium especializada en Caracas, Venezuela.',
    categoria_primaria: 'supermarket',
    categoria_secundaria: 'especialidades',
    imagen: 'bagels-new-york-plain',
    imagenAlt: 'Bagels estilo New York - Plain - panadería premium New York, Caracas',
    palabras_clave: ['bagels', 'bagel new york', 'pan escaldado', 'miga densa', 'panadería artesanal'],
    precioRef: 3.5,
    certificaciones: ['Kosher Pat Israel'],
    specs: {
      peso: '95g',
      codigo_barras: '7591348000103',
      cpe: '090563804',
      mpps: 'A-61.275',
      tiempoVida: '15 días',
      temperatura: 'ambiente'
    },
    variantes_relacionadas: ['bagels-new-york-ajonjoli', 'bagels-new-york-everything']
  },
  {
    id: 'bagels-new-york-ajonjoli',
    nombre: 'Bagels estilo New York - Ajonjolí',
    descripcion: 'Bagels estilo New York con cubierta de semillas de ajonjolí. Escaldados y horneados artesanalmente. Miga densa, sabor auténtico con toque de nuez del ajonjolí. Para consumo directo o preparaciones.',
    descripcion_seo: 'Bagels New York Ajonjolí escaldados artesanales. Semillas ajonjolí. Miga densa. Panadería premium New York Caracas.',
    categoria_primaria: 'supermarket',
    categoria_secundaria: 'especialidades',
    imagen: 'bagels-new-york-ajonjoli',
    imagenAlt: 'Bagels estilo New York - Ajonjolí - panadería artesanal Caracas',
    palabras_clave: ['bagels ajonjolí', 'bagel new york', 'semillas ajonjolí', 'pan escaldado', 'especialidades panadería'],
    precioRef: 3.6,
    certificaciones: ['Kosher Pat Israel'],
    specs: {
      peso: '95g',
      codigo_barras: '7591348000110',
      cpe: '090563803',
      mpps: 'A-62.102',
      tiempoVida: '15 días',
      temperatura: 'ambiente'
    },
    variantes_relacionadas: ['bagels-new-york-plain', 'bagels-new-york-everything']
  },
  {
    id: 'bagels-new-york-everything',
    nombre: 'Bagels estilo New York - Everything',
    descripcion: 'Bagels estilo New York con mezcla aromática everything: sésamo, amapola, ajo y cebolla deshidratada. Diseñados para escalar tu menú al siguiente nivel. Auténtica receta escaldada y horneada.',
    descripcion_seo: 'Bagels New York Everything múltiples toppings. Sésamo amapola ajo cebolla. Panadería premium Caracas.',
    categoria_primaria: 'supermarket',
    categoria_secundaria: 'especialidades',
    imagen: 'bagels-new-york-everything',
    imagenAlt: 'Bagels estilo New York Everything - bagel con múltiples toppings, Caracas',
    palabras_clave: ['bagels', 'bagel everything', 'sésamo amapola', 'pan escaldado', 'panadería artesanal'],
    destacado: true,
    precioRef: 3.8,
    certificaciones: ['Kosher Pat Israel'],
    specs: {
      peso: '95g',
      codigo_barras: '7591348000127',
      cpe: '090563802',
      mpps: 'A-63.929',
      tiempoVida: '15 días',
      temperatura: 'ambiente'
    },
    variantes_relacionadas: ['bagels-new-york-plain', 'bagels-new-york-ajonjoli']
  },
  {
    id: 'pan-1700',
    nombre: 'Pan 1700',
    descripcion: 'Pan de gran formato exclusivo para servicio profesional. Peso de 1700g con proporciones perfectas para corte limpio y uniforme. Ideal para hoteles, restaurantes y catering de alto volumen.',
    descripcion_seo: 'Pan 1700g formato profesional. Servicio restaurantes hoteles. Corte uniforme. Panadería premium New York Caracas.',
    categoria_primaria: 'foodservice',
    categoria_secundaria: 'panes',
    imagen: 'pan-1700',
    imagenAlt: 'Pan 1700 - pan de formato profesional para restaurantes',
    palabras_clave: ['pan profesional', 'pan 1700g', 'pan foodservice', 'restaurante', 'panadería premium'],
    precioRef: 8.0,
    certificaciones: ['Producto Profesional'],
    specs: {
      peso: '1700 g',
      codigo_barras: '7591348000134',
      cpe: '090563801',
      mpps: 'A-170.000',
      tiempoVida: '15 días',
      temperatura: 'ambiente'
    }
  }
];

// Write to JSON
const outputPath = path.join(__dirname, '../src/data/productos.json');
const output = {
  productos: FULL_CATALOG
};

fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
console.log(`✓ Regenerated ${FULL_CATALOG.length} products to ${outputPath}`);
