// Teilchensimulation von Kapitel 3: fest schwingen die Ionen nur um ihre Plätze, geschmolzen verlassen sie die Plätze und bewegen sich
// weiter (ohne Überlappung, im Gefäß, Gegen-Ionen nah), abgekühlt kehren sie ins Gitter zurück; im Strom wandern Kationen zum Minuspol.
import { test, expect } from "vitest";
import { advance, grid, makeWorld, warm, type Drive, type World } from "./sim.ts";

const gapMin = (w: World) => {
  let g = Infinity;
  const L = w.box[2] - w.box[0];
  for (let i = 0; i < w.b.length; i++) for (let j = i + 1; j < w.b.length; j++) {
    let dx = w.b[j].x - w.b[i].x, dy = w.b[j].y - w.b[i].y;
    if (w.periodic) { dx -= L * Math.round(dx / L); dy -= L * Math.round(dy / L); }
    g = Math.min(g, Math.hypot(dx, dy) - w.b[i].r - w.b[j].r);
  }
  return g;
};
const oppositeNearest = (w: World) => w.b.filter(p => {
  let best = Infinity, q = 0;
  for (const o of w.b) if (o !== p) { const d = Math.hypot(o.x - p.x, o.y - p.y); if (d < best) { best = d; q = o.q; } }
  return q * p.q < 0;
}).length / w.b.length;

// Tiegel wie ThermoLattice: 5 × 4 Ionen, u = 60, Na⁺ und Cl⁻
const u = 60, cols = 5, rows = 4;
const x0 = 16, x1 = x0 + (cols + 0.6) * u, y1 = 16 + (rows + 0.65) * u, y0 = y1 - (rows + 0.45) * u;
const sites = grid(cols, rows, u, x0 + 0.8 * u, y1 - 0.55 * u - (rows - 1) * u);
const vessel = () => makeWorld(sites, q => (q > 0 ? 26 * 102 / 181 : 26), u, [x0, y0, x1, y1], false, 3);
const at = (t: number): Drive => ({ free: t >= 801, heat: (t + 273) / 1074, amp: 1 + 6 * Math.min(t, 801) / 801, gravity: true });

test("fest: jedes Ion schwingt nur um seinen Platz, stärker bei höherer Temperatur", () => {
  for (const t of [20, 400, 790]) {
    const w = vessel();
    let far = 0;
    for (let f = 0; f < 180; f++) { advance(w, at(t), 1 / 60); for (const p of w.b) far = Math.max(far, Math.hypot(p.x - p.hx, p.y - p.hy)); }
    expect(far).toBeLessThanOrEqual(at(t).amp * 1.45 + 0.5);
    expect(far).toBeGreaterThan(at(t).amp * 0.5);
  }
});

test("geschmolzen: Ionen verlassen ihre Plätze, bewegen sich ständig weiter, ohne Überlappung, im Tiegel, Gegen-Ionen nah", () => {
  const w = vessel();
  const start = w.b.map(p => ({ x: p.x, y: p.y }));
  let gap = Infinity, maxStep = 0;
  for (let f = 0; f < 6 * 60; f++) {
    const before = w.b.map(p => ({ x: p.x, y: p.y }));
    advance(w, at(900), 1 / 60);
    gap = Math.min(gap, gapMin(w));
    w.b.forEach((p, i) => { maxStep = Math.max(maxStep, Math.hypot(p.x - before[i].x, p.y - before[i].y)); });
  }
  expect(gap).toBeGreaterThanOrEqual(1.5);              // keine Überlappung
  expect(maxStep).toBeLessThan(0.1 * u);                 // nichts springt
  const left = w.b.reduce((s, p, i) => s + Math.hypot(p.x - start[i].x, p.y - start[i].y), 0) / w.b.length;
  expect(left).toBeGreaterThan(0.35 * u);                // Plätze verlassen
  for (const p of w.b) {                                 // im Tiegel
    expect(p.x - p.r).toBeGreaterThanOrEqual(x0 - 0.5);
    expect(p.x + p.r).toBeLessThanOrEqual(x1 + 0.5);
    expect(p.y + p.r).toBeLessThanOrEqual(y1 + 0.5);
    expect(p.y - p.r).toBeGreaterThanOrEqual(y0 - 0.5);
  }
  expect(oppositeNearest(w)).toBeGreaterThanOrEqual(0.7); // Gegen-Ionen bleiben nah
  // bewegen sich weiter (kein Einfrieren in eine zweite Anordnung)
  const mid = w.b.map(p => ({ x: p.x, y: p.y }));
  for (let f = 0; f < 3 * 60; f++) advance(w, at(900), 1 / 60);
  const moved = w.b.reduce((s, p, i) => s + Math.hypot(p.x - mid[i].x, p.y - mid[i].y), 0) / w.b.length;
  expect(moved).toBeGreaterThan(0.2 * u);
});

