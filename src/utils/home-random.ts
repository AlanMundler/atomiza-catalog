/**
 * Sorteo de la home sin re-render: una sola fuente de markup.
 *
 * La grilla pinta un pool SSR de 12 cards con `ProductCard` (4 visibles + 8
 * ocultas). Acá solo se mueven esos nodos del DOM: nunca se genera HTML ni se
 * baja el catálogo (`data/perfumes.json`), así no hay una segunda copia del
 * markup en JS y el CSS de la card puede quedar scopeado.
 */

/** Cuántas cards muestra la home en "Decants en stock". */
export const HOME_RANDOM_COUNT = 4;

/**
 * Sorteo Fisher-Yates parcial: devuelve hasta `n` elementos distintos del
 * pool, en orden aleatorio. `rand` se inyecta para testear (por defecto
 * `Math.random`; en el browser se usa `cryptoRand`).
 */
export function pickRandom<T>(items: readonly T[], n: number, rand: () => number = Math.random): T[] {
  if (n <= 0) return [];
  const pool = [...items];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, n);
}

/** Aleatorio criptográfico (sin sesgo de seed diaria): cada visita sortea. */
function cryptoRand(): number {
  try {
    const buf = new Uint32Array(1);
    crypto.getRandomValues(buf);
    return buf[0] / 4294967296;
  } catch {
    return Math.random();
  }
}

/** id del perfume que contiene un slot de la grilla, o null si no lo tiene. */
function idOf(slot: Element): string | null {
  return slot.querySelector('[data-perfume-id]')?.getAttribute('data-perfume-id') ?? null;
}

/** ids de los slots hoy visibles (los que pinta el SSR). */
function visibleIds(slots: readonly HTMLElement[]): Set<string> {
  const ids = new Set<string>();
  for (const slot of slots) {
    if (slot.hidden) continue;
    const id = idOf(slot);
    if (id) ids.add(id);
  }
  return ids;
}

/**
 * Sorteo de la home: mueve los nodos del pool SSR para que cada visita muestre
 * `count` perfumes distintos, sin fetch ni `innerHTML`. Los slots que quedan
 * fuera del sorteo siguen en el DOM, ocultos.
 */
export function initHomeRandom(gridId = 'home-perfume-grid', count: number = HOME_RANDOM_COUNT): void {
  if (typeof document === 'undefined') return;
  const grid = document.getElementById(gridId);
  if (!grid) return;
  const slots = Array.from(grid.querySelectorAll<HTMLElement>('.home-perfume-item'));
  // Con un pool que no supera el cupo no hay nada que sortear: se deja el SSR
  // tal cual (y no se toca la visibilidad).
  if (slots.length <= count) return;

  const before = visibleIds(slots);
  let picks = pickRandom(slots, count, cryptoRand);
  // Best-effort: evita repetir exactamente el set visible actual (con 12
  // perfumes el choque es raro, pero el SSR es fijo por build y se notaría).
  for (let attempt = 0; attempt < 5; attempt++) {
    const ids = picks.map(idOf).filter((id): id is string => id !== null);
    const same = ids.length === before.size && ids.every((id) => before.has(id));
    if (!same) break;
    picks = pickRandom(slots, count, cryptoRand);
  }

  // Primero se ocultan todos y se dejan sus imágenes en lazy: así el sorteo no
  // deja imágenes eager escondidas consumiendo ancho de banda.
  for (const slot of slots) {
    slot.hidden = true;
    const img = slot.querySelector('img');
    if (img) {
      img.setAttribute('loading', 'lazy');
      img.removeAttribute('fetchpriority');
    }
  }

  // En el orden sorteado se mueve cada nodo al final y se muestra. `append`
  // reubica el nodo existente (no lo clona), así el markup SSR es el único.
  picks.forEach((slot, i) => {
    grid.append(slot);
    slot.hidden = false;
    const img = slot.querySelector('img');
    if (!img) return;
    if (i === 0) {
      // LCP: la primera card visible es la que debe cargar primero.
      img.setAttribute('loading', 'eager');
      img.setAttribute('fetchpriority', 'high');
    }
  });
}
