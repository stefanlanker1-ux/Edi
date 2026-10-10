# Polymere (`modules/polymere`)

Stand, Aufbau und fachliche Entscheidungen dieses Moduls. Claude Code lädt diese Datei automatisch, sobald eine Datei in `modules/polymere/` gelesen oder geändert wird.
Allgemeine Regeln (Didaktik, Oberfläche, Architektur, Prüfen): `docs/entwicklung.md`. Diese Datei beschreibt immer den **aktuellen** Stand – bei jeder Änderung am Modul im selben Commit anpassen.

- Keine Stufen. Leiste **Üben | Experimentieren** wie Gemische: Üben = sechs Kapitel, je Kapitel Lektion → zehn Aufgaben.
- **Begriffe beim Üben** (`quiz/lexicon.tsx`): alle Monomere (Strukturformel, Kügelchen, ein Satz „Wie Ethen, aber …“, weiterer Name), Kunststoffe (Kurzzeichen, Monomer,
  Verwendung), Starter/Katalysatoren (Formel, Verfahren) und funktionelle Gruppen sind im Text antippbar, Hilfsmittel „Begriffe“ listet die der Aufgabe. Nicht gezeigt, wo es
  die Antwort wäre (`HIDE`: Monomer bei Monomer ↔ Polymer, Verwendung bei Alltagsfragen; Test: keine Karte aus Frage/Antworten nennt die richtige Antwort).
  Jede Fertigkeit hat einen eigenen Tipp (`tip`, in jedem Modus statt des allgemeinen Hinweises – Kapitel, „Alles gemischt“, „Heute fällig“, „Schwächen üben“, auch im
  gelösten Beispiel; nur der Verweis auf die Erklärkarte `hintCue` bleibt im Kapitel) mit den Stoffen der Aufgabe, als Denkschritt – nie mit der Regel oder der Antwort
  (Test je Typ mit verbotenen Wendungen).
  Auch in den Lektionen sind Begriffe antippbar (`GuideDef.terms`, Antwortknöpfe ohne). Monomer-Bilder in Aufgaben tragen eine Zeile mit Name und Merkmal
  (`Vis.note`: „**Styrol** – die C=C trägt einen Benzolring“); ein Lektionsschritt, der nach Stoffen fragt, zeigt sie vorher mit Namen (`Row`).
- **Experimentieren** (`views/ExperimentView.tsx`): am Anfang Auswahl **Polymerisation | Polykondensation | Polyaddition** (Zeile „Art der Reaktion wählen“, darunter
  drei Karten mit Kügelchen-Bild (ganz im Bild, am schmalen Handy kleiner), oben beginnend – keine Leerfläche darüber; Kennzeile „Nebenprodukt H₂O bzw. HCl“ ohne einzelnes Wort am Zeilenende), danach oben als Umschalter.
  Kennzeichen (Produktkarte, Statuszeile) einheitlich mit großem Anfangsbuchstaben, auch auf Englisch. Gespeichert (`polymere-v1`): Art, Ansatz je Art, Ansicht, Schalter „Bausteine farbig“ und „Freie Elektronenpaare“ – der Ablauf selbst
  nicht (beim Öffnen beginnt der Ansatz von vorn). Ansatz:
  - Polymerisation: Monomer (`VINYLS` in `chem/data.ts`: Ethen, Propen, Styrol, Vinylchlorid, Methylmethacrylat, Acrylnitril, Tetrafluorethen, Isobuten,
    Butadien (Einbau 1,4), Vinylacetat), optional ein zweites (gleichzeitig = statistisches Copolymer; nacheinander = Blöcke nur bei lebenden Ketten, sonst zwei
    getrennte Polymere, `seqKind`), Verfahren (`METHODS`): Dibenzoylperoxid und AIBN (radikalisch, Initiator), Ziegler-Natta TiCl₄ + Al(C₂H₅)₃ (koordinativ, Katalysator),
    Butyllithium (anionisch), BF₃ mit Wasser (kationisch).
  - Polykondensation / Polyaddition: 18 Monomere mit funktionellen Gruppen (`STEPS`: Disäuren, Säurechloride, Diole, Glycerin, Ethanol und Essigsäure als
    Kettenstopper, Diamine, Milchsäure und 6-Aminohexansäure als AB-Monomere, Phenol + Methanal, HDI, MDI, Bisphenol-A-diglycidylether), Monomer 1 + Monomer 2
    oder ein Monomer allein (nur AB-Monomere reagieren mit sich selbst).
  - Auswahl-Blätter: Monomere als Karten mit Kügelchen, Name und **Halbstrukturformel**; der reagierende Teil (C=C bzw. Gruppen) ist fett und in der Farbe des
    Monomers hinterlegt (`struct` mit `{…}`). Lange Namen an Wortfugen trennbar (weiches Trennzeichen). Niedrige Handys (≤ 700 px hoch): keine Ansatz-Zeile,
    die Werkzeugleiste zeigt stattdessen die Auswahl (Monomer, zweites Monomer, Verfahren).
