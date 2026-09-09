import https from 'https';
import fs from 'fs';

const weights = [200, 300, 400, 500, 600, 700];
// Google Fonts Montserrat woff2 URLs (variable font, single file covers all weights)
// Actually the variable font is one file. Let's try the static files for each weight.
// Montserrat static files on Google Fonts:
const urls = {
  200: 'https://fonts.gstatic.com/s/montserrat/v26/JTUSjIg1_i6t8kCHKm459Wlhyw.woff2', // This is actually the variable font
  300: 'https://fonts.gstatic.com/s/montserrat/v26/JTUSjIg1_i6t8kCHKm459Wlhyw.woff2',
  400: 'https://fonts.gstatic.com/s/montserrat/v26/JTUSjIg1_i6t8kCHKm459Wlhyw.woff2',
  500: 'https://fonts.gstatic.com/s/montserrat/v26/JTUSjIg1_i6t8kCHKm459Wlhyw.woff2',
  600: 'https://fonts.gstatic.com/s/montserrat/v26/JTUSjIg1_i6t8kCHKm459Wlhyw.woff2',
  700: 'https://fonts.gstatic.com/s/montserrat/v26/JTUSjIg1_i6t8kCHKm459Wlhyw.woff2',
};

// Actually for variable font we only need ONE file. Let's just download the variable font woff2.
const varFontUrl = 'https://fonts.gstatic.com/s/montserrat/v26/JTUSjIg1_i6t8kCHKm459Wlhyw.woff2';
const outputFile = 'public/fonts/Montserrat-Variable.woff2';

console.log('Descargando variable font woff2...');

const file = fs.createWriteStream(outputFile);
https.get(varFontUrl, (res) => {
  if (res.statusCode === 200) {
    res.pipe(file);
    file.on('finish', () => {
      file.close();
      const stats = fs.statSync(outputFile);
      console.log(`Variable font: ${(stats.size/1024).toFixed(1)} KB`);
    });
  } else {
    console.error(`Error: ${res.statusCode}`);
  }
}).on('error', (e) => console.error('Error:', e.message));