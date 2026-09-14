import { describe, it, expect, beforeAll } from 'vitest';
import { initQuickAdd } from '@/utils/quick-add';

function mountCard(attrs = 'data-perfume-id="p1"'): { btn: HTMLElement; root: HTMLElement } {
  // Markup real de ProductCard: wrapper + link estirado + botón hermano
  // (nunca botón dentro del link: es HTML inválido y rompe teclado).
  document.body.innerHTML = `
    <div class="product-card" ${attrs}>
      <a class="product-card-link" href="/producto/p1/">Detalle</a>
      <button type="button" data-quick-add data-size-ml="5" aria-label="Agregar">
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

    expect(ev.defaultPrevented).toBe(true);
    expect(seen).toContainEqual({
      type: 'cart:add',
      detail: { perfumeId: 'p1', sizeMl: 5, quantity: 1 },
    });
    expect(seen).toContainEqual({ type: 'cart:open' });

    window.removeEventListener('cart:add', onAdd);
    window.removeEventListener('cart:open', onOpen);
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
