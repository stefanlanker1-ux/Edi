// Beschreibung des Moduls für die App-Hülle. Der Inhalt (entry.tsx) wird erst beim Öffnen geladen.

import type { LernModule } from "@lern/ui";
import { Card } from "./card.tsx";

export const modul: LernModule = {
  id: "gemische",
  name: "Gemische",
  desc: "Reinstoffe und Gemische im Teilchenmodell: Teilchen, Elemente und Verbindungen zählen, homogen und heterogen – an zehn Beispielen.",
  nameEn: "Mixtures",
  descEn: "Pure substances and mixtures in the particle model: count particles, elements and compounds, homogeneous and heterogeneous – with ten examples.",
  storage: ["gemische-v1", "gemische-quiz"],
  Card,
  load: () => import("./entry.tsx"),
};
