# Gemische (`modules/gemische`)

Stand, Aufbau und fachliche Entscheidungen dieses Moduls. Claude Code lädt diese Datei automatisch, sobald eine Datei in `modules/gemische/` gelesen oder geändert wird.
Allgemeine Regeln (Didaktik, Oberfläche, Architektur, Prüfen): `docs/entwicklung.md`. Diese Datei beschreibt immer den **aktuellen** Stand – bei jeder Änderung am Modul im selben Commit anpassen.

- Keine Stufen. Zehn fertige Beispiele (`EXAMPLES` in `src/mixtures.ts`), **kein Baukasten**, 110–240 Teilchen je Beispiel (alle verschieden):
  Wasser, Helium im Luftballon, Zuckerwasser (Saccharose), Alkohol und Wasser, Sprudelwasser, Öl und Wasser (Öl vereinfacht als Dodecan),
  Messing (Cu, Zn im Verhältnis 2 : 1 – CuZn33, einphasig; Zink sitzt zufällig auf Plätzen des Kupfergitters), Erdgas (CH₄, C₂H₆, CO₂), Schutzgas zum Schweißen (Ar, CO₂), Modellgemisch (He, Ar, CO₂, CH₄).
  Zweimal gleich viele Verbindungen wie Elemente (Schutzgas, Modellgemisch), achtmal verschieden viele (Test).
  Quiz und Erklärkarten zeigen ein Zehntel der Teilchen (`small`) im Rasterbild (`mixing.ts`, `components/Beaker.tsx`). Metallgitter füllen ihr Raster
  ohne Lücke, wenn es geht (`gridFor`: Teiler der Atomzahl, breiter als hoch, z. B. Messing mit 18 Atomen 6 × 3 statt 5 × 4 mit zwei leeren Plätzen; Test).
  Als elftes Beispiel **Müsli** (`MUESLI`, `components/MuesliBowl.tsx`): Gemenge aus sichtbaren Stücken (Haferflocken, Rosinen, Haselnüsse) ohne Teilchenbild –
  das Gemisch-Konzept gilt auch für Bestandteile, die selbst aus vielen Stoffen bestehen. Vorher jede Sorte als Haufen, **Mischen** (Schale wackelt, Stücke gleiten
  an zufällige Plätze), **Auslesen** (zurück in Haufen); Werkzeuge Zutaten | Zählen (Bestandteile, Stücke) | Einteilung | Arten | Beispiele.
- **Elemente in Bildern als einzelne Atome** (Edelgase) oder Metallgitter. Ausnahme, gezielt gegen die Fehlvorstellung „zwei Atome = Verbindung“: Lektion 2 zeigt
  Sauerstoff O₂ neben Kohlenmonoxid CO (vorgemacht) und Stickstoff N₂ (halb gelöst), und die Aufgabe „Element oder Verbindung“ (`einordnen`) fragt in etwa jeder
  vierten Aufgabe O₂ oder N₂ mit der Falle „Verbindung“ (Stolperstein `element-molekuel`). Sonst nirgends Element-Moleküle (Test; Experimentieren unverändert).
- Zählen (`analyse`): Teilchen (Moleküle bzw. einzelne Atome), Stoffe, davon Verbindungen (mehrere Atomsorten) und Elemente (eine Atomsorte), Atomsorten.
  Die Erklärkarte nennt trotzdem alle Arten von Elementen (einzelne Atome, Metallgitter, Moleküle wie O₂), nur die Bilder zeigen keine Element-Moleküle.
  Teilchenbilder in fünf Arten (`pictureKind`): Element, Verbindung, Gemisch aus Elementen / aus Verbindungen / aus Element und Verbindung.
  Gemisch aus Elementen als Metallgitter (Legierung, `alloy`): 12 Atome (4 × 3), Kupfer mit 3–4 Zink, zufällig verteilt (Messing, einphasig; mit wenigen Atomen sähe
  es nach festem Verhältnis aus) – die übrigen Paare aus Cu, Zn, Fe, Al gibt es nicht in beliebigem Verhältnis (Fe–Al, Fe–Zn, Cu–Al bilden intermetallische Phasen).
  Test: jede mögliche Anordnung sichtbar zufällig (keine Zink-Reihe oder -Spalte, nicht spiegel- oder drehgleich, kein Muster, kein zusammenhängender Zinkblock);
  `initial` mischt eine Legierung „nachher“ so oft neu, bis sie so aussieht (`looksRandom`, auch beim Messing-Beispiel mit 12 : 6 Atomen).
  Rückmeldungen zu Legierungsbildern: die Atome sind im Gitter verbunden, aber zufällig verteilt, ohne festes Zahlenverhältnis – zwei Elemente, gemischt, keine Verbindung
  (nie „nicht verbunden“ oder „einzeln“; Ablenker passen zum Bild: „Reinstoff – alles ein Gitter“, „lauter Moleküle“ nur bei reinen Molekülbildern; Test).
  **Definitionen** (Lektion 2, Erklärkarte k2, Lektion 4, k4; Test `definitions.test.ts`): Verbindung = mehrere Atomsorten, fest verbunden und immer im gleichen
  **Zahlenverhältnis** (H₂O 2 : 1, NaCl 1 : 1); Legierung = Metall mit anderen Elementen zusammen geschmolzen, Anteile frei wählbar, oft homogen (Messing) – nie
  pauschal unter „homogen“. Kapitel 1 zeigt keine Metallgitter (Zählbilder `someMix` nur im Zustand `modell`, Test), „Gitter“ erst in Kapitel 2.
