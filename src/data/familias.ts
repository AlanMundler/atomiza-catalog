import perfumesData from '@/data/perfumes.json';
import type { Perfume } from '@/data/types';
import { slugify } from '@/utils/text';

interface Familia {
  name: string;
  slug: string;
  items: Perfume[];
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
