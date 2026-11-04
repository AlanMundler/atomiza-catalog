import { test, expect } from './test';

test.describe('Notas olfativas', () => {
  test('el hub lista las 8 notas y navega a una con productos', async ({ page }) => {
    await page.goto('notas/');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('h1')).toContainText('nota');
    const cards = page.locator('.notahub-card');
    await expect(cards).toHaveCount(8);

    await cards.first().click();
    await expect(page).toHaveURL(/\/notas\/.+\//);
    await expect(page.locator('.product-card').first()).toBeVisible();
  });

  test('decants enlaza al hub de notas y ya no mezcla familias', async ({ page }) => {
    await page.goto('decants/');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('.hub-fam')).toHaveCount(0);
    const link = page.locator('a[href$="notas/"]').first();
    await expect(link).toBeVisible();
    await link.click();
    await expect(page).toHaveURL(/\/notas\/$/);
  });
});

test.describe('Buscador del hub de decants', () => {
  test('filtra por aroma famoso y todas las visibles coinciden', async ({ page }) => {
    await page.goto('decants/');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('[data-hub-card]')).toHaveCount(62);
    await expect(page.locator('[data-hub-count]')).toHaveText('62 aromas');

    await page.locator('input[type=search]').fill('aventus');
    await expect(page.locator('[data-hub-count]')).toHaveText('2 aromas');
    await expect(page).toHaveURL(/[?&]search=aventus/);

    const visible = page.locator('.hub-card:visible');
    expect(await visible.count()).toBeGreaterThan(0);
    await expect
      .poll(async () =>
        visible.evaluateAll((els) => els.every((el) => (el.getAttribute('data-search') || '').includes('aventus')))
      )
      .toBe(true);
  });

  test('entra filtrado con ?search=aventus', async ({ page }) => {
    await page.goto('decants/?search=aventus');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('input[type=search]')).toHaveValue('aventus');
    await expect(page.locator('[data-hub-count]')).toHaveText('2 aromas');

    const visible = page.locator('.hub-card:visible');
    expect(await visible.count()).toBeGreaterThan(0);
    await expect
      .poll(async () =>
        visible.evaluateAll((els) => els.every((el) => (el.getAttribute('data-search') || '').includes('aventus')))
      )
      .toBe(true);
  });

  test('muestra el estado vacío sin resultados y lo oculta al limpiar', async ({ page }) => {
    await page.goto('decants/');
    await page.waitForLoadState('networkidle');

    const input = page.locator('input[type=search]');
    const empty = page.locator('.hub-empty');

    await input.fill('zzzzzz');
    await expect(empty).toBeVisible();
    await expect(page.locator('.hub-grid')).toBeHidden();
    await expect(page.locator('[data-hub-count]')).toHaveText('0 aromas');

    await input.fill('');
    await expect(empty).toBeHidden();
    await expect(page.locator('[data-hub-count]')).toHaveText('62 aromas');
    await expect(page).not.toHaveURL(/[?&]search=/);
  });
});

test.describe('Filtro por casa en el hub de decants', () => {
  test('el chip de casa deja solo sus cards y pisa ?casa= en la URL', async ({ page }) => {
    await page.goto('decants/');
    await page.waitForLoadState('networkidle');

    const creed = page.locator('[data-casa-chip][data-casa-slug="creed"]');
    await expect(creed).toHaveCount(1);
    await creed.click();

    await expect(page).toHaveURL(/[?&]casa=creed/);
    await expect(creed).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('[data-casa-chip][data-casa-slug="all"]')).toHaveAttribute(
      'aria-pressed',
      'false'
    );
    await expect(page.locator('[data-hub-count]')).toHaveText('3 aromas de Creed');

    const visible = page.locator('.hub-card:visible');
    expect(await visible.count()).toBe(3);
    await expect
      .poll(async () =>
        visible.evaluateAll((els) =>
          els.every((el) => el.getAttribute('data-casa') === 'Creed')
        )
      )
      .toBe(true);
  });

  test('la casa se combina con ?search= y "Limpiar filtros" reinicia todo', async ({ page }) => {
    await page.goto('decants/?search=aventus&casa=creed');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('input[type=search]')).toHaveValue('aventus');
    await expect(page.locator('[data-hub-count]')).toHaveText('2 aromas de Creed');

    const visible = page.locator('.hub-card:visible');
    expect(await visible.count()).toBe(2);
    await expect
      .poll(async () =>
        visible.evaluateAll((els) =>
          els.every(
            (el) =>
              el.getAttribute('data-casa') === 'Creed' &&
              (el.getAttribute('data-search') || '').includes('aventus')
          )
        )
      )
      .toBe(true);

    // Cambiar de casa conservando la búsqueda: sin resultados, estado vacío.
    await page.locator('[data-casa-chip][data-casa-slug="dior"]').click();
    await expect(page.locator('[data-hub-count]')).toHaveText('0 aromas de Dior');
    await expect(page.locator('.hub-empty')).toBeVisible();
    await expect(page).toHaveURL(/[?&]search=aventus/);
    await expect(page).toHaveURL(/[?&]casa=dior/);

    // "Limpiar filtros" deja todo el hub otra vez y sanea la URL.
    await page.locator('[data-clear-filters]').click();
    await expect(page.locator('.hub-empty')).toBeHidden();
    await expect(page.locator('[data-hub-count]')).toHaveText('62 aromas');
    await expect(page.locator('input[type=search]')).toHaveValue('');
    await expect(page).not.toHaveURL(/casa=/);
    await expect(page).not.toHaveURL(/search=/);
  });

  test('el botón de casas restantes expande y pliega la tira', async ({ page }) => {
    await page.goto('decants/');
    await page.waitForLoadState('networkidle');

    const more = page.locator('[data-casa-more]');
    await expect(more).toHaveAttribute('aria-expanded', 'false');
    const before = await page.locator('[data-casa-chip]:visible').count();

    await more.click();
    await expect(more).toHaveAttribute('aria-expanded', 'true');
    await expect(more).toHaveText('Ver menos');
    const after = await page.locator('[data-casa-chip]:visible').count();
    expect(after).toBeGreaterThan(before);
    await expect(page.locator('.casa-chip--extra').first()).toBeVisible();

    await more.click();
    await expect(more).toHaveAttribute('aria-expanded', 'false');
    expect(await page.locator('.casa-chip--extra:visible').count()).toBe(0);
  });
});
