# Entwicklung – Regeln und Konventionen

Dieses Dokument ist die vollständige Arbeitsgrundlage. Wer (Mensch oder Assistent) neu an diesem Repository arbeitet, liest es **ganz**, bevor er etwas ändert –
danach soll keine weitere Erklärung nötig sein. Es beschreibt, wie gearbeitet wird, welche didaktischen und gestalterischen Regeln gelten und wie jedes Modul
aufgebaut ist. Neue Anforderungen werden **hier** als neutral formulierte Regel ergänzt (was die App tun soll und warum), sobald sie umgesetzt sind.

**Pflicht bei jeder relevanten Änderung** (neue Funktion, geänderte Regel, didaktische Entscheidung, behobener Fachfehler, neue Prüfung):
1. die betroffene Regel bzw. den Modul-Abschnitt in diesem Dokument anpassen (der Text beschreibt immer den **aktuellen** Stand), und
2. einen Eintrag im **Änderungsverlauf** am Ende ergänzen (neueste oben: was geändert wurde und warum, mit Modul und Commit),
im selben Commit wie die Änderung. So entsteht ein lückenloser Verlauf, und eine neue Sitzung kennt Stand und Geschichte ohne weitere Erklärung.
Einträge anonym und rein technisch (keine Namen, Adressen, Daten zu Personen, keine Begründung mit Personen wie „gewünscht von …“).

Modularer Monolith: **eine** App (`apps/edi`) mit Modulen (`modules/*`) auf gemeinsamen Paketen (`packages/*`), npm-Workspaces.
Pakete: `packages/chem` (reine Logik), `packages/units` (Einheiten, reine Logik), `packages/ui` (React-Designsystem), `packages/chem-ui` (Bohrmodell, Atomsymbol, Formel …),
`packages/quiz` (Quiz-Grundgerüst), `packages/i18n` (Sprache Deutsch/Englisch). Website: `npm run site` → `site/` (App, `edi-offline.html`, Weiterleitungen der früheren Adressen; GitHub Pages).
Zielgruppe: Schülerinnen und Schüler (Unterstufe = „Level I“, Oberstufe = „Level II“) auf Handy, Tablet, Schul-PC und Beamer. Sprache der Oberfläche: Deutsch (Englisch umschaltbar).

Module in der Übersicht (Reihenfolge = empfohlene Lernreihenfolge, `apps/edi/src/modules.ts`):
Gemische → Atombau → Ionenbindung → Elektronenpaarbindung → Reaktionsgleichungen → Neutralisation → Nomenklatur (`organik`) → Polymere → Einheiten (unabhängig von der Chemie).
Begriffe, die ein früheres Modul einführt, gelten in späteren Modulen als bekannt (siehe „Begriffe einführen“).

## Arbeitsweise (für jede Sitzung)
- **Gespräch auf Deutsch**, kurz und konkret. Bei längeren Arbeiten zwischendurch in ein, zwei Sätzen sagen, woran gerade gearbeitet wird.
  Am Ende: was geändert wurde, was im Browser geprüft wurde, ob veröffentlicht ist – ehrlich, auch wenn etwas nicht geklappt hat.
- Rückfragen nur, wenn eine Entscheidung wirklich offen ist; sonst die naheliegende Lösung umsetzen und im Bericht nennen.
- Fachliche Einwände (z. B. „Müsste X nicht anders sein?“) zuerst fachlich prüfen. Ist die Darstellung richtig, nichts ändern, sondern kurz begründen;
  ist sie falsch, beheben und einen Test ergänzen, der den Fehler künftig findet.
- Wird eine Regel verletzt gemeldet (z. B. „Begriff nicht eingeführt“), nicht nur die gemeldete Stelle ändern: **alle Module** auf dieselbe Art Fehler prüfen
  und, wo möglich, eine automatische Prüfung (Test, `checkGuide`) ergänzen.
- **Zweige:** Entwickelt wird auf `entwicklung`. Veröffentlichen = beide Zweige pushen: `git push origin entwicklung` und `git push origin entwicklung:main`.
  Ein Push auf `main` startet die Workflows „App auf GitHub Pages veröffentlichen“ (`pages.yml`: typecheck, test, site, Deploy) und „Android- und iOS-App bauen“
  (`native.yml`: Debug-APK als Artefakt, iOS-Simulator-Build). Erst wenn beide Läufe für den neuen Commit grün sind, gilt etwas als veröffentlicht.
  Pull-Requests laufen durch `check.yml` (typecheck, test, build).
- Abgeschlossene, geprüfte Arbeiten werden ohne weitere Rückfrage veröffentlicht. Größere Aufträge über mehrere Module: je Modul fertigstellen, prüfen, veröffentlichen.
- **Grafiken von Anfang an sorgfältig und schön** (Pflicht, gilt für jede neue oder geänderte Zeichnung, Animation und jedes Teilchenbild – nicht erst nach Rückmeldung):
  - **Fachlich und gegenständlich richtig wie im Labor**: Geräte so zeichnen, wie man sie kennt (Sieb mit Maschen und Lücken, Destillation mit Rundkolben,
    Thermometer am Abzweig, Liebig-Kühler mit Kühlwasser im Gegenstrom, Vorlage; Chromatografie mit abgedecktem Gefäß, Startlinie, Laufmittelfront).
    Was ein Verfahren ausmacht, muss im Bild **sichtbar passieren** (Körner fallen durch die Lücken, Temperatur steigt und bleibt beim Sieden stehen,
    ein schwarzer Punkt läuft in seine Farbstoffe auseinander) – nie nur angedeutet.
  - **Detailreich, aber klar**: lieber eine Zeichnung mehr Mühe als eine Skizze; Bewegungen flüssig und physikalisch plausibel (Fallen beschleunigt,
    Teilchen bleiben erhalten, nichts springt). Beschriftungen, Legenden und Messwerte dort, wo sie das Verstehen erleichtern.
  - **Selbst prüfen, bevor etwas gezeigt wird**: jede Zeichnung zu mehreren Zeitpunkten rendern (z. B. t = 0 / 0,15 / 0,35 / 0,6 / 1) und die Screenshots
    kritisch ansehen: Würde eine Lehrkraft das Gerät sofort erkennen? Sieht ein Schüler, was passiert? Wirkt es hochwertig? Wenn nicht: nachbessern, bevor veröffentlicht wird.
  - Stil bleibt der der App (Linien statt Flächen, Farben nur aus der Palette), aber „schlicht“ heißt nie „lieblos“.
- **Vor jedem Commit** (Pflicht): `npm run typecheck && npm test && npm run build`. Bei Änderungen an der Oberfläche zusätzlich `npm run site` und Browser-Prüfung
  (siehe „Prüfen vor dem Commit“) – in allen betroffenen Ansichten, Werkzeugen, Blättern, Erklärungen und Quizaufgaben, in den Größen 390 × 844, 375 × 667, 360 × 740 und Desktop.
  Screenshots ansehen, nicht nur Zahlen messen (leere Bilder, abgeschnittene Formeln, zu kleine Zeichnungen fallen nur so auf).
- **Dokumentation gehört zur Änderung**: Regel/Modul-Abschnitt aktualisieren und Änderungsverlauf ergänzen (siehe oben) – ein Commit ohne Doku-Anpassung ist nur bei
  reinen Korrekturen ohne neue Regel erlaubt.
- **Commit-Nachrichten** auf Deutsch, rein technisch, Form „<Modul oder Paket>: <was geändert wurde>“ (mehrere Punkte mit Strichpunkt).
  Keine Zusatzzeilen (keine Mitwirkenden-, Sitzungs- oder Werkzeughinweise), keine Namen.
- **Android-Release** (`release.yml`, nur von Hand gestartet, Eingabe Versionsname): baut ein signiertes App-Bundle (AAB) als Artefakt; `versionCode` = Laufnummer des Workflows
  (steigt automatisch). Signatur aus den Repository-Secrets `UPLOAD_KEYSTORE_BASE64` (Keystore als Base64) und `UPLOAD_KEYSTORE_PASSWORD`;
  `apps/edi/android/app/build.gradle` liest `UPLOAD_KEYSTORE_FILE`/`UPLOAD_KEYSTORE_PASSWORD`, `VERSION_CODE`, `VERSION_NAME` aus der Umgebung.
  Schlüsseldateien (`*.p12`, `*.jks`, `*.keystore`) und Passwörter **nie** ins Repository (`.gitignore`), nie in Logs, nie im Gespräch abfragen.
- App-Kennung `app.edi.lernen` (Capacitor `appId`, Android `applicationId`/`namespace`/Paket von `MainActivity`, iOS Bundle-ID) **nie ändern** –
  der Play Store bzw. App Store würde sie als neue App behandeln. Keine persönlichen Namen in Kennungen.
- App-Icons: Vorlage `apps/edi/assets/` bzw. `public/icons/icon-512.png`; native Icons mit `npx @capacitor/assets generate` (im Ordner `apps/edi`).
- Hilfsskripte für einmalige Browser-Prüfungen gehören nicht ins Repository (temporär außerhalb anlegen); dauerhaft nützliche Prüfungen als Test oder in `scripts/`.

## Didaktik (verbindlich für alle Module)
- **Lernen an gelösten Beispielen, dann Hilfe ausblenden** – überall nach demselben Muster: zuerst ein **fertig gelöster Fall** (vorgemacht, Lösungsweg Schritt für Schritt),
  dann ein **halb gelöster** (eine Lücke zum Ergänzen), dann **selbst lösen** – und mit dem nächsten Gedanken wieder von vorn (vorgemacht → halb → frei → vorgemacht …).
  Nie mit freiem Entdecken beginnen. Umsetzung:
  - Erklärung: Schrittarten `worked` / `faded` / `free` (siehe „Erklärung“), automatisch geprüft.
  - Quiz: vor der ersten Aufgabe einer noch nie geübten Fertigkeit ein gelöstes Beispiel, die nächste Aufgabe zeigt den ersten Schritt (siehe „Quiz“).
  - Werkbank: Start mit einem gelösten Zustand bzw. abnehmender Hilfe (Gemische „Zählen“: Beispiel 1–2 vorgerechnet, 3–5 eine Lücke, ab 6 selbst;
    Ionenbindung startet mit fertigem CaCl₂; Nomenklatur startet mit gezeichnetem und benanntem Beispiel).
- **Begriffe einführen, bevor sie gebraucht werden.** Jedes Fachwort, das in einer Frage, Antwort, einem Tipp oder einer Rückmeldung vorkommt, muss vorher
  **fett** eingeführt sein – in der Erklärung, in der Erklärkarte des Quiz-Levels oder in einem früheren Modul. Nie ein Wort wie „Gemenge“, „Alken“ oder „Stoffklasse“
  benutzen, ohne es mit Beispiel zu erklären („**Gemenge**: feste Stoffe gemischt, z. B. Müsli“). Begriffe aus früheren Modulen oder dem Alltag in `GuideDef.known`.
  `checkGuide` prüft das für Erklärungen automatisch; für Quiz und Erklärkarten beim Ändern selbst prüfen (alle Texte einer Runde durchsehen).
- **Einheitliche Fachsprache** in Werkbank, Erklärung, Quiz, Erklärkarten und Lösungsweg (ein Begriff, nie zwei für dasselbe; z. B. „Äste“, nicht „Seitenketten“).
- **Einfache Sprache**: kurze Sätze (höchstens 22 Wörter, geprüft), Du-Form, aktiv, ein Gedanke pro Satz. Keine Erklärsätze in der Oberfläche (nur kurze `Tag`s);
  Erklärungen gehören in Erklärung, Erklärkarten, Tipps und Rückmeldungen.
- **Ohne Schuld und Beschämung**: „Noch nicht“ statt „Leider falsch“, keine Ranglisten, keine Vergleiche mit anderen. Jede Rückmeldung zu einem Fehler
  nennt den Denkfehler und zeigt den richtigen Weg.
- **Diagnostische Distraktoren**: jede falsche Antwort steht für eine typische Fehlvorstellung und bekommt eine eigene Rückmeldung mit den Zahlen der Aufgabe.
- **Tipps und Hilfsmittel verraten die Lösung nie** (PSE nur mit Angaben eines gedruckten PSE; keine Animation, die die gesuchten Zahlen zeigt, vor der Antwort).
- **Stoffe immer mit Name und Formel**: Schüler kennen die Stoffe noch nicht. Jeder genannte Stoff steht mit Formel da („Methan CH₄“, „Helium He“,
  „Wasser H₂O“), und unter jedem Teilchenbild einer Lektion steht eine Legende (Teilchen + Name + Formel), damit klar ist, welches Teilchen zu welchem Stoff gehört.
- **Grafik statt Eintippen**: Aufgaben möglichst mit Bildern lösen – auswählen (auch Bildkarten), im Bild antippen, sortieren. Zahlen und Text
  nur ausnahmsweise eintippen lassen; Zählaufgaben als Auswahl mit diagnostischen Zahlen (aufsteigend). Erklärungen und Aufgaben zeigen den Vorgang als Bild
  oder Animation (z. B. jedes Trennverfahren animiert).
- **Visualisierung auf Abruf**: Animationen und Zusatzansichten (Ablauf einer Reaktion, 3D, Lupe) nicht aufdrängen – ein Knopf öffnet sie; reduzierte Bewegung respektieren
  (`useReducedMotion`: dann gleich das Endbild).
- **Modell ehrlich kennzeichnen**: Vereinfachungen im Modell benennen („nur im Modell“, „im Modell verstärkt“), fachlich nie Falsches zeigen. Fachliche Richtigkeit
  geht vor Einfachheit (z. B. Wasser nie linear, häufigstes Isotop statt gerundeter Masse).
- **Nicht überladen**: Funktionen nur dort, wo sie gebraucht werden; Oberstufen-Inhalte nur in Level II; ein Hauptknopf je Ansicht.
- **Üben mit Abstand** (verteilte Wiederholung, Fertigkeiten-Stufen, „Heute fällig“, „Schwächen üben“, Prüfungstermin) – siehe „Quiz“.
- **Barrierearm**: richtig/falsch nie nur über Farbe (zusätzlich ✓/✗, Muster, gestrichelt), Tippziele ≥ 44 px, Tastatur bedienbar, `aria-label` für Bilder und Knöpfe,
  Schalter „Lesbar“ (mehr Abstände), Klang standardmäßig aus, Vorlesen im Quiz.

## Lernprinzipien, Motivation, Oberfläche (Begründung der Regeln)
Die Regeln oben folgen gut belegten Wirkprinzipien. Bei neuen Funktionen danach entscheiden:
- **Abrufen schlägt Wiederlesen**: Üben (Quiz) ist der Hauptweg, Erklärungen sind kurz und enden immer mit einer Frage oder Handlung.
- **Verteilt üben**: Wiederholung je Fertigkeit nach 1-3-7-14-30 Tagen, nach Fehlern früher; ein Prüfungstermin zieht Fälligkeiten vor.
- **Verschränkt üben**: Aufgabentypen in einer Runde mischen, nie zehnmal dasselbe; „Alles gemischt“ ist ein vollwertiger Modus.
- **Rückmeldung erklärt, statt nur zu bewerten**: nach Fehlern Begründung und Lösungsweg (Blatt), nach Treffern nur kurze Bestätigung. Lob nennt die Strategie,
  nicht die Begabung („Du hast zuerst die Ladung gezählt – genau so.“).
- **Lösungsbeispiele mit Ausblenden** (vorgemacht → halb → selbst) und **Vorhersagen vor dem Beobachten** (erst vermuten, dann Animation/Modell ansehen, dann erklären).
- **Wenig fremde Last**: eine Bühne, ein Bereich, keine Erklärsätze in der Oberfläche, Rot nur für das Wesentliche, Inhalte in kleine Abschnitte geteilt.
- **Drei Ebenen der Chemie**: jede Darstellung verbindet zwei Ebenen – Stoff/Alltag ↔ Teilchen ↔ Symbol (Bohrmodell ↔ Atomsymbol, Ionenwand ↔ Formel,
  Lewis ↔ 3D, Teilchenbild ↔ Gleichung, Becherglas ↔ Lupe). Nie nur auf der Symbolebene bleiben.
- **Fehlvorstellungen sind der Inhalt**: typische Schülerfehler (Atom „will“ ein Oktett, Ionen als Moleküle, Elektronen „wandern“ bei der Ionenbindung, gelöster Stoff
  verschwindet …) werden gezielt als falsche Antworten angeboten und in der Rückmeldung beim Namen genannt.
- **Meisterschaft statt Durchlauf**: Fertigkeiten-Stufen neu → geübt → sicher → gemeistert, sichtbar auf der Landkarte; Fortschritt ist der wichtigste Motivator.
- **Kurze Einheiten**: Runde = 10 Aufgaben (einige Minuten), jederzeit unterbrechbar (Stand bleibt beim Neuladen erhalten); erster Erfolg in der ersten Minute
  (keine Anmeldung, keine Einführungsfolien – die App öffnet direkt mit etwas zum Tun).
- **Motivation ohne Manipulation**: Fortschritt statt Punktejagd (Punkte nur innerhalb einer Runde), Wochenziel (3 Runden) statt Tagesserie, Rückkehr wird freundlich
  begrüßt, keine Ranglisten, keine Ligen, keine „Leben“, keine Verlust- oder Schuldnachrichten, kein Zeitdruck, keine leidende Figur, keine Werbung, keine Konten,
  keine Tracker. Abschluss jeder Runde: Trefferquote, Zeit, neu erreichte Stufen, häufigster Stolperstein.
- **Selbstbestimmung**: Thema, Level und „Schwächen üben“ sind Angebote, keine Pflicht.
- **Zugänglichkeit**: Kontrast ≥ 4,5 : 1, Zeilenabstand großzügig, keine Kursivschrift im Fließtext, Bewegung reduzierbar, Vorlesen der Aufgaben, „Lesbar“ (größere
  Abstände), einfache Sprache (Fachwort + Alltagswort), richtig/falsch nie nur über Farbe.
- **Ein Aha-Moment je Modul** (3D-Molekül drehen, Teilchen in Bewegung, Reaktion als Animation, Orbitale in 3D) – aber immer auf Abruf, nie als Pflicht.

## Prüfmethoden (bewährt)
- **Richtig lösen im Browser**: jede Aufgabenart jedes Levels (beide Stufen) im Browser richtig beantworten – muss ✓ geben (fängt Fehler zwischen Daten und Antwortform).
- **Falsch lösen**: jede falsche Auswahl liefert eine Rückmeldung, nach den Fehlversuchen erscheint die Lösung, nichts läuft über.
- **Lernende über mehrere Tage** (simulierte Uhr): Fehler am nächsten Morgen fällig, dann nach 3 und 7 Tagen; Wochenziel zählt; Neuladen mitten in der Runde setzt
  bei derselben Aufgabe fort; Stufenwechsel verliert nichts; Zurück-Taste schließt jedes Blatt.
- **Erklärungen durchspielen** (alle Schritte, alle Größen), **Animationen** bis zum Ende laufen lassen und Zwischenbilder ansehen (Sprünge, Zittern, Überlappungen).
- **Texte durchsehen**: alle erzeugten Texte einer Runde ausgeben und lesen (Grammatik, Einzahl/Mehrzahl, Artikel, nicht eingeführte Begriffe, englische Fassung).
- Neue Prüfungen, die einen echten Fehler gefunden haben, als Test ins Repository übernehmen.

## Erklärung (`@lern/ui` `Guide`, je Modul `src/guide.tsx`)
- „Erklärung“ ist der erste Eintrag der Bereichsleiste (siehe „Bereichsleiste“), rotes Abspiel-Zeichen; roter Ring um das Zeichen, bis die Erklärung einmal ganz durchlaufen
  ist (`lern-erklaert-<App>`). Ganzer Bildschirm, nie scrollen. Jedes Modul übergibt `guide` an `LernApp` (je Stufe eigene Erklärung, Funktion `guideFor(stufe)` bzw. `GUIDE`).
