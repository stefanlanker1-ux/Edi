// Räumliches Natriumchlorid-Gitter (Lattice3D): Geometrie, Projektion und Tiefensortierung.
// Jedes Na⁺ hat 6 Cl⁻ im gleichen Abstand; der Gitterausschnitt wechselt ab; gezeichnet wird von hinten nach vorn;
// in der Startansicht liegen alle Kugeln getrennt; beim Drehen bleibt alles im Rahmen.
import { test, expect } from "vitest";
import { CL, NA } from "./draw.tsx";
import { EYE, PITCH_MAX, START, extent, geo, lattice, neighbours, project, rotate, scene, sites, type BallItem, type Cam, type V3 } from "./lattice3d.tsx";

const d3 = (a: V3, b: V3) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
// feste Pseudo-Zufallsfolge: viele Blickrichtungen im erlaubten Bereich
let seed = 7;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const cams: Cam[] = Array.from({ length: 300 }, () => ({ yaw: rnd() * 2 * Math.PI, pitch: (rnd() * 2 - 1) * PITCH_MAX }));

test("Nachbarn: ein Na⁺ in der Mitte, 6 Cl⁻ im gleichen Abstand – links, rechts, oben, unten, davor, dahinter", () => {
  const s = sites("nb");
  expect(s).toHaveLength(7);
  expect(s[0].ion).toBe(NA);
  expect(s[0].p).toEqual([0, 0, 0]);
  const cl = s.slice(1);
  expect(cl.every(x => x.ion === CL)).toBe(true);
  for (const x of cl) expect(d3(x.p, s[0].p)).toBeCloseTo(1, 12);
  // je eine Richtung: ±x, ±y, ±z
  expect(new Set(cl.map(x => x.p.join()))).toEqual(new Set(["1,0,0", "-1,0,0", "0,1,0", "0,-1,0", "0,0,1", "0,0,-1"]));
  // Cl⁻ untereinander weiter weg (√2) – keine Linie zwischen gleichen Ionen
  expect(neighbours(s).every(([i, j]) => s[i].ion !== s[j].ion)).toBe(true);
  expect(neighbours(s)).toHaveLength(6);
  // Größen im Verhältnis der Ionenradien (Na⁺ 102 pm, Cl⁻ 181 pm)
  expect(s[0].r / s[1].r).toBeCloseTo(102 / 181, 12);
  // Drehen ändert keinen Abstand
  for (const c of cams.slice(0, 50)) for (const x of cl) expect(Math.hypot(...rotate(x.p, c))).toBeCloseTo(1, 12);
});

test("Gitterausschnitt: 27 Ionen im Wechsel, jedes Ion hat nur Gegen-Ionen als nächste Nachbarn, die Mitte 6", () => {
  const s = sites("cut");
  expect(s).toHaveLength(27);
  expect(s.filter(x => x.ion === NA)).toHaveLength(13);
  expect(s.filter(x => x.ion === CL)).toHaveLength(14);
  const nb = neighbours(s);
  expect(nb).toHaveLength(54);
  expect(nb.every(([i, j]) => s[i].ion !== s[j].ion)).toBe(true);
  const mid = s.findIndex(x => x.p.every(v => v === 0));
  expect(s[mid].ion).toBe(NA);
  expect(nb.filter(([i, j]) => i === mid || j === mid)).toHaveLength(6);
  // gleiche Größenverhältnisse wie bei den Nachbarn
  expect(s.find(x => x.ion === NA)!.r / s.find(x => x.ion === CL)!.r).toBeCloseTo(102 / 181, 12);
});

test("im ganzen Gitter: jedes Ion hat 6 Gegen-Ionen als nächste Nachbarn und 12 gleiche als übernächste", () => {
  const s = lattice(5);
  for (const a of s) {
    if (a.p.some(v => Math.abs(v) > 1)) continue;   // nur Ionen, deren Nachbarschaft ganz im Ausschnitt liegt
    const near = s.filter(b => b !== a && Math.abs(d3(a.p, b.p) - 1) < 1e-9);
    const next = s.filter(b => b !== a && Math.abs(d3(a.p, b.p) - Math.SQRT2) < 1e-9);
    expect(near).toHaveLength(6);
    expect(near.every(b => b.ion !== a.ion)).toBe(true);
    expect(next).toHaveLength(12);
    expect(next.every(b => b.ion === a.ion)).toBe(true);
  }
});

test("Perspektive: vorn größer als hinten, die Mitte unverändert", () => {
  const c: Cam = { yaw: 0, pitch: 0 };
  const front = project([0, 0, 1], c), back = project([0, 0, -1], c), mid = project([0, 0, 0], c);
  expect(front.s).toBeCloseTo(EYE / (EYE - 1), 12);
  expect(front.s).toBeGreaterThan(1);
  expect(back.s).toBeLessThan(1);
  expect(mid.s).toBe(1);
  // Blick von oben (pitch > 0): die obere Kugel kommt nach vorn, die vordere rückt nach unten
  const top = project([0, 1, 0], { yaw: 0, pitch: 0.4 }), fr = project([0, 0, 1], { yaw: 0, pitch: 0.4 });
  expect(top.z).toBeGreaterThan(0);
  expect(fr.y).toBeLessThan(0);
});

