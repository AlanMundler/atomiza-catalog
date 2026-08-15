import { describe, it, expect } from 'vitest';
import { recommendPerfumes, type QuizAnswers } from '@/utils/quiz';
import type { Perfume } from '@/data/types';

function makePerfume(overrides: Partial<Perfume> & Pick<Perfume, 'id'>): Perfume {
  return {
    slug: overrides.id,
    brand: 'Test Brand',
    name: overrides.id,
    gender: 'unisex',
    olfactoryFamily: 'Neutral',
    description: '',
    notes: { top: [], heart: [], base: [] },
    images: [],
    sizes: [{ ml: 5, price: 6000, stock: 10 }],
    isBoutiqueExclusive: false,
    featured: false,
    ...overrides,
  };
}

const answers: QuizAnswers = {
  gender: 'indistinto',
  occasion: 'todo-el-dia',
  style: 'citrico-fresco',
  intensity: 'notoria',
  weather: 'todo-el-ano',
  budget: 'no-importa',
};

function textFor(id: string, text: string, gender: Perfume['gender'] = 'unisex', price = 6000, stock = 10): Perfume {
  return makePerfume({ id, gender, sizes: [{ ml: 5, price, stock }], ...textToFields(text) });
}

function textToFields(text: string) {
  return {
    olfactoryFamily: text,
    description: text,
    notes: { top: [text], heart: [text], base: [text] },
  };
}

describe('recommendPerfumes', () => {
  it('returns only perfumes in stock', () => {
    const inStock = textFor('a', 'cítrico bergamota');
    const outOfStock = textFor('b', 'cítrico bergamota', 'unisex', 6000, 0);
    const result = recommendPerfumes(answers, [inStock, outOfStock]);
    expect(result.map((p) => p.id)).not.toContain('b');
    expect(result).toContain(inStock);
  });

  it('excludes femenino-only perfumes when the user chooses para-el', () => {
    const fem = textFor('a', 'floral jazmín', 'femenino');
    const masc = textFor('b', 'floral jazmín', 'masculino');
    const result = recommendPerfumes({ ...answers, gender: 'para-el' }, [fem, masc]);
    expect(result.map((p) => p.id)).toEqual(['b']);
  });

  it('excludes masculino-only perfumes when the user chooses para-ella', () => {
    const fem = textFor('a', 'floral jazmín', 'femenino');
    const masc = textFor('b', 'floral jazmín', 'masculino');
    const result = recommendPerfumes({ ...answers, gender: 'para-ella' }, [fem, masc]);
    expect(result.map((p) => p.id)).toEqual(['a']);
  });

  it('includes unisex perfumes for both gender choices', () => {
    const uni = textFor('a', 'floral jazmín', 'unisex');
    expect(recommendPerfumes({ ...answers, gender: 'para-el' }, [uni]).map((p) => p.id)).toEqual(['a']);
    expect(recommendPerfumes({ ...answers, gender: 'para-ella' }, [uni]).map((p) => p.id)).toEqual(['a']);
  });

  it('keeps all genders when indistinto', () => {
    const fem = textFor('a', 'floral jazmín', 'femenino');
    const masc = textFor('b', 'floral jazmín', 'masculino');
    const result = recommendPerfumes({ ...answers, gender: 'indistinto' }, [fem, masc]);
    expect(result).toHaveLength(2);
  });

  it('filters by budget when hasta-6000 is chosen', () => {
    const cheap = textFor('a', 'cítrico', 'unisex', 6000);
    const pricey = textFor('b', 'cítrico', 'unisex', 10000);
    const result = recommendPerfumes({ ...answers, budget: 'hasta-6000' }, [cheap, pricey]);
    expect(result.map((p) => p.id)).toEqual(['a']);
  });

  it('ranks the sweet vanilla perfume above the citrus one for a dulce-vainilla style', () => {
    const sweet = textFor('a', 'vainilla caramelo praliné dulce');
    const citrus = textFor('b', 'cítrico bergamota lima fresco');
    const result = recommendPerfumes({ ...answers, style: 'dulce-vainilla' }, [sweet, citrus]);
    expect(result[0].id).toBe('a');
  });

  it('ranks the amber spicy perfume above the citrus one for an ambarado-especiado style', () => {
    const amber = textFor('a', 'ámbar azafrán canela especiado');
    const citrus = textFor('b', 'cítrico bergamota lima fresco');
    const result = recommendPerfumes({ ...answers, style: 'ambarado-especiado' }, [amber, citrus]);
    expect(result[0].id).toBe('a');
  });

  it('returns at most three perfumes', () => {
    const perfumes = ['a', 'b', 'c', 'd', 'e'].map((id) => textFor(id, 'cítrico bergamota'));
    const result = recommendPerfumes(answers, perfumes);
    expect(result).toHaveLength(3);
  });

  it('is deterministic: same input always returns the same order', () => {
    const perfumes = ['a', 'b', 'c', 'd', 'e'].map((id) => textFor(id, 'cítrico bergamota'));
    const first = recommendPerfumes(answers, perfumes);
    const second = recommendPerfumes(answers, perfumes);
    expect(second.map((p) => p.id)).toEqual(first.map((p) => p.id));
  });

  it('returns an empty list when every perfume is filtered out', () => {
    const pricey = textFor('a', 'cítrico', 'unisex', 10000);
    const result = recommendPerfumes({ ...answers, budget: 'hasta-6000' }, [pricey]);
    expect(result).toEqual([]);
  });

  it('still returns matches when neutral options are chosen (no keywords)', () => {
    const neutral = {
      gender: 'indistinto' as const,
      occasion: 'todo-el-dia' as const,
      style: 'citrico-fresco' as const,
      intensity: 'notoria' as const,
      weather: 'todo-el-ano' as const,
      budget: 'no-importa' as const,
    };
    const perfumes = ['a', 'b', 'c'].map((id) => textFor(id, 'cítrico bergamota'));
    const result = recommendPerfumes(neutral, perfumes);
    expect(result).toHaveLength(3);
  });
});
