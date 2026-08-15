const onPageLoadKey = (key: string) => `__vtl:${key}`;
const onWindowOnceKey = (key: string) => `__vtw:${key}`;

/**
 * Run `cb` after the current page renders and after every Astro view
 * transition navigation. Guards against double registration if the
 * module is re-executed by the client router.
 */
export function onPageLoad(key: string, cb: () => void): void {
  if (typeof window === 'undefined') return;
  const registeredKey = onPageLoadKey(key);
  if ((window as any)[registeredKey]) return;
  (window as any)[registeredKey] = true;

  const run = () => cb();

  // Con ClientRouter, `astro:page-load` se dispara en la carga inicial
  // (evento `load`) y en cada navegación por vista de transición, y es lo
  // que permite re-inicializar los handlers tras el swap de la página nueva.
  // Se mantiene además el arranque en DOMContentLoaded como respaldo: si el
  // bundle del router no llega a ejecutarse (WebViews embebidos antiguos),
  // el callback igual corre en la carga inicial. `cb` es idempotente vía
  // bindOnce, por eso el doble disparo en la primera carga es inofensivo.
  if (document.querySelector('meta[name="astro-view-transitions-enabled"]')) {
    document.addEventListener('astro:page-load', run);
  }

  if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', run, { once: true });
  } else {
    run();
  }
}

/**
 * Attach a window-level listener exactly once, even if the module
 * re-executes on a later view transition.
 */
export function onWindowOnce(
  key: string,
  type: string,
  cb: EventListener,
  options?: AddEventListenerOptions
): void {
  if (typeof window === 'undefined') return;
  const registeredKey = onWindowOnceKey(key);
  if ((window as any)[registeredKey]) return;
  (window as any)[registeredKey] = true;

  window.addEventListener(type, cb, options);
}

/**
 * Attach a listener to a DOM element only if that exact element has not
 * been bound yet. Idempotent across duplicate page-load callbacks.
 */
export function bindOnce<T extends Element>(el: T, cb: (el: T) => void): void {
  if ((el as any).__vtBound) return;
  (el as any).__vtBound = true;
  cb(el);
}
