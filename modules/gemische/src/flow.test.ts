import { test, assert } from "vitest";
import { EXAMPLES, analyse } from "./mixtures.ts";
import { boundaryY, liquidHeight, makeWorld, oilOnTop, separatedFlow, settledFlow, shakeWorld, startMixing, stepFlow, type World } from "./flow.ts";

const ex = (id: string) => EXAMPLES.find(e => e.id === id)!;
const counts = (w: World) => { const c: Record<string, number> = {}; for (const p of w.ps) c[p.f] = (c[p.f] ?? 0) + 1; return c; };
const inside = (w: World) => w.ps.every(p => Number.isFinite(p.x) && Number.isFinite(p.y) && p.x >= 0 && p.x <= w.W && p.y >= 0 && p.y <= w.H);
const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
test("alle Beispiele: gleiche Teilchen vorher und nachher, alle im Gefäß, nichts überlappt stark", () => {
  for (const e of EXAMPLES) for (const phase of ["nachher", "vorher"] as const) {
    const w = makeWorld(e, 5, phase);
    assert.strictEqual(w.ps.length, analyse(e.items).teilchen, e.id);
    assert.deepEqual(counts(w), Object.fromEntries(e.items), `${e.id} ${phase}`);
    if (e.before) startMixing(w); else shakeWorld(w);
    for (let k = 0; k < 600; k++) stepFlow(w);
    assert.ok(inside(w), `${e.id} ${phase}: Teilchen außerhalb`);
    assert.deepEqual(counts(w), Object.fromEntries(e.items), `${e.id}: Teilchen verloren`);
    // im Mittel kaum Überlappung
    let close = 0;
    for (const p of w.ps) for (const q of w.ps) if (p.id < q.id && !p.gas && !q.gas && Math.hypot(p.x - q.x, p.y - q.y) < w.rc) close++;
    assert.ok(close < w.ps.length * .05, `${e.id}: ${close} Teilchen übereinander`);
  }
}, 60_000);

test("Bewegung ist fließend: kleine Schritte je Bild, keine Sprünge", () => {
  for (const e of EXAMPLES) {
    const w = makeWorld(e, 2);
    for (let k = 0; k < 300; k++) {
      const before = w.ps.map(p => [p.x, p.y]);
      stepFlow(w);
      const jump = Math.max(...w.ps.map((p, i) => Math.hypot(p.x - before[i][0], p.y - before[i][1])));
      assert.ok(jump < w.rc * 1.2, `${e.id}: Sprung ${jump.toFixed(2)}`);
    }
  }
}, 60_000);

test("Mischen: Zucker, Alkohol und CO₂ verteilen sich gleichmäßig; der Vorgang kommt zur Ruhe", () => {
  for (const id of ["zucker", "alkohol", "sprudel"]) for (let seed = 1; seed <= 5; seed++) {
    const e = ex(id), w = makeWorld(e, seed, "vorher");
    startMixing(w);
    let k = 0;
    while (!settledFlow(w) && k < 2400) { stepFlow(w); k++; }
    assert.ok(settledFlow(w), `${id}: nicht fertig (Startwert ${seed})`);
    for (let j = 0; j < 300; j++) stepFlow(w);
    const hl = liquidHeight(w.ps.length, w.W);
    const d = mean(w.ps.filter(p => p.f !== e.solute).map(p => p.y)) - mean(w.ps.filter(p => p.f === e.solute).map(p => p.y));
    assert.ok(Math.abs(d) < hl * .12, `${id}: nicht gemischt (${(d / hl).toFixed(2)})`);
  }
}, 60_000);

test("Öl und Wasser: nach dem Schütteln gemischt, danach wieder getrennt (Öl oben, Grenze gerade)", () => {
  for (let seed = 1; seed <= 5; seed++) {
    const w = makeWorld(ex("oel"), seed);
    assert.ok(separatedFlow(w), "Anfang getrennt");
    shakeWorld(w);
    for (let k = 0; k < 50; k++) stepFlow(w);
    assert.ok(oilOnTop(w) < .9, `nach dem Schütteln noch getrennt (${oilOnTop(w).toFixed(2)})`);
    let k = 0;
    while (!separatedFlow(w) && k < 1800) { stepFlow(w); k++; }
    assert.ok(separatedFlow(w), `entmischt sich nicht (Startwert ${seed})`);
    assert.ok(k > 60, "entmischt sich zu schnell (soll sichtbar aufsteigen)");
    const y = boundaryY(w);
    assert.ok(y > w.top && y < w.H);
  }
}, 60_000);

test("Gase: Trennwände halten die Teilchen zurück; ohne Wände mischen sie sich", () => {
  for (const id of ["schutzgas", "erdgas", "modell"]) {
    const e = ex(id), w = makeWorld(e, 3, "vorher");
    const side = (x: number) => w.walls.filter(v => x > v).length;
    const home = new Map(w.ps.map(p => [p.id, side(p.x)]));
    for (let k = 0; k < 300; k++) stepFlow(w);
    assert.ok(w.ps.every(p => side(p.x) === home.get(p.id)), `${id}: durch die Trennwand`);
    const walls = w.walls.slice();
    startMixing(w);
    for (let k = 0; k < 1500; k++) stepFlow(w);
    const moved = w.ps.filter(p => walls.filter(v => p.x > v).length !== home.get(p.id)).length;
    // gleichmäßig verteilt wären so viele im Bereich eines anderen Stoffs
    const n = w.ps.length, expected = e.items.reduce((s, [, k]) => s + k * (1 - k / n), 0);
    assert.ok(moved > expected * .7, `${id}: nur ${moved} von ${expected.toFixed(0)} Teilchen gewandert`);
  }
}, 60_000);

test("Messing: vorher zwei Blöcke, geschmolzen gemischt, danach wieder ein Gitter", () => {
  const w = makeWorld(ex("messing"), 4, "vorher");
  const split = w.walls[0];
  assert.ok(split > 0);
  startMixing(w);
  let k = 0;
  while (!settledFlow(w) && k < 1000) { stepFlow(w); k++; }
  assert.ok(settledFlow(w) && w.ps.every(p => p.bound));
  const homes = new Set(w.ps.map(p => `${p.hx},${p.hy}`));
  assert.strictEqual(homes.size, w.ps.length, "zwei Atome auf einem Platz");
  for (let j = 0; j < 200; j++) stepFlow(w);
  assert.ok(w.ps.every(p => Math.hypot(p.x - p.hx!, p.y - p.hy!) < w.rc * .6), "nicht am Gitterplatz");
  // Zink nicht mehr nur rechts
  const xs = w.ps.filter(p => p.f === "Zn").map(p => p.x);
  assert.ok(Math.min(...xs) < w.W / 3, "nicht gemischt");
}, 60_000);

test("Temperatur: je wärmer, desto schneller bewegen sich die Teilchen", () => {
  const dist = (id: string, temp: number) => {
    const w = makeWorld(ex(id), 7);
    w.temp = temp;
    for (let k = 0; k < 120; k++) stepFlow(w);
    const start = w.ps.map(p => [p.x, p.y]);
    for (let k = 0; k < 300; k++) stepFlow(w);
    return w.ps.reduce((s, p, i) => s + Math.hypot(p.x - start[i][0], p.y - start[i][1]), 0) / w.ps.length;
  };
  for (const id of ["wasser", "helium"]) assert.ok(dist(id, 100) > dist(id, 0) * 1.1, id);
}, 60_000);
