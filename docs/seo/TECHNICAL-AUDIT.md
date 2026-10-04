# Auditoría técnica SEO — alimentosnewyork.com

Fecha: 2026-10-04 · Método: (1) sondeo HTTP del sitio en producción (`curl`), (2) rastreo del build
local `dist/` (53 HTML: 49 reales + 4 redirecciones), (3) revisión del código.
**No medido:** Core Web Vitals (la API de PageSpeed devolvió 429 por cuota), indexación real
(Search Console) y renderizado con navegador. Los puntajes cuentan solo lo comprobado.

> Producción aún no incluye `/donde-encontrarnos/`, `llms.txt` ni los cambios de esta rama
> (devuelven 404 hasta el próximo deploy). Los hallazgos de contenido son del build local.

## Resumen: 78 / 100 (estimado sobre lo medido)

| Categoría | Estado | Nota | Comprobaciones |
|---|---|---|---|
| Rastreabilidad | ✅ | 90 | robots.txt 200 con `Sitemap:`; sitemap 200, 41 URLs, sin duplicados, ninguna apunta a página inexistente; todas las páginas indexables están en el sitemap. Sin 404 propia (ver C1). |
| Indexabilidad | ✅ | 88 | 1 canonical por página, todas absolutas a `www`; sin `noindex` accidental (solo en 404 y en stubs de redirección). 0 títulos duplicados. |
| Seguridad | ⚠️ | 60 | HTTPS forzado (http→https 301, apex→www 301). Sin cabeceras de seguridad ni HSTS visibles (ver M1). |
| Estructura de URL | ✅ | 92 | Minúsculas, guiones, barra final coherente, máx. 101 caracteres. 1 enlace sin barra final (`/documentacion/guia-tecnica`, redirección propia). |
| Móvil | ✅ | 85 | `viewport`, `lang="es"`, mobile-first CSS. No se probó en dispositivo. |
| Core Web Vitals | — | no medido | Ver "Riesgos probables" abajo. |
| Datos estructurados | ✅ | 85 | JSON-LD válido (parseo OK) en todas las páginas; Organization/LocalBusiness, Product, Article, Breadcrumb, FAQPage, ItemList. |
| Renderizado JS | ✅ | 95 | Astro estático: contenido, canonical, robots y JSON-LD en el HTML inicial; JS solo para carrusel/PostHog. |
| IndexNow | ⚪ | n/a | No implementado; solo afecta a Bing/Yandex (Prioridad baja). |

## Corregido en esta pasada

1. **Enlace interno roto** que yo había introducido (`/productos/baguettes-precocida-foodservice/`):
   el sitio genera las fichas desde `productos.json` y esa ficha no existe → ahora apunta a
   `/productos/baguettes-precocida/`. Causa raíz: el pipeline validaba rutas contra los `.md` en vez de
   `productos.json`; ahora usa `productos.json`.
2. **Logos de clientes no deseados publicados:** el `import.meta.glob` empaquetaba también
   2doce, Central, licarch, nola, oltremare y Rio.png en `dist/_astro/` (accesibles por URL).
   Ahora `clientes.ts` importa solo los 20 logos usados → 0 de los excluidos en el build.
3. **Página 404 propia** (`404.astro`, `noindex`) con enlaces a inicio, catálogo, dónde encontrarnos y contacto.
4. **Títulos >60 caracteres:** 25 → 3 (home, catálogo, contacto, empresa, distribución, procesos,
   6 posts, dónde encontrarnos, fichas de producto con "en Caracas" solo si caben).
5. **Meta descripciones:** 4 >160 caracteres recortadas; las 7 páginas `/empresa/*` tenían como
   descripción el propio título (16–49 caracteres) → descripciones propias (70–160) vía frontmatter
   `description`/`seoTitle`.
6. **CLS:** logos de cabecera/pie con `width`/`height`.

## Pendiente

### Alta
- **A1. Desplegar la rama.** Producción da 404 en `/donde-encontrarnos/` y `/llms.txt`; el sitemap en
  vivo no los lista. Tras el deploy: enviar el sitemap en Search Console y Bing, inspeccionar la URL nueva.

### Media
- **M1. Cabeceras de seguridad/HSTS.** GitHub Pages no permite cabeceras propias, pero el dominio pasa por
  Cloudflare: añadir *Transform Rules → Response Headers* (`Strict-Transport-Security`,
  `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`,
  `X-Frame-Options: SAMEORIGIN`) y activar HSTS en Cloudflare. Peso SEO bajo; mejora la postura de seguridad.
- **M2. Imágenes de los posts (Markdown):** 3 `<img>` sin `width`/`height` (CLS) y alguna pesada
  (`public/blog/pan-de-jamon-consumer-flyer.png` ≈ 1,8 MB). Moverlas a `src/assets/` y usar `<Image>`
  (requiere un componente/plugin para Markdown) o al menos recomprimirlas a ≤200 KB.
- **M3. Fuentes de Google (CSS bloqueante de renderizado):** `fonts.googleapis.com` en el `<head>`
  retrasa el primer render. Autoalojar Cormorant Garamond e Inter (subset latino, `font-display: swap`)
  y precargar la fuente del H1. Probable ganancia de LCP en móvil.
