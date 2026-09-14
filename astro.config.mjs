// @ts-check
import { defineConfig } from 'astro/config';
import sitemap, { ChangeFreqEnum } from '@astrojs/sitemap';
import { fileURLToPath } from 'url';
import { resolve } from 'path';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

const SITE_URL = process.env.SITE_URL || 'https://atomiza.com.ar';
const BASE_PATH = process.env.BASE_PATH || '/';

// https://astro.build/config
export default defineConfig({
  site: SITE_URL,
  base: BASE_PATH,
  output: 'static',
  trailingSlash: 'always',
  // El Dev Toolbar de Astro solo aporta en desarrollo. En el preview (que usan
  // los tests e2e) y en producción no debe inyectarse, porque si no inyecta un
  // overlay con <h1> extra ("No islands detected.", "Settings"...) que ensucia
  // el DOM y rompe los tests que consultan `h1`.
  devToolbar: { enabled: false },
  integrations: [
    sitemap({
      // Sin lastmod: con `new Date()` todas las URLs cambiaban en cada
      // deploy aunque el contenido no cambiara (los buscadores lo ignoran).
      // El 404 tiene noindex: no va al sitemap.
      filter: (page) => !page.endsWith('/404/') && !page.endsWith('/404.html'),
      serialize(item) {
        // Prioridades CRO: lo que vende primero (home, catálogo, fichas).
        // Se descuenta el base path para que funcione en subpath (Pages).
        const base = BASE_PATH === '/' ? '' : BASE_PATH.replace(/\/$/, '');
        let path = new URL(item.url).pathname;
        if (base && path.startsWith(base)) path = path.slice(base.length) || '/';
        if (path === '/' || path === '') {
          item.changefreq = ChangeFreqEnum.WEEKLY;
          item.priority = 1.0;
        } else if (path.startsWith('/catalogo') || path.startsWith('/decants')) {
          item.changefreq = ChangeFreqEnum.WEEKLY;
          item.priority = 0.9;
        } else if (
          path.startsWith('/tridentes') ||
          path.startsWith('/quiz') ||
          path.startsWith('/producto')
        ) {
          // Tridentes y quiz son las páginas que convierten: misma
          // prioridad que las fichas de producto.
          item.changefreq = ChangeFreqEnum.WEEKLY;
          item.priority = 0.8;
        } else if (path.startsWith('/blog')) {
          item.changefreq = ChangeFreqEnum.MONTHLY;
          item.priority = 0.6;
        } else {
          item.changefreq = ChangeFreqEnum.YEARLY;
          item.priority = 0.4;
        }
        return item;
      },
    }),
  ],
  vite: {
    resolve: {
      alias: {
        '@': resolve(__dirname, './src'),
      },
    },
  },
});