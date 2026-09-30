import { test, assert } from "vitest";
import { MOL3D, SPECIES_NAMES, atoms3D, parseFormula } from "@lern/chem";
import { EXAMPLES, analyse, mixKind } from "./mixtures.ts";
import { initial, rng, separated, shake, step, type Grid, type Particle } from "./mixing.ts";

test("zehn Beispiele: zweimal gleich viele Verbindungen wie Elemente, achtmal verschieden; Teilchenzahlen alle verschieden", () => {
  assert.strictEqual(EXAMPLES.length, 10);
  const a = EXAMPLES.map(e => analyse(e.items));
  assert.strictEqual(a.filter(x => x.verbindungen.length === x.elemente.length).length, 2);
  assert.strictEqual(new Set(a.map(x => x.teilchen)).size, 10);
  for (const x of a) assert.ok(x.teilchen >= 6 && x.teilchen <= 15, `${x.teilchen} Teilchen`);
});

test("Modellgemisch: 11 Teilchen, Ozon ist ein Element", () => {
  const a = analyse(EXAMPLES[0].items);
  assert.strictEqual(a.teilchen, 11);
  assert.deepEqual(a.verbindungen, ["H2O", "H2O2"]);
  assert.deepEqual(a.elemente, ["O3", "C"]);
  assert.deepEqual(a.atomsorten, ["H", "O", "C"]);
});

test("Einteilung der Beispiele", () => {
  const k = (id: string) => mixKind(EXAMPLES.find(e => e.id === id)!);
  assert.strictEqual(k("wasser"), "verbindung");
  assert.strictEqual(k("helium"), "element");
  assert.strictEqual(k("oel"), "heterogen");
  assert.strictEqual(k("zucker"), "homogen");
  assert.strictEqual(k("luft"), "homogen");
});

test("jeder Stoff hat Namen und Teilchenbild mit den richtigen Atomen", () => {
  for (const e of EXAMPLES) for (const [f] of e.items) {
    assert.ok(SPECIES_NAMES[f], `${f}: Name fehlt`);
    assert.ok(MOL3D[f] || Object.keys(parseFormula(f)).length === 1, `${f}: 3D-Daten fehlen`);
    const count: Record<string, number> = {};
    for (const [el] of atoms3D(f)) count[el] = (count[el] ?? 0) + 1;
    assert.deepEqual(count, parseFormula(f), f);
  }
});

const distinct = (ps: Particle[]) => new Set(ps.map(p => p.cell)).size === ps.length;
/** Flüssigkeit ohne Lücken: unter jedem Teilchen (außer ganz unten) sitzt ein Teilchen */
const noHoles = (ps: Particle[], g: Grid) => {
  const at = new Set(ps.map(p => p.cell));
  return ps.every(p => p.cell + g.cols >= g.rows * g.cols || at.has(p.cell + g.cols));
};

test("Anfangslage und Schütteln: jede Zelle höchstens einmal, Flüssigkeit unten ohne Lücken", () => {
  for (const e of EXAMPLES) for (let s = 1; s < 40; s++) {
    const { grid, ps } = initial(e.items, e.state, e.floats, s);
    assert.ok(distinct(ps) && ps.every(p => p.cell >= grid.top * grid.cols && p.cell < grid.rows * grid.cols), e.id);
    if (e.state === "fluessig") assert.ok(noHoles(ps, grid), e.id);
    const sh = shake(ps, grid, rng(s));
    assert.ok(distinct(sh), e.id);
    if (e.state === "fluessig") assert.ok(noHoles(sh, grid), `${e.id} geschüttelt`);
  }
});

test("Öl und Wasser: am Anfang entmischt, nach dem Schütteln entmischt es sich wieder (Öl steigt auf)", () => {
  const e = EXAMPLES.find(x => x.id === "oel")!;
  let steps = 0;
  for (let s = 1; s <= 200; s++) {
    const { grid, ps } = initial(e.items, e.state, e.floats, s);
    assert.ok(separated(ps, grid, e.floats!), "Anfang");
    const r = rng(s * 7);
    let p = shake(ps, grid, r);
    let k = 0;
    while (!separated(p, grid, e.floats!) && k < 80) { p = step(p, grid, e.floats!, r); k++; assert.ok(distinct(p) && noHoles(p, grid)); }
    assert.ok(separated(p, grid, e.floats!), `nach 80 Schritten noch gemischt (Startwert ${s})`);
    steps += k;
  }
  assert.ok(steps / 200 > 2, "entmischt sich zu schnell (soll sichtbar aufsteigen)");
});

test("Gas: Teilchen springen in freie Zellen, nie zwei in einer", () => {
  const e = EXAMPLES.find(x => x.id === "luft")!;
  const { grid, ps } = initial(e.items, e.state, [], 3);
  let p = ps;
  const r = rng(9);
  for (let k = 0; k < 50; k++) { p = step(p, grid, [], r); assert.ok(distinct(p)); }
});
