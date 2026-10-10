# Nomenklatur (`modules/organik`)

Stand, Aufbau und fachliche Entscheidungen dieses Moduls. Claude Code lädt diese Datei automatisch, sobald eine Datei in `modules/organik/` gelesen oder geändert wird.
Allgemeine Regeln (Didaktik, Oberfläche, Architektur, Prüfen): `docs/entwicklung.md`. Diese Datei beschreibt immer den **aktuellen** Stand – bei jeder Änderung am Modul im selben Commit anpassen.

- Organische Verbindungen frei zeichnen, der Name folgt nach IUPAC (deutsche Schreibweise: Benzen, Oct, Ethansäure, Butansäureethylester), mit weiteren Namen
  (Trivialname, Benzol-Schreibweise, ältere Schreibweise 2-Propanol, Diethylether, Ethylamin, Ethylbutanoat), Summenformel nach Hill und Stoffklassen.
  3D auf Abruf (Werkzeug „3D“, `components/View3D.tsx`): hinterlegte Struktur (`storedFor`), sonst Kraftfeld MMFF94 (`computeMol3D`; Eingabe `chem/forcefield.ts`:
  alle H, NO₂ mit Ladungen, E/Z wie gezeichnet); Kugel-Stab oder Kalotte.
- Logik in `src/chem/`: `mol.ts` (Graph ohne H, Wertigkeit, NO₂ als Baustein mit einer Bindung), `rings.ts` (nur Einzelringe: Cycloalkane, Benzen,
  Heterocyclen mit einem O/S/N: Oxolan, Thiolan, Pyrrolidin, Oxan, Thian, Piperidin, Furan, Thiophen, Pyrrol, Pyridin …; kondensierte Ringe, Ringe über 30 Atome
  und Dreifachbindungen im Ring → eigene Meldung), `naming.ts` (Stämme bis 30 C, längere Ketten → Meldung „zu lang für diese App“; mehr Bindungen als die Wertigkeit
  → Meldung; ranghöchste Gruppe (im Code `principal`) nach Rang Säure > Ester > Amid > Nitril > Aldehyd > Keton > Alkohol > Thiol > Amin; Stammsystem nach IUPAC 2013: meiste ranghöchste Gruppen,
  Ring vor Kette, Ring mit N vor O vor S vor Carbocyclus, größerer Ring, längste Kette (C der Gruppe in der Kette vor „-carbonsäure“), meiste Mehrfach-, dann Doppelbindungen;
  Nummern: ranghöchste Gruppe, Mehrfachbindungen, Doppelbindungen, dann meiste Vorsilben, Vorsilben, alphabetisch erste, Z vor E; gleiche Buchstaben: kleinere Nummern zuerst
  (1-Methylbutyl vor 2-Methylbutyl). Vorsilben rekursiv: (1-Methylethyl), Acetyloxy, (Dimethylamino), Methoxycarbonyl, Piperidin-1-yl; Klammern außen ( ) → [ ] → { } → ( );
  ohne Nummern steht eine Vorsilbe, die selbst Substituenten tragen kann, hinter einer anderen in Klammern (Chlor(methoxy)methan, [Ethyl(methyl)amino]);
  N, N′, N″ an mehreren Aminen; > 2 COOH an einer Kette → -carbonsäure; Ester „Säure + Alkyl + ester“, verschiedene Alkylreste mit Nummern (Butandisäure-1-ethyl-4-methylester;
  weiterer Name Alkyl…oat: ein Alkylrest ohne Klammer – 2-Methylpropylacetat –, verschiedene Alkylreste nur ohne Vorsilben am Säureteil – 1-Ethyl-4-methylbutandioat,
  nicht „4-Ethyl-1-methyl-2-methylbutandioat“),
  gleichwertige Säureteile (Diacetat eines Diols): bestes Stammsystem, dann alphabetisch; Nummern weglassen nur, wenn eindeutig: Ethanol, Propen, Methylcyclohexan, Butansäure;
  Keten C=C=O → Meldung). Varianten für das Quiz über `NameOptions` (andere Seite, kürzere Kette, nicht alphabetisch, ohne di/tri, andere ranghöchste Gruppe);
  „andere Seite“ liefert in `reverse` die Regel, nach der die beste Richtung gewinnt (ranghöchste Gruppe, Mehrfach-/Doppelbindung, Vorsilben, Alphabet, Z), mit beiden Nummernfolgen.
  Englisch: `nameEnOrder` bestimmt Reihenfolge und Nummern mit den englischen Vorsilben (ethyl vor ethynyl, propyl vor prop-2-ynyl; deutsch Ethinyl vor Ethyl),
  `english.ts` übersetzt danach Teil für Teil; verschiedene Alkylreste eines Esters alphabetisch (4-ethyl 1-methyl 2-methylbutanedioate).
  Stoffklassen: C=O im Ring neben dem Heteroatom = Lacton/Lactam/Thiolacton (Name wie Keton, -on; Lösungsweg sagt es), OH am Benzolring = Phenol, OH am Heteroaromaten
  kein Alkohol (Klassen Heterocyclus, Aromat), OH an C=C = Enol, Cycloalken nur bei C=C zwischen zwei Atomen desselben Rings (exocyclisch = Alken), Thioether.
  Lösungsweg: „Ranghöchste Gruppe: …“; Heterocyclus ohne Gruppe: „Der Ring mit Heteroatom hat einen eigenen Namen.“ „Nummerieren“ (`numberingSteps`) nennt die Regel,
  nach der die beste Nummerierung gegen die nächstbeste gewinnt (`reverseRule`), mit beiden Nummern; was von beiden Seiten gleich ist, steht davor („Die ranghöchste Gruppe
  hat von beiden Seiten C3. Dann entscheidet der Ast: 2 statt 4.“, Alphabet, Z); Heterocyclus: „Das Heteroatom im Ring hat immer die Nummer 1. Weiter so zählen, dass …“;
  Name ohne Nummern (Ethanol, Phenol): „Die Nummer steht nicht im Namen: Er ist auch ohne eindeutig.“ Benzolring mit einer Gruppe: „Statt Benzenol heißt es Phenol
  (eingeführter Name).“ Ring mit einer ranghöchsten Gruppe: „Das C mit der ranghöchsten Gruppe ist C1. Weiter so zählen, dass …“ (kein „1 statt 2“).
  Vorsilben wie im Namen, zusammengesetzte in Klammern (4-(1-Methylethyl), 4,5-Bis(1-methylethyl)); Gruppe des Amins/Amids nach den H am N
  (–NH₂, –NH–, –N<; –CONH₂, –CONH–, –CON<). Ester: Säureteil, Alkylteil (ohne Bindestrich).
  Zahlwörter für gleiche Teile bis 99 (`MULT`/`MULT_X` in `rings.ts`: … deca, undeca, dodeca, icosa, henicosa, docosa, triaconta …; Tetradecachlorhexan).
  Endungen in Sätzen (Lösungsweg, Quiz-Texte, Erklärung, Erklärkarten) mit geschütztem Bindestrich U+2011 (`keepEnding`), damit „-in“ nie am Zeilenende
  getrennt wird, und nach „–“ vor Formeln mit Wortverbinder U+2060 (–COO–, –OH); Namen und Antworten bleiben unverändert.
  `layout.ts` (Zickzack 120°, Ringe als Vielecke, Start am fernsten C; an C=C nie eine gerade Linie und nie beide Gruppen auf derselben Seite, sonst wäre E/Z nicht ablesbar;
  gedrängte Äste – Endatome, Teilbäume und Ringe als Ast bis 8 Atome – starr um ihr Anknüpfungsatom in die freieste 15°-Richtung gedreht, am Ring nur nach außen,
  nicht an C=C außerhalb kleiner Ringe, `spreadBranches`: Perchlorhexan ≥ 0,7 Bindungslängen, Prüfmoleküle ohne Abstand < 0,5;
  `orient` dreht kleine Bilder in 30°-Schritten passend zur Fläche),
  `edit.ts` (Anhängen, Ziehen, Ring schließen, Bindung 1→2→3, Tauschen, Löschen), `smiles.ts` (Kurzschreibweise für Beispiele/Tests, E/Z mit / und \).
  Der Test prüft u. a. alle Beispiele, Namen unabhängig von der Atomreihenfolge (Zufallsmoleküle) und die Laufzeit.
