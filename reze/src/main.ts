import "./style.css";
import { SceneManager } from "./scene/SceneManager";
import { defaults, settings } from "./settings";
import { debugPanel } from "./ui/DebugPanel";
import { MaskEditor } from "./ui/MaskEditor";
import { downloadBlob } from "./scene/AssetLoader";
const icons = {
  play: '<path d="m9 5 11 7-11 7Z"/>',
  pause: '<path d="M9 5v14M15 5v14"/>',
  sliders:
    '<path d="M4 7h16M4 17h16"/><circle cx="9" cy="7" r="2"/><circle cx="15" cy="17" r="2"/>',
  expand: '<path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5"/>',
  wind: '<path d="M3 8h12a3 3 0 1 0-3-3M3 12h16a3 3 0 1 1-3 3M3 16h6"/>',
  rain: '<path d="M7 15l-2 5m8-5-2 5m8-5-2 5M5 12a4 4 0 0 1 0-8 5 5 0 0 1 9-1 4 4 0 1 1 4 9Z"/>',
  layers: '<path d="m12 3 9 5-9 5-9-5Zm-9 9 9 5 9-5m-18 5 9 5 9-5"/>',
  arrow: '<path d="M5 12h14m-5-5 5 5-5 5"/>',
};
const icon = (name: keyof typeof icons) =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name]}</svg>`;
document.querySelector<HTMLDivElement>("#app")!.innerHTML = `
<main class="studio"><div id="scene" aria-label="Animated portrait in front of a quiet café"></div><div class="vignette"></div>
<header><a class="brand" href="#" aria-label="Reze studio"><span class="brand-mark">r.</span><span>REZE<span class="brand-sub">LIVING SCENES</span></span></a><div class="header-right"><span class="live-label"><i></i> WEBGL STUDIO</span><button id="fullscreen" class="icon-button" aria-label="Enter fullscreen">${icon("expand")}</button></div></header>
<div class="scene-caption"><span class="eyebrow"><span></span> SCENE 001 / A QUIET AFTERNOON</span><h1>A moment<br>in motion<span>.</span></h1><p>A little wind. A passing shower.<br>The stillness between everything.</p><button id="immersive" class="text-button">Enter the scene ${icon("arrow")}</button></div>
<aside class="control-panel" aria-label="Scene controls"><div class="panel-heading"><div><span class="eyebrow">MAKE IT YOUR MOMENT</span><h2>Atmosphere</h2></div><button id="advanced-toggle" class="icon-button" aria-label="Show advanced controls" aria-expanded="false">${icon("sliders")}</button></div>
<div class="presets" role="group" aria-label="Atmosphere presets"><button data-preset="gentle" class="active">Gentle</button><button data-preset="rainy">Rainy</button><button data-preset="still">Still</button></div>
<div class="control"><label for="wind">${icon("wind")}<span>Wind</span><output id="wind-value">42%</output></label><input id="wind" type="range" min="0" max="1" step=".01" value=".42"><div class="range-ends"><span>Whisper</span><span>Breeze</span></div></div>
<div class="control"><label for="rain">${icon("rain")}<span>Rain</span><output id="rain-value">38%</output></label><input id="rain" type="range" min="0" max="1" step=".01" value=".38"><div class="range-ends"><span>A few drops</span><span>A soft shower</span></div></div>
<div class="toggle-row"><span>Depth & parallax</span><label class="switch"><input id="parallax" type="checkbox" checked aria-label="Depth and parallax"><span></span></label></div><div class="toggle-row"><span>Natural movement</span><label class="switch"><input id="movement" type="checkbox" checked aria-label="Natural movement"><span></span></label></div>
<div class="quality-row"><label for="quality">Render quality</label><select id="quality"><option>Low</option><option>Medium</option><option selected>High</option></select></div>
<button id="edit-masks" class="mask-button">${icon("layers")} Edit motion regions <span>↗</span></button><div class="panel-foot"><i></i><span>Original pixels. Gently animated.</span></div></aside>
<div id="advanced" class="advanced" hidden><div class="advanced-head"><span>SCENE TOOLKIT</span><button id="close-advanced" class="icon-button" aria-label="Close advanced controls">✕</button></div><div id="gui"></div><div class="asset-tools"><h3>Your artwork</h3><p>Images stay in your browser. New characters start with empty masks.</p><label class="file-button">Load character PNG<input id="character-file" type="file" accept="image/png"></label><label class="file-button">Load background<input id="background-file" type="file" accept="image/png,image/jpeg,image/webp"></label><label class="file-button">Load closed-eye texture<input id="closed-file" type="file" accept="image/png"></label><button id="export-settings">Export scene settings</button><label class="file-button">Import scene settings<input id="import-settings" type="file" accept="application/json"></label><button id="reset">Reset scene & masks</button></div></div>
<footer><div class="transport"><button id="play" class="icon-button" aria-label="Pause animation">${icon("pause")}</button><div><span id="play-state">SCENE IS PLAYING</span><small id="time">00:00</small></div><span class="transport-line"></span><span class="sound-note">A quiet afternoon</span></div><div class="performance"><i></i><span id="fps">— FPS</span><span class="perf-divider">/</span><span id="draws">GPU RENDERED</span></div></footer>
<div id="loading" class="loading" role="status"><span class="brand-mark">r.</span><p>Bringing the moment to life…</p></div><div id="toast" class="toast" role="status" hidden></div><button id="exit-immersive" class="exit-immersive" hidden>Exit scene <span>Esc</span></button></main>`;
const el = <T extends HTMLElement = HTMLElement>(id: string) =>
  document.getElementById(id) as T;
let manager: SceneManager;
function toast(message: string) {
  el("toast").textContent = message;
  el("toast").hidden = false;
  window.setTimeout(() => (el("toast").hidden = true), 5000);
}
function sync() {
  el<HTMLInputElement>("wind").value = String(settings.windStrength);
  el<HTMLInputElement>("rain").value = String(settings.rainIntensity);
  el("wind-value").textContent = `${Math.round(settings.windStrength * 100)}%`;
  el("rain-value").textContent = `${Math.round(settings.rainIntensity * 100)}%`;
  el<HTMLSelectElement>("quality").value = settings.quality;
  el<HTMLInputElement>("parallax").checked = settings.parallax > 0;
}
async function boot() {
  try {
    manager = new SceneManager(el("scene"));
    await manager.init();
    const editor = new MaskEditor(manager);
    try {
      await editor.restore();
    } catch {
      toast("Stored masks could not be restored. Default regions are active.");
    }
    const gui = debugPanel(manager, el("gui"));
    gui.onChange(() => sync());
    el("loading").hidden = true;
    const playState = () => {
      el("play").innerHTML = icon(manager.playing ? "pause" : "play");
      el("play").setAttribute(
        "aria-label",
        manager.playing ? "Pause animation" : "Play animation",
      );
      el("play-state").textContent = manager.playing
        ? "SCENE IS PLAYING"
        : "SCENE IS PAUSED";
    };
    playState();
    el("play").onclick = () => {
      manager.playing = !manager.playing;
      playState();
    };
    manager.onMetrics = (fps, draws) => {
      el("fps").textContent = `${fps} FPS`;
      el("draws").textContent = `${draws} DRAW CALLS`;
      const t = Math.floor(manager.time);
      el("time").textContent =
        `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`;
    };
    el("scene").addEventListener("scene-error", (event) =>
      toast((event as CustomEvent).detail),
    );
    el("scene").addEventListener("scene-ready", () =>
      toast("Graphics restored."),
    );
    el<HTMLInputElement>("wind").oninput = (e) => {
      settings.windStrength = Number((e.target as HTMLInputElement).value);
      sync();
      gui.controllersRecursive().forEach((c) => c.updateDisplay());
    };
    el<HTMLInputElement>("rain").oninput = (e) => {
      settings.rainIntensity = Number((e.target as HTMLInputElement).value);
      sync();
      gui.controllersRecursive().forEach((c) => c.updateDisplay());
    };
    el<HTMLInputElement>("parallax").onchange = (e) => {
      settings.parallax = (e.target as HTMLInputElement).checked ? 0.45 : 0;
    };
    el<HTMLInputElement>("movement").onchange = (e) => {
      const on = (e.target as HTMLInputElement).checked;
      settings.hairAmplitude = on ? defaults.hairAmplitude : 0;
      settings.breathingStrength = on ? defaults.breathingStrength : 0;
      settings.idleStrength = on ? defaults.idleStrength : 0;
      settings.blinkEnabled = on;
    };
    el<HTMLSelectElement>("quality").onchange = (e) =>
      (settings.quality = (e.target as HTMLSelectElement).value);
    document.querySelectorAll<HTMLButtonElement>("[data-preset]").forEach(
      (button) =>
        (button.onclick = () => {
          document
            .querySelectorAll("[data-preset]")
            .forEach((b) => b.classList.toggle("active", b === button));
          const preset = button.dataset.preset!;
          Object.assign(
            settings,
            preset === "gentle"
              ? {
                  windStrength: 0.42,
                  rainIntensity: 0.38,
                  rainSpeed: 1,
                  rainOpacity: 0.28,
                  gustStrength: 0.5,
                }
              : preset === "rainy"
                ? {
                    windStrength: 0.72,
                    rainIntensity: 0.8,
                    rainSpeed: 1.35,
                    rainOpacity: 0.42,
                    gustStrength: 0.7,
                  }
                : {
                    windStrength: 0.12,
                    rainIntensity: 0,
                    rainSpeed: 1,
                    rainOpacity: 0.28,
                    gustStrength: 0.15,
                  },
          );
          sync();
          gui.controllersRecursive().forEach((c) => c.updateDisplay());
        }),
    );
    const advanced = (open: boolean) => {
      el("advanced").hidden = !open;
      el("advanced-toggle").setAttribute("aria-expanded", String(open));
    };
    el("advanced-toggle").onclick = () => advanced(el("advanced").hidden);
    el("close-advanced").onclick = () => advanced(false);
    el("edit-masks").onclick = () => editor.open();
    el("fullscreen").onclick = async () => {
      try {
        if (document.fullscreenElement) await document.exitFullscreen();
        else await document.documentElement.requestFullscreen();
      } catch {
        toast(
          "Fullscreen is unavailable in this browser. Use Enter the scene.",
        );
      }
    };
    const immersive = (on: boolean) => {
      document.querySelector(".studio")!.classList.toggle("immersive", on);
      el("exit-immersive").hidden = !on;
    };
    el("immersive").onclick = () => immersive(true);
    el("exit-immersive").onclick = () => immersive(false);
    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape") immersive(false);
    });
    for (const [id, fn] of [
      ["character-file", (url: string) => manager.replaceCharacter(url)],
      ["background-file", (url: string) => manager.replaceBackground(url)],
      ["closed-file", (url: string) => manager.closedEyes(url)],
    ] as const) {
      el<HTMLInputElement>(id).onchange = async (e) => {
        const input = e.target as HTMLInputElement;
        const file = input.files?.[0];
        if (!file) return;
        const url = URL.createObjectURL(file);
        try {
          if (id === "character-file") editor.persist();
          await fn(url);
          if (id === "character-file") {
            const hash = await crypto.subtle.digest(
              "SHA-256",
              await file.arrayBuffer(),
            );
            manager.maskStorageKey = Array.from(new Uint8Array(hash))
              .map((b) => b.toString(16).padStart(2, "0"))
              .join("");
            await editor.restore();
          }
          toast(
            id === "character-file"
              ? "Character loaded. Paint motion regions to enable animation."
              : "Artwork loaded.",
          );
          } catch (error) {
          toast(
              error instanceof Error && error.message.includes("closed-eye texture")
                ? error.message
                : "Could not load this image. Please choose a valid PNG or JPEG.",
          );
        } finally {
          URL.revokeObjectURL(url);
          input.value = "";
        }
      };
    }
    el("export-settings").onclick = () =>
      downloadBlob(
        new Blob([JSON.stringify(settings, null, 2)], {
          type: "application/json",
        }),
        "reze-scene.json",
      );
    el<HTMLInputElement>("import-settings").onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      try {
        const input = JSON.parse(await file.text());
        for (const key of Object.keys(defaults) as (keyof typeof defaults)[]) {
          const value = input[key];
          if (
            typeof value === typeof defaults[key] &&
            (typeof value !== "number" || Number.isFinite(value))
          ) {
            if (typeof value === "number") {
              const controller = gui
                .controllersRecursive()
                .find((c) => c.property === key);
              const low =
                controller && "_min" in controller
                  ? (controller as unknown as { _min: number })._min
                  : 0;
              const high =
                controller && "_max" in controller
                  ? (controller as unknown as { _max: number })._max
                  : 2;
              Object.assign(settings, {
                [key]: Math.max(low, Math.min(high, value)),
              });
            } else if (key === "quality") {
              if (["Low", "Medium", "High"].includes(value))
                settings.quality = value;
            } else if (key === "debug") {
              if (
                [
                  "Off",
                  "UV",
                  "Hair mask",
                  "Eye mask",
                  "Body mask",
                  "Mesh",
                ].includes(value)
              )
                settings.debug = value;
            } else Object.assign(settings, { [key]: value });
          }
        }
        sync();
        gui.controllersRecursive().forEach((c) => c.updateDisplay());
        toast("Scene settings imported.");
      } catch {
        toast("This settings file is not valid JSON.");
      }
    };
    el("reset").onclick = () => {
      Object.assign(settings, defaults);
      if (manager.maskStorageKey === "default") manager.character.masks.reset();
      else
        for (const name of Object.keys(
          manager.character.masks.canvases,
        ) as (keyof typeof manager.character.masks.canvases)[]) {
          manager.character.masks.canvases[name]
            .getContext("2d")!
            .clearRect(0, 0, 1024, 1024);
          manager.character.masks.changed(name);
        }
      editor.persist();
      sync();
      gui.controllersRecursive().forEach((c) => c.updateDisplay());
      el<HTMLInputElement>("movement").checked = true;
      toast("Scene and masks reset.");
    };
    window.addEventListener("pagehide", () => manager.dispose(), {
      once: true,
    });
  } catch (error) {
    console.error(error);
    el("loading").innerHTML =
      '<h2>The scene could not start.</h2><p>Check that WebGL is enabled and the two assets are available, then reload.</p><button onclick="location.reload()">Try again</button>';
  }
}
void boot();
