import { test, assert } from "vitest";
import { EXAMPLES, analyse } from "./mixtures.ts";
import { STIR, boundaryY, liquidLevel, makeWorld, oilOnTop, separatedFlow, settledFlow, shakeWorld, startMixing, stepFlow, type World } from "./flow.ts";

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

/** Hauptknopf so oft drücken, bis alles gelöst ist (Umrühren bzw. Schütteln) */
function mixUntilDone(w: World, id: string) {
  let k = 0;
  while (!settledFlow(w) && k < 3000) {
    if (w.stir === 0 && w.shake === 0 && k % 240 === 0) { if (id === "sprudel") shakeWorld(w); else w.stir = STIR; }
    stepFlow(w); k++;
  }
  return k;
}

test("Mischen: Zucker, Alkohol und CO₂ verteilen sich gleichmäßig; der Vorgang kommt zur Ruhe", () => {
  for (const id of ["zucker", "alkohol", "sprudel"]) for (let seed = 1; seed <= 5; seed++) {
    const e = ex(id), w = makeWorld(e, seed, "vorher");
    mixUntilDone(w, id);
    assert.ok(settledFlow(w), `${id}: nicht fertig (Startwert ${seed})`);
    w.stir = STIR;
    for (let j = 0; j < 400; j++) stepFlow(w);
    const hl = liquidLevel(w);
    const d = mean(w.ps.filter(p => p.f !== e.solute).map(p => p.y)) - mean(w.ps.filter(p => p.f === e.solute).map(p => p.y));
    assert.ok(Math.abs(d) < hl * .12, `${id}: nicht gemischt (${(d / hl).toFixed(2)})`);
  }
}, 120_000);

/** Zeitschritte, bis sich der Zuckerkristall ganz gelöst hat */
function dissolve(temp: number, stir: boolean, seed: number) {
  const w = makeWorld(ex("zucker"), seed, "vorher");
  w.temp = temp;
  let k = 0, loose = 0;
  while (w.ps.some(p => p.bound) && k < 20000) {
    if (stir && w.stir === 0) w.stir = STIR;
    stepFlow(w); k++;
    // von außen nach innen: Kristallteilchen ohne Nachbarn im Kristall gibt es höchstens vereinzelt
    const b = w.ps.filter(p => p.bound), at = new Set(b.map(p => `${p.gi},${p.gj}`));
    loose = Math.max(loose, b.filter(p => ![[1, 0], [-1, 0], [0, 1], [0, -1]].some(([a, c]) => at.has(`${p.gi! + a},${p.gj! + c}`))).length);
  }
  return { k, loose };
}

test("Zucker: geordneter Kristall, löst sich von selbst von außen; warm und gerührt schneller", () => {
  const w = makeWorld(ex("zucker"), 1, "vorher");
  const crystal = w.ps.filter(p => p.bound);
  assert.strictEqual(crystal.length, 30);
  assert.ok(crystal.every(p => p.a === 0), "alle gleich ausgerichtet");
  assert.strictEqual(new Set(crystal.map(p => p.gj)).size * new Set(crystal.map(p => p.gi)).size >= 30, true, "Gitter");
  // ohne Rühren: löst sich von selbst, aber langsam (etwa eine halbe Minute)
  const slow = [1, 2, 3].map(s => dissolve(20, false, s));
  for (const r of slow) { assert.ok(r.k < 20000, "löst sich nicht"); assert.ok(r.k > 600, `zu schnell (${r.k})`); assert.ok(r.loose <= 3, `zerfällt nicht von außen (${r.loose})`); }
  const avg = (rs: { k: number }[]) => rs.reduce((s, r) => s + r.k, 0) / rs.length;
  const warm = avg([1, 2, 3].map(s => dissolve(80, false, s))), stirred = avg([1, 2, 3].map(s => dissolve(20, true, s)));
  assert.ok(warm < avg(slow) * .5, `warm nicht schneller (${warm} / ${avg(slow)})`);
  assert.ok(stirred < avg(slow) * .5, `gerührt nicht schneller (${stirred} / ${avg(slow)})`);
  const cold = avg([1, 2].map(s => dissolve(0, false, s)));
  assert.ok(cold > avg(slow) * 1.5, "kalt nicht langsamer");
}, 240_000);

test("Sprudel: CO₂ löst sich von selbst langsam, geschüttelt schnell", () => {
  const gas = (w: World) => w.ps.filter(p => p.gas).length;
  const a = makeWorld(ex("sprudel"), 1, "vorher"), b = makeWorld(ex("sprudel"), 1, "vorher");
  for (let k = 0; k < 600; k++) stepFlow(a);
  shakeWorld(b);
  for (let k = 0; k < 600; k++) stepFlow(b);
  assert.ok(gas(a) < 40 && gas(a) > 20, `von selbst: ${gas(a)} Gas`);
  assert.ok(gas(b) < gas(a) / 2, `geschüttelt: ${gas(b)} Gas`);
});

test("Umrühren: die Flüssigkeit bleibt überall etwa gleich dicht (kein Stau an Wand oder Kristall)", () => {
  for (const [id, phase] of [["wasser", "nachher"], ["alkohol", "vorher"], ["zucker", "vorher"]] as const) {
    const w = makeWorld(ex(id), 2, phase);
    const worst: number[] = [];
    for (let k = 1; k <= 480; k++) {
      if (w.stir === 0) w.stir = STIR;
      stepFlow(w);
      if (k < 120 || k % 30) continue;
      // Belegung in 4 × 3 Feldern oberhalb des Kristalls
      const floor = Math.min(w.H, ...w.ps.filter(p => p.bound).map(p => p.y - (p.rad ?? w.rc)));
      const cells = Array(12).fill(0);
      for (const p of w.ps) {
        if (p.gas || p.bound || p.y > floor) continue;
        const i = Math.min(3, Math.floor(p.x / w.W * 4)), j = Math.min(2, Math.floor((p.y - w.top) / (floor - w.top) * 3));
        cells[j * 4 + i] += (p.rad ?? w.rc) ** 2;
      }
      const m = mean(cells);
      worst.push(Math.max(...cells.map(c => Math.abs(c / m - 1))));
    }
    // je Feld nur etwa 15 Teilchen (Zucker zählt 3-fach): einzelne Ausreißer sind Zufall – im Mittel klein, nie ein Stau (doppelt so dicht)
    assert.ok(mean(worst) < .5, `${id}: im Mittel ungleich dicht (${mean(worst).toFixed(2)})`);
    assert.ok(Math.max(...worst) < .95, `${id}: Stau (${Math.max(...worst).toFixed(2)})`);
  }
}, 120_000);

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
