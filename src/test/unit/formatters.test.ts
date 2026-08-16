import { describe, it, expect } from 'vitest';
import { formatPrice, generateOrderText, escapeHtml, resolveCartItems } from '@/utils/formatters';
import type { CartItem, Perfume } from '@/data/types';

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

    it('does not render NaN for invalid prices', () => {
      expect(formatPrice(NaN)).toBe('$—');
    });
  });

  describe('escapeHtml', () => {
    it('escapes HTML-sensitive characters', () => {
      expect(escapeHtml(`<img src=x onerror="alert(1)">`)).toBe(
        '&lt;img src=x onerror=&quot;alert(1)&quot;&gt;'
      );
      expect(escapeHtml(`a'b`)).toBe(`a&#39;b`);
      expect(escapeHtml(null)).toBe('');
    });
  });

  describe('generateOrderText (WhatsApp channel)', () => {
    const perfume: Perfume = {
      id: 'tobacco-vanille',
      slug: 'tobacco-vanille',
      brand: 'Tom Ford',
      name: 'Tobacco Vanille',
      gender: 'unisex',
      olfactoryFamily: 'Amaderada Especiada',
      description: 'Rich, warm, iconic...',
      notes: { top: [], heart: [], base: [] },
      images: [],
      sizes: [{ ml: 5, price: 32000, stock: 2 }],
      isBoutiqueExclusive: false,
      featured: true
    };

    const perfumesMap = new Map([['tobacco-vanille', perfume]]);

    it('uses the live catalog price over a stale snapshot', () => {
      const items: CartItem[] = [
        { perfumeId: 'tobacco-vanille', size: { ml: 5, price: 1, stock: 2 }, quantity: 1 }
      ];
      const result = generateOrderText(items, perfumesMap, 'Test', 'Test');
      expect(result).toContain('$32.000');
      expect(result).not.toContain('$1');
    });

    it('includes a correct WhatsApp footer', () => {
      const result = generateOrderText([], perfumesMap, 'Test', 'Test', 'whatsapp');
      expect(result).toContain('Enviar por WhatsApp a ΛTOMIZΛ');
      expect(result).not.toContain('@atomiza.cba');
    });
  });

  describe('resolveCartItems', () => {
    const perfume: Perfume = {
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
        { ml: 5, price: 32000, stock: 2 }
      ],
      isBoutiqueExclusive: false,
      featured: true
    };

    const perfumesMap = new Map([['tobacco-vanille', perfume]]);

    it('uses the live price and stock over a stale snapshot', () => {
      const items: CartItem[] = [
        { perfumeId: 'tobacco-vanille', size: { ml: 5, price: 1, stock: 99 }, quantity: 1 }
      ];
      const [resolved] = resolveCartItems(items, perfumesMap);
      expect(resolved.available).toBe(true);
      expect(resolved.size.price).toBe(32000);
      expect(resolved.size.stock).toBe(2);
    });

    it('clamps quantity to the live stock', () => {
      const items: CartItem[] = [
        { perfumeId: 'tobacco-vanille', size: { ml: 5, price: 32000, stock: 2 }, quantity: 7 }
      ];
      const [resolved] = resolveCartItems(items, perfumesMap);
      expect(resolved.quantity).toBe(2);
      expect(resolved.requestedQuantity).toBe(7);
    });

    it('marks out-of-stock perfumes as unavailable', () => {
      const outOfStock: Perfume = {
        ...perfume,
        sizes: [{ ml: 5, price: 32000, stock: 0 }]
      };
      const map = new Map([['tobacco-vanille', outOfStock]]);
      const items: CartItem[] = [
        { perfumeId: 'tobacco-vanille', size: { ml: 5, price: 32000, stock: 0 }, quantity: 1 }
      ];
      const [resolved] = resolveCartItems(items, map);
      expect(resolved.available).toBe(false);
      expect(resolved.quantity).toBe(0);
    });

    it('marks unknown perfumes as unavailable keeping the snapshot size', () => {
      const items: CartItem[] = [
        { perfumeId: 'no-existe', size: { ml: 5, price: 6000, stock: 10 }, quantity: 1 }
      ];
      const [resolved] = resolveCartItems(items, perfumesMap);
      expect(resolved.perfume).toBeNull();
      expect(resolved.available).toBe(false);
      expect(resolved.size.ml).toBe(5);
    });

    it('falls back to the primary 5ml size when the requested ml does not exist', () => {
      const items = [
        { perfumeId: 'tobacco-vanille', size: { ml: 99, price: 1, stock: 1 }, quantity: 1 }
      ] as unknown as CartItem[];
      const [resolved] = resolveCartItems(items, perfumesMap);
      expect(resolved.available).toBe(true);
      expect(resolved.size.ml).toBe(5);
      expect(resolved.size.price).toBe(32000);
    });

    it('normalizes invalid quantities to 1', () => {
      const items: CartItem[] = [
        { perfumeId: 'tobacco-vanille', size: { ml: 5, price: 32000, stock: 2 }, quantity: 0 },
        { perfumeId: 'tobacco-vanille', size: { ml: 5, price: 32000, stock: 2 }, quantity: NaN }
      ];
      const resolved = resolveCartItems(items, perfumesMap);
      expect(resolved[0].requestedQuantity).toBe(1);
      expect(resolved[1].requestedQuantity).toBe(1);
    });
  });

  describe('generateOrderText (out-of-stock handling)', () => {
    const inStock: Perfume = {
      id: 'tobacco-vanille',
      slug: 'tobacco-vanille',
      brand: 'Tom Ford',
      name: 'Tobacco Vanille',
      gender: 'unisex',
      olfactoryFamily: 'Amaderada Especiada',
      description: 'Rich, warm, iconic...',
      notes: { top: [], heart: [], base: [] },
      images: [],
      sizes: [{ ml: 5, price: 32000, stock: 2 }],
      isBoutiqueExclusive: false,
      featured: true
    };

    const outOfStock: Perfume = {
      ...inStock,
      id: 'hawas-black',
      slug: 'hawas-black',
      brand: 'Rasasi',
      name: 'Hawas Black',
      sizes: [{ ml: 5, price: 10000, stock: 0 }]
    };

    const perfumesMap = new Map([
      ['tobacco-vanille', inStock],
      ['hawas-black', outOfStock]
    ]);

    it('excludes out-of-stock items from the detail and the total', () => {
      const items: CartItem[] = [
        { perfumeId: 'tobacco-vanille', size: { ml: 5, price: 32000, stock: 2 }, quantity: 1 },
        { perfumeId: 'hawas-black', size: { ml: 5, price: 10000, stock: 0 }, quantity: 1 }
      ];
      const result = generateOrderText(items, perfumesMap, 'Test', 'Test');
      expect(result).toContain('• Tom Ford - Tobacco Vanille (5ml) x1 — $32.000');
      expect(result).not.toContain('Hawas Black');
      expect(result).toContain('💰 TOTAL: $32.000');
      expect(result).toContain('⚠️ Un perfume quedó sin stock y no se incluyó.');
    });

    it('clamps quantity to live stock in the order text', () => {
      const items: CartItem[] = [
        { perfumeId: 'tobacco-vanille', size: { ml: 5, price: 32000, stock: 2 }, quantity: 5 }
      ];
      const result = generateOrderText(items, perfumesMap, 'Test', 'Test');
      expect(result).toContain('x2 — $64.000');
      expect(result).toContain('💰 TOTAL: $64.000');
    });
  });

  describe('generateOrderText (Instagram channel)', () => {
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
      const result = generateOrderText(cartItems, perfumesMap, 'Juan Pérez', '+54 9 11 1234-5678', 'instagram');

      expect(result).toContain('📦 NUEVO PEDIDO - ΛTOMIZΛ');
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
      const result = generateOrderText([], perfumesMap, 'Test', 'Test', 'instagram');
      expect(result).toContain('💰 TOTAL: $0');
    });

    it('calculates totals correctly for multiple quantities', () => {
      const items: CartItem[] = [
        { perfumeId: 'tobacco-vanille', size: { ml: 2, price: 15000, stock: 5 }, quantity: 3 }
      ];
      const result = generateOrderText(items, perfumesMap, 'Test', 'Test', 'instagram');
      expect(result).toContain('$45.000');
      expect(result).toContain('x3');
    });
  });
});
