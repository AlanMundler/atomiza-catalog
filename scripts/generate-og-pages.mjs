// Genera og:image con título para las páginas que no son ficha de producto
// (usaban el og-image.jpg genérico). Se ejecuta en prebuild junto al resto.
// Salida: public/og/og-<pagina>.jpg (1200x630, fondo marca, título dorado).
// NOTA: si cambia el descuento del tridente (src/utils/trident.ts),
// actualizar TRIDENTES_LINES acá también.
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.resolve(__dirname, '../public/og');

const W = 1200;
const H = 630;
const BG = '#121414';
const GOLD = '#e9c176';
const INK = '#e3e2e2';

const PAGES = [
  { file: 'og-quiz.jpg', lines: ['¿Cuál es tu', 'perfume ideal?'], sub: 'Quiz de 5 preguntas · ATOMIZA' },
  { file: 'og-tridentes.jpg', lines: ['Cada 3 decants,', '$2.000 menos'], sub: 'Descuento automático · ATOMIZA' },
  { file: 'og-catalogo.jpg', lines: ['Catálogo de decants'], sub: 'Perfumes árabes en Córdoba · ATOMIZA' },
  { file: 'og-decants.jpg', lines: ['Buscá por el aroma', 'famoso que te gusta'], sub: 'Decants inspirados · ATOMIZA' },
  { file: 'og-blog.jpg', lines: ['Guías para comprar', 'con confianza'], sub: 'Blog · ATOMIZA' },
];

const esc = (s) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

await mkdir(OUT_DIR, { recursive: true });

let ok = 0;
for (const page of PAGES) {
  const titleSize = page.lines.length > 1 ? 84 : 96;
  const titleY = page.lines.length > 1 ? 270 : 300;
  const titles = page.lines
    .map((line, i) => `<text x="50%" y="${titleY + i * 110}" text-anchor="middle" font-family="sans-serif" font-weight="bold" font-size="${titleSize}" fill="${GOLD}">${esc(line)}</text>`)
    .join('');
  const svg = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="${BG}"/>${titles}<text x="50%" y="500" text-anchor="middle" font-family="sans-serif" font-size="36" fill="${INK}">${esc(page.sub)}</text></svg>`;
  await sharp(Buffer.from(svg)).jpeg({ quality: 85 }).toFile(path.join(OUT_DIR, page.file));
  ok += 1;
}
console.log(`og-pages: ${ok}/${PAGES.length} imágenes generadas en public/og/`);
