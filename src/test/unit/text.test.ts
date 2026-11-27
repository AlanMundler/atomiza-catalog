import { describe, it, expect } from 'vitest';
import { normalizeText, slugify } from '@/utils/text';
import { getFamilias } from '@/data/familias';

/** Copia literal de la implementación vieja de familias.ts, para probar que
 *  el slug nuevo es idéntico byte a byte (las URLs viejas no deben romperse). */
function slugifyViejo(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

describe('normalizeText', () => {
  it('pasa a minúsculas y quita acentos (Á/É/Í/Ñ/Ü)', () => {
    expect(normalizeText('Ámbar Épice Índigo Ñandú Über')).toBe(
      'ambar epice indigo nandu uber'
    );
  });

  it('recorta espacios de los bordes sin tocar los internos', () => {
    expect(normalizeText('  Ámbar  Amaderado ')).toBe('ambar  amaderado');
  });
});

describe('slugify', () => {
  it('convierte símbolos y espacios en guiones', () => {
    expect(slugify('Yara Moi | 81')).toBe('yara-moi-81');
  });

  it('elimina los guiones de los bordes', () => {
    expect(slugify('--Rose--')).toBe('rose');
    expect(slugify('  Parfums de Marly  ')).toBe('parfums-de-marly');
  });

  it('quita acentos antes de slugificar', () => {
    expect(slugify('Cítrica Aromática')).toBe('citrica-aromatica');
  });

  it('produce los mismos slugs que la implementación vieja de familias.ts', () => {
    const familias = getFamilias().slice(0, 3);
    expect(familias).toHaveLength(3);
    for (const familia of familias) {
      expect(slugify(familia.name)).toBe(slugifyViejo(familia.name));
      expect(familia.slug).toBe(slugifyViejo(familia.name));
    }
  });
});
