# Neutralisation (`modules/neutralisation`)

Stand, Aufbau und fachliche Entscheidungen dieses Moduls. Claude Code lädt diese Datei automatisch, sobald eine Datei in `modules/neutralisation/` gelesen oder geändert wird.
Allgemeine Regeln (Didaktik, Oberfläche, Architektur, Prüfen): `docs/entwicklung.md`. Diese Datei beschreibt immer den **aktuellen** Stand – bei jeder Änderung am Modul im selben Commit anpassen.

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
