# Einheiten (`modules/einheiten`)

Stand, Aufbau und fachliche Entscheidungen dieses Moduls. Claude Code lädt diese Datei automatisch, sobald eine Datei in `modules/einheiten/` gelesen oder geändert wird.
Allgemeine Regeln (Didaktik, Oberfläche, Architektur, Prüfen): `docs/entwicklung.md`. Diese Datei beschreibt immer den **aktuellen** Stand – bei jeder Änderung am Modul im selben Commit anpassen.

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
