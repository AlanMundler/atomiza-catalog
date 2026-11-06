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

/** Familias que ya son dulces de por sí: dos juntas empalagan. */
const SWEET_FAMILIES = /(dulce|vainilla|gourmand|praline|avainillad|coco)/i;

/**
 * Pares de familias que se complementan (una aporta densidad y la otra brillo).
 * Sale de la matriz de la guía: dulce+amaderado, cítrico+ámbar, floral+madera,
 * frutal+ámbar, etc. Se evalúa en los dos sentidos.
 */
const COMPLEMENTARY_FAMILIES: Array<[RegExp, RegExp]> = [
  [/(dulce|vainilla|gourmand|praline|avainillad|coco|pera)/i, /(amader|cuero|tabaco|oud|especiad|incienso|oriental|fougere)/i],
  [/(citric|citrica|aromatic|acuatic|verde)/i, /(amader|ambar|oriental|especiad|cuero)/i],
  [/(floral)/i, /(amader|almizcle|ambar|vainilla|cuero)/i],
  [/(frutal)/i, /(ambar|oriental|almizcle|amader|especiad)/i],
];

function complementaryFamilies(a: string, b: string): boolean {
  return COMPLEMENTARY_FAMILIES.some(
    ([left, right]) => (left.test(a) && right.test(b)) || (left.test(b) && right.test(a))
  );
}

export interface LayerinAffinityOptions {
  /**
   * true cuando los dos perfumes son interpretaciones del mismo original
   * (ej. dos dupes de Y EDP). Ahí no hay layering: se duplica el aroma.
   */
  sameOriginal?: boolean;
}

export function layeringAffinity(a: Perfume, b: Perfume, options: LayerinAffinityOptions = {}): LayeringAffinity {
  const [anchor, accent] = orderPair(a, b);
  const shared = sharedNotes(anchor, accent);
  const roleA = layeringRole(anchor);
  const roleB = layeringRole(accent);

  // Puntaje: la nota puente es lo que más suma; los roles definen el ORDEN,
  // no la compatibilidad (cuero + vainilla o oud + piña funcionan aunque los
  // dos sean "densos"). Lo que resta es repetir familia o apilar dos dulces.
  let score = Math.min(shared.length, 3) * 2;
  if (anchor.olfactoryFamily !== accent.olfactoryFamily) score += 2;
  if (roleA === 'ancla' && roleB === 'acento') score += 3;
  else if (roleA === 'ancla' && roleB === 'ancla') score += 1;
  else if (roleA === 'ancla' || roleB === 'ancla') score += 2;
  if (complementaryFamilies(anchor.olfactoryFamily, accent.olfactoryFamily)) score += 2;
  if (SWEET_FAMILIES.test(anchor.olfactoryFamily) && SWEET_FAMILIES.test(accent.olfactoryFamily)) score -= 3;
  if (anchor.olfactoryFamily === accent.olfactoryFamily) score -= 2;
  if (options.sameOriginal) score = Math.min(score, 0);

  const verdict: AffinityVerdict = options.sameOriginal ? 'cuidado' : score >= 8 ? 'fuerte' : score >= 4 ? 'buena' : 'cuidado';

  let ratio: string;
  if (options.sameOriginal) {
    ratio = 'No recomendado: elegí un perfume de otro original';
  } else if (roleA === 'ancla' && roleB === 'acento') {
    ratio = `2 sprays de ${anchor.name} + 1 de ${accent.name}`;
  } else if (roleA === 'ancla' && roleB === 'ancla') {
    ratio = `1 spray de cada uno (son potentes: no dupliques la dosis)`;
  } else {
    ratio = `1 spray de cada uno, sobre crema neutra`;
  }

  const bridge = shared.length
    ? `Comparten ${shared.slice(0, 3).join(', ').toLowerCase()}: esa nota es la que hace que se lean como un solo perfume.`
    : 'No comparten notas obvias: probalos primero en papel secante antes de la piel.';

  const reason = options.sameOriginal
    ? 'Los dos son interpretaciones del mismo perfume original: combinarlos duplica el aroma en vez de crear uno nuevo. Cambiá uno de los dos.'
    : verdict === 'fuerte'
      ? `Un ancla y un acento con nota puente. ${bridge}`
      : verdict === 'buena'
        ? `Pueden funcionar: los roles no son ideales, pero la nota puente sostiene la mezcla. ${bridge}`
        : `Los dos son densos, dulces o del mismo tipo: pueden anularse. ${bridge}`;

  return { score, verdict, shared, anchor, accent, ratio, reason };
}

/** Etiqueta de rol para mostrar en la ficha o en la página. */
export function roleLabel(role: LayeringRole): string {
  return role === 'ancla' ? 'Ideal como base' : role === 'acento' ? 'Ideal como acento' : 'Comodín (sirve de base o acento)';
}

/**
 * Normaliza el nombre de una fragancia original para detectar duplicados:
 * saca concentraciones ("Eau de Parfum", "Elixir", "Intense"...) y signos.
 */
function normalizeOriginal(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\b(eau de parfum|eau de toilette|eau de cologne|edp|edt|extrait|elixir|intense|intensely|absolu|parfum|cologne)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const HOUSE_ALIASES: Record<string, string> = {
  ysl: 'yves saint laurent',
  jpg: 'jean paul gaultier',
};

function normalizeHouse(value: string): string {
  const house = value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return HOUSE_ALIASES[house] ?? house;
}

/**
 * Clave de "ADN" de un perfume: nos dice si dos decants son interpretaciones
 * del mismo original (ej. dos dupes de Y EDP). Ahí no hay layering: se duplica
 * el aroma. Se usa en el combinador y en los tests de los combos curados.
 */
export function dupeKey(original: string, casa: string): string {
  return `${normalizeHouse(casa)}::${normalizeOriginal(original)}`;
}

/** true si las dos claves corresponden a la misma fragancia (o a una variante). */
export function isSameDupe(a?: string, b?: string): boolean {
  if (!a || !b) return false;
  if (a === b) return true;
  const [houseA, originalA] = a.split('::');
  const [houseB, originalB] = b.split('::');
  if (!originalA || !originalB) return false;
  if (houseA !== houseB) return false;
  const [short, long] = originalA.length <= originalB.length ? [originalA, originalB] : [originalB, originalA];
  return short.length >= 4 && long.includes(short);
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
