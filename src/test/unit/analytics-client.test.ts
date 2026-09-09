import { describe, it, expect } from 'vitest';
import { ga4ItemFromPerfume } from '@/utils/analytics-client';
import type { Perfume } from '@/data/types';

function makePerfume(overrides: Partial<Perfume> = {}): Perfume {
  return {
    id: 'test-1',
    slug: 'test-1',
    brand: 'Lattafa',
    name: 'Asad',
    gender: 'masculino',
    olfactoryFamily: 'Amaderado Especiado',
    description: 'Perfume de prueba.',
    notes: { top: [], heart: [], base: [] },
    images: [{ src: 'images/perfumes/test.jpg', alt: 'Test' }],
    sizes: [{ ml: 5, price: 32000, stock: 10 }],
    isBoutiqueExclusive: false,
    featured: false,
    ...overrides,
  };
}

describe('ga4ItemFromPerfume', () => {
  it('arma item_id, item_name (marca + nombre) y precio del tamaño 5ml', () => {
    const item = ga4ItemFromPerfume(makePerfume());
    expect(item.item_id).toBe('test-1');
    expect(item.item_name).toBe('Lattafa Asad');
    expect(item.price).toBe(32000);
    expect(item.quantity).toBeUndefined();
  });

  it('incluye quantity cuando se pasa', () => {
    const item = ga4ItemFromPerfume(makePerfume(), 2);
    expect(item.quantity).toBe(2);
  });

  it('usa el primer tamaño si no hay 5ml', () => {
    const perfume = makePerfume({ sizes: [{ ml: 5, price: 45000, stock: 3 }] });
    expect(ga4ItemFromPerfume(perfume).price).toBe(45000);
  });
});