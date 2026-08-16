import { describe, it, expect } from 'vitest';
import { recommendPerfumes, recommendationReason, type QuizAnswers } from '@/utils/quiz';
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

function textFor(id: string, text: string, gender: Perfume['gender'] = 'unisex', price = 6000, stock = 10): Perfume {
  return makePerfume({
    id,
    gender,
    sizes: [{ ml: 5, price, stock }],
    olfactoryFamily: text,
    description: text,
    notes: { top: [text], heart: [text], base: [text] },
  });
}

const answers: QuizAnswers = {
  gender: 'indistinto',
  style: 'citrico-fresco',
  occasion: 'todo-el-dia',
  intensity: 'notoria',
  weather: 'todo-el-ano',
};

describe('recommendPerfumes', () => {
  it('returns exactly one perfume', () => {
    const perfumes = ['a', 'b', 'c', 'd', 'e'].map((id) => textFor(id, 'cítrico bergamota'));
    const result = recommendPerfumes(answers, perfumes);
    expect(result).toHaveLength(1);
  });

  it('excludes perfumes out of stock', () => {
    const inStock = textFor('a', 'cítrico bergamota');
    const outOfStock = textFor('b', 'cítrico bergamota', 'unisex', 6000, 0);
    const result = recommendPerfumes(answers, [inStock, outOfStock]);
    expect(result.map((p) => p.id)).toEqual(['a']);
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

  it('prefers the curated profile over free text for the same style', () => {
    const curated = makePerfume({ id: 'dark-door-sport', gender: 'masculino' });
    const freeText = textFor('x', 'cítrico dulce amaderado', 'masculino');
    const result = recommendPerfumes(
      { gender: 'para-el', style: 'citrico-fresco', occasion: 'trabajo', intensity: 'sutil', weather: 'calor' },
      [freeText, curated]
    );
    expect(result.map((p) => p.id)).toEqual(['dark-door-sport']);
  });

  it('ranks by style using keywords for perfumes without a curated profile', () => {
    const sweet = textFor('a', 'vainilla caramelo praliné dulce');
    const citrus = textFor('b', 'cítrico bergamota lima fresco');
    const result = recommendPerfumes({ ...answers, style: 'dulce-vainilla' }, [sweet, citrus]);
    expect(result.map((p) => p.id)).toEqual(['a']);
  });

  it('does not boost a perfume for cold weather just because its base note list includes vanilla', () => {
    const citrus = makePerfume({
      id: 'citrus',
      sizes: [{ ml: 5, price: 6000, stock: 10 }],
      olfactoryFamily: 'Aromática',
      description: 'fresco y aromático',
      notes: { top: ['Bergamota'], heart: ['Lavanda'], base: ['Vainilla'] },
    });
    const aquatic = makePerfume({
      id: 'aquatic',
      sizes: [{ ml: 5, price: 5000, stock: 10 }],
      olfactoryFamily: 'Acuática',
      description: 'fresco acuático y marino',
      notes: { top: ['Bergamota'], heart: ['Violeta'], base: ['Ámbar'] },
    });
    const result = recommendPerfumes(
      { gender: 'indistinto', style: 'frutal', occasion: 'especiales', intensity: 'sutil', weather: 'frio' },
      [citrus, aquatic]
    );
    expect(result.map((p) => p.id)).toEqual(['aquatic']);
  });

  it('does not filter by price', () => {
    const pricey = textFor('a', 'cítrico bergamota lima fresco', 'unisex', 10000);
    const result = recommendPerfumes({ ...answers, style: 'citrico-fresco' }, [pricey]);
    expect(result.map((p) => p.id)).toEqual(['a']);
  });

  it('is deterministic: same input always returns the same result', () => {
    const perfumes = ['a', 'b', 'c', 'd', 'e'].map((id) => textFor(id, 'cítrico bergamota'));
    const first = recommendPerfumes(answers, perfumes);
    const second = recommendPerfumes(answers, perfumes);
    expect(second.map((p) => p.id)).toEqual(first.map((p) => p.id));
  });

  it('returns an empty list when every perfume is filtered out', () => {
    const fem = textFor('a', 'floral jazmín', 'femenino');
    const result = recommendPerfumes({ ...answers, gender: 'para-el' }, [fem]);
    expect(result).toEqual([]);
  });
});

describe('recommendationReason', () => {
  it('mentions the chosen style and occasion', () => {
    const reason = recommendationReason({
      gender: 'para-el',
      style: 'citrico-fresco',
      occasion: 'trabajo',
      intensity: 'sutil',
      weather: 'calor',
    });
    expect(reason).toContain('cítrico y fresco');
    expect(reason).toContain('día a día');
  });
});
