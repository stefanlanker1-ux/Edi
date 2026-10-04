// Erklärung auf Englisch: lösbar wie auf Deutsch und ohne deutsche Buchstaben (ä, ö, ü, ß) oder Anführungszeichen.
import { test, expect } from "vitest";
import { setLang } from "@lern/i18n";

test("Erklärung auf Englisch", async () => {
  setLang("en", false);
  const { checkGuide } = await import("@lern/ui");
  const mod = await import("./lessons.tsx") as Record<string, unknown>;
  const texts = new Set<string>();
  const walk = (x: unknown): void => {
    if (typeof x === "string") texts.add(x);
    else if (Array.isArray(x)) x.forEach(walk);
    else if (x && typeof x === "object") Object.values(x).forEach(walk);
  };
  const guideFor = mod.guideFor as ((s: "us" | "os") => unknown) | undefined;
  const guides = guideFor ? [guideFor("us"), guideFor("os")] : (mod.LESSONS as unknown[]);
  for (const g of guides) { walk(g); expect(checkGuide(g as Parameters<typeof checkGuide>[0], { lesson: true })).toEqual([]); }
  setLang("de", false);
  expect(texts.size).toBeGreaterThan(30);
  expect([...texts].filter(s => /[äöüÄÖÜß„]/.test(s))).toEqual([]);
});
