import fs from 'fs';
import path from 'path';

const checks = [
  { pattern: 'dist/_astro/*.css', limit: 100 * 1024, name: 'CSS global' },
  { pattern: 'dist/_astro/*.js', limit: 50 * 1024, name: 'JS chunks' },
  { pattern: 'dist/fonts/*.woff2', limit: 40 * 1024, name: 'Font' },
];

function glob(dir, pattern) {
  const ext = pattern.split('.').pop();
  return fs.readdirSync(dir).filter(f => f.endsWith('.' + ext)).map(f => path.join(dir, f));
}

let passed = 0;
let failed = 0;

for (const check of checks) {
  const [dir, filePattern] = check.pattern.split('/*');
  const files = fs.existsSync(dir) ? glob(dir, filePattern) : [];
  
  if (files.length === 0) {
    console.log(`⚠ ${check.name}: No files found at ${check.pattern}`);
    continue;
  }

  for (const file of files) {
    const stats = fs.statSync(file);
    const sizeKB = (stats.size / 1024).toFixed(1);
    const limitKB = (check.limit / 1024).toFixed(1);
    const status = stats.size <= check.limit ? '✓' : '✗';
    
    if (stats.size <= check.limit) {
      passed++;
      console.log(`${status} ${check.name}: ${path.basename(file)} = ${sizeKB} KB (límite ${limitKB} KB)`);
    } else {
      failed++;
      console.log(`${status} ${check.name}: ${path.basename(file)} = ${sizeKB} KB (límite ${limitKB} KB) EXCEDE`);
    }
  }
}

console.log(`\nResultado: ${passed} OK, ${failed} EXCEDEN`);
if (failed > 0) process.exit(1);