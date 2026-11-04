import { describe, it, expect } from 'vitest';
import {
  HUB_CASA_ALL,
  buildHubCountText,
  buildHubCountTextWithCasa,
  casasDeInspiraciones,
  casasPrincipales,
  hubCasaSlug,
  hubSearchMatches,
} from '@/utils/hub';

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

describe('hubCasaSlug', () => {
  it('slug simple en minúsculas con guiones', () => {
    expect(hubCasaSlug('Creed')).toBe('creed');
    expect(hubCasaSlug('Parfums de Marly')).toBe('parfums-de-marly');
    expect(hubCasaSlug('Jean Paul Gaultier')).toBe('jean-paul-gaultier');
  });

  it('elimina acentos y signos', () => {
    expect(hubCasaSlug('Louis Vuitton')).toBe('louis-vuitton');
    expect(hubCasaSlug('BDK Parfums')).toBe('bdk-parfums');
    expect(hubCasaSlug('Giorgio Armani')).toBe('giorgio-armani');
    // caso defensivo: acentos que NFD sí descompone y símbolos sueltos
    expect(hubCasaSlug('Narciso Rodríguez & Co.')).toBe('narciso-rodriguez-co');
    expect(hubCasaSlug('  Espacio  Raro  ')).toBe('espacio-raro');
  });

  it('no genera slugs vacíos ni colisionables entre casas del catálogo', () => {
    // "YSL" y "Yves Saint Laurent" coexisten en los datos: no pueden pisarse.
    expect(hubCasaSlug('YSL')).toBe('ysl');
    expect(hubCasaSlug('Yves Saint Laurent')).toBe('yves-saint-laurent');
    expect(hubCasaSlug('Kayali')).toBe('kayali');
    expect(hubCasaSlug('Kayali Fragrances')).toBe('kayali-fragrances');
  });
});

describe('casasDeInspiraciones', () => {
  const items = [
    { casa: 'Creed' },
    { casa: 'Creed' },
    { casa: 'Creed' },
    { casa: 'Dior' },
    { casa: 'Dior' },
    { casa: 'Parfums de Marly' },
  ];

  it('agrupa, cuenta y ordena por cantidad desc y nombre', () => {
    expect(casasDeInspiraciones(items)).toEqual([
      { casa: 'Creed', slug: 'creed', count: 3 },
      { casa: 'Dior', slug: 'dior', count: 2 },
      { casa: 'Parfums de Marly', slug: 'parfums-de-marly', count: 1 },
    ]);
  });

  it('no repite casas y con lista vacía devuelve vacío', () => {
    expect(casasDeInspiraciones([])).toEqual([]);
    expect(casasDeInspiraciones([{ casa: 'Chanel' }, { casa: 'Chanel' }])).toHaveLength(1);
  });

  it('las slugs son únicas para casas distintas del catálogo real', () => {
    const casas = casasDeInspiraciones(items);
    const slugs = casas.map((c) => c.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });
});

describe('casasPrincipales', () => {
  const casas = casasDeInspiraciones([
    { casa: 'Creed' },
    { casa: 'Creed' },
    { casa: 'Creed' },
    { casa: 'Dior' },
    { casa: 'Dior' },
    { casa: 'Chanel' },
  ]);

  it('filtra por mínimo (default 3) preservando el orden', () => {
    expect(casasPrincipales(casas).map((c) => c.casa)).toEqual(['Creed']);
    expect(casasPrincipales(casas, 2).map((c) => c.casa)).toEqual(['Creed', 'Dior']);
  });
});

describe('buildHubCountTextWithCasa', () => {
  it('sin casa es el contador de siempre; con casa lo sufija', () => {
    expect(HUB_CASA_ALL).toBe('all');
    expect(buildHubCountTextWithCasa(12, null)).toBe('12 aromas');
    expect(buildHubCountTextWithCasa(1, 'Creed')).toBe('1 aroma de Creed');
    expect(buildHubCountTextWithCasa(0, 'Chanel')).toBe('0 aromas de Chanel');
  });
});
