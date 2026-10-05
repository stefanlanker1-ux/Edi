// Statuszeile der Werkbank: einmal gemischt bleibt gemischt (bis „Von vorn“), auch wenn die Verteilung kurz schwankt
import { test, expect } from "vitest";
import { statusOf, type Info } from "./MixView.tsx";
import { EXAMPLES } from "../mixtures.ts";

const info = (mixed: boolean, walls = 0): Info => ({ bound: 0, gas: 0, eq: 0, aq: 0, opened: false, sep: false, walls, melt: false, busy: false, mixed, t: 0 });

test("Alkohol und Gase: nach dem ersten „gemischt“ springt die Anzeige nicht zurück", () => {
  for (const id of ["alkohol", "schutzgas", "erdgas", "modell"]) {
    const ex = EXAMPLES.find(e => e.id === id)!;
    expect(statusOf(ex, info(false), undefined).join(" ")).toMatch(/mischt sich/);
    // gemischt nach 4 s, danach zufällig ungleich verteilt: bleibt „gemischt in 4 s“
    expect(statusOf(ex, info(false), 240).join(" ")).toMatch(/gemischt in 4 s/);
    expect(statusOf(ex, info(true), 240).join(" ")).toMatch(/gemischt in 4 s/);
  }
});
