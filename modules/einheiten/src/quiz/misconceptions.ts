// Stolpersteine beim Umrechnen (Eingabe-Aufgaben): Schlüssel der Fallen und ihr Name für die Landkarte der Fertigkeiten.
import { tr } from "@lern/i18n";

export const MISS: Record<string, string> = tr<Record<string, string>>({
  gegenrichtung: "Mal und geteilt vertauscht (Gegenrichtung)",
  "komma-verschoben": "Komma eine Stelle zu weit (Faktor 10)",
  laengenfaktor: "Bei Fläche oder Volumen wie bei Längen gerechnet",
}, {
  gegenrichtung: "Multiply and divide swapped (wrong direction)",
  "komma-verschoben": "Decimal point one place off (factor 10)",
  laengenfaktor: "Area or volume converted like a length",
});
