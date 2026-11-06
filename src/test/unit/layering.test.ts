import { describe, expect, it } from 'vitest';
import { layeringCombos } from '@/data/layering';
import { inspiraciones } from '@/data/inspiraciones';
import perfumesData from '@/data/perfumes.json';
import {
  availableLayeringCombos,
  decantAvailable,
  decantPrice,
  dupeKey,
  isSameDupe,
  layeringAffinity,
  layeringRole,
  pairPrice,
  roleLabel,
  sharedNotes,
} from '@/utils/layering';
import { primarySize } from '@/utils/stock';
import type { Perfume } from '@/data/types';

const perfumes = perfumesData.perfumes as Perfume[];
const byId = (id: string): Perfume => {
  const found = perfumes.find((p) => p.id === id);
  if (!found) throw new Error(`Perfume inexistente: ${id}`);
  return found;
};

describe('layering: roles', () => {
  it('clasifica familias densas como ancla y livianas como acento', () => {
    expect(layeringRole(byId('ameer-al-oudh'))).toBe('ancla'); // oriental
    expect(layeringRole(byId('angham'))).toBe('ancla'); // oriental vainilla
    expect(layeringRole(byId('hawas-tropical'))).toBe('acento'); // aromática verde
    expect(layeringRole(byId('yeah'))).toBe('acento'); // aromática frutal
  });

  it('las familias mixtas son comodín', () => {
    expect(layeringRole(byId('reflection'))).toBe('puente'); // almizcle + floral + amaderado
    expect(roleLabel('ancla')).toMatch(/base/i);
    expect(roleLabel('acento')).toMatch(/acento/i);
  });
});

describe('layering: notas puente', () => {
  it('encuentra notas compartidas sin importar tildes ni mayúsculas', () => {
    const shared = sharedNotes(byId('odyssey-mega-man'), byId('yeah'));
    expect(shared.length).toBeGreaterThan(0);
    expect(shared.map((n) => n.toLowerCase())).toContain('bergamota');
  });

  it('devuelve vacío cuando no hay notas en común', () => {
    const fake = {
      ...byId('yeah'),
      id: 'fake',
      notes: { top: ['Nota Inventada'], heart: [], base: [] },
    } as Perfume;
    expect(sharedNotes(byId('yeah'), fake)).toEqual([]);
  });
});

describe('layering: afinidad', () => {
  it('ancla + acento con nota puente da verdicto fuerte y ordena el par', () => {
    const result = layeringAffinity(byId('yeah'), byId('odyssey-mega-man'));
    expect(result.verdict).toBe('fuerte');
    expect(result.anchor.id).toBe('odyssey-mega-man');
    expect(result.accent.id).toBe('yeah');
    expect(result.ratio).toMatch(/spray/);
  });

  it('dos anclas densas piden cuidado', () => {
    const result = layeringAffinity(byId('ameer-al-oudh'), byId('asad-elixir'));
    expect(result.verdict).toBe('cuidado');
    expect(result.reason).toMatch(/anular|densos/i);
  });

  it('dos dupes del mismo original no son layering: verdicto cuidado y sin dosis', () => {
    const result = layeringAffinity(byId('odyssey-mega-man'), byId('yeah'), { sameOriginal: true });
    expect(result.verdict).toBe('cuidado');
    expect(result.reason).toMatch(/mismo perfume original|duplica el aroma/i);
    expect(result.ratio).not.toMatch(/sprays/);
  });

  it('nunca devuelve un ratio vacío', () => {
    for (const a of perfumes.slice(0, 10)) {
      for (const b of perfumes.slice(10, 20)) {
        expect(layeringAffinity(a, b).ratio.length).toBeGreaterThan(10);
      }
    }
  });
});

describe('layering: detección de dupes del mismo original', () => {
  it('reconoce dos dupes de Y EDP aunque la casa venga escrita distinto', () => {
    expect(isSameDupe(dupeKey('Y Eau de Parfum', 'YSL'), dupeKey('Y Eau de Parfum', 'Yves Saint Laurent'))).toBe(true);
  });

  it('reconoce variantes de concentración del mismo perfume', () => {
    expect(isSameDupe(dupeKey('Sauvage', 'Dior'), dupeKey('Sauvage Eau de Parfum', 'Dior'))).toBe(true);
    expect(isSameDupe(dupeKey('La Belle', 'Jean Paul Gaultier'), dupeKey('La Belle Le Parfum', 'Jean Paul Gaultier'))).toBe(true);
  });

  it('no marca como iguales a perfumes distintos', () => {
    expect(isSameDupe(dupeKey('Aventus', 'Creed'), dupeKey('Baccarat Rouge 540', 'Maison Francis Kurkdjian'))).toBe(false);
    expect(isSameDupe(dupeKey('Sauvage', 'Dior'), dupeKey('Sauvage', 'Otra Casa'))).toBe(false);
    expect(isSameDupe('', dupeKey('Aventus', 'Creed'))).toBe(false);
  });
});

