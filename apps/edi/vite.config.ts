import { appConfig } from "../../scripts/app-vite.ts";

export default appConfig(
  {
    name: "Edi – Lern-Apps für Chemie und Einheiten",
    shortName: "Edi",
    description: "Lern-Apps für den Unterricht: Gemische, Atombau, Ionenbindung, Elektronenpaarbindung, Reaktionsgleichungen, Neutralisation, Einheiten umrechnen.",
  },
  // frühere Adressen …/<modul>/ leiten auf #/<modul> weiter; entfernte Apps auf das passende Modul bzw. die Übersicht
  { legacy: ["atombau", "ionenbindung", "elektronenpaarbindung", "reaktionsgleichungen", "neutralisation", "einheiten",
    { from: "reinstoffe", to: "gemische" }, { from: "saeuren-basen", to: "" }, { from: "stoffmenge", to: "" }] },
);
