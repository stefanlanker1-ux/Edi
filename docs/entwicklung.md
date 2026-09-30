# Entwicklung – Regeln und Konventionen

Monorepo mit npm-Workspaces: `packages/chem` (reine Logik), `packages/units` (Einheiten, reine Logik), `packages/ui` (React-Designsystem), `packages/chem-ui` (Bohrmodell, Atomsymbol, Formel …),
`packages/quiz` (Quiz-Grundgerüst), `apps/*` (einzelne Apps), `apps/start` (Startseite).
Website: `npm run site` → `site/` = Startseite + `site/<app>/` (GitHub Pages).
Zielgruppe: Schülerinnen und Schüler (Unter-/Oberstufe) auf Handy, Tablet, Schul-PC. Sprache der Oberfläche: Deutsch.

## Grundsätze für Beiträge
- Keine personenbezogenen Daten im Repository (Namen, E-Mail-Adressen, Schulen, Orte) – weder in Dateien, Kommentaren, Commit-Nachrichten noch in Metadaten.
- Keine Planungs-, Strategie- oder Protokolldateien; das Repository enthält Quellcode, Tests und technische Dokumentation.
- Commit-Nachrichten und Pull-Request-Texte rein technisch (was geändert wurde), ohne Zusatzzeilen zu Mitwirkenden oder Werkzeugen.
- Kommentare begründen fachlich oder technisch („übliche Schreibweise“), nie mit Vorlagen oder Quellen Dritter.
- Keine fremden Texte, Aufgaben oder Grafiken übernehmen; Aufgaben werden selbst erzeugt, Fachdaten sind allgemein bekannte Werte oder selbst berechnet.
- Keine externen Dienste, Tracker oder nachgeladenen Fremdinhalte; Daten nur lokal im Browser.

## Regeln
- React 19 + TypeScript (strict) + Vite. State mit zustand. Keine weiteren UI-Frameworks.
- Gemeinsames gehört in `packages/`; Apps importieren `@lern/*` (Quelltext wird direkt gebündelt, kein eigener Build-Schritt für Pakete).
- Alle Apps nutzen für das Quiz `@lern/quiz` (`createQuizStore` + `QuizScreen`); Aufgaben sind reine Daten, Aufgabentyp = Fertigkeit.
  Fertigkeiten (`skills.ts`): neu → geübt → sicher (2 Treffer in Folge) → gemeistert (Treffer nach ≥ 7 Tagen Abstand); Wiederholung nach 1-3-7-14-30 Tagen
  (Abstand wächst nur mit einem Treffer an einem neuen Tag, fällig ab Mitternacht des Fälligkeitstags), Fehler = morgen wieder fällig. Level "due" = „Heute fällig“; „Schwächen üben“ = Fertigkeiten mit Fehlern, die seitdem nicht wieder sicher sind (`recordStat`). Menü zeigt Wochenziel (3 Runden), Stufen je Level und die Landkarte (Blatt); Auswertung nennt Trefferquote, Zeit
  und erreichte Stufen. Sprache: „Noch nicht“ statt „Leider falsch“, keine Ranglisten, keine Schuld.
  Prüfungstermin (`Exam`, Blatt „Schularbeit“ im Menü, trägt der Lernende selbst ein, bleibt auf dem Gerät): bis dahin Abstand höchstens halbe Restzeit
  (`examInterval`, `effectiveDue`), neue Fertigkeiten zuerst fällig, Menü zeigt Countdown und „x / n sicher“; nach dem Tag löscht sich der Termin.
- Diagnostische Distraktoren: jede falsche Antwort steht für eine Fehlvorstellung. MC: `mc(richtig, [d(text, miss, why), …])` – `miss` = Schlüssel aus
  `src/quiz/misconceptions.ts` der App (`MISS`, Name für Landkarte/Auswertung), `why` = Rückmeldungssatz mit den konkreten Zahlen (steht vor der Erklärung).
  Eingabe-Aufgaben: `traps` (`{ field, value | min }` oder `{ values: {…} }`) auf den gemeldeten `values`; `diagnose(task, answer)` wertet aus.
  Der Store zählt `misses` je Stufe; Landkarte zeigt „Stolpersteine“ (≥ 2×), Auswertung den häufigsten der Runde. `missName` an `QuizScreen` übergeben.
  Distraktoren mit Diagnose kommen vor zufälligen; die Tests prüfen Schlüssel, Listenlängen und Fallen-Felder. Rückmeldung nie beschämend, immer mit dem richtigen Weg.
