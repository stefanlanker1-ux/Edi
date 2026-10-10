# Offene Punkte

Technische und didaktische Verbesserungen, die noch nicht umgesetzt sind – wichtigste zuerst. Keine Termine, keine Namen.
Claude erinnert zu Beginn jeder Sitzung kurz an die obersten Punkte (siehe `CLAUDE.md`). Ein erledigter Punkt wird **im selben Commit gestrichen**,
in dem er umgesetzt ist; was daraus als dauerhafte Regel folgt, kommt nach `docs/entwicklung.md` bzw. `modules/<id>/CLAUDE.md`.

## Arbeitsweise
1. **Aufträge mit Abnahmekriterium.** Größere Aufträge und Läufe ohne Aufsicht brauchen ein „fertig, wenn …“ und einen Stopp
   (z. B. „Kapitel 3: Der Schüler-Agent löst mit leerem Speicher mindestens 8 von 10 Aufgaben ohne Raten. Danach aufhören.“).
   Ohne Kriterium wird endlos an Kleinigkeiten nachgebessert.
2. **Fachliche Stichproben durch die Lehrkraft.** Alle Prüf-Agenten sind dasselbe Modell und haben dieselben blinden Flecken. Fachliche Entscheidungen
   und Vereinfachungen regelmäßig selbst lesen, statt nur Agenten-Berichte.

## Fachlich und didaktisch
3. **Polarität C–Cl entscheiden.** Mit Allred-Rochow und ΔEN ≥ 0,5 gilt C–Cl (ΔEN 0,33) als kaum polar; dadurch fällt CCl₄ als Beispiel
   „polare Bindungen, unpolares Molekül“ weg, und Chlormethan ist aus der Auswahl genommen (`modules/elektronenpaarbindung/src/quiz/tasks.ts`).
   Entweder C–Halogen als polar zählen oder die Abweichung vom Schulbuch in der Erklärung benennen.
4. **Reaktionsgleichungen an `@lern/quiz` anbinden**: Gleichungen per Generator statt 3 × 10 fest, Wiederholung und Stolpersteine,
   dazu eine Aufgabe „Welche Änderung ist erlaubt?“ mit der Falle Index statt Koeffizient (die häufigste Fehlvorstellung kann derzeit nicht auftreten).
5. **Zweiter Versuch im Quiz**: nach einer falschen Auswahl die Rückmeldung zeigen und einen zweiten Versuch ohne Punkte erlauben, statt sofort die Lösung.
6. **„Sicher“ erst nach Treffern an zwei verschiedenen Tagen** (bisher 2 Treffer in Folge, oft in derselben Runde). Dazu ein „Heute fällig“
   über alle Module auf der Übersicht, mit gemischten Aufgaben aus verschiedenen Modulen.
7. **Schwierigkeit nach Fertigkeitsstufe** innerhalb eines Aufgabentyps (Atombau erst Z ≤ 10, Organik erst kurze Ketten, Neutralisation erst Salze 1 : 1).
8. **Begründen und Übertragen (AFB III)**: Begründungen aus Satzbausteinen („weil …, daher …“), Aufgaben mit unbekannten Alltagskontexten.
9. **Einheiten: Stolpersteine mit Schlüssel** – `misconceptions.ts` hat nur 3 Einträge, die meisten Rückmeldungen laufen ohne Schlüssel
   (fehlen z. B. „Zeit zehnerbasiert“, „Vorsilbe falsch“).
10. **Für die Lehrkraft** (ohne Tracking): Adressen bis zum Level (`#/atombau/us-2`), druckbare Aufgabenblätter mit Lösung aus den Generatoren.
11. **Inhaltliche Lücken**: Zwischenmolekulare Kräfte (Polarität → Siedetemperatur, Löslichkeit, Bezug zu Gemische); Neutralisation Level II mit
    H₃O⁺, Protonenübergang, Indikator und pH; eine Einführung „Chemische Reaktion“ vor dem Ausgleichen.

## Technik
12. **ESLint** mit `typescript-eslint` und `eslint-plugin-react-hooks` einrichten und in `check.yml` aufnehmen. Die 15 vorhandenen
    `eslint-disable`-Kommentare einzeln prüfen (ein Linter lief bisher nie).
13. **`scripts/check-ui.mjs` in CI** (Playwright-Job gegen `npm run site`), mindestens für Pull-Requests auf `main`. Bisher läuft die UI-Prüfung nur von Hand.
14. **Quiz-Speicher absichern**: `packages/quiz/src/store.ts` hat `version: 1`, aber kein `migrate` und keine Prüfung der gespeicherten Daten.
    Gemeinsamer Helfer für versionierte Speicher mit Tests je Migration – bevor sich das Format zum ersten Mal ändert.
15. **Testlaufzeit senken**: `npm test` dauert 6–7 min (Gemische allein über 2 min). Vitest-Projekte in einem Lauf, kürzere Physik-Simulationen
    in Tests, Zufall mit festem Startwert statt `Math.random`.
16. **Tastatur**: antippbare SVG-Teile ohne Tastaturbedienung (z. B. `Beaker.tsx`, `Beads.tsx`) – gemeinsamer Baustein nach dem Muster
    von `LewisSvg.tsx` (`role="button"`, `tabIndex`, Enter/Leertaste); Fokus auf die neue Frage, wenn die Quiz-Aufgabe wechselt.
17. **Typen im Quiz**: `BaseTask.kind` ist nur `string`, daher `as unknown as McTask` in `QuizScreen.tsx`. Type Guard `isMc()` und ein typisiertes
    Modul-Quiz-Interface (`satisfies`).
18. **Gemeinsame Testhelfer**: `english.test.ts`, `guide-english.test.ts` und `plain.test.ts` sind in jedem Modul fast gleich – Helfer in `@lern/quiz`.
19. **Große Dateien aufteilen**, wenn sie ohnehin geändert werden: `QuizScreen.tsx`, `modules/polymere/src/quiz/tasks.ts` (statische Aufgaben als Daten),
    `stepFlow` in `modules/gemische/src/flow.ts`.

## Doku
20. **Kürzen statt nur verschieben**: `modules/gemische/CLAUDE.md`, `modules/polymere/CLAUDE.md` (je 32 KB) und der Abschnitt „Regeln“ in
    `docs/entwicklung.md` (26 KB) auf das kürzen, was man nicht aus dem Code ablesen kann. Vor dem Commit zeigen, was wegfällt.