test("Tiefensortierung: von hinten nach vorn – was sich im Bild überdeckt, liegt in der richtigen Reihenfolge", () => {
  for (const view of ["nb", "cut"] as const) {
    const g = geo(view);
    for (const c of cams) {
      const items = scene(view, c);
      const toViewer = rotate([0, 0, 1], c)[2];
      const sheetAt = items.findIndex(it => it.k === "sheet");
      // vor der Schicht nur, was dahinter liegt; jeweils nach Tiefe geordnet
      const sortedZ = (xs: typeof items) => xs.every((it, k) => k === 0 || (it as { z: number }).z >= (xs[k - 1] as { z: number }).z - 1e-12);
      expect(sortedZ(items.slice(0, sheetAt))).toBe(true);
      expect(sortedZ(items.slice(sheetAt + 1))).toBe(true);
      for (const it of items.slice(0, sheetAt)) if (it.k === "ball") expect(g.sites[it.i].p[2] * toViewer).toBeLessThan(0);
      // je zwei Kugeln, die sich im Bild überdecken: die vordere wird später gezeichnet
      const balls = items.filter((it): it is BallItem => it.k === "ball");
      for (let a = 0; a < balls.length; a++) for (let b = a + 1; b < balls.length; b++) {
        const A = balls[a], B = balls[b];
        if (Math.hypot(A.x - B.x, A.y - B.y) < A.r + B.r) expect(B.z).toBeGreaterThan(A.z);
      }
    }
  }
});

test("Linien enden am Rand ihrer Kugeln und laufen nie über die eigenen Kugeln", () => {
  const items = scene("nb", START);
  const balls = items.filter((it): it is BallItem => it.k === "ball");
  const mid = balls.find(b => b.hot)!;
  const segs = items.filter(it => it.k === "seg" && it.cls === "strong");
  expect(segs).toHaveLength(6);
  for (const s of segs) {
    if (s.k !== "seg") continue;
    expect(Math.hypot(s.x1 - mid.x, s.y1 - mid.y)).toBeCloseTo(mid.r, 9);
  }
});

test("Startansicht: alle 7 Kugeln getrennt, keine Anziehungslinie läuft über ein fremdes Cl⁻", () => {
  const items = scene("nb", START);
  const balls = items.filter((it): it is BallItem => it.k === "ball");
  expect(balls).toHaveLength(7);
  for (let a = 0; a < balls.length; a++) for (let b = a + 1; b < balls.length; b++)
    expect(Math.hypot(balls[a].x - balls[b].x, balls[a].y - balls[b].y) - balls[a].r - balls[b].r).toBeGreaterThan(0.04);
  const segDist = (px: number, py: number, s: { x1: number; y1: number; x2: number; y2: number }) => {
    const dx = s.x2 - s.x1, dy = s.y2 - s.y1, t = Math.max(0, Math.min(1, ((px - s.x1) * dx + (py - s.y1) * dy) / (dx * dx + dy * dy)));
    return Math.hypot(s.x1 + t * dx - px, s.y1 + t * dy - py);
  };
  for (const s of items) {
    if (s.k !== "seg" || s.cls !== "strong") continue;
    const own = balls.filter(b => Math.abs(Math.hypot(b.x - s.x2, b.y - s.y2) - b.r) < 1e-9 || b.hot);
    for (const b of balls) if (!own.includes(b)) expect(segDist(b.x, b.y, s)).toBeGreaterThan(b.r);
  }
});

test("beim Drehen bleibt das Modell ganz im Rahmen (Ausdehnung für alle Blickrichtungen)", () => {
  for (const view of ["nb", "cut"] as const) {
    const { ex, ey } = extent(view);
    for (const c of cams) for (const it of scene(view, c)) {
      if (it.k === "ball") { expect(Math.abs(it.x) + it.r).toBeLessThanOrEqual(ex); expect(Math.abs(it.y) + it.r).toBeLessThanOrEqual(ey); }
      if (it.k === "seg") for (const [x, y] of [[it.x1, it.y1], [it.x2, it.y2]]) { expect(Math.abs(x)).toBeLessThanOrEqual(ex); expect(Math.abs(y)).toBeLessThanOrEqual(ey); }
      if (it.k === "sheet") for (const [x, y] of it.pts) { expect(Math.abs(x)).toBeLessThanOrEqual(ex); expect(Math.abs(y)).toBeLessThanOrEqual(ey); }
    }
  }
});
