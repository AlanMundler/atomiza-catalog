import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getCart,
  addToCart,
  removeFromCart,
  changeCartItemQuantity,
  clearCart,
  getCartItemCount
} from '@/utils/cart';
import type { CartItem, PerfumeSize } from '@/data/types';

const mockPerfumeSize: PerfumeSize = { ml: 5, price: 32000, stock: 2 };
const mockPerfumeSize2: PerfumeSize = { ml: 5, price: 15000, stock: 5 };

const mockCartItem1: CartItem = {
  perfumeId: 'tobacco-vanille',
  size: mockPerfumeSize,
  quantity: 1
};

const mockCartItem2: CartItem = {
  perfumeId: 'baccarat-rouge-540',
  size: mockPerfumeSize2,
  quantity: 2
};

describe('cart utilities', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.resetAllMocks();
  });

  describe('getCart', () => {
    it('returns empty cart when localStorage is empty', () => {
      const cart = getCart();
      expect(cart.items).toEqual([]);
      expect(typeof cart.updatedAt).toBe('number');
    });

    it('returns parsed cart from localStorage', () => {
      const storedCart = {
        items: [mockCartItem1],
        updatedAt: Date.now()
      };
      localStorage.setItem('atomiza-cart', JSON.stringify(storedCart));
      
      const cart = getCart();
      expect(cart.items).toHaveLength(1);
      expect(cart.items[0].perfumeId).toBe('tobacco-vanille');
    });

    it('handles corrupted localStorage gracefully', () => {
      localStorage.setItem('atomiza-cart', 'invalid-json');
      const cart = getCart();
      expect(cart.items).toEqual([]);
    });

    it('drops malformed items (missing price/size, empty id)', () => {
      localStorage.setItem('atomiza-cart', JSON.stringify({
        items: [
          { perfumeId: 'ok', size: { ml: 5, price: 32000, stock: 2 }, quantity: 1 },
          { perfumeId: 'no-size', size: null, quantity: 1 },
          { perfumeId: '', size: { ml: 5, price: 32000, stock: 2 }, quantity: 1 },
          { perfumeId: 'bad-price', size: { ml: 5, price: 'x', stock: 2 }, quantity: 1 },
        ],
        updatedAt: Date.now()
      }));

      const cart = getCart();
      expect(cart.items).toHaveLength(1);
      expect(cart.items[0].perfumeId).toBe('ok');
    });

    it('drops degenerate sizes (ml 0/fraction, negative price/stock)', () => {
      localStorage.setItem('atomiza-cart', JSON.stringify({
        items: [
          { perfumeId: 'ok', size: { ml: 5, price: 32000, stock: 2 }, quantity: 1 },
          { perfumeId: 'ml-zero', size: { ml: 0, price: 32000, stock: 2 }, quantity: 1 },
          { perfumeId: 'ml-frac', size: { ml: 2.5, price: 32000, stock: 2 }, quantity: 1 },
          { perfumeId: 'neg-price', size: { ml: 5, price: -100, stock: 2 }, quantity: 1 },
          { perfumeId: 'neg-stock', size: { ml: 5, price: 32000, stock: -3 }, quantity: 1 },
        ],
        updatedAt: Date.now()
      }));

      const cart = getCart();
      // ok + neg-stock (recortado a 0, visible como no disponible y eliminable)
      expect(cart.items.map((i) => i.perfumeId).sort()).toEqual(['neg-stock', 'ok']);
      expect(cart.items.find((i) => i.perfumeId === 'neg-stock')?.size.stock).toBe(0);
    });

    it('normalizes invalid quantities (non-integer, string, over stock)', () => {
      localStorage.setItem('atomiza-cart', JSON.stringify({
        items: [
          { perfumeId: 'a', size: { ml: 5, price: 32000, stock: 10 }, quantity: 2.5 },
          { perfumeId: 'b', size: { ml: 5, price: 32000, stock: 10 }, quantity: '2' },
          { perfumeId: 'c', size: { ml: 5, price: 32000, stock: 10 }, quantity: 50 },
        ],
        updatedAt: Date.now()
      }));

      const cart = getCart();
      expect(cart.items[0].quantity).toBe(1); // 2.5 → 1
      expect(cart.items[1].quantity).toBe(1); // '2' → 1
      expect(cart.items[2].quantity).toBe(10); // cap en stock
    });
  });

  describe('addToCart', () => {
    it('adds new item to empty cart', () => {
      const cart = addToCart(mockCartItem1);
      expect(cart.items).toHaveLength(1);
      expect(cart.items[0]).toEqual(mockCartItem1);
    });

    it('increments quantity when same perfume and size exists', () => {
      localStorage.setItem('atomiza-cart', JSON.stringify({
        items: [mockCartItem1],
        updatedAt: Date.now()
      }));
      
      const cart = addToCart({ ...mockCartItem1, quantity: 1 });
      expect(cart.items).toHaveLength(1);
      expect(cart.items[0].quantity).toBe(2);
    });

    it('increments quantity when adding the same item again', () => {
      localStorage.setItem('atomiza-cart', JSON.stringify({
        items: [mockCartItem1],
        updatedAt: Date.now()
      }));
      
      const cart = addToCart({ 
        perfumeId: 'tobacco-vanille', 
        size: mockPerfumeSize2, 
        quantity: 1 
      });
      expect(cart.items).toHaveLength(1);
      expect(cart.items[0].quantity).toBe(2);
    });

    it('adds separate entry for different perfume', () => {
      localStorage.setItem('atomiza-cart', JSON.stringify({
        items: [mockCartItem1],
        updatedAt: Date.now()
      }));
      
      const cart = addToCart(mockCartItem2);
      expect(cart.items).toHaveLength(2);
      expect(cart.items[1].perfumeId).toBe('baccarat-rouge-540');
    });

    it('respects stock limit when adding', () => {
      const cart = addToCart({ ...mockCartItem1, quantity: 5 });
      expect(cart.items[0].quantity).toBe(2); // Limited by stock
    });
  });

  describe('removeFromCart', () => {
    it('removes item from cart', () => {
      localStorage.setItem('atomiza-cart', JSON.stringify({
        items: [mockCartItem1, mockCartItem2],
        updatedAt: Date.now()
      }));
      
      const cart = removeFromCart('tobacco-vanille', mockPerfumeSize.ml);
      expect(cart.items).toHaveLength(1);
      expect(cart.items[0].perfumeId).toBe('baccarat-rouge-540');
    });

    it('handles removing non-existent item', () => {
      localStorage.setItem('atomiza-cart', JSON.stringify({
        items: [mockCartItem1],
        updatedAt: Date.now()
      }));
      
      const cart = removeFromCart('non-existent', mockPerfumeSize.ml);
      expect(cart.items).toHaveLength(1);
    });

    it('removes by id+ml even without the catalog size (ghost item)', () => {
      localStorage.setItem('atomiza-cart', JSON.stringify({
        items: [{ perfumeId: 'borrado', size: { ml: 5, price: 6000, stock: 0 }, quantity: 1 }],
        updatedAt: Date.now()
      }));

      const cart = removeFromCart('borrado', 5);
      expect(cart.items).toHaveLength(0);
    });
  });

  describe('changeCartItemQuantity', () => {
    it('aplica el delta sobre la cantidad guardada (atómico)', () => {
      const sizeWithStock: PerfumeSize = { ml: 5, price: 32000, stock: 10 };
      localStorage.setItem('atomiza-cart', JSON.stringify({
        items: [{ perfumeId: 'tobacco-vanille', size: sizeWithStock, quantity: 1 }],
        updatedAt: Date.now()
      }));

      const cart = changeCartItemQuantity('tobacco-vanille', sizeWithStock, 2);
      expect(cart.items[0].quantity).toBe(3);
    });

    it('elimina el item cuando el delta lo deja en 0', () => {
      localStorage.setItem('atomiza-cart', JSON.stringify({
        items: [mockCartItem1],
        updatedAt: Date.now()
      }));

      const cart = changeCartItemQuantity('tobacco-vanille', mockPerfumeSize, -1);
      expect(cart.items).toHaveLength(0);
    });

    it('recorta contra el stock disponible', () => {
      localStorage.setItem('atomiza-cart', JSON.stringify({
        items: [mockCartItem1],
        updatedAt: Date.now()
      }));

      const cart = changeCartItemQuantity('tobacco-vanille', mockPerfumeSize, 10);
      expect(cart.items[0].quantity).toBe(2); // Stock limit
    });

    it('ignora deltas no finitos en vez de guardar quantity NaN', () => {
      localStorage.setItem('atomiza-cart', JSON.stringify({
        items: [mockCartItem1],
        updatedAt: Date.now()
      }));

      const cart = changeCartItemQuantity('tobacco-vanille', mockPerfumeSize, NaN);
      expect(cart.items).toHaveLength(1);
      expect(cart.items[0].quantity).toBe(1);
      expect(Number.isFinite(getCartItemCount())).toBe(true);
    });
  });

  describe('clearCart', () => {
    it('empties the cart', () => {
      localStorage.setItem('atomiza-cart', JSON.stringify({
        items: [mockCartItem1, mockCartItem2],
        updatedAt: Date.now()
      }));
      
      const cart = clearCart();
      expect(cart.items).toHaveLength(0);
    });
  });

  describe('getCartItemCount', () => {
    it('returns total quantity of all items', () => {
      localStorage.setItem('atomiza-cart', JSON.stringify({
        items: [mockCartItem1, mockCartItem2],
        updatedAt: Date.now()
      }));
      
      expect(getCartItemCount()).toBe(3); // 1 + 2
    });

    it('returns 0 for empty cart', () => {
      expect(getCartItemCount()).toBe(0);
    });
  });
});