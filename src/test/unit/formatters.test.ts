import { describe, it, expect } from 'vitest';
import { formatPrice, generateInstagramOrderText } from '@/utils/formatters';
import type { CartItem, Perfume, PerfumeSize } from '@/data/types';

describe('formatters', () => {
  describe('formatPrice', () => {
    it('formats price with ARS currency symbol and thousand separators', () => {
      expect(formatPrice(15000)).toBe('$15.000');
      expect(formatPrice(32000)).toBe('$32.000');
      expect(formatPrice(55000)).toBe('$55.000');
      expect(formatPrice(1000)).toBe('$1.000');
      expect(formatPrice(1000000)).toBe('$1.000.000');
    });

    it('handles zero price', () => {
      expect(formatPrice(0)).toBe('$0');
    });

    it('handles prices without thousands', () => {
      expect(formatPrice(500)).toBe('$500');
    });
  });

  describe('generateInstagramOrderText', () => {
    const mockPerfume1: Perfume = {
      id: 'tobacco-vanille',
      slug: 'tobacco-vanille',
      brand: 'Tom Ford',
      name: 'Tobacco Vanille',
      gender: 'unisex',
      olfactoryFamily: 'Amaderada Especiada',
      description: 'Rich, warm, iconic...',
      notes: { top: [], heart: [], base: [] },
      images: [],
      sizes: [
        { ml: 2, price: 15000, stock: 5 },
        { ml: 5, price: 32000, stock: 2 },
        { ml: 10, price: 55000, stock: 0 }
      ],
      isBoutiqueExclusive: false,
      featured: true
    };

    const mockPerfume2: Perfume = {
      id: 'baccarat-rouge-540',
      slug: 'baccarat-rouge-540',
      brand: 'Maison Francis Kurkdjian',
      name: 'Baccarat Rouge 540',
      gender: 'unisex',
      olfactoryFamily: 'Ambarina Floral',
      description: 'Luminous and sophisticated...',
      notes: { top: [], heart: [], base: [] },
      images: [],
      sizes: [
        { ml: 2, price: 18000, stock: 8 },
        { ml: 5, price: 42000, stock: 3 },
        { ml: 10, price: 75000, stock: 1 }
      ],
      isBoutiqueExclusive: false,
      featured: true
    };

    const cartItems: CartItem[] = [
      {
        perfumeId: 'tobacco-vanille',
        size: { ml: 5, price: 32000, stock: 2 },
        quantity: 2
      },
      {
        perfumeId: 'baccarat-rouge-540',
        size: { ml: 2, price: 18000, stock: 8 },
        quantity: 1
      }
    ];

    const perfumesMap = new Map([
      ['tobacco-vanille', mockPerfume1],
      ['baccarat-rouge-540', mockPerfume2]
    ]);

    it('generates correct Instagram order text with all sections', () => {
      const result = generateInstagramOrderText(cartItems, perfumesMap, 'Juan Pérez', '+54 9 11 1234-5678');

      expect(result).toContain('📦 NUEVO PEDIDO - ATOMIZA');
      expect(result).toContain('👤 Cliente: Juan Pérez');
      expect(result).toContain('📱 Contacto: +54 9 11 1234-5678');
      expect(result).toContain('🛍️ DETALLE:');
      expect(result).toContain('• Tom Ford - Tobacco Vanille (5ml) x2 — $64.000');
      expect(result).toContain('• Maison Francis Kurkdjian - Baccarat Rouge 540 (2ml) x1 — $18.000');
      expect(result).toContain('💰 TOTAL: $82.000');
      expect(result).toContain('📍 Envío: [A coordinar]');
      expect(result).toContain('💳 Pago: [Transferencia / Efectivo / A coordinar]');
      expect(result).toContain('Enviar a @atomiza.cba por Instagram DM');
    });

    it('handles empty cart', () => {
      const result = generateInstagramOrderText([], perfumesMap, 'Test', 'Test');
      expect(result).toContain('💰 TOTAL: $0');
    });

    it('calculates totals correctly for multiple quantities', () => {
      const items: CartItem[] = [
        { perfumeId: 'tobacco-vanille', size: { ml: 2, price: 15000, stock: 5 }, quantity: 3 }
      ];
      const result = generateInstagramOrderText(items, perfumesMap, 'Test', 'Test');
      expect(result).toContain('$45.000');
      expect(result).toContain('x3');
    });
  });
});