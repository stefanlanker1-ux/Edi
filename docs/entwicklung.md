# Entwicklung – Regeln und Konventionen

Die allgemeinen Regeln der App: wie gearbeitet wird, welche didaktischen, gestalterischen und technischen Regeln für alle Module gelten.
Die Kurzfassung mit dem Wichtigsten steht in `CLAUDE.md` im Hauptordner (lädt in Claude Code automatisch). Stand und Entscheidungen der einzelnen Module stehen
beim Modul in `modules/<id>/CLAUDE.md` (siehe „Module“ am Ende). Der frühere Änderungsverlauf liegt als Archiv in `docs/verlauf.md` (keine Pflichtlektüre). Offene Verbesserungen: `docs/offen.md`.

**Lesen:** nicht alles auf einmal, sondern die Abschnitte, die die Aufgabe berührt – Texte, Aufgaben, Rückmeldungen: „Didaktik“; Erklärung oder Lektion: „Erklärung“;
Oberfläche, Bilder, Quiz-Technik: „Regeln“; neue Pakete oder Module: „Architektur“; vor dem Commit: „Prüfen vor dem Commit“.

**Pflicht bei jeder relevanten Änderung** (neue Funktion, geänderte Regel, didaktische Entscheidung, behobener Fachfehler, neue Prüfung): im selben Commit
die betroffene Regel in diesem Dokument bzw. die `CLAUDE.md` des Moduls anpassen. Beide beschreiben immer den **aktuellen** Stand, nicht die Geschichte:
veraltete Sätze ersetzen statt ergänzen, keine Einträge „früher … jetzt …“. Was geändert wurde und **warum**, steht in der Commit-Nachricht (siehe „Commit-Nachrichten“),
nicht in einem Verlauf. Neue Anforderungen werden als neutral formulierte Regel ergänzt (was die App tun soll und warum), sobald sie umgesetzt sind.
Alles anonym und rein technisch (keine Namen, Adressen, Daten zu Personen, keine Begründung mit Personen wie „gewünscht von …“).

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
  Halbfertiges (Zwischenstand sichern) nur auf `entwicklung` pushen, nie auf `main` – was auf `main` liegt, sehen die Lernenden.
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
- **Vor jedem Commit** (Pflicht): `npm run typecheck` und die Tests der berührten Workspaces (`npm test -w @edi/<id>`, bei `packages/*` alle Module, die den Baustein nutzen);
  **vor dem Veröffentlichen auf `main`** die volle Runde `npm run typecheck && npm test && npm run build`. Bei Änderungen an der Oberfläche zusätzlich `npm run site` und Browser-Prüfung
  (siehe „Prüfen vor dem Commit“) – in allen betroffenen Ansichten, Werkzeugen, Blättern, Erklärungen und Quizaufgaben, in den Größen 390 × 844, 375 × 667, 360 × 740 und Desktop.
  Screenshots ansehen, nicht nur Zahlen messen (leere Bilder, abgeschnittene Formeln, zu kleine Zeichnungen fallen nur so auf).
- **Dokumentation gehört zur Änderung**: Regel bzw. `modules/<id>/CLAUDE.md` aktualisieren (siehe oben) – ein Commit ohne Doku-Anpassung ist nur bei
  reinen Korrekturen ohne neue Regel erlaubt. Kein Änderungsverlauf mehr in Dateien; die Geschichte steht in `git log`.
