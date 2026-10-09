// Fehlvorstellungen (Stolpersteine) beim Benennen – Schlüssel für diagnostische Distraktoren und Fallen.
// Die Rückmeldungstexte stehen bei den Aufgaben (mit dem konkreten Molekül); hier nur der Name für Landkarte und Auswertung.
import { tr } from "@lern/i18n";

export const MISS: Record<string, string> = tr({
  "zaehlen": "C-Atome falsch gezählt",
  "kette-kurz": "Nicht die längste Kette gewählt",
  "alle-c": "Äste in die Hauptkette gezählt",
  "nummer": "Von der falschen Seite nummeriert",
  "stelle": "Gruppe an die falsche Stelle gesetzt",
  "alphabet": "Vorsilben nicht alphabetisch geordnet",
  "multi": "Gleiche Reste nicht mit di, tri zusammengefasst",
  "mehrfach-vergessen": "Doppel- oder Dreifachbindung übersehen",
  "en-in": "-en und -in verwechselt",
  "ez": "E und Z verwechselt",
  "endung": "Endung der Gruppe verwechselt",
  "c-gruppe": "C der Gruppe nicht mitgezählt",
  "prio": "Rangfolge der Gruppen verwechselt",
  "klasse": "Stoffklasse verwechselt",
  "ester-teile": "Säure- und Alkylteil des Esters vertauscht",
  "formel-lesen": "Name falsch in eine Formel übersetzt",
}, {
  "zaehlen": "Miscounted C atoms",
  "kette-kurz": "Did not choose the longest chain",
  "alle-c": "Counted branches into the main chain",
  "nummer": "Numbered from the wrong end",
  "stelle": "Put a group in the wrong place",
  "alphabet": "Prefixes not in alphabetical order",
  "multi": "Identical groups not combined with di, tri",
  "mehrfach-vergessen": "Missed a double or triple bond",
  "en-in": "Mixed up -ene and -yne",
  "ez": "Mixed up E and Z",
  "endung": "Mixed up the ending of the group",
  "c-gruppe": "Did not count the C of the group",
  "prio": "Mixed up the order of rank of the groups",
  "klasse": "Mixed up the compound class",
  "ester-teile": "Swapped the acid and alkyl parts of the ester",
  "formel-lesen": "Translated the name into the wrong formula",
});
