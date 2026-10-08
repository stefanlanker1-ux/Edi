// Beschreibung des Moduls für die App-Hülle. Der Inhalt (entry.tsx) wird erst beim Öffnen geladen.

import type { LernModule } from "@lern/ui";
import { Card } from "./card.tsx";

export const modul: LernModule = {
  id: "reaktionsgleichungen",
  name: "Reaktionsgleichungen",
  desc: "Gleichungen ausgleichen: Zahlen vor die Stoffe setzen, bis links und rechts gleich viele Atome stehen – mit Teilchenbild und Ablauf als Animation.",
  nameEn: "Chemical Equations",
  descEn: "Balance equations: put numbers in front of the substances until both sides have the same atoms – with a particle model and the reaction as an animation.",
  storage: ["reaktionsgleichungen-v2", "reaktionsgleichungen-ueben"],
  Card,
  load: () => import("./entry.tsx"),
};