- Aufbau: `GuideDef { title, steps, outro, known? }`. 10–48 Schritte; ab 16 Schritten in **Kapiteln** (`part` am ersten Schritt, Name im Kopf, Fortschrittsbalken in Abschnitten),
  jedes Kapitel höchstens 8 Schritte. Ende: Zusammenfassung „Das kannst du jetzt“ (`outro`), Knopf „Zum Quiz“. Inhalte decken alle Aufgabentypen des Quiz der Stufe ab.
- **Schrittarten** (`mode`, Pflicht bei jedem Schritt; Kennzeichen oben: „Vorgemacht“ / „Halb gelöst – ergänze“ / „Jetzt du“):
  - `worked`: Lösungsweg `lines` erscheint Zeile für Zeile („Nächster Schritt“), Bild im gelösten Zustand, **keine** Antwort, keine `options`/`num`/`why`/`tip`, Pflicht `ok`.
  - `faded`: Lösungsweg mit **genau einer Lücke** `{?}`; die Lücke darf die gesuchte Zahl nicht schon enthalten; nach dem Lösen wird sie gefüllt.
  - `free`: selbst lösen; `lines` (optional) erscheinen erst nach der richtigen Antwort.
  - Reihenfolge: jedes Kapitel (und der erste Schritt) beginnt `worked`; `faded` nur nach `worked`/`faded`; `free` nur nach `faded`/`free`.
- Jeder nicht vorgemachte Schritt verlangt eine Handlung: Auswahl (`options`), Zahl (`num`, mit Einheit) oder ein Ziel im Bild antippen (`visual` ruft `pick(id)`),
  mit den Bausteinen der App (Bohrmodell, PSE, Ionenwand, Lewis-Formel, Teilchenbild, Pfeilkette, Orbitale in 3D …).
  Falsch → Rückmeldung zum Denkfehler (`why`, **jede** falsche Auswahl hat eine), sonst Denkanstoß zum Vorgehen (`tip`, Pflicht bei Zahl und Antippen, nennt die Lösung nicht);
  ab dem 2. Versuch Rückmeldung + Tipp, dazu „Versuch x von 4“; nach 4 Versuchen wird die Lösung markiert (`show`, gestrichelt grün, pulsierend) und muss selbst angetippt werden.
  Richtig → ✓, der Schritt bleibt stehen, die Bestätigung (`ok`) nennt die Regel mit dem Beispiel („Massenzahl = Protonen + Neutronen = 7 + 7 = 14“), nicht nur das Ergebnis.
- Neue Ideen in `say` (ein, zwei kurze Sätze), Auftrag in `ask`. Fachwörter beim ersten Auftreten **fett** (das ist zugleich die Einführung für die Begriffsprüfung).
- Beschriftung mit Pfeilen (`labels`, Baustein `Callouts`): Begriff am Rand, Pfeil auf ein Teil des Bildes (CSS-Selektor, z. B. `.bohr .nuc`, `.lone.pair`,
  `[data-f="H2O"]`, `[data-el="O"]`, `.ion-tile.cation`, `.ms-box`); ohne `nth` das Teil, das der Seite am nächsten liegt; weicht Schrift im Bild aus (`AVOID`).
  Nie die gesuchte Antwort beschriften, außer mit `afterSolved` (erscheint erst nach der richtigen Antwort).
- Automatische Prüfung je Modul (`guide.test.ts`, `checkGuide` in `packages/ui/src/guideCheck.ts`): Schrittzahl und Kapitel, Reihenfolge der Schrittarten, Lösungsweg bzw. Lücke,
  Antwort unter den Auswahlen, Rückmeldung zu jeder falschen Auswahl, Tipp bei Zahl/Antippen (ohne die gesuchte Zahl), Sätze ≤ 22 Wörter,
  **Begriffe** (`unintroducedTerms`: ein abgefragtes Fachwort muss vorher fett stehen oder in `known`; falsche Auswahlen, die erst später eingeführt werden, dürfen nicht vorher vorkommen).
  Englische Fassung: `guide-english.test.ts` (alle Texte übersetzt, gleiche Struktur).
- Browser-Prüfung jeder geänderten Erklärung: alle Schritte durchspielen (auch Fehlversuche bis zur markierten Lösung), in jedem Schritt prüfen, dass nichts überläuft
  oder abgeschnitten ist, in 1240 × 860, 390 × 844 und 375 × 667.

## Grundsätze für Beiträge
- **Anonym**: keine personenbezogenen Daten im Repository (Namen, E-Mail-Adressen, Schulen, Orte, eigene Web-Adressen, Konten) – weder in Dateien, Kommentaren,
  Commit-Nachrichten, Testdaten, Bildern noch in Metadaten. Keine Hinweise darauf, wer etwas wünscht, plant oder entscheidet („Vorgabe …“, „Wunsch …“).
- Keine Planungs-, Strategie-, Geschäfts- oder Protokolldateien, keine Zeitpläne; das Repository enthält Quellcode, Tests und technische Dokumentation (dieses Dokument
  beschreibt nur, wie die App ist und sein soll).
- Commit-Nachrichten und Pull-Request-Texte rein technisch (was geändert wurde), ohne Zusatzzeilen zu Mitwirkenden oder Werkzeugen.
- Kommentare begründen fachlich oder technisch („übliche Schreibweise“), nie mit Vorlagen oder Quellen Dritter.
- Keine fremden Texte, Aufgaben oder Grafiken übernehmen; Aufgaben werden selbst erzeugt, Fachdaten sind allgemein bekannte Werte oder selbst berechnet.
- Keine externen Dienste, Tracker oder nachgeladenen Fremdinhalte; Daten nur lokal im Browser.

## Architektur
- Schichten, Abhängigkeiten nur nach unten: `apps/edi` (Hülle) → `modules/<id>` (`@edi/<id>`) → `packages/*` (`@lern/*`). Kein Modul kennt ein anderes;
  Gemeinsames wandert nach `packages/`. `scripts/check-architecture.mjs` (Teil von `npm test`) prüft: Module importieren nur eigene Dateien, `@lern/*`, react, zustand,
  `@fontsource/*`; Pakete kennen weder Module noch Hülle; Register = Ordner in `modules/`; Kennungen und Speicher-Schlüssel eindeutig; keine Regex-Lookbehinds.
- Modul = Ordner `modules/<id>` mit `src/index.tsx` → `export const modul: LernModule` (`@lern/ui` `modul.ts`: `id`, `name`, `desc`, `storage`, `Card`, `load`).
  `Card` = kleines Kachelbild der Übersicht (sofort geladen, nur Inline-Stile); `load: () => import("./entry.tsx")` = Inhalt, eigene Datei im Build, erst beim Öffnen geladen
  (danach im Hintergrund vorgeladen, damit es offline sofort geht). `entry.tsx` importiert `app.css` (und Schriften) und exportiert `App` als `default`.
- Neues Modul: Ordner anlegen (package.json `@edi/<id>`, tsconfig wie die anderen), in `apps/edi/src/modules.ts` und `apps/edi/package.json` eintragen, `npm install`.
- Adressen: `#/<id>` (Hash, funktioniert auf GitHub Pages, in der Offline-Datei und in Capacitor gleich). Hülle `apps/edi/src/Shell.tsx`: setzt `<html data-modul="<id>">`
  und den Fenstertitel, liefert `HomeLink` (Logo → Übersicht), fängt Ladefehler ab („Neu laden“). Unbekannte Adresse → Übersicht.
- Stile: CSS unter `modules/<id>/src/` gilt nur im offenen Modul (`scripts/modul-scope.ts`, PostCSS: `:root` → `:root:where([data-modul=id])`, sonst
  `:where(:root[data-modul=id]) …`, ohne zusätzliche Spezifität). Stile der Hülle (`apps/edi/src/shell.css`) nur mit Präfix `ov-`/`edi-`; Pakete mit `ui-` bzw. eigenem Präfix.
- Gespeichert wird je Modul unter eigenen localStorage-Schlüsseln (`storage` im Modul). **Schlüssel nie umbenennen** und **Adresse der Website nie ändern** –
  sonst ist der Fortschritt der Lernenden weg (localStorage gehört zur Adresse). Neue Version eines Speicherformats: alten Stand beim Laden übernehmen.
- Ein Service Worker, eine Offline-Datei, eine Capacitor-Konfiguration (`apps/edi`). Frühere Einzel-Apps unter `…/<id>/`: der Build erzeugt dort eine Weiterleitung
  auf `#/<id>` und ein `sw.js`, das den alten Service Worker samt Speicher abmeldet (`legacy` in `apps/edi/vite.config.ts`, nicht entfernen).
- Browser-Unterstützung: Safari/iOS ab 16, Chrome/Android ab 107 (Vite-Standardziel); keine Regex-Lookbehinds (iOS < 16.4).

## Regeln
- Jedes Modul hat nur zwei Arten von Ansichten: **Experimentieren** (Werkbank: selbst bauen, zeichnen, vorgegebene Beispiele lösen) und **Quiz**, dazu die **Erklärung**
  als Vollbild. Keine eigenen Übungsseiten.
- **Bereichsleiste in allen Modulen gleich** (Handy unten, ab 900 px oben in der Kopfzeile): **Erklärung | Quiz | Experimentieren** (Atombau zusätzlich „Periodensystem“/„PSE“
  dahinter). Alle Einträge gleich gestaltet (Zeichen + Wort, aktiver Bereich mit rotem Strich); „Erklärung“ öffnet die Erklärung (kein eigener Bereich) und ist dort
  in `AppShell` (`guide`) eingebaut. Der Werkbank-Bereich heißt immer „Experimentieren“ („Experiment“ auf Englisch) mit Zeichen Becherglas (`beaker`),
  egal ob gebaut, gezeichnet, umgerechnet oder ausgeglichen wird; Reihenfolge der Tabs in `App.tsx`: `quiz`, dann der Werkbank-Bereich (Kennung unverändert, z. B. `build`,
  `probieren`, `start` – Kennungen und Speicher-Schlüssel nie umbenennen). Der beim Öffnen gezeigte Bereich bleibt die Werkbank.
- **Lernen statt Erklärung + Quiz** (Gemische und Polymere, Übertragung auf weitere Module folgt): Leiste **Lernen | Experimentieren**. „Lernen“ (Tab-Kennung `quiz`,
  Zeichen Buch) zeigt die **Kapitel** wie die Level-Auswahl des Quiz. Ein Kapitel ist **ein Fluss**: beim ersten Antippen zuerst die **Lektion** des Kapitels
  (geführte Erklärung, vorgemacht → halb gelöst → selbst, 3–12 Schritte, `checkGuide(def, { lesson: true })`), „Zu den Aufgaben“ startet direkt die zehn Aufgaben.
  Danach startet das Kapitel gleich mit den Aufgaben; das Buch-Zeichen neben der Kapitelkarte wiederholt die Lektion. Technisch: `QuizScreen` Prop
  `lesson: (level) => GuideDef`, erledigte Lektionen in localStorage `LESSON_KEY` (`lern-lektionen`, in `storage` des Moduls eintragen). Kein eigener Eintrag
  „Erklärung“ mehr (LernApp ohne `guide`). Fertigkeiten, Wiederholung, „Heute fällig“, „Schwächen üben“, Landkarte und Prüfungstermin bleiben unverändert.
- React 19 + TypeScript (strict) + Vite. State mit zustand. Keine weiteren UI-Frameworks.
- Gemeinsames gehört in `packages/`; Module importieren `@lern/*` (Quelltext wird direkt gebündelt, kein eigener Build-Schritt für Pakete).
- **Erklärung** je Modul und Stufe: Regeln im Abschnitt „Erklärung“ oben (vorgemacht → halb gelöst → selbst, Begriffe fett einführen, automatisch geprüft).
- Alle Module nutzen für das Quiz `@lern/quiz` (`createQuizStore` + `QuizScreen`); Aufgaben sind reine Daten, Aufgabentyp = Fertigkeit.
  Optional: Level mit Tipp (`QuizLevel.tip` = Glühbirne an der Karte, Aufgabe `hintCue` = Tipp-Knopf hervorgehoben, Tipp kostet keine Punkte) und feste Reihenfolge (`fixedOrder`).
  Fertigkeiten (`skills.ts`): neu → geübt → sicher (2 Treffer in Folge) → gemeistert (Treffer nach ≥ 7 Tagen Abstand); Wiederholung nach 1-3-7-14-30 Tagen
  (Abstand wächst nur mit einem Treffer an einem neuen Tag, fällig ab Mitternacht des Fälligkeitstags), Fehler = morgen wieder fällig. Level "due" = „Heute fällig“; „Schwächen üben“ = Fertigkeiten mit Fehlern, die seitdem nicht wieder sicher sind (`recordStat`). Menü zeigt Wochenziel (3 Runden), Stufen je Level und die Landkarte (Blatt); Auswertung nennt Trefferquote, Zeit
  und erreichte Stufen. Keine Wiederholungen: der Store merkt sich die zuletzt gestellten Fragen (`recent`, Prüfsumme `taskKey`, 400 je Stufe),
  `freshRound` nimmt je Platz eine neue Frage desselben Typs, sonst eines anderen Typs des Levels, erst danach die am längsten zurückliegende. Sprache: „Noch nicht“ statt „Leider falsch“, keine Ranglisten, keine Schuld.
  Prüfungstermin (`Exam`, Blatt „Schularbeit“ im Menü, trägt der Lernende selbst ein, bleibt auf dem Gerät): bis dahin Abstand höchstens halbe Restzeit
  (`examInterval`, `effectiveDue`), neue Fertigkeiten zuerst fällig, Menü zeigt Countdown und „x / n sicher“; nach dem Tag löscht sich der Termin.
- Antwortform **Antippen im Bild** (Gemische, `kind: "tap"`): `parts` = antippbare Teile (Formeln im Teilchenbild bzw. `data-part` eines Trennverfahrens),
  gemeldet als `values.pick` (Index), Fallen `traps: [{ values: { pick }, miss, why }]`; nach der Antwort ist die Lösung gestrichelt grün markiert; für Tastatur
  und Vorlesen dieselben Teile als unsichtbare Knöpfe.
- **Gelöstes Beispiel im Quiz** (`withExamples` in `packages/quiz/src/store.ts`): vor der ersten Aufgabe jeder Fertigkeit der Runde, die noch nie geübt wurde,
  steht ein gelöstes Beispiel derselben Art (andere Frage, aus weiteren erzeugten Runden gesucht, höchstens 3 je Runde, Schlüssel = ganze Aufgabe als JSON):
  `stage: "worked"` → Karte `WorkedCard` mit Frage, markierter Lösung, „1. Tipp 2. Erklärung“ und Knopf „Verstanden – jetzt du“; zählt nicht für Punkte und Statistik (`counted`).
  Die erste echte Aufgabe dieser Fertigkeit bekommt `stage: "faded"`: der erste Schritt (der Tipp) steht unter der Frage (`.q-first`, kostet nichts).
  Nicht in „Heute fällig“ und „Schwächen üben“. Damit das Beispiel passt, muss jeder Aufgabentyp genug verschiedene Aufgaben erzeugen.
- Weitere Bausteine von `QuizScreen`: `renderVisual` (Bild über der Frage, per `Fit`), `renderOption` (eigene Darstellung von Antworten), `renderAnswer` (eigene Antwortform),
  `solution` (Lösung nach Fehlern), `feedbackExtra` (zusätzliches Blatt „Lösung“ nach der Antwort, z. B. Ablauf der Reaktion), `tools` (Hilfsmittel), `explain` (Erklärkarte je Level),
  `lead` an der Aufgabe (Merksatz über der Frage), `hint` (Tipp) und `hintCue` (Tipp-Knopf hervorgehoben, kostet keine Punkte).
- Diagnostische Distraktoren: jede falsche Antwort steht für eine Fehlvorstellung. MC: `mc(richtig, [d(text, miss, why), …])` – `miss` = Schlüssel aus
  `src/quiz/misconceptions.ts` der App (`MISS`, Name für Landkarte/Auswertung), `why` = Rückmeldungssatz mit den konkreten Zahlen (steht vor der Erklärung).
  Eingabe-Aufgaben: `traps` (`{ field, value | min }` oder `{ values: {…} }`) auf den gemeldeten `values`; `diagnose(task, answer)` wertet aus.
  Der Store zählt `misses` je Stufe; Landkarte zeigt „Stolpersteine“ (≥ 2×), Auswertung den häufigsten der Runde. `missName` an `QuizScreen` übergeben.
  `missBy` merkt je Fehlvorstellung die Fertigkeiten; sind alle wieder „sicher“, verschwindet der Stolperstein (`clearMisses`, Test mit simulierter Uhr).
  Distraktoren mit Diagnose kommen vor zufälligen; die Tests prüfen Schlüssel, Listenlängen und Fallen-Felder. Rückmeldung nie beschämend, immer mit dem richtigen Weg.
- Baukasten – neue Module nur aus gemeinsamen Teilen: Build der App über `appConfig(…)` (`scripts/app-vite.ts`, PWA + Einzeldatei + `lizenzen.txt`
  über `scripts/licenses.ts`), `App.tsx` des Moduls = `<LernApp name logo tabs tab onTab storage stufe?>` (`@lern/ui`: Link zur Übersicht,
  Stufen-Umschalter, Beamer, Farbschema – nicht im App-Store halten). Quiz-Antworten: `McAnswer` (automatisch), `NumberAnswer` (`@lern/quiz`, ganz/dezimal, Einheit).
  PSE überall als `pseTool({ stufe, mark })` (`@lern/chem-ui`) in Werkbank- und Quiz-`tools`.
- Logo in jedem Modul verlinkt zur Übersicht (`HomeLink` der Hülle). Kopfzeile hat automatisch den Klang-Schalter (`@lern/ui` `feedback.ts`: `ding(ok)` nur wenn eingeschaltet, Standard aus; Vibration `buzz` immer)
  und den Schalter „Lesbar“ (`readable.ts`, localStorage `lern-lesbar`, Attribut `data-lesbar` auf `<html>`, Stile in `tokens.css`: mehr Buchstaben-/Wort-/Zeilenabstand; Überschriften unverändert). Browser-Prüfung `scripts/check-ui.mjs` zusätzlich mit `LESBAR=1` laufen lassen.
- Auffangnetz: `AppShell` fängt Abstürze einer Ansicht ab (`Rescue`, Karte „Hier hakt etwas.“); jedes Modul übergibt `storage` = seine localStorage-Schlüssel (Baukasten + Quiz),
  „Neu starten“ setzt zuerst nur Baukasten und laufende Runden zurück, beim zweiten Mal alles.
- Mobile first: keine horizontale Seiten-Scrollbar bei 390 px, Tippziele ≥ 44 px, Pointer Events zum Ziehen.
- Farben nur über Design-Tokens (`packages/ui/src/styles/tokens.css`, modulspezifisch in `app.css`), hell und dunkel.
- Design: Swiss Style – Weiß/Schwarz, ein Rot (`--signal`) nur als Auszeichnung (Kartentitel, aktiver Tab, Kennziffern), Schrift Inter (lokal: `packages/ui/src/fonts/inter.woff2`, erzeugt mit `scripts/inter-subset.py` aus `inter-ui` – Latein, Griechisch,
  hoch-/tiefgestellte Ziffern, Pfeile). Immer mit `cv05` (l mit Bogen) und `cv08` (I mit Serifen), damit Cl und CI, Il, 1l unterscheidbar sind.
  Keine Verläufe, keine Schatten, kleine Radien (`--radius*` 3–4 px), Linien statt Flächen. Hauptknöpfe/Auswahl schwarz (`--accent`). Fachfarben nur aus der gemeinsamen Palette
  in `tokens.css` (`--hue-red|blue|yellow|green|grey|violet|teal|orange`, je `-soft` für Flächen und `-deep` für Schrift; dezent kräftig, nie grell; Beamer satter):
  Proton/O/H⁺ rot, Elektron/N/OH⁻ blau, Neutron hellgrau, Kation/S gelb, Anion/Cl grün, Alkalimetalle violett, Erdalkalimetalle grünblau, P/Halbmetalle orange.
  Signalrot nur für die Oberfläche. Ausnahme: Kreidetafel (Einheiten). ✓ immer grün (`--ok`), nie rot.
