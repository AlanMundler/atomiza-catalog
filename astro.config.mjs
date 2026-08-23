// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { fileURLToPath } from 'url';
import { resolve } from 'path';

import tailwindcss from '@tailwindcss/vite';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

const SITE_URL = process.env.SITE_URL || 'https://atomiza.com.ar';
const BASE_PATH = process.env.BASE_PATH || '/';

// https://astro.build/config
export default defineConfig({
  site: SITE_URL,
  base: BASE_PATH,
  output: 'static',
  trailingSlash: 'always',
  integrations: [
    sitemap(),
  ],
  vite: {
    resolve: {
      alias: {
        '@': resolve(__dirname, './src'),
      },
    },

    plugins: [tailwindcss()],
  },
});