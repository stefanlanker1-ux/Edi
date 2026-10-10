# Elektronenpaarbindung (`modules/elektronenpaarbindung`)

Stand, Aufbau und fachliche Entscheidungen dieses Moduls. Claude Code lädt diese Datei automatisch, sobald eine Datei in `modules/elektronenpaarbindung/` gelesen oder geändert wird.
Allgemeine Regeln (Didaktik, Oberfläche, Architektur, Prüfen): `docs/entwicklung.md`. Diese Datei beschreibt immer den **aktuellen** Stand – bei jeder Änderung am Modul im selben Commit anpassen.

- Baufeld 6 × 5: Atome ziehen oder antippen und Felder antippen (Auswahl bleibt aktiv bis „Fertig“). Aus dem Feld ziehen = entfernen.
  Tastatur: Atom wählen (Enter), leere Felder per Tab/Enter, Bindungen/＋ per Enter, auf einem Atom Pfeiltasten = verschieben, Entf = entfernen.
- Benachbarte Atome (waagrecht/senkrecht) binden automatisch, wenn beide ungepaarte Elektronen haben; Tipp auf das Paar-Oval: Einfach → Zweifach → Dreifach → lösen.
- Logik in `packages/chem/src/molecules.ts` (Lewis-Belegung, Oktett, Erkennung bekannter Moleküle, EPA-Geometrie, Polarität) und `src/edit.ts`.
- Darstellung: blaue Elektronen, graues Oval für bindende Paare, großer roter Kreis um jedes Atom mit Edelgaskonfiguration (H: Duett, gestrichelt; zusätzlich ✓).
  Kreise benachbarter Atome überlappen, die bindenden Paare liegen in beiden. Jedes bindende Paar = eine Reihe aus zwei Punkten entlang der Bindung (Dreifachbindung = drei Reihen).
  Schalter „Punkte | Striche“ unter dem Baufeld (gespeichert): Paare als Striche wie in der Valenzstrichformel. Daneben Schalter „Oktett“ (gespeichert, Standard an):
  die roten Kreise liegen im Vordergrund (`rings`, `pointer-events: none` – Tippen und Ziehen gehen durch); ✓ und Zähler bleiben auch ohne Kreise.
- Automatisch erzeugte Valenzstrichformel steht auf breiten Bildschirmen links neben dem Baufeld (`Workbench side="left"`), am Handy im Werkzeug „Formel“.
  Lage aus `src/strich.ts` (`strichLayout`): wie gebaut, gewinkelte Atome (H₂O, H₂S, O in CH₃OH, H₂O₂ als Zickzack) auf ≈ 105° bzw. 120° gebogen, auch wenn sie im Raster in einer Reihe liegen.
- Freie Elektronenpaare symmetrisch zu den Bindungen (`loneLayout`, z. B. O in CO₂ schräg ± 45°).
- Bindungswinkel: gemessene Werte in `REAL_ANGLES` (molecules.ts; H₂S 92,1°, PH₃ 93,5°, Dimethylether 111,7°, Trimethylamin 110,9°, CH₃SH 96,5° …), sonst EPA-Schätzung mit „ca.“
  (Tetraeder genau 109,5° und trigonal-planar genau 120° nur bei gleichen Partnern: CH₃Cl „ca. 109,5°“, Methanal „ca. 120°“). Zweiatomige Moleküle: kein Winkel.
  Summenformel unbekannter Kohlenstoffverbindungen nach Hill (CH₅N).
