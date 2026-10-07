export class CameraController {
  x = 0;
  y = 0;
  targetX = 0;
  targetY = 0;
  onPointer = (e: PointerEvent) => {
    this.targetX = (e.clientX / innerWidth) * 2 - 1;
    this.targetY = 1 - (e.clientY / innerHeight) * 2;
  };
  reset = () => {
    this.targetX = this.targetY = 0;
  };
  constructor() {
    window.addEventListener("pointermove", this.onPointer);
    document.addEventListener("pointerleave", this.reset);
  }
  update(dt: number) {
    const a = 1 - Math.exp(-dt * 3);
    this.x += (this.targetX - this.x) * a;
    this.y += (this.targetY - this.y) * a;
  }
  dispose() {
    window.removeEventListener("pointermove", this.onPointer);
    document.removeEventListener("pointerleave", this.reset);
  }
}
