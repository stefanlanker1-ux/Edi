// Prüft Übersicht und alle Module der Site: Überlaufen, Tippziele, Konsolenfehler – in drei Bildschirmgrößen.
// Aufruf: node scripts/check-ui.mjs [site-Ordner] [,modul1,modul2]  (leer = Übersicht)  – Playwright muss erreichbar sein (PLAYWRIGHT=/pfad/node_modules/playwright/index.mjs, Chromium in PLAYWRIGHT_BROWSERS_PATH).
// LESBAR=1 prüft zusätzlich mit eingeschalteter Option „Lesbar“ (größere Abstände) – nichts darf dadurch überlaufen.
const { chromium } = await import(process.env.PLAYWRIGHT ?? "playwright");
import http from "node:http";
import fs from "node:fs";
import path from "node:path";

const SITE = process.argv[2] ?? "site";
const APPS = (process.argv[3] ?? ",gemische,atombau,ionenbindung,elektronenpaarbindung,reaktionsgleichungen,neutralisation,organik,einheiten").split(",");
// weitere Größen: VP="768x1024,1024x768" node scripts/check-ui.mjs
const VIEWPORTS = process.env.VP ? process.env.VP.split(",").map(v => v.split("x").map(Number)) : [[390, 844], [375, 667], [1280, 800]];
const MIME = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".json": "application/json", ".webmanifest": "application/manifest+json", ".woff2": "font/woff2", ".woff": "font/woff", ".png": "image/png" };

const server = http.createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, "http://x").pathname);
  let f = path.join(SITE, p);
  if (fs.existsSync(f) && fs.statSync(f).isDirectory()) f = path.join(f, "index.html");
  if (!fs.existsSync(f)) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { "content-type": MIME[path.extname(f)] ?? "application/octet-stream" });
  fs.createReadStream(f).pipe(res);
});
await new Promise(r => server.listen(4173, r));

const browser = await chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {});
const findings = [];
const note = (app, vp, view, msg) => { findings.push(`${app || "start"} ${vp} [${view}] ${msg}`); };

async function check(page, app, vp, view) {
  await page.waitForTimeout(150);
  const r = await page.evaluate(() => {
    const d = document.documentElement;
    const small = [];
    const els = document.querySelectorAll("button, a[href], input, select, [role=button], [role=tab], summary");
    for (const e of els) {
      const cs = getComputedStyle(e);
      if (cs.display === "none" || cs.visibility === "hidden") continue;
      const b = e.getBoundingClientRect();
      if (b.width === 0 || b.height === 0) continue;
      if (b.bottom < 0 || b.top > innerHeight) continue;
      if (b.width < 43.5 || b.height < 43.5) {
        if (e.classList.contains("pse-cell") || (b.width <= 1 && b.height <= 1)) continue; // PSE ganz sichtbar = bewusste Ausnahme; versteckte Inputs
        // Tippfläche kann durch Padding/Pseudo größer sein: prüfe min-* im Stil
        const mw = parseFloat(cs.minWidth) || 0, mh = parseFloat(cs.minHeight) || 0;
        // SVG-Linie als Tippziel (Bindung): die dicke Strichbreite gehört zur Fläche
        const sw = e.tagName === "line" ? (parseFloat(cs.strokeWidth) || 0) * (e.getScreenCTM()?.a ?? 1) : 0;
        if (Math.max(b.width + sw, mw) < 43.5 || Math.max(b.height + sw, mh) < 43.5)
          small.push(`${e.tagName.toLowerCase()}${e.className ? "." + String(e.className).split(" ")[0] : ""}“${(e.getAttribute("aria-label") || e.textContent || "").trim().slice(0, 20)}” ${Math.round(b.width)}×${Math.round(b.height)}`);
      }
    }
    // überlaufende Elemente innerhalb der Seite (Werkbank/Karte)
    const over = [];
    for (const e of document.querySelectorAll(".ui-screen, .wb, .quiz-card, main, [class*=stage], [class*=card]")) {
      if (e.scrollHeight > e.clientHeight + 2 && getComputedStyle(e).overflowY !== "auto" && getComputedStyle(e).overflowY !== "scroll")
        over.push(`${e.tagName.toLowerCase()}.${String(e.className).split(" ")[0]} ${e.scrollHeight}>${e.clientHeight}`);
    }
    return { sw: d.scrollWidth, sh: d.scrollHeight, iw: innerWidth, ih: innerHeight, small, over };
  });
  if (r.sw > r.iw) note(app, vp, view, `horizontaler Überlauf ${r.sw} > ${r.iw}`);
  if (r.sh > r.ih) note(app, vp, view, `vertikaler Überlauf ${r.sh} > ${r.ih}`);
  for (const s of r.small) note(app, vp, view, `Tippziel < 44: ${s}`);
  for (const o of r.over) note(app, vp, view, `Element überläuft: ${o}`);
}

