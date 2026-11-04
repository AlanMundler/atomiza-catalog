// Genera src/data/image-dims.json con el ancho/alto real de cada avif de
// public/images/perfumes y public/images/originales, claveado por la ruta
// relativa tal como aparece en los datos (`images/perfumes/<slug>.avif`,
// `images/originales/<id>.avif`). Las cards usan estos valores para
// width/height y evitar CLS. Re-correr cuando se agreguen fotos nuevas:
//   node scripts/image-dims.mjs
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const DIRS = ['public/images/perfumes', 'public/images/originales'];
const OUT = 'src/data/image-dims.json';

const dims = {};
for (const dir of DIRS) {
  for (const file of fs.readdirSync(dir).filter((f) => f.endsWith('.avif'))) {
    const { width, height } = await sharp(path.join(dir, file)).metadata();
    dims[`${dir.replace(/^public\//, '')}/${file}`] = { width, height };
  }
}

fs.writeFileSync(OUT, JSON.stringify(dims, null, 2) + '\n');
console.log(`OK: ${Object.keys(dims).length} entradas -> ${OUT}`);