- Experimentieren (`views/MixView.tsx`, `components/FlowView.tsx`, Canvas): Gefäß mit allen Teilchen (klein) und **verschiebbarer Lupe**
  (anfassen und ziehen – Abstand zum Finger bleibt; daneben tippen – Lupe gleitet hin; Pfeiltasten), daneben bzw. darüber die Vergrößerung mit etwa 20 Teilchen
  als schattiertes Kalottenmodell (`lensRadius`). Die Lupe springt nie: sie gleitet, und das Bild ordnet sich nicht neu an (Statuszeile immer einzeilig,
  höchstens zwei kurze Kennzeichen, `.gm-status`). Teilchen in der Lupe antippen → Stoff-Info (öffnet beim Loslassen; das Blatt ignoriert den Klick gleich nach dem Öffnen, sonst schließt es am Handy sofort wieder). Grenze Öl/Wasser als gerade Linie (`boundaryY`), sobald getrennt.
- Jedes Beispiel beginnt **vorher** (`before`): Zuckerkristall im Wasser (Lupe auf seiner Oberkante), Alkohol obenauf, CO₂ über dem Wasser, Gase hinter Trennwänden,
  Kupfer- und Zinkblock. Hauptknopf sagt, was er tut: **Umrühren** (Zucker, Alkohol, 3 s), **Schütteln** (Sprudel, Öl, Reinstoffe), **Wand weg** (Gase), **Schmelzen** (Messing);
  daneben **Von vorn** (Anfang wieder herstellen). Flüssigkeiten lösen und mischen sich auch **von selbst** (langsam; warm schneller) – Rühren/Schütteln beschleunigt.
  Statuszeile: „löst sich · 12 / 30 gelöst“, danach „Lösung · gelöst in 23 s“ (Zeit zum Vergleichen: kalt/warm, gerührt/ruhig); Alkohol „gemischt“, wenn in jedem
  Drittel der Höhe etwa gleich viel Alkohol ist; Gase, wenn jeder Stoff im Mittel in der Mitte ist. Einmal gemischt bleibt die Anzeige „gemischt in x s“ bis „Von vorn“
  (zufällige Schwankungen der Verteilung lassen sie nicht zurückspringen, Test `views/status.test.ts`). Text der Werkbank ≥ 14 px (auch `Tag`s der Statuszeile).
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
  an den Nachbarn vorbei, dazu eine Wärmeströmung ohne Stöße, deren Walzen ihre Lage wechseln (eine, zwei, verschobene – sonst dreht sich der Zinkblock nur im Kreis), und Druck gegen Lücken – Kupfer und Zink vermischen sich nach und nach, danach Erstarren im Gitter.
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
  **Temperaturregler** 0–100 °C (nicht gespeichert, Start 20 °C; bei Messing ausgeblendet – Metalle schmelzen erst weit darüber, Status beim Schmelzen „geschmolzen · über 900 °C“): Teilchengeschwindigkeit im Modell verstärkt (`heat`: 0 °C × 0,5, 20 °C × 1, 100 °C × 3; echt wären nur + 17 %),
  Kristall löst sich warm schneller; CO₂ löst sich warm schneller, aber es bleibt mehr im Gasraum (Gleichgewicht). Tests: Teilchenzahl bleibt, keine Sprünge, gleichmäßig gemischt, Kristall geordnet und von außen gelöst, Öl bildet geschüttelt Tröpfchen und ist danach wieder oben,
  Gase mischen sich nur ohne Trennwand, Messing wieder im Gitter (beim Erstarren Plätze nach kürzesten Wegen verteilt, Gleiten höchstens ¼ Radius je Schritt – kein Sprung; Wärmebewegung der Schmelze klingt in der letzten Sekunde aus, gleich nach dem Erstarren 1 s sanfter gebremst, `frozeAt`). Ohne Bewegung (reduzierte Bewegung): Knopf zeigt gleich das Ergebnis.
  Werkzeuge: Stoffe (Reinstoffe: Verbindungen | Elemente; beim Sprudel zusätzlich „entsteht in kleiner Menge“: Kohlensäure, `forms`) | Zählen | Farben („nur im Modell“) |
  Einteilung (Stoffe → Reinstoffe/Gemische mit allen Beispielen; niedrige Handys ohne Wurzel) | Arten (verteilter Stoff in Hauptstoff: Gemenge, Legierung, Suspension,
  Lösung, Rauch, Emulsion, Nebel (Morgennebel über dem Teich), Schaum (Eischnee), Gasgemisch mit Alltagsbeispiel; aktuelles Beispiel markiert) | Beispiele
  (zwei Spalten ab 360 px; lange Namen mit Trennstelle: „Modell-gemisch“, `soft`).
  Gespeichert (`gemische-v1`): Beispiel. Keine mehrdeutigen Beispiele im ganzen Modul (Schlagsahne enthält eine Emulsion, Wolken können Eis enthalten, Dunst kann
  auch Staub sein; Test).
