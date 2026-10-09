// Kapitel im Bereich „Lernen“: Erklärung und Aufgaben in einem Fluss (25 Folien in Abschnitten, mindestens die Hälfte Modell-Folien).

import type { GuideDef } from "@lern/ui";
import type { Stufe } from "../store.ts";

export interface Kapitel {
  /** Kennung (Speicher des Fortschritts) – nie umbenennen */
  id: string;
  /** Nummer in der Übersicht (fortlaufend über beide Stufen) */
  nr: number;
  stufe: Stufe;
  title: string;
  /** ein Satz: was man in diesem Kapitel lernt */
  desc: string;
  /** Folien: 25 Schritte in Abschnitten (`part`) zu höchstens 8 */
  def: GuideDef;
  /** Hilfsmittel „Erklärung“: Merksätze je Abschnitt (gleiche Anzahl wie Abschnitte, `**fett**` erlaubt) – nennen Regeln mit Beispiel, nie die Antwort einer Folie */
  explain: string[][];
  /** noch in Arbeit: Prüfungen der fertigen Kapitel gelten noch nicht */
  draft?: boolean;
}
