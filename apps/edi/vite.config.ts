import { appConfig } from "../../scripts/app-vite.ts";

export default appConfig(
  {
    name: "Edi – Lern-Apps für Chemie und Einheiten",
    shortName: "Edi",
    description: "Lern-Apps für den Unterricht: Atombau, Ionenbindung, Elektronenpaarbindung, Reaktionsgleichungen, Neutralisation, Einheiten umrechnen.",
  },
  // frühere Adressen …/<modul>/ leiten auf #/<modul> weiter
  { legacy: ["atombau", "ionenbindung", "elektronenpaarbindung", "reaktionsgleichungen", "neutralisation", "einheiten"] },
);
