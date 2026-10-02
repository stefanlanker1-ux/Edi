import { expect, test } from "vitest";
import { article, detectLang, getLang, midCase, tr } from "../src/index.ts";

test("Sprache aus der Gerätesprache: Deutsch bei de-*, sonst Englisch", () => {
  expect(detectLang(["de-AT", "en"])).toBe("de");
  expect(detectLang(["en-GB", "de"])).toBe("en");
  expect(detectLang(["fr-FR", "de-CH"])).toBe("de");
  expect(detectLang(["fr-FR"])).toBe("en");
  expect(detectLang([])).toBe("en");
});

test("ohne Browser (Tests) Deutsch", () => {
  expect(getLang()).toBe("de");
  expect(tr("Ja", "Yes")).toBe("Ja");
});

test("Englisch: Namen mitten im Satz klein, Satzanfang, Eigennamen und Symbole unverändert", () => {
  expect(midCase("Tap **Argon** in the periodic table.")).toBe("Tap **argon** in the periodic table.");
  expect(midCase("What is the formula of **Iron(II) sulfate**?")).toBe("What is the formula of **iron(II) sulfate**?");
  expect(midCase("Kinds of atoms: Helium (He), Argon (Ar) → **2**.")).toBe("Kinds of atoms: helium (He), argon (Ar) → **2**.");
  expect(midCase("Silicon (Si): period 3, Main group IV.")).toBe("Silicon (Si): period 3, main group IV.");
  expect(midCase("**Sodium** forms Na⁺. Neon has 8 outer electrons.")).toBe("**Sodium** forms Na⁺. Neon has 8 outer electrons.");
  expect(midCase("by the Bohr model and Hund's rule in NaCl")).toBe("by the Bohr model and Hund's rule in NaCl");
});

test("Englisch: auch nach → und = klein", () => {
  expect(midCase("Atomic number 15 → Phosphorus.")).toBe("Atomic number 15 → phosphorus.");
  expect(midCase("Atomic number 15 = **Phosphorus (P)**.")).toBe("Atomic number 15 = **phosphorus (P)**.");
});

test("englischer Artikel", () => {
  expect(["oxygen", "carbon", "**Iodine**", "octet", "duet", "unit", "hydrogen", "argon"].map(w => `${article(w)} ${w}`))
    .toEqual(["an oxygen", "a carbon", "an **Iodine**", "an octet", "a duet", "a unit", "a hydrogen", "an argon"]);
});
