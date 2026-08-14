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

  window.addEventListener('astro:page-load', cb);

  if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', cb);
  } else {
    cb();
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
