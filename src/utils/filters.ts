import type { Perfume, GenderFilter } from '@/data/types';

export function filterPerfumes(perfumes: Perfume[], filter: GenderFilter): Perfume[] {
  if (filter === 'all') return perfumes;
  if (filter === 'unisex') return perfumes.filter((perfume) => perfume.gender === 'unisex');
  if (filter === 'masculino') {
    return perfumes.filter(
      (perfume) => perfume.gender === 'masculino' || perfume.gender === 'unisex'
    );
  }
  if (filter === 'femenino') {
    return perfumes.filter(
      (perfume) => perfume.gender === 'femenino' || perfume.gender === 'unisex'
    );
  }
  return perfumes.filter((perfume) => perfume.gender === filter);
}

export function searchPerfumes(perfumes: Perfume[], query: string): Perfume[] {
  if (!query.trim()) return perfumes;

  const lowerQuery = query.toLowerCase().trim();
  return perfumes.filter(
    (perfume) =>
      perfume.brand.toLowerCase().includes(lowerQuery) ||
      perfume.name.toLowerCase().includes(lowerQuery)
  );
}