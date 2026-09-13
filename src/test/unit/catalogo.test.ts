import { describe, it, expect } from 'vitest';
import {
  buildResultsText,
  cardMatches,
  fuzzySearchIds,
  genderMatches,
  normalizeFilter,
} from '@/utils/catalogo';

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
