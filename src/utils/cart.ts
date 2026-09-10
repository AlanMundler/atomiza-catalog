import type { CartItem, CartState, PerfumeSize } from '@/data/types';
import { site } from '@/site.config';

const CART_STORAGE_KEY = site.storage.cart;

/**
 * Valida la forma del carrito leído de localStorage y descarta entradas
 * malformadas. Evita que datos corruptos/tocados rendericen HTML peligroso
 * o produzcan `NaN` en precios y cantidades.
 */
function normalizeCart(value: unknown): CartState {
  const fallback = { items: [], updatedAt: Date.now() };
  if (typeof value !== 'object' || value === null) return fallback;
  const raw = value as { items?: unknown };
  if (!Array.isArray(raw.items)) return fallback;

  const items: CartItem[] = [];
  for (const entry of raw.items) {
    if (typeof entry !== 'object' || entry === null) continue;
    const item = entry as { perfumeId?: unknown; size?: unknown; quantity?: unknown };
    const size = item.size as { ml?: unknown; price?: unknown; stock?: unknown } | null | undefined;
    const ml = Number(size?.ml);
    const price = Number(size?.price);
    const stock = Number(size?.stock);
    const perfumeId = typeof item.perfumeId === 'string' ? item.perfumeId.trim() : '';
    if (!perfumeId || !Number.isFinite(ml) || !Number.isFinite(price) || !Number.isFinite(stock)) {
      continue;
    }
    let quantity = Number.isInteger(item.quantity) ? (item.quantity as number) : 1;
    if (quantity < 1) quantity = 1;
    if (stock > 0) quantity = Math.min(quantity, stock);
    items.push({
      perfumeId,
      size: { ml: ml as PerfumeSize['ml'], price, stock },
      quantity,
    });
  }

  return { items, updatedAt: Date.now() };
}

function getStoredCart(): CartState {
  try {
    const stored = localStorage.getItem(CART_STORAGE_KEY);
    if (stored) {
      return normalizeCart(JSON.parse(stored));
    }
  } catch {
    // Ignore parse errors
  }
  return { items: [], updatedAt: Date.now() };
}

function saveCart(cart: CartState): void {
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  } catch {
    // Cuota llena o modo privado: el carrito vive solo en memoria.
  }
}

function findItemIndex(items: CartItem[], perfumeId: string, size: PerfumeSize): number {
  return items.findIndex(
    (item) => item.perfumeId === perfumeId && item.size.ml === size.ml
  );
}

export function getCart(): CartState {
  return getStoredCart();
}

export function addToCart(item: CartItem): CartState {
  const cart = getStoredCart();
  const existingIndex = findItemIndex(cart.items, item.perfumeId, item.size);
  const incoming = Number.isInteger(item.quantity) && item.quantity > 0 ? item.quantity : 1;

  if (existingIndex >= 0) {
    const newQuantity = Math.min(
      cart.items[existingIndex].quantity + incoming,
      item.size.stock
    );
    // stock 0 (o cantidad resultante 0) elimina el item: nunca se guarda
    // un fantasma con quantity 0 que el drawer trataría como no-vacío.
    if (newQuantity <= 0) {
      cart.items.splice(existingIndex, 1);
    } else {
      cart.items[existingIndex].quantity = newQuantity;
    }
  } else {
    const quantity = Math.min(incoming, item.size.stock);
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
  const qty = Number.isInteger(quantity) ? quantity : 1;

  if (index >= 0) {
    const capped = Math.min(qty, size.stock);
    if (qty <= 0 || capped <= 0) {
      cart.items.splice(index, 1);
    } else {
      cart.items[index].quantity = capped;
    }
    cart.updatedAt = Date.now();
    saveCart(cart);
  }

  return cart;
}

/**
 * Cambia la cantidad en `delta` (+1/-1) leyendo el carrito fresco dentro de
 * la misma operación. Evita el lost-update de leer-modificar-escribir con
 * dos clicks rápidos (cada handler leía la misma cantidad vieja).
 */
export function changeCartItemQuantity(
  perfumeId: string,
  size: PerfumeSize,
  delta: number
): CartState {
  const cart = getStoredCart();
  const index = findItemIndex(cart.items, perfumeId, size);
  if (index < 0) return cart;
  const next = Math.min(cart.items[index].quantity + delta, size.stock);
  if (next <= 0) {
    cart.items.splice(index, 1);
  } else {
    cart.items[index].quantity = next;
  }
  cart.updatedAt = Date.now();
  saveCart(cart);
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