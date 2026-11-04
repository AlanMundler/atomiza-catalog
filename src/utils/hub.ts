/** Lógica pura del buscador del hub de decants (sin DOM, testeable). */

export interface HubCardIndexEntry {
  id: string;
  text: string;
}

/** Texto del contador del hub: "1 aroma" / "N aromas". */
export function buildHubCountText(visible: number): string {
  return `${visible} ${visible === 1 ? 'aroma' : 'aromas'}`;
}

/**
 * IDs de cards visibles para una búsqueda.
 *
 * Primero busca coincidencia literal (substring, insensible a mayúsculas), que
 * es la que espera el usuario al buscar "Aventus", "Creed" o "Club de Nuit".
 * Solo si no hay ninguna coincidencia literal cae al set difuso (typos), para
 * no ensuciar los resultados con matches de subsequencia.
 */
export function hubSearchMatches(
  cards: HubCardIndexEntry[],
  query: string,
  fuzzyIds: Set<string> | null
): Set<string> {
  const q = query.trim().toLowerCase();
  if (!q) return new Set(cards.map((card) => card.id));

  const literal = new Set(
    cards.filter((card) => card.text.toLowerCase().includes(q)).map((card) => card.id)
  );
  if (literal.size > 0 || !fuzzyIds) return literal;
  return fuzzyIds;
}

/** Valor del filtro "sin casa elegida" en la URL (`?casa=` ausente). */
export const HUB_CASA_ALL = 'all';

/**
 * Slug de una casa para el query param `?casa=`: "Parfums de Marly" →
 * "parfums-de-marly". Sin acentos ni símbolos; estable frente a renames
 * de datos porque deriva del nombre visible.
 */
export function hubCasaSlug(casa: string): string {
  return casa
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export interface HubCasa {
  casa: string;
  slug: string;
  count: number;
}

/**
 * Casas únicas con su cantidad de aromas, ordenadas por cantidad desc y
 * luego por nombre (locale 'es'). Alimenta los chips del hub de decants.
 */
export function casasDeInspiraciones(items: ReadonlyArray<{ casa: string }>): HubCasa[] {
  const counts = new Map<string, number>();
  items.forEach((item) => counts.set(item.casa, (counts.get(item.casa) || 0) + 1));
  return [...counts.entries()]
    .map(([casa, count]) => ({ casa, slug: hubCasaSlug(casa), count }))
    .sort((a, b) => b.count - a.count || a.casa.localeCompare(b.casa, 'es'));
}

/**
 * Qué casas muestra la tira sin expandir: las con 3+ aromas. El resto queda
 * detrás del botón "Ver las N casas restantes" (28 casas en una fila son
 * contenido inalcanzable, aunque envuelvan).
 */
export function casasPrincipales(casas: ReadonlyArray<HubCasa>, min = 3): HubCasa[] {
  return casas.filter((c) => c.count >= min);
}

/** Contador con filtro de casa: "12 aromas" / "3 aromas de Creed". */
export function buildHubCountTextWithCasa(visible: number, casa: string | null): string {
  const base = buildHubCountText(visible);
  return casa ? `${base} de ${casa}` : base;
}
