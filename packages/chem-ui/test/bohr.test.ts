// Bohrmodell: der Schalenbuchstabe (K, L, …) verdeckt kein Elektron; jede Schale hat immer denselben Radius, der Rahmen ändert sich beim Bauen nicht
import { test, assert } from "vitest";
import { standardNeutrons } from "@lern/chem";
import { bohrExtent, bohrLayout, electronRadius, labelAngle, shellRadius } from "../src/Bohr.tsx";

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

test("Radius der n-ten Schale hängt nicht von Protonen, Neutronen und Elektronen ab", () => {
  for (let n = 1; n < 7; n++) assert.ok(shellRadius(n + 1) > shellRadius(n));
  const cases: [number, number, number][] = [[0, 0, 3], [1, 0, 1], [1, 0, 2], [6, 6, 6], [8, 8, 8], [8, 8, 10], [9, 10, 10], [11, 12, 11], [11, 12, 10],
    [17, 18, 17], [17, 18, 18], [20, 30, 23], [26, 30, 23], [29, 34, 28], [53, 74, 54], [82, 126, 80], [86, 136, 86], [86, 136, 89]];
  for (const [Z, N, E] of cases) for (const ghost of [false, true]) for (const slots of [2, 4, 7]) {
    const L = bohrLayout(Z, N, E, { ghost, slots });
    L.rings.forEach((r, i) => assert.strictEqual(r, shellRadius(i + 1), `Z=${Z} N=${N} E=${E} Schale ${i + 1}`));
  }
  // dieselbe Schale bei verschiedenen Teilchenzahlen: gleicher Radius (z. B. L bei O, O²⁻, F⁻, Na⁺)
  const L2 = [[8, 8, 8], [8, 8, 10], [9, 10, 10], [11, 12, 10], [12, 12, 10]].map(([Z, N, E]) => bohrLayout(Z, N, E).rings[1]);
  assert.ok(L2.every(r => r === L2[0]));
});

test("Fester Maßstab: Elektronen dazu oder weg ändern den Rahmen nicht, eine neue Schale kommt außen dazu", () => {
  for (const [Z, slots, maxE] of [[20, 4, 23], [86, 7, 89], [17, 3, 18]]) {
    let prev = 0;
    for (let E = 0; E <= maxE; E++) {
      const L = bohrLayout(Z, standardNeutrons(Z), E, { ghost: true, slots });
      assert.strictEqual(L.X, bohrExtent(slots), `Z=${Z} E=${E}`);
      assert.ok(L.perShell.length >= prev && L.S <= slots, `Z=${Z} E=${E}`);
      prev = L.perShell.length;
    }
  }
  // Elektronen gleich groß, egal wie viele Schalen das Atom hat (nur eine sehr volle Schale hätte kleinere)
  for (let n = 1; n <= 7; n++) for (let c = 1; c <= Math.min(2 * n * n, 32); c++) assert.strictEqual(electronRadius(n, c), 4.8, `Schale ${n}, ${c} e⁻`);
});

test("Kern verschiebt keine Schale: die K-Schale samt Elektronen liegt außerhalb auch des größten Kerns", () => {
  const inner = shellRadius(1) - electronRadius(1, 2);
  for (let Z = 1; Z <= 86; Z++) for (let N = 0; N <= 140; N++) {
    const L = bohrLayout(Z, N, Z);
    const r = L.nuc ? Math.max(...L.nuc.pos.map(p => Math.hypot(p.x, p.y))) + L.nuc.pr : L.rNuc;
    assert.ok(r < inner - 2, `Z=${Z} N=${N}: Kern ${r.toFixed(1)}, K-Schale innen ${inner}`);
  }
});