- **Polarität** (`isPolar`): polare Bindungen (ΔEN ≥ 0,5, EN nach Allred-Rochow; `enDelta` mit zwei Stellen: H–Br 0,54 polar, N=O 0,43 → NOCl schwach polar; Teilladungen nach
  Allred-Rochow: P–H H δ−, C–I und C–S C δ−; Beispiele für „polare Bindungen heben sich auf“ mit C–F: CF₄, C₂F₄, cis/trans-Difluorethen; `DIPOLE_MIN` 0,25), deren Bindungsdipole sich in der räumlichen Lage (`embed3D`) nicht aufheben – Vektorsumme > `DIPOLE_EPS` (0,01, nur
  Spielraum für Rundung: ClC≡N 0,61 − 0,49 = 0,12 und CBrCl₃ 0,20 sind polar; „unpolar (symmetrisch)“ nur bei Summe ≈ 0). `DIPOLE_MIN` (0,2) gilt nur für den Dipolpfeil.
  ΔEN an einer Stelle (`enDelta`, auf zwei Stellen gerundet wie die Tabellenwerte) für Teilladungen und Dipole (N=O: 3,44 − 3,04 = 0,40 → NOCl polar).
  Auch bei mehreren Zentralatomen (Cl₂C=CCl₂, N≡C–C≡N, Cl₃C–CCl₃ unpolar). Teile, die sich um eine Einfachbindung drehen und auf beiden Seiten schräge Dipole tragen (H₂N–NH₂,
  ClCH₂–CH₂Cl, HO–CH₂–CH₂–OH), gelten als polar (im Mittel bleibt ein Dipol). Eine Einfachbindung zwischen zwei Zweifachbindungen (Butadien, Glyoxal) dreht sich nicht frei:
  eben und s-trans (Glyoxal unpolar, gemessen 0 D). Zweifachbindungen: cis/trans wie gebaut (Lage der Partner im Raster, `gridCisTrans`, ohne Angabe trans) – cis-1,2-Dichlorethen
  polar, trans unpolar. Kumulierte Zweifachbindungen (Allen): Endgruppen senkrecht zueinander (1,3-Dichlorallen polar). **Schwach polar** (`isWeaklyPolar`, `hasWeakDipole`): nicht polar,
  aber ein Dipol aus Bindungen mit 0 < ΔEN < 0,5 (z. B. CH₃Cl, CH₂Cl₂, CHCl₃, CH₃Br; HI mit 0,01 gilt als unpolar; ohne C–H – Kohlenwasserstoffe gelten wie in der Schule als unpolar) oder aus freien Elektronenpaaren an Zentralatomen,
  die sich nicht aufheben: H₂S 0,97 D, PH₃ 0,57 D, NCl₃, CH₃I 1,6 D, CH₂I₂, CHI₃, H₂C=S, CH₃SH, CH₃–S–CH₃. Anzeige im Werkzeug „Bau“: polar · schwach polar ·
  unpolar (symmetrisch) · unpolar; bei „schwach polar“ ein Satz dazu (Modell: freie Paare oder kleine ΔEN). Tests in `packages/chem/test/molecules.test.ts`.
- **Elektronegativität** nach Allred-Rochow (`elements.ts`, Primärquellen im Kommentar; EN-Tabelle „EN nach Allred-Rochow“, Erklärung H–Cl 0,63 mit CF₄ als
  symmetrischem Beispiel, Erklärkarte os-3, Steckbrief mit zwei Stellen; Quiz Polarität ohne Chlormethan – gemessen deutlich polar, nach der Regel nur schwach polar –,
  dafür Methanal und Blausäure). EN-Werte stehen nicht im PSE – eigene Tabelle `components/EnTable.tsx` (Ausschnitt wie im PSE, Trend „EN steigt →“, „EN sinkt ↓“),
  in der Erklärung (Level II, Teil Polarität) eingeführt und im Quiz bei „Polarität“ und „am stärksten polar“ als Hilfsmittel „EN-Tabelle“; Werte auch auf der Erklärkarte os-3.
- 3D-Ansicht für fertige, verbundene Moleküle: hinterlegte Struktur (`storedMol3D`), sonst Kraftfeld MMFF94 im Hintergrund (`computeMol3D`, cis/trans an Zweifachbindungen
  wie gebaut über `gridCisTrans`), kennt das Kraftfeld das Molekül nicht: EPA. Auf Klick: `@lern/chem-ui/3d` (three.js, per `lazy()` nachgeladen):
  Kugel-Stab (Stäbe zweifarbig je Atomfarbe) oder Kalotte (Van-der-Waals-Radien), Atomsymbol erst beim Antippen eines Atoms.
  Lage „Real“ aus `packages/chem/src/mol3d.ts` (erzeugt von `scripts/mol3d.py`: RDKit, Kraftfeld MMFF94, gemessene Winkel aus `REAL_ANGLES` und Verdrillungen festgehalten –
  H₂O₂ 111,5°, Hydrazin gauche mit ca. 91° zwischen den NH₂-Gruppen (gestaffelt-anti wäre unpolar),
  CO₂, SO₂, SO₃, NO₂, HNO₃, P₂O₅ aus Messdaten, zweiatomige mit gemessener Bindungslänge; neues Beispielmolekül → SMILES dort eintragen und Skript laufen lassen).
  `embed3D` nimmt für bekannte Moleküle diese Daten (Zuordnung `matchAtoms`, freie Paare nach EPA auf die echten Bindungen gedreht), sonst und für „Idealisiert“ EPA in `packages/chem/src/geometry3d.ts`. Ringe (EPA): nach dem Baum Ausgleich von Bindungslängen und Winkeln (`relax`, Ringwinkel „≈ 90°“), danach Substituenten und freie Paare der Ringatome exakt nach EPA (`placeRingSubstituents`: =O auf der Winkelhalbierenden, H-Paare symmetrisch). Mehrfachbindungen als parallele Stäbe in der Ebene der Nachbarbindungen. Umschalter Real (gemessene Winkel, `REAL_ANGLES`) / Idealisiert (109,5° / 120° / 180°); Schalter: Bindungswinkel, freie Elektronenpaare, Teilladungen/Dipol (Oberstufe).
