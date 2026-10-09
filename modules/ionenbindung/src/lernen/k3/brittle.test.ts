// „Hart und spröde“: welche Verschiebung welche Rückmeldung gibt, welche Kräfte über die Spaltebene wirken, Ablauf der vorgemachten Folie
// (zoomen → schlagen → verschieben → brechen) und des frei bedienten Modells, Bruchstücke liegen am Ende getrennt auf dem Boden.
import { test, expect } from "vitest";
import { kapitel3 } from "../k3.tsx";
import { DEMO_T, PIECES, RAISED, crossPairs, demoPose, goalOf, halfway, holds, piecePose, repels, shiftResult, stepPose, type Pose } from "./brittle.tsx";

test("Verschiebung → Ergebnis: 0 hält, ¼ bis ¾ halb verschoben, 1 Platz stößt ab", () => {
  expect([0, 1, 2, 3, 4].map(shiftResult)).toEqual([holds(), halfway(), halfway(), halfway(), repels()]);
});

test("Folie mit Kaliumbromid: Antwort = Abstoßung, jede andere Wahl hat eine eigene Rückmeldung", () => {
  const step = kapitel3().def.steps.find(s => s.answer === repels() && s.ask.includes("KBr"))!;
  expect(step).toBeDefined();
  for (const s of [0, 1, 2, 3]) expect(step.why?.[shiftResult(s)]).toBeTruthy();
});

test("Kräfte über die Spaltebene: Gegen-Ionen gegenüber, halb verschoben beides, ganz verschoben nur Abstoßung", () => {
  const at = (f: number) => crossPairs(f).filter(p => p.i >= -2 && p.i <= 2);
  expect(at(0).every(p => p.att && p.dx === 0)).toBe(true);
  expect(at(0.25).every(p => p.att)).toBe(true);
  const half = at(0.5);
  for (let i = -2; i <= 2; i++) {
    const mine = half.filter(p => p.i === i);
    expect(mine.length).toBe(2);
    expect(mine.filter(p => p.att).length).toBe(1);
  }
  expect(at(0.75).every(p => !p.att)).toBe(true);
  expect(at(1).every(p => !p.att && Math.abs(p.dx) < 1e-9)).toBe(true);
});

test("vorgemacht: Lupe zoomt, dann schlägt der Hammer, die Schichten gleiten (Halt bei ½), erst dann bricht der Kristall", () => {
  expect(demoPose(0)).toEqual({ z: 0, a: RAISED, f: 0, b: 0 });
  expect(demoPose(DEMO_T)).toEqual({ z: 1, a: RAISED, f: 1, b: 1 });
  let last = demoPose(0);
  for (let t = 0; t <= DEMO_T; t += 0.05) {
    const p = demoPose(t);
    expect(p.f).toBeGreaterThanOrEqual(last.f - 1e-12);
    expect(p.b).toBeGreaterThanOrEqual(last.b - 1e-12);
    if (p.f > 0) expect(p.z).toBe(1);
    if (p.f > 0 && p.f < 1) expect(p.a).toBe(0);
    if (p.b > 0) expect(p.f).toBe(1);
    last = p;
  }
  expect([2.9, 3.0, 3.2].map(t => demoPose(t).f)).toEqual([0.5, 0.5, 0.5]);
});

test("frei: jede Wahl gleitet zum Ziel – zuerst verschieben, dann brechen; zurück wird zuerst zusammengesetzt", () => {
  const run = (from: Pose, to: Pose) => {
    let p = from, t = 0;
    const seen: Pose[] = [p];
    while (JSON.stringify(p) !== JSON.stringify(to) && t < 5) { p = stepPose(p, to, 1 / 60); t += 1 / 60; seen.push(p); }
    return { p, t, seen };
  };
  const up = run(goalOf(0), goalOf(4));
  expect(up.p).toEqual(goalOf(4));
  expect(up.t).toBeLessThan(2.5);
  for (const p of up.seen) if (p.b > 0) expect(p.f).toBe(1);
  for (const p of up.seen) if (p.f > 0 && p.f < 1) expect(p.a).toBe(0);
  const down = run(goalOf(4), goalOf(2));
  expect(down.p).toEqual(goalOf(2));
  for (const p of down.seen) if (p.f < 1) expect(p.b).toBe(0);
});

test("Bruchstücke: ganz = der Kristall, gelandet = getrennt nebeneinander auf dem Boden, nicht gedreht", () => {
  const h = PIECES[1].w;
  const start = PIECES.map(p => piecePose(p, 0));
  PIECES.forEach((p, k) => { expect([start[k].x, start[k].y]).toEqual([p.x, p.y]); expect(start[k].rot).toBeCloseTo(0, 9); });
  const end = PIECES.map((p, k) => ({ ...piecePose(p, 1), w: PIECES[k].w }));
  const floor = PIECES[0].y + h;
  for (const e of end) { expect(e.y + h).toBeCloseTo(floor, 9); expect(e.rot).toBeCloseTo(0, 9); }
  const sorted = [...end].sort((a, b) => a.x - b.x);
  for (let k = 1; k < sorted.length; k++) expect(sorted[k].x).toBeGreaterThan(sorted[k - 1].x + sorted[k - 1].w + 4);
});
