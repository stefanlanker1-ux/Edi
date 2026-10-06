// Beschreibung des Moduls für die App-Hülle. Der Inhalt (entry.tsx) wird erst beim Öffnen geladen.

import type { LernModule } from "@lern/ui";
import { Card } from "./card.tsx";

export const modul: LernModule = {
  id: "reaktionsgleichungen",
  name: "Reaktionsgleichungen",
  desc: "Gleichungen ausgleichen mit der Atombilanz: Kästchen je Atom links und rechts, Koeffizienten setzen, bis jedes Element ✓ zeigt.",
  nameEn: "Chemical Equations",
  descEn: "Balance equations with the atom balance: boxes for each atom on the left and right, set coefficients until every element shows ✓.",
  storage: ["reaktionsgleichungen-v2", "reaktionsgleichungen-ueben"],
  Card,
  load: () => import("./entry.tsx"),
};
