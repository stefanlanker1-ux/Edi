// Teilchensimulation von Kapitel 3: fest schwingen die Ionen nur um ihre Plätze, geschmolzen verlassen sie die Plätze und bewegen sich
// weiter (ohne Überlappung, im Gefäß, Gegen-Ionen nah), abgekühlt kehren sie ins Gitter zurück; im Strom wandern Kationen zum Minuspol.
import { test, expect } from "vitest";
import { advance, grid, heatDrive, lensDrive, makeWorld, warm, type Drive, type Site, type World } from "./sim.ts";

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

test("Tempo: doppelt so schnell = dieselbe Bewegung in der halben Zeit (Schmelze bei 1000 °C)", () => {
  const a = vessel(), b = vessel();
  a.m = b.m = 1; a.free = b.free = true;
  for (let i = 0; i < 10; i++) advance(a, { ...at(1000), speed: 2 }, 0.05);
  for (let i = 0; i < 20; i++) advance(b, at(1000), 0.05);
  a.b.forEach((p, k) => { expect(p.x).toBeCloseTo(b.b[k].x, 6); expect(p.y).toBeCloseTo(b.b[k].y, 6); });
});

// Tiegel mit den Radien von HeatSim (Na⁺ 17, Cl⁻ 30,2): Platzwechsel = ein Gegen- oder gleiches Ion wird neuer Nachbar (näher als 1,2 u,
// vorher weiter als 1,5 u); Verschiebung = mittlerer Abstand zur Lage 2 s vorher
const heatVessel = () => makeWorld(sites, q => (q > 0 ? 17 : (17 * 181) / 102), u, [x0, y0, x1, y1], false, 3);
/** Schmelze im Tiegel 20 s im Bildtakt: Platzwechsel je Ion und Sekunde, mittlere Verschiebung in 2 s (in u), kleinster Abstand, größter Schritt je Bild */
function melt(d: Drive) {
  const w = heatVessel();
  warm(w, d, 4);
  const n = w.b.length, T = 20, near = new Set<number>(), hist: { x: number; y: number }[][] = [];
  const dist = (i: number, j: number) => Math.hypot(w.b[i].x - w.b[j].x, w.b[i].y - w.b[j].y);
  for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) if (dist(i, j) < 1.2 * u) near.add(i * n + j);
  let swaps = 0, gap = Infinity, step = 0;
  for (let f = 0; f < T * 60; f++) {
    const before = w.b.map(p => ({ x: p.x, y: p.y }));
    advance(w, d, 1 / 60);
    hist.push(w.b.map(p => ({ x: p.x, y: p.y })));
    w.b.forEach((p, i) => { step = Math.max(step, Math.hypot(p.x - before[i].x, p.y - before[i].y)); });
    for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
      const k = i * n + j, e = dist(i, j);
      gap = Math.min(gap, e - w.b[i].r - w.b[j].r);
      if (!near.has(k) && e < 1.2 * u) { near.add(k); swaps += 2; } else if (near.has(k) && e > 1.5 * u) near.delete(k);
    }
  }
  let s = 0, c = 0;
  for (let f = 0; f + 120 < hist.length; f += 10) for (let i = 0; i < n; i++) { s += Math.hypot(hist[f + 120][i].x - hist[f][i].x, hist[f + 120][i].y - hist[f][i].y); c++; }
  return { rate: swaps / n / T, shift: s / c / u, gap, step: step / u, speed: d.speed ?? 1, w };
}
/** Antrieb der ersten Fassung (zum Vergleich): einfache Zufallskraft, Tempo wie heute */
const oldHeat = (t: number, tm: number): Drive => { const { stir: _s, glide: _g, cohesion: _c, ...d } = heatDrive(t, tm); return d; };

