import { site } from '@/site.config';
import type { Perfume } from '@/data/types';

type PerfumeMap = Map<string, Perfume>;

interface CachedCatalog {
  version: string;
  data: { perfumes: Perfume[] };
}

let cached: PerfumeMap | null = null;
let inFlight: Promise<PerfumeMap> | null = null;

function toMap(data: { perfumes: Perfume[] }): PerfumeMap {
  return new Map((data.perfumes || []).map((p) => [p.id, p]));
}

async function load(): Promise<PerfumeMap> {
  const stored = localStorage.getItem(site.storage.perfumes);
  if (stored) {
    try {
      const parsed = JSON.parse(stored) as Partial<CachedCatalog>;
      // La versión evita que un deploy con precios/stock nuevos quede
      // oculto para visitantes que ya tienen el catálogo cacheado.
      if (parsed?.version === site.dataVersion && Array.isArray(parsed.data?.perfumes)) {
        cached = toMap(parsed.data);
        return cached;
      }
    } catch {
      // cache corrupto, se vuelve a buscar
    }
  }
  const res = await fetch(site.basePath + 'data/perfumes.json');
  if (!res.ok) throw new Error(`No se pudo cargar el catálogo (${res.status})`);
  const data = await res.json();
  const payload: CachedCatalog = { version: site.dataVersion, data };
  localStorage.setItem(site.storage.perfumes, JSON.stringify(payload));
  cached = toMap(data);
  return cached;
}

export function getPerfumesMap(): Promise<PerfumeMap> {
  if (cached) return Promise.resolve(cached);
  if (!inFlight) {
    inFlight = load().finally(() => {
      inFlight = null;
    });
  }
  return inFlight;
}
