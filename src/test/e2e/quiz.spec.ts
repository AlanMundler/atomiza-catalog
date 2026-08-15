import { test, expect, type Page } from '@playwright/test';

const HOME = '.';
const QUIZ = 'quiz/';

async function answerCurrentQuestion(page: Page, optionText: string) {
  const step = page.locator('.quiz-step:not([hidden])');
  await step.getByRole('button', { name: new RegExp(optionText, 'i') }).click();
  const next = page.locator('[data-quiz-next]');
  if ((await next.textContent()) === 'Continuar') {
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
    const cta = page.locator('.hero-cta').getByRole('link', { name: 'Descubrí tu perfume' });
    await expect(cta).toBeVisible();
    await cta.click();
    await expect(page).toHaveURL(/\/quiz/);
    await expect(page.locator('h1')).toContainText('Encontrá tu perfume');
  });

  test('should walk through all questions and show recommendations', async ({ page }) => {
    await page.goto(QUIZ);
    await page.waitForLoadState('networkidle');

    await expect(page.locator('.quiz-step:not([hidden])')).toBeVisible();

    await answerCurrentQuestion(page, 'Para él');
    await expect(page.locator('[data-quiz-progress]')).toHaveText('Pregunta 2 de 6');

    await page.locator('[data-quiz-back]').click();
    await expect(page.locator('[data-quiz-progress]')).toHaveText('Pregunta 1 de 6');

    await answerCurrentQuestion(page, 'Para él');
    await answerCurrentQuestion(page, 'Cítrico y fresco');
    await answerCurrentQuestion(page, 'Todo el día');
    await answerCurrentQuestion(page, 'Notoria');
    await answerCurrentQuestion(page, 'Todo el año');
    await answerCurrentQuestion(page, 'No importa');

    await expect(page.locator('[data-quiz-next]')).toHaveText('Ver mi recomendación');
    await finishQuiz(page);

    await expect(page.locator('#quiz-result')).toBeVisible();
    await expect(page.locator('.quiz-result-card')).toHaveCount(3);
    await expect(page.locator('.quiz-result-card--top .quiz-result-badge')).toHaveText('Tu match ideal');
    await expect(page.locator('.quiz-result-card').first().getByRole('button', { name: 'Agregar al carrito' })).toBeVisible();
  });

  test('should add a recommended perfume to the cart', async ({ page }) => {
    await page.goto(QUIZ);
    await page.waitForLoadState('networkidle');

    await answerCurrentQuestion(page, 'Para ella');
    await answerCurrentQuestion(page, 'Dulce y gourmand');
    await answerCurrentQuestion(page, 'Salidas de noche');
    await answerCurrentQuestion(page, 'Intensa');
    await answerCurrentQuestion(page, 'Frío');
    await answerCurrentQuestion(page, 'No importa');

    await finishQuiz(page);

    const topCard = page.locator('.quiz-result-card--top');
    await expect(topCard).toBeVisible();
    const expectedId = await topCard.locator('[data-add-perfume-id]').getAttribute('data-add-perfume-id');

    await topCard.getByRole('button', { name: 'Agregar al carrito' }).click();
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

  test('should restart the quiz from the results', async ({ page }) => {
    await page.goto(QUIZ);
    await page.waitForLoadState('networkidle');

    await answerCurrentQuestion(page, 'Me da igual');
    await answerCurrentQuestion(page, 'Amaderado');
    await answerCurrentQuestion(page, 'Ocasiones especiales');
    await answerCurrentQuestion(page, 'Intensa');
    await answerCurrentQuestion(page, 'Todo el año');
    await answerCurrentQuestion(page, 'Hasta \\$6\\.000');

    await finishQuiz(page);
    await expect(page.locator('.quiz-result-card')).toHaveCount(3);

    await page.locator('[data-quiz-restart]').click();
    await expect(page.locator('#quiz-card')).toBeVisible();
    await expect(page.locator('#quiz-result')).toBeHidden();
    await expect(page.locator('[data-quiz-progress]')).toHaveText('Pregunta 1 de 6');
    await expect(page.locator('[data-quiz-next]')).toBeDisabled();
  });

  test('should respect the budget constraint in recommendations', async ({ page }) => {
    await page.goto(QUIZ);
    await page.waitForLoadState('networkidle');

    await answerCurrentQuestion(page, 'Me da igual');
    await answerCurrentQuestion(page, 'Ámbar y especiado');
    await answerCurrentQuestion(page, 'Especiales');
    await answerCurrentQuestion(page, 'Notoria');
    await answerCurrentQuestion(page, 'Frío');
    await answerCurrentQuestion(page, 'Hasta \\$6\\.000');

    await finishQuiz(page);
    await expect(page.locator('.quiz-result-card')).toHaveCount(3);

    const allWithinBudget = await page.locator('.quiz-result-card').evaluateAll((cards) =>
      cards.every((card) => Number(card.getAttribute('data-price')) <= 6000)
    );
    expect(allWithinBudget).toBe(true);
  });
});
