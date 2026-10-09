// Kapitel 1: Vom Atom zum Ion – in Arbeit (Platzhalter).

import { tr } from "@lern/i18n";
import type { Kapitel } from "./types.ts";

export const kapitel1 = (): Kapitel => ({
  id: "atom-ion", nr: 1, stufe: "us", draft: true,
  title: tr("Vom Atom zum Ion", "From atom to ion"),
  desc: tr("Wie aus Atomen Ionen werden: Elektronen abgeben und aufnehmen, Ladung aus dem PSE.", "How atoms become ions: losing and gaining electrons, charge from the periodic table."),
  def: {
    title: tr("Vom Atom zum Ion", "From atom to ion"),
    steps: [{ mode: "worked", ask: tr("Dieses Kapitel entsteht gerade.", "This chapter is being written."), lines: ["…"], ok: "…" }],
    outro: ["…"],
  },
  explain: [["…"]],
});