- **Lernen** (`src/quiz/tasks.ts`, Lektionen `src/lessons.tsx`, Katalog `misconceptions.ts`): sechs Kapitel (`gm-k1` … `gm-k6`) mit je einer Lektion und zehn Aufgaben
  in fester Reihenfolge, plus „Alles gemischt“, „Heute fällig“, „Schwächen üben“:
  1 **Teilchen und Atomsorten** (teilchen ×2, tippAtome ×2, atomsorten ×2, stoffe ×2, zwischen, farbe) ·
  2 **Elemente und Verbindungen** (einordnen ×2, tippElement ×2, tippVerbindung ×2, elemente ×2, verbindungen ×2) ·
  3 **Reinstoffe und Gemische** (reinOderGemisch, reinGemisch, bildArt, bildWahl, homogenBild, homogenKlar, wohin, nachher, masse, bewegung – Lösen gehört hierher) ·
  4 **Gemische im Alltag** (alltag ×2, reinAlltag ×2, homogenSieht, artFluessig ×2, artFestGas, artInGas, gemischart) ·
  5 **Trennen nach Größe, Magnet, Dichte** (trennWahl ×4, trennEigenschaft ×3, trennTipp ×3 – nur Auslesen, Sieben, Magnettrennung, Dekantieren, Filtrieren) ·
  6 **Lösungen trennen** (loesWahl ×3, loesEigenschaft ×2, loesTipp ×3, trennReihe ×2 – Eindampfen, Destillieren, Chromatografie, mehrere Schritte; `src/quiz/trennen.ts`,
  `K5_METHODS`/`K6_METHODS`; falsche Verfahren und Eigenschaften in Kapitel 5 nur aus Kapitel 5, „Siedetemperatur“ erst in Kapitel 6, Test).
  **Keine Zahleneingabe**: Zählaufgaben werden zur Auswahl (`asChoice`: Fallen → diagnostische Distraktoren, Zahlen aufsteigend; Nachbarzahlen mit dem Denkschritt
  `recount`, z. B. „Verzählt? Zähle jede Teilchensorte einzeln …“). **Jede falsche Antwort hat eine eigene Rückmeldung** (Test): Art des Gemischs – was die gewählte Art
  heißt und wie es hier ist („Rauch heißt: feste Teilchen in einem Gas – hier ist der Hauptstoff flüssig.“, `ART_INFO`), homogen/heterogen und Alltag – was die Wahl
  hieße („Ein Reinstoff ist nur ein Stoff – hier sind es mehrere.“). Fallen mit Stolperstein stehen immer zur Wahl (`mc` nimmt Ablenker mit Stolperstein zuerst,
  dann zufällig die übrigen mit Rückmeldung; Test – Anteil der Aufgaben mit Diagnose unverändert etwa 83 %). Antippen im Teilchenbild
  (`tippAtome`: Teilchen aus n Atomen, `tippElement`/`tippVerbindung`). Stofftrennung: `trennWahl` (Bild des Gemischs ohne Geräte `MixPic`, Antworten als
  Bildkarten der Verfahren; 9 Fälle: Eisen/Schwefel → Magnet, Sand/Kies → Sieben, rote/weiße Bohnen (gleich groß, nur anders gefärbt) → Auslesen, abgesetzter Sand (Ziel: klares Wasser gewinnen) → Dekantieren, trübes Wasser →
  Filtrieren, Salzwasser → Eindampfen (Salz) bzw. Destillieren (Wasser), Alkohol/Wasser → Destillieren, Filzstift → Chromatografie; jede falsche Wahl mit
  Begründung, Gelöstes durch den Filter = Stolperstein `filter-geloest`; eine Begründung mit „behalten“/„verloren“ nur, wenn die Frage ein Ziel nennt, Test), `trennEigenschaft` (Animation des Verfahrens, Eigenschaft wählen: Korngröße,
  Magnetismus, Dichte, Siedetemperatur, Aussehen, Haften am Papier), `trennTipp` (Bild antippen, je Verfahren mehrere Ziele, die richtige Antwort wechselt:
  Rückstand, Filtrat, Filterpapier; Eisen, Schwefel; Bodensatz, abgegossenes Wasser; Kies, Sand; Destillat, Kühler, Rückstand im Kolben, Thermometer (t = 0,6);
  Salz, Wasserdampf (t = 0,5); weitester und kürzester Farbstoff, Startlinie – 19 Fälle, jedes Teil im Bild vorhanden, Test `components/separation.test.ts`),
  `trennReihe` (Salz und Sand bzw. Eisen, Sand, Salz – dann mit Eisen im Bild `eisensalzsand`: Magnettrennung → Lösen → Filtrieren → Eindampfen; Schrittnamen
  `STEP` in `trennen.ts`, dieselben in Lektion 6: deutsch die Verfahren, englisch kurze Verben „Magnet → Dissolve → Filter → Evaporate“ – mit „Magnetic
  separation … Filtration … Evaporation“ war die vierte Antwort am Handy abgeschnitten; Tests).
  Über jeder Aufgabe ein **Merksatz** (`leads` → `lead`; weicht dem „Ersten Schritt“ und nach der Antwort am Handy der Rückmeldung). Der Merksatz nennt den
  **Blickpunkt**, nie die gefragte Aussage („Denk daran, woraus Luft und Wasser selbst bestehen.“ statt „Zwischen den Teilchen ist nichts.“); hängt die Aufgabe
  von einer zufälligen Variante ab (Bild nach dem Mischen, Trennverfahren mit Ziel – `trennWahl` nur bei Fällen mit Ziel), setzt der Generator den Merksatz selbst
  (`lead` der Aufgabe vor dem des Platzes); der Merksatz eines Platzes passt zu jeder Variante (kein „Kristall“, wenn auch Alkohol kommt; Tests).
  Merksätze nur in den Kapiteln, nicht in „Alles gemischt“, „Heute fällig“, „Schwächen üben“. Jede Aufgabe hat einen
  **zugeschnittenen Tipp** (`tip` → `hint`, `hintCue`) als **Denkschritt** („Was konnte nicht durch das Papier?“), nie als Lösungssatz (Tipps zu „Nach dem Mischen“
  sind Fragen, Test). **Der Tipp hängt nie von der Antwort ab**: „homogen oder heterogen“ hat einen Denkschritt für alle Beispiele (`HOM_TIP`: „Ein Stoff oder
  mehrere? Und: Zeigt das Mikroskop Teile, Tröpfchen oder Schichten?“), „Stoffe im Alltag“ einen für Element, Verbindung und Gemisch (mit Formel im Namen der zu
  den Großbuchstaben; Tests). „Klar heißt nicht rein“ und „Sieht einheitlich aus“ wählen Beispiele nach Kennzeichen (`klar`: durchsichtig, `eins`: sieht
  einheitlich aus) – in beiden Gruppen kommen Reinstoff, homogenes und heterogenes Gemisch vor (u. a. destilliertes Wasser, Öl und Wasser, Mayonnaise, Blut; Test).
  Formeln: „Jede Atomsorte beginnt mit einem Großbuchstaben“, gleiche zählen einmal
  (nie „jeder Großbuchstabe ist eine Atomsorte“ – C₂H₅OH, Test). Tipps im Kapitel höchstens 85 Zeichen (passen ins Tippfeld; Test).
  Tests: kein Inhaltswort (≥ 4 Buchstaben, ohne Stoppwörter) der richtigen Antwort in Merksatz, `hint` oder `tip` – über alle Generatoren und Kapitel. Rückmeldungen begründen mit dem Bild. Sprudel nicht im Lernen (dort reagiert ein Teil zu Kohlensäure; Test).
  **Begriffe erst ab dem Kapitel, das sie einführt** (Test über alle Texte der Runden: Element, Verbindung, Gitter ab Kapitel 2; Reinstoff, homogen, Lösung ab 3;
  Legierung, Gemenge, Suspension, Emulsion, Schaum, Rauch, Nebel ab 4; Verfahren aus Kapitel 5 bzw. 6 erst dort). „Gemisch“ (Name des Moduls) steht schon in
  Kapitel 2 zur Wahl. Jeder abgefragte Begriff steht in einer **Lektion** bis zu diesem Kapitel fett (die Erklärkarte erscheint in Kapiteln mit Lektion nicht von
  selbst; Test über alle Texte der Runden). Nur fachlich eindeutige Beispiele: Art des Gemischs ohne Milch, Sahne oder Kakao, wenn „Emulsion“ falsch ist (Schaum:
  Eischnee, Suspension: Mehl in kaltem Wasser; Test), Füllertinte (Lösung), ein Sprühstoß aus einer Blumenspritze und Wassertröpfchen über dem Teich (Nebel);
  „Rein“ im Alltag: Reinstoff nur destilliertes Wasser (Test: keine Begründung mit „fast“), Packungsaufschriften wie gedruckt („Reines Mineralwasser“);
  Sterlingsilber 925 („Auf einem Ring steht …“) mit eigener Rückmeldung (925 von 1000 Teilen Silber, Rest Kupfer; Anteile frei wählbar, kein festes
  Zahlenverhältnis – nicht „Rein heißt im Alltag …“; Test). Stoffe im Alltag: „Ethanol (C₂H₅OH)“ statt „reiner Alkohol“ (handelsüblich etwa 96 %), Messing als
  Verbindung gewählt → „Anteile frei wählbar, kein festes Zahlenverhältnis“ (Test). Masse beim Lösen: höchstens so viel Salz, wie sich löst (Kochsalz bei 20 °C etwa
  36 g in 100 g Wasser – im Quiz höchstens 30 g je 100 g; Test). Satzanfänge in Frage und Lösungsweg groß (`cap` in beiden
  Sprachen, auch nach Anführungszeichen; Test); Zahlen-Auswahl aufsteigend, auch mit Einheit (Masse, Test). Die Generatoren `homogen` (alle Alltagsbeispiele, auch
  Edelstahl, Granit, Sand in Wasser) und `erhalten` stehen in keinem Kapitel – sie bleiben nur für ältere Einträge unter „Heute fällig“.
  Englisch: Artikel vor buchstabierten Formeln („an H₂O particle“), Elementnamen mitten im Satz klein (`english-grammar.test.ts`).
  „Nach dem Mischen“ bei Messing: 12 Atome (8 Cu : 4 Zn); „abwechselnd“ als festes Muster (Zink auf einem regelmäßigen Untergitter, `mixing.ts`), „getrennt“ als zwei
  Blöcke (passt der Stoff nicht in ganze Spalten: Spalte für Spalte gefüllt), das richtige Bild sichtbar zufällig (Test); Lösungsweg „Die Atome sitzen zufällig
  verteilt im Gitter – kein Muster, alle noch da“ (nicht „gleichmäßig“), Rückmeldungen kurz genug für 375 × 667 (Test). Jedes Antwortbild hat eine Beschreibung mit
  Anordnung („gleichmäßig verteilt“, „C₁₂H₂₆ oben“, „zufällig verteilt“ …) – auch das richtige, sonst verriete das Vorlesen die Lösung (Test).
  Bild der Aufgabe `pic` (`.q-gm` als Grid mit einer Zeile `minmax(0, 1fr)`, sonst bleibt der Becher in voller Höhe – Inhalt 754 × 767 px in 232 px Platz – und
  wird abgeschnitten; Test). Jedes Aufgabenbild nennt seine Mindesthöhe `data-min-h` (`minPic`: Destillieren 100 px – Temperatur noch ≥ 14 px –, sonst 56 px wie
  `MIN_PIC`; ohne Tipp wird kein Bild so klein, auch nicht bei 375 × 667): darunter gehen Tipp und erster Schritt ins Blatt, statt das Bild zu stauchen (Test); bis dahin
  darf das Bild auf 56 px schrumpfen (sonst ragte der Tipp bei „Reihenfolge“ 1 px über die Aufgabe, ohne ins Blatt zu wechseln); nach der Antwort fällt ein Bild unter
  seiner Mindesthöhe weg (Container-Abfrage auf `.q-visual`),
  Teilchenbilder als Antworten `pics` (zwei Spalten, Höhe begrenzt; das Bild füllt die Taste, der Kennbuchstabe liegt klein oben links auf dem Rand – über dem
  leeren Rand des Bilds, nie über einem Teilchen; höchstens drei Bilder untereinander und größer, Klasse `few`, nach der Antwort am niedrigen Handy flacher),
  Verfahren `sep` (t = −1 Animation, sonst Standbild), Gemisch `mixPic` (Ausschnitt um Schale, Glas bzw. Papierstreifen – Eisenspäne, Sand und Salz gut zu sehen),
  Verfahren als Bildkarten `methods`. **Vorgemachte Beispiele zum Antippen** (`tippAtome`, `tippElement`, `tippVerbindung`, `trennTipp`, `loesTipp`) zeigen das Bild
  mit markierter Lösung (`visualFor` → `TapSolved`; sonst ist das Bild die Antwortfläche `TapAnswer`, Test `quiz/view.test.ts`); das Aufgabenbild weicht nach der
  Antwort am niedrigen Handy der Rückmeldung, im vorgemachten Beispiel nie (`.task-card.answered:not(.worked)`, Test). Text-Antworten gibt `renderOption` als reinen Text zurück (kein eigenes `span` – sonst misst `McAnswer` nicht, ob ein Wort in seine
  Spalte passt, und „Gasgemisch“ bräche zweispaltig mitten im Wort um). Stolpersteine u. a.: Verbindung für Gemisch gehalten, Gemisch aus Elementen für Verbindung, gelöster Stoff
  verschwindet, gelöster Stoff bleibt als Kristall, Masse ändert sich, Luft zwischen den Teilchen, Teilchen ruhen (auch in der Schmelze), Teilchen haben die Farbe des Stoffs
  (in Kapitel 1 nur Beispiele, deren Modellfarben das Kapitel zeigt: Zucker, CO₂, Wasser, Eis – keine Metalle, Test), „rein“ im Alltag,
  Legierung und Gemenge verwechselt, gemischte Metalle für Verbindung gehalten (Name ohne „Legierung“, kommt schon in Kapitel 3 vor), Gelöstes filtrierbar,
  Teile nach dem Trennen verwechselt, Reihenfolge vertauscht. Der Schlüssel passt zur gewählten Antwort (z. B. „fein verteilt für homogen gehalten“ nur bei
  einer homogenen Antwort, „Gemisch aus Elementen für Reinstoff“ bei Messing statt „klar“; Kakao mit Bodensatz „entmischt“; Test).
  Hilfsmittel „Farben“: alle Atomfarben (verrät nicht, welche vorkommen). Nie zwei Atomsorten mit ähnlicher Farbe (He/Ne, Cu/Fe, Zn/Al) in einer Aufgabe
  (`distinctColors`, Test); Argon violett. Artikel, Fall und Einzahl/Mehrzahl in erzeugten Sätzen beachten („aus 4 Atomen“, aber „H₂O₂ hat 4 Atome“, `ATOM_ACC`; Test). Erklärkarte je Kapitel (`quiz/explain.tsx`, Kapitel 5 mit
  dem Bild des Filtrierens, Kapitel 6 mit **Vorlage**; „In diesem Kapitel hilft der Tipp …“). k6: „Gelöstes geht durch das Filterpapier. Salz und Wasser trennt man
  über die Siedetemperatur …“ (nicht „Gelöstes trennt man über die Siedetemperatur“ – Farbstoffe trennt die Chromatografie; Test).
