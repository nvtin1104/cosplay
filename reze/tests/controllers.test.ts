import { test } from "node:test";
import assert from "node:assert/strict";
import { WindController } from "../src/environment/WindController";
import { BlinkAnimator } from "../src/character/BlinkAnimator";
import { defaults } from "../src/settings";
test("wind smoothly approaches changed direction and remains finite through a long session", () => {
  const wind = new WindController();
  const s = { ...defaults };
  let previous = 0;
  for (let i = 0; i < 36000; i++) {
    if (i === 500) s.windDirection = -1;
    wind.update(i / 60, 1 / 60, s);
    assert.ok(Number.isFinite(wind.strength));
    assert.ok(Math.abs(wind.direction - previous) < 0.06);
    previous = wind.direction;
    assert.ok(wind.strength >= 0 && wind.strength < 2);
  }
  assert.ok(Math.abs(wind.direction + 1) < 0.001);
});
test("manual blink closes and opens within the specified 100–180ms window", () => {
  const blink = new BlinkAnimator(() => 0.5);
  blink.trigger(1);
  blink.update(1.075, true, 1);
  assert.ok(blink.amount > 0.8);
  blink.update(1.19, true, 1);
  assert.equal(blink.amount, 0);
});
test("disabling blinking clears a half-completed blink", () => {
  const blink = new BlinkAnimator(() => 0.5);
  blink.trigger(0);
  blink.update(0.07, true, 1);
  assert.ok(blink.amount > 0.8);
  blink.update(0.08, false, 1);
  assert.equal(blink.amount, 0);
});
test("random blinking stays bounded over ten minutes", () => {
  const blink = new BlinkAnimator();
  let last = 0,
    events = 0;
  for (let i = 0; i < 60000; i++) {
    blink.update(i / 100, true, 1);
    assert.ok(blink.amount >= 0 && blink.amount <= 1);
    if (last === 0 && blink.amount > 0) events++;
    last = blink.amount;
  }
  assert.ok(events > 75 && events < 350);
});
