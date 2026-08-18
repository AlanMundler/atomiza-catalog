import { site } from '@/site.config';
import { formatPrice } from './formatters';

export const TRIDENT_COUNT = 3;
export const TRIDENT_DISCOUNT = 2000;

/** Total del tridente = suma de los 3 precios − $2.000. Devuelve null si no son exactamente 3. */
export function computeTridentTotal(prices: number[]): number | null {
  if (prices.length !== TRIDENT_COUNT) return null;
  if (!prices.every((p) => Number.isFinite(p) && p >= 0)) return null;
  return prices.reduce((acc, p) => acc + p, 0) - TRIDENT_DISCOUNT;
}

export interface TridentLine {
  brand: string;
  name: string;
  price: number;
}

/** Arma el texto del pedido de WhatsApp para un tridente ya completo. */
export function buildTridentOrderText(lines: TridentLine[], total: number): string {
  const detail = lines
    .map((l) => `• ${l.brand} - ${l.name} (5ml) — ${formatPrice(l.price)}`)
    .join('\n');
  return [
    '🧴 QUIERO ARMAR MI TRIDENTE DE DECANTS',
    '',
    detail,
    '',
    `💰 TOTAL DEL TRIDENTE: ${formatPrice(total)} (ahorrás ${formatPrice(TRIDENT_DISCOUNT)})`,
    '',
    '📍 Envío: [A coordinar]',
    '💳 Pago: [Transferencia / Efectivo / A coordinar]',
    '',
    '—',
    `Enviar por WhatsApp a ${site.name} (${site.phoneDisplay})`,
  ].join('\n');
}
