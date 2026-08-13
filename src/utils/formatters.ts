import type { CartItem, Perfume } from '@/data/types';

export function formatPrice(price: number): string {
  if (price === 0) return '$0';
  return '$' + price.toLocaleString('es-AR');
}

export function generateInstagramOrderText(
  items: CartItem[],
  perfumesMap: Map<string, Perfume>,
  customerName: string,
  customerContact: string
): string {
  const lines: string[] = [
    '📦 NUEVO PEDIDO - ATOMIZA',
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

  lines.push('', `💰 TOTAL: ${formatPrice(total)}`, '', '📍 Envío: [A coordinar]', '💳 Pago: [Transferencia / Efectivo / A coordinar]', '', '—', 'Enviar a @atomiza.cba por Instagram DM');

  return lines.join('\n');
}