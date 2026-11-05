/** Lógica pura del filtrado del catálogo (sin DOM, testeable). */

import type { Perfume, PerfumeSize } from '@/data/types';
import { DECANT_ML, primarySize } from '@/utils/stock';

const GENDERS: Record<string, string[]> = {
  masculino: ['masculino', 'unisex'],
  femenino: ['femenino', 'unisex'],
  unisex: ['unisex'],
};

/** Normaliza el filtro que viene en la URL; lo desconocido es 'all'. */
export function normalizeFilter(raw: string | null): string {
  const value = raw || 'all';
  return Object.hasOwn(GENDERS, value) ? value : 'all';
}

/** Si un perfume de cierto género pasa el filtro (unisex pasa en ambos). */
export function genderMatches(gender: string, filter: string): boolean {
  if (filter === 'all') return true;
  const allowed = GENDERS[filter] || [];
  return allowed.includes(gender);
}

export interface CardMatchInput {
  gender: string;
  searchText: string;
  perfumeId: string;
  filter: string;
  query: string;
  fuzzyIds: Set<string> | null;
}

/**
 * Decisión de visibilidad de una card: primero género, después búsqueda
 * (match difuso por ID si hay índice, si no substring insensible a caso).
 */
export function cardMatches(input: CardMatchInput): boolean {
  if (!genderMatches(input.gender, input.filter)) return false;
  if (!input.query) return true;
  if (input.fuzzyIds) return input.fuzzyIds.has(input.perfumeId);
  return input.searchText.includes(input.query.toLowerCase());
}

/**
 * Talle que corresponde a cada modo del catálogo.
 * - `decants`: el decant de 5 ml (con `primarySize` como fallback).
 * - `frascos`: el frasco original de 90/100 ml; si hay varios, el de mayor ml.
 * Devuelve `undefined` si el perfume no tiene talle para ese modo.
 */
export function sizeForMode(perfume: Perfume, mode: 'decants' | 'frascos'): PerfumeSize | undefined {
  if (mode === 'decants') {
    return perfume.sizes.find((s) => s.ml === DECANT_ML) || primarySize(perfume);
  }
  const bottles = perfume.sizes.filter((s) => s.ml >= 90);
  if (bottles.length === 0) return undefined;
  return bottles.reduce((max, size) => (size.ml > max.ml ? size : max));
}

/**
 * Perfumes que tienen talle para el modo, ordenados por nombre (es).
 * Los frascos sin stock se incluyen: la card los muestra con chip SIN STOCK.
 */
export function perfumesForMode(perfumes: Perfume[], mode: 'decants' | 'frascos'): Perfume[] {
  return perfumes
    .filter((perfume) => sizeForMode(perfume, mode) !== undefined)
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name, 'es'));
}

/** Texto del contador ("3 perfumes encontrados en femenino para ..."). */
export function buildResultsText(visible: number, filter: string, search: string): string {
  let text = `${visible} ${visible === 1 ? 'perfume' : 'perfumes'} encontrado${visible !== 1 ? 's' : ''}`;
  if (filter !== 'all') text += ` en ${filter}`;
  if (search) text += ` para "${search}"`;
  return text;
}

/**
 * Búsqueda difusa simple (sin deps) para <100 items.
 * Devuelve los IDs que matchean por subsequencia ordenada (fuzzy match ligero).
 */
export function fuzzySearchIds(
  index: { id: string; text: string }[],
  query: string
): Set<string> {
  const q = query.toLowerCase();
  const ids = new Set<string>();
  for (const item of index) {
    const t = item.text.toLowerCase();
    let qi = 0;
    for (let ti = 0; ti < t.length && qi < q.length; ti++) {
      if (t[ti] === q[qi]) qi++;
    }
    if (qi === q.length) ids.add(item.id);
  }
  return ids;
}
