// Prüft Übersicht und alle Module der Site: Überlaufen, Tippziele, Konsolenfehler – in drei Bildschirmgrößen.
// Aufruf: node scripts/check-ui.mjs [site-Ordner] [,modul1,modul2]  (leer = Übersicht)  – Playwright muss erreichbar sein (PLAYWRIGHT=/pfad/node_modules/playwright/index.mjs, Chromium in PLAYWRIGHT_BROWSERS_PATH).
// LOCALE=en-GB prüft die englische Oberfläche (Standard de-DE).
// LESBAR=1 prüft zusätzlich mit eingeschalteter Option „Lesbar“ (größere Abstände) – nichts darf dadurch überlaufen.
// Antippbare Bilder (svg.sp-tap): jedes Teil (data-part) muss per elementFromPoint erreichbar sein. Aufgabenkarte: kein Knopf ragt heraus, Bild ≥ 24 px hoch.
// LEARN="pm-k1,us:pm-k1,…" (Schlüssel der erledigten Lektionen) spielt zusätzlich „Lernen“ Kapitel für Kapitel (Lektionen als erledigt markiert): Elemente mit `data-auto` werden der Reihe nach
// angetippt, zuletzt die mit `data-auto="last"` (z. B. „Prüfen“), sonst die erste Auswahl; geprüft wird vor und nach der Antwort. Elemente mit `data-min-h="N"` müssen mindestens N px hoch sein.
const { chromium } = await import(process.env.PLAYWRIGHT ?? "playwright");
import http from "node:http";
import fs from "node:fs";
import path from "node:path";

const SITE = process.argv[2] ?? "site";
const APPS = (process.argv[3] ?? ",gemische,atombau,ionenbindung,elektronenpaarbindung,reaktionsgleichungen,neutralisation,organik,polymere,einheiten").split(",");
// weitere Größen: VP="768x1024,1024x768" node scripts/check-ui.mjs
const VIEWPORTS = process.env.VP ? process.env.VP.split(",").map(v => v.split("x").map(Number)) : [[390, 844], [375, 667], [1280, 800]];
const PORT = Number(process.env.PORT ?? 4173);
const MIME = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".json": "application/json", ".webmanifest": "application/manifest+json", ".woff2": "font/woff2", ".woff": "font/woff", ".png": "image/png" };

