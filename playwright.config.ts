import { defineConfig, devices } from '@playwright/test';

const BASE_PATH = process.env.BASE_PATH || '/';

export default defineConfig({
  testDir: './src/test/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: `http://localhost:4321${BASE_PATH}`,
    trace: 'on-first-retry',
    // Los scripts de terceros (secureprivacy.ai, Google Analytics) se bloquean
    // por test vía el fixture `src/test/e2e/test.ts`, porque su overlay de
    // consentimiento cubre toda la pantalla y bloquea los clics del sitio.
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // WebKit no soporta el permiso `clipboard-write`; se otorga solo en Chromium
        permissions: ['clipboard-read', 'clipboard-write'],
      },
    },
    {
      name: 'mobile-chrome',
      use: {
        ...devices['Pixel 5'],
        permissions: ['clipboard-read', 'clipboard-write'],
      },
    },
    {
      name: 'mobile-safari',
      use: { ...devices['iPhone 12'] },
    },
  ],
  webServer: {
    command: 'npm run preview',
    url: `http://localhost:4321${BASE_PATH}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});