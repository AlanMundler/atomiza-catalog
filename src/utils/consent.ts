// =============================================================
// CONSENTIMIENTO + CARGA DIFERIDA DE TRACKERS
// -------------------------------------------------------------
// Estado en localStorage, listeners del banner propio y carga
// bajo demanda de Google Analytics, Meta Pixel y TikTok.
//
// Antes esto era un `<script is:inline define:vars>` de ~130
// líneas que Astro repetía en cada página. Ahora es un módulo
// bundleado, minificado y cacheado por el navegador.
//
// Regla de oro: el listener del banner PROPIO
// (`sp_cookie_banner_save`) se instala SIEMPRE. Solo los eventos
// de terceros de SecurePrivacy (`sp_consent`, `sp_spab_unblock`,
// `sp_unblock_*`) quedan detrás de `securePrivacy`.
// =============================================================

import { site } from '@/site.config';

export type ConsentCategory = 'analytics' | 'ads';

export type ConsentState = Partial<Record<ConsentCategory, boolean>>;

export interface ConsentConfig {
  consentKey: string;
  gaId: string;
  metaPixelId: string;
  tiktokPixelId: string;
  securePrivacy: boolean;
}

/** Estado vivo del módulo (nunca se toca a nivel de módulo con APIs del navegador). */
let state: ConsentState = {};

/** Config vigente; los loaders la leen cuando el visitante acepta. */
let activeConfig: ConsentConfig | null = null;

// Flags de carga: un proveedor se inyecta una sola vez por sesión.
let analyticsLoaded = false;
let adsLoaded = false;

/** Estructura mínima de `window.fbq` (Meta Pixel). */
interface MetaPixel {
  (...args: unknown[]): void;
  callMethod?: (...args: unknown[]) => void;
  queue: unknown[][];
  push?: (...args: unknown[]) => void;
  loaded?: boolean;
  version?: string;
}

/** Cola de TikTok Pixel: arranca como array y luego se le cuelgan métodos. */
interface TiktokQueue {
  push: (item: unknown[]) => void;
  methods: string[];
  setAndDefer: (target: TiktokQueue, method: string) => void;
  defer?: boolean;
  load: (pixelId: string) => void;
  page: () => void;
  track: (event: string, params?: Record<string, unknown>) => void;
  _i?: Record<string, unknown>;
  [key: string]: unknown;
}

/** Vista tipada de `window` para los globales de terceros. */
interface TrackingWindow {
  dataLayer?: unknown[];
  gtag?: (...args: unknown[]) => void;
  fbq?: MetaPixel;
  _fbq?: MetaPixel;
  TiktokAnalyticsObject?: string;
  ttq?: TiktokQueue;
}

declare global {
  interface Window {
    __hasConsent?: (category: ConsentCategory) => boolean;
  }
}

function trackingWindow(): TrackingWindow {
  return window as unknown as TrackingWindow;
}

/** Valida que el valor parseado sea un objeto plano (no array ni null). */
function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

/** Lee la decisión guardada. Sin storage o con basura devuelve `{}`. */
export function readState(consentKey: string = site.storage.consent): ConsentState {
  if (typeof localStorage === 'undefined') return {};
  let parsed: unknown = null;
  try {
    // `getItem` también puede lanzar SecurityError (modo privado / storage
    // bloqueado): debe quedar dentro del try para no romper el arranque.
    parsed = JSON.parse(localStorage.getItem(consentKey) || '{}');
  } catch {
    return {};
  }
  if (!isPlainObject(parsed)) return {};
  const next: ConsentState = {};
  if (typeof parsed.analytics === 'boolean') next.analytics = parsed.analytics;
  if (typeof parsed.ads === 'boolean') next.ads = parsed.ads;
  return next;
}

/** ¿El visitante habilitó esta categoría? */
export function hasConsent(category: ConsentCategory): boolean {
  return state[category] === true;
}

/** Fusiona y persiste el estado. No carga nada: eso lo hace `applyConsent`. */
export function persistState(next: ConsentState): void {
  state = { ...state, ...next };
  if (typeof localStorage === 'undefined') return;
  const key = activeConfig?.consentKey || site.storage.consent;
  try {
    localStorage.setItem(key, JSON.stringify(state));
  } catch {
    // Storage bloqueado (modo privado, cuota llena): la sesión sigue en memoria.
  }
}

