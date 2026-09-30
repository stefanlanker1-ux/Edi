// Setzt die Website für GitHub Pages zusammen:
//   site/                 Startseite
//   site/<app>/           jede App aus apps/<app>/dist (+ <app>-offline.html als Einzeldatei)
import { cp, rm, mkdir, readdir, copyFile, access } from "node:fs/promises";

const OUT = "site";
await rm(OUT, { recursive: true, force: true });
await mkdir(OUT, { recursive: true });
await cp("apps/start/dist", OUT, { recursive: true });

for (const app of await readdir("apps")) {
  if (app === "start") continue;
  const dist = `apps/${app}/dist`;
  try { await access(dist); } catch { continue; }
  await cp(dist, `${OUT}/${app}`, { recursive: true });
  try { await copyFile(`apps/${app}/dist-single/index.html`, `${OUT}/${app}/${app}-offline.html`); } catch { /* keine Einzeldatei */ }
  console.log(`✓ ${OUT}/${app}/`);
}
console.log(`✓ ${OUT}/ (Startseite)`);
