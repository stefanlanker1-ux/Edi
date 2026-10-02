# Entwicklung – Regeln und Konventionen

Modularer Monolith: **eine** App (`apps/edi`) mit Modulen (`modules/*`) auf gemeinsamen Paketen (`packages/*`), npm-Workspaces.
Pakete: `packages/chem` (reine Logik), `packages/units` (Einheiten, reine Logik), `packages/ui` (React-Designsystem), `packages/chem-ui` (Bohrmodell, Atomsymbol, Formel …),
`packages/quiz` (Quiz-Grundgerüst). Website: `npm run site` → `site/` (App, `edi-offline.html`, Weiterleitungen der früheren Adressen; GitHub Pages).
Zielgruppe: Schülerinnen und Schüler (Unter-/Oberstufe) auf Handy, Tablet, Schul-PC. Sprache der Oberfläche: Deutsch.

## Grundsätze für Beiträge
- Keine personenbezogenen Daten im Repository (Namen, E-Mail-Adressen, Schulen, Orte) – weder in Dateien, Kommentaren, Commit-Nachrichten noch in Metadaten.
- Keine Planungs-, Strategie- oder Protokolldateien; das Repository enthält Quellcode, Tests und technische Dokumentation.
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
- Jedes Modul hat nur zwei Arten von Ansichten: **Probieren** (Werkbank: selbst bauen, zeichnen, vorgegebene Beispiele lösen) und **Quiz**. Keine eigenen Übungsseiten.
- React 19 + TypeScript (strict) + Vite. State mit zustand. Keine weiteren UI-Frameworks.
- Gemeinsames gehört in `packages/`; Module importieren `@lern/*` (Quelltext wird direkt gebündelt, kein eigener Build-Schritt für Pakete).
- **Erklärung** (`@lern/ui` `Guide`, Knopf `GuideButton`): jede App übergibt `guide` an `LernApp` (je Stufe, `src/guide.tsx`). Breit links neben den Bereichen,
  am Handy unten links vor den Bereichen; roter Ring, bis die Erklärung einmal durchlaufen ist (`lern-erklaert-<App>`). Ganzer Bildschirm, nie scrollen.
  10–15 Schritte, jeder verlangt eine Handlung: Auswahl (`options`), Zahl (`num`) oder ein Ziel im Bild antippen (`visual` ruft `pick(id)`), mit den Bausteinen
  der App (Bohrmodell, PSE, Ionenwand, Lewis-Formel, Teilchenbild, Pfeilkette …). Falsch → Rückmeldung zum Denkfehler (`why`, jede falsche Auswahl hat eine),
  sonst Denkanstoß zum Vorgehen (`tip`, Pflicht bei Zahl und Antippen, nennt die Lösung nicht); ab dem 2. Versuch Rückmeldung + Tipp (`feedback`), dazu „Versuch x von 4“; nach 4 Versuchen
  wird die Lösung markiert (`show`, gestrichelt grün, pulsierend) und muss selbst angetippt werden. Richtig → ✓, die Bestätigung (`ok`) steht über dem nächsten Schritt
  und nennt die Regel mit dem Beispiel („Massenzahl = Protonen + Neutronen = 7 + 7 = 14“), nicht nur das Ergebnis.
  Ende: Zusammenfassung „Das kannst du jetzt“, Knopf „Zum Quiz“. Inhalte decken alle Aufgabentypen des Quiz der Stufe ab. Test je Modul (`guide.test.ts`, `checkGuide`):
  Schrittzahl, Antwort unter den Auswahlen, Rückmeldung zu jeder falschen Auswahl, Tipp bei Zahl/Antippen (ohne die gesuchte Zahl), Sätze höchstens 22 Wörter.
  Beschriftung mit Pfeilen (`labels`, Baustein `Callouts`): Begriff am Rand, Pfeil auf ein Teil des Bildes (CSS-Selektor, z. B. `.bohr .nuc`, `.lone.pair`,
  `[data-f="H2O"]`, `[data-el="O"]`, `.ion-tile.cation`, `.ms-box`); ohne `nth` das Teil, das der Seite am nächsten liegt; weicht Schrift im Bild aus (`AVOID`).
  Nie die gesuchte Antwort beschriften (prüft `checkGuide`), außer mit `afterSolved` (erscheint erst nach der richtigen Antwort).