- **Nie scrollen** (Handy 390 × 844 und 375 × 667, Desktop): jede Ansicht füllt genau den Bildschirm (`--screen-h`, Klasse `ui-screen`).
  Freies Ausprobieren = `Workbench` (`@lern/ui`): Bühne füllt den Platz, Hauptbedienung direkt darunter (`controls`), alles Weitere in der Werkzeugleiste (`tools`) –
  am Handy öffnet jedes Werkzeug ein Blatt (Zurück-Taste schließt es), breit (≥ 900 px) stehen die Werkzeuge als Register daneben. Nie mehrere Bereiche gleichzeitig offen.
  Übungen/Quiz: Aufgabe = ein Bildschirm (Frage, Bild passt sich per `Fit` an, Antwort, kurze Rückmeldung, „Weiter“ immer sichtbar); Lösungsweg und Hilfsmittel als Blatt.
  Zeichnungen passen sich per Container-Einheiten (`cqw`/`cqh`) oder `Fit` ein, statt zu scrollen oder abgeschnitten zu werden. PSE mit `fit` (ganzes PSE sichtbar).
  Prüfen im Browser (z. B. Playwright): in allen Ansichten, Werkzeugen und Quizaufgaben darf weder die Seite noch Werkbank/Aufgabenkarte überlaufen, und nichts darf von einem
  Rahmen mit `overflow: hidden` abgeschnitten werden (Gleichungen, Formeln). Breiten: 390 × 844, 375 × 667, dazu schmale Android-Handys 360 × 740 und 412 × 915
  (Quiz ab ≤ 370 px Breite kompakt wie bei niedrigen Bildschirmen). Nie mitten im Wort umbrechen: Auswahl-Antworten stehen nur zweispaltig, wenn jedes Wort
  in seine Spalte passt (`McAnswer` misst, sonst einspaltig); im kompaktesten Menü (Stufe 5) stehen Sterne über Tipp und Pfeil, damit Level-Namen breit genug bleiben.
- Knopf oder Anzeige – auf einen Blick: alles Antippbare sieht aus wie eine Taste (dunkler Rahmen `--rule`, Unterkante `--key-edge`,
  gedrückt `--key-edge-pressed`; neue Knopf-Klassen bekommen beides), Anzeigen haben keinen Rahmen, nur eine ruhige Fläche (`Tag`, `Chip`, Ergebnis).
  Beantwortete Auswahl verliert die Unterkante.
- Keine Erklärsätze in der Oberfläche; Zustand als kurze `Tag`s (✓ neutral, Kation Fe³⁺ …). Erklärungen nur kurz in Erklärkarten und als Tipp nach Fehlern.
- Fachsprache überall gleich (Experimentieren, Quiz, Erklärkarten, alle Module):
  beschreibend statt zielgerichtet – nie „das Atom will/braucht ein Oktett“, sondern „das Ion hat dann eine volle Außenschale wie ein Edelgas“;
  Gruppen je Stufe: Unterstufe römische Hauptgruppe („IV. Hauptgruppe“), Oberstufe Gruppe 1–18 (`groupLabel` in `@lern/chem`, auch PSE-Kopf und PSE-Hilfe);
  Ladungen als Zahl vor dem Zeichen: 2+, 1− (`signed`, `chargeFull`), Rechnung mit echtem Minus (`minus`);
  „Außenelektronen“ (einmal eingeführt als „Außenelektronen (Valenzelektronen)“), „Edukte (Ausgangsstoffe)“ und „Produkte“,
  „Zweifachbindung“, „freie (nichtbindende) Elektronenpaare“, „Strukturformel“ / „geometrische Strukturformel“ (Keil = nach vorn, strichliert = nach hinten),
  „Kohlendioxid“, „Kohlenmonoxid“, „Oktan“, „Gesetz der Massenerhaltung“, Gemischarten mit Aggregatzuständen (Lösung s/l, Emulsion l/l …).
- Tipps verraten die Lösung nicht und passen zur Aufgabe (z. B. Tipp je Reaktionstyp); jede falsche Antwort bekommt eine Rückmeldung, wo möglich mit Katalog-Schlüssel.
- Multiple Choice: `mc(richtig, falsche)` aus `@lern/quiz`; falsche Antworten möglichst als diagnostische Distraktoren – `d(text, miss, why)` mit Katalog-Schlüssel
  (Chemie-Apps mit `misconceptions.ts`) oder Kurzform `dis(text, why)` ohne Schlüssel (Reaktionsgleichungen). `mc` bevorzugt Optionen mit Diagnose.
- Quiz-Hilfsmittel je Aufgabe über `tools` von `QuizScreen` (`QuizHelp`): z. B. PSE mit den Elementen der Aufgabe markiert (`PseHelp` in `@lern/chem-ui`, Elemente per `elementsIn(prompt)` aus `@lern/chem`).
  Hilfsmittel dürfen die Lösung nicht direkt verraten (PSE nur Angaben eines gedruckten PSE: Z, Gruppe, Periode, Atommasse).
- **Zwei Sprachen** (`packages/i18n`): jeder sichtbare Text als `tr("Deutsch", "English")`, auch in Daten. Beim ersten Start aus der Gerätesprache, danach Knopf DE/EN in der Kopfzeile
  (`lern-sprache`; Wechsel lädt die Seite neu, Stände bleiben). Tests laufen auf Deutsch; je Modul `english.test.ts`/`guide-english.test.ts` prüfen, dass nichts Deutsches
  in der englischen Fassung bleibt. Fachnamen englisch nach IUPAC (alkene, ethanoic acid …).
- Kopfzeile (`LernApp`): Logo (→ Übersicht), Bereichsleiste (ab 900 px), Stufen-Umschalter „Level I | Level II“ (falls das Modul Stufen hat; Start immer Level I, nicht gespeichert), Beamer (ab 900 px,
  nicht gespeichert), Farbschema hell/dunkel (Start hell, nicht gespeichert), DE/EN, „Lesbar“, Klang. Am Handy (≤ 374 px) engere Abstände, damit nichts übersteht.
- Offline-fähig: Web-Build mit Service Worker, zusätzlich Einzeldatei mit allen Modulen (`vite build --mode single` → `edi-offline.html`).
- Android/iOS über Capacitor (`apps/edi/android`, `apps/edi/ios`); `webDir` = `dist`.

## Gemische (`modules/gemische`)
- Keine Stufen. Zehn fertige Beispiele (`EXAMPLES` in `src/mixtures.ts`), **kein Baukasten**, 110–240 Teilchen je Beispiel (alle verschieden):
  Wasser, Helium im Luftballon, Zuckerwasser (Saccharose), Alkohol und Wasser, Sprudelwasser, Öl und Wasser (Öl vereinfacht als Dodecan),
  Messing (Cu, Zn), Erdgas (CH₄, C₂H₆, CO₂), Schutzgas zum Schweißen (Ar, CO₂), Modellgemisch (He, Ar, CO₂, CH₄).
  Zweimal gleich viele Verbindungen wie Elemente (Schutzgas, Modellgemisch), achtmal verschieden viele (Test).
  Quiz und Erklärkarten zeigen ein Zehntel der Teilchen (`small`) im Rasterbild (`mixing.ts`, `components/Beaker.tsx`).
  Als elftes Beispiel **Müsli** (`MUESLI`, `components/MuesliBowl.tsx`): Gemenge aus sichtbaren Stücken (Haferflocken, Rosinen, Haselnüsse) ohne Teilchenbild –
  das Gemisch-Konzept gilt auch für Bestandteile, die selbst aus vielen Stoffen bestehen. Vorher jede Sorte als Haufen, **Mischen** (Schale wackelt, Stücke gleiten
  an zufällige Plätze), **Auslesen** (zurück in Haufen); Werkzeuge Zutaten | Zählen (Bestandteile, Stücke) | Einteilung | Arten | Beispiele.
- **Elemente nur als einzelne Atome** (Edelgase) oder Metallgitter – keine Moleküle aus einer Atomsorte (O₂, O₃, N₂ …), auch nicht im Quiz (Test).
- Zählen (`analyse`): Teilchen (Moleküle bzw. einzelne Atome), Stoffe, davon Verbindungen (mehrere Atomsorten) und Elemente (eine Atomsorte), Atomsorten.
  Die Erklärkarte nennt trotzdem alle Arten von Elementen (einzelne Atome, Metallgitter, Moleküle wie O₂), nur die Bilder zeigen keine Element-Moleküle.
  Teilchenbilder in fünf Arten (`pictureKind`): Element, Verbindung, Gemisch aus Elementen / aus Verbindungen / aus Element und Verbindung.
- Experimentieren (`views/MixView.tsx`, `components/FlowView.tsx`, Canvas): Gefäß mit allen Teilchen (klein) und **verschiebbarer Lupe**
  (anfassen und ziehen – Abstand zum Finger bleibt; daneben tippen – Lupe gleitet hin; Pfeiltasten), daneben bzw. darüber die Vergrößerung mit etwa 20 Teilchen
  als schattiertes Kalottenmodell (`lensRadius`). Die Lupe springt nie: sie gleitet, und das Bild ordnet sich nicht neu an (Statuszeile immer einzeilig,
  höchstens zwei kurze Kennzeichen, `.gm-status`). Teilchen in der Lupe antippen → Stoff-Info (öffnet beim Loslassen; das Blatt ignoriert den Klick gleich nach dem Öffnen, sonst schließt es am Handy sofort wieder). Grenze Öl/Wasser als gerade Linie (`boundaryY`), sobald getrennt.
- Jedes Beispiel beginnt **vorher** (`before`): Zuckerkristall im Wasser (Lupe auf seiner Oberkante), Alkohol obenauf, CO₂ über dem Wasser, Gase hinter Trennwänden,
  Kupfer- und Zinkblock. Hauptknopf sagt, was er tut: **Umrühren** (Zucker, Alkohol, 3 s), **Schütteln** (Sprudel, Öl, Reinstoffe), **Wand weg** (Gase), **Schmelzen** (Messing);
  daneben **Von vorn** (Anfang wieder herstellen). Flüssigkeiten lösen und mischen sich auch **von selbst** (langsam; warm schneller) – Rühren/Schütteln beschleunigt.
  Statuszeile: „löst sich · 12 / 30 gelöst“, danach „Lösung · gelöst in 23 s“ (Zeit zum Vergleichen: kalt/warm, gerührt/ruhig); Alkohol „gemischt“, wenn in jedem
  Drittel der Höhe etwa gleich viel Alkohol ist; Gase, wenn jeder Stoff im Mittel in der Mitte ist.
- Bewegung (`src/flow.ts`, fließend statt Rasterzellen): Flüssigkeit – Geschwindigkeit ändert sich langsam zufällig, Teilchen stoßen sich ab (Stoßradius je Stoff,
  `SIZE`: Saccharose 1,8 ×, Ethanol 1,3 ×, CO₂ 1,15 × Wasser; gezeichnet nach Größe, `DRAW`), große Moleküle bewegen sich langsamer, Öl hat Auftrieb;
  Gas – geradeaus, Abprall an Wänden, Trennwänden und aneinander; fest – Schwingen um den Gitterplatz.
  **Zuckerkristall** (`CELL`): geordnet, alle Moleküle gleich ausgerichtet, dicht an dicht (Saccharose liegt flach: breiter als hoch); Moleküle mit freien Seiten
  lösen sich ab (Wahrscheinlichkeit ∝ freie Seiten², also Ecken zuerst; ∝ Wärme^1,5; Umrühren × 4) und gleiten nach außen weg (`leave`: kurz ohne Stoß mit dem Kristall).
  Zeit bis gelöst (Test): 20 °C ruhig etwa 25 s, gerührt deutlich schneller, 80 °C deutlich schneller, 0 °C deutlich langsamer. CO₂ löst sich beim Auftreffen auf die
  Oberfläche selten (von selbst), geschüttelt fast immer; beim Schütteln wird das Gas zur Oberfläche gerissen und sinkt als mitgerissenes Bläschen bis zu einer zufälligen Tiefe (`sink`) –
  so verteilt es sich im ganzen Wasser. **Gleichgewicht** (geschlossene Flasche, `closed`): gelöstes CO₂ nahe der Oberfläche perlt aus, bis so viel im Gasraum ist, wie bei der
  Temperatur dazugehört (`gasShare`: 0 °C 5 %, 20 °C 21 %, 50 °C 45 %, 100 °C 85 % – kaltes Wasser löst mehr Gas; im Modell verstärkt, damit es gut zu sehen ist); im Gleichgewicht nur Austausch (`swap`: für jedes gelöste perlt eines aus).
  Erwärmen → CO₂ perlt aus (weit unter dem Gleichgewicht auch tiefer im Wasser); abkühlen → das Gas löst sich zügig wieder (`cooled`, auch ohne Schütteln, Test). Statuszeile „löst sich | perlt aus | Gleichgewicht · x / 40 gelöst“.
  **Öffnen** (Knopf, sobald das Gleichgewicht erreicht ist; `openBottle`): Deckel weg, Gas fliegt oben hinaus (wird entfernt), gelöstes CO₂ perlt aus und steigt als Bläschen
  auf (`rise`); **Schütteln** der offenen Flasche: Bläschen im ganzen Wasser, das CO₂ entweicht in wenigen Sekunden („offen · perlt aus“ → „abgestanden“).
  **Kohlensäure**: CO₂ + H₂O ⇌ H₂CO₃ (`ACID`; ein Wassermolekül in der Nähe wird verbraucht bzw. wieder frei, Atome bleiben erhalten; im Modell etwa jedes zehnte gelöste
  CO₂-Molekül, echt nur etwa 0,2 %). 3D-Daten H₂CO₃ aus `scripts/mol3d.py`. Tests zählen beim Sprudel Atome statt Moleküle. Tests: Gleichgewicht nach Schütteln bei 0/20/100 °C, keine Drift, kalt mehr gelöst, warm perlt aus, gleichmäßig verteilt.
  **Umrühren/Schütteln** (`agit`, setzt sanft ein und klingt sanft aus): Strömung ohne Stau – Stromfunktion ψ = sin πx · sin πy bzw. zwei Walzen, fließend im Wechsel;
  reicht bis zum Boden bzw. bis zur Oberkante des Kristalls (Test: überall etwa gleich dicht). Beim **Schütteln** zusätzlich kleine,
  ständig wandernde Wirbel (ψ = sin(3πx + a) · sin(3πy + b)). **Schmelze** (Messing, `MELT` 10 s): jedes Atom bewegt sich ungeordnet (Wärmebewegung) und gleitet
  an den Nachbarn vorbei, dazu eine langsame, gleichmäßige Wärmeströmung ohne Stöße und Druck gegen Lücken – Kupfer und Zink vermischen sich nach und nach, danach Erstarren im Gitter.
  Darstellung (`FlowView`): fester Takt von 60 Rechenschritten/s unabhängig von der Bildrate (60/120 Hz); gezeichnet wird eine Lage, die der gerechneten
  wie an einer kritisch gedämpften Feder folgt (`glide`, je 1/60 s ein Federschritt – glättet das Zittern der Stöße, besonders in der Lupe).
  Zeichenfläche undurchsichtig, am Handy 1,5-fache Pixeldichte (ab 900 px Breite 2-fach).
  Keine Sprünge (Messwerte je Beispiel, siehe Tests): Trennung überlappender Teilchen höchstens ein Drittel Radius je Runde, Geschwindigkeit in der Flüssigkeit begrenzt,
  eben gelöste Teilchen (Kristall, CO₂) gleiten hinaus bzw. hinein (`leave`), jede Flüssigkeit wird vor dem ersten Bild entwirrt (`settle`).
  **Öl** (`LONG`): Dodecan stößt als Stab mit runden Enden (Kapsel, `shape`/`closest`/`push`), dreht sich bei Stößen und an der Wand – Ketten kreuzen sich nie.
  Öl zieht Öl leicht an, gemessen zwischen den Oberflächen der Stäbe (zu nah: Abstoßung, bei Berührung fällt die aufeinander zu gerichtete Geschwindigkeit weg; beim Schütteln fast weg, Öl wird
  stärker herumgeworfen, Öl und Wasser länger geschüttelt: 5 s) – geschüttelt **fein verteilt** (keine Klumpen), danach finden sich Tröpfchen, die sich wieder zur Schicht sammeln. Startlage: jeder Stab wird so gedreht, dass er die anderen möglichst wenig berührt (`settle`; gekreuzte Stäbe ließen sich später nicht mehr trennen, Test). Test: geschüttelt unter den 6 nächsten Nachbarn eines Ölmoleküls kaum mehr Öl als zufällig, 1,5 s danach deutlich mehr (Tröpfchen).
  **Gase**: „Wand weg“ zieht die Trennwand in knapp 1 s hoch (`wallEnd`), die Gase strömen unten durch. **Schmelze** im warm hinterlegten Tiegel.
  Reduzierte Bewegung: Knopf rechnet bis zum Endzustand (gelöst bzw. gleichmäßig gemischt).
  **Temperaturregler** 0–100 °C (nicht gespeichert, Start 20 °C): Teilchengeschwindigkeit im Modell verstärkt (`heat`: 0 °C × 0,5, 20 °C × 1, 100 °C × 3; echt wären nur + 17 %),
  Kristall löst sich warm schneller; CO₂ löst sich warm schneller, aber es bleibt mehr im Gasraum (Gleichgewicht). Tests: Teilchenzahl bleibt, keine Sprünge, gleichmäßig gemischt, Kristall geordnet und von außen gelöst, Öl bildet geschüttelt Tröpfchen und ist danach wieder oben,
  Gase mischen sich nur ohne Trennwand, Messing wieder im Gitter (beim Erstarren Plätze nach kürzesten Wegen verteilt, Gleiten höchstens ¼ Radius je Schritt – kein Sprung; Wärmebewegung der Schmelze klingt in der letzten Sekunde aus, gleich nach dem Erstarren 1 s sanfter gebremst, `frozeAt`). Ohne Bewegung (reduzierte Bewegung): Knopf zeigt gleich das Ergebnis.
  Werkzeuge: Stoffe (Reinstoffe: Verbindungen | Elemente; beim Sprudel zusätzlich „entsteht in kleiner Menge“: Kohlensäure, `forms`) | Zählen | Farben („nur im Modell“) |
  Einteilung (Stoffe → Reinstoffe/Gemische mit allen Beispielen; niedrige Handys ohne Wurzel) | Arten (verteilter Stoff in Hauptstoff: Gemenge, Legierung, Suspension,
  Lösung, Rauch, Emulsion, Nebel, Schaum, Gasgemisch mit Alltagsbeispiel; aktuelles Beispiel markiert) | Beispiele. Gespeichert (`gemische-v1`): Beispiel.
