// Beschreibung des Moduls für die App-Hülle. Der Inhalt (entry.tsx) wird erst beim Öffnen geladen.

import type { LernModule } from "@lern/ui";
import { Card } from "./card.tsx";

export const modul: LernModule = {
  id: "polymere",
  name: "Polymere",
  desc: "Kunststoffe selbst herstellen: Polymerisation, Polykondensation und Polyaddition – in Atomen und als Kügelchen, Schritt für Schritt.",
  nameEn: "Polymers",
  descEn: "Make plastics yourself: polymerisation, polycondensation and polyaddition – in atoms and as beads, step by step.",
  storage: ["polymere-v1", "polymere-quiz"],
  Card,
  load: () => import("./entry.tsx"),
};