const server = http.createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, "http://x").pathname);
  let f = path.join(SITE, p);
  if (fs.existsSync(f) && fs.statSync(f).isDirectory()) f = path.join(f, "index.html");
  if (!fs.existsSync(f)) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { "content-type": MIME[path.extname(f)] ?? "application/octet-stream" });
  fs.createReadStream(f).pipe(res);
});
await new Promise(r => server.listen(PORT, r));

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
      if (e.closest(".sr-only")) continue; // nur für Tastatur und Vorlesen, unsichtbar
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
    // Aufgabenkarte: kein Antwortknopf ragt aus der Karte (der Rahmen schneidet ab, ohne Scrollbalken), das Bild der Aufgabe schrumpft nicht unter 24 px Höhe (wäre dann nicht mehr erkennbar)
    for (const card of document.querySelectorAll(".task-card")) {
      const cb = card.getBoundingClientRect();
      for (const b of card.querySelectorAll("button")) {
        if (b.closest(".sr-only")) continue;
        const r = b.getBoundingClientRect();
        if (!r.width || !r.height) continue;
        if (r.bottom > cb.bottom + 1 || r.top < cb.top - 1 || r.right > cb.right + 1 || r.left < cb.left - 1)
          over.push(`Knopf „${(b.getAttribute("aria-label") || b.textContent || "").trim().slice(0, 20)}“ ragt aus der Aufgabenkarte`);
      }
      const pic = card.querySelector(".q-visual .ui-fit-inner > *");
      if (pic) { const r = pic.getBoundingClientRect(); if (r.width > 0 && r.height < 24) over.push(`Bild der Aufgabe nur ${Math.round(r.width)}×${Math.round(r.height)} px`); }
    }
    // Mindesthöhe (freiwillig je Element): Bilder dürfen nicht unter eine lesbare Größe schrumpfen
    const tiny = [...document.querySelectorAll("[data-min-h]")].filter(e => e.getBoundingClientRect().height > 0 && e.getBoundingClientRect().height < Number(e.getAttribute("data-min-h")))
      .map(e => `${String(e.className).split(" ")[0]} ${Math.round(e.getBoundingClientRect().height)} < ${e.getAttribute("data-min-h")}`);
    // Antippbare Bilder (Klasse sp-tap): jedes Teil mit data-part muss an mindestens einer Stelle wirklich getroffen werden
    // (nichts Unsichtbares oder Verziertes darüber)
    const blocked = [];
    for (const svg of document.querySelectorAll("svg.sp-tap")) {
      // antippbar = Teile mit Trefferfläche (Gefäße, Hilfslinien usw. tragen data-part nur für Beschriftungen)
      const parts = new Set([...svg.querySelectorAll(".sp-hit")].map(e => e.getAttribute("data-part")));
      for (const part of parts) {
        let ok = false;
        for (const e of svg.querySelectorAll(`[data-part="${part}"]`)) {
          const b = e.getBoundingClientRect();
          for (let i = 0; i < 7 && !ok; i++) for (let j = 0; j < 7 && !ok; j++) {
            const hit = document.elementFromPoint(b.left + b.width * (i + .5) / 7, b.top + b.height * (j + .5) / 7);
            if (hit?.closest("[data-part]")?.getAttribute("data-part") === part && svg.contains(hit)) ok = true;
          }
          if (ok) break;
        }
        if (!ok) blocked.push(part);
      }
      // unsichtbare Trefferflächen: im Bild und höchstens 40 % der Bildfläche (sonst zählt Tippen ins Leere als Antwort)
      const sb = svg.getBoundingClientRect();
      for (const h of svg.querySelectorAll(".sp-hit")) {
        const b = h.getBoundingClientRect();
        if (b.left < sb.left - 1 || b.top < sb.top - 1 || b.right > sb.right + 1 || b.bottom > sb.bottom + 1) blocked.push(`${h.getAttribute("data-part")} (Trefferfläche ragt aus dem Bild)`);
        if (b.width * b.height > .4 * sb.width * sb.height) blocked.push(`${h.getAttribute("data-part")} (Trefferfläche ${Math.round(100 * b.width * b.height / (sb.width * sb.height))} % des Bilds)`);
      }
    }
    return { sw: d.scrollWidth, sh: d.scrollHeight, iw: innerWidth, ih: innerHeight, small, over, tiny, blocked };
  });
  if (r.sw > r.iw) note(app, vp, view, `horizontaler Überlauf ${r.sw} > ${r.iw}`);
  if (r.sh > r.ih) {
    note(app, vp, view, `vertikaler Überlauf ${r.sh} > ${r.ih}`);
    // freiwillig: Bildschirmfoto jedes Überlaufs (SHOTS=Ordner)
    if (process.env.SHOTS) await page.screenshot({ path: `${process.env.SHOTS}/${app}-${vp}-${view.replace(/[^\w-]+/g, "_")}.png`, fullPage: true }).catch(() => {});
  }
  for (const s of r.small) note(app, vp, view, `Tippziel < 44: ${s}`);
  for (const o of r.over) note(app, vp, view, `Element überläuft: ${o}`);
  for (const o of r.tiny) note(app, vp, view, `zu klein: ${o}`);
  for (const o of r.blocked) note(app, vp, view, `Teil im Bild nicht antippbar: ${o}`);
}

