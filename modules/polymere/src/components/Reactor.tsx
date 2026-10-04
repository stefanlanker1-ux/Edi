// Kügelchen-Ansicht: der Reaktor als Becherglas (Canvas, Simulation in chem/reactor.ts). Gezeichnet wird mit höchstens
// 30 Bildern je Sekunde und nur, solange etwas passiert; danach steht das Bild (Akku). Antippen eines Kügelchens hebt sein
// Molekül hervor und zeigt das Monomer; Ziehen bewegt das Kügelchen samt Kette. Bewegung reduziert: Ablauf wird ohne
// Zwischenbilder vorausgerechnet.

import { useEffect, useLayoutEffect, useRef, type MutableRefObject, type PointerEvent as RPointerEvent } from "react";
import { tr } from "@lern/i18n";
import { useReducedMotion } from "@lern/ui";
import { monoHue, monoLetter, type Hue } from "../chem/data.ts";
import { PARTICLE, Reactor, type RBead, type RStats } from "../chem/reactor.ts";
import type { Recipe } from "../chem/mech/types.ts";

/** Gefäßgröße in Kügelchen-Radien (Fläche fest, Seitenverhältnis wie die Bühne) */
const AREA = 44 * 48;
const TOP = 52;
const FRAME_MS = 1000 / 30;

type Colors = Record<string, string>;
const VARS = ["--text", "--muted", "--surface", "--surface-2", "--surface-3", "--accent", "--bad", "--ok", "--rule",
  ...["red", "blue", "yellow", "green", "grey", "violet", "teal", "orange"].flatMap(h => [`--hue-${h}`, `--hue-${h}-deep`, `--hue-${h}-soft`]), "--hue-blue-light"];

function readColors(el: Element): Colors {
  const cs = getComputedStyle(el);
  return Object.fromEntries(VARS.map(v => [v, cs.getPropertyValue(v).trim() || "#888888"]));
}

/** Füllung, Rand und Schriftfarbe eines Kügelchens (wie die Kügelchen der Leiste) */
function beadPaint(c: Colors, hue: Hue | "init"): [string, string, string] {
  const dark = "#111111", light = "#ffffff";
  switch (hue) {
    case "light": return [c["--hue-grey-soft"], c["--hue-grey-deep"], dark];
    case "sky": return [c["--hue-blue-light"], c["--hue-blue-deep"], dark];
    case "init": return [c["--surface-3"], c["--muted"], dark];
    case "yellow": case "grey": return [c[`--hue-${hue}`], c[`--hue-${hue}-deep`], dark];
    default: return [c[`--hue-${hue}`], c[`--hue-${hue}-deep`], light];
  }
}

