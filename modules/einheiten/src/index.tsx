// Beschreibung des Moduls für die App-Hülle. Der Inhalt (entry.tsx) wird erst beim Öffnen geladen.

import type { LernModule } from "@lern/ui";
import { Card } from "./card.tsx";

export const modul: LernModule = {
  id: "einheiten",
  name: "Einheiten umrechnen",
  desc: "Länge, Fläche, Volumen, Masse, Zeit bis km/h, g/cm³ und kWh – immer mit demselben Rechenweg an der Tafel und Stellenwerttafel.",
  storage: ["einheiten-v1", "einheiten-quiz"],
  Card,
  load: () => import("./entry.tsx"),
};
