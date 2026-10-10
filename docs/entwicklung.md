# Entwicklung – Regeln und Konventionen

Die allgemeinen Regeln der App: wie gearbeitet wird, welche didaktischen, gestalterischen und technischen Regeln für alle Module gelten.
**Maßstab** für Sprache, Didaktik, Interaktivität, Oberfläche und Code ist das Modul **Ionenbindung** (`modules/ionenbindung/`, Stand in `modules/ionenbindung/CLAUDE.md`).
Die Kurzfassung mit dem Wichtigsten steht in `CLAUDE.md` im Hauptordner (lädt in Claude Code automatisch). Stand und Entscheidungen der einzelnen Module stehen
beim Modul in `modules/<id>/CLAUDE.md` (siehe „Module“ am Ende). Der frühere Änderungsverlauf liegt als Archiv in `docs/verlauf.md` (keine Pflichtlektüre). Offene Verbesserungen: `docs/offen.md`.

**Lesen:** nicht alles auf einmal, sondern die Abschnitte, die die Aufgabe berührt – Texte, Aufgaben, Rückmeldungen: „Didaktik“; Kapitel und Folien: „Lernen“;
Oberfläche und Bilder: „Regeln“; neue Pakete oder Module: „Architektur“; vor dem Commit: „Prüfen vor dem Commit“.

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
  - **Fachlich und gegenständlich richtig wie im Labor**: Geräte so zeichnen, wie man sie kennt (Becherglas mit Batterie, Schalter und Lampe; Kristall im Tiegel).
    Was ein Vorgang ausmacht, muss im Bild **sichtbar passieren** (das Außenelektron fliegt im Bogen auf den freien Platz, der Kristall bricht entlang einer glatten Ebene,
    in der Schmelze wandern die Ionen zu den Polen) – nie nur angedeutet.
  - **Detailreich, aber klar**: lieber eine Zeichnung mehr Mühe als eine Skizze; Bewegungen flüssig und physikalisch plausibel (Fallen beschleunigt,
    Teilchen bleiben erhalten, nichts springt, nie Ein- oder Ausblenden mitten im Bild). Beschriftungen, Legenden und Messwerte dort, wo sie das Verstehen erleichtern.
  - **Selbst prüfen, bevor etwas gezeigt wird**: jede Zeichnung zu mehreren Zeitpunkten rendern (z. B. t = 0 / 0,15 / 0,35 / 0,6 / 1) und die Screenshots
    kritisch ansehen: Würde eine Lehrkraft das Gerät sofort erkennen? Sieht ein Schüler, was passiert? Wirkt es hochwertig? Wenn nicht: nachbessern, bevor veröffentlicht wird.
  - Stil bleibt der der App (Linien statt Flächen, Farben nur aus der Palette), aber „schlicht“ heißt nie „lieblos“.
- **Vor jedem Commit** (Pflicht): `npm run typecheck` und die Tests der berührten Workspaces (`npm test -w @edi/<id>`, bei `packages/*` alle Module, die den Baustein nutzen);
  **vor dem Veröffentlichen auf `main`** die volle Runde `npm run typecheck && npm test && npm run build`. Bei Änderungen an der Oberfläche zusätzlich `npm run site` und Browser-Prüfung
  (siehe „Prüfen vor dem Commit“) – in allen betroffenen Ansichten, Werkzeugen, Blättern und Folien, in den Größen 390 × 844, 375 × 667, 360 × 740 und Desktop.
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
- **Bereiche Lernen | Experimentieren**: „Lernen“ besteht aus **Kapiteln** zu je 25 Folien – Erklärung und Aufgaben in einem Fluss, mindestens die Hälfte
  Modell-Folien (siehe „Lernen“); „Experimentieren“ ist die Werkbank (selbst bauen, zeichnen, vorgegebene Beispiele lösen). Keine eigenen Übungsseiten,
  kein Quiz, keine eigene Erklärung. **Bausteine des Lernens, die mehr als ein Modul nutzt, liegen zentral in `packages/`**
  (spätestens beim zweiten Modul dorthin verschieben, nicht im Modul kopieren); jede Änderung an einem solchen Baustein wird in allen Modulen geprüft, die ihn nutzen.
- **Lernen an gelösten Beispielen, dann Hilfe ausblenden** – überall nach demselben Muster: zuerst ein **fertig gelöster Fall** (vorgemacht, Lösungsweg Schritt für Schritt),
  dann ein **halb gelöster** (eine Lücke zum Ergänzen), dann **selbst lösen** – und mit dem nächsten Gedanken wieder von vorn (vorgemacht → halb → frei → vorgemacht …).
  Nie mit freiem Entdecken beginnen. Umsetzung:
  - Lernen: Folienarten `worked` / `faded` / `free` in jedem Abschnitt (siehe „Lernen“), automatisch geprüft.
  - Werkbank: Start mit einem gelösten Zustand (Ionenbindung startet mit fertigem CaCl₂); Hilfen zum Selbsttun statt Abfragen
    (Statusmarke „+ Chlorid-Ion“ zeigt, welches Ion noch fehlt, „kürzen auf 1 : 2“, wenn es mit weniger Ionen geht).
