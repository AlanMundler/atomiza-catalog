import { describe, it, expect } from 'vitest';
import { resultCard, resultEmpty } from '@/utils/quiz-card';
import type { Perfume } from '@/data/types';

function makePerfume(overrides: Partial<Perfume> = {}): Perfume {
  return {
    id: 'test-perfume',
    slug: 'test-perfume',
    brand: 'Maison Alhambra',
    name: 'Luminous Sahara',
    gender: 'unisex',
    olfactoryFamily: 'Oriental Vainilla',
    description: 'Test.',
    notes: { top: [], heart: [], base: [] },
    images: [{ src: 'images/perfumes/test.avif', alt: 'Test' }],
    sizes: [{ ml: 5, price: 6000, stock: 10 }],
    isBoutiqueExclusive: false,
    featured: false,
    ...overrides,
  };
}

describe('resultEmpty', () => {
  it('renderiza el mensaje con la clase de estado vacío', () => {
    const el = resultEmpty('Sin conexión');
    expect(el.tagName).toBe('P');
    expect(el.className).toBe('quiz-result-empty');
    expect(el.textContent).toBe('Sin conexión');
  });
});

describe('resultCard', () => {
  it('arma marca, nombre, motivo, precio, stock y acciones', () => {
    const card = resultCard(makePerfume(), 'Porque buscabas algo fresco');

    expect(card.tagName).toBe('ARTICLE');
    expect(card.querySelector('.quiz-result-brand')?.textContent).toBe('MAISON ALHAMBRA');
    expect(card.querySelector('.quiz-result-name')?.textContent).toBe('Luminous Sahara');
    expect(card.querySelector('.quiz-result-reason')?.textContent).toBe('Porque buscabas algo fresco');
    expect(card.querySelector('.quiz-result-price')?.textContent).toBe('$6.000');
    expect(card.querySelector('.quiz-result-stock')?.textContent).toBe('EN STOCK');
    expect(card.querySelector('.quiz-result-add')).not.toBeNull();
    expect(card.querySelector('.quiz-result-wa')?.getAttribute('href')).toContain('https://wa.me/');
    expect(card.querySelector('.quiz-result-detail')?.getAttribute('href')).toContain('/producto/test-perfume/');
  });

  it('agrega el link de inspiración solo cuando existe', () => {
    const withInspo = resultCard(makePerfume({ id: 'luminous-sahara' }), 'x');
    const link = withInspo.querySelector('.quiz-result-inspiracion');
    expect(link?.getAttribute('href')).toContain('/decants/althair-parfums-de-marly/');

    const withoutInspo = resultCard(makePerfume({ id: 'sin-inspiracion' }), 'x');
    expect(withoutInspo.querySelector('.quiz-result-inspiracion')).toBeNull();
  });

  it('escapa HTML malicioso de los datos (no hay XSS por textContent)', () => {
    const card = resultCard(
      makePerfume({ brand: '<img src=x onerror="1">', name: '<b>boom</b>' }),
      'x'
    );
    expect(card.innerHTML).not.toContain('<img src=x');
    expect(card.innerHTML).not.toContain('<b>boom</b>');
    expect(card.querySelector('.quiz-result-name')?.textContent).toBe('<b>boom</b>');
  });

  it('devuelve estado vacío si el perfume no tiene tallas', () => {
    const card = resultCard(makePerfume({ sizes: [] }), 'x');
    expect(card.className).toBe('quiz-result-empty');
  });

  it('el botón Agregar despacha cart:add y abre el carrito', () => {
    const card = resultCard(makePerfume(), 'x');
    const seen: { type: string; detail?: unknown }[] = [];
    const onAdd = (e: Event) => seen.push({ type: 'cart:add', detail: (e as CustomEvent).detail });
    const onOpen = () => seen.push({ type: 'cart:open' });
    window.addEventListener('cart:add', onAdd);
    window.addEventListener('cart:open', onOpen);
    document.body.appendChild(card);

    (card.querySelector('.quiz-result-add') as HTMLElement).click();

    expect(seen).toContainEqual({
      type: 'cart:add',
      detail: { perfumeId: 'test-perfume', sizeMl: 5, quantity: 1 },
    });
    expect(seen).toContainEqual({ type: 'cart:open' });

    window.removeEventListener('cart:add', onAdd);
    window.removeEventListener('cart:open', onOpen);
    card.remove();
  });
});
