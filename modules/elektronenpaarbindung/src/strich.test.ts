import { test, assert } from "vitest";
import { KNOWN, type Molecule } from "@lern/chem";
import { loadKnown } from "./edit.ts";
import { strichLayout } from "./strich.ts";

const mol = (atoms: [string, number, number][], bonds: [number, number, number][]): Molecule =>
  ({ atoms: atoms.map(([el, x, y], i) => ({ id: i + 1, el, x, y })), bonds: bonds.map(([a, b, order]) => ({ a: a + 1, b: b + 1, order })) });
const angle = (l: ReturnType<typeof strichLayout>, c: number, a: number, b: number) => {
  const [cx, cy] = l.pos.get(c)!, [ax, ay] = l.pos.get(a)!, [bx, by] = l.pos.get(b)!;
  const u = Math.atan2(ay - cy, ax - cx), v = Math.atan2(by - cy, bx - cx);
  const d = Math.abs(u - v) * 180 / Math.PI;
  return d > 180 ? 360 - d : d;
};

test("Wasser: auch in einer Reihe gebaut gewinkelt (≈ 105°), H unten, freie Paare oben", () => {
  for (const m of [mol([["H", 0, 0], ["O", 1, 0], ["H", 2, 0]], [[0, 1, 1], [1, 2, 1]]), mol([["H", 1, 0], ["O", 1, 1], ["H", 1, 2]], [[0, 1, 1], [1, 2, 1]]), loadKnown("H2O")]) {
    const l = strichLayout(m);
    assert.approximately(angle(l, 2 - (m.atoms[0].el === "O" ? 1 : 0), ...(m.atoms[0].el === "O" ? [2, 3] : [1, 3]) as [number, number]), 105, .5);
    const o = m.atoms.find(a => a.el === "O")!.id;
    const lone = l.lone.get(o)!;
    assert.strictEqual(lone.length, 2);
    // freie Paare gegenüber den Bindungen: Abstand zu beiden H mindestens 100°
    for (const g of lone) for (const h of m.atoms.filter(a => a.el === "H")) {
      const [cx, cy] = l.pos.get(o)!, [hx, hy] = l.pos.get(h.id)!;
      let d = Math.abs(g.angle - Math.atan2(hy - cy, hx - cx) * 180 / Math.PI) % 360;
      if (d > 180) d = 360 - d;
      assert.ok(d > 80, `Paar zu nah an H (${d.toFixed(0)}°)`);
    }
  }
});

test("H₂O₂ als Zickzack, CO₂ und HCN bleiben gestreckt, CH₄ und NH₃ wie gebaut", () => {
  const h2o2 = strichLayout(loadKnown("H2O2"));
  const [h1, h4] = [h2o2.pos.get(1)!, h2o2.pos.get(4)!];
  assert.ok(Math.sign(h1[1] - h2o2.pos.get(2)![1]) === -Math.sign(h4[1] - h2o2.pos.get(3)![1]), "H auf verschiedenen Seiten");
  for (const id of ["CO2", "HCN", "CH4", "NH3"]) {
    const m = loadKnown(id), l = strichLayout(m);
    for (const a of m.atoms) assert.deepEqual(l.pos.get(a.id), [a.x, a.y], id);
  }
});

test("alle Beispiele: kein Atom liegt einem anderen zu nah, Bindungen gleich lang", () => {
  for (const k of KNOWN) {
    const m = loadKnown(k.id), l = strichLayout(m);
    const ps = [...l.pos.values()];
    for (let i = 0; i < ps.length; i++) for (let j = i + 1; j < ps.length; j++)
      assert.ok(Math.hypot(ps[i][0] - ps[j][0], ps[i][1] - ps[j][1]) > .75, k.id);
    for (const b of m.bonds) { const p = l.pos.get(b.a)!, q = l.pos.get(b.b)!; assert.approximately(Math.hypot(p[0] - q[0], p[1] - q[1]), 1, 1e-9, k.id); }
  }
});
