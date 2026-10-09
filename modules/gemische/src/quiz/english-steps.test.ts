// Englisch, Reihenfolge der Trennschritte: kurze Schritt-Namen (Magnet, Dissolve, Filter, Evaporate), dieselben wie in Lektion 6 –
// sonst ist die vierte Antwort am Handy abgeschnitten („Magnetic separation → Dissolving → Filtration → Evaporation“)
import { test, expect } from "vitest";
import { setLang } from "@lern/i18n";

test("Englisch: Schritte in der Reihenfolge kurz und wie in der Lektion", async () => {
  setLang("en", false);
  const { GENS } = await import("./tasks.ts");
  const { STEP } = await import("./trennen.ts");
  const { LESSONS } = await import("../lessons.tsx");
  const names = new Set<string>(Object.values(STEP).map(f => f()));
  const opts = new Set<string>();
  for (let k = 0; k < 200; k++) {
    const t = GENS.trennReihe();
    if (t.kind === "mc") t.options.forEach(o => opts.add(o));
  }
  const lesson = LESSONS[5].steps.flatMap(st => [st.ask ?? "", ...(st.lines ?? []), ...(st.options ?? [])]).join(" ");
  setLang("de", false);
  expect([...names].sort()).toEqual(["Dissolve", "Evaporate", "Filter", "Magnet", "Sieve"]);
  expect([...opts].filter(o => o.split(" → ").some(s => !names.has(s)))).toEqual([]);
  expect([...opts].filter(o => o.length > 40)).toEqual([]);
  for (const n of ["**Dissolve**", "**Filter**", "**Evaporate**", "Magnet"]) expect(lesson).toContain(n);
});