describe('layering: combos curados', () => {
  it('todos los slugs existen en el catálogo', () => {
    for (const combo of layeringCombos) {
      expect(() => byId(combo.anchorSlug), `ancla ${combo.slug}`).not.toThrow();
      expect(() => byId(combo.accentSlug), `acento ${combo.slug}`).not.toThrow();
    }
  });

  it('todos los perfumes de los combos tienen stock del decant de 5 ml', () => {
    for (const combo of layeringCombos) {
      for (const id of [combo.anchorSlug, combo.accentSlug]) {
        const size = primarySize(byId(id));
        expect(size?.stock, `${combo.slug} → ${id}`).toBeGreaterThan(0);
      }
    }
  });

  it('no hay combos con el mismo perfume dos veces ni slugs repetidos', () => {
    const slugs = new Set<string>();
    for (const combo of layeringCombos) {
      expect(combo.anchorSlug).not.toBe(combo.accentSlug);
      expect(slugs.has(combo.slug)).toBe(false);
      slugs.add(combo.slug);
    }
  });

  it('ningún combo empareja dos dupes del mismo original', () => {
    const dupeBySlug = new Map(inspiraciones.map((i) => [i.perfumeSlug, dupeKey(i.original, i.casa)]));
    for (const combo of layeringCombos) {
      const a = dupeBySlug.get(combo.anchorSlug);
      const b = dupeBySlug.get(combo.accentSlug);
      expect(isSameDupe(a, b), `${combo.slug}: ${combo.anchorSlug} + ${combo.accentSlug}`).toBe(false);
    }
  });

  it('todos los combos curados tienen afinidad buena o fuerte', () => {
    for (const combo of layeringCombos) {
      const verdict = layeringAffinity(byId(combo.anchorSlug), byId(combo.accentSlug)).verdict;
      expect(verdict, `${combo.slug}`).not.toBe('cuidado');
    }
  });

  it('cada combo tiene copy y proporción', () => {
    for (const combo of layeringCombos) {
      expect(combo.title.length).toBeGreaterThan(3);
      expect(combo.why.length).toBeGreaterThan(30);
      expect(combo.ratio).toMatch(/spray/i);
    }
  });
});

describe('layering: precio y disponibilidad del par', () => {
  it('decantPrice lee el precio del talle de 5 ml desde el catálogo', () => {
    expect(decantPrice(byId('yeah'))).toBe(6000);
    const sinDecant = { ...byId('yeah'), sizes: [{ ml: 100, price: 50000, stock: 2 }] } as Perfume;
    expect(decantPrice(sinDecant)).toBeNull();
  });

  it('pairPrice suma los dos decants y es null si falta el talle', () => {
    expect(pairPrice(byId('odyssey-mega-man'), byId('yeah'))).toBe(13000);
    const sinDecant = { ...byId('yeah'), sizes: [{ ml: 100, price: 50000, stock: 2 }] } as Perfume;
    expect(pairPrice(byId('odyssey-mega-man'), sinDecant)).toBeNull();
  });

  it('decantAvailable es false solo sin talle 5 ml o sin stock', () => {
    expect(decantAvailable(byId('yeah'))).toBe(true);
    const agotado = {
      ...byId('yeah'),
      sizes: [{ ml: 5, price: 6000, stock: 0 }],
    } as Perfume;
    expect(decantAvailable(agotado)).toBe(false);
  });

  it('availableLayeringCombos conserva las combos con ambos en stock y el orden curado', () => {
    const disponibles = availableLayeringCombos(perfumes);
    // Con el catálogo actual todas están abastecidas; el contrato es que
    // ninguna ofrecida quede sin stock y que se preserve el orden de curaduría.
    expect(disponibles.length).toBeGreaterThan(0);
    expect(disponibles.map((c) => c.slug)).toEqual(
      layeringCombos.filter((c) => disponibles.includes(c)).map((c) => c.slug)
    );
    for (const combo of disponibles) {
      expect(decantAvailable(byId(combo.anchorSlug))).toBe(true);
      expect(decantAvailable(byId(combo.accentSlug))).toBe(true);
    }
    // Un catálogo sin stock para el acento de la primera combo la excluye.
    const empty = perfumes.map((p) =>
      p.id === 'yeah' ? ({ ...p, sizes: [{ ml: 5, price: 6000, stock: 0 }] } as Perfume) : p
    );
    expect(availableLayeringCombos(empty).some((c) => c.slug === 'fresco-sobre-madera')).toBe(false);
  });
});
