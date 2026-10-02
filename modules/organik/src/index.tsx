// Beschreibung des Moduls für die App-Hülle. Der Inhalt (entry.tsx) wird erst beim Öffnen geladen.

import type { LernModule } from "@lern/ui";
import { Card } from "./card.tsx";

export const modul: LernModule = {
  id: "organik",
  name: "Nomenklatur",
  desc: "Organische Verbindungen zeichnen und benennen: Hauptkette, funktionelle Gruppen, Nummerierung – Name nach IUPAC mit Lösungsweg.",
  nameEn: "Nomenclature",
  descEn: "Draw and name organic compounds: main chain, functional groups, numbering – IUPAC name with solution steps.",
  storage: ["organik-v1", "organik-quiz"],
  Card,
  load: () => import("./entry.tsx"),
};
