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
  (`native.yml`: Debug-APK als Artefakt, iOS-Simulator-Build) – beide nur, wenn der Push etwas ändert, das Prüfung oder Build lesen (`paths`: `apps/`, `modules/`,
  `packages/`, `scripts/`, `package.json`, `package-lock.json`, `tsconfig.base.json`, der Workflow selbst; reine Doku-Commits starten nichts, neue Build-Eingaben dort ergänzen).
  Erst wenn beide Läufe für den neuen Commit grün sind, gilt etwas als veröffentlicht.
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
- **Android-Release** (`release.yml`, nur von Hand gestartet): prüft (typecheck, alle Tests), baut ein signiertes App-Bundle (AAB) als Artefakt und **lädt es
  standardmäßig in die Play Console hoch**. Eingaben: `version_name` (Versionsname, z. B. 1.0), `play_track` (Ziel-Track: `internal` = Interner Test – Voreinstellung,
  `alpha` = Geschlossener Test, `production`, `keiner` = nur bauen, kein Upload), `play_status` (`draft` – Voreinstellung, solange die App im Store noch nicht
  veröffentlicht ist, Google nimmt dann nur Entwürfe an; danach `completed`, damit der Rollout gleich startet). `versionCode` = Laufnummer des Workflows (steigt automatisch).
  Repository-Secrets: `UPLOAD_KEYSTORE_BASE64` (Upload-Schlüssel .p12 als Base64) und `UPLOAD_KEYSTORE_PASSWORD` (immer), `PLAY_SERVICE_ACCOUNT_JSON`
  (JSON-Schlüssel eines Google-Cloud-Service-Kontos mit Release-Rechten für die App in der Play Console; nötig, außer bei `play_track` = `keiner` – fehlt es, bricht der Lauf
  mit Hinweis ab). Die allererste Version einer neuen App muss einmal von Hand in der Play Console hochgeladen werden, erst danach geht der Upload automatisch.
  Hochgeladen wird mit der Action `r0adkll/upload-google-play`, festgelegt auf den Commit von v1.1.5 (fremde Actions nur mit Commit-SHA, nie nur mit Tag).
  `apps/edi/android/app/build.gradle` liest `UPLOAD_KEYSTORE_FILE`/`UPLOAD_KEYSTORE_PASSWORD`, `VERSION_CODE`, `VERSION_NAME` aus der Umgebung.
  Schlüsseldateien (`*.p12`, `*.jks`, `*.keystore`) und Passwörter **nie** ins Repository (`.gitignore`), nie in Logs, nie im Gespräch abfragen.
- App-Kennung `app.edi.lernen` (Capacitor `appId`, Android `applicationId`/`namespace`/Paket von `MainActivity`, iOS Bundle-ID) **nie ändern** –
  der Play Store bzw. App Store würde sie als neue App behandeln. Keine persönlichen Namen in Kennungen.
- App-Icons: Vorlage `apps/edi/assets/` bzw. `public/icons/icon-512.png`; native Icons mit `npx @capacitor/assets generate` (im Ordner `apps/edi`).
- Hilfsskripte für einmalige Browser-Prüfungen gehören nicht ins Repository (temporär außerhalb anlegen); dauerhaft nützliche Prüfungen als Test oder in `scripts/`.

## Didaktik (verbindlich für alle Module)
- **Bereich „Üben“** (statt „Lernen“ bzw. Erklärung und Quiz): Name, englischer Name („Practise“) und Zeichen kommen zentral aus `@lern/ui`
  (`uebenTab(id)`, `uebenLabel()`), nie im Modul selbst geschrieben. Alle Module haben diesen Bereich (bei den bisherigen Quiz-Modulen heißt nur der Bereich so, der Inhalt ist das bisherige Quiz). Was im Bereich geübt
  wird, gestaltet jedes Modul selbst (Polymere und Gemische: Kapitel mit Lektion und Aufgaben; Reaktionsgleichungen: 3 × 10 Gleichungen je Stufe; übrige: Quiz-Runden).
  **Ausnahme Ionenbindung** (erprobt die neue Ordnung, nur dieses Modul): Bereiche **Lernen | Experimentieren** – „Lernen“ ersetzt Erklärung und Üben durch Kapitel aus je 25 Folien
  (Erklärung und Aufgaben in einem Fluss, mindestens die Hälfte Modell-Folien; siehe „Ionenbindung“). Alle anderen Module behalten Erklärung | Üben | Experimentieren. **Bausteine des Übens, die mehr als ein Modul nutzt, liegen zentral in `packages/`** (spätestens
  beim zweiten Modul dorthin verschieben, nicht im Modul kopieren); jede Änderung an einem solchen Baustein wird in allen Modulen geprüft, die ihn nutzen.
- **Lernen an gelösten Beispielen, dann Hilfe ausblenden** – überall nach demselben Muster: zuerst ein **fertig gelöster Fall** (vorgemacht, Lösungsweg Schritt für Schritt),
  dann ein **halb gelöster** (eine Lücke zum Ergänzen), dann **selbst lösen** – und mit dem nächsten Gedanken wieder von vorn (vorgemacht → halb → frei → vorgemacht …).
  Nie mit freiem Entdecken beginnen. Umsetzung:
  - Erklärung: Schrittarten `worked` / `faded` / `free` (siehe „Erklärung“), automatisch geprüft.
  - Quiz: vor der ersten Aufgabe einer noch nie geübten Fertigkeit ein gelöstes Beispiel, die nächste Aufgabe zeigt den ersten Schritt (siehe „Quiz“).
  - Werkbank: Start mit einem gelösten Zustand (Ionenbindung startet mit fertigem CaCl₂; Nomenklatur startet mit gezeichnetem und benanntem Beispiel);
    Hilfen zum Selbsttun statt Abfragen (Gemische „Zählen“: alle Zahlen stehen da, Antippen markiert die gezählten Teilchen im Bild).
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
  Schalter „Lesbar“ (mehr Abstände), Klang standardmäßig aus, Vorlesen im Quiz (nur mit einer Stimme des Geräts, `localService` – eine Netzwerkstimme
  schickte den Text an einen fremden Dienst; ohne lokale Stimme kein Knopf), „Zum Inhalt springen“ setzt nur den Fokus (die Adresse bleibt).
  Antworten als Bild: Vorlesen und Screenreader sagen nie den Antworttext, wenn er die Lösung nennt („Monomer Propen“, der Name zur gesuchten Formel) –
  `optionLabel` an `QuizScreen` liefert eine neutrale Beschriftung (z. B. die Formel, so viel wie das Bild zeigt) oder "" = nur „Antwort A“; das Bild selbst ist dann für Screenreader verborgen.

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
  bei derselben Aufgabe fort; Stufenwechsel verliert nichts; „Zurück“ schließt jedes Blatt (im Browser und mit der Zurück-Taste der Android-App).
- **Erklärungen durchspielen** (alle Schritte, alle Größen), **Animationen** bis zum Ende laufen lassen und Zwischenbilder ansehen (Sprünge, Zittern, Überlappungen).
- **Texte durchsehen**: alle erzeugten Texte einer Runde ausgeben und lesen (Grammatik, Einzahl/Mehrzahl, Artikel, nicht eingeführte Begriffe, englische Fassung).
- Neue Prüfungen, die einen echten Fehler gefunden haben, als Test ins Repository übernehmen.

## Erklärung (`@lern/ui` `Guide`, je Modul `src/guide.tsx`)
- „Erklärung“ ist der erste Eintrag der Bereichsleiste (siehe „Bereichsleiste“), rotes Abspiel-Zeichen; roter Ring um das Zeichen, bis die Erklärung einmal ganz durchlaufen
  ist (`lern-erklaert-<Modul-Kennung>`, sprachunabhängig über `CurrentModul` der Hülle; ein alter Stand unter dem Namen der App wird übernommen). Ganzer Bildschirm, nie scrollen; wächst der Text (Rückmeldung, Lösungsweg) über den Bildschirm, wird
  die Erklärung enger (`data-fit`, gemessen an den Kästen von Bild und Text, nicht an Einblend-Verschiebungen), zuletzt behält das Bild 72 px und der Text scrollt –
  nie unten abgeschnitten. Jedes Modul übergibt `guide` an `LernApp` (je Stufe eigene Erklärung, Funktion `guideFor(stufe)` bzw. `GUIDE`).
- Aufbau: `GuideDef { title, steps, outro, known? }`. 10–48 Schritte; ab 16 Schritten in **Kapiteln** (`part` am ersten Schritt, Name im Kopf, Fortschrittsbalken in Abschnitten),
  jedes Kapitel höchstens 8 Schritte. Ende: Zusammenfassung „Das kannst du jetzt“ (`outro`), Knopf „Zum Quiz“. Inhalte decken alle Aufgabentypen des Quiz der Stufe ab.
- **Schrittarten** (`mode`, Pflicht bei jedem Schritt; Kennzeichen oben: „Vorgemacht“ / „Halb gelöst – ergänze“ / „Jetzt du“):
  - `worked`: Lösungsweg `lines` erscheint Zeile für Zeile („Nächster Schritt“), Bild im gelösten Zustand, **keine** Antwort, keine `options`/`num`/`why`/`tip`, Pflicht `ok`.
  - `faded`: Lösungsweg mit **genau einer Lücke** `{?}`; die Lücke darf die gesuchte Zahl nicht schon enthalten; nach dem Lösen wird sie gefüllt.
  - `free`: selbst lösen; `lines` (optional) erscheinen erst nach der richtigen Antwort.
  - Reihenfolge: jedes Kapitel (und der erste Schritt) beginnt `worked`; `faded` nur nach `worked`/`faded`; `free` nur nach `faded`/`free`.
- Jeder nicht vorgemachte Schritt verlangt eine Handlung: Auswahl (`options`), Zahl (`num`, mit Einheit; Trennzeichen wie in der Sprache – `readNumber` in `@lern/i18n`:
  Deutsch „1.000“ = 1000 und „0,25“, Englisch „1,000“ und „0.25“, Leerzeichen-Gruppen immer; gleiche Regel wie `parseAnswer` in `@lern/units` und `NumberAnswer`;
  `checkGuide` prüft, dass jede übliche Schreibweise der Antwort als richtig gilt) oder ein Ziel im Bild antippen (`visual` ruft `pick(id)`),
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
- Optionale Zusätze von `Guide` (wirken nur, wo ein Modul sie übergibt; bisher nur Ionenbindung „Lernen“): `badge` (Kennzeichnung im Kopf statt „Erklärung“, Buch-Zeichen),
  `start`/`onStep` (beim Öffnen an einer Folie fortsetzen, jede neue Folie melden), `tools` (Hilfsmittel je Schritt – stehen dann mit „Nächster Schritt“/„Weiter“ in einer Leiste
  unter dem Text, `.ui-guide-foot`, jedes öffnet ein Blatt über der Erklärung; schmal steht „Weiter“ in voller Breite darunter).
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
  und den Fenstertitel, liefert `HomeLink` (Home-Knopf → Übersicht), fängt Ladefehler ab („Neu laden“). Unbekannte Adresse → Übersicht – deshalb nie Sprungmarken über die Adresse (`#main` wäre ein unbekanntes Modul). `CurrentModul` (Kontext) nennt den Paketen
  das offene Modul (Kennung, Namen), z. B. für Speicher-Schlüssel.
- Stile: CSS unter `modules/<id>/src/` gilt nur im offenen Modul (`scripts/modul-scope.ts`, PostCSS: `:root` → `:root:where([data-modul=id])`, sonst
  `:where(:root[data-modul=id]) …`, ohne zusätzliche Spezifität). Stile der Hülle (`apps/edi/src/shell.css`) nur mit Präfix `ov-`/`edi-`; Pakete mit `ui-` bzw. eigenem Präfix.
- Gespeichert wird je Modul unter eigenen localStorage-Schlüsseln (`storage` im Modul). **Schlüssel nie umbenennen** und **Adresse der Website nie ändern** –
  sonst ist der Fortschritt der Lernenden weg (localStorage gehört zur Adresse). Neue Version eines Speicherformats: alten Stand beim Laden übernehmen.
- Ein Service Worker, eine Offline-Datei, eine Capacitor-Konfiguration (`apps/edi`). Frühere Einzel-Apps unter `…/<id>/`: der Build erzeugt dort eine Weiterleitung
  auf `#/<id>` und ein `sw.js`, das den alten Service Worker samt Speicher abmeldet (`legacy` in `apps/edi/vite.config.ts`, nicht entfernen).
- Browser-Unterstützung: Safari/iOS ab 16, Chrome/Android ab 107 (Vite-Standardziel); keine Regex-Lookbehinds (iOS < 16.4).

## Regeln
- Jedes Modul hat nur zwei Arten von Ansichten: **Experimentieren** (Werkbank: selbst bauen, zeichnen, vorgegebene Beispiele lösen) und **Quiz**, dazu die **Erklärung**
  als Vollbild. Keine eigenen Übungsseiten. Ionenbindung: **Lernen** (Kapitel aus Folien im Vollbild der Erklärung) statt Quiz und Erklärung.
- **Arbeitsteilung der Agenten**: siehe `docs/agenten.md` (Rollen, Prüfkette Fach – Gestaltung – Realität, Sofort-Warnung).
- **Experimentieren stellt nie Fragen** – keine Vorhersage-, Auswahl- oder Richtig/falsch-Fragen, kein ✓/✗ zu einer Antwort, keine Punkte. Experimentieren ist freies
  Ausprobieren: Aktion wählen → ansehen; Zustand nur als kurze Kennzeichen (z. B. „✓ neutral“, „✓ ausgeglichen“ nach „Prüfen“ in Reaktionsgleichungen – sie beschreiben
  den Zustand der Werkbank, bewerten keine Antwort und vergeben keine Punkte), Begründungen auf Abruf (ⓘ). Fragen, Vorhersagen und Rückmeldung zu Antworten gehören
  ausschließlich in **Üben** (Lektion und Aufgaben bzw. Quiz-Runden).
- **Bereichsleiste in allen Modulen gleich** (Handy unten, ab 900 px oben in der Kopfzeile): **Erklärung | Üben | Experimentieren** (Atombau zusätzlich „Periodensystem“/„PSE“
  dahinter; Ionenbindung: **Lernen | Experimentieren**, siehe dort). Alle Einträge gleich gestaltet (Zeichen + Wort, aktiver Bereich mit rotem Strich); „Erklärung“ öffnet die Erklärung (kein eigener Bereich) und ist dort
  in `AppShell` (`guide`) eingebaut. Der Werkbank-Bereich heißt immer „Experimentieren“ („Experiment“ auf Englisch) mit Zeichen Becherglas (`beaker`),
  egal ob gebaut, gezeichnet, umgerechnet oder ausgeglichen wird; Reihenfolge der Tabs in `App.tsx`: Üben (`quiz`, in Reaktionsgleichungen `ueben`), dann der Werkbank-Bereich (Kennung unverändert, z. B. `build`,
  `probieren`, `start` – Kennungen und Speicher-Schlüssel nie umbenennen). Der beim Öffnen gezeigte Bereich bleibt die Werkbank.
