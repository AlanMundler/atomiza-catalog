import type { CartItem, CartState, PerfumeSize } from '@/data/types';
import { site } from '@/site.config';

const CART_STORAGE_KEY = site.storage.cart;

function getStoredCart(): CartState {
  try {
    const stored = localStorage.getItem(CART_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    // Ignore parse errors
  }
  return { items: [], updatedAt: Date.now() };
}

function saveCart(cart: CartState): void {
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
}

function findItemIndex(items: CartItem[], perfumeId: string, size: PerfumeSize): number {
  return items.findIndex(
    (item) => item.perfumeId === perfumeId && item.size.ml === size.ml
  );
}

function findItemIndexBySize(items: CartItem[], size: PerfumeSize): number {
  return items.findIndex(
    (item) => item.size.ml === size.ml
  );
}

export function getCart(): CartState {
  return getStoredCart();
}

export function addToCart(item: CartItem): CartState {
  const cart = getStoredCart();
  const existingIndex = findItemIndex(cart.items, item.perfumeId, item.size);

  if (existingIndex >= 0) {
    const newQuantity = Math.min(
      cart.items[existingIndex].quantity + item.quantity,
      item.size.stock
    );
    cart.items[existingIndex].quantity = newQuantity;
  } else {
    const quantity = Math.min(item.quantity, item.size.stock);
    if (quantity > 0) {
      cart.items.push({ ...item, quantity });
    }
  }

  cart.updatedAt = Date.now();
  saveCart(cart);
  return cart;
}

export function removeFromCart(perfumeId: string, size: PerfumeSize): CartState {
  const cart = getStoredCart();
  const index = findItemIndex(cart.items, perfumeId, size);

  if (index >= 0) {
    cart.items.splice(index, 1);
    cart.updatedAt = Date.now();
    saveCart(cart);
  }

  return cart;
}

export function updateCartItemQuantity(
  perfumeId: string,
  size: PerfumeSize,
  quantity: number
): CartState {
  const cart = getStoredCart();
  const index = findItemIndex(cart.items, perfumeId, size);

  if (index >= 0) {
    if (quantity <= 0) {
      cart.items.splice(index, 1);
    } else {
      cart.items[index].quantity = Math.min(quantity, size.stock);
    }
    cart.updatedAt = Date.now();
    saveCart(cart);
  }

  return cart;
}

export function clearCart(): CartState {
  const cart = { items: [], updatedAt: Date.now() };
  saveCart(cart);
  return cart;
}

export function getCartItemCount(): number {
  const cart = getStoredCart();
  return cart.items.reduce((sum, item) => sum + item.quantity, 0);
}

export function getCartSubtotal(): number {
  const cart = getStoredCart();
  return cart.items.reduce((sum, item) => sum + item.size.price * item.quantity, 0);
}

export function canAddToCart(size: PerfumeSize, quantity: number): boolean {
  if (size.stock === 0) return false;
  if (quantity > size.stock) return false;

  const cart = getStoredCart();
  const existingIndex = findItemIndexBySize(cart.items, size);

  if (existingIndex >= 0) {
    return cart.items[existingIndex].quantity + quantity <= size.stock;
  }

  return true;
}