// IndexNow: avisa a Bing (y otros buscadores que soportan el protocolo) que
// el sitio cambió, para indexar de inmediato tras cada deploy.
// Uso: node scripts/indexnow.mjs
// Variables de entorno opcionales: INDEXNOW_KEY (o se usa public/{key}.txt),
// SITE_URL.
import { readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SITE_URL = (process.env.SITE_URL || 'https://atomiza.com.ar').replace(/\/$/, '');
const INDEXNOW_ENDPOINT = 'https://api.indexnow.org/indexnow';

function findKey() {
  const fromEnv = process.env.INDEXNOW_KEY;
  if (fromEnv) return fromEnv;
  const publicDir = join(__dirname, '..', 'public');
  const match = readdirSync(publicDir).find(
    (f) => f.endsWith('.txt') && /^[0-9a-f]{8,}$/i.test(f.replace(/\.txt$/, '')),
  );
  if (!match) {
    throw new Error('No se encontró la key de IndexNow. Definila en INDEXNOW_KEY o en public/{key}.txt');
  }
  return match.replace(/\.txt$/, '');
}

function extractLocs(xml) {
  const locs = [];
  const regex = /<loc>([^<]+)<\/loc>/g;
  let m;
  while ((m = regex.exec(xml)) !== null) locs.push(m[1]);
  return locs;
}

async function fetchLocs(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`No se pudo leer ${url} (${res.status})`);
  return extractLocs(await res.text());
}

async function main() {
  const key = findKey();
  // Se leen los sitemaps recién publicados: al correr tras el deploy, las URLs
  // ya están vivas, que es lo que espera IndexNow.
  const indexUrl = `${SITE_URL}/sitemap-index.xml`;
  const pages = [];
  const sitemapFiles = await fetchLocs(indexUrl);
  for (const url of sitemapFiles) {
    const locs = await fetchLocs(url);
    for (const loc of locs) {
      if (/\.(css|js|avif|jpg|jpeg|png|svg|ico|txt|xml|webp)$/i.test(new URL(loc).pathname)) continue;
      pages.push(loc);
    }
  }
  const unique = [...new Set(pages)];
  console.log(`IndexNow: notificando ${unique.length} URLs a ${INDEXNOW_ENDPOINT}...`);
  if (unique.length === 0) {
    console.log('No hay URLs para notificar.');
    return;
  }
  const res = await fetch(INDEXNOW_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({
      host: new URL(SITE_URL).host,
      key,
      keyLocation: `${SITE_URL}/${key}.txt`,
      urlList: unique,
    }),
  });
  if (res.ok) {
    console.log(`OK (${res.status}): ${unique.length} URLs notificadas.`);
  } else {
    console.log(`Fallo (${res.status}): ${await res.text()}`);
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error(err.message);
  process.exitCode = 1;
});