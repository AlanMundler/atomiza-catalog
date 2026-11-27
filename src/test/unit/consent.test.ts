import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { MockInstance } from 'vitest';
import type { ConsentConfig } from '@/utils/consent';

const CONSENT_KEY = 'atomiza-consent';

// `initConsent` instala listeners en `window` y el guard de idempotencia se
// borra entre tests: hay que desinstalarlos a mano para no acumular módulos.
type InstalledListener = { type: string; handler: EventListenerOrEventListenerObject };
const installed: InstalledListener[] = [];
const nativeAddEventListener = window.addEventListener.bind(window);
let addSpy: MockInstance<typeof window.addEventListener>;

function makeConfig(overrides: Partial<ConsentConfig> = {}): ConsentConfig {
  return {
    consentKey: CONSENT_KEY,
    gaId: 'G-TEST123',
    metaPixelId: 'META-TEST',
    tiktokPixelId: 'TIKTOK-TEST',
    securePrivacy: false,
    ...overrides,
  };
}

/** Carga una copia fresca del módulo (estado y flags de carga limpios). */
async function loadConsentModule(): Promise<typeof import('@/utils/consent')> {
  vi.resetModules();
  return import('@/utils/consent');
}

function gaScripts(): HTMLScriptElement[] {
  return Array.from(document.scripts).filter((s) => s.src.includes('googletagmanager.com/gtag/js'));
}

function readPersisted(): unknown {
  return JSON.parse(localStorage.getItem(CONSENT_KEY) || 'null');
}

function dispatchBanner(detail: 'accept' | 'reject'): void {
  window.dispatchEvent(new CustomEvent('sp_cookie_banner_save', { detail }));
}

beforeEach(() => {
  installed.length = 0;
  addSpy = vi
    .spyOn(window, 'addEventListener')
    .mockImplementation((type: string, handler: EventListenerOrEventListenerObject) => {
      installed.push({ type, handler });
      nativeAddEventListener(type, handler);
    });
  localStorage.clear();
  delete window.__ATZ_CONSENT_INIT;
  delete window.__hasConsent;
  const win = window as unknown as Record<string, unknown>;
  delete win.gtag;
  delete win.dataLayer;
  delete win.fbq;
  delete win._fbq;
  delete win.ttq;
  delete win.TiktokAnalyticsObject;
  document.head.querySelectorAll('script').forEach((s) => s.remove());
});

afterEach(() => {
  for (const { type, handler } of installed) window.removeEventListener(type, handler);
  addSpy.mockRestore();
  vi.restoreAllMocks();
});

describe('consent', () => {
  it('sin decisión guardada no carga nada y reporta false', async () => {
    const { initConsent } = await loadConsentModule();
    initConsent(makeConfig());

    expect(window.__hasConsent?.('analytics')).toBe(false);
    expect(window.__hasConsent?.('ads')).toBe(false);
    expect(window.gtag).toBeUndefined();
    expect((window as unknown as Record<string, unknown>).dataLayer).toBeUndefined();
    expect(document.scripts).toHaveLength(0);
    expect(readPersisted()).toBeNull();
  });

  it('aceptar desde el banner propio persiste y carga GA', async () => {
    const { initConsent } = await loadConsentModule();
    initConsent(makeConfig());

    dispatchBanner('accept');

    expect(readPersisted()).toEqual({ analytics: true, ads: true });
    expect(window.__hasConsent?.('analytics')).toBe(true);
    expect(window.__hasConsent?.('ads')).toBe(true);
    expect(gaScripts()).toHaveLength(1);
  });

  it('revisit con consentimiento guardado carga los trackers al init', async () => {
    localStorage.setItem(CONSENT_KEY, JSON.stringify({ analytics: true, ads: true }));
    const { initConsent } = await loadConsentModule();
    initConsent(makeConfig());

    expect(window.__hasConsent?.('analytics')).toBe(true);
    expect(window.__hasConsent?.('ads')).toBe(true);

    // GA: gtag + script de googletagmanager.
    expect(typeof window.gtag).toBe('function');
    expect(gaScripts()).toHaveLength(1);

    // Meta: fbq + script de facebook.
    expect(typeof window.fbq).toBe('function');
    expect(Array.from(document.scripts).some((s) => s.src.includes('connect.facebook.net'))).toBe(true);

    // TikTok: ttq + script de analytics.tiktok.com.
    expect(window.ttq).toBeDefined();
    expect(Array.from(document.scripts).some((s) => s.src.includes('analytics.tiktok.com'))).toBe(true);
  });

  it('rechazar desde el banner propio persiste false y no carga scripts', async () => {
    const { initConsent } = await loadConsentModule();
    initConsent(makeConfig());

    dispatchBanner('reject');

    expect(readPersisted()).toEqual({ analytics: false, ads: false });
    expect(window.__hasConsent?.('analytics')).toBe(false);
    expect(document.scripts).toHaveLength(0);
  });

  it('initConsent dos veces + accept ejecuta el loader una sola vez', async () => {
    const { initConsent } = await loadConsentModule();
    const appendSpy = vi.spyOn(document.head, 'appendChild');

    initConsent(makeConfig());
    initConsent(makeConfig());
    dispatchBanner('accept');

    expect(appendSpy).toHaveBeenCalledTimes(1);
    expect(gaScripts()).toHaveLength(1);
  });

  it('con SecurePrivacy desactivado ignora sp_spab_unblock', async () => {
    const { initConsent } = await loadConsentModule();
    initConsent(makeConfig({ securePrivacy: false }));

    window.dispatchEvent(
      new CustomEvent('sp_spab_unblock', { detail: { pluginName: 'Google Analytics' } })
    );

    expect(readPersisted()).toBeNull();
    expect(window.__hasConsent?.('analytics')).toBe(false);
    expect(document.scripts).toHaveLength(0);
  });

  it('con SecurePrivacy activado sp_spab_unblock habilita analytics', async () => {
    const { initConsent } = await loadConsentModule();
    initConsent(makeConfig({ securePrivacy: true, gaId: '' }));

    window.dispatchEvent(
      new CustomEvent('sp_spab_unblock', { detail: { pluginName: 'Google Analytics' } })
    );

    expect(readPersisted()).toEqual({ analytics: true });
    expect(window.__hasConsent?.('analytics')).toBe(true);
  });
});
