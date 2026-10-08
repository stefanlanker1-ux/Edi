// Erklärung: 10–15 Schritte je Stufe, jede Antwort lösbar, Rückmeldungen passend, kurze Sätze.
import { test, expect } from "vitest";
import { checkGuide } from "@lern/ui";
import { guideFor } from "./guide.tsx";

test("Erklärung Unterstufe und Oberstufe", () => {
  expect([...checkGuide(guideFor("us")), ...checkGuide(guideFor("os"))]).toEqual([]);
});

test("halb gelöst und selbst: der Merksatz (say) nennt die gesuchte Zahl nicht schon („Flächen-Nachbarn · 100“ bei 1 m² = ? dm²)", () => {
  for (const st of ["us", "os"] as const) for (const s of guideFor(st).steps) {
    if (s.mode === "worked" || typeof s.answer !== "number" || !s.say) continue;
    const a = String(s.answer).replace(".", ",");
    expect(new RegExp(`(^|[^0-9,\\p{L}])${a}([^0-9,\\p{L}]|$)`, "u").test(s.say), `${s.ask}: ${s.say}`).toBe(false);
  }
});
