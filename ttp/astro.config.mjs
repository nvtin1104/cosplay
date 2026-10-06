import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { loadEnv } from 'vite';
const site = (process.env.SITE_URL || loadEnv(process.env.NODE_ENV || 'production', process.cwd(), '').SITE_URL)?.trim();
if (site && !/^https?:\/\//.test(site)) throw new Error('SITE_URL must be an absolute HTTP(S) URL');
export default defineConfig({
  output: 'static',
  ...(site ? { site, integrations: [sitemap()] } : {}),
});
