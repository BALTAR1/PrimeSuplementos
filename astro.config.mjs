// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

import react from '@astrojs/react';

import vercel from '@astrojs/vercel';

// https://astro.build/config
export default defineConfig({
  output: 'server', // SSR habilitado
  adapter: vercel(),

  server: {
    host: '0.0.0.0',
    port: process.env.PORT ? Number(process.env.PORT) : 4321
  },

  vite: {
    plugins: [tailwindcss()]
  },

  integrations: [react()]
});
