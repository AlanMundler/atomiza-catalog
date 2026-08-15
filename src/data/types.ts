export interface PerfumeSize {
  ml: 2 | 5 | 10;
  price: number;
  stock: number;
}

export interface PerfumeNotes {
  top: string[];
  heart: string[];
  base: string[];
}

export interface PerfumeImage {
  src: string;
  alt: string;
}

export interface Perfume {
  id: string;
  slug: string;
  brand: string;
  name: string;
  gender: 'masculino' | 'femenino' | 'unisex';
  olfactoryFamily: string;
  description: string;
  notes: PerfumeNotes;
  images: PerfumeImage[];
  sizes: PerfumeSize[];
  isBoutiqueExclusive: boolean;
  featured: boolean;
}

export interface PerfumeCatalog {
  perfumes: Perfume[];
}

export type StockStatus = 'in-stock' | 'low-stock' | 'out-of-stock';

export interface CartItem {
  perfumeId: string;
  size: PerfumeSize;
  quantity: number;
}

export interface CartState {
  items: CartItem[];
  updatedAt: number;
}

export type GenderFilter = 'all' | 'masculino' | 'femenino' | 'unisex';