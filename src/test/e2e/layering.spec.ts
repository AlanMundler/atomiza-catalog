import { expect, test } from './test';

const LAYERING = 'layering/';

/**
 * El par estrella del hero/combinador es la primera combo curada con stock
 * (`fresco-sobre-madera`): Odyssey Mega Man (ancla) + Yeah! (acento).
 * Mismos ids que valida `src/test/unit/layering.test.ts`.
 */
const ANCHOR = 'odyssey-mega-man';
const ACCENT = 'yeah';

async function readCart(page: import('@playwright/test').Page): Promise<{
  items: { perfumeId: string; size: { ml: number }; quantity: number }[];
}> {
  return page.evaluate(() =>
    JSON.parse(localStorage.getItem('atomiza-cart') || '{"items":[]}')
  );
}

test.describe('Layering: guía + combinador', () => {
  test('loads with the star combo visible above the fold', async ({ page }) => {
    await page.goto(LAYERING);

    await expect(page.locator('h1')).toContainText('Layering: cómo combinar perfumes');
    const star = page.locator('.ly-star');
    await expect(star).toBeVisible();
    await expect(star.locator('figure img')).toHaveCount(2);
    await expect(star.getByRole('button', { name: /Probalos juntos/ })).toBeVisible();
    // Precio del par desde el catálogo: 7.000 + 6.000.
    await expect(star.locator('.ly-star-price')).toContainText('$13.000');

    // El resultado del combinador viene servido (funciona sin JS): veredicto
    // y proporción del par estrella.
    await expect(page.locator('#ly-result .ly-verdict')).toContainText('Combinación fuerte');
    await expect(page.locator('#ly-result .ly-ratio')).toContainText('2 sprays');

    // Las combos curadas (crecen con la investigación): todas con dos botellas.
    const allCombos = page.locator('.ly-combo');
    const totalCombos = await allCombos.count();
    expect(totalCombos).toBeGreaterThanOrEqual(8);
    for (const card of await allCombos.all()) {
      await expect(card.locator('.ly-combo-pair img')).toHaveCount(2);
    }
  });

  test('changing the selects updates verdict, order and ratio live', async ({ page }) => {
    await page.goto(LAYERING);

    // Dos anclas densas → cuidado + dosis mínima honesta.
    await page.selectOption('#ly-a', 'ameer-al-oudh');
    await page.selectOption('#ly-b', 'asad-elixir');
    await expect(page.locator('#ly-result .ly-verdict')).toContainText('Combiná con cuidado');
    await expect(page.locator('#ly-result .ly-ratio')).toContainText('1 spray de cada uno');
    await expect(page).toHaveURL(/a=ameer-al-oudh&b=asad-elixir/);

    // Ancla + acento → el motor ordena la pareja (Ameer abajo) y el ratio
    // pasa a 2 sprays + 1.
    await page.selectOption('#ly-b', 'hawas-tropical');
    await expect(page.locator('#ly-result .ly-order li').first()).toContainText('Ameer Al Oudh');
    await expect(page.locator('#ly-result .ly-ratio')).toContainText('2 sprays de');
    await expect(page.locator('#ly-result .ly-verdict')).not.toContainText('Combiná con cuidado');
  });

  test('"Agregar los dos" leaves 2 items in the cart and opens the drawer', async ({ page }) => {
    await page.goto(LAYERING);

    await page.locator('#ly-actions [data-combo-add]').click();

    await expect(page.locator('#cart-drawer .drawer--open')).toBeVisible();
    await page.waitForFunction(
      () => (JSON.parse(localStorage.getItem('atomiza-cart') || '{"items":[]}').items.length ?? 0) >= 2
    );
    const cart = await readCart(page);
    expect(cart.items).toHaveLength(2);
    expect(cart.items.map((i) => i.perfumeId).sort()).toEqual([ANCHOR, ACCENT].sort());
    expect(cart.items.every((i) => i.size.ml === 5 && i.quantity === 1)).toBe(true);
    await expect(page.locator('#cart-content .cart-item')).toHaveCount(2);
  });

  test('direct link ?a=…&b=… restores the selection and its verdict', async ({ page }) => {
    await page.goto(`${LAYERING}?a=hawas-tropical&b=ameer-al-oudh`);

    await expect(page.locator('#ly-a')).toHaveValue('hawas-tropical');
    await expect(page.locator('#ly-b')).toHaveValue('ameer-al-oudh');
    // El resultado corresponde al par del link (Ameer manda abajo).
    await expect(page.locator('#ly-result .ly-order li').first()).toContainText('Ameer Al Oudh');
    // Y el botón de agregar apunta a ese par.
    const add = page.locator('#ly-actions [data-combo-add]');
    await expect(add).toHaveAttribute('data-anchor', 'ameer-al-oudh');
    await expect(add).toHaveAttribute('data-accent', 'hawas-tropical');
  });

  test('invalid URL slugs fall back to the star combo', async ({ page }) => {
    await page.goto(`${LAYERING}?a=no-existe&b=tampoco`);

    await expect(page.locator('#ly-a')).toHaveValue(ANCHOR);
    await expect(page.locator('#ly-b')).toHaveValue(ACCENT);
    await expect(page.locator('#ly-result .ly-verdict')).toContainText('Combinación fuerte');
  });

  test('affinity meter shows the score with an accessible label', async ({ page }) => {
    await page.goto(LAYERING);

    // Par estrella: medidor con label accesible y texto visible "N/10".
    const meter = page.locator('#ly-result [data-affinity-meter]');
    await expect(meter).toHaveAttribute('aria-label', /Afinidad \d+\/10 · Combinación fuerte/);
    await expect(meter).toContainText('/10');
    await expect(meter.locator('.ly-tick--on').first()).toBeVisible();

    // Dos anclas densas → el medidor baja y pasa a rojo/cuidado.
    await page.selectOption('#ly-a', 'ameer-al-oudh');
    await page.selectOption('#ly-b', 'asad-elixir');
    await expect(meter).toHaveAttribute('aria-label', /Combiná con cuidado/);
  });

  test('sticky section nav pins under the header and tracks the active section', async ({ page }) => {
    await page.goto(LAYERING);

    const nav = page.locator('.ly-nav');
    await page.evaluate(() => {
      document.getElementById('combos')!.scrollIntoView({ block: 'start', behavior: 'instant' });
      window.scrollBy(0, 40);
    });
    await expect(nav).toHaveCSS('position', 'sticky');
    await expect(nav).toHaveCSS('top', '72px');
    // El estado activo lo marca el IntersectionObserver: dar tiempo a un frame.
    await expect(nav.locator('[data-nav-link="combos"]')).toHaveAttribute('aria-current', 'true', { timeout: 3000 });

    // El ancla de la nav lleva a la sección sin que el heading quede debajo.
    await nav.locator('[data-nav-link="faq"]').click();
    const box = await page.evaluate(() => {
      const nav = document.querySelector('.ly-nav')!.getBoundingClientRect();
      const h2 = document.querySelector('#faq h2')!.getBoundingClientRect();
      return { navBottom: nav.bottom, headingTop: h2.top };
    });
    expect(box.headingTop).toBeGreaterThanOrEqual(box.navBottom);
  });

  test('combo filters, affinity sort and "ver más" scale the gallery', async ({ page }) => {
    await page.goto(LAYERING);

    // Con JS: toolbar visible y cap de 6 sobre el total de combos.
    const filters = page.locator('.ly-filters');
    await expect(filters).toBeVisible();
    const visibleCards = page.locator('.ly-combo:not([hidden])');
    const totalCombos = await page.locator('.ly-combo').count();
    await expect(visibleCards).toHaveCount(Math.min(6, totalCombos));
    await page.locator('[data-show-more-btn]').click();
    await expect(visibleCards).toHaveCount(totalCombos);

    // Filtro "Noche": solo los pares de noche (o los "todos").
    await page.locator('.ly-filters [data-moment="noche"]').click();
    const nightCount = await visibleCards.count();
    expect(nightCount).toBeGreaterThan(0);
    const moments = await visibleCards.evaluateAll((els) => els.map((el) => el.getAttribute('data-moment')));
    expect(moments.every((m) => m === 'noche' || m === 'todos')).toBe(true);

    // Orden por afinidad dentro del filtro: las scores visibles bajan.
    await page.locator('.ly-sort [data-sort="afinidad"]').click();
    const scores = await page.locator('.ly-combo:not([hidden])').evaluateAll((els) =>
      els.map((el) => Number(el.getAttribute('data-affinity')))
    );
    expect(scores.length).toBe(nightCount);
    expect([...scores].sort((x, y) => y - x)).toEqual(scores);

    // "Estación Primavera" incluye los pares "Todo el año" (data-season=all).
    await page.locator('.ly-filters [data-moment="todos"]').click();
    await page.locator('.ly-filters [data-season="primavera"]').click();
    const seasons = await page.locator('.ly-combo:not([hidden])').evaluateAll((els) =>
      els.map((el) => el.getAttribute('data-season'))
    );
    expect(seasons.length).toBeGreaterThan(0);
    expect(seasons.every((s) => s!.includes('primavera') || s === 'all')).toBe(true);

    // Estado combinado imposible: familia del ancla que no tiene pares de noche.
    await page.locator('.ly-filters [data-moment="noche"]').click();
    await page.locator('.ly-filters [data-family="almizcles"]').click();
    await expect(page.locator('.ly-combo:not([hidden])')).toHaveCount(0);
    await expect(page.locator('[data-combos-empty]')).toBeVisible();
  });
});
