// Prüft Übersicht und alle Module der Site: Überlaufen, Tippziele, Konsolenfehler – in drei Bildschirmgrößen.
// Aufruf: node scripts/check-ui.mjs [site-Ordner] [,modul1,modul2]  (leer = Übersicht)  – Playwright muss erreichbar sein (PLAYWRIGHT=/pfad/node_modules/playwright/index.mjs, Chromium in PLAYWRIGHT_BROWSERS_PATH).
// LOCALE=en-GB prüft die englische Oberfläche (Standard de-DE).
// LESBAR=1 prüft zusätzlich mit eingeschalteter Option „Lesbar“ (größere Abstände) – nichts darf dadurch überlaufen.
// Antippbare Bilder (svg.sp-tap): jedes Teil (data-part) muss per elementFromPoint erreichbar sein. Aufgabenkarte: kein Knopf ragt heraus, Bild ≥ 24 px hoch,
// kein abgeschnittener Bildrest. Vor jeder Antwort wird „Tipp“ gedrückt: der Tipp (bzw. der erste Schritt) ist ganz zu lesen und das Bild daneben ≥ 56 px hoch.
// Tippziele: keine zwei sichtbaren überdecken sich; Knopf-Beschriftungen ganz (ragen nicht heraus, nicht abgeschnitten – gewollte Auslassungspunkte ausgenommen).
// LEARN="pm-k1,us:pm-k1,…" (Schlüssel der erledigten Lektionen) spielt zusätzlich „Üben“ Kapitel für Kapitel (Lektionen als erledigt markiert): Elemente mit `data-auto` werden der Reihe nach
// angetippt, zuletzt die mit `data-auto="last"` (z. B. „Prüfen“), sonst der Reihe nach Antworten bzw. Teile im Bild, bis „Weiter“ erscheint (`answer`); geprüft wird vor und nach
// der Antwort, jede der zehn Aufgaben je Kapitel (sonst Befund). Elemente mit `data-min-h="N"` müssen mindestens N px hoch sein. Antwortknöpfe: kein Wort über zwei Zeilen.
// KAPITEL=1 spielt „Lernen“ in Kapiteln (Ionenbindung, beide Stufen): jede Folie vor und nach dem Lösen (`guideSolve`: Modell „Prüfen“ bis zur markierten Lösung,
// Auswahl/Zahl/Bild bis zur Lösung), dazu einmal je Kapitel die Hilfsmittel PSE, Tipp, Erklärung; eine Folie ohne „Weiter“ ist ein Befund.
// ERKLAERUNG=1 spielt zusätzlich die Erklärung jedes Moduls (beide Stufen) bzw. die Lektionen der Kapitel unter „Üben“ (Gemische, Polymere) ganz durch, wie KAPITEL.
//
// Wanderungs-Prüfung (immer an, WANDER=0 schaltet sie ab): Bild- und Modellrahmen bleiben stehen, wenn sich daneben Text, Zahlen oder Rückmeldungen ändern.
// Bei jeder Bedienung, die das Skript ausführt – Knöpfe der Werkbank (eigene Phase nach Quiz, je Bereich und Stufe: Kopf, Bühne, Status, Steuerleiste,
// Werkzeuge, Knöpfe in Werkzeug-Blatt bzw. -Register, je Bereich höchstens 6 bzw. 8; danach Speicher wie vorher),
// „Tipp“ und Antworten in Quiz und LEARN, jeder Klick beim Lösen einer Folie (KAPITEL, ERKLAERUNG) – werden vorher und nachher die Kästen der Container verglichen
// (`W_SEL`: Zeichnungen `svg`/`canvas`/`img` ab 40 px, Werkbank-Bühne und -Bildbereich mit direktem Inhalt, Kopf, Status, Steuerleiste und ihre Kinder, Werkzeugleiste,
// Aufgabenkarte, Aufgabenbild, Bild der Erklärung mit direktem Inhalt, Knöpfe in Werkbank-Kopf und -Steuerleiste und in der Leiste unter der Aufgabe).
// Befund „Wanderung“ (mit Modul, Größe, Ansicht, Element, Verschiebung):
//  - ein Container rückt um mehr als 2 px, ohne selbst die Größe zu ändern (z. B. Atom rückt, weil die Beschriftung daneben breiter wird) – gemeldet wird nur der
//    äußerste wandernde Container, nicht jedes Kind mit;
//  - in Werkbank und innerhalb einer Folie zusätzlich: Bühne, Bildbereich, Steuerleiste oder Bild der Erklärung ändern die Größe („springt“; nach einer Antwort im
//    Quiz darf das Aufgabenbild dagegen kleiner werden, siehe `Fit`).
// Keine Wanderung: neue Folie (Zähler der Erklärung ändert sich), neue Aufgabe (Fragetext ändert sich), ein Container, der neu erscheint, verschwindet, ausgetauscht
// wird oder ein neues `viewBox` hat (neuer Inhalt), alles in einem eben geöffneten Blatt, laufende CSS-Animationen (Lage, Größe) am Container oder darüber.
// Gewollte Bewegung freistellen: `data-anim` oder `data-moves` am Container oder einem Vorfahren (z. B. Teilchen, die zur Animation gehören) – sparsam einsetzen.
// Neue Ansicht in der Werkbank: `data-screen="<Kennung>"` an einem Element in der Werkbank (z. B. Nummer des Beispiels, Kennung der Aufgabe, gewählte Art);
// ändert sich ein Wert (oder erscheint/verschwindet so ein Element), ist das ein gewollter Wechsel wie eine neue Folie – keine Wanderung.
// Zusätzlich sammelt ein `PerformanceObserver("layout-shift")` die Quellen von Layout-Verschiebungen: rückt ein Container dabei und steht am Ende wieder am alten Platz,
// meldet das Skript „Wanderung: … rückt zwischendurch um …“ (kurzes Springen, z. B. während eine Rückmeldung erscheint).
// Platz reservieren statt rücken: `Reserve` (`@lern/ui`, alle Beschriftungen in einer Zelle), `statusReserve` an `Workbench`, `visibility: hidden` statt Weglassen.
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

