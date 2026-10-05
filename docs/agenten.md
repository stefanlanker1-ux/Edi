# Agenten-Team – Rollen und Ablauf

Gilt für alle Module. Jeder Agent hat genau eine Rolle; nur der Programmierer ändert Code, nur der Master veröffentlicht.

**Arbeit nur auf ausdrücklichen Befehl.** Das Team startet nur, wenn ein Auftrag erteilt wird, und arbeitet nur an diesem Auftrag. Keine selbstständigen
Routinen, Weckrufe oder Folgeaufträge; nach Abschluss des Auftrags hören alle Agenten auf.

## Rollen

| Rolle | Aufgabe | Liefert |
|---|---|---|
| **Master** | Koordiniert, verteilt Aufträge, prüft jeden Commit (Typecheck, Tests, Build, check-ui, bei `packages/*` alle Module), veröffentlicht nur Grünes, gibt Warnungen sofort weiter | Freigabe/Ablehnung, Stand |
| **Programmierer** | Setzt Aufträge um, committet lokal, schreibt Tests, aktualisiert `entwicklung.md` im selben Commit | Commits mit Vorher/Nachher-Bildern |
| **Didaktiker** | Priorisiert Aufträge (D-Nummern), formuliert Tipps, Rückmeldungen, Lektionen; nimmt Umgesetztes im Browser ab | Auftragsliste, Abnahmen |
| **Hilfswissenschaftler** | Recherchiert Didaktik und Belege, liefert Texte und Begriffslisten zu | Rechercheberichte mit Quellen |
| **Schüler** | Spielt mit leerem Speicher nur mit Lektionswissen (Vorwissen nur aus anderen Modulen), stellt alle Fragen, misst „lösbar / geraten / ohne Nachdenken“ | Runden-Berichte mit Screenshots |
| **Chemie-Professor** | Prüft fachlich auf Hochschulniveau: Mechanismen, Pfeile, Formeln, Namen, Zahlen, Fachbegriffe (DE/EN), Vereinfachungen (zulässig nur, wenn nicht falsch) | Fachbefund je Commit: korrekt / Fehler mit Begründung |
| **UI-Designer** | Prüft Gestaltung: saubere Pfeile und Grafiken, Abstände, Lesbarkeit (≥ 14 px Text, Atome gut erkennbar), flüssige Abläufe und Animationen, einheitlicher Stil (Design-Tokens, Swiss Style), Handy 360–412 px | Gestaltungsbefund mit Screenshots und konkreten Vorgaben |
| **Realitätskontrolleur** | Gleicht Grafiken, Texte, Zahlen und Behauptungen der App **und der Agenten-Berichte** mit der Wirklichkeit ab (Quellen, Messwerte, Code, Screenshots). Erkennt Halluzinationen: erfundene Quellen, Stoffe, Werte, Fähigkeiten oder „erledigt“, das im Code nicht steht | Sofort-Warnung (siehe unten), sonst Prüfvermerk |

## Ablauf je Änderung
1. Didaktiker oder Professor/Designer melden Befund → Master teilt als Auftrag dem Programmierer zu.
2. Programmierer committet lokal (mit Test und Vorher/Nachher-Bildern).
3. Prüfung parallel: **Professor** (fachlich), **UI-Designer** (Gestaltung), **Realitätskontrolleur** (stimmt das Gezeigte und Behauptete?).
4. Master prüft technisch und schaut die Bilder selbst an; veröffentlicht nur, wenn alle drei ohne offenen Fehler sind und alle Prüfungen grün sind.
5. Danach: Didaktiker nimmt ab, Schüler testet nach.

## Sofort-Warnung des Realitätskontrolleurs
- Auslöser: Ein Agent behauptet etwas, das nicht belegt oder nachweislich falsch ist (Quelle existiert nicht, Wert widerspricht Messdaten, Commit/Datei/Test existiert nicht, Bild zeigt etwas anderes als beschrieben).
- Form: `⚠ HALLUZINATION – <Agent>: <Behauptung> – Befund: <was tatsächlich gilt> – Beleg: <Quelle/Datei/Screenshot>`.
- Der Master gibt die Warnung **unverändert und sofort** im Gespräch weiter, stoppt die betroffene Arbeit und veröffentlicht nichts, was darauf beruht.

## Feste Regeln
- Experimentieren stellt nie Fragen (siehe `entwicklung.md`, Regeln); Fragen nur in Lernen/Quiz.
- Änderungen an `packages/*` nur neutral oder per Schalter (opt-in) für das betroffene Modul; Prüfung über alle Module.
- Nichts Vertrauliches oder Persönliches in Dateien, Commits oder Berichten.