- E/Z (`stereo.ts`): Rangfolge der Gruppen an jedem C der Doppelbindung nach CIP (Ordnungszahl, Sphäre für Sphäre, Mehrfachbindungen und Ringschlüsse als Duplikate),
  Seite aus der Zeichnung (höherrangige Gruppen gleiche Seite = Z, verschiedene = E; gerade gezeichnet → nicht ablesbar, Hinweis im Lösungsweg). Kein E/Z bei zwei gleichen
  Gruppen an einem C, bei kumulierten Doppelbindungen und im Ring unter 8 Atomen. Im Namen (E)- bzw. (2E,4Z)-, auch in Vorsilben ([(E)-Prop-1-enyl]); Z bekommt bei Wahl
  die kleinere Nummer; cis/trans als weiterer Name, wenn an beiden C ein H sitzt; Trivialnamen (Maleinsäure, Fumarsäure, Ölsäure, Geraniol …).
  Zeichnen: Tauschen an einer C=C spiegelt eine Seite (E ↔ Z, `flipBond`), „Ordnen“ behält E/Z (`keepStereo`); im Bild Achse, Vorrang-Bindungen und Buchstabe (E/Z).
- Prüfung der Benennung (`src/chem/check/`, `scripts/organik-oracle.py`): Generator mit festem Startwert (`generate.ts`: alle Alkane bis C10, jede Mehrfachbindung,
  jede Gruppe an jeder Stelle, Kombinationen, große verzweigte Gerüste, Ringe und Heterocyclen, Ester/Amide/Amine/Ether, E/Z-Fälle, Trivialnamen, Zufallsmoleküle;
  rund 17 500 Moleküle) → Export (`export.test.ts`, nur mit `ORACLE_OUT`) → Python: englischer Name (`english.ts`) an OPSIN, Struktur muss der gezeichneten gleichen
  (RDKit, E/Z aus dem Molfile `molfile.ts`), auch für weitere Namen; eigene Umsetzung der Regeln für Stammsystem und Nummern (die Wahl der App muss die beste sein),
  alphabetische Reihenfolge, Summenformel, Zahl der E/Z-Angaben, Eindeutigkeit (gleiche Struktur ↔ gleicher Name); im Export zusätzlich gleicher Name bei anderer
  Atomreihenfolge und nach neuem Zeichnen. Aufruf im Hauptordner: `python3 scripts/organik-oracle.py [--seed N]` (Voraussetzungen: RDKit, Java 11+; OPSIN-Jar über
  `--opsin`/`OPSIN_JAR`, sonst aus dem PyPI-Paket py2opsin). Geprüfte Namen als Korpus `korpus.tsv` (`--corpus`), den `npm test` nachrechnet; nach gewollten
  Änderungen den Korpus neu schreiben.
