// „So geht's“: die Regeln, die das Modul sonst nirgends nennt (Zahl vor dem Stoff vervielfacht alle Atome, Formeln nie ändern, kürzen) –
// mit einem Mini-Beispiel, das richtig ausgeglichen endet.
import { test, expect } from "vitest";
import { isBalanced } from "@lern/chem";
import { HOWTO_EXAMPLE, HOWTO_RULES } from "./HowTo.tsx";

test("So geht's: Zahl vor dem Stoff, Formeln nie ändern, kürzen – mit ausgeglichenem Beispiel", () => {
  const rules = HOWTO_RULES.join(" ");
  expect(rules).toMatch(/Zahl vor einem Stoff/);
  expect(rules).toMatch(/Formeln nie ändern/);
  expect(rules).toMatch(/Kürzen/);
  expect(HOWTO_EXAMPLE[HOWTO_EXAMPLE.length - 1].replace(/\u00a0/g, " ")).toContain("2 H₂ + O₂ → 2 H₂O");
  // Zahl und Formel nie getrennt (geschütztes Leerzeichen)
  for (const s of [...HOWTO_RULES, ...HOWTO_EXAMPLE]) expect(s, s).not.toMatch(/\d (H₂O|H₂|O₂|H|O)\b/);
  expect(isBalanced({ left: ["H2", "O2"], right: ["H2O"] }, [2, 1, 2])).toBe(true);
  for (const s of [...HOWTO_RULES, ...HOWTO_EXAMPLE]) for (const sentence of s.split(/[.:]\s+/)) expect(sentence.split(/\s+/).length, sentence).toBeLessThanOrEqual(22);
});