- Alle Module nutzen für das Quiz `@lern/quiz` (`createQuizStore` + `QuizScreen`); Aufgaben sind reine Daten, Aufgabentyp = Fertigkeit.
  Optional: Level mit Tipp (`QuizLevel.tip` = Glühbirne an der Karte, Aufgabe `hintCue` = Tipp-Knopf hervorgehoben, Tipp kostet keine Punkte) und feste Reihenfolge (`fixedOrder`).
  Fertigkeiten (`skills.ts`): neu → geübt → sicher (2 Treffer in Folge) → gemeistert (Treffer nach ≥ 7 Tagen Abstand); Wiederholung nach 1-3-7-14-30 Tagen
  (Abstand wächst nur mit einem Treffer an einem neuen Tag, fällig ab Mitternacht des Fälligkeitstags), Fehler = morgen wieder fällig. Level "due" = „Heute fällig“; „Schwächen üben“ = Fertigkeiten mit Fehlern, die seitdem nicht wieder sicher sind (`recordStat`). Menü zeigt Wochenziel (3 Runden), Stufen je Level und die Landkarte (Blatt); Auswertung nennt Trefferquote, Zeit
  und erreichte Stufen. Keine Wiederholungen: der Store merkt sich die zuletzt gestellten Fragen (`recent`, Prüfsumme `taskKey`, 400 je Stufe),
  `freshRound` nimmt je Platz eine neue Frage desselben Typs, sonst eines anderen Typs des Levels, erst danach die am längsten zurückliegende. Sprache: „Noch nicht“ statt „Leider falsch“, keine Ranglisten, keine Schuld.
  Prüfungstermin (`Exam`, Blatt „Schularbeit“ im Menü, trägt der Lernende selbst ein, bleibt auf dem Gerät): bis dahin Abstand höchstens halbe Restzeit
  (`examInterval`, `effectiveDue`), neue Fertigkeiten zuerst fällig, Menü zeigt Countdown und „x / n sicher“; nach dem Tag löscht sich der Termin.
- Diagnostische Distraktoren: jede falsche Antwort steht für eine Fehlvorstellung. MC: `mc(richtig, [d(text, miss, why), …])` – `miss` = Schlüssel aus
  `src/quiz/misconceptions.ts` der App (`MISS`, Name für Landkarte/Auswertung), `why` = Rückmeldungssatz mit den konkreten Zahlen (steht vor der Erklärung).
  Eingabe-Aufgaben: `traps` (`{ field, value | min }` oder `{ values: {…} }`) auf den gemeldeten `values`; `diagnose(task, answer)` wertet aus.
  Der Store zählt `misses` je Stufe; Landkarte zeigt „Stolpersteine“ (≥ 2×), Auswertung den häufigsten der Runde. `missName` an `QuizScreen` übergeben.
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
  (Quiz ab ≤ 370 px Breite kompakt wie bei niedrigen Bildschirmen).
- Knopf oder Anzeige – auf einen Blick: alles Antippbare sieht aus wie eine Taste (dunkler Rahmen `--rule`, Unterkante `--key-edge`,
  gedrückt `--key-edge-pressed`; neue Knopf-Klassen bekommen beides), Anzeigen haben keinen Rahmen, nur eine ruhige Fläche (`Tag`, `Chip`, Ergebnis).
  Beantwortete Auswahl verliert die Unterkante.
