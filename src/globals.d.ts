/**
 * Banderas internas sobre window/elementos (guards de single-init,
 * single-bind y generaciones de navegación de view-transitions).
 * Centralizadas acá para no regar `as any` por el código: cada uso
 * queda tipado y con autocompletado.
 */
declare global {
  interface Window {
    /** Generación de navegación actual (sube en cada astro:before-swap). */
    __vtlGen?: number;
    __vtlGenInit?: boolean;
    /** Intervalo de rotación de la tira de promociones (home). */
    __atzPromoRot?: number;
    /** Llaves `__vtl:<nombre>` de onPageLoad ya registrados. */
    [key: `__vtl:${string}`]: boolean | number | undefined;
    /** Llaves `__vtw:<nombre>` de onWindowOnce ya registrados. */
    [key: `__vtw:${string}`]: boolean | undefined;
  }

  interface Element {
    /** El elemento ya tiene su listener (bindOnce). */
    __vtBound?: boolean;
    /** El grid del home ya se mezcló en esta vista. */
    __vtShuffled?: boolean;
    /** Helpers del modal guardados para dispararlos desde afuera. */
    _modalOpen?: () => void;
    _modalClose?: () => void;
  }

  /** Contador de ids de modales sin `id` explícito (determinista por build). */
  // eslint-disable-next-line no-var
  var __atzModalSeq: number | undefined;
}

export {};
