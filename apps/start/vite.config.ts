import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import { licensePlugin } from "../../scripts/licenses.ts";

// Startseite im Hauptordner der Website. Ihr Service Worker leitet Seitenaufrufe nicht um –
// jede App in ihrem Unterordner hat einen eigenen.
export default defineConfig({
  base: "./",
  plugins: [
    react(),
    licensePlugin(),
    VitePWA({
      injectRegister: null,
      registerType: "autoUpdate",
      includeAssets: ["icons/*"],
      workbox: { globPatterns: ["*.{js,css,html,svg,png,woff2,txt}", "assets/*", "icons/*"], navigateFallback: null, cleanupOutdatedCaches: true },
      manifest: {
        name: "Lern-Apps – Chemie und Einheiten",
        short_name: "Lern-Apps",
        description: "Lern-Apps für den Unterricht: Atombau, Ionenbindung, Elektronenpaarbindung, Einheiten umrechnen.",
        lang: "de",
        start_url: "./",
        scope: "./",
        display: "standalone",
        background_color: "#ffffff",
        theme_color: "#ffffff",
        icons: [
          { src: "icons/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "icons/icon-512.png", sizes: "512x512", type: "image/png" },
        ],
      },
    }),
  ],
  build: { outDir: "dist" },
});
