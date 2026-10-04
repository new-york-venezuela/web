# Auditoría SEO — Alimentos New York (New York Cheese Cake C.A.)

Fecha: 2026-10-04 · Alcance: sitio completo (build local `dist/`, 49 páginas), página nueva
`/donde-encontrarnos/`, pipeline del blog (`scripts/blog_pipeline/`) y workflow de GitHub.

> **Límites de esta auditoría.** Se hizo sobre el código y el build local. **No** se midió:
> Core Web Vitals reales (CrUX), indexación ni consultas en Search Console, backlinks, ni
> posiciones en Google. Los puntajes son una estimación basada en evidencia de código/HTML.
> Con acceso a GSC y PageSpeed se pueden confirmar y priorizar mejor.

## 1. Quiénes somos (contexto usado)

Fábrica de panadería, repostería y congelados en La Urbina, Caracas, desde 1980 (cheesecake estilo Nueva York traída por los hermanos Doñaque). Modelo B2B + B2C:
supermercados (Gama, Plaza's, Unicasa, Páramo, Luvebras, La Muralla, Río Vida, Plan Suárez),
HORECA y bodegones. Certificaciones Kosher Parve y Pat Israel. Variantes de marca buscadas:
*Panadería Nueva York*, *New York Bakery*, *Alimentos New York*. Sin tienda propia al público:
el consumidor final compra en supermercados → la página "Dónde encontrarnos" es clave.

## 2. Puntaje estimado: **64 / 100**

| Categoría | Peso | Nota | Comentario |
|---|---|---|---|
| Técnico | 22% | 72 | Estático, sitemap, robots, canonicals, `lang="es"`. Falta `lastmod` en páginas estáticas, OG image real. |
| Contenido | 23% | 58 | Posts de ~550–630 palabras, casi sin enlaces internos, autor genérico. |
| On-page | 20% | 70 | Títulos/metas correctos en general; productos sin contexto local en el title. |
| Schema | 10% | 55 | LocalBusiness sin dirección completa y con imagen inexistente (corregido); Product con `price` de referencia. |
| Rendimiento | 10% | — | Sin medir. Imágenes webp/srcset (bien); LCP sin `priority`. |
| IA/GEO | 10% | 60 | Respuesta directa al inicio del post (bien); sin `llms.txt`, sin FAQ, sin datos de entidad. |
| Imágenes | 5% | 62 | Alt en Español (bien); carrusel repite el mismo alt; OG = logo. |

## 3. Hallazgos

### Críticos / Altos
1. **OG image inexistente.** El schema apuntaba a `/og-image.png`, que no existe, y `og:image`
   cae al logo (cuadrado). Las previsualizaciones en WhatsApp/Instagram/LinkedIn salen mal.
   → *Corregido en schema (usa logo). Falta crear la imagen: ver §6.*
2. **Enlaces internos casi inexistentes en el blog.** 8 de 10 posts tienen 0 enlaces
   internos. El pipeline pedía `internal_links` pero nunca los pasaba a la redacción.
   → *Corregido en el pipeline (§5). Los 10 posts existentes siguen pendientes (§7).*
3. **Canonical/OG apuntan a `example.com` si `SITE_URL` no está definido.** Verificar que
   el CI de despliegue lo define como `https://www.alimentosnewyork.com`.
4. **Página de clientes con poco contenido propio.** 15 de 20 entradas tienen una línea
   genérica. Es el principal riesgo de "thin content" de la página nueva.
5. **Autor `"eugenio"` en todos los posts** (y como `Person` en el schema Article). Débil
   para E-E-A-T. Usar un autor real con cargo (p. ej. "Equipo de Panadería, Alimentos New
   York" o el maestro panadero) y una página de autor/empresa.

### Medios
6. **Schema `Product` con `Offer.price`** tomado de un precio "$ Ref". Si el precio no es
   público/real, Google puede marcar el rich result como engañoso. Valorar quitar `offers` y
   dejar solo `Product` + `brand` (B2B se cotiza). → *Brand ahora se incluye; `certifications`
   (propiedad inválida) cambió a `additionalProperty`.*
7. **Nombre de marca inconsistente**: `COMPANY.name` = "New York Alimentos Premium",
   schema = "Alimentos New York", footer/Header = otro. Unificar en **Alimentos New York**.
8. **Títulos de producto** `X | New York Alimentos Premium` sin intención local/B2B. Plantilla
   sugerida: `{Producto} en Caracas | Alimentos New York`.
9. **Sitemap**: sin `lastmod` salvo en blog; `changefreq/priority` son ignorados por Google.
10. **`sameAs`** (Instagram/Facebook) no verificados; confirmar que las cuentas existen.
11. **Sin `FAQPage`/`HowTo`** aunque el contenido B2B (condiciones comerciales, distribución)
    es ideal para preguntas frecuentes.
12. **Carrusel de producto** usa el mismo `alt` en todas las fotos; la primera foto (LCP) es
    `loading="lazy"` → agregar `priority` a la imagen principal de la ficha.

### Bajos
13. `<meta name="keywords">` no tiene efecto; se puede quitar.
14. Sin `llms.txt` ni sección de datos de entidad para motores generativos.
15. Páginas `/empresa/*` de 120–270 palabras: fusionar o ampliar.

## 4. Cambios aplicados en esta rama

| Archivo | Cambio |
|---|---|
| `src/utils/generateProductMetadata.ts` | LocalBusiness: dirección completa (La Urbina), `legalName`, `foundingDate`, imagen válida. Product: `additionalProperty` en vez de `certifications`. |
| `src/components/StructuredData.astro` | Product ahora recibe `brand`/`manufacturer`. |
| `src/pages/donde-encontrarnos.astro` | Título más corto (61 car.), BreadcrumbList + ItemList JSON-LD, enlaces internos a catálogo, empresa, condiciones comerciales y contacto. |
| `src/data/clientes.ts` | Tipos "Cadena de supermercados" para Páramo, Río Vida, Plan Suárez, Luvebras, La Muralla (según `sobre-nosotros.md`); nombres corregidos. |
| `scripts/blog_pipeline/seo_guidelines.py` (nuevo) | Directivas de marca/SEO/GEO, validación de rutas internas, `lint_post`. |
| `step_02…step_06` | Prompts con datos de marca y reglas SEO; enlaces internos validados y pasados a la redacción; sección 700–900 palabras; lint SEO en PR. |
| `tests/blog_pipeline/test_seo_guidelines.py` (nuevo) | 4 pruebas; suite completa: 47 OK. |
| `.github/workflows/daily-blog-generator.yml` | Paso que publica los avisos SEO en el resumen del job. |

## 5. Directivas para la generación de blog (ya en el pipeline)

- Contexto local (Caracas/Venezuela) en primer párrafo y un H2; una variante de marca sin forzar.
- Primer párrafo = respuesta citable de 2–3 oraciones (GEO).
- 2–4 enlaces internos con anchor descriptivo, solo a rutas reales (se filtran las inventadas).
- H2 como preguntas/frases buscables; 700–900 palabras; sin testimonios ni cifras inventadas.
- Título ≤60 caracteres **incluido** el sufijo; descripción ≤160 con keyword al inicio.
- El PR trae "Avisos SEO automáticos" (título, descripción, keyword, longitud, enlaces, alt).

**Pendiente de decisión (no aplicado):** autor real en el frontmatter; generar un bloque FAQ
(+ `FAQPage`) en cada post; evitar canibalización consultando los títulos ya publicados antes
del paso 2; `ogImage` obligatorio por post.

## 6. Imágenes sugeridas (para revisar y producir)

| # | Imagen | Uso | Especificación | Alt sugerido |
|---|---|---|---|---|
| 1 | **OG por defecto** | `og:image` global | 1200×630 JPG, logo + "Panadería y cheesecake en Caracas desde 1980", fondo crema | "Alimentos New York: panadería y cheesecake estilo Nueva York en Caracas" |
| 2 | Cheesecake entera (hero) | Home / catálogo | ≥1920 px, luz natural lateral, fondo crema | "Cheesecake estilo Nueva York de Alimentos New York con cobertura de fresa" |
| 3 | Foto de planta (La Urbina) | `/empresa/` y E-E-A-T | Hornos, amasado, personal con uniforme | "Producción de pan en la planta de Alimentos New York en La Urbina, Caracas" |
| 4 | Sello Kosher Parve / Pat Israel | Certificaciones | Fotografía del certificado vigente (no un icono genérico) | "Certificado Kosher Parve y Pat Israel de Alimentos New York" |
| 5 | Producto en góndola | `/donde-encontrarnos/` | Foto real de nuestros panes en un supermercado aliado (con permiso) | "Panes New York en la góndola de [supermercado], Caracas" |
| 6 | Mapa/ilustración de Caracas con zonas | `/donde-encontrarnos/` | SVG simple, sin Google Maps pesado | "Zonas de Caracas donde se venden los productos New York" |
| 7 | Foto de equipo/maestro panadero | Autor del blog | Retrato 800×800 | "[Nombre], maestro panadero de Alimentos New York" |
| 8 | Imágenes por post (OG) | Cada artículo | 1200×630, producto + título | Descriptivo, sin "imagen de" |
| 9 | Fotos de paquete (back/front) | Fichas | Cada foto del carrusel con su propio alt ("empaque", "corte", "rebanada") | — |

Notas técnicas: originales JPEG/PNG en `src/assets/` (nunca webp), 4:3 para tarjetas, 1600 px
mínimo; la OG va en `public/og-image.jpg` y se referencia desde `COMPANY`/`SeoHead`.

## 7. Plan de acción

**Semana 1** — crear OG image y apuntar `SeoHead` a ella; confirmar `SITE_URL` en el deploy;
unificar el nombre de marca; autor real en posts; decidir sobre `Offer.price`.
**Semanas 2–3** — enlazar internamente los 10 posts existentes (producto + `/donde-encontrarnos/`
+ condiciones comerciales); completar las 15 fichas de clientes con datos reales (zona,
sucursales); `priority` en la imagen principal; títulos de producto con "en Caracas".
**Mes 2** — FAQ + `FAQPage` en distribución/condiciones comerciales; ampliar o fusionar
`/empresa/*`; páginas por zona (p. ej. "pan para restaurantes en Caracas") solo con contenido útil.
**Continuo** — registrar el sitio en Search Console y Bing, enviar sitemap; revisar CWV; reclamar
Google Business Profile de la planta; buscar menciones/enlaces de supermercados aliados y
certificadoras (Kosher) hacia el sitio.

## 8. Ideas de contenido (clusters)

- *Pilar B2B:* "proveedor de pan para hoteles y restaurantes en Caracas" → hamburguesa, brioche,
  precocidos, mermas, Kosher para HORECA.
- *Pilar consumidor:* "dónde comprar cheesecake en Caracas", "cheesecake estilo Nueva York",
  "pan integral/pumpernickel Caracas", "pan de jamón navideño".
- *Marca:* "Panadería Nueva York Caracas", "New York Bakery Venezuela" (landing/FAQ de marca).
- *Estacional:* pan de jamón (nov–dic), Pascua/Kosher, Día de la Madre (cheesecake).

## 9. Verificación

`bun run build` OK (49 páginas) · `pytest` 47 OK · `bun run check`: 7 errores previos
(tipado de `slug` en blog y `productos/[id].astro`), ninguno en archivos tocados aquí.

---

## 10. Seguimiento — segunda ronda (resuelto)

Decisiones del equipo: `SITE_URL = https://www.alimentosnewyork.com`, quitar `Offer.price`,
enlazar posts entre sí, autoría "Eugenio D.".

| # | Hallazgo | Estado |
|---|---|---|
| 1 | OG image inexistente | ✅ `public/og-image.jpg` (1200×630) creada; es el `og:image`/`twitter:image` por defecto y el `image` del schema de artículos. Conviene reemplazarla por una foto de producto cuando exista (§6 del informe). |
| 2 | Blog sin enlaces internos | ✅ Los 10 posts tienen bloque "Sigue leyendo" (3–4 enlaces a otros posts, fichas de producto y páginas de empresa) + enlaces en el cuerpo y a `/donde-encontrarnos/`. El pipeline ahora recibe la lista de posts existentes y el lint exige al menos un enlace a otro post. |
| 3 | `example.com` en canonical | ✅ `astro.config.mjs` usa por defecto `https://www.alimentosnewyork.com` (el deploy ya lo fijaba). Build local verificado: 0 referencias a `example.com`. |
| 4 | Página de clientes | ◐ Título, schema, enlaces y tipos corregidos. Siguen siendo breves 15 fichas: **requiere datos reales** (zona, sucursales). |
| 5 | Autoría | ✅ "Eugenio D." (frontmatter de los 10 posts, default del esquema, pipeline). Schema `Person` con cargo ("Contenido y desarrollo de negocio" — supuesto, ajustar) y `worksFor`; byline visible enlazada a `/empresa/sobre-nosotros/`, que ahora incluye "Equipo editorial". |
| 6 | `Offer.price` | ✅ Eliminado `offers` del schema `Product` (se mantiene `brand`, `manufacturer`, `url`). |
| 7 | Marca inconsistente | ✅ `COMPANY.name = "Alimentos New York"` (razón social en `legalName`); alt de logos y `aria-label` unificados. |
| 8 | Títulos de producto | ✅ `{Producto} en Caracas \| Alimentos New York` (algunos pasan de 60 caracteres por el nombre largo). |
| 9 | Sitemap sin `lastmod` | ⏸ Pendiente a propósito: no hay fecha de modificación fiable por página sin historial git en el build. |
| 11 | Sin FAQ | ✅ FAQ visible + `FAQPage` JSON-LD en `/empresa/distribucion/` y `/empresa/condiciones-comerciales/` (respuestas tomadas literalmente del contenido existente). |
| 12 | Carrusel/LCP | ✅ Imagen principal con `loading="eager"` + `fetchpriority="high"`; alt distinto por foto del carrusel. |
| 13 | `meta keywords` | ✅ Eliminado. |
| 14 | `llms.txt` | ✅ `public/llms.txt` con resumen de entidad y páginas clave. |
| 15 | `/empresa/*` cortas | ⏸ Pendiente: ampliar con contenido real (procesos, programa Zero Desperdicio). |
| 10 | `sameAs` | ⏸ Verificar que `instagram.com/alimentosnewyork` y `facebook.com/alimentosnewyork` existen. |

Además: `content.config.ts` ahora declara `slug`, `ogImage` y `postId` del blog, lo que
elimina los errores previos de `bun run check` (ahora **0 errores**).

**Verificación:** `bun run build` OK (49 páginas) · `bun run check` 0 errores · `pytest` 49 OK.
**Fuera del código (acciones del equipo):** Search Console + Bing Webmaster y envío del sitemap,
Google Business Profile de la planta, foto real de producto para OG, medir Core Web Vitals.
