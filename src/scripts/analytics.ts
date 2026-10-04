/**
 * Instrumentación de analítica (PostHog) sin dependencias.
 *
 * - Registra super-propiedades de canal de adquisición (orgánico, IA, etc.)
 *   con first-touch por sesión.
 * - Captura acciones significativas mediante delegación de eventos.
 * - Es seguro si `window.posthog` no existe (PostHog solo carga con
 *   PUBLIC_POSTHOG_KEY) y nunca envía PII (teléfonos, correos, campos de form).
 */

export type TrafficChannel =
  | 'organic_search'
  | 'ai_assistant'
  | 'social'
  | 'referral'
  | 'direct'
  | 'email'
  | 'paid';

export interface TrafficInfo {
  traffic_channel: TrafficChannel;
  ai_source: string;
  search_engine: string;
}

export interface ClassifyInput {
  referrer?: string;
  search?: string;
  hostname?: string;
}

const AI_RULES: Array<[string, RegExp]> = [
  ['chatgpt', /(^|\.)(chatgpt\.com|chat\.openai\.com|openai\.com)$/],
  ['perplexity', /(^|\.)perplexity\.ai$/],
  ['gemini', /^(gemini|bard)\.google\.com$/],
  ['copilot', /^copilot\.microsoft\.com$/],
  ['claude', /(^|\.)claude\.ai$/],
  ['other_ai', /(^|\.)(you\.com|phind\.com|kagi\.com|poe\.com|deepseek\.com|chat\.mistral\.ai|grok\.com|meta\.ai)$/],
];

const SEARCH_RULES: Array<[string, RegExp]> = [
  ['google', /(^|\.)google\.[a-z.]+$/],
  ['bing', /(^|\.)bing\.com$/],
  ['duckduckgo', /(^|\.)duckduckgo\.com$/],
  ['yahoo', /(^|\.)yahoo\.[a-z.]+$/],
  ['ecosia', /(^|\.)ecosia\.org$/],
  ['other', /(^|\.)(baidu\.com|yandex\.[a-z.]+|brave\.com|startpage\.com|qwant\.com)$/],
];

const SOCIAL_RE =
  /(^|\.)(facebook\.com|instagram\.com|t\.co|twitter\.com|x\.com|linkedin\.com|lnkd\.in|tiktok\.com|youtube\.com|pinterest\.com|reddit\.com|whatsapp\.com|t\.me|telegram\.org)$/;

function hostOf(url: string): { host: string; path: string } {
  try {
    const u = new URL(url);
    return { host: u.hostname.toLowerCase(), path: u.pathname };
  } catch {
    return { host: '', path: '' };
  }
}

function aiFromHost(host: string, path: string): string {
  if (host === 'www.bing.com' || host === 'bing.com') {
    return path.startsWith('/chat') ? 'copilot' : '';
  }
  for (const [name, re] of AI_RULES) if (re.test(host)) return name;
  return '';
}

function aiFromUtm(source: string): string {
  const s = source.toLowerCase();
  if (s.includes('chatgpt') || s.includes('openai')) return 'chatgpt';
  if (s.includes('perplexity')) return 'perplexity';
  if (s.includes('gemini')) return 'gemini';
  if (s.includes('copilot')) return 'copilot';
  if (s.includes('claude')) return 'claude';
  return '';
}

/** Clasificador puro: deriva canal, fuente de IA y buscador. */
export function classifyTraffic({ referrer = '', search = '', hostname = '' }: ClassifyInput): TrafficInfo {
  const params = new URLSearchParams(search);
  const utmSource = (params.get('utm_source') ?? '').toLowerCase();
  const utmMedium = (params.get('utm_medium') ?? '').toLowerCase();
  const { host, path } = hostOf(referrer);
  const external = host !== '' && host !== hostname.toLowerCase();

  let ai = aiFromUtm(utmSource);
  if (!ai && external) ai = aiFromHost(host, path);

  let engine = '';
  if (external && !ai) {
    for (const [name, re] of SEARCH_RULES) {
      if (re.test(host)) {
        engine = name;
        break;
      }
    }
  }

  const base = { ai_source: ai, search_engine: engine };
  if (params.has('gclid') || params.has('fbclid') && /paid|cpc/.test(utmMedium) || /^(cpc|ppc|paid|paidsearch|paid_social|display)/.test(utmMedium)) {
    return { traffic_channel: 'paid', ...base };
  }
  if (ai) return { traffic_channel: 'ai_assistant', ...base };
  if (utmMedium === 'email' || utmSource === 'email' || utmSource === 'newsletter') {
    return { traffic_channel: 'email', ...base };
  }
  if (engine || utmMedium === 'organic') {
    return { traffic_channel: 'organic_search', ...base };
  }
  if (utmMedium === 'social' || (external && SOCIAL_RE.test(host))) {
    return { traffic_channel: 'social', ...base };
  }
  if (external) return { traffic_channel: 'referral', ...base };
  return { traffic_channel: 'direct', ...base };
}

