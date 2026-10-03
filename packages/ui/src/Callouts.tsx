// Beschriftung mit Pfeilen über einem Bild (Erklärung): Begriff am Rand, Pfeil zeigt auf das Teil im Bild
// (Kern, Elektron, bindendes Paar, Edukte …). Ziele per CSS-Selektor im Bild; Lage wird bei jeder Größenänderung
// neu gemessen (auch nach dem Einpassen per Fit). Bezugsrahmen ist das umgebende Element (position: relative).
// Die Beschriftung lässt Tippen durch (pointer-events: none).

import { tr } from "./i18n.ts";
import { useLayoutEffect, useRef, useState } from "react";

export interface Callout {
  /** CSS-Selektor des Ziels im Bild, z. B. ".bohr .nuc" */
  at: string;
  /** Begriff */
  text: string;
  /** welches der passenden Elemente (Standard 0; negativ = von hinten) */
  nth?: number;
  /** Seite, an der der Begriff steht (Standard: die nähere Seite links/rechts); above = knapp über dem Ziel */
  side?: "left" | "right" | "top" | "bottom" | "above";
  /** Pfeilspitze: Mitte oder Rand des Ziels; ne/nw/se/sw = schräg auf einen Kreis (Schalen: sonst zeigt die Mitte auf den Kern) */
  point?: "center" | "left" | "right" | "top" | "bottom" | "ne" | "nw" | "se" | "sw";
  /** erst nach der richtigen Antwort zeigen (sonst wäre es die Lösung) */
  afterSolved?: boolean;
}

interface Placed { text: string; x: number; y: number; w: number; h: number; tx: number; ty: number; lx: number; ly: number; stop: number }

const H = 24, GAP = 6, EDGE = 4, MIN_ARROW = 26, SHIFT = 44, ABOVE = 14;
/** Schrift und Elektronen in Zeichnungen (SVG-Text, Atomsymbole, Ionen-Bausteine, Elektronen im Schalenmodell) – wird von Begriffen nicht verdeckt */
const AVOID = "svg text, circle.e, circle.el, .nu-a, .nu-z, .nu-sym, .nu-q, .ion-label, .ms-arrow, .iw-balance, .iw-formula, .nw-tag, .nw-balance";
/** Breite des Begriffs (13 px, halbfett) – geschätzt, damit vor dem ersten Zeichnen gerechnet werden kann */
const widthOf = (t: string) => Math.ceil(t.length * 7.4 + 16);

