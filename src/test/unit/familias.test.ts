import { describe, it, expect } from 'vitest';
import { getFamilias } from '@/data/familias';
import perfumesData from '@/data/perfumes.json';
import type { Perfume } from '@/data/types';

describe('getFamilias', () => {
  it('agrupa todos los perfumes sin perder ninguno', () => {
    const perfumes = perfumesData.perfumes as Perfume[];
    const total = getFamilias().reduce((sum, f) => sum + f.items.length, 0);
    expect(total).toBe(perfumes.length);
  });

  it('ordena por cantidad descendente y slugifica sin tildes ni mayúsculas', () => {
    const familias = getFamilias();
    for (let i = 1; i < familias.length; i++) {
      expect(familias[i - 1].items.length).toBeGreaterThanOrEqual(familias[i].items.length);
    }
    for (const f of familias) {
      expect(f.slug).toMatch(/^[a-z0-9-]+$/);
    }
  });
});
