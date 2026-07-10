# Guía de puesta en marcha y parametrización

Guía paso a paso para inicializar el proyecto, generar los assets
estáticos y adaptar el sitio a otro cliente o empresa.

---

## 1. Requisitos

| Herramienta | Versión | Notas |
| --- | --- | --- |
| Node.js | La indicada en `.nvmrc` (22.x) | `nvm use` la selecciona automáticamente |
| Bun | 1.x | Gestor de paquetes y ejecutor de scripts único del proyecto |

```bash
# Instalar/activar la versión correcta de Node
nvm install && nvm use

# Verificar Bun
bun --version
```

## 2. Inicialización

```bash
git clone <url-del-repositorio>
cd <directorio>
bun install
```

`bun install` respeta el lockfile de Bun del repositorio: instalaciones
reproducibles, sin `npm` ni `yarn`.

## 3. Variables de entorno

```bash
cp .env.example .env
```

Editar `.env` (ignorado por git — **nunca** subir este archivo):

| Variable | Obligatoria | Descripción |
| --- | --- | --- |
| `PUBLIC_POSTHOG_KEY` | No | Clave del proyecto PostHog. Sin ella, la analítica queda desactivada. |
| `PUBLIC_POSTHOG_HOST` | No | Host de ingesta (por defecto `https://us.i.posthog.com`; usar `https://eu.i.posthog.com` para datos en la UE). |
| `PUBLIC_GOOGLE_FORM_ID` | No* | ID público del Google Form de la landing. |
| `PUBLIC_GFORM_ENTRY_NOMBRE` | No* | ID de campo `entry.XXXXXXXX` para el nombre. |
| `PUBLIC_GFORM_ENTRY_TELEFONO` | No* | ID de campo para el teléfono. |
| `PUBLIC_GFORM_ENTRY_PRODUCTO` | No* | ID de campo para el producto. |
| `PUBLIC_GFORM_ENTRY_MENSAJE` | No* | ID de campo para el mensaje. |
| `PUBLIC_WHATSAPP_NUMBER` | No | Número en formato internacional sin `+` (p. ej. `584120000000`). |
| `PUBLIC_CONTACT_EMAIL` | No | Correo mostrado en la página de contacto. |
| `SITE_URL` | Recomendada en CI | URL canónica de producción para SEO. |

\* Sin las variables de Google Forms el sitio compila y funciona; el
formulario de la landing muestra un aviso de "formulario no activo" en
lugar de enviar.

> Las variables `PUBLIC_*` se **incrustan en el HTML/JS del build**. Solo
> colocar ahí valores aptos para ser públicos (claves de PostHog de tipo
> proyecto e IDs públicos de formularios lo son). Cualquier secreto real
> (API de Sheets, tokens privados) no debe existir en este proyecto.

### 3.1 Obtener los IDs del Google Form

1. Crear un Google Form con campos: nombre, teléfono, producto y mensaje.
2. En **Respuestas → Vincular a Sheets**, conectar la hoja de cálculo
   donde se volcarán las reservas.
3. Abrir la vista previa del formulario, inspeccionar el HTML y copiar:
   - El ID largo de la URL: `docs.google.com/forms/d/e/<ESTE_ID>/viewform`.
   - Los atributos `entry.XXXXXXXX` de cada campo (visibles en los `name`
     de los inputs o usando "Obtener enlace de respuestas pre-rellenadas").
4. Pegar esos valores en `.env`.

Con esto, las respuestas llegan a la Sheet sin exponer ninguna credencial:
el endpoint `formResponse` es público por diseño.

## 4. Desarrollo local

```bash
bun run dev        # http://localhost:4321
bun run check      # verificación de tipos
```

## 5. Build de producción

```bash
bun run build      # genera dist/
bun run preview    # sirve dist/ localmente para inspección
```

`dist/` es autosuficiente: se despliega en cualquier hosting estático
(Netlify, Vercel, Cloudflare Pages, S3+CloudFront, nginx). En CI, definir
las variables de entorno del paso 3 antes de ejecutar el build.

