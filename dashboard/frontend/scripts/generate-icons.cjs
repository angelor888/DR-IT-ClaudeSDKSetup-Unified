// Script to generate placeholder PWA icons
// In production, replace these with properly designed icons

const fs = require('fs');
const path = require('path');

// Create icons directory if it doesn't exist
const iconsDir = path.join(__dirname, '../public/icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// SVG template for a simple icon
const createSVG = (size) => `
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" fill="#1976d2"/>
  <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="${size * 0.3}px" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="middle">DR</text>
</svg>
`;

// Icon sizes needed for PWA
const sizes = [16, 32, 72, 96, 128, 144, 152, 192, 384, 512];

console.log('Generating PWA icons...');

sizes.forEach(size => {
  const svg = createSVG(size);
  const filename = path.join(iconsDir, `icon-${size}x${size}.svg`);
  fs.writeFileSync(filename, svg);
  console.log(`Created ${filename}`);
});

// Create a simple HTML file to preview icons
const previewHTML = `
<!DOCTYPE html>
<html>
<head>
  <title>PWA Icons Preview</title>
  <style>
    body { font-family: sans-serif; padding: 20px; }
    .icon { display: inline-block; margin: 10px; text-align: center; }
    img { display: block; border: 1px solid #ddd; }
  </style>
</head>
<body>
  <h1>DuetRight PWA Icons</h1>
  <p>These are placeholder icons. Replace with professionally designed icons before production.</p>
  ${sizes.map(size => `
    <div class="icon">
      <img src="icons/icon-${size}x${size}.svg" alt="${size}x${size}">
      <p>${size}x${size}</p>
    </div>
  `).join('')}
</body>
</html>
`;

fs.writeFileSync(path.join(iconsDir, '../icons-preview.html'), previewHTML);

console.log('Icons generated successfully!');
console.log('Note: These are placeholder SVG icons. For production:');
console.log('1. Create professional PNG icons with your logo');
console.log('2. Ensure icons have proper padding and are maskable');
console.log('3. Optimize file sizes');
console.log('4. Test on various devices');