// Kapitel 5: Nebengruppenmetalle – in Arbeit (Platzhalter).

import { tr } from "@lern/i18n";
import type { Kapitel } from "./types.ts";

export const kapitel5 = (): Kapitel => ({
  id: "nebengruppen", nr: 5, stufe: "os", draft: true,
  title: tr("Nebengruppenmetalle", "Transition metals"),
  desc: tr("Metalle mit mehreren möglichen Ladungen: römische Zahlen im Namen, Ladung aus der Formel.", "Metals with several possible charges: Roman numerals in the name, charge from the formula."),
  def: {
    title: tr("Nebengruppenmetalle", "Transition metals"),
    steps: [{ mode: "worked", ask: tr("Dieses Kapitel entsteht gerade.", "This chapter is being written."), lines: ["…"], ok: "…" }],
    outro: ["…"],
  },
  explain: [["…"]],
});