- Baukasten – neue Apps nur aus gemeinsamen Teilen: `vite.config.ts` = `appConfig({ name, shortName, description })` (`scripts/app-vite.ts`, PWA + Einzeldatei + `lizenzen.txt`
  über `scripts/licenses.ts`), `main.tsx` = Stile importieren + `boot(<App />)`, `App.tsx` = `<LernApp name logo tabs tab onTab storage stufe?>` (`@lern/ui`: Startseiten-Link,
  Stufen-Umschalter, Beamer, Farbschema – nicht im App-Store halten). Quiz-Antworten: `McAnswer` (automatisch), `NumberAnswer` (`@lern/quiz`, ganz/dezimal, Einheit).
  PSE überall als `pseTool({ stufe, mark })` (`@lern/chem-ui`) in Werkbank- und Quiz-`tools`.
- Logo in jeder App verlinkt zur Startseite (`homeHref="../"`, nur Web). Kopfzeile hat automatisch den Klang-Schalter (`@lern/ui` `feedback.ts`: `ding(ok)` nur wenn eingeschaltet, Standard aus; Vibration `buzz` immer)
  und den Schalter „Lesbar“ (`readable.ts`, localStorage `lern-lesbar`, Attribut `data-lesbar` auf `<html>`, Stile in `tokens.css`: mehr Buchstaben-/Wort-/Zeilenabstand; Überschriften unverändert). Browser-Prüfung `scripts/check-ui.mjs` zusätzlich mit `LESBAR=1` laufen lassen.
- Auffangnetz: `AppShell` fängt Abstürze einer Ansicht ab (`Rescue`, Karte „Hier hakt etwas.“); jede App übergibt `storage` = ihre localStorage-Schlüssel (Baukasten + Quiz),
  „Neu starten“ setzt zuerst nur Baukasten und laufende Runden zurück, beim zweiten Mal alles.
- Mobile first: keine horizontale Seiten-Scrollbar bei 390 px, Tippziele ≥ 44 px, Pointer Events zum Ziehen.
- Farben nur über Design-Tokens (`packages/ui/src/styles/tokens.css`, App-spezifisch in `app.css`), hell und dunkel.
- Design: Swiss Style – Weiß/Schwarz, ein Rot (`--signal`) nur als Auszeichnung (Kartentitel, aktiver Tab, Kennziffern), Schrift Inter (lokal, Latein + Griechisch).
  Keine Verläufe, keine Schatten, kleine Radien (`--radius*` 3–4 px), Linien statt Flächen. Hauptknöpfe/Auswahl schwarz (`--accent`). Fachfarben nur aus der gemeinsamen Palette
  in `tokens.css` (`--hue-red|blue|yellow|green|grey|violet|teal|orange`, je `-soft` für Flächen und `-deep` für Schrift; dezent kräftig, nie grell; Beamer satter):
  Proton/O/H⁺ rot, Elektron/N/OH⁻ blau, Neutron hellgrau, Kation/S gelb, Anion/Cl grün, Alkalimetalle violett, Erdalkalimetalle grünblau, P/Halbmetalle orange.
  Signalrot nur für die Oberfläche. Ausnahmen: Indikatorfarben (Säuren/Basen, wie im Labor) und Kreidetafel (Einheiten). ✓ immer grün (`--ok`), nie rot.
- **Nie scrollen** (Handy 390 × 844 und 375 × 667, Desktop): jede Ansicht füllt genau den Bildschirm (`--screen-h`, Klasse `ui-screen`).
  Freies Ausprobieren = `Workbench` (`@lern/ui`): Bühne füllt den Platz, Hauptbedienung direkt darunter (`controls`), alles Weitere in der Werkzeugleiste (`tools`) –
  am Handy öffnet jedes Werkzeug ein Blatt (Zurück-Taste schließt es), breit (≥ 900 px) stehen die Werkzeuge als Register daneben. Nie mehrere Bereiche gleichzeitig offen.
  Übungen/Quiz: Aufgabe = ein Bildschirm (Frage, Bild passt sich per `Fit` an, Antwort, kurze Rückmeldung, „Weiter“ immer sichtbar); Lösungsweg und Hilfsmittel als Blatt.
  Zeichnungen passen sich per Container-Einheiten (`cqw`/`cqh`) oder `Fit` ein, statt zu scrollen oder abgeschnitten zu werden. PSE mit `fit` (ganzes PSE sichtbar).
  Prüfen im Browser (z. B. Playwright): in allen Ansichten, Werkzeugen und Quizaufgaben darf weder die Seite noch Werkbank/Aufgabenkarte überlaufen, und nichts darf von einem
  Rahmen mit `overflow: hidden` abgeschnitten werden (Gleichungen, Formeln). Breiten: 390 × 844, 375 × 667, dazu schmale Android-Handys 360 × 740 und 412 × 915
  (Quiz ab ≤ 370 px Breite kompakt wie bei niedrigen Bildschirmen).
