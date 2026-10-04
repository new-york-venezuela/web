# GEO Analysis — Alimentos New York (AI search readiness)

Fecha: 2026-10-04 · Objetivo auditado: `http://localhost:4321` (build de esta rama) + sondeos HTTP a
`https://www.alimentosnewyork.com` para el acceso de rastreadores de IA.
Marco: según la guía de Google, optimizar para búsqueda con IA **sigue siendo SEO**; aquí se evalúan los
fundamentos SEO aplicados a AI Overviews / AI Mode / ChatGPT / Perplexity / Claude.

## 1. GEO Readiness Score: **52 / 100**

| Criterio | Peso | Nota | Evidencia |
|---|---|---|---|
| Citabilidad de pasajes | 25% | 55 | Posts y páginas empiezan con respuesta directa; sin cifras/fuentes citables; fichas de producto muy cortas (≈170 palabras). |
| Legibilidad estructural | 20% | 70 | H1→H2→H3 limpios, listas en todas las páginas, FAQ visibles en distribución/condiciones. **0 tablas** en el HTML renderizado. |
| Contenido multimodal | 15% | 45 | Fotos de producto con alt en español; sin vídeo, sin infografías, sin planta/proceso en imagen. |
| Autoridad y marca | 20% | 30 | Autor con nombre y cargo (nuevo) y fechas en posts. **Presencia de marca en la web casi nula** (ver §5). |
| Accesibilidad técnica | 20% | 75 | 100 % servidor-renderizado; la política de bots es coherente pero no está declarada en `robots.txt` (ver §3). |

Plataformas: **no medidas con herramienta** (sin DataForSEO/SE Ranking), solo preparación cualitativa:
Google AIO/AI Mode = media (buen SEO base, poca señal de entidad) · ChatGPT/Perplexity = baja (dependen de
menciones en Wikipedia/Reddit/YouTube, que no existen aún) · Claude = media (accesible, pero sin menciones).

## 2. Renderizado (SSR)
Todas las páginas auditadas entregan su contenido principal en el HTML inicial (home 428 palabras,
sobre-nosotros 666, post de croissants 634, distribución 476, dónde encontrarnos 578). El JS solo gobierna
carrusel, PostHog y botón flotante. **Sin riesgo** para rastreadores que no ejecutan JavaScript.
JSON-LD presente y válido: LocalBusiness (todas), BreadcrumbList, Product, Article, FAQPage, ItemList.

## 3. Estado de acceso de rastreadores de IA
`robots.txt` (local y producción) solo contiene `User-agent: *` con `Disallow: /api/` y
`/solicitar-llamada/`; **no nombra ningún bot de IA**. Pero Cloudflare aplica una política en el borde
distinta (sondeo con User-Agent; las IP reales pueden variar):

**Citabilidad en búsqueda (lo que importa para aparecer en respuestas)**
| Bot | Capacidad | Resultado |
|---|---|---|
| Googlebot | Google Search, AI Overviews, AI Mode | 200 ✅ |
| OAI-SearchBot | Citabilidad en ChatGPT Search | 200 ✅ |
| Claude-SearchBot | Citabilidad en búsqueda de Claude | 200 ✅ |
| PerplexityBot | Índice de Perplexity | 200 ✅ |
| bingbot | Bing / Copilot | 200 ✅ |
| Applebot | Siri / Spotlight / Safari | 200 ✅ |
| ChatGPT-User, Claude-User, Perplexity-User | Navegación a petición del usuario | 200 ✅ |

**Entrenamiento de modelos (decisión de licencias, no de visibilidad)**
| Bot | Capacidad | Resultado |
|---|---|---|
| GPTBot | Entrenamiento OpenAI | **403** (bloqueado en el borde) |
| ClaudeBot | Entrenamiento Anthropic | **403** |
| CCBot | Common Crawl | **403** |
| Bytespider, Amazonbot | Entrenamiento ByteDance / Amazon | **403** |
| Google-Extended, Applebot-Extended | Entrenamiento Gemini / Apple Intelligence | no rastrean; `robots.txt` no los restringe → permitido |
| meta-externalagent | Meta | 200 |

Lectura: la configuración **ya es la recomendada** (se bloquea el entrenamiento y se deja pasar a los bots de
búsqueda), probablemente por la opción "Block AI bots" de Cloudflare. **Riesgo:** la política es invisible
en el repositorio y depende de un ajuste de panel; si alguien lo cambia a "bloquear todos los bots de IA"
se perdería la citabilidad. Además `Google-Extended`/`Applebot-Extended` quedan permitidos por omisión.

## 4. llms.txt
Presente (`/llms.txt`, 200 en local). Google indica que no es necesario ni influye en Search; se mantiene como
resumen de entidad de bajo coste para sistemas que lo lean. **No se le asigna peso en el puntaje.**
Corrección pendiente: dice "más de 44 años" y la web usa "más de 40"/"44" de forma inconsistente (ver §6).

