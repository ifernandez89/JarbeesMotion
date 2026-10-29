/**
 * Generate Motion-specific icons
 * Creates simple SVG-based icons with mouse + motion theme
 */

const fs = require('fs');
const path = require('path');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const iconsDir = path.join(__dirname, '../public/icons');

// Ensure icons directory exists
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// SVG template for Motion icon (mouse pointer with motion lines)
const generateMotionSVG = (size) => `
<svg width="${size}" height="${size}" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <!-- Background circle -->
  <circle cx="256" cy="256" r="240" fill="#3b82f6"/>
  
  <!-- Motion lines (left side) -->
  <path d="M 80 180 L 140 180" stroke="#93c5fd" stroke-width="16" stroke-linecap="round" opacity="0.6"/>
  <path d="M 60 240 L 140 240" stroke="#93c5fd" stroke-width="16" stroke-linecap="round" opacity="0.8"/>
  <path d="M 80 300 L 140 300" stroke="#93c5fd" stroke-width="16" stroke-linecap="round" opacity="0.6"/>
  
  <!-- Mouse/cursor shape (white) -->
  <path d="M 200 140 L 200 340 L 280 280 L 320 360 L 360 340 L 320 260 L 400 260 Z" 
        fill="white" 
        stroke="#1e40af" 
        stroke-width="8"/>
  
  <!-- Keyboard indicator (bottom right) -->
  <rect x="340" y="380" width="100" height="60" rx="8" fill="white" stroke="#1e40af" stroke-width="6"/>
  <rect x="355" y="395" width="12" height="12" rx="2" fill="#3b82f6"/>
  <rect x="375" y="395" width="12" height="12" rx="2" fill="#3b82f6"/>
  <rect x="395" y="395" width="12" height="12" rx="2" fill="#3b82f6"/>
  <rect x="355" y="415" width="12" height="12" rx="2" fill="#3b82f6"/>
  <rect x="375" y="415" width="12" height="12" rx="2" fill="#3b82f6"/>
  <rect x="395" y="415" width="12" height="12" rx="2" fill="#3b82f6"/>
</svg>
`;

console.log('🎨 Generating JarBees Motion icons...\n');

sizes.forEach(size => {
  const svg = generateMotionSVG(size);
  const filename = `icon-${size}x${size}.png`;
  const filepath = path.join(iconsDir, filename);
  
  // Save as SVG first (for manual conversion or as fallback)
  const svgPath = filepath.replace('.png', '.svg');
  fs.writeFileSync(svgPath, svg.trim());
  
  console.log(`✓ Created ${filename} (SVG)`);
});

console.log('\n📝 Note: SVG files created in public/icons/');
console.log('   Convert to PNG using:');
console.log('   - Online tool: https://cloudconvert.com/svg-to-png');
console.log('   - ImageMagick: convert icon.svg -resize 512x512 icon.png');
console.log('   - Or use existing icons and update with Motion theme\n');

// Also create apple-touch-icon
const appleTouchIcon = generateMotionSVG(180);
fs.writeFileSync(
  path.join(__dirname, '../public/apple-touch-icon.svg'),
  appleTouchIcon.trim()
);
console.log('✓ Created apple-touch-icon.svg\n');

console.log('✅ Icon generation complete!');
console.log('   Remember to convert SVGs to PNGs for browser compatibility.');