export function placeCallouts(items: Callout[], host: HTMLElement): Placed[] {
  const hr = host.getBoundingClientRect();
  const W = hr.width, Hh = hr.height;
  const out: (Placed & { side: string })[] = [];
  // Schrift im Bild, die frei bleiben soll
  const avoid = [...host.querySelectorAll(AVOID)].map(e => {
    const r = e.getBoundingClientRect();
    return { l: r.left - hr.left, r: r.right - hr.left, t: r.top - hr.top, b: r.bottom - hr.top };
  }).filter(r => r.r > r.l && r.b > r.t);
  for (const c of items) {
    const all = [...host.querySelectorAll(c.at)];
    const pt = c.point ?? "center";
    // Kreis im Rechteck: schräge Punkte liegen bei 45° auf dem Umfang
    const k = Math.SQRT1_2 / 2;
    const fx = pt === "left" ? 0 : pt === "right" ? 1 : pt === "ne" || pt === "se" ? .5 + k : pt === "nw" || pt === "sw" ? .5 - k : .5;
    const fy = pt === "top" ? 0 : pt === "bottom" ? 1 : pt === "ne" || pt === "nw" ? .5 - k : pt === "se" || pt === "sw" ? .5 + k : .5;
    const pts = all.map(el => {
      const r = el.getBoundingClientRect();
      // Pfeil auf die Mitte endet am Rand des Teils (sonst liegt die Spitze mitten im Atomsymbol)
      return r.width || r.height ? { tx: r.left - hr.left + r.width * fx, ty: r.top - hr.top + r.height * fy, stop: pt === "center" ? Math.min(r.width, r.height) / 2 : 0 } : null;
    });
    let t = c.nth === undefined ? null : pts[c.nth < 0 ? pts.length + c.nth : c.nth];
    if (c.nth === undefined) {
      // ohne feste Nummer: das passende Teil, das der Seite des Begriffs am nächsten liegt (kurzer Pfeil, kreuzt wenig)
      const score = (q: { tx: number; ty: number; stop: number }) => c.side === "left" ? q.tx : c.side === "right" ? -q.tx : c.side === "top" ? q.ty : c.side === "bottom" ? -q.ty : 0;
      for (const q of pts) if (q && (!t || score(q) < score(t))) t = q;
    }
    if (!t) continue;
    const { tx, ty, stop } = t;
    const side = c.side ?? (tx < W / 2 ? "left" : "right");
    const w = Math.min(widthOf(c.text), W - 2 * EDGE);
    let x = 0, y = 0;
    if (side === "left") { x = EDGE; y = ty - H / 2; }
    else if (side === "right") { x = W - w - EDGE; y = ty - H / 2; }
    else if (side === "top") { x = tx - w / 2; y = EDGE; }
    else if (side === "above") { x = tx - w / 2; y = Math.max(EDGE, ty - H - ABOVE); }
    else { x = tx - w / 2; y = Hh - H - EDGE; }
    // Begriff darf weder Schrift im Bild (Atomsymbole, Zahlen) noch das Teil selbst verdecken, der Pfeil braucht Länge:
    // sonst ausweichen – links/rechts nach oben bzw. unten, oben/unten zur Seite; Pfeil wird dann schräg
    const vert = side === "left" || side === "right";
    const steps = vert ? [0, -SHIFT, SHIFT, -2 * SHIFT, 2 * SHIFT] : [0, w / 2 + SHIFT, -(w / 2 + SHIFT)];
    const fits = (nx: number, ny: number) => {
      if (nx < EDGE - .5 || ny < EDGE - .5 || nx + w > W - EDGE + .5 || ny + H > Hh - EDGE + .5) return false;
      const near = vert && ny <= ty && ty <= ny + H ? (side === "left" ? tx - (nx + w) : nx - tx) : !vert && nx <= tx && tx <= nx + w ? (side === "bottom" ? ny - ty : ty - (ny + H)) : Infinity;
      if (side === "above" && near < ABOVE - .5) return false;
      if (side !== "above" && near < MIN_ARROW) return false;
      if (tx > nx - 4 && tx < nx + w + 4 && ty > ny - 4 && ty < ny + H + 4) return false;
      return !avoid.some(r => r.l < nx + w && nx < r.r && r.t < ny + H && ny < r.b);
    };
    const bx = x, by = y;
    const best = steps.find(d => fits(vert ? bx : bx + d, vert ? by + d : by));
    if (best !== undefined) { if (vert) y = by + best; else x = bx + best; }
    else if (vert) y = ty - H / 2 - SHIFT >= EDGE ? ty - H / 2 - SHIFT : ty - H / 2 + SHIFT;
    x = Math.min(Math.max(EDGE, x), W - w - EDGE);
    out.push({ text: c.text, x, y, w, h: H, tx, ty, lx: 0, ly: 0, stop, side });
  }
  // Begriffe auf derselben Seite nicht übereinander: senkrecht (links/rechts) bzw. waagrecht (oben/unten) auseinanderschieben
  for (const side of ["left", "right", "top", "bottom"]) {
    const g = out.filter(p => p.side === side);
    const vert = side === "left" || side === "right";
    const pos = (p: Placed) => (vert ? p.y : p.x), size = (p: Placed) => (vert ? p.h : p.w);
    const set = (p: Placed, v: number) => { if (vert) p.y = v; else p.x = v; };
    const max = vert ? Hh - EDGE : W - EDGE;
    // Reihenfolge der Ziele behalten: sonst kreuzen sich die Pfeile, wenn ein Begriff ausweichen musste
    g.sort((a, b) => (vert ? a.ty - b.ty : a.tx - b.tx));
    for (let i = 0; i < g.length; i++) set(g[i], Math.max(pos(g[i]), i ? pos(g[i - 1]) + size(g[i - 1]) + GAP : EDGE));
    for (let i = g.length - 1; i >= 0; i--) set(g[i], Math.min(pos(g[i]), (i < g.length - 1 ? pos(g[i + 1]) - GAP : max) - size(g[i])));
    for (const p of g) set(p, Math.max(EDGE, pos(p)));
  }
  // Pfeil beginnt an der Kante des Begriffs, die zum Ziel zeigt
  for (const p of out) {
    const vert = p.side === "left" || p.side === "right";
    if (vert && (p.ty < p.y || p.ty > p.y + p.h)) {
      // Begriff liegt über/unter dem Ziel: Pfeil von der Unter- bzw. Oberkante, waagrecht so nah wie möglich am Ziel
      p.lx = Math.min(Math.max(p.tx, p.x + 6), p.x + p.w - 6);
      p.ly = p.ty > p.y ? p.y + p.h : p.y;
    } else {
      p.lx = p.side === "left" ? p.x + p.w : p.side === "right" ? p.x : Math.min(Math.max(p.tx, p.x + 6), p.x + p.w - 6);
      p.ly = p.side === "top" || p.side === "above" ? p.y + p.h : p.side === "bottom" ? p.y : p.y + p.h / 2;
    }
  }
  return out;
}