- Teilladungen/Dipol starten immer ausgeschaltet (nicht gespeichert); Dipolpfeil nur bei Molekülen bis 5 Atome (`dipoleArrow`), sonst nur δ+/δ−.
- Umschalter Strichformel / Keilstrichformel (nur fertige Moleküle): `wedgeLayout` in `packages/chem/src/wedge.ts` (Papierebene aus embed3D, Keil = nach vorn, gestrichelt = nach hinten).
  Ein Zentralatom mit Tetraeder (CH₄, NH₃ …) als feste Standard-Zeichnung (Bindungen gleich lang, zu Partnern mit freien Paaren wie Cl × 1,2; Striche halten vor zweibuchstabigen Symbolen mehr Abstand); sonst beste Ansicht (viele Bindungen in der Ebene, keine Überlappung). Einfachbindungen zwischen Tetraeder-Atomen gestaffelt.
- Wasser nie linear zeichnen (auch nicht als Deko, z. B. Übersicht).
- Erklärung Level I (16 Schritte): **Außenelektronen** (Lewis-Schreibweise, ungepaarte Elektronen, Edelgaskonfiguration fett) · **Bindungen** · **Mehrfachbindungen** ·
  **Moleküle und Namen**. Level II (15 Schritte): **Bindungen** · **Molekülform** (EPA) · **Polarität**.
- Begriffe im EPA-Modell überall gleich: **Molekülform** (nicht „Molekülgeometrie“), **Bereich** = jede Bindung (auch eine Mehrfachbindung) und jedes freie Paar am Zentralatom
  (nicht „Partner“, „Richtung“ oder „Paar“ als Zähleinheit); Bindungspartner = Nachbaratome. Polarität im Quiz: Chlormethan mit eigenem Stolperstein „Verschiedene Bindungspartner
  übersehen“ (`partner-ungleich`). Unterstufe: Namen-Aufgaben nur mit Molekülen der Unterstufe (auch als falsche Antworten); jeder abgefragte Name steht in der
  Erklärung Level I (Wasser, Ammoniak, Methan, Chlorwasserstoff, Fluorwasserstoff, Tetrachlormethan, Kohlendioxid; Test).
- Handy mit niedriger Höhe (≤ 760 px): Atom-Leiste mit 44-px-Tasten ohne Namen, Formel im Kopf kleiner – das Baufeld bekommt mehr Platz.
- 3D frei gebauter Moleküle: Kraftfeld MMFF94 (`packages/chem/src/mmff`, Einstieg `@lern/chem/mmff`, erst bei Bedarf geladen, rechnet im Hintergrund-Thread
  `packages/chem-ui/src/ff.worker.ts`; im Web, in der Offline-Datei und in der App); für bekannte Moleküle gemessene Strukturen (`mol3d.ts`). Herkunft und Lizenz
  (Parameter Merck, Regeln aus RDKit, BSD-3) in `packages/chem/NOTICE.txt` – erscheint unter „Lizenzen“. Prüfung gegen RDKit: `scripts/mmff-reference.py`, `packages/chem/test/mmff-reference.test.ts`.
  3D-Darstellung: gemeinsame Geometrien, Beschriftungen nur bei Bedarf, ohne Kantenglättung bei hoher Pixeldichte (flüssig auf Handys).
