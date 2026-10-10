# Edi – Kurzfassung für Claude Code

Edi ist eine Lern-App für Chemie und Einheiten (Sekundarstufe; Unterstufe = „Level I“, Oberstufe = „Level II“) auf Handy, Tablet, Schul-PC und Beamer.
Eine App (`apps/edi`) mit Modulen (`modules/*`) auf gemeinsamen Paketen (`packages/*`), React 19 + TypeScript (strict) + Vite, zustand, npm-Workspaces.
Diese Datei ist die Kurzfassung. Bei Widerspruch gilt `docs/entwicklung.md`.

## Wo was steht
- `CLAUDE.md` (diese Datei): Arbeitsweise, Befehle, Zweige, die Regeln, die nie verletzt werden dürfen.
- `docs/entwicklung.md`: alle allgemeinen Regeln. **Nicht ganz lesen**, sondern die Abschnitte, die die Aufgabe berührt:
  Texte, Aufgaben, Rückmeldungen → „Didaktik“; Erklärung oder Lektion → „Erklärung“; Oberfläche, Bilder, Quiz-Technik → „Regeln“;
  neues Paket oder Modul → „Architektur“; vor dem Commit → „Prüfen vor dem Commit“.
- `modules/<id>/CLAUDE.md`: Stand, Aufbau und fachliche Entscheidungen eines Moduls. Lädt automatisch, sobald im Modulordner gearbeitet wird.
  Wer an `packages/*` arbeitet, liest die `CLAUDE.md` der Module, die den geänderten Baustein nutzen.
- `docs/offen.md`: offene Verbesserungen, wichtigste zuerst.
- `docs/agenten.md`: Rollen und Ablauf, wenn mehrere Agenten zusammenarbeiten.
- `docs/verlauf.md`: früherer Änderungsverlauf, nur Archiv – nicht lesen, außer die Aufgabe fragt nach der Geschichte. Sonst `git log`.

## Arbeitsweise
- **Zu Beginn jeder Sitzung** in ein, zwei Sätzen an die obersten offenen Punkte aus `docs/offen.md` erinnern – vor allem an solche,
  die zur Aufgabe passen. Erledigte Punkte im selben Commit aus `docs/offen.md` streichen.
- **Abnahmekriterium**: Hat ein größerer Auftrag kein „fertig, wenn …“, zu Beginn eines vorschlagen und danach arbeiten. Ist es erreicht, aufhören.
- Gespräch auf **Deutsch**, kurz und konkret. Bei längeren Arbeiten zwischendurch in ein, zwei Sätzen sagen, woran gerade gearbeitet wird.
- Nur am erteilten Auftrag arbeiten. Keine selbstständigen Folgeaufträge, Routinen oder Weckrufe.
- Rückfragen nur, wenn eine Entscheidung wirklich offen ist; sonst die naheliegende Lösung umsetzen und im Bericht nennen.
- Fachliche Einwände zuerst fachlich prüfen. Ist die Darstellung richtig, nichts ändern und kurz begründen; ist sie falsch, beheben und einen Test ergänzen.
- Wird ein Regelverstoß gemeldet, **alle Module** auf dieselbe Art Fehler prüfen und, wo möglich, eine automatische Prüfung ergänzen.
- Am Ende ehrlich berichten: was geändert wurde, was im Browser geprüft wurde, ob veröffentlicht ist – auch wenn etwas nicht geklappt hat.
  „Erledigt“ nur für das, was im Code steht und geprüft ist.

## Befehle (im Hauptordner)
```bash
npm install                      # einmalig
npm run dev                      # App im Browser, http://localhost:5173/#/<modul>
npm run typecheck                # ca. 25 s
npm test                         # Architektur-Prüfung + alle Tests, ca. 6–7 min (Gemische allein über 2 min)
npm test -w @edi/<id>            # nur ein Modul (z. B. @edi/atombau), bzw. -w @lern/<paket>
npm run build
npm run site                     # Website nach site/, Grundlage für die Browser-Prüfung
node scripts/check-ui.mjs site   # Browser-Prüfung aller Ansichten; Varianten siehe „Prüfen vor dem Commit“
```

## Zweige und Veröffentlichen
- Entwickelt wird auf `entwicklung`. **Veröffentlichen** = `git push origin entwicklung` und `git push origin entwicklung:main`.
- Ein Push auf `main` startet `pages.yml` (Website) und `native.yml` (Android/iOS), sobald er `apps/`, `modules/`, `packages/`, `scripts/` oder die Build-Dateien ändert.
  Erst wenn beide Läufe für den neuen Commit grün sind, gilt etwas als veröffentlicht.
- Abgeschlossene, geprüfte Arbeit wird ohne Rückfrage veröffentlicht. **Halbfertiges** (Zwischenstand sichern) nur auf `entwicklung` pushen, nie auf `main` –
  was auf `main` liegt, sehen die Schülerinnen und Schüler.
- Im Zweifel lieber früh einen Zwischenstand auf `entwicklung` committen und pushen, als ungesicherte Arbeit in der Sitzung liegen zu lassen.

## Nie ändern
Diese Fehler kosten den Fortschritt der Lernenden oder die App im Store und lassen sich nicht zurücknehmen:
- **localStorage-Schlüssel**, Tab-Kennungen und die **Adresse der Website** nie umbenennen (der Fortschritt hängt daran). Neues Speicherformat: alten Stand beim Laden übernehmen.
- **App-Kennung** `app.edi.lernen` nie ändern (Play Store und App Store sähen eine neue App).
- Schlüsseldateien (`*.p12`, `*.jks`, `*.keystore`) und Passwörter nie ins Repository, nie in Logs, nie im Gespräch abfragen.
- Keine externen Dienste, Tracker, Konten oder nachgeladenen Fremdinhalte; Daten nur lokal im Browser.
- **Anonym**: keine Namen, E-Mail-Adressen, Schulen, Orte oder Konten in Dateien, Kommentaren, Commits, Testdaten oder Bildern.
- Keine fremden Texte, Aufgaben oder Grafiken übernehmen.