## 6. Adaptar el sitio a otro cliente

1. **Marca y textos**: nombre y navegación en
   `src/components/Header.astro` y `Footer.astro`; contenido editorial en
   cada archivo de `src/pages/`.
2. **Catálogo y precios**: editar únicamente `src/data/catalogo.ts`
   (productos, descripciones, precios `$ Ref`, formato de moneda en
   `formatPrecio`). Portada, catálogo y landing se actualizan solos.
3. **Paleta y tipografía**: tokens CSS en `src/styles/global.css`
   (`--color-*`, `--font-*`, escala de espaciado) y el `<link>` de Google
   Fonts en `src/layouts/BaseLayout.astro`.
4. **Datos de contacto**: dirección y horarios en
   `src/pages/contacto.astro`; correo y WhatsApp vía variables de entorno.
5. **Landing de campaña**: oferta, precios y campos en
   `src/pages/landing/promocion.astro`; apuntar a un nuevo Google Form
   cambiando solo las variables de entorno.
6. **SEO**: `SITE_URL` en el entorno de CI y las descripciones `<meta>` en
   cada página.

## 7. Imágenes

El proyecto usa el pipeline nativo de Astro (`astro:assets`): se entrega
**una sola imagen original en alta resolución** y el build genera
automáticamente todos los tamaños, el `srcset` y los formatos modernos
(webp/avif) que cada dispositivo necesita. No hay que exportar múltiples
versiones ni comprimir a mano.

### 7.1 Dónde va cada archivo

| Carpeta | Contenido |
| --- | --- |
| `src/assets/productos/` | Fotos de producto (referenciadas desde `src/data/catalogo.ts`) |
| `src/assets/` | Resto de imágenes de contenido (hero, editorial…) |
| `public/` | **Solo** favicon y og-images (se sirven sin procesar) |

### 7.2 Resolución de entrega por ubicación

| Ubicación | Relación | Tamaño mínimo del original |
| --- | --- | --- |
| Tarjeta de producto | 4:3 | 1200 × 900 px |
| Hero / portada (futuro) | libre | 1920 px de ancho |
| Imagen editorial | libre | 1600 px de ancho |

- Formato de entrega: **JPEG** para fotos, **PNG** para gráficos planos.
  Nunca entregar webp/avif: el build los genera con mejor control de calidad.
- Nombres en kebab-case y en español: `ny-clasico-entero.jpg`,
  `coulis-parchita.jpg`.
- Peso razonable del original (< 4 MB); el build optimiza el resto.

### 7.3 Conectar una foto de producto

1. Copiar el archivo a `src/assets/productos/`.
2. En `src/data/catalogo.ts`, importar la imagen y asignarla al producto:

   ```ts
   import fotoClasico from '../assets/productos/ny-clasico-entero.jpg';

   // ...dentro del producto correspondiente:
   imagen: fotoClasico,
   imagenAlt: 'New York Cheesecake entero sobre papel parchment',
   ```

3. `imagenAlt` (texto alternativo en español) es obligatorio junto a
   `imagen`. Sin foto, la tarjeta muestra el monograma — no hace falta
   ningún placeholder.
4. `bun run build` y revisar la página con `bun run preview`.

## 8. Lista de verificación antes de publicar

- [ ] `bun run check` sin errores.
- [ ] `bun run build` exitoso y `bun run preview` revisado página a página.
- [ ] Revisión responsive en 320, 375, 768 y 1280 px: sin scroll horizontal
      y con imágenes nítidas en pantallas de alta densidad.
- [ ] Toda imagen nueva vive en `src/assets/` (no en `public/`) y tiene
      `alt` en español.
- [ ] `.env` **no** aparece en `git status`.
- [ ] Envío de prueba del formulario de la landing llega a la Google Sheet.
- [ ] Si se activó PostHog, los pageviews aparecen en el panel del proyecto.
