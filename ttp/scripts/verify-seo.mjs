import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { parseEnv } from 'node:util';
import { seoPages } from '../src/data/seo.ts';

const live = process.argv[2];
const origin = live || process.env.SITE_URL || (existsSync('.env') ? parseEnv(readFileSync('.env', 'utf8')).SITE_URL : '') || 'https://ttp.likecactus.com';
const headers = { 'user-agent': 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)' };
const decode = value => value.replaceAll('&amp;', '&').replaceAll('&quot;', '"').replaceAll('&#39;', "'");
async function read(path, binary = false) {
  if (!live) return readFileSync(`dist${path === '/' ? '/index.html' : path.endsWith('/') ? `${path}index.html` : path}`, binary ? undefined : 'utf8');
  const response = await fetch(new URL(path, origin), { headers });
  assert.equal(response.status, 200, path);
  assert.ok(!response.headers.get('cf-mitigated'), `Crawler challenged: ${path}`);
  if (binary) assert.match(response.headers.get('content-type') || '', /image\/png/);
  return binary ? Buffer.from(await response.arrayBuffer()) : response.text();
}
const images = new Set();
const titles = new Set();
const descriptions = new Set();
for (const page of seoPages) {
  const html = await read(page.path);
  const meta = name => decode(html.match(new RegExp(`<meta (?:property|name)="${name}" content="([^"]*)"`))?.[1] || '');
  const canonical = html.match(/rel="canonical" href="([^"]+)"/)?.[1];
  assert.equal(canonical, new URL(page.path, origin).href);
  assert.equal(meta('og:url'), canonical);
  assert.equal(meta('og:title'), page.title);
  assert.equal(meta('og:description'), page.description);
  assert.equal(meta('twitter:title'), page.title);
  assert.equal(meta('twitter:description'), page.description);
  assert.equal(meta('twitter:image'), meta('og:image'));
  assert.equal(meta('twitter:card'), 'summary_large_image');
  assert.equal(meta('og:image:width'), '1200');
  assert.equal(meta('og:image:height'), '630');
  assert.equal(meta('og:image:type'), 'image/png');
  assert.ok(meta('og:image:alt').includes(page.label));
  assert.ok(meta('robots').includes('max-image-preview:large'));
  assert.equal((html.match(/<h1\b/g) || []).length, 1);
  const image = new URL(meta('og:image'));
  assert.equal(image.origin, new URL(origin).origin);
  const png = await read(image.pathname, true);
  assert.equal(png.subarray(1, 4).toString(), 'PNG');
  assert.equal(png.readUInt32BE(16), 1200);
  assert.equal(png.readUInt32BE(20), 630);
  assert.ok(png.length < 2_000_000);
  const schemas = [...html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs)].map(match => JSON.parse(match[1]));
  assert.equal(schemas[0].url, new URL('/', origin).href);
  assert.equal(schemas[1]['@graph'][1].url, canonical);
  const crumbs = schemas[1]['@graph'][2].itemListElement;
  assert.equal(crumbs.at(-1).item, canonical);
  if (page.path.startsWith('/journey/') && page.path !== '/journey/') {
    assert.ok(html.includes(`data-url="${canonical}"`));
  }
  images.add(image.href); titles.add(meta('og:title')); descriptions.add(meta('og:description'));
  console.log(`${page.path}: canonical, social card, JSON-LD${live ? ', crawler HTTP 200' : ''} OK`);
}
assert.equal(images.size, seoPages.length, 'Every page needs its own image');
assert.equal(titles.size, seoPages.length, 'Every page needs its own title');
assert.equal(descriptions.size, seoPages.length, 'Every page needs its own description');
const robots = await read('/robots.txt');
assert.ok(robots.includes(`${origin}/sitemap-index.xml`));
const sitemap = await read('/sitemap-0.xml');
for (const page of seoPages) assert.ok(sitemap.includes(new URL(page.path, origin).href));
assert.ok(!sitemap.includes('/404'));
if (live) {
  const missing = await fetch(new URL('/seo-check-page-does-not-exist/', origin), { headers });
  assert.equal(missing.status, 404);
  assert.match(await missing.text(), /content="noindex, follow"/);
} else {
  assert.match(readFileSync('dist/404.html', 'utf8'), /content="noindex, follow"/);
}
console.log(`SEO verified for all ${seoPages.length} pages${live ? ` on ${origin}` : ' in dist'}.`);