- **Trennverfahren** (`components/Separation.tsx`): Auslesen, Sieben, Magnettrennung, Dekantieren, Filtrieren, Eindampfen, Destillieren, Chromatografie als SVG-Bild,
  das eine reine Funktion des Fortschritts t ist (`SepScene`, 0 = vorher, 1 = getrennt; `SepAnim` spielt ab, „Nochmal“-Knopf, reduzierte Bewegung → Endbild).
  Teile mit `data-part` (Ziele für Beschriftung und Antippen). Mit `onPick` (Klasse `sp-tap`) nehmen **nur** die antippbaren Teile Klicks an (`parts` bzw.
  `TAP_PARTS` je Verfahren, z. B. Rückstand, Filtrat, Filterpapier – nie Verzierungen wie der schwarze Startpunkt der Chromatografie, Gefäße oder Hilfslinien),
  dazu unter dem Bild unsichtbare Trefferflächen je Teil: sichtbarer Umriss (`getBBox`, durch den `clipPath` begrenzt, über die Bildschirm-Matrizen in Bild-Einheiten),
  mindestens 44 × 44 px, nie über das Bild hinaus; etwa gleich große, überlappende Flächen (Farbflecken) teilen sich an der Mitte, ein viel kleineres Teil liegt oben auf
  dem größeren (Salz in der Schale). Bildausschnitt je Verfahren (`BOX`: Umriss aller Zeitpunkte mit Rand) – das Gerät füllt das Bild. Chromatografie: Farbstoffe weit
  genug auseinander, dass jeder Fleck 44 × 44 px Trefferfläche hat (Gelb bei Rf 0,25 – auch die Startlinie ist einzeln antippbar). Eindampfen: Dampf erst bei
  brennender Flamme; die Schale liegt mit ihrem tiefsten Punkt auf dem Drahtnetz über dem Dreifuß, die Flamme reicht bis ans Netz (Test). Destillieren nie bis zur
  Trockne (Salzwasser bleibt im Kolben, Alkohol und Wasser endet bei halb vollem Kolben und etwa 90 °C); Alkohol ist brennbar – mit `alk` sitzt der Kolben in einer
  **Heizhaube** (`Mantle`: Mulde glüht, Kontrolllampe), keine offene Flamme (Test). Temperatur am Thermometer auf dem Bildschirm mindestens 14 px (`tempFont`: Größe
  in Bild-Einheiten aus dem gemessenen Maßstab, heller Rand; Test). **Dekantieren** (`dekState`, Test): Glas 1 mit Ausguss rechts kippt im Uhrzeigersinn um die
  Spitze des Ausgusses bis 60°, der Wasserspiegel bleibt waagrecht (Fläche im gekippten Glas per Bisektion); was beim größten bisher erreichten Winkel nicht mehr
  hineinpasst, ist über den Ausguss ins anfangs leere Glas 2 geflossen (Strahl nur dann, aus der Spitze des Ausgusses); die Gläser berühren sich nie, der Sand
  bleibt als Bodensatz, danach steht Glas 1 wieder (mit etwas Wasser über dem Sand). `mark` umrahmt ein Teil gestrichelt grün (Lösung nach der Antwort im Quiz, in der Lektion nach dem Lösen bzw. pulsierend nach
  vier Fehlversuchen). `check-ui` prüft in jedem `svg.sp-tap`, dass jedes Teil mit Trefferfläche per `elementFromPoint` erreichbar ist und keine Trefferfläche aus dem Bild ragt
  oder mehr als 40 % des Bilds belegt (sonst zählt Tippen ins Leere als Antwort). Farben nur aus der Palette (`.sp-*` in `app.css`).
  `MixPic` = Gemisch vor dem Trennen ohne Geräte (verrät das Verfahren nicht). Eindeutige `clipPath`-Kennungen je Bild (`useId`).
  Sieben: Maschen als Drahtquerschnitte mit sichtbaren Lücken; Sandkörner rutschen zur nächsten Lücke, fallen hindurch und häufen sich in der Schale, Kiesel
  (größer als die Lücke) bleiben liegen. Destillieren: Rundkolben auf Dreifuß über dem Brenner, Thermometer am Abzweig (steigt auf 100 °C und bleibt dort, solange
  Wasser siedet), Liebig-Kühler mit Kühlwasser im Gegenstrom (unten hinein, oben heraus), Dampf wird im Kühler zu Tropfen, Vorlage = Erlenmeyerkolben, Salz bleibt
  im Kolben. Chromatografie: Streifen hängt im abgedeckten Becherglas; der Startpunkt ist schwarz (drei Farbstoffe übereinander), die Laufmittelfront steigt,
  jeder Farbstoff wandert verschieden weit (Gelb, Rot, Blau) – der Punkt läuft auseinander.
