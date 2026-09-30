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
Die nativen Projekte werden nicht mitversioniert; einmalig anlegen mit `npx cap add android` bzw. `npx cap add ios`.

```bash
cd apps/edi
npm run android        # baut die App, überträgt sie ins Android-Projekt und öffnet Android Studio
npm run ios            # dasselbe für iOS/Xcode (nur auf dem Mac)
```
In Android Studio bzw. Xcode dann auf ▶ drücken (Emulator oder angeschlossenes Gerät).
Nach jeder Änderung erneut `npm run android` bzw. `npm run ios` ausführen.

Vor einer Veröffentlichung im Play Store / App Store:
- `appId` in `capacitor.config.ts` festlegen (danach nicht mehr ändern)
- eigene App-Icons und Startbildschirm erzeugen, z. B. mit `npx @capacitor/assets generate` (Vorlage: `public/icons/icon-512.png`)
