# Edi – Lern-Apps für Chemie und Einheiten

Interaktive Lern-App für die Sekundarstufe: eine App mit mehreren Modulen, die sich Design und Logik teilen.
Läuft im Browser, als installierbare Web-App (offline), als Einzeldatei und als Android-/iOS-App.
Jedes Modul hat die Bereiche **Experimentieren** (frei ausprobieren) und **Üben**; wo es eine geführte **Erklärung** gibt, steht sie vorn in der Leiste.

| Modul | Inhalt |
| --- | --- |
| [Gemische](modules/gemische) | Reinstoffe und Gemische im Teilchenmodell an zehn Beispielen und Müsli: Lösen, Mischen, Öl und Wasser, Sprudel, Messing; Werkzeuge Stoffe, Zählen, Einteilung, Arten von Gemischen. Üben in sechs Kapiteln mit Lektion, bis zur Stofftrennung (Sieben, Filtrieren, Eindampfen, Destillieren, Chromatografie) |
| [Atombau](modules/atombau) | Atome bauen, Periodensystem, Elektronenkonfiguration; Erklärung und Üben |
| [Ionenbindung](modules/ionenbindung) | Ionenformeln mit Bausteinen aufstellen, vom Atom zum Ion, Namen von Salzen; Erklärung und Üben |
| [Elektronenpaarbindung](modules/elektronenpaarbindung) | Moleküle aus Lewis-Atomen bauen, Valenz- und Keilstrichformel, 3D-Modell; Erklärung und Üben |
| [Reaktionsgleichungen](modules/reaktionsgleichungen) | Gleichungen ausgleichen mit Atombilanz und Teilchenbild: Experimentieren mit Beispielreaktionen, Üben mit 3 × 10 Gleichungen je Stufe (einfach, mittel, schwer) |
| [Neutralisation](modules/neutralisation) | Lauge + Säure → Salz + Wasser mit Ionen-Bausteinen; Erklärung und Üben |
| [Nomenklatur](modules/organik) | Organische Moleküle zeichnen und nach IUPAC benennen, E/Z; Erklärung und Üben |
| [Polymere](modules/polymere) | Polymerisation, Polykondensation, Polyaddition: Ansatz bauen, Entstehung in Atomen und als Kügelchen im Reaktor; Üben in sechs Kapiteln mit Lektion |
| [Einheiten](modules/einheiten) | Einheiten umrechnen mit Rechenweg, Pfeilkette und Stellenwerttafel; Erklärung und Üben |

## Datenschutz

Die App speichert Fortschritt und Einstellungen nur lokal auf dem Gerät (localStorage) und sendet keine Daten.
Es gibt keine Konten, keine Cookies, kein Tracking und keine eingebundenen Fremdinhalte; Schriften werden mitgeliefert.
„Vorlesen“ nutzt nur Stimmen, die auf dem Gerät selbst sprechen (ohne eine solche Stimme gibt es den Knopf nicht).
Beim Aufruf der Website verarbeitet der Hosting-Dienst (GitHub Pages) technisch bedingt Zugriffsdaten wie die IP-Adresse.

## Aufbau (modularer Monolith)

Eine App-Hülle lädt die Module bei Bedarf; Module hängen nur von den gemeinsamen Paketen ab, nie voneinander
(automatisch geprüft, siehe `docs/entwicklung.md`, Abschnitt Architektur).

```
packages/
  chem/     @lern/chem    – Chemie-Daten und -Logik, ohne UI
  chem-ui/  @lern/chem-ui – Chemie-Darstellungen (Bohrmodell, Atomsymbol, PSE, Formel, Kalottenmodell, Stoff-Info, 3D)
  ui/       @lern/ui      – Designsystem und Bausteine (LernApp, Workbench, Sheet, Fit, Erklärung …)
  quiz/     @lern/quiz    – Grundgerüst „Üben“ (Runden, Kapitel mit Lektion, Fertigkeiten, Wiederholung, Erklärkarten, Auswertung)
  units/    @lern/units   – Einheiten: exakte Brüche, Katalog, Umrechnung mit Rechenweg
  i18n/     @lern/i18n    – Sprache der Oberfläche (Deutsch, Englisch)
modules/
  <id>/     @edi/<id>     – je ein Modul (Inhalt, Üben, Stile), Beschreibung in src/index.tsx
apps/
  edi/      – App-Hülle: Übersicht, Adressen #/<id>, Laden bei Bedarf, Service Worker, Capacitor
scripts/    – Build-Konfiguration, Stil-Geltungsbereich der Module, Architektur-Prüfung, Lizenzhinweise, Website, Browser-Prüfung
CLAUDE.md – Kurzfassung für Claude Code (lädt automatisch): Befehle, Zweige, wichtigste Regeln
docs/entwicklung.md – Regeln und Konventionen für die Weiterentwicklung (alle Module)
modules/<id>/CLAUDE.md – Stand und Entscheidungen je Modul
docs/verlauf.md – früherer Änderungsverlauf (Archiv)
```

Technik: **React 19 + TypeScript + Vite**, zustand, `vite-plugin-pwa`, Vitest; Capacitor für Android/iOS.

## Befehle (im Hauptordner)

```bash
npm install          # einmalig
npm run dev          # App im Browser entwickeln (http://localhost:5173)
npm test             # Architektur-Prüfung und alle Tests
npm run typecheck    # TypeScript prüfen
npm run build        # App bauen (apps/edi/dist und dist-single)
npm run site         # bauen und die komplette Website in site/ zusammensetzen
```

## Veröffentlichung

Ein Push auf `main`, der die App betrifft (`apps/`, `modules/`, `packages/`, `scripts/`, `package.json`, `package-lock.json`,
`tsconfig.base.json`), prüft und baut die App und veröffentlicht die Website auf GitHub Pages (`.github/workflows/pages.yml`);
zugleich baut `.github/workflows/native.yml` die Android- und iOS-App. Reine Doku-Änderungen lösen keinen Lauf aus.
Die Einzeldatei liegt dort als `edi-offline.html`, frühere Adressen `…/<modul>/` leiten auf `#/<modul>` weiter,
die Lizenzhinweise der verwendeten Open-Source-Pakete als `lizenzen.txt` (in der App: „Lizenzen“ in der Übersicht).
Das Android-Release für den Play Store startet nur von Hand (`.github/workflows/release.yml`, siehe `docs/entwicklung.md`).

Alle Rechte vorbehalten. Enthaltene Open-Source-Bausteine stehen unter ihren eigenen Lizenzen (siehe `lizenzen.txt` der Website).