- Zählen in der Werkbank (`Counts` in `views/MixView.tsx`) ist eine **Anzeige zum Nachprüfen, keine Abfrage**: Teilchen, Stoffe, davon Verbindungen und Elemente,
  Atomsorten stehen immer mit Zahl da. Jeden Stoff, „Verbindungen“, „Elemente“ und jede Atomsorte kann man antippen: dann sind im Gefäß und in der Lupe nur deren
  Teilchen kräftig, alle anderen blass (`FlowView` `mark`); am Handy schließt sich das Blatt dabei. Kein Erklärsatz: jede markierbare Zeile und jeder Chip trägt das
  Kennzeichen ◎ (grau, gedrückt in der Farbe der Taste; `aria-label` „… im Bild markieren“). Die Statuszeile zeigt die Markierung als Taste („◎ CO₂ ✕“ = aufheben).
  Keine Eingabe, kein ✓/✗, keine Aufforderung.
- **Lektionen** (`src/lessons.tsx`, `LESSONS[0…5]`, je Kapitel 4–12 Schritte, vorgemacht → halb gelöst → selbst, keine Zahleneingabe; die richtige Auswahl steht
  an wechselnden Plätzen, Zahlen aufsteigend – Test: höchstens 40 % an Platz 1): 1 Teilchen zählen,
  Teilchen aus 5 Atomen antippen, Atomsorten an den Farben (Ablenker = echte Zählfehler: Teilchen, Teilchensorten; Test), Stoffe, **Eigenschaften des Stoffs**
  (halb gelöst: ein einzelnes Wasserteilchen ist nicht flüssig und hat keine Farbe – für die Aufgabe „Teilchen und Stoff“, Test), leerer Raum ·
  2 Element/Verbindung, Element antippen, Verbindungen zählen, Kupfer ·
  3 Reinstoff/Gemisch, homogen/heterogen (Zuckerwasser = Lösung, Milch, Gasgemisch), Lösen (Animation), Masse, Tinte · 4 Arten von Gemischen (Suspension,
  Emulsion, Schaum (Eischnee), Gemenge, Legierung – Anteile frei wählbar, oft homogen – fett eingeführt), in Gas (Gasgemisch, Nebel, Rauch fett eingeführt, eigener
  vorgemachter Schritt), Öl in Wasser, Müsli, „rein“ · 5 Sieben, Magnettrennung, Auslesen (rote/weiße Bohnen), Dichte/Bodensatz/Dekantieren,
  Bodensatz antippen, Filtrieren (Rückstand, Filtrat), Rückstand antippen · 6 **Gerät selbst bedienen** (`SepDevice`: Bild bei t = 0, Brenner aus, Knopf „Brenner an“,
  „Heizen an“ bzw. „Start“ spielt den Ablauf): Eindampfen, Destillieren von Salzwasser (Thermometer 100 °C), Destillieren von Alkohol und Wasser mit **Heizhaube**
  („Alkohol ist brennbar: Man heizt ohne Flamme“, Test; `alk`: beides verdampft, Alkohol
  leichter – im Dampf ist mehr Alkohol; Temperatur steigt langsam von etwa 80 °C an, kein fester Wert; Destillat nie „rein“; auch Erklärkarte k6 und Tipp, Test), Chromatografie (Satz: weit = gut löslich im Laufmittel und schwach haftend), weitesten Farbstoff antippen,
  mehrere Schritte Salz + Sand (vorgemacht) und Eisen + Sand + Salz (Platz ① ergänzen: Magnettrennung; Schrittnamen `STEP` wie in der Aufgabe). **Vorlage** und
  **Startlinie** fett eingeführt;
  der Rückstand beim Destillieren ist das salzige Wasser im Kolben (nie bis zur Trockne). Kapitel 4 beginnt mit „Viele Gemische haben eigene Namen“ (die Liste enthält
  auch die homogene Legierung). Englisch: Verfahren beim Einführen mit demselben Namen wie in den Aufgaben (filtration, evaporation, distillation); die Schritte
  einer Trennung als kurze Verben (Dissolve, Filter, Evaporate, Magnet – wie in der Aufgabe „Reihenfolge“, Test `english-steps.test.ts`).
  Begriffe früherer Kapitel stehen in `known`. Test: Geräte und Teile (Vorlage, Kühler, Destillat, Laufmittel, Rückstand, Filtrat, Bodensatz, Filterpapier) stehen
  beim ersten Vorkommen fett.
