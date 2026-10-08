// Englische Grammatik in erzeugten Aufgaben: Artikel vor Formeln, die man buchstabiert („an H₂O particle“, „a CO₂ particle“),
// Elementnamen mitten im Satz klein („Kinds of atoms: hydrogen (H) …“).
import { test, expect } from "vitest";
import { setLang } from "@lern/i18n";

test("Englisch: Artikel vor Formeln, Elementnamen mitten im Satz klein", async () => {
  setLang("en", false);
  const { GENS } = await import("./tasks.ts");
  const texts = new Set<string>();
  for (const g of Object.values(GENS)) for (let k = 0; k < 80; k++) {
    const t = g();
    [t.prompt, t.hint, t.explain, ...(t.kind === "mc" ? Object.values(t.why ?? {}) : []), ...(t.traps ?? []).map(x => x.why)].forEach(x => texts.add(x));
  }
  setLang("de", false);
  const ELEMENTS = "Hydrogen|Carbon|Nitrogen|Oxygen|Sulfur|Helium|Neon|Argon|Copper|Zinc|Iron|Aluminium";
  // „a“ vor einer Formel, deren erster Buchstabe wie ein Vokal klingt (H = „aitch“, N = „en“, S = „ess“ …)
  const article = /\b[Aa] [AEFHILMNORSX][A-Za-z₀-₉]*[₀-₉A-Z]/;
  const midCaps = new RegExp(`(?:: |, | and )(?:${ELEMENTS}) \\(`);
  expect(texts.size).toBeGreaterThan(200);
  expect([...texts].filter(s => article.test(s) || midCaps.test(s))).toEqual([]);
}, 60_000);
