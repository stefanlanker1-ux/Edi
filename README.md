# Edi – Lern-Apps für Chemie und Einheiten

Interaktive Lern-Apps für die Sekundarstufe. Alle Apps teilen sich Design und Logik
und laufen im Browser, als installierbare Web-App (offline) und als Einzeldatei.

Website: **https://stefanlanker1-ux.github.io/Edi/**

| App | Inhalt |
| --- | --- |
| [Atombau](apps/atombau) | Atome bauen, Periodensystem, Elektronenkonfiguration, Quiz |
| [Ionenbindung](apps/ionenbindung) | Ionenformeln mit Bausteinen aufstellen, vom Atom zum Ion, Quiz |
| [Elektronenpaarbindung](apps/elektronenpaarbindung) | Moleküle aus Lewis-Atomen bauen, Valenz- und Keilstrichformel, 3D-Modell, Quiz |
| [Reaktionsgleichungen](apps/reaktionsgleichungen) | Gleichungen ausgleichen mit Teilchenbild, Quiz |
| [Säuren und Basen](apps/saeuren-basen) | pH-Skala, Indikatoren, Säuren und Laugen, Quiz |
| [Neutralisation](apps/neutralisation) | Lauge + Säure → Salz + Wasser mit Ionen-Bausteinen, Quiz |
| [Reinstoffe und Gemische](apps/reinstoffe) | Mischen, Trennen, Erhitzen mit Becherglas und Teilchenmodell, Quiz |
| [Stoffmenge](apps/stoffmenge) | Molare Masse, n = m / M, Teilchenzahl, Gasvolumen, Quiz |
| [Einheiten](apps/einheiten) | Einheiten umrechnen mit Rechenweg, Stellenwerttafel, Quiz |

## Datenschutz

Die Apps speichern Fortschritt und Einstellungen nur lokal im Browser (localStorage) und senden keine Daten.
Es gibt keine Konten, keine Cookies, kein Tracking und keine eingebundenen Fremdinhalte; Schriften werden mitgeliefert.
Beim Aufruf der Website verarbeitet der Hosting-Dienst (GitHub Pages) technisch bedingt Zugriffsdaten wie die IP-Adresse.

## Aufbau (Monorepo)

```
packages/
  chem/     @lern/chem    – Chemie-Daten und -Logik, ohne UI
  chem-ui/  @lern/chem-ui – Chemie-Darstellungen (Bohrmodell, Atomsymbol, PSE, Formel, 3D)
  ui/       @lern/ui      – Designsystem und Bausteine (LernApp, Workbench, Sheet, Fit …)
  quiz/     @lern/quiz    – Quiz-Grundgerüst (Fertigkeiten, Wiederholung, Erklärkarten, Auswertung)
  units/    @lern/units   – Einheiten: exakte Brüche, Katalog, Umrechnung mit Rechenweg
apps/
  start/    – Startseite mit Links zu allen Apps
  <app>/    – je eine App (React + Vite)
scripts/    – gemeinsame Build-Konfiguration, Lizenzhinweise, Website-Zusammenbau, Browser-Prüfung
docs/entwicklung.md – Regeln und Konventionen für die Weiterentwicklung
```

Technik: **React 19 + TypeScript + Vite**, zustand, `vite-plugin-pwa`, Vitest; Capacitor für Android/iOS.

## Befehle (im Hauptordner)

```bash
npm install          # einmalig
npm run dev          # Atombau im Browser entwickeln (http://localhost:5173)
npm test             # alle Tests
npm run typecheck    # TypeScript prüfen
npm run build        # alle Apps bauen (je dist/ und dist-single/)
npm run site         # bauen und die komplette Website in site/ zusammensetzen
```

## Veröffentlichung

Jeder Push auf `main` prüft und baut alle Apps und veröffentlicht die Website auf GitHub Pages
(`.github/workflows/pages.yml`). Die Einzeldateien liegen dort als `<app>/<app>-offline.html`,
die Lizenzhinweise der verwendeten Open-Source-Pakete als `lizenzen.txt`.

Alle Rechte vorbehalten. Enthaltene Open-Source-Bausteine stehen unter ihren eigenen Lizenzen (siehe `lizenzen.txt` der Website).
