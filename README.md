# New York Cheese Cake - Web Corporativa y Catálogo

Sitio de New York Cheese Cake C.A., fábrica de alimentos premium para supermercados y restaurantes en Caracas, Venezuela. Construido con
**Astro 5** y orquestado con **Bun**.

## Arquitectura

- **Salida estática pura** (`output: 'static'` en `astro.config.mjs`):
  todo el HTML se pre-renderiza en build. No hay servidor, no hay API
  propia, no hay base de datos. El resultado en `dist/` se sirve desde
  cualquier CDN u hosting estático.
- **Cero JavaScript por defecto**: Astro solo envía JS al cliente donde se
  necesita. En este sitio, únicamente dos scripts condicionales:
  1. El manejador del formulario en la landing oculta.
  2. El snippet de PostHog, **solo si** la variable de entorno con la clave
     está presente en el momento del build.
- **i18n**: español (`es`) como idioma único y por defecto
  (`i18n.defaultLocale` en la configuración). Todo el contenido, la
  metadata y los mensajes de interfaz están en español.
- **Datos centralizados**: el catálogo vive en `src/data/catalogo.ts` como
  única fuente de verdad; la página de catálogo, la portada y la landing
  leen de allí. Precios expresados en dólares de referencia (`$ Ref`),
  práctica estándar del mercado local.

## Estructura

```
src/
├── components/
│   ├── Footer.astro        # Pie de página global
│   ├── Header.astro        # Navegación principal
│   ├── PostHog.astro       # Analítica aislada, activada por env vars
│   └── ProductCard.astro   # Tarjeta minimalista de producto
├── data/
│   └── catalogo.ts         # Productos, precios y formato de moneda
├── layouts/
│   └── BaseLayout.astro    # <head>, SEO, fuentes, modos noindex/bare
├── pages/
│   ├── index.astro             # Inicio
│   ├── catalogo.astro          # Catálogo
│   ├── sobre-nosotros.astro    # Nosotros (editorial)
│   ├── contacto.astro          # Contacto
│   └── landing/
│       └── promocion.astro     # Landing oculta (noindex, sin navegación)
├── scripts/
│   └── google-form.ts      # Handler TypeScript de envío a Google Forms
└── styles/
    └── global.css          # Sistema de diseño (tokens CSS)
```

## Sistema de diseño

Minimalismo escandinavo definido por tokens CSS en `src/styles/global.css`:

| Token | Valor | Uso |
| --- | --- | --- |
| `--color-cream` | `#FDFBF7` | Fondo principal |
| `--color-milk` | `#F9F6F0` | Secciones alternas |
| `--color-charcoal` | `#2C2A29` | Texto principal |
| `--color-border` | `#EAE5DC` | Bordes sutiles |

Tipografía: **Cormorant Garamond** (títulos) e **Inter** (cuerpo), servidas
desde Google Fonts con `preconnect`. Espaciado generoso mediante escala
(`--space-xs` … `--space-xl`).

## Integraciones (parametrizadas, sin credenciales en el código)

- **PostHog** (`src/components/PostHog.astro`): se inicializa solo cuando
  `PUBLIC_POSTHOG_KEY` existe en el entorno de build. Sin clave, no se
  inyecta ni un byte de tracking.
- **Google Forms** (`src/scripts/google-form.ts` + landing): el formulario
  de la landing publica contra el endpoint público `formResponse` del
  formulario de Google, cuyas respuestas se vuelcan a la Google Sheet
  vinculada. No se usan credenciales de la API de Sheets en ningún punto.

Todas las variables se documentan en `.env.example`. El `.gitignore`
bloquea `.env*`, llaves, certificados y archivos de credenciales.

## Comandos

| Comando | Acción |
| --- | --- |
| `bun install` | Instala dependencias (lockfile de Bun) |
| `bun run dev` | Servidor de desarrollo en `localhost:4321` |
| `bun run build` | Build estático de producción en `dist/` |
| `bun run preview` | Previsualiza el build localmente |
| `bun run check` | Verificación de tipos con `astro check` |

Versión de Node fijada en `.nvmrc`. Guía de puesta en marcha y
parametrización para otros clientes: ver [`INSTRUCTIONS.md`](INSTRUCTIONS.md).
Contexto para agentes de IA: ver [`AGENTS.md`](AGENTS.md).
