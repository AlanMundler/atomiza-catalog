import { getCart } from '@/utils/cart';
import { getPerfumesMap } from '@/utils/perfumes-client';
import { resolveCartItems, formatPrice } from '@/utils/formatters';
import { TRIDENT_COUNT, tridentesCompletos, descuentoTridente } from '@/utils/trident';

/**
 * Frase de progreso del descuento para la home (modal) y /tridentes/.
 * Una sola fuente: si cambia la regla, cambia en todos lados.
 */
export async function tridenteProgressText(): Promise<string> {
  try {
    const cart = getCart();
    if (cart.items.length === 0) {
      return 'Tu pedido está vacío. Sumá decants y el descuento aparece solo.';
    }
    const resolved = resolveCartItems(cart.items, await getPerfumesMap());
    const count = resolved.filter((r) => r.available).reduce((s, r) => s + r.quantity, 0);
    if (count <= 0) {
      return 'Los decants de tu pedido quedaron sin stock. Elegí otros y listo.';
    }
    const n = tridentesCompletos(count);
    if (n > 0) {
      return `Tenés ${count} decants: ${n} ${n === 1 ? 'tridente aplicado' : 'tridentes aplicados'} (${formatPrice(descuentoTridente(count))} menos).`;
    }
    const missing = TRIDENT_COUNT - count;
    return `Tenés ${count} ${count === 1 ? 'decant' : 'decants'}: te falta${missing === 1 ? '' : 'n'} ${missing} para el descuento.`;
  } catch {
    return 'No pudimos leer tu pedido. Igual el descuento se aplica solo al enviar.';
  }
}