- Keine Erklärsätze in der Oberfläche; Zustand als kurze `Tag`s (✓ neutral, Kation Fe³⁺ …). Erklärungen nur kurz in Erklärkarten und als Tipp nach Fehlern.
- Multiple Choice: `mc(richtig, falsche)` aus `@lern/quiz`; falsche Antworten möglichst als diagnostische Distraktoren – `d(text, miss, why)` mit Katalog-Schlüssel
  (Chemie-Apps mit `misconceptions.ts`) oder Kurzform `dis(text, why)` ohne Schlüssel (Reaktionsgleichungen, Säuren/Basen, Stoffmenge). `mc` bevorzugt Optionen mit Diagnose.
- Quiz-Hilfsmittel je Aufgabe über `tools` von `QuizScreen` (`QuizHelp`): z. B. PSE mit den Elementen der Aufgabe markiert (`PseHelp` in `@lern/chem-ui`, Elemente per `elementsIn(prompt)` aus `@lern/chem`).
  Hilfsmittel dürfen die Lösung nicht direkt verraten (PSE nur Angaben eines gedruckten PSE: Z, Gruppe, Periode, Atommasse).
- Offline-fähig: Web-Build mit Service Worker, zusätzlich Einzeldatei (`vite build --mode single`).
- Android/iOS über Capacitor (`apps/<app>/android`, `apps/<app>/ios`); `webDir` = `dist`.

## Atombau (`apps/atombau`)
- Start immer: helles Farbschema, Unterstufe, Elektronen kreisen nicht, kein Beamer-Modus (diese Werte werden nicht gespeichert).
- Gespeichert: Baukasten und Einstellungen (localStorage `atombau-v3`); Quiz in `atombau-quiz` (`src/quiz/store.ts`, übernimmt alten Fortschritt einmalig).
- Quiz-Aufgaben sind reine Daten (`src/quiz/tasks.ts`). Neue Aufgabentypen in `TYPES` registrieren und einem Level zuordnen; eigene Antwortformen in `answers.tsx`. Erklärkarten je Level in `src/quiz/explain.tsx`.
  Texte: `**fett**` und `` `Code` `` (dargestellt von `RichText`).
- Richtig/falsch nie nur über Farbe zeigen (Rot-Grün-Schwäche): immer zusätzlich ✓/✗, Muster oder gestrichelte Rahmen.
- Nicht überladen: neue Funktionen nur dort einblenden, wo sie gebraucht werden (z. B. Trends nur Oberstufe, Beamer nur ab 900 px).
- Chemie: Elemente Z = 1–86; Kationen geben Elektronen von außen nach innen ab: ns/np, dann (n−1)d, dann (n−2)f (Fe²⁺ = [Ar] 3d⁶, Eu³⁺ = [Xe] 4f⁶); Ausnahmen Cr, Cu, … in `EXCEPTIONS`.
- Häufigstes Isotop aus der Tabelle `COMMON_A` (`standardNeutrons`), nie gerundete Atommasse (Cu-63, nicht Cu-64). Ionen in Aufgaben nur mit Ladungen, die es gibt (`commonCharges`); Namen mit `ionName` (Chlorid-Ion, Eisen(III)-Ion).
- Einzahl/Mehrzahl in generierten Texten beachten („1 Proton“, „1 Außenelektron“) – die Quiz-Tests prüfen das.

## Ionenbindung (`apps/ionenbindung`)
- Ionen-Bausteine: Kationen gold, Anionen grün, Breite = Ladung. Neutral, wenn beide Reihen gleich lang sind.
- Ionen, Formeln (`formula`, `ratio`) und Namen (`compoundName`) in `packages/chem/src/ions.ts`. Unterstufe nur Hauptgruppen-Ionen, Oberstufe zusätzlich Nebengruppen (römische Zahlen) und mehratomige Ionen.
- Ladungsrechnung immer mit Zahl schreiben: `2 · (1−) = 2−` (`chargeFull`).
- Nicht beständige Verbindungen (FeI₃, CuI₂, Al₂(CO₃)₃, AgOH …) stehen in `NOT_KNOWN` (`isKnownCompound`): das Quiz fragt sie nicht ab, der Baukasten zeigt einen Hinweis.

