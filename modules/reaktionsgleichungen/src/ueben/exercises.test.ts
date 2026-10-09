// Übungen: je Stufe 3 × 10 verschiedene Gleichungen, alle aus Molekülen (Animation möglich), eindeutig ausgleichbar,
// je ein Hinweis (DE/EN) mit kurzen Sätzen, der keine gesuchte Zahl vor einem Stoff nennt.

import { describe, expect, it } from "vitest";
import { REACTION_BY_ID, balance, toSubscript } from "@lern/chem";
import { hasModel } from "../components/Molecules.tsx";
import { maxCoef } from "../components/Equation.tsx";
import { STARTS } from "../store.ts";
import { EXERCISES, HINTS_DE, HINTS_EN, LVLS } from "./exercises.ts";

const all = (["us", "os"] as const).flatMap(s => LVLS.flatMap(l => EXERCISES[s][l]));

describe("Übungen", () => {
  it("je Stufe und Schwierigkeit genau 10, insgesamt 60 verschiedene", () => {
    for (const s of ["us", "os"] as const) for (const l of LVLS) expect(EXERCISES[s][l]).toHaveLength(10);
    expect(new Set(all).size).toBe(60);
    // auch als Gleichung verschieden (nicht dieselbe Reaktion unter zwei Kennungen)
    expect(new Set(all.map(id => { const r = REACTION_BY_ID[id]; return `${r.left.join("+")}→${r.right.join("+")}`; })).size).toBe(60);
  });
  it("keine Gleichung aus dem Experimentieren – auch nicht aus der anderen Stufe", () => {
    const starts = [...STARTS.us, ...STARTS.os].map(id => REACTION_BY_ID[id]);
    const key = (r: { left: string[]; right: string[] }) => `${r.left.join("+")}→${r.right.join("+")}`;
    for (const id of all) expect(starts.map(key), id).not.toContain(key(REACTION_BY_ID[id]));
  });
  it("keine Gleichung ist schon ausgeglichen (mindestens eine Zahl ≠ 1 – sonst ✓ ohne Handlung)", () => {
    for (const id of all) expect(REACTION_BY_ID[id].coeffs.some(c => c > 1), id).toBe(true);
  });
  it("jede Gleichung existiert, besteht nur aus Molekülen und ist eindeutig ausgleichbar", () => {
    for (const id of all) {
      const r = REACTION_BY_ID[id];
      expect(r, id).toBeDefined();
      expect(hasModel(r), id).toBe(true);
      expect(balance(r), id).toEqual(r.coeffs);
      expect(Math.max(...r.coeffs), id).toBeLessThanOrEqual(maxCoef(r));
    }
  });
  for (const [lang, HINTS] of [["de", HINTS_DE], ["en", HINTS_EN]] as const) it(`Hinweise (${lang}): vorhanden, kurz, ohne gesuchte Zahl`, () => {
    expect(Object.keys(HINTS).sort()).toEqual([...all].sort());
    for (const id of all) {
      const h: string = HINTS[id];
      expect(h, id).toBeTruthy();
      for (const sentence of h.split(/[.?!]\s+/)) expect(sentence.split(/\s+/).length, `${id}: ${sentence}`).toBeLessThanOrEqual(22);
      const r = REACTION_BY_ID[id];
      [...r.left, ...r.right].forEach((f, k) => {
        if (r.coeffs[k] > 1) expect(h, `${id} verrät ${r.coeffs[k]} ${f}`).not.toContain(`${r.coeffs[k]} ${toSubscript(f)}`);
      });
      // kein Satz, der die Lösung vorwegnimmt („schon ausgeglichen“) oder den Denkschritt erledigt („F₂ bringt 2 F-Atome, jedes HF nur eines“)
      expect(h, id).not.toMatch(/schon ausgeglichen|already balanced|\bnur eine?s?\b|\bonly one\b/);
      // kein „X hat 4 H-Atome, jedes H₂ liefert 2 davon“: keine Atomzahlen (auch nicht als Liste „2 C, 4 H“), kein „je/jedes/each“ – nur womit beginnen, was vergleichen
      expect(h, `${id}: Atomzahl`).not.toMatch(/\d+\s*(C|H|N|O|S|P|F|Cl|Br|I)(-|\s)[Aa]tom|\b(ein|eine|einem|zwei|drei|one|two|three)\s+(C|H|N|O|S|P|F|Cl|Br|I)(-|\s)[Aa]tom|\d+ (C|H|N|O|S|P|Cl)(,| und| and)/);
      expect(h, `${id}: je/jedes`).not.toMatch(/\bje\b|\b[Jj]ede[smnr]?\b|\b[Ee]ach\b/);
    }
  });
});
