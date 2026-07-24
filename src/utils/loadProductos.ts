import productosData from '../data/productos.json';

export interface Producto {
  id: string;
  nombre: string;
  descripcion: string; // short, for cards
  descripcion_seo?: string; // 150-160 chars, keyword-rich
  categoria_primaria: 'supermarket' | 'foodservice';
  categoria_secundaria: 'panes' | 'reposteria' | 'especialidades' | 'pizza';
  imagen: string; // slug, no extension (e.g., "pan-4-granos")
  imagenAlt?: string;
  imagenes?: string[]; // multiple images for carousel (product + variants)
  palabras_clave?: string[]; // 5-7 Spanish keywords
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
  variantes_relacionadas?: string[]; // product IDs of siblings
  distribuida_en?: string[]; // where the product is distributed/sold
  proveedores?: string[]; // suppliers
  preguntas_frecuentes?: Array<{
    pregunta: string;
    respuesta: string;
  }>;
}

const VALID_CATEGORIAS_PRIMARIAS = ['supermarket', 'foodservice'];
const VALID_CATEGORIAS_SECUNDARIAS = ['panes', 'reposteria', 'especialidades', 'pizza'];

export function validateProducto(producto: any): producto is Producto {
  if (!producto.id || typeof producto.id !== 'string') {
    throw new Error(`Producto debe tener id (string): ${JSON.stringify(producto)}`);
  }
  if (!producto.nombre || typeof producto.nombre !== 'string') {
    throw new Error(`Producto ${producto.id}: nombre es requerido`);
  }
  if (!producto.descripcion || typeof producto.descripcion !== 'string') {
    throw new Error(`Producto ${producto.id}: descripcion es requerida`);
  }
  if (!producto.categoria_primaria || !VALID_CATEGORIAS_PRIMARIAS.includes(producto.categoria_primaria)) {
    throw new Error(`Producto ${producto.id}: categoria_primaria inválida "${producto.categoria_primaria}". Válidas: ${VALID_CATEGORIAS_PRIMARIAS.join(', ')}`);
  }
  if (!producto.categoria_secundaria || !VALID_CATEGORIAS_SECUNDARIAS.includes(producto.categoria_secundaria)) {
    throw new Error(`Producto ${producto.id}: categoria_secundaria inválida "${producto.categoria_secundaria}". Válidas: ${VALID_CATEGORIAS_SECUNDARIAS.join(', ')}`);
  }
  if (!producto.imagen || typeof producto.imagen !== 'string') {
    throw new Error(`Producto ${producto.id}: imagen es requerida y debe ser string (slug sin extensión)`);
  }
  if (producto.imagenAlt && typeof producto.imagenAlt !== 'string') {
    throw new Error(`Producto ${producto.id}: imagenAlt debe ser string`);
  }
  if (producto.descripcion_seo !== undefined) {
    if (typeof producto.descripcion_seo !== 'string') {
      throw new Error(`Producto ${producto.id}: descripcion_seo debe ser string`);
    }
    const seoLength = producto.descripcion_seo.length;
    if (seoLength < 100 || seoLength > 160) {
      throw new Error(`Producto ${producto.id}: descripcion_seo debe tener 100-160 caracteres (actual: ${seoLength})`);
    }
  }
  if (producto.palabras_clave !== undefined) {
    if (!Array.isArray(producto.palabras_clave)) {
      throw new Error(`Producto ${producto.id}: palabras_clave debe ser array`);
    }
    if (producto.palabras_clave.length < 3 || producto.palabras_clave.length > 10) {
      throw new Error(`Producto ${producto.id}: palabras_clave debe tener 3-10 keywords (actual: ${producto.palabras_clave.length})`);
    }
    if (!producto.palabras_clave.every((kw: any) => typeof kw === 'string')) {
      throw new Error(`Producto ${producto.id}: todos los elementos de palabras_clave deben ser strings`);
    }
  }
  if (producto.destacado !== undefined && typeof producto.destacado !== 'boolean') {
    throw new Error(`Producto ${producto.id}: destacado debe ser booleano`);
  }
  if (producto.precioRef !== undefined && typeof producto.precioRef !== 'number') {
    throw new Error(`Producto ${producto.id}: precioRef debe ser número`);
  }
  if (producto.certificaciones !== undefined) {
    if (!Array.isArray(producto.certificaciones)) {
      throw new Error(`Producto ${producto.id}: certificaciones debe ser array`);
    }
    if (!producto.certificaciones.every((cert: any) => typeof cert === 'string')) {
      throw new Error(`Producto ${producto.id}: todos los elementos de certificaciones deben ser strings`);
    }
  }
  if (producto.specs !== undefined) {
    if (typeof producto.specs !== 'object' || producto.specs === null) {
      throw new Error(`Producto ${producto.id}: specs debe ser un objeto`);
    }
    // All fields in specs are optional, so no further validation needed
  }
  if (producto.variantes_relacionadas !== undefined) {
    if (!Array.isArray(producto.variantes_relacionadas)) {
      throw new Error(`Producto ${producto.id}: variantes_relacionadas debe ser array`);
    }
    if (!producto.variantes_relacionadas.every((id: any) => typeof id === 'string')) {
      throw new Error(`Producto ${producto.id}: todos los elementos de variantes_relacionadas deben ser strings`);
    }
  }
  if (producto.imagenes !== undefined) {
    if (!Array.isArray(producto.imagenes)) {
      throw new Error(`Producto ${producto.id}: imagenes debe ser array`);
    }
    if (producto.imagenes.length < 1) {
      throw new Error(`Producto ${producto.id}: imagenes debe contener al menos 1 imagen`);
    }
    if (!producto.imagenes.every((img: any) => typeof img === 'string')) {
      throw new Error(`Producto ${producto.id}: todos los elementos de imagenes deben ser strings`);
    }
  }
  return true;
}

export function loadProductos(): Producto[] {
  const allProductos = (productosData.productos || []).map((p: any) => {
    validateProducto(p);
    return p as Producto;
  });

  return allProductos;
}

export const productos = loadProductos();
export const productosSupermercados = productos.filter(p => p.categoria_primaria === 'supermarket');
export const productosFoodservice = productos.filter(p => p.categoria_primaria === 'foodservice');

export const formatPrecio = (precio: number): string => `$${precio} Ref`;
