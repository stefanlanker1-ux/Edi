// Erklärung: 10–15 Schritte, jede Antwort lösbar, Rückmeldungen passend, kurze Sätze.
import { test, expect } from "vitest";
import { checkGuide } from "@lern/ui";
import { GUIDE } from "./guide.tsx";

test("Erklärung", () => { expect(checkGuide(GUIDE)).toEqual([]); });
