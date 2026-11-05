import { describe, it, expect, beforeEach } from 'vitest';
import {
  applyCardVisibility,
  buildCardIndex,
  createFuzzyMatches,
  isPageActive,
  readSearchFromUrl,
  readSearchIndex,
  setEmptyState,
  setResultsCount,
  syncSearchInput,
  writeSearchToUrl,
} from '@/utils/search-page';

function card(visible = true): HTMLElement {
  const el = document.createElement('div');
  el.style.display = visible ? '' : 'none';
  document.body.appendChild(el);
  return el;
}

beforeEach(() => {
  document.body.innerHTML = '';
  window.history.replaceState({}, '', '/');
});

describe('readSearchFromUrl / writeSearchToUrl', () => {
  it('sin ?search= devuelve ""', () => {
    expect(readSearchFromUrl()).toBe('');
  });

  it('lee y limpia el valor de ?search=', () => {
    window.history.replaceState({}, '', '/?search=aventus&casa=creed');
    expect(readSearchFromUrl()).toBe('aventus');
  });

  it('writeSearchToUrl setea ?search= junto a los demás params', () => {
    window.history.replaceState({}, '', '/?casa=creed');
    writeSearchToUrl('aventus', { casa: 'dior' });
    const params = new URLSearchParams(window.location.search);
    expect(params.get('search')).toBe('aventus');
    expect(params.get('casa')).toBe('dior');
  });

  it('writeSearchToUrl borra ?search= sin query y borra params null', () => {
    window.history.replaceState({}, '', '/?search=aventus&casa=creed');
    writeSearchToUrl('', { casa: null });
    expect(window.location.search).toBe('');
  });
});

describe('syncSearchInput', () => {
  it('escribe el valor solo si difiere', () => {
    const input = document.createElement('input');
    input.setAttribute('data-search-input', '');
    document.body.appendChild(input);

    syncSearchInput('aventus');
    expect(input.value).toBe('aventus');

    // Estado ya sincronizado: no marca ni toca nada más.
    input.value = 'aventus';
    syncSearchInput('aventus');
    expect(input.value).toBe('aventus');
  });

  it('sin input en el DOM no explota', () => {
    expect(() => syncSearchInput('x')).not.toThrow();
  });
});

describe('readSearchIndex', () => {
  it('parsea el JSON inline', () => {
    const el = document.createElement('script');
    el.id = 'idx';
    el.type = 'application/json';
    el.textContent = JSON.stringify([{ id: 'a', text: 'aventus creed' }]);
    document.body.appendChild(el);
    expect(readSearchIndex('idx')).toEqual([{ id: 'a', text: 'aventus creed' }]);
  });

  it('JSON corrupto y script ausente devuelven [] sin lanzar', () => {
    const el = document.createElement('script');
    el.id = 'idx-roto';
    el.type = 'application/json';
    el.textContent = '{"no-es-array": true';
    document.body.appendChild(el);

    expect(readSearchIndex('idx-roto')).toEqual([]);
    expect(readSearchIndex('no-existe')).toEqual([]);

    const noArray = document.createElement('script');
    noArray.id = 'idx-objeto';
    noArray.type = 'application/json';
    noArray.textContent = '{"id":"a"}';
    document.body.appendChild(noArray);
    expect(readSearchIndex('idx-objeto')).toEqual([]);
  });
});

describe('createFuzzyMatches', () => {
  const index = [
    { id: 'a', text: 'aventus creed' },
    { id: 'b', text: 'club de nuit' },
  ];

  it('sin query devuelve null (decide el filtro de la página)', () => {
    expect(createFuzzyMatches(index, '')).toBeNull();
  });

  it('con query corre el fuzzy por subsequencia', () => {
    // "aentus" es subsequencia de "aventus creed" pero no substring ni
    // subsequencia del otro item.
    expect(createFuzzyMatches(index, 'aentus')).toEqual(new Set(['a']));
    expect(createFuzzyMatches(index, 'zzzz')).toEqual(new Set());
  });

  it('si hay coincidencia literal, manda el literal (null) y no el fuzzy', () => {
    // "nuit" es substring de "club de nuit": no queremos sumar matches
    // flojos de subsequencia ("aventus creed" matchea n-u-i-t? no, pero
    // "ajwad" sí matchea otros perfumes por subsequencia).
    expect(createFuzzyMatches(index, 'nuit')).toBeNull();
    expect(createFuzzyMatches(index, 'AVENTUS')).toBeNull();
  });
});

describe('buildCardIndex', () => {
  it('arma entradas id/texto desde los data-attrs', () => {
    const a = document.createElement('div');
    a.setAttribute('data-id', 'a');
    a.setAttribute('data-text', 'aventus creed');
    const b = document.createElement('div');
    b.setAttribute('data-id', 'b');
    // sin data-text: cae a ''
    expect(buildCardIndex([a, b], 'data-id', 'data-text')).toEqual([
      { id: 'a', text: 'aventus creed' },
      { id: 'b', text: '' },
    ]);
  });
});

describe('applyCardVisibility', () => {
  it('aplica display y devuelve el conteo de visibles', () => {
    const cards = [card(true), card(true), card(false)];
    const visible = applyCardVisibility(cards, (el) => el.style.display !== 'none');
    expect(visible).toBe(2);
    expect(cards[0].style.display).toBe('');
    expect(cards[2].style.display).toBe('none');
  });
});

describe('setResultsCount / setEmptyState', () => {
  it('setResultsCount escribe solo si el elemento existe', () => {
    const count = document.createElement('p');
    document.body.appendChild(count);
    setResultsCount(count, '2 aromas');
    expect(count.textContent).toBe('2 aromas');
    expect(() => setResultsCount(null, 'x')).not.toThrow();
  });

  it('oculta la grilla y muestra el empty state con 0 visibles; inverso con resultados', () => {
    const grid = document.createElement('div');
    const empty = document.createElement('div');
    document.body.append(grid, empty);

    setEmptyState(grid, empty, 0);
    expect(empty.hidden).toBe(false);
    expect((grid as HTMLElement).style.display).toBe('none');

    setEmptyState(grid, empty, 3);
    expect(empty.hidden).toBe(true);
    expect((grid as HTMLElement).style.display).toBe('');
  });

  it('sin grilla o sin empty state no explota', () => {
    expect(() => setEmptyState(null, null, 0)).not.toThrow();
  });
});

describe('isPageActive', () => {
  it('true si el root marcado está, false si no', () => {
    const root = document.createElement('section');
    root.setAttribute('data-catalog-page', '');
    document.body.appendChild(root);
    expect(isPageActive('[data-catalog-page]')).toBe(true);
    expect(isPageActive('[data-hub-page]')).toBe(false);
  });
});