- **Lernen** (`src/quiz/tasks.ts`, Lektionen `src/lessons.tsx`, Katalog `misconceptions.ts`): fünf Kapitel (`gm-k1` … `gm-k5`) mit je einer Lektion und zehn Aufgaben
  in fester Reihenfolge, plus „Alles gemischt“, „Heute fällig“, „Schwächen üben“:
  1 **Teilchen und Atomsorten** (teilchen ×2, tippAtome ×2, atomsorten ×2, stoffe ×2, zwischen, farbe) ·
  2 **Elemente und Verbindungen** (einordnen ×2, tippElement ×2, tippVerbindung ×2, elemente ×2, verbindungen ×2) ·
  3 **Reinstoffe und Gemische** (reinOderGemisch, reinGemisch, bildArt, bildWahl, homogenBild, homogenKlar, wohin, nachher, masse, bewegung – Lösen gehört hierher) ·
  4 **Gemische im Alltag** (alltag ×2, reinAlltag ×2, homogenSieht, artFluessig ×2, artFestGas, artInGas, gemischart) ·
  5 **Stofftrennung** (trennWahl ×4, trennEigenschaft ×2, trennTipp ×3, trennReihe; `src/quiz/trennen.ts`).
  **Keine Zahleneingabe**: Zählaufgaben werden zur Auswahl (`asChoice`: Fallen → diagnostische Distraktoren, Zahlen aufsteigend); Antippen im Teilchenbild
  (`tippAtome`: Teilchen aus n Atomen, `tippElement`/`tippVerbindung`). Stofftrennung: `trennWahl` (Bild des Gemischs ohne Geräte `MixPic`, Antworten als
  Bildkarten der Verfahren; 9 Fälle: Eisen/Schwefel → Magnet, Sand/Kies → Sieben, Erbsen/Linsen → Auslesen, abgesetzter Sand → Dekantieren, trübes Wasser →
  Filtrieren, Salzwasser → Eindampfen (Salz) bzw. Destillieren (Wasser), Alkohol/Wasser → Destillieren, Filzstift → Chromatografie; jede falsche Wahl mit
  Begründung, Gelöstes durch den Filter = Stolperstein `filter-geloest`), `trennEigenschaft` (Animation des Verfahrens, Eigenschaft wählen: Korngröße,
  Magnetismus, Dichte, Siedetemperatur, Aussehen, Haften am Papier), `trennTipp` (Endbild antippen: Rückstand, Filtrat, Destillat, Kühler, Salz, Eisen, weitester
  Farbstoff, Bodensatz), `trennReihe` (Salz und Sand bzw. Eisen, Sand, Salz: Magnet → Lösen → Filtrieren → Eindampfen).
  Über jeder Aufgabe ein **Merksatz** (`leads` → `lead`; weicht dem „Ersten Schritt“ und nach der Antwort am Handy der Rückmeldung). Jede Aufgabe hat einen
  **zugeschnittenen Tipp** (`tip` → `hint`, `hintCue`). Rückmeldungen begründen mit dem Bild. Sprudel nicht im Lernen (dort reagiert ein Teil zu Kohlensäure).
  Bild der Aufgabe `pic`, Teilchenbilder als Antworten `pics` (zwei Spalten, Höhe begrenzt), Verfahren `sep` (t = −1 Animation, sonst Standbild), Gemisch `mixPic`,
  Verfahren als Bildkarten `methods`. Stolpersteine u. a.: Verbindung für Gemisch gehalten, Gemisch aus Elementen für Verbindung, gelöster Stoff
  verschwindet, Masse ändert sich, Luft zwischen den Teilchen, Teilchen ruhen, Teilchen haben die Farbe des Stoffs, „rein“ im Alltag, Gelöstes filtrierbar,
  Teile nach dem Trennen verwechselt, Reihenfolge vertauscht.
  Hilfsmittel „Farben“: alle Atomfarben (verrät nicht, welche vorkommen). Nie zwei Atomsorten mit ähnlicher Farbe (He/Ne, Cu/Fe, Zn/Al) in einer Aufgabe
  (`distinctColors`, Test); Argon violett. Artikel und Einzahl/Mehrzahl in erzeugten Sätzen beachten. Erklärkarte je Kapitel (`quiz/explain.tsx`, Kapitel 5 mit
  dem Bild des Filtrierens).
- **Trennverfahren** (`components/Separation.tsx`): Auslesen, Sieben, Magnettrennung, Dekantieren, Filtrieren, Eindampfen, Destillieren, Chromatografie als SVG-Bild,
  das eine reine Funktion des Fortschritts t ist (`SepScene`, 0 = vorher, 1 = getrennt; `SepAnim` spielt ab, „Nochmal“-Knopf, reduzierte Bewegung → Endbild).
  Teile mit `data-part` (Ziele für Beschriftung und Antippen, dazu unsichtbare größere Trefferflächen). Farben nur aus der Palette (`.sp-*` in `app.css`).
  `MixPic` = Gemisch vor dem Trennen ohne Geräte (verrät das Verfahren nicht). Eindeutige `clipPath`-Kennungen je Bild (`useId`).
  Sieben: Maschen als Drahtquerschnitte mit sichtbaren Lücken; Sandkörner rutschen zur nächsten Lücke, fallen hindurch und häufen sich in der Schale, Kiesel
  (größer als die Lücke) bleiben liegen. Destillieren: Rundkolben auf Dreifuß über dem Brenner, Thermometer am Abzweig (steigt auf 100 °C und bleibt dort, solange
  Wasser siedet), Liebig-Kühler mit Kühlwasser im Gegenstrom (unten hinein, oben heraus), Dampf wird im Kühler zu Tropfen, Vorlage = Erlenmeyerkolben, Salz bleibt
  im Kolben. Chromatografie: Streifen hängt im abgedeckten Becherglas; der Startpunkt ist schwarz (drei Farbstoffe übereinander), die Laufmittelfront steigt,
  jeder Farbstoff wandert verschieden weit (Gelb, Rot, Blau) – der Punkt läuft auseinander.
- Zählen in der Werkbank mit abnehmender Hilfe (`Counts` in `views/MixView.tsx`): Beispiel 1–2 vorgerechnet („Vorgemacht“), 3–5 fehlt die Zahl der Stoffe
  („Ergänze die Lücke“), ab 6 alles selbst („Jetzt du“) – Eingabe mit ✓/✗, nach zwei Fehlversuchen steht die Lösung da; die Teilchenzahl ist immer angegeben.
- **Lektionen** (`src/lessons.tsx`, `LESSONS[0…4]`, je Kapitel 4–12 Schritte, vorgemacht → halb gelöst → selbst, keine Zahleneingabe): 1 Teilchen zählen,
  Teilchen aus 5 Atomen antippen, Atomsorten an den Farben, Stoffe, leerer Raum · 2 Element/Verbindung, Element antippen, Verbindungen zählen, Kupfer ·
  3 Reinstoff/Gemisch, homogen/heterogen (Zuckerwasser = Lösung, Milch, Gasgemisch), Lösen (Animation), Masse, Tinte · 4 Arten von Gemischen (Suspension,
  Emulsion, Schaum, Gemenge, Legierung fett eingeführt), Öl in Wasser, Müsli, „rein“ · 5 Sieben, Magnettrennung, Auslesen, Filtrieren (Rückstand, Filtrat,
  Dekantieren), Rückstand antippen, Eindampfen/Destillieren (Kühler, Destillat, Siedetemperatur), Chromatografie (Laufmittel), weitesten Farbstoff antippen.
  Begriffe früherer Kapitel stehen in `known`.

## Atombau (`modules/atombau`)
- Start immer: helles Farbschema, Unterstufe, Elektronen kreisen nicht, kein Beamer-Modus (diese Werte werden nicht gespeichert).
- Gespeichert: Baukasten und Einstellungen (localStorage `atombau-v3`); Quiz in `atombau-quiz` (`src/quiz/store.ts`, übernimmt alten Fortschritt einmalig).
- Quiz-Aufgaben sind reine Daten (`src/quiz/tasks.ts`). Neue Aufgabentypen in `TYPES` registrieren und einem Level zuordnen; eigene Antwortformen in `answers.tsx`. Erklärkarten je Level in `src/quiz/explain.tsx`.
  Texte: `**fett**` und `` `Code` `` (dargestellt von `RichText`).
- Richtig/falsch nie nur über Farbe zeigen (Rot-Grün-Schwäche): immer zusätzlich ✓/✗, Muster oder gestrichelte Rahmen.
- Nicht überladen: neue Funktionen nur dort einblenden, wo sie gebraucht werden (z. B. Trends nur Oberstufe, Beamer nur ab 900 px).
- Nuklid-Aufgaben (Massenzahl, Neutronen, Atomsymbol) nur bis Z = 20 (`NUCLIDE_MAX_Z`) – Prinzip üben, nicht mit großen Zahlen rechnen.
- Reihenfolge: Unterstufe Level 1 sucht im PSE nur nach Name oder Ordnungszahl (`pse`), nach Periode und Hauptgruppe erst in Level 2 (`pseGroup`); Oberstufe mit Gruppe 1–18.
  Steckbrief und PSE-Ansicht zeigen die Gruppe wie die Stufe (`groupLabel`), Statusmarke „✓ Kern stabil“ (nicht mit Edelgaskonfiguration verwechseln).
- Quiz-Bilder dürfen die Lösung nicht zeigen (beim Bauen erscheint das Atomsymbol erst nach „Prüfen“, Bohrmodell im Quiz ohne p⁺/n im Kern).
- PSE nach Blöcken färben (`PeriodicTable blocks`, `BlockLegend`, Farben `--b-s|p|d|f` passend zu den Orbitalfarben `--o-*`): im Periodensystem der Oberstufe unter „Farben → Blöcke“,
  im Quiz als Hilfsmittel bei Aufgaben zur Elektronenkonfiguration (`BLOCK_TYPES` in `QuizView.tsx`), nicht bei „Blöcke im PSE“ (wäre die Lösung).
- Chemie: Elemente Z = 1–86; Kationen geben Elektronen von außen nach innen ab: ns/np, dann (n−1)d, dann (n−2)f (Fe²⁺ = [Ar] 3d⁶, Eu³⁺ = [Xe] 4f⁶). Konfiguration überall nach dem Aufbauprinzip ohne Sonderfälle (auch Cr, Cu); das Quiz fragt diese Elemente (`DEVIATING`) und Cu⁺ nicht ab.
- Häufigstes Isotop aus der Tabelle `COMMON_A` (`standardNeutrons`), nie gerundete Atommasse (Cu-63, nicht Cu-64). Ionen in Aufgaben nur mit Ladungen, die es gibt (`commonCharges`); Namen mit `ionName` (Chlorid-Ion, Eisen(III)-Ion).
- Einzahl/Mehrzahl in generierten Texten beachten („1 Proton“, „1 Außenelektron“) – die Quiz-Tests prüfen das. Ladung 0 heißt „neutral“ (nicht „0+“).
  Im Quiz nicht „Grundzustand“ verwenden (nicht eingeführt).
- Erklärung Level I (26 Schritte): **Kern und Hülle** · **Elektronen und Masse** · **Schalen** (K, L, M fett eingeführt) · **Ionen** (Kation/Anion fett) · **Isotope** · **Atomsymbol**.
  Level II (38 Schritte, Orbitalmodell von Grund auf): **Grenzen des Schalenmodells** · **Elektronen als Welle** · **Quantenzahlen und Formen** · **Wie viele Elektronen?** ·
  **Energie und Aufbau** · **Das Atom in 3D** · **Kurzschreibweise und PSE** · **Ionen** (isoelektronisch fett).
  3D-Orbitale (`@lern/chem-ui/orbitals3d`, `Orbital3D`, per `lazy()`): Grenzflächen der wasserstoffähnlichen Wellenfunktion ψ (`packages/chem/src/orbitals.ts`, Marching Cubes),
  Farbe nach Orbitaltyp wie im Kästchenschema, Vorzeichen von ψ als dunkle/helle Tönung, Ziehen dreht. Höhere Schalen liegen weiter außen (5s weiter außen als 4s) –
  so ist es fachlich richtig, auch wenn 5s energetisch höher liegt. Orbitalbild bei niedrigen Bildschirmen (Höhe ≤ 760 px) kompakter.

## Ionenbindung (`modules/ionenbindung`)
- Ionen-Bausteine: Kationen gold, Anionen grün, Breite = Ladung. Neutral, wenn beide Reihen gleich lang sind.
- Ionen, Formeln (`formula`, `ratio`) und Namen (`compoundName`) in `packages/chem/src/ions.ts`. Unterstufe nur Hauptgruppen-Ionen, Oberstufe zusätzlich Nebengruppen (römische Zahlen) und mehratomige Ionen.
- Ladungsrechnung immer mit Zahl schreiben: `2 · (1−) = 2−` (`chargeFull`).
- Mehratomige Ionen (Oberstufe): NH₄⁺, OH⁻, NO₂⁻, NO₃⁻, HCO₃⁻, SO₃²⁻, SO₄²⁻, CO₃²⁻, PO₄³⁻. Quiz Unterstufe Level 1 nur Ladungen und Elektronen (Verhältnis erst ab Level 2);
  Erklärkarte: im Salz keine Paare oder Moleküle, sondern ein Ionengitter.
- Nicht beständige Verbindungen (FeI₃, CuI₂, Al₂(CO₃)₃, AgOH, Cu⁺-Salze mit Sulfat/Sulfit/Nitrit/Hydrogencarbonat, Nitrite und Sulfite von Al³⁺/Fe³⁺/Cu²⁺ …) stehen in `NOT_KNOWN`
  (`isKnownCompound`): das Quiz fragt sie nicht ab, der Baukasten zeigt einen Hinweis.
- Baukasten startet gelöst (CaCl₂: ein Ca²⁺, zwei Cl⁻; `store.ts`) – zuerst ein fertiges Beispiel ansehen, dann selbst bauen.
- Erklärung Level I (17 Schritte): **Vom Atom zum Ion** · **Nichtmetall-Ionen** · **Formeln** · **Namen**. Level II (13 Schritte): **Ionen** (mehratomige Ionen,
  Hydrogencarbonat eingeführt) · **Klammern** · **Nebengruppen und Namen**. Quiz-Tipps ohne „kgV“ (nicht eingeführt): „Füge Bausteine hinzu, bis die goldene und die grüne Reihe gleich lang sind – mit möglichst wenigen Bausteinen.“

## Elektronenpaarbindung (`modules/elektronenpaarbindung`)
- Baufeld 6 × 5: Atome ziehen oder antippen und Felder antippen (Auswahl bleibt aktiv bis „Fertig“). Aus dem Feld ziehen = entfernen.
  Tastatur: Atom wählen (Enter), leere Felder per Tab/Enter, Bindungen/＋ per Enter, auf einem Atom Pfeiltasten = verschieben, Entf = entfernen.
- Benachbarte Atome (waagrecht/senkrecht) binden automatisch, wenn beide ungepaarte Elektronen haben; Tipp auf das Paar-Oval: Einfach → Zweifach → Dreifach → lösen.
- Logik in `packages/chem/src/molecules.ts` (Lewis-Belegung, Oktett, Erkennung bekannter Moleküle, EPA-Geometrie, Polarität) und `src/edit.ts`.
- Darstellung: blaue Elektronen, graues Oval für bindende Paare, großer roter Kreis um jedes Atom mit Edelgaskonfiguration (H: Duett, gestrichelt; zusätzlich ✓).
  Kreise benachbarter Atome überlappen, die bindenden Paare liegen in beiden. Jedes bindende Paar = eine Reihe aus zwei Punkten entlang der Bindung (Dreifachbindung = drei Reihen).
  Schalter „Punkte | Striche“ unter dem Baufeld (gespeichert): Paare als Striche wie in der Valenzstrichformel. Daneben Schalter „Oktett“ (gespeichert, Standard an):
  die roten Kreise liegen im Vordergrund (`rings`, `pointer-events: none` – Tippen und Ziehen gehen durch); ✓ und Zähler bleiben auch ohne Kreise.
- Automatisch erzeugte Valenzstrichformel steht auf breiten Bildschirmen links neben dem Baufeld (`Workbench side="left"`), am Handy im Werkzeug „Formel“.
  Lage aus `src/strich.ts` (`strichLayout`): wie gebaut, gewinkelte Atome (H₂O, H₂S, O in CH₃OH, H₂O₂ als Zickzack) auf ≈ 105° bzw. 120° gebogen, auch wenn sie im Raster in einer Reihe liegen.
- Freie Elektronenpaare symmetrisch zu den Bindungen (`loneLayout`, z. B. O in CO₂ schräg ± 45°).
- Bindungswinkel: gemessene Werte in `REAL_ANGLES` (molecules.ts; H₂S 92,1°, PH₃ 93,5°), sonst EPA-Schätzung mit „ca.“. Polarität: ΔEN ≥ 0,4 polar; H₂S „schwach polar“ (`isWeaklyPolar`). Summenformel unbekannter Kohlenstoffverbindungen nach Hill (CH₅N).
- 3D-Ansicht nur für **bekannte** Moleküle (`identify`, nicht für frei gebaute), auf Klick: `@lern/chem-ui/3d` (three.js, per `lazy()` nachgeladen):
  Kugel-Stab (Stäbe zweifarbig je Atomfarbe) oder Kalotte (Van-der-Waals-Radien), Atomsymbol erst beim Antippen eines Atoms.
  Lage „Real“ aus `packages/chem/src/mol3d.ts` (erzeugt von `scripts/mol3d.py`: RDKit, Kraftfeld MMFF94, gemessene Winkel aus `REAL_ANGLES` und H₂O₂-Verdrillung festgehalten,
  CO₂, SO₂, SO₃, NO₂, HNO₃, P₂O₅ aus Messdaten, zweiatomige mit gemessener Bindungslänge; neues Beispielmolekül → SMILES dort eintragen und Skript laufen lassen).
  `embed3D` nimmt für bekannte Moleküle diese Daten (Zuordnung `matchAtoms`, freie Paare nach EPA auf die echten Bindungen gedreht), sonst und für „Idealisiert“ EPA in `packages/chem/src/geometry3d.ts`. Ringe (EPA): nach dem Baum Ausgleich von Bindungslängen und Winkeln (`relax`, Ringwinkel „≈ 90°“), danach Substituenten und freie Paare der Ringatome exakt nach EPA (`placeRingSubstituents`: =O auf der Winkelhalbierenden, H-Paare symmetrisch). Mehrfachbindungen als parallele Stäbe in der Ebene der Nachbarbindungen. Umschalter Real (gemessene Winkel, `REAL_ANGLES`) / Idealisiert (109,5° / 120° / 180°); Schalter: Bindungswinkel, freie Elektronenpaare, Teilladungen/Dipol (Oberstufe).
- Teilladungen/Dipol starten immer ausgeschaltet (nicht gespeichert); Dipolpfeil nur bei Molekülen bis 5 Atome (`dipoleArrow`), sonst nur δ+/δ−.
- Umschalter Strichformel / Keilstrichformel (nur fertige Moleküle): `wedgeLayout` in `packages/chem/src/wedge.ts` (Papierebene aus embed3D, Keil = nach vorn, gestrichelt = nach hinten).
  Ein Zentralatom mit Tetraeder (CH₄, NH₃ …) als feste Standard-Zeichnung (Bindungen gleich lang, zu Partnern mit freien Paaren wie Cl × 1,2; Striche halten vor zweibuchstabigen Symbolen mehr Abstand); sonst beste Ansicht (viele Bindungen in der Ebene, keine Überlappung). Einfachbindungen zwischen Tetraeder-Atomen gestaffelt.
- Wasser nie linear zeichnen (auch nicht als Deko, z. B. Übersicht).
- Erklärung Level I (16 Schritte): **Außenelektronen** (Lewis-Schreibweise, ungepaarte Elektronen, Edelgaskonfiguration fett) · **Bindungen** · **Mehrfachbindungen** ·
  **Moleküle und Namen**. Level II (15 Schritte): **Bindungen** · **Molekülform** (EPA) · **Polarität**.
- 3D frei gebauter Moleküle: Kraftfeld MMFF94 (`packages/chem/src/mmff`, Einstieg `@lern/chem/mmff`, erst bei Bedarf geladen, rechnet im Hintergrund-Thread
  `packages/chem-ui/src/ff.worker.ts`); für bekannte Moleküle gemessene Strukturen (`mol3d.ts`). Prüfung gegen RDKit: `scripts/mmff-reference.py`, `packages/chem/test/mmff-reference.test.ts`.
  3D-Darstellung: gemeinsame Geometrien, Beschriftungen nur bei Bedarf, ohne Kantenglättung bei hoher Pixeldichte (flüssig auf Handys).

## Reaktionsgleichungen (`modules/reaktionsgleichungen`)
- Logik in `packages/chem/src/reactions.ts`: `parseFormula` (Klammern, tiefgestellte Ziffern), `balance` (Nullraum mit Brüchen → kleinste ganze Koeffizienten, `null` bei mehrdeutigen Gleichungen), `isBalanced`, `unbalancedElements`, `equationText` (Koeffizient 1 weglassen, `null` = „?“).
- Reaktionen in `REACTIONS` mit `stufe` (us/os) und `niveau` 1–4 (`reactionsFor(stufe, …niveaus)`), Titel, Art, Formeln ASCII wie `Ca(OH)2`; Stoffnamen in `SPECIES_NAMES` (jeder Stoff braucht einen Namen).
  Niveaus: US 1 eine Zahl · 2 mehrere Zahlen · 3 Verbrennungen/Metalloxide · 4 knifflig (halbe Zahl → verdoppeln, Al + HCl); OS 1 Salze/Säuren (Ionen als Block) · 2 Zerfall/Fällung/Neutralisation ·
  3 mehrere Produkte · 4 Redox und große Zahlen (KMnO₄ + HCl, Cu + HNO₃, Oktan). Neue Reaktion nur mit eindeutiger Lösung (der Test prüft Bilanz und Kürzung, je Stufe und Niveau ≥ 5 Aufgaben).
