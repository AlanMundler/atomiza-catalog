// Copia src/data/perfumes.json a public/data/perfumes.json para que el
// carrito lo pueda pedir bajo demanda (fetch) sin inyectar los 32KB
// inline en todas las páginas. Se ejecuta en "prebuild" (package.json).
import { mkdir, copyFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.resolve(__dirname, '../src/data/perfumes.json');
const OUT_DIR = path.resolve(__dirname, '../public/data');

await mkdir(OUT_DIR, { recursive: true });
await copyFile(SRC, path.join(OUT_DIR, 'perfumes.json'));
console.log('perfumes.json copiado a public/data/');
