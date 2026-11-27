import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createListController } from '@/utils/list-controller';
import { buildResultsText, cardMatches, normalizeFilter } from '@/utils/catalogo';
import { syncSearchInput, writeSearchToUrl } from '@/utils/search-page';

/**
 * Pruebas del controlador con una página mínima (mismas piezas que el catálogo
 * real: input, chips, contador, grilla y empty state). El root es único por
 * test para que los listeners de `window` de una prueba anterior no reaccionen
 * al DOM de la siguiente (la guarda de View Transitions es por root).
 */

interface TestState {
  search: string;
  filter: string;
}

let seq = 0;

function mountController(): {
  controller: ReturnType<typeof createListController<TestState>>;
  countText: ReturnType<typeof vi.fn>;
} {
  const id = `list-test-${++seq}`;
  document.body.innerHTML = `
    <section data-page="${id}">
      <input data-search-input />
      <button class="test-chip" data-filter="all" aria-pressed="true">Todos</button>
      <button class="test-chip" data-filter="masculino" aria-pressed="false">Masculino</button>
      <button class="test-chip" data-filter="femenino" aria-pressed="false">Femenino</button>
      <p data-test-count></p>
      <div class="test-grid">
        <article class="test-card" data-id="aventus" data-gender="masculino" data-search="aventus creed">A</article>
        <article class="test-card" data-id="delina" data-gender="femenino" data-search="delina parfums de marly">D</article>
        <article class="test-card" data-id="baccarat" data-gender="unisex" data-search="baccarat rouge">B</article>
      </div>
      <div class="test-empty" hidden></div>
    </section>
  `;

  const countText = vi.fn((visible: number, state: TestState) =>
    buildResultsText(visible, state.filter, state.search)
  );

  const controller = createListController<TestState>({
    id,
    rootSelector: `[data-page="${id}"]`,
    cardSelector: '.test-card',
    countSelector: '[data-test-count]',
    gridSelector: '.test-grid',
    emptySelector: '.test-empty',
    readState: (url) => ({
      filter: normalizeFilter(url.searchParams.get('filter')),
      search: url.searchParams.get('search') || '',
    }),
    writeUrl: (state) => {
      writeSearchToUrl(state.search, {
        filter: state.filter === 'all' ? null : state.filter,
      });
    },
    index: () =>
      Array.from(document.querySelectorAll<HTMLElement>('.test-card')).map((card) => ({
        id: card.getAttribute('data-id') || '',
        text: card.getAttribute('data-search') || '',
      })),
    isVisible: (card, state, fuzzyIds) =>
      cardMatches({
        gender: card.getAttribute('data-gender') || '',
        searchText: card.getAttribute('data-search') || '',
        perfumeId: card.getAttribute('data-id') || '',
        filter: state.filter,
        query: state.search,
        fuzzyIds,
      }),
    countText,
    syncControls: (state) => {
      syncSearchInput(state.search);
      document.querySelectorAll<HTMLButtonElement>('.test-chip').forEach((chip) => {
        const active = chip.getAttribute('data-filter') === state.filter;
        chip.setAttribute('aria-pressed', String(active));
      });
    },
    // Sin bindOnce a propósito: si init() duplicara el binding, un solo click
    // dispararía dos updates y el test lo detectaría.
    bindControls: (ctl) => {
      document.querySelectorAll<HTMLButtonElement>('.test-chip').forEach((chip) => {
        chip.addEventListener('click', () => {
          const filter = chip.getAttribute('data-filter');
          if (filter) ctl.update({ filter });
        });
      });
    },
  });

  controller.init();
  // En jsdom el documento suele estar "complete"; este fallback cubre el caso
  // de que el runner arranque todavía en "loading".
  if (document.readyState === 'loading') {
    window.dispatchEvent(new Event('DOMContentLoaded'));
  }

  return { controller, countText };
}

function visibleIds(): string[] {
  return Array.from(document.querySelectorAll<HTMLElement>('.test-card'))
    .filter((card) => card.style.display !== 'none')
    .map((card) => card.getAttribute('data-id') || '');
}

