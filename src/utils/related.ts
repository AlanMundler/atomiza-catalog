import type { Perfume } from '@/data/types';
import { isSizeAvailable, primarySize } from '@/utils/stock';

/** Cuántas cards muestra la ficha en "Podría interesarte". */
export const RELATED_COUNT = 4;

function normalizar(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function allNotes(p: Perfume): Set<string> {
  return new Set([...p.notes.top, ...p.notes.heart, ...p.notes.base].map(normalizar));
}

function gendersCompatible(a: Perfume['gender'], b: Perfume['gender']): boolean {
  return a === b || a === 'unisex' || b === 'unisex';
}

/**
 * Afinidad entre la ficha actual y un candidato: misma familia pesa
 * más que el género, las notas compartidas desempatan y el stock
 * disponible evita sugerir decants agotados primero.
 */
export function relatedScore(current: Perfume, candidate: Perfume): number {
  let score = 0;
  if (candidate.olfactoryFamily === current.olfactoryFamily) score += 3;
  const currentNotes = allNotes(current);
  for (const note of allNotes(candidate)) {
    if (currentNotes.has(note)) score += 1;
  }
  if (gendersCompatible(current.gender, candidate.gender)) score += 1;
  const size = primarySize(candidate);
  if (size && isSizeAvailable(size)) score += 1;
  return score;
}

/**
 * Relacionados para "Podría interesarte": ordenados por afinidad,
 * determinístico (el build estático congela el orden; el desempate
 * es el orden del catálogo). Nunca incluye la ficha actual.
 */
export function getRelated(
  current: Perfume,
  all: readonly Perfume[],
  count: number = RELATED_COUNT
): Perfume[] {
  return all
    .map((p, index) => ({ p, index, score: p.id === current.id ? -1 : relatedScore(current, p) }))
    .filter((r) => r.score >= 0)
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .slice(0, count)
    .map((r) => r.p);
}
