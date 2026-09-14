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

/**
 * Texto del chip de stock del selector de talles. Los decants usan
 * las etiquetas de siempre; los frascos dicen las unidades exactas.
 */
export function sizeStockLabel(size: PerfumeSize): string {
  if (!isDecantSize(size) && size.stock > 0) {
    return size.stock === 1 ? 'QUEDA 1 UNIDAD' : `QUEDAN ${size.stock} UNIDADES`;
  }
  return getStockLabel(getStockStatus(size));
}

/**
 * Aviso de poco stock de la ficha ("Quedan solo..."). Solo aparece
 * con 1-4 unidades; con 0 o 5+ no hay nada que avisar.
 */
export function sizeStockMessage(size: PerfumeSize): string | null {
  if (size.stock <= 0 || size.stock >= 5) return null;
  if (!isDecantSize(size)) {
    return size.stock === 1
      ? '¡Última unidad! Queda 1 frasco de este perfume'
      : `Quedan solo ${size.stock} frascos de este perfume`;
  }
  return `Quedan solo ${size.stock} ${size.stock === 1 ? 'decant' : 'decants'} de este aroma`;
}