function chip(filter: string): HTMLButtonElement {
  return document.querySelector<HTMLButtonElement>(`.test-chip[data-filter="${filter}"]`)!;
}

function input(): HTMLInputElement {
  return document.querySelector<HTMLInputElement>('[data-search-input]')!;
}

beforeEach(() => {
  document.body.innerHTML = '';
  window.history.replaceState({}, '', '/');
});

describe('createListController', () => {
  it('init lee ?search= y ?filter= de la URL y pinta el primer estado', () => {
    window.history.replaceState({}, '', '/?search=aventus&filter=masculino');

    const { controller } = mountController();

    expect(controller.state()).toEqual({ filter: 'masculino', search: 'aventus' });
    expect(input().value).toBe('aventus');
    expect(chip('masculino').getAttribute('aria-pressed')).toBe('true');
    expect(chip('all').getAttribute('aria-pressed')).toBe('false');
    expect(visibleIds()).toEqual(['aventus']);
    expect(document.querySelector('[data-test-count]')!.textContent).toBe(
      '1 perfume encontrado en masculino para "aventus"'
    );
    expect((document.querySelector('.test-empty') as HTMLElement).hidden).toBe(true);
  });

  it('update escribe la URL y aplica visibilidad, contador y empty state', () => {
    const { controller } = mountController();

    controller.update({ search: 'zzz' });

    expect(new URLSearchParams(window.location.search).get('search')).toBe('zzz');
    expect(visibleIds()).toEqual([]);
    expect(document.querySelector('[data-test-count]')!.textContent).toBe(
      '0 perfumes encontrados para "zzz"'
    );
    expect((document.querySelector('.test-empty') as HTMLElement).hidden).toBe(false);
    expect((document.querySelector('.test-grid') as HTMLElement).style.display).toBe('none');

    controller.update({ search: '', filter: 'femenino' });

    const params = new URLSearchParams(window.location.search);
    expect(params.get('filter')).toBe('femenino');
    expect(params.get('search')).toBeNull();
    expect(controller.state()).toEqual({ filter: 'femenino', search: '' });
    expect(visibleIds()).toEqual(['delina', 'baccarat']);
    expect(document.querySelector('[data-test-count]')!.textContent).toBe(
      '2 perfumes encontrados en femenino'
    );
    expect((document.querySelector('.test-empty') as HTMLElement).hidden).toBe(true);
    expect((document.querySelector('.test-grid') as HTMLElement).style.display).toBe('');
  });

  it('refresh relee la URL al navegar con atrás/adelante', () => {
    const { controller } = mountController();
    expect(visibleIds()).toEqual(['aventus', 'delina', 'baccarat']);

    window.history.replaceState({}, '', '/?filter=femenino');
    controller.refresh();

    expect(controller.state()).toEqual({ filter: 'femenino', search: '' });
    expect(visibleIds()).toEqual(['delina', 'baccarat']);
    expect(chip('femenino').getAttribute('aria-pressed')).toBe('true');

    // El listener de popstate usa el mismo refresh.
    window.history.replaceState({}, '', '/?search=baccarat');
    window.dispatchEvent(new PopStateEvent('popstate'));

    expect(controller.state()).toEqual({ filter: 'all', search: 'baccarat' });
    expect(visibleIds()).toEqual(['baccarat']);
    expect(input().value).toBe('baccarat');
  });

  it('init dos veces no duplica listeners', () => {
    const { controller, countText } = mountController();
    controller.init();
    countText.mockClear();

    chip('femenino').click();

    expect(countText).toHaveBeenCalledTimes(1);
    expect(controller.state()).toEqual({ filter: 'femenino', search: '' });
    expect(visibleIds()).toEqual(['delina', 'baccarat']);

    countText.mockClear();
    window.dispatchEvent(new CustomEvent('search:change', { detail: { query: 'baccarat' } }));

    expect(countText).toHaveBeenCalledTimes(1);
    expect(visibleIds()).toEqual(['baccarat']);
  });
});