- Keine Erklärsätze in der Oberfläche; Zustand als kurze `Tag`s (✓ neutral, Kation Fe³⁺ …). Erklärungen nur kurz in Erklärkarten und als Tipp nach Fehlern.
- Fachsprache überall gleich (Probieren, Quiz, Erklärkarten, alle Module):
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
- Probieren (`views/MixView.tsx`, `components/FlowView.tsx`, Canvas): Gefäß mit allen Teilchen (klein) und **verschiebbarer Lupe**
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
- Quiz (`src/quiz/tasks.ts`, Katalog `misconceptions.ts`), sechs Niveaus in festen Paaren – mit Tipp (1, 3, 5) und ohne (2, 4, 6) – plus „Alles gemischt“:
  Teilchen und Stoffe (teilchen, stoffe, atomsorten, reinOderGemisch, einordnen, reinGemisch, elemente, verbindungen, bildArt, bildWahl) |
  Gemische im Alltag (alltag ×2, homogen ×3, gemischart ×3, reinAlltag ×2) | Lösen und Mischen (wohin, erhalten, masse, zwischen, bewegung, farbe, nachher, bewegung, farbe, nachher).
  **Feste Reihenfolge** (`seq`, leicht → schwer, `ordered`; der Store ersetzt Wiederholungen nur innerhalb des Typs, `fixedOrder`), keine Frage doppelt in einer Runde.
  Jede Aufgabe hat einen allgemeinen Tipp (`hint`) und einen **zugeschnittenen** (`tip`, mit den Stoffen, Formeln oder Zahlen der Aufgabe); in den Niveaus mit Tipp
  wird er zum Tipp und der Knopf hervorgehoben (`hintCue` in `@lern/quiz`, kostet dort keine Punkte), Glühbirne an der Levelkarte, Erklärkarte nennt den Tipp-Knopf.
  Sprudel nicht im Quiz (dort reagiert ein Teil zu Kohlensäure).
  Bild der Aufgabe `pic`, Teilchenbilder als Antworten `pics` (Schlüssel = Antworttext, `renderOption`, zwei Spalten). Anordnungen für falsche Bilder:
  gemischt, unten, oben, getrennt, abwechselnd. Stolpersteine u. a.: Verbindung für Gemisch gehalten, Gemisch aus Elementen für Verbindung, gelöster Stoff
  verschwindet, Masse ändert sich, Luft zwischen den Teilchen, Teilchen ruhen, Teilchen haben die Farbe des Stoffs, „rein“ im Alltag.
  Hilfsmittel „Farben“: alle Atomfarben des Quiz (verrät nicht, welche vorkommen). Nie zwei Atomsorten mit ähnlicher Farbe
  (He/Ne, Cu/Fe, Zn/Al) in einer Aufgabe (`distinctColors`, Test); Argon violett.

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
- Einzahl/Mehrzahl in generierten Texten beachten („1 Proton“, „1 Außenelektron“) – die Quiz-Tests prüfen das.

## Ionenbindung (`modules/ionenbindung`)
- Ionen-Bausteine: Kationen gold, Anionen grün, Breite = Ladung. Neutral, wenn beide Reihen gleich lang sind.
- Ionen, Formeln (`formula`, `ratio`) und Namen (`compoundName`) in `packages/chem/src/ions.ts`. Unterstufe nur Hauptgruppen-Ionen, Oberstufe zusätzlich Nebengruppen (römische Zahlen) und mehratomige Ionen.
- Ladungsrechnung immer mit Zahl schreiben: `2 · (1−) = 2−` (`chargeFull`).
- Mehratomige Ionen (Oberstufe): NH₄⁺, OH⁻, NO₂⁻, NO₃⁻, HCO₃⁻, SO₃²⁻, SO₄²⁻, CO₃²⁻, PO₄³⁻. Quiz Unterstufe Level 1 nur Ladungen und Elektronen (Verhältnis erst ab Level 2);
  Erklärkarte: im Salz keine Paare oder Moleküle, sondern ein Ionengitter.
- Nicht beständige Verbindungen (FeI₃, CuI₂, Al₂(CO₃)₃, AgOH, Cu⁺-Salze mit Sulfat/Sulfit/Nitrit/Hydrogencarbonat, Nitrite und Sulfite von Al³⁺/Fe³⁺/Cu²⁺ …) stehen in `NOT_KNOWN`
  (`isKnownCompound`): das Quiz fragt sie nicht ab, der Baukasten zeigt einen Hinweis.

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

