import { site } from '@/site.config';
import { getPerfumesMap } from '@/utils/perfumes-client';
import { getCart } from '@/utils/cart';
import { resolveCartItems } from '@/utils/formatters';
import type { Perfume } from '@/data/types';

/** Item en el formato estándar de GA4 (enhanced ecommerce). */
export interface Ga4Item {
  item_id: string;
  item_name?: string;
  price?: number;
  quantity?: number;
}

declare global {
  interface Window {
    __hasConsent?: (category: 'analytics' | 'ads') => boolean;
    __ATZ_ANALYTICS_INIT?: boolean;
    gtag?: (...args: any[]) => void;
    fbq?: (...args: any[]) => void;
    ttq?: { track: (event: string, params?: Record<string, unknown>) => void };
  }
}

export function ga4ItemFromPerfume(perfume: Perfume, quantity?: number): Ga4Item {
  const size = perfume.sizes.find((s) => s.ml === 5) || perfume.sizes[0];
  return {
    item_id: perfume.id,
    item_name: `${perfume.brand} ${perfume.name}`,
    price: size?.price,
    quantity,
  };
}

async function buildItem(perfumeId: string): Promise<Ga4Item | null> {
  const perfume = (await getPerfumesMap()).get(perfumeId);
  if (!perfume) return null;
  return ga4ItemFromPerfume(perfume);
}

async function buildItems(ids: string[]): Promise<Ga4Item[]> {
  const out: Ga4Item[] = [];
  for (const id of ids) {
    const item = await buildItem(id);
    if (item) out.push(item);
  }
  return out;
}

async function cartSummary(): Promise<{ items: Ga4Item[]; value: number }> {
  const resolved = resolveCartItems(getCart().items, await getPerfumesMap());
  let value = 0;
  const items: Ga4Item[] = [];
  for (const resolvedItem of resolved) {
    if (!resolvedItem.available) continue;
    items.push({
      item_id: resolvedItem.perfumeId,
      item_name: resolvedItem.perfume ? `${resolvedItem.perfume.brand} ${resolvedItem.perfume.name}` : undefined,
      price: resolvedItem.size.price,
      quantity: resolvedItem.quantity,
    });
    value += resolvedItem.size.price * resolvedItem.quantity;
  }
  return { items, value };
}