## 5. Análisis de menciones de marca (el mayor hueco)
Búsquedas de `"Alimentos New York" Caracas` y `"New York Cheese Cake C.A." Caracas` **no devuelven ninguna
página propia ni de terceros**: solo resultados de Nueva York (EE. UU.), recetas y "Caracas Arepa Bar".
- Sin Wikipedia/Wikidata, sin menciones verificables en Reddit/YouTube/LinkedIn.
- `sameAs` apunta a Instagram/Facebook **sin verificar** que existan.
- El nombre "New York" colisiona con la ciudad: sin señales de entidad, los motores confunden la marca.
Los datos de la web (fundación 1980, hermanos Doñaque, Kosher Parve, cadenas aliadas) son hechos citables
**que hoy nadie más corrobora**.

## 6. Citabilidad de pasajes — hallazgos
- ✅ El primer párrafo de home, empresa y posts ya responde "qué es/qué hacemos" (patrón GEO).
- ⚠️ **Edad inconsistente:** "más de 40 años" (home, schema), "44 años" (posts, empresa) y `founded: 1980`
  (= 46 años en 2026). Los motores penalizan cifras contradictorias. Usar una forma estable: **"desde 1980"**.
- ⚠️ Sin datos propios citables (cifras de producción, nº de puntos de venta, tiempos de vida útil comparados).
- ⚠️ Fichas de producto de ≈170 palabras sin tabla de especificaciones comparativa.
- ⚠️ Sin "última actualización" en páginas no-blog; los posts tienen fecha pero ningún `dateModified` real.

## 7. Top 5 cambios de mayor impacto
1. **Construir la entidad fuera de la web:** perfil de Google Business Profile de la planta, LinkedIn de empresa,
   Instagram/Facebook verificados y enlazados en `sameAs`, ficha en directorios de Caracas y una **entrada de
   Wikidata** (la marca cumple notoriedad mínima por trayectoria; Wikipedia es más exigente). Es el cambio con
   más correlación con visibilidad en IA.
2. **Unificar la cifra de trayectoria** a "desde 1980" en home, schema, llms.txt, posts y empresa.
3. **Declarar la política de bots en `robots.txt`** (coherente con Cloudflare), para que no dependa de un panel.
4. **Añadir datos propios y tablas citables:** tabla comparativa de panes (peso, vida útil, certificación) y
   tabla de condiciones comerciales en HTML; "Puntos de venta por zona" cuando haya datos reales.
5. **Contenido que otros citen:** 2–3 piezas con información original (p. ej. "historia de la cheesecake
   neoyorquina en Caracas", guía Kosher Parve vs Pat Israel con fuentes), con autor, fecha y fuentes primarias,
   y programa de refresco trimestral de los 10 posts (los <3 meses se citan más).

## 8. Schema recomendado para descubribilidad
- `Organization` con `sameAs` real (Wikidata, LinkedIn, GBP), `foundingDate: 1980`, `founder` (hermanos Doñaque
  como `Person`, si lo autorizan), `knowsAbout`, `hasCredential` (Kosher Parve/Pat Israel con certificadora).
- `Person` del autor con `sameAs` (LinkedIn) para reforzar E-E-A-T.
- No añadir FAQPage nuevo pensando en Google: ya no genera rich result; las FAQ existentes se mantienen
  porque ayudan a lectores (no se recomienda retirarlas).

## 9. Reformateos concretos (pasajes a reescribir)
- Home, 1.er párrafo: "…con más de 40 años de tradición" → "…desde 1980. Alimentos New York (Panadería Nueva York)
  es una fábrica de panadería y cheesecake en La Urbina, Caracas, que abastece a supermercados, hoteles y
  restaurantes." (definición autosuficiente, ≈40 palabras).
- `/empresa/sobre-nosotros/` y posts: "44 años" → "desde 1980".
- Fichas de producto: abrir con una frase "X es…" + tabla de especificaciones (peso, vida útil, temperatura,
  certificación) y 2–3 preguntas frecuentes reales de compradores B2B.
- `/donde-encontrarnos/`: cuando haya datos reales, párrafo por cadena con zonas/sucursales (citable por
  consultas "dónde comprar cheesecake New York en Caracas").

## 10. Cómo sabremos si falla (falsabilidad) e indicadores
- Consulta mensual manual en ChatGPT, Perplexity y Google AI Mode: "dónde comprar cheesecake estilo Nueva York en
  Caracas" / "proveedor de pan para restaurantes en Caracas". Éxito = la marca o `alimentosnewyork.com` aparece citada.
- Indicadores adelantados: menciones de marca nuevas (Alerts), tráfico de referencia de chatgpt.com / perplexity.ai
  en PostHog, impresiones en Search Console para consultas de marca ("panadería nueva york caracas").
