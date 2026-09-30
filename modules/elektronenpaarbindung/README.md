# Elektronenpaarbindung

Moleküle aus Atomen bauen – per Drag & Drop auf einem Raster, dargestellt als Lewis-Formel.

- Atome zeigen ihre Valenzelektronen als Punkte (einzelne Elektronen leicht hervorgehoben).
- Nebeneinander liegende Atome teilen ungepaarte Elektronen → gemeinsames Elektronenpaar im grauen Oval.
- Tipp auf ein Oval: Doppel- bzw. Dreifachbindung (O₂, N₂, CO₂ …).
- Roter Kreis mit ✓ = Oktett erreicht (H: Duett, nur ✓).
- Daneben automatisch: Valenzstrichformel (Umschalter **Keilstrichformel** für den räumlichen Bau: Keil nach vorn, gestrichelter Keil nach hinten), Summenformel, Name; in der Oberstufe zusätzlich Molekülgeometrie (EPA-Modell), Bindungswinkel und Polarität.
- **3D-Ansicht** (Knopf beim fertigen Molekül): frei drehen und zoomen, Bindungswinkel, freie Elektronenpaare als Wolken, Teilladungen und Dipolpfeil (three.js, wird erst beim Öffnen geladen). Teilladungen/Dipol sind beim Start immer aus; den Dipolpfeil gibt es nur bei Molekülen mit höchstens 5 Atomen.
- Quiz mit Aufgabe „Molekül bauen“, Erklärkarten, Speichern und „Schwächen üben“.

## Entwickeln
Modul der App Edi (`apps/edi`), Adresse `#/elektronenpaarbindung`.
```bash
npm install            # im Hauptordner
npm run dev            # http://localhost:5173/#/elektronenpaarbindung
```
