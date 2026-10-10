# Atombau (`modules/atombau`)

Stand, Aufbau und fachliche Entscheidungen dieses Moduls. Claude Code lädt diese Datei automatisch, sobald eine Datei in `modules/atombau/` gelesen oder geändert wird.
Allgemeine Regeln (Didaktik, Oberfläche, Architektur, Prüfen): `docs/entwicklung.md`. Diese Datei beschreibt immer den **aktuellen** Stand – bei jeder Änderung am Modul im selben Commit anpassen.

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
