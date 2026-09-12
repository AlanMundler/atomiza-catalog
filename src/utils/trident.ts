export const TRIDENT_COUNT = 3;
export const TRIDENT_DISCOUNT = 2000;

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
