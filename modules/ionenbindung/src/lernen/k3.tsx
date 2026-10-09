// Kapitel 3: Ionengitter und Eigenschaften – in Arbeit (Platzhalter).

import { tr } from "@lern/i18n";
import type { Kapitel } from "./types.ts";

export const kapitel3 = (): Kapitel => ({
  id: "gitter", nr: 3, stufe: "us", draft: true,
  title: tr("Ionengitter und Eigenschaften", "Ionic lattice and properties"),
  desc: tr("Was die Ionen zusammenhält und warum Salze hart, spröde und schwer schmelzbar sind.", "What holds the ions together and why salts are hard, brittle and hard to melt."),
  def: {
    title: tr("Ionengitter und Eigenschaften", "Ionic lattice and properties"),
    steps: [{ mode: "worked", ask: tr("Dieses Kapitel entsteht gerade.", "This chapter is being written."), lines: ["…"], ok: "…" }],
    outro: ["…"],
  },
  explain: [["…"]],
});
