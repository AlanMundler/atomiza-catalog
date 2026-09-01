import { test as base, expect } from '@playwright/test';

// Aislar los flujos de los scripts de terceros de consentimiento/analytics.
// secureprivacy.ai monta un overlay fijo (z-index 2147483645) que cubre toda
// la pantalla y bloquea los clics hasta que se resuelve el consentimiento de
// cookies, lo que hace inestables todos los tests. Aquí validamos el código
// propio del sitio; el consentimiento en sí se gestiona en producción.
export const test = base.extend({
  page: async ({ page, context }, use) => {
    await context.route('**secureprivacy.ai/**', (route) => route.abort());
    await context.route('**googletagmanager.com/**', (route) => route.abort());
    await use(page);
  },
});

export { expect };
