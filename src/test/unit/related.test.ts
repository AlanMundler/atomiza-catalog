import { describe, it, expect } from 'vitest';
import { getRelated, relatedScore } from '@/utils/related';
import type { Perfume } from '@/data/types';

function makePerfume(overrides: Partial<Perfume> = {}): Perfume {
  return {
    id: 'test-perfume',
    slug: 'test-perfume',
    brand: 'Test Brand',
    name: 'Test',
    gender: 'masculino',
    olfactoryFamily: 'Aromática Acuática',
    description: 'Test.',
    notes: { top: ['Cítricos'], heart: ['Ámbar'], base: ['Almizcle'] },
    images: [{ src: 'images/perfumes/test.avif', alt: 'Test' }],
    sizes: [{ ml: 5, price: 6000, stock: 10 }],
    isBoutiqueExclusive: false,
    featured: false,
    ...overrides,
  };
}

describe('relatedScore', () => {
  it('la misma familia pesa más que el género solo', () => {
    const current = makePerfume({ gender: 'masculino', olfactoryFamily: 'A' });
    const sameFamilyOtherGender = makePerfume({
      id: 'fam',
      gender: 'femenino',
      olfactoryFamily: 'A',
      notes: { top: [], heart: [], base: [] },
    });
    const sameGenderOtherFamily = makePerfume({
      id: 'gen',
      gender: 'masculino',
      olfactoryFamily: 'B',
      notes: { top: [], heart: [], base: [] },
    });
    expect(relatedScore(current, sameFamilyOtherGender)).toBeGreaterThan(
      relatedScore(current, sameGenderOtherFamily)
    );
  });

  it('las notas compartidas suman', () => {
    const current = makePerfume();
    const withShared = makePerfume({ id: 'shared' });
    const withoutShared = makePerfume({
      id: 'other',
      notes: { top: ['Rosa'], heart: ['Oud'], base: ['Cuero'] },
    });
    expect(relatedScore(current, withShared)).toBeGreaterThan(relatedScore(current, withoutShared));
  });

  it('el stock disponible suma sobre el agotado', () => {
    const current = makePerfume();
    const available = makePerfume({ id: 'a' });
    const outOfStock = makePerfume({ id: 'b', sizes: [{ ml: 5, price: 6000, stock: 0 }] });
    expect(relatedScore(current, available)).toBeGreaterThan(relatedScore(current, outOfStock));
  });
});

describe('getRelated', () => {
  it('nunca incluye la ficha actual y respeta el máximo', () => {
    const current = makePerfume({ id: 'self' });
    const others = Array.from({ length: 6 }, (_, i) => makePerfume({ id: `p${i}`, slug: `p${i}` }));
    const result = getRelated(current, [current, ...others]);
    expect(result).toHaveLength(4);
    expect(result.map((p) => p.id)).not.toContain('self');
  });

  it('ordena por afinidad: familia y notas primero', () => {
    const current = makePerfume({ id: 'self', gender: 'masculino', olfactoryFamily: 'A' });
    const genericSameGender = makePerfume({
      id: 'generic',
      olfactoryFamily: 'Z',
      notes: { top: [], heart: [], base: [] },
    });
    const soulmate = makePerfume({ id: 'soulmate', olfactoryFamily: 'A' });
    const result = getRelated(current, [current, genericSameGender, soulmate]);
    expect(result[0].id).toBe('soulmate');
  });

  it('es determinístico: mismo input, mismo orden', () => {
    const current = makePerfume({ id: 'self' });
    const others = Array.from({ length: 5 }, (_, i) => makePerfume({ id: `p${i}`, slug: `p${i}` }));
    const a = getRelated(current, [current, ...others]).map((p) => p.id);
    const b = getRelated(current, [current, ...others]).map((p) => p.id);
    expect(a).toEqual(b);
  });
});
