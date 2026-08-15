import { describe, it, expect, beforeEach, vi } from 'vitest';
import { 
  getCart, 
  addToCart, 
  removeFromCart, 
  updateCartItemQuantity, 
  clearCart,
  getCartItemCount,
  getCartSubtotal
} from '@/utils/cart';
import type { CartItem, PerfumeSize } from '@/data/types';

const mockPerfumeSize: PerfumeSize = { ml: 5, price: 32000, stock: 2 };
const mockPerfumeSize2: PerfumeSize = { ml: 2, price: 15000, stock: 5 };

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

    it('adds separate entry for different size of same perfume', () => {
      localStorage.setItem('atomiza-cart', JSON.stringify({
        items: [mockCartItem1],
        updatedAt: Date.now()
      }));
      
      const cart = addToCart({ 
        perfumeId: 'tobacco-vanille', 
        size: mockPerfumeSize2, 
        quantity: 1 
      });
      expect(cart.items).toHaveLength(2);
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
      
      const cart = removeFromCart('tobacco-vanille', mockPerfumeSize);
      expect(cart.items).toHaveLength(1);
      expect(cart.items[0].perfumeId).toBe('baccarat-rouge-540');
    });

    it('handles removing non-existent item', () => {
      localStorage.setItem('atomiza-cart', JSON.stringify({
        items: [mockCartItem1],
        updatedAt: Date.now()
      }));
      
      const cart = removeFromCart('non-existent', mockPerfumeSize);
      expect(cart.items).toHaveLength(1);
    });
  });

  describe('updateCartItemQuantity', () => {
    it('updates quantity for existing item', () => {
      const sizeWithStock: PerfumeSize = { ml: 5, price: 32000, stock: 10 };
      localStorage.setItem('atomiza-cart', JSON.stringify({
        items: [{ perfumeId: 'tobacco-vanille', size: sizeWithStock, quantity: 1 }],
        updatedAt: Date.now()
      }));
      
      const cart = updateCartItemQuantity('tobacco-vanille', sizeWithStock, 3);
      expect(cart.items[0].quantity).toBe(3);
    });

    it('removes item when quantity is set to 0', () => {
      localStorage.setItem('atomiza-cart', JSON.stringify({
        items: [mockCartItem1],
        updatedAt: Date.now()
      }));
      
      const cart = updateCartItemQuantity('tobacco-vanille', mockPerfumeSize, 0);
      expect(cart.items).toHaveLength(0);
    });

    it('caps quantity at available stock', () => {
      localStorage.setItem('atomiza-cart', JSON.stringify({
        items: [mockCartItem1],
        updatedAt: Date.now()
      }));
      
      const cart = updateCartItemQuantity('tobacco-vanille', mockPerfumeSize, 10);
      expect(cart.items[0].quantity).toBe(2); // Stock limit
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

  describe('getCartSubtotal', () => {
    it('calculates correct subtotal', () => {
      localStorage.setItem('atomiza-cart', JSON.stringify({
        items: [mockCartItem1, mockCartItem2],
        updatedAt: Date.now()
      }));
      
      // 32000 * 1 + 15000 * 2 = 62000
      expect(getCartSubtotal()).toBe(62000);
    });

    it('returns 0 for empty cart', () => {
      expect(getCartSubtotal()).toBe(0);
    });
  });
});