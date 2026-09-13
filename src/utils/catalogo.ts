/** Lógica pura del filtrado del catálogo (sin DOM, testeable). */

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

/** Texto del contador ("3 perfumes encontrados en femenino para ..."). */
export function buildResultsText(visible: number, filter: string, search: string): string {
  let text = `${visible} ${visible === 1 ? 'perfume' : 'perfumes'} encontrado${visible !== 1 ? 's' : ''}`;
  if (filter !== 'all') text += ` en ${filter}`;
  if (search) text += ` para "${search}"`;
  return text;
}

/**
 * Búsqueda difusa con Fuse.js (import dinámico: no va al bundle inicial).
 * Devuelve los IDs que matchean.
 */
export async function fuzzySearchIds(
  index: { id: string; text: string }[],
  query: string
): Promise<Set<string>> {
  const Fuse = (await import('fuse.js')).default;
  const fuse = new Fuse(index, { keys: ['text'], threshold: 0.4, ignoreLocation: true });
  return new Set(fuse.search(query).map((r) => r.item.id));
}
