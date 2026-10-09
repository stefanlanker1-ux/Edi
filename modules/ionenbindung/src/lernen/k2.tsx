// Kapitel 2: Formel und Name – in Arbeit (Platzhalter).

import { tr } from "@lern/i18n";
import type { Kapitel } from "./types.ts";

export const kapitel2 = (): Kapitel => ({
  id: "formel-name", nr: 2, stufe: "us", draft: true,
  title: tr("Formel und Name", "Formula and name"),
  desc: tr("Ladungen ausgleichen, die Formel aufstellen und das Salz benennen.", "Balance charges, write the formula and name the salt."),
  def: {
    title: tr("Formel und Name", "Formula and name"),
    steps: [{ mode: "worked", ask: tr("Dieses Kapitel entsteht gerade.", "This chapter is being written."), lines: ["…"], ok: "…" }],
    outro: ["…"],
  },
  explain: [["…"]],
});