- Zeichnen: Atom antippen = Stift anhängen, in der Lewis-Formel ein H antippen = Stift genau dort anhängen, vom Atom ziehen = neue Bindung, im Modus Tauschen ziehen = Atom verschieben; Meldung oben sagt, warum etwas nicht geht (Wertigkeit voll …), Erfolg vibriert kurz; Knopf „Ordnen“ zeichnet neu im Zickzack; in 30°-Schritten, auf ein Atom ziehen = Ring schließen; Stifte C O N S + zuletzt gewählter
  (Mehr: F Cl Br I NO₂, Benzolring, Sechs-, Fünfring); Modus Anfügen | Tauschen | Löschen (Löschen/Tauschen: Atome gestrichelt markiert). Fester Maßstab (Bindung ≈ 56 px, Tippziele ≥ 48 px), das Bild verschiebt bzw. verkleinert sich nur,
  wenn die Zeichnung nicht passt; Bindung/H zählen nur, wenn der Finger auf demselben Ziel aufsetzt und loslässt. Lewis-Formel (alle H, freie Elektronenpaare als Striche) oder Gerüstformel.
  Name erst nach „Benennen“, danach live; Knopf „Farbe“ (gespeichert): jeder Teil des Namens hat eine Farbe – Stamm blau, ranghöchste Gruppe rot, jede Vorsilbe
  (Methyl, Ethyl, Hydroxy, Oxo …) und der Alkylteil des Esters eigene –, dieselbe Farbe im Namen und an den Atomen der Formel (`NamePart`/`groupsByKey` aus naming.ts, `components/colors.ts`); Hauptkette hinterlegt, Nummern rot, ranghöchste Gruppe markiert. Werkzeuge: Beispiele (nach Stoffklasse) | Schritte (Lösungsweg) | Gruppen (Rangfolge) | Ansicht | 3D | Zurück | Neu;
  lange Beschriftungen mit weichen Trennstellen U+00AD (Bei|spiele, Schrit|te, Grup|pen; Exam|ples, Skel|etal), bei 360 px zweizeilig statt abgeschnitten.
  Läge ein Atom unter „Farbe“ oder „Ordnen“, bleibt oben ein Streifen frei (`covered`, `TOP` in `Editor.tsx`); sonst kein Streifen, damit nichts unnötig kleiner
  wird. Tippziele bleiben ≥ 44 px, auch verkleinert: Atome mit festem Radius in px, Bindungen mit Strichbreite nach der schmalen Seite der Bindung.
  Ziehen auf ein volles Atom: Meldung in der eingestellten Sprache, markiert wird das volle Atom (Start oder Ziel).
  Stifte auch bei 360 px Breite (mit „Lesbar“) mindestens 44 × 44 px in einer Reihe.
  Start: Gerüstformel, Farbe an, Beispiel 2-Methyl-3-oxohexansäure mit Name (`START` im Store; ältere Stände einmal umgestellt).
  Name in Farbe = farbige, kräftige Schrift (keine hinterlegte Fläche); Stamm blau, ranghöchste Gruppe rot, Vorsilben grün/violett/grünblau …
  Gespeichert (`organik-v1`): Zeichnung, Stift, Ansicht, Name sichtbar, Farbe.
