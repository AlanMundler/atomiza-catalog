import type { Perfume, GenderFilter } from '@/data/types';

export function filterPerfumes(perfumes: Perfume[], filter: GenderFilter): Perfume[] {
  if (filter === 'all') return perfumes;
  if (filter === 'boutique') return perfumes.filter((perfume) => perfume.isBoutiqueExclusive);
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