- **Commit-Nachrichten** auf Deutsch, rein technisch. **Ein Thema je Commit** (ein Modul bzw. eine Sache – so lässt sich jede Änderung einzeln zurücknehmen).
  Erste Zeile höchstens etwa 72 Zeichen, Form „<Modul oder Paket>: <was geändert wurde>“. Darunter eine Leerzeile und in ein bis drei Sätzen **warum**
  (welcher Fehler, welche Regel, welche didaktische Überlegung) – das ersetzt den früheren Änderungsverlauf.
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
- **Natürliche Sprache** (verbindlich für alle Module und alle Texte: Erklärungen, Lektionen, Kapitel, Quiz, Aufträge, Lösungswege, Rückmeldungen, Tipps, Merksätze,
  Beschriftungen im Bild, englische Fassung): Texte klingen so, wie eine gute Lehrkraft im Unterricht erklärt – ganze, fachlich korrekte Sätze, die man laut vorlesen kann.
  Formulierungen an guten Erklärungen aus Lehrbüchern und Lernseiten messen (vorher nachschlagen, wie man es üblicherweise sagt), aber nie Text übernehmen.
  Gilt für jeden neuen und jeden geänderten Text; ältere Texte, die noch nicht so klingen, beim nächsten Ändern umschreiben. Muster: Ionenbindung „Lernen“ (alle fünf Kapitel).
  - **Ganze Sätze statt Stichwortketten**: keine Reihen aus Doppelpunkt, Pfeil und Halbsätzen („Plus und Minus: Anziehung – die Ionen rücken zusammen.“),
    sondern „Plus und Minus ziehen sich an: Die beiden Ionen rücken zusammen.“ Pfeile nur in Formeln und Reaktionsgleichungen.
  - **Zusammenhänge in Worten statt als Rechnung**: keine Rechnungen mit Klammern oder Summen von Ladungen im Fließtext („(1+) + (1−) = 0“, „2 · (1−) = 2−“,
    „Gesamtladung …“), sondern „Ein Calcium-Ion hat zwei positive Ladungen. Erst zwei Chlorid-Ionen bringen zusammen zwei negative Ladungen.“
    Eine einfache, eingeführte Beziehung darf als kurze Rechnung im Satz stehen („Die Ladung ist Protonen minus Elektronen: 11 − 10 = 1+.“).
  - **Keine Zeichen, die wie Rechenzeichen wirken**, als Trenner: „11 Protonen, 10 Elektronen“, nie „11 p⁺ · 10 e⁻ → 1+“ (der Punkt liest sich als Malzeichen).
  - **Keine schiefen Gleichnisse und keine Modell-Maße als Sache**: Ein Modell nicht zum Gegenstand machen („Baue eine neutrale Wand“, „Ca²⁺ ist 2 breit“) –
    das Bild darf eine Größe darstellen, der Text spricht über die Sache selbst (Ionen, Ladungen, Atome).
  - **Aufträge als natürliche Aufforderung oder Frage**: ohne Etiketten, die schon über der Folie stehen („Jetzt du:“, „Ergänze:“), ohne „Dann prüfe.“ (der Knopf sagt es)
    und ohne Bedienungsjargon („Nimm mit „e⁻ aufnehmen“ Elektronen auf, bis …“): „Füge dem Sauerstoff-Atom 2 Elektronen hinzu – dann hat es 8 Außenelektronen.“,
    „Bringe die Lampe zum Leuchten.“
  - **Nichts doppelt**: „Ca steht in der II. Hauptgruppe.“ statt „Calcium Ca steht …“ (Name und Formel zusammen nur bei Stoffen, siehe „Stoffe immer mit Name und Formel“).
  - **Rückmeldungen** als freundliche ganze Sätze: erst der Denkfehler mit den Zahlen der Aufgabe, dann der richtige Weg („Zwei O²⁻ bringen vier negative Ladungen,
    das Mg²⁺ nur zwei positive. Hier ist zu viel negative Ladung.“). Auch Zustandszeilen im Bild in Worten („noch nicht ausgeglichen: 2 positive, 4 negative Ladungen“).
  - Beispiele (vorher → nachher):

    | Vorher | Nachher |
    |---|---|
    | **Gesamtladung**: (1+) + (1−) = 0. | Die positive Ladung von Na⁺ und die negative Ladung von Cl⁻ gleichen sich aus. |
    | Ca²⁺ ist 2 breit, Cl⁻ ist nur 1 breit. | Ein Calcium-Ion Ca²⁺ hat zwei positive Ladungen. Ein Chlorid-Ion Cl⁻ hat nur eine negative Ladung. |
    | Jetzt du: Baue eine neutrale Wand aus Mg²⁺ und O²⁻ – mit möglichst wenigen Bausteinen. | Magnesiumoxid besteht aus Mg²⁺ und O²⁻. Gleiche die Ladungen der Kationen und Anionen aus – mit möglichst wenigen Ionen. |
    | Stelle einen Zustand ein, in dem die Lampe leuchtet. Dann prüfe. | Bringe die Lampe zum Leuchten. |
    | Aus S²⁻ und 4 O²⁻ käme: 2− + 4 · (2−) = 10−. | Ein S²⁻ und vier O²⁻ hätten zusammen zehn negative Ladungen. |
    | Rückmeldung: Magnesium ist noch neutral (12 p⁺ · 12 e⁻ → neutral). | Rückmeldung: Das ist noch das neutrale Magnesium-Atom. Lass es seine Außenelektronen abgeben. |
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
- **Drei Ebenen der Chemie**: jede Darstellung verbindet zwei Ebenen – Stoff/Alltag ↔ Teilchen ↔ Symbol (Bohrmodell ↔ Atomsymbol, Ionen-Bausteine ↔ Formel,
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
  mit den Bausteinen der App (Bohrmodell, PSE, Ionen-Bausteine, Lewis-Formel, Teilchenbild, Pfeilkette, Orbitale in 3D …).
  Falsch → Rückmeldung zum Denkfehler (`why`, **jede** falsche Auswahl hat eine), sonst Denkanstoß zum Vorgehen (`tip`, Pflicht bei Zahl und Antippen, nennt die Lösung nicht);
  ab dem 2. Versuch Rückmeldung + Tipp, dazu „Versuch x von 4“; nach 4 Versuchen wird die Lösung markiert (`show`, gestrichelt grün, pulsierend) und muss selbst angetippt werden.
  Richtig → ✓, der Schritt bleibt stehen, die Bestätigung (`ok`) nennt die Regel mit dem Beispiel („Massenzahl = Protonen + Neutronen = 7 + 7 = 14“), nicht nur das Ergebnis.
- **Zurück** (alle Erklärungen, Lektionen und Kapitel): unter dem Text steht immer eine Leiste (`.ui-guide-foot`) mit „Zurück“ links, den Hilfsmitteln (falls übergeben)
  und „Nächster Schritt“ bzw. „Weiter“ rechts; schmal (< 480 px) stehen die Hilfsmittel in der ersten Zeile, „Zurück“ und „Weiter“ gemeinsam darunter. „Zurück“ zeigt den
  vorigen Schritt **gelöst** (ganzer Lösungsweg, Bestätigung, „Weiter“, Modelle im gelösten Zustand) – zum Nachlesen, nicht zum neu Lösen; auf dem ersten Schritt
  ausgegraut, auf der Seite „Das kannst du jetzt“ zurück zum letzten Schritt. Jeder Knopf hat seinen festen Platz (nichts rückt, wenn „Weiter“ erscheint).
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
- Keine Planungs-, Strategie-, Geschäfts- oder Protokolldateien, keine Zeitpläne (einzige Ausnahme: `docs/offen.md`, eine rein technische Liste offener Verbesserungen ohne Termine und Namen); das Repository enthält Quellcode, Tests und technische Dokumentation (dieses Dokument
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
  Kombination) und `wrapTools` (Werkzeugleiste fest zweireihig), Erklärung: unsichtbare „Geister“ des größten Zustands je Folie (`.ui-guide-ghost`; nur solange das Bild dadurch höchstens 10 % kleiner wird,
  sonst `data-noghost`: Bildhöhe vom Anfang der Folie fest, Text scrollt), `Fit` behält die Lage,
  wenn nur der Rahmen sich ändert. Prüfung: `scripts/check-ui.mjs` vergleicht vor/nach jeder Bedienung die Kästen (immer an, `WANDER=0` aus; gewollte Bewegung
  `data-anim`/`data-moves`, neue Ansicht `data-screen`; `ERKLAERUNG=1` spielt alle Erklärungen; bekannte Ausnahmen mit Grund in `KNOWN`, Ausgabe „bekannt: …“ –
  derzeit Kästchenschema der Atombau-Erklärung Level II am Handy 19–40 px).
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

## Module
Stand, Aufbau und fachliche Entscheidungen jedes Moduls stehen beim Modul in `modules/<id>/CLAUDE.md` (lädt in Claude Code automatisch, sobald im Modulordner gearbeitet wird).
Verweise wie „siehe Ionenbindung“ meinen diese Dateien.

- Gemische: `modules/gemische/CLAUDE.md`
- Atombau: `modules/atombau/CLAUDE.md`
- Ionenbindung: `modules/ionenbindung/CLAUDE.md`
- Elektronenpaarbindung: `modules/elektronenpaarbindung/CLAUDE.md`
- Reaktionsgleichungen: `modules/reaktionsgleichungen/CLAUDE.md`
- Neutralisation: `modules/neutralisation/CLAUDE.md`
- Nomenklatur: `modules/organik/CLAUDE.md`
- Polymere: `modules/polymere/CLAUDE.md`
- Einheiten: `modules/einheiten/CLAUDE.md`

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
