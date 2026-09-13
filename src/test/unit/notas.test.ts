import { describe, it, expect } from 'vitest';
import { NOTAS, getNota, perfumesConNota } from '@/data/notas';
import perfumesData from '@/data/perfumes.json';
import type { Perfume } from '@/data/types';

const perfumes = perfumesData.perfumes as Perfume[];

describe('NOTAS', () => {
  it('son las 8 famosas con slugs válidos y únicos', () => {
    expect(NOTAS).toHaveLength(8);
    expect(NOTAS.map((n) => n.name)).toEqual([
      'Vainilla',
      'Bergamota',
      'Almizcle',
      'Ámbar',
      'Jazmín',
      'Sándalo',
      'Rosa',
      'Oud',
    ]);
    const slugs = NOTAS.map((n) => n.slug);
    expect(new Set(slugs).size).toBe(8);
    for (const slug of slugs) expect(slug).toMatch(/^[a-z0-9-]+$/);
  });

  it('cada nota matchea decants reales (oud: 1, resto 2+)', () => {
    for (const nota of NOTAS) {
      const min = nota.slug === 'oud' ? 1 : 2;
      expect(perfumesConNota(perfumes, nota).length).toBeGreaterThanOrEqual(min);
    }
  });

  it('solo mira salida y corazón, salvo excepción con matchBase', () => {
    const base: Perfume = {
      id: 'x',
      slug: 'x',
      brand: 'Test',
      name: 'X',
      gender: 'unisex',
      olfactoryFamily: 'Oriental',
      description: 'x',
      notes: { top: [], heart: [], base: [] },
      images: [],
      sizes: [{ ml: 5, price: 6000, stock: 10 }],
      isBoutiqueExclusive: false,
      featured: false,
    };
    const soloFondo = {
      ...base,
      notes: { top: ['Bergamota'], heart: ['Limón'], base: ['Vainilla'] },
    };
    const vainilla = getNota('vainilla')!;
    const almizcle = getNota('almizcle')!;
    expect(perfumesConNota([soloFondo], vainilla)).toHaveLength(0);
    expect(
      perfumesConNota([{ ...soloFondo, notes: { top: [], heart: [], base: ['Almizcle'] } }], almizcle)
    ).toHaveLength(1);
  });

  it('rosa no trae pimienta rosa', () => {
    const rosa = getNota('rosa')!;
    const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    for (const p of perfumesConNota(perfumes, rosa)) {
      const haystack = norm([...p.notes.top, ...p.notes.heart, ...p.notes.base].join(' '));
      expect(haystack).not.toContain('pimienta');
    }
  });

  it('getNota resuelve por slug y null si no existe', () => {
    expect(getNota('oud')?.name).toBe('Oud');
    expect(getNota('inexistente')).toBeUndefined();
  });
});
