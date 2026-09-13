import type { Perfume } from '@/data/types';

export interface Nota {
  /** Nombre visible ("Vainilla"). */
  name: string;
  /** Slug de URL (/notas/vainilla/). */
  slug: string;
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
    keywords: ['vainilla'],
    blurb: 'Dulce, cremosa y adictiva: la nota más amada del mundo.',
  },
  {
    name: 'Bergamota',
    slug: 'bergamota',
    keywords: ['bergamota'],
    blurb: 'Cítrica y luminosa: la frescura que levanta cualquier perfume.',
  },
  {
    name: 'Almizcle',
    slug: 'almizcle',
    keywords: ['almizcle'],
    blurb: 'Limpio y magnético: lo que hace que todo dure en la piel.',
  },
  {
    name: 'Ámbar',
    slug: 'ambar',
    keywords: ['ambar'],
    blurb: 'Cálido y envolvente: dulzor con presencia oriental.',
  },
  {
    name: 'Jazmín',
    slug: 'jazmin',
    keywords: ['jazmin'],
    blurb: 'Blanco y radiante: la flor más icónica de la perfumería.',
  },
  {
    name: 'Sándalo',
    slug: 'sandalo',
    keywords: ['sandalo'],
    blurb: 'Cremoso y elegante: la madera suave que nunca falla.',
  },
  {
    name: 'Rosa',
    slug: 'rosa',
    keywords: ['rosa'],
    exclude: ['pimienta'],
    blurb: 'La reina de las flores: fresca o intensa, siempre dice presente.',
  },
  {
    name: 'Oud',
    slug: 'oud',
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

/** Perfumes que llevan la nota en salida, corazón o fondo. */
export function perfumesConNota(perfumes: Perfume[], nota: Nota): Perfume[] {
  const keys = nota.keywords.map(normalizar);
  const excl = (nota.exclude ?? []).map(normalizar);
  return perfumes.filter((p) => {
    const haystack = normalizar([...p.notes.top, ...p.notes.heart, ...p.notes.base].join(' '));
    if (excl.some((x) => haystack.includes(x))) return false;
    return keys.some((k) => haystack.includes(k));
  });
}

export function getNota(slug: string): Nota | undefined {
  return NOTAS.find((n) => n.slug === slug);
}
