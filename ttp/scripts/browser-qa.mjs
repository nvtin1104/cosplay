import { chromium } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import assert from 'node:assert/strict';
mkdirSync('qa', { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const results = [];
const errors = [];
try {
  for (const width of [375, 768, 1440]) {
    const page = await browser.newPage({ viewport: { width, height: 1000 } });
    page.on('pageerror', e => errors.push(e.message));
    page.on('response', r => { if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`); });
    await page.goto('http://127.0.0.1:4321/', { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    assert.equal(await page.locator('h1').count(), 1);
    assert.ok(await page.locator('.journey-nav').isVisible());
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), `horizontal overflow at ${width}`);
    for (const id of ['about', 'story', 'chapter', 'gallery', 'community', 'next']) {
      await page.locator(`#${id}`).scrollIntoViewIfNeeded();
      await page.waitForTimeout(850);
    }
    if (width === 375) {
      await page.evaluate(() => window.scrollTo(0, 0));
      const menu = page.locator('.mobile-menu summary');
      await menu.focus();
      await page.keyboard.press('Enter');
      assert.equal(await page.locator('.mobile-menu').getAttribute('open'), '');
      await page.keyboard.press('Tab');
      assert.equal(await page.evaluate(() => document.activeElement?.textContent), 'Về Phát');
      await page.keyboard.press('Escape');
      assert.equal(await page.locator('.mobile-menu').getAttribute('open'), null);
      await menu.click();
      await page.locator('.mobile-menu a[href="#story"]').click();
      assert.equal(await page.locator('.mobile-menu').getAttribute('open'), null);
    }
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(600);
    await page.waitForFunction(() => document.querySelector('.journey-next')?.getAttribute('href') === '#about');
    await page.evaluate(() => history.replaceState(null, '', '#top'));
    await page.locator('.motion-toggle').click();
    assert.equal(await page.locator('.motion-toggle').getAttribute('aria-pressed'), 'true');
    assert.ok(await page.evaluate(() => document.documentElement.classList.contains('motion-paused')));
    await page.reload({ waitUntil: 'networkidle' });
    assert.equal(await page.locator('.motion-toggle').getAttribute('aria-pressed'), 'true');
    await page.locator('.motion-toggle').click();
    for (const [target, following] of [['about', 'story'], ['story', 'chapter'], ['chapter', 'gallery'], ['gallery', 'community'], ['community', 'next'], ['next', 'top']]) {
      await page.locator('.journey-next').click();
      await page.waitForFunction((hash) => location.hash === hash, `#${target}`);
      await page.waitForFunction((href) => document.querySelector('.journey-next')?.getAttribute('href') === href, `#${following}`);
      assert.ok(await page.evaluate(() => parseFloat(document.documentElement.style.getPropertyValue('--reading-progress')) > 0));
      if (['about', 'story', 'chapter', 'gallery'].includes(target)) assert.ok(await page.locator(`.header nav a[href="#${target}"][aria-current="location"]`).count() >= 1);
    }
    await page.locator('.journey-previous').click();
    await page.waitForFunction(() => location.hash === '#community');
    await page.locator('.journey-next').click();
    await page.waitForFunction(() => document.querySelector('.journey-next')?.getAttribute('href') === '#top');
    await page.locator('.journey-next').click();
    await page.waitForFunction(() => document.querySelector('.journey-next')?.getAttribute('href') === '#about');
    await page.waitForTimeout(900);
    await page.screenshot({ path: `qa/hero-${width}.png` });
    await page.screenshot({ path: `qa/landing-${width}.png`, fullPage: true });
    results.push({ viewport: width, overflow: false, sections: 7, errors: 0 });
    await page.close();
  }
  const nojs = await browser.newPage({ javaScriptEnabled: false, viewport: { width: 375, height: 1000 } });
  await nojs.goto('http://127.0.0.1:4321/');
  assert.ok(await nojs.locator('#story').isVisible());
  await nojs.locator('.mobile-menu summary').click();
  assert.ok(await nojs.locator('.mobile-menu a[href="#about"]').isVisible());
  assert.equal(await nojs.locator('.reveal').count(), 0);
  assert.ok(await nojs.locator('.journey-nav').isHidden());
  await nojs.close();
  const reduced = await browser.newPage({ reducedMotion: 'reduce' });
  await reduced.goto('http://127.0.0.1:4321/');
  assert.equal(await reduced.locator('.reveal').count(), 0);
  assert.equal(await reduced.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior), 'auto');
  assert.ok(await reduced.locator('.motion-toggle').isDisabled());
  assert.equal(await reduced.evaluate(() => document.documentElement.classList.contains('motion-enabled')), false);
  assert.equal(await reduced.locator('.hero-art .willow > g').first().evaluate(el => getComputedStyle(el).animationName), 'none');
  await reduced.close();
  const social = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
  await social.goto('http://127.0.0.1:4321/social.svg');
  await social.screenshot({ path: 'public/social.png' });
  await social.close();
  assert.deepEqual(errors, []);
  writeFileSync('qa/browser-results.json', JSON.stringify({ results, noJavaScript: 'passed', reducedMotion: 'passed', keyboardMenu: 'passed', chapterFlow: 'passed', pausePersistence: 'passed', activeNavigation: 'passed', errors }, null, 2));
  console.log('Passed: 375 / 768 / 1440px, chapter flow, progress, active navigation, motion pause, keyboard menu, no JavaScript, reduced motion, HTTP and browser errors.');
} finally { await browser.close(); }