- **Begriffe einführen, bevor sie gebraucht werden.** Jedes Fachwort, das in einer Frage, Antwort, einem Tipp oder einer Rückmeldung vorkommt, muss vorher
  **fett** eingeführt sein – in einer früheren Folie, einem früheren Kapitel oder einem früheren Modul. Nie ein Wort wie „Ionenverbindung“ oder „Index“
  benutzen, ohne es mit Beispiel zu erklären („Einen Stoff aus Kationen und Anionen nennt man **Ionenverbindung**.“). Begriffe aus früheren Modulen oder dem Alltag in `GuideDef.known`.
  `checkGuide` prüft das für die Folien automatisch; Merksätze (Hilfsmittel „Erklärung“) beim Ändern selbst prüfen.
- **Einheitliche Fachsprache** in Werkbank, Folien, Merksätzen und Lösungsweg (ein Begriff, nie zwei für dasselbe; z. B. immer „Außenelektronen“).
- **Einfache Sprache**: kurze Sätze (höchstens 22 Wörter, geprüft), Du-Form, aktiv, ein Gedanke pro Satz. Keine Erklärsätze in der Oberfläche (nur kurze `Tag`s);
  Erklärungen gehören in Folien, Merksätze, Tipps und Rückmeldungen.
- **Natürliche Sprache** (verbindlich für alle Module und alle Texte: Folien, Kapitel, Aufträge, Lösungswege, Rückmeldungen, Tipps, Merksätze,
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
- **Diagnostische Distraktoren**: jede falsche Antwort und jedes typische Fehl-Ergebnis im Modell steht für eine typische Fehlvorstellung und bekommt eine eigene
  Rückmeldung (`why`) mit den Zahlen der Aufgabe.
- **Tipps und Hilfsmittel verraten die Lösung nie** (PSE nur mit Angaben eines gedruckten PSE: Z, Gruppe, Periode, Atommasse; keine Animation, die die gesuchten
  Zahlen zeigt, vor der Antwort).
- **Stoffe immer mit Name und Formel**: Schüler kennen die Stoffe noch nicht. Jeder genannte Stoff steht mit Formel da („Natriumchlorid NaCl“, „Wasser H₂O“),
  und unter jedem Teilchenbild einer Folie steht eine Legende (Teilchen + Name + Formel), damit klar ist, welches Teilchen zu welchem Stoff gehört.
- **Modell statt Eintippen**: Aufgaben möglichst im Modell lösen – verändern (Elektronen abgeben, Ionen dazugeben, Index einstellen), im Bild antippen, auswählen.
  Zahlen und Text nur ausnahmsweise eintippen lassen; gezählt wird im Modell (Teilchen antippen, Zähler einstellen). Folien zeigen den Vorgang als Bild
  oder Animation (z. B. Elektronenübergang, zerbrechender Kristall, Ionen in der Schmelze).
- **Animationen kurz und wiederholbar**: ein vorgemachter Ablauf spielt einmal ab, „Nochmal abspielen“ wiederholt ihn; reduzierte Bewegung respektieren
  (`useReducedMotion`: dann gleich das Endbild bzw. ein ruhiges Standbild).
- **Modell ehrlich kennzeichnen**: Vereinfachungen im Modell benennen („Ausschnitt, vergrößert“, „Im Schalenmodell hat jede Schale eine feste Größe. Die echte Größe
  der Ionen zeigt es nicht.“), fachlich nie Falsches zeigen. Fachliche Richtigkeit geht vor Einfachheit (z. B. Wasser gewinkelt, Ionen im Verhältnis der Ionenradien).
- **Nicht überladen**: Funktionen nur dort, wo sie gebraucht werden; Oberstufen-Inhalte nur in Level II; ein Hauptknopf je Ansicht.
- **Barrierearm**: richtig/falsch nie nur über Farbe (zusätzlich ✓/✗, Muster, gestrichelt), Tippziele ≥ 44 px, Tastatur bedienbar, `aria-label` für Bilder und Knöpfe,
  Schalter „Lesbar“ (mehr Abstände), Klang standardmäßig aus, „Zum Inhalt springen“ setzt nur den Fokus (die Adresse bleibt).

## Lernprinzipien, Motivation, Oberfläche (Begründung der Regeln)
Die Regeln oben folgen gut belegten Wirkprinzipien. Bei neuen Funktionen danach entscheiden:
- **Abrufen schlägt Wiederlesen**: jede Folie, die nicht vorgemacht ist, verlangt eine Handlung; Erklärtexte sind kurz (ein, zwei Sätze je Folie).
- **Rückmeldung erklärt, statt nur zu bewerten**: nach Fehlern der Denkfehler, ab dem zweiten Versuch dazu der Tipp, nach vier Versuchen die Lösung;
  nach Treffern ✓ und eine Bestätigung, die die Regel am Beispiel nennt – nie ein Lob der Begabung.
- **Lösungsbeispiele mit Ausblenden** (vorgemacht → halb → selbst) und **Vorhersagen vor dem Beobachten** (erst vermuten, dann Animation/Modell ansehen, dann erklären).
- **Wenig fremde Last**: eine Bühne, ein Bereich, keine Erklärsätze in der Oberfläche, Rot nur für das Wesentliche, Inhalte in kleine Abschnitte geteilt.
- **Drei Ebenen der Chemie**: jede Darstellung verbindet zwei Ebenen – Stoff/Alltag ↔ Teilchen ↔ Symbol (Ionen-Bausteine ↔ Formel, Salzkristall ↔ Lupe ↔ Ionen,
  Becherglas ↔ Lupe, Stoffprobe ↔ Formel). Nie nur auf der Symbolebene bleiben.
- **Fehlvorstellungen sind der Inhalt**: typische Schülerfehler (Atom „will“ ein Oktett, Ionen als Moleküle, das Elektron verschwindet, Ionen entstehen einzeln …)
  werden gezielt als falsche Antworten angeboten und in der Rückmeldung beim Namen genannt.
- **Fortschritt sichtbar**: jedes Kapitel zeigt seinen Fortschritt (Balken, „Folie n“, „✓ fertig“); Fortschritt ist der wichtigste Motivator.
- **Kurze Einheiten**: Abschnitte mit höchstens 8 Folien, jederzeit unterbrechbar (ein Kapitel öffnet an der zuletzt gezeigten Folie); erster Erfolg in der ersten Minute
  (keine Anmeldung, keine Einführungsfolien – das Modul öffnet mit der Werkbank im gelösten Zustand).
- **Motivation ohne Manipulation**: Fortschritt statt Punkte, keine Tagesserie, keine Ranglisten, keine Ligen, keine „Leben“, keine Verlust- oder Schuldnachrichten,
  kein Zeitdruck, keine leidende Figur, keine Werbung, keine Konten, keine Tracker.
- **Selbstbestimmung**: Level und Kapitel sind Angebote, keine Pflicht (jedes Kapitel lässt sich jederzeit öffnen).
- **Zugänglichkeit**: Kontrast ≥ 4,5 : 1, Zeilenabstand großzügig, keine Kursivschrift im Fließtext, Bewegung reduzierbar, „Lesbar“ (größere
  Abstände), einfache Sprache (Fachwort + Alltagswort), richtig/falsch nie nur über Farbe.
- **Ein Aha-Moment je Modul** (Ionengitter in 3D drehen, Ionen in der Schmelze wandern sehen, Kristall zerbricht) – im Fluss der Kapitel, zum Ausprobieren.

## Prüfmethoden (bewährt)
- **Richtig lösen im Browser**: jede Folie jedes Kapitels (beide Stufen) im Browser richtig lösen – muss ✓ geben (fängt Fehler zwischen Daten und Modell).
- **Falsch lösen**: jede falsche Auswahl und jedes typische Fehl-Ergebnis liefert eine Rückmeldung, nach vier Fehlversuchen steht die Lösung da, nichts läuft über.
- **Neuladen und Zurück**: Neuladen mitten im Kapitel öffnet an derselben Folie; Stufenwechsel verliert nichts; „Zurück“ schließt jedes Blatt
  (im Browser und mit der Zurück-Taste der Android-App).
- **Kapitel durchspielen** (alle Folien, alle Größen), **Animationen** bis zum Ende laufen lassen und Zwischenbilder ansehen (Sprünge, Zittern, Überlappungen).
- **Texte durchsehen**: alle Texte eines Kapitels ausgeben und lesen (Grammatik, Einzahl/Mehrzahl, Artikel, nicht eingeführte Begriffe, englische Fassung).
- Neue Prüfungen, die einen echten Fehler gefunden haben, als Test ins Repository übernehmen.

## Lernen (Kapitel aus Folien; `@lern/ui` `Guide`, je Modul `src/lernen/`)
- „Lernen“ zeigt die Kapitel der Stufe als Karten (Nummer, Titel, ein Satz, Fortschrittsbalken, „Folie n“ bzw. „✓ fertig“); Level I und Level II haben eigene Kapitel,
  Level II baut auf Level I auf. Antippen öffnet das Kapitel als `Guide` im Vollbild: Kennzeichen „Kapitel n“ (`badge`), Start an der zuletzt gezeigten Folie
  (`start`/`onStep`, Fortschritt in localStorage über `progressKey`), am Ende weiter zum nächsten Kapitel (`finishLabel`/`onFinish`).
  Ganzer Bildschirm, nie scrollen; wächst der Text (Rückmeldung, Lösungsweg) über den Bildschirm, wird die Folie enger (`data-fit`, gemessen an den Kästen
  von Bild und Text, nicht an Einblend-Verschiebungen), zuletzt behält das Bild 72 px und der Text scrollt – nie unten abgeschnitten.
- Aufbau: `GuideDef { title, steps, outro, known? }`. Ein Kapitel = **25 Folien** in Abschnitten (`part` an der ersten Folie, Name im Kopf, Fortschrittsbalken in Abschnitten),
  jeder Abschnitt höchstens 8 Folien. Ende: Zusammenfassung „Das kannst du jetzt“ (`outro`). Zu jedem Abschnitt Merksätze für das Hilfsmittel „Erklärung“
  (nennen Regeln mit Beispiel, nie die Antwort einer Folie).
- **Folienarten** (`mode`, Pflicht bei jeder Folie; Kennzeichen oben: „Vorgemacht“ / „Halb gelöst – ergänze“ / „Jetzt du“):
  - `worked`: Lösungsweg `lines` erscheint Zeile für Zeile („Nächster Schritt“), Bild im gelösten Zustand, **keine** Antwort, keine `options`/`num`/`why`/`tip`, Pflicht `ok`.
  - `faded`: Lösungsweg mit **genau einer Lücke** `{?}`; die Lücke darf die gesuchte Zahl nicht schon enthalten; nach dem Lösen wird sie gefüllt.
  - `free`: selbst lösen; `lines` (optional) erscheinen erst nach der richtigen Antwort.
  - Reihenfolge: jeder Abschnitt (und die erste Folie) beginnt `worked`; `faded` nur nach `worked`/`faded`; `free` nur nach `faded`/`free`.
- **Modell-Folien** (mindestens 13 von 25): Schüler verändern das Modell (Bohrmodell, Ionen-Bausteine, Formel- und Namens-Baukasten, Gitter …), die Änderung ist
  **sofort** zu sehen; „Prüfen“ meldet das gebaute Ergebnis als Text (`c.pick`), die Folie vergleicht mit `answer` und gibt zu typischen Fehl-Ergebnissen eine eigene
  Rückmeldung (`why`). Nach vier Fehlversuchen steht die Lösung im Modell, der Schüler prüft selbst; gelöste und vorgemachte Modelle sind gesperrt.
  Bausteine: `model`, `useModel`, `ModelFrame` (Modell, Bedienung, „Prüfen“) in `modules/ionenbindung/src/lernen/model.tsx`.
- Jede nicht vorgemachte Folie verlangt eine Handlung: eine Änderung im Modell (Modell-Folie), eine Auswahl (`options`), eine Zahl (`num`, mit Einheit; Trennzeichen wie in der Sprache – `readNumber` in `@lern/i18n`:
  Deutsch „1.000“ = 1000 und „0,25“, Englisch „1,000“ und „0.25“, Leerzeichen-Gruppen immer; `checkGuide` prüft, dass jede übliche Schreibweise der Antwort als richtig gilt)
  oder ein Ziel im Bild antippen (`visual` ruft `pick(id)`) – mit den Bausteinen der App (Bohrmodell, PSE, Ionen-Bausteine, Ionengitter …).
  Falsch → Rückmeldung zum Denkfehler (`why`, **jede** falsche Auswahl hat eine), sonst Denkanstoß zum Vorgehen (`tip`, Pflicht bei Zahl, Antippen und Modell, nennt die Lösung nicht);
  ab dem 2. Versuch Rückmeldung + Tipp, dazu „Versuch x von 4“; nach 4 Versuchen wird die Lösung markiert (`show`, gestrichelt grün, pulsierend) und muss selbst angetippt
  bzw. im Modell geprüft werden.
  Richtig → ✓, die Folie bleibt stehen, die Bestätigung (`ok`) nennt die Regel mit dem Beispiel („Zwei Na⁺ bringen zwei positive Ladungen und gleichen so ein O²⁻ aus.“), nicht nur das Ergebnis.
- **Hilfsmittel jeder Folie** (`tools` an `Guide`): **PSE** (Elemente der Folie markiert, `pseTool` mit `elementsIn(text)`), **Tipp** (`tip` der Folie, kostet nichts),
  **Erklärung** (Merksätze des Abschnitts). Sie stehen mit „Nächster Schritt“/„Weiter“ in der Leiste unter dem Text (`.ui-guide-foot`), jedes öffnet ein Blatt über dem Kapitel.
- **Zurück**: unter dem Text steht immer eine Leiste (`.ui-guide-foot`) mit „Zurück“ links, den Hilfsmitteln
  und „Nächster Schritt“ bzw. „Weiter“ rechts; schmal (< 480 px) stehen die Hilfsmittel in der ersten Zeile, „Zurück“ und „Weiter“ gemeinsam darunter. „Zurück“ zeigt die
  vorige Folie **gelöst** (ganzer Lösungsweg, Bestätigung, „Weiter“, Modelle im gelösten Zustand) – zum Nachlesen, nicht zum neu Lösen; auf der ersten Folie
  ausgegraut, auf der Seite „Das kannst du jetzt“ zurück zur letzten Folie. Jeder Knopf hat seinen festen Platz (nichts rückt, wenn „Weiter“ erscheint).
- Neue Ideen in `say` (ein, zwei kurze Sätze), Auftrag in `ask`. Fachwörter beim ersten Auftreten **fett** (das ist zugleich die Einführung für die Begriffsprüfung).
- Beschriftung mit Pfeilen (`labels`, Baustein `Callouts`): Begriff am Rand, Pfeil auf ein Teil des Bildes (CSS-Selektor, z. B. `.ion-tile.cation`, `.k2-idx`);
  ohne `nth` das Teil, das der Seite am nächsten liegt; weicht Schrift im Bild aus (`AVOID`).
  Nie die gesuchte Antwort beschriften, außer mit `afterSolved` (erscheint erst nach der richtigen Antwort).
- Automatische Prüfung je Modul (Ionenbindung: `src/lernen/kapitel.test.ts`; `checkGuide` in `packages/ui/src/guideCheck.ts`): 25 Folien, mindestens 13 Modell-Folien
  (prüfbar: Antwort, Bild, Tipp), Merksätze je Abschnitt, richtige Auswahl an wechselnden Plätzen (höchstens 40 % an Platz 1), Reihenfolge der Folienarten, Lösungsweg bzw. Lücke,
  Antwort unter den Auswahlen, Rückmeldung zu jeder falschen Auswahl, Tipp bei Zahl/Antippen (ohne die gesuchte Zahl), Sätze ≤ 22 Wörter,
  **Begriffe** (`unintroducedTerms`: ein abgefragtes Fachwort muss vorher fett stehen oder in `known`; falsche Auswahlen, die erst später eingeführt werden, dürfen nicht vorher vorkommen).
  Englische Fassung im selben Test (alle Texte übersetzt, gleiche Regeln, nichts Deutsches).
- Browser-Prüfung jedes geänderten Kapitels: alle Folien durchspielen (auch Fehlversuche bis zur markierten Lösung), auf jeder Folie prüfen, dass nichts überläuft
  oder abgeschnitten ist, in 1240 × 860, 390 × 844 und 375 × 667 (`KAPITEL=1`, siehe „Prüfen vor dem Commit“).

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
- **Arbeitsteilung der Agenten**: siehe `docs/agenten.md` (Rollen, Prüfkette Fach – Gestaltung – Realität, Sofort-Warnung).
- **Experimentieren stellt nie Fragen** – keine Vorhersage-, Auswahl- oder Richtig/falsch-Fragen, kein ✓/✗ zu einer Antwort, keine Punkte. Experimentieren ist freies
  Ausprobieren: Aktion wählen → ansehen; Zustand nur als kurze Kennzeichen (z. B. „✓ neutral“, „kürzen auf 1 : 2“ – sie beschreiben den Zustand der Werkbank,
  bewerten keine Antwort und vergeben keine Punkte), Begründungen auf Abruf (Baustein antippen → Blatt mit Atom und Ion). Fragen, Vorhersagen und Rückmeldung zu Antworten
  gehören ausschließlich in **Lernen**.
- **Bereichsleiste in allen Modulen gleich** (Handy unten, ab 900 px oben in der Kopfzeile): **Lernen | Experimentieren** – „Lernen“ („Learn“) mit Zeichen Buch (`book`),
  „Experimentieren“ („Experiment“) mit Zeichen Becherglas (`beaker`), egal ob gebaut, gezeichnet, umgerechnet oder ausgeglichen wird. Alle Einträge gleich gestaltet
  (Zeichen + Wort, aktiver Bereich mit rotem Strich). Tab-Kennungen und Speicher-Schlüssel nie umbenennen (Ionenbindung: `quiz` = Lernen, `build`).
  Der beim Öffnen gezeigte Bereich ist die Werkbank.
- React 19 + TypeScript (strict) + Vite. State mit zustand. Keine weiteren UI-Frameworks.
- Gemeinsames gehört in `packages/`; Module importieren `@lern/*` (Quelltext wird direkt gebündelt, kein eigener Build-Schritt für Pakete).
- Baukasten – neue Module nur aus gemeinsamen Teilen: Build der App über `appConfig(…)` (`scripts/app-vite.ts`, PWA + Einzeldatei + `lizenzen.txt`
  über `scripts/licenses.ts`; in der Übersicht öffnet „Lizenzen“ ein Blatt – Web und Handy-App lesen `lizenzen.txt`, die Einzeldatei den Kommentar am Dateiende), `App.tsx` des Moduls = `<LernApp name logo tabs tab onTab storage stufe?>` (`@lern/ui`: Link zur Übersicht,
  Stufen-Umschalter, Beamer, Farbschema – nicht im App-Store halten; Beamer und Stufe werden beim Verlassen des Moduls am Dokument aufgeräumt).
  PSE überall als `pseTool({ stufe, mark })` (`@lern/chem-ui`) in den `tools` von Werkbank und Folien.
- Oben links in jedem Modul ein **Home-Knopf** (Haus, 44 px, zur Übersicht; `HomeLink` der Hülle) an Stelle des Modul-Symbols – das Symbol steht nur noch,
  wenn ein Modul allein gebaut ist (ohne `HomeLink`), und in der Übersicht. Kopfzeile hat automatisch den Klang-Schalter (`@lern/ui` `feedback.ts`: `ding(ok)` nur wenn eingeschaltet, Standard aus; Vibration `buzz` immer)
  und den Schalter „Lesbar“ (`readable.ts`, localStorage `lern-lesbar`, Attribut `data-lesbar` auf `<html>`, Stile in `tokens.css`: mehr Buchstaben-/Wort-/Zeilenabstand; Überschriften unverändert;
  am Handy (≤ 640 px) ausgeblendet, außer er ist eingeschaltet – dann bleibt er zum Ausschalten sichtbar). Browser-Prüfung `scripts/check-ui.mjs` zusätzlich mit `LESBAR=1` laufen lassen.
- Auffangnetz: `AppShell` fängt Abstürze einer Ansicht ab (`Rescue`, Karte „Hier hakt etwas.“); jedes Modul übergibt `storage` = seine localStorage-Schlüssel (Werkbank + Lernen),
  „Neu starten“ setzt zuerst nur die Werkbank zurück; Fortschritt bleibt – welche Schlüssel Fortschritt sind, ist **ausdrücklich gekennzeichnet**
  (jeder Fortschritts-Store ruft `progressKey(schlüssel)` auf, z. B. `ionenbindung-lernen`). Stürzt dieselbe App
  innerhalb von 10 Minuten nach einem „Neu starten“ wieder ab, setzt das nächste alles dieser App zurück (Merkzeichen je App in sessionStorage, Test `rescue.test.ts`) –
  außer Schlüsseln, die mehrere Module teilen (`progressKey(k, true)`): die bleiben, solange sie lesbar sind.
- Mobile first: keine horizontale Seiten-Scrollbar bei 390 px, Tippziele ≥ 44 px, Pointer Events zum Ziehen.
- Farben nur über Design-Tokens (`packages/ui/src/styles/tokens.css`, modulspezifisch in `app.css`), hell und dunkel.
- Design: Swiss Style – Weiß/Schwarz, ein Rot (`--signal`) nur als Auszeichnung (Kartentitel, aktiver Tab, Kennziffern), Schrift Inter (lokal: `packages/ui/src/fonts/inter.woff2`, erzeugt mit `scripts/inter-subset.py` aus `inter-ui` – Latein, Griechisch,
  hoch-/tiefgestellte Ziffern, Pfeile). Immer mit `cv05` (l mit Bogen) und `cv08` (I mit Serifen), damit Cl und CI, Il, 1l unterscheidbar sind.
  Keine Verläufe, keine Schatten in der Oberfläche (nur Kugeln in räumlichen Modellen haben Licht und Schatten, z. B. das Ionengitter in 3D), kleine Radien (`--radius*` 3–4 px),
  Linien statt Flächen. Hauptknöpfe/Auswahl schwarz (`--accent`). Fachfarben nur aus der gemeinsamen Palette
  in `tokens.css` (`--hue-red|blue|yellow|green|grey|violet|teal|orange`, je `-soft` für Flächen und `-deep` für Schrift; dezent kräftig, nie grell; Beamer satter):
  Proton/O/H⁺ rot, Elektron/N/OH⁻ blau, Neutron hellgrau, Kation/S gelb, Anion/Cl grün, Alkalimetalle violett, Erdalkalimetalle grünblau, P/Halbmetalle orange.
  Signalrot nur für die Oberfläche. ✓ immer grün (`--ok`), nie rot.
- **Nie scrollen** (Handy 390 × 844 und 375 × 667, Desktop): jede Ansicht füllt genau den Bildschirm (`--screen-h`, Klasse `ui-screen`).
  Freies Ausprobieren = `Workbench` (`@lern/ui`): Bühne füllt den Platz, Hauptbedienung direkt darunter (`controls`), alles Weitere in der Werkzeugleiste (`tools`) –
  am Handy öffnet jedes Werkzeug ein Blatt („Zurück“ im Browser schließt es: `useBackClose`, eigener Verlaufseintrag mit neuer Kennung je Öffnen; ein Blatt über einem
  Blatt bzw. über einem Kapitel schließt nur sich; Schließen und Öffnen im selben Durchlauf übernimmt den Eintrag statt ihn zurückzunehmen; ein Eintrag, der vom
  Neuladen stehen blieb, wird beim Start einmal zurückgenommen – Tests `back.test.ts`), breit (≥ 900 px) stehen die Werkzeuge als Register daneben. Nie mehrere Bereiche gleichzeitig offen.
  **Android-Zurück-Taste** (`apps/edi/src/native.ts`, `@capacitor/app`): geht im Verlauf der WebView zurück wie „Zurück“ im Browser – schließt also ein offenes Blatt
  bzw. das Kapitel und führt vom Modul zur Übersicht; erst ohne Verlauf (Startseite) beendet sie die App (`App.exitApp()`). Der Listener ist nötig: ohne ihn ginge
  `@capacitor/app` zwar zurück, bliebe am Anfang aber wirkungslos stehen. Der Code wird nur in der Android-App nachgeladen (im Web nie, die Einzeldatei enthält ihn nicht). Test `apps/edi/test/native.test.ts`.
  Beschriftungen der Werkzeugleiste nie abgeschnitten: passt eine nicht in ihre Spalte (schmales Handy, Englisch, „Lesbar“), stehen die Werkzeuge in zwei Reihen (`Workbench` misst, `data-wrap`).
  Lesetext (Folie, Rückmeldung, Merksatz, `Tag`) ≥ 14 px.
  Zeichnungen passen sich per Container-Einheiten (`cqw`/`cqh`) oder `Fit` ein, statt zu scrollen oder abgeschnitten zu werden. PSE mit `fit` (ganzes PSE sichtbar).
- **Schalenbesetzung ausgeschrieben** (alle Apps): nie „2 · 8 · 1“ (sieht aus wie eine Rechnung: 2 · 8 · 8 = 128), sondern „1. Schale: 2 Elektronen“, „2. Schale: 8 Elektronen“,
  „3. Schale: 1 Elektron“ (Zeilen untereinander; im Satz „1. Schale 2, 2. Schale 8, 3. Schale 1 Elektron“).
- **Elektronen im Schalenmodell sehen alle gleich aus**: keine Ringe oder hellen Kerne für aufgenommene Elektronen – was sich ändert, sagen Text und Zahl;
  keine hellblaue Hinterlegung hinter dem Atom, die sich mit ändert.
- **PSE**: Das kleine PSE (Unterstufe, Hauptgruppen I–VIII bis Calcium) bleibt, wie es ist – nichts daran ändern. Lanthanoide, Actinoide und die 7. Periode nur im großen PSE
  von **Atombau** (Tab „Periodensystem“, Level II); PSE-Hilfe der Module und Ionenbindung Kapitel 5 zeigen sie nicht.
- **Elektronegativität nach Allred-Rochow** (alle Module): Tabellen, PSE-Trend, Steckbrief, Rechnungen und Texte nutzen nur Allred-Rochow-Werte
  (nie Pauling). Polare Bindung ab **ΔEN ≥ 0,5**; darunter unpolar bzw. „schwach polar“ (0 < ΔEN < 0,5, ohne C–H).
- **Nichts wandert** (alle Apps): Bilder, Modelle, Karten und Steuerleisten bleiben beim Bedienen an ihrem Platz – auch wenn sich daneben Text, Zahlen, Ladungen oder
  Rückmeldungen ändern. Nur gewollte Animationen bewegen sich. Dafür feste Spalten/Größen und reservierter Platz für die längste mögliche Beschriftung (Grid statt
  zentriertem Flex, `tabular-nums`, `visibility: hidden` statt Weglassen).
  Bausteine: `Reserve` (`@lern/ui`, alle Fassungen in einer Zelle, nur die aktuelle sichtbar), `Workbench` `statusReserve` (Statuszeile mit Platz für die längste
  Kombination) und `wrapTools` (Werkzeugleiste fest zweireihig), im Kapitel unsichtbare „Geister“ des größten Zustands je Folie (`.ui-guide-ghost`; nur solange das Bild dadurch höchstens 10 % kleiner wird,
  sonst `data-noghost`: Bildhöhe vom Anfang der Folie fest, Text scrollt), `Fit` behält die Lage,
  wenn nur der Rahmen sich ändert. Prüfung: `scripts/check-ui.mjs` vergleicht vor/nach jeder Bedienung die Kästen (immer an, `WANDER=0` aus; gewollte Bewegung
  `data-anim`/`data-moves`, neue Ansicht `data-screen`; bekannte Ausnahmen mit Grund in `KNOWN`, Ausgabe „bekannt: …“).
  Umsetzung: `ModelFrame` hält nach dem Lösen die Höhe der Bedienzeile frei; `Guide steady` reserviert Platz für Lösungsweg, Rückmeldung und
  „Weiter“ – untereinander behält das Bild seine Anfangshöhe, längerer Text scrollt; Schalen-Text über `shellLines`/`shellSentence` (`@lern/chem`).
  Ausnahme: Ionenbindung Kapitel 1, Elektronenübergang mit einstellbarer Atomzahl – kommt ein Atom dazu, ordnen sich die Atome neu und
  werden kleiner (fester Maßstab für drei Atome machte sie am Handy zu klein).
- **Schalenmodelle mit festen Schalen** (überall, wo Bohr- bzw. Schalenmodelle gezeichnet werden): Jede Schale (K, L, M, …) hat immer denselben Durchmesser – unabhängig
  von Protonen-, Neutronen- und Elektronenzahl. Der Kern verschiebt keine Schale, die K-Schale liegt außerhalb auch des größten Kerns. Ein Atom bzw. Ion wird nur größer oder
  kleiner, wenn eine Schale dazukommt oder wegfällt. Innerhalb einer Ansicht bzw. eines Modells ändert sich der Maßstab beim Bedienen nie: der Rahmen bietet Platz für alle
  Schalen, die dort vorkommen können (`slots` an `Bohr` in `@lern/chem-ui`, `extentOf` in Ionenbindung Kapitel 1). Grund: wachsende oder schrumpfende Schalen verwirren.
  Echte Ionengrößen gehören zu den Ionenradien (Ionenbindung Kapitel 3), nicht ins Schalenmodell. Test `packages/chem-ui/test/bohr.test.ts`.
- Prüfen im Browser (z. B. Playwright): in allen Ansichten, Werkzeugen und Folien darf weder die Seite noch Werkbank bzw. Folie überlaufen, und nichts darf von einem
  Rahmen mit `overflow: hidden` abgeschnitten werden (Gleichungen, Formeln). Breiten: 390 × 844, 375 × 667, dazu schmale Android-Handys 360 × 740 und 412 × 915.
  Nie mitten im Wort umbrechen: umbrochen wird nur an Leerzeichen und erlaubten Trennstellen – `overflow-wrap: break-word`, nie `anywhere` (das brach Formeln wie „3d⁷“ mitten durch).
- Knopf oder Anzeige – auf einen Blick: alles Antippbare sieht aus wie eine Taste (dunkler Rahmen `--rule`, Unterkante `--key-edge`,
  gedrückt `--key-edge-pressed`; neue Knopf-Klassen bekommen beides), Anzeigen haben keinen Rahmen, nur eine ruhige Fläche (`Tag`, `Chip`, Ergebnis).
  Beantwortete Auswahl verliert die Unterkante.
- Keine Erklärsätze in der Oberfläche; Zustand als kurze `Tag`s (✓ neutral, Kation Fe³⁺ …). Erklärungen nur in den Folien, in den Merksätzen (Hilfsmittel „Erklärung“) und als Tipp.
- Fachsprache überall gleich (Experimentieren, Lernen, alle Module; Begriffe aus den Modulen bis einschließlich Ionenbindung):
  beschreibend statt zielgerichtet – nie „das Atom will/braucht ein Oktett“, sondern „das Ion hat dann eine volle Außenschale wie ein Edelgas“;
  Gruppen je Stufe: Unterstufe römische Hauptgruppe („IV. Hauptgruppe“), Oberstufe Gruppe 1–18 zusammen mit der Hauptgruppe („Gruppe 13, die III. Hauptgruppe“;
  `groupLabel` in `@lern/chem`, auch PSE-Kopf und PSE-Hilfe); Ladungen als Zahl vor dem Zeichen: 2+, 1− (`signed`, `chargeFull`), Rechnung mit echtem Minus (`minus`);
  „Außenelektronen“ (einmal eingeführt als „Außenelektronen (Valenzelektronen)“), „Kohlendioxid“, „Kohlenmonoxid“,
  Gemischarten mit Aggregatzuständen (Lösung s/l, Emulsion l/l …).
- **Zwei Sprachen** (`packages/i18n`): jeder sichtbare Text als `tr("Deutsch", "English")`, auch in Daten. Beim ersten Start aus der Gerätesprache, danach Knopf EN/DE in der Kopfzeile (EN vor DE, international)
  (`lern-sprache`; Wechsel lädt die Seite neu, Stände bleiben). Tests laufen auf Deutsch; je Modul prüft ein Test, dass nichts Deutsches
  in der englischen Fassung bleibt (Ionenbindung: `kapitel.test.ts`). Fachnamen englisch nach IUPAC (sodium chloride, chloride ion …).
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
Kapitel zusätzlich mit `KAPITEL=1` (spielt in beiden Stufen jede Folie jedes Kapitels unter „Lernen“: vor und nach dem Lösen, Modell-Folien über „Prüfen“ bis zur
markierten Lösung, einmal je Kapitel PSE, Tipp und Erklärung; meldet Folien ohne „Weiter“).
check-ui meldet außerdem: sich überdeckende Tippziele, abgeschnittene oder herausragende Knopf-Beschriftungen (gewollte Auslassungspunkte ausgenommen), Wörter in
Antwortknöpfen über zwei Zeilen (weicher Trennstrich und Nullbreite-Leerzeichen sind Trennstellen), abgeschnittene Bilder; es schließt offene Blätter und Kapitel selbst.
In dieser Umgebung: Chromium liegt unter `/opt/pw-browsers/chromium` (`CHROMIUM=/opt/pw-browsers/chromium`), Playwright global (`PLAYWRIGHT=…/playwright/index.mjs`); nie `playwright install`.
Zusätzlich gezielt prüfen, was geändert wurde: Ansicht öffnen (`#/<modul>`), Level umschalten, Folie richtig **und** falsch lösen, Blätter öffnen, Animationen bis zum Ende
laufen lassen; je Zustand messen (Seite, `.ui-wb`, `.ui-wb-stage`, Folie, Blatt: `scrollHeight/scrollWidth` ≤ `clientHeight/clientWidth`, Bild nicht winzig) und Screenshots ansehen.
Nach dem Push: Läufe der Workflows für den neuen Commit abwarten (beide „success“), erst dann „veröffentlicht“ melden.
