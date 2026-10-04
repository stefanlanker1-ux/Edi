// Lektionen der sechs Kapitel: vorgemacht → halb gelöst → selbst, jede Antwort lösbar, Begriffe eingeführt, kurze Sätze.
import { test, expect } from "vitest";
import { checkGuide } from "@lern/ui";
import { LESSONS } from "./lessons.tsx";

test("Lektionen", () => {
  expect(LESSONS.length).toBe(6);
  for (const l of LESSONS) expect(checkGuide(l, { lesson: true })).toEqual([]);
});
