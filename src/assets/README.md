# Imágenes originales

Carpeta de originales procesados por el build (`astro:assets` + sharp).
Aquí va **una sola versión en alta resolución** por imagen; el build genera
automáticamente los tamaños y formatos (webp/avif) para cada dispositivo.

Reglas rápidas (detalle completo en `INSTRUCTIONS.md` §7 y `AGENTS.md`):

- Formato de origen: JPEG (fotos) o PNG (gráficos). Nunca subir webp/avif.
- Ancho mínimo 1600 px; tarjetas de producto en 4:3 (mínimo 1200×900).
- Nombres en kebab-case y español: `ny-clasico-entero.jpg`.
- `productos/` → fotos referenciadas desde `src/data/catalogo.ts`.
- `public/` queda reservado para favicon y og-images; el contenido va aquí.
