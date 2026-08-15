// Genera las imágenes de compartir (og:image) para cada perfume, en JPG,
// a partir de su foto (AVIF) o ilustración (SVG). Se ejecuta automáticamente
// antes de cada `astro build` (ver script "prebuild" en package.json).
// Salida: public/og/<slug>.jpg (1200x630, fondo blanco, frasco centrado).
import { readdir, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const IMG_DIR = path.resolve(__dirname, '../public/images/perfumes');
const OUT_DIR = path.resolve(__dirname, '../public/og');

const BG = '#ffffff';
const W = 1200;
const H = 630;

await mkdir(OUT_DIR, { recursive: true });

const files = (await readdir(IMG_DIR)).filter((f) => f.endsWith('.svg') || f.endsWith('.avif'));

let ok = 0;
for (const file of files) {
  const slug = file.replace(/\.(svg|avif)$/, '');
  try {
    const inputOpts = file.endsWith('.svg') ? { density: 300 } : {};
    const bottle = await sharp(path.join(IMG_DIR, file), inputOpts)
      .resize({ width: W, height: H, fit: 'inside' })
      .png()
      .toBuffer();
    await sharp({ create: { width: W, height: H, channels: 3, background: BG } })
      .composite([{ input: bottle, gravity: 'centre' }])
      .jpeg({ quality: 85 })
      .toFile(path.join(OUT_DIR, `${slug}.jpg`));
    ok += 1;
  } catch (err) {
    console.warn(`og: no se pudo generar ${file}:`, err.message);
  }
}

console.log(`og: ${ok}/${files.length} imágenes generadas en public/og/`);
