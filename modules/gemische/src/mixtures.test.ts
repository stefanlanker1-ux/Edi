import { test, assert } from "vitest";

import { MOL3D, SPECIES_NAMES, atoms3D, parseFormula } from "@lern/chem";
import { EXAMPLES as FULL, analyse, isElement, mixKind, pictureKind, small } from "./mixtures.ts";
import { initial, rng, separated, settled, shake, startMixing, step, type Grid, type Particle, type Sim } from "./mixing.ts";

// Probieren nutzt die Beispiele mit allen Teilchen (flow.test.ts); die Rasterbilder (Quiz, Erklärkarten) ein Zehntel davon
const EXAMPLES = FULL.map(e => ({ ...e, items: small(e.items) }));

test("zehn Beispiele: zweimal gleich viele Verbindungen wie Elemente, achtmal verschieden; Teilchenzahlen alle verschieden", () => {
  assert.strictEqual(FULL.length, 10);
  const a = FULL.map(e => analyse(e.items));
  assert.deepEqual(FULL.filter((_, i) => a[i].verbindungen.length === a[i].elemente.length).map(e => e.id), ["schutzgas", "modell"]);
  assert.strictEqual(new Set(a.map(x => x.teilchen)).size, 10);
  for (const x of a) assert.ok(x.teilchen >= 110 && x.teilchen <= 240, `${x.teilchen} Teilchen`);
  assert.ok(a.reduce((s, x) => s + x.teilchen, 0) / 10 >= 150);
  // kleine Fassung: gleiche Einteilung
  for (const e of FULL) assert.strictEqual(pictureKind(small(e.items)), pictureKind(e.items), e.id);
});

test("Elemente nur als einzelne Atome – keine Moleküle aus einer Atomsorte", () => {
  for (const e of EXAMPLES) for (const [f] of e.items) if (isElement(f)) assert.ok(!/\d/.test(f), `${e.id}: ${f}`);
});

test("Einteilung der Beispiele", () => {
  const k = (id: string) => mixKind(EXAMPLES.find(e => e.id === id)!);
  assert.strictEqual(k("wasser"), "verbindung");
  assert.strictEqual(k("helium"), "element");
  assert.strictEqual(k("oel"), "heterogen");
  assert.strictEqual(k("zucker"), "homogen");
  assert.strictEqual(k("messing"), "homogen");
  assert.strictEqual(k("schutzgas"), "homogen");
  const p = (id: string) => pictureKind(EXAMPLES.find(e => e.id === id)!.items);
  assert.deepEqual(["wasser", "helium", "messing", "zucker", "schutzgas"].map(p), ["V", "E", "GE", "GV", "GEV"]);
});

test("jeder Stoff hat Namen und Teilchenbild mit den richtigen Atomen", () => {
  for (const e of EXAMPLES) for (const [f] of e.items) {
    assert.ok(SPECIES_NAMES[f], `${f}: Name fehlt`);
    assert.ok(MOL3D[f] || isElement(f), `${f}: 3D-Daten fehlen`);
    const count: Record<string, number> = {};
    for (const [el] of atoms3D(f)) count[el] = (count[el] ?? 0) + 1;
    assert.deepEqual(count, parseFormula(f), f);
  }
});

const distinct = (ps: Particle[]) => new Set(ps.map(p => p.cell)).size === ps.length;
const inGrid = (ps: Particle[], g: Grid) => ps.every(p => p.cell >= 0 && p.cell < g.rows * g.cols);
/** Flüssigkeit ohne Lücken: unter jedem Teilchen der Flüssigkeit (außer ganz unten) sitzt ein Teilchen der Flüssigkeit */
const noHoles = (s: Sim) => {
  const at = new Map(s.ps.map(p => [p.cell, p]));
  return s.ps.every(p => p.gas || p.cell + s.grid.cols >= s.grid.rows * s.grid.cols || (at.has(p.cell + s.grid.cols) && !at.get(p.cell + s.grid.cols)!.gas));
};
const ok = (s: Sim) => distinct(s.ps) && inGrid(s.ps, s.grid) && (s.state !== "fluessig" || noHoles(s));
const counts = (s: Sim) => { const c: Record<string, number> = {}; for (const p of s.ps) c[p.f] = (c[p.f] ?? 0) + 1; return c; };

