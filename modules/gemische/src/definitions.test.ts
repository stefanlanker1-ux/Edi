// Definitionen überall gleich (Element, Verbindung, Legierung): verbotene Formulierungen in allen Texten (DE und EN) des Moduls
import { test, expect } from "vitest";
import { readFileSync } from "node:fs";

const FILES = ["lessons.tsx", "quiz/tasks.ts", "quiz/trennen.ts", "quiz/explain.tsx", "views/MixView.tsx", "mixtures.ts"];
/** alle Zeichenketten der Quelltexte ("…" und `…`) */
const code = (f: string) => readFileSync(new URL(f, import.meta.url), "utf8").replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "").replace(/\{\/\*[\s\S]*?\*\/\}/g, "");
// alle Zeichenketten paarweise lesen (auch kurze – sonst verrutschen die Anführungszeichen), dann nur die längeren prüfen
const strings = FILES.flatMap(f => [...code(f).matchAll(/"((?:[^"\\\n]|\\.)*)"|`((?:[^`\\]|\\.)*)`/g)].map(m => ({ f, s: m[1] ?? m[2] })).filter(x => x.s.length >= 12));

test("Verbindung wird nie allgemein als „in einem Teilchen“ definiert (nur als Bildregel „Im Bild: …“)", () => {
  const bad = strings.filter(({ s }) => /(Verbindung|compound)/i.test(s) && /(in einem Teilchen|in one particle)/i.test(s) && !/^(Im Bild|In the picture)|Im Bild:|In the picture:/.test(s));
  expect(bad.map(b => `${b.f}: ${b.s.slice(0, 90)}`)).toEqual([]);
});

test("Legierung nie als „nur Metalle“ (Stahl = Eisen + Kohlenstoff); „bis zu den Atomen“ nur bei einphasigen Beispielen", () => {
  const bad = strings.filter(({ s }) => /Legierungen? (sind|ist) (nur )?Metalle|Alloys? (are|is) (only )?metals|Metalle gemischt|metals mixed/i.test(s));
  const atoms = strings.filter(({ s }) => /bis zu den Atomen|down to the atoms/i.test(s) && !/Messing|brass|Kupfer und Zink|copper and zinc|Konstantan|constantan|Kupfer und Nickel|copper and nickel|Weißgold|white gold|Gold|Edelstahl|stainless|Granit|granite|Zucker|sugar/i.test(s));
  expect([...bad, ...atoms].map(b => `${b.f}: ${b.s.slice(0, 90)}`)).toEqual([]);
});

test("Verbindung immer mit festem Zahlenverhältnis, Legierung mit frei wählbaren Anteilen – überall, wo sie definiert werden (DE und EN)", () => {
  const comp = strings.filter(({ s }) => /(Verbindung|Compound)(\*\*)?:(\*\*)?\s*(\*\*)?(mehrere|several)/i.test(s));
  const alloy = strings.filter(({ s }) => /\*\*(Legierung|alloy)\*\*/i.test(s) && /geschmolzen|melted/.test(s));
  expect(comp.length).toBeGreaterThanOrEqual(6);
  expect(alloy.length).toBeGreaterThanOrEqual(4);
  expect(comp.filter(({ s }) => !/Zahlenverhältnis|number ratio/.test(s)).map(b => `${b.f}: ${b.s.slice(0, 90)}`)).toEqual([]);
  expect(alloy.filter(({ s }) => !/Anteile frei wählbar|proportions freely chosen/.test(s)).map(b => `${b.f}: ${b.s.slice(0, 90)}`)).toEqual([]);
});

test("Legierung nicht pauschal homogen; beim Destillieren von Alkohol und Wasser verdampft beides (Alkohol leichter)", () => {
  const bad = strings.filter(({ s }) => /Homogen(eous)?: [^.]*\*\*(Legierung|alloy)\*\*/i.test(s)
    || /verdampft vor Wasser|zuerst vor allem|gleichzeitig zu Dampf|evaporates before water|evaporates first|at the same time/i.test(s));
  expect(bad.map(b => `${b.f}: ${b.s.slice(0, 90)}`)).toEqual([]);
});

test("Keine mehrdeutigen Beispiele im Modul (Schlagsahne enthält eine Emulsion, Wolken können Eis enthalten)", () => {
  expect(FILES.filter(f => /Schlagsahne|whipped cream|\bWolke|\bclouds?\b/.test(code(f)))).toEqual([]);
});
