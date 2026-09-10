import { describe, it, expect, beforeEach } from 'vitest';
import { tridenteProgressText } from '@/utils/tridente-live';
import { site } from '@/site.config';
import type { Perfume } from '@/data/types';

function makePerfume(id: string, stock = 10): Perfume {
  return {
    id,
    slug: id,
    brand: 'Lattafa',
    name: id,
    gender: 'unisex',
    olfactoryFamily: 'Oriental',
    description: 'Test.',
    notes: { top: [], heart: [], base: [] },
    images: [],
    sizes: [{ ml: 5, price: 6000, stock }],
    isBoutiqueExclusive: false,
    featured: false,
  };
}

function seedCatalog(stock = 10) {
  const payload = {
    version: site.dataVersion,
    data: { perfumes: [makePerfume('a', stock), makePerfume('b', stock), makePerfume('c', stock)] },
  };
  localStorage.setItem(site.storage.perfumes, JSON.stringify(payload));
}

function seedCart(ids: string[]) {
  localStorage.setItem(
    site.storage.cart,
    JSON.stringify({
      items: ids.map((perfumeId) => ({
        perfumeId,
        size: { ml: 5, price: 6000, stock: 10 },
        quantity: 1,
      })),
      updatedAt: Date.now(),
    })
  );
}

describe('tridenteProgressText', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('avisa pedido vacío sin tocar la red', async () => {
    seedCart([]);
    await expect(tridenteProgressText()).resolves.toContain('Tu pedido está vacío');
  });

  it('muestra el tridente aplicado con 3 decants', async () => {
    seedCatalog();
    seedCart(['a', 'b', 'c']);
    await expect(tridenteProgressText()).resolves.toContain('1 tridente aplicado');
  });

  it('muestra lo que falta con 2 decants', async () => {
    seedCatalog();
    seedCart(['a', 'b']);
    await expect(tridenteProgressText()).resolves.toContain('te falta 1');
  });
});
