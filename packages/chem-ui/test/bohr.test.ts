// Bohrmodell: der Schalenbuchstabe (K, L, …) verdeckt kein Elektron
import { test, assert } from "vitest";
import { labelAngle } from "../src/Bohr.tsx";

test("Schalenbuchstabe unten rechts, sitzt dort ein Elektron (8, 16 …), mitten in der Lücke daneben", () => {
  const gapTo = (a: number, n: number) => {
    let best = Infinity;
    for (let k = 0; k < n; k++) {
      const e = -Math.PI / 2 + (2 * Math.PI * k) / n;
      const d = Math.abs(((a - e) % (2 * Math.PI) + 3 * Math.PI) % (2 * Math.PI) - Math.PI);
      best = Math.min(best, d);
    }
    return best;
  };
  // ohne Elektronen und mit 2 Elektronen (oben, unten): 45°
  assert.strictEqual(labelAngle(40, 0), Math.PI / 4);
  assert.strictEqual(labelAngle(30, 2), Math.PI / 4);
  // 8 Elektronen: eines liegt genau bei 45° → Buchstabe in der Lücke (67,5°)
  assert.ok(Math.abs(labelAngle(48, 8) - (3 * Math.PI) / 8) < 1e-9);
  for (const n of [1, 2, 3, 5, 8, 11, 16, 18, 24, 32]) for (const r of [30, 45, 60, 75, 90]) {
    const a = labelAngle(r, n), er = Math.min(4.8, ((2 * Math.PI * r) / n) * 0.36);
    const half = Math.PI / n;
    // entweder genug Platz bei 45° oder genau in der Mitte einer Lücke (größter möglicher Abstand)
    assert.ok(gapTo(a, n) * r >= er + 5 - 1e-9 || Math.abs(gapTo(a, n) - half) < 1e-9, `n=${n} r=${r}`);
  }
});
