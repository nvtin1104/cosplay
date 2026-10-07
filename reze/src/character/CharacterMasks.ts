import { CanvasTexture, LinearFilter, NoColorSpace } from "three";
export const maskNames = [
  "face",
  "hair",
  "roots",
  "tips",
  "leftEye",
  "rightEye",
  "body",
  "clothes",
] as const;
export type MaskName = (typeof maskNames)[number];
type Point = [number, number];
export class CharacterMasks {
  size = 1024;
  canvases = {} as Record<MaskName, HTMLCanvasElement>;
  textures = {} as Record<MaskName, CanvasTexture>;
  revision = 0;
  eyeRevision = 0;
  constructor() {
    for (const name of maskNames) {
      const c = document.createElement("canvas");
      c.width = c.height = this.size;
      this.canvases[name] = c;
      const t = new CanvasTexture(c);
      t.colorSpace = NoColorSpace;
      t.minFilter = t.magFilter = LinearFilter;
      t.generateMipmaps = false;
      this.textures[name] = t;
    }
    this.reset();
  }
  polygon(name: MaskName, points: Point[]) {
    const c = this.canvases[name].getContext("2d")!;
    c.fillStyle = "white";
    c.beginPath();
    points.forEach(([x, y], i) =>
      i
        ? c.lineTo(x * this.size, y * this.size)
        : c.moveTo(x * this.size, y * this.size),
    );
    c.closePath();
    c.fill();
  }
  ellipse(name: MaskName, x: number, y: number, rx: number, ry: number) {
    const c = this.canvases[name].getContext("2d")!;
    c.fillStyle = "white";
    c.beginPath();
    c.ellipse(
      x * this.size,
      y * this.size,
      rx * this.size,
      ry * this.size,
      0,
      0,
      Math.PI * 2,
    );
    c.fill();
  }
  reset() {
    for (const name of maskNames)
      this.canvases[name]
        .getContext("2d")!
        .clearRect(0, 0, this.size, this.size);
    this.polygon("hair", [
      [0.375, 0.47],
      [0.38, 0.385],
      [0.407, 0.327],
      [0.455, 0.305],
      [0.5, 0.308],
      [0.555, 0.35],
      [0.598, 0.417],
      [0.6, 0.474],
      [0.577, 0.49],
      [0.568, 0.524],
      [0.596, 0.545],
      [0.563, 0.546],
      [0.554, 0.505],
      [0.564, 0.475],
      [0.542, 0.448],
      [0.508, 0.424],
      [0.502, 0.49],
      [0.478, 0.514],
      [0.467, 0.486],
      [0.454, 0.438],
      [0.439, 0.443],
      [0.427, 0.5],
      [0.445, 0.572],
      [0.429, 0.611],
      [0.408, 0.604],
      [0.421, 0.574],
      [0.39, 0.555],
      [0.375, 0.513],
    ]);
    this.ellipse("roots", 0.477, 0.343, 0.068, 0.032);
    this.polygon("tips", [
      [0.373, 0.472],
      [0.407, 0.452],
      [0.432, 0.499],
      [0.451, 0.571],
      [0.438, 0.618],
      [0.404, 0.618],
      [0.389, 0.557],
    ]);
    this.polygon("tips", [
      [0.551, 0.472],
      [0.577, 0.464],
      [0.571, 0.513],
      [0.604, 0.545],
      [0.574, 0.558],
      [0.55, 0.526],
    ]);
    this.ellipse("face", 0.497, 0.491, 0.064, 0.086);
    // Cover the full eyelid, not just the iris, when blending aligned artwork.
    this.ellipse("leftEye", 0.449, 0.465, 0.014, 0.015);
    this.ellipse("rightEye", 0.521, 0.4465, 0.022, 0.017);
    this.polygon("body", [
      [0.35, 0.625],
      [0.423, 0.594],
      [0.474, 0.623],
      [0.57, 0.59],
      [0.664, 0.65],
      [0.681, 0.85],
      [0.598, 1],
      [0.335, 1],
      [0.283, 0.81],
    ]);
    this.polygon("clothes", [
      [0.335, 0.637],
      [0.414, 0.602],
      [0.465, 0.64],
      [0.586, 0.605],
      [0.66, 0.658],
      [0.677, 0.849],
      [0.608, 0.869],
      [0.606, 0.97],
      [0.342, 0.975],
      [0.344, 0.84],
      [0.281, 0.834],
      [0.297, 0.724],
    ]);
    for (const name of maskNames) {
      const canvas = this.canvases[name],
        copy = document.createElement("canvas");
      copy.width = copy.height = this.size;
      copy.getContext("2d")!.drawImage(canvas, 0, 0);
      const c = canvas.getContext("2d")!;
      c.clearRect(0, 0, this.size, this.size);
      c.filter = "blur(2px)";
      c.drawImage(copy, 0, 0);
      c.filter = "none";
      this.changed(name);
    }
  }
  changed(name: MaskName) {
    this.textures[name].needsUpdate = true;
    this.revision++;
    if (name === "leftEye" || name === "rightEye") this.eyeRevision++;
  }
  eyeBounds(name: "leftEye" | "rightEye") {
    const c = this.canvases[name].getContext("2d")!,
      data = c.getImageData(0, 0, this.size, this.size).data;
    let minX = this.size,
      minY = this.size,
      maxX = -1,
      maxY = -1;
    for (let y = 0; y < this.size; y++)
      for (let x = 0; x < this.size; x++) {
        const i = (y * this.size + x) * 4;
        if ((data[i] * data[i + 3]) / 255 > 80) {
          minX = Math.min(minX, x);
          maxX = Math.max(maxX, x);
          minY = Math.min(minY, y);
          maxY = Math.max(maxY, y);
        }
      }
    if (maxX < 0) return [0, 0, 0.001, 0.001];
    return [
      (minX + maxX) / 2 / this.size,
      1 - (minY + maxY) / 2 / this.size,
      Math.max(0.001, (maxX - minX) / 2 / this.size),
      Math.max(0.001, (maxY - minY) / 2 / this.size),
    ];
  }
  paint(name: MaskName, x: number, y: number, radius: number, erase: boolean) {
    const c = this.canvases[name].getContext("2d")!;
    c.globalCompositeOperation = erase ? "destination-out" : "source-over";
    const g = c.createRadialGradient(x, y, 0, x, y, radius);
    g.addColorStop(0, "rgba(255,255,255,1)");
    g.addColorStop(0.65, "rgba(255,255,255,.9)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    c.fillStyle = g;
    c.beginPath();
    c.arc(x, y, radius, 0, Math.PI * 2);
    c.fill();
    c.globalCompositeOperation = "source-over";
    this.changed(name);
  }
  dispose() {
    for (const t of Object.values(this.textures)) t.dispose();
  }
}
