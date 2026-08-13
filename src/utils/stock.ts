import type { PerfumeSize, StockStatus } from '@/data/types';

export function getStockStatus(size: PerfumeSize): StockStatus {
  if (size.stock === 0) return 'out-of-stock';
  if (size.stock <= 2) return 'low-stock';
  return 'in-stock';
}

export function getStockLabel(status: StockStatus): string {
  switch (status) {
    case 'in-stock':
      return 'EN STOCK';
    case 'low-stock':
      return 'ÚLTIMAS UNIDADES';
    case 'out-of-stock':
      return 'AGOTADO';
  }
}

export function getStockColor(status: StockStatus): string {
  switch (status) {
    case 'in-stock':
      return '#8dba7d';
    case 'low-stock':
      return '#c5a059';
    case 'out-of-stock':
      return '#333333';
  }
}

export function isSizeAvailable(size: PerfumeSize): boolean {
  return size.stock > 0;
}