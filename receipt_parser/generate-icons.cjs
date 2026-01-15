const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const svgPath = path.join(__dirname, 'public', 'icon.svg');
const svg = fs.readFileSync(svgPath);

// Generate PWA icons
const sizes = [192, 512];

sizes.forEach(size => {
  sharp(svg)
    .resize(size, size)
    .png()
    .toFile(path.join(__dirname, 'public', `pwa-${size}x${size}.png`))
    .then(() => console.log(`Generated pwa-${size}x${size}.png`))
    .catch(err => console.error(`Error generating ${size}:`, err));
});

// Generate favicon
sharp(svg)
  .resize(32, 32)
  .png()
  .toFile(path.join(__dirname, 'public', 'favicon.ico'))
  .then(() => console.log('Generated favicon.ico'))
  .catch(err => console.error('Error generating favicon:', err));

// Generate apple touch icon
sharp(svg)
  .resize(180, 180)
  .png()
  .toFile(path.join(__dirname, 'public', 'apple-touch-icon.png'))
  .then(() => console.log('Generated apple-touch-icon.png'))
  .catch(err => console.error('Error generating apple-touch-icon:', err));
