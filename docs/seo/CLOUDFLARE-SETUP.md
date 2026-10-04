# Cloudflare: cabeceras de seguridad y redirecciones 301

**Atajo:** `CF_API_TOKEN=… scripts/cloudflare-setup.sh` (ensayo) y luego `APPLY=1 …` aplica todo lo de
abajo por API. Token con permisos *Zone Settings: Edit* y *Transform/Redirect Rules: Edit*. Ojo: los
`PUT` reemplazan las reglas existentes de esas fases.

El sitio se sirve desde GitHub Pages detrás de Cloudflare (`server: cloudflare`). GitHub Pages no
permite cabeceras ni redirecciones propias, pero Cloudflare sí. Configurar en el panel del dominio
(no requiere cambios de código).

## 1. HSTS
*SSL/TLS → Edge Certificates → HSTS → Enable*: Max-Age 6 meses, Include subdomains **No** (hasta
confirmar que no hay subdominios sin HTTPS), Preload **No**, No-Sniff **Sí**. Verificar antes que
*Always Use HTTPS* esté activo (hoy `http→https` ya redirige con 301).

## 2. Cabeceras de respuesta
*Rules → Transform Rules → Modify Response Header → Create rule* (aplicar a "All incoming requests"):

| Operación | Cabecera | Valor |
|---|---|---|
| Set static | `X-Content-Type-Options` | `nosniff` |
| Set static | `X-Frame-Options` | `SAMEORIGIN` |
| Set static | `Referrer-Policy` | `strict-origin-when-cross-origin` |
| Set static | `Permissions-Policy` | `camera=(), microphone=(), geolocation=()` |

No añadir CSP restrictiva sin probar: el sitio usa PostHog (`us.i.posthog.com`) y estilos inline de Astro.
Una CSP razonable para empezar en modo `Content-Security-Policy-Report-Only`:
`default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline' https://us.i.posthog.com https://us-assets.i.posthog.com; connect-src 'self' https://us.i.posthog.com; frame-ancestors 'self'`.

## 3. Redirecciones 301 reales
GitHub Pages solo puede generar páginas con `meta refresh` (hoy `noindex` + canonical al destino).
Para 301 reales: *Rules → Redirect Rules → Create rule* (tipo *Static*, código 301):

| Origen | Destino |
|---|---|
| `/sobre-nosotros` y `/sobre-nosotros/` | `/empresa/` |
| `/cocinando-con-amor` y `/cocinando-con-amor/` | `/documentacion/guia-tecnica/` |
| `/blog/miga-de-memoria-pan-brioche-hamburguesa-gourmet-caracas/` | `/blog/pan-brioche-hamburguesas-caracas/` |
| `/blog/por-que-la-miga-de-memoria-en-el-pan-brioche-es-el-secreto-de-una-hamburguesa-gourmet-perfecta/` | `/blog/pan-brioche-hamburguesas-caracas/` |

Tras activarlas, comprobar con `curl -I https://www.alimentosnewyork.com/sobre-nosotros/` (esperado: `301`).

## 4. Verificación
`curl -sI https://www.alimentosnewyork.com/ | grep -iE "strict-transport|x-content-type|x-frame|referrer"`