## Elektronenpaarbindung (`apps/elektronenpaarbindung`)
- Baufeld 6 × 5: Atome ziehen oder antippen und Felder antippen (Auswahl bleibt aktiv bis „Fertig“). Aus dem Feld ziehen = entfernen.
  Tastatur: Atom wählen (Enter), leere Felder per Tab/Enter, Bindungen/＋ per Enter, auf einem Atom Pfeiltasten = verschieben, Entf = entfernen.
- Benachbarte Atome (waagrecht/senkrecht) binden automatisch, wenn beide ungepaarte Elektronen haben; Tipp auf das Paar-Oval: Einfach → Doppel → Dreifach → lösen.
- Logik in `packages/chem/src/molecules.ts` (Lewis-Belegung, Oktett, Erkennung bekannter Moleküle, EPA-Geometrie, Polarität) und `src/edit.ts`.
- Übliche Darstellung: blaue Elektronen, graues Oval für bindende Paare, roter Oktett-Kreis (nicht um H, dort nur ✓).
- Automatisch erzeugte Valenzstrichformel steht auf breiten Bildschirmen links neben dem Baufeld (`Workbench side="left"`), am Handy im Werkzeug „Formel“.
- Freie Elektronenpaare symmetrisch zu den Bindungen (`loneLayout`, z. B. O in CO₂ schräg ± 45°).
- Bindungswinkel: gemessene Werte in `REAL_ANGLES` (molecules.ts; H₂S 92,1°, PH₃ 93,5°), sonst EPA-Schätzung mit „ca.“. Polarität: ΔEN ≥ 0,4 polar; H₂S „schwach polar“ (`isWeaklyPolar`). Summenformel unbekannter Kohlenstoffverbindungen nach Hill (CH₅N).
- 3D-Ansicht nur für **bekannte** Moleküle (`identify`, nicht für frei gebaute), auf Klick: `@lern/chem-ui/3d` (three.js, per `lazy()` nachgeladen):
  Kugel-Stab (Stäbe zweifarbig je Atomfarbe) oder Kalotte (Van-der-Waals-Radien), Atomsymbol erst beim Antippen eines Atoms.
  Lage „Real“ aus `packages/chem/src/mol3d.ts` (erzeugt von `scripts/mol3d.py`: RDKit, Kraftfeld MMFF94, gemessene Winkel aus `REAL_ANGLES` und H₂O₂-Verdrillung festgehalten,
  CO₂, SO₂, SO₃, NO₂, HNO₃, P₂O₅ aus Messdaten, zweiatomige mit gemessener Bindungslänge; neues Beispielmolekül → SMILES dort eintragen und Skript laufen lassen).
  `embed3D` nimmt für bekannte Moleküle diese Daten (Zuordnung `matchAtoms`, freie Paare nach EPA auf die echten Bindungen gedreht), sonst und für „Idealisiert“ EPA in `packages/chem/src/geometry3d.ts`. Ringe (EPA): nach dem Baum Ausgleich von Bindungslängen und Winkeln (`relax`, Ringwinkel „≈ 90°“), danach Substituenten und freie Paare der Ringatome exakt nach EPA (`placeRingSubstituents`: =O auf der Winkelhalbierenden, H-Paare symmetrisch). Mehrfachbindungen als parallele Stäbe in der Ebene der Nachbarbindungen. Umschalter Real (gemessene Winkel, `REAL_ANGLES`) / Idealisiert (109,5° / 120° / 180°); Schalter: Bindungswinkel, freie Elektronenpaare, Teilladungen/Dipol (Oberstufe).
- Teilladungen/Dipol starten immer ausgeschaltet (nicht gespeichert); Dipolpfeil nur bei Molekülen bis 5 Atome (`dipoleArrow`), sonst nur δ+/δ−.
- Umschalter Strichformel / Keilstrichformel (nur fertige Moleküle): `wedgeLayout` in `packages/chem/src/wedge.ts` (Papierebene aus embed3D, Keil = nach vorn, gestrichelt = nach hinten).
  Ein Zentralatom mit Tetraeder (CH₄, NH₃ …) als feste Standard-Zeichnung; sonst beste Ansicht (viele Bindungen in der Ebene, keine Überlappung). Einfachbindungen zwischen Tetraeder-Atomen gestaffelt.
- Wasser nie linear zeichnen (auch nicht als Deko, z. B. Startseite).

