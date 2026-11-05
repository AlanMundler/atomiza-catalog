import { test, expect } from './test';

const HOME = '.';
const CATALOG = 'catalogo/decants/';
const PRODUCT_1 = 'producto/baroque-rouge-540/';
const PRODUCT_2 = 'producto/luminous-sahara/';

test.describe('Checkout Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Clear cart before each test
    await page.goto(HOME);
    await page.evaluate(() => localStorage.clear());
    await page.waitForLoadState('networkidle');
  });

  test('renders malicious cart data as escaped text, not HTML', async ({ page }) => {
    await page.goto(HOME);
    await page.evaluate(() => {
      const payload = {
        items: [
          {
            perfumeId: '<img src=x onerror="window.__xss=1">',
            size: { ml: 5, price: 32000, stock: 2 },
            quantity: 1
          }
        ],
        updatedAt: Date.now()
      };
      localStorage.setItem('atomiza-cart', JSON.stringify(payload));
    });
    await page.reload();
    await page.waitForLoadState('networkidle');

    await page.click('[data-cart-trigger]');
    await page.waitForTimeout(300);

    const xssFired = await page.evaluate(() => (window as any).__xss === 1);
    expect(xssFired).toBe(false);
    await expect(page.locator('#cart-content')).toContainText('<img src=x');
  });

  test('should add multiple items and finalize order', async ({ page }) => {
    // Add first product (drawer opens automatically)
    await page.goto(PRODUCT_1);
    await page.waitForLoadState('networkidle');
    await page.click('[data-add-to-cart]');
    await page.waitForTimeout(300);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);

    // Add second product
    await page.goto(PRODUCT_2);
    await page.waitForLoadState('networkidle');
    await page.click('[data-add-to-cart]');
    await page.waitForTimeout(300);

    // Check cart has 2 items
    await expect(page.locator('.cart-item')).toHaveCount(2);

    // Click finalize order
    await page.click('[data-finalize-order]');
    await page.waitForTimeout(300);

    // Order modal should open
    const modal = page.locator('#order-modal dialog[open]');
    await expect(modal).toBeVisible();

    // Fill customer info
    await page.fill('#customer-name', 'Juan Pérez');
    await page.fill('#customer-contact', '+54 9 11 1234-5678');
    await page.waitForTimeout(200);

    // Check preview updates
    const preview = page.locator('#order-preview');
    await expect(preview).toHaveValue(/Juan Pérez/);
    await expect(preview).toHaveValue(/\+54 9 11 1234-5678/);
    await expect(preview).toHaveValue(/Maison Alhambra - Baroque Rouge 540/);
    await expect(preview).toHaveValue(/Maison Alhambra - Luminous Sahara/);
    await expect(preview).toHaveValue(/TOTAL: \$12\.000/);

    // Test copy button
    await page.click('[data-copy-order]');
    await expect(page.locator('[data-copy-order]')).toContainText('¡Copiado!');
  });

  test('simplified order modal: one primary CTA, collapsible preview, delivery chips', async ({ page }) => {
    await page.goto(PRODUCT_1);
    await page.waitForLoadState('networkidle');
    await page.click('[data-add-to-cart]');
    await page.waitForTimeout(300);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);

    // El botón del carrito ya no promete pago online: es "Armar pedido".
    await page.click('[data-cart-trigger]');
    await page.waitForTimeout(300);
    await expect(page.locator('[data-finalize-order]')).toHaveText('Armar pedido');

    await page.click('[data-finalize-order]');
    await page.waitForTimeout(300);
    const modal = page.locator('#order-modal dialog[open]');
    await expect(modal).toBeVisible();
    await expect(modal.locator('.modal-title')).toHaveText('Armar pedido');

    // Jerarquía de CTAs: WhatsApp es el ÚNICO primario; Instagram y Copiar
    // son secundarios en la fila discreta de abajo.
    await expect(modal.locator('.order-modal-actions .btn--primary')).toHaveCount(1);
    await expect(page.locator('[data-send-whatsapp]')).toHaveClass(/btn--primary/);
    await expect(page.locator('[data-send-instagram]')).toHaveClass(/btn--secondary/);
    await expect(page.locator('[data-copy-order]')).toHaveClass(/btn--secondary/);

    // Microcopy de confianza bajo el CTA, con la cuenta mencionada.
    await expect(modal.locator('.order-modal-note')).toContainText(
      'Te respondemos hoy y coordinamos pago y entrega.'
    );
    await expect(modal.locator('.order-modal-note')).toContainText('@atomiza.cba');

    // El preview arranca cerrado y NO se abre solo.
    const details = modal.locator('.order-preview-details');
    await expect(details).toHaveJSProperty('open', false);
    await page.waitForTimeout(400);
    await expect(details).toHaveJSProperty('open', false);
    await expect(details.locator('summary')).toHaveText('Ver el mensaje del pedido');

    await page.fill('#customer-name', 'Juan Pérez');
    await page.fill('#customer-contact', '+54 9 11 1234-5678');
    await page.waitForTimeout(200);
    const preview = page.locator('#order-preview');
    await expect(preview).toHaveValue(/Juan Pérez/);

    // "A coordinar" (default) no ensucia el mensaje: sin línea 🚚.
    await expect(preview).toHaveValue(/📍 Envío: \[A coordinar\]/);
    await expect(preview).not.toHaveValue(/🚚/);

    // "Entrega en mano" agrega la línea 🚚 y reemplaza el placeholder.
    await page.locator('.delivery-chip').filter({ hasText: 'Entrega en mano (Córdoba)' }).click();
    await page.waitForTimeout(200);
    await expect(preview).toHaveValue(/🚚 Entrega: Entrega en mano \(Córdoba\)/);
    await expect(preview).not.toHaveValue(/📍 Envío: \[A coordinar\]/);

    // Volver a "A coordinar" saca la línea de nuevo.
    await page.locator('.delivery-chip').filter({ hasText: 'A coordinar' }).click();
    await page.waitForTimeout(200);
    await expect(preview).not.toHaveValue(/🚚/);
    await expect(preview).toHaveValue(/📍 Envío: \[A coordinar\]/);

    // Al abrir el <details> el texto se muestra y es seleccionable, y el
    // auto-resize (que se saltea mientras está cerrado) ya lo deja visible.
    await details.locator('summary').click();
    await expect(preview).toBeVisible();
    const previewHeight = await preview.evaluate((el) => el.clientHeight);
    expect(previewHeight).toBeGreaterThan(40);
  });

  test('should apply the automatic tridente discount with 3 decants', async ({ page }) => {
    // PRODUCT_1 x2 (via increase) + PRODUCT_2 x1 = 3 decants a $6.000:
    // subtotal $18.000, descuento $2.000, total $16.000.
    await page.goto(PRODUCT_1);
    await page.waitForLoadState('networkidle');
    await page.click('[data-add-to-cart]');
    await page.waitForTimeout(300);
    await page.click('.quantity-btn--increase');
    await page.waitForTimeout(300);
    await expect(page.locator('.quantity-value')).toContainText('2');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);

    await page.goto(PRODUCT_2);
    await page.waitForLoadState('networkidle');
    await page.click('[data-add-to-cart]');
    await page.waitForTimeout(300);

    // El drawer muestra subtotal, descuento y total neto.
    await expect(page.locator('.order-summary')).toContainText('Subtotal');
    await expect(page.locator('.order-summary')).toContainText('Descuento tridente');
    await expect(page.locator('[data-cart-total]')).toContainText('$16.000');

    await page.click('[data-finalize-order]');
    await page.waitForTimeout(300);
    await page.fill('#customer-name', 'Juan Pérez');
    await page.fill('#customer-contact', '+54 9 11 1234-5678');
    await page.waitForTimeout(200);

    const preview = page.locator('#order-preview');
    await expect(preview).toHaveValue(/SUBTOTAL: \$18\.000/);
    await expect(preview).toHaveValue(/DESCUENTO TRIDENTE \(1 tridente\): -\$2\.000/);
    await expect(preview).toHaveValue(/TOTAL: \$16\.000/);
  });

  test('should update cart quantities', async ({ page }) => {
    await page.goto(PRODUCT_1);
    await page.waitForLoadState('networkidle');
    await page.click('[data-add-to-cart]');
    await page.waitForTimeout(300);

    // Increase quantity
    await page.click('.quantity-btn--increase');
    await page.waitForTimeout(300);

    // Check quantity updated
    await expect(page.locator('.quantity-value')).toContainText('2');

    // Check line total updated (6000 * 2)
    await expect(page.locator('.cart-item-line-total')).toContainText('12.000');
  });

  test('should remove item from cart', async ({ page }) => {
    await page.goto(PRODUCT_1);
    await page.waitForLoadState('networkidle');
    await page.click('[data-add-to-cart]');
    await page.waitForTimeout(300);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);

    await page.goto(PRODUCT_2);
    await page.waitForLoadState('networkidle');
    await page.click('[data-add-to-cart]');
    await page.waitForTimeout(300);

    // Remove first item
    await page.locator('.cart-item-remove').first().click();
    await page.waitForTimeout(300);

    // Should have 1 item left
    await expect(page.locator('.cart-item')).toHaveCount(1);
  });

  test('should clear cart', async ({ page }) => {
    await page.goto(PRODUCT_1);
    await page.waitForLoadState('networkidle');
    await page.click('[data-add-to-cart]');
    await page.waitForTimeout(300);

    // El vaciado usa el Modal accesible del sitio (no confirm() nativo).
    await page.click('[data-clear-cart]');
    await page.click('[data-clear-confirm]');
    await page.waitForTimeout(300);

    // Cart should be empty
    await expect(page.locator('.cart-empty')).toBeVisible();
  });

  test('should persist cart across navigation', async ({ page }) => {
    await page.goto(PRODUCT_1);
    await page.waitForLoadState('networkidle');
    await page.click('[data-add-to-cart]');
    await page.waitForTimeout(300);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);

    // Navigate away
    await page.goto(CATALOG);
    await page.waitForLoadState('networkidle');

    // Cart count should still show 1
    await expect(page.locator('[data-cart-count]')).toHaveText('1');

    // Open cart
    await page.click('[data-cart-trigger]');
    await page.waitForTimeout(300);

    // Item should still be there
    await expect(page.locator('.cart-item')).toHaveCount(1);
  });
});

test.describe('Accessibility', () => {
  test('should have proper focus states', async ({ page }) => {
    await page.goto(CATALOG);
    await page.waitForLoadState('networkidle');

    // Tab to first focusable element
    await page.keyboard.press('Tab');

    // Check focus visible
    const focused = page.locator(':focus-visible');
    await expect(focused).toBeVisible();
  });

  test('should have proper ARIA labels', async ({ page }) => {
    await page.goto(PRODUCT_1);
    await page.waitForLoadState('networkidle');

    // Check image gallery has aria-label
    await expect(page.locator('.image-gallery')).toHaveAttribute('role', 'region');
    await expect(page.locator('.image-gallery')).toHaveAttribute('aria-label', 'Galería de imágenes');

    // Check size selector has radiogroup role
    await expect(page.locator('.size-selector')).toHaveAttribute('role', 'radiogroup');
  });

  test('should have proper color contrast', async ({ page }) => {
    await page.goto(HOME);
    await page.waitForLoadState('networkidle');

    // Check header is visible
    await expect(page.locator('.header')).toBeVisible();
  });
});