## Reaktionsgleichungen (`modules/reaktionsgleichungen`)
- Logik in `packages/chem/src/reactions.ts`: `parseFormula` (Klammern, tiefgestellte Ziffern), `balance` (Nullraum mit Brüchen → kleinste ganze Koeffizienten, `null` bei mehrdeutigen Gleichungen), `isBalanced`, `unbalancedElements`, `equationText` (Koeffizient 1 weglassen, `null` = „?“).
- Reaktionen in `REACTIONS` mit `stufe` (us/os) und `niveau` 1–4 (`reactionsFor(stufe, …niveaus)`), Titel, Art, Formeln ASCII wie `Ca(OH)2`; Stoffnamen in `SPECIES_NAMES` (jeder Stoff braucht einen Namen).
  Niveaus: US 1 eine Zahl · 2 mehrere Zahlen · 3 Verbrennungen/Metalloxide · 4 knifflig (halbe Zahl → verdoppeln, Al + HCl); OS 1 Salze/Säuren (Ionen als Block) · 2 Zerfall/Fällung/Neutralisation ·
  3 mehrere Produkte · 4 Redox und große Zahlen (KMnO₄ + HCl, Cu + HNO₃, Oktan). Neue Reaktion nur mit eindeutiger Lösung (der Test prüft Bilanz und Kürzung, je Stufe und Niveau ≥ 5 Aufgaben).
- Aufbau (einfach, wenige Knöpfe): Tabs **Start | Quiz**. Start = 5 Beispielreaktionen nur aus Molekülen (`START` im Store: Knallgas, HCl, NH₃, Methan, Propan; Knöpfe 1–5, ✓ wenn gelöst),
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
- Gespeichert: Stand der Start-Beispiele und Übungsgleichung (`reaktionsgleichungen-v2`); Quiz in `reaktionsgleichungen-quiz`. Stufen-Schalter US/OS (Start immer Unterstufe, nicht gespeichert).
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

## Benennung (`modules/organik`)
- Organische Verbindungen frei zeichnen, der Name folgt nach IUPAC (deutsche Schreibweise: Benzen, Oct, Ethansäure, Butansäureethylester), mit weiteren Namen
  (Trivialname, Benzol-Schreibweise, ältere Schreibweise 2-Propanol, Diethylether, Ethylamin, Ethylbutanoat), Summenformel nach Hill und Stoffklassen. Kein 3D.
- Logik in `src/chem/`: `mol.ts` (Graph ohne H, Wertigkeit, NO₂ als Baustein mit einer Bindung), `rings.ts` (nur Einzelringe: Cycloalkane, Benzen,
  Heterocyclen mit einem O/S/N: Oxolan, Thiolan, Pyrrolidin, Oxan, Thian, Piperidin, Furan, Thiophen, Pyrrol, Pyridin …; kondensierte Ringe → Meldung),
  `naming.ts` (Hauptgruppe nach Rang Säure > Ester > Amid > Nitril > Aldehyd > Keton > Alkohol > Thiol > Amin; Stammsystem: meiste Hauptgruppen, Ring vor Kette,
  längste Kette, Mehrfachbindungen; Nummern: Hauptgruppe, Mehrfachbindung, -en, Vorsilben, alphabetisch erste; Vorsilben rekursiv: (1-Methylethyl), Acetyloxy,
  (Dimethylamino), Methoxycarbonyl; > 2 COOH an einer Kette → -carbonsäure; Ester „Säure + Alkyl + ester“; Nummern weglassen nur, wenn eindeutig: Ethanol, Propen,
  Methylcyclohexan, Butansäure). Varianten für das Quiz über `NameOptions` (andere Seite, kürzere Kette, nicht alphabetisch, ohne di/tri, andere Hauptgruppe).
  `layout.ts` (Zickzack 120°, Ringe als Vielecke, Start am fernsten C), `edit.ts` (Anhängen, Ziehen, Ring schließen, Bindung 1→2→3, Tauschen, Löschen), `smiles.ts` (Kurzschreibweise nur für Beispiele/Tests).
  Der Test prüft u. a. alle Beispiele, Namen unabhängig von der Atomreihenfolge (Zufallsmoleküle) und die Laufzeit.
