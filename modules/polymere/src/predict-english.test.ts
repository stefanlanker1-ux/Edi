// Vorhersage in der Atom-Ansicht auf Englisch: keine deutschen Reste (Namen der Monomere werden beim Laden übersetzt).
import { test, expect } from "vitest";
import { setLang } from "@lern/i18n";

test("Vorhersage auf Englisch ohne deutsche Reste", async () => {
  setLang("en", false);
  const { predict } = await import("./chem/mech/predict.ts");
  const { makeMech, nextAuto } = await import("./chem/mech/index.ts");
  const { METHODS, STEPS, VINYLS } = await import("./chem/data.ts");
  const texts = new Set<string>();
  const recipes = [
    ...VINYLS.flatMap(v => METHODS.map(m => ({ art: "poly" as const, a: v.id as string, method: m.id }))),
    ...(["kond", "add"] as const).flatMap(art => { const ms = STEPS.filter(s => s.arts.includes(art)).map(s => s.id as string); return ms.flatMap(a => [{ art, a }, ...ms.filter(b => b !== a).map(b => ({ art, a, b }))]); }),
  ];
  for (const r of recipes) {
    const m = makeMech(r), acts: string[] = [];
    for (let k = 0; k < 8; k++) {
      for (const a of m.actions()) { const p = predict(r, acts, a.id); if (p) for (const s of [p.ask, p.ok, ...p.options.flatMap(o => [o.text, o.why ?? ""])]) texts.add(s); }
      const id = nextAuto(m, r);
      if (!id) break;
      m.run(id); acts.push(id);
    }
  }
  setLang("de", false);
  expect(texts.size).toBeGreaterThan(60);
  expect([...texts].filter(s => /[äöüÄÖÜß„]/.test(s))).toEqual([]);
}, 120_000);
