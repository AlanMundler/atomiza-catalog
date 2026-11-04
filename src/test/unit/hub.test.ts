import { describe, it, expect } from 'vitest';
import { buildHubCountText, hubSearchMatches } from '@/utils/hub';

const cards = [
  { id: 'aventus-creed', text: 'aventus creed now rave creed amaderada aromática' },
  { id: 'aventus-creed-cdnim', text: 'club de nuit intense man armaf amaderada especiada' },
  { id: 'delina', text: 'delina parfums de marly delilah parfums de marly floral frutal' },
];

describe('buildHubCountText', () => {
  it('singular, plural y cero', () => {
    expect(buildHubCountText(1)).toBe('1 aroma');
    expect(buildHubCountText(2)).toBe('2 aromas');
    expect(buildHubCountText(0)).toBe('0 aromas');
    expect(buildHubCountText(62)).toBe('62 aromas');
  });
});

describe('hubSearchMatches', () => {
  it('sin query devuelve todos los ids', () => {
    expect(hubSearchMatches(cards, '', null)).toEqual(
      new Set(['aventus-creed', 'aventus-creed-cdnim', 'delina'])
    );
    expect(hubSearchMatches(cards, '   ', new Set())).toEqual(
      new Set(['aventus-creed', 'aventus-creed-cdnim', 'delina'])
    );
  });

  it('prioriza la coincidencia literal sobre el set difuso', () => {
    // "aventus" existe literalmente en una card; el fuzzy trae otra de más
    // (subsequencia) y no debe colarse.
    const fuzzy = new Set(['aventus-creed', 'aventus-creed-cdnim']);
    expect(hubSearchMatches(cards, 'AVENTUS', fuzzy)).toEqual(new Set(['aventus-creed']));
  });

  it('cae al set difuso solo si no hay coincidencia literal', () => {
    const fuzzy = new Set(['aventus-creed-cdnim']);
    expect(hubSearchMatches(cards, 'aventuz', fuzzy)).toEqual(new Set(['aventus-creed-cdnim']));
  });

  it('sin fuzzy y sin coincidencia literal devuelve vacío', () => {
    expect(hubSearchMatches(cards, 'zzzzzz', null)).toEqual(new Set());
  });
});
