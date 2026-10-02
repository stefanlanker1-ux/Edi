# Benennung

Organische Verbindungen zeichnen und benennen – Name nach IUPAC (mit E/Z) und Lösungsweg.

- **Zeichnen:** Lewis-Formel (oder Gerüstformel) frei zeichnen: Atome anhängen, Bindungen ziehen, Ringe schließen, Doppel- und Dreifachbindungen.
  „Benennen“ zeigt den Namen, weitere gebräuchliche Namen, Summenformel und Stoffklasse; Hauptkette, Nummern und Hauptgruppe im Bild.
  Werkzeuge: Beispiele nach Stoffklassen, Schritte (Lösungsweg), Rangfolge der Gruppen.
- **Quiz:** Alkane, Doppel- und Dreifachbindung, funktionelle Gruppen, mehrere Gruppen – mit Stolpersteinen.

## Entwickeln
Modul der App Edi (`apps/edi`), Adresse `#/organik`.
```bash
npm install            # im Hauptordner
npm run dev            # http://localhost:5173/#/organik
```

## Prüfen der Benennung
```bash
python3 scripts/organik-oracle.py      # im Hauptordner: rund 17 500 Moleküle gegen OPSIN und RDKit (siehe docs/entwicklung.md)
```
