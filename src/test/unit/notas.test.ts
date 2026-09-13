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

  it('cada nota matchea al menos 2 decants reales', () => {
    for (const nota of NOTAS) {
      expect(perfumesConNota(perfumes, nota).length).toBeGreaterThanOrEqual(2);
    }
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
