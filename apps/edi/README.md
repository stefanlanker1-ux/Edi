# Edi – App-Hülle

Übersicht aller Module, Adressen `#/<modul>`, Laden der Module bei Bedarf, ein Service Worker, eine Offline-Datei, eine Capacitor-Konfiguration.
Die Module selbst liegen unter `modules/`, ihr Register in `src/modules.ts`.

## Entwickeln
```bash
npm install            # im Hauptordner
npm run dev            # http://localhost:5173
```

## Ausgaben von `npm run build`
- `dist/` – Web-Version (GitHub Pages), installierbar und offline nutzbar; dazu Weiterleitungen der früheren Adressen `<modul>/`
- `dist-single/index.html` – alle Module in einer Datei, per Doppelklick offline nutzbar (auf der Website `edi-offline.html`)

## Android- und iOS-App (Capacitor)
Voraussetzungen: **Android Studio** (für Android) bzw. ein **Mac mit Xcode** (für iOS).
Die nativen Projekte liegen in `android/` und `ios/` (Web-Dateien werden beim Synchronisieren hineinkopiert, nicht mitversioniert).
App-Icons und Startbild entstehen aus `assets/` mit `npx @capacitor/assets generate`.
Kraftfeld MMFF94 (`packages/chem/src/mmff`, Einstieg `@lern/chem/mmff`, wird erst bei Bedarf geladen und rechnet im Hintergrund-Thread `packages/chem-ui/src/ff.worker.ts`):
räumliche Lage frei gebauter Moleküle (Elektronenpaarbindung) und gezeichneter Moleküle (Organik), sofern keine gemessene Struktur hinterlegt ist
(`packages/chem/src/mol3d.ts`, erzeugt von `scripts/mol3d.py`). Web und App gleich. Prüfung gegen RDKit: `scripts/mmff-reference.py` und `packages/chem/test/mmff-reference.test.ts`.
Der Workflow „Android- und iOS-App bauen“ (`native.yml`) baut bei jedem Push auf main, der die App betrifft, eine Debug-APK (Download unter „Artifacts“) und prüft den iOS-Build für den Simulator.
Das signierte App-Bundle für den Play Store baut `release.yml` (nur von Hand gestartet; Eingaben, Secrets und Ablauf siehe `docs/entwicklung.md`).

```bash
cd apps/edi
npm run android        # baut die App, überträgt sie ins Android-Projekt und öffnet Android Studio
npm run ios            # dasselbe für iOS/Xcode (nur auf dem Mac)
```
In Android Studio bzw. Xcode dann auf ▶ drücken (Emulator oder angeschlossenes Gerät).
Nach jeder Änderung erneut `npm run android` bzw. `npm run ios` ausführen.

Vor einer Veröffentlichung im Play Store / App Store:
- `appId` (`app.edi.lernen`, auch in `android/app/build.gradle`, `MainActivity.java`, `strings.xml`, iOS `project.pbxproj`) bleibt für immer gleich
- eigene App-Icons und Startbildschirm erzeugen, z. B. mit `npx @capacitor/assets generate` (Vorlage: `public/icons/icon-512.png`)
