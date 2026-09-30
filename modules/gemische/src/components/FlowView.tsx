// Gefäß mit allen Teilchen (klein) und verschiebbarer Lupe (Canvas, damit auch 200 Teilchen flüssig laufen).
// Die Lupe zeigt etwa 20 Teilchen vergrößert als Kalottenmodell. Lupe ziehen (Finger, Maus) oder mit den Pfeiltasten verschieben;
// ein Teilchen in der Lupe antippen = Stoff-Info. Grenze zwischen Öl und Wasser als gerade Linie, sobald sie sich getrennt haben.
// Farben aus den Tokens (--atom-X, --text …), Kugeln schattiert wie im SVG-Kalottenmodell.

import { useEffect, useRef, type KeyboardEvent, type PointerEvent } from "react";
import { atomRadius } from "@lern/chem";
import { kalotteBox, shapeOf } from "@lern/chem-ui";
import { boundaryY, separatedFlow, stepFlow, liquidHeight, type World } from "../flow.ts";

type Layout = { mv: number; ox: number; oy: number; zx: number; zy: number; R: number; side: boolean };
type Mol = { atoms: [string, number, number][]; ext: number };

const molCache = new Map<string, Mol>();
/** Atome eines Stoffs in Å, um die Mitte, von hinten nach vorn */
function mol(f: string): Mol {
  let m = molCache.get(f);
  if (!m) {
    const b = kalotteBox(f), cx = (b.x0 + b.x1) / 2, cy = (b.y0 + b.y1) / 2;
    m = { atoms: shapeOf(f).map(([el, x, y]) => [el, x - cx, y - cy]), ext: Math.max(b.w, b.h) };
    molCache.set(f, m);
  }
  return m;
}
const isLong = (f: string) => { const b = kalotteBox(f); return Math.max(b.w, b.h) / Math.max(.1, Math.min(b.w, b.h)) > 2.5; };

/** Maßstab (Welt-Einheiten je Å) je Stoff: wie im Teilchenbild – das größte füllt den Platz, kleine etwas größer */
function scales(w: World): Record<string, number> {
  const fs = [...new Set(w.ps.map(p => p.f))];
  const n = w.ps.length;
  const spacing = w.state === "fluessig" ? Math.sqrt(w.W * liquidHeight(n, w.W) / n) : w.state === "fest" ? 2 * w.rc : 2.6 * w.rc;
  const room = (f: string) => spacing * (isLong(f) ? 1.6 : .95);
  const base = Math.min(...fs.map(f => room(f) / mol(f).ext));
  return Object.fromEntries(fs.map(f => [f, Math.min(room(f) / mol(f).ext, Math.max(base, spacing * .55 / mol(f).ext))]));
}

