/**
 * Generate Motion-specific icons (PNG + SVG) using sharp
 * Creates high quality icons with mouse pointer, motion waves, and tech branding
 */

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const pngToIcoModule = require('png-to-ico');
const pngToIco = pngToIcoModule.default || pngToIcoModule;

const publicDir = path.join(__dirname, '../public');
const iconsDir = path.join(publicDir, 'icons');

if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// 512x512 SVG Master with Safe Zone for Maskable Android PWA Icons
// Safe zone is central 80% (radius 200, within 56 to 456)
const getMotionSVG = (size = 512) => `
<svg width="${size}" height="${size}" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <!-- Background Gradient -->
    <radialGradient id="bgGlow" cx="50%" cy="45%" r="65%">
      <stop offset="0%" stop-color="#1e3a8a"/>
      <stop offset="60%" stop-color="#0f172a"/>
      <stop offset="100%" stop-color="#020617"/>
    </radialGradient>
    
    <!-- Accent Gradient -->
    <linearGradient id="neonCyan" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#38bdf8"/>
      <stop offset="100%" stop-color="#2563eb"/>
    </linearGradient>

    <linearGradient id="beeGold" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fbbf24"/>
      <stop offset="100%" stop-color="#f59e0b"/>
    </linearGradient>

    <!-- Filter for subtle drop shadow -->
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="#000000" flood-opacity="0.5"/>
    </filter>
  </defs>

  <!-- Full Canvas Background for Maskable Icon -->
  <rect width="512" height="512" fill="url(#bgGlow)"/>

  <!-- Outer Sensor Waves / Radar Rings (Motion & Sensors) -->
  <circle cx="256" cy="256" r="210" fill="none" stroke="#38bdf8" stroke-width="4" stroke-dasharray="16 12" opacity="0.3"/>
  <circle cx="256" cy="256" r="170" fill="none" stroke="#60a5fa" stroke-width="6" stroke-dasharray="24 16" opacity="0.5"/>

  <!-- Motion Dynamic Arcs (Left side velocity / gyroscope) -->
  <path d="M 120 180 A 160 160 0 0 0 120 332" fill="none" stroke="url(#neonCyan)" stroke-width="14" stroke-linecap="round" opacity="0.85"/>
  <path d="M 86 210 A 190 190 0 0 0 86 302" fill="none" stroke="#38bdf8" stroke-width="10" stroke-linecap="round" opacity="0.6"/>

  <!-- Central Mouse / Remote Cursor (Precision & Motion) -->
  <g filter="url(#shadow)">
    <!-- Sleek Pointer Arrow -->
    <path d="M 200 130 
             L 340 270 
             L 272 284 
             L 316 384 
             L 274 402 
             L 230 302 
             L 174 348 
             Z" 
          fill="#ffffff" 
          stroke="#1d4ed8" 
          stroke-width="8" 
          stroke-linejoin="round"/>
  </g>

  <!-- Bee Tech Accent (Yellow Sensor Wings / Beacon) -->
  <g transform="translate(300, 140)">
    <!-- Bee wing top -->
    <ellipse cx="26" cy="10" rx="22" ry="12" fill="url(#beeGold)" opacity="0.9" transform="rotate(-25 26 10)"/>
    <!-- Bee wing bottom -->
    <ellipse cx="38" cy="24" rx="16" ry="9" fill="url(#beeGold)" opacity="0.8" transform="rotate(15 38 24)"/>
    <!-- Small glowing signal dot -->
    <circle cx="10" cy="20" r="7" fill="#fbbf24"/>
    <circle cx="10" cy="20" r="14" fill="none" stroke="#fbbf24" stroke-width="2.5" opacity="0.7"/>
  </g>

  <!-- Trackpad / Motion Sensor Wave Accent at bottom -->
  <path d="M 290 380 Q 340 370 390 395" fill="none" stroke="#38bdf8" stroke-width="6" stroke-linecap="round" opacity="0.8"/>
  <path d="M 310 405 Q 350 395 390 420" fill="none" stroke="#38bdf8" stroke-width="5" stroke-linecap="round" opacity="0.5"/>
</svg>
`;

async function generateAllIcons() {
  console.log('🎨 Generating JarBees Motion icons with Sharp...\n');

  const svgMaster = getMotionSVG(512);

  // Write master SVGs
  fs.writeFileSync(path.join(iconsDir, 'icon-512x512.svg'), svgMaster.trim());
  fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.svg'), svgMaster.trim());

  // Icon sizes for manifest
  const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

  for (const size of sizes) {
    const pngPath = path.join(iconsDir, `icon-${size}x${size}.png`);
    const svgPath = path.join(iconsDir, `icon-${size}x${size}.svg`);
    
    // Save SVG copy
    const sizedSvg = getMotionSVG(size);
    fs.writeFileSync(svgPath, sizedSvg.trim());

    // Generate PNG
    await sharp(Buffer.from(sizedSvg))
      .resize(size, size)
      .png({ compressionLevel: 9 })
      .toFile(pngPath);

    console.log(`✓ Generated icon-${size}x${size}.png (${size}x${size})`);
  }

  // Generate apple-touch-icon.png (180x180)
  const applePath = path.join(publicDir, 'apple-touch-icon.png');
  await sharp(Buffer.from(getMotionSVG(180)))
    .resize(180, 180)
    .png({ compressionLevel: 9 })
    .toFile(applePath);
  console.log('✓ Generated apple-touch-icon.png (180x180)');

  // Also replace JarBees_logo.png so legacy references load the Motion icon!
  const logoPath = path.join(publicDir, 'JarBees_logo.png');
  await sharp(Buffer.from(getMotionSVG(512)))
    .resize(512, 512)
    .png({ compressionLevel: 9 })
    .toFile(logoPath);
  console.log('✓ Updated JarBees_logo.png to Motion branding');

  // Favicons (16, 32, 48)
  for (const favSize of [16, 32, 48]) {
    const favPath = path.join(publicDir, `favicon-${favSize}.png`);
    await sharp(Buffer.from(getMotionSVG(favSize)))
      .resize(favSize, favSize)
      .png()
      .toFile(favPath);
    console.log(`✓ Generated favicon-${favSize}.png`);
  }

  // Favicon.ico
  try {
    const icoInputs = [
      path.join(publicDir, 'favicon-16.png'),
      path.join(publicDir, 'favicon-32.png'),
      path.join(publicDir, 'favicon-48.png'),
    ];
    const icoBuf = await pngToIco(icoInputs);
    fs.writeFileSync(path.join(publicDir, 'favicon.ico'), icoBuf);
    console.log('✓ Generated favicon.ico');
  } catch (err) {
    console.warn('Warning generating favicon.ico:', err.message);
  }

  console.log('\n🎉 All JarBees Motion icons generated successfully!');
}

generateAllIcons().catch((err) => {
  console.error('Error generating icons:', err);
  process.exit(1);
});
