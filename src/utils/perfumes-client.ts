import { site } from '@/site.config';
import type { Perfume } from '@/data/types';

type PerfumeMap = Map<string, Perfume>;

interface CachedCatalog {
  version: string;
  data: { perfumes: Perfume[] };
}

let cached: PerfumeMap | null = null;

function toMap(data: { perfumes: Perfume[] }): PerfumeMap {
  return new Map((data.perfumes || []).map((p) => [p.id, p]));
}

async function getCached(): Promise<PerfumeMap | null> {
  const stored = localStorage.getItem(site.storage.perfumes);
  if (!stored) return null;
  try {
    const parsed = JSON.parse(stored) as Partial<CachedCatalog>;
    // La versión evita que un deploy con precios/stock nuevos quede
    // oculto para visitantes que ya tienen el catálogo cacheado.
    if (parsed?.version === site.dataVersion && Array.isArray(parsed.data?.perfumes)) {
      return toMap(parsed.data);
    }
  } catch {
    // cache corrupto, se vuelve a buscar
  }
  return null;
}

async function fetchFresh(): Promise<PerfumeMap> {
  const res = await fetch(site.basePath + 'data/perfumes.json');
  if (!res.ok) throw new Error(`No se pudo cargar el catálogo (${res.status})`);
  const data = await res.json();
  const payload: CachedCatalog = { version: site.dataVersion, data };
  localStorage.setItem(site.storage.perfumes, JSON.stringify(payload));
  return toMap(data);
}

export async function getPerfumesMap(force = false): Promise<PerfumeMap> {
  if (!force && cached) return cached;
  if (force) {
    cached = await fetchFresh();
    return cached;
  }
  const fromCache = await getCached();
  if (fromCache) {
    cached = fromCache;
    return cached;
  }
  cached = await fetchFresh();
  return cached;
}