## Reaktionsgleichungen (`apps/reaktionsgleichungen`)
- Logik in `packages/chem/src/reactions.ts`: `parseFormula` (Klammern, tiefgestellte Ziffern), `balance` (Nullraum mit Brüchen → kleinste ganze Koeffizienten, `null` bei mehrdeutigen Gleichungen), `isBalanced`, `unbalancedElements`, `equationText` (Koeffizient 1 weglassen, `null` = „?“).
- Reaktionen in `REACTIONS` mit `stufe` (us/os) und `niveau` 1–4 (`reactionsFor(stufe, …niveaus)`), Titel, Art, Formeln ASCII wie `Ca(OH)2`; Stoffnamen in `SPECIES_NAMES` (jeder Stoff braucht einen Namen).
  Niveaus: US 1 eine Zahl · 2 mehrere Zahlen · 3 Verbrennungen/Metalloxide · 4 knifflig (halbe Zahl → verdoppeln, Al + HCl); OS 1 Salze/Säuren (Ionen als Block) · 2 Zerfall/Fällung/Neutralisation ·
  3 mehrere Produkte · 4 Redox und große Zahlen (KMnO₄ + HCl, Cu + HNO₃, Octan). Neue Reaktion nur mit eindeutiger Lösung (der Test prüft Bilanz und Kürzung, je Stufe und Niveau ≥ 5 Aufgaben).
- Aufbau (einfach, wenige Knöpfe): Tabs **Start | Üben | Quiz**. Start = 5 Beispielreaktionen nur aus Molekülen (`START` im Store: Knallgas, HCl, NH₃, Methan, Propan; Knöpfe 1–5, ✓ wenn gelöst),
  Üben = zufällige Gleichung der Stufe und des Niveaus (Schalter „Niveau 1–4“, nach ✓ „Nächste“, nach zwei Fehlversuchen „Lösung“). Beide mit `BalanceCard`:
  Titel, Teilchenbild (`MoleculeScene`, Kästen passen sich dem Inhalt an, nebeneinander oder übereinander), Ergebnis erst nach „Prüfen“ (`≠ O`, `kürzen : 2`, `✓ ausgeglichen`,
  Kastenrahmen grün bzw. rot gestrichelt), Gleichung **immer einzeilig, nie umbrechen** (`EquationRow`: Fit-Text – Schrift passt sich der Breite an, 26 → min. 10 px; jeder Stoff ist ein Tippziel ≥ 44 px, antippen → Zahlenauswahl 1–12, Niveau 4 bis 30; `FitLine` für die Gleichung über Quizfragen), ein Hauptknopf. Keine Werkzeugleiste, kein 3D.
  Teilchenbild nur, wenn alle Stoffe Moleküle aus Nichtmetallen sind (`hasModel`/`isMolecular` in `Molecules.tsx`) – Salze und Metalle nie als Kalotten (sähe aus wie Elektronenpaarbindung); dann steht dort die Wortgleichung (`WordLine`).
  Fit-Text misst neu bei Größenänderung und nach dem Laden der Schrift; passt es bei 10 px noch nicht, wird die Zeile als Ganzes skaliert (nie abschneiden).
  Die Gleichungszeile ragt nur in der Karte von Start/Üben über den Innenabstand hinaus (`.rg-controls .eq-fit`), nie in Quiz-Bild oder Antwort (dort schneidet der Rahmen ab).
  Formelgleichungen als MC-Antwort ebenfalls einzeilig mit Fit-Text (`renderOption` von `QuizScreen` → `FitLine base={18}`). „Ausgeglichen?“-Antworten mit Elementsymbolen („Nein – Ca, C und O stimmen nicht“).
  Kalottenmodell, **jedes Atom muss gut zu sehen sein (Vorrang vor echtem 3D)** (`components/geometry.ts`, Test ≥ 65 % je Atom über `visibleShare`): Moleküle aus `MOL3D` (MMFF94) in der Ansicht mit dem am wenigsten verdeckten Atom (`orient`, 160 Richtungen), Bindungen bis ×1,15 gestreckt, gebundene Kugeln überlappen; ist trotzdem ein Atom unter 70 % sichtbar, die ebene Zeichnung wie eine Strukturformel (`flatView` aus `flat` der Daten, RDKit 2D, auseinandergeschoben; Glucose, Ethanol, H₃PO₄, CH₄ …; P₄O₁₀ als feste Standard-Zeichnung `flatFixed`, P₄ bleibt Tetraeder). Ketten CₙH₂ₙ₊₂ immer gerade wie die Strukturformel (`chainView`, kein Zickzack). Salze/Säuren aus Bausteinen, Kugeln nach Tiefe sortiert und dezent schattiert
  (radialer Verlauf – bewusste Ausnahme vom „keine Verläufe“), Farbfamilien nach CPK aus der Palette (`--hue-*`, Tokens `--atom-X`; der Test prüft Farbtoken, Atomzahlen und Abstände). Formeln nie änderbar.
