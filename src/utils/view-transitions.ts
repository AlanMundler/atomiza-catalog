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
  // (evento `load`) y en cada navegación por vista de transición. Ejecutar
  // `cb` también de forma inmediata duplicaría el callback en la primera
  // carga, por eso acá solo se registra el listener.
  const hasClientRouter = !!document.querySelector(
    'meta[name="astro-view-transitions-enabled"]'
  );

  if (hasClientRouter) {
    document.addEventListener('astro:page-load', run);
    return;
  }

  if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', run);
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
