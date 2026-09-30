// Beschreibung des Moduls für die App-Hülle. Der Inhalt (entry.tsx) wird erst beim Öffnen geladen.

import type { LernModule } from "@lern/ui";
import { Card } from "./card.tsx";

export const modul: LernModule = {
  id: "atombau",
  name: "Atombau",
  desc: "Atome aus Protonen, Neutronen und Elektronen bauen, das Periodensystem entdecken und im Quiz üben.",
  storage: ["atombau-v3", "atombau-quiz"],
  Card,
  load: () => import("./entry.tsx"),
};
