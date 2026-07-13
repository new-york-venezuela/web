/**
 * Catálogo de productos — re-exports from JSON loader.
 *
 * Previously: Static TypeScript data
 * Now: JSON-based data with validation (src/data/productos.json)
 * Loader: src/utils/loadProductos.ts
 *
 * Backward compatible - all imports from this file continue to work unchanged.
 */

export { productos, productosSupermercados, productosFoodservice, formatPrecio } from '../utils/loadProductos';
export type { Producto } from '../utils/loadProductos';
