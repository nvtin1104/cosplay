import { readFileSync, existsSync } from 'node:fs';
import assert from 'node:assert/strict';
import { parseEnv } from 'node:util';
const configuredSite = (process.env.SITE_URL || (existsSync('.env') ? parseEnv(readFileSync('.env', 'utf8')).SITE_URL : ''))?.trim();
const html = readFileSync('dist/index.html', 'utf8');
assert.match(html, /<html lang="vi"/);
assert.equal((html.match(/<h1\b/g) || []).length, 1);
assert.match(html, /TTP Cosplay Offline \| Trần Tiến Phát/);
assert.match(html, /name="description"/);
assert.match(html, /property="og:image"/);
assert.match(html, /name="twitter:card"/);
for (const id of ['about', 'story', 'chapter', 'gallery', 'community', 'next']) assert.match(html, new RegExp(`id="${id}"`));
const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]);
assert.equal(new Set(ids).size, ids.length, 'duplicate IDs');
for (const [, target] of html.matchAll(/href="#([^"]+)"/g)) assert.ok(ids.includes(target), `missing anchor: ${target}`);
const person = JSON.parse(html.match(/<script type="application\/ld\+json">(.*?)<\/script>/s)[1]);
assert.equal(person['@type'], 'Person');
assert.equal(person.name, 'Trần Tiến Phát');
assert.ok(!html.includes('"@type":"Event"'));
assert.ok(!html.includes('href=""'));
const canonical = html.match(/rel="canonical" href="([^"]+)"/);
if (configuredSite) {
  assert.equal(canonical?.[1], new URL('/', configuredSite).href);
  assert.ok(existsSync('dist/sitemap-index.xml'));
  assert.match(readFileSync('dist/robots.txt', 'utf8'), /Sitemap: https?:\/\//);
} else {
  assert.ok(!canonical);
  assert.ok(!existsSync('dist/sitemap-index.xml'));
  assert.ok(!person.url);
}
console.log('Verified: Vietnamese static content, headings, anchors, metadata, Person JSON-LD and domain-dependent SEO.');
