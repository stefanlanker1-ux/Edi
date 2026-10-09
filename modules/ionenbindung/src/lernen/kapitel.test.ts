// Kapitel des Bereichs „Lernen“: je 25 Folien in Abschnitten, mindestens die Hälfte Modell-Folien (verändern, sofort sehen, prüfen),
// alle Regeln der Erklärung (checkGuide), Merksätze je Abschnitt, richtige Auswahl an wechselnden Plätzen; dazu die englische Fassung.
import { test, expect } from "vitest";
import { checkGuide } from "@lern/ui";
import { setLang } from "@lern/i18n";
import { allKapitel } from "./chapters.ts";
import { isModel } from "./model.tsx";

const parts = (k: ReturnType<typeof allKapitel>[number]) => k.def.steps.filter((s, i) => s.part || i === 0).length;

for (const k of allKapitel().filter(x => !x.draft)) {
  test(`Kapitel ${k.nr}: 25 Folien, mindestens 13 Modell-Folien, Regeln der Erklärung`, () => {
    expect(k.def.steps.length).toBe(25);
    expect(k.def.steps.filter(isModel).length).toBeGreaterThanOrEqual(13);
    // Modell-Folien sind prüfbar: Antwort, Bild, Tipp
    for (const s of k.def.steps.filter(isModel)) if (s.mode !== "worked") expect(!!s.visual && s.answer !== undefined && !!s.tip).toBe(true);
    expect(checkGuide(k.def)).toEqual([]);
    expect(k.explain.length).toBe(parts(k));
    for (const r of k.explain) expect(r.length).toBeGreaterThan(0);
  });
}

test("die richtige Auswahl steht an wechselnden Plätzen (höchstens 40 % an Platz 1)", () => {
  const steps = allKapitel().filter(x => !x.draft).flatMap(k => k.def.steps).filter(s => s.options?.length && s.answer !== undefined);
  if (!steps.length) return;
  expect(steps.filter(s => s.options![0] === String(s.answer)).length / steps.length).toBeLessThanOrEqual(.4);
});

test("Kapitel auf Englisch: gleiche Regeln, nichts Deutsches", async () => {
  setLang("en", false);
  const texts = new Set<string>();
  const walk = (x: unknown): void => {
    if (typeof x === "string") texts.add(x);
    else if (Array.isArray(x)) x.forEach(walk);
    else if (x && typeof x === "object") Object.values(x).forEach(walk);
  };
  const list = allKapitel().filter(x => !x.draft);
  for (const k of list) { walk([k.title, k.desc, k.explain, k.def]); expect(checkGuide(k.def)).toEqual([]); }
  setLang("de", false);
  expect([...texts].filter(s => /[äöüÄÖÜß„]/.test(s))).toEqual([]);
}, 30_000);
