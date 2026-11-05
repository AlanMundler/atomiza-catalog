import { describe, it, expect, beforeAll } from 'vitest';
import { initQuickAdd } from '@/utils/quick-add';

function mountCard(attrs = 'data-perfume-id="p1"', sizeMl = 5): { btn: HTMLElement; root: HTMLElement } {
  // Markup real de ProductCard: wrapper + link estirado + botón hermano
  // (nunca botón dentro del link: es HTML inválido y rompe teclado).
  document.body.innerHTML = `
    <div class="product-card" ${attrs}>
      <a class="product-card-link" href="/producto/p1/">Detalle</a>
      <button type="button" data-quick-add data-size-ml="${sizeMl}" aria-label="Agregar">
        <span>+</span>
      </button>
    </div>
  `;
  return {
    btn: document.querySelector('[data-quick-add]') as HTMLElement,
    root: document.body,
  };
}

describe('initQuickAdd', () => {
  beforeAll(() => {
    initQuickAdd();
  });

  it('dispara cart:add con perfume/size y abre el carrito', () => {
    const { btn } = mountCard();
    const seen: { type: string; detail?: unknown }[] = [];
    const onAdd = (e: Event) => seen.push({ type: 'cart:add', detail: (e as CustomEvent).detail });
    const onOpen = () => seen.push({ type: 'cart:open' });
    window.addEventListener('cart:add', onAdd);
    window.addEventListener('cart:open', onOpen);

    const ev = new MouseEvent('click', { bubbles: true, cancelable: true });
    btn.querySelector('span')!.dispatchEvent(ev);

    expect(ev.defaultPrevented).toBe(false);
    expect(seen).toContainEqual({
      type: 'cart:add',
      detail: { perfumeId: 'p1', sizeMl: 5, quantity: 1 },
    });
    expect(seen).toContainEqual({ type: 'cart:open' });

    window.removeEventListener('cart:add', onAdd);
    window.removeEventListener('cart:open', onOpen);
  });

  it('envía el talle de la card cuando es un frasco (100 ml)', () => {
    const { btn } = mountCard('data-perfume-id="p2"', 100);
    const adds: CustomEvent[] = [];
    const onAdd = (e: Event) => adds.push(e as CustomEvent);
    window.addEventListener('cart:add', onAdd);

    btn.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));

    expect(adds).toHaveLength(1);
    expect(adds[0].detail).toEqual({ perfumeId: 'p2', sizeMl: 100, quantity: 1 });

    window.removeEventListener('cart:add', onAdd);
  });

  it('dentro de un link: cancela la navegación del anchor', () => {
    document.body.innerHTML = `
      <a class="product-card" href="/producto/p3/" data-perfume-id="p3">
        <button type="button" data-quick-add data-size-ml="5">+</button>
      </a>
    `;
    const btn = document.querySelector('[data-quick-add]') as HTMLElement;
    const adds: CustomEvent[] = [];
    const onAdd = (e: Event) => adds.push(e as CustomEvent);
    window.addEventListener('cart:add', onAdd);

    const ev = new MouseEvent('click', { bubbles: true, cancelable: true });
    btn.dispatchEvent(ev);

    expect(ev.defaultPrevented).toBe(true);
    expect(adds).toHaveLength(1);

    window.removeEventListener('cart:add', onAdd);
  });

  it('ignora clicks fuera del botón y botones deshabilitados', () => {
    const { btn, root } = mountCard();
    let count = 0;
    const onAdd = () => count++;
    window.addEventListener('cart:add', onAdd);

    root.querySelector('a')!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    btn.setAttribute('disabled', '');
    btn.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(count).toBe(0);

    window.removeEventListener('cart:add', onAdd);
  });

  it('el botón quick-add no vive dentro del link (HTML válido)', () => {
    const { btn } = mountCard();
    expect(btn.closest('a')).toBeNull();
    expect(btn.closest('.product-card')?.getAttribute('data-perfume-id')).toBe('p1');
  });
});