for (const app of APPS) {
  for (const [w, h] of VIEWPORTS) {
    const vp = `${w}×${h}`;
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, hasTouch: w < 900, isMobile: w < 900, locale: process.env.LOCALE ?? "de-DE" });
    if (process.env.LESBAR) await ctx.addInitScript(() => { try { localStorage.setItem("lern-lesbar", "on"); } catch { /* egal */ } });
    const page = await ctx.newPage();
    page.setDefaultTimeout(1500);
    try {
    page.on("console", m => { if (m.type() === "error") note(app, vp, "konsole", m.text().slice(0, 160)); });
    page.on("pageerror", e => note(app, vp, "konsole", "pageerror " + String(e).slice(0, 160)));
    const url = `http://localhost:${PORT}/${app ? "#/" + app : ""}`;
    await page.goto(url, { waitUntil: "networkidle" }).catch(() => {});
    await check(page, app, vp, "start");
    if (!app) { await ctx.close(); continue; }

    // alle sichtbaren Knöpfe der Kopfzeile / Register einmal drücken
    const tabs = await page.locator("[role=tab]:visible, nav button:visible, header button:visible").all();
    for (let i = 0; i < Math.min(tabs.length, 12); i++) {
      const t = tabs[i];
      let label = `#${i}`;
      try { label = (await t.getAttribute("aria-label")) || (await t.textContent()) || label; } catch { continue; }
      if (/Beamer|Farbschema|Startseite|Übersicht|Lesbar|Projector|[Cc]olou?r scheme|Home|Overview|Readable|English|Deutsch/.test(label)) continue; // Lesbar wird über LESBAR=1 geprüft, nicht mitten im Lauf umgeschaltet
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
      const start = page.locator("button:has-text('Start'), button:has-text('Los'), button:has-text('Let'), button:has-text('Runde'), button:has-text('üben'), button:has-text('Üben'), .level-card").first();
      if (await start.count()) {
        try { await start.click({ timeout: 2000 }); } catch { /* egal */ }
        for (let k = 0; k < 6; k++) {
          await check(page, app, vp, `quiz-aufgabe ${k + 1}`);
          // Hilfsmittel/Lösung-Blätter öffnen
          for (const nm of ["PSE", "Pfeile", "Skala", "Lösung", "Tafel", "Hilfe", "PT", "Arrows", "Scale", "Solution", "Board", "Help"]) {
            const b = page.locator(`button:has-text('${nm}')`).first();
            if (await b.count() && await b.isVisible()) {
              try { await b.click({ timeout: 800 }); await check(page, app, vp, `quiz-aufgabe ${k + 1}/blatt:${nm}`); } catch { /* egal */ }
              const close = page.locator("button[aria-label*=Schließen], button[aria-label*=Zurück], button[aria-label*=Close], button[aria-label*=Back]").first();
              if (await close.count()) { try { await close.click({ timeout: 800 }); } catch { /* egal */ } }
            }
          }
          // erste Antwortoption wählen, dann prüfen/weiter
          const opt = page.locator(".quiz-card button, main button").filter({ hasNotText: /Weiter|Prüfen|Abbrechen|Menü|PSE|Pfeile|Skala|Lösung|Tafel|Hilfe|Zurück|Next|Check|Cancel|Menu|PT|Arrows|Scale|Solution|Board|Help|Back/ }).first();
          if (await opt.count()) { try { await opt.click({ timeout: 800 }); } catch { /* egal */ } }
          const inp = page.locator("main input[type=text], main input[type=number], main input:not([type])").first();
          if (await inp.count() && await inp.isVisible()) { try { await inp.fill("1"); } catch { /* egal */ } }
          const pruef = page.locator("button:has-text('Prüfen'), button:has-text('Check')").first();
          if (await pruef.count() && await pruef.isVisible()) { try { await pruef.click({ timeout: 800 }); } catch { /* egal */ } }
          await check(page, app, vp, `quiz-rückmeldung ${k + 1}`);
          const weiter = page.locator("button:has-text('Weiter'), button:has-text('Nächste'), button:has-text('Next')").first();
          if (await weiter.count() && await weiter.isVisible()) { try { await weiter.click({ timeout: 800 }); } catch { break; } } else break;
        }
      }
    }
    // Lernen in Kapiteln (freiwillig über LEARN): jede Aufgabe vor und nach der Antwort
    if (process.env.LEARN) {
      const ids = process.env.LEARN.split(",");
      await page.evaluate(ids => { localStorage.setItem("lern-lektionen", JSON.stringify(Object.fromEntries(ids.map(i => [i, true])))); }, ids);
      await page.reload({ waitUntil: "networkidle" }).catch(() => {});
      const learn = page.locator("button:visible", { hasText: /^(Lernen|Learn)/ }).first();
      if (await learn.count()) await learn.click({ timeout: 1500 }).catch(() => {});
      const levels = await page.locator(".level-card").count();
      for (let lv = 0; lv < levels; lv++) {
        try { await learn.click({ timeout: 1500 }); await page.locator(".level-card").nth(lv).click({ timeout: 1500 }); } catch { break; }
        for (let k = 0; k < 14; k++) {
          await page.waitForTimeout(250);
          const ex = page.getByRole("button", { name: /Verstanden|Got it/ });
          if (await ex.count()) { await ex.first().click().catch(() => {}); continue; }
          await check(page, app, vp, `lernen ${lv + 1}/${k + 1}`);
          const auto = page.locator("[data-auto]:not([data-auto=last])"), last = page.locator("[data-auto=last]");
          const n = await auto.count();
          if (n || await last.count()) {
            for (let j = 0; j < n; j++) await auto.nth(j).evaluate(e => e.click()).catch(() => {});
            for (let j = 0; j < await last.count(); j++) await last.nth(j).evaluate(e => e.click()).catch(() => {});
          }
          else await page.locator(".mc-btn").first().click({ timeout: 800 }).catch(() => {});
          await page.waitForTimeout(400);
          await check(page, app, vp, `lernen ${lv + 1}/${k + 1} Antwort`);
          const nx = page.locator(".q-next");
          if (!(await nx.count())) break;
          await nx.first().click().catch(() => {});
        }
        const back = page.locator("button:has-text('Levelauswahl'), button:has-text('level selection'), button[aria-label*=Levelauswahl], button[aria-label*=level], button[aria-label*=Zurück], button[aria-label*=Back]").first();
        if (await back.count()) await back.click({ timeout: 800 }).catch(() => {});
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
