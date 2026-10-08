// Quiz-Store: „Nochmal“ nach „Heute fällig“ bzw. „Schwächen üben“ (QuizScreen, Auswertung) nur, solange noch etwas fällig bzw. schwach ist –
// sonst entstünde eine Runde aus Level-1-Aufgaben unter dem Namen „Heute fällig“ (ohne gelöste Beispiele). Tipp beim „ersten Schritt“ kostet nichts.
import { test, expect, vi } from "vitest";
import { createQuizStore, pending, type BaseTask, type LevelKey } from "../src/index.ts";

vi.stubGlobal("localStorage", { getItem: () => null, setItem: () => {}, removeItem: () => {} });

const levels = [{ id: "l1", name: "L1", desc: "", types: ["a", "b"] }, { id: "l2", name: "L2", desc: "", types: ["c"] }];
const task = (type: string, n: number): BaseTask => ({ kind: "mc", type, prompt: `${type} ${n}`, hint: "", explain: "" });
// wie die Module: fällig/schwach → diese Typen, leer → Level 1
const makeRound = (_s: string, level: LevelKey, _stats?: unknown, due: string[] = []) => {
  const ids = level === "due" && due.length ? due : ["a", "b"];
  return Array.from({ length: 4 }, (_, i) => task(ids[i % ids.length], Math.floor(Math.random() * 1000)));
};
const p = { stufe: "us", levels, typeName: (id: string) => id };

test("nach einer Runde „Heute fällig“ mit lauter Treffern ist nichts mehr fällig – kein „Nochmal“", () => {
  const useQuiz = createQuizStore({ storageKey: "t-quiz", levelId: (s, l) => `${s}-${l}`, makeRound });
  const past = Date.now() - 3 * 86_400_000;
  useQuiz.setState({ skills: { us: { c: { s: 1, k: 1, n: 1, right: 1, last: past - 86_400_000, due: past } } } });
  const before = pending(p, useQuiz.getState());
  expect(before.due).toEqual(["c"]);
  useQuiz.getState().start("us", "due", before.due);
  const g = useQuiz.getState().games.us!;
  expect(new Set(g.tasks.map(t => t.type))).toEqual(new Set(["c"]));
  for (let i = 0; i < g.tasks.length; i++) { useQuiz.getState().answer("us", { ok: true, choice: 0 }); useQuiz.getState().next("us"); }
  expect(useQuiz.getState().games.us!.finished).toBe(true);
  expect(pending(p, useQuiz.getState()).due).toEqual([]);
});

test("„Schwächen üben“: sind die Fehler behoben, ist die Liste leer", () => {
  const useQuiz = createQuizStore({ storageKey: "t2-quiz", levelId: (s, l) => `${s}-${l}`, makeRound });
  useQuiz.setState({ typeStats: { us: { a: { right: 1, wrong: 1 } } } });
  expect(pending(p, useQuiz.getState()).weak).toEqual(["a"]);
  useQuiz.setState({ typeStats: { us: { a: { right: 3, wrong: 0 } } } });
  expect(pending(p, useQuiz.getState()).weak).toEqual([]);
});

test("neue Fertigkeit: der erste Schritt steht schon da – ein Tipp kostet dort keine Punkte", () => {
  const useQuiz = createQuizStore({ storageKey: "t3-quiz", levelId: (s, l) => `${s}-${l}`, makeRound });
  useQuiz.getState().start("us", 0);
  const q = () => useQuiz.getState().games.us!;
  while (q().tasks[q().i].stage !== "faded") useQuiz.getState().next("us");
  useQuiz.getState().takeHint("us");
  useQuiz.getState().answer("us", { ok: true, choice: 0 });
  expect(q().answers[q().i]!.gained).toBe(10);
  // eine spätere Aufgabe ohne ersten Schritt: der Tipp kostet wie bisher (dazwischen falsch, damit keine Serie Punkte bringt)
  useQuiz.getState().next("us");
  while (q().tasks[q().i].stage) { if (q().tasks[q().i].stage === "faded") useQuiz.getState().answer("us", { ok: false, choice: 1 }); useQuiz.getState().next("us"); }
  useQuiz.getState().takeHint("us");
  useQuiz.getState().answer("us", { ok: true, choice: 0 });
  expect(q().answers[q().i]!.gained).toBe(5);
});
