// Englische Namen der Säuren: kein Säurename gleich einem Säurerest-Namen (H₂S heißt nicht wie das Ion HS⁻ „hydrogen sulfide“) –
// sonst wäre die Quiz-Falle „Säurename statt Säurerest“ zugleich der Name eines anderen Säurerests.
import { test, assert } from "vitest";
import { setLang } from "@lern/i18n";

test("englisch: kein Säurename gleich einem Säurerest-Namen", async () => {
  setLang("en", false);
  try {
    const { PROTIC_ACIDS } = await import("../src/neutralization.ts");
    const names = new Set(PROTIC_ACIDS.flatMap(a => a.rests.map(r => r.name.replace(/ ion$/i, "").toLowerCase())));
    assert.ok(names.has("hydrogen sulfide"));
    for (const a of PROTIC_ACIDS) assert.ok(!names.has(a.name.toLowerCase()), a.name);
  } finally { setLang("de", false); }
});