// ── Wanderungs-Prüfung (siehe Kopf) ───────────────────────────────────────
const WANDER = process.env.WANDER !== "0";
const W_SEL = [
  "svg", "canvas", "img", ".ui-wb-stage", ".ui-wb-head", ".ui-wb-view", ".ui-wb-view > *", ".ui-wb-status", ".ui-wb-controls", ".ui-wb-controls > *",
  ".ui-wb-tools", ".task-card", ".q-visual", ".ui-guide-visual", ".ui-guide-visual > *",
  // Knöpfe der Steuerleisten: rücken nicht, wenn daneben ein Knopf erscheint, verschwindet oder seine Beschriftung ändert
  ".ui-wb-controls button", ".ui-wb-head button", ".q-actions button",
].join(", ");
/** Rahmen, deren Größe sich in Werkbank und innerhalb einer Folie nicht ändern darf */
const W_FRAME = ".ui-wb-stage, .ui-wb-view, .ui-wb-controls, .ui-wb-tools, .ui-guide-visual";
/** im Browser: Kästen merken (`snap`) und vergleichen (`diff`); Layout-Verschiebungen sammeln */
function wanderInit([SEL, FRAME]) {
  const shifts = [];
  try { new PerformanceObserver(l => { for (const e of l.getEntries()) shifts.push(e); }).observe({ type: "layout-shift" }); } catch { /* ältere Browser */ }
  let before = new Map(), dialogs = new Set();
  const box = e => {
    if (!e.isConnected || e.closest(".sr-only, [inert], [aria-hidden=true]")) return null;
    for (let a = e; a && a.nodeType === 1; a = a.parentElement) { const cs = getComputedStyle(a); if (cs.display === "none" || cs.visibility === "hidden" || Number(cs.opacity) === 0) return null; }
    const d = e.closest("dialog"); if (d && !d.open) return null;
    const b = e.getBoundingClientRect();
    return b.width >= 2 && b.height >= 2 ? { x: b.left, y: b.top, w: b.width, h: b.height } : null;
  };
  const tracked = () => [...document.querySelectorAll(SEL)].filter(e => {
    if (e.matches("svg, canvas, img")) {
      if (e.parentElement?.closest("svg") || e.closest("button, [role=button], a, .ui-icon")) return false; // Zeichen in Knöpfen, Teile einer Zeichnung
      const b = e.getBoundingClientRect(); if (b.width < 40 && b.height < 40) return false;
    }
    return true;
  });
  // Zusammenhang: neue Folie bzw. neue Aufgabe = gewollter Wechsel
  const ctx = e => {
    const g = e.closest("dialog.ui-guide"); if (g) return "g" + (g.querySelector(".ui-guide-count")?.textContent ?? "") + (g.querySelector(".ui-guide-part, .ui-guide-head h2")?.textContent ?? "");
    const t = e.closest(".task-card"); if (t) return "t" + (t.querySelector(".q-prompt")?.textContent ?? "") + (t.classList.contains("worked") ? "w" : "");
    // Werkbank: neue Ansicht (anderes Beispiel, andere Aufgabe, andere Art) – Wert von `data-screen`
    const w = e.closest(".ui-wb"); if (w) return "w" + [...w.querySelectorAll("[data-screen]")].map(x => x.getAttribute("data-screen")).join("|");
    return "";
  };
  const free = e => !!e.closest("[data-anim], [data-moves]");
  // laufende Animation, die Lage oder Größe ändert, am Element oder einem Vorfahren
  const MOVE = /^(transform|translate|scale|rotate|top|left|right|bottom|inset|margin|width|height|offset|grid|flex|padding|max-|min-)/;
  const animated = () => {
    const out = new Set();
    for (const a of document.getAnimations()) {
      if (a.playState !== "running" || !a.effect?.target) continue;
      const props = a instanceof CSSTransition ? [a.transitionProperty] : (a.effect.getKeyframes?.() ?? []).flatMap(k => Object.keys(k));
      if (props.some(p => MOVE.test(p.replace(/[A-Z]/g, c => "-" + c.toLowerCase())))) out.add(a.effect.target);
    }
    return out;
  };
  const inAnim = (e, set) => { for (let a = e; a; a = a.parentElement) if (set.has(a)) return true; return false; };
  const name = e => {
    const one = n => `${n.tagName.toLowerCase()}${typeof n.className === "string" && n.className.trim() ? "." + n.className.trim().split(/\s+/).slice(0, 2).join(".") : n.className?.baseVal ? "." + n.className.baseVal.trim().split(/\s+/)[0] : ""}`;
    const up = [];
    for (let a = e.parentElement; a && up.length < 2 && a !== document.body; a = a.parentElement) if (typeof a.className === "string" && a.className.trim()) up.unshift(one(a));
    const lbl = (e.getAttribute("aria-label") || "").slice(0, 24);
    return `${up.join(" > ")}${up.length ? " > " : ""}${one(e)}${lbl ? `„${lbl}“` : ""}`;
  };
  window.__ediWander = {
    snap() {
      before = new Map(tracked().map(e => [e, { b: box(e), c: ctx(e), vb: e.getAttribute("viewBox") }]));
      dialogs = new Set(document.querySelectorAll("dialog[open]"));
      shifts.length = 0;
    },
    diff(opt) {
      const anim = animated(), out = [];
      const fresh = e => { const d = e.closest("dialog[open]"); return d && !dialogs.has(d); };
      for (const [e, o] of before) {
        const b = box(e);
        if (!o.b || !b || free(e) || fresh(e) || ctx(e) !== o.c || e.getAttribute("viewBox") !== o.vb || inAnim(e, anim)) continue;
        const dx = b.x - o.b.x, dy = b.y - o.b.y, dw = b.w - o.b.w, dh = b.h - o.b.h;
        const sameSize = Math.abs(dw) <= 2 && Math.abs(dh) <= 2;
        if (sameSize && (Math.abs(dx) > 2 || Math.abs(dy) > 2)) out.push({ e, dx, dy, msg: `${name(e)} rückt um ${Math.round(dx)}/${Math.round(dy)} px (x/y)` });
        else if (!sameSize && opt.resize && e.matches(FRAME)) out.push({ e, dx, dy, msg: `${name(e)} springt von ${Math.round(o.b.w)}×${Math.round(o.b.h)} auf ${Math.round(b.w)}×${Math.round(b.h)} px` });
      }
      // nur der äußerste Container (Kinder rücken mit bzw. rücken, weil ihr Rahmen springt)
      const res = out.filter(f => !out.some(g => g !== f && g.e.contains(f.e))).map(f => f.msg);
      // zwischendurch: Layout-Verschiebung eines Containers, der am Ende wieder am alten Platz steht
      const seen = new Set(out.map(f => f.e));
      for (const s of shifts) for (const src of s.sources ?? []) {
        const e = src.node;
        if (!e || e.nodeType !== 1 || seen.has(e) || !before.has(e)) continue;
        const o = before.get(e), b = box(e);
        if (!o.b || !b || free(e) || fresh(e) || ctx(e) !== o.c || inAnim(e, anim)) continue;
        const p = src.previousRect, c = src.currentRect;
        if (Math.abs(p.width - c.width) > 2 || Math.abs(p.height - c.height) > 2 || (Math.abs(p.x - c.x) <= 2 && Math.abs(p.y - c.y) <= 2)) continue;
        if (Math.abs(b.x - o.b.x) > 2 || Math.abs(b.y - o.b.y) > 2) continue; // schon oben erfasst bzw. Größe geändert
        seen.add(e);
        res.push(`${name(e)} rückt zwischendurch um ${Math.round(c.x - p.x)}/${Math.round(c.y - p.y)} px (x/y)`);
      }
      shifts.length = 0;
      return res;
    },
  };
}
/** Bedienung `fn` ausführen und prüfen, ob dabei ein Container wandert (opt.resize: auch Größensprünge der Rahmen melden) */
async function wander(page, app, vp, view, fn, opt = {}) {
  if (!WANDER) return fn();
  await page.evaluate(() => window.__ediWander?.snap()).catch(() => {});
  const r = await fn();
  await page.waitForTimeout(opt.wait ?? 400);
  const res = await page.evaluate(o => window.__ediWander?.diff(o) ?? [], { resize: !!opt.resize }).catch(() => []);
  for (const m of res) note(app, vp, view, `Wanderung${opt.what ? ` (${opt.what})` : ""}: ${m}`);
  return r;
}

