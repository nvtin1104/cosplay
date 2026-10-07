# Reze — A moment in motion

A runnable Vite + TypeScript + Three.js portrait studio. The supplied transparent character and café photograph are copied byte-for-byte into `public/assets`. Neither original is edited or regenerated.

## Run

Node.js 20.19+ or 22.12+ is required by Vite.

```sh
npm install
npm run dev
```

Open the localhost address printed by Vite (normally http://127.0.0.1:5173).

```sh
npm run test      # wind and blink controller tests
npm run build     # strict TypeScript check + production bundle
npm run preview   # serve the production bundle locally
```

Deploy `dist/` to a static web host. Assets are served from the domain root; set Vite's base and update the asset URLs if using a subdirectory.

## Controls

- Gentle, Rainy and Still change atmosphere presets. Still removes rain and retains a very light breeze.
- Pause freezes scene time; controls still update the paused preview.
- Enter the scene hides the studio interface; Escape exits.
- Wind/rain sliders, parallax toggle, movement toggle and quality selector provide the main controls.
- The sliders icon opens advanced wind, hair, eyes, body, rain, composition and debug controls.
- Export/import settings stores the scene parameters as JSON. Uploaded artwork stays in the browser and is not included in settings exports.
- Load a background, transparent character PNG or aligned closed-eye PNG through advanced controls. Custom character masks start empty so a new face cannot accidentally inherit the fitted portrait's deformation. Non-square characters are padded, without stretching, into a square in memory; masks correspond to that padded square.
- Reset restores the default parameters and fitted masks for the bundled portrait. On an imported character it clears the masks instead.

## Motion regions

Choose **Edit motion regions**. Paint hair, roots, tips, face, left/right eye, body or clothes. The cyan overlay shows the selected mask. White means full influence, transparent/black means none. Brushes have soft edges; hold Shift or use Erase to remove influence. Clear region, import a grayscale/alpha PNG and export PNG are supported. Use a pointer or touch to paint. Save & return stores masks in browser local storage, keyed by the uploaded character's SHA-256 hash. Reloading starts with the bundled artwork; reimport the same custom character to restore its masks. Artwork itself is not stored.

The provided masks are manually fitted approximations for this particular portrait, not automatic segmentation. Inspect **Hair mask**, **Eye mask**, **Body mask**, **UV**, **Mesh** and **Character bounds** in advanced debug controls. Keep hair roots locked; place hair-tip masks inside the hair region. Body and clothing movement excludes the face and hair. The face has no global head transform. For a pixel-still comparison, turn off Natural movement and parallax, and set rain/mist to zero.

## Rendering design

- Orthographic pixel-space composition with a cover-fit background and a bottom-anchored character. Both images retain their aspect ratio. Pointer parallax is damped and clamped to the available background overscan.
- A subdivided character mesh samples the region masks in the vertex shader. A shared smooth wind controller drives hair, clothes and all three rain layers. Hair combines multiple phases/frequencies, slow gusts, tip delay and root locking; breathing is restricted to the upper torso. Deformation amplitudes are expressed in source-image pixels.
- One masked character surface preserves the original alpha silhouette, avoiding duplicated translucent edges and inventing pixels behind extracted hair. Hair/body/face/eyes/clothes are logical masked regions of that surface rather than independent cutouts. True separated hair-front/hair-back occlusion requires additional artwork with hidden surfaces; this two-image version does not fabricate them.
- Blink intervals are randomized around 2–6 seconds, with 100–180 ms closures and occasional double blinks. The eyelids close quickly, hold briefly and reopen more slowly. **An aligned closed-eye PNG is required.** Until it is loaded, the original eyes stay unchanged and the Eyes panel reports “Closed-eye image needed.” The earlier eye-compression/skin-stretch fallback has been removed because it produced false-looking eyelids. Only the soft eye masks blend in the supplied closed-eye artwork; the original silhouette alpha is retained.
- Rendering order: photograph → distant rain → middle rain → character → foreground rain → ground haze. Transparent materials disable depth writing; explicit render orders prevent z-fighting and alpha-order surprises.
- SRGB textures/output, linear alpha blending, mipmaps, antialiasing and a DPR cap of 2 preserve source color and edges. Original texture RGB under transparent pixels is retained.
- Rain uses three instanced GPU geometries, not separate meshes per drop. Motion is computed in shaders; six normal draw calls include atmosphere. Time/uniforms/geometry are reused.
- Rendering stops while the document is hidden. Reduced-motion users start paused. Animation phases follow elapsed time instead of slowing down along with frame rate. Context loss shows a message and resumes after browser recovery. Quality can be switched at runtime.

Hair amplitude now defaults to 18 source pixels before wind/mask weighting (previously 3, which became subpixel motion on screen). Roots are fully locked by default, face pixels are protected, and clothing retains its own small wind amplitude. Mask influence uses both luminance and alpha so feathered borders and brush opacity remain soft.

| Quality | Mesh grid | Max rain instances per layer | DPR cap | Atmosphere               |
| ------- | --------- | ---------------------------- | ------- | ------------------------ |
| Low     | 72 × 72   | 350                          | 1       | Off; turbulence disabled |
| Medium  | 120 × 120 | 800                          | 1.5     | On                       |
| High    | 180 × 180 | 1,600                        | 2       | On                       |

Rain instance counts are multiplied by intensity and foreground amount. Target performance is 60 FPS on capable desktop GPUs and 30–60 FPS on mobile, not a guaranteed rate. Use the live FPS counter and Low/Medium on slower devices. Automated headless rendering uses the browser's available graphics backend and does not establish hardware performance. Google Fonts is optional; local sans-serif fallbacks work offline.

## Project structure

```text
public/assets/                 # unmodified copies of the two inputs
src/
  main.ts                      # studio interface and interaction wiring
  settings.ts                  # defaults and typed scene parameters
  scene/
    SceneManager.ts            # render lifecycle, resize, order, quality
    CameraController.ts        # damped pointer parallax
    AssetLoader.ts             # sRGB loading and downloads
  character/
    Character.ts               # masked character mesh and uniforms
    CharacterMasks.ts          # editable masks and fitted defaults
    HairAnimator.ts            # wind inertia
    BlinkAnimator.ts            # randomized blink scheduling
    BreathingAnimator.ts       # subtle breathing signal
  environment/
    WindController.ts          # shared gust/turbulence controller
    RainSystem.ts              # three instanced GPU rain layers
    Atmosphere.ts              # low-opacity drifting ground haze
  shaders/
    hair.vert / hair.frag      # region deformation and localized blinking
    rain.vert / rain.frag      # GPU rain animation and soft streaks
  ui/
    DebugPanel.ts              # lil-gui advanced controls
    MaskEditor.ts              # pointer painting, import/export, persistence
  style.css                    # responsive studio interface
tests/controllers.test.ts      # controller behavior tests
scripts/check-browser.cjs      # optional end-to-end browser checks
scripts/check-pixels.cjs       # undeformed shader vs original-texture comparison
```

For optional browser checks, run the dev server, install Playwright and its Chromium browser in your development environment, then run:

```sh
npm install --no-save playwright
npx playwright install chromium
node scripts/check-browser.cjs
node scripts/check-pixels.cjs  # Vite development server required
```

You can also set `PLAYWRIGHT_MODULE` to an existing Playwright installation, and `TEST_URL` to a different preview address. Screenshots are written to ignored `test-results/`. Checks cover WebGL errors, presets, pause, mask painting/persistence, quality changes, settings export/reset, immersive mode, mobile/orientation and reduced motion.

Validation on this workspace: production build and four controller tests passed; browser interaction checks passed without console/shader errors; the undeformed character shader matched a standard Three.js image plane exactly across 262,144 sampled color channels. SHA-256 comparisons confirmed that both bundled asset copies are byte-identical to the original inputs. The automated browser reported 5 FPS in High quality during the final orientation check; this is below the requested target and hardware performance still needs verification on the intended desktop/mobile devices.