/** Farben: Token lesen (hell/dunkel) und mischen */
function parse(c: string): [number, number, number] {
  const m = c.trim().match(/^#([0-9a-f]{6})$/i);
  if (m) return [0, 2, 4].map(i => parseInt(m[1].slice(i, i + 2), 16)) as [number, number, number];
  const r = c.match(/(\d+(?:\.\d+)?)[ ,]+(\d+(?:\.\d+)?)[ ,]+(\d+(?:\.\d+)?)/);
  return r ? [Number(r[1]), Number(r[2]), Number(r[3])] : [128, 128, 128];
}
const mix = (a: [number, number, number], b: [number, number, number], t: number) => `rgb(${a.map((v, i) => Math.round(v * t + b[i] * (1 - t))).join(",")})`;

/** Radius der Lupe in Welt-Einheiten: etwa 20 Teilchen sind darin */
export function lensRadius(w: World): number {
  const area = w.state === "fluessig" ? w.W * liquidHeight(w.ps.length, w.W) : w.state === "fest" ? w.ps.length * 4 * w.rc * w.rc : w.W * w.H;
  return Math.max(8, Math.min(Math.min(w.W, w.H) * .35, Math.sqrt(20 * area / w.ps.length / Math.PI)));
}
/** Anfangslage der Lupe: dort, wo es etwas zu sehen gibt */
export function lensStart(w: World, focus?: "oben" | "unten" | "grenze"): [number, number] {
  const rl = lensRadius(w);
  if (w.state !== "fluessig") return [w.W / 2, w.H / 2];
  if (focus === "grenze" && w.floats.length) return [w.W / 2, boundaryY(w)];
  if (focus === "unten") return [w.W / 2, w.H - rl];
  return [w.W / 2, w.top + rl * .6];
}

function layout(cw: number, ch: number, W: number, H: number): Layout {
  const m = 10, gap = Math.max(18, Math.min(cw, ch) * .06);
  let best: Layout & { score: number } = { mv: 1, ox: 0, oy: 0, zx: 0, zy: 0, R: 10, side: true, score: -1 };
  for (let f = .35; f <= .66; f += .05) {
    // nebeneinander: links das Gefäß, rechts die Lupe
    {
      let wv = (cw - 2 * m - gap) * f;
      wv = Math.min(wv, (ch - 2 * m) * W / H);
      const D = Math.min(ch - 2 * m, cw - 2 * m - gap - wv);
      const score = Math.min(wv * 1.1, D);
      if (D > 0 && score > best.score) {
        const hv = wv * H / W, tw = wv + gap + D, x0 = (cw - tw) / 2;
        best = { mv: wv / W, ox: x0, oy: (ch - hv) / 2, zx: x0 + wv + gap + D / 2, zy: ch / 2, R: D / 2, side: true, score };
      }
    }
    // übereinander: oben die Lupe, unten das Gefäß
    {
      let hv = (ch - 2 * m - gap) * f;
      const wv = Math.min(cw - 2 * m, hv * W / H);
      hv = wv * H / W;
      const D = Math.min(cw - 2 * m, ch - 2 * m - gap - hv);
      const score = Math.min(wv * 1.1, D);
      if (D > 0 && score > best.score) {
        const th = D + gap + hv, y0 = (ch - th) / 2;
        best = { mv: wv / W, ox: (cw - wv) / 2, oy: y0 + D + gap, zx: cw / 2, zy: y0 + D / 2, R: D / 2, side: false, score };
      }
    }
  }
  return best;
}

export function FlowView({ world, motion, busy, version, label, onPick, onFrame, focus }: {
  world: World; motion: boolean; version: number; label: string;
  /** Vorgang läuft: volle Bildrate; sonst (Teilchen bewegen sich nur ruhig) halbe Bildrate – spart Rechenzeit und Akku */
  busy?: boolean;
  onPick?: (f: string) => void;
  /** nach jedem Zeitschritt (für Anzeige des Zustands) */
  onFrame?: () => void;
  focus?: "oben" | "unten" | "grenze";
}) {
  const wrap = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const lens = useRef<[number, number]>(lensStart(world, focus));
  const lay = useRef<Layout | null>(null);
  const drag = useRef(false);
  const worldRef = useRef(world);
  const sprites = useRef(new Map<string, HTMLCanvasElement>());
  const colors = useRef<Record<string, [number, number, number]>>({});
  const drawRef = useRef<() => void>(() => {});
  const onFrameRef = useRef(onFrame);
  onFrameRef.current = onFrame;
  const busyRef = useRef(!!busy);
  busyRef.current = !!busy;

  // neue Welt (anderes Beispiel): Lupe an den Anfang
  useEffect(() => {
    if (worldRef.current !== world) { worldRef.current = world; lens.current = lensStart(world, focus); }
  }, [world, focus]);

  useEffect(() => {
    const el = canvas.current, box = wrap.current;
    if (!el || !box) return;
    const ctx = el.getContext("2d");
    if (!ctx) return;
    let raf = 0, frame = 0, dpr = 1;
    const minis = new Map<string, HTMLCanvasElement>();

    // Farben über ein unsichtbares Element auflösen (Tokens können var() oder color-mix() enthalten)
    const probe = document.createElement("span");
    probe.style.display = "none";
    box.appendChild(probe);
    const readColors = () => {
      const get = (v: string) => { probe.style.color = `var(${v}, #808080)`; return parse(getComputedStyle(probe).color); };
      const els = new Set(worldRef.current.ps.flatMap(p => mol(p.f).atoms.map(a => a[0])));
      const c: Record<string, [number, number, number]> = { text: get("--text"), muted: get("--muted"), surface: get("--surface"),
        oil: get("--hue-yellow-deep"), edge: get("--atom-edge"), wall: get("--text") };
      for (const e of els) c[`atom-${e}`] = get(`--atom-${e}`);
      const changed = JSON.stringify(c) !== JSON.stringify(colors.current);
      if (changed) { colors.current = c; sprites.current.clear(); minis.clear(); bigs.clear(); }
    };
    const sprite = (e: string, r: number) => {
      const rr = Math.max(1, Math.round(r * 2) / 2), key = `${e}|${rr}`;
      let s = sprites.current.get(key);
      if (!s) {
        const size = Math.ceil(rr * 2 + 2);
        s = document.createElement("canvas");
        s.width = s.height = size;
        const g = s.getContext("2d")!, c = colors.current[`atom-${e}`] ?? [128, 128, 128];
        const cx = size / 2, grad = g.createRadialGradient(cx - rr * .36, cx - rr * .4, rr * .05, cx, cx, rr);
        grad.addColorStop(0, mix(c, [255, 255, 255], .65));
        grad.addColorStop(.45, mix(c, c, 1));
        grad.addColorStop(1, mix(c, [0, 0, 0], .72));
        g.fillStyle = grad;
        g.beginPath(); g.arc(cx, cx, rr, 0, Math.PI * 2); g.fill();
        g.lineWidth = Math.max(.6, rr * .06);
        g.strokeStyle = mix(c, colors.current.edge ?? [0, 0, 0], .55);
        g.stroke();
        sprites.current.set(key, s);
      }
      return s;
    };

    const miniSprite = (f: string, turn: number, pxPerA: number) => {
      const key = `${f}|${turn}|${pxPerA.toFixed(3)}`;
      let spr = minis.get(key);
      if (!spr) {
        const m = mol(f), a = turn * Math.PI / 8, ca = Math.cos(a), sa = Math.sin(a), sc = pxPerA * dpr;
        const size = Math.ceil((m.ext + 2) * sc) + 2;
        spr = document.createElement("canvas");
        spr.width = spr.height = size;
        const g = spr.getContext("2d")!;
        for (const [e, ax, ay] of m.atoms) {
          g.fillStyle = mix(colors.current[`atom-${e}`] ?? [128, 128, 128], colors.current[`atom-${e}`] ?? [128, 128, 128], 1);
          g.beginPath(); g.arc(size / 2 + (ax * ca - ay * sa) * sc, size / 2 + (ax * sa + ay * ca) * sc, Math.max(.6 * dpr, atomRadius(e) * sc), 0, Math.PI * 2); g.fill();
        }
        minis.set(key, spr);
      }
      return spr;
    };

    const bigs = new Map<string, HTMLCanvasElement>();
    const bigSprite = (f: string, turn: number, pxPerA: number) => {
      const key = `${f}|${turn}|${pxPerA.toFixed(2)}`;
      let spr = bigs.get(key);
      if (!spr) {
        const m = mol(f), a = turn * Math.PI / 16, ca = Math.cos(a), sa = Math.sin(a), sc = pxPerA * dpr;
        const size = Math.ceil((m.ext + 2) * sc) + 4;
        spr = document.createElement("canvas");
        spr.width = spr.height = size;
        const g = spr.getContext("2d")!;
        for (const [e, ax, ay] of m.atoms) {
          const ball = sprite(e, atomRadius(e) * sc);
          g.drawImage(ball, size / 2 + (ax * ca - ay * sa) * sc - ball.width / 2, size / 2 + (ax * sa + ay * ca) * sc - ball.height / 2);
        }
        if (bigs.size > 600) bigs.clear();
        bigs.set(key, spr);
      }
      return spr;
    };

    const resize = () => {
      minis.clear(); bigs.clear();
      dpr = Math.min(2, window.devicePixelRatio || 1);
      const w = box.clientWidth, h = box.clientHeight;
      el.width = Math.max(1, Math.round(w * dpr)); el.height = Math.max(1, Math.round(h * dpr));
      el.style.width = `${w}px`; el.style.height = `${h}px`;
      lay.current = layout(w, h, worldRef.current.W, worldRef.current.H);
      draw();
    };

    const draw = () => {
      const w = worldRef.current, L = lay.current;
      if (!L) return;
      const c = colors.current, rgb = (k: string) => mix(c[k] ?? [0, 0, 0], c[k] ?? [0, 0, 0], 1);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, el.width, el.height);
      const k = scales(w);
      const shakeX = w.shake > 0 ? Math.sin(w.t * 1.3) * 3 : 0;
      const ox = L.ox + shakeX, oy = L.oy, mv = L.mv;
      const X = (x: number) => ox + x * mv, Y = (y: number) => oy + y * mv;
      const rl = lensRadius(w), [lx, ly] = lens.current;

      // Gefäß
      const vessel = (tx: (x: number) => number, ty: (y: number) => number, lw: number) => {
        ctx.strokeStyle = rgb("wall"); ctx.lineWidth = lw; ctx.lineJoin = "round"; ctx.lineCap = "round";
        ctx.setLineDash(w.state === "modell" ? [6, 5] : []);
        ctx.beginPath();
        if (w.state === "fluessig" && !w.closed) {
          ctx.moveTo(tx(0), ty(0)); ctx.lineTo(tx(0), ty(w.H)); ctx.lineTo(tx(w.W), ty(w.H)); ctx.lineTo(tx(w.W), ty(0));
        } else if (w.state !== "fest") {
          ctx.rect(tx(0), ty(0), tx(w.W) - tx(0), ty(w.H) - ty(0));
        }
        ctx.stroke();
        ctx.setLineDash([]);
        // Trennwände
        if (w.state !== "fest") for (const x of w.walls) { ctx.beginPath(); ctx.moveTo(tx(x), ty(0)); ctx.lineTo(tx(x), ty(w.H)); ctx.stroke(); }
      };
      const phase = (tx: (x: number) => number, ty: (y: number) => number, lw: number) => {
        if (!w.floats.length || !separatedFlow(w) || w.shake > 0) return;
        const y = boundaryY(w);
        ctx.strokeStyle = rgb("oil"); ctx.lineWidth = lw;
        ctx.beginPath(); ctx.moveTo(tx(0), ty(y)); ctx.lineTo(tx(w.W), ty(y)); ctx.stroke();
      };
      // Teilchen klein (Übersicht): flache Kreise, je Stoff und Drehung (16 Stufen) einmal vorgezeichnet
      const small = () => {
        for (const p of w.ps) {
          const turn = ((Math.round(p.a / (Math.PI / 8)) % 16) + 16) % 16;
          const spr = miniSprite(p.f, turn, k[p.f] * mv);
          ctx.drawImage(spr, X(p.x) - spr.width / 2 / dpr, Y(p.y) - spr.height / 2 / dpr, spr.width / dpr, spr.height / dpr);
        }
      };
      vessel(X, Y, 1.6);
      small();
      phase(X, Y, 2);

      // Lupe: Kreis im Gefäß, Linien zum großen Bild
      const lr = rl * mv;
      ctx.strokeStyle = rgb("muted"); ctx.lineWidth = 1;
      const [ax, ay] = [X(lx), Y(ly)];
      const ang = Math.atan2(L.zy - ay, L.zx - ax), perp = ang + Math.PI / 2;
      ctx.beginPath();
      for (const sgn of [1, -1]) {
        ctx.moveTo(ax + Math.cos(perp) * lr * sgn, ay + Math.sin(perp) * lr * sgn);
        ctx.lineTo(L.zx + Math.cos(perp) * L.R * sgn, L.zy + Math.sin(perp) * L.R * sgn);
      }
      ctx.stroke();
      ctx.strokeStyle = rgb("text"); ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.arc(ax, ay, lr, 0, Math.PI * 2); ctx.stroke();

      // Vergrößerung
      const mz = L.R / rl;
      const ZX = (x: number) => L.zx + (x - lx) * mz, ZY = (y: number) => L.zy + (y - ly) * mz;
      ctx.save();
      ctx.beginPath(); ctx.arc(L.zx, L.zy, L.R, 0, Math.PI * 2);
      ctx.fillStyle = rgb("surface"); ctx.fill();
      ctx.clip();
      vessel(ZX, ZY, 3);
      const seen = w.ps.filter(p => Math.abs(p.x - lx) < rl * 1.4 && Math.abs(p.y - ly) < rl * 1.4);
      // je Stoff und Drehung (32 Stufen) einmal vorgezeichnet: schattierte Kugeln von hinten nach vorn
      for (const p of seen) {
        const turn = ((Math.round(p.a / (Math.PI / 16)) % 32) + 32) % 32;
        const spr = bigSprite(p.f, turn, k[p.f] * mz);
        ctx.drawImage(spr, ZX(p.x) - spr.width / 2 / dpr, ZY(p.y) - spr.height / 2 / dpr, spr.width / dpr, spr.height / dpr);
      }
      phase(ZX, ZY, 3);
      ctx.restore();
      ctx.strokeStyle = rgb("text"); ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.arc(L.zx, L.zy, L.R, 0, Math.PI * 2); ctx.stroke();
    };
    drawRef.current = draw;

    readColors();
    resize();
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(resize) : null;
    ro?.observe(box);
    const loop = () => {
      frame++;
      raf = requestAnimationFrame(loop);
      if (!busyRef.current && frame % 2) return;
      if (frame % 30 === 0) readColors();
      stepFlow(worldRef.current);
      onFrameRef.current?.();
      draw();
    };
    if (motion) raf = requestAnimationFrame(loop);
    const theme = new MutationObserver(() => { readColors(); draw(); });
    theme.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme", "data-beamer"] });
    return () => { cancelAnimationFrame(raf); ro?.disconnect(); theme.disconnect(); probe.remove(); };
  }, [motion, world]);

  // ohne Bewegung: neu zeichnen, wenn sich der Zustand ändert
  useEffect(() => { drawRef.current(); }, [version]);

  const toWorld = (e: PointerEvent) => {
    const L = lay.current, r = canvas.current!.getBoundingClientRect();
    if (!L) return null;
    return { px: e.clientX - r.left, py: e.clientY - r.top, x: (e.clientX - r.left - L.ox) / L.mv, y: (e.clientY - r.top - L.oy) / L.mv };
  };
  const moveLens = (x: number, y: number) => {
    const w = worldRef.current;
    lens.current = [Math.max(0, Math.min(w.W, x)), Math.max(0, Math.min(w.H, y))];
    drawRef.current();
  };
  const down = (e: PointerEvent) => {
    const p = toWorld(e), L = lay.current;
    if (!p || !L) return;
    const w = worldRef.current;
    const inZoom = Math.hypot(p.px - L.zx, p.py - L.zy) < L.R;
    if (inZoom) {
      // Teilchen in der Lupe antippen → Stoff-Info
      const rl = lensRadius(w), [lx, ly] = lens.current;
      const wx = lx + (p.px - L.zx) / (L.R / rl), wy = ly + (p.py - L.zy) / (L.R / rl);
      let best = null as null | string, bd = Infinity;
      for (const q of w.ps) { const d = Math.hypot(q.x - wx, q.y - wy); if (d < bd) { bd = d; best = q.f; } }
      if (best && bd < rl * .35) onPick?.(best);
      return;
    }
    if (p.x >= -5 && p.x <= w.W + 5 && p.y >= -5 && p.y <= w.H + 5) {
      drag.current = true;
      (e.target as Element).setPointerCapture?.(e.pointerId);
      moveLens(p.x, p.y);
    }
  };
  const move = (e: PointerEvent) => { if (!drag.current) return; const p = toWorld(e); if (p) moveLens(p.x, p.y); };
  const up = () => { drag.current = false; };
  const key = (e: KeyboardEvent) => {
    const d = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[e.key];
    if (!d) return;
    e.preventDefault();
    const [x, y] = lens.current, step = lensRadius(worldRef.current) * .4;
    moveLens(x + d[0] * step, y + d[1] * step);
  };

  return (
    <div className="gm-flow" ref={wrap} tabIndex={0} role="img" aria-label={`${label}. Lupe mit den Pfeiltasten verschieben.`} onKeyDown={key}>
      <canvas ref={canvas} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} />
    </div>
  );
}
