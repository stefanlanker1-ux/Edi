// „Neu starten“ nach einem Absturz (Rescue.tsx in @lern/ui): erst sanft (Fortschritt bleibt), nur bei erneutem Absturz derselben App bald danach alles.
import { test, expect, beforeEach, vi } from "vitest";
import { progressKey, rescueReset } from "@lern/ui";
import { LESSON_KEY, createQuizStore } from "../src/index.ts";

class MemStorage {
  private m = new Map<string, string>();
  getItem(k: string) { return this.m.get(k) ?? null; }
  setItem(k: string, v: string) { this.m.set(k, String(v)); }
  removeItem(k: string) { this.m.delete(k); }
  clear() { this.m.clear(); }
}

beforeEach(() => {
  vi.stubGlobal("localStorage", new MemStorage());
  vi.stubGlobal("sessionStorage", new MemStorage());
});

// Speicherstände wie in den Modulen: Quiz (createQuizStore), Baukasten, erledigte Lektionen, eigener Übungsstand
createQuizStore({ storageKey: "a-quiz", levelId: (s, l) => `${s}-${l}`, makeRound: () => [] });
createQuizStore({ storageKey: "b-quiz", levelId: (s, l) => `${s}-${l}`, makeRound: () => [] });
const quiz = (games: unknown) => JSON.stringify({ state: { games, progress: { "us-0": { stars: 3 } }, skills: { x: { s: 3 } } }, version: 1 });
const fill = () => {
  localStorage.setItem("a-v1", JSON.stringify({ state: { atoms: [1, 2] } }));
  localStorage.setItem("a-quiz", quiz({ us: { i: 3 } }));
  localStorage.setItem("b-v1", JSON.stringify({ state: { atoms: [3] } }));
  localStorage.setItem("b-quiz", quiz({ us: { i: 5 } }));
  localStorage.setItem(LESSON_KEY, JSON.stringify({ "gm-k1": true }));
  localStorage.setItem("b-ueben", JSON.stringify({ state: { done: { x: true } } }));
};
const A = ["a-v1", "a-quiz", LESSON_KEY], B = ["b-v1", "b-quiz", LESSON_KEY, progressKey("b-ueben")];

test("erstes „Neu starten“: Baukasten und laufende Runden weg, Fortschritt und erledigte Lektionen bleiben", () => {
  fill();
  expect(rescueReset(A)).toBe(false);
  expect(localStorage.getItem("a-v1")).toBeNull();
  const q = JSON.parse(localStorage.getItem("a-quiz")!);
  expect(q.state.games).toBeUndefined();
  expect(q.state.progress["us-0"].stars).toBe(3);
  expect(q.state.skills.x.s).toBe(3);
  expect(JSON.parse(localStorage.getItem(LESSON_KEY)!)).toEqual({ "gm-k1": true });
});

test("gekennzeichneter Fortschritt ohne Quiz-Form bleibt ebenfalls", () => {
  fill();
  rescueReset(B);
  expect(JSON.parse(localStorage.getItem("b-ueben")!)).toEqual({ state: { done: { x: true } } });
  expect(localStorage.getItem("b-v1")).toBeNull();
});

test("Absturz in App A, danach erstes „Neu starten“ in App B: B bleibt sanft", () => {
  fill();
  rescueReset(A, 1_000);
  expect(rescueReset(B, 2_000)).toBe(false);
  expect(JSON.parse(localStorage.getItem("b-quiz")!).state.progress["us-0"].stars).toBe(3);
});

test("dieselbe App stürzt bald wieder ab: zweites „Neu starten“ setzt alles zurück, danach wieder sanft", () => {
  fill();
  rescueReset(A, 1_000);
  fill();
  expect(rescueReset(A, 60_000)).toBe(true);
  for (const k of ["a-v1", "a-quiz"]) expect(localStorage.getItem(k)).toBeNull();
  expect(localStorage.getItem("b-quiz")).not.toBeNull();
  fill();
  expect(rescueReset(A, 120_000)).toBe(false);
});

test("alles zurücksetzen in App A: geteilte erledigte Lektionen (auch die anderer Module) bleiben, kaputte nicht", () => {
  fill();
  localStorage.setItem(LESSON_KEY, JSON.stringify({ "gm-k1": true, "pm-k1": true }));
  rescueReset(A, 1_000);
  expect(rescueReset(A, 2_000)).toBe(true);
  expect(JSON.parse(localStorage.getItem(LESSON_KEY)!)).toEqual({ "gm-k1": true, "pm-k1": true });
  localStorage.setItem(LESSON_KEY, "{kaputt");
  rescueReset(A, 3_000);
  expect(rescueReset(A, 4_000)).toBe(true);
  expect(localStorage.getItem(LESSON_KEY)).toBeNull();
});

test("viel später wieder ein Absturz derselben App: wieder sanft", () => {
  fill();
  rescueReset(A, 1_000);
  fill();
  expect(rescueReset(A, 1_000 + 60 * 60_000)).toBe(false);
  expect(JSON.parse(localStorage.getItem("a-quiz")!).state.progress["us-0"].stars).toBe(3);
});

test("kaputter Speicherstand wird auch beim ersten Mal gelöscht", () => {
  localStorage.setItem("a-quiz", "{kaputt");
  rescueReset(A);
  expect(localStorage.getItem("a-quiz")).toBeNull();
});