- **Fachlogik** (`chem/rules.ts`): Verträglichkeit Monomer × Verfahren (`compat`: ok / short / none, Art des Misserfolgs, Begründung in kurzen Sätzen):
  Monomere mit O, N, Cl oder F **vergiften** Ziegler-Natta (freies Elektronenpaar besetzt die freie Stelle am Titan), Isobuten ist zu sperrig; Propen und Isobuten
  radikalisch nur kurze Ketten (Abriss eines Allyl-H); anionisch nur mit stabilisierenden Gruppen (Styrol, Butadien, Acrylnitril, Methylmethacrylat bei −78 °C) –
  lebende Ketten, außer Acrylnitril (Nebenreaktionen an der C≡N-Gruppe beenden die Ketten nach und nach). **Anionisch nacheinander** (`anionStarts`, `seqKind`):
  ein Kettenende startet nur Monomere mit gleich stark oder stärker stabilisiertem Anion (Reihe Styrol/Butadien → Methylmethacrylat → Acrylnitril) – Styrol → MMA
  ergibt Blöcke, MMA → Styrol nicht (Styrol bleibt übrig, nur PMMA); bei Acrylnitril als erstem Monomer sind die Ketten bis dahin tot. Gleichzeitig anionisch mit
  verschieden starken Enden setzt sich das Monomer mit dem schwächeren Ende durch (Styrol + MMA → fast nur PMMA; `anionFirst`); gleich starke Enden (Styrol + Butadien
  in Kohlenwasserstoff): Butadien lagert sich viel schneller an (r ≈ 12 bzw. 0,03) – **Gradienten-Copolymer** (erst fast nur Butadien, zum Schluss Styrol;
  statistisches SBR anionisch nur mit polarem Zusatz). Nacheinander radikalisch, kationisch oder mit Ziegler-Natta: zwei getrennte Polymere (Produkt „Gemisch aus …“,
  `mix`, Bild beider Wiederholeinheiten; Hinweis: übriges erstes Monomer bauen die neuen Ketten mit ein). **Ein Monomer bildet mit dem Verfahren keine Ketten**
  (`withFailing`): das andere ergibt sein Homopolymer (`unreacted`, z. B. Ethen + Isobuten mit Ziegler-Natta → PE-HD; nacheinander Ethen → Vinylchlorid: erst PE-HD,
  dann vergiftet); kein Polymer nur, wenn der Katalysator von Anfang an vergiftet ist (gleichzeitig bzw. das giftige zuerst) oder eine Nebenreaktion den Starter vorher
  verbraucht hat; beide ungeeignet, eines mit kurzen Ketten → „Nur kurze Ketten“; ein Monomer mit kurzen Ketten (Allyl-H, H⁺-Abgabe) neben einem passenden: gleichzeitig
  wird es wenig eingebaut und bremst – vor allem das Homopolymer des anderen (Isobuten + wenig Butadien kationisch: vulkanisierbar wie Butylkautschuk, `rubber: "butyl"`);
  nacheinander getrennt – erst das Homopolymer des passenden, daneben eigene kurze, ölige Ketten. **Radikalisch gleichzeitig** (`radicalFirst`): Monomere mit
  konjugierter C=C (Styrol, Butadien, MMA, Acrylnitril) lagern sich viel schneller an als Vinylacetat, Vinylchlorid, Ethen (r₁ ≫ 1 ≫ r₂, z. B. Styrol/Vinylacetat
  r ≈ 55 bzw. 0,01) – erst fast nur das Homopolymer des schnellen, das andere erst nach dessen Verbrauch (Styrol hemmt Vinylacetat sogar); Atom-Ansicht und Reaktor
  ebenso. Ethen + Tetrafluorethen: nahezu alternierend (ETFE, `alt` in `COPOS`, `altPair`). Übrige Paare ohne Eintrag: „etwa gleich schnell … zufällige Reihenfolge“. Vinylchlorid, Tetrafluorethen, Vinylacetat anionisch nur Nebenreaktion; kationisch nur mit Elektronen schiebenden Gruppen (Isobuten bei −100 °C,
  Styrol); Ethen radikalisch nur unter Hochdruck und verzweigt (PE-LD, Code 4), mit Ziegler-Natta unverzweigt (PE-HD, Code 2); Propen und Styrol mit Ziegler-Natta
  isotaktisch, sonst ataktisch; Butadien mit TiCl₄/Al(C₂H₅)₃ überwiegend 1,4, aber nicht pauschal cis (fast nur cis-1,4 erst mit passendem Katalysator, z. B. Neodym).
  Produkte (`polymerise`) mit Name, Kurzzeichen, Klasse (Thermoplast, Elastomer, Duroplast), Aufbau, Verwendung, Recycling-Code;
  bekannte Copolymere SBR/SB, SAN, NBR, EPM, EVA, SMMA, PVC/VAc. **Kautschuk-Art** (`rubber`, Produktkarte: Kennzeichen und ein Satz): Dien-Kautschuk (BR, SBR,
  NBR) wird durch Vulkanisieren zum Elastomer (Schwefel an C=C), EPM hat keine C=C (vernetzt mit Peroxiden), PIB ist nicht vernetzbar (mit wenig Dien: vulkanisierbar), SB-Blockcopolymer aus
  zwei Blöcken: Kennzeichen „Blockcopolymer (zwei Blöcke)“ – thermoplastisches Elastomer erst mit drei Blöcken (SBS: Styrol → Butadien → Styrol); Klasse eines unbekannten Copolymers nach `copoClass` (mit Dien bzw. Elastomer-Monomer: Kautschuk).
  Englische Namen mitten im Satz klein (`lc`, „the chain end made of styrene“). Stufenwachstum (`reactGroups`, `stepReact`): –COOH + –OH → Esterbindung + H₂O,
  –COOH + –NH₂ → Amidbindung + H₂O, –COCl + –OH/–NH₂ → … + HCl, –N=C=O + –OH → Urethangruppe, –N=C=O + –NH₂ → Harnstoffgruppe, Epoxid + –NH₂ → geöffneter
  Ring (ohne Nebenprodukt), Phenol + Methanal → CH₂-Brücke + H₂O. Funktionalität (`functionality(id, partner)`: zählt nur Gruppen, die mit dem Partner reagieren;
  –NH₂ zählt gegenüber Epoxid doppelt): eine Gruppe → nur kleine Moleküle (Kettenstopper), drei → Netz (Duroplast). **AB-Monomer + Partner** (Milchsäure,
  6-Aminohexansäure; `isAB`): reagiert auch mit sich selbst, die Bausteine wechseln sich nicht ab; Kettenstopper → klein, zwei passende Gruppen → linear, drei (Glycerin) →
  **sternförmige Moleküle** (`star`: Glycerin in der Mitte, bis zu drei Arme; jeder Arm endet mit der anderen Gruppe des AB-Monomers, die weder mit einem Arm noch
  mit Glycerin reagiert – zwei Sterne verbinden sich nie; Produkt „Sternförmig verzweigter Polyester …“, Kennzeichen „sternförmige Moleküle“, schmelzbar, kein
  Duroplast), nie Netz. Disäure bzw. Säurechlorid + Glycerin (A₂ + B₃) bleibt vernetzter Polyester (Duroplast, Netz); verschiedene Verknüpfungen werden alle genannt (`links`, `byps`:
  Milchsäure + Diamin → Ester- und Amidbindung, Polyesteramid). Reagiert nichts, nennt die Begründung den Fall (`noLink`): gleiche Gruppen; Epoxid + –OH bzw.
  –N=C=O nur mit Katalysator; Phenol + Säurechlorid nur kleiner Ester (eine –OH); Methanal + Aminogruppen gibt Harnstoff- und Melaminharze (Aminoplaste), im Modell nur
  mit Phenol; Methanal allein → POM ist eine Polymerisation. Reagiert der Partner nicht, aber das AB-Monomer mit sich selbst (Milchsäure + Phenol), entsteht dessen
  Polymer (PLA bzw. PA 6, `unreacted` = Partner – Atom-Ansicht ohne den Partner, im Reaktor ohne reaktive Gruppen). Bekannte Produkte: PET, PBT, PEA, PBA, PA 6.6, Aramid,
  PA 6T, PLA, PA 6, Phenoplast, PUR, TPU, vernetztes PUR, Polyharnstoff, Epoxidharz, Polyesterharz.