// ---------------------------------------------------------------------------
// Runtime (solo navegador)
// ---------------------------------------------------------------------------

type Props = Record<string, string | number | boolean>;

interface PostHogLike {
  capture?: (event: string, props?: Props) => void;
  register?: (props: Props) => void;
}

const ph = (): PostHogLike | undefined =>
  (window as unknown as { posthog?: PostHogLike }).posthog;

const capture = (event: string, props: Props = {}): void => {
  try {
    ph()?.capture?.(event, props);
  } catch {
    /* analítica nunca debe romper la página */
  }
};

const STORE_KEY = 'ph_first_touch';

function registerTraffic(): void {
  let info: TrafficInfo | undefined;
  try {
    const raw = sessionStorage.getItem(STORE_KEY);
    if (raw) info = JSON.parse(raw) as TrafficInfo;
  } catch {
    /* sin storage */
  }
  if (!info) {
    info = classifyTraffic({
      referrer: document.referrer,
      search: location.search,
      hostname: location.hostname,
    });
    try {
      sessionStorage.setItem(STORE_KEY, JSON.stringify(info));
    } catch {
      /* sin storage */
    }
  }
  try {
    ph()?.register?.({ ...info });
  } catch {
    /* noop */
  }
}

function locationOf(el: Element): string {
  const explicit = el.closest('[data-ph-location]')?.getAttribute('data-ph-location');
  if (explicit) return explicit;
  if (el.closest('#floating-modal-overlay, [role="dialog"]')) return 'modal';
  const landmark = el.closest('header, footer, main');
  return landmark ? landmark.tagName.toLowerCase() : 'page';
}

const clip = (s: string, n = 80): string => s.replace(/\s+/g, ' ').trim().slice(0, n);

function destinationOf(a: HTMLAnchorElement): string {
  const href = a.getAttribute('href') ?? '';
  if (href.startsWith('tel:')) return 'tel';
  if (href.startsWith('mailto:')) return 'mailto';
  try {
    const u = new URL(a.href, location.href);
    if (/(^|\.)wa\.me$|whatsapp\.com$/.test(u.hostname)) return 'whatsapp';
    return u.hostname === location.hostname ? u.pathname : u.hostname;
  } catch {
    return '';
  }
}

function onClick(e: MouseEvent): void {
  const target = e.target as Element | null;
  const a = target?.closest?.('a') as HTMLAnchorElement | null;
  if (!a) return;
  const href = a.getAttribute('href') ?? '';
  const where = locationOf(a);

  if (/^https?:\/\/(wa\.me|api\.whatsapp\.com|web\.whatsapp\.com)\//.test(href)) {
    capture('whatsapp_click', { location: where });
  } else if (href.startsWith('tel:')) {
    capture('phone_click', { location: where });
  } else if (href.startsWith('mailto:')) {
    capture('email_click', { location: where });
  }

  if (/\.pdf($|[?#])/i.test(href) || a.hasAttribute('download')) {
    const file = href.split(/[?#]/)[0].split('/').pop() ?? '';
    capture('guide_downloaded', { file, location: where });
  }

  if (a.classList.contains('btn') || href.includes('/solicitar-llamada/')) {
    capture('cta_click', {
      cta_text: clip(a.textContent ?? ''),
      destination: destinationOf(a),
      location: where,
    });
  }
}

function onSubmit(e: Event): void {
  const form = e.target as HTMLFormElement | null;
  // El formulario del modal abre wa.me con window.open (no es un <a>).
  if (form?.id === 'whatsapp-lead-form') {
    capture('whatsapp_click', { location: locationOf(form) });
  }
}

function onToggle(e: Event): void {
  const el = e.target as HTMLDetailsElement | null;
  if (el?.tagName === 'DETAILS' && el.open) {
    capture('faq_expanded', { question: clip(el.querySelector('summary')?.textContent ?? '', 120) });
  }
}

export function initAnalytics(): void {
  registerTraffic();

  const m = location.pathname.match(/^\/productos\/([^/]+)\/?$/);
  if (m) capture('product_viewed', { product_id: decodeURIComponent(m[1]) });

  document.addEventListener('click', onClick, { passive: true });
  document.addEventListener('submit', onSubmit, { passive: true });
  // `toggle` no burbujea: se escucha en fase de captura.
  document.addEventListener('toggle', onToggle, { capture: true, passive: true });
  // Disparado por HubSpotForm al enviarse con éxito (sin datos del formulario).
  document.addEventListener('ph:call_request_submitted', () => {
    capture('call_request_submitted', { location: 'solicitar-llamada' });
  });
}

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  initAnalytics();
}
