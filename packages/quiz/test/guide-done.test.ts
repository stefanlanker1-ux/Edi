// Roter Ring an „Erklärung“ (LernApp in @lern/ui): Schlüssel mit der Kennung des Moduls – nach einem Sprachwechsel erscheint er nicht wieder.
import { test, expect, beforeEach, vi } from "vitest";
import { guideDone, guideDoneKey } from "@lern/ui";

beforeEach(() => {
  const m = new Map<string, string>();
  vi.stubGlobal("localStorage", { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => { m.set(k, v); }, removeItem: (k: string) => { m.delete(k); } });
});

test("Schlüssel hängt an der Kennung, nicht am übersetzten Namen", () => {
  expect(guideDoneKey("atombau")).toBe("lern-erklaert-atombau");
  expect(guideDone(guideDoneKey("atombau"), ["Atomic Structure", "Atombau", "Atomic Structure"])).toBe(false);
  localStorage.setItem(guideDoneKey("atombau"), "1");
  expect(guideDone(guideDoneKey("atombau"), ["Atomic Structure"])).toBe(true);
});

test("alter Stand unter dem deutschen Namen gilt auch auf Englisch und wird übernommen", () => {
  localStorage.setItem("lern-erklaert-Atombau", "1");
  expect(guideDone(guideDoneKey("atombau"), ["Atomic Structure", "Atombau", "Atomic Structure"])).toBe(true);
  expect(localStorage.getItem("lern-erklaert-atombau")).toBe("1");
});

test("ohne Speicher (gesperrt): Ring bleibt sichtbar, kein Absturz", () => {
  vi.stubGlobal("localStorage", { getItem: () => { throw new Error("gesperrt"); }, setItem: () => { throw new Error("gesperrt"); } });
  expect(guideDone(guideDoneKey("atombau"), ["Atombau"])).toBe(false);
});