- **Atom-Ansicht** (`chem/scene.ts`, `chem/draw.ts`, `chem/stepdraw.ts`, `chem/mech/*`, `components/MechSvg.tsx`, `components/MechStage.tsx`): Valenzstrichformel
  (Zweifachbindung = zweite Linie daneben, wird beim Einbau ausgeblendet), Bausteine farbig hinterlegt (gleiche Farbe wie ihr Kügelchen), freie Elektronenpaare als
  Striche, Ladungen im Kreis, wandernde Elektronen als Punkte, **Pfeile vor jeder Bewegung** (halbe Spitze = ein Elektron, volle = Elektronenpaar).
  Die Pfeile zeichnet der zentrale Baustein **`CurlyArrow`** (`@lern/chem-ui`, für jedes Modul mit Mechanismen): gleichmäßiger Bogen (kubisch, symmetrisch),
  Höhe nach Länge (kurze Pfeile flach statt Kringel), weicht beschrifteten Atomen aus (höherer Bogen, Seite bleibt), gefüllte Spitze bzw. halber Widerhaken außen am Bogen,
  Strich endet unter der Spitze, Spitze etwa ein Drittel Bindungslänge; blau wie die Elektronen (rot läse sich auf O-Atomen schlecht), Strich so kräftig wie die Bindungen. Atome, an denen ein Pfeil
  ansetzt, blendet der Bildrand nie aus (sonst zeigte der Pfeil ins Leere; Ringe ausgenommen – nie ein halber Ring). Homolyse O–O: je ein Halbpfeil von der Bindung schräg nach außen über das eigene O.
  Jede Aktion ist ein Ablauf aus Schlüsselbildern (`Key`: Bild, Halten, Bewegen, Pfeile), dazwischen weich überblendet (Lage, Deckkraft, Bindungsordnung).
  Abläufe: radikalisch (Erwärmen: O–O bzw. C–N bricht, jedes Atom behält ein Elektron, CO₂ bzw. N₂ geht ab; Anlagern Monomer für Monomer; Abbruch durch
  Rekombination oder Disproportionierung), anionisch (Butyllithium lagert sich an, Kette lebt, Methanol beendet; ein Kettenende, das das Monomer nicht starten
  kann: ✗ „zu schwach“), kationisch (Säure aus BF₃ und Wasser, Anlagern, H⁺-Abspaltung; am Butadien-Ende geht das H vom C1 ab → konjugiertes Dien, kein Allen,
  zwei Pfeile, der erste außen um C1 herum), Ziegler-Natta (Aktivieren, Anlagerung an der freien Stelle, Vierzentren-Übergang, Einbau zwischen Titan und Kette – Butadien mit drei Pfeilen:
  π-Paar C1=C2 bildet Ti–C1, Paar der Ti–C-Bindung der Kette bildet die Bindung zu C4, π-Paar C3=C4 wird zur neuen C2=C3; Elektronen paarweise; das Butadien liegt
  dabei höher und etwas links, die H des ersten Ketten-C zeigen nach unten, damit die neue Bindung steil zwischen den H hindurchführt und der Ti–C-Pfeil oberhalb Platz hat –,
  H₂ löst die fertige Kette,
  Vergiftung sichtbar: O/N/Cl/F bindet an das Titan, ✗; Isobuten prallt ab). Nacheinander ohne lebende Ketten (radikalisch, kationisch, Ziegler-Natta): die
  Aktion des zweiten Monomers bricht zuerst ab bzw. löst die Kette und startet eine **neue Kette** aus dem zweiten Monomer (Status `second`; „lebend“ nur bei
  lebenden Enden). Polykondensation zu Ester bzw. Amid als **Additions-Eliminierung in drei Schritten mit Pfeilen**: ① freies Paar des O bzw. N greift das C der
  C=O an, das π-Paar geht zum O; ② Zwischenstufe mit O⁻ und O⁺/N⁺, H⁺ wandert zur –OH der Säure; ③ C=O bildet sich zurück, Wasser geht ab (Säurechlorid: ② Cl⁻
  geht ab, ③ Cl⁻ nimmt das H⁺ → HCl); Ladungen stets ausgeglichen, Cl⁻ mit vier freien Paaren (Test: Formalladung aus Bindungen und freien Paaren = gezeichnete
  Ladung, alle Bilder), H₂O bzw. HCl sinkt beschriftet weg. Pfeil-Lage (`clearAng`: Richtung mit dem meisten Platz): der zweite Pfeil der H⁺-Wanderung (N–H bzw. O–H → N
  bzw. O) endet auf der freien Seite, lang genug für einen sichtbaren Bogen; der Pfeil der Abgangsgruppe endet am abgehenden O bzw. Cl auf der vom C abgewandten
  Seite, das Ladungszeichen weicht ihm aus. Hinter „ⓘ“ steht, was vereinfacht ist (`SIMPLE`: ohne Säurekatalyse bzw. Salz/Zwitterion, Base fängt HCl, Phenoplast nur Bilanz).
  Monomer mit zwei verschiedenen Gruppen als erstes Monomer: passt nur seine linke Gruppe zum Partner (Milchsäure + Disäure), wird es gewendet. Polyaddition (H wandert zum N, Urethan- bzw.
  Harnstoffgruppe; Epoxidring öffnet sich), Zweierkette (nur wenn beide Monomere lauter gleiche Gruppen haben – mit Milchsäure oder 6-Aminohexansäure wäre
  die Richtung nicht eindeutig), Phenoplast (CH₂-Brücke in **ortho-Stellung** zur –OH, Ringspitze mit –OH oben; Methanal trigonal; nur die Bilanz ohne
  Pfeile – in Wirklichkeit über mehrere Stufen, erst –CH₂OH am Ring, dann die Brücke; Wasser aus dem O des Methanals und je einem ortho-H steigt auf).
  Nicht passende Partner: ✗ und Begründung (gleiche Gruppen, Kettenende blockiert). Automatisch (`nextAuto`) endet: bei Ziegler-Natta nach „+ H₂“ (bei getrennten
  Ketten nach der zweiten), beim Stufenwachstum, wenn kein Monomer mehr zum Kettenende passt. Ein Monomer, das keine Ketten bildet, zeigt Automatisch einmal
  (abprallend zuerst, mit Nebenreaktion nach zwei Bausteinen, nacheinander an seiner Stelle) und baut danach mit dem passenden weiter; anionisch gleichzeitig
  kommt das schnellere Monomer zuerst. Alte Atome weit links fallen nur als ganze kleine Moleküle weg (nie ein halbes Gegenion).
  Polykondensation/Polyaddition beginnen mit dem zweiten Molekül unter dem ersten (hochkant groß genug); passen die Gruppen nicht, bleibt Abstand, ✗ über der Lücke.
  Ringe ganz farbig hinterlegt (kein helles Sechseck innen), Benzolring überall mit drei Zweifachbindungen. Ziegler-Natta „+ H₂“: die fertige Kette
  gleitet sichtbar weg („PP abgelöst“). Nach Rekombination zeigt die Kügelchen-Leiste beide Ketten (Starter-Rest an beiden Enden).
  Während eines Ablaufs bleibt alles bedienbar: eine neue Aktion beendet den laufenden Ablauf. Nach einem Fehlschlag ein Vorschlag (passendes Verfahren aus
  `methodsFor`, bzw. „Partner …“ beim Stufenwachstum), „Von vorn“ dann als Zeichen. „+ Zweierkette“ immer beschriftet. Ansatz-Chips zweizeilig statt abgeschnitten.
  Bedienung: eine Zeile Aktionen (Start, Monomer als Kügelchen „+ S“, „Abbruch …“ öffnet die Auswahl der Abbruchart), Zurück (spielt die Aktionen ohne Animation
  nach, `replay`), Automatisch (`nextAuto`), am Ende „Produkt“ und „Von vorn“. Statuszeile nur kurze Kennzeichen (Schritt, n, „+ 2 H₂O“, Temperatur, lebend);
  die Begründung eines Fehlschlags steht hinter „ⓘ“ (Blatt). Unter dem Bild die Kette als Kügelchen; Antippen zeigt das Monomer (Strukturformel und Baustein).
  Keine Fragen (Regel „Experimentieren stellt nie Fragen“): Eine Aktion antippen spielt den Schritt sofort ab; Vorhersagen gibt es nur in Lernen.
  Ausschnitt: kleine Anhängsel an Fokus-Atomen (–OH, –Cl, Benzolring, höchstens 7 Atome; `expandFocus`) gehören immer ganz ins Bild; was trotzdem
  über den Rand ragt, blendet `MechSvg` aus und endet an einer **Wellenlinie** (halbe Bindung + Welle) – nie ein Atom mitten im Zeichen abgeschnitten. Ringe am Rand verschwinden ganz (samt –OH/–H), nie ein halber Ring.
  Elektronen-Punkte nur am aktiven Ende (Test: nach jeder Aktion 1 Punkt beim Radikal, 2 beim Anion, sonst keiner); beim Zerfall des Starters gleitet das
  zweite Radikal beschriftet („2. Radikal“) zur Seite, die zwei Elektronen am CO₂ werden zur zweiten C=O-Bindung. Rekombination/Disproportionierung:
  die zweite Kette steht um 30° gedreht, damit ihre Gruppen nicht auf denen des ersten Kettenendes liegen.
  Kamera (`MechStage`): ein Ablauf beginnt im Ausschnitt seines ersten Bilds und fährt während des ersten Schritts zum ruhigen Ausschnitt des Rests; Ende,
  Zurück und andere Ansätze werden weich angefahren (550 ms), andere Bühnengröße ohne Fahrt. Stufenwachstum: Ausschnitt = Kettenende + Platz für das nächste
  Molekül (`span`, 7,8 Bindungslängen), am Anfang beide Ausgangsstoffe ganz. **Handy:** Atomzeichen mindestens 14 px – wäre der ganze Inhalt kleiner, zeigt
  ein Fenster dieser Größe die Reaktionsstelle (`frameFor`; Atome an Pfeilen samt ganzem Ring, Elektronen- und Punkt-Anker als nächstes Atom; ohne Pfeile geladene,
  hervorgehobene Atome, freie Stelle, Elektronen im Fokus; das Ruhebild danach behält die letzte Reaktionsstelle, auch nach Abbruch oder Ast), der Rest endet an
  Wellenlinien – die nur, wo ein Atom wirklich weggeschnitten ist; längere Beschriftungen („TiCl₃-Oberfläche“), die nicht ganz ins Bild passen, entfallen. H am Handy
  so groß wie die übrigen Zeichen (22 statt 17 Einheiten). Gemessen nach jeder Aktion (Automatisch-Folge, 14 Ansätze, 360 × 740 und 375 × 667): 14,2–19 px mit H;
  **Ausnahme:** der Überblick der Ausgangsstoffe vor dem ersten Schritt zeigt beide Moleküle ganz – 11–14 px (Bisphenol-A-diglycidylether bei 375 px ≈ 9 px).
  Kein fester Rand oben mehr: der Umschalter Atome | Kügelchen liegt über der Bühne, `corner` hält seine Ecke nur frei, wenn dort ein Atom (samt freien Paaren und
  Ladung) oder eine Beschriftung läge (erst den Inhalt nach unten rücken, sonst Fläche darunter).
  Pfeilspitzen enden außen am Atom, nie auf dem Zeichen (π-Paar N=C → N bei Urethan/Harnstoff, O–H → O beim Methanol-Abbruch, Ti–C → neue Bindung bei Ziegler-Natta
  oberhalb, die H des ersten Ketten-C zeigen im Übergang nach unten); AIBN: je C–N-Bindung ein Halbpfeil zum C, einer in die entstehende N≡N-Bindung; der erste Pfeil
  Radikal/Anion → Monomer zielt auf die Mitte der jetzigen Lage (kein Stummel); Ziegler-Natta-Butadien: „vereinfacht“ hinter ⓘ (in Wirklichkeit π-Allyl).
