# Einheiten umrechnen

Einheiten umrechnen von der Unterstufe bis zur Oberstufe – immer mit **demselben Verfahren**:

1. **Umrechnungszahl** bestimmen: `1 cm = 0,1 dm = 0,01 m = 0,000 01 km`, bei Flächen `1 m² = 1 m · 1 m = 100 cm · 100 cm = 10 000 cm²`,
   bei zusammengesetzten Einheiten jede Einheit ersetzen: `1 km/h = 1000 m / 3600 s = 1/3,6 m/s`.
2. **Einsetzen und ausrechnen** in einer Zeile: `14 cm = 14 · 0,000 01 km = 0,000 14 km` (gleichwertig `14 : 100 000 km`) – dazu der Merksatz (große → kleine Einheit: mal) und die Kommaregel.

- **Umrechnen**: Größe wählen (Länge, Fläche, Volumen, Masse, Zeit; Oberstufe zusätzlich Geschwindigkeit, Dichte, Druck, Kraft,
  Energie, Leistung, Spannung, Stromstärke, Widerstand, Ladung, Frequenz, Konzentration, Durchfluss), Zahl eingeben, Einheiten antippen.
- **Live mitrechnen** (neben der Eingabe, ändert sich bei jeder Eingabe):
  - Unterstufe: **Pfeilkette** wie im Heft (`km ⇄ m ⇄ dm ⇄ cm ⇄ mm`, unten `· 1000 · 10 …`, oben `: 1000 : 10 …`, der Weg leuchtet,
    unter jeder Einheit steht die Zahl) und **Stellenwerttafel** (`100 m | 10 m | m | dm | cm | mm`, Komma-Punkte, ergänzte Nullen).
  - Oberstufe: **Vorsilben-Skala** n µ m c d – da h k M G (10⁻⁹ … 10⁹) mit Bogenpfeil `· 10⁶`:
    Umrechnungszahl = 10^(Hochzahl vorher − Hochzahl nachher), bei m² bzw. m³ Hochzahl mal 2 bzw. 3.
- **Rechenweg an der Tafel** (eigener Knopf): Tafelbild mit Kreideschrift zum Abschreiben (Oberstufe zusätzlich mit Zehnerpotenzen).
- **Veranschaulichung** (Unterstufe): Lineal mit Zoom, 10 × 10-Raster, Würfel aus 1000 kleinen Würfeln, Messbecher, Uhr, Streifen.
- **Üben** – modular mit abnehmender Hilfe, 8 Aufgaben pro Runde, zwei Versuche mit gezieltem Tipp:
  Unterstufe ① mit Stellenwerttafel (die eingetippte Zahl erscheint live als zweite Zeile unter der Aufgabe) → ② mit Pfeilen → ③ ohne Hilfe;
  Oberstufe ① mit Vorsilben-Skala → ② ohne Hilfe (Länge, Fläche & Volumen, Masse, Elektrik, Energie & Leistung, Zeit & Frequenz).
- **Quiz**: 3 Level je Stufe, Eingabe mit Komma (auch `2,5·10^-4`), in jeder Rückmeldung Pfeilkette/Skala und Rechenweg an der Tafel.

Die Rechenlogik liegt in `packages/units` (`@lern/units`): exakte Brüche (keine Rundungsfehler), Einheitenkatalog,
Herleitung der Umrechnungszahl (wird für jede Einheitenkombination gegen SI-Faktoren getestet) und Stellenwerttafel.

## Entwickeln
Modul der App Edi (`apps/edi`), Adresse `#/einheiten`.
```bash
npm install            # im Hauptordner
npm run dev            # http://localhost:5173/#/einheiten
```
