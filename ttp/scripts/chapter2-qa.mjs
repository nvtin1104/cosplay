import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';

const base = process.env.QA_BASE_URL || 'http://127.0.0.1:4322';
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const errors = [];
const results = [];
mkdirSync('qa', { recursive: true });
try {
  for (const width of [375, 768, 1440]) {
    const page = await browser.newPage({ viewport: { width, height: 1000 } });
    page.on('pageerror', error => errors.push(error.message));
    page.on('response', response => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });
    const response = await page.goto(`${base}/journey/chapter-2/`, { waitUntil: 'networkidle' });
    assert.equal(response.status(), 200);
    await page.evaluate(() => document.fonts.ready);
    assert.equal(await page.locator('h1').count(), 1);
    assert.equal(await page.locator('.album-wall, .photo-viewer').count(), 0);
    assert.equal(await page.locator('.event-poster img').count(), 2);
    assert.equal(await page.locator('.event-venue img').count(), 4);
    assert.match(await page.locator('.event-lead').textContent(), /The Bapun 3/);
    assert.equal(await page.locator('.event-person').count(), 3);
    assert.ok(await page.locator('header').isVisible());
    assert.equal(await page.locator('footer').count(), 1);
    assert.deepEqual(await page.locator('.event-schedule time').allTextContents(), ['15:30', '16:30', '17:30']);
    assert.ok(await page.evaluate(() => !!(document.querySelector('#timeline').compareDocumentPosition(document.querySelector('#judges')) & Node.DOCUMENT_POSITION_FOLLOWING)));
    for (const anchor of ['timeline', 'judges']) {
      await page.locator(`.event-actions a[href="#${anchor}"]`).click();
      assert.equal(new URL(page.url()).hash, `#${anchor}`);
    }
    for (const image of await page.locator('.chapter-event img').all()) {
      await image.scrollIntoViewIfNeeded();
      await image.evaluate(img => img.decode());
      assert.ok(await image.evaluate(img => img.naturalWidth > 0));
      if (!await image.evaluate(img => !!img.closest('.road-photo-back'))) {
        assert.ok(await image.evaluate(img => Math.abs(img.width / img.height - img.naturalWidth / img.naturalHeight) < 0.02));
      }
    }
    assert.equal(await page.locator('.event-person h3 a[href="https://www.facebook.com/hinataneko1602"]').count(), 1);
    assert.equal(await page.locator('.event-person h3 a[href="https://www.facebook.com/hien.dieu.623866"]').count(), 1);
    assert.equal(await page.locator('.event-person h3 a[href="https://www.facebook.com/ray.ray.81806"]').count(), 1);
    assert.equal(await page.locator('.event-map[href="https://maps.app.goo.gl/QwCeGRGSwbtC9UCk8"]').count(), 2);
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `overflow at ${width}`);
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    await page.screenshot({ path: `qa/chapter2-${width}.png`, fullPage: true });
    await page.locator('.event-ending a').click();
    await page.waitForURL('**/journey/');
    const link = page.locator('.road-link[href="/journey/chapter-2/"]');
    assert.match(await link.textContent(), /Xem thông tin sự kiện/);
    await link.click();
    await page.waitForURL('**/journey/chapter-2/');
    results.push({ width, passed: true });
    await page.close();
  }
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto(`${base}/journey/chapter-2/`);
  assert.ok(await page.locator('#timeline').isVisible());
  assert.ok(await page.locator('#judges').isVisible());
  await page.locator('.event-actions a[href="#judges"]').click();
  assert.equal(new URL(page.url()).hash, '#judges');
  await context.close();
  const album = await browser.newPage();
  await album.goto(`${base}/journey/chapter-1/`, { waitUntil: 'networkidle' });
  assert.ok(await album.locator('.album-wall').isVisible());
  await album.locator('.album-tile').first().click();
  assert.ok(await album.locator('.photo-viewer').isVisible());
  await album.keyboard.press('Escape');
  assert.ok(await album.locator('.photo-viewer').isHidden());
  await album.close();
  assert.deepEqual(errors, []);
  writeFileSync('qa/chapter2-results.json', JSON.stringify({ results, noJavaScript: true, chapter1Album: true, errors }, null, 2));
  console.log('Chapter 2: 375/768/1440px, image ratios, section order, links, no-JS and Chapter 1 album passed.');
} finally {
  await browser.close();
}