- **Kügelchen-Ansicht** (`chem/reactor.ts` rein rechnerisch, `components/Reactor.tsx` Canvas): Becherglas mit vielen Molekülen (Kügelchen 6–9 px, Anzahl nach
  Fläche), gedämpfte Zufallsbewegung, Federn zwischen gebundenen Kügelchen, leichte Streckung der Ketten, Abstoßung. Reaktionen bei Berührung mit Wahrscheinlichkeit:
  Kettenwachstum nur an aktiven Enden (gestrichelter Ring: Radikal rot, Anion blau, Kation dunkelrot) – wenige lange Ketten, freies Monomer bleibt bis zum Schluss;
  Starter zerfällt beim Erwärmen nach und nach (Gasbläschen CO₂/N₂ steigen auf); Abbruch zweier gewachsener Radikale (Styrol meist Rekombination, MMA meist
  Disproportionierung); anionisch starten alle Ketten gleichzeitig und leben, ein zweites Monomer wächst als Block weiter – nur, wenn das Kettenende es starten
  kann (sonst bleibt es frei, Begründung hinter „ⓘ“); Acrylnitril-Ketten enden nach und nach (nicht lebend); Methanol beendet; kationisch wandert
  H⁺ weiter und startet neue Ketten; Ziegler-Natta: Ti-Kügelchen, Einbau zwischen Titan und Kette, „+ H₂“ löst die Ketten, polare Monomere vergiften (✗).
  Nacheinander ohne lebende Ketten: mit dem zweiten Monomer sind die alten Ketten beendet (radikalisch abgebrochen, kationisch H⁺ abgegeben – es startet neue
  Ketten, Ziegler-Natta abgelöst), neue Ketten starten (der Starter zerfällt über Stunden: noch mindestens drei Starter-Kügelchen) und bauen das zweite und übriges
  erstes Monomer ein – nie an die alten Ketten. Ziegler-Natta mit giftigem Monomer im Gefäß beim Aktivieren bzw. als erstem Zusatz: jedes Titan sofort vergiftet.
  Anionisch gleichzeitig: solange das schnellere Monomer frei ist, lagert sich das andere kaum (MMA vor Styrol: gar nicht) an. Kennzeichen „lebend“ nur bei lebenden Enden.
  Stufenwachstum: jede passende Gruppe zweier Moleküle reagiert, Nebenprodukt steigt als Bläschen auf (Bläschen schieben nichts an), Netz nur, wenn
  `stepReact` eines ergibt (AB-Monomer + Glycerin: verzweigt, kein Netz) und das größte Molekül ≥ 40 % der Bausteine hat. Reaktionspartner in der Nähe driften leicht aufeinander zu (sonst dauert es auf dem Bildschirm zu lange).
  Stufenwachstum langsam genug zum Zusehen (50 % nach etwa 10 s), mittlere Länge folgt 1/(1 − Umsatz); ab 80 % erklärt „ⓘ“, warum lange Ketten fast
  vollständigen Umsatz brauchen (Nebenprodukt entfernen, Vakuum). Methanol fällt sichtbar hinein („Methanol zugegeben“), nur einmal. Legende („?“):
  Baustein, Starter, aktives Ende, Bläschen. Ein neuer Ansatz setzt den Reaktor zurück (Kennzeichen „neuer Ansatz – von vorn“).
  Anzeige: Umsatz als schwarzer Balken, Ketten bzw. Moleküle, „Ø … Bausteine“ und „längste …“; Kennzeichen (Vorgang, lebend, vernetzt, vergiftet, + H₂O – bei zwei
  Nebenprodukten beide gezählt, „+ 23 H₂O + 29 HCl“ –, abgelöst),
  Begründung hinter „ⓘ“. Antippen hebt das ganze Molekül hervor und zeigt das Monomer (Starter, Katalysator, Bläschen: kurze Info), Ziehen bewegt ein Kügelchen
  samt Kette. Akku: höchstens 30 Bilder/s, Stillstand bei Ruhe (6 s ohne Reaktion bzw. 3 s, wenn nichts mehr möglich ist), Pause-Knopf, unsichtbare Seite pausiert;
  Bewegung reduziert: Ablauf ohne Zwischenbilder vorausgerechnet. Der Reaktor bleibt beim Wechsel der Ansicht erhalten.
