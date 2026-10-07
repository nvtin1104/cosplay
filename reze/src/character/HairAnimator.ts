import type { WindController } from "../environment/WindController";
import type { Settings } from "../settings";
export class HairAnimator {
  value = 0;
  update(dt: number, wind: WindController, s: Settings) {
    this.value +=
      (wind.strength * wind.direction * s.hairAmplitude - this.value) *
      (1 - Math.exp(-dt * 2));
    return this.value;
  }
}
