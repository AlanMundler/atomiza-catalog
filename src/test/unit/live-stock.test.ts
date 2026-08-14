import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import {
  applyStockToDom,
  buildStockMap,
  mergeStockIntoPerfumesData,
  normalizeRows,
  refreshLiveStock,
} from '@/utils/live-stock';

const PERFUMES_DATA_KEY = 'perfumes-data';
const CACHE_KEY = 'atomiza-stock-live';

beforeEach(() => {
  window.localStorage.clear();
  document.body.innerHTML = '';
  vi.unstubAllGlobals();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('normalizeRows', () => {
  it('returns an empty array for non-array input', () => {
    expect(normalizeRows(null)).toEqual([]);
    expect(normalizeRows('nope')).toEqual([]);
    expect(normalizeRows(42)).toEqual([]);
  });

  it('parses valid rows including numeric strings', () => {
    const rows = normalizeRows([
      { id: 'perfume-a', ml: 5, stock: 3 },
      { id: 'perfume-b', ml: '10', stock: '0' },
    ]);
    expect(rows).toEqual([
      { id: 'perfume-a', ml: 5, stock: 3 },
      { id: 'perfume-b', ml: 10, stock: 0 },
    ]);
  });

  it('trims the id and skips invalid rows', () => {
    const rows = normalizeRows([
      { id: '  spaced-id  ', ml: 5, stock: 2 },
      { id: '', ml: 5, stock: 2 },
      { id: 'no-ml', ml: 0, stock: 2 },
      { id: 'neg-ml', ml: -5, stock: 2 },
      { id: 'bad-stock', ml: 5, stock: -1 },
      { id: 'no-stock', ml: 5, stock: NaN },
      { ml: 5, stock: 1 },
    ]);
    expect(rows).toEqual([{ id: 'spaced-id', ml: 5, stock: 2 }]);
  });
});

describe('buildStockMap', () => {
  it('maps id:ml keys to stock values', () => {
    const map = buildStockMap([
      { id: 'a', ml: 5, stock: 3 },
      { id: 'a', ml: 10, stock: 1 },
      { id: 'b', ml: 5, stock: 0 },
    ]);
    expect(map.get('a:5')).toBe(3);
    expect(map.get('a:10')).toBe(1);
    expect(map.get('b:5')).toBe(0);
    expect(map.get('b:10')).toBeUndefined();
  });

  it('last row wins for duplicate id:ml', () => {
    const map = buildStockMap([
      { id: 'a', ml: 5, stock: 3 },
      { id: 'a', ml: 5, stock: 7 },
    ]);
    expect(map.get('a:5')).toBe(7);
  });
});

describe('mergeStockIntoPerfumesData', () => {
  const seedPerfumes = (): void => {
    window.localStorage.setItem(
      PERFUMES_DATA_KEY,
      JSON.stringify({
        perfumes: [
          {
            id: 'perfume-a',
            sizes: [
              { ml: 5, price: 1000, stock: 5 },
              { ml: 10, price: 1800, stock: 4 },
            ],
          },
          { id: 'perfume-b', sizes: [{ ml: 5, price: 900, stock: 2 }] },
          { id: 'perfume-c', sizes: 'not-an-array' },
        ],
      })
    );
  };

  it('does nothing when perfumes-data is missing', () => {
    mergeStockIntoPerfumesData([{ id: 'perfume-a', ml: 5, stock: 0 }]);
    expect(window.localStorage.getItem(PERFUMES_DATA_KEY)).toBeNull();
  });

  it('overrides matching sizes and leaves the rest intact', () => {
    seedPerfumes();
    mergeStockIntoPerfumesData([
      { id: 'perfume-a', ml: 5, stock: 0 },
      { id: 'perfume-a', ml: 10, stock: 1 },
      { id: 'perfume-b', ml: 5, stock: 6 },
    ]);
    const data = JSON.parse(window.localStorage.getItem(PERFUMES_DATA_KEY) || '{}');
    expect(data.perfumes[0].sizes[0].stock).toBe(0);
    expect(data.perfumes[0].sizes[1].stock).toBe(1);
    expect(data.perfumes[1].sizes[0].stock).toBe(6);
  });

  it('ignores perfumes and sizes not present in the data', () => {
    seedPerfumes();
    mergeStockIntoPerfumesData([
      { id: 'unknown', ml: 5, stock: 0 },
      { id: 'perfume-a', ml: 999, stock: 0 },
    ]);
    const data = JSON.parse(window.localStorage.getItem(PERFUMES_DATA_KEY) || '{}');
    expect(data.perfumes[0].sizes[0].stock).toBe(5);
    expect(data.perfumes[0].sizes[1].stock).toBe(4);
  });
});

describe('applyStockToDom', () => {
  it('updates product card chips', () => {
    document.body.innerHTML = `
      <span class="chip chip--in-stock product-card-stock" data-stock-id="perfume-a" data-stock-ml="5">EN STOCK</span>
      <span class="chip chip--in-stock product-card-stock" data-stock-id="perfume-a" data-stock-ml="10">EN STOCK</span>
    `;
    applyStockToDom([{ id: 'perfume-a', ml: 5, stock: 2 }]);
    const chips = Array.from(document.querySelectorAll('.product-card-stock')) as HTMLElement[];
    expect(chips[0].textContent).toBe('ÚLTIMAS UNIDADES');
    expect(chips[0].classList.contains('chip--low-stock')).toBe(true);
    expect(chips[0].classList.contains('chip--in-stock')).toBe(false);
    expect(chips[1].textContent).toBe('EN STOCK');
    expect(chips[1].classList.contains('chip--in-stock')).toBe(true);
  });

  it('marks a size option as unavailable and disables its radio', () => {
    document.body.innerHTML = `
      <label class="size-option size-option--selected" data-stock-id="perfume-a" data-stock-ml="5">
        <input type="radio" name="size" value="5" checked />
        <span class="size-option-stock chip chip--in-stock">EN STOCK</span>
      </label>
    `;
    applyStockToDom([{ id: 'perfume-a', ml: 5, stock: 0 }]);
    const option = document.querySelector('.size-option') as HTMLElement;
    const radio = document.querySelector('input') as HTMLInputElement;
    const chip = option.querySelector('.size-option-stock') as HTMLElement;
    expect(option.classList.contains('size-option--unavailable')).toBe(true);
    expect(radio.disabled).toBe(true);
    expect(chip.textContent).toBe('AGOTADO');
    expect(chip.classList.contains('chip--out-of-stock')).toBe(true);
  });

  it('re-enables a size option when stock returns', () => {
    document.body.innerHTML = `
      <label class="size-option size-option--unavailable" data-stock-id="perfume-a" data-stock-ml="5">
        <input type="radio" name="size" value="5" checked disabled />
        <span class="size-option-stock chip chip--out-of-stock">AGOTADO</span>
      </label>
    `;
    applyStockToDom([{ id: 'perfume-a', ml: 5, stock: 4 }]);
    const option = document.querySelector('.size-option') as HTMLElement;
    const radio = document.querySelector('input') as HTMLInputElement;
    expect(option.classList.contains('size-option--unavailable')).toBe(false);
    expect(radio.disabled).toBe(false);
  });

  it('updates the add-to-cart button for the checked size', () => {
    document.body.innerHTML = `
      <article data-perfume-id="perfume-a">
        <button type="button" data-add-to-cart class="btn btn--primary btn--lg">Agregar al pedido</button>
      </article>
      <label class="size-option" data-stock-id="perfume-a" data-stock-ml="5">
        <input type="radio" name="size" value="5" checked />
        <span class="size-option-stock chip chip--in-stock">EN STOCK</span>
      </label>
    `;
    applyStockToDom([{ id: 'perfume-a', ml: 5, stock: 0 }]);
    const btn = document.querySelector('[data-add-to-cart]') as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
    expect(btn.classList.contains('btn--disabled')).toBe(true);
    expect(btn.textContent).toBe('Agotado');
  });

  it('does not touch elements with no matching override', () => {
    document.body.innerHTML = `
      <span class="chip chip--in-stock product-card-stock" data-stock-id="other" data-stock-ml="5">EN STOCK</span>
    `;
    applyStockToDom([{ id: 'perfume-a', ml: 5, stock: 0 }]);
    const chip = document.querySelector('.product-card-stock') as HTMLElement;
    expect(chip.textContent).toBe('EN STOCK');
    expect(chip.classList.contains('chip--in-stock')).toBe(true);
  });
});

describe('refreshLiveStock', () => {
  it('is a no-op when the url is empty', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    await refreshLiveStock('');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('fetches, caches and applies rows', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        text: async () => JSON.stringify([{ id: 'perfume-a', ml: 5, stock: 0 }]),
      })
    );
    document.body.innerHTML = `
      <span class="chip chip--in-stock product-card-stock" data-stock-id="perfume-a" data-stock-ml="5">EN STOCK</span>
    `;
    window.localStorage.setItem(
      PERFUMES_DATA_KEY,
      JSON.stringify({ perfumes: [{ id: 'perfume-a', sizes: [{ ml: 5, price: 1000, stock: 5 }] }] })
    );

    await refreshLiveStock('https://example.com/stock');

    const chip = document.querySelector('.product-card-stock') as HTMLElement;
    expect(chip.textContent).toBe('AGOTADO');
    const cached = JSON.parse(window.localStorage.getItem(CACHE_KEY) || '{}');
    expect(cached.rows).toEqual([{ id: 'perfume-a', ml: 5, stock: 0 }]);
    const data = JSON.parse(window.localStorage.getItem(PERFUMES_DATA_KEY) || '{}');
    expect(data.perfumes[0].sizes[0].stock).toBe(0);
  });

  it('uses a fresh cache without hitting the network', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    window.localStorage.setItem(
      CACHE_KEY,
      JSON.stringify({ fetchedAt: Date.now(), rows: [{ id: 'perfume-a', ml: 5, stock: 0 }] })
    );
    document.body.innerHTML = `
      <span class="chip chip--in-stock product-card-stock" data-stock-id="perfume-a" data-stock-ml="5">EN STOCK</span>
    `;

    await refreshLiveStock('https://example.com/stock');

    expect(fetchMock).not.toHaveBeenCalled();
    const chip = document.querySelector('.product-card-stock') as HTMLElement;
    expect(chip.textContent).toBe('AGOTADO');
  });

  it('falls back to cached rows when the fetch fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network')));
    window.localStorage.setItem(
      CACHE_KEY,
      JSON.stringify({ fetchedAt: 0, rows: [{ id: 'perfume-a', ml: 5, stock: 1 }] })
    );
    document.body.innerHTML = `
      <span class="chip chip--in-stock product-card-stock" data-stock-id="perfume-a" data-stock-ml="5">EN STOCK</span>
    `;

    await refreshLiveStock('https://example.com/stock');

    const chip = document.querySelector('.product-card-stock') as HTMLElement;
    expect(chip.textContent).toBe('ÚLTIMAS UNIDADES');
  });

  it('does nothing when fetch fails and there is no cache', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network')));
    document.body.innerHTML = `
      <span class="chip chip--in-stock product-card-stock" data-stock-id="perfume-a" data-stock-ml="5">EN STOCK</span>
    `;

    await refreshLiveStock('https://example.com/stock');

    const chip = document.querySelector('.product-card-stock') as HTMLElement;
    expect(chip.textContent).toBe('EN STOCK');
  });
});