- Zeichnen: Atom antippen = Stift anhängen, in der Lewis-Formel ein H antippen = Stift genau dort anhängen, vom Atom ziehen = neue Bindung in 30°-Schritten, auf ein Atom ziehen = Ring schließen; Stifte C O N S + zuletzt gewählter
  (Mehr: F Cl Br I NO₂, Benzolring, Sechs-, Fünfring); Modus Anfügen | Tauschen | Löschen (Löschen/Tauschen: Atome gestrichelt markiert). Fester Maßstab (Bindung ≈ 56 px, Tippziele ≥ 48 px), das Bild verschiebt bzw. verkleinert sich nur,
  wenn die Zeichnung nicht passt; Bindung/H zählen nur, wenn der Finger auf demselben Ziel aufsetzt und loslässt. Lewis-Formel (alle H, freie Elektronenpaare als Striche) oder Gerüstformel.
  Name erst nach „Benennen“, danach live; Hauptkette hinterlegt, Nummern rot, Hauptgruppe markiert. Werkzeuge: Beispiele (nach Stoffklasse) | Schritte (Lösungsweg) | Gruppen (Rangfolge) | Ansicht | Zurück | Neu.
  Gespeichert (`organik-v1`): Zeichnung, Stift, Ansicht, Name sichtbar.
- Quiz (`src/quiz/tasks.ts`, Katalog `misconceptions.ts`): stamm, kette (Zahl), alkan, alken, lage (Zahl), klasse, endung, gruppen, ester, prio, mehrere, struktur (Name → Formel,
  Antworten als Gerüstformel). Falsche Namen kommen aus der Benennung selbst. Hilfsmittel: Groß (Formel bildschirmfüllend), Regeln (Stämme nicht bei stamm, Rangfolge nicht bei klasse/endung/prio).

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
- Tabs: Umrechnen | Quiz. Quiz (`src/quiz/tasks.ts`) je Stufe fünf Niveaus: 1 Zehnerschritte (Werte nur 1, 10 … 0,0001; Längen, Massen, Liter, Umrechnungszahl; OS auch Vorsilben) ·
  2 beliebige Zahlen (1,5 g = 0,0015 kg; Mal oder geteilt?, Vergleichen) · 3 Flächen (inkl. ha/a, Größenvorstellung) · 4 Volumen (inkl. 1 l = 1 dm³; Tipp „gleich groß“) ·
  5 Unterstufe Zeit (umrechnen, Umrechnungszahl, „Was dauert länger?“ mit Falle 1 h = 100 min) bzw. Oberstufe zusammengesetzt, in der Runde nach Schwierigkeit sortiert (`STAGE`):
  Zeit → nur Zähler → nur Nenner → beide → Einheiten mit eigenem Namen (Pa, J, C …); Werte alltagsnah (`PLAUSIBLE`, z. B. Dichte ≤ 23 g/cm³).
  Level-Kennungen: Unterstufe n1–n5 (bisheriger Fortschritt), Oberstufe os-n1 … os-n5. Vergleichen: etwa jede vierte Aufgabe „gleich viel“, jede vierte eine Falle
  (Umrechnungszahl eine Stufe falsch bzw. wie bei Längen), jede falsche Antwort mit Rückmeldung. Nicht endende Zahlen als Bruch (1/60, 1/3,6).
  Umrechnungszahl-Aufgaben mit diagnostischen Distraktoren (`dis`: Gegenrichtung, „wie bei Längen“, Stufe zu viel/zu wenig).
- Quiz-Hilfsmittel passend zur Aufgabe, ohne Ergebnis (nicht bei Fragen nach der Umrechnungszahl): Pfeile (bzw. `DimChain`), Skala (wenn `prefixStep`), Stellen (Stellenwerttafel), sonst Einsetzen.
  Eingabe-Aufgaben zeigen als Bild die Aufgabe groß mit Einheitennamen (`TaskBanner`, Quadrat/Würfel bei Fläche/Volumen).

## Prüfen vor dem Commit
`npm run typecheck && npm test && npm run build`
Oberfläche: `npm run site`, dann `node scripts/check-ui.mjs site` (Übersicht und alle Module; zusätzlich `VP="360x740,412x915,1024x768"` und `LESBAR=1`).
