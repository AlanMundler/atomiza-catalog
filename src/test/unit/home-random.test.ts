import { describe, it, expect, vi, beforeEach } from 'vitest';
import { pickRandom, HOME_RANDOM_COUNT } from '@/utils/home-random';

const POOL_IDS = Array.from({ length: 12 }, (_, i) => `p${i}`);

describe('pickRandom', () => {
  it('devuelve n elementos distintos sin mutar el original', () => {
    const items = [1, 2, 3, 4, 5, 6, 7, 8];
    const picks = pickRandom(items, 4);
    expect(picks).toHaveLength(4);
    expect(new Set(picks).size).toBe(4);
    expect(items).toHaveLength(8);
  });

  it('n = 0 devuelve vacío y n mayor que el pool devuelve todo', () => {
    expect(pickRandom([1, 2], 0)).toEqual([]);
    expect(pickRandom([1, 2], 9)).toHaveLength(2);
  });

  it('con rand fijo es determinista', () => {
    const items = ['a', 'b', 'c', 'd', 'e'];
    const zero = () => 0;
    expect(pickRandom(items, 3, zero)).toEqual(pickRandom(items, 3, zero));
  });
});

describe('initHomeRandom', () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
    document.body.innerHTML = '';
  });

  /** `crypto.getRandomValues` en 0: leave el sorteo determinista. */
  function stubCryptoZero(): void {
    vi.stubGlobal('crypto', {
      getRandomValues: (buf: Uint32Array) => {
        buf[0] = 0;
        return buf;
      },
    });
  }

  /**
   * Monta la grilla como la pinta el SSR: un pool de `total` slots, con los
   * primeros `visible` a la vista y el resto con `hidden`. Cada slot tiene su
   * card y su <img>, igual que en ProductCard.
   */
  function mountGrid(total = 12, visible = 4, gridId = 'home-perfume-grid'): HTMLElement {
    const slots = Array.from(
      { length: total },
      (_, i) => `
        <div class="home-perfume-item" role="none"${i >= visible ? ' hidden' : ''}>
          <div class="product-card" role="listitem" data-perfume-id="p${i}">
            <img
              class="product-card-image"
              src="/images/perfumes/p${i}.avif"
              alt="Perfume p${i}"
              loading="${i < visible ? 'eager' : 'lazy'}"
              ${i < visible ? 'fetchpriority="high"' : ''}
            >
          </div>
        </div>`
    );
    document.body.innerHTML = `
      <div class="home-perfume-grid" id="${gridId}" role="list">${slots.join('')}</div>
    `;
    return document.getElementById(gridId) as HTMLElement;
  }

  function visibleItems(grid: HTMLElement): HTMLElement[] {
    return Array.from(grid.querySelectorAll<HTMLElement>('.home-perfume-item')).filter((el) => !el.hidden);
  }

  function idsOf(items: readonly Element[]): string[] {
    return items.map((el) => el.querySelector('[data-perfume-id]')?.getAttribute('data-perfume-id') ?? '');
  }

  it(`deja exactamente ${HOME_RANDOM_COUNT} visibles, sin repetir y solo del pool`, async () => {
    stubCryptoZero();
    const { initHomeRandom } = await import('@/utils/home-random');
    const grid = mountGrid();

    initHomeRandom();

    const visible = visibleItems(grid);
    expect(visible).toHaveLength(HOME_RANDOM_COUNT);
    expect(grid.children).toHaveLength(12); // solo se mueven nodos, no se crean

    const ids = idsOf(visible);
    expect(new Set(ids).size).toBe(HOME_RANDOM_COUNT);
    for (const id of ids) expect(POOL_IDS).toContain(id);

    // El SSR mostraba p0..p3: el sorteo cambia el set visible.
    expect(ids).not.toEqual(['p0', 'p1', 'p2', 'p3']);
  });

  it('no baja el catálogo: no llama fetch', async () => {
    stubCryptoZero();
    const fetchSpy = vi.fn(() => {
      throw new Error('fetch no debe llamarse en la home');
    });
    vi.stubGlobal('fetch', fetchSpy);
    const { initHomeRandom } = await import('@/utils/home-random');
    mountGrid();

    expect(() => initHomeRandom()).not.toThrow();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('sin grid no lanza', async () => {
    const { initHomeRandom } = await import('@/utils/home-random');
    document.body.innerHTML = '<p>sin grilla</p>';
    expect(() => initHomeRandom()).not.toThrow();
  });

  it('si no hay más slots que el cupo, no cambia la visibilidad', async () => {
    stubCryptoZero();
    const { initHomeRandom } = await import('@/utils/home-random');
    const grid = mountGrid(HOME_RANDOM_COUNT, HOME_RANDOM_COUNT);
    const items = Array.from(grid.querySelectorAll<HTMLElement>('.home-perfume-item'));
    const orderBefore = idsOf(items);

    initHomeRandom();

    expect(items.map((el) => el.hidden)).toEqual([false, false, false, false]);
    expect(idsOf(Array.from(grid.children))).toEqual(orderBefore);
  });

  it('la primera card visible queda eager + high y el resto lazy', async () => {
    stubCryptoZero();
    const { initHomeRandom } = await import('@/utils/home-random');
    const grid = mountGrid();

    initHomeRandom();

    const visible = visibleItems(grid);
    const imgs = visible.map((el) => el.querySelector('img') as HTMLImageElement);
    expect(imgs[0].getAttribute('loading')).toBe('eager');
    expect(imgs[0].getAttribute('fetchpriority')).toBe('high');
    for (const img of imgs.slice(1)) {
      expect(img.getAttribute('loading')).toBe('lazy');
      expect(img.hasAttribute('fetchpriority')).toBe(false);
    }

    // Los slots ocultos tampoco quedan con prioridad alta.
    const hidden = Array.from(grid.querySelectorAll<HTMLElement>('.home-perfume-item')).filter((el) => el.hidden);
    expect(hidden).toHaveLength(8);
    for (const slot of hidden) {
      const img = slot.querySelector('img') as HTMLImageElement;
      expect(img.getAttribute('loading')).toBe('lazy');
      expect(img.hasAttribute('fetchpriority')).toBe(false);
    }
  });
});
