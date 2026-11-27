/**
 * Controlador compartido de las listas con búsqueda client-side (catálogo y
 * hub de decants). Ambas páginas repiten el mismo cableado: escuchar
 * `search:change`/`popstate` una sola vez, releer la URL, sincronizar los
 * controles y pintar las cards. Lo único distinto es el criterio de cada
 * página (género vs casa, textos de contador, analytics), que entra por
 * configuración.
 *
 * Sin esta pieza las dos páginas duplicaban la guarda de View Transitions y
 * cada arreglo (doble handler, índice cacheado) había que hacerlo dos veces.
 */

import { onPageLoad, onWindowOnce } from '@/utils/view-transitions';
import {
  applyCardVisibility,
  createFuzzyMatches,
  isPageActive,
  setEmptyState,
  setResultsCount,
} from '@/utils/search-page';
import type { SearchIndexEntry } from '@/utils/search-page';

export interface ListControllerConfig<S extends { search: string }> {
  /** Clave base para los registros idempotentes de onPageLoad/onWindowOnce. */
  id: string;
  /** Root que marca la página activa frente a View Transitions. */
  rootSelector: string;
  cardSelector: string;
  countSelector: string;
  gridSelector: string;
  emptySelector: string;
  /** Lee el estado propio de la URL (búsqueda + filtro de la página). */
  readState(url: URL): S;
  /** Empuja el estado a la URL conservando los params propios de la página. */
  writeUrl(state: S): void;
  /**
   * Índice de búsqueda difusa. Se relee en cada apply a propósito: el DOM se
   * reemplaza en cada View Transition y cachearlo dejaba sets incompletos
   * (el índice de decants y el de frascos son distintos).
   */
  index(): SearchIndexEntry[];
  /** Criterio de visibilidad de una card, incluida la búsqueda. */
  isVisible(card: HTMLElement, state: S, fuzzyIds: Set<string> | null): boolean;
  /** Texto del contador para la cantidad de cards visibles. */
  countText(visible: number, state: S): string;
  /** Refleja el estado lógico en el input y los chips de la página. */
  syncControls(state: S): void;
  /** Bindings propios (chips, clear, resize); corre en cada page load. */
  bindControls?(controller: ListController<S>): void;
  /**
   * Cálculo caro que conviene resolver una vez por apply y no por card (por
   * ejemplo el set de matches literales del hub). Corre antes de la
   * visibilidad y recibe el índice ya leído para no volver a tocar el DOM.
   */
  beforeApply?(
    state: S,
    fuzzyIds: Set<string> | null,
    index: readonly SearchIndexEntry[]
  ): void;
  /** Efectos posteriores al filtrado (fade del scroller, analytics). */
  afterApply?(visible: number, state: S): void;
  /** Solo cuando la usuaria escribe: analytics de búsqueda, nunca en updates. */
  onSearch?(state: S): void;
  /** Reacción a back/forward, después de re-aplicar (por ejemplo, revelar chip). */
  afterRefresh?(state: S): void;
  /** Resetea estado efímero de UI al entrar (por ejemplo, chips expandidos). */
  onEnter?(): void;
}

export interface ListController<S extends { search: string }> {
  /** onPageLoad: lee la URL, sincroniza, bindea y pinta por primera vez. */
  init(): void;
  /** Merge + URL + sync + apply. Lo usan los chips y "Limpiar filtros". */
  update(patch: Partial<S>): void;
  state(): Readonly<S>;
  /** Relee la URL y re-aplica (popstate). */
  refresh(): void;
}

export function createListController<S extends { search: string }>(
  cfg: ListControllerConfig<S>
): ListController<S> {
  let current = cfg.readState(new URL(window.location.href));
  let started = false;

  function apply(): void {
    // El set difuso se recalcula desde el índice actual en cada apply: el
    // query pudo cambiar por URL o por input y el Set anterior ya no sirve.
    const index = cfg.index();
    const fuzzyIds = createFuzzyMatches(index, current.search);
    cfg.beforeApply?.(current, fuzzyIds, index);

    const cards = Array.from(document.querySelectorAll<HTMLElement>(cfg.cardSelector));
    const visible = applyCardVisibility(cards, (card) =>
      cfg.isVisible(card, current, fuzzyIds)
    );

    setResultsCount(document.querySelector(cfg.countSelector), cfg.countText(visible, current));
    setEmptyState(
      document.querySelector(cfg.gridSelector),
      document.querySelector(cfg.emptySelector),
      visible
    );

    cfg.afterApply?.(visible, current);
  }

  const controller: ListController<S> = {
    init() {
      // Idempotente: el callback de page-load puede repetirse (DOMContentLoaded
      // + astro:page-load) y un segundo init duplicaría binds y analytics.
      if (started) return;
      started = true;

      onWindowOnce(`${cfg.id}-search`, 'search:change', (event) => {
        // Guarda View Transitions: este listener vive en window toda la sesión
        // y, tras navegar a la otra lista con buscador, también escucharía acá.
        if (!isPageActive(cfg.rootSelector)) return;

        const query = (event as CustomEvent<{ query?: string }>).detail?.query || '';
        Object.assign(current, { search: query });
        cfg.writeUrl(current);
        cfg.syncControls(current);
        apply();
        // Después de aplicar: el analytics de búsqueda solo mira el query final.
        cfg.onSearch?.(current);
      });

      onWindowOnce(`${cfg.id}-popstate`, 'popstate', () => {
        if (!isPageActive(cfg.rootSelector)) return;
        controller.refresh();
      });

      onPageLoad(cfg.id, () => {
        cfg.onEnter?.();
        current = cfg.readState(new URL(window.location.href));
        cfg.syncControls(current);
        cfg.bindControls?.(controller);
        apply();
      });
    },
    update(patch) {
      Object.assign(current, patch);
      cfg.writeUrl(current);
      cfg.syncControls(current);
      apply();
    },
    state() {
      return current;
    },
    refresh() {
      current = cfg.readState(new URL(window.location.href));
      cfg.syncControls(current);
      apply();
      cfg.afterRefresh?.(current);
    },
  };

  return controller;
}
