// Schalenbesetzung als Text: ausgeschrieben je Schale, nie als Kette „2 · 8 · 1“ (sieht aus wie eine Rechnung).
import { test, expect } from "vitest";
import { setLang } from "@lern/i18n";
import { shellLines, shellSentence, shells } from "../src/config.ts";

test("Zeilen je Schale mit Einzahl/Mehrzahl", () => {
  expect(shellLines(shells(11))).toEqual(["1. Schale: 2 Elektronen", "2. Schale: 8 Elektronen", "3. Schale: 1 Elektron"]);
  expect(shellLines([1])).toEqual(["1. Schale: 1 Elektron"]);
  expect(shellSentence([2, 8, 1])).toBe("1. Schale 2, 2. Schale 8, 3. Schale 1 Elektron");
  expect(shellSentence([2, 6])).toBe("1. Schale 2, 2. Schale 6 Elektronen");
  expect(shellSentence([2])).toBe("1. Schale 2 Elektronen");
  for (const t of [...shellLines(shells(20)), shellSentence(shells(20))]) expect(t).not.toMatch(/\d\s*·\s*\d/);
});

test("Englisch: 1st, 2nd, 3rd, 4th shell", () => {
  setLang("en", false);
  try {
    expect(shellLines([2, 8, 8, 1])).toEqual(["1st shell: 2 electrons", "2nd shell: 8 electrons", "3rd shell: 8 electrons", "4th shell: 1 electron"]);
    expect(shellSentence([2, 8, 1])).toBe("1st shell 2, 2nd shell 8, 3rd shell 1 electron");
  } finally { setLang("de", false); }
});
