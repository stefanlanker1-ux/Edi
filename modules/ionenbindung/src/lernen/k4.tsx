// Kapitel 4: Ionen aus mehreren Atomen – in Arbeit (Platzhalter).

import { tr } from "@lern/i18n";
import type { Kapitel } from "./types.ts";

export const kapitel4 = (): Kapitel => ({
  id: "mehratomig", nr: 4, stufe: "os", draft: true,
  title: tr("Ionen aus mehreren Atomen", "Ions made of several atoms"),
  desc: tr("Mehratomige Ionen erkennen, benennen und in Formeln mit Klammern einsetzen.", "Recognise and name polyatomic ions and use them in formulas with brackets."),
  def: {
    title: tr("Ionen aus mehreren Atomen", "Ions made of several atoms"),
    steps: [{ mode: "worked", ask: tr("Dieses Kapitel entsteht gerade.", "This chapter is being written."), lines: ["…"], ok: "…" }],
    outro: ["…"],
  },
  explain: [["…"]],
});
