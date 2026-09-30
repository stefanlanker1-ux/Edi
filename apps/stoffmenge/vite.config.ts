/// <reference types="vitest/config" />
import { appConfig } from "../../scripts/app-vite.ts";

export default appConfig({
  name: "Stoffmenge – mol rechnen",
  shortName: "Stoffmenge",
  description: "Molare Masse aus dem PSE, n = m / M, Teilchenzahl und Gasvolumen: ausprobieren und im Quiz üben.",
});
