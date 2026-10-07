const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const assert = require("node:assert/strict");
const fs = require("node:fs");
(async () => {
  fs.mkdirSync("test-results", { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const errors = [];
  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 },
  });
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  await page.goto(process.env.TEST_URL || "http://127.0.0.1:5173");
  await page.waitForSelector("#loading[hidden]", { state: "attached" });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: "test-results/desktop.png" });
  await page.getByRole("button", { name: "Rainy", exact: true }).click();
  assert.equal(await page.locator("#rain-value").innerText(), "80%");
  await page.getByRole("button", { name: "Still", exact: true }).click();
  assert.equal(await page.locator("#rain-value").innerText(), "0%");
  await page.getByRole("button", { name: "Gentle", exact: true }).click();
  await page.locator("#play").click();
  const time = await page.locator("#time").innerText();
  await page.waitForTimeout(1300);
  assert.equal(await page.locator("#time").innerText(), time);
  assert.equal(
    await page.locator("#play-state").innerText(),
    "SCENE IS PAUSED",
  );
  await page.locator("#play").click();
  await page.locator("#edit-masks").click();
  await page.waitForSelector("dialog[open]");
  await page.selectOption("#mask-region", "hair");
  const canvas = page.locator(".mask-canvas-wrap canvas"),
    rect = await canvas.boundingBox();
  await page.mouse.move(rect.x + rect.width * 0.4, rect.y + rect.height * 0.5);
  await page.mouse.down();
  await page.mouse.move(
    rect.x + rect.width * 0.43,
    rect.y + rect.height * 0.54,
    { steps: 6 },
  );
  await page.mouse.up();
  await page.screenshot({ path: "test-results/mask-editor.png" });
  await page.locator("#save-mask").click();
  assert.ok(
    await page.evaluate(() => localStorage.getItem("reze-mask-default-hair")),
  );
  await page.locator("#advanced-toggle").click();
  await page.waitForSelector("#advanced:not([hidden])");
  await page.locator("#export-settings").click();
  await page.locator("#reset").click();
  await page.locator("#close-advanced").click();
  await page.locator("#quality").selectOption("Low");
  await page.waitForTimeout(300);
  await page.locator("#quality").selectOption("Medium");
  await page.waitForTimeout(300);
  await page.locator("#quality").selectOption("High");
  await page.locator("#immersive").click();
  assert.ok(
    await page
      .locator(".studio")
      .evaluate((e) => e.classList.contains("immersive")),
  );
  await page.keyboard.press("Escape");
  assert.equal(await page.locator("#exit-immersive").isVisible(), false);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(300);
  await page.screenshot({ path: "test-results/mobile.png", fullPage: true });
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
    true,
  );
  await page.locator("#edit-masks").click();
  await page.screenshot({ path: "test-results/mobile-editor.png" });
  await page.locator("#save-mask").click();
  await page.setViewportSize({ width: 844, height: 390 });
  await page.waitForTimeout(300);
  await page.screenshot({ path: "test-results/landscape.png", fullPage: true });
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
    true,
  );
  const reduced = await browser.newPage({
    viewport: { width: 900, height: 700 },
    reducedMotion: "reduce",
  });
  await reduced.goto(process.env.TEST_URL || "http://127.0.0.1:5173");
  await reduced.waitForSelector("#loading[hidden]", { state: "attached" });
  assert.equal(
    await reduced.locator("#play-state").innerText(),
    "SCENE IS PAUSED",
  );
  await reduced.close();
  assert.deepEqual(errors, []);
  console.log(
    "PASS: WebGL compilation, presets, pause, painting, mask persistence, export/reset, quality, immersive mode, mobile/orientation, reduced motion; no browser errors.",
  );
  console.log("Measured headless FPS:", await page.locator("#fps").innerText());
  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
