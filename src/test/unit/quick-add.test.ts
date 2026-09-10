import { describe, it, expect, beforeAll } from 'vitest';
import { initQuickAdd } from '@/utils/quick-add';

function mountCard(attrs = 'data-perfume-id="p1"'): { btn: HTMLElement; root: HTMLElement } {
  document.body.innerHTML = `
    <a class="product-card" ${attrs} href="/producto/p1/">
      <button type="button" data-quick-add data-size-ml="5" aria-label="Agregar">
        <span>+</span>
      </button>
    </a>
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
});
