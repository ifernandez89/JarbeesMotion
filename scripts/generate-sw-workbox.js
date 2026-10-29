const { generateSW } = require('workbox-build');
const path = require('path');

async function build() {
  const swDest = path.join(process.cwd(), 'public', 'sw-workbox.js');

  await generateSW({
    swDest,
    globDirectory: path.join(process.cwd(), 'public'),
    globPatterns: ['**/*.{html,js,css,png,svg,ico,json}'],
    globIgnores: ['**/sw*.js', '**/sw*.js.map'],
    maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
    runtimeCaching: [
      {
        urlPattern: /\/api\//,
        handler: 'NetworkFirst',
        options: {
          cacheName: 'jarbees-motion-api-v2',
          expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 },
          networkTimeoutSeconds: 5,
        },
      },
      {
        urlPattern: /\.(?:png|jpg|jpeg|svg|webp|ico)$/,
        handler: 'StaleWhileRevalidate',
        options: {
          cacheName: 'jarbees-motion-images-v2',
          expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 30 },
        },
      },
    ],
    skipWaiting: true,
    clientsClaim: true,
  });

  console.log('Generated', swDest);
}

build().catch((err) => {
  console.error(err);
  process.exit(1);
});
