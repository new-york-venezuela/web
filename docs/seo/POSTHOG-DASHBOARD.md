# PostHog: medir y priorizar el tráfico orgánico que convierte

**Proyecto:** `226818` (org "alimentosnewyork.com", región **EU**; host de ingesta `https://eu.i.posthog.com`, ya es el valor por defecto de `PostHog.astro`).
**Dashboard:** https://eu.posthog.com/project/226818/dashboard/996780 — "Tráfico orgánico y acciones clave".

> El proyecto `279092` ("Default project" de otra organización) **no es** este sitio: solo recibe tráfico de
> `exportador.interno.alimentosnewyork.com`. No usar para este dashboard.

## Acciones significativas detectadas en el sitio
| Evento | Cuándo se dispara | Intención |
|---|---|---|
| `whatsapp_click` {location} | Clic en enlaces `wa.me` o envío del formulario del modal flotante | Alta |
| `phone_click`, `email_click` {location} | Clic en `tel:` / `mailto:` | Alta |
| `call_request_submitted` | Envío del formulario de `/solicitar-llamada/` (callback de HubSpot) | Máxima |
| `guide_downloaded` {file} | Descarga de `/docs/guia-tecnica.pdf` | Media |
| `cta_click` {cta_text, destination, location} | Botones `.btn` y enlaces a `/solicitar-llamada/` | Media |
| `product_viewed` {product_id} | Visita a `/productos/<id>/` | Interés |
| `faq_expanded` {question} | Apertura de una pregunta frecuente | Interés |

**Acción clave** (lo que cuenta como conversión en el dashboard): `whatsapp_click`, `phone_click`, `email_click`,
`call_request_submitted`, `guide_downloaded` o `cta_click` con destino `/solicitar-llamada/`.

## Atribución de canal (propiedades en todos los eventos, `src/scripts/analytics.ts`)
- `traffic_channel`: `organic_search` · `ai_assistant` · `social` · `referral` · `direct` · `email` · `paid`
- `ai_source`: `chatgpt` · `perplexity` · `gemini` · `copilot` · `claude` · `other_ai` (vacío si no aplica)
- `search_engine`: `google` · `bing` · `duckduckgo` · `yahoo` · `ecosia` · `other`
Se guarda el primer contacto de la sesión (`sessionStorage`) para que la navegación interna no lo sobrescriba.
Limitación: el tráfico de **AI Overviews/AI Mode de Google** llega como `organic_search` (Google no lo distingue).

## Cómo leer el dashboard y priorizar
1. **Visitantes orgánicos y de IA por día** — tendencia por canal; el objetivo es que `ai_assistant` deje de ser 0.
2. **Referencias de IA por `ai_source`** — qué asistentes nos citan (hoy: ninguna).
3. **Landings orgánicas: visitantes, acciones, conversión** — ordenar por visitantes × (1 − conversión):
   las páginas con mucho tráfico orgánico y 0 acciones son la **lista de trabajo** (CTA visible, contenido, enlaces).
4. **Oportunidades sin conversión** — misma lista filtrada; atacar primero arriba.
5. **Embudo** landing orgánica → `product_viewed` → acción clave — dónde se cae la gente.
6. **Acciones clave por canal** y **tasa de conversión por canal** — qué canal trae visitas que sí piden precios.
7. **Core Web Vitals por página (p75)** — velocidad como factor SEO (a 2026-10-04: `/solicitar-llamada/` LCP ≈ 4,7 s,
   `/` ≈ 2,4 s → priorizar `/solicitar-llamada/`, la página de conversión).
8. **Recorridos desde landings orgánicas** — qué leen antes de convertir.

Estado inicial (últimos 30 días, antes del despliegue de los eventos): 286 pageviews de `www.alimentosnewyork.com`;
fuentes Google, directo, Instagram/Facebook y algo de email; 0 referencias de IA; 0 conversiones medibles
(los eventos aún no existían). Los tiles de acciones se llenarán tras el próximo deploy.

## Verificar tras el deploy
1. Abrir `https://www.alimentosnewyork.com/?utm_source=chatgpt.com` → en consola `posthog.get_property('traffic_channel')` debe dar `ai_assistant`.
2. Pulsar un enlace de WhatsApp y comprobar `whatsapp_click` en *Activity → Live events*.
3. Enviar una solicitud de llamada de prueba y comprobar `call_request_submitted` (depende del callback `onFormSubmitted` de HubSpot).
4. Filtrar cuentas internas (cohorte de "test account filters" del proyecto) al revisar métricas.
