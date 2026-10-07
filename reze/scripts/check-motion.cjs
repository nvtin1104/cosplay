const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const assert = require("node:assert/strict");
const fs = require("node:fs");
(async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("console", (m) => {
      if (m.type() === "error") errors.push(m.text());
    });
    // Load the development module graph without running the studio render loop.
    await page.route("**/src/main.ts", (route) =>
      route.fulfill({ contentType: "application/javascript", body: "" }),
    );
    await page.goto(process.env.TEST_URL || "http://127.0.0.1:5174");
    const result = await page.evaluate(async () => {
      const T = await import("/node_modules/three/build/three.module.js");
      const { Character } = await import("/src/character/Character.ts");
      const { loadTexture } = await import("/src/scene/AssetLoader.ts");
      const { WindController } =
        await import("/src/environment/WindController.ts");
      const { defaults } = await import("/src/settings.ts");
      const character = new Character(
        await loadTexture("/assets/character.png"),
      );
      const renderer = new T.WebGLRenderer({
        alpha: true,
        antialias: false,
        preserveDrawingBuffer: true,
      });
      renderer.setSize(600, 680);
      renderer.setClearColor(0x26332c, 1);
      renderer.outputColorSpace = T.SRGBColorSpace;
      const scene = new T.Scene();
      scene.add(character.mesh);
      const camera = new T.OrthographicCamera(
        (0.34 - 0.5) * 2032,
        (0.64 - 0.5) * 2032,
        (0.5 - 0.29) * 2032,
        (0.5 - 0.63) * 2032,
        0.1,
        100,
      );
      camera.position.z = 20;
      const s = { ...defaults, breathingStrength: 0, idleStrength: 0 };
      const wind = new WindController();
      const frames = [];
      const samples = [];
      const gl = renderer.getContext();
      for (let i = 0; i < 48; i++) {
        const time = i / 6;
        for (let j = 0; j < 10; j++) {
          wind.update(time, 1 / 60, s);
          character.update(time, 1 / 60, s, wind);
        }
        character.material.uniforms.uClothWind.value = 0;
        renderer.render(scene, camera);
        const data = new Uint8Array(600 * 680 * 4);
        gl.readPixels(0, 0, 600, 680, gl.RGBA, gl.UNSIGNED_BYTE, data);
        samples.push(data);
        frames.push(renderer.domElement.toDataURL("image/png").split(",")[1]);
      }
      // Compare protected nose/mouth interior and changing left hair tip.
      function difference(a, b, region) {
        let changed = 0,
          max = 0;
        for (let y = 0; y < 680; y++)
          for (let x = 0; x < 600; x++) {
            const u = 0.34 + (x / 600) * 0.3,
              v = 0.63 - (y / 680) * 0.34;
            if (
              u < region[0] ||
              u > region[2] ||
              v < region[1] ||
              v > region[3]
            )
              continue;
            const index = (y * 600 + x) * 4;
            let d = 0;
            for (let c = 0; c < 4; c++)
              d = Math.max(d, Math.abs(a[index + c] - b[index + c]));
            if (d > 2) changed++;
            max = Math.max(max, d);
          }
        return { changed, max };
      }
      const face = difference(
        samples[8],
        samples[30],
        [0.485, 0.493, 0.54, 0.548],
      );
      const roots = difference(
        samples[8],
        samples[30],
        [0.45, 0.33, 0.5, 0.354],
      );
      const hair = difference(
        samples[8],
        samples[30],
        [0.375, 0.51, 0.443, 0.61],
      );
      const before = samples[samples.length - 1];
      character.material.uniforms.uBlink.value = 1;
      renderer.render(scene, camera);
      const after = new Uint8Array(before.length);
      gl.readPixels(0, 0, 600, 680, gl.RGBA, gl.UNSIGNED_BYTE, after);
      let noArtworkDelta = 0;
      for (let i = 0; i < after.length; i++)
        noArtworkDelta = Math.max(
          noArtworkDelta,
          Math.abs(after[i] - before[i]),
        );
      // A synthetic diagnostic texture proves blending stays inside the eye masks.
      // It is never loaded by the application or used as artwork.
      const closed = new T.DataTexture(new Uint8Array([255, 0, 0, 255]), 1, 1);
      closed.colorSpace = T.SRGBColorSpace;
      closed.needsUpdate = true;
      character.material.uniforms.closedMap.value = closed;
      character.material.uniforms.uHasClosed.value = 1;
      renderer.render(scene, camera);
      const withArtwork = new Uint8Array(before.length);
      gl.readPixels(0, 0, 600, 680, gl.RGBA, gl.UNSIGNED_BYTE, withArtwork);
      const eyelidBlend = difference(
        before,
        withArtwork,
        [0.44, 0.455, 0.458, 0.477],
      );
      const protectedFace = difference(
        before,
        withArtwork,
        [0.485, 0.493, 0.54, 0.548],
      );
      let alphaDelta = 0;
      for (let i = 3; i < before.length; i += 4)
        alphaDelta = Math.max(alphaDelta, Math.abs(before[i] - withArtwork[i]));
      character.dispose();
      renderer.dispose();
      return {
        face,
        roots,
        hair,
        noArtworkDelta,
        eyelidBlend,
        protectedFace,
        alphaDelta,
        frames,
      };
    });
    assert.deepEqual(errors, []);
    assert.ok(
      result.hair.changed > 500,
      `Hair movement is not visible: ${JSON.stringify(result.hair)}`,
    );
    assert.equal(
      result.face.changed,
      0,
      `Face deformed: ${JSON.stringify(result.face)}`,
    );
    assert.equal(
      result.roots.changed,
      0,
      `Hair roots moved: ${JSON.stringify(result.roots)}`,
    );
    assert.equal(
      result.noArtworkDelta,
      0,
      "Blink altered the photo without closed-eye artwork",
    );
    assert.ok(
      result.eyelidBlend.changed > 0,
      "Closed-eye texture failed to blend",
    );
    assert.equal(
      result.protectedFace.changed,
      0,
      "Closed-eye texture changed the nose or mouth",
    );
    assert.equal(
      result.alphaDelta,
      0,
      "Closed-eye texture changed silhouette alpha",
    );
    fs.mkdirSync("test-results/motion", { recursive: true });
    result.frames.forEach((frame, i) =>
      fs.writeFileSync(
        `test-results/motion/frame-${String(i).padStart(2, "0")}.png`,
        Buffer.from(frame, "base64"),
      ),
    );
    console.log(
      JSON.stringify({
        hair: result.hair,
        face: result.face,
        roots: result.roots,
        noArtworkDelta: result.noArtworkDelta,
        eyelidBlend: result.eyelidBlend,
        protectedFace: result.protectedFace,
        frames: result.frames.length,
        errors,
      }),
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
