import perfumesData from '@/data/perfumes.json';
import type { Perfume } from '@/data/types';

export interface Familia {
  name: string;
  slug: string;
  items: Perfume[];
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function getFamilias(): Familia[] {
  const perfumes = perfumesData.perfumes as Perfume[];
  const map = new Map<string, Perfume[]>();
  for (const p of perfumes) {
    const key = p.olfactoryFamily;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(p);
  }
  return Array.from(map.entries())
    .map(([name, items]) => ({ name, slug: slugify(name), items }))
    .sort((a, b) => b.items.length - a.items.length);
}
