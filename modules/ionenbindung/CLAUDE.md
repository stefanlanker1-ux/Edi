# Ionenbindung (`modules/ionenbindung`)

Stand, Aufbau und fachliche Entscheidungen dieses Moduls. Claude Code lädt diese Datei automatisch, sobald eine Datei in `modules/ionenbindung/` gelesen oder geändert wird.
Allgemeine Regeln (Didaktik, Oberfläche, Architektur, Prüfen): `docs/entwicklung.md`. Diese Datei beschreibt immer den **aktuellen** Stand – bei jeder Änderung am Modul im selben Commit anpassen.

- **Bereiche: Lernen | Experimentieren** (erprobt die neue Ordnung, nur dieses Modul; kein Eintrag „Erklärung“, kein Quiz). Tab-Kennungen unverändert (`quiz` = Lernen, `build`).
- **Sprache in „Lernen“** (Muster der Regel „Natürliche Sprache“ unter „Didaktik“; gilt für alle Folien, Merksätze, Rückmeldungen und Beschriftungen der Kapitel): natürliche, ganze Sätze wie im Unterricht
  statt Stichwortketten mit Doppelpunkt und Pfeil; Ladungen in Worten („Ein Calcium-Ion hat zwei positive Ladungen, zwei Chlorid-Ionen bringen zusammen zwei
  negative.“, „Die positive Ladung von Na⁺ und die negative Ladung von Cl⁻ gleichen sich aus.“) – keine Rechnungen mit Klammern wie „2 · (1−) = 2−“ oder
  „(1+) + (1−) = 0“, kein „Gesamtladung“; Protonen und Elektronen ausgeschrieben („11 Protonen“, „10 Elektronen“), nie „11 p⁺ · 10 e⁻“ (der Punkt liest sich
  als Malzeichen); kein Gleichnis „Wand“ und keine Breiten („Ca²⁺ ist 2 breit“) – die Bausteine im Bild zeigen die Ladung, der Text spricht von Ionen und Ladungen;
  Aufträge ohne „Jetzt du:“, „Ergänze:“ und „Dann prüfe.“ (das Kennzeichen über der Folie und der Knopf „Prüfen“ sagen das schon), ohne Bedienungsjargon
  („Füge dem Sauerstoff-Atom 2 Elektronen hinzu – dann hat es 8 Außenelektronen.“, „Bringe die Lampe zum Leuchten.“); Element nicht doppelt („Ca steht in der
  II. Hauptgruppe.“ statt „Calcium Ca …“). Zustand unter den Ionen-Bausteinen ebenso in Worten (`balanceText` in `components/IonWall.tsx`, auch in der Werkbank):
  „✓ ausgeglichen: 2 positive und 2 negative Ladungen“ bzw. „noch nicht ausgeglichen: 2 positive, 4 negative Ladungen“.
- **Lernen** (`src/lernen/`): Kapitel je Stufe als Karten (`LernenView.tsx`: Nummer, Titel, ein Satz, Fortschrittsbalken, „Folie n“ bzw. „✓ fertig“). Level I = Kapitel 1–3,
  Level II = Kapitel 4–5 („baut auf Kapitel 1–3 auf“). Ein Kapitel = **25 Folien** in 4 Abschnitten (`part`, je höchstens 8) als `GuideDef`, gezeigt mit `Guide`
  (Vollbild, Kennzeichen „Kapitel n“, öffnet an der zuletzt gezeigten Folie, am Ende „Kapitel n+1“). Erklärung und Aufgaben in einem Fluss: jeder Abschnitt
  vorgemacht → halb gelöst → selbst (alle Regeln der Erklärung, `checkGuide`).
  Hilfsmittel jeder Folie (Leiste mit „Weiter“): **PSE** (Elemente der Folie markiert), **Tipp** (`tip` der Folie, kostet nichts, verrät nie die Lösung),
  **Erklärung** (Merksätze des Abschnitts, `explain` am Kapitel). Fortschritt in localStorage `ionenbindung-lernen` (`progress.ts`: Folie, weiteste Folie, fertig; `progressKey`).
