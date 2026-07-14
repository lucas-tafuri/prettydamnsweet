import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://www.prettydamnsweet.com',
  server: {
    port: 4321,
    host: true,
  },
});