- **Üben in Kapiteln statt Erklärung + Quiz** (Gemische und Polymere): Leiste **Üben | Experimentieren** (Name zentral über `uebenTab`). „Üben“ (Tab-Kennung `quiz`,
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
  und erreichte Stufen. Keine Wiederholungen: der Store merkt sich die zuletzt gestellten Fragen (`recent`, Prüfsumme `taskKey`, 400 je Stufe; mit der richtigen Antwort
  als Text – gleicher Fragetext mit anderer Lösung ist eine andere Frage –, ohne alles, was am Antwort-Index hängt (`why`, `miss`), und ohne `stage`, `lead`, `hintCue`,
  Tipp, Erklärung: dieselbe Frage hat bei jeder Mischung dieselbe Kennung, Test). `freshRound` nimmt je Platz eine neue Frage desselben Typs; ist der Vorrat eines Typs
  erschöpft, bekommt höchstens ein Platz je Runde eine neue Frage eines anderen Typs, sonst kommt die am längsten zurückliegende (keine Fertigkeit verschwindet aus ihrem Level).
  `keepType` (feste Reihenfolge, „Heute fällig“, „Schwächen üben“): nie den Typ tauschen – jede gewählte bzw. fällige Fertigkeit bleibt in der Runde (Test);
  `samePlace` (feste Reihenfolge): nur Fragen dieses Platzes oder mit gleichem Typ und gleichem Merksatz (Test). Die Suche nach neuen Fragen ist begrenzt
  (Abbruch, wenn erzeugte Runden nacheinander nichts Neues bringen, höchstens 250 ms; Rundenstart mit Beispielen zusammen ≈ 320 ms) – der Rundenstart bleibt flüssig.
  Keine Frage zweimal in einer Runde: ist der Vorrat erschöpft, wird die Runde kürzer (nur bei fester Reihenfolge bleibt der Platz); eine getauschte Frage steht hinter den Fragen
  ihres Typs – vom Generator geordnete Levels (z. B. nach Schwierigkeit) bleiben geordnet (Tests). „Nochmal“ nach „Heute fällig“ bzw.
  „Schwächen üben“ nur, solange noch etwas fällig bzw. schwach ist (`pending`), sonst nur „Zur Levelauswahl“. Sprache: „Noch nicht“ statt „Leider falsch“, keine Ranglisten, keine Schuld.
  Prüfungstermin (`Exam`, Blatt „Schularbeit“ im Menü, trägt der Lernende selbst ein, bleibt auf dem Gerät): bis dahin Abstand höchstens halbe Restzeit
  (`examInterval`, `effectiveDue`), neue Fertigkeiten zuerst fällig, Menü zeigt Countdown und „x / n sicher“; nach dem Tag löscht sich der Termin.
- Antwortform **Antippen im Bild** (Gemische, `kind: "tap"`): `parts` = antippbare Teile (Formeln im Teilchenbild bzw. `data-part` eines Trennverfahrens),
  gemeldet als `values.pick` (Index), Fallen `traps: [{ values: { pick }, miss, why }]`; nach der Antwort ist die Lösung gestrichelt grün markiert; für Tastatur
  und Vorlesen dieselben Teile als unsichtbare Knöpfe.
- **Gelöstes Beispiel im Quiz** (`withExamples` in `packages/quiz/src/store.ts`): vor der ersten Aufgabe jeder Fertigkeit der Runde, die noch nie geübt wurde,
  steht ein gelöstes Beispiel derselben Art (andere Frage, aus weiteren erzeugten Runden gesucht, bis jede neue Fertigkeit eine verwendbare hat – höchstens 24 Runden und bis zur gemeinsamen Frist des Rundenstarts,
  höchstens 3 je Runde, andere Frage = andere `taskKey` – Daten und richtige Antwort, andere Ablenker zählen nicht; ein Typ mit nur einer möglichen Frage hat kein Beispiel):
  `stage: "worked"` → Karte `WorkedCard` mit Frage, markierter Lösung, „1. Tipp 2. Erklärung“ und Knopf „Verstanden – jetzt du“; zählt nicht für Punkte und Statistik (`counted`).
  Die erste echte Aufgabe dieser Fertigkeit bekommt `stage: "faded"`: der erste Schritt (der Tipp) steht unter der Frage (`.q-first`, kostet nichts; dort kein Tipp-Knopf, der Store zieht dafür auch keine Punkte ab).
  Tipp und erster Schritt sind immer ganz zu lesen, ohne das Bild zu zerdrücken: passen sie nicht in die Karte (Inhalt liefe über, ein Element unter seiner Mindesthöhe `data-min-h`,
  der Bildrahmen schrumpft unter max(56 px, 60 % seiner Höhe ohne sie) – auch bei Bildern, die sich per Container-Einheiten selbst einpassen –, oder das Bild wäre
  abgeschnitten bzw. niedriger als 56 px; `crowded` in `QuizScreen.tsx`, gemessen beim Erscheinen), stehen sie in einem Blatt; nach „Tipp“ steht der Fokus auf dem Tipp
  (der Knopf bleibt fokussierbar, `aria-disabled`); „Tipp“ öffnet es wieder (kostet nur beim ersten Mal), statt des ersten Schritts steht
  „Schritt 1“ in der Leiste.
  Nicht in „Heute fällig“ und „Schwächen üben“. Damit das Beispiel passt, muss jeder Aufgabentyp genug verschiedene Aufgaben erzeugen.
- Weitere Bausteine von `QuizScreen`: `renderVisual` (Bild über der Frage, per `Fit`), `renderOption` (eigene Darstellung von Antworten), `renderAnswer` (eigene Antwortform),
  `solution` (Lösung nach Fehlern), `feedbackExtra` (zusätzliches Blatt „Lösung“ nach der Antwort, z. B. Ablauf der Reaktion), `tools` (Hilfsmittel), `explain` (Erklärkarte je Level),
  `lead` an der Aufgabe (Merksatz über der Frage), `hint` (Tipp) und `hintCue` (Tipp-Knopf hervorgehoben, kostet keine Punkte).
  **Begriffe** (`terms` an `QuizScreen`, Baustein `TermScope`/`RichText` in `@lern/ui` `Terms.tsx`): Begriffe der Aufgabe (z. B. Stoffnamen) sind in Frage, Merksatz, Tipp und
  Rückmeldung antippbar (erstes Vorkommen, gepunktet unterstrichen, nur ganze Wörter) und öffnen ein Blatt „Was ist das?“; mit `termsTool` zusätzlich ein Hilfsmittel, das alle
  Begriffe aus Frage und Antworten auflistet. In Blättern und Antwortknöpfen aus (`NoTerms`). Karten beschreiben nur, was etwas ist – nie, was gefragt ist (Test je Modul).
  Optional `rule` an der Aufgabe: kurze Regel nach der richtigen Antwort, wenn die Antwort selbst keine Rückmeldung (`why`) hat (nur gesetzt, wo ein Modul es füllt).
- Diagnostische Distraktoren: jede falsche Antwort steht für eine Fehlvorstellung. MC: `mc(richtig, [d(text, miss, why), …])` – `miss` = Schlüssel aus
  `src/quiz/misconceptions.ts` der App (`MISS`, Name für Landkarte/Auswertung), `why` = Rückmeldungssatz mit den konkreten Zahlen (steht vor der Erklärung).
  Eingabe-Aufgaben: `traps` (`{ field, value | min }` oder `{ values: {…} }`) auf den gemeldeten `values`; `diagnose(task, answer)` wertet aus.
  Der Store zählt `misses` je Stufe; Landkarte zeigt „Stolpersteine“ (≥ 2×), Auswertung den häufigsten der Runde. `missName` an `QuizScreen` übergeben.
  Freiwillig (`missRecovery: true` in `createQuizStore`, nur Polymere): `missBy` merkt je Fehlvorstellung die Fertigkeiten; sind alle wieder „sicher“, verschwindet
  der Stolperstein (`clearMisses`, Test mit simulierter Uhr). Ohne Schalter bleibt alles wie bisher.
  Distraktoren mit Diagnose kommen vor zufälligen; die Tests prüfen Schlüssel, Listenlängen und Fallen-Felder. Rückmeldung nie beschämend, immer mit dem richtigen Weg.
- Baukasten – neue Module nur aus gemeinsamen Teilen: Build der App über `appConfig(…)` (`scripts/app-vite.ts`, PWA + Einzeldatei + `lizenzen.txt`
  über `scripts/licenses.ts`; in der Übersicht öffnet „Lizenzen“ ein Blatt – Web und Handy-App lesen `lizenzen.txt`, die Einzeldatei den Kommentar am Dateiende), `App.tsx` des Moduls = `<LernApp name logo tabs tab onTab storage stufe?>` (`@lern/ui`: Link zur Übersicht,
  Stufen-Umschalter, Beamer, Farbschema – nicht im App-Store halten; Beamer und Stufe werden beim Verlassen des Moduls am Dokument aufgeräumt). Quiz-Antworten: `McAnswer` (automatisch), `NumberAnswer` (`@lern/quiz`, ganz/dezimal, Einheit).
  PSE überall als `pseTool({ stufe, mark })` (`@lern/chem-ui`) in Werkbank- und Quiz-`tools`.
- Oben links in jedem Modul ein **Home-Knopf** (Haus, 44 px, zur Übersicht; `HomeLink` der Hülle) an Stelle des Modul-Symbols – das Symbol steht nur noch,
  wenn ein Modul allein gebaut ist (ohne `HomeLink`), und in der Übersicht. Kopfzeile hat automatisch den Klang-Schalter (`@lern/ui` `feedback.ts`: `ding(ok)` nur wenn eingeschaltet, Standard aus; Vibration `buzz` immer)
  und den Schalter „Lesbar“ (`readable.ts`, localStorage `lern-lesbar`, Attribut `data-lesbar` auf `<html>`, Stile in `tokens.css`: mehr Buchstaben-/Wort-/Zeilenabstand; Überschriften unverändert;
  am Handy (≤ 640 px) ausgeblendet, außer er ist eingeschaltet – dann bleibt er zum Ausschalten sichtbar). Browser-Prüfung `scripts/check-ui.mjs` zusätzlich mit `LESBAR=1` laufen lassen.
- Auffangnetz: `AppShell` fängt Abstürze einer Ansicht ab (`Rescue`, Karte „Hier hakt etwas.“); jedes Modul übergibt `storage` = seine localStorage-Schlüssel (Baukasten + Quiz),
  „Neu starten“ setzt zuerst nur Baukasten und laufende Runden zurück; Fortschritt bleibt – welche Schlüssel Fortschritt sind, ist **ausdrücklich gekennzeichnet**
  (`progressKey`: jeder Quiz-Store über `createQuizStore`, `LESSON_KEY`; eigene Fortschritts-Stores eines Moduls rufen `progressKey(schlüssel)` auf). Stürzt dieselbe App
  innerhalb von 10 Minuten nach einem „Neu starten“ wieder ab, setzt das nächste alles dieser App zurück (Merkzeichen je App in sessionStorage, Test `rescue.test.ts`) –
  außer Schlüsseln, die mehrere Module teilen (`progressKey(k, true)`, z. B. `LESSON_KEY` von Gemische und Polymere): die bleiben, solange sie lesbar sind.
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
  am Handy öffnet jedes Werkzeug ein Blatt („Zurück“ im Browser schließt es: `useBackClose`, eigener Verlaufseintrag mit neuer Kennung je Öffnen; ein Blatt über einem
  Blatt bzw. über der Erklärung schließt nur sich; Schließen und Öffnen im selben Durchlauf übernimmt den Eintrag statt ihn zurückzunehmen; ein Eintrag, der vom
  Neuladen stehen blieb, wird beim Start einmal zurückgenommen – Tests `back.test.ts`), breit (≥ 900 px) stehen die Werkzeuge als Register daneben. Nie mehrere Bereiche gleichzeitig offen.
  **Android-Zurück-Taste** (`apps/edi/src/native.ts`, `@capacitor/app`): geht im Verlauf der WebView zurück wie „Zurück“ im Browser – schließt also ein offenes Blatt
  bzw. die Erklärung und führt vom Modul zur Übersicht; erst ohne Verlauf (Startseite) beendet sie die App (`App.exitApp()`). Der Listener ist nötig: ohne ihn ginge
  `@capacitor/app` zwar zurück, bliebe am Anfang aber wirkungslos stehen. Der Code wird nur in der Android-App nachgeladen (im Web nie, die Einzeldatei enthält ihn nicht). Test `apps/edi/test/native.test.ts`.
  Beschriftungen der Werkzeugleiste nie abgeschnitten: passt eine nicht in ihre Spalte (schmales Handy, Englisch, „Lesbar“), stehen die Werkzeuge in zwei Reihen (`Workbench` misst, `data-wrap`).
  Übungen/Quiz: Aufgabe = ein Bildschirm (Frage, Bild passt sich per `Fit` an, Antwort, kurze Rückmeldung, „Weiter“ immer sichtbar); Lösungsweg und Hilfsmittel als Blatt.
  Leiste unter der Aufgabe: jedes Hilfsmittel mit ganzer Beschriftung, nichts überdeckt sich – passt sie nicht neben „Weiter“ (viele Hilfsmittel, Englisch, „Lesbar“),
  steht „Weiter“ in einer eigenen Zeile darüber (die Hilfsmittel bleiben an ihrem Platz; „Tipp“ hält nach der Antwort unsichtbar seinen Platz, „Lösung“ und
  „Begriffe“ haben vorher einen unsichtbaren Platz). Nach der Antwort darf das Bild kleiner werden (`Fit` bis 0,25); wäre es dann noch abgeschnitten oder niedriger als 56 px
  (`Fit` setzt `data-cut`, `minHeight`; auch ein Rahmen unter 56 px, den eine selbst einpassende Zeichnung füllt), ist es unsichtbar statt als Rest zu sehen
  (`visibility: hidden` – der Rahmen bleibt messbar: wird der Bildschirm wieder größer, kommt das Bild zurück). Landkarte: hilft auch die kleinste Stufe nicht,
  bleibt sie bei Lesegröße und scrollt. Lesetext (Frage, Rückmeldung, Level-Beschreibung, `Tag`) ≥ 14 px.
  Zeichnungen passen sich per Container-Einheiten (`cqw`/`cqh`) oder `Fit` ein, statt zu scrollen oder abgeschnitten zu werden. PSE mit `fit` (ganzes PSE sichtbar).
- **Schalenbesetzung ausgeschrieben** (alle Apps): nie „2 · 8 · 1“ (sieht aus wie eine Rechnung: 2 · 8 · 8 = 128), sondern „1. Schale: 2 Elektronen“, „2. Schale: 8 Elektronen“,
  „3. Schale: 1 Elektron“ (Zeilen untereinander; im Satz „1. Schale 2, 2. Schale 8, 3. Schale 1 Elektron“). Wunsch der Lehrkraft.
- **Elektronen im Schalenmodell sehen alle gleich aus** (Ionenbindung): keine Ringe oder hellen Kerne für aufgenommene Elektronen – was sich ändert, sagen Text und Zahl;
  keine hellblaue Hinterlegung hinter dem Atom, die sich mit ändert. Wunsch der Lehrkraft.
- **PSE**: Das kleine PSE (Unterstufe, Hauptgruppen I–VIII bis Calcium) bleibt, wie es ist – nichts daran ändern. Lanthanoide, Actinoide und die 7. Periode nur im großen PSE
  von **Atombau** (Tab „Periodensystem“, Level II); PSE-Hilfe der Module und Ionenbindung Kapitel 5 zeigen sie nicht. Wunsch der Lehrkraft.
- **Elektronegativität nach Allred-Rochow** (alle Apps, Wunsch der Lehrkraft): Tabellen, PSE-Trend, Steckbrief, Rechnungen und Texte nutzen nur Allred-Rochow-Werte
  (nie Pauling). Polare Bindung ab **ΔEN ≥ 0,5** (wie im Schulbuch); darunter unpolar bzw. „schwach polar“ (0 < ΔEN < 0,5, ohne C–H).
- **Nichts wandert** (alle Apps): Bilder, Modelle, Karten und Steuerleisten bleiben beim Bedienen an ihrem Platz – auch wenn sich daneben Text, Zahlen, Ladungen oder
  Rückmeldungen ändern. Nur gewollte Animationen bewegen sich. Dafür feste Spalten/Größen und reservierter Platz für die längste mögliche Beschriftung (Grid statt
  zentriertem Flex, `tabular-nums`, `visibility: hidden` statt Weglassen). Wunsch der Lehrkraft: „Das Atom bleibt starr auf dem Bildschirm.“
  Bausteine: `Reserve` (`@lern/ui`, alle Fassungen in einer Zelle, nur die aktuelle sichtbar), `Workbench` `statusReserve` (Statuszeile mit Platz für die längste
  Kombination) und `wrapTools` (Werkzeugleiste fest zweireihig), Erklärung: unsichtbare „Geister“ des größten Zustands je Folie (`.ui-guide-ghost`), `Fit` behält die Lage,
  wenn nur der Rahmen sich ändert. Prüfung: `scripts/check-ui.mjs` vergleicht vor/nach jeder Bedienung die Kästen (immer an, `WANDER=0` aus; gewollte Bewegung
  `data-anim`/`data-moves`, neue Ansicht `data-screen`; `ERKLAERUNG=1` spielt alle Erklärungen).
  Umsetzung: `ModelFrame` hält nach dem Lösen die Höhe der Bedienzeile frei; `Guide steady` (Ionenbindung „Lernen“) reserviert Platz für Lösungsweg, Rückmeldung und
  „Weiter“ – untereinander behält das Bild seine Anfangshöhe, längerer Text scrollt; Schalen-Text über `shellLines`/`shellSentence` (`@lern/chem`).
  Ausnahme (mit der Lehrkraft abgesprochen): Ionenbindung Kapitel 1, Elektronenübergang mit einstellbarer Atomzahl – kommt ein Atom dazu, ordnen sich die Atome neu und
  werden kleiner (fester Maßstab für drei Atome machte sie am Handy zu klein).
- **Schalenmodelle mit festen Schalen** (überall, wo Bohr- bzw. Schalenmodelle gezeichnet werden): Jede Schale (K, L, M, …) hat immer denselben Durchmesser – unabhängig
  von Protonen-, Neutronen- und Elektronenzahl. Der Kern verschiebt keine Schale, die K-Schale liegt außerhalb auch des größten Kerns. Ein Atom bzw. Ion wird nur größer oder
  kleiner, wenn eine Schale dazukommt oder wegfällt. Innerhalb einer Ansicht bzw. eines Modells ändert sich der Maßstab beim Bedienen nie: der Rahmen bietet Platz für alle
  Schalen, die dort vorkommen können (`slots` an `Bohr` in `@lern/chem-ui`, `extentOf` in Ionenbindung Kapitel 1). Grund: wachsende oder schrumpfende Schalen verwirren.
  Echte Ionengrößen gehören zu den Ionenradien (Ionenbindung Kapitel 3), nicht ins Schalenmodell. Test `packages/chem-ui/test/bohr.test.ts`.
  Prüfen im Browser (z. B. Playwright): in allen Ansichten, Werkzeugen und Quizaufgaben darf weder die Seite noch Werkbank/Aufgabenkarte überlaufen, und nichts darf von einem
  Rahmen mit `overflow: hidden` abgeschnitten werden (Gleichungen, Formeln). Breiten: 390 × 844, 375 × 667, dazu schmale Android-Handys 360 × 740 und 412 × 915
  (Quiz ab ≤ 370 px Breite kompakt wie bei niedrigen Bildschirmen). Nie mitten im Wort umbrechen: Auswahl-Antworten stehen nur zweispaltig, wenn jedes Wort
  in seine Spalte passt (`McAnswer` misst jedes Wort jedes Textstücks im Knopf, auch bei eigener Darstellung, sonst einspaltig; umbrochen wird nur an Leerzeichen
  und erlaubten Trennstellen – `overflow-wrap: break-word`, nie `anywhere`, das Formeln wie „3d⁷“ mitten durch brach –, einspaltig und trotzdem zu breit:
  Schrift in zwei Stufen kleiner, bis 14 px); im kompaktesten Menü (Stufe 5) stehen Sterne über Tipp und Pfeil, damit Level-Namen breit genug bleiben.
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
- Strukturformeln (Stoff-Info, `@lern/chem-ui` `StructureFormula`) zeigen Formalladungen als ⊕/⊖ und ungepaarte Elektronen als Punkt – berechnet aus den Bindungen
  nach der Oktettregel (`formalCharges`: O₃, HNO₃, CO mit Formalladungen; NO, NO₂ mit ungepaartem Elektron am N), wie in der Elektronenpaarbindung (Test).
- Tipps verraten die Lösung nicht und passen zur Aufgabe (z. B. Tipp je Reaktionstyp); jede falsche Antwort bekommt eine Rückmeldung, wo möglich mit Katalog-Schlüssel.
- Multiple Choice: `mc(richtig, falsche)` aus `@lern/quiz`; falsche Antworten möglichst als diagnostische Distraktoren – `d(text, miss, why)` mit Katalog-Schlüssel
  (Chemie-Apps mit `misconceptions.ts`) oder Kurzform `dis(text, why)` ohne Schlüssel (Reaktionsgleichungen). Sind es mehr Ablenker als Plätze, wählt `mc` zuerst die mit
  Stolperstein (`d`), dann die nur mit Rückmeldung (`dis`), dann den Rest – je Gruppe zufällig (Test `mc.test.ts`).
- Quiz-Hilfsmittel je Aufgabe über `tools` von `QuizScreen` (`QuizHelp`): z. B. PSE mit den Elementen der Aufgabe markiert (`PseHelp` in `@lern/chem-ui`, Elemente per `elementsIn(prompt)` aus `@lern/chem`).
  Hilfsmittel dürfen die Lösung nicht direkt verraten (PSE nur Angaben eines gedruckten PSE: Z, Gruppe, Periode, Atommasse).
- **Zwei Sprachen** (`packages/i18n`): jeder sichtbare Text als `tr("Deutsch", "English")`, auch in Daten. Beim ersten Start aus der Gerätesprache, danach Knopf EN/DE in der Kopfzeile (EN vor DE, international)
  (`lern-sprache`; Wechsel lädt die Seite neu, Stände bleiben). Tests laufen auf Deutsch; je Modul `english.test.ts`/`guide-english.test.ts` prüfen, dass nichts Deutsches
  in der englischen Fassung bleibt. Fachnamen englisch nach IUPAC (alkene, ethanoic acid …).
- Kopfzeile (`LernApp`): Home-Knopf (→ Übersicht), Bereichsleiste (ab 900 px), Stufen-Umschalter „Level I | Level II“ (falls das Modul Stufen hat; Start immer Level I, nicht gespeichert), Beamer (ab 900 px,
  nicht gespeichert), Farbschema hell/dunkel (Start hell, nicht gespeichert), DE/EN, „Lesbar“ (nicht am Handy), Klang. Am Handy (≤ 374 px) engere Abstände, damit nichts übersteht.
- Offline-fähig: Web-Build mit Service Worker, zusätzlich Einzeldatei mit allen Modulen (`vite build --mode single` → `edi-offline.html`).
- Android/iOS über Capacitor (`apps/edi/android`, `apps/edi/ios`); `webDir` = `dist`. Einziges Plugin: `@capacitor/app` (Zurück-Taste); nach Änderung der Plugins
  `npm run build` und `npx cap sync` (im Ordner `apps/edi`), die erzeugten `capacitor.settings.gradle`, `app/capacitor.build.gradle` und `CapApp-SPM/Package.swift` mit committen.

## Gemische (`modules/gemische`)
- Keine Stufen. Zehn fertige Beispiele (`EXAMPLES` in `src/mixtures.ts`), **kein Baukasten**, 110–240 Teilchen je Beispiel (alle verschieden):
  Wasser, Helium im Luftballon, Zuckerwasser (Saccharose), Alkohol und Wasser, Sprudelwasser, Öl und Wasser (Öl vereinfacht als Dodecan),
  Messing (Cu, Zn im Verhältnis 2 : 1 – CuZn33, einphasig; Zink sitzt zufällig auf Plätzen des Kupfergitters), Erdgas (CH₄, C₂H₆, CO₂), Schutzgas zum Schweißen (Ar, CO₂), Modellgemisch (He, Ar, CO₂, CH₄).
  Zweimal gleich viele Verbindungen wie Elemente (Schutzgas, Modellgemisch), achtmal verschieden viele (Test).
  Quiz und Erklärkarten zeigen ein Zehntel der Teilchen (`small`) im Rasterbild (`mixing.ts`, `components/Beaker.tsx`). Metallgitter füllen ihr Raster
  ohne Lücke, wenn es geht (`gridFor`: Teiler der Atomzahl, breiter als hoch, z. B. Messing mit 18 Atomen 6 × 3 statt 5 × 4 mit zwei leeren Plätzen; Test).
  Als elftes Beispiel **Müsli** (`MUESLI`, `components/MuesliBowl.tsx`): Gemenge aus sichtbaren Stücken (Haferflocken, Rosinen, Haselnüsse) ohne Teilchenbild –
  das Gemisch-Konzept gilt auch für Bestandteile, die selbst aus vielen Stoffen bestehen. Vorher jede Sorte als Haufen, **Mischen** (Schale wackelt, Stücke gleiten
  an zufällige Plätze), **Auslesen** (zurück in Haufen); Werkzeuge Zutaten | Zählen (Bestandteile, Stücke) | Einteilung | Arten | Beispiele.
- **Elemente in Bildern als einzelne Atome** (Edelgase) oder Metallgitter. Ausnahme, gezielt gegen die Fehlvorstellung „zwei Atome = Verbindung“: Lektion 2 zeigt
  Sauerstoff O₂ neben Kohlenmonoxid CO (vorgemacht) und Stickstoff N₂ (halb gelöst), und die Aufgabe „Element oder Verbindung“ (`einordnen`) fragt in etwa jeder
  vierten Aufgabe O₂ oder N₂ mit der Falle „Verbindung“ (Stolperstein `element-molekuel`). Sonst nirgends Element-Moleküle (Test; Experimentieren unverändert).
- Zählen (`analyse`): Teilchen (Moleküle bzw. einzelne Atome), Stoffe, davon Verbindungen (mehrere Atomsorten) und Elemente (eine Atomsorte), Atomsorten.
  Die Erklärkarte nennt trotzdem alle Arten von Elementen (einzelne Atome, Metallgitter, Moleküle wie O₂), nur die Bilder zeigen keine Element-Moleküle.
  Teilchenbilder in fünf Arten (`pictureKind`): Element, Verbindung, Gemisch aus Elementen / aus Verbindungen / aus Element und Verbindung.
  Gemisch aus Elementen als Metallgitter (Legierung, `alloy`): 12 Atome (4 × 3), Kupfer mit 3–4 Zink, zufällig verteilt (Messing, einphasig; mit wenigen Atomen sähe
  es nach festem Verhältnis aus) – die übrigen Paare aus Cu, Zn, Fe, Al gibt es nicht in beliebigem Verhältnis (Fe–Al, Fe–Zn, Cu–Al bilden intermetallische Phasen).
  Test: jede mögliche Anordnung sichtbar zufällig (keine Zink-Reihe oder -Spalte, nicht spiegel- oder drehgleich, kein Muster, kein zusammenhängender Zinkblock);
  `initial` mischt eine Legierung „nachher“ so oft neu, bis sie so aussieht (`looksRandom`, auch beim Messing-Beispiel mit 12 : 6 Atomen).
  Rückmeldungen zu Legierungsbildern: die Atome sind im Gitter verbunden, aber zufällig verteilt, ohne festes Zahlenverhältnis – zwei Elemente, gemischt, keine Verbindung
  (nie „nicht verbunden“ oder „einzeln“; Ablenker passen zum Bild: „Reinstoff – alles ein Gitter“, „lauter Moleküle“ nur bei reinen Molekülbildern; Test).
  **Definitionen** (Lektion 2, Erklärkarte k2, Lektion 4, k4; Test `definitions.test.ts`): Verbindung = mehrere Atomsorten, fest verbunden und immer im gleichen
  **Zahlenverhältnis** (H₂O 2 : 1, NaCl 1 : 1); Legierung = Metall mit anderen Elementen zusammen geschmolzen, Anteile frei wählbar, oft homogen (Messing) – nie
  pauschal unter „homogen“. Kapitel 1 zeigt keine Metallgitter (Zählbilder `someMix` nur im Zustand `modell`, Test), „Gitter“ erst in Kapitel 2.
- Experimentieren (`views/MixView.tsx`, `components/FlowView.tsx`, Canvas): Gefäß mit allen Teilchen (klein) und **verschiebbarer Lupe**
  (anfassen und ziehen – Abstand zum Finger bleibt; daneben tippen – Lupe gleitet hin; Pfeiltasten), daneben bzw. darüber die Vergrößerung mit etwa 20 Teilchen
  als schattiertes Kalottenmodell (`lensRadius`). Die Lupe springt nie: sie gleitet, und das Bild ordnet sich nicht neu an (Statuszeile immer einzeilig,
  höchstens zwei kurze Kennzeichen, `.gm-status`). Teilchen in der Lupe antippen → Stoff-Info (öffnet beim Loslassen; das Blatt ignoriert den Klick gleich nach dem Öffnen, sonst schließt es am Handy sofort wieder). Grenze Öl/Wasser als gerade Linie (`boundaryY`), sobald getrennt.
- Jedes Beispiel beginnt **vorher** (`before`): Zuckerkristall im Wasser (Lupe auf seiner Oberkante), Alkohol obenauf, CO₂ über dem Wasser, Gase hinter Trennwänden,
  Kupfer- und Zinkblock. Hauptknopf sagt, was er tut: **Umrühren** (Zucker, Alkohol, 3 s), **Schütteln** (Sprudel, Öl, Reinstoffe), **Wand weg** (Gase), **Schmelzen** (Messing);
  daneben **Von vorn** (Anfang wieder herstellen). Flüssigkeiten lösen und mischen sich auch **von selbst** (langsam; warm schneller) – Rühren/Schütteln beschleunigt.
  Statuszeile: „löst sich · 12 / 30 gelöst“, danach „Lösung · gelöst in 23 s“ (Zeit zum Vergleichen: kalt/warm, gerührt/ruhig); Alkohol „gemischt“, wenn in jedem
  Drittel der Höhe etwa gleich viel Alkohol ist; Gase, wenn jeder Stoff im Mittel in der Mitte ist. Einmal gemischt bleibt die Anzeige „gemischt in x s“ bis „Von vorn“
  (zufällige Schwankungen der Verteilung lassen sie nicht zurückspringen, Test `views/status.test.ts`). Text der Werkbank ≥ 14 px (auch `Tag`s der Statuszeile).
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
  an den Nachbarn vorbei, dazu eine Wärmeströmung ohne Stöße, deren Walzen ihre Lage wechseln (eine, zwei, verschobene – sonst dreht sich der Zinkblock nur im Kreis), und Druck gegen Lücken – Kupfer und Zink vermischen sich nach und nach, danach Erstarren im Gitter.
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
  **Temperaturregler** 0–100 °C (nicht gespeichert, Start 20 °C; bei Messing ausgeblendet – Metalle schmelzen erst weit darüber, Status beim Schmelzen „geschmolzen · über 900 °C“): Teilchengeschwindigkeit im Modell verstärkt (`heat`: 0 °C × 0,5, 20 °C × 1, 100 °C × 3; echt wären nur + 17 %),
  Kristall löst sich warm schneller; CO₂ löst sich warm schneller, aber es bleibt mehr im Gasraum (Gleichgewicht). Tests: Teilchenzahl bleibt, keine Sprünge, gleichmäßig gemischt, Kristall geordnet und von außen gelöst, Öl bildet geschüttelt Tröpfchen und ist danach wieder oben,
  Gase mischen sich nur ohne Trennwand, Messing wieder im Gitter (beim Erstarren Plätze nach kürzesten Wegen verteilt, Gleiten höchstens ¼ Radius je Schritt – kein Sprung; Wärmebewegung der Schmelze klingt in der letzten Sekunde aus, gleich nach dem Erstarren 1 s sanfter gebremst, `frozeAt`). Ohne Bewegung (reduzierte Bewegung): Knopf zeigt gleich das Ergebnis.
  Werkzeuge: Stoffe (Reinstoffe: Verbindungen | Elemente; beim Sprudel zusätzlich „entsteht in kleiner Menge“: Kohlensäure, `forms`) | Zählen | Farben („nur im Modell“) |
  Einteilung (Stoffe → Reinstoffe/Gemische mit allen Beispielen; niedrige Handys ohne Wurzel) | Arten (verteilter Stoff in Hauptstoff: Gemenge, Legierung, Suspension,
  Lösung, Rauch, Emulsion, Nebel (Morgennebel über dem Teich), Schaum (Eischnee), Gasgemisch mit Alltagsbeispiel; aktuelles Beispiel markiert) | Beispiele
  (zwei Spalten ab 360 px; lange Namen mit Trennstelle: „Modell-gemisch“, `soft`).
  Gespeichert (`gemische-v1`): Beispiel. Keine mehrdeutigen Beispiele im ganzen Modul (Schlagsahne enthält eine Emulsion, Wolken können Eis enthalten, Dunst kann
  auch Staub sein; Test).
- **Lernen** (`src/quiz/tasks.ts`, Lektionen `src/lessons.tsx`, Katalog `misconceptions.ts`): sechs Kapitel (`gm-k1` … `gm-k6`) mit je einer Lektion und zehn Aufgaben
  in fester Reihenfolge, plus „Alles gemischt“, „Heute fällig“, „Schwächen üben“:
  1 **Teilchen und Atomsorten** (teilchen ×2, tippAtome ×2, atomsorten ×2, stoffe ×2, zwischen, farbe) ·
  2 **Elemente und Verbindungen** (einordnen ×2, tippElement ×2, tippVerbindung ×2, elemente ×2, verbindungen ×2) ·
  3 **Reinstoffe und Gemische** (reinOderGemisch, reinGemisch, bildArt, bildWahl, homogenBild, homogenKlar, wohin, nachher, masse, bewegung – Lösen gehört hierher) ·
  4 **Gemische im Alltag** (alltag ×2, reinAlltag ×2, homogenSieht, artFluessig ×2, artFestGas, artInGas, gemischart) ·
  5 **Trennen nach Größe, Magnet, Dichte** (trennWahl ×4, trennEigenschaft ×3, trennTipp ×3 – nur Auslesen, Sieben, Magnettrennung, Dekantieren, Filtrieren) ·
  6 **Lösungen trennen** (loesWahl ×3, loesEigenschaft ×2, loesTipp ×3, trennReihe ×2 – Eindampfen, Destillieren, Chromatografie, mehrere Schritte; `src/quiz/trennen.ts`,
  `K5_METHODS`/`K6_METHODS`; falsche Verfahren und Eigenschaften in Kapitel 5 nur aus Kapitel 5, „Siedetemperatur“ erst in Kapitel 6, Test).
  **Keine Zahleneingabe**: Zählaufgaben werden zur Auswahl (`asChoice`: Fallen → diagnostische Distraktoren, Zahlen aufsteigend; Nachbarzahlen mit dem Denkschritt
  `recount`, z. B. „Verzählt? Zähle jede Teilchensorte einzeln …“). **Jede falsche Antwort hat eine eigene Rückmeldung** (Test): Art des Gemischs – was die gewählte Art
  heißt und wie es hier ist („Rauch heißt: feste Teilchen in einem Gas – hier ist der Hauptstoff flüssig.“, `ART_INFO`), homogen/heterogen und Alltag – was die Wahl
  hieße („Ein Reinstoff ist nur ein Stoff – hier sind es mehrere.“). Fallen mit Stolperstein stehen immer zur Wahl (`mc` nimmt Ablenker mit Stolperstein zuerst,
  dann zufällig die übrigen mit Rückmeldung; Test – Anteil der Aufgaben mit Diagnose unverändert etwa 83 %). Antippen im Teilchenbild
  (`tippAtome`: Teilchen aus n Atomen, `tippElement`/`tippVerbindung`). Stofftrennung: `trennWahl` (Bild des Gemischs ohne Geräte `MixPic`, Antworten als
  Bildkarten der Verfahren; 9 Fälle: Eisen/Schwefel → Magnet, Sand/Kies → Sieben, rote/weiße Bohnen (gleich groß, nur anders gefärbt) → Auslesen, abgesetzter Sand (Ziel: klares Wasser gewinnen) → Dekantieren, trübes Wasser →
  Filtrieren, Salzwasser → Eindampfen (Salz) bzw. Destillieren (Wasser), Alkohol/Wasser → Destillieren, Filzstift → Chromatografie; jede falsche Wahl mit
  Begründung, Gelöstes durch den Filter = Stolperstein `filter-geloest`; eine Begründung mit „behalten“/„verloren“ nur, wenn die Frage ein Ziel nennt, Test), `trennEigenschaft` (Animation des Verfahrens, Eigenschaft wählen: Korngröße,
  Magnetismus, Dichte, Siedetemperatur, Aussehen, Haften am Papier), `trennTipp` (Bild antippen, je Verfahren mehrere Ziele, die richtige Antwort wechselt:
  Rückstand, Filtrat, Filterpapier; Eisen, Schwefel; Bodensatz, abgegossenes Wasser; Kies, Sand; Destillat, Kühler, Rückstand im Kolben, Thermometer (t = 0,6);
  Salz, Wasserdampf (t = 0,5); weitester und kürzester Farbstoff, Startlinie – 19 Fälle, jedes Teil im Bild vorhanden, Test `components/separation.test.ts`),
  `trennReihe` (Salz und Sand bzw. Eisen, Sand, Salz – dann mit Eisen im Bild `eisensalzsand`: Magnettrennung → Lösen → Filtrieren → Eindampfen; Schrittnamen
  `STEP` in `trennen.ts`, dieselben in Lektion 6: deutsch die Verfahren, englisch kurze Verben „Magnet → Dissolve → Filter → Evaporate“ – mit „Magnetic
  separation … Filtration … Evaporation“ war die vierte Antwort am Handy abgeschnitten; Tests).
  Über jeder Aufgabe ein **Merksatz** (`leads` → `lead`; weicht dem „Ersten Schritt“ und nach der Antwort am Handy der Rückmeldung). Der Merksatz nennt den
  **Blickpunkt**, nie die gefragte Aussage („Denk daran, woraus Luft und Wasser selbst bestehen.“ statt „Zwischen den Teilchen ist nichts.“); hängt die Aufgabe
  von einer zufälligen Variante ab (Bild nach dem Mischen, Trennverfahren mit Ziel – `trennWahl` nur bei Fällen mit Ziel), setzt der Generator den Merksatz selbst
  (`lead` der Aufgabe vor dem des Platzes); der Merksatz eines Platzes passt zu jeder Variante (kein „Kristall“, wenn auch Alkohol kommt; Tests).
  Merksätze nur in den Kapiteln, nicht in „Alles gemischt“, „Heute fällig“, „Schwächen üben“. Jede Aufgabe hat einen
  **zugeschnittenen Tipp** (`tip` → `hint`, `hintCue`) als **Denkschritt** („Was konnte nicht durch das Papier?“), nie als Lösungssatz (Tipps zu „Nach dem Mischen“
  sind Fragen, Test). **Der Tipp hängt nie von der Antwort ab**: „homogen oder heterogen“ hat einen Denkschritt für alle Beispiele (`HOM_TIP`: „Ein Stoff oder
  mehrere? Und: Zeigt das Mikroskop Teile, Tröpfchen oder Schichten?“), „Stoffe im Alltag“ einen für Element, Verbindung und Gemisch (mit Formel im Namen der zu
  den Großbuchstaben; Tests). „Klar heißt nicht rein“ und „Sieht einheitlich aus“ wählen Beispiele nach Kennzeichen (`klar`: durchsichtig, `eins`: sieht
  einheitlich aus) – in beiden Gruppen kommen Reinstoff, homogenes und heterogenes Gemisch vor (u. a. destilliertes Wasser, Öl und Wasser, Mayonnaise, Blut; Test).
  Formeln: „Jede Atomsorte beginnt mit einem Großbuchstaben“, gleiche zählen einmal
  (nie „jeder Großbuchstabe ist eine Atomsorte“ – C₂H₅OH, Test). Tipps im Kapitel höchstens 85 Zeichen (passen ins Tippfeld; Test).
  Tests: kein Inhaltswort (≥ 4 Buchstaben, ohne Stoppwörter) der richtigen Antwort in Merksatz, `hint` oder `tip` – über alle Generatoren und Kapitel. Rückmeldungen begründen mit dem Bild. Sprudel nicht im Lernen (dort reagiert ein Teil zu Kohlensäure; Test).
  **Begriffe erst ab dem Kapitel, das sie einführt** (Test über alle Texte der Runden: Element, Verbindung, Gitter ab Kapitel 2; Reinstoff, homogen, Lösung ab 3;
  Legierung, Gemenge, Suspension, Emulsion, Schaum, Rauch, Nebel ab 4; Verfahren aus Kapitel 5 bzw. 6 erst dort). „Gemisch“ (Name des Moduls) steht schon in
  Kapitel 2 zur Wahl. Jeder abgefragte Begriff steht in einer **Lektion** bis zu diesem Kapitel fett (die Erklärkarte erscheint in Kapiteln mit Lektion nicht von
  selbst; Test über alle Texte der Runden). Nur fachlich eindeutige Beispiele: Art des Gemischs ohne Milch, Sahne oder Kakao, wenn „Emulsion“ falsch ist (Schaum:
  Eischnee, Suspension: Mehl in kaltem Wasser; Test), Füllertinte (Lösung), ein Sprühstoß aus einer Blumenspritze und Wassertröpfchen über dem Teich (Nebel);
  „Rein“ im Alltag: Reinstoff nur destilliertes Wasser (Test: keine Begründung mit „fast“), Packungsaufschriften wie gedruckt („Reines Mineralwasser“);
  Sterlingsilber 925 („Auf einem Ring steht …“) mit eigener Rückmeldung (925 von 1000 Teilen Silber, Rest Kupfer; Anteile frei wählbar, kein festes
  Zahlenverhältnis – nicht „Rein heißt im Alltag …“; Test). Stoffe im Alltag: „Ethanol (C₂H₅OH)“ statt „reiner Alkohol“ (handelsüblich etwa 96 %), Messing als
  Verbindung gewählt → „Anteile frei wählbar, kein festes Zahlenverhältnis“ (Test). Masse beim Lösen: höchstens so viel Salz, wie sich löst (Kochsalz bei 20 °C etwa
  36 g in 100 g Wasser – im Quiz höchstens 30 g je 100 g; Test). Satzanfänge in Frage und Lösungsweg groß (`cap` in beiden
  Sprachen, auch nach Anführungszeichen; Test); Zahlen-Auswahl aufsteigend, auch mit Einheit (Masse, Test). Die Generatoren `homogen` (alle Alltagsbeispiele, auch
  Edelstahl, Granit, Sand in Wasser) und `erhalten` stehen in keinem Kapitel – sie bleiben nur für ältere Einträge unter „Heute fällig“.
  Englisch: Artikel vor buchstabierten Formeln („an H₂O particle“), Elementnamen mitten im Satz klein (`english-grammar.test.ts`).
  „Nach dem Mischen“ bei Messing: 12 Atome (8 Cu : 4 Zn); „abwechselnd“ als festes Muster (Zink auf einem regelmäßigen Untergitter, `mixing.ts`), „getrennt“ als zwei
  Blöcke (passt der Stoff nicht in ganze Spalten: Spalte für Spalte gefüllt), das richtige Bild sichtbar zufällig (Test); Lösungsweg „Die Atome sitzen zufällig
  verteilt im Gitter – kein Muster, alle noch da“ (nicht „gleichmäßig“), Rückmeldungen kurz genug für 375 × 667 (Test). Jedes Antwortbild hat eine Beschreibung mit
  Anordnung („gleichmäßig verteilt“, „C₁₂H₂₆ oben“, „zufällig verteilt“ …) – auch das richtige, sonst verriete das Vorlesen die Lösung (Test).
  Bild der Aufgabe `pic` (`.q-gm` als Grid mit einer Zeile `minmax(0, 1fr)`, sonst bleibt der Becher in voller Höhe – Inhalt 754 × 767 px in 232 px Platz – und
  wird abgeschnitten; Test). Jedes Aufgabenbild nennt seine Mindesthöhe `data-min-h` (`minPic`: Destillieren 100 px – Temperatur noch ≥ 14 px –, sonst 56 px wie
  `MIN_PIC`; ohne Tipp wird kein Bild so klein, auch nicht bei 375 × 667): darunter gehen Tipp und erster Schritt ins Blatt, statt das Bild zu stauchen (Test); bis dahin
  darf das Bild auf 56 px schrumpfen (sonst ragte der Tipp bei „Reihenfolge“ 1 px über die Aufgabe, ohne ins Blatt zu wechseln); nach der Antwort fällt ein Bild unter
  seiner Mindesthöhe weg (Container-Abfrage auf `.q-visual`),
  Teilchenbilder als Antworten `pics` (zwei Spalten, Höhe begrenzt; das Bild füllt die Taste, der Kennbuchstabe liegt klein oben links auf dem Rand – über dem
  leeren Rand des Bilds, nie über einem Teilchen; höchstens drei Bilder untereinander und größer, Klasse `few`, nach der Antwort am niedrigen Handy flacher),
  Verfahren `sep` (t = −1 Animation, sonst Standbild), Gemisch `mixPic` (Ausschnitt um Schale, Glas bzw. Papierstreifen – Eisenspäne, Sand und Salz gut zu sehen),
  Verfahren als Bildkarten `methods`. **Vorgemachte Beispiele zum Antippen** (`tippAtome`, `tippElement`, `tippVerbindung`, `trennTipp`, `loesTipp`) zeigen das Bild
  mit markierter Lösung (`visualFor` → `TapSolved`; sonst ist das Bild die Antwortfläche `TapAnswer`, Test `quiz/view.test.ts`); das Aufgabenbild weicht nach der
  Antwort am niedrigen Handy der Rückmeldung, im vorgemachten Beispiel nie (`.task-card.answered:not(.worked)`, Test). Text-Antworten gibt `renderOption` als reinen Text zurück (kein eigenes `span` – sonst misst `McAnswer` nicht, ob ein Wort in seine
  Spalte passt, und „Gasgemisch“ bräche zweispaltig mitten im Wort um). Stolpersteine u. a.: Verbindung für Gemisch gehalten, Gemisch aus Elementen für Verbindung, gelöster Stoff
  verschwindet, gelöster Stoff bleibt als Kristall, Masse ändert sich, Luft zwischen den Teilchen, Teilchen ruhen (auch in der Schmelze), Teilchen haben die Farbe des Stoffs
  (in Kapitel 1 nur Beispiele, deren Modellfarben das Kapitel zeigt: Zucker, CO₂, Wasser, Eis – keine Metalle, Test), „rein“ im Alltag,
  Legierung und Gemenge verwechselt, gemischte Metalle für Verbindung gehalten (Name ohne „Legierung“, kommt schon in Kapitel 3 vor), Gelöstes filtrierbar,
  Teile nach dem Trennen verwechselt, Reihenfolge vertauscht. Der Schlüssel passt zur gewählten Antwort (z. B. „fein verteilt für homogen gehalten“ nur bei
  einer homogenen Antwort, „Gemisch aus Elementen für Reinstoff“ bei Messing statt „klar“; Kakao mit Bodensatz „entmischt“; Test).
  Hilfsmittel „Farben“: alle Atomfarben (verrät nicht, welche vorkommen). Nie zwei Atomsorten mit ähnlicher Farbe (He/Ne, Cu/Fe, Zn/Al) in einer Aufgabe
  (`distinctColors`, Test); Argon violett. Artikel, Fall und Einzahl/Mehrzahl in erzeugten Sätzen beachten („aus 4 Atomen“, aber „H₂O₂ hat 4 Atome“, `ATOM_ACC`; Test). Erklärkarte je Kapitel (`quiz/explain.tsx`, Kapitel 5 mit
  dem Bild des Filtrierens, Kapitel 6 mit **Vorlage**; „In diesem Kapitel hilft der Tipp …“). k6: „Gelöstes geht durch das Filterpapier. Salz und Wasser trennt man
  über die Siedetemperatur …“ (nicht „Gelöstes trennt man über die Siedetemperatur“ – Farbstoffe trennt die Chromatografie; Test).
- **Trennverfahren** (`components/Separation.tsx`): Auslesen, Sieben, Magnettrennung, Dekantieren, Filtrieren, Eindampfen, Destillieren, Chromatografie als SVG-Bild,
  das eine reine Funktion des Fortschritts t ist (`SepScene`, 0 = vorher, 1 = getrennt; `SepAnim` spielt ab, „Nochmal“-Knopf, reduzierte Bewegung → Endbild).
  Teile mit `data-part` (Ziele für Beschriftung und Antippen). Mit `onPick` (Klasse `sp-tap`) nehmen **nur** die antippbaren Teile Klicks an (`parts` bzw.
  `TAP_PARTS` je Verfahren, z. B. Rückstand, Filtrat, Filterpapier – nie Verzierungen wie der schwarze Startpunkt der Chromatografie, Gefäße oder Hilfslinien),
  dazu unter dem Bild unsichtbare Trefferflächen je Teil: sichtbarer Umriss (`getBBox`, durch den `clipPath` begrenzt, über die Bildschirm-Matrizen in Bild-Einheiten),
  mindestens 44 × 44 px, nie über das Bild hinaus; etwa gleich große, überlappende Flächen (Farbflecken) teilen sich an der Mitte, ein viel kleineres Teil liegt oben auf
  dem größeren (Salz in der Schale). Bildausschnitt je Verfahren (`BOX`: Umriss aller Zeitpunkte mit Rand) – das Gerät füllt das Bild. Chromatografie: Farbstoffe weit
  genug auseinander, dass jeder Fleck 44 × 44 px Trefferfläche hat (Gelb bei Rf 0,25 – auch die Startlinie ist einzeln antippbar). Eindampfen: Dampf erst bei
  brennender Flamme; die Schale liegt mit ihrem tiefsten Punkt auf dem Drahtnetz über dem Dreifuß, die Flamme reicht bis ans Netz (Test). Destillieren nie bis zur
  Trockne (Salzwasser bleibt im Kolben, Alkohol und Wasser endet bei halb vollem Kolben und etwa 90 °C); Alkohol ist brennbar – mit `alk` sitzt der Kolben in einer
  **Heizhaube** (`Mantle`: Mulde glüht, Kontrolllampe), keine offene Flamme (Test). Temperatur am Thermometer auf dem Bildschirm mindestens 14 px (`tempFont`: Größe
  in Bild-Einheiten aus dem gemessenen Maßstab, heller Rand; Test). **Dekantieren** (`dekState`, Test): Glas 1 mit Ausguss rechts kippt im Uhrzeigersinn um die
  Spitze des Ausgusses bis 60°, der Wasserspiegel bleibt waagrecht (Fläche im gekippten Glas per Bisektion); was beim größten bisher erreichten Winkel nicht mehr
  hineinpasst, ist über den Ausguss ins anfangs leere Glas 2 geflossen (Strahl nur dann, aus der Spitze des Ausgusses); die Gläser berühren sich nie, der Sand
  bleibt als Bodensatz, danach steht Glas 1 wieder (mit etwas Wasser über dem Sand). `mark` umrahmt ein Teil gestrichelt grün (Lösung nach der Antwort im Quiz, in der Lektion nach dem Lösen bzw. pulsierend nach
  vier Fehlversuchen). `check-ui` prüft in jedem `svg.sp-tap`, dass jedes Teil mit Trefferfläche per `elementFromPoint` erreichbar ist und keine Trefferfläche aus dem Bild ragt
  oder mehr als 40 % des Bilds belegt (sonst zählt Tippen ins Leere als Antwort). Farben nur aus der Palette (`.sp-*` in `app.css`).
  `MixPic` = Gemisch vor dem Trennen ohne Geräte (verrät das Verfahren nicht). Eindeutige `clipPath`-Kennungen je Bild (`useId`).
  Sieben: Maschen als Drahtquerschnitte mit sichtbaren Lücken; Sandkörner rutschen zur nächsten Lücke, fallen hindurch und häufen sich in der Schale, Kiesel
  (größer als die Lücke) bleiben liegen. Destillieren: Rundkolben auf Dreifuß über dem Brenner, Thermometer am Abzweig (steigt auf 100 °C und bleibt dort, solange
  Wasser siedet), Liebig-Kühler mit Kühlwasser im Gegenstrom (unten hinein, oben heraus), Dampf wird im Kühler zu Tropfen, Vorlage = Erlenmeyerkolben, Salz bleibt
  im Kolben. Chromatografie: Streifen hängt im abgedeckten Becherglas; der Startpunkt ist schwarz (drei Farbstoffe übereinander), die Laufmittelfront steigt,
  jeder Farbstoff wandert verschieden weit (Gelb, Rot, Blau) – der Punkt läuft auseinander.
- Zählen in der Werkbank (`Counts` in `views/MixView.tsx`) ist eine **Anzeige zum Nachprüfen, keine Abfrage**: Teilchen, Stoffe, davon Verbindungen und Elemente,
  Atomsorten stehen immer mit Zahl da. Jeden Stoff, „Verbindungen“, „Elemente“ und jede Atomsorte kann man antippen: dann sind im Gefäß und in der Lupe nur deren
  Teilchen kräftig, alle anderen blass (`FlowView` `mark`); am Handy schließt sich das Blatt dabei. Kein Erklärsatz: jede markierbare Zeile und jeder Chip trägt das
  Kennzeichen ◎ (grau, gedrückt in der Farbe der Taste; `aria-label` „… im Bild markieren“). Die Statuszeile zeigt die Markierung als Taste („◎ CO₂ ✕“ = aufheben).
  Keine Eingabe, kein ✓/✗, keine Aufforderung.
- **Lektionen** (`src/lessons.tsx`, `LESSONS[0…5]`, je Kapitel 4–12 Schritte, vorgemacht → halb gelöst → selbst, keine Zahleneingabe; die richtige Auswahl steht
  an wechselnden Plätzen, Zahlen aufsteigend – Test: höchstens 40 % an Platz 1): 1 Teilchen zählen,
  Teilchen aus 5 Atomen antippen, Atomsorten an den Farben (Ablenker = echte Zählfehler: Teilchen, Teilchensorten; Test), Stoffe, **Eigenschaften des Stoffs**
  (halb gelöst: ein einzelnes Wasserteilchen ist nicht flüssig und hat keine Farbe – für die Aufgabe „Teilchen und Stoff“, Test), leerer Raum ·
  2 Element/Verbindung, Element antippen, Verbindungen zählen, Kupfer ·
  3 Reinstoff/Gemisch, homogen/heterogen (Zuckerwasser = Lösung, Milch, Gasgemisch), Lösen (Animation), Masse, Tinte · 4 Arten von Gemischen (Suspension,
  Emulsion, Schaum (Eischnee), Gemenge, Legierung – Anteile frei wählbar, oft homogen – fett eingeführt), in Gas (Gasgemisch, Nebel, Rauch fett eingeführt, eigener
  vorgemachter Schritt), Öl in Wasser, Müsli, „rein“ · 5 Sieben, Magnettrennung, Auslesen (rote/weiße Bohnen), Dichte/Bodensatz/Dekantieren,
  Bodensatz antippen, Filtrieren (Rückstand, Filtrat), Rückstand antippen · 6 **Gerät selbst bedienen** (`SepDevice`: Bild bei t = 0, Brenner aus, Knopf „Brenner an“,
  „Heizen an“ bzw. „Start“ spielt den Ablauf): Eindampfen, Destillieren von Salzwasser (Thermometer 100 °C), Destillieren von Alkohol und Wasser mit **Heizhaube**
  („Alkohol ist brennbar: Man heizt ohne Flamme“, Test; `alk`: beides verdampft, Alkohol
  leichter – im Dampf ist mehr Alkohol; Temperatur steigt langsam von etwa 80 °C an, kein fester Wert; Destillat nie „rein“; auch Erklärkarte k6 und Tipp, Test), Chromatografie (Satz: weit = gut löslich im Laufmittel und schwach haftend), weitesten Farbstoff antippen,
  mehrere Schritte Salz + Sand (vorgemacht) und Eisen + Sand + Salz (Platz ① ergänzen: Magnettrennung; Schrittnamen `STEP` wie in der Aufgabe). **Vorlage** und
  **Startlinie** fett eingeführt;
  der Rückstand beim Destillieren ist das salzige Wasser im Kolben (nie bis zur Trockne). Kapitel 4 beginnt mit „Viele Gemische haben eigene Namen“ (die Liste enthält
  auch die homogene Legierung). Englisch: Verfahren beim Einführen mit demselben Namen wie in den Aufgaben (filtration, evaporation, distillation); die Schritte
  einer Trennung als kurze Verben (Dissolve, Filter, Evaporate, Magnet – wie in der Aufgabe „Reihenfolge“, Test `english-steps.test.ts`).
  Begriffe früherer Kapitel stehen in `known`. Test: Geräte und Teile (Vorlage, Kühler, Destillat, Laufmittel, Rückstand, Filtrat, Bodensatz, Filterpapier) stehen
  beim ersten Vorkommen fett.

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
  Das PSE als Antwort („Tippe auf das Element mit der Ordnungszahl …“) zeigt die Ordnungszahlen lesbar (mindestens 9 px, in der Oberstufe auch am Handy, mittig unter dem Symbol;
  `.pse-z` in `app.css` – das schmale PSE blendet sie sonst aus). Kurzschreibweisen als Antwort ohne Zeilenumbruch (`.cfg-opt` über `renderOption` in `QuizView.tsx`):
  nie mitten durch umbrochen („[Ar] 4s² / 3d⁷“) – passt eine nicht in ihre Spalte, wird die Auswahl einspaltig.
  Schalen-Antwort: nach dem Prüfen stehen die eigenen Zahlen auf allen Schalen (auch ein Elektron auf einer Schale zu viel).
- Bohrmodell (`Bohr`, `shellRadius`, `bohrLayout`): feste Schalenradien (K 38, je 15 weiter außen), Elektronen immer gleich groß. Rahmen je Ansicht (`slots`): Baukasten
  Level I 4, Level II 7 (gestrichelte nächste Schale nur, wenn sie hineinpasst); Steckbrief 4/6; Quiz-Bild und „Atom bauen“ 4 (Elektronen höchstens 36, also höchstens 4 Schalen);
  „Schalen füllen“ = Schalenzahl der Aufgabe; Erklärung und Erklärkarte 3; Kachel 2; Quiz-Startbild 2/4. Ziehbare und antippbare Elektronen haben einen unsichtbaren Rand
  als größere Trefferfläche.
- **Großes PSE mit 7. Periode, Lanthanoiden und Actinoiden** nur im Atombau, Level II, Tab „Periodensystem“ (`PeriodicTable period7`, Lage in `pseLayout.ts`; Standard aus –
  alle anderen PSE unverändert): Elementdaten bis Oganesson (Z = 118; Namen IUPAC/Duden, Standardatommassen CIAAW, sonst Massenzahl wie im gedruckten PSE in eckigen Klammern;
  EN nach Allred-Rochow (null für Edelgase, nicht belegte Lanthanoide Nd, Pm, Eu–Tm, Lu und die 7. Periode), Radien bis Cm nach Cordero 2008, IE bis Lr nach NIST). Zeilen „Lanthanoide“ (La–Lu) und „Actinoide“ (Ac–Lr), Platzhalter 57–71 und 89–103
  in Gruppe 3; Kategorien „Actinoide“ und „Eigenschaften unbekannt“ (ab Mt, gestrichelt). Steckbrief für Z > 86 nur gesicherte Daten, keine Konfiguration/Schalen/Bohr/Bauen
  (`CONFIG_MAX_Z = 86`); Baukasten, Quiz und Suche außerhalb des PSE bleiben bei 1–86. Trend ohne Messwert: gestrichelt mit „–“, Legende „keine Daten“.
- PSE nach Blöcken färben (`PeriodicTable blocks`, `BlockLegend`, Farben `--b-s|p|d|f` passend zu den Orbitalfarben `--o-*`): im Periodensystem der Oberstufe unter „Farben → Blöcke“,
  im Quiz als Hilfsmittel bei Aufgaben zur Elektronenkonfiguration (`BLOCK_TYPES` in `QuizView.tsx`), nicht bei „Blöcke im PSE“ (wäre die Lösung).
- Chemie: Elemente Z = 1–86. Konfiguration überall = **gemessener Grundzustand** (`configuration`/`groundState` in `packages/chem/src/config.ts`): Aufbauprinzip,
  dazu die Tabelle der 13 Ausnahmen bis Z = 86 (`GROUND_STATE`, `AUFBAU_EXCEPTIONS`: Cr [Ar] 4s¹ 3d⁵, Cu [Ar] 4s¹ 3d¹⁰, Nb, Mo, Ru, Rh, Pd [Kr] 4d¹⁰, Ag, La [Xe] 6s² 5d¹, Ce, Gd [Xe] 6s² 4f⁷ 5d¹, Pt, Au) –
  so stimmen Bohrmodell, Schalen, Steckbrief, Kästchen und „Ungepaarte e⁻“ (Cr 6, Pd 0, Gd 8). Kationen geben aus diesem Grundzustand von außen nach innen ab: ns/np, dann (n−1)d,
  dann (n−2)f (Fe²⁺ = [Ar] 3d⁶, Cu⁺ = [Ar] 3d¹⁰, Cu²⁺ = [Ar] 3d⁹, Ag⁺ = [Kr] 4d¹⁰, Eu³⁺ = [Xe] 4f⁶); einfach geladene Kationen, die gemessen davon abweichen, stehen in
  `ION_STATE` (V⁺ [Ar] 3d⁴, Co⁺ [Ar] 3d⁸, Ni⁺ [Ar] 3d⁹, Y⁺ [Kr] 5s², La⁺ [Xe] 5d², Ce⁺, Ce²⁺ [Xe] 4f², Lu⁺, Lu²⁺, Hf⁺). Kennzeichen (`configException`, `components/ConfigNote.tsx`)
  in Steckbrief (Oberstufe, „Überblick“ und „Konfig.“) und Experimentieren („Steckbrief“, „Konfiguration“): beim Atom „Ausnahme: halb/voll besetzte d-Unterschale“ (Vergleich mit
  `ruleConfiguration`); bei Ionen eines Ausnahme-Atoms „Atom ist Ausnahme, Ion nach Regel“ (Cu⁺, Pd²⁺), bei gemessen abweichenden Ionen „Ausnahme: Ion gemessen anders besetzt“.
  Erklärung und Erklärkarte nennen Chrom und Kupfer als Ausnahmen (Cu⁺ = [Ar] 3d¹⁰ „aus Cu [Ar] 4s¹ 3d¹⁰“). Steckbrief Palladium: „Periode 5 (4 besetzte Schalen, 5s leer)“. Aufgaben, die das Aufbauprinzip üben (Konfiguration, Kurzschreibweise, Kästchen, Blöcke, ungepaarte Elektronen,
  Periode/Gruppe), fragen die Ausnahmen nicht ab (`DEVIATING`, Test). Ablenker „3d zuerst abgegeben“ bei Ionen: q Elektronen aus der d-Unterschale statt aus 4s
  (`dFirst`: Fe²⁺ → [Ar] 4s² 3d⁴, Cu²⁺ → [Ar] 4s¹ 3d⁸; Test). Spinquantenzahl als mₛ = ±½. Steckbrief-Kopf: Ordnungszahl oben links über dem Symbol, „Bauen“ am schmalen Handy in eigener Zeile.
  PSE-Ansicht: Ordnungszahlen (Unterstufe) und Symbole (schmales Oberstufen-PSE) mindestens 9 px. Ionen mit der Elektronenzahl eines Edelgases stehen in der Kurzschreibweise als ganzer Kern:
  Na⁺, O²⁻, Al³⁺ = [Ne], Cl⁻, Ca²⁺ = [Ar], Br⁻ = [Kr] (das Edelgas-Atom selbst mit dem vorigen Kern: Ne = [He] 2s² 2p⁶). Aufbau-Reihe `MADELUNG` bis 7p (Baukasten: Rn mit 3 Elektronen mehr).
- Begriffe: „Edelgaskonfiguration“ (Unterstufe in der Erklärung fett eingeführt, nicht „Edelgaszustand“/„Edelgasregel“); „Übergangsmetalle“ (d-Block, Gruppe 3–12) im Block-Schritt
  der Erklärung fett eingeführt, f-Block = Lanthanoide; „d-Unterschale“. Orbitalnamen im Fließtext ohne Tiefstellung („je ein p-Orbital entlang x, y und z“) – `RichText` kennt keine
  Tiefstellung. Wasserstoff steht in Gruppe 1 ohne Gruppennamen (`groupName`: kein „Alkalimetalle“). Außenelektronen von H und He: eigene Rückmeldungen (K-Schale fasst 2;
  Helium in der VIII. Hauptgruppe hat trotzdem nur 2 – Stolperstein `helium-acht`). Periode/Gruppe aus der Konfiguration: Außenelektronen (s + p) → Gruppe, im p-Block + 10.
- Häufigstes Isotop aus der Tabelle `COMMON_A` (`standardNeutrons`), nie gerundete Atommasse (Cu-63, nicht Cu-64). Nur gebundene Kerne (kein He-5, kein Be-8: `boundNuclide`, Test). Ionen in Aufgaben nur mit Ladungen, die es gibt (`commonCharges`); Namen mit `ionName` (Chlorid-Ion, Eisen(III)-Ion).
- Einzahl/Mehrzahl in generierten Texten beachten („1 Proton“, „1 Außenelektron“) – die Quiz-Tests prüfen das. Ladung 0 heißt „neutral“ (nicht „0+“).
  Im Quiz nicht „Grundzustand“ verwenden (nicht eingeführt).
- Erklärung Level I (26 Schritte): **Kern und Hülle** · **Elektronen und Masse** · **Schalen** (K, L, M fett eingeführt) · **Ionen** (Kation/Anion fett) · **Isotope**.
  Level II (38 Schritte, Orbitalmodell von Grund auf): **Atomsymbol** · **Grenzen des Schalenmodells** · **Elektronen als Welle** · **Quantenzahlen und Formen** · **Wie viele Elektronen?** ·
  **Energie und Aufbau** · **Das Atom in 3D** · **Kurzschreibweise und PSE** · **Ionen** (isoelektronisch fett).
  3D-Orbitale (`@lern/chem-ui/orbitals3d`, `Orbital3D`, per `lazy()`): Grenzflächen der wasserstoffähnlichen Wellenfunktion ψ (`packages/chem/src/orbitals.ts`, Marching Cubes),
  Farbe nach Orbitaltyp wie im Kästchenschema, Vorzeichen von ψ als dunkle/helle Tönung, Ziehen dreht. Höhere Schalen liegen weiter außen (5s weiter außen als 4s) –
  so ist es fachlich richtig, auch wenn 5s energetisch höher liegt. Orbitalbild bei niedrigen Bildschirmen (Höhe ≤ 760 px) kompakter.
- Erklärungen aller drei Module (Atombau, Ionenbindung, Elektronenpaarbindung): die richtige Auswahl steht an wechselnden Plätzen (höchstens 40 % an Platz 1, Test in `guide.test.ts`).

## Ionenbindung (`modules/ionenbindung`)
- **Bereiche: Lernen | Experimentieren** (erprobt die neue Ordnung, nur dieses Modul; kein Eintrag „Erklärung“, kein Quiz). Tab-Kennungen unverändert (`quiz` = Lernen, `build`).
- **Lernen** (`src/lernen/`): Kapitel je Stufe als Karten (`LernenView.tsx`: Nummer, Titel, ein Satz, Fortschrittsbalken, „Folie n“ bzw. „✓ fertig“). Level I = Kapitel 1–3,
  Level II = Kapitel 4–5 („baut auf Kapitel 1–3 auf“). Ein Kapitel = **25 Folien** in 4 Abschnitten (`part`, je höchstens 8) als `GuideDef`, gezeigt mit `Guide`
  (Vollbild, Kennzeichen „Kapitel n“, öffnet an der zuletzt gezeigten Folie, am Ende „Kapitel n+1“). Erklärung und Aufgaben in einem Fluss: jeder Abschnitt
  vorgemacht → halb gelöst → selbst (alle Regeln der Erklärung, `checkGuide`).
  Hilfsmittel jeder Folie (Leiste mit „Weiter“): **PSE** (Elemente der Folie markiert), **Tipp** (`tip` der Folie, kostet nichts, verrät nie die Lösung),
  **Erklärung** (Merksätze des Abschnitts, `explain` am Kapitel). Fortschritt in localStorage `ionenbindung-lernen` (`progress.ts`: Folie, weiteste Folie, fertig; `progressKey`).
- **Modell-Folien** (`model.tsx`, mindestens 13 von 25, Test `kapitel.test.ts`): Schüler verändern das Modell (Bohrmodell, Ionenwand, Formel- und Namens-Baukasten, Gitter,
  Kästchenschema …), die Änderung ist **sofort** zu sehen; „Prüfen“ meldet das gebaute Ergebnis als Text (`c.pick`), die Folie vergleicht mit `answer` und gibt zu typischen
  Fehl-Ergebnissen eine eigene Rückmeldung (`why`). Nach vier Fehlversuchen steht die Lösung im Modell (`useModel`, Hinweis „Die Lösung steht jetzt im Modell …“), der Schüler
  prüft selbst; gelöste und vorgemachte Modelle sind gesperrt. `ModelFrame` = Modell, Bedienung, „Prüfen“.
- Vorwissen nur aus Gemische, Atombau und den früheren Kapiteln (Begriffe in `known`, neue fett mit Beispiel). Nichts aus späteren Modulen: wie die Atome in einem
  mehratomigen Ion zusammenhalten, wird ehrlich zur Elektronenpaarbindung vertagt; Lösen in Wasser nur als Modell.
- Kapitel 1 **Vom Atom zum Ion** (Level I, `k1.tsx`, Modelle `k1/models.tsx`): **Außenelektronen und Edelgase** · **Metall-Atome werden Kationen** · **Nichtmetall-Atome werden
  Anionen** · **Elektronenübergang**. Eigenes Bohrmodell der Unterstufe (drei Schalen mit festen Radien und 8 Plätzen, freie Plätze gestrichelt; Elektronen abgeben
  bzw. aufnehmen über die Knöpfe „e⁻ abgeben“/„e⁻ aufnehmen“ (≥ 44 px; die Elektronen im Bild sind nur beim Markieren der Außenelektronen eigene Tippziele);
  feste Schalenradien ohne Ausnahme: das Teilchen wird nur kleiner, wenn eine Schale wegfällt (Kation: leere Schale gepunktet, Hülle kleiner), und nur größer, wenn eine neue
  dazukommt; ein Anion ist so groß wie sein Atom; jedes Modell hat einen festen Maßstab für alle erreichbaren Teilchen – Protonen ändern verschiebt keine Schale; Folie 24 und
  Merksatz: „Im Schalenmodell hat jede Schale eine feste Größe. Die echte Größe der Ionen zeigt es nicht: Ca²⁺ ist kleiner als F⁻“; alle Elektronen sehen gleich aus – die Aufnahme zeigen Text und Zahl, z. B. „Cl⁻ hat 1 Elektron mehr als
  Protonen: 18 e⁻ statt 17“; keine Hinterlegung hinter dem Atom; Bild in fester Zelle, Beschriftung `Caption` mit reserviertem Platz – kein Atom wandert; Schalen als Zeilen
  „1. Schale: 2 Elektronen“; leere Plätze beim Ion bauen nur bei Nichtmetallen). Ladungsrechner (Protonen/Elektronen), PSE mit Ionen nach der Hauptgruppen-Regel (Wasserstoff, Bor, IV. Hauptgruppe
  und Edelgase bilden in diesem Modell keine einfachen Ionen), Elektronenübergang mit „e⁻ übertragen“, einstellbarer Zahl der Atome und immer sichtbarer Gesamtladung;
  Fehlvorstellungen „Elektron verschwindet“, „Ionen entstehen einzeln“. Test `k1/k1.test.ts`.
- Kapitel 2 **Formel und Name** (Level I, `k2.tsx`, `k2/models.tsx`): **Ladungen ausgleichen** (Ionenwand mit Zählern) · **Die Formel** (Verhältnisformel, Index, kleinstes
  Verhältnis; Formel-Baukasten mit Index-Zählern, Reihenfolge-Tausch, Ionenwand darunter) · **Der Name** (Metall + Wortstamm + -id; Oxid, Sulfid, Nitrid; Namens-Baukasten aus
  Wortteilen in gemischter, nie lösungsgleicher Reihenfolge, alle gleich gefärbt; Fallen: Elementname statt Stamm, fehlende Endung, Zahlwort, Reihenfolge – kein „-it“, das
  kommt erst mit den mehratomigen Ionen; bei Ionenverbindungen lässt man die Anzahl im Namen weg) · **Formel und Name** (Ionenwahl: anfangs keine Ladung gewählt, Ausgleich
  und ✓ nur für Ionen, die es gibt; beide Richtungen). Nur ionische Beispiele (AlF₃ statt AlCl₃). Test `k2/models.test.ts`.
- Kapitel 3 **Ionengitter und Eigenschaften** (Level I, `k3.tsx`, `k3/`): **Anziehen, abstoßen** (Ion wählen `ChargePair`, Ion in der Reihe verschieben `IonRow`,
  quer oder hochkant je nach Bühne – Texte ohne Richtungswörter) · **Das Ionengitter** (Ionenverbindungen heißen auch **Salze**; Schicht füllen `LatticeFill`, Nachbarn antippen –
  4 in der Schicht, räumliches Gitter `Lattice3D` (`k3/lattice3d.tsx`: eigene 3D-Projektion in SVG mit Perspektive,
  Kugeln mit Licht/Schatten wie Bohr/Kalotte, hinten leicht im Dunst, von hinten nach vorn gezeichnet, die Schicht des Na⁺ als zarte Fläche; drehbar durch Ziehen mit Schwung,
  Pfeiltasten, Pos1 und „Startansicht“, eine langsame Startumdrehung – nicht bei reduzierter Bewegung, rAF nur während der Drehung; Ansichten „Nachbarn“ – Na⁺ mit 6 Cl⁻ – und
  „Gitterausschnitt“ – 3 × 3 × 3 im Wechsel, als Modell mit kleineren Kugeln gekennzeichnet; Beschriftung immer aufrecht; Test `k3/lattice3d.test.ts`), Verhältnis aus dem MgO-Ausschnitt `FormulaModel`) ·
  **Hart und spröde** (Temperatur-Schieber `ThermoLattice`: Kristall im Tiegel, kleine Teilchensimulation `k3/sim.ts` – fest schwingen die Ionen um ihre Plätze, Ausschlag
  wächst mit der Temperatur; ab der Schmelztemperatur (NaCl 801 °C) verlassen sie die Plätze und gleiten ständig ungeordnet aneinander vorbei – Platzwechsel gut sichtbar (`heatDrive`: in der Schmelze
  stärkere, länger gerichtete Wärmebewegung `stir`/`glide` und stärkerer Zusammenhalt; NaCl 1000 °C ≈ 1,1 Platzwechsel je Ion und Sekunde) –, je heißer, desto schneller (erst ab der
  Schmelztemperatur, je 200 °C darüber einmal so schnell: NaCl bei 1000 °C doppelt, höchstens 2,5-mal; `speed` = Zeitraffer der Simulation) –, dicht, ohne Überlappung,
  Gegen-Ionen nah (Anziehungslinien je nach Abstand weich ein- und ausgeblendet); darunter gleitet jedes Ion auf einen freien Platz seiner Ladung zurück; `ThermoPair`: NaCl
  und MgO (2852 °C) mit einem Schieber, je 4 × 3 Ionen – „NaCl flüssig, MgO fest“; Salzkristall zerbricht `Brittle` (`k3/brittle.tsx`): Makro → Lupe → Teilchen → Makro – durchscheinender
  Kristall, Hammer schlägt seitlich (Scherkraft), Lupe auf der Spaltebene mit „Ausschnitt, vergrößert“: obere Schichten gleiten, bei ½ Platz schwächer gehalten, nach einem
  ganzen Platz stehen gleiche Ladungen gegenüber → Abstoßung, die Schichten gehen auseinander; im Makrobild bricht der Kristall entlang der glatten Ebene, die oberen Stücke
  fliegen im Bogen weg (würfelige Bruchstücke, keine Splitter); vorgemacht als Ablauf mit „Nochmal abspielen“, KBr frei mit 0 – ¼ – ½ – ¾ – 1 Platz; Hammer-Frage mit Kristallbild) · **Strom leiten** (elektrischer Strom = gerichtete Bewegung geladener Teilchen; `Conduct`: Becherglas mit Batterie, Schalter, Lampe – fest
  Salzkörner, Schmelze 801 °C, Lösung „in Wasser H₂O“ – und eine Lupe „Ausschnitt“ aus der Mitte (neben oder unter dem Glas, Hinweislinien): fest schwingen die Ionen nur, in
  Schmelze und Lösung bewegen sie sich ungeordnet und wandern bei geschlossenem Schalter zusätzlich deutlich sichtbar waagrecht aneinander vorbei (`lensDrive`, FLOW 3,4: Ziel Schmelze 1,56 · LU/s, Lösung 1,02 · LU/s;
  senkrechte Wärmebewegung gedämpft `calm` 0,3 bei Strom, 0,8 ohne; Lösung mit `mix`, damit keine Reihen gleicher Ladung entstehen)
  – Kationen zum Minuspol, Anionen zum Pluspol, gemischt; der
  Ausschnitt ist größer als die Lupe, was hinausgleitet, kommt außerhalb des Sichtbaren wieder herein; Pole am Lupenrand, Legende „Na⁺ ← zum Minuspol“; was an den Elektroden
  passiert, bleibt offen („lernst du später“) – nie getrennte Ladungsblöcke, nie Ein-/Ausblenden mitten im Bild; Test `k3/sim.test.ts`). Ionen als Kugeln im Verhältnis der Ionenradien (Na⁺ 102, Cl⁻ 181, K⁺ 138, Br⁻ 196,
  Mg²⁺ 72, O²⁻ 140 pm), Ladung in der Kugel; Anziehung als Linie (→ ←), Abstoßung rot gestrichelt (← →) – nicht nur über Farbe. Wasser nur als Stoff „Wasser H₂O“; Lösen knüpft
  an Gemische an („Wasserteilchen lagern sich an und lösen die Ionen heraus“), das Warum kommt bei der Elektronenpaarbindung. Reduzierte Bewegung: ruhige Endbilder
  (fest: Gitter mit gestricheltem Schwingungsring, beweglich: ungeordnete Momentaufnahme).
- Kapitel 4 **Ionen aus mehreren Atomen** (Level II, `k4.tsx`, `k4/Models.tsx`): **Atomgruppen mit Ladung** (mehratomiges Ion als Atomkugeln in eckigen Klammern mit der
  Ladung oben rechts – als Modell gekennzeichnet, das echte Ion ist räumlich; Zähler für Atome und Ladung, Formel sofort; nicht aus einzelnen Ionen
  zusammengesetzt – SO₄²⁻ wäre so 10− statt 2−) · **Namen: -at, -it, Hydrogen-** (O-Zahl ändern →
  Name und Ladung sofort; H⁺ dazu → Hydrogen-, Ladung eins weniger negativ; Hydroxid, Ammonium) · **Formeln mit Klammern** („Formel schreiben“: Klammer an/aus und Index,
  Atome laut Formel und laut Ionenwand im Vergleich – CaOH₂ = 1 O, NH₄₂ = 42 H) · **Name ↔ Formel** (Ionenwahl, Namens-Baukasten). Nur beständige Verbindungen (Test `k4/k4.test.ts`).
- Kapitel 5 **Nebengruppenmetalle** (Level II, `k5.tsx`, `k5/models.tsx`) – **ohne Elektronenkonfiguration** (kein Kästchenschema, kein 4s/3d) und **ohne Auswendigwissen**
  (kein Silber/Zink, keine Aussagen „dieses Ion gibt es nicht“): **Ein Metall – mehrere Ionen** (zwei Stoffe aus denselben Elementen als Stoffproben: FeO schwarz/Fe₂O₃
  rotbraun, Cu₂O rot/CuO schwarz; Brücke zu Kapitel 1 mit Spaltenleiste `GroupStrip` (Blöcke 1 | 2 | 3–12 | 13 | 14 | 15–18 über I | II | Nebengruppen | III | IV | V–VIII, Schrift ≥ 14 px): im großen PSE Gruppe 1, 2 = I., II. Hauptgruppe, Gruppe 13–18 = III.–VIII. Hauptgruppe,
  dazwischen Gruppen 3–12 = Nebengruppen; Regel: Metalle der I. bis III. Hauptgruppe → Ladung aus der Hauptgruppe, alle anderen – Nebengruppenmetalle und Blei, IV. Hauptgruppe,
  PbO gelb/PbO₂ dunkelbraun – römische Zahl im Namen; Metalle wählen mit großen Knöpfen unter dem neutral gefärbten PSE, `PseMetals`) · **Vom Namen zur Formel** ·
  **Von der Formel zum Namen** · **Alles zusammen** (mehratomige Ionen). Ionenwand mit Ladungswahl (`WallModel`): vor dem Lösen nur „ausgeglichen“/„≠“ in neutraler Farbe,
  ✓-Rechnung und Name erst danach; in freien Folien stellen die Schüler die Anzahlen laut Formel selbst ein (die 2 in Cu₂ ist die Anzahl); Rückmeldungen nur über
  Ladungsbilanz und Namen (`wallWhy`, `pseWhy`). Nur Fe, Cu, Pb(II) aus `ions.ts`, nur beständige Stoffe; Gruppe 13 immer mit „= III. Hauptgruppe“ (Test `k5/k5.test.ts`).
- **Experimentieren** (Werkbank, unverändert): Ionen-Bausteine Kationen gold, Anionen grün, Breite = Ladung; neutral, wenn beide Reihen gleich lang sind. Startet gelöst
  (CaCl₂: ein Ca²⁺, zwei Cl⁻; `store.ts`). Vom Atom zum Ion (`IonSheet`): Schalen aus dem gemessenen Grundzustand (Cu: 1. Schale 2, 2. Schale 8, 3. Schale 18, 4. Schale 1 Elektron → Cu⁺ ohne 4. Schale; Tabelle mit einer Zeile je Schale); Kennzeichen „n Außenelektronen“
  nur bei Ionen mit Edelgaskonfiguration, sonst (Fe³⁺, Cu²⁺, Pb²⁺) in der Oberstufe „gibt 3 e⁻ ab“ · „aus 4s², 3d¹“, in der Unterstufe nur „keine Edelgaskonfiguration“;
  Atom und Ion im selben Rahmen (`slots` = Schalen des Atoms).
- Ionen, Formeln (`formula`, `ratio`) und Namen (`compoundName`) in `packages/chem/src/ions.ts`. Unterstufe nur Hauptgruppen-Ionen, Oberstufe zusätzlich Übergangsmetalle und Blei
  (römische Zahlen) und mehratomige Ionen (NH₄⁺, OH⁻, NO₂⁻, NO₃⁻, HCO₃⁻, SO₃²⁻, SO₄²⁻, CO₃²⁻, PO₄³⁻). Nicht beständige Verbindungen (FeI₃, CuI₂, Fe₂S₃, Al₂(CO₃)₃, AgOH, Na₃N, K₃N,
  Cu⁺-Salze mit Sulfat/Sulfit/Nitrit/Hydrogencarbonat, Nitrite und Sulfite von Al³⁺/Fe³⁺/Cu²⁺ …) stehen in `NOT_KNOWN` (`isKnownCompound`): Kapitel fragen sie nicht ab, der Baukasten zeigt einen Hinweis.
- Fachsprache: Elektronenübergang als **Modell der Ionenbildung**, die **Ionenbindung** ist die Anziehung der entgegengesetzt geladenen Ionen im **Ionengitter**; beschreibend
  (nie „Atome möchten 8 außen“, nie „Ca²⁺ braucht …“, sondern „gleicht aus“ bzw. „man braucht“). Endung **-id**: meist einatomig (Ausnahme Hydroxid OH⁻). Ladungsrechnung immer
  mit Zahl: `2 · (1−) = 2−` (`chargeFull`). Ohne „kgV“ (nicht eingeführt).

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
- Bindungswinkel: gemessene Werte in `REAL_ANGLES` (molecules.ts; H₂S 92,1°, PH₃ 93,5°, Dimethylether 111,7°, Trimethylamin 110,9°, CH₃SH 96,5° …), sonst EPA-Schätzung mit „ca.“
  (Tetraeder genau 109,5° und trigonal-planar genau 120° nur bei gleichen Partnern: CH₃Cl „ca. 109,5°“, Methanal „ca. 120°“). Zweiatomige Moleküle: kein Winkel.
  Summenformel unbekannter Kohlenstoffverbindungen nach Hill (CH₅N).
- **Polarität** (`isPolar`): polare Bindungen (ΔEN ≥ 0,5, EN nach Allred-Rochow; `enDelta` mit zwei Stellen: H–Br 0,54 polar, N=O 0,43 → NOCl schwach polar; Teilladungen nach
  Allred-Rochow: P–H H δ−, C–I und C–S C δ−; Beispiele für „polare Bindungen heben sich auf“ mit C–F: CF₄, C₂F₄, cis/trans-Difluorethen; `DIPOLE_MIN` 0,25), deren Bindungsdipole sich in der räumlichen Lage (`embed3D`) nicht aufheben – Vektorsumme > `DIPOLE_EPS` (0,01, nur
  Spielraum für Rundung: ClC≡N 0,61 − 0,49 = 0,12 und CBrCl₃ 0,20 sind polar; „unpolar (symmetrisch)“ nur bei Summe ≈ 0). `DIPOLE_MIN` (0,2) gilt nur für den Dipolpfeil.
  ΔEN an einer Stelle (`enDelta`, auf zwei Stellen gerundet wie die Tabellenwerte) für Teilladungen und Dipole (N=O: 3,44 − 3,04 = 0,40 → NOCl polar).
  Auch bei mehreren Zentralatomen (Cl₂C=CCl₂, N≡C–C≡N, Cl₃C–CCl₃ unpolar). Teile, die sich um eine Einfachbindung drehen und auf beiden Seiten schräge Dipole tragen (H₂N–NH₂,
  ClCH₂–CH₂Cl, HO–CH₂–CH₂–OH), gelten als polar (im Mittel bleibt ein Dipol). Eine Einfachbindung zwischen zwei Zweifachbindungen (Butadien, Glyoxal) dreht sich nicht frei:
  eben und s-trans (Glyoxal unpolar, gemessen 0 D). Zweifachbindungen: cis/trans wie gebaut (Lage der Partner im Raster, `gridCisTrans`, ohne Angabe trans) – cis-1,2-Dichlorethen
  polar, trans unpolar. Kumulierte Zweifachbindungen (Allen): Endgruppen senkrecht zueinander (1,3-Dichlorallen polar). **Schwach polar** (`isWeaklyPolar`, `hasWeakDipole`): nicht polar,
  aber ein Dipol aus Bindungen mit 0 < ΔEN < 0,5 (z. B. CH₃Cl, CH₂Cl₂, CHCl₃, CH₃Br; HI mit 0,01 gilt als unpolar; ohne C–H – Kohlenwasserstoffe gelten wie in der Schule als unpolar) oder aus freien Elektronenpaaren an Zentralatomen,
  die sich nicht aufheben: H₂S 0,97 D, PH₃ 0,57 D, NCl₃, CH₃I 1,6 D, CH₂I₂, CHI₃, H₂C=S, CH₃SH, CH₃–S–CH₃. Anzeige im Werkzeug „Bau“: polar · schwach polar ·
  unpolar (symmetrisch) · unpolar; bei „schwach polar“ ein Satz dazu (Modell: freie Paare oder kleine ΔEN). Tests in `packages/chem/test/molecules.test.ts`.
- **Elektronegativität** nach Allred-Rochow (`elements.ts`, Primärquellen im Kommentar; EN-Tabelle „EN nach Allred-Rochow“, Erklärung H–Cl 0,63 mit CF₄ als
  symmetrischem Beispiel, Erklärkarte os-3, Steckbrief mit zwei Stellen; Quiz Polarität ohne Chlormethan – gemessen deutlich polar, nach der Regel nur schwach polar –,
  dafür Methanal und Blausäure). EN-Werte stehen nicht im PSE – eigene Tabelle `components/EnTable.tsx` (Ausschnitt wie im PSE, Trend „EN steigt →“, „EN sinkt ↓“),
  in der Erklärung (Level II, Teil Polarität) eingeführt und im Quiz bei „Polarität“ und „am stärksten polar“ als Hilfsmittel „EN-Tabelle“; Werte auch auf der Erklärkarte os-3.
- 3D-Ansicht für fertige, verbundene Moleküle: hinterlegte Struktur (`storedMol3D`), sonst Kraftfeld MMFF94 im Hintergrund (`computeMol3D`, cis/trans an Zweifachbindungen
  wie gebaut über `gridCisTrans`), kennt das Kraftfeld das Molekül nicht: EPA. Auf Klick: `@lern/chem-ui/3d` (three.js, per `lazy()` nachgeladen):
  Kugel-Stab (Stäbe zweifarbig je Atomfarbe) oder Kalotte (Van-der-Waals-Radien), Atomsymbol erst beim Antippen eines Atoms.
  Lage „Real“ aus `packages/chem/src/mol3d.ts` (erzeugt von `scripts/mol3d.py`: RDKit, Kraftfeld MMFF94, gemessene Winkel aus `REAL_ANGLES` und Verdrillungen festgehalten –
  H₂O₂ 111,5°, Hydrazin gauche mit ca. 91° zwischen den NH₂-Gruppen (gestaffelt-anti wäre unpolar),
  CO₂, SO₂, SO₃, NO₂, HNO₃, P₂O₅ aus Messdaten, zweiatomige mit gemessener Bindungslänge; neues Beispielmolekül → SMILES dort eintragen und Skript laufen lassen).
  `embed3D` nimmt für bekannte Moleküle diese Daten (Zuordnung `matchAtoms`, freie Paare nach EPA auf die echten Bindungen gedreht), sonst und für „Idealisiert“ EPA in `packages/chem/src/geometry3d.ts`. Ringe (EPA): nach dem Baum Ausgleich von Bindungslängen und Winkeln (`relax`, Ringwinkel „≈ 90°“), danach Substituenten und freie Paare der Ringatome exakt nach EPA (`placeRingSubstituents`: =O auf der Winkelhalbierenden, H-Paare symmetrisch). Mehrfachbindungen als parallele Stäbe in der Ebene der Nachbarbindungen. Umschalter Real (gemessene Winkel, `REAL_ANGLES`) / Idealisiert (109,5° / 120° / 180°); Schalter: Bindungswinkel, freie Elektronenpaare, Teilladungen/Dipol (Oberstufe).
- Teilladungen/Dipol starten immer ausgeschaltet (nicht gespeichert); Dipolpfeil nur bei Molekülen bis 5 Atome (`dipoleArrow`), sonst nur δ+/δ−.
- Umschalter Strichformel / Keilstrichformel (nur fertige Moleküle): `wedgeLayout` in `packages/chem/src/wedge.ts` (Papierebene aus embed3D, Keil = nach vorn, gestrichelt = nach hinten).
  Ein Zentralatom mit Tetraeder (CH₄, NH₃ …) als feste Standard-Zeichnung (Bindungen gleich lang, zu Partnern mit freien Paaren wie Cl × 1,2; Striche halten vor zweibuchstabigen Symbolen mehr Abstand); sonst beste Ansicht (viele Bindungen in der Ebene, keine Überlappung). Einfachbindungen zwischen Tetraeder-Atomen gestaffelt.
- Wasser nie linear zeichnen (auch nicht als Deko, z. B. Übersicht).
- Erklärung Level I (16 Schritte): **Außenelektronen** (Lewis-Schreibweise, ungepaarte Elektronen, Edelgaskonfiguration fett) · **Bindungen** · **Mehrfachbindungen** ·
  **Moleküle und Namen**. Level II (15 Schritte): **Bindungen** · **Molekülform** (EPA) · **Polarität**.
- Begriffe im EPA-Modell überall gleich: **Molekülform** (nicht „Molekülgeometrie“), **Bereich** = jede Bindung (auch eine Mehrfachbindung) und jedes freie Paar am Zentralatom
  (nicht „Partner“, „Richtung“ oder „Paar“ als Zähleinheit); Bindungspartner = Nachbaratome. Polarität im Quiz: Chlormethan mit eigenem Stolperstein „Verschiedene Bindungspartner
  übersehen“ (`partner-ungleich`). Unterstufe: Namen-Aufgaben nur mit Molekülen der Unterstufe (auch als falsche Antworten); jeder abgefragte Name steht in der
  Erklärung Level I (Wasser, Ammoniak, Methan, Chlorwasserstoff, Fluorwasserstoff, Tetrachlormethan, Kohlendioxid; Test).
- Handy mit niedriger Höhe (≤ 760 px): Atom-Leiste mit 44-px-Tasten ohne Namen, Formel im Kopf kleiner – das Baufeld bekommt mehr Platz.
- 3D frei gebauter Moleküle: Kraftfeld MMFF94 (`packages/chem/src/mmff`, Einstieg `@lern/chem/mmff`, erst bei Bedarf geladen, rechnet im Hintergrund-Thread
  `packages/chem-ui/src/ff.worker.ts`; im Web, in der Offline-Datei und in der App); für bekannte Moleküle gemessene Strukturen (`mol3d.ts`). Herkunft und Lizenz
  (Parameter Merck, Regeln aus RDKit, BSD-3) in `packages/chem/NOTICE.txt` – erscheint unter „Lizenzen“. Prüfung gegen RDKit: `scripts/mmff-reference.py`, `packages/chem/test/mmff-reference.test.ts`.
  3D-Darstellung: gemeinsame Geometrien, Beschriftungen nur bei Bedarf, ohne Kantenglättung bei hoher Pixeldichte (flüssig auf Handys).

## Reaktionsgleichungen (`modules/reaktionsgleichungen`)
- Logik in `packages/chem/src/reactions.ts`: `parseFormula` (Klammern, tiefgestellte Ziffern), `balance` (Nullraum mit Brüchen → kleinste ganze Koeffizienten, `null` bei mehrdeutigen Gleichungen), `isBalanced`, `unbalancedElements`, `equationText` (Koeffizient 1 weglassen, `null` = „?“).
- Reaktionen in `REACTIONS` mit `stufe` (us/os) und `niveau` 1–4 (`reactionsFor(stufe, …niveaus)`), Titel, Art, Formeln ASCII wie `Ca(OH)2`; Stoffnamen in `SPECIES_NAMES` (jeder Stoff braucht einen Namen).
  Niveaus: US 1 höchstens eine Zahl ≠ 1 · 2 zwei bis drei Zahlen (2 H₂ + O₂ → 2 H₂O) · 3 Verbrennungen/Metalloxide · 4 knifflig (halbe Zahl → verdoppeln, Al + HCl); OS 1 Salze/Säuren (Ionen als Block) · 2 Zerfall/Fällung/Neutralisation ·
  3 mehrere Produkte · 4 Redox und große Zahlen (KMnO₄ + HCl, Cu + HNO₃, Oktan). Neue Reaktion nur mit eindeutiger Lösung (der Test prüft Bilanz und Kürzung, je Stufe und Niveau ≥ 6 Aufgaben,
  US-Niveau 1 und 2 nach der Zahl der Koeffizienten ≠ 1; keine Gleichung doppelt, auch nicht in beiden Stufen). Phosphor in der Unterstufe einheitlich als weißer Phosphor P₄ (P₄ + 5 O₂ → P₄O₁₀, P₄ + 6 Cl₂ → 4 PCl₃), nie zugleich als einzelnes P (Test).
  Phosphorpentoxid nur als Molekül **P₄O₁₀** (P₂O₅ ist nur die Verhältnisformel; Name „Tetraphosphordecaoxid (Phosphorpentoxid)“, 4 PH₃ + 8 O₂ → P₄O₁₀ + 6 H₂O; Test). Die Kennungen
  `p4o10`/`ph3-o2` sind neu, damit ein alter Übungsstand zur P₂O₅-Gleichung (`p2o5`/`ph3`) nicht als gelöst erscheint.
  Stoffnamen ohne ungenaue Trivialnamen (CaSO₄ „Calciumsulfat“, nicht „Gips“ – Gips ist CaSO₄ · 2 H₂O; HCl „Chlorwasserstoff“, nicht „Salzsäure“ – das ist erst die Lösung in Wasser).
- Aufbau (einfach, wenige Knöpfe): Bereiche **Üben | Experimentieren** (Reihenfolge wie in allen Modulen) – keine Erklärung, kein Quiz (die App startet mit Experimentieren). Experimentieren (Kennung `start`) = je Stufe 5 Beispielreaktionen nur aus Molekülen (`STARTS` im Store, Stand je Stufe gespeichert: US Knallgas, HCl, NH₃, Methan, Propan; OS = Level II bewusst komplexer: Gärung, Fotosynthese, Ethanol verbrennt, Ostwald-Verfahren, Oktan verbrennt; Knöpfe 1–5, ✓ wenn gelöst; nach ✓ „Ablauf ansehen“),
  nach dem letzten Beispiel „Zum Üben“. Mit `BalanceCard`:
  Titel, Teilchenbild (`MoleculeScene`, Kästen passen sich dem Inhalt an, nebeneinander oder übereinander), Ergebnis erst nach „Prüfen“ (`≠ O`, `kürzen : 2`, `✓ ausgeglichen`,
  Kastenrahmen grün bzw. rot gestrichelt) – bewusste Ausnahme von „Experimentieren stellt nie Fragen … kein ✓/✗“: Ausgleichen ist hier das Werkzeug selbst, „Prüfen“ zeigt nur den
  **Zustand** der Gleichung als Kennzeichen (wie „✓ neutral“ in Neutralisation), stellt keine Frage, vergibt keine Punkte und zählt keine Fehlversuche (keine „Lösung“ im Experimentieren), Gleichung **immer einzeilig, nie umbrechen** (`EquationRow`: Fit-Text – Schrift passt sich der Breite an, 26 → min. 10 px; jeder Stoff ist ein Tippziel ≥ 44 px, antippen → Zahlenauswahl 1–12, Niveau 4 bis 40), ein Hauptknopf. Keine Werkzeugleiste, kein 3D.
  Teilchenbild nur, wenn alle Stoffe Moleküle aus Nichtmetallen sind (`hasModel` in `Molecules.tsx`, `isMolecular` in `@lern/chem`) – Salze und Metalle nie als Kalotten (sähe aus wie Elektronenpaarbindung); dann bleibt die Bühne leer (Start hat nur Moleküle).
  Elemente, die die Gleichung als einzelnes Atom schreibt, obwohl im Stoff viele Atome verbunden sind (Kohlenstoff C, Schwefel S), zeichnet das Bild als eine Kugel und kennzeichnet das
  darunter („Modell: S als einzelnes Atom gezeichnet“, `singleAtoms`, `.ms-note`, 14 px). Kasten so hoch wie der höchste Stapel (Zeilenhöhe je Stoff – ein großes Molekül wie P₄O₁₀
  macht die Stapel der kleinen nicht hoch), Zeilen je Stapel so, dass die Moleküle am größten werden. Zu wenig Platz (kleines Handy, Tipp offen, nach ✓): das Bild wird nie
  zerdrückt – unter 10 px je Einheit (H-Atom 12 px) bzw. 56 px Höhe steht stattdessen der Knopf „Teilchenbild ansehen“ (Bild groß im Blatt; bei noch weniger Platz
  nur „Teilchenbild: zu wenig Platz“; `MIN_SCALE`, `MIN_H`); der Modell-Hinweis steht nur mit Bild, nie abgeschnitten.
- Stoff-Info (gemeinsam: `@lern/chem-ui` `Substance.tsx`, hier `components/Substance.tsx`): Stoffnamen sind Knöpfe (Experimentieren und Üben: Wortgleichung unter dem Titel, `NameLine`). Blatt: Summenformel, Art (Molekül mit Atomzahlen, Ionenverbindung mit Ionen,
  Metall, Element), Strukturformel (`layout2D`: Ketten gerade, sonst ebene Zeichnung aus `MOL3D`; Käfige wie P₄O₁₀ nur 3D) und 3D-Modell
  (`Molecule3D` mit `data` aus `MOL3D`).
  Fit-Text misst neu bei Größenänderung des Platzes und nach dem Laden der Schrift; passt es bei 10 px noch nicht, wird die Zeile als Ganzes skaliert (nie abschneiden).
  Ohne Rückkopplung: der Rahmen `.eq-fit` hängt nie von der Gleichung ab (`contain: inline-size`, `.rg-controls` mit `minmax(0, 1fr)`), beobachtet wird nur seine Breite
  (nicht die Zeile, deren Schrift gesetzt wird), höchstens 8 Anpassungen ohne 2 s Pause, 1 px Luft – in Safari (iPhone) sprang die Zeile sonst ständig zwischen zu groß und winzig.
  Die Gleichungszeile ragt in der Karte über den Innenabstand hinaus (`.rg-controls .eq-fit`).
  Kalottenmodell, **jedes Atom muss gut zu sehen sein (Vorrang vor echtem 3D)** (Geometrie `packages/chem/src/kalotte.ts`, Zeichnung `@lern/chem-ui` `Kalotte`, Test ≥ 65 % je Atom über `visibleShare`;
  Ausnahmen P₄-Tetraeder und P₄O₁₀-Käfig ≥ 55 % – dort verdeckt in jeder Ansicht ein Atom ein anderes zum Teil, gemessen 56 % bzw. 62 %): Moleküle aus `MOL3D` (MMFF94) in der Ansicht mit dem am wenigsten verdeckten Atom (`orient`, 160 Richtungen), Bindungen bis ×1,15 gestreckt, gebundene Kugeln überlappen; ist trotzdem ein Atom unter 70 % sichtbar, die ebene Zeichnung wie eine Strukturformel (`flatView` aus `flat` der Daten, RDKit 2D, auseinandergeschoben; Glucose, Ethanol, H₃PO₄, CH₄ …; P₄O₁₀ als feste Standard-Zeichnung `flatFixed`, P₄ bleibt Tetraeder). Ketten CₙH₂ₙ₊₂ immer gerade wie die Strukturformel (`chainView`, kein Zickzack). Salze/Säuren aus Bausteinen, Kugeln nach Tiefe sortiert und dezent schattiert
  (radialer Verlauf – bewusste Ausnahme vom „keine Verläufe“), Farbfamilien nach CPK aus der Palette (`--hue-*`, Tokens `--atom-X` in `@lern/chem-ui` styles.css; die Tests prüfen Farbtoken, Atomzahlen und Abstände). Formeln nie änderbar.
- **Ablauf der Reaktion auf Abruf** (`components/AnimSheet.tsx` → `ReactionMorph` in `components/Morph.tsx`, Logik `morph.ts`): Start nach ✓ Knopf „Ablauf ansehen“ in der Statuszeile
  → Blatt mit Gleichung (Zahlen rot) und Animation: Edukt-Moleküle lockern sich (Bindungen brechen) → Atome wandern zum nächstgelegenen Platz gleicher Sorte im Produkt →
  rücken zusammen (neue Bindungen). Kein Atom verschwindet oder kommt dazu; Atomzahlen je Element stehen darunter. „Abspielen“/„Noch einmal“ und Regler Edukte ↔ Produkte
  (links „Edukte (Ausgangsstoffe)“ zweizeilig, beide Zeilen 14 px; englisch „Reactants (starting materials)“ – das Modul hat keine Erklärung, die den Begriff sonst einführt), Abschnittsname als `Tag` (am Anfang ebenfalls „Edukte (Ausgangsstoffe)“). Beim Üben ebenfalls erst nach ✓ (vorher würde sie die Zahlen verraten).
  Nur für Gleichungen aus Molekülen (`hasModel`). Höhe im Blatt `min(62dvh, 560px)` – auf kleinen Handys hat die Animation in der Karte keinen Platz.
- Gespeichert: Stand der Start-Beispiele je Stufe (`reaktionsgleichungen-v2`, Version 3 übernimmt den alten Stand der Unterstufe); Üben in `reaktionsgleichungen-ueben` (Schwierigkeit je Stufe, gewählte Aufgabe, gesetzte Zahlen, ✓ je Gleichung und `peeked` = Lösung angesehen).
  Stufen-Schalter Level I/II (Start immer Level I, nicht gespeichert).
- **„So geht's“ (ⓘ)** im Kopf von Üben und Experimentieren (`components/HowTo.tsx`, Blatt): die Regeln, die das Modul ohne eigene Erklärung sonst nirgends nennt – die Zahl vor
  einem Stoff gilt für alle seine Atome, Formeln nie ändern, links und rechts gleich viele Atome, kürzen – mit dem Mini-Beispiel H₂ + O₂ → H₂O. Nur zum Nachlesen, keine Frage
  (eine Erklärung als Bereich gibt es hier bewusst nicht; Test `howto.test.ts`).
- **Üben** (`src/ueben/`): je Stufe drei Schwierigkeiten **Einfach | Mittel | Schwer** mit je 10 festen Gleichungen (`EXERCISES` in `exercises.ts`, 60 verschiedene,
  keine aus dem Experimentieren – auch nicht aus dem der anderen Stufe –, auch als Gleichung verschieden – Level II Mittel beginnt deshalb mit 4 PH₃ → P₄ + 6 H₂ statt noch einmal P₄ + 5 O₂ → P₄O₁₀;
  keine schon ausgeglichene Gleichung (✓ ohne Handlung): Level I Einfach mit N₂H₄ + O₂ → N₂ + 2 H₂O statt C + O₂ → CO₂, Schwer mit 2 CH₄ + 3 O₂ → 2 CO + 4 H₂O statt Ethanol (das ist Experimentieren Level II)). Alle nur aus Molekülen (`hasModel`), damit nach ✓ bei jeder Gleichung „Ablauf ansehen“ (Animation) geht; Moleküle, deren Kugelmodell
  nicht jedes Atom zeigt (SF₆, PCl₅), sind deshalb nicht dabei. Gleiche Karte wie im Experimentieren (`BalanceCard`): Teilchenbild, Gleichung, „Prüfen“, nach zwei
  Fehlversuchen „Lösung“ (`showSolution`): danach zeigt „Prüfen“ zwar „✓ ausgeglichen“ und den Ablauf, die Aufgabe zählt aber **nicht** als selbst gelöst (kein ✓ im Fortschritt,
  daneben der Hinweis „Lösung angesehen – kein ✓“);
  beim Weitergehen (andere Aufgabe oder Schwierigkeit) beginnt die Gleichung von vorn (alle Zahlen 1), damit sie später selbst gelöst werden kann (Test `store.test.ts`). Kopf: Schwierigkeit (`Segmented`), Aufgabe ‹ n / 10 ›, Schalter **„Teilchen“** (Kugelbild ein-/ausklappen, dann nur Text; Standard an, nicht gespeichert), Fortschritt als 10 Kästchen (✓ gelöst). Knopf **„Tipp“** zeigt einen festen, von Hand
  geschriebenen Hinweis zu genau dieser Gleichung (`HINTS`, DE/EN) über der Gleichungszeile (ein- und wieder ausblendbar – „Tipp aus“ gibt dem Teilchenbild den Platz zurück) – er zeigt den Weg (womit beginnen, was vergleichen, was zuletzt, wann verdoppeln), nennt aber
  keine gesuchte Zahl vor einem Stoff und nimmt den Denkschritt nicht vorweg (nicht „F₂ bringt 2 F-Atome, jedes HF nur eines“ oder „CH₄ hat 4 H-Atome, jedes H₂ liefert 2“,
  sondern „Vergleiche die F-Atome: F₂ links, HF rechts“; nie „schon ausgeglichen“). Nach der letzten Aufgabe einer Schwierigkeit „Weiter zu Mittel/Schwer“.
  Test `exercises.test.ts`: 3 × 10 je Stufe, 60 verschiedene Gleichungen, eindeutig ausgleichbar, nur Moleküle, Zahlen im Bereich der Auswahl, Hinweise vorhanden, Sätze ≤ 22 Wörter, keine Lösung „2 HF“,
  kein „nur eines“/„only one“, keine Atomzahl zusammen mit „je/jedes/each“ und kein „schon ausgeglichen“ im Hinweis.

## Neutralisation (`modules/neutralisation`)
- Lauge + Säure → Salz + Wasser mit Ionen-Bausteinen wie in der Ionenbindung (Breite = Ladung): Reihe 1 Metall-Ionen (gold), Reihe 2 OH⁻ (blau), Verbindungsstriche = H₂O,
  Reihe 3 H⁺ (blau, gestrichelt – ohne Farbe unterscheidbar), Reihe 4 Säurerest (grün). Neutral, wenn OH⁻- und H⁺-Reihe gleich lang sind. Knopf „Reaktion“ zeigt die Produkte
  (Salz aus Reihe 1 + 4, darunter die H₂O). Eine Formeleinheit antippen = Zerfall in Ionen (Blatt). Komponente `NeutralWall`, auch im Quiz und in den Erklärkarten.
- Logik in `packages/chem/src/neutralization.ts`: `PROTIC_ACIDS` = genau die Säuren der Tabelle (einprotonig HCl, HClO₄, HCOOH, HBr, HNO₃, CH₃COOH; zweiprotonig H₂S, H₂SO₃, H₂SO₄, H₂CO₃;
  dreiprotonig H₃PO₄) mit allen Säureresten je Stufe (Hydrogen-/Dihydrogen-Ionen), `HYDROXIDES` (Al(OH)₃ nur Oberstufe), `neutralEquation(base, acid, step)`:
  Zahl der H₂O = kgV(Ladung des Metall-Ions, abgegebene H⁺), Salz über `formula` aus ions.ts. Salze, die als Produkt in Wasser nicht entstehen, mit Grund in `saltProblem` (`isKnownSalt`):
  Al mit Sulfid/Carbonat/Sulfit und ihren Hydrogen-Formen (zersetzt sich), MgS, CaS, BaS (reagieren mit Wasser – aus Ca(OH)₂ + H₂S entsteht Ca(HS)₂), Ba(HSO₄)₂ und Ca(HSO₄)₂
  (BaSO₄ bzw. CaSO₄ fällt aus); die Werkbank zeigt den Grund als Kennzeichen, das Quiz fragt sie nicht ab (Test). Englisch heißt H₂S „hydrosulfuric acid“, nicht „hydrogen sulfide“
  (so heißt dort das Ion HS⁻; Test: kein Säurename gleich einem Säurerest-Namen).
- Werkzeug „Hydroxid“ (nicht „Lauge“): Mg(OH)₂ und Al(OH)₃ sind kaum löslich (`poor`, Hinweis im Blatt); Lauge = Lösung eines Hydroxids in Wasser.
  Säurenamen: Chlorwasserstoff, Bromwasserstoff.
- Unterstufe nur vollständige Neutralisation; Oberstufe wählt in der Säuretabelle (Werkzeug „Säure“) auch den Säurerest = wie viele H⁺ abgegeben werden (Hydrogensalze).
  Säuretabelle nach Anzahl abgebbarer H⁺ (Gruppen senkrecht beschriftet: Level II „Einprotonig …“, Level I „1 H⁺ …“ – der Begriff kommt erst in Level II; Level I ohne Perchlorsäure,
  wie im Quiz, `acidsFor` im Store), passt auch breit (≥ 1024 × 768) ganz ins Register (dafür verkleinert `FitDown` sie am Handy – dort unter 14 px, bewusst). Gespeichert (`neutralisation-v1`): Lauge, Säure, Stufe der Abgabe, Anzahlen.
- Salzformeln ionisch, Kation zuerst (NaCH₃COO, KHCOO, Ca(HCO₃)₂). Wortgleichung mit Laugen-/Säurenamen **und Formel** (Natronlauge NaOH + Salzsäure HCl → ? + Wasser H₂O; Regel
  „Stoffe immer mit Name und Formel“). Level I nennt als Laugennamen nur Natronlauge (sonst den Namen des Hydroxids: Calciumhydroxid Ca(OH)₂); Kalilauge, Kalkwasser, Barytwasser
  führt die Erklärkarte „Salze & Gleichungen“ der Oberstufe ein (Test).
  Säurenamen mitten im Satz bzw. in der Wortgleichung klein, wo sie ein Adjektiv haben („Kalilauge + schweflige Säure“; groß nur in der Tabelle und am Satzanfang, Test).
- Quiz (`src/quiz/tasks.ts`, Katalog `misconceptions.ts`): protolyse, protonen (OS), restName, restLadung, hydroxid, bauen (Bausteine, Fallen 1 : 1 / vertauscht / nicht gekürzt),
  wasser, koeffizient (OS), salz, salzName, gleichung. Namensfallen nur mit Ionen, die es gibt (-id/-it/-at derselben Familie, Hydrogen-Formen nur beim Schwefel – also nur für
  Hydrogensulfid/-sulfit/-sulfat, nie Schwefel-Namen bei Hydrogencarbonat oder -phosphat –, Formiat ↔ Acetat; Test). Säuretabelle als Hilfsmittel nur Oberstufe und nur bei Aufgaben, die nicht nach Namen/Ladung der Säurereste fragen.
  **Level I** ohne Perchlorsäure/Perchlorat (erst in Level II eingeführt), ohne Hydrogen-Namen und ohne „einprotonig“/„Formeleinheit“ (Level II; **Formeleinheit** führt die Erklärkarte „Neutralisieren“ der Oberstufe ein) – auch nicht als falsche Antwort, im Tipp oder in einer Rückmeldung (Test über alle Texte;
  `acidsFor(os)`, Tipp zu Salznamen je Stufe). **Formeleinheit** = kleinste Gruppe, die die Formel angibt (1 Ca(OH)₂ = 1 Ca²⁺ + 2 OH⁻). Tipps nennen nur die Regel (Endungen -id/-it/-at,
  Hydrogen-/Dihydrogen-), nie einen Beispielnamen, der die gesuchte Antwort sein könnte – der Tipp ist auch als „Erster Schritt“ sichtbar (Test: kein Wort der Antwort im Tipp, alle Typen, beide Level, DE/EN).
  Jeder Stolperstein hat einen eigenen Schlüssel (Koeffizient: „Zahl der H₂O als Koeffizient genommen“ `wasser-als-koeffizient`). **Jede falsche Antwort hat eine eigene Rückmeldung**
  (Test DE/EN): erst die speziellen Fallen, nur wenn es weniger als drei gibt, allgemeine (`withFill`: Ladung/H⁺/H₂O/Koeffizient verzählt, Säurerest bzw. Salz einer anderen Säure „aus Salpetersäure HNO₃“). Salz, Salzname (Wortgleichung), Gleichung und Bauen nennen bei mehrprotonigen Säuren als **eigenen Satz vor der Frage**, wie viele H⁺ jede
  Säure abgibt („Jedes H₂SO₄ gibt **alle 2 H⁺** ab.“ bzw. „nur **1 H⁺**“, Zahl und H⁺ mit geschütztem Leerzeichen; englisch „both H⁺“, „all 3 H⁺“) – Level II lehrt die teilweise Neutralisation, sonst wären Hydrogensalze ebenso richtig (Test).
  Tipp „Säuren in Wasser“: die H vorne in der Formel, bei COOH-Säuren nur das H der COOH-Gruppe (die Erklärkarte Level I führt **COOH-Gruppe** ein); Rückmeldungen zu Essig- und
  Ameisensäure sprechen vom H der COOH-Gruppe, nie von „H vorne in der Formel“ (Test); „abgegeben wird nur das H …“ bzw. „werden nur die 2 H …“. Englisch: jeder Satz beginnt groß,
  Namen mitten im Satz klein („is called chloride“, „(potassium phosphate)“; Test in `english.test.ts`).
- Quiz „Neutralisation bauen“: die Wand füllt den freien Platz (`FitOr` in `NeutralWall.tsx`: verkleinert höchstens auf 80 %, sonst nur die OH⁻- und die H⁺-Reihe, sonst nur die Bilanz als Text),
  Zähler und „Prüfen“ stehen immer ganz darunter – auch mit „Erster Schritt“ am kleinen Handy. Bausteine mindestens 37 px hoch (Schrift ≥ 14 px).
- Erklärung Level I (15 Schritte): **Säuren** · **Laugen und Wasser** (vorgemachte Wand ohne Reaktion) · **Salz und Gleichung**. Level II (14 Schritte): **Mehrprotonige Säuren** ·
  **Ausgleichen** · **Salze benennen** (Formiat, Perchlorat eingeführt; `known`: Nitrat, Sulfat, Carbonat, Hydrogencarbonat, Phosphat aus der Ionenbindung).
  Vor „Wie viele H⁺ kann CH₃COOH höchstens abgeben?“ nennt die Liste der einprotonigen Säuren CH₃COOH nicht (sonst stünde die Antwort schon da).
  Auswahl-Schritte: die richtige Antwort steht an wechselnden Plätzen (die Erklärung mischt nicht; je Stufe höchstens 40 % an Platz 1, Ladungen nach Betrag geordnet; Test `guide.test.ts`).

## Nomenklatur (`modules/organik`)
- Organische Verbindungen frei zeichnen, der Name folgt nach IUPAC (deutsche Schreibweise: Benzen, Oct, Ethansäure, Butansäureethylester), mit weiteren Namen
  (Trivialname, Benzol-Schreibweise, ältere Schreibweise 2-Propanol, Diethylether, Ethylamin, Ethylbutanoat), Summenformel nach Hill und Stoffklassen.
  3D auf Abruf (Werkzeug „3D“, `components/View3D.tsx`): hinterlegte Struktur (`storedFor`), sonst Kraftfeld MMFF94 (`computeMol3D`; Eingabe `chem/forcefield.ts`:
  alle H, NO₂ mit Ladungen, E/Z wie gezeichnet); Kugel-Stab oder Kalotte.
- Logik in `src/chem/`: `mol.ts` (Graph ohne H, Wertigkeit, NO₂ als Baustein mit einer Bindung), `rings.ts` (nur Einzelringe: Cycloalkane, Benzen,
  Heterocyclen mit einem O/S/N: Oxolan, Thiolan, Pyrrolidin, Oxan, Thian, Piperidin, Furan, Thiophen, Pyrrol, Pyridin …; kondensierte Ringe, Ringe über 30 Atome
  und Dreifachbindungen im Ring → eigene Meldung), `naming.ts` (Stämme bis 30 C, längere Ketten → Meldung „zu lang für diese App“; mehr Bindungen als die Wertigkeit
  → Meldung; ranghöchste Gruppe (im Code `principal`) nach Rang Säure > Ester > Amid > Nitril > Aldehyd > Keton > Alkohol > Thiol > Amin; Stammsystem nach IUPAC 2013: meiste ranghöchste Gruppen,
  Ring vor Kette, Ring mit N vor O vor S vor Carbocyclus, größerer Ring, längste Kette (C der Gruppe in der Kette vor „-carbonsäure“), meiste Mehrfach-, dann Doppelbindungen;
  Nummern: ranghöchste Gruppe, Mehrfachbindungen, Doppelbindungen, dann meiste Vorsilben, Vorsilben, alphabetisch erste, Z vor E; gleiche Buchstaben: kleinere Nummern zuerst
  (1-Methylbutyl vor 2-Methylbutyl). Vorsilben rekursiv: (1-Methylethyl), Acetyloxy, (Dimethylamino), Methoxycarbonyl, Piperidin-1-yl; Klammern außen ( ) → [ ] → { } → ( );
  ohne Nummern steht eine Vorsilbe, die selbst Substituenten tragen kann, hinter einer anderen in Klammern (Chlor(methoxy)methan, [Ethyl(methyl)amino]);
  N, N′, N″ an mehreren Aminen; > 2 COOH an einer Kette → -carbonsäure; Ester „Säure + Alkyl + ester“, verschiedene Alkylreste mit Nummern (Butandisäure-1-ethyl-4-methylester;
  weiterer Name Alkyl…oat: ein Alkylrest ohne Klammer – 2-Methylpropylacetat –, verschiedene Alkylreste nur ohne Vorsilben am Säureteil – 1-Ethyl-4-methylbutandioat,
  nicht „4-Ethyl-1-methyl-2-methylbutandioat“),
  gleichwertige Säureteile (Diacetat eines Diols): bestes Stammsystem, dann alphabetisch; Nummern weglassen nur, wenn eindeutig: Ethanol, Propen, Methylcyclohexan, Butansäure;
  Keten C=C=O → Meldung). Varianten für das Quiz über `NameOptions` (andere Seite, kürzere Kette, nicht alphabetisch, ohne di/tri, andere ranghöchste Gruppe);
  „andere Seite“ liefert in `reverse` die Regel, nach der die beste Richtung gewinnt (ranghöchste Gruppe, Mehrfach-/Doppelbindung, Vorsilben, Alphabet, Z), mit beiden Nummernfolgen.
  Englisch: `nameEnOrder` bestimmt Reihenfolge und Nummern mit den englischen Vorsilben (ethyl vor ethynyl, propyl vor prop-2-ynyl; deutsch Ethinyl vor Ethyl),
  `english.ts` übersetzt danach Teil für Teil; verschiedene Alkylreste eines Esters alphabetisch (4-ethyl 1-methyl 2-methylbutanedioate).
  Stoffklassen: C=O im Ring neben dem Heteroatom = Lacton/Lactam/Thiolacton (Name wie Keton, -on; Lösungsweg sagt es), OH am Benzolring = Phenol, OH am Heteroaromaten
  kein Alkohol (Klassen Heterocyclus, Aromat), OH an C=C = Enol, Cycloalken nur bei C=C zwischen zwei Atomen desselben Rings (exocyclisch = Alken), Thioether.
  Lösungsweg: „Ranghöchste Gruppe: …“; Heterocyclus ohne Gruppe: „Der Ring mit Heteroatom hat einen eigenen Namen.“ „Nummerieren“ (`numberingSteps`) nennt die Regel,
  nach der die beste Nummerierung gegen die nächstbeste gewinnt (`reverseRule`), mit beiden Nummern; was von beiden Seiten gleich ist, steht davor („Die ranghöchste Gruppe
  hat von beiden Seiten C3. Dann entscheidet der Ast: 2 statt 4.“, Alphabet, Z); Heterocyclus: „Das Heteroatom im Ring hat immer die Nummer 1. Weiter so zählen, dass …“;
  Name ohne Nummern (Ethanol, Phenol): „Die Nummer steht nicht im Namen: Er ist auch ohne eindeutig.“ Benzolring mit einer Gruppe: „Statt Benzenol heißt es Phenol
  (eingeführter Name).“ Ring mit einer ranghöchsten Gruppe: „Das C mit der ranghöchsten Gruppe ist C1. Weiter so zählen, dass …“ (kein „1 statt 2“).
  Vorsilben wie im Namen, zusammengesetzte in Klammern (4-(1-Methylethyl), 4,5-Bis(1-methylethyl)); Gruppe des Amins/Amids nach den H am N
  (–NH₂, –NH–, –N<; –CONH₂, –CONH–, –CON<). Ester: Säureteil, Alkylteil (ohne Bindestrich).
  Zahlwörter für gleiche Teile bis 99 (`MULT`/`MULT_X` in `rings.ts`: … deca, undeca, dodeca, icosa, henicosa, docosa, triaconta …; Tetradecachlorhexan).
  Endungen in Sätzen (Lösungsweg, Quiz-Texte, Erklärung, Erklärkarten) mit geschütztem Bindestrich U+2011 (`keepEnding`), damit „-in“ nie am Zeilenende
  getrennt wird, und nach „–“ vor Formeln mit Wortverbinder U+2060 (–COO–, –OH); Namen und Antworten bleiben unverändert.
  `layout.ts` (Zickzack 120°, Ringe als Vielecke, Start am fernsten C; an C=C nie eine gerade Linie und nie beide Gruppen auf derselben Seite, sonst wäre E/Z nicht ablesbar;
  gedrängte Äste – Endatome, Teilbäume und Ringe als Ast bis 8 Atome – starr um ihr Anknüpfungsatom in die freieste 15°-Richtung gedreht, am Ring nur nach außen,
  nicht an C=C außerhalb kleiner Ringe, `spreadBranches`: Perchlorhexan ≥ 0,7 Bindungslängen, Prüfmoleküle ohne Abstand < 0,5;
  `orient` dreht kleine Bilder in 30°-Schritten passend zur Fläche),
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
  Name erst nach „Benennen“, danach live; Knopf „Farbe“ (gespeichert): jeder Teil des Namens hat eine Farbe – Stamm blau, ranghöchste Gruppe rot, jede Vorsilbe
  (Methyl, Ethyl, Hydroxy, Oxo …) und der Alkylteil des Esters eigene –, dieselbe Farbe im Namen und an den Atomen der Formel (`NamePart`/`groupsByKey` aus naming.ts, `components/colors.ts`); Hauptkette hinterlegt, Nummern rot, ranghöchste Gruppe markiert. Werkzeuge: Beispiele (nach Stoffklasse) | Schritte (Lösungsweg) | Gruppen (Rangfolge) | Ansicht | 3D | Zurück | Neu;
  lange Beschriftungen mit weichen Trennstellen U+00AD (Bei|spiele, Schrit|te, Grup|pen; Exam|ples, Skel|etal), bei 360 px zweizeilig statt abgeschnitten.
  Läge ein Atom unter „Farbe“ oder „Ordnen“, bleibt oben ein Streifen frei (`covered`, `TOP` in `Editor.tsx`); sonst kein Streifen, damit nichts unnötig kleiner
  wird. Tippziele bleiben ≥ 44 px, auch verkleinert: Atome mit festem Radius in px, Bindungen mit Strichbreite nach der schmalen Seite der Bindung.
  Ziehen auf ein volles Atom: Meldung in der eingestellten Sprache, markiert wird das volle Atom (Start oder Ziel).
  Stifte auch bei 360 px Breite (mit „Lesbar“) mindestens 44 × 44 px in einer Reihe.
  Start: Gerüstformel, Farbe an, Beispiel 2-Methyl-3-oxohexansäure mit Name (`START` im Store; ältere Stände einmal umgestellt).
  Name in Farbe = farbige, kräftige Schrift (keine hinterlegte Fläche); Stamm blau, ranghöchste Gruppe rot, Vorsilben grün/violett/grünblau …
  Gespeichert (`organik-v1`): Zeichnung, Stift, Ansicht, Name sichtbar, Farbe.
- Quiz (`src/quiz/tasks.ts`, Katalog `misconceptions.ts`): stamm, kette (Zahl), alkan, alken, lage (Zahl), klasse, endung, gruppen, ester, prio, mehrere, struktur (Name → Formel,
  Antworten als Gerüstformel). Falsche Namen kommen aus der Benennung selbst. Hilfsmittel: Groß (Formel bildschirmfüllend), Regeln (Stämme nicht bei stamm, Rangfolge nicht bei klasse/endung/prio).
  Nur chemisch mögliche Moleküle (kein Ast am C des Ketons; Test: Wertigkeit in allen Aufgaben aller Generatoren). Jede Rückmeldung passt zum Distraktor:
  andere Seite nennt die entscheidende Regel mit den Nummern („Das C der –CHO-Gruppe ist immer C1.“, „Dann entscheidet das Alphabet: Ethyl bekommt die 3.“,
  „2,5,5 statt 3,3,6. Der erste Unterschied entscheidet.“), ohne di/tri und nicht alphabetisch mit den Vorsilben der Aufgabe; andere Gruppe an derselben Stelle
  ändert nur die Gruppe (Aldehyd/Säure nur am Kettenende); Name → Formel (`formulaMiss`): COOH bleibt ganz, kein zweites O/N am selben C, Rückmeldung nennt den
  Unterschied – andere ranghöchste Gruppe (endung), abweichende Vorsilben (formel-lesen), Kette ±1 C (zaehlen), alle Nummern gespiegelt (nummer: vom falschen
  Ende gezählt), sonst eine Gruppe an anderer Stelle (stelle: „Methyl sitzt hier an C3 statt an C2“). Antworten 2 × 2, die vier Formeln teilen sich die Höhe der Karte
  (nie abgeschnitten), gedreht passend zur Zelle (`orient`); Atom-Beschriftung in Aufgabenbild und Antworten mindestens 13 px (`labelScale` aus dem gemessenen
  Maßstab); wird ein Bild niedriger als `data-min-h`, stehen Tipp und erster Schritt im Blatt. Erklärung aus dem Lösungsweg ohne die Zeile „Nummerieren“, wenn eine
  Rückmeldung schon die Zählrichtung nennt. Moleküle, deren Zählrichtung das Alphabet oder der erste Unterschied entscheidet (nicht eingeführt), fragt das Quiz
  nicht ab (`rareRule`). Level 4 mit Oxo-Vorsilben (=O neben Säure oder Aldehyd); falsche Rangfolge als Name nicht bei Säuren (sonst „1-Hydroxy-…-1-oxo…“);
  prio: OH/C=O der COOH-Gruppe genau benannt, ein zusätzliches Keton wird genannt. Kein „cis/trans“ (nirgends eingeführt).
  Tipps sind Denkschritte ohne Zuordnung und ohne Rangfolge (endung: „Bestimme zuerst die Gruppe …“, prio: „Benenne zuerst jede Gruppe … Plätze in der Rangfolge“,
  stamm: „Welcher Stamm gehört zu dieser Zahl?“; Test). klasse: Rückmeldung beschreibt die gewählte Klasse, die Erklärung die richtige (kein Satz doppelt).
  Level: 1 Alkane (Stämme bis Dec, längste Kette, Äste) · 2 Doppel- und Dreifachbindung (Alken/Alkin, Lage, E/Z) · 3 Funktionelle Gruppen (Stoffklassen, Endungen, Ester) ·
  4 Mehrere Gruppen (Rangfolge, Vorsilben, Name → Formel); feste Reihenfolge je Level. Erklärkarten (`quiz/explain.tsx`) führen ein, was die Erklärung nicht hat
  (Hept … Dec, Alken/Alkin, Stoffklasse, Ordnungszahl bei E/Z, Chlor-/Amino-Vorsilben; Level 3 alle Klassen fett mit Gruppe: Alkohol, Aldehyd, Keton, Carbonsäure, Amin,
  Ester, Ether – Ester: „–COO– verbindet Säureteil und Alkylteil“; Level 1 di/tri und alphabetisch, di/tri zählen nicht; Level 2 bei gleichem Atom entscheiden die
  **Nachbarn**; Level 4 **ranghöchste Gruppe**, Oxo- = C=O). Begriff „Äste“ überall (Quiz, Lösungsweg `naming.ts`, Stolpersteine; englisch „branches“); „ranghöchste Gruppe“
  (englisch „principal group“) statt „Hauptgruppe“, das im Atombau die Gruppe im PSE ist.
- Erklärung (24 Schritte, keine Stufen): **Alkane** (Stamm, Methan … Hexan) · **Äste und Nummern** (Hauptkette, Ast, Methyl, Nummerierung vom nahen Ende, di/tri,
  **Ethyl**, alphabetisch, di/tri zählen nicht) · **Mehrfachbindungen** (-en = Alken, -in = Alkin, Nummer, E/Z, gleiches Atom: die **Nachbarn** entscheiden) ·
  **Alkohole** (halb gelöst ohne Aldehyd/Keton, die erst später kommen; selbst: Beginn der Nummerierung bei Butan-2-ol) · **Säuren und Rangfolge**
  (Carbonsäure, Aldehyd, Keton, Amin, Vorsilbe fett eingeführt; erst **Rangfolge**, dann **ranghöchste Gruppe** = die Gruppe, die in der Rangfolge vorn steht).
  Richtige Antwort an wechselnden Plätzen (Test: höchstens 40 % an Platz 1).

## Polymere (`modules/polymere`)
- Keine Stufen. Leiste **Üben | Experimentieren** wie Gemische: Üben = sechs Kapitel, je Kapitel Lektion → zehn Aufgaben.
- **Begriffe beim Üben** (`quiz/lexicon.tsx`): alle Monomere (Strukturformel, Kügelchen, ein Satz „Wie Ethen, aber …“, weiterer Name), Kunststoffe (Kurzzeichen, Monomer,
  Verwendung), Starter/Katalysatoren (Formel, Verfahren) und funktionelle Gruppen sind im Text antippbar, Hilfsmittel „Begriffe“ listet die der Aufgabe. Nicht gezeigt, wo es
  die Antwort wäre (`HIDE`: Monomer bei Monomer ↔ Polymer, Verwendung bei Alltagsfragen; Test: keine Karte aus Frage/Antworten nennt die richtige Antwort).
  Jede Fertigkeit hat einen eigenen Tipp (`tip`, in jedem Modus statt des allgemeinen Hinweises – Kapitel, „Alles gemischt“, „Heute fällig“, „Schwächen üben“, auch im
  gelösten Beispiel; nur der Verweis auf die Erklärkarte `hintCue` bleibt im Kapitel) mit den Stoffen der Aufgabe, als Denkschritt – nie mit der Regel oder der Antwort
  (Test je Typ mit verbotenen Wendungen).
  Auch in den Lektionen sind Begriffe antippbar (`GuideDef.terms`, Antwortknöpfe ohne). Monomer-Bilder in Aufgaben tragen eine Zeile mit Name und Merkmal
  (`Vis.note`: „**Styrol** – die C=C trägt einen Benzolring“); ein Lektionsschritt, der nach Stoffen fragt, zeigt sie vorher mit Namen (`Row`).
- **Experimentieren** (`views/ExperimentView.tsx`): am Anfang Auswahl **Polymerisation | Polykondensation | Polyaddition** (Zeile „Art der Reaktion wählen“, darunter
  drei Karten mit Kügelchen-Bild (ganz im Bild, am schmalen Handy kleiner), oben beginnend – keine Leerfläche darüber; Kennzeile „Nebenprodukt H₂O bzw. HCl“ ohne einzelnes Wort am Zeilenende), danach oben als Umschalter.
  Kennzeichen (Produktkarte, Statuszeile) einheitlich mit großem Anfangsbuchstaben, auch auf Englisch. Gespeichert (`polymere-v1`): Art, Ansatz je Art, Ansicht, Schalter „Bausteine farbig“ und „Freie Elektronenpaare“ – der Ablauf selbst
  nicht (beim Öffnen beginnt der Ansatz von vorn). Ansatz:
  - Polymerisation: Monomer (`VINYLS` in `chem/data.ts`: Ethen, Propen, Styrol, Vinylchlorid, Methylmethacrylat, Acrylnitril, Tetrafluorethen, Isobuten,
    Butadien (Einbau 1,4), Vinylacetat), optional ein zweites (gleichzeitig = statistisches Copolymer; nacheinander = Blöcke nur bei lebenden Ketten, sonst zwei
    getrennte Polymere, `seqKind`), Verfahren (`METHODS`): Dibenzoylperoxid und AIBN (radikalisch, Initiator), Ziegler-Natta TiCl₄ + Al(C₂H₅)₃ (koordinativ, Katalysator),
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
  lebende Ketten, außer Acrylnitril (Nebenreaktionen an der C≡N-Gruppe beenden die Ketten nach und nach). **Anionisch nacheinander** (`anionStarts`, `seqKind`):
  ein Kettenende startet nur Monomere mit gleich stark oder stärker stabilisiertem Anion (Reihe Styrol/Butadien → Methylmethacrylat → Acrylnitril) – Styrol → MMA
  ergibt Blöcke, MMA → Styrol nicht (Styrol bleibt übrig, nur PMMA); bei Acrylnitril als erstem Monomer sind die Ketten bis dahin tot. Gleichzeitig anionisch mit
  verschieden starken Enden setzt sich das Monomer mit dem schwächeren Ende durch (Styrol + MMA → fast nur PMMA; `anionFirst`); gleich starke Enden (Styrol + Butadien
  in Kohlenwasserstoff): Butadien lagert sich viel schneller an (r ≈ 12 bzw. 0,03) – **Gradienten-Copolymer** (erst fast nur Butadien, zum Schluss Styrol;
  statistisches SBR anionisch nur mit polarem Zusatz). Nacheinander radikalisch, kationisch oder mit Ziegler-Natta: zwei getrennte Polymere (Produkt „Gemisch aus …“,
  `mix`, Bild beider Wiederholeinheiten; Hinweis: übriges erstes Monomer bauen die neuen Ketten mit ein). **Ein Monomer bildet mit dem Verfahren keine Ketten**
  (`withFailing`): das andere ergibt sein Homopolymer (`unreacted`, z. B. Ethen + Isobuten mit Ziegler-Natta → PE-HD; nacheinander Ethen → Vinylchlorid: erst PE-HD,
  dann vergiftet); kein Polymer nur, wenn der Katalysator von Anfang an vergiftet ist (gleichzeitig bzw. das giftige zuerst) oder eine Nebenreaktion den Starter vorher
  verbraucht hat; beide ungeeignet, eines mit kurzen Ketten → „Nur kurze Ketten“; ein Monomer mit kurzen Ketten (Allyl-H, H⁺-Abgabe) neben einem passenden: gleichzeitig
  wird es wenig eingebaut und bremst – vor allem das Homopolymer des anderen (Isobuten + wenig Butadien kationisch: vulkanisierbar wie Butylkautschuk, `rubber: "butyl"`);
  nacheinander getrennt – erst das Homopolymer des passenden, daneben eigene kurze, ölige Ketten. **Radikalisch gleichzeitig** (`radicalFirst`): Monomere mit
  konjugierter C=C (Styrol, Butadien, MMA, Acrylnitril) lagern sich viel schneller an als Vinylacetat, Vinylchlorid, Ethen (r₁ ≫ 1 ≫ r₂, z. B. Styrol/Vinylacetat
  r ≈ 55 bzw. 0,01) – erst fast nur das Homopolymer des schnellen, das andere erst nach dessen Verbrauch (Styrol hemmt Vinylacetat sogar); Atom-Ansicht und Reaktor
  ebenso. Ethen + Tetrafluorethen: nahezu alternierend (ETFE, `alt` in `COPOS`, `altPair`). Übrige Paare ohne Eintrag: „etwa gleich schnell … zufällige Reihenfolge“. Vinylchlorid, Tetrafluorethen, Vinylacetat anionisch nur Nebenreaktion; kationisch nur mit Elektronen schiebenden Gruppen (Isobuten bei −100 °C,
  Styrol); Ethen radikalisch nur unter Hochdruck und verzweigt (PE-LD, Code 4), mit Ziegler-Natta unverzweigt (PE-HD, Code 2); Propen und Styrol mit Ziegler-Natta
  isotaktisch, sonst ataktisch; Butadien mit TiCl₄/Al(C₂H₅)₃ überwiegend 1,4, aber nicht pauschal cis (fast nur cis-1,4 erst mit passendem Katalysator, z. B. Neodym).
  Produkte (`polymerise`) mit Name, Kurzzeichen, Klasse (Thermoplast, Elastomer, Duroplast), Aufbau, Verwendung, Recycling-Code;
  bekannte Copolymere SBR/SB, SAN, NBR, EPM, EVA, SMMA, PVC/VAc. **Kautschuk-Art** (`rubber`, Produktkarte: Kennzeichen und ein Satz): Dien-Kautschuk (BR, SBR,
  NBR) wird durch Vulkanisieren zum Elastomer (Schwefel an C=C), EPM hat keine C=C (vernetzt mit Peroxiden), PIB ist nicht vernetzbar (mit wenig Dien: vulkanisierbar), SB-Blockcopolymer aus
  zwei Blöcken: Kennzeichen „Blockcopolymer (zwei Blöcke)“ – thermoplastisches Elastomer erst mit drei Blöcken (SBS: Styrol → Butadien → Styrol); Klasse eines unbekannten Copolymers nach `copoClass` (mit Dien bzw. Elastomer-Monomer: Kautschuk).
  Englische Namen mitten im Satz klein (`lc`, „the chain end made of styrene“). Stufenwachstum (`reactGroups`, `stepReact`): –COOH + –OH → Esterbindung + H₂O,
  –COOH + –NH₂ → Amidbindung + H₂O, –COCl + –OH/–NH₂ → … + HCl, –N=C=O + –OH → Urethangruppe, –N=C=O + –NH₂ → Harnstoffgruppe, Epoxid + –NH₂ → geöffneter
  Ring (ohne Nebenprodukt), Phenol + Methanal → CH₂-Brücke + H₂O. Funktionalität (`functionality(id, partner)`: zählt nur Gruppen, die mit dem Partner reagieren;
  –NH₂ zählt gegenüber Epoxid doppelt): eine Gruppe → nur kleine Moleküle (Kettenstopper), drei → Netz (Duroplast). **AB-Monomer + Partner** (Milchsäure,
  6-Aminohexansäure; `isAB`): reagiert auch mit sich selbst, die Bausteine wechseln sich nicht ab; Kettenstopper → klein, zwei passende Gruppen → linear, drei (Glycerin) →
  **sternförmige Moleküle** (`star`: Glycerin in der Mitte, bis zu drei Arme; jeder Arm endet mit der anderen Gruppe des AB-Monomers, die weder mit einem Arm noch
  mit Glycerin reagiert – zwei Sterne verbinden sich nie; Produkt „Sternförmig verzweigter Polyester …“, Kennzeichen „sternförmige Moleküle“, schmelzbar, kein
  Duroplast), nie Netz. Disäure bzw. Säurechlorid + Glycerin (A₂ + B₃) bleibt vernetzter Polyester (Duroplast, Netz); verschiedene Verknüpfungen werden alle genannt (`links`, `byps`:
  Milchsäure + Diamin → Ester- und Amidbindung, Polyesteramid). Reagiert nichts, nennt die Begründung den Fall (`noLink`): gleiche Gruppen; Epoxid + –OH bzw.
  –N=C=O nur mit Katalysator; Phenol + Säurechlorid nur kleiner Ester (eine –OH); Methanal + Aminogruppen gibt Harnstoff- und Melaminharze (Aminoplaste), im Modell nur
  mit Phenol; Methanal allein → POM ist eine Polymerisation. Reagiert der Partner nicht, aber das AB-Monomer mit sich selbst (Milchsäure + Phenol), entsteht dessen
  Polymer (PLA bzw. PA 6, `unreacted` = Partner – Atom-Ansicht ohne den Partner, im Reaktor ohne reaktive Gruppen). Bekannte Produkte: PET, PBT, PEA, PBA, PA 6.6, Aramid,
  PA 6T, PLA, PA 6, Phenoplast, PUR, TPU, vernetztes PUR, Polyharnstoff, Epoxidharz, Polyesterharz.
- **Atom-Ansicht** (`chem/scene.ts`, `chem/draw.ts`, `chem/stepdraw.ts`, `chem/mech/*`, `components/MechSvg.tsx`, `components/MechStage.tsx`): Valenzstrichformel
  (Zweifachbindung = zweite Linie daneben, wird beim Einbau ausgeblendet), Bausteine farbig hinterlegt (gleiche Farbe wie ihr Kügelchen), freie Elektronenpaare als
  Striche, Ladungen im Kreis, wandernde Elektronen als Punkte, **Pfeile vor jeder Bewegung** (halbe Spitze = ein Elektron, volle = Elektronenpaar).
  Die Pfeile zeichnet der zentrale Baustein **`CurlyArrow`** (`@lern/chem-ui`, für jedes Modul mit Mechanismen): gleichmäßiger Bogen (kubisch, symmetrisch),
  Höhe nach Länge (kurze Pfeile flach statt Kringel), weicht beschrifteten Atomen aus (höherer Bogen, Seite bleibt), gefüllte Spitze bzw. halber Widerhaken außen am Bogen,
  Strich endet unter der Spitze, Spitze etwa ein Drittel Bindungslänge; blau wie die Elektronen (rot läse sich auf O-Atomen schlecht), Strich so kräftig wie die Bindungen. Atome, an denen ein Pfeil
  ansetzt, blendet der Bildrand nie aus (sonst zeigte der Pfeil ins Leere; Ringe ausgenommen – nie ein halber Ring). Homolyse O–O: je ein Halbpfeil von der Bindung schräg nach außen über das eigene O.
  Jede Aktion ist ein Ablauf aus Schlüsselbildern (`Key`: Bild, Halten, Bewegen, Pfeile), dazwischen weich überblendet (Lage, Deckkraft, Bindungsordnung).
  Abläufe: radikalisch (Erwärmen: O–O bzw. C–N bricht, jedes Atom behält ein Elektron, CO₂ bzw. N₂ geht ab; Anlagern Monomer für Monomer; Abbruch durch
  Rekombination oder Disproportionierung), anionisch (Butyllithium lagert sich an, Kette lebt, Methanol beendet; ein Kettenende, das das Monomer nicht starten
  kann: ✗ „zu schwach“), kationisch (Säure aus BF₃ und Wasser, Anlagern, H⁺-Abspaltung; am Butadien-Ende geht das H vom C1 ab → konjugiertes Dien, kein Allen,
  zwei Pfeile, der erste außen um C1 herum), Ziegler-Natta (Aktivieren, Anlagerung an der freien Stelle, Vierzentren-Übergang, Einbau zwischen Titan und Kette – Butadien mit drei Pfeilen:
  π-Paar C1=C2 bildet Ti–C1, Paar der Ti–C-Bindung der Kette bildet die Bindung zu C4, π-Paar C3=C4 wird zur neuen C2=C3; Elektronen paarweise; das Butadien liegt
  dabei höher und etwas links, die H des ersten Ketten-C zeigen nach unten, damit die neue Bindung steil zwischen den H hindurchführt und der Ti–C-Pfeil oberhalb Platz hat –,
  H₂ löst die fertige Kette,
  Vergiftung sichtbar: O/N/Cl/F bindet an das Titan, ✗; Isobuten prallt ab). Nacheinander ohne lebende Ketten (radikalisch, kationisch, Ziegler-Natta): die
  Aktion des zweiten Monomers bricht zuerst ab bzw. löst die Kette und startet eine **neue Kette** aus dem zweiten Monomer (Status `second`; „lebend“ nur bei
  lebenden Enden). Polykondensation zu Ester bzw. Amid als **Additions-Eliminierung in drei Schritten mit Pfeilen**: ① freies Paar des O bzw. N greift das C der
  C=O an, das π-Paar geht zum O; ② Zwischenstufe mit O⁻ und O⁺/N⁺, H⁺ wandert zur –OH der Säure; ③ C=O bildet sich zurück, Wasser geht ab (Säurechlorid: ② Cl⁻
  geht ab, ③ Cl⁻ nimmt das H⁺ → HCl); Ladungen stets ausgeglichen, Cl⁻ mit vier freien Paaren (Test: Formalladung aus Bindungen und freien Paaren = gezeichnete
  Ladung, alle Bilder), H₂O bzw. HCl sinkt beschriftet weg. Pfeil-Lage (`clearAng`: Richtung mit dem meisten Platz): der zweite Pfeil der H⁺-Wanderung (N–H bzw. O–H → N
  bzw. O) endet auf der freien Seite, lang genug für einen sichtbaren Bogen; der Pfeil der Abgangsgruppe endet am abgehenden O bzw. Cl auf der vom C abgewandten
  Seite, das Ladungszeichen weicht ihm aus. Hinter „ⓘ“ steht, was vereinfacht ist (`SIMPLE`: ohne Säurekatalyse bzw. Salz/Zwitterion, Base fängt HCl, Phenoplast nur Bilanz).
  Monomer mit zwei verschiedenen Gruppen als erstes Monomer: passt nur seine linke Gruppe zum Partner (Milchsäure + Disäure), wird es gewendet. Polyaddition (H wandert zum N, Urethan- bzw.
  Harnstoffgruppe; Epoxidring öffnet sich), Zweierkette (nur wenn beide Monomere lauter gleiche Gruppen haben – mit Milchsäure oder 6-Aminohexansäure wäre
  die Richtung nicht eindeutig), Phenoplast (CH₂-Brücke in **ortho-Stellung** zur –OH, Ringspitze mit –OH oben; Methanal trigonal; nur die Bilanz ohne
  Pfeile – in Wirklichkeit über mehrere Stufen, erst –CH₂OH am Ring, dann die Brücke; Wasser aus dem O des Methanals und je einem ortho-H steigt auf).
  Nicht passende Partner: ✗ und Begründung (gleiche Gruppen, Kettenende blockiert). Automatisch (`nextAuto`) endet: bei Ziegler-Natta nach „+ H₂“ (bei getrennten
  Ketten nach der zweiten), beim Stufenwachstum, wenn kein Monomer mehr zum Kettenende passt. Ein Monomer, das keine Ketten bildet, zeigt Automatisch einmal
  (abprallend zuerst, mit Nebenreaktion nach zwei Bausteinen, nacheinander an seiner Stelle) und baut danach mit dem passenden weiter; anionisch gleichzeitig
  kommt das schnellere Monomer zuerst. Alte Atome weit links fallen nur als ganze kleine Moleküle weg (nie ein halbes Gegenion).
  Polykondensation/Polyaddition beginnen mit dem zweiten Molekül unter dem ersten (hochkant groß genug); passen die Gruppen nicht, bleibt Abstand, ✗ über der Lücke.
  Ringe ganz farbig hinterlegt (kein helles Sechseck innen), Benzolring überall mit drei Zweifachbindungen. Ziegler-Natta „+ H₂“: die fertige Kette
  gleitet sichtbar weg („PP abgelöst“). Nach Rekombination zeigt die Kügelchen-Leiste beide Ketten (Starter-Rest an beiden Enden).
  Während eines Ablaufs bleibt alles bedienbar: eine neue Aktion beendet den laufenden Ablauf. Nach einem Fehlschlag ein Vorschlag (passendes Verfahren aus
  `methodsFor`, bzw. „Partner …“ beim Stufenwachstum), „Von vorn“ dann als Zeichen. „+ Zweierkette“ immer beschriftet. Ansatz-Chips zweizeilig statt abgeschnitten.
  Bedienung: eine Zeile Aktionen (Start, Monomer als Kügelchen „+ S“, „Abbruch …“ öffnet die Auswahl der Abbruchart), Zurück (spielt die Aktionen ohne Animation
  nach, `replay`), Automatisch (`nextAuto`), am Ende „Produkt“ und „Von vorn“. Statuszeile nur kurze Kennzeichen (Schritt, n, „+ 2 H₂O“, Temperatur, lebend);
  die Begründung eines Fehlschlags steht hinter „ⓘ“ (Blatt). Unter dem Bild die Kette als Kügelchen; Antippen zeigt das Monomer (Strukturformel und Baustein).
  Keine Fragen (Regel „Experimentieren stellt nie Fragen“): Eine Aktion antippen spielt den Schritt sofort ab; Vorhersagen gibt es nur in Lernen.
  Ausschnitt: kleine Anhängsel an Fokus-Atomen (–OH, –Cl, Benzolring, höchstens 7 Atome; `expandFocus`) gehören immer ganz ins Bild; was trotzdem
  über den Rand ragt, blendet `MechSvg` aus und endet an einer **Wellenlinie** (halbe Bindung + Welle) – nie ein Atom mitten im Zeichen abgeschnitten. Ringe am Rand verschwinden ganz (samt –OH/–H), nie ein halber Ring.
  Elektronen-Punkte nur am aktiven Ende (Test: nach jeder Aktion 1 Punkt beim Radikal, 2 beim Anion, sonst keiner); beim Zerfall des Starters gleitet das
  zweite Radikal beschriftet („2. Radikal“) zur Seite, die zwei Elektronen am CO₂ werden zur zweiten C=O-Bindung. Rekombination/Disproportionierung:
  die zweite Kette steht um 30° gedreht, damit ihre Gruppen nicht auf denen des ersten Kettenendes liegen.
  Kamera (`MechStage`): ein Ablauf beginnt im Ausschnitt seines ersten Bilds und fährt während des ersten Schritts zum ruhigen Ausschnitt des Rests; Ende,
  Zurück und andere Ansätze werden weich angefahren (550 ms), andere Bühnengröße ohne Fahrt. Stufenwachstum: Ausschnitt = Kettenende + Platz für das nächste
  Molekül (`span`, 7,8 Bindungslängen), am Anfang beide Ausgangsstoffe ganz. **Handy:** Atomzeichen mindestens 14 px – wäre der ganze Inhalt kleiner, zeigt
  ein Fenster dieser Größe die Reaktionsstelle (`frameFor`; Atome an Pfeilen samt ganzem Ring, Elektronen- und Punkt-Anker als nächstes Atom; ohne Pfeile geladene,
  hervorgehobene Atome, freie Stelle, Elektronen im Fokus; das Ruhebild danach behält die letzte Reaktionsstelle, auch nach Abbruch oder Ast), der Rest endet an
  Wellenlinien – die nur, wo ein Atom wirklich weggeschnitten ist; längere Beschriftungen („TiCl₃-Oberfläche“), die nicht ganz ins Bild passen, entfallen. H am Handy
  so groß wie die übrigen Zeichen (22 statt 17 Einheiten). Gemessen nach jeder Aktion (Automatisch-Folge, 14 Ansätze, 360 × 740 und 375 × 667): 14,2–19 px mit H;
  **Ausnahme:** der Überblick der Ausgangsstoffe vor dem ersten Schritt zeigt beide Moleküle ganz – 11–14 px (Bisphenol-A-diglycidylether bei 375 px ≈ 9 px).
  Kein fester Rand oben mehr: der Umschalter Atome | Kügelchen liegt über der Bühne, `corner` hält seine Ecke nur frei, wenn dort ein Atom (samt freien Paaren und
  Ladung) oder eine Beschriftung läge (erst den Inhalt nach unten rücken, sonst Fläche darunter).
  Pfeilspitzen enden außen am Atom, nie auf dem Zeichen (π-Paar N=C → N bei Urethan/Harnstoff, O–H → O beim Methanol-Abbruch, Ti–C → neue Bindung bei Ziegler-Natta
  oberhalb, die H des ersten Ketten-C zeigen im Übergang nach unten); AIBN: je C–N-Bindung ein Halbpfeil zum C, einer in die entstehende N≡N-Bindung; der erste Pfeil
  Radikal/Anion → Monomer zielt auf die Mitte der jetzigen Lage (kein Stummel); Ziegler-Natta-Butadien: „vereinfacht“ hinter ⓘ (in Wirklichkeit π-Allyl).
- **Kügelchen-Ansicht** (`chem/reactor.ts` rein rechnerisch, `components/Reactor.tsx` Canvas): Becherglas mit vielen Molekülen (Kügelchen 6–9 px, Anzahl nach
  Fläche), gedämpfte Zufallsbewegung, Federn zwischen gebundenen Kügelchen, leichte Streckung der Ketten, Abstoßung. Reaktionen bei Berührung mit Wahrscheinlichkeit:
  Kettenwachstum nur an aktiven Enden (gestrichelter Ring: Radikal rot, Anion blau, Kation dunkelrot) – wenige lange Ketten, freies Monomer bleibt bis zum Schluss;
  Starter zerfällt beim Erwärmen nach und nach (Gasbläschen CO₂/N₂ steigen auf); Abbruch zweier gewachsener Radikale (Styrol meist Rekombination, MMA meist
  Disproportionierung); anionisch starten alle Ketten gleichzeitig und leben, ein zweites Monomer wächst als Block weiter – nur, wenn das Kettenende es starten
  kann (sonst bleibt es frei, Begründung hinter „ⓘ“); Acrylnitril-Ketten enden nach und nach (nicht lebend); Methanol beendet; kationisch wandert
  H⁺ weiter und startet neue Ketten; Ziegler-Natta: Ti-Kügelchen, Einbau zwischen Titan und Kette, „+ H₂“ löst die Ketten, polare Monomere vergiften (✗).
  Nacheinander ohne lebende Ketten: mit dem zweiten Monomer sind die alten Ketten beendet (radikalisch abgebrochen, kationisch H⁺ abgegeben – es startet neue
  Ketten, Ziegler-Natta abgelöst), neue Ketten starten (der Starter zerfällt über Stunden: noch mindestens drei Starter-Kügelchen) und bauen das zweite und übriges
  erstes Monomer ein – nie an die alten Ketten. Ziegler-Natta mit giftigem Monomer im Gefäß beim Aktivieren bzw. als erstem Zusatz: jedes Titan sofort vergiftet.
  Anionisch gleichzeitig: solange das schnellere Monomer frei ist, lagert sich das andere kaum (MMA vor Styrol: gar nicht) an. Kennzeichen „lebend“ nur bei lebenden Enden.
  Stufenwachstum: jede passende Gruppe zweier Moleküle reagiert, Nebenprodukt steigt als Bläschen auf (Bläschen schieben nichts an), Netz nur, wenn
  `stepReact` eines ergibt (AB-Monomer + Glycerin: verzweigt, kein Netz) und das größte Molekül ≥ 40 % der Bausteine hat. Reaktionspartner in der Nähe driften leicht aufeinander zu (sonst dauert es auf dem Bildschirm zu lange).
  Stufenwachstum langsam genug zum Zusehen (50 % nach etwa 10 s), mittlere Länge folgt 1/(1 − Umsatz); ab 80 % erklärt „ⓘ“, warum lange Ketten fast
  vollständigen Umsatz brauchen (Nebenprodukt entfernen, Vakuum). Methanol fällt sichtbar hinein („Methanol zugegeben“), nur einmal. Legende („?“):
  Baustein, Starter, aktives Ende, Bläschen. Ein neuer Ansatz setzt den Reaktor zurück (Kennzeichen „neuer Ansatz – von vorn“).
  Anzeige: Umsatz als schwarzer Balken, Ketten bzw. Moleküle, „Ø … Bausteine“ und „längste …“; Kennzeichen (Vorgang, lebend, vernetzt, vergiftet, + H₂O – bei zwei
  Nebenprodukten beide gezählt, „+ 23 H₂O + 29 HCl“ –, abgelöst),
  Begründung hinter „ⓘ“. Antippen hebt das ganze Molekül hervor und zeigt das Monomer (Starter, Katalysator, Bläschen: kurze Info), Ziehen bewegt ein Kügelchen
  samt Kette. Akku: höchstens 30 Bilder/s, Stillstand bei Ruhe (6 s ohne Reaktion bzw. 3 s, wenn nichts mehr möglich ist), Pause-Knopf, unsichtbare Seite pausiert;
  Bewegung reduziert: Ablauf ohne Zwischenbilder vorausgerechnet. Der Reaktor bleibt beim Wechsel der Ansicht erhalten.
- **Lernen** (`quiz/tasks.ts`, `lessons.tsx`, `quiz/explain.tsx`, `quiz/visual.tsx`, Katalog `quiz/misconceptions.ts`): sechs Kapitel – Monomere und Polymere;
  radikalische Polymerisation; Katalysatoren und Verfahren (Ziegler-Natta, kationisch mit BF₃ und Wasser am Beispiel Isobuten – „positive Ladung“
  eingeführt –, anionisch); Polykondensation; Polyaddition; Struktur und Eigenschaften (Thermoplast/Elastomer/Duroplast,
  Copolymere, Ketten- vs. Stufenwachstum; Recycling-Codes stehen nur auf den Produktkarten – die Aufgabe `recycling` bleibt in `LATER`, bis eine Lektion sie einführt).
  In den Lektionen steht die richtige Auswahl an wechselnden Plätzen (Zahlen aufsteigend; Test: höchstens 40 % an Platz 1, ohne vorgemachte Schritte). Lektionen spielen die Abläufe der Atom-Ansicht ab („Nochmal“), ein Schritt lässt das Radikal-Atom
  antippen; Bilder vorher/nachher am Handy untereinander. Aufgaben alle als Auswahl mit Bild (`Vis` als reine Daten: Monomer, gesättigtes Gegenstück (nur Ethan, Propan,
  Chlorethan … – Styrol hat keins, Ethylbenzol trägt im Benzolring noch C=C), Baustein mit/ohne C=C, Kettenausschnitt iso-/syndio-/ataktisch,
  Mechanismus-Standbild mit Pfeilen (`bare`: ohne Beschriftung des Nebenprodukts, wo sie die Antwort wäre – `nebenprodukt` zeigt das Wasser unbeschriftet), Kügelchen, zwei Monomere, Kettenbild, Gefäß mit Kügelchen:
  nur Monomer / wenige lange Ketten (als Schleife gelegt) + viel Monomer / drei mittellange Ketten, kaum Monomer – Stufenwachstum bei 90 % Umsatz, denn bei 50 % ist noch die Hälfte
  der Moleküle Monomer (mittlere Länge = 1/(1 − Umsatz)) / ein Riesenmolekül; **Umsatz** in der Lektion K6 eingeführt), teils mit Bild-Antworten (Ketten- vs. Stufenwachstum als vier Gefäße);
  jede falsche Antwort steht für eine Fehlvorstellung und hat eine Rückmeldung (Test: alle). Begründungen beginnen nicht mit dem Begriff der Antwort,
  wenn er schon fett davorsteht (`boldLead`, Test: kein Wort doppelt). Keine Aufgabe zweimal in einem Kapitel, auch nicht mit anders gemischten Antworten
  (`ordered`; das gelöste Beispiel im Quiz-Paket vergleicht ebenso ohne Reihenfolge). **Regel nach ✓** hängt an der Aufgabe (`withRule` beim Erzeugen, in jeder Runde gleich):
  allgemeine Regel des Schritts (`GENERAL_RULE`), sonst die Erklärung der Variante; Antippen/Ordnen/Bauen eine kurze Zeile (`SHORT_RULE` → `rule`). Merksatz vor der Aufgabe
  und Tipp nennen den Blickpunkt, nie die Regel oder die Antwort (Tests: Schlüsselwörter je Typ im Merksatz, Wörter der Antwort im Tipp). Kapitelfolge: jede Fertigkeit
  höchstens 2×, Abstand ≥ 3; die Regelzeile einer Aufgabe enthält nicht die Antwort der nächsten (Tests). Bild-Antworten: Strukturformeln im eigenen Seitenverhältnis,
  Kennbuchstabe klein in der Ecke. Aufgabenbilder tragen, solange die Aufgabe offen ist, eine Mindesthöhe (`data-min-h` über `PicBox`: 64 px, Kügelchen-Bilder 44 px) –
  drückte ein Tipp bzw. der erste Schritt das Bild darunter, steht er im Blatt. Nach der Antwort entfällt der Merksatz (Platz fürs Bild), und ein Bild mit Atomzeichen, das niedriger als 110 px würde (Schrift unter etwa 10 px), entfällt ganz – nie ein unlesbarer Rest; Formeln unter Bild-Antworten
  ohne Umbruch an –, = und ( (Wortverbinder). „Mehr Starter“ zeigt zwei Gefäße vorher (wenig/viel Starter). Lektionen: Vergleichsbilder (`Two vs`) ohne Pfeil,
  mit Trennlinie und Überschrift über jedem Bild; Pfeil nur bei vorher → nachher. Antippen in der Lektion mit unsichtbaren Trefferkreisen je Atom.
  **Antippen im Bild** (`kind: "tap"`, `quiz/tap.ts`, `TapAnswer` in `quiz/QuizView.tsx`): Szene = Standbild der Atom-Ansicht (Ansatz, Aktionen, Bild des Ablaufs,
  wahlweise ohne Pfeile) oder Kettenausschnitt; `parts` = antippbare Atome (stabile Kennungen), `answer` = richtige Atome, Fallen je falschem Teil
  (`pick` bzw. bei mehreren `wrong`, dazu `n`, `adj`); mehrere Atome: antippen schaltet um, „Prüfen“; Lösung danach gestrichelt grün mit ✓, falsch gewählte
  mit ✗; vorher sind alle antippbaren Teile dünn gepunktet umrandet, daneben getippt → kurzer Hinweis, bei mehreren „x von n gewählt“;
  Trefferkreise mindestens 44 px (Bildmaßstab gemessen); Atomschrift ≥ 14 px vor und ≥ 12 px nach der Antwort
  (375 × 667, 360 × 740): enger Ausschnitt (`zoomTo` bzw. Teile nahe der reagierenden Stelle), knappe Rückmeldung (Grund + Lösung, Merksatz ausgeblendet), Erklärung im
  Blatt „Lösung“ über `feedbackExtra`; `zoom` (K4, K5): nur Teile nahe der reagierenden Stelle (`nearParts`), Ausschnitt um sie im Seitenverhältnis
  des Bildplatzes, antippbare Atome bleiben sichtbar, auch wenn ihr Nachbar am Rand ausgeblendet wird; `giftTap` zeigt das Monomer in Standardlage neben dem Titan (noch nicht gedreht); Lösung nach Fehlern in Worten (`sol`), nie als Nummer; unsichtbare Knöpfe für Tastatur und Vorlesen; im gelösten Beispiel zeigt das Bild die markierte Lösung. Aufgaben: K1 `bausteinTap` (zwei benachbarte
  C eines Bausteins, ohne farbige Hinterlegung), K2 `radikalTap` (C mit dem Radikal nach dem Anlagern), K3 `freieStelleTap` (auch das Kettenende –C₂H₅ antippbar, mit Rückmeldung), `giftTap` (Cl/O/N am Titan),
  K4 `wasserTap` (drei Atome des Wassers; bei Amin gilt jedes der beiden H am N (`same`); beide gewählt: eigene Rückmeldung „N gibt nur ein H“, `dup`), `schnitt` (Bindung antippen, die neu entstanden ist: C–O bzw. C–N zwischen zwei Bausteinen; Bindungen als Teile „a|b“,
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
  nicht einbaubares Molekül) → `pat`, `maj`; Kürzel gesättigter Moleküle in Großbuchstaben (EA, PA, CE – keine Elementsymbole); erster unpassender Platz gestrichelt mit ✗. K1 `bauenHomo`
  (Monomer + gesättigtes Gegenstück im Vorrat), K6 `bauenCopo` (Block, alternierend, statistisch).
  „C‑Atom“ usw. mit geschütztem Bindestrich (U+2011, nie „C-⏎Atom“). Antworttexte kurz (einzeilig auf 375 px). Alltagsfragen nennen Gegenstände, die eindeutig zu einem
  Kunststoff gehören (Plastiktüte → PE, Stoßstange → PP, Fensterrahmen → PVC; nicht „Rohre“, die es aus PE und PVC gibt).
- Tests: `chem.test.ts` (Daten, Verträglichkeit, Produkte, alle über 1000 Ansätze der Atom-Ansicht automatisch durchgespielt und per Zurück nachgestellt,
  Reaktor-Ergebnisse: Kettenwachstum mit Restmonomer, lebende Ketten, Vergiftung, PET-Umsatz, Netz, Kettenstopper; AB-Monomer + Partner für alle Paare nie Netz,
  nie „abwechselnd“, Verknüpfen gelingt immer, wenn die Karte eine Kette meldet; Glycerin mit Disäure/Säurechlorid Netz, mit AB-Monomer Stern ohne Netz; Produktbild = eingebautes Monomer; anionische Reihenfolge in Regeln, Atom-Ansicht und Reaktor; nacheinander ohne lebende Ketten getrennte Ketten, im Reaktor neue Ketten aus dem zweiten Monomer; Kautschuk-Arten; Phenoplast-Brücken
  nur ortho/para; Ziegler-Natta-Butadien drei Pfeile, Elektronen paarweise; kationisch kein Allen; Ester/Amid drei Schritte mit Pfeilen, Ladung ausgeglichen),
  Karte ⇔ Atom-Ansicht ⇔ Reaktor bei einem Monomer ohne Ketten, Gradient Styrol + Butadien, zwei Nebenprodukte im Reaktor, Formalladung in allen Bildern,
  Pfeil-Lage; nacheinander mit kurzkettigem Monomer, radikalisch stark ungleich bzw. ETFE alternierend, Isobuten + wenig Dien), `quiz/*.test.ts` (Gültigkeit, Katalog, einfache Sprache, Englisch; Tipp in allen Modi zugeschnitten und ohne Lösungswendungen, kein Ethylbenzol,
  Rückmeldungen `wasserTap`/`freieStelleTap`, Nebenprodukt-Bild unbeschriftet, Tipps ohne vorweggenommene Antwort), `guide*.test.ts` (Lektionen auf Deutsch und
  Englisch, Platz der richtigen Auswahl).

## Einheiten (`modules/einheiten`)
- Ein Verfahren für alles: ① Umrechnungszahl (`relation`: Kette über Nachbareinheiten, Flächen/Volumen als Produkt, zusammengesetzte Einheiten durch Einsetzen, Definitionen wie 1 l = 1 dm³, 1 J = 1 W·s) → ② Einsetzen und ausrechnen in einer Zeile (a · F, bei F < 1 zusätzlich a : 1/F, = Ergebnis). Logik in `packages/units` (`solve`).
  Der Rechenweg ist immer exakt: endet F nicht, wird nur durch den Kehrwert geteilt (`divisor`: 0,072 km/h = 0,072 : 0,036 cm/s) – im Quiztext, auf der Tafel und im Bild gleich;
  F selbst steht dann als „1/0,036“ (`Num`/`numText`: „1/x“, wenn der Kehrwert endet, auch über 1), nie gerundet und nie „= ≈“ (Test über alle Aufgaben).
  Definitionen genau: 1 PS = 735,498 75 W (75 kp · m/s), nicht 735,5 W.
- Rechnen nur mit exakten Brüchen (`Q`, BigInt); Anzeige deutsch (Komma, 10 000, 0,000 01), nicht endende Zahlen als 1/60, 1/3,6 bzw. „≈“.
  Schülereingaben (`parseAnswer`, Quiz und Umrechnen): Einheit dahinter erlaubt („0,06 m“), Trennzeichen nach der Sprache – Deutsch „,“ Dezimalkomma, „.“ Tausenderpunkt
  (`1.000` = 1000, nie 1), Englisch umgekehrt (`1,000` = 1000, `1.5` = 1,5); mehrdeutige Eingaben nur so gelesen (sonst zählte „1.000 statt 1“ als richtig), eindeutige andere
  Schreibweisen (0.5, 1.250,5) gehen weiter. Die Quiz-Antwort wird als exakter Bruch gespeichert (`storedValue`: n, d) und so angezeigt, wie sie gelesen wurde (`storedText`, auch alte Stände gruppiert: 10 000; Tests DE/EN).
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
  (Umrechnungszahl mit einer Null zu viel bzw. wie bei Längen), jede falsche Antwort mit Rückmeldung; „Mal oder geteilt?“ zeigt bei falscher Zahl die Kette über die Nachbareinheiten. Nicht endende Zahlen als Bruch (1/60, 1/3,6).
  Umrechnungszahl-Aufgaben mit diagnostischen Distraktoren (`dis`: Gegenrichtung, „wie bei Längen“, bei Flächen/Volumen eine Stufe zu viel/zu wenig; bei Längen, Massen und Hohlmaßen
  „eine Null zu viel/zu wenig“ mit der Kette über die Nachbareinheiten – dort sind die Stufen verschieden groß: km → m · 1000, kg → dag · 100, hl → l · 100; Test). Die Erklärung zeigt
  die Kette über die Nachbareinheiten (1 kg = 100 dag = 1000 g), bei einer Stufe den Schritt – nie nur das Ergebnis noch einmal.
  Eingabe-Aufgaben mit Fallen (`inputTraps`, Katalog `misconceptions.ts`): Gegenrichtung, Komma eine Stelle zu weit (Faktor 10), bei Fläche/Volumen mit der Längen-Umrechnungszahl
  gerechnet – gezielte Rückmeldung und Stolperstein (Test). Wortwahl wie in der Erklärung: „Schritt“ (jeder Schritt · 10 · 10), nie „Stufe“ (Test).
  Größenvorstellung: der Tipp nennt nur Vergleiche, die in keiner Frage vorkommen (Fingernagel, Tischplatte, Quadrat bzw. Würfel mit Kantenlänge; nicht Würfelzucker, Klassenzimmer,
  „1 dm³ = 1 Liter“ bei der Milchpackung; Test); jede falsche Einheit mit Rückmeldung („60 cm² wäre viel zu klein: 1 cm² ist ein Quadrat mit 1 cm Seite“). Ohne „schönes“ Ergebnis (PS ↔ kW) wird auf 2 Dezimalstellen gerundet,
  auch endende Zahlen, mit fester Stellenzahl (`approxText`: ≈ 6,80, nicht ≈ 6,8); die Erklärung schreibt dann „a · F ≈ x“ (nie „= ≈“).
  Jede falsche Antwort jedes Aufgabentyps hat eine Rückmeldung (auch „Mal oder geteilt?“ mit falscher Richtung und Zahl, Umrechnungszahlen zusammengesetzt; Test).
- Quiz-Hilfsmittel passend zur Aufgabe, ohne Ergebnis (nicht bei Fragen nach der Umrechnungszahl): Pfeile (bzw. `DimChain`), Skala (wenn `prefixStep`), Stellen (Stellenwerttafel), sonst Einsetzen.
  `DimChain` (Volumen) nur, wenn eine Einheit ein Längen³-Maß ist (`dimOf`); Hohlmaße untereinander (l ↔ ml) bleiben auf der Kette hl → l → dl → cl → ml (Test).
  Eingabe-Aufgaben zeigen als Bild die Aufgabe groß mit Einheitennamen (`TaskBanner`, Quadrat/Würfel bei Fläche/Volumen) – Zahl und Einheit umbrechen, Namen trennen statt das Bild zu
  verkleinern (14 px), bei sehr niedrigem Bild ohne Namen.
  Vorsilben-Skala (`PowerScale`) immer ≥ 14 px: passen nicht alle elf Spalten nebeneinander, nur der Weg mit je einem Nachbarn (Erklärung, Erklärkarten, Umrechnen);
  im Hilfsmittel „Skala“ (`full`, Blatt) alle Vorsilben – am Handy senkrecht (oben Giga, unten Nano, Bogen rechts), ebenso, wenn auch der Weg nebeneinander nicht passt.
- Erklärung Level I (17 Schritte): **Längen** · **Masse und Hohlmaße** · **Fläche und Volumen** · **Zeit** (`known`: „gleich lang“). Level II (14 Schritte):
  **Vorsilben** · **Flächen und Volumen** · **Zeit und zusammengesetzte Einheiten**. Halb gelöste Schritte zeigen das passende Bild ohne die gesuchte Zahl
  („1 m² = ? dm²“: Quadrat 1 m aus dm², „1 m³ = ? dm³“: Würfel; `AreaGrid`/`Cube` mit `guess`, Raster und Anzahl erst nach der richtigen Antwort; das kleine Kästchen bzw. der kleine
  Würfel trägt seine Beschriftung über eine Hinweislinie, nie ein Pfeil ins Leere). Schrift in allen Bildern ≥ 14 px am Handy (SVG-Schrift 16–18 Einheiten, Lineal und Messbecher
  beschriften nur jeden zweiten Strich, wo die Zahlen sonst aneinanderstießen; Pfeilkette, `DimChain`, Stellenwerttafel, Einsetz-Kette 14 px);
  der Merksatz (`say`) eines halb gelösten oder freien Schritts nennt die gesuchte Zahl nicht (Test `guide.test.ts`). Auswahl-Schritte: die richtige Antwort steht an wechselnden
  Plätzen (die Erklärung mischt nicht; je Stufe höchstens 40 % an Platz 1, Zahlen und Einheiten aufsteigend; Test).

## Prüfen vor dem Commit
`npm run typecheck && npm test && npm run build`
Oberfläche: `npm run site`, dann `node scripts/check-ui.mjs site` (Übersicht und alle Module; zusätzlich `VP="360x740,412x915,1024x768"`, `LESBAR=1` und `LOCALE=en-GB`).
Ionenbindung zusätzlich mit `KAPITEL=1` (spielt in beiden Stufen jede Folie jedes Kapitels unter „Lernen“: vor und nach dem Lösen, Modell-Folien über „Prüfen“ bis zur
markierten Lösung, einmal je Kapitel PSE, Tipp und Erklärung; meldet Folien ohne „Weiter“). Gemische zusätzlich mit `LEARN="gm-k1,gm-k2,gm-k3,gm-k4,gm-k5,gm-k6"`, Polymere mit `LEARN="pm-k1,…,pm-k6,us:pm-k1,…,us:pm-k6"` (spielt alle Kapitel unter „Üben“, prüft jede Aufgabe vor und nach der Antwort, `data-min-h`;
tippt weitere Antworten bzw. Teile im Bild an, bis „Weiter“ erscheint, und meldet ein Kapitel mit weniger als zehn geprüften Aufgaben).
check-ui meldet außerdem: sich überdeckende Tippziele, abgeschnittene oder herausragende Knopf-Beschriftungen (gewollte Auslassungspunkte ausgenommen), Wörter in
Antwortknöpfen über zwei Zeilen (weicher Trennstrich und Nullbreite-Leerzeichen sind Trennstellen), abgeschnittene Aufgabenbilder; vor jeder Antwort drückt es „Tipp“ bzw.
„Schritt 1“ und prüft, dass Tipp bzw. erster Schritt ganz zu lesen sind und das Bild daneben ≥ 56 px hoch bleibt und der Bildrahmen nicht unter max(56 px, 60 %
seiner Höhe vor „Tipp“) schrumpft; es öffnet die Blätter im Menü (Landkarte, Schularbeit) und prüft im LEARN-Lauf die Auswertung samt ihren Blättern;
es schließt offene Blätter und die Erklärung selbst und gibt Chromium eine lokale Prüfstimme, damit „Vorlesen“ wie auf Geräten in der Leiste steht.
In dieser Umgebung: Chromium liegt unter `/opt/pw-browsers/chromium` (`CHROMIUM=/opt/pw-browsers/chromium`), Playwright global (`PLAYWRIGHT=…/playwright/index.mjs`); nie `playwright install`.
Zusätzlich gezielt prüfen, was geändert wurde: Ansicht öffnen (`#/<modul>`), Level umschalten, Aufgabe richtig **und** falsch lösen, Blätter öffnen, Animationen bis zum Ende
laufen lassen; je Zustand messen (Seite, `.ui-wb`, `.ui-wb-stage`, Aufgabenkarte, Blatt: `scrollHeight/scrollWidth` ≤ `clientHeight/clientWidth`, Bild nicht winzig) und Screenshots ansehen.
Nach dem Push: Läufe der Workflows für den neuen Commit abwarten (beide „success“), erst dann „veröffentlicht“ melden.

## Änderungsverlauf
Neueste Einträge oben. Format: **Bereich** – was geändert wurde und warum (Commit). Ältere Einträge sind zu Abschnitten zusammengefasst.

- **Polymere: Ziegler-Natta ohne „polare Monomere“** – nach der Umstellung auf Allred-Rochow ist C–Cl (ΔEN 0,33) nicht polar, Vinylchlorid wäre nach der Regel nur schwach
  polar. Die Vergiftung des Katalysators wird deshalb überall über die Ursache begründet: „Monomere mit O, N, Cl oder F binden mit einem freien Elektronenpaar an das Titan“
  (Lektion, Merkkarte, Stolpersteine DE/EN).
- **Elektronegativität nach Allred-Rochow, polar ab ΔEN 0,5** (`@lern/chem`, Elektronenpaarbindung, Atombau) – Wunsch der Lehrkraft (Schulbuch). Alle Werte, Tabellen,
  Trends und Rechnungen nach Allred-Rochow statt Pauling. Folgen: C–Cl, C–Br und N=O gelten als nicht polar (CH₃Cl, CH₂Cl₂, CHCl₃ schwach polar), Teilladungen bei P–H, C–I,
  C–S umgekehrt, HI unpolar. Quiz Polarität ohne Chlormethan (gemessen deutlich polar – wäre irreführend), dafür Methanal und Blausäure; Erklärung mit CF₄ statt CCl₄.
  Edelgase, einige Lanthanoide und die 7. Periode ohne belegten Wert („keine Daten“). Tests.
- **Nichts wandert – alle Apps** (`@lern/ui`, `@lern/quiz`, Atombau, Gemische, Elektronenpaarbindung, Nomenklatur, Polymere, Reaktionsgleichungen, Einheiten,
  `scripts/check-ui.mjs`) – Wunsch der Lehrkraft. Gefunden und behoben: Bild der Erklärung schrumpfte und rückte je Schritt (20–100 px), Hilfsmittel unter der Quiz-Aufgabe
  rückten nach der Antwort (bis 114 px), Statuszeilen in Atombau, Gemische, Elektronenpaarbindung, Reaktionsgleichungen ließen die Bühne springen (16–38 px), Nomenklatur-Name
  (52 px), Polymere-Chips und Werkzeugleiste, Atombau-Steckbrief (Bohrmodell ±17 px). Platz für die größte Fassung reserviert; „Weiter“ steht bei Platzmangel über statt unter
  den Hilfsmitteln. Neue Wanderungs-Prüfung in check-ui bei jeder Bedienung. Nebenbei: Reaktionsgleichungen „Üben“ – bei 360 px liefen drei Knöpfe über den Rand.
- **Ionenbindung: Atome stehen still, Elektronen gleich, Schalen ausgeschrieben** (Ionenbindung, Atombau, `@lern/chem`, `@lern/ui`) – Wünsche der Lehrkraft: Das Atom
  rückte beim Wechsel Mg → Mg⁺ bis 150 px (Beschriftung änderte die Breite); jetzt Bild in fester Zelle, reservierter Platz für Beschriftung, Name, Rechnung und Rückmeldung
  (alle 125 Folien gemessen: 0 px). Aufgenommene Elektronen ohne Ring, keine hellblaue Hinterlegung. Schalenbesetzung überall als „1. Schale: 2 Elektronen“ statt „2 · 8 · 1“
  (auch Atombau-Erklärung, Quiz, Steckbriefe; Steckbrief „11 p⁺, 12 n, 11 e⁻“). Tests gegen die alte Schreibweise.
- **Atombau: Lanthanoide und Actinoide im großen PSE** (`@lern/chem`, `@lern/chem-ui`, Atombau) – Wunsch der Lehrkraft. Elementdaten bis Oganesson, das große PSE (Level II,
  Tab „Periodensystem“) zeigt die 7. Periode und die Zeilen Lanthanoide/Actinoide, am Desktop und am Handy. Kleines PSE, PSE-Hilfe und Ionenbindung bleiben unverändert.
  Für Z > 86 nur gesicherte Daten (keine Konfiguration); Trend ohne Messwert jetzt als „keine Daten“ statt in der Farbe des kleinsten Werts (auch He, Ne, Ar bei EN). Tests.
- **Sprachknopf EN vor DE; Regel „Nichts wandert“** (`@lern/ui` `LangButton`, alle Module und Übersicht) – der Sprachknopf zeigt „EN DE“ (international), die Sprache kommt
  beim ersten Start weiter automatisch aus der Gerätesprache. Neue Gestaltungsregel: Bilder, Modelle und Karten bleiben beim Bedienen an ihrem Platz (Wunsch der Lehrkraft).
- **Ionenbindung Kapitel 3: NaCl-Gitter in 3D** (`k3/lattice3d.tsx`) – die schräge Zeichnung wirkte flach (Cl⁻ davor/dahinter verwirrend). Jetzt echte Perspektive mit
  schattierten Kugeln und richtiger Tiefenordnung, mit dem Finger drehbar, Umschalter „Nachbarn“ (Na⁺ mit 6 Cl⁻) / „Gitterausschnitt“ (27 Ionen); Test.
- **Ionenbindung Kapitel 3: Hart und spröde, Schmelze, Strom** – Wunsch nach Ansicht am Handy: (1) Salzkristall zerbricht jetzt als Ablauf Makro → Lupe → Teilchen → Makro
  (`k3/brittle.tsx` ersetzt `ShiftLayers`): Hammer, Lupe auf die Spaltebene, Schichten gleiten, gleiche Ladungen gegenüber stoßen sich ab, der Kristall bricht in glatte
  Stücke, die auseinanderfliegen; Test. (2) In der Schmelze wechseln die Ionen etwa doppelt so oft die Plätze (stärkere, länger gerichtete Wärmebewegung statt mehr Zeitraffer,
  der nur mehr Zittern brachte). (3) In der Lupe wandern die Ionen bei Strom doppelt so schnell und gehen nur noch halb so stark auf und ab. Tests `k3/sim.test.ts`.
- **Ionenbindung Kapitel 5 „Nebengruppenmetalle“ neu ohne Elektronenkonfiguration** – Wunsch: Schüler sollen nicht auswendig lernen, welche Nebengruppenmetalle nur
  eine Ladung haben, und keine d-Elektronenkonfigurationen brauchen. Kästchenschema, 4s/3d, Silber und Zink entfallen. Neu: Einstieg über zwei Stoffe aus denselben
  Elementen (FeO/Fe₂O₃, Cu₂O/CuO als Stoffproben in echter Farbe) → die Ladung muss in den Namen; Brücke Gruppe 1–18 ↔ Hauptgruppen aus Kapitel 1; Regel: I.–III. Hauptgruppe
  Ladung aus der Hauptgruppe, alle anderen Metalle (auch Blei: PbO/PbO₂) römische Zahl; Ladung immer aus Namen oder Formel ableitbar. Nach unabhängiger Prüfung: keine
  Existenzaussagen („Cu³⁺ gibt es nicht“ wäre Auswendigwissen und stimmt fachlich nicht), PSE neutral gefärbt mit großen Knöpfen, ✓ und Name erst nach dem Lösen, freie
  Folien verlangen die Anzahlen der Formel; CuS nicht mehr als Beispiel (formal Cu⁺/S₂²⁻). Test.
- **Kopfzeile: Home-Knopf, „Lesbar“ nicht am Handy** (`@lern/ui` `AppShell`, alle Module) – oben links steht in jedem Modul ein Home-Knopf (Haus, zur Übersicht) statt des
  Modul-Symbols, damit klar ist, wie man zurückkommt. Der Knopf „Lesbar“ ist am Handy (≤ 640 px) ausgeblendet (Wunsch, Platz); eingeschaltet bleibt er sichtbar, damit man ihn ausschalten kann.
- **Ionenbindung Kapitel 3: Schmelze bewegt sich heißer schneller** – über der Schmelztemperatur läuft die Bewegung der Ionen mit der Temperatur schneller (je 200 °C
  einmal so schnell, Natriumchlorid bei 1000 °C doppelt, höchstens 2,5-mal); darunter unverändert. Umgesetzt als Zeitraffer der Simulation (`speed`), Test: doppeltes Tempo =
  dieselbe Bewegung in der halben Zeit.
- **Ionenbindung Kapitel 3: Ionen wandern bei Spannung schneller** – in Schmelze und Lösung wandern die Ionen bei geschlossenem Schalter 70 % schneller zu ihrem Pol
  (Faktor 1,7 auf die Wanderung, Wärmebewegung unverändert), damit die Wanderung neben der ungeordneten Bewegung klar zu sehen ist.
- **Ionenbindung Kapitel 3: Schmelzen und Strom leiten als Teilchensimulation** (`k3/sim.ts` statt CSS-Animation) – vorher froren die Ionen beim Schmelzen in eine zweite
  feste Anordnung ein und verließen ihre Plätze nicht sichtbar; beim Leiten glitten sie in Schleifen ein Stück zum Pol und wurden mitten im Bild ein- und ausgeblendet. Jetzt:
  Tiegel mit Schwingen → Verlassen der Plätze → ständige ungeordnete Bewegung, Rückkehr ins Gitter beim Abkühlen; Leitfähigkeit mit Lupe (Ausschnitt), in der die Ionen langsam
  zu ihrem Pol wandern und gemischt bleiben; Beschriftungen der Lupe größer. Texte und Merksätze angepasst; Test `k3/sim.test.ts`.
- **Bohrmodell: feste Schalen überall** (chem-ui, Atombau, Ionenbindung) – Schalen füllten bisher immer den ganzen Rahmen: mehr Schalen machten alle Schalen kleiner,
  ein größerer Kern schob sie nach außen, und in Ionenbindung Kapitel 1 rückte die Außenschale beim Anion nach außen. Das verwirrte didaktisch. Jetzt hat jede Schale einen
  festen Radius (`shellRadius`); der Rahmen bietet je Ansicht Platz für eine feste Zahl von Schalen (`slots`). Das Atom wächst bzw. schrumpft nur, wenn eine Schale dazukommt
  bzw. wegfällt. Kapitel 1: Texte, Rückmeldungen und Merksätze ohne „Anion größer/weiter außen“; ehrlicher Hinweis, dass das Schalenmodell keine echten Ionengrößen zeigt.
  Tests `bohr.test.ts`, `k1.test.ts`.
- **Reaktionsgleichungen: Gleichungszeile springt nicht mehr** – auf dem iPhone (Safari) wechselte die Gleichung im Experimentieren (z. B. „Methan verbrennt“) ständig zwischen
  zu groß (rechts abgeschnitten) und winzig: die Breite des Rahmens hing von der Schriftgröße der Zeile ab, die Schriftanpassung beobachtete auch die Zeile selbst. Jetzt hängt der
  Rahmen nie vom Inhalt ab (`contain: inline-size`, Raster `minmax(0, 1fr)`), angepasst wird nur bei echter Breitenänderung des Platzes, höchstens 8-mal ohne Pause, mit 1 px Luft.
- **Ionenbindung: neue Ordnung „Lernen | Experimentieren“** – Erklärung und Quiz sind ersetzt durch den Bereich **Lernen** mit fünf Kapiteln zu je 25 Folien
  (Level I: Vom Atom zum Ion · Formel und Name · Ionengitter und Eigenschaften; Level II: Ionen aus mehreren Atomen · Nebengruppenmetalle). Erklärung und Aufgaben in einem
  Fluss (vorgemacht → halb gelöst → selbst, `checkGuide`), mindestens 13 Modell-Folien je Kapitel: Modell verändern, Änderung sofort sehen, „Prüfen“ meldet das Gebaute,
  Rückmeldung je typischem Fehler, nach vier Fehlversuchen die Lösung im Modell. Hilfsmittel jeder Folie: PSE, Tipp, Erklärung (Merksätze des Abschnitts). Fortschritt je Kapitel
  (`ionenbindung-lernen`), Fortsetzen an der letzten Folie. Vorwissen nur aus Gemische, Atombau und früheren Kapiteln. Jedes Kapitel unabhängig fachlich, didaktisch und gestalterisch
  geprüft, Befunde behoben. `Guide` (`@lern/ui`) mit optionalen Zusätzen `badge`, `start`/`onStep`, `tools` – ohne Wirkung auf die anderen Module; check-ui spielt mit
  `KAPITEL=1` jede Folie. Bisherige Erklärung, Quiz und Ionentabelle der Ionenbindung entfernt; die übrigen Module bleiben bei Erklärung | Üben | Experimentieren.
- **Lizenzhinweise: Kraftfeld MMFF94 auch im Web** – `packages/chem/NOTICE.txt` (erscheint unter „Lizenzen“) nannte das Kraftfeld noch „nur in der Android/iOS-App aktiv“;
  es berechnet die 3D-Ansicht aber auch im Web und in der Offline-Datei (im Browser geprüft: Propan-1-ol, Methylbenzen, je etwa 0,9 s im Hintergrund-Thread).
  Hinweis berichtigt, ebenso veraltete Kommentare „3D (nur App)“ in Nomenklatur und Elektronenpaarbindung; Doku nennt Herkunft und Lizenz (Merck-Parameter, RDKit BSD-3).
- **Android-App: Zurück-Taste schließt Blätter** – bisher beendete die Hardware-Zurück-Taste die App sofort, auch bei offenem Blatt oder im Modul. Jetzt `@capacitor/app`
  (8.1.2, MIT) mit Listener in `apps/edi/src/native.ts`: Zurück im Verlauf der WebView wie im Browser (schließt Blatt/Erklärung über `useBackClose`, führt zur Übersicht),
  erst auf der Startseite beendet sie die App. Nur in der Android-App nachgeladen; Lizenzliste des Web-Builds um `@capacitor/app` und `@capacitor/core` ergänzt;
  `cap sync` trägt das Plugin in Android (Gradle) und iOS (Package.swift) ein. Test (`apps/edi/test/native.test.ts`, erste Tests der App-Hülle).
- **check-ui: Subpixel-Toleranz bei `data-min-h`** – die allgemeine Mindesthöhen-Prüfung meldete „56 < 56“ (Elementhöhe 55,x px); jetzt dieselbe Toleranz von 0,5 px wie bei der
  Prüfung mit Tipp/erstem Schritt.
- **Nomenklatur: Aufgabenbild im Üben (Level 4) nie unten abgeschnitten** – die Schlussprüfung fand bei 375×667 und 360×640 halb abgeschnittene Beschriftungen der gefragten
  Gruppe (NH₂, OH, Cl, =O). Jetzt passt sich die Formel der Bildfläche an, und der Rand der viewBox umfasst jede Atombeschriftung, auch vergrößert (`viewBoxOf`, Test).
- **Polymere: kein unlesbarer Bildrest nach der Antwort** – ein Aufgabenbild mit Atomzeichen, das nach der Antwort unter 110 px schrumpfen würde (Atomschrift unter etwa 10 px,
  z. B. „Welches Polymer entsteht aus diesem Monomer?“ bei 375×667: 5,7 px), entfällt ganz; Bilder ohne Atomzeichen bleiben bis 40 px.
- **PSE der Unterstufe: Ordnungszahlen überall ≥ 9 px** – die Schlussprüfung fand, dass die Aussage „Ordnungszahlen im PSE ≥ 9 px“ (Eintrag Runde 3) nur für die Atombau-Ansicht
  galt; im PSE als Hilfsmittel (Atombau-Üben, Ionenbindung, Elektronenpaarbindung, Neutralisation) waren es 8 px. Jetzt zentral in `@lern/chem-ui` (`.pse-us .pc-z` mindestens 9 px).
- **Letzte Feinarbeiten Runde 3** – Elektronenpaarbindung: jede falsche Molekülform mit eigener Rückmeldung (z. B. „trigonal-planar“ für H₂O: übersieht die zwei freien Paare);
  Ionenbindung: jede falsche Formel- und Namensoption mit eigener Rückmeldung (Ladungsrechnung, Name des Anions); englische Element- und Stoffnamen mitten im Satz klein (Test).
  Gemeinsam: gestapelte Zähler mit Zahlfeld ≥ 44 px (Atombau „Schalen füllen“ war auf 26 px gestaucht), Energieniveau-Beschriftung ≥ 14 px, Winkelbeschriftung im 3D-Modell weicht
  δ+/δ− aus; Polymere: Halbstrukturformeln unter Bild-Antworten am Handy einspaltig (brachen bei 360 px um).
- **Atombau, Ionenbindung, Elektronenpaarbindung, `@lern/chem`: Nachprüfung Runde 3** – Elektronegativität eingeführt: EN-Tabelle (H, C, N, O, F, P, S, Cl, Br, I mit Trends) in der
  Erklärung Level II und als Hilfsmittel im Quiz zur Polarität (vorher waren „Polare Bindungen“ ohne EN-Werte nicht lösbar). Level-I-Namen (HF, CCl₄, CO₂) in der Erklärung eingeführt
  (Test). Gemessene Bindungswinkel ergänzt (Dimethylether 111,7°, Trimethylamin 110,9° …), Tetraeder mit verschiedenen Partnern „ca. 109,5°“. Ablenker „3d zuerst abgegeben“ als
  echte Fehlvorstellung (Fe²⁺ → [Ar] 4s² 3d⁴ statt der Cr-Konfiguration); nur gebundene Nuklide (kein He-5, Be-8); Fe₂S₃ nicht beständig; „schwach polar“ erklärt. Baufeld am Handy
  größer (kleine Atom-Tasten; Oberstufe bei 375×667 noch 32 px Zellen), Zähler ohne Überdeckung, Schalter ≥ 44 px; Steckbrief-Kopf (Ordnungszahl oben links) und Suchfeld bei 360 px;
  Ordnungszahlen und Symbole im PSE ≥ 9 px, Lesetext ≥ 14 px; Ionengitter-Bild „Linien: Anziehung der Nachbarn; Abstände im Modell vergrößert“; mₛ = ±½, englische Artikel, Ladung
  „2−“, Tipps als Denkschritt, Rückmeldungen für alle falschen Anzahlen.
- **Polymere: Nachprüfung Runde 3** – „nacheinander“ mit kurzkettigem Monomer ergibt getrennte Ketten (Karte widersprach Atom-Ansicht und Reaktor). Radikalisch stark ungleich
  schnelle Monomere (konjugierte C=C wie Styrol, Butadien, MMA, Acrylnitril gegen Vinylacetat, Vinylchlorid, Ethen) ergeben zuerst fast nur das Homopolymer des schnellen
  (Styrol + Vinylacetat → PS, Vinylacetat erst nach Styrolverbrauch) statt „statistisch“; ETFE alternierend (Karte, Atom-Ansicht, Reaktor gleich). Isobuten mit wenig Butadien
  vulkanisierbar wie Butylkautschuk. Atomzeichen und H am Handy ≥ 14 px auch im Ruhebild (nur die Übersicht vor dem ersten Schritt bleibt bei 11–14 px), Ring am Pfeil-Atom im Bild,
  Beschriftungen und Wellenlinien nur, wo nötig. Pfeilspitzen außen am Atom (Urethan, Harnstoff, Methanol-Abbruch, Ziegler-Natta), AIBN in die entstehende N≡N-Bindung, erster
  Pfeil zum Monomer kein Stummel. Tipps und Rückmeldungen fachlich und ohne Lösung (Starter-Rest am Kettenanfang); englische Namen klein; Startbilder ganz; Aufgabenbilder mit
  Mindesthöhe (Tipp sonst ins Blatt); Reihenfolge-Aufgabe nach dem Prüfen groß genug.
- **Pakete, Skripte: Nachprüfung Runde 3** – Tipp und erster Schritt stauchen auch selbst einpassende Bilder nicht mehr (Bildrahmen bleibt ≥ max(56 px, 60 % von vorher), sonst
  Blatt) – die vorige Doku-Aussage dazu stimmte für Polymere- und Gemische-Bilder nicht (Schrift bis 5 px); Fokus nach „Tipp“ auf dem Tipp bzw. im Blatt, danach zurück auf „Tipp“;
  ein ausgeblendetes Aufgabenbild kommt zurück, wenn wieder Platz ist; gelöste Beispiele auch bei kleinem Vorrat (gemeinsame Frist mit dem Rundenstart); keine Frage zweimal in einer
  Runde (Runde wird bei erschöpftem Vorrat kürzer); geordnete Levels bleiben geordnet; Antworten brechen nur an Leerzeichen und erlaubten Trennstellen (nie „3d|⁷“); Erklärungstext
  nie abgeschnitten; Bohrmodell-Schalenbuchstaben nicht mehr von Elektronen verdeckt; Landkarte scrollt in Lesegröße statt auf 12,8 px zu schrumpfen; Stepper bei 360 px ohne
  Überdeckung; Lesetext ≥ 14 px; Dipolpfeil mit `DIPOLE_MIN`. check-ui vergleicht Bildrahmen vor/nach „Tipp“, öffnet Menü-Blätter und prüft die Auswertung.
- **Gemische: Nachprüfung Runde 3** – Vorgemachte Antipp-Beispiele zeigen das Bild mit markierter Lösung, im Beispiel wird das Bild nie ausgeblendet (vorher gelöste Beispiele ohne
  Bild). Dekantieren physikalisch stimmig (Kippen im Uhrzeigersinn um den Ausguss, Wasser waagrecht, Strahl aus dem Ausguss ins anfangs leere zweite Glas, Gläser getrennt; vorher
  falsch herum gekippt). Alkohol wird mit Heizhaube destilliert („Heizen an“, brennbar – keine offene Flamme), Eindampfen auf Drahtnetz und Dreifuß. Thermometer-Anzeige ≥ 14 px;
  Bildantworten füllen die Taste (Atome etwa doppelt so groß), Metallgitter ohne Lücke; englische Trennschritte kurz (Antwort D nicht mehr abgeschnitten). Tipps hängen nicht mehr
  von der Antwort ab; „Klar heißt nicht rein“ und „Sieht einheitlich aus“ mit wechselnden Antworten; 19 Antipp-Fälle. Salz höchstens 30 g je 100 g Wasser (Löslichkeit ~36 g),
  Sterlingsilber mit eigener Rückmeldung, „Ethanol (C₂H₅OH)“ ohne „rein“; „Teilchen und Stoff“ in Lektion 1 eingeführt (ohne Metalle); Messing „zufällig verteilt“, „hat 4 Atome“,
  Nebel eindeutig. Becherbilder nicht mehr abgeschnitten (`.q-gm` mit einer Rasterzeile); Aufgabenbilder mit Mindesthöhe (`data-min-h`), Tipp und erster Schritt gehen dann ins Blatt;
  `keyedFirst` entfällt (übernimmt `mc`).
- **Nomenklatur: Nachprüfung Runde 3** – „Name → Formel“ (Level 4) zeigt alle vier Antworten ganz (vorher war Antwort D auf allen Größen abgeschnitten oder unsichtbar): 2 × 2,
  teilen sich die Höhe der Karte, je Zelle passend gedreht, Atomschrift ≥ 13 px auch im Aufgabenbild. Rückmeldungen nennen den Denkfehler (Gruppe an anderer Stelle, vom falschen
  Ende gezählt, Vorsilbe fehlt, Kette ±1 C); Erklärung ohne doppelten Satz; keine Aufgaben mit nicht eingeführten Regeln (Alphabet/erster Unterschied beim Nummerieren); kein cis/trans.
  Erklärung um Ethyl, alphabetische Ordnung (di/tri zählen nicht) und E/Z bei gleichem erstem Atom ergänzt (24 Schritte), Karten präzisiert (Oxo- = C=O). Lösungsweg mit Klammern bei
  zusammengesetzten Vorsilben, Amin/Amid nach den H am N (–NH–, –N<, –CONH–), „Das C mit der ranghöchsten Gruppe ist C1“. Zeichenfläche: Meldungen übersetzt, Bindungen als
  Tippziel ≥ 44 px, keine Atome unter den Knöpfen, gedrängte Äste und Ringe auseinandergedreht (Abstand < 0,5 Bindungslängen bei 52 786 Prüfmolekülen von 106 auf 0).
- **Reaktionsgleichungen, Neutralisation, Einheiten: Nachprüfung Runde 3** – Reaktionsgleichungen: Teilchenbild nie zerdrückt (vorher bis 0 px auf kleinen Handys; zu wenig Platz →
  Knopf „Teilchenbild ansehen“ mit Blatt), „So geht's“ (ⓘ) als Blatt mit den Regeln (Zahl vervielfacht alle Atome des Stoffs, Formeln nie ändern, kürzen) und Mini-Beispiel, Tipp ein-
  und ausblendbar, HCl „Chlorwasserstoff“ (Salzsäure ist die Lösung), Üben ohne schon ausgeglichene oder stufenfremde Gleichung. Neutralisation: „bauen“ im Quiz mit eingepasster Wand
  (sonst OH⁻-/H⁺-Reihe oder nur Bilanz) – der Prüfen-Knopf war beim ersten Schritt verdeckt; Zähler ≥ 44 px ohne Überdeckung; jede falsche Antwort mit Rückmeldung und Stolperstein;
  Ba(HSO₄)₂, Ca(HSO₄)₂, CaS und BaS nicht als Salz in Wasser (Sulfat fällt aus bzw. Sulfid reagiert, `saltProblem`); EN „hydrosulfuric acid“; lange Säurenamen getrennt.
  Einheiten: Eingaben erkennen Gegenrichtung, Faktor 10 und Längenfaktor bei Fläche/Volumen mit gezielter Rückmeldung; Vorsilben-Skala und Aufgabenbild ≥ 14 px ohne Abschneiden;
  „Schritt“ statt „Stufe“; Erklärung ohne wiederholten Fall und ohne vorweggenommene Umrechnungszahl.
- **Stoff-Info: Strukturformeln mit Formalladungen und ungepaarten Elektronen** – O₃ wurde als „O–O=O“, HNO₃ mit vierbindigem N und einfach gebundenem O, NO und NO₂ ohne
  ungepaartes Elektron gezeichnet (widersprach der Elektronenpaarbindung). `formalCharges` (`@lern/chem-ui`) berechnet die Ladungen aus den Bindungen nach der Oktettregel:
  O₃, HNO₃ und CO zeigen ⊕/⊖, NO und NO₂ das ungepaarte Elektron als Punkt am N; erweitertes Oktett (SO₂, H₂SO₄, PCl₅, SF₆) und das Sextett von BF₃ bleiben ohne Ladung;
  Screenreader nennen die Zeichen in Worten.
- **Gemeinsame Pakete, Skripte: Nachprüfung Runde 2** – Tipp und „Erster Schritt“ sind immer ganz lesbar (vorher ragten sie aus der Aufgabenfläche, und das Aufgabenbild wurde bei
  niedrigen Handys bis auf 18 px zerdrückt): passen sie nicht, öffnen sie als Blatt; sie stauchen weder Bild noch Antwortfläche unter ihre Mindesthöhe. Quiz-Werkzeugleiste ohne
  Überlappung mit „Weiter“ und ohne abgeschnittene Beschriftungen; Lesetext im Quiz ≥ 14 px (Level-Beschreibung, Rückmeldung). Zahlschritte der Erklärungen lesen Zahlen nach
  Sprache („1.000“ im Deutschen = 1000). Vorlesen bei Bild-Antworten neutral („Antwort A …“, Bilder ohne Lösung im Namen). Zurück-Taste ohne Wettlauf (Schließen und Öffnen im selben
  Durchlauf), kein toter Verlaufseintrag nach Neuladen; Erklärungs-Ring mit beiden Sprachnamen. Auswertung scrollt nie (viele lange Fertigkeitsnamen: kompakter, zuletzt „Neue Stufen (n)“
  als Blatt). `mc` wählt beim Kürzen zuerst Ablenker mit Stolperstein; gelöstes Beispiel ist nie dieselbe Frage wie eine Aufgabe der Runde (Vergleich über `taskKey`; vorher bis 169 von
  450). Lizenzen in der Einzeldatei mit „--“. check-ui: spielt in LEARN jede Aufgabe bis „Weiter“, prüft Tipp und ersten Schritt, Überlappungen, abgeschnittene Beschriftungen und Wortbrüche.
- **Atombau, Ionenbindung, Elektronenpaarbindung, `@lern/chem`: Nachprüfung Runde 2** – Polarität: ΔEN an einer Stelle gerundet (`enDelta`; NOCl galt durch Rundung als unpolar),
  kleine Restdipole polar (ClCN, BrCN, CBrCl₃; die Schwelle 0,2 gilt nur noch für den Dipolpfeil), „schwach polar“ auch aus Bindungen mit kleinem ΔEN außer C–H (CH₃I, H₂C=S, CH₃SH),
  konjugierte Einfachbindungen eben und s-trans (Glyoxal unpolar), Allen mit senkrechten Endgruppen; Hydrazin im 3D-Modell gauche statt anti (`mol3d.py`, Dipol 1,75 D real).
  Gemessene Grundzustände abweichender Kationen (V⁺, Co⁺, Ni⁺ …); Kennzeichen „Atom ist Ausnahme, Ion nach Regel“ bei Cu⁺ statt „Ausnahme“; „Vom Atom zum Ion“ ohne widersprüchliche
  Außenelektronen bei Übergangsmetall-Ionen. Neues Bild des Ionengitters (NaCl-Schicht, Ionenradien im Verhältnis) mit eigenem Teil „Ionengitter“ in der Erklärung. Richtige Auswahl
  in den Erklärungen an wechselnden Plätzen (vorher bis 18 von 19 an Platz 1; Test höchstens 40 %); Ordnungszahlen im PSE-Antwortfeld ≥ 9 px; Kurzschreibweisen ohne Umbruch mitten in „3d⁷“;
  Pd-Steckbrief „4 besetzte Schalen, 5s leer“; „Bindungspartner“; „geteilte Elektronen“ statt nicht eingeführter „Elektronenpaare“; längere Zeitgrenzen für große Tests.
- **Polymere: Nachprüfung Runde 2** – Karte, Atom-Ansicht und Reaktor stimmen überein (Prüfung aller 1262 Ansätze): „nacheinander“ ohne lebende Ketten beendet im Reaktor die alten
  Ketten und startet neue aus dem zweiten Monomer (vorher wurde es nie eingebaut); ein Monomer, das mit dem Verfahren keine Ketten bildet, ergibt das Homopolymer des anderen
  statt „Kein Polymer“ (z. B. Ethen + Isobuten mit Ziegler-Natta → PE-HD), kein Polymer nur bei Vergiftung von Anfang an; ein AB-Monomer als erstes Molekül wird gewendet (verknüpfte
  vorher nicht), mit einem nicht reagierenden Partner entsteht sein eigenes Polymer (PLA, PA 6). SB mit zwei Blöcken ist noch kein thermoplastisches Elastomer (erst SBS);
  Styrol + Butadien anionisch ergibt ein Gradienten-Copolymer (Butadien zuerst). Cl⁻ mit vier Elektronenpaaren (Test: Formalladung aus Bindungen und Paaren = gezeichnete Ladung).
  Pfeile neu gelegt (H⁺-Wanderung, Abgangsgruppe, Ziegler-Natta-Butadien, kationisch). Atomzeichen am Handy ≥ 14 px (Zoom auf die Reaktionsstelle; nur die Übersicht der
  Ausgangsstoffe vor dem ersten Schritt bleibt bei ~12 px). Startauswahl oben, Kennzeichen einheitlich, zwei Nebenprodukte im Reaktor, Hinweis „vereinfacht“ hinter ⓘ; Tipps ohne
  Antwort; richtige Auswahl der Lektionen an wechselnden Plätzen (vorher fast immer Platz 1; Test höchstens 40 %).
- **Gemische: Nachprüfung Runde 2** – Verbindung mit festem Zahlenverhältnis (H₂O 2 : 1, NaCl 1 : 1), Legierung mit frei wählbaren Anteilen und „oft homogen“ in Lektionen und
  Erklärkarten (vorher passte die gelehrte Definition von „Verbindung“ auch auf Messing; Test); Messing nach dem Erstarren und Legierungsbilder mit 12 Atomen, „abwechselnd“ als
  regelmäßiges Muster, „getrennt“ als zwei Blöcke, richtiges Bild sichtbar zufällig (Test), höchstens drei Bildantworten untereinander und größer; Kapitel 1 ohne Metallgitter (Gitter
  erst in Kapitel 2); Gasgemisch, Nebel und Rauch in Lektion 4 eingeführt (Test: jeder abgefragte Begriff fett in einer Lektion bis zu diesem Kapitel); Eischnee und Dunst statt
  Schlagsahne und Wolke; Alkohol „verdampft leichter – im Dampf ist mehr Alkohol“ statt „zuerst“; eigene Rückmeldung zu jeder falschen Antwort (Nachbarzahlen, Art des Gemischs,
  homogen/Alltag), Fallen mit Stolperstein bleiben zur Wahl (`keyedFirst`); Tipps höchstens 85 Zeichen; Vorlesen der Bildantworten neutral; Gemischbild mit eigenem Ausschnitt
  (Eisen sichtbar); Packungsaufschriften wie gedruckt; Stolperstein „Teilchen ruhen“.
- **Nomenklatur: Nachprüfung Runde 2** – Lösungsweg „Nummerieren“ nennt die entscheidende Regel mit beiden Nummern (was von beiden Seiten gleich ist zuerst, dann Ast, Alphabet
  oder Z – vorher immer das erste vorhandene Kriterium, im Widerspruch zur Quiz-Rückmeldung), beim Heterocyclus zuerst „Heteroatom = 1“, bei Namen ohne Nummer den Grund, am
  Benzolring den eingeführten Namen (Benzenol → Phenol). Tipps als Denkschritte statt Zuordnung Gruppe → Endung oder Rangfolge (verrieten, was das Hilfsmittel bewusst verbirgt);
  Stoffklassen-Rückmeldung ohne doppelten Satz; keine „1-Hydroxy-…-1-oxo“-Ablenker bei Säuren; „Rangfolge“ vor „ranghöchste Gruppe“ eingeführt; richtige Antworten der Erklärung an
  wechselnden Plätzen (vorher 10 von 10 an Platz 1; Test höchstens 40 %). Zeichnung: gedrängte Endatome gespreizt (Perchlorhexan: Cl–Cl 0,35 → 0,76 Bindungslängen), keine Atome
  unter „Farbe“/„Ordnen“, ohne Tippziele zu verkleinern; Werkzeugnamen ab 360 px vollständig (weiche Trennstellen); Ester-Nebennamen ohne irreführende Form; –COO–/–OH brechen nicht um.
- **Einheiten, Neutralisation: Auswahl in der Erklärung an wechselnden Plätzen** – die richtige Antwort stand fast immer an Platz 1 (bis 8 von 8), die Erklärung war so ohne
  Nachdenken lösbar (die Erklärung mischt nicht). Jetzt an wechselnden Plätzen; Zahlen und Einheiten aufsteigend, Ladungen nach Betrag; Test je Stufe höchstens 40 % an Platz 1.
- **Reaktionsgleichungen, Neutralisation, Einheiten: Nachprüfung Runde 2** – Phosphorpentoxid als Molekül P₄O₁₀ (P₄ + 5 O₂ → P₄O₁₀, 4 PH₃ + 8 O₂ → P₄O₁₀ + 6 H₂O; vorher
  wurde P₂O₅ – nur die Verhältnisformel – als Molekül gezeichnet; neue Kennungen `p4o10`/`ph3-o2`, damit alte Stände nicht als gelöst gelten; keine Gleichung doppelt, Level II
  Mittel beginnt mit 4 PH₃ → P₄ + 6 H₂); alle 60 Üben-Tipps ohne vorweggenommenen Denkschritt (Muster „Atomzahl … je/jedes“ im Test); „Lösung angesehen – kein ✓“; Teilchenbild
  mit Zeilenhöhe je Stoff (größere Moleküle). Neutralisation: Tipps nennen nur die Regel, keinen Beispielnamen, der die Antwort sein könnte (Test über alle Typen); Wortgleichungen
  immer mit Name und Formel, Level I nur eingeführte Laugennamen (Kalilauge, Kalk- und Barytwasser in der Erklärkarte Level II); Formeleinheit definiert; eigener Stolperstein „Zahl
  der H₂O als Koeffizient“; „das H“ statt „die H“; Englisch „both H⁺“, Namen mitten im Satz klein. Einheiten: Rundung mit fester Stellenzahl („≈ 6,80“, „a · F ≈ x“), Tafel und
  Bild exakt wie der Quiztext (1/0,036, a : Teiler), jede falsche Antwort mit Rückmeldung, Flächenbild mit Hinweislinie, Schrift in Bildern ≥ 14 px (auch Neutralisation und
  Reaktionsgleichungen), alte Antworten gruppiert. Rechenintensive Tests mit eigenem Zeitlimit (liefen unter Last in die 5 s).
- **Quiz: Wiederholungsschutz ohne Nebenwirkungen** – die Nachprüfung der vorigen Änderung fand drei Rückschritte: „Heute fällig“/„Schwächen üben“ ließen fällige Fertigkeiten
  mit kleinem Vorrat ganz weg (Typtausch), verschiedene Fragen mit gleichem Text und anderer Lösung hatten dieselbe Kennung (Fertigkeiten verschwanden aus ihrem Level), und der
  Rundenstart in Nomenklatur Level 1 dauerte nach einigen Runden bis 3 s. Jetzt: `taskKey` enthält die richtige Antwort als Text (unabhängig von der Mischung); `freshRound` mit
  `keepType` (feste Reihenfolge, „Heute fällig“, „Schwächen üben“: nie Typtausch, bei erschöpftem Vorrat die älteste Frage dieser Fertigkeit) und `samePlace` (gleicher Platz oder
  gleicher Typ mit gleichem Merksatz); in Leveln ohne feste Reihenfolge höchstens ein Typtausch je Runde; Suche begrenzt (höchstens 250 ms). Simulation über alle Module und Level:
  keine fällige Fertigkeit fehlt, kein Typ unter 40 % seines Erwartungswerts, Rundenstart im Mittel ≤ 244 ms.
- **Atombau, Ionenbindung, Elektronenpaarbindung, `@lern/chem`: Fachfehler und Begriffe** – Elektronenkonfiguration ist jetzt der gemessene Grundzustand (Tabelle der 13 Ausnahmen
  bis Z = 86: Cr, Cu, Nb, Mo, Ru, Rh, Pd, Ag, La, Ce, Gd, Pt, Au; vorher z. B. Cu 2,8,17,2 statt 2,8,18,1) mit Kennzeichen „Ausnahme“; Kationen aus dem Grundzustand
  (Cu⁺ [Ar] 3d¹⁰, Fe²⁺ [Ar] 3d⁶); Aufgaben zum Aufbauprinzip fragen keine Ausnahme-Elemente; Ionen mit Edelgas-Elektronenzahl als [Ne]/[Ar]/[Kr] (wie in der Erklärung).
  Polarität aus der Vektorsumme der Bindungsdipole in der räumlichen Lage (vorher galt jedes Molekül mit mehreren Zentralatomen als polar, z. B. C₂Cl₄, NC–CN; drehbare Bindungen,
  cis/trans wie gebaut, auch in der 3D-Ansicht frei gebauter Moleküle); PH₃ schwach polar wie H₂S. H ohne „Alkalimetalle“. Rückmeldungen zu H/He, Ammonium (Kation) und „-id“
  (Ausnahme Hydroxid) korrigiert. Ionenbindung = Anziehung der Ionen im Ionengitter (Elektronenübergang als Modell der Ionenbildung, beschreibend statt „möchten 8 außen“).
  Ionentabelle nicht bei Fragen nach der Ladung (verriet die Lösung). Einheitliche, eingeführte Begriffe (Edelgaskonfiguration, Übergangsmetalle, Molekülform, Bereich).
  Ordnungszahlen im Oberstufen-PSE auch am Handy; Unterstufe ohne Oberstufen-Namen; Na₃N und K₃N als nicht beständig; Fe-Titelbild mit 30 Neutronen; Orbitalnamen ohne Unterstrich.
- **Alle: Bereichsleiste einheitlich, Regeln und READMEs aktuell** – Reaktionsgleichungen zeigt die Bereiche wie alle Module als **Üben | Experimentieren** (vorher umgekehrt;
  geöffnet wird weiter die Werkbank). Regel „Experimentieren stellt nie Fragen“ präzisiert: Zustandskennzeichen wie „✓ neutral“ oder „✓ ausgeglichen“ nach „Prüfen“ bewerten
  keine Antwort und sind erlaubt; Bereichsleiste heißt „Erklärung | Üben | Experimentieren“. READMEs von Gemische (Experimentieren, sechs Kapitel im Üben, Satzbruch behoben)
  und Nomenklatur (Erklärung, Üben) auf dem aktuellen Stand.
- **Nomenklatur: Quiz-Moleküle gültig, Rückmeldungen je Regel, englische Namen, Stoffklassen** – Quiz nur mit chemisch möglichen Molekülen (vorher z. B. „2-Methylbutan-2-on“
  mit fünfbindigem C: kein Ast am Keton-C, `name()` lehnt überschrittene Wertigkeit ab, Test über alle Generatoren); Oxo-Vorsilben kommen in Level 4 vor (Bedingung war immer wahr).
  Rückmeldung zur anderen Zählrichtung nennt die entscheidende Regel mit Nummern (C1 der Gruppe, ranghöchste Gruppe, Mehrfachbindung, Äste, Alphabet; `reverse`) statt immer „dann
  sind die Nummern kleiner“; Rückmeldungen ohne di/tri und zum Alphabet mit den Vorsilben der Aufgabe; andere Gruppe nur an derselben Stelle; Name → Formel ohne geminales Diol,
  Stolperstein nach dem Unterschied der Namen. Englisch: Reihenfolge und Nummern nach englischem Alphabet (`nameEnOrder`, ethyl vor ethynyl; Gegenprobe OPSIN), Esterreste alphabetisch.
  Ketten über 30 C und Ringe mit Dreifachbindung mit Meldung statt Absturz; Zahlwörter bis 99 (Tetradecachlorhexan statt „Undefinedchlorhexan“). Stoffklassen: Lacton/Lactam/Anhydrid/Imid
  statt Keton, Cycloalken nur bei C=C im Ring, OH am Heteroaromaten kein Alkohol, Enol, Thioether; Benzol-Schreibweise auch am Namensanfang; Alkyl-…oat mit Bindestrich.
  „Ranghöchste Gruppe“ (EN principal group) statt „Hauptgruppe“ (Kollision mit der PSE-Hauptgruppe aus Atombau); Carbonsäure, Amin, Ester, Ether fett eingeführt; halb gelöster
  Alkohol-Schritt ohne vorgegriffene Begriffe und ohne Lösung; Lösungsweg für Heterocyclen; Endungen in Sätzen mit geschütztem Bindestrich; Element-Stifte bei 360 px ≥ 44 px; Doku (3D-Werkzeug).
- **Polymere: Fachfehler in Regeln, Mechanismen, Bildern und Tipps behoben** – Stufenwachstum zählt nur Gruppen, die mit dem Partner reagieren: AB-Monomer + Partner ist nie
  „abwechselnd“ und nie ein Netz (Milchsäure + Diamin → Polyesteramid); AB-Monomer + Glycerin ergibt sternförmig verzweigte, schmelzbare Moleküle (alle Arme enden mit –OH, das mit
  –OH nicht reagiert), Disäure bzw. Säurechlorid + Glycerin bleibt vernetzt (Duroplast). Anionische Blöcke nur, wenn das Kettenende das zweite Monomer starten kann (Styrol/Butadien →
  MMA → Acrylnitril; MMA → Styrol gibt nur PMMA); „nacheinander“ ohne lebende Ketten: erst Abbruch, dann neue Kette (Atom-Ansicht und Reaktor stimmen jetzt mit der Produktkarte überein).
  Phenoplast-Brücken ortho zur –OH (vorher eine meta). Pfeile: Ziegler-Natta-Einbau von Butadien mit drei Pfeilen; Ester- und Amidbildung als Additions-Eliminierung in drei Schritten
  (vorher keine Pfeile); kationisches Dien gibt beim H⁺-Abspalten ein konjugiertes Dien statt eines Allens. Kautschuk-Arten (`rubber`): nur Dien-Kautschuke vulkanisierbar, EPM mit
  Peroxid vernetzt, PIB nicht vernetzbar, SBS thermoplastisches Elastomer (EPM war „Thermoplast“, PIB „vulkanisiert“). Ethylbenzol gilt nicht mehr als gesättigt (Benzolring).
  Begründungen bei „keine Reaktion“ fachlich richtig; Tipps in allen Lernmodi zugeschnitten und ohne Lösung (Test mit verbotenen Wendungen je Typ); Rückmeldungen bei `wasserTap`
  und `freieStelleTap`; „Automatisch“ endet immer; Produktbild zeigt das tatsächlich eingebaute Monomer; EN-Namen und Taktizität richtig geschrieben; PE-LD/PE-HD einheitlich.
- **Reaktionsgleichungen: Übungsfortschritt übersteht „Neu starten“** – `reaktionsgleichungen-ueben` als Fortschritt gekennzeichnet (`progressKey`); vorher löschte schon das erste
  „Neu starten“ nach einem Absturz die gelösten Gleichungen (der Stand der Experimentier-Beispiele gilt weiter als Baukasten).
- **Gemeinsame Pakete, Hülle, Workflows: Befunde der Prüfung behoben** – „Zum Inhalt springen“ setzt nur den Fokus (die Adresse `#main` führte zur Übersicht). Wiederholungsschutz
  wirkt wieder: `taskKey` ohne Felder, die vom Mischen der Antworten abhängen (`why`, `miss`) und ohne `stage`/`lead`/`hintCue`; `buildRound` prüft Dubletten damit; `freshRound`
  bei fester Reihenfolge nur mit Kandidaten desselben Platzes (sonst landete der Merksatz am falschen Platz; Wiederholungen gemessen von 47 bzw. 122 auf 0). „Neu starten“ nach einem
  Absturz: Merkzeichen je App und nur 10 Minuten (vorher löschte nach einem Absturz in einem Modul schon der erste Neustart in einem anderen allen Fortschritt), Fortschritt ausdrücklich
  gekennzeichnet (`progressKey`), geteilte Lektionen bleiben. „Nochmal“ nach „Heute fällig“/„Schwächen üben“ nur, solange etwas fällig bzw. schwach ist (`pending`); beim ersten Schritt
  kein Tipp-Knopf und kein Abzug. Erklärungs-Ring mit Modul-Kennung (`CurrentModul`, erschien nach Sprachwechsel wieder); Beamer beim Verlassen aufgeräumt; Zurück-Taste mit Kennung je
  Öffnen (`useBackClose`); WebGL-Kontext beim Abbau freigegeben; Lizenzen als Blatt (auch in der Einzeldatei); Vorlesen nur mit Stimmen des Geräts (keine Online-Stimme, Datenschutz);
  Blatt-Namen und Sterne für Screenreader. Workflows: `native.yml`/`pages.yml` reagieren auch auf `scripts/` und `tsconfig.base.json`, Release prüft vor dem Bauen und nutzt die
  Upload-Action per Commit-SHA; Architektur-Prüfung relativ zum Repository; README und Meta-Beschreibung aktuell.
- **Gemische: Prüfbefunde im Üben behoben** – „Eisen, Sand und Salz“ zeigt das Eisen im Bild; Legierungsbilder nur Kupfer mit höchstens einem Drittel Zink (einphasig; andere
  Metallpaare bilden intermetallische Phasen) und fachlich begründet (Atome im Gitter verbunden, aber zufällig verteilt, ohne festes Verhältnis – keine Verbindung) statt „Atome nicht
  verbunden“; Ablenker passend zum Bild (keine „Moleküle“ bei Einzelatomen). Stolpersteine passend zur gewählten Antwort (neu „Legierung und Gemenge verwechselt“, „Gelöster Stoff
  bleibt als Kristall“; „Gemischte Metalle für Verbindung gehalten“). Sprudel (reagiert teilweise zu Kohlensäure), Schlagsahne, Kakao, Feingold, Tinte und Wolke entfernt bzw. durch
  eindeutige Beispiele ersetzt (Eischnee, Mehl in kaltem Wasser, Füllertinte, Sprühstoß). Kapitel 5 bietet keine Verfahren aus Kapitel 6 mehr an; Begriffe erst ab ihrem Kapitel
  (Legierung, Gitter, Reinstoff, Destillieren; Test über alle Kapitel). Tipps als Denkschritt („nachher“, Luft zwischen den Teilchen, Magnet); Formel-Tipp „jede Atomsorte beginnt mit einem
  Großbuchstaben – gleiche zählen einmal“ (C₂H₅OH). Merksätze passend zu jeder Variante, bei Trennverfahren eigener Merksatz nur mit Ziel; Vorlage fett eingeführt; Rückstand beim
  Destillieren = salziges Wasser (nie bis zur Trockne); Verfahrensnamen einheitlich (Magnettrennung, Lösen; englisch dissolving, hand-pick); Satzanfänge groß, Masse-Auswahl
  aufsteigend, Englisch „an H₂O particle“; „Art des Gemischs“ ohne Wortbruch („Gasgemisch“).
- **Reaktionsgleichungen: Lösung zählt nicht als gelöst, Tipps ohne Vorwegnahme** – nach „Lösung“ zeigt „Prüfen“ den Zustand, die Aufgabe zählt aber nicht als selbst gelöst;
  beim Weitergehen beginnt die Gleichung von vorn. Tipps nehmen den Denkschritt nicht vorweg (kein „schon ausgeglichen“, kein „jedes HF nur eines“, Test). US-Niveau 1 = höchstens
  eine Zahl ≠ 1; Phosphor in der Unterstufe einheitlich P₄; CaSO₄ ohne „Gips“ (Gips ist das Dihydrat); Teilchenbild kennzeichnet C und S als Modell (einzelne Kugel);
  Ablauf mit „Edukte (Ausgangsstoffe)“; Modulbeschreibung und README aktuell; „Prüfen“ im Experimentieren als Zustandskennzeichen dokumentiert.
- **Neutralisation: Stufen sauber getrennt, Aufgaben eindeutig** – Level I ohne Perchlorsäure, Hydrogen-Namen, „einprotonig“ und „Formeleinheit“ (auch nicht in Fallen, Tipps,
  Rückmeldungen; Formeleinheit in der Erklärkarte Level II eingeführt). Salz-, Salzname-, Gleichungs- und Bauaufgaben sagen als eigenen Satz, wie viele H⁺ jede Säure abgibt –
  vorher waren bei mehrprotonigen Säuren auch Hydrogensalze richtig, wurden aber als falsch gewertet. -id/-it/-at-Fallen nur aus derselben Familie; Tipp und Rückmeldungen zu
  COOH-Säuren („nur das H der COOH-Gruppe“ statt „H vorne in der Formel“); „schweflige Säure“ mitten im Satz klein; englische Satzanfänge groß; Erklärung verrät die CH₃COOH-Antwort nicht mehr.
- **Einheiten: Eingabe, Rechenweg und Rückmeldungen korrigiert** – Eingaben werden nach der Sprache gelesen (Deutsch „1.000“ = 1000, nie 1; Englisch „1,000“ = 1000) –
  vorher galt „1.000“ bei „1000 m = ? km“ als richtig, gerade der typische Fehler „nicht umgerechnet“; auch im Umrechnen. Antwort exakt gespeichert und so angezeigt, wie sie gelesen wurde.
  Rechenweg immer exakt (endet die Umrechnungszahl nicht, durch den Kehrwert teilen statt gerundeter Faktor ohne „≈“); 1 PS = 735,498 75 W. Rückmeldungen zur Umrechnungszahl
  und „Mal oder geteilt?“ für ungleich große Stufen (Masse, Hohlmaß, km) mit der Kette über die Nachbareinheiten. Tipp der Größenvorstellung ohne das Ding der Frage; l ↔ ml auf der
  Hohlmaß-Pfeilkette statt der Volumenkette; halb gelöste Erklärschritte mit passendem Bild ohne vorweggenommene Zahl; Briefmarke/Stecknadelkopf fachlich richtig.
- **Elektronenpfeile zentral (`CurlyArrow`, `@lern/chem-ui`)** – gleichmäßige Bögen, deutliche gefüllte Spitzen bzw. Widerhaken, blau, so kräftig wie die Bindungen, weichen Atomen aus; Polymere nutzt sie (O–O-Homolyse nach außen, Pfeil-Atome am Rand sichtbar, Polyaddition zeigt das –OH); kürzere Rückmeldung bei „Mehr Starter“.
- **Polymere: Namen im Bild und Begriffe in Lektionen** – Monomer-Bilder mit Name und Merkmal; Lektion K1 zeigt Styrol, Ethan und Vinylchlorid vor der Frage; PVC ausgeschrieben; Begriffe auch in Lektionen antippbar (Blatt schließt die Lektion nicht mehr mit).
- **Polymere: Begriffe und Tipps beim Üben** – Stoffnamen, Starter und funktionelle Gruppen in Aufgaben antippbar (Karte „Was ist das?“, zentral `TermScope` in `@lern/ui`, `terms` an `QuizScreen`), Hilfsmittel „Begriffe“; zugeschnittener Tipp für alle 38 Fertigkeiten ohne eigenen Tipp; kürzere Rückmeldungen bei „Lebende Ketten“ und PE-HD/PE-LD (Bild bleibt mit „Lesbar“ auf 375 × 667 groß genug).
- **Alle: überall „Üben“** – Atombau, Ionenbindung, Elektronenpaarbindung, Neutralisation, Nomenklatur und Einheiten: Bereich „Quiz“ heißt „Üben“ (zentral `uebenTab`), Überschriften „Üben · …“, Erklärung endet mit „Zum Üben“; Inhalt unverändert. check-ui findet den Bereich über „Üben“ in der Leiste.
- **Alle: Bereich „Üben“ zentral** – `uebenTab`/`uebenLabel` in `@lern/ui`; Polymere und Gemische heißen „Üben“ statt „Lernen“ (Inhalt unverändert), Reaktionsgleichungen nutzt denselben Bereich; check-ui sucht „Üben“. Regel: gemeinsame Üben-Bausteine liegen in `packages/`.
- **Reaktionsgleichungen: Teilchenbild beim Üben einklappbar** – Schalter „Teilchen“ blendet das Kugelbild aus, damit nur Text (Namen, Gleichung, Tipp) dasteht; Standard an.
- **Reaktionsgleichungen: Üben statt Erklärung und Quiz** – Bereiche Experimentieren | Üben; Üben mit je Stufe 3 × 10 festen Gleichungen (Einfach, Mittel, Schwer),
  nur aus Molekülen, damit nach ✓ die Animation bei jeder Gleichung geht; „Tipp“ mit eigenem Hinweis je Gleichung; Erklärung (`guide.tsx`) und Quiz (`src/quiz/`) entfernt.
  42 neue Molekül-Gleichungen in `REACTIONS` mit Stoffnamen (DE/EN); Zahlenauswahl bei Niveau 4 bis 40 (Dodecan).
- **Gemische: Kapitel 6 korrigiert, Trennbilder größer** – Eindampfen zeigte schon vor „Brenner an“ Dampf (jetzt erst mit Flamme, Brenner ohne Flamme sichtbar);
  Destillieren nicht mehr bis zur Trockne; Chromatografie mit zwei Ursachen widerspruchsfrei („am wenigsten weit mitgenommen“, Eigenschaft „Löslichkeit und Haften“);
  in der Lektion geht der Lösungsweg erst nach dem Einschalten des Geräts weiter; Reihenfolge-Aufgabe und beantwortete Aufgaben mit Teilchenbild auf niedrigen Handys
  ohne Bild (statt winzig bzw. letzte Antwort abgeschnitten); Bildausschnitt je Verfahren (`BOX`), Trefferflächen aller Teile ≥ 44 × 44 px (gemessen 375 × 667, 360 × 740);
  Weißgold (Gold mit Palladium). `check-ui`: Antwortknöpfe dürfen nicht aus der Aufgabenkarte ragen, das Aufgabenbild nicht unter 24 px schrumpfen.

- **Gemische: Definitionen Element, Verbindung, Legierung einheitlich; Messing gleichmäßig** – Lektion 2 und Erklärkarte mit den Definitionen „Element: eine Atomsorte –
  als einzelne Atome, Moleküle oder im Gitter“ und „Verbindung: mehrere Atomsorten, fest miteinander verbunden – in Molekülen oder in einem Gitter“; „in einem Teilchen“
  nur noch als Bildregel („Im Bild: …“). Legierung = Metall mit anderen Elementen zusammen geschmolzen (nie „nur Metalle“); „bis zu den Atomen gemischt“ nur bei einphasigen
  Beispielen. Test `definitions.test.ts` sucht die verbotenen Formulierungen in allen Texten (DE/EN). Schmelze Messing: Strömungswalzen wechseln ihre Lage (eine, zwei,
  verschobene; `MIX_T`), stärker (`CONV` 1,8) – vorher drehte eine Walze den Zinkblock nur im Kreis (Zink je Drittel 13–52 %); Test: nach dem Erstarren jedes Drittel in
  Breite und Höhe höchstens 13 Prozentpunkte vom Mittel (10 Startwerte).

- **Gemische: Kapitel 5 geteilt, neues Kapitel 6 „Lösungen trennen“** – Kapitel 5 „Trennen nach Größe, Magnet, Dichte“ (Lektion 9 Schritte, neu Dichte, Bodensatz,
  Dekantieren), Kapitel 6 `gm-k6` (Lektion 12 Schritte mit selbst bedientem Gerät, Alkohol/Wasser-Destillation, mehrere Schritte; Fertigkeiten `loesWahl`,
  `loesEigenschaft`, `loesTipp`, `trennReihe`). Bisherige Kennungen und Fortschritt bleiben. Erklärkarte je Kapitel. Englische Verfahrensnamen als Nomen
  (hand-picking, filtration, evaporation, distillation). Brenner vor dem Einschalten aus. Rauch-Beispiel „Ruß über einer rußenden Kerze“, „mist over a pond“.

- **Gemische: Element-Moleküle O₂ und N₂ eingeführt** – Lektion 2 mit vorgemachtem Kontrast O₂ / CO und halb gelöstem N₂; Aufgabe `einordnen` mit O₂/N₂ (etwa jede
  vierte, Test: in Kapitel 2 mindestens jede dritte Runde) und neuem Stolperstein „Element aus Molekülen für Verbindung gehalten“. Texte: „Flüssigkeit mit gelöstem Stoff
  = Lösung“, „Wasserteilchen lagern sich an“, Legierung = Metall mit anderen Elementen zusammen geschmolzen. Messing: „Von vorn“ in der ersten Bedienzeile.
  Art des Gemischs: Beispielnamen ohne das Antwortwort („Dunst über dem Teich am Morgen“, „Qualm eines Lagerfeuers“, Test); „Gitter“ in Lektion 2 fett eingeführt.
  Lektionsbilder werden je Schritt neu aufgebaut (Teilchen gleiten nicht aus dem vorigen Schritt herüber).

- **Gemische: Fachfehler und einheitliche Definitionen** – Messing 2 : 1 statt 60 : 40 (zweiphasig); Ablenker „abwechselnd“ beim erstarrten Messing nicht mehr 1 : 1
  (regelmäßiges Muster mit gleichen Abständen) und mit Rückmeldung „Zink zufällig auf Plätzen des Kupfergitters, kein festes Verhältnis“ statt „nur in Verbindungen“;
  Lötzinn (eutektisch, zweiphasig) → Konstantan (Kupfer und Nickel); Auslesen mit roten und weißen Bohnen (gleich groß – Sieben trennt sie nicht) statt Erbsen/Linsen in
  Bild, Gemischbild, Aufgabe und Lektion; Temperaturregler bei Messing ausgeblendet, Schmelze „über 900 °C“. Definitionen überall gleich: homogen = auch unter dem Mikroskop
  keine Bestandteile, Verbindung = als Molekül oder im Gitter (Kochsalz ohne „Ionen“), Lösen = Wasserteilchen lagern sich an, Gemischarten in Worten statt s/l/g,
  „durch Filterpapier“, Dichte statt „leichter/schwerer“, „Phase“ entfernt. Eisenoxid, Calciumcarbonat, Argon aus der Gasflasche; Tipps ohne Lösung (Messing, Masse,
  Bohnen, Destillat, Reinstoff/Gemisch, Gase, „Schritt 1:“); „bei der Magnettrennung/Chromatografie“. Trennbilder: Trefferflächen werden alle 0,4 s nachgemessen
  (Fit skaliert per Transform), geteilte Flächen wachsen auf der freien Seite wieder auf 44 px.

- **Quiz-Auswertung passt auf niedrige Handys** – `@lern/quiz` `styles.css`: bei Bildschirmhöhe ≤ 720 px etwas engere Abstände der Auswertung, mit „Lesbar“
  noch enger (Überschrift ohne Außenabstand, Knöpfe näher) – vorher lief sie bei 375 × 667 mit „Lesbar“ bis 9 px über (alle Module). Größere Bildschirme unverändert.

- **Gemische: Trefferflächen der Trennbilder begrenzt, Zählen ohne Erklärsatz** – Trefferflächen aus dem sichtbaren Umriss (clipPath beachtet – beim Dekantieren
  deckte „Wasser“ das ganze Bild und ragte darüber hinaus), im Bild, nur für die antippbaren Teile (`TAP_PARTS`), überlappende Farbflecken an der Mitte geteilt;
  `check-ui` prüft Lage und Größe (≤ 40 % des Bilds). Thermometerzahl in den Verfahrens-Bildkarten ausgeblendet. Zählen: Zeile „Antippen = im Bild markieren“ durch
  das Kennzeichen ◎ ersetzt. Temperaturzeile bei 360 px schmaler (ragte 20 px über die Karte).

- **Gemische: Experimentieren ohne Abfrage, Merksätze und Tipps ohne Lösung, Trennbilder antippbar** – Werkzeug „Zählen“ ohne Eingabe und ✓/✗: alle Zahlen
  stehen da, Stoffe/Verbindungen/Elemente/Atomsorten antippen markiert deren Teilchen in Gefäß und Lupe (`FlowView` `mark`; Antippen in der Lupe trifft jetzt die
  gezeichnete Lage). Merksätze aller fünf Kapitel als Blickpunkt (Variante setzt eigenen Merksatz: `nachher`, `trennWahl`), Tipps als Denkschritt (Gemischarten,
  Trennverfahren, Teile nach dem Trennen, Reihenfolge, Alltag); Tests gegen Inhaltswörter der Antwort. `trennReihe` mit Eisen: Ablenker durch eine wirklich
  unmögliche Reihenfolge ersetzt (Lösen → Eindampfen → Magnet → Filtrieren). Lektionen: Antwort an wechselnden Plätzen (Test). Trennbilder: Verzierungen nehmen keine
  Klicks mehr an (die Chromatografie-Lektion ließ sich nicht abschließen), Trefferflächen ≥ 44 px, Lösung gestrichelt grün umrahmt; `check-ui` prüft die Erreichbarkeit
  jedes Teils. Statuszeile springt nach „gemischt“ nicht zurück. Modul-Text ≥ 14 px.

- **Agenten-Team** – `docs/agenten.md`: Rollen (Master, Programmierer, Didaktiker, Hilfswissenschaftler, Schüler, Chemie-Professor, UI-Designer,
  Realitätskontrolleur), Ablauf je Änderung und Sofort-Warnung bei Halluzinationen.

- **Regel: Experimentieren stellt nie Fragen; Polymere ohne Vorhersage** – neue Regel (Abschnitt Regeln): Fragen, Vorhersagen und Richtig/falsch-Rückmeldungen
  nur in Lernen bzw. Quiz. Polymere-Experimentieren: Vorhersage-Fragen vor jeder Aktion entfernt (`chem/mech/predict.ts`, Tests, Schalter „Vorher vermuten“,
  Stile `.pm-pq*`); eine Aktion spielt sofort ab. Gespeicherter Schalter `predict` wird ignoriert.

- **Polymere: kleine Bildtexte lesbar** – Monomer-Paare in Kurzform (Benzolring als C₆H₄, MDI-Gerüst als Formel, Diepoxid mit „R“); bei sehr flachem Bildplatz
  (≤ 95 px, `@container`) als Halbstrukturformel-Text ohne hervorgehobene Gruppen; Bild-Antworten (Monomer, Baustein, gesättigt) am Handy (≤ 480 px) als Text
  (`visFormula`, Test) in flacheren Karten; Gefäßbild „mehr Starter“ mit Beschriftung und Legende als HTML-Text.

- **Polymere: Kapitelfolgen ohne Vorsagen** – in jeder Kapitelfolge jede Fertigkeit höchstens zweimal, dazwischen mindestens zwei andere Aufgaben (K2, K5, K6 umgestellt,
  K1 Bauen vor „Monomer zum Polymer“); K5 zweite Form `epoxidBindungTap` (neue C–N-Bindung im Epoxidharz antippen) statt Wiederholung; nach jeder Antwort eine Regelzeile
  (allgemeine Regel des Schritts oder Erklärung der Aufgabe), die nicht die nächste Antwort enthält (Tests: Abstand, Regelzeile, Vorsagen); Tipps als Denkschritt auch im Feld
  `tip` (Test über alle Generatoren); K3 Verfahren: MMA/Vinylchlorid nur radikalisch; Abbruch-Regeln konkret (woran man es erkennt); Copolymer-Regel mit allen drei Arten.
  Bilder: Diepoxid in kleinen Bildern als Kurzform mit „R“ und Legende, Mechanismus-Ausschnitt enger, Taktizität mit vier Bausteinen, ganzes Titan im Gift-Bild.

- **Polymere: Runde-31-Befunde** – Wasser abziehen (Säure + Amin): beide H am N gelten (`same` an der Antipp-Aufgabe, `tapResult` in `quiz/tap.ts`, Test), kein falscher
  Stolperstein mehr; Beschriftungen im Bildausschnitt (Antippen, Mechanismus-Bild) nur, wenn sie ganz hineinpassen (kein „iCl₃“); Quiz-Kopf mit kurzem Kapitelnamen
  (zwei Zeilen am schmalen Handy, weiche Trennung); Formel im Bausteinknopf einzeilig (Schrift nach Zeichenzahl); kurze Ketten im Gefäßbild als kleine Schlaufen;
  breite Stufen-Monomere (Diepoxid) und Monomer-Paare im eigenen Seitenverhältnis, Paare bei hohem Bildplatz untereinander; Auswertung bei niedriger Höhe kompakter
  (Überlauf 375 × 667 behoben); EN: Ziegler groß (`KEEP_CAPS` in `@lern/i18n`), „counterparts“, Lücke am Zeilenanfang (kein „= Polypropene“/„by Combination“), einheitlich
  „half-headed arrow“ und „tip“; K3-Merksatz „lebend“ ohne Regel; Lektion Epoxid ohne „R = Rest“. check-ui: `SHOTS=Ordner` speichert ein Bild je Überlauf.

- **Polymere: Merksatz und Tipp ohne Lösung, Regel an der Aufgabe** – Merksätze vor der Aufgabe nennen den Blickpunkt statt der gefragten Regel (Radikal, freie Stelle,
  H wandert, Taktizität, kationisch, Gift, AB-Monomer, Paare, C=C, Baustein, Kügelchen; Test mit Schlüsselwörtern je Typ); Tipps als Denkschritt (n, mehr Starter, Netz,
  Reaktionsart, freie Stelle u. a.; Test: kein Wort der richtigen Antwort im Tipp); Regel nach ✓ wird beim Erzeugen an die Aufgabe gebunden (gleich in Kapitel, gemischt,
  fällig und nach Ersetzen; Test) und erscheint jetzt auch bei Antippen/Ordnen/Bauen (Quiz-Paket: optionales Feld `rule`). PET-Alltagsfrage ohne Klassen-Definition,
  Epoxid-Frage nennt den Härter.

- **Polymere: Regel nach der Antwort passt zur Variante (Fachfehler)** – bei Typen mit Varianten (Urethan/Harnstoff, Kunststoffart, Gruppen, Taktizität …) erscheint nach der
  richtigen Antwort die Erklärung genau dieser Aufgabe, nur bei allgemeinen Regeln (`GENERAL_RULE`) der Merksatz des Schritts (Test). Beschriftung „TiCl₃-Oberfläche“
  (vier Cl am Oberflächen-Titan, ganz im Bild); freie Stelle grau gefüllt und ohne gepunkteten Antipp-Rahmen; Diepoxid groß; –N=C=O bricht nicht um; Styrol-Kette mit zwei
  Bausteinen; „Es entsteht ein Netz“; Reaktionsart- und Nebenprodukt-Fragen nennen die Stoffe (keine gleich lautenden Fragen in einer Runde), drittes „Reaktionsart“ in K5
  ersetzt; PLA „industriell kompostierbar“.
- **Ordnen-Bilder bleiben groß, check-ui spielt „Lernen“, Schwächen verteilt** – Polymere: auf niedrigen Bildschirmen steht der Grund nach dem Prüfen im Blatt „Lösung“ (mit
  Reihenfolge), auf der Karte bleiben Marke und Name; Fertigkeiten „Monomer → Polymer“ / „Polymer → Monomer“; „Schwächen üben“ aus allen schwachen Fertigkeiten, je höchstens
  zweimal (Test); Kettenwachstum-Rückmeldung „ein Riesenmolekül entsteht nie“. check-ui: `LEARN=…` spielt Lernen Kapitel für Kapitel (`data-auto`, `data-auto="last"`),
  `data-min-h` meldet zu kleine Bilder, unsichtbare Tastatur-Knöpfe (`.sr-only`) zählen nicht als Tippziel. Quiz-Paket: Stolperstein-Rückbau nur noch freiwillig
  (`missRecovery`, nur Polymere); ohne Schalter verhalten sich alle Module wie vor a51411c.
- **Polymere: Kleinigkeiten D48** – Reaktionsart-Frage „zu diesem Monomer“ bei einem Monomer; Riesenmolekül im Gefäß als Netz (kein freies Kügelchen), lange Ketten mit 14 freien
  Monomeren; Mechanismus-Bilder zeigen den Ausschnitt um die Pfeile; K3: eigener Lektionsschritt PE-HD/PE-LD (Ethen), Schritt 1 bleibt bei Propen; HDI/MDI mit Langnamen;
  PP-Frage nennt die Eigenschaft; „Die Seitengruppe bleibt – ein Benzolring“.
- **Polymere: Merksätze geben Kontext, nicht die Regel; Beispiel ≠ Aufgabe** – 30 Merksätze vor Aufgaben neu (Blickrichtung statt Regel), die Regel erscheint nach der
  richtigen Antwort (Kapitel-Schritt `rule`); Test: kein Wort der richtigen Antwort im Merksatz. Quiz-Paket: `sameTask` (freiwillig) in `createQuizStore` – das gelöste
  Beispiel unterscheidet sich von den Aufgaben der Runde; Polymere: gleiche Frage mit gleichem Bild und gleicher Lösung gilt als gleich (Test).
- **Polymere: Ordnen-Marken unter dem Bild, Überlappungstest über alle Bilder** – nach dem Prüfen stehen ✓ bzw. „richtig: ②“ (und der Name, auf niedrigen Bildschirmen im
  Blatt „Lösung“) unter der Zeichnung, Legende immer; Zähler „2 / 4“ als eigenes Element; Bilder nie schon am richtigen Platz. Test der Kettenabläufe prüft jetzt alle ruhenden
  Bilder samt Ladungszeichen: MMA abwechselnd (Estergruppen stoßen nicht mehr aneinander), Li⁺ bei Methanol aus dem Weg, Ziegler-Natta-Aktivierung, H₂ und Übergangszustand
  ohne Überlappung; Chip „MMA“ statt abgeschnittenem Namen.
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
