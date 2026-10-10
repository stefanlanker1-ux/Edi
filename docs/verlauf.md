# Änderungsverlauf (Archiv bis Oktober 2026)

Abgeschlossenes Archiv, keine Pflichtlektüre und keine neuen Einträge mehr. Was seitdem geändert wurde und warum, steht in den Commit-Nachrichten (`git log`);
der aktuelle Stand steht in `docs/entwicklung.md` und in `modules/<id>/CLAUDE.md`.

Neueste Einträge oben. Format: **Bereich** – was geändert wurde und warum (Commit). Ältere Einträge sind zu Abschnitten zusammengefasst.

- **Ionenbindung „Lernen“: natürliche Sprache, Animation Na + Cl, Lösung mit Wassermolekülen; Zurück in allen Erklärungen** (Ionenbindung, `@lern/ui` `Guide`) –
  Die Texte aller fünf Kapitel lasen sich wie Stichwortlisten („Gesamtladung: (1+) + (1−) = 0“, „Ca²⁺ ist 2 breit“, „Baue eine neutrale Wand“, „Dann prüfe.“,
  „11 p⁺ · 10 e⁻ → 1+“ – der Punkt wirkt wie ein Malzeichen). Jetzt in ganzen Sätzen, Ladungen in Worten, ohne das Gleichnis „Wand“ und ohne Klammer-Rechnungen
  (Folien, Merksätze, Rückmeldungen, Beschriftungen, englische Fassung). Neue verbindliche Regel „Natürliche Sprache“ für alle Module (Didaktik, mit Beispielen). Elektronenübergang ohne die Zeilen „übergegangen“ und
  „Gesamtladung“; vorgemacht Na + Cl als kurzer Ablauf (Elektron fliegt zum Chlor-Atom). In der Lupe „Strom leiten“ wanderten die Ionen in der Lösung nur etwa halb
  so schnell wie in der Schmelze: jetzt gleich schnell (gemessen), dazwischen schwirren Wassermoleküle (Test `k3/sim.test.ts`). Beschriftung „Wasser H₂O“ im Becherglas
  berührt keine Elektrode mehr. `Guide`: Knopf „Zurück“ in allen Erklärungen, Lektionen und Kapiteln (zeigt den vorigen Schritt gelöst); die Seite „Das kannst du jetzt“
  übernahm die feste Bildhöhe der letzten Folie (gleicher DOM-Knoten) und zeigte große Lücken – jetzt eigene Schlüssel.
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
