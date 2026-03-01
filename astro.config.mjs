import { defineConfig } from 'astro/config';
import preact from '@astrojs/preact';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  site: 'https://atheny.example.com', // update before deploy
  integrations: [preact({ compat: true }), tailwind()],
  output: 'static',
});
