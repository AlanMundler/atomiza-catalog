import type { CartItem, Perfume } from '@/data/types';
import { site } from '@/site.config';

export function formatPrice(price: number): string {
  if (price === 0) return '$0';
  return '$' + price.toLocaleString('es-AR');
}

export type OrderChannel = 'whatsapp' | 'instagram';

export function generateOrderText(
  items: CartItem[],
  perfumesMap: Map<string, Perfume>,
  customerName: string,
  customerContact: string,
  channel: OrderChannel = 'whatsapp'
): string {
  const lines: string[] = [
    `📦 NUEVO PEDIDO - ${site.name}`,
    '',
    `👤 Cliente: ${customerName}`,
    `📱 Contacto: ${customerContact}`,
    '',
    '🛍️ DETALLE:'
  ];

  let total = 0;

  for (const item of items) {
    const perfume = perfumesMap.get(item.perfumeId);
    if (!perfume) continue;

    const lineTotal = item.size.price * item.quantity;
    total += lineTotal;

    lines.push(
      `• ${perfume.brand} - ${perfume.name} (${item.size.ml}ml) x${item.quantity} — ${formatPrice(lineTotal)}`
    );
  }

  lines.push(
    '',
    `💰 TOTAL: ${formatPrice(total)}`,
    '',
    '📍 Envío: [A coordinar]',
    '💳 Pago: [Transferencia / Efectivo / A coordinar]',
    '',
    '—',
    channel === 'instagram'
      ? `Enviar a @${site.instagramHandle} por Instagram DM`
      : `Enviar por WhatsApp a @${site.instagramHandle}`
  );

  return lines.join('\n');
}

export function buildWhatsAppLink(phone: string, text: string): string {
  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
}