test("abgekühlt: jedes Ion gleitet auf einen eigenen Gitterplatz seiner Ladung zurück", () => {
  const w = vessel();
  for (let f = 0; f < 5 * 60; f++) advance(w, at(900), 1 / 60);
  let gap = Infinity;
  for (let f = 0; f < 4 * 60; f++) { advance(w, at(500), 1 / 60); gap = Math.min(gap, gapMin(w)); }
  expect(gap).toBeGreaterThanOrEqual(1.5);
  const homes = new Set(w.b.map(p => `${p.hx},${p.hy}`));
  expect(homes.size).toBe(w.b.length);
  for (const p of w.b) {
    const s = sites.find(x => x.x === p.hx && x.y === p.hy)!;
    expect(s.q).toBe(p.q);
    expect(Math.hypot(p.x - p.hx, p.y - p.hy)).toBeLessThanOrEqual(at(500).amp * 1.45 + 1);
  }
});

test("Lupe: in der Schmelze wandern Kationen zum Minuspol und Anionen zum Pluspol, gemischt und ohne Überlappung", () => {
  const LU = 40, H = 3 * LU;
  const all = grid(6, 6, LU, -H + LU / 2, -H + LU / 2);
  const keep = (q: number) => all.filter(s => s.q === q).filter((_, i) => i % 9 !== 4 && i % 9 !== 8);
  for (const minusLeft of [true, false]) {
    const w = makeWorld([...keep(1), ...keep(-1)], q => (q > 0 ? 9.9 : 17.5), LU, [-H, -H, H, H], true, 12);
    w.m = 1; w.free = true;
    const d: Drive = { free: true, heat: 1.05, amp: 0, cohesion: 0.5, like: 1.15 };
    warm(w, d, 4);
    const s0 = w.b.map(p => p.dx);
    let gap = Infinity;
    for (let f = 0; f < 8 * 60; f++) { advance(w, { ...d, drift: (minusLeft ? -1 : 1) * 0.7 * LU }, 1 / 60); gap = Math.min(gap, gapMin(w)); }
    const mean = (q: number) => w.b.reduce((s, p, i) => s + (p.q === q ? p.dx - s0[i] : 0), 0) / w.b.filter(p => p.q === q).length;
    const toMinus = minusLeft ? -1 : 1;
    expect(mean(1) * toMinus).toBeGreaterThan(LU);       // Kationen zum Minuspol
    expect(mean(-1) * toMinus).toBeLessThan(-LU);        // Anionen zum Pluspol
    expect(gap).toBeGreaterThanOrEqual(1.5);
    expect(oppositeNearest(w)).toBeGreaterThanOrEqual(0.5); // gemischt, keine getrennten Ladungsblöcke
  }
});

test("gleicher Startwert, gleiche Bewegung (ruhige Endbilder sind fest)", () => {
  const a = warm(vessel(), at(900), 3), b = warm(vessel(), at(900), 3);
  expect(a.b.map(p => [p.x, p.y])).toEqual(b.b.map(p => [p.x, p.y]));
});