## Architektur in drei Sätzen
- Abhängigkeiten nur nach unten: `apps/edi` → `modules/<id>` → `packages/*`. Kein Modul kennt ein anderes; `scripts/check-architecture.mjs` prüft das bei `npm test`.
- Was mehr als ein Modul braucht, gehört nach `packages/` (spätestens beim zweiten Modul, nie kopieren).
- Änderungen an `packages/*` nur neutral oder per Schalter (opt-in) für das betroffene Modul, und dann in **allen** Modulen prüfen, die den Baustein nutzen.

## Die wichtigsten Regeln für Inhalte (Details: entwicklung.md „Didaktik“)
- **Gelöste Beispiele, dann Hilfe ausblenden**: vorgemacht → halb gelöst → selbst. Nie mit freiem Entdecken beginnen.
- **Begriffe fett einführen, bevor sie gebraucht werden** (in Erklärung, Erklärkarte oder früherem Modul). `checkGuide` prüft Erklärungen; Quiz-Texte selbst durchsehen.
- **Natürliche Sprache**: ganze Sätze wie eine gute Lehrkraft, Du-Form, höchstens 22 Wörter je Satz. Keine Stichwortketten mit Doppelpunkt und Pfeil,
  keine Klammer-Rechnungen mit Ladungen im Fließtext, keine schiefen Gleichnisse. Muster: Ionenbindung „Lernen“.
- **Rückmeldung**: „Noch nicht“ statt „falsch“; erst der Denkfehler mit den Zahlen der Aufgabe, dann der richtige Weg. Jede falsche Antwort steht für eine Fehlvorstellung.
- **Experimentieren stellt nie Fragen** und vergibt keine Punkte; Fragen und Rückmeldungen nur in Üben bzw. Lernen.
- **Fachlich richtig geht vor einfach**. Vereinfachungen im Modell benennen, nie Falsches zeigen. Stoffe immer mit Name und Formel.
- **Zwei Sprachen**: jeder sichtbare Text als `tr("Deutsch", "English")`, auch in Daten; Fachnamen englisch nach IUPAC.

## Die wichtigsten Regeln für die Oberfläche (Details: entwicklung.md „Regeln“)
- **Nie scrollen**: jede Ansicht füllt genau den Bildschirm. **Nichts wandert**: Bilder und Leisten bleiben beim Bedienen an ihrem Platz.
- Tippziele ≥ 44 px, Lesetext ≥ 14 px, richtig/falsch nie nur über Farbe, Tastatur bedienbar.
- Swiss Style: Farben nur über Design-Tokens (`packages/ui/src/styles/tokens.css`), ein Rot nur als Auszeichnung, keine Verläufe und Schatten.
- **Grafiken von Anfang an sorgfältig**: fachlich richtig wie im Labor, flüssig, zu mehreren Zeitpunkten rendern und die Screenshots selbst ansehen, bevor etwas gezeigt wird.
- Prüfgrößen: 390 × 844, 375 × 667, 360 × 740 und Desktop.

## Dokumentieren
- Jede relevante Änderung passt **im selben Commit** die betroffene Regel in `docs/entwicklung.md` bzw. die `modules/<id>/CLAUDE.md` an.
- Diese Dateien beschreiben den **aktuellen Stand**, keine Geschichte: veraltete Sätze ersetzen statt ergänzen. Kein Änderungsverlauf in Dateien.
- Fachliche Entscheidungen, die man aus dem Code nicht erraten kann, mit einem Satz Begründung in die `CLAUDE.md` des Moduls
  (z. B. „Polarität nach Allred-Rochow, Schwelle ΔEN ≥ 0,5“) – sonst baut die nächste Sitzung sie womöglich wieder um.
- Diese `CLAUDE.md` kurz halten (unter 200 Zeilen). Neue Einzelheiten gehören nach `docs/entwicklung.md` oder zum Modul, nicht hierher.

## Commits
- Auf Deutsch, rein technisch. **Ein Thema je Commit** (ein Modul bzw. eine Sache), damit sich jede Änderung einzeln zurücknehmen lässt.
- Erste Zeile höchstens etwa 72 Zeichen: `<Modul oder Paket>: <was geändert wurde>`. Darunter eine Leerzeile und in ein bis drei Sätzen **warum**.
- Keine Zusatzzeilen (keine Mitwirkenden-, Sitzungs- oder Werkzeughinweise), keine Namen.

## Vor jedem Commit
1. Zwischenstände auf `entwicklung`: `npm run typecheck` und die Tests der berührten Workspaces (`npm test -w @edi/<id>`; bei `packages/*` alle Module,
   die den Baustein nutzen). **Vor dem Veröffentlichen auf `main`**: `npm run typecheck && npm test && npm run build` – alles grün.
2. Bei Änderungen an der Oberfläche: `npm run site`, `node scripts/check-ui.mjs site` und gezielt im Browser prüfen, was geändert wurde
   (Aufgabe richtig **und** falsch lösen, Blätter öffnen, Animationen bis zum Ende, Screenshots ansehen). Einzelheiten: „Prüfen vor dem Commit“.
3. Regel bzw. Modul-`CLAUDE.md` angepasst, Commit-Nachricht mit Begründung.

## Lange Sitzungen
Beim Verdichten des Gesprächs immer behalten: den Auftrag, die Liste der geänderten Dateien, getroffene Entscheidungen, offene Punkte
und ob der Stand schon committet und gepusht ist.
