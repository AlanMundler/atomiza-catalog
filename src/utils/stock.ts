import type { Perfume, PerfumeSize, StockStatus } from '@/data/types';

export function getStockStatus(size: PerfumeSize): StockStatus {
  if (size.stock <= 0) return 'out-of-stock';
  if (size.stock < 5) return 'low-stock';
  return 'in-stock';
}

export function getStockLabel(status: StockStatus): string {
  switch (status) {
    case 'in-stock':
      return 'EN STOCK';
    case 'low-stock':
      return 'POCO STOCK';
    case 'out-of-stock':
      return 'SIN STOCK';
  }
}

export function isSizeAvailable(size: PerfumeSize): boolean {
  return size.stock > 0;
}

/**
 * Talle principal del perfume (5ml) o el primero si no lo tiene.
 * Todos los decants son de 5ml; centraliza el `find` repetido en
 * pages, quiz, analytics y home-random.
 */
export function primarySize(perfume: Pick<Perfume, 'sizes'>): PerfumeSize | undefined {
  return perfume.sizes.find((s) => s.ml === 5) || perfume.sizes[0];
}

/**
 * Si el talle es un decant (5ml) o un frasco original (90/100ml).
 * El descuento tridente ("cada 3 decants") cuenta SOLO decants:
 * un frasco suma al subtotal pero no completa tridentes.
 */
export function isDecantSize(size: Pick<PerfumeSize, 'ml'>): boolean {
  return size.ml === 5;
}