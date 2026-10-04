// Register aller Module. Reihenfolge = Reihenfolge der Kacheln in der Übersicht.
// Ein neues Modul: Ordner modules/<id> mit src/index.tsx (export const modul), hier eintragen, als Abhängigkeit in package.json.
// scripts/check-architecture.mjs prüft, dass Register und Ordner übereinstimmen.

import type { LernModule } from "@lern/ui";
import { modul as gemische } from "@edi/gemische";
import { modul as atombau } from "@edi/atombau";
import { modul as ionenbindung } from "@edi/ionenbindung";
import { modul as elektronenpaarbindung } from "@edi/elektronenpaarbindung";
import { modul as reaktionsgleichungen } from "@edi/reaktionsgleichungen";
import { modul as neutralisation } from "@edi/neutralisation";
import { modul as einheiten } from "@edi/einheiten";
import { modul as organik } from "@edi/organik";
import { modul as polymere } from "@edi/polymere";

export const MODULES: readonly LernModule[] = [gemische, atombau, ionenbindung, elektronenpaarbindung, reaktionsgleichungen, neutralisation, organik, polymere, einheiten];

export const moduleById = (id: string): LernModule | undefined => MODULES.find(m => m.id === id);
