import productosData from '../data/productos.json';

export interface Producto {
  id: string;
  nombre: string;
  descripcion: string;
  detalle: string;
  precioRef: number;
  categoria: 'supermarket-panes' | 'supermarket-reposteria' | 'supermarket-pizza' | 'foodservice-panes' | 'foodservice-especialidades';
  destacado?: boolean;
  imagen?: string;
  imagenAlt?: string;
  porciones?: string;
}

const VALID_CATEGORIES = [
  'supermarket-panes',
  'supermarket-reposteria',
  'supermarket-pizza',
  'foodservice-panes',
  'foodservice-especialidades',
];

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
  if (!producto.detalle || typeof producto.detalle !== 'string') {
    throw new Error(`Producto ${producto.id}: detalle es requerido`);
  }
  if (typeof producto.precioRef !== 'number') {
    throw new Error(`Producto ${producto.id}: precioRef debe ser número`);
  }
  if (!producto.categoria || !VALID_CATEGORIES.includes(producto.categoria)) {
    throw new Error(`Producto ${producto.id}: categoría inválida "${producto.categoria}". Válidas: ${VALID_CATEGORIES.join(', ')}`);
  }
  if (producto.destacado !== undefined && typeof producto.destacado !== 'boolean') {
    throw new Error(`Producto ${producto.id}: destacado debe ser booleano`);
  }
  if (producto.imagen && typeof producto.imagen !== 'string') {
    throw new Error(`Producto ${producto.id}: imagen debe ser string`);
  }
  if (producto.imagenAlt && typeof producto.imagenAlt !== 'string') {
    throw new Error(`Producto ${producto.id}: imagenAlt debe ser string`);
  }
  return true;
}

export function loadProductos(): Producto[] {
  const supermercados = (productosData.supermercados || []).map((p: any) => {
    validateProducto(p);
    return p as Producto;
  });

  const foodservice = (productosData.foodservice || []).map((p: any) => {
    validateProducto(p);
    return p as Producto;
  });

  return [...supermercados, ...foodservice];
}

export const productos = loadProductos();
export const productosSupermercados = (productosData.supermercados || []) as Producto[];
export const productosFoodservice = (productosData.foodservice || []) as Producto[];

export const formatPrecio = (precio: number): string => `$${precio} Ref`;
