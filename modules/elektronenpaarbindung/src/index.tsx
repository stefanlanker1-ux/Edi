// Beschreibung des Moduls für die App-Hülle. Der Inhalt (entry.tsx) wird erst beim Öffnen geladen.

import type { LernModule } from "@lern/ui";
import { Card } from "./card.tsx";

export const modul: LernModule = {
  id: "elektronenpaarbindung",
  name: "Elektronenpaarbindung",
  desc: "Moleküle per Drag & Drop aus Lewis-Atomen bauen: gemeinsame Elektronenpaare, Oktettregel, Valenzstrichformel.",
  nameEn: "Covalent Bonds",
  descEn: "Build molecules from Lewis atoms by drag and drop: shared electron pairs, octet rule, Lewis structure.",
  storage: ["elektronenpaar-v1", "elektronenpaar-quiz"],
  Card,
  load: () => import("./entry.tsx"),
};
