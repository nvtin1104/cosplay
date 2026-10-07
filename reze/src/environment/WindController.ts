import type { Settings } from "../settings";
export class WindController {
  strength = 0;
  direction = 0;
  gust = 0;
  turbulence = 0;
  update(time: number, dt: number, s: Settings) {
    const slow =
      Math.sin(time * 0.23) * 0.24 + Math.sin(time * 0.61 + 1.7) * 0.13;
    this.gust =
      Math.pow(0.5 + 0.5 * Math.sin(time * 0.17 + Math.sin(time * 0.081)), 5) *
      s.gustStrength;
    const blend = 1 - Math.exp(-dt * 1.8);
    this.strength +=
      (s.windStrength * (1 + slow + this.gust) - this.strength) * blend;
    this.direction += (s.windDirection - this.direction) * blend;
    this.turbulence = s.turbulence;
  }
}
