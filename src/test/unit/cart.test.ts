import { describe, it, expect, beforeEach, vi } from 'vitest';
import { 
  getCart, 
  addToCart, 
  removeFromCart, 
  updateCartItemQuantity, 
  clearCart,
  getCartItemCount,
  getCartSubtotal,
  canAddToCart
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

  describe('canAddToCart', () => {
    it('returns true when stock is available', () => {
      expect(canAddToCart(mockPerfumeSize, 1)).toBe(true);
    });

    it('returns false when stock is 0', () => {
      expect(canAddToCart({ ...mockPerfumeSize, stock: 0 }, 1)).toBe(false);
    });

    it('returns false when requested quantity exceeds stock', () => {
      expect(canAddToCart(mockPerfumeSize, 5)).toBe(false);
    });

    it('accounts for existing items in cart', () => {
      localStorage.setItem('atomiza-cart', JSON.stringify({
        items: [{ ...mockCartItem1, quantity: 1 }],
        updatedAt: Date.now()
      }));
      
      // Already 1 in cart, stock is 2, so can add 1 more
      expect(canAddToCart(mockPerfumeSize, 1)).toBe(true);
      expect(canAddToCart(mockPerfumeSize, 2)).toBe(false);
    });
  });
});