- Gespeichert: Stand der Start-Beispiele und Übungsgleichung (`reaktionsgleichungen-v2`); Quiz in `reaktionsgleichungen-quiz`. Stufen-Schalter US/OS (Start immer Unterstufe, nicht gespeichert).
- Quiz (`src/quiz/tasks.ts`): je Stufe vier Level „Niveau 1–4“. Fertigkeiten `zaehlen` (OS mit Klammern), `pruefen`, `koeffizient`, `koeff-4`, `wort`, `aus-1`, `ausgleichen` (= Niveau 2), `aus-3`, `aus-4`;
  Antwortformen `mc`, `num` (Zahl eintippen), `balance` (Koeffizienten setzen, richtig nur ausgeglichen **und** gekürzt). Gleichung steht als `eq` groß über der Frage (`renderVisual`), nicht im Prompt.
  Erklärkarte je Niveau und Stufe (`explain.tsx`).

## Säuren und Basen (`apps/saeuren-basen`)
- Nur Unterstufe, nach Arrhenius: Säuren geben in Wasser H⁺ ab, Laugen enthalten OH⁻; Säure + Lauge → Salz + Wasser. Logik in `packages/chem/src/acids.ts`
  (`ACIDS`, `BASES`, `acidDissociation`, `neutralize` gleicht über `balance` aus, `SUBSTANCES` mit typischem pH, `INDICATORS`, `phLabel`, `dilute`).
- Werkbank „pH-Skala“: Skala 0–14 in Universalindikator-Farben + Reagenzglas als Bühne, pH-Zähler und Indikator-Wahl darunter; Werkzeuge Stoffe | Säuren & Laugen | Indikatoren | So geht's | Wasser dazu.
  Gespeichert (`saeuren-basen-v1`): pH, Indikator, gewählter Stoff.
- Indikatorfarben nur über Tokens `--c-rot … --c-farblos` (`app.css`), Farbnamen aus `indicatorColor` (`colorVar`). Verdünnen vereinfacht: 10-fach Wasser = 1 Schritt Richtung 7, nie über 7 hinaus.
- Quiz (`src/quiz/tasks.ts`): Antwortformen `mc`, `num` (Zahl), `swatch` (Farbe wählen, ✓/✗ zusätzlich zur Farbe). Fertigkeiten klasse, stoff, indikator, teilchen, formel, neutralisation, verduennen – alle mit `dis`-Distraktoren.
- Salzformeln ionisch geschrieben (Kation zuerst: NaCH₃COO), Essigsäure als CH₃COOH mit nur 1 abgebbarem H.

## Neutralisation (`apps/neutralisation`)
- Lauge + Säure → Salz + Wasser mit Ionen-Bausteinen wie in der Ionenbindung (Breite = Ladung): Reihe 1 Metall-Ionen (gold), Reihe 2 OH⁻ (blau), Verbindungsstriche = H₂O,
  Reihe 3 H⁺ (blau, gestrichelt – ohne Farbe unterscheidbar), Reihe 4 Säurerest (grün). Neutral, wenn OH⁻- und H⁺-Reihe gleich lang sind. Knopf „Reaktion“ zeigt die Produkte
  (Salz aus Reihe 1 + 4, darunter die H₂O). Eine Formeleinheit antippen = Zerfall in Ionen (Blatt). Komponente `NeutralWall`, auch im Quiz und in den Erklärkarten.
- Logik in `packages/chem/src/neutralization.ts`: `PROTIC_ACIDS` = genau die Säuren der Tabelle (einprotonig HCl, HClO₄, HCOOH, HBr, HNO₃, CH₃COOH; zweiprotonig H₂S, H₂SO₃, H₂SO₄, H₂CO₃;
  dreiprotonig H₃PO₄) mit allen Säureresten je Stufe (Hydrogen-/Dihydrogen-Ionen), `HYDROXIDES` (Al(OH)₃ nur Oberstufe), `neutralEquation(base, acid, step)`:
  Zahl der H₂O = kgV(Ladung des Metall-Ions, abgegebene H⁺), Salz über `formula` aus ions.ts. Salze, die es in Wasser nicht gibt (Al mit Sulfid/Carbonat/Sulfit …), in `isKnownSalt`.