export function Callouts({ items, solved = false }: { items: Callout[]; solved?: boolean }) {
  const shown = items.filter(c => !c.afterSolved || solved);
  const [placed, setPlaced] = useState<Placed[]>([]);
  const self = useRef<HTMLDivElement>(null);
  const key = JSON.stringify(shown);
  useLayoutEffect(() => {
    // eigener Rahmen → umgebendes Bild (der Verweis des Elternteils ist beim ersten Zeichnen noch nicht gesetzt)
    const el = self.current?.parentElement;
    if (!el || !shown.length) { setPlaced([]); return; }
    let raf = 0;
    const measure = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(() => setPlaced(placeCallouts(shown, el))); };
    measure();
    // Bilder passen sich erst nach dem ersten Zeichnen ein (Fit, Schrift) – kurz danach noch einmal messen
    const timers = [80, 250, 600].map(t => window.setTimeout(measure, t));
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    if (el.firstElementChild) ro.observe(el.firstElementChild);
    document.fonts?.ready.then(measure).catch(() => {});
    return () => { cancelAnimationFrame(raf); timers.forEach(clearTimeout); ro.disconnect(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  if (!shown.length) return null;
  return (
    <div className="ui-callouts" ref={self}>
      <p className="sr-only">{tr("Beschriftung", "Labels")}: {shown.map(c => c.text).join(", ")}</p>
      <svg className="ui-callouts-lines" aria-hidden="true">
        {placed.map((p, i) => {
          // Spitze kurz vor dem Rand des Ziels, damit sie das Teil nicht verdeckt (Pfeil bleibt mindestens 12 px lang)
          const dx = p.tx - p.lx, dy = p.ty - p.ly, d = Math.hypot(dx, dy) || 1, s = Math.max(0, Math.max(Math.min(12, d), d - p.stop - 3)) / d;
          const ex = p.lx + dx * s, ey = p.ly + dy * s, ux = dx / d, uy = dy / d;
          return (
            <g key={i}>
              <line x1={p.lx} y1={p.ly} x2={ex} y2={ey} />
              <polygon points={`${ex},${ey} ${ex - ux * 8 - uy * 4},${ey - uy * 8 + ux * 4} ${ex - ux * 8 + uy * 4},${ey - uy * 8 - ux * 4}`} />
              {!p.stop && <circle cx={p.tx} cy={p.ty} r={2} />}
            </g>
          );
        })}
      </svg>
      {placed.map((p, i) => (
        <span key={i} className="ui-callout" aria-hidden="true" style={{ left: p.x, top: p.y, width: p.w, height: p.h }}>{p.text}</span>
      ))}
    </div>
  );
}
