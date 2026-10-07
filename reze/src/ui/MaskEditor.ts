import { maskNames, type MaskName } from "../character/CharacterMasks";
import type { SceneManager } from "../scene/SceneManager";
import { downloadBlob } from "../scene/AssetLoader";
export class MaskEditor {
  element: HTMLElement;
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  selected: MaskName = "hair";
  radius = 16;
  erase = false;
  drawing = false;
  lastX = 0;
  lastY = 0;
  wasPlaying = true;
  constructor(private manager: SceneManager) {
    this.element = document.createElement("dialog");
    this.element.className = "mask-dialog";
    this.element.innerHTML = `<div class="editor-head"><div><small>REGION STUDIO</small><h2>Give motion a boundary.</h2></div><button class="icon-button" aria-label="Close mask editor">✕</button></div><p class="muted">Paint white regions to allow movement. Roots lock hair; face protects skin. Shift erases. Changes are saved on this device.</p><div class="editor-tools"><label>Region<select id="mask-region">${maskNames.map((n) => `<option value="${n}">${n}</option>`).join("")}</select></label><label>Brush<input id="brush" type="range" min="3" max="70" value="16"></label><label class="check"><input id="erase" type="checkbox">Erase</label><button id="clear-mask">Clear region</button><button id="export-mask">Export PNG</button><label class="file-button">Import mask<input type="file" id="import-mask" accept="image/png"></label></div><div class="mask-canvas-wrap"><canvas width="1024" height="1024" aria-label="Paint character animation mask"></canvas></div><div class="editor-foot"><span>Image coordinates · 1024 × 1024 · cyan shows the active mask</span><button class="primary" id="save-mask">Save & return</button></div>`;
    document.body.append(this.element);
    this.canvas = this.element.querySelector("canvas")!;
    this.ctx = this.canvas.getContext("2d")!;
    const close = () => {
      this.persist();
      (this.element as HTMLDialogElement).close();
      this.manager.playing = this.wasPlaying;
    };
    this.element
      .querySelector(".icon-button")!
      .addEventListener("click", close);
    this.element.querySelector("#save-mask")!.addEventListener("click", close);
    this.element.addEventListener("cancel", () => {
      this.persist();
      this.manager.playing = this.wasPlaying;
    });
    this.element
      .querySelector<HTMLSelectElement>("#mask-region")!
      .addEventListener("change", (e) => {
        this.selected = (e.target as HTMLSelectElement).value as MaskName;
        this.draw();
      });
    this.element
      .querySelector<HTMLInputElement>("#brush")!
      .addEventListener(
        "input",
        (e) => (this.radius = Number((e.target as HTMLInputElement).value)),
      );
    this.element
      .querySelector<HTMLInputElement>("#erase")!
      .addEventListener(
        "change",
        (e) => (this.erase = (e.target as HTMLInputElement).checked),
      );
    this.element.querySelector("#clear-mask")!.addEventListener("click", () => {
      this.manager.character.masks.canvases[this.selected]
        .getContext("2d")!
        .clearRect(0, 0, 1024, 1024);
      this.manager.character.masks.changed(this.selected);
      this.draw();
    });
    this.element
      .querySelector("#export-mask")!
      .addEventListener("click", () => {
        this.manager.character.masks.canvases[this.selected].toBlob((b) => {
          if (b) downloadBlob(b, `${this.selected}-mask.png`);
        });
      });
    this.element
      .querySelector<HTMLInputElement>("#import-mask")!
      .addEventListener("change", async (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (!file) return;
        try {
          const bitmap = await createImageBitmap(file);
          const c =
            this.manager.character.masks.canvases[this.selected].getContext(
              "2d",
            )!;
          c.clearRect(0, 0, 1024, 1024);
          c.drawImage(bitmap, 0, 0, 1024, 1024);
          bitmap.close();
          const pixels = c.getImageData(0, 0, 1024, 1024);
          for (let i = 0; i < pixels.data.length; i += 4) {
            pixels.data[i + 3] = Math.round(
              (pixels.data[i] * pixels.data[i + 3]) / 255,
            );
            pixels.data[i] = pixels.data[i + 1] = pixels.data[i + 2] = 255;
          }
          c.putImageData(pixels, 0, 0);
          this.manager.character.masks.changed(this.selected);
          this.draw();
        } catch {
          this.element.querySelector(".muted")!.textContent =
            "Could not read that mask. Choose a valid PNG image.";
        }
      });
    this.canvas.addEventListener("pointerdown", (e) => {
      this.drawing = true;
      this.canvas.setPointerCapture(e.pointerId);
      const p = this.point(e);
      this.lastX = p.x;
      this.lastY = p.y;
      this.paint(e);
    });
    this.canvas.addEventListener("pointermove", (e) => {
      if (this.drawing) this.paint(e);
    });
    this.canvas.addEventListener("pointerup", () => (this.drawing = false));
    this.canvas.addEventListener("pointercancel", () => (this.drawing = false));
  }
  point(e: PointerEvent) {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * 1024,
      y: ((e.clientY - rect.top) / rect.height) * 1024,
    };
  }
  paint(e: PointerEvent) {
    const p = this.point(e),
      dx = p.x - this.lastX,
      dy = p.y - this.lastY,
      n = Math.max(
        1,
        Math.ceil(Math.hypot(dx, dy) / Math.max(1, this.radius / 3)),
      );
    for (let i = 1; i <= n; i++)
      this.manager.character.masks.paint(
        this.selected,
        this.lastX + (dx * i) / n,
        this.lastY + (dy * i) / n,
        this.radius,
        this.erase || e.shiftKey,
      );
    this.lastX = p.x;
    this.lastY = p.y;
    this.draw();
  }
  draw() {
    const c = this.ctx;
    c.clearRect(0, 0, 1024, 1024);
    c.fillStyle = "#1c2827";
    c.fillRect(0, 0, 1024, 1024);
    c.drawImage(this.manager.character.texture.image, 0, 0, 1024, 1024);
    const overlay = document.createElement("canvas");
    overlay.width = overlay.height = 1024;
    const o = overlay.getContext("2d")!;
    o.drawImage(this.manager.character.masks.canvases[this.selected], 0, 0);
    o.globalCompositeOperation = "source-in";
    o.fillStyle = "rgba(112,239,203,.5)";
    o.fillRect(0, 0, 1024, 1024);
    c.drawImage(overlay, 0, 0);
  }
  open() {
    this.wasPlaying = this.manager.playing;
    this.manager.playing = false;
    this.draw();
    (this.element as HTMLDialogElement).showModal();
  }
  persist() {
    try {
      for (const n of maskNames)
        localStorage.setItem(
          `reze-mask-${this.manager.maskStorageKey}-${n}`,
          this.manager.character.masks.canvases[n].toDataURL(),
        );
    } catch {
      this.element.querySelector(".muted")!.textContent =
        "Browser storage is full. Use Export PNG to keep a copy of your mask.";
    }
  }
  async restore() {
    for (const n of maskNames) {
      const data = localStorage.getItem(
        `reze-mask-${this.manager.maskStorageKey}-${n}`,
      );
      if (data) {
        const image = new Image();
        image.src = data;
        await image.decode();
        const c = this.manager.character.masks.canvases[n].getContext("2d")!;
        c.clearRect(0, 0, 1024, 1024);
        c.drawImage(image, 0, 0);
        this.manager.character.masks.changed(n);
      }
    }
  }
}
