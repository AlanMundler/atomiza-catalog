import { test, expect } from './test';
import type { Page } from '@playwright/test';

const HOME = '.';
const QUIZ = 'quiz/';

async function answerCurrentQuestion(page: Page, optionText: string) {
  const step = page.locator('.quiz-step:not([hidden])');
  await step.getByRole('button', { name: new RegExp(optionText, 'i') }).click();
  const next = page.locator('[data-quiz-next]');
  if ((await next.textContent()) === 'Continuar') {
    // El click en la opción habilita el botón de forma asíncrona: esperar a
    // que quede enabled evita el flake bajo carga (p. ej. WebKit lento).
    await expect(next).toBeEnabled();
    await next.click();
  }
}

async function finishQuiz(page: Page) {
  await page.locator('[data-quiz-next]').click();
}

test.describe('Perfume Quiz Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(HOME);
    await page.waitForLoadState('networkidle');
  });

  test('should access the quiz from the home CTA', async ({ page }) => {
    const heroCta = page.locator('.hero-cta').getByRole('link', { name: 'Descubrí tu perfume' });
    const headerLink = page.locator('.header-quiz-btn');
    const link = (await heroCta.isVisible()) ? heroCta : headerLink;

    await expect(link).toBeVisible();
    await link.click();
    await expect(page).toHaveURL(/\/quiz/);
    await expect(page.locator('h1')).toContainText('Encontrá tu perfume');
  });

  test('should walk through all questions and show a single recommendation', async ({ page }) => {
    await page.goto(QUIZ);
    await page.waitForLoadState('networkidle');

    await expect(page.locator('.quiz-step:not([hidden])')).toBeVisible();

    await answerCurrentQuestion(page, 'Para él');
    await expect(page.locator('[data-quiz-progress]')).toHaveText('Pregunta 2 de 5');

    await page.locator('[data-quiz-back]').click();
    await expect(page.locator('[data-quiz-progress]')).toHaveText('Pregunta 1 de 5');

    await answerCurrentQuestion(page, 'Para él');
    await answerCurrentQuestion(page, 'Cítrico y fresco');
    await answerCurrentQuestion(page, 'Todo el día');
    await answerCurrentQuestion(page, 'Notoria');
    await answerCurrentQuestion(page, 'Todo el año');

    await expect(page.locator('[data-quiz-next]')).toHaveText('Ver mi recomendación');
    await finishQuiz(page);

    await expect(page.locator('#quiz-result')).toBeVisible();
    await expect(page.locator('.quiz-result-card')).toHaveCount(1);
    await expect(page.locator('.quiz-result-card .quiz-result-badge')).toHaveText('Tu match ideal');
    await expect(page.locator('.quiz-result-card .quiz-result-reason')).toBeVisible();
  });

  test('should add the recommended perfume to the cart', async ({ page }) => {
    await page.goto(QUIZ);
    await page.waitForLoadState('networkidle');

    await answerCurrentQuestion(page, 'Para ella');
    await answerCurrentQuestion(page, 'Dulce y gourmand');
    await answerCurrentQuestion(page, 'Salidas de noche');
    await answerCurrentQuestion(page, 'Intensa');
    await answerCurrentQuestion(page, 'Frío');

    await finishQuiz(page);

    const card = page.locator('.quiz-result-card');
    await expect(card).toBeVisible();
    const expectedId = await card.getAttribute('data-perfume-id');

    await card.getByRole('button', { name: 'Agregar al carrito' }).click();
    await page.waitForTimeout(600);

    const cart = await page.evaluate(() =>
      JSON.parse(localStorage.getItem('atomiza-cart') || '{"items":[]}')
    );
    expect(cart.items).toHaveLength(1);
    expect(cart.items[0].perfumeId).toBe(expectedId);
    expect(cart.items[0].size.ml).toBe(5);

    await expect(page.locator('#cart-drawer .drawer--open')).toBeVisible();
    await expect(page.locator('#cart-content .cart-item')).toHaveCount(1);
  });

  test('should recommend a perfume that matches a citrus and subtle profile', async ({ page }) => {
    await page.goto(QUIZ);
    await page.waitForLoadState('networkidle');

    await answerCurrentQuestion(page, 'Para él');
    await answerCurrentQuestion(page, 'Cítrico y fresco');
    await answerCurrentQuestion(page, 'Trabajo o diario');
    await answerCurrentQuestion(page, 'Sutil');
    await answerCurrentQuestion(page, 'Calor');

    await finishQuiz(page);

    const card = page.locator('.quiz-result-card');
    await expect(card).toBeVisible();
    await expect(card).toHaveAttribute('data-perfume-id', 'dark-door-sport');
  });

  test('should restart the quiz from the results', async ({ page }) => {
    await page.goto(QUIZ);
    await page.waitForLoadState('networkidle');

    await answerCurrentQuestion(page, 'Me da igual');
    await answerCurrentQuestion(page, 'Amaderado');
    await answerCurrentQuestion(page, 'Ocasiones especiales');
    await answerCurrentQuestion(page, 'Intensa');
    await answerCurrentQuestion(page, 'Todo el año');

    await finishQuiz(page);
    await expect(page.locator('.quiz-result-card')).toHaveCount(1);

    await page.locator('[data-quiz-restart]').click();
    await expect(page.locator('#quiz-card')).toBeVisible();
    await expect(page.locator('#quiz-result')).toBeHidden();
    await expect(page.locator('[data-quiz-progress]')).toHaveText('Pregunta 1 de 5');
    await expect(page.locator('[data-quiz-next]')).toBeDisabled();
  });

  test('the final CTA fits inside the quiz card on narrow phones', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 780 });
    await page.goto(QUIZ);
    await page.waitForLoadState('networkidle');

    await answerCurrentQuestion(page, 'Para él');
    await answerCurrentQuestion(page, 'Cítrico y fresco');
    await answerCurrentQuestion(page, 'Todo el día');
    await answerCurrentQuestion(page, 'Notoria');
    await answerCurrentQuestion(page, 'Todo el año');

    await expect(page.locator('[data-quiz-next]')).toHaveText('Ver mi recomendación');

    const card = await page.locator('#quiz-card').boundingBox();
    const btn = await page.locator('[data-quiz-next]').boundingBox();
    expect(card).not.toBeNull();
    expect(btn).not.toBeNull();
    expect(btn!.x + btn!.width).toBeLessThanOrEqual(card!.x + card!.width + 0.5);
    expect(btn!.y + btn!.height).toBeLessThanOrEqual(card!.y + card!.height + 0.5);
  });

  test('quiz options work even if the view-transitions router bundle fails (old WebViews)', async ({ page }) => {
    // Simula un WebView embebido (Instagram/WhatsApp) que no puede ejecutar el
    // bundle moderno del router de transiciones. Las opciones deben seguir
    // siendo seleccionables por el fallback de DOMContentLoaded.
    await page.route('**/_astro/*ClientRouter*.js', (route) => route.abort());
    await page.goto(QUIZ);
    await page.waitForLoadState('networkidle');

    await page.locator('.quiz-step:not([hidden]) .quiz-option').first().click();
    await expect(page.locator('.quiz-step:not([hidden]) [aria-pressed="true"]')).toHaveCount(1);
    await expect(page.locator('[data-quiz-next]')).toBeEnabled();
  });
});
