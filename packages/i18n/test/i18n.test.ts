import { expect, test } from "vitest";
import { detectLang, getLang, tr } from "../src/index.ts";

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