- Unterstufe nur vollständige Neutralisation; Oberstufe wählt in der Säuretabelle (Werkzeug „Säure“) auch den Säurerest = wie viele H⁺ abgegeben werden (Hydrogensalze).
  Säuretabelle nach Anzahl abgebbarer H⁺ (Gruppen senkrecht beschriftet), passt auch breit (≥ 1024 × 768) ganz ins Register. Gespeichert (`neutralisation-v1`): Lauge, Säure, Stufe der Abgabe, Anzahlen.
- Salzformeln ionisch, Kation zuerst (NaCH₃COO, KHCOO, Ca(HCO₃)₂). Wortgleichung mit Laugen-/Säurenamen (Natronlauge + Salzsäure → Natriumchlorid + Wasser).
- Quiz (`src/quiz/tasks.ts`, Katalog `misconceptions.ts`): protolyse, protonen (OS), restName, restLadung, hydroxid, bauen (Bausteine, Fallen 1 : 1 / vertauscht / nicht gekürzt),
  wasser, koeffizient (OS), salz, salzName, gleichung. Säuretabelle als Hilfsmittel nur Oberstufe und nur bei Aufgaben, die nicht nach Namen/Ladung der Säurereste fragen.

## Reinstoffe und Gemische (`apps/reinstoffe`)
- Keine Stufen-Unterscheidung. Logik in `packages/chem/src/mixtures.ts`: `STOFFE` (10 Elemente, 10 Verbindungen; Öl vereinfacht als ein Stoff, Formel Triolein, Anzeige „Öl“),
  `mix(items)` → Phasen (Wasser + Mischbares eine Phase, Öl eigene, in Wasser Lösliches/CO₂ gelöst, jeder ungelöste Feststoff eine Phase, nicht lösliche Gase eine Gasphase = geschlossenes Gefäß),
  homogen = 1 Phase, Gemischtypen mit Aggregatzuständen (`MIX_TYPES`: Lösung, Legierung, Gasgemisch | Emulsion, Suspension, Gemenge, Schaum, Rauch, Nebel), Zählung
  **Phasen / Elemente / Verbindungen** (Stoffe zählen, nicht Atome). `separate(items, method)` (Magnet, Filtrieren, Dekantieren, Scheidetrichter, Eindampfen, Destillieren) liefert Bruchteile oder die Begründung,
  warum es nicht passt; `heat` (Eisen + Schwefel → FeS, Metalle → Legierung Messing/Bronze/Stahl, Zucker verkohlt). Alltagsbeispiele fürs Quiz in `EVERYDAY` (mit typischer Fehlvorstellung).
- Werkbank „Mischen“: Bühne = Becherglas (so wie man es sieht: Schichten, Bodensatz, trüb, milchig, Legierungsblock, Deckel bei Gasen) und Teilchenmodell (`components/Beaker.tsx`, gleiche Bereiche;
  Gelöstes als Ionen/Moleküle verteilt, Feststoffe als Gitter, Legierung zufällig gemischt, Gemenge geschüttelt als Körner, Emulsion als Tröpfchen); nebeneinander oder übereinander, je nachdem was größer wird.
  Darunter Inhalt als Chips (antippen = heraus), Schütteln/Absetzen, Leeren. Werkzeuge: Stoffe (Regal) | Trennen | Erhitzen | Übersicht (Konzept-Map, aktueller Inhalt markiert) | So geht's.
  Status: Einteilung, Gemischtyp (s/l …), „x Phasen · y Elemente · z Verbindungen“. Gespeichert (`reinstoffe-v1`): Inhalt, geschüttelt. Stoff- und Teilchenfarben aus der Palette (`--st-*`, `--atom-*` in app.css).
- Quiz (`src/quiz/tasks.ts`, Katalog `misconceptions.ts`): rein, element, teilchenArt | homogen, typ, zustand | teilchen (zählen), teilchenArt | trennen, erhitzen.
  Antwortformen `mc`, `map` (in der Einteilung antippen, `ConceptMap` mit `part`), `count` (Phasen/Elemente/Verbindungen, Fallen: Atomsorten statt Stoffe, Stoffe statt Phasen, O₂ als Verbindung).
  Übersicht als Hilfsmittel nicht bei `zustand` und `map`.

## Stoffmenge (`apps/stoffmenge`)
- Nur Unterstufe: molare Masse aus dem PSE (Atommassen auf 1 Dezimale, `schoolMass`), n = m / M, m = n · M, N = n · 6,022 · 10²³, Gase 22,4 l/mol. Logik in `packages/chem/src/moles.ts`
  (`MOLE_SUBSTANCES`, `molarMass`, `molarMassText` als Rechenweg, `fmt` deutsche Zahlen).
