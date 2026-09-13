import type { Perfume } from '@/data/types';

export interface Nota {
  /** Nombre visible ("Vainilla"). */
  name: string;
  /** Slug de URL (/notas/vainilla/). */
  slug: string;
  /** Foto local (public/images/notas/<slug>.avif, de Fragrantica). */
  image: string;
  /** Subcadenas a buscar en las notas (ya en minúsculas, sin tildes). */
  keywords: string[];
  /** Subcadenas que descartan el match (ej. pimienta rosa no es rosa). */
  exclude?: string[];
  /** Una línea que vende la nota. */
  blurb: string;
}

// Las 8 notas más conocidas del mundo, cada una con decants en el catálogo.
export const NOTAS: Nota[] = [
  {
    name: 'Vainilla',
    slug: 'vainilla',
    image: 'images/notas/vainilla.avif',
    keywords: ['vainilla'],
    blurb: 'Dulce, cremosa y adictiva: la nota más amada del mundo.',
  },
  {
    name: 'Bergamota',
    slug: 'bergamota',
    image: 'images/notas/bergamota.avif',
    keywords: ['bergamota'],
    blurb: 'Cítrica y luminosa: la frescura que levanta cualquier perfume.',
  },
  {
    name: 'Almizcle',
    slug: 'almizcle',
    image: 'images/notas/almizcle.avif',
    keywords: ['almizcle'],
    blurb: 'Limpio y magnético: lo que hace que todo dure en la piel.',
  },
  {
    name: 'Ámbar',
    slug: 'ambar',
    image: 'images/notas/ambar.avif',
    keywords: ['ambar'],
    blurb: 'Cálido y envolvente: dulzor con presencia oriental.',
  },
  {
    name: 'Jazmín',
    slug: 'jazmin',
    image: 'images/notas/jazmin.avif',
    keywords: ['jazmin'],
    blurb: 'Blanco y radiante: la flor más icónica de la perfumería.',
  },
  {
    name: 'Sándalo',
    slug: 'sandalo',
    image: 'images/notas/sandalo.avif',
    keywords: ['sandalo'],
    blurb: 'Cremoso y elegante: la madera suave que nunca falla.',
  },
  {
    name: 'Rosa',
    slug: 'rosa',
    image: 'images/notas/rosa.avif',
    keywords: ['rosa'],
    exclude: ['pimienta'],
    blurb: 'La reina de las flores: fresca o intensa, siempre dice presente.',
  },
  {
    name: 'Oud',
    slug: 'oud',
    image: 'images/notas/oud.avif',
    keywords: ['oud', 'agar'],
    blurb: 'Legendario y profundo: la madera más preciada de Arabia.',
  },
];

function normalizar(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

/**
 * Perfumes que llevan la nota en cualquier tier, ordenados por dónde se
 * huele primero: salida, después corazón, después fondo. Así no falta
 * ninguno (ej. Angham lleva vainilla en el fondo) y los más
 * representativos quedan arriba.
 */
export function perfumesConNota(perfumes: Perfume[], nota: Nota): Perfume[] {
  const keys = nota.keywords.map(normalizar);
  const excl = (nota.exclude ?? []).map(normalizar);
  const tierDe = (p: Perfume): number => {
    const tiers = [p.notes.top, p.notes.heart, p.notes.base];
    for (let tier = 0; tier < tiers.length; tier++) {
      const haystack = normalizar(tiers[tier].join(' '));
      if (excl.some((x) => haystack.includes(x))) return -1;
      if (keys.some((k) => haystack.includes(k))) return tier;
    }
    return -1;
  };
  return perfumes
    .map((p) => ({ p, tier: tierDe(p) }))
    .filter((r) => r.tier >= 0)
    .sort((a, b) => a.tier - b.tier)
    .map((r) => r.p);
}

export function getNota(slug: string): Nota | undefined {
  return NOTAS.find((n) => n.slug === slug);
}
