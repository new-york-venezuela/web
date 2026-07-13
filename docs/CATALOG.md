# Gestión del Catálogo

## Cómo Agregar o Editar Productos

Los productos están en `src/data/productos.json`. No necesitas escribir código TypeScript.

### Estructura de un Producto

```json
{
  "id": "pan-sandwich-integral-4g",
  "nombre": "Pan de Sandwich Integral de 4 granos",
  "descripcion": "Pan integral nutritivo con mezcla equilibrada de cuatro granos.",
  "detalle": "Presentación: 500g",
  "precioRef": 3.5,
  "categoria": "supermarket-panes",
  "destacado": true,
  "imagen": "pan-sandwich-integral-4g.jpg",
  "imagenAlt": "Pan de Sandwich Integral de 4 granos"
}
```

### Campos Obligatorios

- `id`: Identificador único (formato: snake-case, sin espacios)
- `nombre`: Nombre del producto (en español)
- `descripcion`: Párrafo descriptivo (50-150 caracteres)
- `detalle`: Presentación/formato (ej: "600g", "2 unidades")
- `precioRef`: Precio en USD (número decimal)
- `categoria`: Una de las siguientes:
  - `supermarket-panes`
  - `supermarket-reposteria`
  - `supermarket-pizza`
  - `foodservice-panes`
  - `foodservice-especialidades`

### Campos Opcionales

- `destacado`: `true` para mostrar en la sección "Favoritos" (default: `false`)
- `imagen`: Nombre del archivo en `public/productos/` (ej: `pan-integral-4g.jpg`)
- `imagenAlt`: Texto alternativo para la imagen (para accesibilidad)
- `porciones`: Información de porciones (si aplica)

### Cómo Agregar un Producto Nuevo

1. Abre `src/data/productos.json`
2. Busca la sección correcta (`supermercados` o `foodservice`)
3. Copia un producto existente y cambia los valores
4. Asegúrate de que:
   - El `id` sea único y en snake-case
   - La `categoria` esté correctamente seleccionada
   - Todos los campos obligatorios estén presentes
5. Sube una imagen a `public/productos/` con el mismo nombre que en el campo `imagen`
6. Commit y push

**Ejemplo: Agregar un pan nuevo a supermercados**

```json
{
  "id": "pan-integral-con-linaza",
  "nombre": "Pan Integral con Linaza",
  "descripcion": "Pan integral nutritivo enriquecido con semillas de linaza.",
  "detalle": "Presentación: 500g",
  "precioRef": 4.0,
  "categoria": "supermarket-panes",
  "imagen": "pan-integral-linaza.jpg",
  "imagenAlt": "Pan Integral con Linaza"
}
```

Luego sube la foto a `public/productos/pan-integral-linaza.jpg`.

### Cómo Editar un Producto Existente

1. Abre `src/data/productos.json`
2. Encuentra el producto por `id`
3. Edita los campos que necesites (nombre, descripción, precio, etc.)
4. Si cambias la imagen, reemplaza el archivo en `public/productos/`
5. Commit y push

### Validación Automática

El sitio valida automáticamente que:
- Todos los campos obligatorios estén presentes
- Las categorías sean válidas
- Los IDs sean únicos
- Las imágenes existan en `public/productos/`

Si hay error, el build fallará con un mensaje descriptivo.

### Estructura de Carpetas para Imágenes

```
public/
└── productos/
    ├── pan-sandwich-integral-4g.jpg
    ├── cheese-cake-chocolate.jpg
    ├── fs-bagel-classic-plain.jpg
    └── ...
```

Los nombres de archivo deben coincidir exactamente con el campo `imagen` en el JSON.

### Dónde Se Muestran los Productos

- **Destacados** (`destacado: true`): Página de inicio, sección "Los favoritos de la casa"
- **Supermercados**: Página `/catalogo/`, sección "Para Supermercados"
- **Foodservice**: Página `/catalogo/`, sección "Para Foodservice (Restaurantes, Hoteles, Catering)"

### Categorías Explicadas

**Supermercados:**
- `supermarket-panes`: Panes para retail
- `supermarket-reposteria`: Postres, magdalenas, cheesecakes
- `supermarket-pizza`: Pizzas congeladas

**Foodservice (profesional):**
- `foodservice-panes`: Panes especializados para cocinas
- `foodservice-especialidades`: Bagels, croissants, pizzas artesanales, cheesecakes grandes

### Precios

El campo `precioRef` es de referencia interna. Los precios NO se muestran en la web (cada cliente tiene precios personalizados según volumen y tipo de negocio).

### Soporte

Si encuentras error de validación al hacer build, el mensaje indicará exactamente qué está mal. Revisa:
1. Que el JSON esté bien formado (sin comas faltantes)
2. Que la categoría sea válida
3. Que la imagen exista en `public/productos/`
