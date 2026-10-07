import {
  WebGLRenderer,
  Scene,
  OrthographicCamera,
  Mesh,
  MeshBasicMaterial,
  PlaneGeometry,
  SRGBColorSpace,
  NoToneMapping,
  Texture,
  BoxHelper,
} from "three";
import { settings } from "../settings";
import { loadTexture } from "./AssetLoader";
import { CameraController } from "./CameraController";
import { Character } from "../character/Character";
import { WindController } from "../environment/WindController";
import { RainSystem } from "../environment/RainSystem";
import { Atmosphere } from "../environment/Atmosphere";
export class SceneManager {
  renderer: WebGLRenderer;
  scene = new Scene();
  camera = new OrthographicCamera(-1, 1, 1, -1, 0.1, 100);
  pointer = new CameraController();
  wind = new WindController();
  rain = new RainSystem();
  atmosphere = new Atmosphere();
  character!: Character;
  background!: Mesh<PlaneGeometry, MeshBasicMaterial>;
  bounds!: BoxHelper;
  playing = true;
  reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  time = 0;
  frame = 0;
  last = 0;
  width = 1;
  height = 1;
  fps = 60;
  private frames = 0;
  private elapsed = 0;
  private bgBaseW = 1;
  private bgBaseH = 1;
  private quality = "";
  private disposed = false;
  maskStorageKey = "default";
  onMetrics?: (fps: number, draws: number) => void;
  onBlinkArtworkChanged?: (ready: boolean) => void;
  constructor(public host: HTMLElement) {
    this.renderer = new WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: "high-performance",
    });
    this.renderer.outputColorSpace = SRGBColorSpace;
    this.renderer.toneMapping = NoToneMapping;
    this.renderer.setClearColor(0x15201e);
    host.append(this.renderer.domElement);
    this.camera.position.z = 20;
    this.renderer.domElement.addEventListener(
      "webglcontextlost",
      this.contextLost,
    );
    this.renderer.domElement.addEventListener(
      "webglcontextrestored",
      this.contextRestored,
    );
  }
  async init() {
    const [background, character] = await Promise.all([
      loadTexture("/assets/background.jpeg"),
      loadTexture("/assets/character.png"),
    ]);
    this.background = new Mesh(
      new PlaneGeometry(1, 1),
      new MeshBasicMaterial({ map: background, depthWrite: false }),
    );
    this.background.position.z = -4;
    this.background.renderOrder = 0;
    this.character = new Character(character);
    this.bounds = new BoxHelper(this.character.mesh, 0x9bddbe);
    this.bounds.renderOrder = 6;
    this.bounds.visible = false;
    this.scene.add(
      this.background,
      ...this.rain.meshes,
      this.character.mesh,
      this.atmosphere.mesh,
      this.bounds,
    );
    this.playing = !this.reducedMotion;
    this.resize();
    window.addEventListener("resize", this.resize);
    document.addEventListener("visibilitychange", this.visibility);
    this.frame = requestAnimationFrame(this.tick);
  }
  resize = () => {
    this.width = this.host.clientWidth;
    this.height = this.host.clientHeight;
    const w = this.width,
      h = this.height;
    this.camera.left = -w / 2;
    this.camera.right = w / 2;
    this.camera.top = h / 2;
    this.camera.bottom = -h / 2;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
    if (this.background) {
      const image = this.background.material.map!.image;
      const cover = Math.max(w / image.width, h / image.height);
      this.bgBaseW = image.width * cover;
      this.bgBaseH = image.height * cover;
    }
    this.rain.resize(w, h);
    this.atmosphere.mesh.scale.set(w, h, 1);
    this.layout();
  };
  layout() {
    if (!this.character) return;
    const h = this.height,
      w = this.width;
    const scale =
      (h / (2032 * (1 - 0.303))) *
      settings.characterScale *
      (w / h < 0.65 ? 0.87 : 1);
    this.character.mesh.scale.setScalar(scale);
    this.character.mesh.position.set(
      settings.characterX * w -
        -0.008 * 2032 * scale +
        this.pointer.x * settings.parallax * 3,
      (2032 * scale) / 2 -
        h / 2 +
        settings.characterY * h +
        this.pointer.y * settings.parallax * 2,
      2,
    );
    this.background.scale.set(
      this.bgBaseW * settings.backgroundScale,
      this.bgBaseH * settings.backgroundScale,
      1,
    );
    const xMargin = Math.max(
        0,
        (this.bgBaseW * settings.backgroundScale - w) / 2,
      ),
      yMargin = Math.max(0, (this.bgBaseH * settings.backgroundScale - h) / 2);
    this.background.position.x =
      this.pointer.x * Math.min(xMargin, settings.parallax * 7);
    this.background.position.y =
      this.pointer.y * Math.min(yMargin, settings.parallax * 5);
    this.bounds.visible = settings.bounds;
    if (settings.bounds) this.bounds.update();
  }
  tick = (now: number) => {
    if (this.disposed) return;
    this.frame = requestAnimationFrame(this.tick);
    const actualDt = (now - (this.last || now)) / 1000;
    const dt = Math.min(actualDt, 0.05);
    this.last = now;
    if (settings.quality !== this.quality) {
      this.quality = settings.quality;
      this.renderer.setPixelRatio(
        Math.min(
          devicePixelRatio,
          this.quality === "Low" ? 1 : this.quality === "Medium" ? 1.5 : 2,
        ),
      );
      this.renderer.setSize(this.width, this.height);
      this.character.setQuality(this.quality);
    }
    if (this.playing) {
      // Animation phases follow elapsed time even when the GPU drops frames.
      this.time += Math.min(actualDt, 0.25);
      this.pointer.update(dt);
      this.wind.update(this.time, dt, settings);
      this.character.update(this.time, dt, settings, this.wind);
      this.rain.update(this.time, settings, this.wind);
      this.atmosphere.material.uniforms.uTime.value = this.time;
    } else {
      this.character.update(this.time, 0, settings, this.wind);
      this.rain.update(this.time, settings, this.wind);
    }
    this.atmosphere.material.uniforms.uStrength.value =
      settings.quality === "Low" ? 0 : settings.mist;
    this.layout();
    this.renderer.render(this.scene, this.camera);
    this.frames++;
    this.elapsed += actualDt;
    if (this.elapsed >= 0.7) {
      this.fps = Math.round(this.frames / this.elapsed);
      this.onMetrics?.(this.fps, this.renderer.info.render.calls);
      this.frames = 0;
      this.elapsed = 0;
    }
  };
  visibility = () => {
    cancelAnimationFrame(this.frame);
    this.last = 0;
    if (!document.hidden && !this.disposed)
      this.frame = requestAnimationFrame(this.tick);
  };
  contextLost = (event: Event) => {
    event.preventDefault();
    cancelAnimationFrame(this.frame);
    this.host.dispatchEvent(
      new CustomEvent("scene-error", {
        detail: "Graphics context lost. Waiting for your device to recover…",
      }),
    );
  };
  contextRestored = () => {
    this.last = 0;
    this.host.dispatchEvent(new CustomEvent("scene-ready"));
    this.frame = requestAnimationFrame(this.tick);
  };
  async replaceBackground(url: string) {
    const t = await loadTexture(url);
    this.background.material.map?.dispose();
    this.background.material.map = t;
    this.background.material.needsUpdate = true;
    this.resize();
  }
  async replaceCharacter(url: string) {
    const t = await loadTexture(url);
    const image = t.image;
    if (image.width !== image.height) {
      const c = document.createElement("canvas");
      c.width = c.height = Math.max(image.width, image.height);
      c.getContext("2d")!.drawImage(
        image,
        (c.width - image.width) / 2,
        c.height - image.height,
      );
      t.image = c;
      t.needsUpdate = true;
    }
    this.character.texture.dispose();
    this.character.texture = t;
    this.character.material.uniforms.map.value = t;
    const closed = this.character.material.uniforms.closedMap.value;
    if (this.character.material.uniforms.uHasClosed.value) closed.dispose();
    this.character.material.uniforms.closedMap.value = t;
    this.character.material.uniforms.uHasClosed.value = 0;
    this.onBlinkArtworkChanged?.(false);
    for (const name of Object.keys(
      this.character.masks.canvases,
    ) as (keyof typeof this.character.masks.canvases)[]) {
      this.character.masks.canvases[name]
        .getContext("2d")!
        .clearRect(0, 0, 1024, 1024);
      this.character.masks.changed(name);
    }
    this.resize();
  }
  async closedEyes(url: string) {
    const t = await loadTexture(url);
    const source = this.character.texture.image;
    if (t.image.width !== source.width || t.image.height !== source.height) {
      t.dispose();
      throw new Error(
        "The closed-eye texture must match the character canvas dimensions and alignment.",
      );
    }
    const u = this.character.material.uniforms;
    if (u.uHasClosed.value) u.closedMap.value.dispose();
    u.closedMap.value = t;
    u.uHasClosed.value = 1;
    this.onBlinkArtworkChanged?.(true);
  }
  dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.frame);
    window.removeEventListener("resize", this.resize);
    document.removeEventListener("visibilitychange", this.visibility);
    this.pointer.dispose();
    this.character.dispose();
    this.rain.dispose();
    this.atmosphere.dispose();
    this.bounds.dispose();
    this.background.geometry.dispose();
    this.background.material.map?.dispose();
    this.background.material.dispose();
    this.renderer.dispose();
  }
}
