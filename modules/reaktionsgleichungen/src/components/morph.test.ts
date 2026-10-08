import { test, assert } from "vitest";
import { REACTIONS, balance, isMolecular, parseFormula } from "@lern/chem";
import { atomAt, morphPhase, morphScene } from "./morph.ts";

const close = (p: number[], q: number[]) => p.every((v, i) => Math.abs(v - q[i]) < 1e-9);

test("Übergang für alle Reaktionen mit Teilchenbild: jedes Atom genau einmal, Anfang = Edukte, Ende = Produkte", () => {
  let n = 0;
  for (const r of REACTIONS) {
    const eq = { left: r.left, right: r.right };
    if (![...eq.left, ...eq.right].every(isMolecular)) continue;
    const c = balance(eq)!;
    const s = morphScene(eq, c);
    // Atome erhalten: so viele je Element wie in der Gleichung (links = rechts)
    const want: Record<string, number> = {};
    eq.left.forEach((f, k) => { for (const [el, m] of Object.entries(parseFormula(f))) want[el] = (want[el] ?? 0) + m * c[k]; });
    const got: Record<string, number> = {};
    for (const a of s.atoms) got[a.el] = (got[a.el] ?? 0) + 1;
    assert.deepEqual(got, want, r.id);
    // Ziele verschieden (kein Platz doppelt besetzt)
    assert.equal(new Set(s.atoms.map(a => a.to.join())).size, s.atoms.length, r.id);
    for (const a of s.atoms) {
      assert.ok(close(atomAt(a, 0), a.from) && close(atomAt(a, 1), a.to), r.id);
      // alles bleibt im Bildfeld
      for (const t of [0, .2, .5, .8, 1]) { const p = atomAt(a, t); assert.ok(Math.abs(p[0]) < s.w && Math.abs(p[1]) < s.h, `${r.id} ${t}`); }
    }
    n++;
  }
  assert.ok(n >= 10, `nur ${n} Reaktionen`);
}, 30_000); // läuft alle Reaktionen durch – unter Last länger als die üblichen 5 s

test("Abschnitte der Animation", () => {
  assert.deepEqual([0, .1, .5, .9, 1].map(morphPhase), ["edukte", "lockern", "wandern", "binden", "produkte"]);
});

test("nicht ausgeglichene Gleichung wird abgelehnt", () => {
  assert.throws(() => morphScene({ left: ["H2", "O2"], right: ["H2O"] }, [1, 1, 1]));
});