- Aufbau (einfach, wenige Knöpfe): Bereiche **Erklärung | Quiz | Experimentieren**. Experimentieren (Kennung `start`) = je Stufe 5 Beispielreaktionen nur aus Molekülen (`STARTS` im Store, Stand je Stufe gespeichert: US Knallgas, HCl, NH₃, Methan, Propan; OS = Level II bewusst komplexer: Gärung, Fotosynthese, Ethanol verbrennt, Ostwald-Verfahren, Oktan verbrennt; Knöpfe 1–5, ✓ wenn gelöst; nach ✓ „Ablauf ansehen“),
  nach dem letzten Beispiel „Zum Quiz“. Mit `BalanceCard`:
  Titel, Teilchenbild (`MoleculeScene`, Kästen passen sich dem Inhalt an, nebeneinander oder übereinander), Ergebnis erst nach „Prüfen“ (`≠ O`, `kürzen : 2`, `✓ ausgeglichen`,
  Kastenrahmen grün bzw. rot gestrichelt), Gleichung **immer einzeilig, nie umbrechen** (`EquationRow`: Fit-Text – Schrift passt sich der Breite an, 26 → min. 10 px; jeder Stoff ist ein Tippziel ≥ 44 px, antippen → Zahlenauswahl 1–12, Niveau 4 bis 30; `FitLine` für die Gleichung über Quizfragen), ein Hauptknopf. Keine Werkzeugleiste, kein 3D.
  Teilchenbild nur, wenn alle Stoffe Moleküle aus Nichtmetallen sind (`hasModel` in `Molecules.tsx`, `isMolecular` in `@lern/chem`) – Salze und Metalle nie als Kalotten (sähe aus wie Elektronenpaarbindung); dann bleibt die Bühne leer (Start hat nur Moleküle).
- Stoff-Info (gemeinsam: `@lern/chem-ui` `Substance.tsx`, hier `components/Substance.tsx`): Stoffnamen sind Knöpfe (Start: Wortgleichung unter dem Titel, `NameLine`; Quiz: Hilfsmittel „Stoffe“,
  nicht bei Wortgleichungen und Atome zählen, Liste nach Namen sortiert). Blatt: Summenformel, Art (Molekül mit Atomzahlen, Ionenverbindung mit Ionen,
  Metall, Element), Strukturformel (`layout2D`: Ketten gerade, sonst ebene Zeichnung aus `MOL3D`; Käfige wie P₄O₁₀ nur 3D) und 3D-Modell
  (`Molecule3D` mit `data` aus `MOL3D`).
  Fit-Text misst neu bei Größenänderung und nach dem Laden der Schrift; passt es bei 10 px noch nicht, wird die Zeile als Ganzes skaliert (nie abschneiden).
  Die Gleichungszeile ragt nur in der Karte von Start über den Innenabstand hinaus (`.rg-controls .eq-fit`), nie in Quiz-Bild oder Antwort (dort schneidet der Rahmen ab).
  Formelgleichungen als MC-Antwort ebenfalls einzeilig mit Fit-Text (`renderOption` von `QuizScreen` → `FitLine base={18}`). „Ausgeglichen?“-Antworten mit Elementsymbolen („Nein – Ca, C und O stimmen nicht“).
  Kalottenmodell, **jedes Atom muss gut zu sehen sein (Vorrang vor echtem 3D)** (Geometrie `packages/chem/src/kalotte.ts`, Zeichnung `@lern/chem-ui` `Kalotte`, Test ≥ 65 % je Atom über `visibleShare`): Moleküle aus `MOL3D` (MMFF94) in der Ansicht mit dem am wenigsten verdeckten Atom (`orient`, 160 Richtungen), Bindungen bis ×1,15 gestreckt, gebundene Kugeln überlappen; ist trotzdem ein Atom unter 70 % sichtbar, die ebene Zeichnung wie eine Strukturformel (`flatView` aus `flat` der Daten, RDKit 2D, auseinandergeschoben; Glucose, Ethanol, H₃PO₄, CH₄ …; P₄O₁₀ als feste Standard-Zeichnung `flatFixed`, P₄ bleibt Tetraeder). Ketten CₙH₂ₙ₊₂ immer gerade wie die Strukturformel (`chainView`, kein Zickzack). Salze/Säuren aus Bausteinen, Kugeln nach Tiefe sortiert und dezent schattiert
  (radialer Verlauf – bewusste Ausnahme vom „keine Verläufe“), Farbfamilien nach CPK aus der Palette (`--hue-*`, Tokens `--atom-X` in `@lern/chem-ui` styles.css; die Tests prüfen Farbtoken, Atomzahlen und Abstände). Formeln nie änderbar.
- **Ablauf der Reaktion auf Abruf** (`components/AnimSheet.tsx` → `ReactionMorph` in `components/Morph.tsx`, Logik `morph.ts`): Start nach ✓ Knopf „Ablauf ansehen“ in der Statuszeile
  → Blatt mit Gleichung (Zahlen rot) und Animation: Edukt-Moleküle lockern sich (Bindungen brechen) → Atome wandern zum nächstgelegenen Platz gleicher Sorte im Produkt →
  rücken zusammen (neue Bindungen). Kein Atom verschwindet oder kommt dazu; Atomzahlen je Element stehen darunter. „Abspielen“/„Noch einmal“ und Regler Edukte ↔ Produkte,
  Abschnittsname als `Tag`. Im Quiz erst **nach** der Antwort bei Ausgleich-Aufgaben aus Molekülen (`feedbackExtra` → Blatt „Lösung“), vorher würde sie die Zahlen verraten.
  Nur für Gleichungen aus Molekülen (`hasModel`). Höhe im Blatt `min(62dvh, 560px)` – auf kleinen Handys hat die Animation in der Karte keinen Platz.
- Gespeichert: Stand der Start-Beispiele je Stufe (`reaktionsgleichungen-v2`, Version 3 übernimmt den alten Stand der Unterstufe); Quiz in `reaktionsgleichungen-quiz`.
  Stufen-Schalter Level I/II (Start immer Level I, nicht gespeichert).
- Erklärung Level I (18 Schritte): **Was passiert?** (Edukte/Produkte, Animation) · **Formeln lesen** · **Ausgleichen** · **Verbrennung**. Level II (15 Schritte):
  **Warum ausgleichen?** · **Teilchen zählen** · **Ionen als Block** · **Große Gleichungen**.
- Quiz (`src/quiz/tasks.ts`): je Stufe vier Level „Niveau 1–4“. Fertigkeiten `zaehlen` (OS mit Klammern), `pruefen`, `koeffizient`, `koeff-4`, `wort`, `aus-1`, `ausgleichen` (= Niveau 2), `aus-3`, `aus-4`;
  Antwortformen `mc`, `num` (Zahl eintippen), `balance` (Koeffizienten setzen, richtig nur ausgeglichen **und** gekürzt). Gleichung steht als `eq` groß über der Frage (`renderVisual`), nicht im Prompt.
  Erklärkarte je Niveau und Stufe (`explain.tsx`).
  Tipp beim Ausgleichen passend zur Reaktion (`strategy`): Verbrennung (zuerst alles außer O, zuletzt O₂), Metalloxid (Sauerstoff wechselt den Partner), sonst je Niveau.
  Fehlende Zahl: Tipp nennt das Element, falsche Antworten „Atome statt Teilchen“, „Index statt Zahl davor“, „1“. Wortgleichung: Falle „O statt O₂“ (`DIATOMIC`), ähnliche Stoffe.

## Neutralisation (`modules/neutralisation`)
- Lauge + Säure → Salz + Wasser mit Ionen-Bausteinen wie in der Ionenbindung (Breite = Ladung): Reihe 1 Metall-Ionen (gold), Reihe 2 OH⁻ (blau), Verbindungsstriche = H₂O,
  Reihe 3 H⁺ (blau, gestrichelt – ohne Farbe unterscheidbar), Reihe 4 Säurerest (grün). Neutral, wenn OH⁻- und H⁺-Reihe gleich lang sind. Knopf „Reaktion“ zeigt die Produkte
  (Salz aus Reihe 1 + 4, darunter die H₂O). Eine Formeleinheit antippen = Zerfall in Ionen (Blatt). Komponente `NeutralWall`, auch im Quiz und in den Erklärkarten.
- Logik in `packages/chem/src/neutralization.ts`: `PROTIC_ACIDS` = genau die Säuren der Tabelle (einprotonig HCl, HClO₄, HCOOH, HBr, HNO₃, CH₃COOH; zweiprotonig H₂S, H₂SO₃, H₂SO₄, H₂CO₃;
  dreiprotonig H₃PO₄) mit allen Säureresten je Stufe (Hydrogen-/Dihydrogen-Ionen), `HYDROXIDES` (Al(OH)₃ nur Oberstufe), `neutralEquation(base, acid, step)`:
  Zahl der H₂O = kgV(Ladung des Metall-Ions, abgegebene H⁺), Salz über `formula` aus ions.ts. Salze, die es in Wasser nicht gibt (Al mit Sulfid/Carbonat/Sulfit …), in `isKnownSalt`.
- Werkzeug „Hydroxid“ (nicht „Lauge“): Mg(OH)₂ und Al(OH)₃ sind kaum löslich (`poor`, Hinweis im Blatt); Lauge = Lösung eines Hydroxids in Wasser.
  MgS gibt es in Wasser nicht (`isKnownSalt`). Säurenamen: Chlorwasserstoff, Bromwasserstoff.
- Unterstufe nur vollständige Neutralisation; Oberstufe wählt in der Säuretabelle (Werkzeug „Säure“) auch den Säurerest = wie viele H⁺ abgegeben werden (Hydrogensalze).
  Säuretabelle nach Anzahl abgebbarer H⁺ (Gruppen senkrecht beschriftet), passt auch breit (≥ 1024 × 768) ganz ins Register. Gespeichert (`neutralisation-v1`): Lauge, Säure, Stufe der Abgabe, Anzahlen.
- Salzformeln ionisch, Kation zuerst (NaCH₃COO, KHCOO, Ca(HCO₃)₂). Wortgleichung mit Laugen-/Säurenamen (Natronlauge + Salzsäure → Natriumchlorid + Wasser).
- Quiz (`src/quiz/tasks.ts`, Katalog `misconceptions.ts`): protolyse, protonen (OS), restName, restLadung, hydroxid, bauen (Bausteine, Fallen 1 : 1 / vertauscht / nicht gekürzt),
  wasser, koeffizient (OS), salz, salzName, gleichung. Namensfallen nur mit Ionen, die es gibt (-id/-it/-at, Hydrogen-Formen nur beim Schwefel, Formiat ↔ Acetat). Säuretabelle als Hilfsmittel nur Oberstufe und nur bei Aufgaben, die nicht nach Namen/Ladung der Säurereste fragen.
- Erklärung Level I (15 Schritte): **Säuren** · **Laugen und Wasser** (vorgemachte Wand ohne Reaktion) · **Salz und Gleichung**. Level II (14 Schritte): **Mehrprotonige Säuren** ·
  **Ausgleichen** · **Salze benennen** (Formiat, Perchlorat eingeführt; `known`: Nitrat, Sulfat, Carbonat, Hydrogencarbonat, Phosphat aus der Ionenbindung).

## Nomenklatur (`modules/organik`)
- Organische Verbindungen frei zeichnen, der Name folgt nach IUPAC (deutsche Schreibweise: Benzen, Oct, Ethansäure, Butansäureethylester), mit weiteren Namen
  (Trivialname, Benzol-Schreibweise, ältere Schreibweise 2-Propanol, Diethylether, Ethylamin, Ethylbutanoat), Summenformel nach Hill und Stoffklassen. Kein 3D.
- Logik in `src/chem/`: `mol.ts` (Graph ohne H, Wertigkeit, NO₂ als Baustein mit einer Bindung), `rings.ts` (nur Einzelringe: Cycloalkane, Benzen,
  Heterocyclen mit einem O/S/N: Oxolan, Thiolan, Pyrrolidin, Oxan, Thian, Piperidin, Furan, Thiophen, Pyrrol, Pyridin …; kondensierte Ringe → Meldung),
  `naming.ts` (Hauptgruppe nach Rang Säure > Ester > Amid > Nitril > Aldehyd > Keton > Alkohol > Thiol > Amin; Stammsystem nach IUPAC 2013: meiste Hauptgruppen,
  Ring vor Kette, Ring mit N vor O vor S vor Carbocyclus, größerer Ring, längste Kette (C der Gruppe in der Kette vor „-carbonsäure“), meiste Mehrfach-, dann Doppelbindungen;
  Nummern: Hauptgruppe, Mehrfachbindungen, Doppelbindungen, dann meiste Vorsilben, Vorsilben, alphabetisch erste, Z vor E; gleiche Buchstaben: kleinere Nummern zuerst
  (1-Methylbutyl vor 2-Methylbutyl). Vorsilben rekursiv: (1-Methylethyl), Acetyloxy, (Dimethylamino), Methoxycarbonyl, Piperidin-1-yl; Klammern außen ( ) → [ ] → { } → ( );
  ohne Nummern steht eine Vorsilbe, die selbst Substituenten tragen kann, hinter einer anderen in Klammern (Chlor(methoxy)methan, [Ethyl(methyl)amino]);
  N, N′, N″ an mehreren Aminen; > 2 COOH an einer Kette → -carbonsäure; Ester „Säure + Alkyl + ester“, verschiedene Alkylreste mit Nummern (Butandisäure-1-ethyl-4-methylester),
  gleichwertige Säureteile (Diacetat eines Diols): bestes Stammsystem, dann alphabetisch; Nummern weglassen nur, wenn eindeutig: Ethanol, Propen, Methylcyclohexan, Butansäure;
  Keten C=C=O → Meldung). Varianten für das Quiz über `NameOptions` (andere Seite, kürzere Kette, nicht alphabetisch, ohne di/tri, andere Hauptgruppe).
  `layout.ts` (Zickzack 120°, Ringe als Vielecke, Start am fernsten C; an C=C nie eine gerade Linie und nie beide Gruppen auf derselben Seite, sonst wäre E/Z nicht ablesbar),
  `edit.ts` (Anhängen, Ziehen, Ring schließen, Bindung 1→2→3, Tauschen, Löschen), `smiles.ts` (Kurzschreibweise für Beispiele/Tests, E/Z mit / und \).
  Der Test prüft u. a. alle Beispiele, Namen unabhängig von der Atomreihenfolge (Zufallsmoleküle) und die Laufzeit.
- E/Z (`stereo.ts`): Rangfolge der Gruppen an jedem C der Doppelbindung nach CIP (Ordnungszahl, Sphäre für Sphäre, Mehrfachbindungen und Ringschlüsse als Duplikate),
  Seite aus der Zeichnung (höherrangige Gruppen gleiche Seite = Z, verschiedene = E; gerade gezeichnet → nicht ablesbar, Hinweis im Lösungsweg). Kein E/Z bei zwei gleichen
  Gruppen an einem C, bei kumulierten Doppelbindungen und im Ring unter 8 Atomen. Im Namen (E)- bzw. (2E,4Z)-, auch in Vorsilben ([(E)-Prop-1-enyl]); Z bekommt bei Wahl
  die kleinere Nummer; cis/trans als weiterer Name, wenn an beiden C ein H sitzt; Trivialnamen (Maleinsäure, Fumarsäure, Ölsäure, Geraniol …).
  Zeichnen: Tauschen an einer C=C spiegelt eine Seite (E ↔ Z, `flipBond`), „Ordnen“ behält E/Z (`keepStereo`); im Bild Achse, Vorrang-Bindungen und Buchstabe (E/Z).
- Prüfung der Benennung (`src/chem/check/`, `scripts/organik-oracle.py`): Generator mit festem Startwert (`generate.ts`: alle Alkane bis C10, jede Mehrfachbindung,
  jede Gruppe an jeder Stelle, Kombinationen, große verzweigte Gerüste, Ringe und Heterocyclen, Ester/Amide/Amine/Ether, E/Z-Fälle, Trivialnamen, Zufallsmoleküle;
  rund 17 500 Moleküle) → Export (`export.test.ts`, nur mit `ORACLE_OUT`) → Python: englischer Name (`english.ts`) an OPSIN, Struktur muss der gezeichneten gleichen
  (RDKit, E/Z aus dem Molfile `molfile.ts`), auch für weitere Namen; eigene Umsetzung der Regeln für Stammsystem und Nummern (die Wahl der App muss die beste sein),
  alphabetische Reihenfolge, Summenformel, Zahl der E/Z-Angaben, Eindeutigkeit (gleiche Struktur ↔ gleicher Name); im Export zusätzlich gleicher Name bei anderer
  Atomreihenfolge und nach neuem Zeichnen. Aufruf im Hauptordner: `python3 scripts/organik-oracle.py [--seed N]` (Voraussetzungen: RDKit, Java 11+; OPSIN-Jar über
  `--opsin`/`OPSIN_JAR`, sonst aus dem PyPI-Paket py2opsin). Geprüfte Namen als Korpus `korpus.tsv` (`--corpus`), den `npm test` nachrechnet; nach gewollten
  Änderungen den Korpus neu schreiben.
- Zeichnen: Atom antippen = Stift anhängen, in der Lewis-Formel ein H antippen = Stift genau dort anhängen, vom Atom ziehen = neue Bindung, im Modus Tauschen ziehen = Atom verschieben; Meldung oben sagt, warum etwas nicht geht (Wertigkeit voll …), Erfolg vibriert kurz; Knopf „Ordnen“ zeichnet neu im Zickzack; in 30°-Schritten, auf ein Atom ziehen = Ring schließen; Stifte C O N S + zuletzt gewählter
  (Mehr: F Cl Br I NO₂, Benzolring, Sechs-, Fünfring); Modus Anfügen | Tauschen | Löschen (Löschen/Tauschen: Atome gestrichelt markiert). Fester Maßstab (Bindung ≈ 56 px, Tippziele ≥ 48 px), das Bild verschiebt bzw. verkleinert sich nur,
  wenn die Zeichnung nicht passt; Bindung/H zählen nur, wenn der Finger auf demselben Ziel aufsetzt und loslässt. Lewis-Formel (alle H, freie Elektronenpaare als Striche) oder Gerüstformel.
  Name erst nach „Benennen“, danach live; Knopf „Farbe“ (gespeichert): jeder Teil des Namens hat eine Farbe – Stamm blau, Hauptgruppe rot, jede Vorsilbe
  (Methyl, Ethyl, Hydroxy, Oxo …) und der Alkylteil des Esters eigene –, dieselbe Farbe im Namen und an den Atomen der Formel (`NamePart`/`groupsByKey` aus naming.ts, `components/colors.ts`); Hauptkette hinterlegt, Nummern rot, Hauptgruppe markiert. Werkzeuge: Beispiele (nach Stoffklasse) | Schritte (Lösungsweg) | Gruppen (Rangfolge) | Ansicht | Zurück | Neu.
  Start: Gerüstformel, Farbe an, Beispiel 2-Methyl-3-oxohexansäure mit Name (`START` im Store; ältere Stände einmal umgestellt).
  Name in Farbe = farbige, kräftige Schrift (keine hinterlegte Fläche); Stamm blau, Hauptgruppe rot, Vorsilben grün/violett/grünblau …
  Gespeichert (`organik-v1`): Zeichnung, Stift, Ansicht, Name sichtbar, Farbe.