test("Anfangslage vorher und nachher, Schütteln: jede Zelle höchstens einmal, Flüssigkeit ohne Lücken", () => {
  for (const e of EXAMPLES) for (let s = 1; s < 40; s++) {
    for (const arr of ["nachher", "vorher", "gemischt", "unten"] as const) {
      const sim = initial(e, s, arr);
      assert.ok(ok(sim), `${e.id} ${arr}`);
      assert.deepEqual(counts(sim), Object.fromEntries(e.items), `${e.id} ${arr}`);
    }
    const sh = shake(initial(e, s), rng(s));
    assert.ok(ok(sh), `${e.id} geschüttelt`);
  }
});

test("vorher: Zucker als Kristall am Boden, Alkohol als Schicht oben, CO₂ über dem Wasser, Gase und Metalle getrennt", () => {
  const ex = (id: string) => EXAMPLES.find(e => e.id === id)!;
  const row = (s: Sim, p: Particle) => Math.floor(p.cell / s.grid.cols);
  for (let seed = 1; seed < 30; seed++) {
    const z = initial(ex("zucker"), seed, "vorher");
    const sugar = z.ps.filter(p => p.f === "C12H22O11");
    assert.ok(sugar.every(p => p.bound && row(z, p) >= z.grid.rows - 2), "Kristall unten");
    assert.deepEqual([...new Set(sugar.map(p => p.cell % z.grid.cols))].sort(), [1, 2, 3], "Kristall als Block in der Mitte");
    const a = initial(ex("alkohol"), seed, "vorher");
    const minWater = Math.min(...a.ps.filter(p => p.f === "H2O").map(p => row(a, p)));
    assert.ok(a.ps.filter(p => p.f === "C2H5OH").every(p => row(a, p) <= minWater), "Alkohol oben");
    const sp = initial(ex("sprudel"), seed, "vorher");
    assert.ok(sp.ps.filter(p => p.f === "CO2").every(p => p.gas && row(sp, p) < sp.grid.top), "CO₂ im Gasraum");
    const m = initial(ex("messing"), seed, "vorher");
    assert.deepEqual(m.walls, [3]);
    assert.ok(m.ps.every(p => (p.f === "Cu") === (p.cell % m.grid.cols < 3)), "Kupfer links, Zink rechts");
    const g = initial(ex("schutzgas"), seed, "vorher");
    assert.strictEqual(g.walls.length, 1);
    assert.ok(g.ps.every(p => (p.f === "Ar") === (p.cell % g.grid.cols < g.walls[0])), "Argon und CO₂ getrennt");
  }
});

/** Vorgang ablaufen lassen: vorher → Mischen → Schritte */
function run(id: string, seed: number, steps: number): Sim[] {
  const e = EXAMPLES.find(x => x.id === id)!;
  const r = rng(seed * 13);
  let s = startMixing(initial(e, seed, "vorher"), r);
  const out = [s];
  for (let k = 0; k < steps; k++) { s = step(s, r); out.push(s); }
  return out;
}

test("Mischen: Teilchen bleiben erhalten, nichts überlappt, der Vorgang kommt zur Ruhe", () => {
  for (const e of EXAMPLES.filter(x => x.before)) for (let seed = 1; seed <= 40; seed++) {
    const frames = run(e.id, seed, 120);
    for (const f of frames) {
      assert.ok(ok(f), `${e.id} (Startwert ${seed})`);
      assert.deepEqual(counts(f), Object.fromEntries(e.items));
    }
    const k = frames.findIndex(settled);
    assert.ok(k >= 0 && k < 100, `${e.id}: nach 100 Schritten nicht fertig (Startwert ${seed})`);
  }
});

