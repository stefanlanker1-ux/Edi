// Fehlvorstellungen (Stolpersteine) zur Ionenbindung – Schlüssel für diagnostische Distraktoren und Fallen im Baukasten.
// Die Rückmeldungstexte stehen bei den Aufgaben (mit den konkreten Ionen); hier nur der Name für Landkarte und Auswertung.
import { tr } from "@lern/i18n";

const MISS_DE: Record<string, string> = {
  "ion-gegenteil": "Metall als Anion / Nichtmetall als Kation",
  "auffuellen-statt-abgeben": "Metall füllt auf statt abzugeben",
  "abgeben-statt-aufnehmen": "Nichtmetall gibt ab statt aufzunehmen",
  "ladung-verzaehlt": "Ladung um 1 verzählt",
  "ionen-1zu1": "Immer ein Kation und ein Anion (wie ein Molekül)",
  "ladungen-ungleich": "Ladungen nicht ausgeglichen (Reihen ungleich lang)",
  "anzahl-eigene-ladung": "Anzahl = eigene Ladung statt Ladung des Partners",
  "nicht-gekuerzt": "Verhältnis nicht gekürzt",
  "indizes-vertauscht": "Index = eigene Ladung (Indizes vertauscht)",
  "klammer-vergessen": "Klammer bei mehratomigen Ionen vergessen",
  "endung-id-at": "Endungen -id / -at / -it verwechselt",
  "roemisch-falsch": "Römische Zahl: Anzahl statt Ladung des Metall-Ions",
  "ladung-vorzeichen": "Vorzeichen der Ladung verdreht",
  "ladung-aus-index": "Ladung aus dem Index abgelesen",
  "gesamtladung-nicht-geteilt": "Gesamtladung nicht auf die Metall-Ionen aufgeteilt",
  "anion-ladung": "Ladung des Anions statt des Metall-Ions",
};
const MISS_EN: Record<string, string> = {
  "ion-gegenteil": "Metal as anion / non-metal as cation",
  "auffuellen-statt-abgeben": "Metal gains instead of losing electrons",
  "abgeben-statt-aufnehmen": "Non-metal loses instead of gaining electrons",
  "ladung-verzaehlt": "Charge off by 1",
  "ionen-1zu1": "Always one cation and one anion (like a molecule)",
  "ladungen-ungleich": "Charges not balanced (rows of different length)",
  "anzahl-eigene-ladung": "Number = own charge instead of partner's charge",
  "nicht-gekuerzt": "Ratio not simplified",
  "indizes-vertauscht": "Subscript = own charge (subscripts swapped)",
  "klammer-vergessen": "Brackets forgotten for polyatomic ions",
  "endung-id-at": "Endings -ide / -ate / -ite confused",
  "roemisch-falsch": "Roman numeral: number instead of charge of the metal ion",
  "ladung-vorzeichen": "Sign of the charge reversed",
  "ladung-aus-index": "Charge read from the subscript",
  "gesamtladung-nicht-geteilt": "Total charge not shared among the metal ions",
  "anion-ladung": "Charge of the anion instead of the metal ion",
};
export const MISS = tr(MISS_DE, MISS_EN);
