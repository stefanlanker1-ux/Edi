// Setzt die Website für GitHub Pages zusammen:
//   site/                  App Edi (Übersicht, alle Module, ein Service Worker)
//   site/edi-offline.html  alle Module in einer Datei
//   site/<modul>/          Weiterleitung früherer Adressen (vom Build erzeugt)
import { cp, rm, mkdir, copyFile } from "node:fs/promises";

const OUT = "site";
await rm(OUT, { recursive: true, force: true });
await mkdir(OUT, { recursive: true });
await cp("apps/edi/dist", OUT, { recursive: true });
await copyFile("apps/edi/dist-single/index.html", `${OUT}/edi-offline.html`);
console.log(`✓ ${OUT}/ (App und Offline-Datei)`);