async function check(page, app, vp, view) {
  await page.waitForTimeout(150);
  const r = await page.evaluate(() => {
    const d = document.documentElement;
    const small = [];
    const els = document.querySelectorAll("button, a[href], input, select, [role=button], [role=tab], summary");
    for (const e of els) {
      const cs = getComputedStyle(e);
      if (cs.display === "none" || cs.visibility === "hidden") continue;
      // sichtbares Auswahlkästchen in einem <label>: Tippfläche ist das Label (versteckte Inputs bleiben wie bisher ausgenommen, siehe unten)
      const own = e.getBoundingClientRect();
      const b = own.width > 1 && own.height > 1 && e.matches("input[type=checkbox], input[type=radio]") && e.closest("label") ? e.closest("label").getBoundingClientRect() : own;
      if (b.width === 0 || b.height === 0) continue;
      if (b.bottom < 0 || b.top > innerHeight) continue;
      if (e.closest(".sr-only")) continue; // nur für Tastatur und Vorlesen, unsichtbar
      if (e.classList.contains("ui-term")) continue; // Begriff im Fließtext: Text-Link (Ausnahme für Links im Satz)
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
    // sichtbare Größe des Aufgabenbilds: das größte Bildelement (Zeichnung, Canvas, Bild oder direkter Inhalt) im Rahmen, soweit es der Rahmen zeigt
    const picSize = card => {
      const fit = card.querySelector(".q-visual > .ui-fit"), fb = fit?.getBoundingClientRect();
      if (!fit || !fb.height || getComputedStyle(fit.parentElement).display === "none" || getComputedStyle(fit.parentElement).visibility === "hidden") return null;
      let w = 0, h = 0;
      for (const e of [...fit.querySelectorAll(".ui-fit-inner > *, svg, canvas, img")]) {
        const r = e.getBoundingClientRect();
        w = Math.max(w, Math.min(r.right, fb.right) - Math.max(r.left, fb.left)); h = Math.max(h, Math.min(r.bottom, fb.bottom) - Math.max(r.top, fb.top));
      }
      return { w, h };
    };
    for (const card of document.querySelectorAll(".task-card")) {
      const cb = card.getBoundingClientRect();
      for (const b of card.querySelectorAll("button")) {
        if (b.closest(".sr-only, dialog")) continue; // Blätter liegen über der Seite, nicht in der Karte
        const r = b.getBoundingClientRect();
        if (!r.width || !r.height) continue;
        if (r.bottom > cb.bottom + 1 || r.top < cb.top - 1 || r.right > cb.right + 1 || r.left < cb.left - 1)
          over.push(`Knopf „${(b.getAttribute("aria-label") || b.textContent || "").trim().slice(0, 20)}“ ragt aus der Aufgabenkarte`);
      }
      const pic = picSize(card);
      if (pic && pic.w > 0 && pic.h < 24) over.push(`Bild der Aufgabe nur ${Math.round(pic.w)}×${Math.round(pic.h)} px`);
      // Bild passt selbst verkleinert nicht (Fit meldet data-cut) und ist trotzdem zu sehen: nur ein abgeschnittener Rest
      const cutPic = card.querySelector(".q-visual > .ui-fit[data-cut]");
      if (cutPic && cutPic.getBoundingClientRect().height > 0 && getComputedStyle(cutPic).visibility !== "hidden") over.push(`Bild der Aufgabe abgeschnitten (passt auch verkleinert nicht, ${Math.round(cutPic.getBoundingClientRect().height)} px Platz)`);
    }
    // Mindesthöhe (freiwillig je Element): Bilder dürfen nicht unter eine lesbare Größe schrumpfen
    const tiny = [...document.querySelectorAll("[data-min-h]")].filter(e => e.getBoundingClientRect().height > 0 && e.getBoundingClientRect().height < Number(e.getAttribute("data-min-h")) - 0.5) // Subpixel-Toleranz wie bei Tipp/erstem Schritt
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
    // Tippziele: keine zwei sichtbaren überdecken sich, keine Beschriftung ist abgeschnitten oder ragt aus ihrem Knopf.
    // Ist ein Blatt (modaler Dialog) offen, zählt nur dessen Inhalt – der Rest der Seite liegt dahinter und ist nicht bedienbar.
    const modal = [...document.querySelectorAll("dialog[open]")].pop();
    const visible = e => {
      if (e.closest(".sr-only, [inert], [aria-hidden=true]") || (modal ? !modal.contains(e) : e.closest("dialog:not([open])"))) return false;
      const cs = getComputedStyle(e), b = e.getBoundingClientRect();
      return cs.display !== "none" && cs.visibility !== "hidden" && Number(cs.opacity) > 0 && b.width > 1 && b.height > 1 && b.bottom > 0 && b.top < innerHeight;
    };
    const label = e => `${e.tagName.toLowerCase()}${e.className && typeof e.className === "string" ? "." + e.className.split(" ")[0] : ""}„${(e.getAttribute("aria-label") || e.textContent || "").trim().slice(0, 20)}“`;
    // nur Knöpfe der Oberfläche: Trefferflächen in Zeichnungen (SVG: Atom und Bindung im Editor) dürfen sich berühren, dort entscheidet die Zeichnung
    // Begriffe im Fließtext (ui-term) sind Text-Links: Zeilen dürfen sich berühren
    const targets = [...document.querySelectorAll("button, a[href], input:not([type=hidden]), select, [role=button], [role=tab]")].filter(e => !e.closest("svg") && !e.classList.contains("ui-term") && visible(e));
    const overlap = [];
    for (let i = 0; i < targets.length; i++) for (let j = i + 1; j < targets.length; j++) {
      const a = targets[i], b = targets[j];
      if (a.contains(b) || b.contains(a)) continue;
      const r = a.getBoundingClientRect(), s = b.getBoundingClientRect();
      const w = Math.min(r.right, s.right) - Math.max(r.left, s.left), h = Math.min(r.bottom, s.bottom) - Math.max(r.top, s.top);
      if (w > 2 && h > 2) overlap.push(`${label(a)} / ${label(b)} ${Math.round(w)}×${Math.round(h)}`);
    }
    const cut = [];
    // gewollt gekürzt (text-overflow: ellipsis, z. B. Beschreibung einer Levelkarte): kein Befund
    const ellipsis = (e, stop) => { for (; e && e !== stop.parentElement; e = e.parentElement) if (getComputedStyle(e).textOverflow === "ellipsis") return true; return false; };
    for (const btn of targets.filter(e => e.matches("button, [role=button]"))) {
      const br = btn.getBoundingClientRect();
      let bad = false;
      // Text ragt aus dem Knopf (z. B. zu schmal zusammengeschoben)
      const walk = document.createTreeWalker(btn, NodeFilter.SHOW_TEXT);
      for (let n = walk.nextNode(); n && !bad; n = walk.nextNode()) {
        if (!n.textContent.trim() || n.parentElement.closest("svg, .sr-only") || ellipsis(n.parentElement, btn)) continue;
        const rg = document.createRange(); rg.selectNodeContents(n);
        for (const t of rg.getClientRects()) if (t.width > 0 && (t.left < br.left - 1 || t.right > br.right + 1)) bad = true;
      }
      // oder wird von einem Rahmen mit overflow abgeschnitten (Auslassungspunkte, verdeckt)
      if (!bad) for (const el of [btn, ...btn.querySelectorAll("*")]) {
        if (el.closest("svg, .sr-only") || !el.textContent.trim() || ellipsis(el, btn)) continue;
        const cs = getComputedStyle(el);
        if (cs.overflowX !== "visible" && cs.display !== "inline" && el.scrollWidth > el.clientWidth + 1) { bad = true; break; }
        // auf Zeilen begrenzt (line-clamp) und trotzdem länger
        if (cs.overflowY !== "visible" && cs.display !== "inline" && el.scrollHeight > el.clientHeight + 2) { bad = true; break; }
      }
      if (bad) cut.push(label(btn));
    }
    // Antwortknöpfe: kein Wort läuft über zwei Zeilen (Umbruch mitten im Wort; an Leerzeichen, Bindestrich, „/“, weichem Trennstrich und
    // Nullbreite-Leerzeichen darf umbrochen werden)
    for (const btn of [...document.querySelectorAll(".mc-btn")].filter(visible)) {
      const walk = document.createTreeWalker(btn, NodeFilter.SHOW_TEXT), rg = document.createRange();
      // Zeile eines Zeichens: das letzte Rechteck seines Bereichs (nach einem Umbruch am weichen Trennstrich zählt Chromium den Strich zum nächsten Zeichen)
      const line = (n, i, len) => { rg.setStart(n, i); rg.setEnd(n, i + len); const rs = [...rg.getClientRects()].filter(x => x.width > 0); return rs.length ? Math.round(rs[rs.length - 1].top) : null; };
      for (let n = walk.nextNode(); n; n = walk.nextNode()) {
        if (n.parentElement.closest("svg, .sr-only, .mc-key")) continue;
        for (const m of n.textContent.matchAll(/[^\s\-‐–—/\u00AD\u200B]+/g)) {
          const first = [...m[0]][0], last = [...m[0]].pop();
          if (line(n, m.index, first.length) !== line(n, m.index + m[0].length - last.length, last.length)) cut.push(`Wort „${m[0]}“ umbrochen in ${label(btn)}`);
        }
      }
    }
    return { sw: d.scrollWidth, sh: d.scrollHeight, iw: innerWidth, ih: innerHeight, small, over, tiny, blocked, overlap, cut };
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
  for (const o of r.overlap) note(app, vp, view, `Tippziele überdecken sich: ${o}`);
  for (const o of r.cut) note(app, vp, view, `Beschriftung abgeschnitten: ${o}`);
}

/** offene Blätter und die Erklärung schließen (Schließen-Knopf, sonst Escape) – sonst blockiert ein modaler Dialog alle weiteren Klicks */
async function closeDialogs(page) {
  for (let k = 0; k < 4 && await page.locator("dialog[open]").count(); k++) {
    const x = page.locator("dialog[open]").last().locator("button[aria-label*=chließen], button[aria-label*=Close], button[aria-label*=close]").first();
    if (await x.count()) await x.click({ timeout: 800 }).catch(() => page.keyboard.press("Escape"));
    else await page.keyboard.press("Escape");
    await page.waitForTimeout(150);
  }
}

/** Mindesthöhe eines Aufgabenbilds neben Tipp bzw. erstem Schritt (wie MIN_PIC in packages/quiz/src/QuizScreen.tsx) */
const MIN_PIC = 56;
/**
 * Tipp und erster Schritt (Quiz und LEARN): „Tipp“ drücken (falls da) und prüfen, dass er ganz zu lesen ist – in der Karte ganz innerhalb
 * von `.q-body`, ohne das Bild unter MIN_PIC px zu stauchen, oder im Blatt. Steht der erste Schritt im Blatt („Schritt 1“), wird es geöffnet.
 */
async function hintCheck(page, app, vp, view) {
  const tip = page.locator(".task-card .q-help button:not(:disabled):not([aria-disabled=true])", { hasText: /^\s*(Tipp|Tip|Schritt 1|Step 1)\s*$/ }).first();
  if (!(await page.locator(".task-card .q-first").count()) && !(await tip.count())) return;
  // Höhe des Bildrahmens vor „Tipp“ – danach darf er nicht unter max(56 px, 60 %) schrumpfen (auch Bilder, die sich selbst einpassen)
  const visBefore = await page.evaluate(() => document.querySelector(".task-card:not(.answered) .q-body > .q-visual")?.getBoundingClientRect().height ?? 0);
  if (await tip.count()) await wander(page, app, vp, view, () => tip.click({ timeout: 800 }).catch(() => {}), { what: "Tipp", wait: 250 });
  const r = await page.evaluate(([MIN, visBefore]) => {
    const out = [];
    const card = document.querySelector(".task-card:not(.answered)");
    if (!card) return out;
    const inside = (e, box) => { const r = e.getBoundingClientRect(), b = box.getBoundingClientRect(); return r.top >= b.top - 1 && r.bottom <= b.bottom + 1 && r.height > 0; };
    const hint = card.querySelector(".q-body > .q-hint"), first = card.querySelector(".q-first"), body = card.querySelector(".q-body");
    if (hint && !inside(hint, body)) out.push(`Tipp abgeschnitten (${Math.round(hint.getBoundingClientRect().bottom - body.getBoundingClientRect().bottom)} px unter dem Rand der Aufgabe)`);
    if (first && !inside(first, card)) out.push("Erster Schritt abgeschnitten");
    if (body && body.scrollHeight > body.clientHeight + 1 && (hint || first)) out.push(`Aufgabe läuft mit ${hint ? "Tipp" : "erstem Schritt"} über (${body.scrollHeight} > ${body.clientHeight})`);
    if (hint || first) for (const e of card.querySelectorAll("[data-min-h]")) {
      const h = e.getBoundingClientRect().height;
      if (h > 0 && h < Number(e.getAttribute("data-min-h")) - 0.5) out.push(`${String(e.className).split(" ")[0]} mit ${hint ? "Tipp" : "erstem Schritt"} nur ${Math.round(h)} px (< ${e.getAttribute("data-min-h")})`);
    }
    // Bild daneben nicht zerdrückt: sichtbare Höhe des größten Bildelements, sofern das Bild eigentlich höher ist
    const fit = card.querySelector(".q-visual > .ui-fit"), fb = fit?.getBoundingClientRect();
    if ((hint || first) && fit && fb.height) {
      let h = 0;
      for (const e of fit.querySelectorAll(".ui-fit-inner > *, svg, canvas, img")) { const r = e.getBoundingClientRect(); h = Math.max(h, Math.min(r.bottom, fb.bottom) - Math.max(r.top, fb.top)); }
      if (fit.firstElementChild.scrollHeight > MIN && h < MIN - 1) out.push(`Bild neben ${hint ? "Tipp" : "erstem Schritt"} nur ${Math.round(h)} px hoch (< ${MIN})`);
    }
    const vis = card.querySelector(".q-body > .q-visual"), visNow = vis?.getBoundingClientRect().height ?? 0;
    if (hint && visBefore && visNow < visBefore - 1 && visNow < Math.max(MIN, 0.6 * visBefore)) out.push(`Bildrahmen mit Tipp von ${Math.round(visBefore)} auf ${Math.round(visNow)} px gestaucht`);
    // im Blatt: Text vorhanden
    const sheet = [...document.querySelectorAll("dialog[open]")].pop();
    if (sheet && sheet.querySelector(".q-hint-sheet") && !sheet.querySelector(".q-hint-sheet").textContent.trim()) out.push("Tipp-Blatt leer");
    return out;
  }, [MIN_PIC, visBefore]);
  for (const o of r) note(app, vp, view, o);
  await check(page, app, vp, `${view} Tipp`);
  await closeDialogs(page);
}

/**
 * Aufgabe beantworten (Quiz und LEARN): vorgegebene Reihenfolge (`data-auto`, zuletzt `data-auto="last"`), sonst Zahl eintragen und
 * der Reihe nach Antworten bzw. Teile im Bild (auch die unsichtbaren Knöpfe für Tastatur) antippen und ggf. „Prüfen“ – bis „Weiter“ erscheint.
 * Eine erste Auswahl, die noch keine Antwort ist (z. B. ein Teil einer Mehrfachauswahl), bricht so nicht ab. Ergebnis: beantwortet?
 */
async function answer(page) {
  const next = page.locator(".task-card .q-next");
  const done = async () => (await next.count()) > 0;
  const click = l => l.evaluate(e => e.click()).catch(() => {});
  const auto = page.locator(".task-card [data-auto]:not([data-auto=last])"), last = page.locator(".task-card [data-auto=last]");
  if (await auto.count() || await last.count()) {
    for (let j = 0; j < await auto.count(); j++) await click(auto.nth(j));
    for (let j = 0; j < await last.count(); j++) await click(last.nth(j));
    await page.waitForTimeout(150);
    if (await done()) return true;
  }
  const inp = page.locator(".task-card input[type=text], .task-card input[type=number], .task-card input:not([type])").first();
  if (await inp.count() && await inp.isVisible().catch(() => false)) await inp.fill("1").catch(() => {});
  const pruef = page.locator(".task-card button:not(:disabled)", { hasText: /^\s*(Prüfen|Check)\s*$/ });
  for (let j = 0; j < 12 && !(await done()); j++) {
    if (await pruef.count()) { await click(pruef.first()); await page.waitForTimeout(120); if (await done()) break; }
    const cands = page.locator(".task-card .mc-btn:not(:disabled), .task-card .sr-only button:not(:disabled), .task-card .q-body button:not(:disabled):not(.mc-btn)");
    if (j >= await cands.count()) break;
    await click(cands.nth(j));
    await page.waitForTimeout(120);
  }
  return done();
}

/**
 * Folie der Kapitel lösen (ohne Kenntnis der Lösung): vorgemacht weiterblättern; Modell bzw. Zahl/Auswahl so lange falsch beantworten,
 * bis die Lösung markiert ist (4 Versuche), dann die markierte Lösung bzw. „Prüfen“ mit der Lösung im Modell. Ergebnis: „Weiter“ erreicht?
 */
async function guideSolve(page, w = fn => fn()) {
  // Text: nur der echte, nicht die unsichtbar reservierten Zustände (`.ui-guide-ghost`)
  const g = page.locator("dialog.ui-guide[open]"), t = g.locator(".ui-guide-now");
  const weiter = t.locator(".ui-guide-next", { hasText: /^\s*(Weiter|Next)\s*$/ });
  const done = async () => (await weiter.count()) > 0;
  const click = l => w(() => l.evaluate(e => e.click()).catch(() => {}));
  for (let j = 0; j < 12 && !(await done()); j++) {
    const step = t.locator(".ui-guide-next", { hasText: /Nächster Schritt|Next step/ });
    if (await step.count()) { await click(step.first()); await page.waitForTimeout(80); continue; }
    const check = g.locator(".lm-check");
    if (await check.count()) { await click(check.first()); await page.waitForTimeout(150); continue; }
    const sol = g.locator(".ui-guide-now .ui-guide-opt.sol, .ui-guide-visual .g-sol");
    if (await sol.count()) { await click(sol.first()); await page.waitForTimeout(150); continue; }
    const num = t.locator(".ui-guide-num input");
    if (await num.count()) {
      const ph = await num.getAttribute("placeholder");
      await num.fill(ph && ph !== "?" ? ph : "987654").catch(() => {});
      await click(t.locator(".ui-guide-num button[type=submit]"));
      await page.waitForTimeout(150); continue;
    }
    const opts = t.locator(".ui-guide-opt:not(.right)");
    if (await opts.count()) { await click(opts.nth(j % await opts.count())); await page.waitForTimeout(150); continue; }
    const targets = g.locator(".ui-guide-visual button:not(:disabled), .ui-guide-visual [role=button]");
    if (await targets.count()) { await click(targets.nth(j % await targets.count())); await page.waitForTimeout(150); continue; }
    break;
  }
  return done();
}

/**
 * Erklärung bzw. Lektion (offener Guide) ganz durchspielen: jede Folie vor und nach dem Lösen prüfen, jede Bedienung mit Wanderungs-Prüfung.
 * Ergebnis: Zahl der geprüften Folien.
 */
async function guidePlay(page, app, vp, view) {
  let k = 0;
  for (let guard = 0; guard < 60; guard++) {
    const count = ((await page.locator("dialog.ui-guide[open] .ui-guide-count").textContent().catch(() => "")) ?? "").trim();
    if (!/\d+ \/ \d+/.test(count)) break; // fertig
    await check(page, app, vp, `${view} ${count}`);
    const ok = await guideSolve(page, fn => wander(page, app, vp, `${view} ${count}`, fn, { resize: true }));
    await check(page, app, vp, `${view} ${count} gelöst`);
    if (!ok) { note(app, vp, `${view} ${count}`, "Folie ließ sich nicht lösen (kein „Weiter“)"); break; }
    await page.locator("dialog.ui-guide[open] .ui-guide-now .ui-guide-next").first().click({ timeout: 800 }).catch(() => {});
    k++;
    await page.waitForTimeout(120);
  }
  return k;
}

/** ERKLAERUNG=1: Erklärung jeder Stufe (Bereichsleiste) bzw. Lektionen der Kapitel unter „Üben“ durchspielen */
async function erklaerungCheck(page, app, vp) {
  const segs = page.locator('header .ui-seg[aria-label="Level"] button');
  const stufen = Math.max(1, await segs.count());
  for (let j = 0; j < stufen; j++) {
    if (await segs.count()) await segs.nth(j).click({ timeout: 800 }).catch(() => {});
    const tab = page.locator("nav button.ui-guide-tab:visible").first();
    if (await tab.count()) {
      await tab.click({ timeout: 1500 }).catch(() => {});
      await page.waitForTimeout(300);
      const k = await guidePlay(page, app, vp, `erklärung L${j + 1}`);
      console.error(`${app} ${vp} Erklärung Level ${j + 1}: ${k} Folien`);
      await closeDialogs(page);
      continue;
    }
    // Lektionen (Gemische, Polymere): Kapitel antippen öffnet beim ersten Mal die Lektion
    const learn = page.locator("nav button:visible", { hasText: /^(Üben|Practise)/ }).first();
    if (!(await learn.count())) continue;
    await page.evaluate(() => localStorage.removeItem("lern-lektionen"));
    await page.reload({ waitUntil: "networkidle" }).catch(() => {});
    if (await segs.count()) await segs.nth(j).click({ timeout: 800 }).catch(() => {});
    await learn.click({ timeout: 1500 }).catch(() => {});
    const levels = await page.locator(".level-card").count();
    for (let lv = 0; lv < levels; lv++) {
      await learn.click({ timeout: 1500 }).catch(() => {});
      await page.locator(".level-card").nth(lv).click({ timeout: 1500 }).catch(() => {});
      await page.waitForTimeout(300);
      if (!(await page.locator("dialog.ui-guide[open]").count())) continue;
      const k = await guidePlay(page, app, vp, `lektion ${lv + 1}`);
      console.error(`${app} ${vp} Lektion ${lv + 1}: ${k} Folien`);
      await closeDialogs(page);
      const back = page.locator("button[aria-label*=Levelauswahl], button[aria-label*=level], button:has-text('Levelauswahl')").first();
      if (await back.count()) await back.click({ timeout: 800 }).catch(() => {});
    }
  }
}

/**
 * Werkbank bedienen (Wanderungs-Prüfung): sichtbare Knöpfe der Bereiche in `scope` (je Bereich höchstens `max`) nacheinander antippen,
 * vorher und nachher die Kästen vergleichen; dabei geöffnete Blätter wieder schließen (außer `keep`: das Blatt, in dem die Knöpfe liegen).
 */
async function wbButtons(page, app, vp, view, scope, max = 6, keep = false) {
  if (!WANDER) return;
  for (const area of scope.split(",").map(s => s.trim())) {
    const btns = page.locator(`${area} :is(button, [role=button]):not(:disabled):not([aria-disabled=true])`);
    const n = Math.min(await btns.count(), max);
    for (let j = 0; j < n; j++) {
      const b = btns.nth(j);
      if (!(await b.isVisible().catch(() => false))) continue;
      const nm = ((await b.getAttribute("aria-label").catch(() => null)) || (await b.textContent().catch(() => "")) || `#${j}`).trim().slice(0, 18);
      if (/chließen|Close|Zurück|Back/.test(nm)) continue;
      const open = await page.locator("dialog[open]").count();
      await wander(page, app, vp, `${view} knopf:${nm}`, () => b.evaluate(e => e.click()).catch(() => {}), { resize: true, wait: 450 });
      // Blätter schließen, die der Knopf geöffnet hat (Element-Auswahl …)
      for (let k = 0; k < 3 && await page.locator("dialog[open]").count() > (keep ? open : 0); k++) { await page.keyboard.press("Escape"); await page.waitForTimeout(150); }
    }
  }
}

async function kapitelCheck(page, app, vp) {
  const tab = page.locator("nav button:visible", { hasText: /^(Lernen|Learn)/ }).first();
  if (!(await tab.count())) return;
  // Stufen-Umschalter: 1. Knopf = Level I, 2. = Level II (der Text enthält Lang- und Kurzform, deshalb über die Stelle)
  const setStufe = async j => { const b = page.locator('header .ui-seg[aria-label="Level"] button').nth(j); if (await b.count()) await b.click({ timeout: 800 }).catch(() => {}); };
  for (const [j, stufe] of [[0, "I"], [1, "II"]]) {
    await setStufe(j);
    await tab.click({ timeout: 1500 }).catch(() => {});
    const store = await page.locator(".lk-list").getAttribute("data-store").catch(() => null);
    const ids = await page.locator(".lk-card").evaluateAll(es => es.map(e => e.getAttribute("data-kapitel")));
    for (const id of ids) {
      let k = 0, tools = false, total = 0;
      for (let guard = 0; guard < 40; guard++) {
        // Kapitel bei Folie k öffnen
        if (!(await page.locator("dialog.ui-guide[open]").count())) {
          await page.evaluate(([store, id, k]) => { const v = JSON.parse(localStorage.getItem(store) || "{}"); const st = v.state ?? { pos: {}, best: {}, done: {} };
            st.pos = { ...st.pos, [id]: k }; localStorage.setItem(store, JSON.stringify({ state: st, version: v.version ?? 1 })); }, [store, id, k]);
          await page.reload({ waitUntil: "networkidle" }).catch(() => {});
          await setStufe(j);
          await page.locator("nav button:visible", { hasText: /^(Lernen|Learn)/ }).first().click({ timeout: 1500 }).catch(() => {});
          await page.locator(`.lk-card[data-kapitel="${id}"]`).click({ timeout: 1500 }).catch(() => {});
          await page.waitForTimeout(300);
        }
        const count = (await page.locator("dialog.ui-guide[open] .ui-guide-count").textContent().catch(() => "")) ?? "";
        if (!/\d+ \/ \d+/.test(count)) break; // fertig
        total = Number(count.split("/")[1]);
        await check(page, app, vp, `kapitel ${id} ${count.trim()}`);
        // Hilfsmittel einmal je Kapitel (an der ersten Folie mit Tipp)
        if (!tools && await page.locator("dialog.ui-guide[open] .ui-guide-now .ui-guide-tool:not(:disabled)").count() === 3) {
          tools = true;
          for (const b of await page.locator("dialog.ui-guide[open] .ui-guide-now .ui-guide-tool").all()) {
            const nm = ((await b.textContent()) ?? "").trim();
            await b.click({ timeout: 800 }).catch(() => {});
            await check(page, app, vp, `kapitel ${id} ${count.trim()} blatt:${nm}`);
            await page.keyboard.press("Escape"); await page.waitForTimeout(150);
          }
        }
        const ok = await guideSolve(page, fn => wander(page, app, vp, `kapitel ${id} ${count.trim()}`, fn, { resize: true }));
        await check(page, app, vp, `kapitel ${id} ${count.trim()} gelöst`);
        if (!ok) { note(app, vp, `kapitel ${id} ${count.trim()}`, "Folie ließ sich nicht lösen (kein „Weiter“)"); await closeDialogs(page); k++; continue; }
        await page.locator("dialog.ui-guide[open] .ui-guide-now .ui-guide-next").first().click({ timeout: 800 }).catch(() => {});
        k++;
        await page.waitForTimeout(120);
      }
      await check(page, app, vp, `kapitel ${id} Ende`);
      if (!total || k < total) note(app, vp, `kapitel ${id}`, `nur ${k} von ${total || "?"} Folien geprüft`);
      console.error(`${app} ${vp} Level ${stufe}: Kapitel ${id} – ${k} Folien`);
      await closeDialogs(page);
    }
  }
}

/**
 * Wanderungs-Phase (nach den übrigen Prüfungen, damit sie deren Ausgangszustand nicht ändert): je Bereich der Leiste und Stufe die Knöpfe der Werkbank
 * (Kopf, Bühne, Status, Steuerleiste, Register) und je Werkzeug die Knöpfe in seinem Blatt bzw. Register bedienen; danach Speicher und Seite wie vorher.
 */
async function wanderPhase(page, app, vp) {
  if (!WANDER) return;
  await closeDialogs(page);
  const saved = await page.evaluate(() => JSON.stringify(Object.entries(localStorage)));
  const segs = page.locator('header .ui-seg[aria-label="Level"] button');
  const stufen = Math.max(1, await segs.count());
  for (let j = 0; j < stufen; j++) {
    if (await segs.count()) await segs.nth(j).click({ timeout: 800 }).catch(() => {});
    const areas = await page.locator("nav button:visible:not(.ui-guide-tab)").count();
    for (let a = 0; a < areas; a++) {
      const tab = page.locator("nav button:visible:not(.ui-guide-tab)").nth(a);
      const nm = ((await tab.textContent().catch(() => "")) ?? "").trim().slice(0, 14);
      await tab.click({ timeout: 1500 }).catch(() => {});
      await page.waitForTimeout(250);
      await closeDialogs(page);
      if (!(await page.locator(".ui-wb").count())) continue;
      const view = `wanderung L${j + 1} ${nm}`;
      await wbButtons(page, app, vp, view, ".ui-wb-head, .ui-wb-view, .ui-wb-status, .ui-wb-controls, .ui-wb-side .ui-panel-body");
      // Werkzeuge: Blatt bzw. Register öffnen (Aktionen ohne Blatt mit Wanderungs-Prüfung), Knöpfe darin bedienen
      const tools = page.locator(".ui-wb-tools .ui-wb-tool:not(:disabled), .ui-wb-side [role=tab]");
      const n = Math.min(await tools.count(), 10);
      for (let k = 0; k < n; k++) {
        const tl = tools.nth(k);
        if (!(await tl.isVisible().catch(() => false))) continue;
        const tn = ((await tl.textContent().catch(() => "")) ?? "").trim().slice(0, 14);
        await wander(page, app, vp, `${view}/tool:${tn}`, () => tl.click({ timeout: 1000 }).catch(() => {}), { resize: true });
        await wbButtons(page, app, vp, `${view}/tool:${tn}`, "dialog.ui-sheet[open] .ui-sheet-body, .ui-wb-side .ui-panel-body", 8, true);
        await closeDialogs(page);
      }
    }
  }
  await page.evaluate(s => { localStorage.clear(); for (const [k, v] of JSON.parse(s)) localStorage.setItem(k, v); }, saved);
  await page.reload({ waitUntil: "networkidle" }).catch(() => {});
}

for (const app of APPS) {
  for (const [w, h] of VIEWPORTS) {
    const vp = `${w}×${h}`;
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, hasTouch: w < 900, isMobile: w < 900, locale: process.env.LOCALE ?? "de-DE" });
    if (process.env.LESBAR) await ctx.addInitScript(() => { try { localStorage.setItem("lern-lesbar", "on"); } catch { /* egal */ } });
    // Chromium ohne Sprachausgabe hat keine Stimmen: eine lokale Prüfstimme je Sprache, damit „Vorlesen“ wie auf echten Geräten in der Leiste steht
    await ctx.addInitScript(() => {
      try { Object.defineProperty(speechSynthesis, "getVoices", { value: () => ["de-DE", "en-GB"].map(lang => ({ name: `Prüfstimme ${lang}`, lang, localService: true, default: false, voiceURI: lang })) }); } catch { /* egal */ }
    });
    if (WANDER) await ctx.addInitScript(wanderInit, [W_SEL, W_FRAME]);
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
      await closeDialogs(page); // z. B. die Erklärung
      // Werkzeuge im Blatt / Register durchgehen
      const tools = await page.locator(".wb-tools button, [class*=tools] button, .ui-toolbar button").all();
      for (let j = 0; j < Math.min(tools.length, 10); j++) {
        const tl = tools[j];
        let tn = `#${j}`;
        try { tn = (await tl.getAttribute("aria-label")) || (await tl.textContent()) || tn; } catch { continue; }
        const vw = `tab:${label.trim().slice(0, 12)}/tool:${tn.trim().slice(0, 16)}`;
        try { await wander(page, app, vp, vw, () => tl.click({ timeout: 1000 }), { resize: true }); } catch { continue; }
        await check(page, app, vp, vw);
        // Blatt schließen
        await closeDialogs(page);
      }
    }

    // Üben (früher Quiz): Runde starten und einige Aufgaben beantworten
    await closeDialogs(page);
    const quizTab = page.locator("nav button:visible", { hasText: /^(Üben|Practise)/ }).first();
    if (await quizTab.count()) {
      try { await quizTab.click({ timeout: 2000 }); } catch { /* egal */ }
      await check(page, app, vp, "quiz-menü");
      // Blätter im Menü: Landkarte, Schularbeit
      for (const b of await page.locator(".quiz-menu .q-map-btn:visible, .quiz-menu .q-exam:visible").all()) {
        const nm = (await b.getAttribute("aria-label")) || (await b.textContent()) || "";
        try { await b.click({ timeout: 800 }); await check(page, app, vp, `quiz-menü/blatt:${nm.trim().slice(0, 16)}`); } catch { /* egal */ }
        await closeDialogs(page);
      }
      const start = page.locator("main").locator("button:has-text('Start'), button:has-text('Los'), button:has-text('Let'), button:has-text('Runde'), button:has-text('üben'), button:has-text('Üben'), .level-card").first();
      if (await start.count()) {
        try { await start.click({ timeout: 2000 }); } catch { /* egal */ }
        for (let k = 0; k < 6; k++) {
          await check(page, app, vp, `quiz-aufgabe ${k + 1}`);
          // Hilfsmittel/Lösung-Blätter öffnen
          for (const nm of ["PSE", "Pfeile", "Skala", "Lösung", "Tafel", "Hilfe", "PT", "Arrows", "Scale", "Solution", "Board", "Help"]) {
            const b = page.locator(`button:has-text('${nm}')`).first();
            if (await b.count() && await b.isVisible()) {
              try { await b.click({ timeout: 800 }); await check(page, app, vp, `quiz-aufgabe ${k + 1}/blatt:${nm}`); } catch { /* egal */ }
              await closeDialogs(page);
            }
          }
          // Erklärkarte („Los geht's“) und gelöstes Beispiel („Verstanden“) weiterklicken, sonst die Aufgabe beantworten
          const intro = page.locator(".intro-card .ui-btn-primary, .task-card.worked .q-next");
          if (await intro.count()) { await intro.first().click({ timeout: 800 }).catch(() => {}); continue; }
          await hintCheck(page, app, vp, `quiz-aufgabe ${k + 1}`);
          await wander(page, app, vp, `quiz-aufgabe ${k + 1}`, () => answer(page), { what: "Antwort" });
          await check(page, app, vp, `quiz-rückmeldung ${k + 1}`);
          const weiter = page.locator(".q-next").first();
          if (await weiter.count() && await weiter.isVisible()) { try { await weiter.click({ timeout: 800 }); } catch { break; } } else break;
        }
      }
    }
    // Werkbank bedienen: wandert ein Container? (eigene Phase, Zustand danach wie vorher)
    await wanderPhase(page, app, vp);
    // Üben in Kapiteln (freiwillig über LEARN): jede Aufgabe vor und nach der Antwort
    if (process.env.LEARN) {
      const ids = process.env.LEARN.split(",");
      await page.evaluate(ids => { localStorage.setItem("lern-lektionen", JSON.stringify(Object.fromEntries(ids.map(i => [i, true])))); }, ids);
      await page.reload({ waitUntil: "networkidle" }).catch(() => {});
      const learn = page.locator("nav button:visible", { hasText: /^(Üben|Practise)/ }).first();
      if (await learn.count()) await learn.click({ timeout: 1500 }).catch(() => {});
      const levels = await page.locator(".level-card").count();
      for (let lv = 0; lv < levels; lv++) {
        try { await learn.click({ timeout: 1500 }); await page.locator(".level-card").nth(lv).click({ timeout: 1500 }); } catch { break; }
        // zehn Aufgaben, bis zu drei gelöste Beispiele davor, dann die Auswertung
        let asked = 0;
        for (let k = 0; k < 16; k++) {
          await page.waitForTimeout(250);
          const ex = page.getByRole("button", { name: /Verstanden|Got it/ });
          if (await ex.count()) { await ex.first().click().catch(() => {}); continue; }
          if (!(await page.locator(".task-card").count())) {
            // Auswertung erreicht: prüfen, dazu ihre Blätter („Neue Stufen“, „Zum Wiederholen“)
            if (await page.locator(".result-card").count()) {
              await check(page, app, vp, `lernen ${lv + 1} Auswertung`);
              for (const b of await page.locator(".result-card button:visible", { hasText: /Neue Stufen|New stages|Zum Wiederholen|To review/ }).all()) {
                try { await b.click({ timeout: 800 }); await check(page, app, vp, `lernen ${lv + 1} Auswertung/blatt`); } catch { /* egal */ }
                await closeDialogs(page);
              }
            }
            break;
          }
          await check(page, app, vp, `lernen ${lv + 1}/${k + 1}`);
          await hintCheck(page, app, vp, `lernen ${lv + 1}/${k + 1}`);
          const ok = await wander(page, app, vp, `lernen ${lv + 1}/${k + 1}`, () => answer(page), { what: "Antwort" });
          await check(page, app, vp, `lernen ${lv + 1}/${k + 1} Antwort`);
          if (!ok) { note(app, vp, `lernen ${lv + 1}/${k + 1}`, "Aufgabe ließ sich nicht beantworten (kein „Weiter“)"); break; }
          asked++;
          await page.locator(".q-next").first().click().catch(() => {});
        }
        if (asked < 10) note(app, vp, `lernen ${lv + 1}`, `nur ${asked} von 10 Aufgaben geprüft`);
        const back = page.locator("button:has-text('Levelauswahl'), button:has-text('level selection'), button[aria-label*=Levelauswahl], button[aria-label*=level], button[aria-label*=Zurück], button[aria-label*=Back]").first();
        if (await back.count()) await back.click({ timeout: 800 }).catch(() => {});
      }
    }
    // Lernen in Kapiteln (freiwillig über KAPITEL=1, Ionenbindung): jede Folie jedes Kapitels vor und nach dem Lösen, Hilfsmittel einmal je Kapitel
    if (process.env.KAPITEL) await kapitelCheck(page, app, vp);
    if (process.env.ERKLAERUNG) { await closeDialogs(page); await erklaerungCheck(page, app, vp); }
    } catch (e) { note(app, vp, "skript", "Abbruch: " + String(e).split("\n")[0].slice(0, 120)); }
    await ctx.close();
  }
}
await browser.close();
server.close();
const uniq = [...new Set(findings)];
process.exitCode = uniq.length ? 1 : 0;
console.log(uniq.length ? uniq.join("\n") : "Keine Befunde");
