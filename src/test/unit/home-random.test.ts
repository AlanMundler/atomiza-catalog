import { describe, it, expect, vi, beforeEach } from 'vitest';
import { pickRandom, homeCardHtml, HOME_RANDOM_COUNT } from '@/utils/home-random';
import { site } from '@/site.config';
import type { Perfume } from '@/data/types';

function makePerfume(id: string, stock = 10): Perfume {
  return {
    id,
    slug: id,
    brand: 'Marca',
    name: `Perfume ${id}`,
    gender: 'unisex',
    olfactoryFamily: 'Oriental',
    description: 'desc',
    notes: { top: [], heart: [], base: [] },
    images: [{ src: `images/perfumes/${id}.avif`, alt: `Marca Perfume ${id}` }],
    sizes: [{ ml: 5, price: 6000, stock }],
    isBoutiqueExclusive: false,
    featured: false,
  };
}

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

describe('homeCardHtml', () => {
  it('renderiza marca, nombre, precio y quick-add en stock', () => {
    const html = homeCardHtml(makePerfume('x1'));
    expect(html).toContain('data-perfume-id="x1"');
    expect(html).toContain('Perfume x1');
    expect(html).toContain('$6.000');
    expect(html).toContain('data-quick-add');
    expect(html).toContain('chip--in-stock');
    expect(html).toContain(`${site.basePath}producto/x1/`);
  });

  it('sin stock: sin quick-add, con overlay y chip gris', () => {
    const html = homeCardHtml(makePerfume('x0', 0));
    expect(html).not.toContain('data-quick-add');
    expect(html).toContain('product-card-overlay');
    expect(html).toContain('chip--out-of-stock');
  });

  it('no anida el botón dentro del link (HTML válido)', () => {
    document.body.innerHTML = homeCardHtml(makePerfume('x1'));
    const btn = document.querySelector('[data-quick-add]') as HTMLElement;
    expect(btn.closest('a')).toBeNull();
    expect(document.querySelector('.product-card > a.product-card-link')).not.toBeNull();
  });

  it('escapa HTML inyectado en marca y nombre', () => {
    const p = makePerfume('evil');
    p.brand = '<script>alert(1)</script>';
    p.name = '"><img src=x onerror=alert(1)>';
    const html = homeCardHtml(p);
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
    expect(html).toContain('&quot;&gt;');
  });
});

describe('initHomeRandom', () => {
  const catalog = { perfumes: ['a', 'b', 'c', 'd', 'e', 'f'].map((id) => makePerfume(id)) };

  beforeEach(() => {
    window.localStorage.clear();
    vi.unstubAllGlobals();
    // getPerfumesMap cachea en memoria y en localStorage: resetear el
    // registro de módulos para que cada test parta sin caché.
    vi.resetModules();
  });

  function mountGrid(): HTMLElement {
    document.body.innerHTML = `
      <div class="home-perfume-grid" id="home-perfume-grid">
        ${['a', 'b', 'c', 'd']
          .map((id) => `<div class="home-perfume-item"><a class="product-card" data-perfume-id="${id}">SSR ${id}</a></div>`)
          .join('')}
      </div>
    `;
    return document.getElementById('home-perfume-grid') as HTMLElement;
  }

  it(`reemplaza las ${HOME_RANDOM_COUNT} cards del SSR por un sorteo del catálogo`, async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => catalog }));
    const { initHomeRandom: init } = await import('@/utils/home-random');
    const grid = mountGrid();
    await init();

    const cards = grid.querySelectorAll('.home-perfume-item .product-card');
    expect(cards).toHaveLength(4);
    const ids = Array.from(cards).map((c) => c.getAttribute('data-perfume-id'));
    expect(new Set(ids).size).toBe(4);
    for (const id of ids) expect(['a', 'b', 'c', 'd', 'e', 'f']).toContain(id);
    expect(grid.innerHTML).not.toContain('SSR a');
  });

  it('si el fetch falla, conserva el SSR', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    const { initHomeRandom: init } = await import('@/utils/home-random');
    const grid = mountGrid();
    await init();
    expect(grid.innerHTML).toContain('SSR a');
  });

  it('no hace nada sin grid', async () => {
    const { initHomeRandom: init } = await import('@/utils/home-random');
    document.body.innerHTML = '';
    await expect(init()).resolves.toBeUndefined();
  });
});
