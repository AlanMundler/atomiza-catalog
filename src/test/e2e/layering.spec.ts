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

    // Las 8 combos curadas con sus dos botellas reales.
    await expect(page.locator('.ly-combo')).toHaveCount(8);
    for (const card of await page.locator('.ly-combo').all()) {
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
});
