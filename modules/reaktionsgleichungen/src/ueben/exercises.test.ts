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
  });
  it("keine Gleichung aus dem Experimentieren", () => {
    for (const s of ["us", "os"] as const) for (const id of STARTS[s]) expect(LVLS.flatMap(l => EXERCISES[s][l])).not.toContain(id);
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
    }
  });
});
