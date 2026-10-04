# Edi – Lern-Apps für Chemie und Einheiten

Interaktive Lern-App für die Sekundarstufe: eine App mit mehreren Modulen, die sich Design und Logik teilen.
Läuft im Browser, als installierbare Web-App (offline) und als Einzeldatei.

| Modul | Inhalt |
| --- | --- |
| [Gemische](modules/gemische) | Reinstoffe und Gemische im Teilchenmodell: Teilchen, Elemente, Verbindungen; Öl und Wasser entmischen, Quiz |
| [Atombau](modules/atombau) | Atome bauen, Periodensystem, Elektronenkonfiguration, Quiz |
| [Ionenbindung](modules/ionenbindung) | Ionenformeln mit Bausteinen aufstellen, vom Atom zum Ion, Quiz |
| [Elektronenpaarbindung](modules/elektronenpaarbindung) | Moleküle aus Lewis-Atomen bauen, Valenz- und Keilstrichformel, 3D-Modell, Quiz |
| [Reaktionsgleichungen](modules/reaktionsgleichungen) | Gleichungen ausgleichen mit Teilchenbild, Quiz |
| [Neutralisation](modules/neutralisation) | Lauge + Säure → Salz + Wasser mit Ionen-Bausteinen, Quiz |
| [Nomenklatur](modules/organik) | Organische Moleküle zeichnen und nach IUPAC benennen, E/Z, Quiz |
| [Polymere](modules/polymere) | Polymerisation, Polykondensation, Polyaddition: Ansatz bauen, Entstehung in Atomen und als Kügelchen im Reaktor, Lernen in Kapiteln |
| [Einheiten](modules/einheiten) | Einheiten umrechnen mit Rechenweg, Stellenwerttafel, Quiz |

## Datenschutz

Die App speichert Fortschritt und Einstellungen nur lokal im Browser (localStorage) und senden keine Daten.
Es gibt keine Konten, keine Cookies, kein Tracking und keine eingebundenen Fremdinhalte; Schriften werden mitgeliefert.
Beim Aufruf der Website verarbeitet der Hosting-Dienst (GitHub Pages) technisch bedingt Zugriffsdaten wie die IP-Adresse.

## Aufbau (modularer Monolith)

Eine App-Hülle lädt die Module bei Bedarf; Module hängen nur von den gemeinsamen Paketen ab, nie voneinander
(automatisch geprüft, siehe `docs/entwicklung.md`, Abschnitt Architektur).

```
packages/
  chem/     @lern/chem    – Chemie-Daten und -Logik, ohne UI
  chem-ui/  @lern/chem-ui – Chemie-Darstellungen (Bohrmodell, Atomsymbol, PSE, Formel, Kalottenmodell, Stoff-Info, 3D)
  ui/       @lern/ui      – Designsystem und Bausteine (LernApp, Workbench, Sheet, Fit …)
  quiz/     @lern/quiz    – Quiz-Grundgerüst (Fertigkeiten, Wiederholung, Erklärkarten, Auswertung)
  units/    @lern/units   – Einheiten: exakte Brüche, Katalog, Umrechnung mit Rechenweg
modules/
  <id>/     @edi/<id>     – je ein Modul (Inhalt, Quiz, Stile), Beschreibung in src/index.tsx
apps/
  edi/      – App-Hülle: Übersicht, Adressen #/<id>, Laden bei Bedarf, Service Worker, Capacitor
scripts/    – Build-Konfiguration, Stil-Geltungsbereich der Module, Architektur-Prüfung, Lizenzhinweise, Website, Browser-Prüfung
docs/entwicklung.md – Regeln und Konventionen für die Weiterentwicklung
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

Jeder Push auf `main` prüft und baut die App und veröffentlicht die Website auf GitHub Pages
(`.github/workflows/pages.yml`). Die Einzeldatei liegt dort als `edi-offline.html`, frühere Adressen `…/<modul>/`
leiten auf `#/<modul>` weiter, die Lizenzhinweise der verwendeten Open-Source-Pakete als `lizenzen.txt`.

Alle Rechte vorbehalten. Enthaltene Open-Source-Bausteine stehen unter ihren eigenen Lizenzen (siehe `lizenzen.txt` der Website).
