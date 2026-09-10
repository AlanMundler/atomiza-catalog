declare global {
  interface Window {
    __ATZ_QUICKADD?: boolean;
  }
}

/**
 * Quick-add global: cualquier `[data-quick-add]` dentro de una
 * `.product-card` suma 1 unidad al carrito y abre el drawer, sin salir del
 * grid. Delegación en `document` para cubrir home, catálogo, familias,
 * decants y relacionadas (incluye navegaciones ClientRouter).
 *
 * OJO: se escucha en fase CAPTURA. El ClientRouter registra su listener en
 * burbuja (antes que este módulo) e inicia la navegación SPA al hacer click
 * en la card (que es un `<a>`): en burbuja ya es tarde para frenarlo.
 * `stopPropagation()` en captura impide que el router lo vea y
 * `preventDefault()` cancela la navegación nativa.
 */
export function initQuickAdd(): void {
  if (typeof window === 'undefined') return;
  if (window.__ATZ_QUICKADD) return;
  window.__ATZ_QUICKADD = true;

  document.addEventListener(
    'click',
    (e) => {
      const target = e.target;
      if (!target || typeof (target as Element).closest !== 'function') return;
      const btn = (target as Element).closest('[data-quick-add]');
      if (!btn || !(btn instanceof HTMLElement)) return;
      if (btn.hasAttribute('disabled')) return;
      // Frena la navegación del anchor padre (la card entera es un link)
      // y que el router SPA la procese.
      e.preventDefault();
      e.stopPropagation();
      const card = btn.closest('.product-card');
      const perfumeId = card?.getAttribute('data-perfume-id') || '';
      const sizeMl = parseInt(btn.getAttribute('data-size-ml') || '5', 10);
      if (!perfumeId || !Number.isFinite(sizeMl)) return;
      window.dispatchEvent(
        new CustomEvent('cart:add', { detail: { perfumeId, sizeMl, quantity: 1 } })
      );
      window.dispatchEvent(new CustomEvent('cart:open'));
    },
    true
  );
}