/** Crea `dataLayer`/`gtag` recién cuando hay consentimiento de analytics. */
function ensureGtag(win: TrackingWindow): void {
  win.dataLayer = win.dataLayer || [];
  if (typeof win.gtag !== 'function') {
    win.gtag = (...args: unknown[]) => {
      win.dataLayer?.push(args);
    };
  }
}

/** Google Analytics 4: gtag.js + config. */
function loadAnalytics(): void {
  const gaId = activeConfig?.gaId;
  if (analyticsLoaded || !gaId || typeof document === 'undefined') return;
  analyticsLoaded = true;
  const win = trackingWindow();
  ensureGtag(win);
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
  document.head.appendChild(script);
  win.gtag?.('js', new Date());
  win.gtag?.('config', gaId);
}

// Meta Pixel: cola estándar de fbevents.js.
function loadMetaPixel(pixelId: string): void {
  const win = trackingWindow();
  if (win.fbq) return;
  const fbq = ((...args: unknown[]) => {
    if (fbq.callMethod) fbq.callMethod(...args);
    else fbq.queue.push(args);
  }) as MetaPixel;
  fbq.queue = [];
  fbq.push = fbq;
  fbq.loaded = true;
  fbq.version = '2.0';
  win.fbq = fbq;
  win._fbq = fbq;
  const script = document.createElement('script');
  script.async = true;
  script.src = 'https://connect.facebook.net/en_US/fbevents.js';
  const first = document.getElementsByTagName('script')[0];
  if (first?.parentNode) first.parentNode.insertBefore(script, first);
  else document.head.appendChild(script);
  win.fbq('init', pixelId);
  win.fbq('track', 'PageView');
}

// TikTok Pixel: misma cola `ttq` del snippet oficial.
function loadTikTokPixel(pixelId: string): void {
  const win = trackingWindow();
  win.TiktokAnalyticsObject = 'ttq';
  const queue = (win.ttq ?? []) as unknown as TiktokQueue;
  const methods = [
    'page',
    'track',
    'identify',
    'instances',
    'debug',
    'on',
    'off',
    'once',
    'ready',
    'alias',
    'group',
    'enableCookie',
    'disableCookie',
  ];
  queue.methods = methods;
  queue.setAndDefer = (target, method) => {
    target[method] = (...args: unknown[]) => {
      target.push([method, ...args]);
    };
  };
  for (const method of methods) queue.setAndDefer(queue, method);
  queue.defer = true;
  queue.load = (id: string) => {
    const url = 'https://analytics.tiktok.com/i18n/pixel/events.js';
    queue._i = queue._i || {};
    queue._i[id] = { id, url, pixel_id: id, ss: null };
    // El pixel real reemplaza `load` para no inyectar dos veces.
    queue.load = () => {};
    const script = document.createElement('script');
    script.async = true;
    script.src = url;
    const first = document.getElementsByTagName('script')[0];
    if (first?.parentNode) first.parentNode.insertBefore(script, first);
    else document.head.appendChild(script);
  };
  queue.load(pixelId);
  queue.page();
  win.ttq = queue;
}

/** Meta Pixel + TikTok Pixel. */
function loadAds(): void {
  if (adsLoaded || !activeConfig || typeof document === 'undefined') return;
  adsLoaded = true;
  if (activeConfig.metaPixelId) loadMetaPixel(activeConfig.metaPixelId);
  if (activeConfig.tiktokPixelId) loadTikTokPixel(activeConfig.tiktokPixelId);
}

/** Aplica el estado actual: carga lo que el visitante ya consintió. */
export function applyConsent(): void {
  if (hasConsent('analytics')) loadAnalytics();
  if (hasConsent('ads')) loadAds();
}

/** Traduce el ComplianceType de SecurePrivacy a nuestras dos categorías. */
function pluginCategory(name: unknown): ConsentCategory | null {
  const normalized = String(name || '').toLowerCase();
  if (
    normalized.indexOf('google') !== -1 ||
    normalized.indexOf('analytics') !== -1 ||
    normalized.indexOf('gtag') !== -1
  ) {
    return 'analytics';
  }
  if (
    normalized.indexOf('meta') !== -1 ||
    normalized.indexOf('facebook') !== -1 ||
    normalized.indexOf('instagram') !== -1 ||
    normalized.indexOf('tiktok') !== -1
  ) {
    return 'ads';
  }
  return null;
}

