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
