// Beschreibung des Moduls für die App-Hülle. Der Inhalt (entry.tsx) wird erst beim Öffnen geladen.

import type { LernModule } from "@lern/ui";
import { Card } from "./card.tsx";

export const modul: LernModule = {
  id: "einheiten",
  name: "Einheiten umrechnen",
  desc: "Länge, Fläche, Volumen, Masse, Zeit bis km/h, g/cm³ und kWh – immer mit demselben Rechenweg an der Tafel und Stellenwerttafel.",
  nameEn: "Unit Conversion",
  descEn: "Length, area, volume, mass, time up to km/h, g/cm³ and kWh – always the same method on the board and the place value chart.",
  storage: ["einheiten-v1", "einheiten-quiz"],
  Card,
  load: () => import("./entry.tsx"),
};
