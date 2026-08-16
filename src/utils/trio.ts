import { site } from '@/site.config';
import { formatPrice } from './formatters';

export const TRIO_COUNT = 3;
export const TRIO_DISCOUNT = 2000;

/** Total del trío = suma de los 3 precios − $2.000. Devuelve null si no son exactamente 3. */
export function computeTrioTotal(prices: number[]): number | null {
  if (prices.length !== TRIO_COUNT) return null;
  if (!prices.every((p) => Number.isFinite(p) && p >= 0)) return null;
  return prices.reduce((acc, p) => acc + p, 0) - TRIO_DISCOUNT;
}

export interface TrioLine {
  brand: string;
  name: string;
  price: number;
}

/** Arma el texto del pedido de WhatsApp para un trío ya completo. */
export function buildTrioOrderText(lines: TrioLine[], total: number): string {
  const detail = lines
    .map((l) => `• ${l.brand} - ${l.name} (5ml) — ${formatPrice(l.price)}`)
    .join('\n');
  return [
    '🧴 QUIERO ARMAR MI TRÍO DE DECANTS',
    '',
    detail,
    '',
    `💰 TOTAL DEL TRÍO: ${formatPrice(total)} (ahorrás ${formatPrice(TRIO_DISCOUNT)})`,
    '',
    '📍 Envío: [A coordinar]',
    '💳 Pago: [Transferencia / Efectivo / A coordinar]',
    '',
    '—',
    `Enviar por WhatsApp a ${site.name} (${site.phoneDisplay})`,
  ].join('\n');
}
