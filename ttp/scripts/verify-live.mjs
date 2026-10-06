import assert from 'node:assert/strict';
const base = process.argv[2] || 'https://ttp-cosplay-offline.pages.dev';
const paths = ['/', '/robots.txt', '/sitemap-index.xml', '/sitemap-0.xml', '/social.png'];
await Promise.all(paths.map(async path => {
  const response = await fetch(new URL(path, base));
  assert.equal(response.status, 200, `${path} must return HTTP 200`);
  if (path === '/social.png') {
    assert.match(response.headers.get('content-type') || '', /image\/png/);
  } else {
    const text = await response.text();
    if (path === '/') {
      assert.ok(text.includes(`rel="canonical" href="${base}/"`));
      assert.ok(text.includes(`property="og:image" content="${base}/social.png"`));
      assert.ok(text.includes('TTP Cosplay Offline'));
    }
    if (path === '/robots.txt') assert.ok(text.includes(`${base}/sitemap-index.xml`));
    if (path === '/sitemap-0.xml') assert.ok(text.includes(`${base}/`));
  }
  console.log(`${path}: HTTP 200`);
}));
console.log('Live deployment verified: homepage, canonical, Open Graph, robots, sitemap and social image.');
