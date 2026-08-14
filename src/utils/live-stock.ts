import { getStockLabel, getStockStatus } from '@/utils/stock';
import { onPageLoad } from '@/utils/view-transitions';
import type { PerfumeSize, StockStatus } from '@/data/types';

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
    const ml = Number(record.ml);
    const stock = Number(record.stock);
    if (!id) continue;
    if (!Number.isFinite(ml) || ml <= 0) continue;
    if (!Number.isFinite(stock) || stock < 0) continue;
    rows.push({ id, ml, stock });
  }
  return rows;
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
  const label = unavailable ? 'Agotado' : 'Agregar al pedido';
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
    const rows = normalizeRows(JSON.parse(await res.text()));
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
