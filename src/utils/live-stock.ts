import { getStockLabel, getStockStatus } from '@/utils/stock';
import { onPageLoad } from '@/utils/view-transitions';
import type { Perfume, PerfumeSize, StockStatus } from '@/data/types';

export interface LiveStockRow {
  id: string;
  ml: number;
  stock: number;
}

const LIVE_STOCK_URL =
  'https://script.google.com/macros/s/AKfycbzmq3duVxIVGX0omOL480H960kam9MLp6OuPjJf31kzjBCJRRHl4ek0tcXp1VgZH_NdwA/exec';

function slugifyId(raw: string): string {
  return raw
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
const PERFUMES_DATA_KEY = 'perfumes-data';
const CACHE_KEY = 'atomiza-stock-live';
const CACHE_TTL_MS = 15 * 60 * 1000;
const STOCK_CHIP_CLASSES = ['chip--in-stock', 'chip--low-stock', 'chip--out-of-stock'];

export function normalizeRows(raw: unknown): LiveStockRow[] {
  if (!Array.isArray(raw)) return [];
  const rows: LiveStockRow[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const record = item as Record<string, unknown>;
    const id = typeof record.id === 'string' ? slugifyId(record.id) : '';
    const stock = Number(record.stock);
    if (!id) continue;
    if (!Number.isFinite(stock) || stock < 0) continue;
    rows.push({ id, ml: Number(record.ml), stock });
  }
  return rows;
}

function normalizeToken(value: string): string {
  if (typeof value !== 'string' || !value) return '';
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

function tokensOf(value: string): string[] {
  return normalizeToken(value).split(' ').filter(Boolean);
}

function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  let prev = new Array<number>(n + 1);
  for (let j = 0; j <= n; j++) prev[j] = j;
  for (let i = 1; i <= m; i++) {
    const curr = new Array<number>(n + 1);
    curr[0] = i;
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost);
    }
    prev = curr;
  }
  return prev[n];
}

function fuzzyEqual(a: string, b: string): boolean {
  if (a === b) return true;
  const maxLen = Math.max(a.length, b.length);
  if (maxLen < 3) return false;
  return levenshtein(a, b) <= Math.max(1, Math.floor(maxLen * 0.2));
}

function perfumeMatchScore(rowId: string, perfume: { id: string; name: string }): number {
  const row = normalizeToken(rowId);
  if (!row) return 0;
  const idN = normalizeToken(perfume.id);
  const nameN = normalizeToken(perfume.name);
  if (row === idN || row === nameN) return 1000;
  if (idN.includes(row) || nameN.includes(row)) return 900;
  const rowTokens = tokensOf(rowId);
  if (rowTokens.length === 0) return 0;
  const candidates = new Set([...tokensOf(perfume.id), ...tokensOf(perfume.name)]);
  let matched = 0;
  for (const token of rowTokens) {
    for (const candidate of candidates) {
      if (fuzzyEqual(token, candidate)) {
        matched++;
        break;
      }
    }
  }
  return Math.round((matched / rowTokens.length) * 800);
}

export interface ResolvablePerfume {
  id: string;
  name: string;
  sizes: Array<{ ml: number }>;
}

export function resolveRows(rows: LiveStockRow[], perfumes: ResolvablePerfume[]): LiveStockRow[] {
  const resolved: LiveStockRow[] = [];
  for (const row of rows) {
    let best: ResolvablePerfume | null = null;
    let bestScore = 0;
    for (const perfume of perfumes) {
      const score = perfumeMatchScore(row.id, perfume);
      if (score > bestScore) {
        bestScore = score;
        best = perfume;
      }
    }
    if (!best || bestScore < 400) continue;
    for (const size of best.sizes) {
      resolved.push({ id: best.id, ml: size.ml, stock: row.stock });
    }
  }
  return resolved;
}

function readPerfumesData(): Perfume[] {
  try {
    const raw = window.localStorage.getItem(PERFUMES_DATA_KEY);
    if (!raw) return [];
    const data = JSON.parse(raw);
    return Array.isArray(data?.perfumes) ? (data.perfumes as Perfume[]) : [];
  } catch {
    return [];
  }
}

export function buildStockMap(rows: LiveStockRow[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const row of rows) {
    map.set(`${row.id}:${row.ml}`, row.stock);
  }
  return map;
}