function initAnalytics(): void {
  const win = window;
  if (win.__ATZ_ANALYTICS_INIT) return;
  win.__ATZ_ANALYTICS_INIT = true;

  const consent = (category: 'analytics' | 'ads'): boolean =>
    typeof win.__hasConsent === 'function' && win.__hasConsent(category);

  const send = (event: string, params?: Record<string, unknown>): void => {
    if (typeof win.gtag === 'function') win.gtag('event', event, params);
  };

  // Agregar al carrito: add_to_cart (GA4 + Meta + TikTok) con items[]. Se usa
  // el precio del catálogo vivo, nunca un snapshot del evento.
  // OJO: `cart:add` se despacha en `window` (ProductDetail, quiz), y un evento
  // disparado en `window` NO llega a listeners de `document`. Por eso se
  // escucha en `window`.
  win.addEventListener('cart:add', (e) => {
    const detail = (e as CustomEvent<{ perfumeId?: string; quantity?: number }>).detail || {};
    const perfumeId = detail.perfumeId || '';
    if (!perfumeId) return;
    const quantity = Number.isInteger(detail.quantity) ? (detail.quantity as number) : 1;
    void (async () => {
      const item = await buildItem(perfumeId);
      const value = (item?.price ?? 0) * quantity;
      if (consent('analytics') && item) {
        send('add_to_cart', { currency: site.currency, value, items: [{ ...item, quantity }] });
      }
      if (consent('ads')) {
        if (typeof win.fbq === 'function') {
          win.fbq('track', 'AddToCart', { content_ids: [perfumeId], content_type: 'product', value, currency: site.currency });
        }
        if (win.ttq && typeof win.ttq.track === 'function') {
          win.ttq.track('AddToCart', { content_id: perfumeId, content_type: 'product', value, currency: site.currency });
        }
      }
    })();
  });

  // Abrir el carrito: view_cart. Igual que `cart:add`, se despacha en
  // `window`, así que se escucha en `window`.
  win.addEventListener('cart:open', () => {
    if (!consent('analytics')) return;
    void (async () => {
      const { items, value } = await cartSummary();
      if (items.length > 0) send('view_cart', { currency: site.currency, value, items });
    })();
  });

  // Enviar pedido: begin_checkout (GA4) + generate_lead (conversión) +
  // InitiateCheckout (Meta/TikTok). El value ahora es numérico.
  document.addEventListener('click', (e) => {
    const target = e.target;
    if (!target || typeof (target as Element).closest !== 'function') return;
    if (!(target as Element).closest('[data-send-whatsapp],[data-send-instagram]')) return;
    void (async () => {
      const { items, value } = await cartSummary();
      if (consent('analytics')) {
        send('begin_checkout', { currency: site.currency, value, items });
        send('generate_lead', { currency: site.currency, value });
      }
      if (consent('ads')) {
        if (typeof win.fbq === 'function') {
          win.fbq('track', 'InitiateCheckout', {
            content_ids: items.map((i) => i.item_id),
            content_type: 'product',
            value,
            currency: site.currency,
          });
        }
        if (win.ttq && typeof win.ttq.track === 'function') {
          win.ttq.track('InitiateCheckout', { value, currency: site.currency });
        }
      }
    })();
  });

  // Click a cualquier link de WhatsApp: solo se mide la página de origen.
  // NO se envía el `?text=` del link: contiene el nombre y contacto que el
  // cliente escribió en el pedido (PII) y no debe llegar a GA4.
  document.addEventListener('click', (e) => {
    const target = e.target;
    if (!target || typeof (target as Element).closest !== 'function') return;
    const link = (target as Element).closest('a[href*="wa.me"]');
    if (!link) return;
    if (consent('analytics')) send('click_to_whatsapp', { page_path: location.pathname });
    if (consent('ads') && typeof win.fbq === 'function') win.fbq('track', 'Contact');
  });

  // Catálogo: vista de lista.
  document.addEventListener('analytics:view_item_list', (e) => {
    if (!consent('analytics')) return;
    const detail = (e as CustomEvent<{ listName?: string; items?: { item_id?: string }[] }>).detail || {};
    const ids = (detail.items || []).map((i) => i.item_id || '').filter(Boolean);
    void (async () => {
      const items = await buildItems(ids);
      if (items.length > 0) send('view_item_list', { item_list_name: detail.listName || 'catalogo', items });
    })();
  });

  // Despacho explícito de select_item (por ahora no se usa en la app).
  document.addEventListener('analytics:select_item', (e) => {
    if (!consent('analytics')) return;
    const detail = (e as CustomEvent<{ listName?: string; items?: { item_id?: string }[] }>).detail || {};
    const ids = (detail.items || []).map((i) => i.item_id || '').filter(Boolean);
    void (async () => {
      const items = await buildItems(ids);
      if (items.length > 0) send('select_item', { item_list_name: detail.listName || 'catalogo', items });
    })();
  });

  // select_item por delegación global al hacer click en cualquier product-card.
  document.addEventListener('click', (e) => {
    if (!consent('analytics')) return;
    const target = e.target;
    if (!target || typeof (target as Element).closest !== 'function') return;
    const card = (target as Element).closest('.product-card');
    if (!card) return;
    void (async () => {
      const items = await buildItems([card.getAttribute('data-perfume-id') || '']);
      if (items.length > 0) send('select_item', { item_list_name: 'catalogo', items });
    })();
  });

  // Ficha de producto.
  document.addEventListener('analytics:view_item', (e) => {
    if (!consent('analytics')) return;
    const detail = (e as CustomEvent<{ items?: { item_id?: string }[] }>).detail || {};
    const ids = (detail.items || []).map((i) => i.item_id || '').filter(Boolean);
    void (async () => {
      const items = await buildItems(ids);
      if (items.length > 0) send('view_item', { currency: site.currency, items });
    })();
  });

  // Búsqueda. El query lo escribe el usuario y podría contener PII
  // (un nombre o teléfono): se acota a 40 chars y se descartan dígitos,
  // @menciones y + para no mandar datos personales a GA4.
  function sanitizeSearchTerm(query: string): string {
    return query
      .replace(/[\r\n]+/g, ' ')
      .replace(/[@+]/g, '')
      .replace(/\d{4,}/g, '')
      .trim()
      .slice(0, 40);
  }

  document.addEventListener('analytics:search', (e) => {
    if (!consent('analytics')) return;
    const query = sanitizeSearchTerm((e as CustomEvent<{ query?: string }>).detail?.query || '');
    if (query) send('search', { search_term: query });
  });

  // Quiz.
  document.addEventListener('analytics:quiz_start', () => {
    if (consent('analytics')) send('quiz_start');
  });
  document.addEventListener('analytics:quiz_step', (e) => {
    if (!consent('analytics')) return;
    const detail = (e as CustomEvent<{ step?: number; totalSteps?: number }>).detail || {};
    send('quiz_step', { step: detail.step || 0, total_steps: detail.totalSteps || 0 });
  });
  document.addEventListener('analytics:quiz_complete', (e) => {
    if (!consent('analytics')) return;
    const perfumeId = (e as CustomEvent<{ perfumeId?: string }>).detail?.perfumeId || '';
    void (async () => {
      const items = await buildItems([perfumeId]);
      send('quiz_complete', { recommended_perfume: perfumeId, items });
    })();
  });
}

export { initAnalytics };