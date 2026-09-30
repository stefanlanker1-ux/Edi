// Vertrag zwischen der App-Hülle (apps/edi) und den Modulen (modules/*).
// Jedes Modul exportiert aus seiner index.tsx genau eine Beschreibung `modul: LernModule`.
// Die Hülle kennt nur diese Beschreibung; den eigentlichen Inhalt lädt sie erst beim Öffnen (`load`).

import { createContext, type ComponentType } from "react";

export interface LernModule {
  /** Kennung: Teil der Adresse (#/atombau) und Geltungsbereich der Modul-Stile (<html data-modul="atombau">) */
  id: string;
  /** Name in Übersicht und Fenstertitel */
  name: string;
  /** ein Satz für die Übersicht (Tooltip, Vorlesen) */
  desc: string;
  /** localStorage-Schlüssel des Moduls – nie umbenennen ohne Übernahme des alten Stands */
  storage: string[];
  /** Bild auf der Kachel der Übersicht (klein, wird sofort geladen) */
  Card: ComponentType;
  /** lädt den Inhalt bei Bedarf (eigene Datei im Build) */
  load: () => Promise<{ default: ComponentType }>;
}

/** Link zur Übersicht (Logo in der Kopfzeile); ohne Hülle kein Link */
export const HomeLink = createContext<string | undefined>(undefined);