- Quiz (`src/quiz/tasks.ts`, Katalog `misconceptions.ts`): stamm, kette (Zahl), alkan, alken, lage (Zahl), klasse, endung, gruppen, ester, prio, mehrere, struktur (Name → Formel,
  Antworten als Gerüstformel). Falsche Namen kommen aus der Benennung selbst. Hilfsmittel: Groß (Formel bildschirmfüllend), Regeln (Stämme nicht bei stamm, Rangfolge nicht bei klasse/endung/prio).
  Nur chemisch mögliche Moleküle (kein Ast am C des Ketons; Test: Wertigkeit in allen Aufgaben aller Generatoren). Jede Rückmeldung passt zum Distraktor:
  andere Seite nennt die entscheidende Regel mit den Nummern („Das C der –CHO-Gruppe ist immer C1.“, „Dann entscheidet das Alphabet: Ethyl bekommt die 3.“,
  „2,5,5 statt 3,3,6. Der erste Unterschied entscheidet.“), ohne di/tri und nicht alphabetisch mit den Vorsilben der Aufgabe; andere Gruppe an derselben Stelle
  ändert nur die Gruppe (Aldehyd/Säure nur am Kettenende); Name → Formel (`formulaMiss`): COOH bleibt ganz, kein zweites O/N am selben C, Rückmeldung nennt den
  Unterschied – andere ranghöchste Gruppe (endung), abweichende Vorsilben (formel-lesen), Kette ±1 C (zaehlen), alle Nummern gespiegelt (nummer: vom falschen
  Ende gezählt), sonst eine Gruppe an anderer Stelle (stelle: „Methyl sitzt hier an C3 statt an C2“). Antworten 2 × 2, die vier Formeln teilen sich die Höhe der Karte
  (nie abgeschnitten), gedreht passend zur Zelle (`orient`); Atom-Beschriftung in Aufgabenbild und Antworten mindestens 13 px (`labelScale` aus dem gemessenen
  Maßstab); wird ein Bild niedriger als `data-min-h`, stehen Tipp und erster Schritt im Blatt. Erklärung aus dem Lösungsweg ohne die Zeile „Nummerieren“, wenn eine
  Rückmeldung schon die Zählrichtung nennt. Moleküle, deren Zählrichtung das Alphabet oder der erste Unterschied entscheidet (nicht eingeführt), fragt das Quiz
  nicht ab (`rareRule`). Level 4 mit Oxo-Vorsilben (=O neben Säure oder Aldehyd); falsche Rangfolge als Name nicht bei Säuren (sonst „1-Hydroxy-…-1-oxo…“);
  prio: OH/C=O der COOH-Gruppe genau benannt, ein zusätzliches Keton wird genannt. Kein „cis/trans“ (nirgends eingeführt).
  Tipps sind Denkschritte ohne Zuordnung und ohne Rangfolge (endung: „Bestimme zuerst die Gruppe …“, prio: „Benenne zuerst jede Gruppe … Plätze in der Rangfolge“,
  stamm: „Welcher Stamm gehört zu dieser Zahl?“; Test). klasse: Rückmeldung beschreibt die gewählte Klasse, die Erklärung die richtige (kein Satz doppelt).
  Level: 1 Alkane (Stämme bis Dec, längste Kette, Äste) · 2 Doppel- und Dreifachbindung (Alken/Alkin, Lage, E/Z) · 3 Funktionelle Gruppen (Stoffklassen, Endungen, Ester) ·
  4 Mehrere Gruppen (Rangfolge, Vorsilben, Name → Formel); feste Reihenfolge je Level. Erklärkarten (`quiz/explain.tsx`) führen ein, was die Erklärung nicht hat
  (Hept … Dec, Alken/Alkin, Stoffklasse, Ordnungszahl bei E/Z, Chlor-/Amino-Vorsilben; Level 3 alle Klassen fett mit Gruppe: Alkohol, Aldehyd, Keton, Carbonsäure, Amin,
  Ester, Ether – Ester: „–COO– verbindet Säureteil und Alkylteil“; Level 1 di/tri und alphabetisch, di/tri zählen nicht; Level 2 bei gleichem Atom entscheiden die
  **Nachbarn**; Level 4 **ranghöchste Gruppe**, Oxo- = C=O). Begriff „Äste“ überall (Quiz, Lösungsweg `naming.ts`, Stolpersteine; englisch „branches“); „ranghöchste Gruppe“
  (englisch „principal group“) statt „Hauptgruppe“, das im Atombau die Gruppe im PSE ist.
- Erklärung (24 Schritte, keine Stufen): **Alkane** (Stamm, Methan … Hexan) · **Äste und Nummern** (Hauptkette, Ast, Methyl, Nummerierung vom nahen Ende, di/tri,
  **Ethyl**, alphabetisch, di/tri zählen nicht) · **Mehrfachbindungen** (-en = Alken, -in = Alkin, Nummer, E/Z, gleiches Atom: die **Nachbarn** entscheiden) ·
  **Alkohole** (halb gelöst ohne Aldehyd/Keton, die erst später kommen; selbst: Beginn der Nummerierung bei Butan-2-ol) · **Säuren und Rangfolge**
  (Carbonsäure, Aldehyd, Keton, Amin, Vorsilbe fett eingeführt; erst **Rangfolge**, dann **ranghöchste Gruppe** = die Gruppe, die in der Rangfolge vorn steht).
  Richtige Antwort an wechselnden Plätzen (Test: höchstens 40 % an Platz 1).