for (const app of APPS) {
  for (const [w, h] of VIEWPORTS) {
    const vp = `${w}×${h}`;
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, hasTouch: w < 900, isMobile: w < 900 });
    if (process.env.LESBAR) await ctx.addInitScript(() => { try { localStorage.setItem("lern-lesbar", "on"); } catch { /* egal */ } });
    const page = await ctx.newPage();
    page.setDefaultTimeout(1500);
    try {
    page.on("console", m => { if (m.type() === "error") note(app, vp, "konsole", m.text().slice(0, 160)); });
    page.on("pageerror", e => note(app, vp, "konsole", "pageerror " + String(e).slice(0, 160)));
    const url = `http://localhost:4173/${app ? "#/" + app : ""}`;
    await page.goto(url, { waitUntil: "networkidle" }).catch(() => {});
    await check(page, app, vp, "start");
    if (!app) { await ctx.close(); continue; }

    // alle sichtbaren Knöpfe der Kopfzeile / Register einmal drücken
    const tabs = await page.locator("[role=tab]:visible, nav button:visible, header button:visible").all();
    for (let i = 0; i < Math.min(tabs.length, 12); i++) {
      const t = tabs[i];
      let label = `#${i}`;
      try { label = (await t.getAttribute("aria-label")) || (await t.textContent()) || label; } catch { continue; }
      if (/Beamer|Farbschema|Startseite|Übersicht|Lesbar/.test(label)) continue; // Lesbar wird über LESBAR=1 geprüft, nicht mitten im Lauf umgeschaltet
      try { await t.click({ timeout: 1500 }); } catch { continue; }
      await check(page, app, vp, `tab:${label.trim().slice(0, 20)}`);
      // Werkzeuge im Blatt / Register durchgehen
      const tools = await page.locator(".wb-tools button, [class*=tools] button, .ui-toolbar button").all();
      for (let j = 0; j < Math.min(tools.length, 10); j++) {
        const tl = tools[j];
        let tn = `#${j}`;
        try { tn = (await tl.getAttribute("aria-label")) || (await tl.textContent()) || tn; } catch { continue; }
        try { await tl.click({ timeout: 1000 }); } catch { continue; }
        await check(page, app, vp, `tab:${label.trim().slice(0, 12)}/tool:${tn.trim().slice(0, 16)}`);
        // Blatt schließen
        const close = page.locator("button[aria-label*=Schließen], button[aria-label*=Zurück], .ui-sheet button").first();
        if (await close.count()) { try { await close.click({ timeout: 800 }); } catch { /* egal */ } }
      }
    }

    // Quiz: Runde starten und einige Aufgaben beantworten
    const quizTab = page.locator("button:has-text('Quiz'):visible").first();
    if (await quizTab.count()) {
      try { await quizTab.click({ timeout: 2000 }); } catch { /* egal */ }
      await check(page, app, vp, "quiz-menü");
      const start = page.locator("button:has-text('Start'), button:has-text('Los'), button:has-text('Runde'), button:has-text('üben'), button:has-text('Üben'), .level-card").first();
      if (await start.count()) {
        try { await start.click({ timeout: 2000 }); } catch { /* egal */ }
        for (let k = 0; k < 6; k++) {
          await check(page, app, vp, `quiz-aufgabe ${k + 1}`);
          // Hilfsmittel/Lösung-Blätter öffnen
          for (const nm of ["PSE", "Pfeile", "Skala", "Lösung", "Tafel", "Hilfe"]) {
            const b = page.locator(`button:has-text('${nm}')`).first();
            if (await b.count() && await b.isVisible()) {
              try { await b.click({ timeout: 800 }); await check(page, app, vp, `quiz-aufgabe ${k + 1}/blatt:${nm}`); } catch { /* egal */ }
              const close = page.locator("button[aria-label*=Schließen], button[aria-label*=Zurück]").first();
              if (await close.count()) { try { await close.click({ timeout: 800 }); } catch { /* egal */ } }
            }
          }
          // erste Antwortoption wählen, dann prüfen/weiter
          const opt = page.locator(".quiz-card button, main button").filter({ hasNotText: /Weiter|Prüfen|Abbrechen|Menü|PSE|Pfeile|Skala|Lösung|Tafel|Hilfe|Zurück/ }).first();
          if (await opt.count()) { try { await opt.click({ timeout: 800 }); } catch { /* egal */ } }
          const inp = page.locator("main input[type=text], main input[type=number], main input:not([type])").first();
          if (await inp.count() && await inp.isVisible()) { try { await inp.fill("1"); } catch { /* egal */ } }
          const pruef = page.locator("button:has-text('Prüfen')").first();
          if (await pruef.count() && await pruef.isVisible()) { try { await pruef.click({ timeout: 800 }); } catch { /* egal */ } }
          await check(page, app, vp, `quiz-rückmeldung ${k + 1}`);
          const weiter = page.locator("button:has-text('Weiter'), button:has-text('Nächste')").first();
          if (await weiter.count() && await weiter.isVisible()) { try { await weiter.click({ timeout: 800 }); } catch { break; } } else break;
        }
      }
    }
    } catch (e) { note(app, vp, "skript", "Abbruch: " + String(e).split("\n")[0].slice(0, 120)); }
    await ctx.close();
  }
}
await browser.close();
server.close();
const uniq = [...new Set(findings)];
process.exitCode = uniq.length ? 1 : 0;
console.log(uniq.length ? uniq.join("\n") : "Keine Befunde");
