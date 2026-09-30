// Beschreibung des Moduls für die App-Hülle. Der Inhalt (entry.tsx) wird erst beim Öffnen geladen.

import type { LernModule } from "@lern/ui";
import { Card } from "./card.tsx";

export const modul: LernModule = {
  id: "ionenbindung",
  name: "Ionenbindung",
  desc: "Ionenformeln mit Bausteinen aufstellen: Ladungen ausgleichen, vom Atom zum Ion, Namen von Salzen.",
  storage: ["ionenbindung-v1", "ionenbindung-quiz"],
  Card,
  load: () => import("./entry.tsx"),
};
