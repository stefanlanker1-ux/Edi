// Elektronenpfeile (CurlyArrow.tsx): deutlich gebogen auch bei kurzen Pfeilen, Seite wie angegeben, Spitze am Ziel, Bogen weicht Atomen aus.
import { test, expect } from "vitest";
import { curlyArrow } from "../src/CurlyArrow.tsx";

const nums = (d: string) => (d.match(/-?\d+(\.\d+)?/g) ?? []).map(Number);
/** Höhe des Bogens über der Verbindungslinie (Vorzeichen = Seite) */
const height = (from: { x: number; y: number }, to: { x: number; y: number }, mid: { x: number; y: number }) => {
  const dx = to.x - from.x, dy = to.y - from.y, l = Math.hypot(dx, dy);
  return ((mid.x - from.x) * -dy + (mid.y - from.y) * dx) / l;
};

test("kurze Pfeile sind sichtbar gebogen (aber kein Kringel), lange nicht zu bauchig", () => {
  const a = { x: 0, y: 0 }, b = { x: 0.5, y: 0 }, c = { x: 4, y: 0 }, d = { x: 1, y: 0 };
  expect(Math.abs(height(a, b, curlyArrow(a, b).mid))).toBeGreaterThanOrEqual(0.2);
  expect(Math.abs(height(a, b, curlyArrow(a, b).mid))).toBeLessThanOrEqual(0.3);
  expect(Math.abs(height(a, d, curlyArrow(a, d).mid))).toBeGreaterThanOrEqual(0.29);
  expect(Math.abs(height(a, c, curlyArrow(a, c).mid))).toBeLessThanOrEqual(1.11);
});

test("Seite folgt dem Vorzeichen von bend", () => {
  const a = { x: 0, y: 0 }, b = { x: 2, y: 0 };
  expect(Math.sign(height(a, b, curlyArrow(a, b, { bend: 0.5 }).mid))).toBe(1);
  expect(Math.sign(height(a, b, curlyArrow(a, b, { bend: -0.5 }).mid))).toBe(-1);
});

test("Spitze sitzt am Ziel; voller Pfeil 4 Ecken, halber 3", () => {
  const a = { x: 0, y: 0 }, b = { x: 2, y: 1 };
  const full = curlyArrow(a, b), half = curlyArrow(a, b, { half: true });
  expect(nums(full.head).slice(0, 2)).toEqual([2, 1]);
  expect(nums(full.head).length).toBe(8);
  expect(nums(half.head).length).toBe(6);
  // Strich endet vor der Spitze
  const end = nums(full.d).slice(-2);
  expect(Math.hypot(end[0] - 2, end[1] - 1)).toBeGreaterThan(0.1);
});

test("Bogen weicht einem Atom im Weg aus (höher), Atome an den Enden stören nicht", () => {
  const a = { x: 0, y: 0 }, b = { x: 2, y: 0 };
  const free = curlyArrow(a, b, { bend: 0.4 });
  const blocked = curlyArrow(a, b, { bend: 0.4, avoid: [{ x: 1, y: height(a, b, free.mid), r: 0.3 }, { x: 0, y: 0, r: 0.3 }] });
  expect(height(a, b, blocked.mid)).toBeGreaterThan(height(a, b, free.mid) + 0.1);
});
