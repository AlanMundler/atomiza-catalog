/**
 * Lógica del layering (combinar dos perfumes). Sin DOM: se puede testear y
 * reusar tanto en build como en el cliente.
 *
 * No es química: son heurísticas de perfumistas y comunidad, en este orden:
 * 1) roles complementarios (un ancla densa + un acento liviano),
 * 2) notas en común (la "nota puente" que cose la mezcla),
 * 3) evitar dos fragancias densas al mismo tiempo.
 */
import type { Perfume } from '@/data/types';
import { layeringCombos, type LayeringCombo } from '@/data/layering';
import { DECANT_ML } from '@/utils/stock';

export type LayeringRole = 'ancla' | 'acento' | 'puente';

/** Familias que funcionan como base: dan estructura y permanencia. */
const ANCHOR_FAMILIES =
  /(amader|oud|ambar|oriental|dulce|vainilla|cuero|especiad|gourmand|fougere|chipre|praline|avainillad)/i;

/** Familias que funcionan como acento: aportan brillo y frescura. */
const ACCENT_FAMILIES = /(citric|aromatic|acuatic|fresco|floral|frutal|verde|marin)/i;

const normalize = (value: string): string =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

export function perfumeNotes(perfume: Perfume): string[] {
  return [...perfume.notes.top, ...perfume.notes.heart, ...perfume.notes.base];
}

/**
 * Rol sugerido. "puente" es para las familias que sirven de las dos cosas
 * (sobre todo almizcle): las tratamos como comodín.
 */
export function layeringRole(perfume: Perfume): LayeringRole {
  const family = perfume.olfactoryFamily;
  const anchor = ANCHOR_FAMILIES.test(family);
  const accent = ACCENT_FAMILIES.test(family);
  if (anchor && !accent) return 'ancla';
  if (accent && !anchor) return 'acento';
  if (anchor && accent) return 'puente';
  return 'puente';
}

/** Notas compartidas (sin tildes ni mayúsculas), en el orden del primer perfume. */
export function sharedNotes(a: Perfume, b: Perfume): string[] {
  const other = new Set(perfumeNotes(b).map(normalize));
  return [...new Set(perfumeNotes(a).filter((note) => other.has(normalize(note))))];
}

export type AffinityVerdict = 'fuerte' | 'buena' | 'cuidado';

export interface LayeringAffinity {
  score: number;
  verdict: AffinityVerdict;
  shared: string[];
  anchor: Perfume;
  accent: Perfume;
  /** Proporción sugerida en sprays, lista para mostrar. */
  ratio: string;
  /** Explicación corta del resultado. */
  reason: string;
}

/** Ordena el par: primero el que va abajo (ancla o puente). */
function orderPair(a: Perfume, b: Perfume): [Perfume, Perfume] {
  const rank: Record<LayeringRole, number> = { ancla: 0, puente: 1, acento: 2 };
  return rank[layeringRole(a)] <= rank[layeringRole(b)] ? [a, b] : [b, a];
}

export function layeringAffinity(a: Perfume, b: Perfume): LayeringAffinity {
  const [anchor, accent] = orderPair(a, b);
  const shared = sharedNotes(anchor, accent);
  const roleA = layeringRole(anchor);
  const roleB = layeringRole(accent);

  let score = Math.min(shared.length, 3) * 2;
  if (roleA === 'ancla' && roleB === 'acento') score += 4;
  else if (roleA === 'puente' || roleB === 'puente') score += 2;
  if (anchor.olfactoryFamily === accent.olfactoryFamily) score -= 2;
  if (roleA === 'ancla' && roleB === 'ancla') score -= 3;

  const verdict: AffinityVerdict = score >= 8 ? 'fuerte' : score >= 4 ? 'buena' : 'cuidado';

  let ratio: string;
  if (roleA === 'ancla' && roleB === 'acento') ratio = `2 sprays de ${anchor.name} + 1 de ${accent.name}`;
  else if (roleA === 'ancla' && roleB === 'ancla') ratio = `1 spray de cada uno (son potentes: no dupliques la dosis)`;
  else ratio = `1 spray de cada uno, sobre crema neutra`;

  const bridge = shared.length
    ? `Comparten ${shared.slice(0, 3).join(', ').toLowerCase()}: esa nota es la que hace que se lean como un solo perfume.`
    : 'No comparten notas obvias: probalos primero en papel secante antes de la piel.';

  const reason =
    verdict === 'fuerte'
      ? `Un ancla y un acento con nota puente. ${bridge}`
      : verdict === 'buena'
        ? `Pueden funcionar, pero los roles no son ideales. ${bridge}`
        : `Los dos son densos o del mismo tipo: pueden anularse. ${bridge}`;

  return { score, verdict, shared, anchor, accent, ratio, reason };
}

/** Etiqueta de rol para mostrar en la ficha o en la página. */
export function roleLabel(role: LayeringRole): string {
  return role === 'ancla' ? 'Ideal como base' : role === 'acento' ? 'Ideal como acento' : 'Comodín (sirve de base o acento)';
}

/** Precio del decant de 5 ml. `null` si el perfume no tiene ese talle. */
export function decantPrice(perfume: Perfume): number | null {
  const size = perfume.sizes.find((s) => s.ml === DECANT_ML);
  return size ? size.price : null;
}

/** true si el perfume tiene el decant de 5 ml con stock disponible. */
export function decantAvailable(perfume: Perfume): boolean {
  const size = perfume.sizes.find((s) => s.ml === DECANT_ML);
  return (size?.stock ?? 0) > 0;
}

/** Precio del par en decants de 5 ml. `null` si falta el talle en alguno. */
export function pairPrice(a: Perfume, b: Perfume): number | null {
  const pa = decantPrice(a);
  const pb = decantPrice(b);
  return pa === null || pb === null ? null : pa + pb;
}

/**
 * Combos curados que se pueden ofrecer hoy: ambos perfumes existen en el
 * catálogo y tienen stock del decant de 5 ml. El orden del dato se conserva
 * (la primera es la combo estrella de la home de la guía).
 */
export function availableLayeringCombos(perfumes: Perfume[]): LayeringCombo[] {
  const byId = new Map(perfumes.map((p) => [p.id, p]));
  return layeringCombos.filter((combo) =>
    [combo.anchorSlug, combo.accentSlug].every((id) => {
      const perfume = byId.get(id);
      return perfume !== undefined && decantAvailable(perfume);
    })
  );
}
