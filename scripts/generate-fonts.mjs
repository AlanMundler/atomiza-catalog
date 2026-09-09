import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const inputFont = 'src/styles/fonts/Montserrat-VariableFont_wght.ttf';
const outputDir = 'public/fonts/';

// Pesos realmente usados en el proyecto (según grep)
const weights = [200, 300, 400, 500, 600, 700];

// Caracteres necesarios: ASCII básico + latinos comunes + símbolos UI
const charset = [
  'U+0020-007F',           // Basic Latin
  'U+00A0-00FF',           // Latin-1 Supplement
  'U+0100-017F',           // Latin Extended-A
  'U+2000-206F',           // General Punctuation
  'U+2070-209F',           // Superscripts/Subscripts
  'U+20A0-20CF',           // Currency Symbols (ARS $)
  'U+2122',                // ™
  'U+2190-219F',           // Arrows
].join(',');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

console.log('Generando WOFF2 subsets para pesos:', weights.join(', '));

for (const weight of weights) {
  const outputFile = path.join(outputDir, `Montserrat-w${weight}.woff2`);
  
  try {
    await sharp(inputFont, { 
      font: { 
        weight: weight,
        charset: charset
      }
    })
    .woff2({ quality: 100 })
    .toFile(outputFile);
    
    const stats = fs.statSync(outputFile);
    console.log(`  w${weight}: ${(stats.size/1024).toFixed(1)} KB`);
  } catch (err) {
    console.error(`Error generando w${weight}:`, err.message);
  }
}

console.log('Listo.');