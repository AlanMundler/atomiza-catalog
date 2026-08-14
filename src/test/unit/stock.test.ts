import { describe, it, expect } from 'vitest';
import { getStockStatus, getStockLabel, getStockColor, isSizeAvailable } from '@/utils/stock';
import type { PerfumeSize } from '@/data/types';

describe('stock utilities', () => {
  describe('getStockStatus', () => {
    it('returns in-stock when stock > 3', () => {
      const size: PerfumeSize = { ml: 5, price: 32000, stock: 5 };
      expect(getStockStatus(size)).toBe('in-stock');
    });

    it('returns in-stock when stock === 3', () => {
      const size: PerfumeSize = { ml: 5, price: 32000, stock: 3 };
      expect(getStockStatus(size)).toBe('in-stock');
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
      expect(getStockLabel('low-stock')).toBe('ÚLTIMAS UNIDADES');
      expect(getStockLabel('out-of-stock')).toBe('AGOTADO');
    });
  });

  describe('getStockColor', () => {
    it('returns correct color values from design tokens', () => {
      expect(getStockColor('in-stock')).toBe('#8dba7d');
      expect(getStockColor('low-stock')).toBe('#c5a059');
      expect(getStockColor('out-of-stock')).toBe('#333333');
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
});