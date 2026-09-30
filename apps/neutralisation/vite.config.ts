/// <reference types="vitest/config" />
import { appConfig } from "../../scripts/app-vite.ts";

export default appConfig({
  name: "Neutralisation – Lauge + Säure → Salz + Wasser",
  shortName: "Neutralisation",
  description: "Neutralisation mit Ionen-Bausteinen: H⁺ und OH⁻ werden zu Wasser, der Rest ist das Salz – für Unter- und Oberstufe.",
});
