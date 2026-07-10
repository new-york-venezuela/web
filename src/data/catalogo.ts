/**
 * Catálogo de productos — fuente única de verdad.
 *
 * Precios de referencia en USD ($ Ref), práctica habitual del mercado
 * caraqueño. Ajustar aquí para que catálogo y landing queden sincronizados.
 */

import type { ImageMetadata } from 'astro';

export interface Producto {
  id: string;
  nombre: string;
  descripcion: string;
  detalle: string;
  precioRef: number;
  porciones: string;
  categoria: 'clasico' | 'topping' | 'edicion';
  destacado?: boolean;
  /**
   * Foto del producto, importada desde `src/assets/productos/` (relación 4:3,
   * mínimo 1200×900 px). Sin foto, la tarjeta muestra el monograma.
   *
   *   import fotoClasico from '../assets/productos/ny-clasico-entero.jpg';
   *   // ...dentro del producto:
   *   imagen: fotoClasico,
   *   imagenAlt: 'New York Cheesecake entero sobre papel parchment',
   */
  imagen?: ImageMetadata;
  /** Texto alternativo en español. Obligatorio cuando hay `imagen`. */
  imagenAlt?: string;
}

export const productos: Producto[] = [
  {
    id: 'ny-clasico-entero',
    nombre: 'New York Clásico — Entero',
    descripcion:
      'La receta original de Manhattan: base de galleta mantequillosa y crema densa de queso premium, horneada lentamente a baño de María.',
    detalle: 'Molde de 24 cm · Empacado en papel parchment artesanal',
    precioRef: 45,
    porciones: '12–14 porciones',
    categoria: 'clasico',
    destacado: true,
  },
  {
    id: 'ny-clasico-medio',
    nombre: 'New York Clásico — Medio',
    descripcion:
      'El mismo horneado lento y textura sedosa del entero, en formato pensado para reuniones íntimas o la mesa del domingo.',
    detalle: 'Molde de 18 cm · Empacado en papel parchment artesanal',
    precioRef: 28,
    porciones: '6–8 porciones',
    categoria: 'clasico',
  },
  {
    id: 'ny-porcion',
    nombre: 'Porción individual',
    descripcion:
      'Un corte generoso del clásico, listo para acompañar el café de la tarde. Disponible para retiro el mismo día.',
    detalle: 'Porción de 160 g · Presentación individual en parchment',
    precioRef: 5,
    porciones: '1 porción',
    categoria: 'clasico',
  },
  {
    id: 'topping-parchita',
    nombre: 'Coulis de parchita',
    descripcion:
      'Nuestra insignia caraqueña: parchita criolla reducida a fuego lento, ácida y brillante sobre la crema neoyorquina.',
    detalle: 'Frasco de 250 ml · Fruta de temporada de productores locales',
    precioRef: 6,
    porciones: 'Cubre un cheesecake entero',
    categoria: 'topping',
    destacado: true,
  },
  {
    id: 'topping-frutos-rojos',
    nombre: 'Compota de frutos rojos',
    descripcion:
      'Fresas de Galipán, moras y arándanos en compota artesanal de cocción corta, sin conservantes.',
    detalle: 'Frasco de 250 ml · Cocción del día',
    precioRef: 7,
    porciones: 'Cubre un cheesecake entero',
    categoria: 'topping',
  },
  {
    id: 'topping-mango',
    nombre: 'Compota de mango de bocado',
    descripcion:
      'Mango venezolano en su punto exacto, apenas tocado con lima. Dulzor tropical que respeta la elegancia del clásico.',
    detalle: 'Frasco de 250 ml · Disponible en temporada',
    precioRef: 6,
    porciones: 'Cubre un cheesecake entero',
    categoria: 'topping',
  },
  {
    id: 'edicion-guayaba-queso',
    nombre: 'Edición Ávila: guayaba y queso crema',
    descripcion:
      'Homenaje al dulce criollo: veta de guayaba artesanal dentro de la crema, sobre base de galleta especiada.',
    detalle: 'Molde de 18 cm · Producción limitada semanal',
    precioRef: 32,
    porciones: '6–8 porciones',
    categoria: 'edicion',
  },
  {
    id: 'edicion-cacao',
    nombre: 'Edición Chuao: cacao venezolano',
    descripcion:
      'Crema de queso marmoleada con cacao de Chuao 70 %. Intensidad justa, final limpio, cero empalago.',
    detalle: 'Molde de 18 cm · Cacao de origen certificado',
    precioRef: 34,
    porciones: '6–8 porciones',
    categoria: 'edicion',
  },
];

export const formatPrecio = (precio: number): string => `$${precio} Ref`;
