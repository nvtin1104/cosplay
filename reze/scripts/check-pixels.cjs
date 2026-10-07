const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const assert = require("node:assert/strict");
(async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    await page.goto(process.env.TEST_URL || "http://127.0.0.1:5173");
    await page.waitForSelector("#loading[hidden]", { state: "attached" });
    await page.locator("#play").click();
    const result = await page.evaluate(async () => {
      const THREE = await import("/node_modules/three/build/three.module.js");
      const { Character } = await import("/src/character/Character.ts");
      const { loadTexture } = await import("/src/scene/AssetLoader.ts");
      const texture = await loadTexture("/assets/character.png");
      const character = new Character(texture);
      const renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: false,
      });
      renderer.setSize(256, 256);
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.setClearColor(0x000000, 0);
      const scene = new THREE.Scene();
      scene.add(character.mesh);
      const camera = new THREE.OrthographicCamera(
        -1016,
        1016,
        1016,
        -1016,
        0.1,
        100,
      );
      camera.position.z = 20;
      const target = new THREE.WebGLRenderTarget(256, 256);
      renderer.setRenderTarget(target);
      const a = new Uint8Array(256 * 256 * 4),
        b = new Uint8Array(a.length);
      renderer.render(scene, camera);
      renderer.readRenderTargetPixels(target, 0, 0, 256, 256, a);
      const reference = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        depthWrite: false,
      });
      character.mesh.material = reference;
      renderer.render(scene, camera);
      renderer.readRenderTargetPixels(target, 0, 0, 256, 256, b);
      let max = 0,
        differing = 0;
      for (let i = 0; i < a.length; i++) {
        const delta = Math.abs(a[i] - b[i]);
        max = Math.max(max, delta);
        if (delta > 1) differing++;
      }
      reference.dispose();
      target.dispose();
      character.dispose();
      renderer.dispose();
      return {
        maxChannelDifference: max,
        channelsDifferingByMoreThanOne: differing,
        totalChannels: a.length,
      };
    });
    assert.ok(result.maxChannelDifference <= 1, JSON.stringify(result));
    console.log(
      "PASS: undeformed character shader matches the standard original-texture rendering.",
      JSON.stringify(result),
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