export function ReactorView({ recipe, rkey, store, wake, paused, onStats, onPick }: {
  recipe: Recipe;
  /** neuer Ansatz → neuer Reaktor */
  rkey: string;
  /** Reaktor gehört der Ansicht darüber (Aktionen, Kennzeichen); hier erzeugt, sobald die Größe bekannt ist */
  store: MutableRefObject<Reactor | null>;
  /** neuer Wert = Aktion ausgeführt → Ablauf weiterlaufen lassen */
  wake: number;
  paused: boolean;
  onStats: (s: RStats) => void;
  onPick: (b: RBead) => void;
}) {
  const wrap = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const reduced = useReducedMotion();
  const colors = useRef<Colors | null>(null);
  const size = useRef({ w: 0, h: 0, dpr: 1 });
  const sel = useRef<{ ids: Set<number>; until: number } | null>(null);
  const loop = useRef<{ raf: number; last: number; lastStats: number } | null>(null);
  const live = useRef({ paused, reduced, onStats, onPick });
  live.current = { paused, reduced, onStats, onPick };

  // Ausschnitt: Gefäß mittig, Maßstab px je Radius
  const geom = () => {
    const { w, h } = size.current, R = store.current;
    if (!R || !w) return null;
    const iw = w - 24, ih = h - TOP - 14;
    const s = Math.min(iw / R.W, ih / R.H);
    const ox = (w - R.W * s) / 2, oy = TOP + (ih - R.H * s) / 2 + 4;
    return { s, ox, oy };
  };

  const draw = () => {
    const cv = canvas.current, R = store.current, g = geom();
    if (!cv || !R || !g) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    const c = colors.current ?? (colors.current = readColors(cv));
    const { w, h, dpr } = size.current, { s, ox, oy } = g;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    const X = (x: number) => ox + x * s, Y = (y: number) => oy + y * s;
    // Becherglas: Flüssigkeit, Wände mit Ausguss
    const bx0 = ox - 6, bx1 = ox + R.W * s + 6, by0 = oy - 10, by1 = oy + R.H * s + 6, rad = 10;
    ctx.fillStyle = c["--surface-2"];
    ctx.fillRect(bx0, oy - 3, bx1 - bx0, by1 - oy + 3);
    ctx.strokeStyle = c["--text"]; ctx.lineWidth = 2; ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(bx0 - 6, by0 - 4); ctx.lineTo(bx0, by0);
    ctx.lineTo(bx0, by1 - rad); ctx.quadraticCurveTo(bx0, by1, bx0 + rad, by1);
    ctx.lineTo(bx1 - rad, by1); ctx.quadraticCurveTo(bx1, by1, bx1, by1 - rad);
    ctx.lineTo(bx1, by0);
    ctx.stroke();
    ctx.strokeStyle = c["--muted"]; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(bx0, oy - 3); ctx.lineTo(bx1, oy - 3); ctx.stroke();

    const hl = sel.current && sel.current.until > performance.now() ? sel.current.ids : null;
    const alpha = (b: RBead) => Math.min(1, (R.t - b.born) / 12 + 0.15) * (hl && !hl.has(b.id) ? 0.3 : 1);
    // Bindungen
    ctx.lineCap = "round";
    for (const a of R.beads) for (const j of a.nb) {
      if (j < a.id) continue;
      const b = R.bead(j);
      if (!b) continue;
      ctx.globalAlpha = Math.min(alpha(a), alpha(b));
      ctx.strokeStyle = a.dead || b.dead ? c["--bad"] : c["--text"];
      ctx.lineWidth = Math.max(1.6, s * 0.3);
      ctx.beginPath(); ctx.moveTo(X(a.x), Y(a.y)); ctx.lineTo(X(b.x), Y(b.y)); ctx.stroke();
    }
    // Kügelchen
    const font = (px: number) => `800 ${px}px Inter, system-ui, sans-serif`;
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    for (const b of R.beads) {
      const x = X(b.x), y = Y(b.y), r = b.r * s;
      ctx.globalAlpha = alpha(b);
      if (b.kind === "gas" || b.kind === "byp") {
        ctx.fillStyle = b.kind === "byp" ? c["--hue-blue-soft"] : c["--surface"];
        ctx.strokeStyle = b.kind === "byp" ? c["--hue-blue-deep"] : c["--muted"];
        ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        continue;
      }
      let fill: string, edge: string, ink: string, letter = "";
      if (b.kind === "mono") { [fill, edge, ink] = beadPaint(c, monoHue(b.m)); letter = monoLetter(b.m); }
      else if (b.kind === "cat") { fill = c["--surface-3"]; edge = c["--text"]; ink = c["--text"]; letter = "Ti"; }
      else { [fill, edge, ink] = beadPaint(c, "init"); letter = PARTICLE[b.m]?.letter ?? ""; }
      ctx.fillStyle = fill; ctx.strokeStyle = edge; ctx.lineWidth = b.kind === "cat" ? 2 : 1.3;
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      if (letter && r >= 6.5) {
        ctx.fillStyle = ink;
        ctx.font = font(Math.round(Math.min(r * (letter.length > 1 ? 0.95 : 1.15), 15)));
        ctx.fillText(letter, x, y + 0.5);
      }
      // aktives Kettenende: gestrichelter Ring; vergifteter Katalysator: ✗
      if (b.act) {
        ctx.setLineDash([3, 3]); ctx.lineWidth = 2.2;
        ctx.strokeStyle = b.act === "rad" ? c["--hue-red"] : b.act === "an" ? c["--hue-blue"] : b.act === "kat" ? c["--hue-red-deep"] : c["--muted"];
        ctx.beginPath(); ctx.arc(x, y, r + 3.5, 0, Math.PI * 2); ctx.stroke();
        ctx.setLineDash([]);
      }
      if (b.kind === "cat" && b.dead) {
        ctx.strokeStyle = c["--bad"]; ctx.lineWidth = 2.6;
        const d = r * 0.55, cy = y - r - 6;
        ctx.beginPath(); ctx.moveTo(x - d, cy - d); ctx.lineTo(x + d, cy + d); ctx.moveTo(x + d, cy - d); ctx.lineTo(x - d, cy + d); ctx.stroke();
      }
      if (hl?.has(b.id)) {
        ctx.strokeStyle = c["--accent"]; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(x, y, r + 1.8, 0, Math.PI * 2); ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;
  };

  // Ablauf: Simulation + Zeichnen mit 30 Bildern/s, bis Ruhe, Pause oder unsichtbar
  const run = () => {
    if (loop.current || !store.current) return;
    const L = { raf: 0, last: 0, lastStats: 0 };
    loop.current = L;
    const tick = (t: number) => {
      const R = store.current;
      if (!R || live.current.paused || document.hidden) { loop.current = null; draw(); return; }
      if (t - L.last >= FRAME_MS - 2) {
        L.last = t;
        R.step();
        draw();
        if (t - L.lastStats > 300) { L.lastStats = t; live.current.onStats(R.stats()); }
      }
      if (R.idle() && !(sel.current && sel.current.until > t)) { loop.current = null; live.current.onStats(R.stats()); draw(); return; }
      L.raf = requestAnimationFrame(tick);
    };
    L.raf = requestAnimationFrame(tick);
  };
  const stop = () => { if (loop.current) { cancelAnimationFrame(loop.current.raf); loop.current = null; } };

  /** Simulation weiterlaufen lassen (bzw. bei reduzierter Bewegung vorausrechnen) */
  const kick = () => {
    const R = store.current;
    if (!R) return;
    if (live.current.reduced) {
      if (R.started) R.advance(900);
      live.current.onStats(R.stats());
      draw();
      return;
    }
    run();
  };

  // Größe messen; Reaktor anlegen bzw. Gefäß anpassen
  useLayoutEffect(() => {
    const el = wrap.current, cv = canvas.current;
    if (!el || !cv) return;
    const upd = () => {
      const w = el.clientWidth, h = el.clientHeight;
      if (w < 40 || h < 80) return;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      size.current = { w, h, dpr };
      cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
      const iw = w - 24, ih = Math.max(40, h - TOP - 14);
      if (!store.current) {
        // Kügelchen 6–9 px Radius: kleine Bühne → weniger, aber gut sichtbare Kügelchen
        const s = Math.min(9, Math.max(6, Math.sqrt((iw * ih) / AREA)));
        store.current = new Reactor(recipe, iw / s, ih / s);
        live.current.onStats(store.current.stats()); kick();
      } else {
        // gleiche Fläche, neues Seitenverhältnis
        const A = store.current.W * store.current.H, W = Math.sqrt(A * (iw / ih));
        store.current.resize(W, A / W);
      }
      draw();
    };
    upd();
    const ro = new ResizeObserver(upd);
    ro.observe(el);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // neuer Ansatz → neuer Reaktor
  useEffect(() => {
    const R = store.current;
    if (!R || JSON.stringify(R.recipe) === rkey) return;
    stop();
    store.current = new Reactor(recipe, R.W, R.H);
    sel.current = null;
    live.current.onStats(store.current.stats());
    draw(); kick();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rkey]);

  // Aktion, Pause/Weiter
  useEffect(() => { if (!paused) kick(); else { stop(); draw(); } }, [wake, paused]); // eslint-disable-line react-hooks/exhaustive-deps

  // Farbschema / Beamer gewechselt → Farben neu lesen; Seite wieder sichtbar → weiter
  useEffect(() => {
    const mo = new MutationObserver(() => { colors.current = null; draw(); });
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme", "data-beamer", "class"] });
    const vis = () => { if (!document.hidden && !live.current.paused) kick(); };
    document.addEventListener("visibilitychange", vis);
    return () => { mo.disconnect(); document.removeEventListener("visibilitychange", vis); stop(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Antippen und Ziehen
  const drag = useRef<{ id: number; x0: number; y0: number; moved: boolean } | null>(null);
  const toSim = (e: RPointerEvent) => {
    const g = geom(), rect = canvas.current!.getBoundingClientRect();
    if (!g) return null;
    return { x: (e.clientX - rect.left - g.ox) / g.s, y: (e.clientY - rect.top - g.oy) / g.s, s: g.s };
  };
  const onDown = (e: RPointerEvent) => {
    const R = store.current, p = toSim(e);
    if (!R || !p) return;
    let best: RBead | null = null, bd = Infinity;
    for (const b of R.beads) {
      if (b.kind === "gas") continue;
      const d = Math.hypot(b.x - p.x, b.y - p.y) - b.r;
      if (d < bd) { bd = d; best = b; }
    }
    // großzügig: bis 1,2 Radien neben dem Kügelchen (mind. 10 px)
    if (!best || bd > Math.max(1.2, 10 / p.s)) { sel.current = null; draw(); return; }
    drag.current = { id: best.id, x0: e.clientX, y0: e.clientY, moved: false };
    (e.target as Element).setPointerCapture?.(e.pointerId);
  };
  const onMove = (e: RPointerEvent) => {
    const d = drag.current, R = store.current;
    if (!d || !R) return;
    if (!d.moved && Math.hypot(e.clientX - d.x0, e.clientY - d.y0) < 7) return;
    const b = R.bead(d.id), p = toSim(e);
    if (!b || !p) return;
    d.moved = true;
    b.held = true;
    b.x = Math.min(R.W - b.r, Math.max(b.r, p.x)); b.y = Math.min(R.H - b.r, Math.max(b.r, p.y));
    if (!loop.current) { if (!live.current.reduced && !live.current.paused) run(); else draw(); }
  };
  const onUp = () => {
    const d = drag.current, R = store.current;
    drag.current = null;
    if (!d || !R) return;
    const b = R.bead(d.id);
    if (!b) return;
    b.held = false;
    if (!d.moved) {
      sel.current = { ids: new Set(R.molOf(b.id)), until: performance.now() + 4000 };
      live.current.onPick(b);
      if (!live.current.reduced && !live.current.paused) run();
    }
    draw();
  };

  return (
    <div className="pm-reactor" ref={wrap}>
      <canvas ref={canvas} className="pm-reactor-cv" role="img"
        aria-label={tr("Reaktor mit Kügelchen: jedes Kügelchen ist ein Baustein, Striche sind Bindungen", "Reactor with beads: each bead is a unit, lines are bonds")}
        onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp} />
    </div>
  );
}
