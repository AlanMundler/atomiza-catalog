const onPageLoadKey = (key: string): `__vtl:${string}` => `__vtl:${key}`;
const onWindowOnceKey = (key: string): `__vtw:${string}` => `__vtw:${key}`;

/**
 * Run `cb` after the current page renders and after every Astro view
 * transition navigation. Guards against double registration if the
 * module is re-executed by the client router.
 */
/**
 * Generación de navegación: se incrementa en cada `astro:before-swap`.
 * Sirve para que `run` corra una sola vez por página vista aunque la carga
 * inicial dispare tanto `DOMContentLoaded` como `astro:page-load`.
 */
function currentGeneration(): number {
  return window.__vtlGen ?? 0;
}

if (typeof window !== 'undefined' && !window.__vtlGenInit) {
  window.__vtlGenInit = true;
  window.__vtlGen = 0;
  document.addEventListener('astro:before-swap', () => {
    window.__vtlGen = currentGeneration() + 1;
  });
}

export function onPageLoad(key: string, cb: () => void): void {
  if (typeof window === 'undefined') return;
  const registeredKey = onPageLoadKey(key);
  if (window[registeredKey]) return;
  window[registeredKey] = true;

  // Misma página vista = misma generación: el segundo disparo (carga inicial
  // con ClientRouter dispara `astro:page-load` + `DOMContentLoaded`) se
  // ignora para no duplicar analytics ni renders. Cada navegación sube la
  // generación y el callback vuelve a correr una vez.
  const runKey: `__vtl:${string}` = `${registeredKey}:ran`;
  const run = () => {
    if (window[runKey] === currentGeneration()) return;
    window[runKey] = currentGeneration();
    cb();
  };

  // Con ClientRouter, `astro:page-load` se dispara en la carga inicial
  // (evento `load`) y en cada navegación por vista de transición, y es lo
  // que permite re-inicializar los handlers tras el swap de la página nueva.
  // Se mantiene además el arranque en DOMContentLoaded como respaldo: si el
  // bundle del router no llega a ejecutarse (WebViews embebidos antiguos),
  // el callback igual corre en la carga inicial.
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
  if (window[registeredKey]) return;
  window[registeredKey] = true;

  window.addEventListener(type, cb, options);
}

/**
 * Attach a listener to a DOM element only if that exact element has not
 * been bound yet. Idempotent across duplicate page-load callbacks.
 */
export function bindOnce<T extends Element>(el: T, cb: (el: T) => void): void {
  if (el.__vtBound) return;
  el.__vtBound = true;
  cb(el);
}
