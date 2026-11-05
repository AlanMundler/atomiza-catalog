/**
 * Piezas mecánicas compartidas por las páginas con búsqueda client-side
 * (catálogo y hub de decants). Sin DOM global al importar: cada función toca
 * el documento recién cuando se la llama, así sobrevive los swaps de View
 * Transitions. El criterio de match de cada página (género, casa, textos de
 * contador, analytics) vive en su propia página o en catalogo.ts / hub.ts;
 * acá solo queda lo idéntico en ambas.
 */

import { fuzzySearchIds } from '@/utils/catalogo';

export interface SearchIndexEntry {
  id: string;
  text: string;
}

/** `?search=` de la URL actual ('' si no está). */
export function readSearchFromUrl(): string {
  return new URL(window.location.href).searchParams.get('search') || '';
}

/**
 * Escribe el estado de búsqueda en la URL y la empuja al historial (set o
 * delete de `?search=`). `extraParams` deja a la página sostener sus demás
 * params en la MISMA entrada de historial (el hub pisa o borra `?casa=` en
 * el mismo pushState); `null` borra el param.
 */
export function writeSearchToUrl(
  query: string,
  extraParams: Record<string, string | null> = {}
): void {
  const url = new URL(window.location.href);
  if (query) url.searchParams.set('search', query);
  else url.searchParams.delete('search');
  for (const [name, value] of Object.entries(extraParams)) {
    if (value === null) url.searchParams.delete(name);
    else url.searchParams.set(name, value);
  }
  window.history.pushState({}, '', url);
}

/** Sincroniza el input del buscador con el estado lógico. */
export function syncSearchInput(value: string): void {
  const input = document.querySelector('[data-search-input]') as HTMLInputElement | null;
  if (input && input.value !== value) input.value = value;
}

/**
 * Índice de búsqueda inline (`<script type="application/json" id="...">`).
 * Parseo defensivo: JSON corrupto o ausente es simplemente "no hay índice".
 */
export function readSearchIndex(scriptId: string): SearchIndexEntry[] {
  const el = document.getElementById(scriptId);
  try {
    const data: unknown = JSON.parse(el?.textContent || '[]');
    return Array.isArray(data) ? (data as SearchIndexEntry[]) : [];
  } catch {
    return [];
  }
}

/**
 * Índice construido desde los atributos data-* de las cards: la fuente única
 * cuando el texto de búsqueda ya viaja en cada card (hub de decants).
 */
export function buildCardIndex(
  cards: readonly HTMLElement[],
  idAttr: string,
  textAttr: string
): SearchIndexEntry[] {
  return cards.map((card) => ({
    id: card.getAttribute(idAttr) || '',
    text: card.getAttribute(textAttr) || '',
  }));
}

/**
 * Set de matches difusos para el query actual (null = sin query, el filtro
 * literal de la página decide). Es sincrónico: el token anti-race de las
 * versiones anteriores solo existía por el `await` innecesario.
 */
export function createFuzzyMatches(
  index: readonly SearchIndexEntry[],
  query: string
): Set<string> | null {
  if (!query) return null;
  // Si hay coincidencia literal, manda el literal: el fuzzy de subsequencia es
  // muy permisivo ("ajwad" también matchea "club-de-nuit-untold"). `null` hace
  // que `cardMatches` use el `includes` del texto de cada card.
  const q = query.toLowerCase();
  if (index.some((entry) => entry.text.toLowerCase().includes(q))) return null;
  return fuzzySearchIds([...index], query);
}

/**
 * Aplica el criterio de visibilidad de la página a cada card (display
 * none/'') y devuelve cuántas quedaron visibles. El criterio lo aporta la
 * página (género en el catálogo, casa + búsqueda en el hub); acá solo el
 * loop de display y el conteo.
 */
export function applyCardVisibility(
  cards: readonly HTMLElement[],
  isVisible: (card: HTMLElement) => boolean
): number {
  let visible = 0;
  cards.forEach((card) => {
    const ok = isVisible(card);
    card.style.display = ok ? '' : 'none';
    if (ok) visible++;
  });
  return visible;
}

/** Texto del contador de resultados, si el elemento existe. */
export function setResultsCount(el: Element | null, text: string): void {
  if (el) el.textContent = text;
}

/**
 * Estado vacío: muestra el empty state y oculta la grilla solo cuando no hay
 * resultados visibles (0); con resultados, lo inverso.
 */
export function setEmptyState(grid: Element | null, empty: Element | null, visible: number): void {
  if (!grid || !empty) return;
  (empty as HTMLElement).hidden = visible !== 0;
  (grid as HTMLElement).style.display = visible === 0 ? 'none' : '';
}

/**
 * Guarda contra View Transitions: los listeners de búsqueda viven en `window`
 * durante toda la sesión (`onWindowOnce`), así que tras navegar entre páginas
 * que comparten el buscador quedan ambos vivos y una tecla dispararía los dos.
 * Cada página marca un root propio (p. ej. `[data-catalog-page]`) y el handler
 * ajeno sale temprano con esta función: no-op en la página que no es la suya.
 */
export function isPageActive(rootSelector: string): boolean {
  return document.querySelector(rootSelector) !== null;
}