- Quiz (`src/quiz/tasks.ts`, Katalog `misconceptions.ts`): stamm, kette (Zahl), alkan, alken, lage (Zahl), klasse, endung, gruppen, ester, prio, mehrere, struktur (Name → Formel,
  Antworten als Gerüstformel). Falsche Namen kommen aus der Benennung selbst. Hilfsmittel: Groß (Formel bildschirmfüllend), Regeln (Stämme nicht bei stamm, Rangfolge nicht bei klasse/endung/prio).
  Level: 1 Alkane (Stämme bis Dec, längste Kette, Äste) · 2 Doppel- und Dreifachbindung (Alken/Alkin, Lage, E/Z) · 3 Funktionelle Gruppen (Stoffklassen, Endungen, Ester) ·
  4 Mehrere Gruppen (Rangfolge, Vorsilben, Name → Formel); feste Reihenfolge je Level. Erklärkarten (`quiz/explain.tsx`) führen ein, was die Erklärung nicht hat
  (Hept … Dec, Alken/Alkin, Stoffklasse, Ester, Ordnungszahl bei E/Z, Chlor-/Amino-Vorsilben). Begriff „Äste“ überall (Quiz, Lösungsweg `naming.ts`, Stolpersteine).
- Erklärung (22 Schritte, keine Stufen): **Alkane** (Stamm, Methan … Hexan) · **Äste und Nummern** (Hauptkette, Ast, Methyl, Nummerierung vom nahen Ende) ·
  **Mehrfachbindungen** (-en = Alken, -in = Alkin, Nummer, E/Z) · **Alkohole** · **Säuren und Rangfolge**.

## Polymere (`modules/polymere`)
- Keine Stufen. Leiste **Lernen | Experimentieren** wie Gemische: Lernen = sechs Kapitel, je Kapitel Lektion → zehn Aufgaben.
- **Experimentieren** (`views/ExperimentView.tsx`): am Anfang Auswahl **Polymerisation | Polykondensation | Polyaddition** (drei Karten mit Kügelchen-Bild),
  danach oben als Umschalter. Gespeichert (`polymere-v1`): Art, Ansatz je Art, Ansicht, Schalter „Bausteine farbig“, „Freie Elektronenpaare“ und „Vorher vermuten“ – der Ablauf selbst
  nicht (beim Öffnen beginnt der Ansatz von vorn). Ansatz:
  - Polymerisation: Monomer (`VINYLS` in `chem/data.ts`: Ethen, Propen, Styrol, Vinylchlorid, Methylmethacrylat, Acrylnitril, Tetrafluorethen, Isobuten,
    Butadien (Einbau 1,4), Vinylacetat), optional ein zweites (gleichzeitig = statistisches Copolymer; nacheinander = Blöcke nur bei lebenden Ketten, sonst zwei
    getrennte Polymere), Verfahren (`METHODS`): Dibenzoylperoxid und AIBN (radikalisch, Initiator), Ziegler-Natta TiCl₄ + Al(C₂H₅)₃ (koordinativ, Katalysator),
    Butyllithium (anionisch), BF₃ mit Wasser (kationisch).
  - Polykondensation / Polyaddition: 18 Monomere mit funktionellen Gruppen (`STEPS`: Disäuren, Säurechloride, Diole, Glycerin, Ethanol und Essigsäure als
    Kettenstopper, Diamine, Milchsäure und 6-Aminohexansäure als AB-Monomere, Phenol + Methanal, HDI, MDI, Bisphenol-A-diglycidylether), Monomer 1 + Monomer 2
    oder ein Monomer allein (nur AB-Monomere reagieren mit sich selbst).
  - Auswahl-Blätter: Monomere als Karten mit Kügelchen, Name und **Halbstrukturformel**; der reagierende Teil (C=C bzw. Gruppen) ist fett und in der Farbe des
    Monomers hinterlegt (`struct` mit `{…}`). Lange Namen an Wortfugen trennbar (weiches Trennzeichen). Niedrige Handys (≤ 700 px hoch): keine Ansatz-Zeile,
    die Werkzeugleiste zeigt stattdessen die Auswahl (Monomer, zweites Monomer, Verfahren).
- **Fachlogik** (`chem/rules.ts`): Verträglichkeit Monomer × Verfahren (`compat`: ok / short / none, Art des Misserfolgs, Begründung in kurzen Sätzen):
  Monomere mit O, N, Cl oder F **vergiften** Ziegler-Natta (freies Elektronenpaar besetzt die freie Stelle am Titan), Isobuten ist zu sperrig; Propen und Isobuten
  radikalisch nur kurze Ketten (Abriss eines Allyl-H); anionisch nur mit stabilisierenden Gruppen (Styrol, Butadien, Acrylnitril, Methylmethacrylat bei −78 °C) –
  lebende Ketten; Vinylchlorid, Tetrafluorethen, Vinylacetat anionisch nur Nebenreaktion; kationisch nur mit Elektronen schiebenden Gruppen (Isobuten bei −100 °C,
  Styrol); Ethen radikalisch nur unter Hochdruck und verzweigt (PE-LD, Code 4), mit Ziegler-Natta unverzweigt (PE-HD, Code 2); Propen und Styrol mit Ziegler-Natta
  isotaktisch, sonst ataktisch. Produkte (`polymerise`) mit Name, Kurzzeichen, Klasse (Thermoplast, Elastomer, Duroplast), Aufbau, Verwendung, Recycling-Code;
  bekannte Copolymere SBR/SB, SAN, NBR, EPM, EVA, SMMA, PVC/VAc. Stufenwachstum (`reactGroups`, `stepReact`): –COOH + –OH → Esterbindung + H₂O,
  –COOH + –NH₂ → Amidbindung + H₂O, –COCl + –OH/–NH₂ → … + HCl, –N=C=O + –OH → Urethangruppe, –N=C=O + –NH₂ → Harnstoffgruppe, Epoxid + –NH₂ → geöffneter
  Ring (ohne Nebenprodukt), Phenol + Methanal → CH₂-Brücke + H₂O. Funktionalität (`functionality`; –NH₂ zählt gegenüber Epoxid doppelt): eine Gruppe → nur kleine
  Moleküle (Kettenstopper), drei → Netz (Duroplast); gleiche Gruppen und Epoxid + Alkohol reagieren nicht. Bekannte Produkte: PET, PBT, PEA, PBA, PA 6.6, Aramid,
  PA 6T, PLA, PA 6, Phenoplast, PUR, TPU, vernetztes PUR, Polyharnstoff, Epoxidharz, Polyesterharz.
- **Atom-Ansicht** (`chem/scene.ts`, `chem/draw.ts`, `chem/stepdraw.ts`, `chem/mech/*`, `components/MechSvg.tsx`, `components/MechStage.tsx`): Valenzstrichformel
  (Zweifachbindung = zweite Linie daneben, wird beim Einbau ausgeblendet), Bausteine farbig hinterlegt (gleiche Farbe wie ihr Kügelchen), freie Elektronenpaare als
  Striche, Ladungen im Kreis, wandernde Elektronen als Punkte, **Pfeile vor jeder Bewegung** (halbe Spitze = ein Elektron, volle = Elektronenpaar).
  Jede Aktion ist ein Ablauf aus Schlüsselbildern (`Key`: Bild, Halten, Bewegen, Pfeile), dazwischen weich überblendet (Lage, Deckkraft, Bindungsordnung).
  Abläufe: radikalisch (Erwärmen: O–O bzw. C–N bricht, jedes Atom behält ein Elektron, CO₂ bzw. N₂ geht ab; Anlagern Monomer für Monomer; Abbruch durch
  Rekombination oder Disproportionierung), anionisch (Butyllithium lagert sich an, Kette lebt, Methanol beendet), kationisch (Säure aus BF₃ und Wasser, Anlagern,
  H⁺-Abspaltung), Ziegler-Natta (Aktivieren, Anlagerung an der freien Stelle, Vierzentren-Übergang, Einbau zwischen Titan und Kette, H₂ löst die fertige Kette,
  Vergiftung sichtbar: O/N/Cl/F bindet an das Titan, ✗; Isobuten prallt ab), Polykondensation (Gruppen rücken heran, Pfeile, Verknüpfung, H₂O bzw. HCl sinkt weg),
  Polyaddition (H wandert zum N, Urethan- bzw. Harnstoffgruppe; Epoxidring öffnet sich), Zweierkette (nur wenn beide Monomere lauter gleiche Gruppen
  haben – mit Milchsäure oder 6-Aminohexansäure wäre die Richtung nicht eindeutig), Phenoplast (CH₂-Brücke). Nicht passende Partner:
  ✗ und Begründung (gleiche Gruppen, Kettenende blockiert).
  Polykondensation/Polyaddition beginnen mit dem zweiten Molekül unter dem ersten (hochkant groß genug); passen die Gruppen nicht, bleibt Abstand, ✗ über der Lücke.
  Ringe ganz farbig hinterlegt (kein helles Sechseck innen), Benzolring überall mit drei Zweifachbindungen. Ziegler-Natta „+ H₂“: die fertige Kette
  gleitet sichtbar weg („PP abgelöst“). Nach Rekombination zeigt die Kügelchen-Leiste beide Ketten (Starter-Rest an beiden Enden).
  Während eines Ablaufs bleibt alles bedienbar: eine neue Aktion beendet den laufenden Ablauf. Nach einem Fehlschlag ein Vorschlag (passendes Verfahren aus
  `methodsFor`, bzw. „Partner …“ beim Stufenwachstum), „Von vorn“ dann als Zeichen. „+ Zweierkette“ immer beschriftet. Ansatz-Chips zweizeilig statt abgeschnitten.
  Bedienung: eine Zeile Aktionen (Start, Monomer als Kügelchen „+ S“, „Abbruch …“ öffnet die Auswahl der Abbruchart), Zurück (spielt die Aktionen ohne Animation
  nach, `replay`), Automatisch (`nextAuto`), am Ende „Produkt“ und „Von vorn“. Statuszeile nur kurze Kennzeichen (Schritt, n, „+ 2 H₂O“, Temperatur, lebend);
  die Begründung eines Fehlschlags steht hinter „ⓘ“ (Blatt). Unter dem Bild die Kette als Kügelchen; Antippen zeigt das Monomer (Strukturformel und Baustein).
  **Vorhersage** (`chem/mech/predict.ts`, Schalter „Vorher vermuten“ im Werkzeug Ansicht, gespeichert, Standard an): Eine Aktion antippen öffnet statt der
  Knopfzeile eine Frage mit 2–4 Antworten; die richtige Antwort ergibt sich aus dem Ablauf selbst (Ansatz vorher und nachher nachgespielt).
  **Erst vermuten, dann beobachten, dann erklären**: nach der Wahl nur ✓ bzw. „Noch nicht“ mit der gewählten (durchgestrichen, ✗) und der richtigen Antwort
  (✓, gestrichelt grün), dann „Ansehen ▷“ spielt den Ablauf; erst danach die Begründung, „Weiter“ und „Nochmal“. Am Handy ist die Werkzeugleiste währenddessen
  ausgeblendet (niedrige Handys auch der Umschalter Atome | Kügelchen). Beim Stufenwachstum ist das rechte Kettenende rot gestrichelt markiert.
  Erste Frage je Aktion: Start (Elektronen der O–O- bzw. C–N-Bindung, BF₃ + Wasser, Ethylgruppe ans Titan), Anlagern (wird eingebaut / keine Reaktion /
  Kette endet bzw. Titan wird vergiftet – feste Reihenfolge; lebende Ketten + neues Monomer: Block), Abbruch, Verknüpfen (+ H₂O / + HCl / sonst nichts /
  keine Reaktion), Stufenwachstum (verknüpft / Ende blockiert / keine Reaktion). Zweite Frage: an welches C bindet das Radikal bzw. das positive Ende
  (CH₂-Ende), Ziegler-Natta warum isotaktisch bzw. wo eingebaut, woher das O im Wasser (Ester), was die dritte Gruppe des Glycerins tut, welche Bindung des
  Epoxidrings sich öffnet, sonst Nebenprodukt. Jede falsche Antwort hat eine eigene Rückmeldung. Danach läuft die Aktion ohne Frage, „Automatisch“ fragt nie.
  Antworten gemischt (außer Ergebnis-Skala), dreispaltig nur, wenn kein Wort übersteht. Tests: `predict.test.ts`, `predict-english.test.ts`.
  Ausschnitt: kleine Anhängsel an Fokus-Atomen (–OH, –Cl, Benzolring, höchstens 7 Atome; `expandFocus`) gehören immer ganz ins Bild; was trotzdem
  über den Rand ragt, blendet `MechSvg` aus und endet an einer **Wellenlinie** (halbe Bindung + Welle) – nie ein Atom mitten im Zeichen abgeschnitten. Ringe am Rand verschwinden ganz (samt –OH/–H), nie ein halber Ring.
  Elektronen-Punkte nur am aktiven Ende (Test: nach jeder Aktion 1 Punkt beim Radikal, 2 beim Anion, sonst keiner); beim Zerfall des Starters gleitet das
  zweite Radikal beschriftet („2. Radikal“) zur Seite, die zwei Elektronen am CO₂ werden zur zweiten C=O-Bindung. Rekombination/Disproportionierung:
  die zweite Kette steht um 30° gedreht, damit ihre Gruppen nicht auf denen des ersten Kettenendes liegen.
  Kamera (`MechStage`): ein Ablauf beginnt im Ausschnitt seines ersten Bilds und fährt während des ersten Schritts zum ruhigen Ausschnitt des Rests; Ende,
  Zurück und andere Ansätze werden weich angefahren (550 ms), andere Bühnengröße ohne Fahrt. Stufenwachstum: Ausschnitt = Kettenende + Platz für das nächste
  Molekül (`span`), am Anfang beide Ausgangsstoffe ganz.
- **Kügelchen-Ansicht** (`chem/reactor.ts` rein rechnerisch, `components/Reactor.tsx` Canvas): Becherglas mit vielen Molekülen (Kügelchen 6–9 px, Anzahl nach
  Fläche), gedämpfte Zufallsbewegung, Federn zwischen gebundenen Kügelchen, leichte Streckung der Ketten, Abstoßung. Reaktionen bei Berührung mit Wahrscheinlichkeit:
  Kettenwachstum nur an aktiven Enden (gestrichelter Ring: Radikal rot, Anion blau, Kation dunkelrot) – wenige lange Ketten, freies Monomer bleibt bis zum Schluss;
  Starter zerfällt beim Erwärmen nach und nach (Gasbläschen CO₂/N₂ steigen auf); Abbruch zweier gewachsener Radikale (Styrol meist Rekombination, MMA meist
  Disproportionierung); anionisch starten alle Ketten gleichzeitig und leben, ein zweites Monomer wächst als Block weiter, Methanol beendet; kationisch wandert
  H⁺ weiter und startet neue Ketten; Ziegler-Natta: Ti-Kügelchen, Einbau zwischen Titan und Kette, „+ H₂“ löst die Ketten, polare Monomere vergiften (✗).
  Stufenwachstum: jede passende Gruppe zweier Moleküle reagiert, Nebenprodukt steigt als Bläschen auf (Bläschen schieben nichts an), Netz ab drei Gruppen
  (größtes Molekül ≥ 40 % der Bausteine). Reaktionspartner in der Nähe driften leicht aufeinander zu (sonst dauert es auf dem Bildschirm zu lange).
  Stufenwachstum langsam genug zum Zusehen (50 % nach etwa 10 s), mittlere Länge folgt 1/(1 − Umsatz); ab 80 % erklärt „ⓘ“, warum lange Ketten fast
  vollständigen Umsatz brauchen (Nebenprodukt entfernen, Vakuum). Methanol fällt sichtbar hinein („Methanol zugegeben“), nur einmal. Legende („?“):
  Baustein, Starter, aktives Ende, Bläschen. Ein neuer Ansatz setzt den Reaktor zurück (Kennzeichen „neuer Ansatz – von vorn“).
  Anzeige: Umsatz als schwarzer Balken, Ketten bzw. Moleküle, „Ø … Bausteine“ und „längste …“; Kennzeichen (Vorgang, lebend, vernetzt, vergiftet, + H₂O, abgelöst),
  Begründung hinter „ⓘ“. Antippen hebt das ganze Molekül hervor und zeigt das Monomer (Starter, Katalysator, Bläschen: kurze Info), Ziehen bewegt ein Kügelchen
  samt Kette. Akku: höchstens 30 Bilder/s, Stillstand bei Ruhe (6 s ohne Reaktion bzw. 3 s, wenn nichts mehr möglich ist), Pause-Knopf, unsichtbare Seite pausiert;
  Bewegung reduziert: Ablauf ohne Zwischenbilder vorausgerechnet. Der Reaktor bleibt beim Wechsel der Ansicht erhalten.