test("Lösungen und Gasgemische sind danach gleichmäßig gemischt", () => {
  for (const id of ["zucker", "alkohol", "sprudel", "schutzgas", "erdgas", "modell"]) {
    const e = EXAMPLES.find(x => x.id === id)!;
    let spread = 0;
    for (let seed = 1; seed <= 40; seed++) {
      const [start] = run(id, seed, 0), s = run(id, seed, 60).at(-1)!;
      if (s.state === "fluessig") {
        // gelöster Stoff sowohl in der oberen als auch in der unteren Hälfte der Flüssigkeit
        const rows = s.ps.filter(p => p.f === e.solute).map(p => Math.floor(p.cell / s.grid.cols));
        const mid = (s.grid.top + s.grid.rows) / 2;
        if (rows.some(x => x < mid) && rows.some(x => x >= mid)) spread++;
      } else {
        // jeder Stoff hat seinen Bereich verlassen (Trennwände vom Anfang)
        const walls = initial(e, seed, "vorher").walls, band = (c: number) => walls.filter(w => c % s.grid.cols >= w).length;
        const home = Object.fromEntries(start.ps.map(p => [p.f, band(p.cell)]));
        if (e.items.every(([f]) => s.ps.some(p => p.f === f && band(p.cell) !== home[f]))) spread++;
      }
    }
    assert.ok(spread >= 30, `${id}: nur ${spread} von 40 verteilt`);
  }
});

test("Messing: geschmolzen gemischt, danach wieder ein Gitter", () => {
  let mixed = 0;
  for (let seed = 1; seed <= 40; seed++) {
    const s = run("messing", seed, 30).at(-1)!;
    assert.ok(s.ps.every(p => p.bound && p.jx === 0 && p.jy === 0) && !s.walls.length);
    if (s.ps.some(p => p.f === "Zn" && p.cell % s.grid.cols < 3)) mixed++;
  }
  assert.ok(mixed >= 35, `nur ${mixed} gemischt`);
});

test("Öl und Wasser: am Anfang entmischt, nach dem Schütteln entmischt es sich wieder (Öl steigt auf)", () => {
  const e = EXAMPLES.find(x => x.id === "oel")!;
  let steps = 0;
  for (let s = 1; s <= 200; s++) {
    const sim = initial(e, s);
    assert.ok(separated(sim.ps, sim.grid, e.floats!), "Anfang");
    const r = rng(s * 7);
    let p = shake(sim, r);
    let k = 0;
    while (!separated(p.ps, p.grid, e.floats!) && k < 80) { p = step(p, r); k++; assert.ok(ok(p)); }
    assert.ok(separated(p.ps, p.grid, e.floats!), `nach 80 Schritten noch gemischt (Startwert ${s})`);
    // bleibt entmischt, auch wenn sich die Teilchen weiter bewegen
    for (let j = 0; j < 20; j++) { p = step(p, r); assert.ok(separated(p.ps, p.grid, e.floats!), "wieder gemischt"); }
    steps += k;
  }
  assert.ok(steps / 200 > 2, "entmischt sich zu schnell (soll sichtbar aufsteigen)");
});

test("Gas: Teilchen springen in freie Zellen, nie zwei in einer, nie durch eine Trennwand", () => {
  const e = EXAMPLES.find(x => x.id === "schutzgas")!;
  let s = initial(e, 3, "vorher");
  const r = rng(9);
  for (let k = 0; k < 50; k++) {
    s = step(s, r);
    assert.ok(distinct(s.ps));
    assert.ok(s.ps.every(p => (p.f === "Ar") === (p.cell % s.grid.cols < s.walls[0])), "durch die Wand");
  }
});
