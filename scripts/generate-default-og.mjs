// Genera la imagen social por defecto (og:image) como JPG real de 1200x630.
// Sin esto, el sitio publicaba un SVG disfrazado de .jpg que rompía las
// previsualizaciones en redes sociales.
// Salida: public/og-image.jpg (committeada; no depende de fonts de CI).
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(__dirname, '../public/og-image.jpg');

const svg = Buffer.from(`
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="#121414"/>
  <line x1="480" y1="278" x2="720" y2="278" stroke="#e9c176" stroke-width="1" opacity="0.6"/>
  <text x="600" y="360" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="88" letter-spacing="14" fill="#e9c176" font-weight="bold">&#923;TOMIZ&#923;</text>
  <line x1="480" y1="392" x2="720" y2="392" stroke="#e9c176" stroke-width="1" opacity="0.6"/>
  <text x="600" y="446" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="26" letter-spacing="10" fill="#d1c5b4" font-weight="400">DECANTS DE AUTOR</text>
</svg>
`);

try {
  await sharp(svg).jpeg({ quality: 90 }).toFile(OUT);
  console.log('og-image.jpg generado correctamente');
} catch (err) {
  console.warn('og-image.jpg: no se pudo regenerar (se mantiene el actual):', err.message);
}
