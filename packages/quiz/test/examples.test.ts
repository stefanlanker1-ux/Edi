// Neue Fertigkeiten: vor der ersten Aufgabe ein gelöstes Beispiel (andere Frage), danach mit erstem Schritt; geübte Fertigkeiten bleiben frei
import { test, expect } from "vitest";
import { withExamples, counted, type BaseTask } from "../src/index.ts";

const t = (type: string, n: number): BaseTask => ({ kind: "mc", type, prompt: `${type} ${n}`, hint: "h", explain: "e" });

test("Beispiel vor neuer Fertigkeit", () => {
  const round = [t("a", 1), t("b", 1), t("a", 2), t("b", 2)];
  const out = withExamples(round, { b: { s: 1, n: 1, last: 0, due: 0 } as never }, () => [t("a", 1), t("a", 9), t("b", 9)]);
  expect(out.map(x => [x.prompt, x.stage])).toEqual([["a 9", "worked"], ["a 1", "faded"], ["b 1", undefined], ["a 2", undefined], ["b 2", undefined]]);
  expect(counted(out)).toHaveLength(4);
});

test("ohne neue Fertigkeit unverändert", () => {
  const round = [t("a", 1)];
  expect(withExamples(round, { a: {} as never }, () => [])).toBe(round);
});

test("Beispiel ist nie die gleiche Frage mit anderer Antwortauswahl (gleiche Frage = gleiche Daten und richtige Antwort, wie taskKey)", () => {
  const q = (type: string, n: number, wrong: string[]): BaseTask & { options: string[]; answer: number } =>
    ({ kind: "mc", type, prompt: `Ladung von ${n}?`, hint: "h", explain: "e", options: [`${n}-`, ...wrong], answer: 0 });
  const round = [q("a", 1, ["1+", "2-", "0"])];
  // weitere Runde: zuerst dieselbe Frage mit anderen Ablenkern, dann eine andere Frage
  const out = withExamples(round, {}, () => [q("a", 1, ["3-", "2+", "1+"]), q("a", 2, ["1+", "2-", "0"])]);
  expect(out.map(x => [x.prompt, x.stage])).toEqual([["Ladung von 2?", "worked"], ["Ladung von 1?", "faded"]]);
});
