import { site } from '@/site.config';
import type { Perfume } from '@/data/types';

type PerfumeMap = Map<string, Perfume>;

let cached: PerfumeMap | null = null;
let inFlight: Promise<PerfumeMap> | null = null;

function toMap(data: { perfumes: Perfume[] }): PerfumeMap {
  return new Map((data.perfumes || []).map((p) => [p.id, p]));
}

async function load(): Promise<PerfumeMap> {
  const stored = localStorage.getItem(site.storage.perfumes);
  if (stored) {
    try {
      cached = toMap(JSON.parse(stored));
      return cached;
    } catch {
      // cache corrupto, se vuelve a buscar
    }
  }
  const res = await fetch(site.basePath + 'data/perfumes.json');
  if (!res.ok) throw new Error(`No se pudo cargar el catálogo (${res.status})`);
  const data = await res.json();
  localStorage.setItem(site.storage.perfumes, JSON.stringify(data));
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