- **M4. Logo de cabecera:** `logo.png` es 828×709 (60 KB) y se muestra a ≤80 px de alto. Servir una
  versión de ~240 px (o SVG).
- **M5. Redirecciones por meta-refresh** (`/sobre-nosotros/`, `/cocinando-con-amor`, 2 slugs de blog antiguos):
  GitHub Pages no emite 301. Están `noindex` con canonical al destino (aceptable). Si se quiere un 301 real,
  configurarlo con una *Redirect Rule* de Cloudflare.

### Baja
- 3 fichas de producto con nombre largo siguen en 62–66 caracteres (`torta-queso-new-york-comercial-*`): acortar
  `nombre` en `productos.json` o añadir `seoTitle`.
- IndexNow para Bing (clave en `public/` + `POST` en el deploy).
- **Deriva de contenido:** `src/content/productos/*.md` y `scripts/generate*.{ts,mjs}` definen productos
  (`baguettes-precocida-foodservice`, `baguettes-demi-mini`, pizzas, etc.) que no existen en `productos.json`,
  la fuente real del sitio. Conviene unificar para no generar enlaces a fichas inexistentes.

## Riesgos probables de Core Web Vitals (a confirmar con PageSpeed/CrUX)
- **LCP:** CSS de Google Fonts bloqueante (M3) + logo/imagen hero no optimizados.
- **CLS:** corregido en logos; revisar imágenes de posts (M2).
- **INP:** bajo riesgo (JS mínimo: carrusel, PostHog, botón flotante).
- Peso total del HTML: home ≈ 32 KB, muy por debajo del límite de 2 MB de Googlebot.

## Verificación final
`bun run build` OK (50 páginas) · `bun run check` 0 errores · `pytest` 49 OK ·
rastreo de `dist/`: 0 enlaces internos rotos, 0 H1 duplicados/ausentes, 0 JSON-LD inválidos.

---

## Seguimiento — pendientes resueltos (excepto los 404 por deploy)

| Pendiente | Estado |
|---|---|
| M1 Cabeceras de seguridad / HSTS | ◐ `<meta name="referrer">` en el HTML. HSTS, `nosniff`, `X-Frame-Options` y `Permissions-Policy` solo pueden emitirse desde Cloudflare: **`scripts/cloudflare-setup.sh`** los aplica por API (ensayo por defecto, `APPLY=1` para ejecutar). No se ejecutó porque no hay credenciales de Cloudflare en este entorno. |
| M2 Imágenes de posts | ✅ `width`/`height`, `loading="lazy"` y `decoding="async"` en las 3 imágenes (ahora `<img>` con dimensiones); flyer de 1,8 MB → 438 KB y las otras dos ≈ 45 KB. El pipeline usa `image_markup()` para las imágenes públicas de nuevos posts. *(Un plugin rehype no sirve: Astro 7 usa Sätteri por defecto.)* |
| M3 Fuentes bloqueantes | ✅ Autoalojadas con `@fontsource/cormorant-garamond` y `@fontsource-variable/inter` (subconjunto latino, `font-display: swap`) + `preload` de Inter y Cormorant 500. 0 referencias a `fonts.googleapis.com`. |
| M4 Logo de cabecera | ✅ `logo.png` 828×709 (60 KB) → 480×411 (19 KB); `width`/`height` actualizados. |
| M5 Redirecciones meta-refresh | ◐ Las 4 reglas 301 van en el mismo `scripts/cloudflare-setup.sh`. Hasta ejecutarlo, siguen `noindex` + canonical. |
| Títulos largos de producto | ✅ Cadena de fallback `nombre en Caracas \| marca` → `nombre \| marca` → `nombre`: 0 títulos >60. |
| IndexNow | ✅ Clave en `public/5c6da333…txt` y paso `continue-on-error` en `deploy.yml` que notifica a Bing/Yandex/Naver tras cada deploy. |
| Deriva de productos | ✅ Corrección a mi hallazgo anterior: los `.md` de `src/content/productos/` **sí se usan**, como base de conocimiento del blog pipeline (no para las páginas). Seis ids son variantes que el sitio publica en una sola ficha de `productos.json`. Resuelto sin borrar nada: `PRODUCT_PAGE_ALIASES` en `seo_guidelines.py` mapea cada variante a su ficha real (`baguettes-precocida-foodservice/comercial` → `baguettes-precocida`, `baguettes-demi-mini` → `baguettes-congelados`, `pizza-margarita-clasica/premium` → `pizza-margarita`, `pan-hokkaido-1700` → `pan-1700`), el prompt solo ofrece enlaces a fichas existentes y reescribe los de variantes; 2 tests nuevos fallan si un producto de la KB no resuelve a una ficha real. |

**Verificación:** `bun run build` OK (50 páginas) · `bun run check` 0 errores · `pytest` 52 OK · rastreo de
`dist/`: 0 títulos >60, 0 descripciones fuera de 70–160, 0 imágenes sin dimensiones, 0 enlaces rotos.

**Nota:** se añadieron dos dependencias con Bun (`@fontsource/cormorant-garamond`, `@fontsource-variable/inter`); `bun.lock` actualizado.