- **Lernen** (`quiz/tasks.ts`, `lessons.tsx`, `quiz/explain.tsx`, `quiz/visual.tsx`, Katalog `quiz/misconceptions.ts`): sechs Kapitel – Monomere und Polymere;
  radikalische Polymerisation; Katalysatoren und Verfahren (Ziegler-Natta, kationisch mit BF₃ und Wasser am Beispiel Isobuten – „positive Ladung“
  eingeführt –, anionisch); Polykondensation; Polyaddition; Struktur und Eigenschaften (Thermoplast/Elastomer/Duroplast,
  Copolymere, Ketten- vs. Stufenwachstum, Recycling-Codes). Lektionen spielen die Abläufe der Atom-Ansicht ab („Nochmal“), ein Schritt lässt das Radikal-Atom
  antippen; Bilder vorher/nachher am Handy untereinander. Aufgaben alle als Auswahl mit Bild (`Vis` als reine Daten: Monomer, gesättigtes Gegenstück, Baustein
  mit/ohne C=C, Kettenausschnitt iso-/syndio-/ataktisch, Mechanismus-Standbild mit Pfeilen, Kügelchen, zwei Monomere, Kettenbild, Gefäß mit Kügelchen:
  nur Monomer / wenige lange Ketten (als Schleife gelegt) + viel Monomer / drei mittellange Ketten, kaum Monomer – Stufenwachstum bei 90 % Umsatz, denn bei 50 % ist noch die Hälfte
  der Moleküle Monomer (mittlere Länge = 1/(1 − Umsatz)) / ein Riesenmolekül; **Umsatz** in der Lektion K6 eingeführt), teils mit Bild-Antworten (Ketten- vs. Stufenwachstum als vier Gefäße);
  jede falsche Antwort steht für eine Fehlvorstellung und hat eine Rückmeldung (Test: alle). Begründungen beginnen nicht mit dem Begriff der Antwort,
  wenn er schon fett davorsteht (`boldLead`, Test: kein Wort doppelt). Keine Aufgabe zweimal in einem Kapitel, auch nicht mit anders gemischten Antworten
  (`ordered`; das gelöste Beispiel im Quiz-Paket vergleicht ebenso ohne Reihenfolge). Bild-Antworten: Strukturformeln im eigenen Seitenverhältnis,
  Kennbuchstabe klein in der Ecke. „Mehr Starter“ zeigt zwei Gefäße vorher (wenig/viel Starter). Lektionen: Vergleichsbilder (`Two vs`) ohne Pfeil,
  mit Trennlinie und Überschrift über jedem Bild; Pfeil nur bei vorher → nachher. Antippen in der Lektion mit unsichtbaren Trefferkreisen je Atom.
  **Antippen im Bild** (`kind: "tap"`, `quiz/tap.ts`, `TapAnswer` in `quiz/QuizView.tsx`): Szene = Standbild der Atom-Ansicht (Ansatz, Aktionen, Bild des Ablaufs,
  wahlweise ohne Pfeile) oder Kettenausschnitt; `parts` = antippbare Atome (stabile Kennungen), `answer` = richtige Atome, Fallen je falschem Teil
  (`pick` bzw. bei mehreren `wrong`, dazu `n`, `adj`); mehrere Atome: antippen schaltet um, „Prüfen“; Lösung danach gestrichelt grün mit ✓, falsch gewählte
  mit ✗; vorher sind alle antippbaren Teile dünn gepunktet umrandet, daneben getippt → kurzer Hinweis, bei mehreren „x von n gewählt“;
  Trefferkreise mindestens 44 px (Bildmaßstab gemessen); Atomschrift ≥ 14 px vor und ≥ 12 px nach der Antwort
  (375 × 667, 360 × 740): enger Ausschnitt (`zoomTo` bzw. Teile nahe der reagierenden Stelle), knappe Rückmeldung (Grund + Lösung, Merksatz ausgeblendet), Erklärung im
  Blatt „Lösung“ über `feedbackExtra`; `zoom` (K4, K5): nur Teile nahe der reagierenden Stelle (`nearParts`), Ausschnitt um sie im Seitenverhältnis
  des Bildplatzes, antippbare Atome bleiben sichtbar, auch wenn ihr Nachbar am Rand ausgeblendet wird; `giftTap` zeigt das Monomer in Standardlage neben dem Titan (noch nicht gedreht); Lösung nach Fehlern in Worten (`sol`), nie als Nummer; unsichtbare Knöpfe für Tastatur und Vorlesen; im gelösten Beispiel zeigt das Bild die markierte Lösung. Aufgaben: K1 `bausteinTap` (zwei benachbarte
  C eines Bausteins, ohne farbige Hinterlegung), K2 `radikalTap` (C mit dem Radikal nach dem Anlagern), K3 `freieStelleTap`, `giftTap` (Cl/O/N am Titan),
  K4 `wasserTap` (drei Atome des Wassers), `schnitt` (Bindung antippen, die neu entstanden ist: C–O bzw. C–N zwischen zwei Bausteinen; Bindungen als Teile „a|b“,
  als Kapsel zwischen den Atomzeichen markiert: gepunktet vorher, gestrichelt mit ✓/✗ danach,
  `mode: "any"`; **Hydrolyse** in Lektion K4 eingeführt), K5 `hTap` (wanderndes H); die Auswahl-Fassungen bleiben in „Alles gemischt“ (`level(…, more)`).
  **Ordnen** (`kind: "order"`, `OrderAnswer`): K2 `ordnen` am Ende des Kapitels – vier Standbilder mit Pfeilen (Starter zerfällt, erstes Anlagern, Anlagern an
  die Kette, Abbruch durch Rekombination oder Disproportionierung; immer Styrol), gemischt, nie schon richtig; enger Bildausschnitt um die Pfeile, ohne Lichthöfe;
  nach dem Prüfen je Karte ✓ bzw. „richtig: ②“, Legende (nicht auf niedrigen Bildschirmen), keine Lösungszeile (die Plätze stehen an den Bildern).
  Antippen nummeriert ①–④ (Kennziffer rot), nochmal antippen nimmt die Nummer und alle späteren weg, ab vier „Prüfen“; danach je Bild ✓ bzw. ✗ mit dem richtigen
  Platz und Name des Schritts (Bilder dann klein bzw. auf niedrigen Bildschirmen weg). Gemeldet `startFirst`, `termLast`, `addsOk` → Fallen (Start nicht zuerst,
  Abbruch nicht zuletzt, Anlagerungen vertauscht). Vorlesen: vorher „Bild A“, danach mit Name.
  **Kette bauen** (`kind: "build"`, `BuildAnswer`): Vorrat aus zwei Kügelchen (Name, Formel; das erste ist schon gewählt), darunter 8 Plätze (am Handy 2 × 4 als
  Schlange: Strich von Platz 4 nach unten zu 5, zweite Zeile läuft zurück); Platz antippen = setzen, gesetztes antippen = entfernen (Hinweis 3 s nach dem ersten),
  Ziehen aus dem Vorrat bzw. lange Drücken (füllt alle leeren Plätze) als Abkürzung; „Prüfen“, wenn alle Plätze voll; danach Vorrat auf niedrigen Bildschirmen ausgeblendet.
  Auswertung `buildPattern` (Block = höchstens drei Abschnitte zu je ≥ 2, abwechselnd, zufällig nur mit je ≥ 3 von 8, sonst „fast nur ein Monomer“, nur ein Monomer,
  nicht einbaubares Molekül) → `pat`, `maj`; Kürzel gesättigter Moleküle in Großbuchstaben (EA, PA, CE, EB – keine Elementsymbole); erster unpassender Platz gestrichelt mit ✗. K1 `bauenHomo`
  (Monomer + gesättigtes Gegenstück im Vorrat), K6 `bauenCopo` (Block, alternierend, statistisch).
  „C‑Atom“ usw. mit geschütztem Bindestrich (U+2011, nie „C-⏎Atom“). Antworttexte kurz (einzeilig auf 375 px). Alltagsfragen nennen Gegenstände, die eindeutig zu einem
  Kunststoff gehören (Plastiktüte → PE, Stoßstange → PP, Fensterrahmen → PVC; nicht „Rohre“, die es aus PE und PVC gibt).
- Tests: `chem.test.ts` (Daten, Verträglichkeit, Produkte, alle über 1000 Ansätze der Atom-Ansicht automatisch durchgespielt und per Zurück nachgestellt,
  Reaktor-Ergebnisse: Kettenwachstum mit Restmonomer, lebende Ketten, Vergiftung, PET-Umsatz, Netz, Kettenstopper), `quiz/*.test.ts` (Gültigkeit, Katalog,
  einfache Sprache, Englisch), `guide*.test.ts` (Lektionen auf Deutsch und Englisch).

## Einheiten (`modules/einheiten`)
- Ein Verfahren für alles: ① Umrechnungszahl (`relation`: Kette über Nachbareinheiten, Flächen/Volumen als Produkt, zusammengesetzte Einheiten durch Einsetzen, Definitionen wie 1 l = 1 dm³, 1 J = 1 W·s) → ② Einsetzen und ausrechnen in einer Zeile (a · F, bei F < 1 zusätzlich a : 1/F, = Ergebnis). Logik in `packages/units` (`solve`).
- Rechnen nur mit exakten Brüchen (`Q`, BigInt); Anzeige deutsch (Komma, 10 000, 0,000 01), nicht endende Zahlen als 1/60, 1/3,6 bzw. „≈“.
- Neue Einheit: Atom in `ATOMS` (Familie, Faktor, ggf. `def`), in `QUANTITIES` eintragen – der Test prüft jede Kombination gegen SI-Faktoren.
- Stufen (Umschalter in der Kopfzeile, nicht gespeichert, Start Unterstufe): Unterstufe Länge, Fläche, Volumen, Masse, Zeit ohne seltene Vorsilben (`unitsFor(qt, false)`,
  `quantitiesFor(false)`); Oberstufe alle Größen und Einheiten. Seltene Vorsilben (µm, ms, MHz … – `rare` in `src/help.ts`): Tafel ohne Kette, direkt ① `1 nm = 10⁻⁷ cm`
  ② `50 nm = 50 · 10⁻⁷ cm = 0,000 005 cm`, Live-Hilfe als Vorsilben-Skala.
- Umrechnen: eine Rechenzeile `[Zahl] [von ▾] ⇄ [in ▾]` (native Auswahllisten), darunter Ergebnis und Pfeilkette/Skala als Bühne; Werkzeuge Stellenwerttafel | Tafel | Bild. Rechenweg in Kreide im Werkzeug „Tafel“ bzw. im Quiz im Blatt „Lösung“ (Kreideschrift Kalam/Cabin Sketch lokal über @fontsource). Stellenwerttafel: `pvColumns`/`placeValue`/`pvPlace` (Hohlmaße über Zusatzspalten hl, l, dl, cl, ml); am Handy nur benötigte Einheiten.
- Darstellung je Stufe (`scaleMode` in `src/help.ts`): Unterstufe immer Pfeilkette (+ Stellenwerttafel); Oberstufe bei jeder Umrechnung über Vorsilben
  **nur** die Vorsilben-Skala mit Zehnerpotenzen (Umrechnen, Tafel, Quiz-Hilfe „Skala“, Lösung, Erklärkarten mit Hochzahl · 2/· 3 bei Fläche/Volumen);
  ohne Vorsilben (h, ha, km/h …) Pfeilkette bzw. Einsetzen.
- Live-Hilfe (`components/LiveHelp.tsx`, Umrechnen, Quiz-Rückmeldung, Erklärkarten): Pfeilkette wie im Heft (`ArrowChain`, `chainFor`: unten „· 10“ nach rechts, oben „: 10“ nach links, Weg leuchtet, Zahl unter jeder Einheit) + Stellenwerttafel;
  seltene Vorsilben = Vorsilben-Skala n … G (10⁻⁹ … 10⁹, `PowerScale`, `prefixStep`): Umrechnungszahl = 10^(Hochzahl vorher − nachher), bei m²/m³ mal 2/3. Zusammengesetzt Einsetz-Kette (`SubstFlow`).
- Flächen und Volumen (`components/DimChain.tsx`): Pfeilkette mit den Längen darüber (km² ha a m² … unter km 100 m 10 m m …), jede Stufe „· 100“ mit „10 · 10“ bzw. „· 1000“ mit „10 · 10 · 10“ – Fläche = Länge · Länge.
- Bereiche: Erklärung | Quiz | Experimentieren (Umrechnen, Kennung `convert`). Quiz (`src/quiz/tasks.ts`) je Stufe fünf Niveaus: 1 Zehnerschritte (Werte nur 1, 10 … 0,0001; Längen, Massen, Liter, Umrechnungszahl; OS auch Vorsilben) ·
  2 beliebige Zahlen (1,5 g = 0,0015 kg; Mal oder geteilt?, Vergleichen) · 3 Flächen (inkl. ha/a, Größenvorstellung) · 4 Volumen (inkl. 1 l = 1 dm³; Tipp „gleich groß“) ·
  5 Unterstufe Zeit (umrechnen, Umrechnungszahl, „Was dauert länger?“ mit Falle 1 h = 100 min) bzw. Oberstufe zusammengesetzt, in der Runde nach Schwierigkeit sortiert (`STAGE`):
  Zeit → nur Zähler → nur Nenner → beide → Einheiten mit eigenem Namen (Pa, J, C …); Werte alltagsnah (`PLAUSIBLE`, z. B. Dichte ≤ 23 g/cm³).
  Level-Kennungen: Unterstufe n1–n5 (bisheriger Fortschritt), Oberstufe os-n1 … os-n5. Vergleichen: etwa jede vierte Aufgabe „gleich viel“, jede vierte eine Falle
  (Umrechnungszahl eine Stufe falsch bzw. wie bei Längen), jede falsche Antwort mit Rückmeldung. Nicht endende Zahlen als Bruch (1/60, 1/3,6).
  Umrechnungszahl-Aufgaben mit diagnostischen Distraktoren (`dis`: Gegenrichtung, „wie bei Längen“, Stufe zu viel/zu wenig).
- Quiz-Hilfsmittel passend zur Aufgabe, ohne Ergebnis (nicht bei Fragen nach der Umrechnungszahl): Pfeile (bzw. `DimChain`), Skala (wenn `prefixStep`), Stellen (Stellenwerttafel), sonst Einsetzen.
  Eingabe-Aufgaben zeigen als Bild die Aufgabe groß mit Einheitennamen (`TaskBanner`, Quadrat/Würfel bei Fläche/Volumen).
- Erklärung Level I (17 Schritte): **Längen** · **Masse und Hohlmaße** · **Fläche und Volumen** · **Zeit** (`known`: „gleich lang“). Level II (14 Schritte):
  **Vorsilben** · **Flächen und Volumen** · **Zeit und zusammengesetzte Einheiten**.

## Prüfen vor dem Commit
`npm run typecheck && npm test && npm run build`
Oberfläche: `npm run site`, dann `node scripts/check-ui.mjs site` (Übersicht und alle Module; zusätzlich `VP="360x740,412x915,1024x768"`, `LESBAR=1` und `LOCALE=en-GB`).
In dieser Umgebung: Chromium liegt unter `/opt/pw-browsers/chromium` (`CHROMIUM=/opt/pw-browsers/chromium`), Playwright global (`PLAYWRIGHT=…/playwright/index.mjs`); nie `playwright install`.
Zusätzlich gezielt prüfen, was geändert wurde: Ansicht öffnen (`#/<modul>`), Level umschalten, Aufgabe richtig **und** falsch lösen, Blätter öffnen, Animationen bis zum Ende
laufen lassen; je Zustand messen (Seite, `.ui-wb`, `.ui-wb-stage`, Aufgabenkarte, Blatt: `scrollHeight/scrollWidth` ≤ `clientHeight/clientWidth`, Bild nicht winzig) und Screenshots ansehen.
Nach dem Push: Läufe der Workflows für den neuen Commit abwarten (beide „success“), erst dann „veröffentlicht“ melden.

## Änderungsverlauf
Neueste Einträge oben. Format: **Bereich** – was geändert wurde und warum (Commit). Ältere Einträge sind zu Abschnitten zusammengefasst.

- **Quiz-Paket: Stolpersteine verschwinden nach Wiedersicherwerden** – `missBy` (Fehlvorstellung → Fertigkeiten), `clearMisses` nach jedem Treffer; Tests mit simulierter Uhr
  (auch Fällig-Runde: Fehler → morgen, Treffer → nicht am selben Tag wieder fällig). Polymere: Fällig-Runde nimmt die zehn am längsten überfälligen Fertigkeiten.
- **Polymere: Ordnen lesbar** – immer Styrol, enger Ausschnitt um die Pfeile, Karten ≥ 136 px bei 375 × 667 (Merksatz dort aus), nach dem Prüfen „richtig: ②“ statt „✗ ②“
  mit Legende, keine doppelte Lösungszeile; Zähler „2 / 4“ bricht nicht um; Formelgruppen (–NH–CO–O– …) brechen nicht am Strich um.
- **Polymere: keine überlappenden Beschriftungen in Kettenabläufen** – Test über alle Ketten-Ansätze (Schriftfelder je Atom); Li⁺ blendet beim Anrücken des Monomers aus und
  steht danach mit Abstand auf der freien Seite des neuen Endes; Ziegler-Natta: Butadien-Bausteine mit ihrer echten Breite (Ethylgruppe nicht mehr auf der Kette), vergiftendes
  Monomer wird gespiegelt, wenn es an die Liganden des Titans stößt.
- **Polymere: Stoffnamen in der Begriffsprüfung** – `terms.test.ts` prüft auch Stoffnamen (Monomere, gesättigte Gegenstücke): sie müssen in einer Lektion bzw. Erklärkarte
  bis zum Kapitel vorkommen; K1 nennt die gesättigten Gegenstücke, Diamin, Säurechlorid und Acrylglas eingeführt; Recycling-Code auch nicht mehr unter „Heute fällig“.
- **Polymere: Begriffsprüfung über alle Typen eines Kapitels** – `terms.test.ts` prüft auch die Typen aus `more` (laufen in „Alles gemischt“, „Heute fällig“, „Schwächen üben“);
  PBT und Aluminiumverbindung/Ethylgruppe in den Lektionen eingeführt; Recycling-Code in keinem Kapitel, bis sein Kapitel kommt (`LATER`).
- **Polymere: Antippen-Bilder groß vor und nach der Antwort** – kein vorab freigehaltener Platz mehr; enger Ausschnitt (vergiftendes Atom: Monomer + freie Stelle, hohe
  Monomere quer neben dem Titan; K4 nur reagierende Enden), knappe Rückmeldung, Merksatz nach der Antwort ausgeblendet; „Partner …“ sortiert passende nach oben.
- **Polymere: Begriffe eingeführt, bevor sie abgefragt werden (K1–K4)** – Test `quiz/terms.test.ts` (Fachwörter `GLOSSARY` in Aufgabentexten von Kapitel k müssen fett
  in Lektion/Erklärkarte 1…k stehen, Merksätze zählen nicht); K1 nur Ethen/Propen/Styrol/Vinylchlorid, Kunststoffe mit Grund (auch als Lektionsschritt); Lektionen führen
  gesättigt, Hauptkette, Seitengruppe, Benzolring, DBPO, Elektronenpaar, Endgruppe, Katalysator, PE-HD/PE-LD/Äste, syndiotaktisch, Blockcopolymer, Acrylnitril/Vinylacetat,
  Disäure/Diol, Polyester, Aminogruppe, Milchsäure/PLA, PA 6, Diepoxid ein; neuer K2-Schritt „mehr Starter“, K4-Schritt AB-Monomer; K3 ohne C≡N-/Acetat-Gift im Quiz, ohne AIBN,
  ohne „statistisches Copolymer“, neuer Stolperstein `zn-unpolar-gift`; K4 `bindungArt` ohne Urethan.
- **Polymere: K5/K6 nur Eingeführtes** – Lektion K5 führt Isocyanatgruppe, Harnstoffgruppe (neuer halb gelöster Schritt), Epoxidgruppe, „gespannt“ und Zweikomponentenkleber ein
  (Legende „R = Rest des Moleküls“); K5 ohne Thermoplast/Duroplast; K6 fragt Gegenstände mit ihrer Eigenschaft, Rückmeldung mit dem Ding bzw. mit den gezählten Brücken im Bild;
  Stolpersteine nach dem Paar (richtig, gewählt) mit neuen `elast-duro`, `thermo-duro` (Test); Recycling-Codes nur noch in „Alles gemischt“.
- **Polymere: Bild bleibt groß, Beschriftungen im Bild, Partner, Reaktor** – Antippen/Ordnen/Bauen: Platz für die Rückmeldung ist schon vor der Antwort frei, die Erklärung
  steht im Blatt „Lösung“ (Bild nach „Prüfen“ ≥ 90 % so hoch wie vorher); Beschriftungen in der Atom-Ansicht mehrzeilig und immer im Ausschnitt (Test); „Partner …“ markiert
  passende Partner mit „✓ passt“; Reaktor: Antippen nennt die Zahl der Bausteine des Moleküls; „fast nur ein Monomer“ antwortet zur verlangten Copolymer-Art (Test).
- **Polymere: Kette bauen nachgebessert** – Kügelchen vorgewählt, Bedienzeile, Kette am Handy als Schlange (eine zusammenhängende Kette), „statistisch“ erst ab je 3 von 8
  (sonst Rückmeldung „Fast nur …“), lange Drücken füllt, Kürzel ohne Verwechslung mit Elementsymbolen.
- **Polymere: Antippen nachgebessert (2)** – vergiftendes Atom: Monomer in Standardlage (verrät die Lösung nicht mehr), Fertigkeit „Atom, das das Titan vergiftet“;
  K4/K5 großer Ausschnitt um die reagierende Stelle; Bindungen vorher gepunktet als Kapsel markiert, danach ✓/✗ gestrichelt.
- **Polymere: Allylradikal bleibt sichtbar** – nach dem Allyl-H-Abriss (Propen/Isobuten radikalisch) bleibt das Allylradikal mit seinem Punkt und der Beschriftung „Allyl-Radikal – zu träge zum Weiterwachsen“ im Endbild
  (vorher verschwand es, nur Benzol blieb); Test.
- **Polymere: Kette bauen** – neue Antwortform `build`: K1 Polymer aus 8 Bausteinen bauen (gesättigtes Molekül als Falle), K6 Copolymer nach Auftrag bauen;
  Handeln statt Auswählen, Rückmeldung je gebautem Muster.
- **Polymere: Englische Fachbegriffe** – üblicher Schul-Fachwortschatz: propagation (Schritt; chain/step growth nur für die Art des Wachstums), repeat unit,
  cross-links (bridges), half-headed (fishhook) arrow, vacant site, acyl chloride (acid chloride), random (statistical) copolymer, raw rubber.
- **Polymere: Fachliche Feinheiten** – Tipp bei „neue Bindung antippen“ verrät die Stelle nicht mehr („Welche Bindung gab es in keinem der beiden Monomere?“);
  vergiftendes Atom genau benannt (O der C=O-Gruppe, N der Nitrilgruppe); Allyl-H-Abriss zeigt das H einzeln, Pfeile beginnen an der C–H-Bindung; Phenol markiert
  nur die drei reaktiven H; K3-Zusammenfassung kationisch ohne „Elektronen schiebend“ als Regel für alle.
- **Polymere: Schritte ordnen** – neue Antwortform `order` und Aufgabe `ordnen` am Ende von Kapitel 2: vier Mechanismus-Bilder (Start, zwei Anlagerungen, Abbruch)
  in die richtige Reihenfolge tippen; Abläufe als Kausalkette selbst herstellen statt nur auswählen. Fallen mit Rückmeldung je Fehlerart.
- **Polymere: Antippen nachgebessert** – sichtbar, was tippbar ist, Rückmeldung bei Tippen daneben, Zähler bei Mehrfachwahl, Tippziele ≥ 44 px, Lösung in
  Worten; Satz „Der Benzolring stützt sie …“ (Kationisch-Vorhersage) grammatisch richtig.
