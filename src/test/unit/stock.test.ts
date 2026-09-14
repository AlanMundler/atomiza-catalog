import { describe, it, expect } from 'vitest';
import {
  getStockStatus,
  getStockLabel,
  isSizeAvailable,
  isDecantSize,
  sizeStockLabel,
  sizeStockMessage,
} from '@/utils/stock';
import type { PerfumeSize } from '@/data/types';

describe('stock utilities', () => {
  describe('getStockStatus', () => {
    it('returns in-stock when stock >= 5', () => {
      const size: PerfumeSize = { ml: 5, price: 32000, stock: 5 };
      expect(getStockStatus(size)).toBe('in-stock');
    });

    it('returns in-stock when stock is 6', () => {
      const size: PerfumeSize = { ml: 5, price: 32000, stock: 6 };
      expect(getStockStatus(size)).toBe('in-stock');
    });

    it('returns low-stock when stock is 4', () => {
      const size: PerfumeSize = { ml: 5, price: 32000, stock: 4 };
      expect(getStockStatus(size)).toBe('low-stock');
    });

    it('returns low-stock when stock is 3', () => {
      const size: PerfumeSize = { ml: 5, price: 32000, stock: 3 };
      expect(getStockStatus(size)).toBe('low-stock');
    });

    it('returns low-stock when stock is 2', () => {
      const size: PerfumeSize = { ml: 5, price: 32000, stock: 2 };
      expect(getStockStatus(size)).toBe('low-stock');
    });

    it('returns low-stock when stock is 1', () => {
      const size: PerfumeSize = { ml: 5, price: 32000, stock: 1 };
      expect(getStockStatus(size)).toBe('low-stock');
    });

    it('returns out-of-stock when stock is 0', () => {
      const size: PerfumeSize = { ml: 5, price: 32000, stock: 0 };
      expect(getStockStatus(size)).toBe('out-of-stock');
    });
  });

  describe('getStockLabel', () => {
    it('returns correct Spanish labels', () => {
      expect(getStockLabel('in-stock')).toBe('EN STOCK');
      expect(getStockLabel('low-stock')).toBe('POCO STOCK');
      expect(getStockLabel('out-of-stock')).toBe('SIN STOCK');
    });
  });

  describe('isSizeAvailable', () => {
    it('returns true for in-stock and low-stock', () => {
      expect(isSizeAvailable({ ml: 5, price: 32000, stock: 5 })).toBe(true);
      expect(isSizeAvailable({ ml: 5, price: 32000, stock: 2 })).toBe(true);
      expect(isSizeAvailable({ ml: 5, price: 32000, stock: 1 })).toBe(true);
    });

    it('returns false for out-of-stock', () => {
      expect(isSizeAvailable({ ml: 5, price: 32000, stock: 0 })).toBe(false);
    });
  });

  describe('isDecantSize', () => {
    it('5ml es decant, 90/100ml son frasco', () => {
      expect(isDecantSize({ ml: 5 })).toBe(true);
      expect(isDecantSize({ ml: 90 })).toBe(false);
      expect(isDecantSize({ ml: 100 })).toBe(false);
    });
  });

  describe('sizeStockLabel', () => {
    it('decants usan las etiquetas de siempre', () => {
      expect(sizeStockLabel({ ml: 5, price: 6000, stock: 10 })).toBe('EN STOCK');
      expect(sizeStockLabel({ ml: 5, price: 6000, stock: 3 })).toBe('POCO STOCK');
      expect(sizeStockLabel({ ml: 5, price: 6000, stock: 0 })).toBe('SIN STOCK');
    });

    it('frascos dicen las unidades exactas', () => {
      expect(sizeStockLabel({ ml: 100, price: 100000, stock: 1 })).toBe('QUEDA 1 UNIDAD');
      expect(sizeStockLabel({ ml: 90, price: 70000, stock: 2 })).toBe('QUEDAN 2 UNIDADES');
      expect(sizeStockLabel({ ml: 100, price: 100000, stock: 0 })).toBe('SIN STOCK');
    });
  });

  describe('sizeStockMessage', () => {
    it('sin poco stock no hay aviso', () => {
      expect(sizeStockMessage({ ml: 5, price: 6000, stock: 10 })).toBeNull();
      expect(sizeStockMessage({ ml: 100, price: 100000, stock: 10 })).toBeNull();
      expect(sizeStockMessage({ ml: 5, price: 6000, stock: 0 })).toBeNull();
    });

    it('decants avisan en decants', () => {
      expect(sizeStockMessage({ ml: 5, price: 6000, stock: 3 })).toContain('3 decants');
      expect(sizeStockMessage({ ml: 5, price: 6000, stock: 1 })).toContain('decant');
    });

    it('frascos avisan en frascos con unidades exactas', () => {
      expect(sizeStockMessage({ ml: 100, price: 100000, stock: 1 })).toBe(
        '¡Última unidad! Queda 1 frasco de este perfume'
      );
      expect(sizeStockMessage({ ml: 90, price: 70000, stock: 2 })).toContain('2 frascos');
    });
  });
});