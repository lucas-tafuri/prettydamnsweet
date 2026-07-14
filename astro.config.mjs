import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://prettydamnsweet.vercel.app',
  server: {
    port: 4321,
    host: true,
  },
});