- **Modell-Folien** (`model.tsx`, mindestens 13 von 25, Test `kapitel.test.ts`): Schüler verändern das Modell (Bohrmodell, Ionen-Bausteine, Formel- und Namens-Baukasten, Gitter,
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
  und Edelgase bilden in diesem Modell keine einfachen Ionen), Elektronenübergang mit „e⁻ übertragen“ und einstellbarer Zahl der Atome (Beschriftung nur Symbol mit Ladung
  und „✓ wie Ne“, keine Zeile „übergegangen“ und keine Ladungssumme); vorgemacht Na + Cl als kurzer Ablauf (`Transfer play`): erst die Atome, dann fliegt das
  Außenelektron des Na-Atoms im Bogen auf den freien Platz des Cl-Atoms, die leere Schale des Na⁺ blendet aus, „Nochmal abspielen“ (reduzierte Bewegung: gleich das Endbild);
  Fehlvorstellungen „Elektron verschwindet“, „Ionen entstehen einzeln“. Test `k1/k1.test.ts`.
- Kapitel 2 **Formel und Name** (Level I, `k2.tsx`, `k2/models.tsx`): **Ladungen ausgleichen** (Ionen-Bausteine mit Zählern; im Text „Gleiche die Ladungen von Na⁺ und O²⁻ aus“, nie „Wand“) · **Die Formel** (Verhältnisformel, Index, kleinstes
  Verhältnis; Formel-Baukasten mit Index-Zählern, Reihenfolge-Tausch, Ionen-Bausteine darunter) · **Der Name** (Metall + Wortstamm + -id; Oxid, Sulfid, Nitrid; Namens-Baukasten aus
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
  Schmelze und Lösung bewegen sie sich ungeordnet und wandern bei geschlossenem Schalter zusätzlich deutlich sichtbar waagrecht aneinander vorbei (`lensDrive`, FLOW 3,4: Ziel Schmelze 1,56 · LU/s, Lösung 2,31 · LU/s;
  senkrechte Wärmebewegung gedämpft `calm` 0,3 bei Strom, 0,8 ohne; Lösung mit `mix`, damit keine Reihen gleicher Ladung entstehen). In der Lösung schwirren zwischen den
  12 Ionen 17 Wassermoleküle (`solutionSites`, q = 0, gewinkelt 104,5° wie `WaterShape`, O rot, H hell, langsam taumelnd; Größe im Verhältnis zu Cl⁻ wie in Wirklichkeit):
  ungeordnete Bewegung in alle Richtungen (`swirl`), keine Anziehung, kurz vor der Berührung weich zurückgedrängt, beim Zusammenstoß weichen sie den Ionen aus –
  die Ionen gleiten hindurch und wandern im Mittel **genauso schnell wie in der Schmelze** (gemessen, Test: Verhältnis 0,8–1,25), das Wasser wandert nicht mit;
  Legende mit dritter Zeile „Wasser H₂O“ (Platz immer frei)
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
  Atome laut Formel und laut Ionen-Bausteinen im Vergleich – CaOH₂ = 1 O, NH₄₂ = 42 H) · **Name ↔ Formel** (Ionenwahl, Namens-Baukasten). Nur beständige Verbindungen (Test `k4/k4.test.ts`).