- **Polymere: Ränder und Ast-Rückmeldung** – Ringe am Bildrand werden ganz ausgeblendet (vorher blasse Reste beim Phenoplast); Rückmeldung zum Ast nennt
  die Verknüpfung des Ansatzes (Ester + H₂O, Ester + HCl, Urethan ohne Nebenprodukt).
- **Polymere: neue Bindung antippen** – Kapitel 4 endet mit „Tippe auf eine Bindung, die bei der Polykondensation neu entstanden ist“ (PET bzw. PA 6.6),
  Fallen C=O, Bindung im Diol/Diamin, Bindung im Monomer; Begriff Hydrolyse eingeführt.
- **Polymere: Antippen im Bild** – sechs Aufgaben im Lernen sind jetzt Antippen statt Auswahl (Radikal-C, freie Stelle, vergiftendes Atom, wanderndes H,
  drei Atome des Wassers, Baustein in der Kette). Grund: Auswahl-Antworten sind Wortwiedererkennung; Antippen verlangt, den Ort im Molekül zu finden.
- **Polymere: Glycerin verzweigt** – die dritte –OH ist eine eigene Andockstelle: „+ Ast“ hängt die Säure senkrecht darunter (nie in die Hauptkette,
  vorher überlappten zwei Benzolringe), Kügelchen-Leiste zeigt den Ast in einer zweiten Zeile, Vorhersage-Frage zum Ast, Kennzeichen „Ast an der dritten –OH“;
  keine Zweierkette mit Glycerin. Test für den Weg Verknüpfen → +T → +T → +Gl → +T → Ast.
- **Polymere: Ketten- vs. Stufenwachstum eindeutig** – eine Wortwahl überall („sehr lange Ketten und viel Monomer“ ↔ „kurze Ketten (im Mittel 10 Bausteine),
  kaum Monomer“), Gefäßbilder zeigen den Längenunterschied (lange Ketten in Schleifen mit „…“); Vorhersage-Rückmeldungen mit genau den Gruppen des Ansatzes,
  neutrale Grammatik, Ablauf nach „Ansehen ▷“ schneller (×1,6); Reaktor: Ladung als „+“/„−“ am aktiven Ende, Legende mit beiden Monomeren; K3-Zusammenfassung
  mit kationisch; Milchsäure allein mit mehr Abstand.
- **Polymere: Fachkorrekturen Experimentieren** – Disäure + Glycerin = Glycerin-Polyesterharz (Alkydharz-Typ, Lackharze) statt UP; Butadien am Metall
  1,4 (cis nur mit passendem Katalysator); Polybutadien, SBR, NBR, EPM … als **Kautschuk** (Elastomer erst nach dem Vulkanisieren); PUR- und PBA-Verwendungen;
  Amidbindung „wie die Peptidbindung“; ⓘ zu Al(C₂H₅)₃; „spaltet H₂O ab“, „am Titan“; Pfeile für die H-Wanderung (Urethan, Epoxid), Disproportionierung
  (vierter Halbpfeil) und Allyl-H-Abriss; „Kettenende: H⁺ abgespalten“.
- **Polymere: Stufenwachstum ohne Überlappung** – Ethanol wird gewendet, damit seine –OH zur Kette zeigt (vorher über dem Benzolring), Glycerin mit
  –CH(OH)– als Ast nach unten, Epoxid-Öffnung ohne übereinanderliegende H; Hinweis, dass auch das andere Ende blockiert werden kann (im Modell wächst nur
  das rechte Ende). Test: keine zwei nicht gebundenen Atome näher als 0,6 Bindungslängen in allen Ansätzen.
- **Polymere: Kleinigkeiten Reaktor und Namen** – Reaktor-Zeile bricht um statt abgeschnitten zu werden („Ø … · längste … Bausteine“), Legende für
  Ziegler-Natta (Ethylgruppe bzw. H am Anfang) und Kation mit „+“; Produktnamen „Polyamid 6.6 (PA 6.6, Nylon)“; Milchsäure als Monomer 1 setzt Monomer 2
  auf „ohne“ (reagiert allein); eigene Rückmeldung „radikalisch ataktisch“ bei der Verfahrenswahl für isotaktisches PP.
- **Polymere: Vorhersage beobachten, dann erklären** – Ablauf erst nach „Ansehen ▷“, Begründung nach dem Ablauf; eigene Rückmeldung je falscher Antwort;
  neue zweite Fragen (Radikal an das CH₂-Ende, isotaktisch, Ester-O, Glycerin, Epoxidring, Block bei lebenden Ketten); Aktivieren als lösbare Frage;
  markiertes Kettenende beim Stufenwachstum; am Handy mehr Platz für das Bild. Grund: Lernende lasen die Begründung, während die Bewegung lief.
- **Polymere: Fachkorrekturen Stufenwachstum und Texte** – Monomere mit zwei verschiedenen Gruppen (Milchsäure, 6-Aminohexansäure) wenden der Kette die
  passende Gruppe zu (vorher „keine Reaktion“ bei Milchsäure an einem –OH-Ende; Test für alle Kombinationen); Begründung bei keiner Reaktion nennt die Gruppen
  am Kettenende („Am Kettenende sitzt schon –COCl …“); MMA bietet zuerst die Disproportionierung an (häufiger als Rekombination); Produktnamen ohne doppelte
  Klammern; Distraktor „Baustein mit C=C“ bleibt (fünf Bindungen am C) mit Rückmeldung „Zähl die Striche“ (Test: nur dieser Distraktor hat fünfbindige C);
  „mittellange Ketten“ passend zum Gefäßbild; Vergleichsbild isotaktisch/ataktisch, Legende unter „mehr Starter“, kationisch präziser.
- **Polymere: Experimentieren verständlicher** – Startbild der Polyaddition lesbar, keine Überlappung bei „keine Reaktion“, Ring-Hinterlegung, Kette löst
  sich sichtbar vom Titan, Kügelchen-Leiste nach Rekombination, Knöpfe nie gesperrt, Vorschlag nach Fehlschlag, Zweierkette beschriftet, Chips zweizeilig;
  Reaktor: Stufenwachstum langsamer, Erklärung bei hohem Umsatz, Legende, Methanol sofort sichtbar, Kennzeichen bei Neustart.
- **Polymere: Bilder zum Umsatz** – Gefäß „Stufenwachstum bei 90 %“ mit drei mittellangen Ketten (im Mittel 10 Bausteine), lange Ketten des
  Kettenwachstums als Schleifen; Lektion K6 zeigt beide Gefäße zur Auswahl; „90 %“ bricht nicht mehr um; Melaminharz-Oberfläche.
- **Polymere: Sprache und Fachliches** – Radikal „reagiert sehr leicht“ statt „sucht einen Partner“, Katalysator „vergiftet“ statt „tot“, Propan als
  gesättigtes Gegenstück; Lektion K3 führt **kationisch** ein (wurde im Quiz abgefragt); Englisch: polyaddition ≠ addition polymerisation.
- **Polymere: Fehler aus dem Schülerdurchgang** – Elektronen-Punkt am CO₂ beim Zerfall von DBPO (wird zur C=O-Bindung), zweites Radikal sichtbar;
  abgeschnittene Moleküle: kleine Gruppen immer ganz im Bild, sonst Wellenlinie; Rekombination ohne Überlappung; größere Bild-Antworten; doppelte Wörter
  und Grammatik in Rückmeldungen; Rückmeldung zu jeder falschen Antwort; keine doppelte Aufgabe (auch nicht gelöstes Beispiel = Aufgabe); Recycling-Merksatz
  verrät nichts; Kapitel 4 ohne Isocyanat; Vergleichsbilder ohne Pfeil; größere Tippziele; „Mehr Starter“ mit Bild vorher. Grund: Rückmeldungen aus dem
  Durchgang mit Lernenden.
- **Polymere: Fachkorrekturen Lernen** – Stufenwachstum-Aufgabe und Lektion K6 bei 90 % statt 50 % Umsatz (bei 50 % ist noch die Hälfte der Moleküle
  Monomer), Bild mit wenig freiem Monomer, „Umsatz“ eingeführt; Starter-Bruchstück am Kettenanfang ist kein Radikal mehr; Tipp zur Verfahrenswahl passt zu
  Isobuten (zu sperrig für Titan); „einschmelzen und neu formen“ statt „gut zu recyceln“; Topfgriffe „oft“ aus Duroplast; Melaminharz-Arbeitsplatte statt Steckdose.
- **Polymere: Vorhersage in der Atom-Ansicht** – vor jedem neuen Schritt zuerst vermuten, was passiert (Elektronen beim Bindungsbruch, eingebaut oder
  nicht, wo das Radikal bzw. die Ladung danach sitzt, Nebenprodukt), mit Rückmeldung zu jeder Antwort; abschaltbar. Grund: selbst vorhersagen statt
  nur „weiter“ tippen (Vorhersagen vor dem Beobachten).
- **Polymere: Absturz bei „+ Zweierkette“ behoben** – mit einem AB-Monomer (Milchsäure, 6-Aminohexansäure) und einer Disäure passte die Zweierkette
  nicht zusammen; sie wird nur noch bei zwei Monomeren mit je gleichen Gruppen angeboten. Neuer Test: jede angebotene Aktion läuft an jeder Stelle des Ablaufs.
- **Polymere (neues Modul `polymere`)** – Experimentieren: Auswahl Polymerisation | Polykondensation | Polyaddition, Ansatz aus Monomer(en) und Verfahren
  (DBPO, AIBN, Ziegler-Natta, Butyllithium, BF₃), Entstehung Schritt für Schritt in Atomen mit Elektronenpfeilen (Start, Wachstum, Abbruch, Einbau am Titan,
  Vergiftung durch polare Monomere, lebende Ketten, Wasser- bzw. HCl-Abspaltung, wanderndes H) und als Kügelchen im Reaktor (viele Ketten, Copolymere und Blöcke,
  Umsatz, Netz, Antippen zeigt das Monomer, Ziehen bewegt Ketten, spart Akku). Lernen in sechs Kapiteln mit Lektionen und grafischen Aufgaben. Gemeinsam:
  Zeichen „pause“ in `@lern/ui`; `check-ui.mjs` prüft das Modul mit; `@lern/quiz`: Auswahl-Antworten nur zweispaltig, wenn kein Wort
  mitten im Wort umbricht, kompaktestes Menü mit Sternen über Tipp und Pfeil (Level-Namen brachen auf 375 × 667 mitten im Wort).
- **Arbeitsweise: Grafikqualität** – neue Pflichtregel „Grafiken von Anfang an sorgfältig und schön“ (labornahe, fachlich richtige Geräte, der Vorgang passiert
  sichtbar, Zeichnungen zu mehreren Zeitpunkten rendern und selbst kritisch prüfen, bevor veröffentlicht wird).
- **Gemische: Stoffe benannt, Trennverfahren genauer** – Lektionen nennen jeden Stoff mit Formel, Legende unter jedem Teilchenbild (Name + Formel), weil
  Schüler die Stoffe nicht kennen. Sieben mit echten Maschen (Körner fallen durch die Lücken), Destillation als Apparatur mit Thermometer und Liebig-Kühler,
  Chromatografie: schwarzer Punkt trennt sich in drei Farbstoffe.
- **Gemische: Lernen in Kapiteln** – „Erklärung“ und „Quiz“ zu **Lernen** zusammengefasst (Leiste Lernen | Experimentieren): fünf Kapitel (Teilchen und
  Atomsorten, Elemente und Verbindungen, Reinstoffe und Gemische inkl. Lösen, Gemische im Alltag, **Stofftrennung** neu), je Kapitel Lektion → zehn Aufgaben in einem
  Fluss, Lektion über das Buch-Zeichen wiederholbar (`QuizScreen` `lesson`, `LESSON_KEY`). Aufgaben grafisch statt Eintippen: Zählaufgaben als Auswahl,
  Antippen im Teilchenbild und in Trennverfahren, Verfahren als Bildkarten; acht Trennverfahren animiert (`Separation.tsx`). Quiz allgemein: Merksatz weicht
  dem „Ersten Schritt“ und am Handy nach der Antwort der Rückmeldung; „Landkarte“ bei 360 px nur als Zeichen. Grund: Lernen und Üben gehören zusammen, Bilder
  statt Eintippen. Zuerst nur Gemische, weitere Module folgen nach Rückmeldung.
- **Bereichsleiste (alle Module)** – einheitlich **Erklärung | Quiz | Experimentieren**: „Erklärung“ ist jetzt ein gleich gestalteter Eintrag der Leiste (vorher eigener
  schwarzer Knopf links), Werkbank-Bereiche heißen überall „Experimentieren“ (vorher Probieren, Bauen, Formeln bauen, Moleküle bauen, Neutralisieren, Zeichnen,
  Umrechnen, Start) mit Becherglas-Zeichen; Ring „noch nie durchlaufen“ kleiner, damit er die Schrift nicht überdeckt. Grund: einheitliche Bedienung in allen Apps.

- **Doku** – Pflicht eingeführt: jede relevante Änderung aktualisiert dieses Dokument und bekommt einen Eintrag hier (lückenloser Verlauf).
- **Doku** – Lernprinzipien, Motivation, Zugänglichkeit und bewährte Prüfmethoden ergänzt (a4043fe).
- **App-Kennung** – neutral `app.edi.lernen` in Capacitor, Android (applicationId, namespace, Paket von MainActivity, strings.xml) und iOS (Bundle-ID); vor dem ersten
  Store-Upload, danach unveränderlich. README ohne Website-Adresse, Nomenklatur in der Modultabelle (c8bb7fd).
- **Doku** – dieses Dokument vollständig neu gegliedert: Arbeitsweise, Didaktik, Erklärung, Quiz-Beispiele, Sprache, Stand je Modul (46e8c70).
- **Organik** – Alken/Alkin (Erklärung + Erklärkarte) und Stoffklasse (Erklärkarte) eingeführt, weil das Quiz sie benutzt; „Äste“ statt „Seitenketten“ in Quiz,
  Lösungsweg und Stolpersteinen (einheitliche Fachsprache) (80d21a8).
- **Reaktionsgleichungen** – Start-Beispiele je Stufe, Level II komplexer (Gärung, Fotosynthese, Ethanol, Ostwald, Oktan); „Ablauf ansehen“ öffnet die Animation
  Edukte → Produkte als Blatt (Start nach ✓, Quiz erst nach der Antwort, damit sie die Zahlen nicht verrät); Speicherformat Version 3 je Stufe.
  **Kopfzeile** – bei ≤ 374 px engere Abstände (vorher 13 px Überlauf bei 360 px) (ec088b1).
- **Organik** – Erklärung nach vorgemacht → halb → selbst (22 Schritte); `mode` je Erklärungsschritt verpflichtend (Typ und `checkGuide`) (0d792b6).
- **Alle Erklärungen** – je Modul nach vorgemacht → halb gelöst → selbst umgebaut, Begriffe vor dem Abfragen fett eingeführt (automatische Begriffsprüfung):
  Einheiten (d60cb2e), Neutralisation (1610c40), Reaktionsgleichungen (7be50ac), Elektronenpaarbindung (ad7005b), Ionenbindung + Start mit gelöstem CaCl₂ (e9a75dd),
  Atombau (ccd7a32; K/L/M, Kation/Anion, isoelektronisch eingeführt, Quiz ohne „Grundzustand“, Ladung 0 = neutral: 5ee793b).
- **Grundlage Lernen an Beispielen** – Guide-Schrittarten worked/faded/free mit Lösungsweg und Lücke, Prüfregeln; Quiz zeigt vor jeder neuen Fertigkeit ein gelöstes Beispiel,
  danach den ersten Schritt; Gemische umgestellt (Erklärung, Zählen mit abnehmender Hilfe) (d70012a).
- **3D** – Modelle flüssiger: gemeinsame Geometrien, Beschriftungen nur bei Bedarf, keine Kantenglättung bei hoher Pixeldichte; Gemische-Animation pausiert, solange das
  Stoff-Blatt offen ist (dc58d95).
- **Android-Release** – signiertes App-Bundle per Workflow, Schlüssel aus Secrets, versionCode = Laufnummer (56e1100).
- **Atombau Level II** – Orbitalmodell: 3D-Orbitale aus wasserstoffähnlichen Wellenfunktionen, Werkzeug Wellenmechanik, Erklärung von Grund auf (2d25da8, 6b20208);
  Kästchenschema zum Selbst-Befüllen in Erklärung und Quiz (12f4f82, e32c6ee).
- **Gemische-Quiz** – vier Lern-Level mit festem Ablauf und Merksatz je Aufgabe (1d9f687).
- **Erklärung (Baustein)** – Kapitel (`part`), Anschauen nach der Antwort (jeder Schritt wartet auf „Weiter“), Vorhersage-Schritte; Beschriftungspfeile enden am Rand des Ziels
  und weichen Elektronen aus (de715c8, cd1e7de, 545df18, 942252c, d033dde).
- **Kraftfeld MMFF94** in TypeScript (auch im Web, Hintergrund-Thread), gemessene Strukturen für Schulmoleküle; 3D nach EPA für kleine Ringe (a9043ed, b4f3869, de94eee, e0c3cb3).
- **Android/iOS** – Capacitor-Projekte mit Icons und Startbild, Workflow für Debug-APK und iOS-Simulator-Build (aa180ca).
- **Englisch** – Paket `@lern/i18n`, Sprachwahl aus der Gerätesprache und Knopf DE/EN, alle Module und Pakete zweisprachig, Tests gegen deutsche Reste in der englischen
  Fassung, englische IUPAC-Namen (e618b4c, b2eedf8, 2fc3b82, 8d6244a, 4134a87).
- **Nomenklatur (neues Modul `organik`)** – Zeichnen (Lewis/Gerüst), Name nach IUPAC 2013 mit weiteren Namen, Farbe je Namensteil, E/Z nach CIP, Lösungsweg, Quiz,
  Prüfung gegen ein externes Namens-Orakel (5a4bbec, 65636a0, 82bf265, 2098fc8, 95d6b1a, de299e4).
- **Erklärung in jeder App** – geführter Durchgang zum Mitmachen; Tipps, Rückmeldung zu jeder falschen Auswahl, Bestätigung mit Regel, Begriffe mit Pfeilen im Bild,
  Lösung nie im Bild verraten (21b4c45, a1880ac, 8872bc1, 9fc312c, 3668610, 88c4f40, dfff862).
- **Fachsprache und Didaktik** – beschreibend statt „Atom will“, Gruppen je Stufe, Ladungsschreibweise, einheitliche Begriffe, diagnostische Distraktoren in allen Modulen,
  Tipps je Reaktionstyp, keine erfundenen Namen (8dc7397, 9ed7f22, bd06527, f9ca809, a75e003).
- **Einheiten** – fünf Quiz-Niveaus je Stufe, Hilfen passend zur Aufgabe, Pfeilkette für Flächen/Volumen, Oberstufe mit Vorsilben-Skala (b2119ce, e9def8e, fc6f8f9).
- **Elektronenpaarbindung** – gewinkelte Strichformel, Oktett-Kreise im Vordergrund mit Schalter, Paare als Punkte oder Striche, Keilstrichformel mit Standard-Tetraeder
  (1c27344, e162d5e, 34d669a). **Atombau** – PSE nach Blöcken färben (fc6f8f9).
- **Gemische (Modul)** – Glas mit Lupe, fließende Teilchenbewegung mit festem Takt, Beispiele beginnen „vorher“, Kristall löst sich von außen, Öl als Stäbe mit Tröpfchenbildung,
  Messing schmilzt und erstarrt ohne Sprünge, Sprudel mit Gleichgewicht, Öffnen und Kohlensäure, Temperaturregler, reduzierte Bewegung, Müsli als Gemenge
  (6e59c81 … 839a514, afb4a22, 62d9935). **Lesbar** – Zeichnungen ohne zusätzlichen Buchstabenabstand (2e4a770).
- **Grundaufbau** – Lern-Apps zu einer App mit Modulen zusammengeführt (modularer Monolith, Hülle, Laden bei Bedarf, Architekturprüfung); Quiz ohne Wiederholungen,
  Stoff-Info, eindeutige Schrift (Cl/CI), Knöpfe als Tasten (9e1dd57, 4b3df62, 38634bd, 14857e6).
