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
