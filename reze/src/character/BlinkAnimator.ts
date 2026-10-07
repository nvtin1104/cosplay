function smooth(x: number) {
  return x * x * (3 - 2 * x);
}
export class BlinkAnimator {
  amount = 0;
  private next: number;
  private start = -1;
  private duration = 0.15;
  private double = false;
  constructor(private random = Math.random) {
    this.next = 2 + this.random() * 4;
  }
  trigger(time: number) {
    this.start = time;
    this.duration = 0.1 + this.random() * 0.08;
  }
  update(time: number, enabled: boolean, frequency: number) {
    if (!enabled) {
      this.amount = 0;
      this.start = -1;
      this.next = time + 2;
      return;
    }
    if (this.start < 0 && time >= this.next) this.trigger(time);
    if (this.start >= 0) {
      const p = (time - this.start) / this.duration;
      // Close briskly, hold fully shut briefly, then reopen more slowly.
      this.amount =
        p < 0.38
          ? smooth(Math.max(0, p) / 0.38)
          : p < 0.52
            ? 1
            : 1 - smooth(Math.min(1, (p - 0.52) / 0.48));
      if (p >= 1) {
        this.amount = 0;
        this.start = -1;
        const again = !this.double && this.random() < 0.13;
        this.double = again;
        this.next =
          time +
          (again ? 0.13 : (2 + this.random() * 4) / Math.max(0.2, frequency));
      }
    }
  }
}