test("Schmelze: über der Schmelztemperatur wechseln die Ionen etwa doppelt so oft die Plätze wie mit der einfachen Zufallskraft – ohne Chaos", () => {
  // gemessen (Startwert 3, 30 s): am Schmelzpunkt 0,28 → 0,51 Platzwechsel je Ion und s, Verschiebung in 2 s 0,37 → 0,52 u;
  // NaCl bei 1000 °C 0,63 → 1,14 je s, 0,53 → 0,84 u
  for (const [t, rate, shift] of [[801, 0.42, 0.45], [1000, 0.9, 0.75]]) {
    const now = melt(heatDrive(t, 801)), before = melt(oldHeat(t, 801));
    expect(now.rate).toBeGreaterThan(rate);
    expect(now.rate).toBeGreaterThan(1.5 * before.rate);
    expect(now.shift).toBeGreaterThan(shift);
    expect(now.gap).toBeGreaterThanOrEqual(1.5);                  // keine Überlappung
    expect(now.step).toBeLessThanOrEqual((3 * Math.round(now.speed * 2)) / 120 + 1e-6); // nichts springt: höchstens 3 u/s je Unterschritt (bei 1000 °C 0,1 u je Bild)
    for (const p of now.w.b) {                                   // bleibt im Tiegel
      expect(p.x - p.r).toBeGreaterThanOrEqual(x0 - 0.5);
      expect(p.x + p.r).toBeLessThanOrEqual(x1 + 0.5);
      expect(p.y + p.r).toBeLessThanOrEqual(y1 + 0.5);
      expect(p.y - p.r).toBeGreaterThanOrEqual(y0 - 0.5);
    }
    expect(oppositeNearest(now.w)).toBeGreaterThanOrEqual(0.7);   // Gegen-Ionen bleiben nah
  }
}, 20_000);

test("Schmelze: unter der Schmelztemperatur bleibt alles wie vorher (fest: nur Schwingen)", () => {
  for (const t of [20, 500, 800]) {
    const a = vessel(), b = vessel();
    for (let f = 0; f < 120; f++) { advance(a, heatDrive(t, 801), 1 / 60); advance(b, oldHeat(t, 801), 1 / 60); }
    expect(a.b.map(p => [p.x, p.y])).toEqual(b.b.map(p => [p.x, p.y]));
    expect(heatDrive(t, 801).speed).toBe(1);
    expect(melt(heatDrive(t, 801)).rate).toBeLessThan(0.05);
  }
});

// Lupe wie Lens: Ausschnitt 6 × 6 LU, Schmelze 28 Ionen (Startwert 12), Lösung 12 Ionen weit auseinander (Startwert 13)
const LU = 40, LH = 3 * LU;
const lensSites = grid(6, 6, LU, -LH + LU / 2, -LH + LU / 2);
const keepSome = (q: number) => lensSites.filter(s => s.q === q).filter((_, i) => i % 9 !== 4 && i % 9 !== 8);
const melted: Site[] = [...keepSome(1), ...keepSome(-1)];
const loose: Site[] = Array.from({ length: 12 }, (_, k) => {
  const i = k % 4, j = Math.floor(k / 4);
  return { x: -LH + 30 + i * 60 + (j % 2) * 26, y: -LH + 40 + j * 80, q: (i + j) % 2 === 0 ? 1 : -1 };
});
/** 40 s Strom (Kationen nach rechts): Wanderung (LU/s, Kationen +, Anionen −), senkrechte Streuung in 1 s (Wurzel des mittleren Quadrats, LU),
 *  Anteil der Ionen mit einem Gegen-Ion als nächstem Nachbarn (Mittel über die Zeit; zufällig gemischt ≈ 0,5, getrennte Reihen → 0) */
