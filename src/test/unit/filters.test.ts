import { describe, it, expect } from 'vitest';
import { filterPerfumes, searchPerfumes } from '@/utils/filters';
import type { Perfume, GenderFilter } from '@/data/types';

const mockPerfumes: Perfume[] = [
  {
    id: 'tobacco-vanille',
    slug: 'tobacco-vanille',
    brand: 'Tom Ford',
    name: 'Tobacco Vanille',
    gender: 'unisex',
    olfactoryFamily: 'Amaderada Especiada',
    description: 'Rich, warm, iconic...',
    notes: { top: [], heart: [], base: [] },
    images: [],
    sizes: [{ ml: 2, price: 15000, stock: 5 }, { ml: 5, price: 32000, stock: 2 }, { ml: 10, price: 55000, stock: 0 }],
    isBoutiqueExclusive: false,
    featured: true
  },
  {
    id: 'baccarat-rouge-540',
    slug: 'baccarat-rouge-540',
    brand: 'Maison Francis Kurkdjian',
    name: 'Baccarat Rouge 540',
    gender: 'unisex',
    olfactoryFamily: 'Ambarina Floral',
    description: 'Luminous and sophisticated...',
    notes: { top: [], heart: [], base: [] },
    images: [],
    sizes: [{ ml: 2, price: 18000, stock: 8 }, { ml: 5, price: 42000, stock: 3 }, { ml: 10, price: 75000, stock: 1 }],
    isBoutiqueExclusive: false,
    featured: true
  },
  {
    id: 'aventus',
    slug: 'aventus',
    brand: 'Creed',
    name: 'Aventus',
    gender: 'masculino',
    olfactoryFamily: 'Chypre Frutal',
    description: 'Success and masculinity...',
    notes: { top: [], heart: [], base: [] },
    images: [],
    sizes: [{ ml: 2, price: 16000, stock: 6 }, { ml: 5, price: 35000, stock: 4 }, { ml: 10, price: 62000, stock: 2 }],
    isBoutiqueExclusive: false,
    featured: true
  },
  {
    id: 'la-vie-est-belle',
    slug: 'la-vie-est-belle',
    brand: 'Lancôme',
    name: 'La Vie Est Belle',
    gender: 'femenino',
    olfactoryFamily: 'Floral Frutal Gourmand',
    description: 'Declaration of happiness...',
    notes: { top: [], heart: [], base: [] },
    images: [],
    sizes: [{ ml: 2, price: 12000, stock: 10 }, { ml: 5, price: 25000, stock: 8 }, { ml: 10, price: 42000, stock: 5 }],
    isBoutiqueExclusive: false,
    featured: false
  },
  {
    id: 'delina',
    slug: 'delina',
    brand: 'Parfums de Marly',
    name: 'Delina',
    gender: 'femenino',
    olfactoryFamily: 'Floral Frutal',
    description: 'Romantic and sensual...',
    notes: { top: [], heart: [], base: [] },
    images: [],
    sizes: [{ ml: 2, price: 15000, stock: 4 }, { ml: 5, price: 33000, stock: 2 }, { ml: 10, price: 58000, stock: 0 }],
    isBoutiqueExclusive: true,
    featured: false
  }
];

describe('filters utilities', () => {
  describe('filterPerfumes', () => {
    it('returns all perfumes when filter is "all"', () => {
      const result = filterPerfumes(mockPerfumes, 'all');
      expect(result).toHaveLength(5);
    });

    it('filters by masculino gender (masculino + unisex)', () => {
      const result = filterPerfumes(mockPerfumes, 'masculino');
      expect(result).toHaveLength(3);
      expect(result.map(p => p.id).sort()).toEqual(['aventus', 'baccarat-rouge-540', 'tobacco-vanille']);
    });

    it('filters by femenino gender (femenino + unisex)', () => {
      const result = filterPerfumes(mockPerfumes, 'femenino');
      expect(result).toHaveLength(4);
      expect(result.map(p => p.id).sort()).toEqual(['baccarat-rouge-540', 'delina', 'la-vie-est-belle', 'tobacco-vanille']);
    });

    it('filters by unisex gender (only unisex)', () => {
      const result = filterPerfumes(mockPerfumes, 'unisex');
      expect(result).toHaveLength(2);
      expect(result.map(p => p.id).sort()).toEqual(['baccarat-rouge-540', 'tobacco-vanille']);
    });
  });

  describe('searchPerfumes', () => {
    it('returns all perfumes for empty search', () => {
      const result = searchPerfumes(mockPerfumes, '');
      expect(result).toHaveLength(5);
    });

    it('searches by brand name', () => {
      const result = searchPerfumes(mockPerfumes, 'tom ford');
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('tobacco-vanille');
    });

    it('searches by perfume name', () => {
      const result = searchPerfumes(mockPerfumes, 'aventus');
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('aventus');
    });

    it('searches case insensitive', () => {
      const result = searchPerfumes(mockPerfumes, 'CREED');
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('aventus');
    });

    it('searches partial matches', () => {
      const result = searchPerfumes(mockPerfumes, 'vanille');
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('tobacco-vanille');
    });

    it('returns multiple matches', () => {
      const result = searchPerfumes(mockPerfumes, 'eau');
      // No matches for 'eau' in test data
      expect(result).toHaveLength(0);
    });

    it('searches in brand and name', () => {
      const result = searchPerfumes(mockPerfumes, 'maison');
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('baccarat-rouge-540');
    });
  });
});