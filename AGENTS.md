# AGENTS.md — Context for AI models working on this repository

Static corporate site + online catalog for a premium New York Cheesecake
business in Caracas, Venezuela. Astro 5, fully static output, Spanish-only
content, Bun as the only package manager.

## Hard rules

1. **Bun only.** Install with `bun install`, run scripts with `bun run <script>`.
   Never introduce `package-lock.json` or `yarn.lock`; the Bun lockfile is
   the single source of truth. Node version is pinned in `.nvmrc`.
2. **Static output only.** `output: 'static'` in `astro.config.mjs` must not
   change. No SSR adapters, no API routes, no server endpoints. Any dynamic
   behavior must be client-side and degrade gracefully.
3. **No secrets in code, ever.** All external configuration flows through
   `import.meta.env` with `PUBLIC_*` prefixes, documented in `.env.example`.
   Never hardcode API keys, tokens, form IDs, or phone numbers directly in
   source. Never weaken `.gitignore` (it blocks `.env*`, key files, and
   credential JSONs). Remember `PUBLIC_*` values get inlined into the built
   HTML/JS — only publishable values belong there.
4. **Spanish content.** All user-facing text, metadata, alt text, and form
   messages are written in natural Spanish (`es` is the only locale, set in
   `astro.config.mjs` i18n). Code identifiers and comments follow the
   existing style (Spanish comments in content-facing files is the norm).
5. **Prices in `$ Ref`.** USD reference pricing, formatted exclusively via
   `formatPrecio()` in `src/data/catalogo.ts`. Never format prices inline.

## Codebase map

| Path | Role | Notes |
| --- | --- | --- |
| `astro.config.mjs` | Framework config | `output: 'static'`, i18n `es`, `SITE_URL` env for canonical URLs |
| `src/layouts/BaseLayout.astro` | Global layout | Props: `title`, `description`, `noindex` (robots), `bare` (hides header/footer). Loads fonts + `PostHog.astro` in `<head>` |
| `src/components/PostHog.astro` | Analytics | Renders nothing unless `PUBLIC_POSTHOG_KEY` is set at build time. Keep it isolated; do not init PostHog anywhere else |
| `src/components/Header.astro` / `Footer.astro` | Global chrome | Nav links use trailing slashes (`build.format: 'directory'`) |
| `src/components/ProductCard.astro` | Catalog card | Consumes `Producto` from the data layer |
| `src/data/catalogo.ts` | **Single source of truth for products/pricing** | Edit here; index, catalog, and landing all derive from it |
| `src/pages/*.astro` | Routes | `index`, `catalogo`, `sobre-nosotros`, `contacto` |
| `src/pages/landing/promocion.astro` | Hidden campaign landing | `noindex` + `bare`; keep it out of nav and sitemaps |
| `src/scripts/google-form.ts` | Form submission handler | Posts to the public Google Forms `formResponse` endpoint in `no-cors` mode. No Sheets API, no credentials — keep it that way |
| `src/styles/global.css` | Design tokens | Scandinavian palette: cream `#FDFBF7`, milk `#F9F6F0`, charcoal `#2C2A29`, border `#EAE5DC`. Use tokens, never raw hex in components |

## Environment variables

Declared in `.env.example` (versioned template; real values go in `.env`,
which is gitignored):

- `PUBLIC_POSTHOG_KEY`, `PUBLIC_POSTHOG_HOST` — analytics (optional; absent ⇒ no tracking script emitted).
- `PUBLIC_GOOGLE_FORM_ID`, `PUBLIC_GFORM_ENTRY_{NOMBRE,TELEFONO,PRODUCTO,MENSAJE}` — landing form wiring (optional; absent ⇒ form shows "not active" notice instead of submitting).
- `PUBLIC_WHATSAPP_NUMBER`, `PUBLIC_CONTACT_EMAIL` — contact page data.
- `SITE_URL` — canonical production URL, read via `process.env` at build time in `astro.config.mjs`.

When adding a variable: add it to `.env.example` with a Spanish comment,
read it via `import.meta.env`, and handle the empty case gracefully.

## Workflows

```bash
bun install       # install deps
bun run dev       # dev server at :4321
bun run check     # astro check (type diagnostics) — run before claiming done
bun run build     # static build to dist/
bun run preview   # serve dist/ locally
```

**Definition of done for any change:** `bun run check` reports 0 errors and
`bun run build` completes. If you touched the landing form or PostHog,
also grep `dist/` to confirm no unexpected keys or URLs were inlined.

## Design system expectations

- Scandinavian minimalism: generous whitespace (`--space-*` scale), subtle
  1px borders (`--color-border`), no shadows, no border radii.
- Typography: Cormorant Garamond for display headings, Inter for body.
- New sections alternate `cream` and `milk` backgrounds via the
  `section--milk` utility class.
- Buttons use `.btn` / `.btn--solid`; forms use the `.field` pattern from
  `global.css`. Reuse these before inventing new patterns.
- Accessibility is non-negotiable: semantic landmarks, `aria-current` on
  active nav, `role="status"` + `aria-live` for async form feedback,
  `prefers-reduced-motion` respected.
