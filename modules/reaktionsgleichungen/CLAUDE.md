# Reaktionsgleichungen (`modules/reaktionsgleichungen`)

Stand, Aufbau und fachliche Entscheidungen dieses Moduls. Claude Code lädt diese Datei automatisch, sobald eine Datei in `modules/reaktionsgleichungen/` gelesen oder geändert wird.
Allgemeine Regeln (Didaktik, Oberfläche, Architektur, Prüfen): `docs/entwicklung.md`. Diese Datei beschreibt immer den **aktuellen** Stand – bei jeder Änderung am Modul im selben Commit anpassen.

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