- Kapitel 5 **Nebengruppenmetalle** (Level II, `k5.tsx`, `k5/models.tsx`) – **ohne Elektronenkonfiguration** (kein Kästchenschema, kein 4s/3d) und **ohne Auswendigwissen**
  (kein Silber/Zink, keine Aussagen „dieses Ion gibt es nicht“): **Ein Metall – mehrere Ionen** (zwei Stoffe aus denselben Elementen als Stoffproben: FeO schwarz/Fe₂O₃
  rotbraun, Cu₂O rot/CuO schwarz; Brücke zu Kapitel 1 mit Spaltenleiste `GroupStrip` (Blöcke 1 | 2 | 3–12 | 13 | 14 | 15–18 über I | II | Nebengruppen | III | IV | V–VIII, Schrift ≥ 14 px): im großen PSE Gruppe 1, 2 = I., II. Hauptgruppe, Gruppe 13–18 = III.–VIII. Hauptgruppe,
  dazwischen Gruppen 3–12 = Nebengruppen; Regel: Metalle der I. bis III. Hauptgruppe → Ladung aus der Hauptgruppe, alle anderen – Nebengruppenmetalle und Blei, IV. Hauptgruppe,
  PbO gelb/PbO₂ dunkelbraun – römische Zahl im Namen; Metalle wählen mit großen Knöpfen unter dem neutral gefärbten PSE, `PseMetals`) · **Vom Namen zur Formel** ·
  **Von der Formel zum Namen** · **Alles zusammen** (mehratomige Ionen). Ionen-Bausteine mit Ladungswahl (`WallModel`): vor dem Lösen nur „ausgeglichen“/„noch nicht ausgeglichen“ in neutraler Farbe,
  ✓ („✓ ausgeglichen: …“, in Worten) und Name erst danach; in freien Folien stellen die Schüler die Anzahlen laut Formel selbst ein (die 2 in Cu₂ ist die Anzahl); Rückmeldungen nur über
  Ladungsbilanz in Worten („Ein Fe³⁺ bringt drei positive Ladungen, ein O²⁻ nur zwei negative.“) und Namen (`wallWhy`, `pseWhy`). Nur Fe, Cu, Pb(II) aus `ions.ts`, nur beständige Stoffe; Gruppe 13 immer mit „= III. Hauptgruppe“ (Test `k5/k5.test.ts`).
- **Experimentieren** (Werkbank, unverändert): Ionen-Bausteine Kationen gold, Anionen grün, Breite = Ladung; neutral, wenn beide Reihen gleich lang sind. Startet gelöst
  (CaCl₂: ein Ca²⁺, zwei Cl⁻; `store.ts`). Vom Atom zum Ion (`IonSheet`): Schalen aus dem gemessenen Grundzustand (Cu: 1. Schale 2, 2. Schale 8, 3. Schale 18, 4. Schale 1 Elektron → Cu⁺ ohne 4. Schale; Tabelle mit einer Zeile je Schale); Kennzeichen „n Außenelektronen“
  nur bei Ionen mit Edelgaskonfiguration, sonst (Fe³⁺, Cu²⁺, Pb²⁺) in der Oberstufe „gibt 3 e⁻ ab“ · „aus 4s², 3d¹“, in der Unterstufe nur „keine Edelgaskonfiguration“;
  Atom und Ion im selben Rahmen (`slots` = Schalen des Atoms).
- Ionen, Formeln (`formula`, `ratio`) und Namen (`compoundName`) in `packages/chem/src/ions.ts`. Unterstufe nur Hauptgruppen-Ionen, Oberstufe zusätzlich Übergangsmetalle und Blei
  (römische Zahlen) und mehratomige Ionen (NH₄⁺, OH⁻, NO₂⁻, NO₃⁻, HCO₃⁻, SO₃²⁻, SO₄²⁻, CO₃²⁻, PO₄³⁻). Nicht beständige Verbindungen (FeI₃, CuI₂, Fe₂S₃, Al₂(CO₃)₃, AgOH, Na₃N, K₃N,
  Cu⁺-Salze mit Sulfat/Sulfit/Nitrit/Hydrogencarbonat, Nitrite und Sulfite von Al³⁺/Fe³⁺/Cu²⁺ …) stehen in `NOT_KNOWN` (`isKnownCompound`): Kapitel fragen sie nicht ab, der Baukasten zeigt einen Hinweis.
- Fachsprache: Elektronenübergang als **Modell der Ionenbildung**, die **Ionenbindung** ist die Anziehung der entgegengesetzt geladenen Ionen im **Ionengitter**; beschreibend
  (nie „Atome möchten 8 außen“, nie „Ca²⁺ braucht …“, sondern „gleicht aus“ bzw. „man braucht“). Endung **-id**: meist einatomig (Ausnahme Hydroxid OH⁻). Ionennamen
  ausgeschrieben, wo sie eingeführt sind („Chlorid-Ion“, „Oxid-Ion“). Ladungsausgleich in Worten (siehe „Sprache in Lernen“), nicht als Rechnung mit Klammern. Ohne „kgV“ (nicht eingeführt).
