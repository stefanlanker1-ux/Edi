// Beschreibung des Moduls für die App-Hülle. Der Inhalt (entry.tsx) wird erst beim Öffnen geladen.

import type { LernModule } from "@lern/ui";
import { Card } from "./card.tsx";

export const modul: LernModule = {
  id: "ionenbindung",
  name: "Ionenbindung",
  desc: "Lernen in Kapiteln mit Modellen zum Ausprobieren: vom Atom zum Ion, Formeln und Namen von Salzen, Ionengitter.",
  nameEn: "Ionic Bonds",
  descEn: "Learn in chapters with models to try out: from atom to ion, formulas and names of salts, ionic lattice.",
  storage: ["ionenbindung-v1", "ionenbindung-quiz", "ionenbindung-lernen"],
  Card,
  load: () => import("./entry.tsx"),
};
