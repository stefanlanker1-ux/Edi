// Definitionen überall gleich (Element, Verbindung, Legierung): verbotene Formulierungen in allen Texten (DE und EN) des Moduls
import { test, expect } from "vitest";
import { readFileSync } from "node:fs";

const FILES = ["lessons.tsx", "quiz/tasks.ts", "quiz/trennen.ts", "quiz/explain.tsx", "views/MixView.tsx", "mixtures.ts"];
/** alle Zeichenketten der Quelltexte ("…" und `…`) */
const code = (f: string) => readFileSync(new URL(f, import.meta.url), "utf8").replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "").replace(/\{\/\*[\s\S]*?\*\/\}/g, "");
const strings = FILES.flatMap(f => [...code(f).matchAll(/"((?:[^"\\]|\\.){12,})"|`((?:[^`\\]|\\.){12,})`/g)].map(m => ({ f, s: m[1] ?? m[2] })));

test("Verbindung wird nie allgemein als „in einem Teilchen“ definiert (nur als Bildregel „Im Bild: …“)", () => {
  const bad = strings.filter(({ s }) => /(Verbindung|compound)/i.test(s) && /(in einem Teilchen|in one particle)/i.test(s) && !/^(Im Bild|In the picture)|Im Bild:|In the picture:/.test(s));
  expect(bad.map(b => `${b.f}: ${b.s.slice(0, 90)}`)).toEqual([]);
});

test("Legierung nie als „nur Metalle“ (Stahl = Eisen + Kohlenstoff); „bis zu den Atomen“ nur bei einphasigen Beispielen", () => {
  const bad = strings.filter(({ s }) => /Legierungen? (sind|ist) (nur )?Metalle|Alloys? (are|is) (only )?metals|Metalle gemischt|metals mixed/i.test(s));
  const atoms = strings.filter(({ s }) => /bis zu den Atomen|down to the atoms/i.test(s) && !/Messing|brass|Kupfer und Zink|copper and zinc|Konstantan|constantan|Kupfer und Nickel|copper and nickel|Weißgold|white gold|Gold|Edelstahl|stainless|Granit|granite|Zucker|sugar/i.test(s));
  expect([...bad, ...atoms].map(b => `${b.f}: ${b.s.slice(0, 90)}`)).toEqual([]);
});
