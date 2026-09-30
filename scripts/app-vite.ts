// Gemeinsame Vite-Konfiguration aller Lern-Apps. Jede App gibt nur ihren Namen und ihre Beschreibung an:
//   export default appConfig({ name: "…", shortName: "…", description: "…" });
// Zwei Builds:
//   vite build               → dist/        Web-Version (GitHub Pages, Android/iOS via Capacitor), offline-fähig
//   vite build --mode single → dist-single/  eine einzige HTML-Datei zum Weitergeben (Doppelklick genügt)

import { defineConfig, type UserConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import { viteSingleFile } from "vite-plugin-singlefile";
import { licensePlugin } from "./licenses.ts";

export interface AppManifest {
  /** voller Name, z. B. „Atombau – Atome bauen, PSE, Quiz“ */
  name: string;
  /** Kurzname unter dem Symbol am Home-Bildschirm */
  shortName: string;
  description: string;
}

export function appConfig(m: AppManifest) {
  return defineConfig(({ mode }): UserConfig & { test?: unknown } => {
    const single = mode === "single";
    return {
      base: "./",
      plugins: [
        react(),
        licensePlugin(),
        single
          ? viteSingleFile()
          : VitePWA({
              injectRegister: null,
              registerType: "autoUpdate",
              includeAssets: ["icons/*"],
              workbox: { globPatterns: ["**/*.{js,css,html,svg,png,woff2,txt}"] },
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
            }),
      ],
      build: single
        ? { outDir: "dist-single", assetsInlineLimit: 100_000_000, copyPublicDir: false }
        : { outDir: "dist" },
      test: { include: ["src/**/*.test.ts"] },
    };
  });
}
