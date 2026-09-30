// Gemeinsame Vite-Konfiguration der App Edi:
//   export default appConfig({ name: "…", shortName: "…", description: "…" }, { legacy: ["atombau", …] });
// Zwei Builds:
//   vite build               → dist/        Web-Version (GitHub Pages, Android/iOS via Capacitor), offline-fähig, ein Service Worker
//   vite build --mode single → dist-single/  eine einzige HTML-Datei mit allen Modulen (Doppelklick genügt)
// Stile unter modules/<id>/src gelten nur im offenen Modul (modul-scope.ts).

import { defineConfig, type Plugin, type UserConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import { viteSingleFile } from "vite-plugin-singlefile";
import { licensePlugin } from "./licenses.ts";
import { modulScope } from "./modul-scope.ts";

export interface AppManifest {
  /** voller Name, z. B. „Edi – Lern-Apps für Chemie und Einheiten“ */
  name: string;
  /** Kurzname unter dem Symbol am Home-Bildschirm */
  shortName: string;
  description: string;
}

export interface AppOptions {
  /** frühere eigenständige Apps unter …/<id>/: Weiterleitung auf #/<id>, alter Service Worker meldet sich ab */
  legacy?: string[];
}

export function appConfig(m: AppManifest, o: AppOptions = {}) {
  return defineConfig(({ mode }): UserConfig => {
    const single = mode === "single";
    const legacy = o.legacy ?? [];
    return {
      base: "./",
      css: { postcss: { plugins: [modulScope()] } },
      plugins: [
        react(),
        licensePlugin(),
        ...(single ? [viteSingleFile()] : [legacyPlugin(legacy), VitePWA({
          injectRegister: null,
          registerType: "autoUpdate",
          includeAssets: ["icons/*"],
          workbox: {
            globPatterns: ["**/*.{js,css,html,svg,png,woff2,txt}"],
            // die Abmelde-Skripte der früheren Apps gehören nicht in den Speicher
            globIgnores: legacy.map(id => `${id}/sw.js`),
            // Adressen: #/<modul> – jede Seitenanfrage bekommt die App; Dateien zum Herunterladen nicht
            navigateFallback: "index.html",
            navigateFallbackDenylist: [/offline\.html$/, /\.txt$/],
            cleanupOutdatedCaches: true,
          },
          manifest: {
            name: m.name,
            short_name: m.shortName,
            description: m.description,
            lang: "de",
            start_url: "./",
            scope: "./",
            display: "standalone",
            background_color: "#ffffff",
            theme_color: "#ffffff",
            icons: [
              { src: "icons/icon-192.png", sizes: "192x192", type: "image/png" },
              { src: "icons/icon-512.png", sizes: "512x512", type: "image/png" },
              { src: "icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
            ],
          },
        })]),
      ],
      build: single
        ? { outDir: "dist-single", assetsInlineLimit: 100_000_000, copyPublicDir: false }
        : {
            outDir: "dist",
            // Dateien der Module nach dem Modul benennen (assets/atombau-….js statt entry-….js)
            rolldownOptions: { output: { chunkFileNames: c => `assets/${moduleOf(c.facadeModuleId) ?? "[name]"}-[hash].js` } },
          },
    };
  });
}

const moduleOf = (file: string | null) => (file ? /[\\/]modules[\\/]([a-z0-9-]+)[\\/]src[\\/]entry\.tsx$/.exec(file)?.[1] : undefined);

/** alte Adressen …/<id>/ weiterleiten; der alte Service Worker unter …/<id>/sw.js löscht seinen Speicher und meldet sich ab.
 *  Gespeicherte Fortschritte (localStorage) bleiben: gleiche Website, gleiche Schlüssel. */
function legacyPlugin(ids: string[]): Plugin {
  const page = (id: string) => `<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta http-equiv="refresh" content="0; url=../#/${id}">
<link rel="canonical" href="../#/${id}">
<title>Weiterleitung</title>
<script>location.replace("../#/${id}");</script>
</head>
<body><a href="../#/${id}">Weiter</a></body>
</html>
`;
  const sw = `// Frühere eigenständige App: Speicher dieser Adresse löschen, abmelden, offene Fenster auf die neue Adresse bringen.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", e => e.waitUntil((async () => {
  const scope = self.registration.scope;
  for (const k of await caches.keys()) if (k.includes(scope)) await caches.delete(k);
  await self.registration.unregister();
  for (const c of await self.clients.matchAll({ type: "window" })) c.navigate(c.url);
})()));
`;
  return {
    name: "edi-legacy",
    generateBundle() {
      for (const id of ids) {
        this.emitFile({ type: "asset", fileName: `${id}/index.html`, source: page(id) });
        this.emitFile({ type: "asset", fileName: `${id}/sw.js`, source: sw });
      }
    },
  };
}