function lens(list: Site[], seed: number, open: Drive, on: Drive) {
  const w = makeWorld(list, q => (q > 0 ? (17.5 * 102) / 181 : 17.5), LU, [-LH, -LH, LH, LH], true, seed);
  w.m = 1; w.free = true;
  warm(w, open, 4);
  const T = 40, hist: { x: number; y: number }[][] = [];
  let gap = Infinity, mixed = 0;
  for (let f = 0; f < T * 60; f++) {
    advance(w, on, 1 / 60);
    hist.push(w.b.map(p => ({ x: p.dx, y: p.dy })));
    gap = Math.min(gap, gapMin(w));
    if (f % 30 === 29) mixed += oppositeNearest(w) / (T * 2);
  }
  const last = hist[hist.length - 1], first = hist[0];
  const mean = (q: number) => w.b.reduce((s, p, i) => s + (p.q === q ? last[i].x - first[i].x : 0), 0) / w.b.filter(p => p.q === q).length / LU / ((hist.length - 1) / 60);
  let sy = 0, c = 0;
  for (let f = 0; f + 60 < hist.length; f += 10) for (let i = 0; i < w.b.length; i++) { sy += (hist[f + 60][i].y - hist[f][i].y) ** 2; c++; }
  return { cat: mean(1), an: mean(-1), y: Math.sqrt(sy / c) / LU, gap, mixed };
}

test("Lupe im Strom: Ionen wandern etwa doppelt so schnell wie vorher, senkrecht ruhig, gemischt, ohne Überlappung", () => {
  // erste Fassung: Sollwert Schmelze 1,7 · 0,7 LU/s, Lösung 1,7 · 0,3 LU/s, senkrecht ungedämpft
  const before: Record<string, Drive> = {
    schmelze: { free: true, heat: 1.05, amp: 0, cohesion: 0.5, like: 1.15, drift: 1.7 * 0.7 * LU },
    loesung: { free: true, heat: 0.75, amp: 0, apart: true, drift: 1.7 * 0.3 * LU },
  };
  // gemittelt über acht Startwerte, je 40 s (die Bewegung ist ungeordnet, einzelne Läufe streuen stark): Schmelze 0,41 → 0,78 LU/s,
  // senkrecht 0,37 → 0,18 LU; Lösung 0,18 → 0,37 LU/s, senkrecht 0,29 → 0,15 LU
  for (const [z, list, seed] of [["schmelze", melted, 12], ["loesung", loose, 13]] as const) {
    let v = 0, v0 = 0, y = 0, y0 = 0;
    for (const k of [0, 100, 200, 300, 400, 500, 600, 700]) {
      const now = lens(list, seed + k, lensDrive(z, 0, LU), lensDrive(z, 1, LU));
      const old = lens(list, seed + k, { ...before[z], drift: 0 }, before[z]);
      expect(now.cat).toBeGreaterThan(0);                        // Kationen zum Minuspol (rechts)
      expect(now.an).toBeLessThan(0);                             // Anionen zum Pluspol
      expect(now.gap).toBeGreaterThanOrEqual(1.5);                // keine Überlappung
      expect(now.mixed).toBeGreaterThanOrEqual(z === "schmelze" ? 0.65 : 0.3);  // gemischt wie vorher, keine Reihen gleicher Ladung
      v += (now.cat - now.an) / 16; v0 += (old.cat - old.an) / 16; y += now.y / 8; y0 += old.y / 8;
    }
    expect(v / v0).toBeGreaterThan(1.6);                          // ≈ doppelt so schnell
    expect(v / v0).toBeLessThan(2.8);
    expect(y).toBeLessThan(0.55 * y0);                            // senkrecht deutlich ruhiger als vorher
    expect(y).toBeLessThan(0.45 * v);                             // senkrechte Streuung in 1 s deutlich kleiner als die Wanderung in 1 s
  }
}, 30_000);

test("Lupe ohne Strom: ungeordnete Bewegung ohne Wanderung, senkrecht etwas ruhiger", () => {
  for (const [z, list, seed] of [["schmelze", melted, 12], ["loesung", loose, 13]] as const) {
    const open = lensDrive(z, 0, LU), r = lens(list, seed, open, open);
    expect(Math.abs(r.cat)).toBeLessThan(0.1);
    expect(Math.abs(r.an)).toBeLessThan(0.1);
    expect(r.y).toBeGreaterThan(0.1);                             // bewegt sich weiter in alle Richtungen
  }
});