export function mergeStockIntoPerfumesData(rows: LiveStockRow[]): void {
  if (typeof window === 'undefined') return;
  try {
    const raw = window.localStorage.getItem(PERFUMES_DATA_KEY);
    if (!raw) return;
    const data = JSON.parse(raw);
    const perfumes = Array.isArray(data?.perfumes) ? data.perfumes : [];
    const map = buildStockMap(rows);
    let changed = false;
    for (const perfume of perfumes) {
      if (!perfume || !Array.isArray(perfume.sizes)) continue;
      for (const size of perfume.sizes) {
        const stock = map.get(`${perfume.id}:${size.ml}`);
        if (stock !== undefined && size.stock !== stock) {
          size.stock = stock;
          changed = true;
        }
      }
    }
    if (changed) {
      window.localStorage.setItem(PERFUMES_DATA_KEY, JSON.stringify(data));
    }
  } catch {
    // ignore malformed data
  }
}

function updateChip(el: HTMLElement, status: StockStatus): void {
  const label = getStockLabel(status);
  if (el.textContent !== label) el.textContent = label;
  for (const cls of STOCK_CHIP_CLASSES) {
    el.classList.toggle(cls, cls === `chip--${status}`);
  }
}

function updateSizeOption(option: HTMLElement, status: StockStatus): void {
  const chip = option.querySelector<HTMLElement>('.size-option-stock');
  if (chip) updateChip(chip, status);
  const unavailable = status === 'out-of-stock';
  option.classList.toggle('size-option--unavailable', unavailable);
  const radio = option.querySelector<HTMLInputElement>('input[type="radio"]');
  if (radio) radio.disabled = unavailable;
}

function updateAddToCartButton(map: Map<string, number>): void {
  const btn = document.querySelector<HTMLButtonElement>('[data-add-to-cart]');
  if (!btn) return;
  const perfumeEl = document.querySelector<HTMLElement>('[data-perfume-id]');
  const perfumeId = perfumeEl?.getAttribute('data-perfume-id');
  const checked = document.querySelector<HTMLInputElement>('input[name="size"]:checked');
  if (!perfumeId || !checked) return;
  const ml = parseInt(checked.value, 10);
  const stock = map.get(`${perfumeId}:${ml}`);
  if (stock === undefined) return;
  const unavailable = stock <= 0;
  btn.disabled = unavailable;
  btn.classList.toggle('btn--disabled', unavailable);
  const label = unavailable ? 'Sin Stock' : 'Agregar al pedido';
  if (btn.textContent !== label) btn.textContent = label;
}

export function applyStockToDom(rows: LiveStockRow[]): void {
  if (typeof document === 'undefined') return;
  const map = buildStockMap(rows);
  if (map.size === 0) return;
  document.querySelectorAll<HTMLElement>('[data-stock-id][data-stock-ml]').forEach((el) => {
    const id = el.getAttribute('data-stock-id') || '';
    const ml = parseInt(el.getAttribute('data-stock-ml') || '', 10);
    if (!id || Number.isNaN(ml)) return;
    const stock = map.get(`${id}:${ml}`);
    if (stock === undefined) return;
    const status = getStockStatus({ ml: ml as PerfumeSize['ml'], price: 0, stock });
    if (el.classList.contains('size-option')) {
      updateSizeOption(el, status);
    } else {
      updateChip(el, status);
    }
  });
  updateAddToCartButton(map);
}

function readCache(): { fetchedAt: number; rows: LiveStockRow[] } | null {
  try {
    const raw = window.localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed?.rows)) return null;
    return { fetchedAt: Number(parsed.fetchedAt) || 0, rows: parsed.rows };
  } catch {
    return null;
  }
}

function writeCache(rows: LiveStockRow[]): void {
  try {
    window.localStorage.setItem(CACHE_KEY, JSON.stringify({ fetchedAt: Date.now(), rows }));
  } catch {
    // storage full or unavailable
  }
}

export async function refreshLiveStock(url = LIVE_STOCK_URL): Promise<void> {
  if (!url) return;
  const apply = (rows: LiveStockRow[]): void => {
    applyStockToDom(rows);
    mergeStockIntoPerfumesData(rows);
  };
  const cached = readCache();
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    apply(cached.rows);
    return;
  }
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const rows = resolveRows(normalizeRows(JSON.parse(await res.text())), readPerfumesData());
    if (rows.length === 0) return;
    writeCache(rows);
    apply(rows);
  } catch {
    if (cached) apply(cached.rows);
  }
}

export function initLiveStock(): void {
  if (typeof window === 'undefined') return;
  onPageLoad('live-stock', () => {
    void refreshLiveStock();
  });
}
