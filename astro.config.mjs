// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  // Sitio 100 % estático: HTML pre-renderizado en build, sin servidor.
  output: 'static',

  // URL canónica de producción (parametrizable vía variable de entorno en CI).
  site: process.env.SITE_URL ?? 'https://example.com',

  // Español como idioma único y por defecto de esta iteración.
  i18n: {
    defaultLocale: 'es',
    locales: ['es'],
  },

  build: {
    // URLs limpias sin extensión: /catalogo en lugar de /catalogo.html
    format: 'directory',
  },

  image: {
    // Imágenes responsivas por defecto (estable desde Astro 5.10):
    // cada <Image> genera srcset/sizes automáticamente y se adapta
    // a su contenedor sin ampliarse más allá del tamaño solicitado.
    layout: 'constrained',
    // Inyecta los estilos base (max-width, aspect-ratio) para los layouts.
    responsiveStyles: true,
  },
});
