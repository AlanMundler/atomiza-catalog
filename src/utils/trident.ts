import { site } from '@/site.config';
import { formatPrice } from './formatters';

export const TRIDENT_COUNT = 3;
export const TRIDENT_DISCOUNT = 2000;

/** Total del tridente = suma de los 3 precios − descuento. Devuelve null si
 * no son exactamente 3. Nunca negativo aunque el DOM traiga precios raros. */
export function computeTridentTotal(prices: number[]): number | null {
  if (prices.length !== TRIDENT_COUNT) return null;
  if (!prices.every((p) => Number.isFinite(p) && p >= 0)) return null;
  return Math.max(0, prices.reduce((acc, p) => acc + p, 0) - TRIDENT_DISCOUNT);
}

/** Cuántos tridentes completos hay en N decants comprables (3→1, 6→2). */
export function tridentesCompletos(count: number): number {
  if (!Number.isInteger(count) || count < TRIDENT_COUNT) return 0;
  return Math.floor(count / TRIDENT_COUNT);
}

/**
 * Descuento AUTOMÁTICO del carrito sobre decants comprables:
 * 3-5 decants → $2.000 fijos; 6 o más → $1.000 por decant
 * (6→$6.000, 9→$9.000). El cliente no arma nada: se aplica solo.
 */
export const TRIDENT_BULK_PER_DECANT = 1000;

export function descuentoTridente(count: number): number {
  if (!Number.isInteger(count) || count < TRIDENT_COUNT) return 0;
  if (count < TRIDENT_COUNT * 2) return TRIDENT_DISCOUNT;
  return count * TRIDENT_BULK_PER_DECANT;
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
