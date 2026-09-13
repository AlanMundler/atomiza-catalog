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

  it('no falta ninguno: también cuenta el fondo (ej. Angham y su vainilla)', () => {
    const vainilla = getNota('vainilla')!;
    const ids = perfumesConNota(perfumes, vainilla).map((p) => p.id);
    expect(ids).toContain('angham');
  });

  it('ordena por dónde se huele: salida antes que corazón antes que fondo', () => {
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
    const fondo = { ...base, id: 'fondo', notes: { top: [], heart: [], base: ['Vainilla'] } };
    const corazon = { ...base, id: 'corazon', notes: { top: [], heart: ['Vainilla'], base: [] } };
    const salida = { ...base, id: 'salida', notes: { top: ['Vainilla'], heart: [], base: [] } };
    const vainilla = getNota('vainilla')!;
    const ids = perfumesConNota([fondo, salida, corazon], vainilla).map((p) => p.id);
    expect(ids).toEqual(['salida', 'corazon', 'fondo']);
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

  it('cada nota tiene foto local en public/images/notas/', async () => {
    const fs = await import('node:fs');
    const path = await import('node:path');
    for (const nota of NOTAS) {
      expect(nota.image).toMatch(/^images\/notas\/[a-z-]+\.avif$/);
      expect(fs.existsSync(path.join(process.cwd(), 'public', nota.image))).toBe(true);
    }
  });
});
