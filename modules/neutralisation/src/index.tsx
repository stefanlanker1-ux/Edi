// Beschreibung des Moduls für die App-Hülle. Der Inhalt (entry.tsx) wird erst beim Öffnen geladen.

import type { LernModule } from "@lern/ui";
import { Card } from "./card.tsx";

export const modul: LernModule = {
  id: "neutralisation",
  name: "Neutralisation",
  desc: "Lauge + Säure → Salz + Wasser mit Ionen-Bausteinen: jedes H⁺ trifft ein OH⁻, der Rest ist das Salz – mit allen Säuren der Tabelle.",
  nameEn: "Neutralisation",
  descEn: "Alkali + acid → salt + water with ion tiles: every H⁺ meets an OH⁻, the rest is the salt – with all acids of the table.",
  storage: ["neutralisation-v1", "neutralisation-quiz"],
  Card,
  load: () => import("./entry.tsx"),
};
