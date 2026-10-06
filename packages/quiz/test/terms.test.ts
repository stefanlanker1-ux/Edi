// Begriffe im Text (Terms.tsx): nur ganze Wörter, Genitiv-s, jeder Begriff einmal, längster Begriff zuerst.
import { test, expect } from "vitest";
import { splitTerms, termsIn, type TermDef } from "@lern/ui";

const words = [{ w: "vinylchlorid", i: 0 }, { w: "polyvinylchlorid", i: 1 }, { w: "styrol", i: 2 }, { w: "ziegler-natta", i: 3 }, { w: "ziegler-natta-katalysator", i: 4 }];

test("ganze Wörter, nicht im zusammengesetzten Wort", () => {
  expect(splitTerms("Polyvinylchlorid entsteht aus Vinylchlorid.", words, new Set())).toEqual([["Polyvinylchlorid", 1], [" entsteht aus ", -1], ["Vinylchlorid", 0], [".", -1]]);
  expect(splitTerms("Vinylchloridgas", words, new Set())).toEqual([["Vinylchloridgas", -1]]);
});

test("Genitiv-s bleibt außerhalb des Links, jeder Begriff nur einmal", () => {
  expect(splitTerms("Die Kette des Styrols und Styrol", words, new Set())).toEqual([["Die Kette des ", -1], ["Styrol", 2], ["s und Styrol", -1]]);
});

test("längster Begriff an derselben Stelle", () => {
  expect(splitTerms("Der Ziegler-Natta-Katalysator", words, new Set())).toEqual([["Der ", -1], ["Ziegler-Natta-Katalysator", 4]]);
  expect(splitTerms("Ziegler-Natta wird vergiftet", words, new Set())).toEqual([["Ziegler-Natta", 3], [" wird vergiftet", -1]]);
});

test("termsIn findet auch weitere Schreibweisen", () => {
  const defs: TermDef[] = [{ term: "Ethen", also: ["Ethylen"], title: "Ethen", body: null }, { term: "Propen", title: "Propen", body: null }];
  expect(termsIn("Aus ethylen wird PE", defs).map(d => d.term)).toEqual(["Ethen"]);
});