- Werkbank „Rechnen“: Rechenweg wie im Heft als Bühne (① M aus dem PSE, ② n = m / M bzw. m = n · M, darunter N und V bei Gasen), Eingabe Masse/Stoffmenge darunter;
  Werkzeuge Stoff | PSE | So geht's. Gespeichert (`stoffmenge-v1`): Stoff, Modus, Wert.
- Quiz (`src/quiz/tasks.ts`): Antwortformen `mc`, `num` (Zahl mit Einheit, Komma oder Punkt), `steps` (Rechenweg M → n ausfüllen, je Feld ✓/✗). Fertigkeiten atommasse, molmasse, formel, stoffmenge, masse, teilchen, volumen.
  PSE als Hilfsmittel nur, wo es die Lösung nicht verrät (nicht bei „Atommasse ablesen“). Zahlen so gewählt, dass n glatt ist (0,5 … 10 mol).

## Einheiten (`apps/einheiten`)
- Ein Verfahren für alles: ① Umrechnungszahl (`relation`: Kette über Nachbareinheiten, Flächen/Volumen als Produkt, zusammengesetzte Einheiten durch Einsetzen, Definitionen wie 1 l = 1 dm³, 1 J = 1 W·s) → ② Einsetzen und ausrechnen in einer Zeile (a · F, bei F < 1 zusätzlich a : 1/F, = Ergebnis). Logik in `packages/units` (`solve`).
- Rechnen nur mit exakten Brüchen (`Q`, BigInt); Anzeige deutsch (Komma, 10 000, 0,000 01), nicht endende Zahlen als 1/60, 1/3,6 bzw. „≈“.
- Neue Einheit: Atom in `ATOMS` (Familie, Faktor, ggf. `def`), in `QUANTITIES` eintragen – der Test prüft jede Kombination gegen SI-Faktoren.
- Oberstufe mit Vorsilben: Tafel ohne Kette, direkt ① `1 nm = 10⁻⁷ cm` ② `50 nm = 50 · 10⁻⁷ cm = 0,000 005 cm` (nicht verkomplizieren).
- Umrechnen: eine Rechenzeile `[Zahl] [von ▾] ⇄ [in ▾]` (native Auswahllisten), darunter Ergebnis und Pfeilkette/Skala als Bühne; Werkzeuge Stellenwerttafel | Tafel | Bild. Rechenweg in Kreide im Werkzeug „Tafel“ bzw. im Quiz im Blatt „Lösung“ (Kreideschrift Kalam/Cabin Sketch lokal über @fontsource). Stellenwerttafel: `pvColumns`/`placeValue`/`pvPlace` (Hohlmaße über Zusatzspalten hl, l, dl, cl, ml); am Handy nur benötigte Einheiten.
- Live-Hilfe (`components/LiveHelp.tsx`, überall gleich: Umrechnen, Quiz-Rückmeldung, Erklärkarten):
  Unterstufe = Pfeilkette wie im Heft (`ArrowChain`, `chainFor`: unten „· 10“ nach rechts, oben „: 10“ nach links, Weg leuchtet, Zahl unter jeder Einheit) + Stellenwerttafel;
  Oberstufe = Vorsilben-Skala n … G (10⁻⁹ … 10⁹, `PowerScale`, `prefixStep`): Umrechnungszahl = 10^(Hochzahl vorher − nachher), bei m²/m³ mal 2/3. Ohne Vorsilben (h, t, ha) Pfeilkette, zusammengesetzt Einsetz-Kette.
- Tabs: Umrechnen | Üben | Quiz. Quiz-Hilfsmittel „Pfeile“/„Skala“ ohne Ergebnis (nicht bei Fragen nach der Umrechnungszahl). Üben (`practice.ts`, `PracticeView`) modular mit abnehmender Hilfe: US Stellenwerttafel (Antwort erscheint live als 2. Zeile) → Pfeile → ohne Hilfe; OS Skala → ohne Hilfe. Zwei Versuche: gezielter Tipp (`tipFor`), dann Lösung.
- Unterstufe: Länge, Fläche, Volumen/Hohlmaße, Masse (inkl. dag), Zeit. Oberstufe: µ/n/M/G-Einheiten, Zehnerpotenzen, zusammengesetzte Größen.

## Prüfen vor dem Commit
`npm run typecheck && npm test && npm run build`