- **Lernen** (`quiz/tasks.ts`, `lessons.tsx`, `quiz/explain.tsx`, `quiz/visual.tsx`, Katalog `quiz/misconceptions.ts`): sechs Kapitel – Monomere und Polymere;
  radikalische Polymerisation; Katalysatoren und Verfahren (Ziegler-Natta, kationisch mit BF₃ und Wasser am Beispiel Isobuten – „positive Ladung“
  eingeführt –, anionisch); Polykondensation; Polyaddition; Struktur und Eigenschaften (Thermoplast/Elastomer/Duroplast,
  Copolymere, Ketten- vs. Stufenwachstum; Recycling-Codes stehen nur auf den Produktkarten – die Aufgabe `recycling` bleibt in `LATER`, bis eine Lektion sie einführt).
  In den Lektionen steht die richtige Auswahl an wechselnden Plätzen (Zahlen aufsteigend; Test: höchstens 40 % an Platz 1, ohne vorgemachte Schritte). Lektionen spielen die Abläufe der Atom-Ansicht ab („Nochmal“), ein Schritt lässt das Radikal-Atom
  antippen; Bilder vorher/nachher am Handy untereinander. Aufgaben alle als Auswahl mit Bild (`Vis` als reine Daten: Monomer, gesättigtes Gegenstück (nur Ethan, Propan,
  Chlorethan … – Styrol hat keins, Ethylbenzol trägt im Benzolring noch C=C), Baustein mit/ohne C=C, Kettenausschnitt iso-/syndio-/ataktisch,
  Mechanismus-Standbild mit Pfeilen (`bare`: ohne Beschriftung des Nebenprodukts, wo sie die Antwort wäre – `nebenprodukt` zeigt das Wasser unbeschriftet), Kügelchen, zwei Monomere, Kettenbild, Gefäß mit Kügelchen:
  nur Monomer / wenige lange Ketten (als Schleife gelegt) + viel Monomer / drei mittellange Ketten, kaum Monomer – Stufenwachstum bei 90 % Umsatz, denn bei 50 % ist noch die Hälfte
  der Moleküle Monomer (mittlere Länge = 1/(1 − Umsatz)) / ein Riesenmolekül; **Umsatz** in der Lektion K6 eingeführt), teils mit Bild-Antworten (Ketten- vs. Stufenwachstum als vier Gefäße);
  jede falsche Antwort steht für eine Fehlvorstellung und hat eine Rückmeldung (Test: alle). Begründungen beginnen nicht mit dem Begriff der Antwort,
  wenn er schon fett davorsteht (`boldLead`, Test: kein Wort doppelt). Keine Aufgabe zweimal in einem Kapitel, auch nicht mit anders gemischten Antworten
  (`ordered`; das gelöste Beispiel im Quiz-Paket vergleicht ebenso ohne Reihenfolge). **Regel nach ✓** hängt an der Aufgabe (`withRule` beim Erzeugen, in jeder Runde gleich):
  allgemeine Regel des Schritts (`GENERAL_RULE`), sonst die Erklärung der Variante; Antippen/Ordnen/Bauen eine kurze Zeile (`SHORT_RULE` → `rule`). Merksatz vor der Aufgabe
  und Tipp nennen den Blickpunkt, nie die Regel oder die Antwort (Tests: Schlüsselwörter je Typ im Merksatz, Wörter der Antwort im Tipp). Kapitelfolge: jede Fertigkeit
  höchstens 2×, Abstand ≥ 3; die Regelzeile einer Aufgabe enthält nicht die Antwort der nächsten (Tests). Bild-Antworten: Strukturformeln im eigenen Seitenverhältnis,
  Kennbuchstabe klein in der Ecke. Aufgabenbilder tragen, solange die Aufgabe offen ist, eine Mindesthöhe (`data-min-h` über `PicBox`: 64 px, Kügelchen-Bilder 44 px) –
  drückte ein Tipp bzw. der erste Schritt das Bild darunter, steht er im Blatt. Nach der Antwort entfällt der Merksatz (Platz fürs Bild), und ein Bild mit Atomzeichen, das niedriger als 110 px würde (Schrift unter etwa 10 px), entfällt ganz – nie ein unlesbarer Rest; Formeln unter Bild-Antworten
  ohne Umbruch an –, = und ( (Wortverbinder). „Mehr Starter“ zeigt zwei Gefäße vorher (wenig/viel Starter). Lektionen: Vergleichsbilder (`Two vs`) ohne Pfeil,
  mit Trennlinie und Überschrift über jedem Bild; Pfeil nur bei vorher → nachher. Antippen in der Lektion mit unsichtbaren Trefferkreisen je Atom.
  **Antippen im Bild** (`kind: "tap"`, `quiz/tap.ts`, `TapAnswer` in `quiz/QuizView.tsx`): Szene = Standbild der Atom-Ansicht (Ansatz, Aktionen, Bild des Ablaufs,
  wahlweise ohne Pfeile) oder Kettenausschnitt; `parts` = antippbare Atome (stabile Kennungen), `answer` = richtige Atome, Fallen je falschem Teil
  (`pick` bzw. bei mehreren `wrong`, dazu `n`, `adj`); mehrere Atome: antippen schaltet um, „Prüfen“; Lösung danach gestrichelt grün mit ✓, falsch gewählte
  mit ✗; vorher sind alle antippbaren Teile dünn gepunktet umrandet, daneben getippt → kurzer Hinweis, bei mehreren „x von n gewählt“;
  Trefferkreise mindestens 44 px (Bildmaßstab gemessen); Atomschrift ≥ 14 px vor und ≥ 12 px nach der Antwort
  (375 × 667, 360 × 740): enger Ausschnitt (`zoomTo` bzw. Teile nahe der reagierenden Stelle), knappe Rückmeldung (Grund + Lösung, Merksatz ausgeblendet), Erklärung im
  Blatt „Lösung“ über `feedbackExtra`; `zoom` (K4, K5): nur Teile nahe der reagierenden Stelle (`nearParts`), Ausschnitt um sie im Seitenverhältnis
  des Bildplatzes, antippbare Atome bleiben sichtbar, auch wenn ihr Nachbar am Rand ausgeblendet wird; `giftTap` zeigt das Monomer in Standardlage neben dem Titan (noch nicht gedreht); Lösung nach Fehlern in Worten (`sol`), nie als Nummer; unsichtbare Knöpfe für Tastatur und Vorlesen; im gelösten Beispiel zeigt das Bild die markierte Lösung. Aufgaben: K1 `bausteinTap` (zwei benachbarte
  C eines Bausteins, ohne farbige Hinterlegung), K2 `radikalTap` (C mit dem Radikal nach dem Anlagern), K3 `freieStelleTap` (auch das Kettenende –C₂H₅ antippbar, mit Rückmeldung), `giftTap` (Cl/O/N am Titan),
  K4 `wasserTap` (drei Atome des Wassers; bei Amin gilt jedes der beiden H am N (`same`); beide gewählt: eigene Rückmeldung „N gibt nur ein H“, `dup`), `schnitt` (Bindung antippen, die neu entstanden ist: C–O bzw. C–N zwischen zwei Bausteinen; Bindungen als Teile „a|b“,
  als Kapsel zwischen den Atomzeichen markiert: gepunktet vorher, gestrichelt mit ✓/✗ danach,
  `mode: "any"`; **Hydrolyse** in Lektion K4 eingeführt), K5 `hTap` (wanderndes H); die Auswahl-Fassungen bleiben in „Alles gemischt“ (`level(…, more)`).
  **Ordnen** (`kind: "order"`, `OrderAnswer`): K2 `ordnen` am Ende des Kapitels – vier Standbilder mit Pfeilen (Starter zerfällt, erstes Anlagern, Anlagern an
  die Kette, Abbruch durch Rekombination oder Disproportionierung; immer Styrol), gemischt, nie schon richtig; enger Bildausschnitt um die Pfeile, ohne Lichthöfe;
  nach dem Prüfen je Karte ✓ bzw. „richtig: ②“, Legende (nicht auf niedrigen Bildschirmen), keine Lösungszeile (die Plätze stehen an den Bildern).
  Antippen nummeriert ①–④ (Kennziffer rot), nochmal antippen nimmt die Nummer und alle späteren weg, ab vier „Prüfen“; danach je Bild ✓ bzw. ✗ mit dem richtigen
  Platz und Name des Schritts (Bilder dann klein bzw. auf niedrigen Bildschirmen weg). Gemeldet `startFirst`, `termLast`, `addsOk` → Fallen (Start nicht zuerst,
  Abbruch nicht zuletzt, Anlagerungen vertauscht). Vorlesen: vorher „Bild A“, danach mit Name.
  **Kette bauen** (`kind: "build"`, `BuildAnswer`): Vorrat aus zwei Kügelchen (Name, Formel; das erste ist schon gewählt), darunter 8 Plätze (am Handy 2 × 4 als
  Schlange: Strich von Platz 4 nach unten zu 5, zweite Zeile läuft zurück); Platz antippen = setzen, gesetztes antippen = entfernen (Hinweis 3 s nach dem ersten),
  Ziehen aus dem Vorrat bzw. lange Drücken (füllt alle leeren Plätze) als Abkürzung; „Prüfen“, wenn alle Plätze voll; danach Vorrat auf niedrigen Bildschirmen ausgeblendet.
  Auswertung `buildPattern` (Block = höchstens drei Abschnitte zu je ≥ 2, abwechselnd, zufällig nur mit je ≥ 3 von 8, sonst „fast nur ein Monomer“, nur ein Monomer,
  nicht einbaubares Molekül) → `pat`, `maj`; Kürzel gesättigter Moleküle in Großbuchstaben (EA, PA, CE – keine Elementsymbole); erster unpassender Platz gestrichelt mit ✗. K1 `bauenHomo`
  (Monomer + gesättigtes Gegenstück im Vorrat), K6 `bauenCopo` (Block, alternierend, statistisch).
  „C‑Atom“ usw. mit geschütztem Bindestrich (U+2011, nie „C-⏎Atom“). Antworttexte kurz (einzeilig auf 375 px). Alltagsfragen nennen Gegenstände, die eindeutig zu einem
  Kunststoff gehören (Plastiktüte → PE, Stoßstange → PP, Fensterrahmen → PVC; nicht „Rohre“, die es aus PE und PVC gibt).
- Tests: `chem.test.ts` (Daten, Verträglichkeit, Produkte, alle über 1000 Ansätze der Atom-Ansicht automatisch durchgespielt und per Zurück nachgestellt,
  Reaktor-Ergebnisse: Kettenwachstum mit Restmonomer, lebende Ketten, Vergiftung, PET-Umsatz, Netz, Kettenstopper; AB-Monomer + Partner für alle Paare nie Netz,
  nie „abwechselnd“, Verknüpfen gelingt immer, wenn die Karte eine Kette meldet; Glycerin mit Disäure/Säurechlorid Netz, mit AB-Monomer Stern ohne Netz; Produktbild = eingebautes Monomer; anionische Reihenfolge in Regeln, Atom-Ansicht und Reaktor; nacheinander ohne lebende Ketten getrennte Ketten, im Reaktor neue Ketten aus dem zweiten Monomer; Kautschuk-Arten; Phenoplast-Brücken
  nur ortho/para; Ziegler-Natta-Butadien drei Pfeile, Elektronen paarweise; kationisch kein Allen; Ester/Amid drei Schritte mit Pfeilen, Ladung ausgeglichen),
  Karte ⇔ Atom-Ansicht ⇔ Reaktor bei einem Monomer ohne Ketten, Gradient Styrol + Butadien, zwei Nebenprodukte im Reaktor, Formalladung in allen Bildern,
  Pfeil-Lage; nacheinander mit kurzkettigem Monomer, radikalisch stark ungleich bzw. ETFE alternierend, Isobuten + wenig Dien), `quiz/*.test.ts` (Gültigkeit, Katalog, einfache Sprache, Englisch; Tipp in allen Modi zugeschnitten und ohne Lösungswendungen, kein Ethylbenzol,
  Rückmeldungen `wasserTap`/`freieStelleTap`, Nebenprodukt-Bild unbeschriftet, Tipps ohne vorweggenommene Antwort), `guide*.test.ts` (Lektionen auf Deutsch und
  Englisch, Platz der richtigen Auswahl).
