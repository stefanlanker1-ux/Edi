// Beschreibung des Moduls für die App-Hülle. Der Inhalt (entry.tsx) wird erst beim Öffnen geladen.

import type { LernModule } from "@lern/ui";
import { Card } from "./card.tsx";

export const modul: LernModule = {
  id: "gemische",
  name: "Gemische",
  desc: "Reinstoffe und Gemische im Teilchenmodell: Teilchen, Elemente und Verbindungen zählen, homogen und heterogen – an zehn Beispielen.",
  storage: ["gemische-v1", "gemische-quiz"],
  Card,
  load: () => import("./entry.tsx"),
};
