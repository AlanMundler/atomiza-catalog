import { describe, it, expect } from 'vitest';
import { cartContentHtml, cartEmptyHtml, itemHtml, showToast } from '@/utils/cart-ui';
import { resolveCartItems } from '@/utils/formatters';
import type { CartItem, Perfume } from '@/data/types';

function makePerfume(id: string, price = 6000, stock = 10): Perfume {
  return {
    id,
    slug: id,
    brand: 'Maison Alhambra',
    name: id,
    gender: 'unisex',
    olfactoryFamily: 'Oriental',
    description: 'Test.',
    notes: { top: [], heart: [], base: [] },
    images: [{ src: 'images/perfumes/test.avif', alt: 'Test' }],
    sizes: [{ ml: 5, price, stock }],
    isBoutiqueExclusive: false,
    featured: false,
  };
}

const map = new Map([
  ['a', makePerfume('a')],
  ['sin-stock', makePerfume('sin-stock', 6000, 0)],
]);

function item(id: string, quantity = 1): CartItem {
  return { perfumeId: id, size: { ml: 5, price: 6000, stock: 10 }, quantity };
}

describe('cartEmptyHtml', () => {
  it('muestra el estado vacío con salida al catálogo', () => {
    const html = cartEmptyHtml();
    expect(html).toContain('Tu carrito está vacío');
    expect(html).toContain('catalogo/');
  });
});

describe('cartContentHtml', () => {
  it('muestra subtotal, descuento y total neto con 3 decants', () => {
    const html = cartContentHtml([item('a', 2), item('a', 1)], map);
    expect(html).toContain('Subtotal');
    expect(html).toContain('$18.000');
    expect(html).toContain('Descuento tridente');
    expect(html).toContain('−$2.000');
    expect(html).toContain('data-cart-total');
    expect(html).toContain('$16.000');
  });

  it('no muestra descuento con 2 decants', () => {
    const html = cartContentHtml([item('a', 2)], map);
    expect(html).toContain('Total estimado');
    expect(html).not.toContain('Descuento tridente');
  });

  it('muestra el nudge de progreso con 1 decant', () => {
    const html = cartContentHtml([item('a')], map);
    expect(html).toContain('Te faltan 2');
    expect(html).toContain('catalogo/');
    expect(html).toContain('<i class="on"></i>');
  });

  it('muestra el nudge listo sin link con 3 decants', () => {
    const html = cartContentHtml([item('a', 3)], map);
    expect(html).toContain('1 tridente:');
    expect(html).not.toContain('<a class="trident-nudge"');
  });

  it('marca sin stock y excluye del total', () => {
    const html = cartContentHtml([item('sin-stock')], map);
    expect(html).toContain('SIN STOCK');
    expect(html).toContain('sin stock y no se incluye en el total');
  });
});

describe('itemHtml', () => {
  it('escapa HTML malicioso de los datos del carrito', () => {
    const evil = item('"><img src=x onerror="1">', 1);
    const resolved = resolveCartItems([evil], new Map());
    const html = itemHtml(resolved[0]);
    expect(html).not.toContain('<img src=x');
    expect(html).toContain('&lt;img src=x');
  });
});

describe('showToast', () => {
  it('crea un toast anunciable y reemplaza el anterior', () => {
    showToast('Error uno');
    showToast('Error dos');
    const toasts = document.querySelectorAll('.cart-toast');
    expect(toasts).toHaveLength(1);
    expect(toasts[0].getAttribute('role')).toBe('status');
    expect(toasts[0].textContent).toBe('Error dos');
  });
});
