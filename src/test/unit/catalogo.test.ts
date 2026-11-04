import { describe, it, expect } from 'vitest';
import {
  buildResultsText,
  cardMatches,
  fuzzySearchIds,
  genderMatches,
  normalizeFilter,
  perfumesForMode,
  sizeForMode,
} from '@/utils/catalogo';
import type { Perfume } from '@/data/types';

function makePerfume(overrides: Partial<Perfume> & { name: string }): Perfume {
  return {
    id: overrides.name.toLowerCase().replace(/\s+/g, '-'),
    slug: overrides.name.toLowerCase().replace(/\s+/g, '-'),
    brand: 'Marca',
    gender: 'unisex',
    olfactoryFamily: 'Amaderada',
    description: '',
    notes: { top: [], heart: [], base: [] },
    images: [],
    sizes: [],
    isBoutiqueExclusive: false,
    featured: false,
    ...overrides,
  };
}


describe('normalizeFilter', () => {
  it('acepta los tres géneros y defaultea a all', () => {
    expect(normalizeFilter('masculino')).toBe('masculino');
    expect(normalizeFilter('femenino')).toBe('femenino');
    expect(normalizeFilter('unisex')).toBe('unisex');
    expect(normalizeFilter('otro')).toBe('all');
    expect(normalizeFilter('')).toBe('all');
    expect(normalizeFilter(null)).toBe('all');
  });
});

describe('genderMatches', () => {
  it('all deja pasar todo', () => {
    expect(genderMatches('masculino', 'all')).toBe(true);
    expect(genderMatches('raro', 'all')).toBe(true);
  });

  it('unisex pasa en masculino y femenino', () => {
    expect(genderMatches('unisex', 'masculino')).toBe(true);
    expect(genderMatches('unisex', 'femenino')).toBe(true);
    expect(genderMatches('unisex', 'unisex')).toBe(true);
  });

  it('los géneros exactos no se mezclan', () => {
    expect(genderMatches('masculino', 'masculino')).toBe(true);
    expect(genderMatches('femenino', 'masculino')).toBe(false);
    expect(genderMatches('masculino', 'femenino')).toBe(false);
  });
});

describe('cardMatches', () => {
  it('sin filtro ni búsqueda todo matchea', () => {
    expect(
      cardMatches({ gender: 'x', searchText: 'y', perfumeId: 'z', filter: 'all', query: '', fuzzyIds: null })
    ).toBe(true);
  });

  it('filtra por género antes que por texto', () => {
    expect(
      cardMatches({ gender: 'femenino', searchText: 'oud', perfumeId: 'a', filter: 'masculino', query: 'oud', fuzzyIds: null })
    ).toBe(false);
  });

  it('sin índice usa substring insensible a caso', () => {
    const base = { gender: 'masculino', perfumeId: 'a', filter: 'all', fuzzyIds: null };
    expect(cardMatches({ ...base, searchText: 'oud amaderado', query: 'OUD' })).toBe(true);
    expect(cardMatches({ ...base, searchText: 'oud amaderado', query: 'vainilla' })).toBe(false);
  });

  it('con índice manda el set de IDs difusos', () => {
    const base = { gender: 'masculino', searchText: 'oud', filter: 'all', query: 'oud' };
    expect(cardMatches({ ...base, perfumeId: 'a', fuzzyIds: new Set(['a', 'b']) })).toBe(true);
    expect(cardMatches({ ...base, perfumeId: 'c', fuzzyIds: new Set(['a', 'b']) })).toBe(false);
  });
});

describe('buildResultsText', () => {
  it('singular, plural, filtro y búsqueda', () => {
    expect(buildResultsText(1, 'all', '')).toBe('1 perfume encontrado');
    expect(buildResultsText(0, 'all', '')).toBe('0 perfumes encontrados');
    expect(buildResultsText(3, 'femenino', 'oud')).toBe('3 perfumes encontrados en femenino para "oud"');
  });
});

describe('fuzzySearchIds', () => {
  const index = [
    { id: 'a', text: 'oud amaderado intenso' },
    { id: 'b', text: 'vainilla dulce' },
  ];

  it('encuentra por texto aproximado', async () => {
    expect(await fuzzySearchIds(index, 'oud')).toContain('a');
  });

  it('devuelve set vacío sin matches', async () => {
    expect(await fuzzySearchIds(index, 'zzzzzz')).toEqual(new Set());
  });
});

describe('sizeForMode', () => {
  it('decants devuelve el talle de 5 ml', () => {
    const perfume = makePerfume({
      name: 'Decant',
      sizes: [
        { ml: 100, price: 90000, stock: 1 },
        { ml: 5, price: 7000, stock: 10 },
      ],
    });
    expect(sizeForMode(perfume, 'decants')?.ml).toBe(5);
  });

  it('frascos devuelve el frasco de 100 ml', () => {
    const perfume = makePerfume({
      name: 'Frasco',
      sizes: [
        { ml: 5, price: 7000, stock: 10 },
        { ml: 100, price: 90000, stock: 2 },
      ],
    });
    expect(sizeForMode(perfume, 'frascos')?.ml).toBe(100);
  });

  it('frascos acepta 90 ml y elige el de mayor ml si hay varios', () => {
    const noventa = makePerfume({
      name: 'Noventa',
      sizes: [
        { ml: 5, price: 7000, stock: 10 },
        { ml: 90, price: 85000, stock: 0 },
      ],
    });
    expect(sizeForMode(noventa, 'frascos')?.ml).toBe(90);

    const varios = makePerfume({
      name: 'Varios',
      sizes: [
        { ml: 90, price: 85000, stock: 1 },
        { ml: 100, price: 90000, stock: 1 },
      ],
    });
    expect(sizeForMode(varios, 'frascos')?.ml).toBe(100);
  });

  it('frascos devuelve undefined sin frasco (solo decant)', () => {
    const perfume = makePerfume({
      name: 'Solo decant',
      sizes: [{ ml: 5, price: 7000, stock: 10 }],
    });
    expect(sizeForMode(perfume, 'frascos')).toBeUndefined();
  });
});

describe('perfumesForMode', () => {
  const soloDecant = makePerfume({
    name: 'Zeta',
    sizes: [{ ml: 5, price: 7000, stock: 10 }],
  });
  const frascoNoventa = makePerfume({
    name: 'Alfa',
    sizes: [
      { ml: 5, price: 7000, stock: 10 },
      { ml: 90, price: 85000, stock: 0 },
    ],
  });
  const frascoCien = makePerfume({
    name: 'Beta',
    sizes: [
      { ml: 5, price: 7000, stock: 10 },
      { ml: 100, price: 90000, stock: 3 },
    ],
  });
  const perfumes = [soloDecant, frascoCien, frascoNoventa];

  it('frascos excluye los de solo 5 ml e incluye 90 y 100 (aun sin stock)', () => {
    const result = perfumesForMode(perfumes, 'frascos');
    expect(result.map((p) => p.name)).toEqual(['Alfa', 'Beta']);
  });

  it('frascos ordena por nombre con locale es', () => {
    const result = perfumesForMode(perfumes, 'frascos');
    const names = result.map((p) => p.name);
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b, 'es')));
  });

  it('decants devuelve todos los que tienen 5 ml', () => {
    const result = perfumesForMode(perfumes, 'decants');
    expect(result).toHaveLength(3);
    result.forEach((p) => {
      expect(sizeForMode(p, 'decants')?.ml).toBe(5);
    });
  });
});

