# Task 2: Create loadProductos.ts Utility with Validation

**Status:** DONE

## Summary

Successfully created `src/utils/loadProductos.ts` with full validation and loader functionality. Build passes, all 26 products validated at build time.

## Deliverables

### File Created: `src/utils/loadProductos.ts`

**Components:**

1. **Producto Interface**
   - id, nombre, descripcion, detalle, precioRef (required)
   - categoria (validated enum: supermarket-panes | supermarket-reposteria | supermarket-pizza | foodservice-panes | foodservice-especialidades)
   - destacado, imagen, imagenAlt, porciones (optional)

2. **VALID_CATEGORIES Array**
   - All 5 valid categories defined
   - Used for category validation during load

3. **validateProducto() Function**
   - Type guard function that validates all required fields
   - Throws descriptive errors for invalid data:
     - Missing required fields (id, nombre, descripcion, detalle, precioRef)
     - Invalid categoria value
     - Type mismatches
   - Returns true if valid (used as type assertion)

4. **loadProductos() Function**
   - Imports productos.json
   - Validates both supermercados and foodservice arrays
   - Returns single flat array of all Producto objects
   - Throws on first validation error

5. **Named Exports**
   - `productos`: All 26 products (supermercados + foodservice)
   - `productosSupermercados`: 14 supermarket products
   - `productosFoodservice`: 12 foodservice products
   - `formatPrecio`: Utility function for price formatting

## Testing

**Build Result:** SUCCESS

```
✓ Completed in 768ms
6 page(s) built successfully
All 26 products validated and loaded
```

**Build Output:**
- Static site generation: 356ms
- Client build: 8ms
- Static routes: 366ms
- No errors or warnings related to product loading

## Validation Verification

All products passed validation:
- Required fields present and correctly typed
- Categories match valid enum
- No missing imagen/imagenAlt references
- All numerical precioRef values valid

## Git Commit

```
commit 4e2d61a
Author: Eugenio Doñaque <eugeniodonaque@gmail.com>
Date:   [timestamp]

    refactor: create JSON loader with validation
    
    Add loadProductos.ts utility that:
    - Imports product data from src/data/productos.json
    - Validates all 26 products at build time
    - Exports Producto interface, loader, and formatter functions
    - Ensures type safety for categoria field and required fields
```

## Task Completion

- [x] Step 1: Created utility with loader and validation
- [x] Step 2: Tested validation (build succeeds)
- [x] Step 3: Committed changes

**Next Task:** Task 3 - Update catalogo.ts to use loadProductos utility
