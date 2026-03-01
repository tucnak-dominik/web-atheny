import { defineConfig } from 'astro/config';
import preact from '@astrojs/preact';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  site: 'https://tucnak-dominik.github.io',
  base: '/web-atheny',
  integrations: [preact({ compat: true }), tailwind()],
  output: 'static',
  vite: {
    build: {
      // MapLibre GL is ~1MB — expected, it's lazy-loaded via client:visible
      chunkSizeWarningLimit: 1100,
    },
  },
});