/**
 * Sincroniza con la fuente de verdad de SecurePrivacy (`sp_consent`).
 * Mapping por palabras clave para no depender de los nombres exactos del
 * Scan Report. Solo corre con SecurePrivacy activo.
 */
function syncFromSpConsent(): void {
  if (typeof localStorage === 'undefined') return;
  let raw: unknown = null;
  try {
    raw = JSON.parse(localStorage.getItem('sp_consent') || 'null');
  } catch {
    return;
  }
  if (!Array.isArray(raw)) return;
  const next: ConsentState = {};
  for (const entry of raw) {
    if (!isPlainObject(entry)) continue;
    const prefs =
      Array.isArray(entry.PluginPreferences) && entry.PluginPreferences.length > 0
        ? entry.PluginPreferences
        : [entry];
    for (const pref of prefs) {
      if (!isPlainObject(pref)) continue;
      const category = pluginCategory(pref.ComplianceType);
      if (category && typeof pref.IsBlockEnabled === 'boolean') {
        next[category] = !pref.IsBlockEnabled;
      }
    }
  }
  if (Object.keys(next).length > 0) {
    persistState(next);
    applyConsent();
  }
}

/** ¿La integración de terceros (SecurePrivacy) está habilitada? */
function secureBridgeEnabled(): boolean {
  return activeConfig?.securePrivacy === true;
}

/** Evento del banner PROPIO (siempre instalado: de acá sale el consentimiento). */
function handleBannerSave(evt: Event): void {
  const detail = (evt as CustomEvent<unknown>).detail;
  if (detail !== 'accept' && detail !== 'reject') return;
  if (detail === 'accept') persistState({ analytics: true, ads: true });
  else persistState({ analytics: false, ads: false });
  if (secureBridgeEnabled()) syncFromSpConsent();
  applyConsent();
}

/**
 * Puente con SecurePrivacy: solo se instala cuando hay script ID. Todos estos
 * eventos están muertos si `secureprivacyScriptId === ''`.
 */
function installSecurePrivacyBridge(): void {
  window.addEventListener('sp_cookie_banner_click', handleBannerSave);
  // Desbloqueo granular: trae el ComplianceType real (con espacios), no
  // depende de los nombres del Scan Report.
  window.addEventListener('sp_spab_unblock', (evt) => {
    const detail = (evt as CustomEvent<{ pluginName?: unknown }>).detail;
    const category = pluginCategory(detail?.pluginName);
    if (!category) return;
    persistState({ [category]: true });
    applyConsent();
  });
  // Secundario: sp_unblock_<Servicio> (nombre del Scan Report con `_`).
  window.addEventListener('sp_unblock_Google_Analytics', () => {
    persistState({ analytics: true });
    applyConsent();
  });
  window.addEventListener('sp_unblock_Meta_Pixel', () => {
    persistState({ ads: true });
    applyConsent();
  });
  window.addEventListener('sp_unblock_Facebook_Pixel', () => {
    persistState({ ads: true });
    applyConsent();
  });
  window.addEventListener('sp_unblock_TikTok', () => {
    persistState({ ads: true });
    applyConsent();
  });
  // Reaplica la decisión de SecurePrivacy (si existe de otra sesión).
  syncFromSpConsent();
}

/**
 * Arranque único. El ClientRouter puede re-ejecutar el módulo: el guard de
 * `window` evita listeners y cargas duplicadas.
 */
export function initConsent(config: ConsentConfig): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  if (window.__ATZ_CONSENT_INIT) return;
  activeConfig = config;
  state = readState(config.consentKey);
  window.__hasConsent = hasConsent;
  // El banner propio siempre; los eventos de terceros solo con SecurePrivacy.
  window.addEventListener('sp_cookie_banner_save', handleBannerSave);
  if (config.securePrivacy) installSecurePrivacyBridge();
  applyConsent();
  // El guard se marca recién cuando el arranque terminó: si `readState` o los
  // listeners lanzan, un reintento (otra página/evento) puede volver a correr.
  window.__ATZ_CONSENT_INIT = true;
}
