// Kapitel 3 – räumliches Natriumchlorid-Gitter als echte 3D-Zeichnung in SVG: eigene kleine Projektion mit Perspektive (vorn größer),
// Kugeln mit Licht und Schatten, Tiefensortierung von hinten nach vorn (Kugeln, Anziehungslinien, Würfelkanten), hinten leichter Dunst.
// Drehbar: Ziehen mit Finger/Maus (Pointer Events), Pfeiltasten, Pos1 = Startansicht; zu Beginn eine langsame Drehung (stoppt beim Anfassen,
// nicht bei reduzierter Bewegung). Ansichten: „Nachbarn“ (Na⁺ mit seinen 6 Cl⁻) und „Gitterausschnitt“ (3 × 3 × 3 Ionen im Wechsel).
// Die Schicht des mittleren Na⁺ ist als zarte Fläche gezeichnet: was dahinter liegt, liegt hinter der Schicht („davor“/„dahinter“ bleibt beim Drehen lesbar).

import { useEffect, useId, useLayoutEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent } from "react";
import { IconButton, Segmented, useReducedMotion } from "@lern/ui";
import { tr } from "@lern/i18n";
import { CL, NA, ionText, rad, type Ion } from "./draw.tsx";
import "./lattice3d.css";

// ── Geometrie (Gittereinheit: Abstand Na⁺–Cl⁻ = 1) ─────────────────────────────────────────────────────────────

export type V3 = readonly [number, number, number];
export type View = "nb" | "cut";
/** Blickrichtung: Drehung um die senkrechte Achse (yaw), dann Neigung nach vorn (pitch, > 0 = von oben) – im Bogenmaß */
export interface Cam { yaw: number; pitch: number }
export interface Site { p: V3; ion: Ion; r: number }

const DEG = Math.PI / 180;
/** Abstand des Auges vom Mittelpunkt (Gittereinheiten): klein genug für deutliche Perspektive, groß genug gegen Verzerrung */
export const EYE = 6.5;
export const PITCH_MAX = 70 * DEG;
/** Startansicht: Schicht fast von vorn, leicht von oben und seitlich – alle 6 Cl⁻ getrennt sichtbar (Test) */
export const START: Cam = { yaw: 31 * DEG, pitch: 27 * DEG };
/** Radius des Cl⁻ in Gittereinheiten: „Nachbarn“ groß, im Gitterausschnitt kleiner (Abstände sichtbar); Na⁺ im Verhältnis 102 : 181 pm */
const R_CL: Record<View, number> = { nb: 0.3, cut: 0.23 };

const parity = (p: V3) => ((Math.round(p[0] + p[1] + p[2]) % 2) + 2) % 2;

/** Würfel aus n × n × n Ionen um den Ursprung (n ungerade), abwechselnd: Na⁺ wo x + y + z gerade (Mitte = Na⁺) */
export function lattice(n: number, rCl = R_CL.cut): Site[] {
  const h = (n - 1) / 2, out: Site[] = [];
  for (let z = -h; z <= h; z++) for (let y = -h; y <= h; y++) for (let x = -h; x <= h; x++) {
    const p: V3 = [x, y, z], ion = parity(p) === 0 ? NA : CL;
    out.push({ p, ion, r: rad(ion, CL, rCl) });
  }
  return out;
}

/** Ionen einer Ansicht: „Nachbarn“ = Na⁺ und seine 6 Cl⁻ (links, rechts, oben, unten, davor, dahinter); „Gitterausschnitt“ = 27 Ionen */
export function sites(view: View): Site[] {
  if (view === "cut") return lattice(3);
  const ps: V3[] = [[0, 0, 0], [-1, 0, 0], [1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];
  return ps.map((p, k) => { const ion = k ? CL : NA; return { p, ion, r: rad(ion, CL, R_CL.nb) }; });
}

const dist = (a: V3, b: V3) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
const mid = (a: V3, b: V3): V3 => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2];
const isCenter = (p: V3) => !p[0] && !p[1] && !p[2];

/** nächste Nachbarn (Abstand 1): Paare von Indizes */
export function neighbours(s: Site[]): [number, number][] {
  const out: [number, number][] = [];
  for (let i = 0; i < s.length; i++) for (let j = i + 1; j < s.length; j++) if (Math.abs(dist(s[i].p, s[j].p) - 1) < 1e-9) out.push([i, j]);
  return out;
}

/** gedachter Würfel um die Nachbarn (Kanten in 4 Stücke geteilt, damit die Tiefensortierung auch für lange Kanten stimmt) */
function cubeEdges(): [V3, V3][] {
  const out: [V3, V3][] = [];
  for (let ax = 0; ax < 3; ax++) for (const a of [-1, 1]) for (const b of [-1, 1]) for (let k = 0; k < 4; k++) {
    const P = (t: number): V3 => { const v = [0, 0, 0]; v[ax] = t; v[(ax + 1) % 3] = a; v[(ax + 2) % 3] = b; return v as unknown as V3; };
    out.push([P(-1 + k / 2), P(-0.5 + k / 2)]);
  }
  return out;
}

/** Schicht des mittleren Na⁺ (Ebene z = 0) als Quadrat */
const sheetHalf: Record<View, number> = { nb: 1, cut: 1.32 };

interface Geo { sites: Site[]; bonds: [number, number][]; edges: [V3, V3][]; sheet: V3[]; zmax: number }
const GEO = new Map<View, Geo>();
export function geo(view: View): Geo {
  let g = GEO.get(view);
  if (!g) {
    const s = sites(view), h = sheetHalf[view];
    g = {
      sites: s, bonds: neighbours(s), edges: view === "nb" ? cubeEdges() : [],
      sheet: [[-h, -h, 0], [h, -h, 0], [h, h, 0], [-h, h, 0]],
      zmax: Math.max(...s.map(x => Math.hypot(...x.p))),
    };
    GEO.set(view, g);
  }
  return g;
}

/** Drehung des Modells in Blickkoordinaten: x nach rechts, y nach oben, z zum Betrachter */
export function rotate(p: V3, c: Cam): V3 {
  const [x, y, z] = p, ca = Math.cos(c.yaw), sa = Math.sin(c.yaw), cb = Math.cos(c.pitch), sb = Math.sin(c.pitch);
  const x1 = x * ca + z * sa, z1 = -x * sa + z * ca;
  return [x1, y * cb - z1 * sb, y * sb + z1 * cb];
}

/** Zentralprojektion: s = Vergrößerung (vorn > 1, hinten < 1) */
export function project(p: V3, c: Cam) {
  const [x, y, z] = rotate(p, c), s = EYE / (EYE - z);
  return { x: x * s, y: y * s, z, s };
}

export interface BallItem { k: "ball"; key: string; i: number; ion: Ion; x: number; y: number; z: number; r: number; hot: boolean; fog: number }
export interface SegItem { k: "seg"; key: string; cls: "strong" | "lat" | "edge"; x1: number; y1: number; x2: number; y2: number; z: number; s: number; fog: number }
export interface SheetItem { k: "sheet"; key: string; pts: [number, number][]; z: number }
export type Item = BallItem | SegItem | SheetItem;

/** Alles, was zu zeichnen ist, in Zeichenreihenfolge (hinten → vorn), Koordinaten projiziert (Gittereinheiten, y nach oben).
 *  Reihenfolge: was hinter der Schicht liegt (nach Tiefe), dann die Schicht, dann der Rest (nach Tiefe) – wie bei einer Trennebene.
 *  Linien enden am Rand der Kugeln (im Bild), damit keine Linie über ihre eigene Kugel läuft. */
export function scene(view: View, c: Cam): Item[] {
  const g = geo(view);
  const toViewer = rotate([0, 0, 1], c)[2];   // > 0: die Seite z > 0 der Schicht liegt zum Betrachter
  const behind = (modelZ: number) => modelZ * toViewer < -1e-9;
  const fog = (z: number) => Math.min(1, Math.max(0, -z / g.zmax));
  const P = g.sites.map(s => project(s.p, c));
  const back: (Item & { z: number })[] = [], front: (Item & { z: number })[] = [];
  const put = (it: Item, modelZ: number) => (behind(modelZ) ? back : front).push(it);
  g.sites.forEach((s, i) => {
    const q = P[i];
    put({ k: "ball", key: `b${i}`, i, ion: s.ion, x: q.x, y: q.y, z: q.z, r: s.r * q.s, hot: isCenter(s.p), fog: fog(q.z) }, s.p[2]);
  });
  const seg = (key: string, cls: SegItem["cls"], a: { x: number; y: number }, b: { x: number; y: number }, ra: number, rb: number, m: V3) => {
    const dx = b.x - a.x, dy = b.y - a.y, L = Math.hypot(dx, dy);
    if (L <= ra + rb + 1e-3) return;   // Linie liegt ganz hinter bzw. in den Kugeln
    const ux = dx / L, uy = dy / L, q = project(m, c);
    put({ k: "seg", key, cls, x1: a.x + ux * ra, y1: a.y + uy * ra, x2: b.x - ux * rb, y2: b.y - uy * rb, z: q.z, s: q.s, fog: fog(q.z) }, m[2]);
  };
  for (const [i, j] of g.bonds) {
    const center = isCenter(g.sites[i].p) || isCenter(g.sites[j].p);
    seg(`l${i}-${j}`, center ? "strong" : "lat", P[i], P[j], g.sites[i].r * P[i].s, g.sites[j].r * P[j].s, mid(g.sites[i].p, g.sites[j].p));
  }
  g.edges.forEach(([a, b], k) => seg(`e${k}`, "edge", project(a, c), project(b, c), 0, 0, mid(a, b)));
  const byZ = (a: { z: number }, b: { z: number }) => a.z - b.z;
  const sheet: SheetItem = { k: "sheet", key: "sheet", pts: g.sheet.map(p => { const q = project(p, c); return [q.x, q.y]; }), z: 0 };
  return [...back.sort(byZ), sheet, ...front.sort(byZ)];
}

/** größte Ausdehnung im Bild über alle Blickrichtungen (einmal je Ansicht): das Modell bleibt beim Drehen gleich groß und ganz sichtbar */
const EXT = new Map<View, { ex: number; ey: number }>();
export function extent(view: View) {
  let e = EXT.get(view);
  if (!e) {
    const g = geo(view), pts: [V3, number][] = [...g.sites.map(s => [s.p, s.r] as [V3, number]), ...g.edges.flat().map(p => [p, 0] as [V3, number]),
      ...g.sheet.map(p => [p, 0] as [V3, number])];
    let ex = 0, ey = 0;
    for (let a = 0; a < 360; a += 3) for (let b = -PITCH_MAX / DEG; b <= PITCH_MAX / DEG + 1e-9; b += 2.5) {
      const c = { yaw: a * DEG, pitch: b * DEG };
      for (const [p, r] of pts) { const q = project(p, c); ex = Math.max(ex, Math.abs(q.x) + r * q.s); ey = Math.max(ey, Math.abs(q.y) + r * q.s); }
    }
    e = { ex: ex * 1.015, ey: ey * 1.015 };
    EXT.set(view, e);
  }
  return e;
}

export const clampPitch = (b: number) => Math.max(-PITCH_MAX, Math.min(PITCH_MAX, b));

// ── Darstellung und Bedienung ─────────────────────────────────────────────────────────────────────────────────

/** eine langsame Umdrehung zu Beginn (sanft an- und auslaufend), endet in der Startansicht */
const AUTO_MS = 20000;
const STEP = 15 * DEG;
/** Beschriftung immer aufrecht und unverzerrt: so groß, dass sie 80 % der Kugelbreite füllt, höchstens 26 px
 *  (Breite in em, gemessen mit Inter fett: „Na⁺“ 1,83, „Cl⁻“ 1,54) */
const labelSize = (r: number, cat: boolean) => Math.min(26, (1.6 * r) / (cat ? 1.83 : 1.54));

/** Räumliches Natriumchlorid-Gitter: drehbar, Ansicht „Nachbarn“ (6 Cl⁻ um ein Na⁺) oder „Gitterausschnitt“ (27 Ionen) */
export function Lattice3D() {
  const reduce = useReducedMotion();
  const [view, setView] = useState<View>("nb");
  const [cam, setCam] = useState<Cam>(START);
  const camRef = useRef(cam);
  const box = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<[number, number]>([320, 300]);
  const gid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  // Bewegung: Startdrehung (auto ≥ 0: Startzeit, 0 = noch nicht begonnen, −1 = aus), Ziel für Tasten, Schwung nach dem Loslassen
  const st = useRef({ raf: 0, last: 0, auto: 0, goal: null as Cam | null, vy: 0, vp: 0, drag: null as null | { id: number; x: number; y: number; t: number } });

  useLayoutEffect(() => {
    const el = box.current;
    if (!el) return;
    const m = () => setSize(s => (s[0] === el.clientWidth && s[1] === el.clientHeight ? s : [el.clientWidth, el.clientHeight]));
    m();
    const ro = new ResizeObserver(m);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const apply = (c: Cam) => { camRef.current = c; setCam(c); };
  const frame = (t: number) => {
    const a = st.current;
    a.raf = 0;
    const dt = a.last ? Math.min(0.05, (t - a.last) / 1000) : 1 / 60;
    a.last = t;
    let c = camRef.current, more = false;
    if (a.drag) { /* Ziehen: nur zeichnen */ }
    else if (a.auto >= 0) {
      if (a.auto === 0) a.auto = t;
      const u = Math.min(1, (t - a.auto) / AUTO_MS);
      c = { yaw: START.yaw + 2 * Math.PI * (u - Math.sin(2 * Math.PI * u) / (2 * Math.PI)), pitch: START.pitch };
      if (u >= 1) { a.auto = -1; c = START; } else more = true;
    } else if (a.goal) {
      const k = 1 - Math.exp(-dt * 12), g = a.goal;
      c = { yaw: c.yaw + (g.yaw - c.yaw) * k, pitch: c.pitch + (g.pitch - c.pitch) * k };
      if (Math.abs(g.yaw - c.yaw) + Math.abs(g.pitch - c.pitch) < 0.002) { c = g; a.goal = null; } else more = true;
    } else if (Math.abs(a.vy) + Math.abs(a.vp) > 0.05) {
      c = { yaw: c.yaw + a.vy * dt, pitch: clampPitch(c.pitch + a.vp * dt) };
      const f = Math.exp(-dt * 3.2);
      a.vy *= f; a.vp *= f; more = true;
    } else { a.vy = 0; a.vp = 0; }
    apply(c);
    if (more) a.raf = requestAnimationFrame(t2 => frameRef.current(t2));
    else a.last = 0;
  };
  const frameRef = useRef(frame);
  frameRef.current = frame;
  const kick = () => { const a = st.current; if (!a.raf) a.raf = requestAnimationFrame(t => frameRef.current(t)); };

  // Startdrehung nur ohne reduzierte Bewegung; beim Verlassen alles anhalten
  useEffect(() => {
    const a = st.current;
    if (reduce) { a.auto = -1; a.vy = 0; a.vp = 0; } else if (a.auto === 0) kick();
  }, [reduce]);
  useEffect(() => () => { const a = st.current; cancelAnimationFrame(a.raf); a.raf = 0; }, []);

  const stop = () => { const a = st.current; a.auto = -1; a.goal = null; a.vy = 0; a.vp = 0; };
  const goTo = (g: Cam) => {
    const a = st.current;
    a.auto = -1; a.vy = 0; a.vp = 0;
    if (reduce) { a.goal = null; apply(g); } else { a.goal = g; kick(); }
  };
  const reset = () => {
    const c = camRef.current, turns = Math.round((c.yaw - START.yaw) / (2 * Math.PI));
    goTo({ yaw: START.yaw + turns * 2 * Math.PI, pitch: START.pitch });
  };

  const down = (e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    const a = st.current;
    if (a.drag) return;   // zweiter Finger: nichts
    e.currentTarget.setPointerCapture?.(e.pointerId);
    e.currentTarget.classList.add("drag");
    stop();
    a.drag = { id: e.pointerId, x: e.clientX, y: e.clientY, t: e.timeStamp };
  };
  const move = (e: PointerEvent<HTMLDivElement>) => {
    const a = st.current, d = a.drag;
    if (!d || e.pointerId !== d.id) return;
    const k = Math.PI / Math.max(220, e.currentTarget.clientWidth);   // ganze Breite ziehen = halbe Umdrehung
    const dx = e.clientX - d.x, dy = e.clientY - d.y, dt = Math.max(8, e.timeStamp - d.t) / 1000, c = camRef.current;
    camRef.current = { yaw: c.yaw + dx * k, pitch: clampPitch(c.pitch + dy * k) };
    a.vy = 0.5 * a.vy + 0.5 * (dx * k) / dt;
    a.vp = 0.5 * a.vp + 0.5 * (dy * k) / dt;
    d.x = e.clientX; d.y = e.clientY; d.t = e.timeStamp;
    kick();
  };
  const up = (e: PointerEvent<HTMLDivElement>) => {
    const a = st.current, d = a.drag;
    if (!d || e.pointerId !== d.id) return;
    a.drag = null;
    e.currentTarget.classList.remove("drag");
    const cap = 7;
    if (reduce || e.type !== "pointerup" || e.timeStamp - d.t > 90) { a.vy = 0; a.vp = 0; }
    else { a.vy = Math.max(-cap, Math.min(cap, a.vy)); a.vp = Math.max(-cap, Math.min(cap, a.vp)); }
    kick();
  };
  const key = (e: KeyboardEvent<HTMLDivElement>) => {
    const dir: Record<string, [number, number]> = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
    if (e.key === "Home") { e.preventDefault(); reset(); return; }
    const m = dir[e.key];
    if (!m) return;
    e.preventDefault();
    const base = st.current.goal ?? camRef.current;
    goTo({ yaw: base.yaw + m[0] * STEP, pitch: clampPitch(base.pitch + m[1] * STEP) });
  };

  const [W, H] = size;
  const { ex, ey } = extent(view);
  const unit = Math.max(1, Math.min((W / 2 - 3) / ex, (H / 2 - 3) / ey));
  const X = (x: number) => W / 2 + x * unit, Y = (y: number) => H / 2 - y * unit;
  const items = scene(view, cam);
  // Symbol (Na⁺, Cl⁻) für alle Ionen einer Sorte, wenn es auch in der kleinsten möglichen Kugel (ganz hinten) lesbar ist – sonst das Ladungszeichen;
  // hängt nicht von der Drehung ab, nichts springt beim Drehen
  const g = geo(view), sMin = EYE / (EYE + g.zmax);
  const symbols = [NA, CL].map(ion => labelSize((g.sites.find(x => x.ion === ion)?.r ?? 0) * unit * sMin, ion.q > 0) >= 11);

  const label = view === "nb"
    ? tr("Natriumchlorid-Gitter im Raum: Ein Natrium-Ion Na⁺ ist von 6 Chlorid-Ionen Cl⁻ umgeben – 4 in seiner Schicht, 1 davor, 1 dahinter. Linien: Anziehung.",
      "Sodium chloride lattice in space: a sodium ion Na⁺ is surrounded by 6 chloride ions Cl⁻ – 4 in its layer, 1 in front, 1 behind. Lines: attraction.")
    : tr("Ausschnitt aus dem Natriumchlorid-Gitter: 27 Ionen in 3 Schichten, Na⁺ und Cl⁻ immer abwechselnd. Das Na⁺ in der Mitte hat 6 Cl⁻ als Nachbarn.",
      "Section of the sodium chloride lattice: 27 ions in 3 layers, Na⁺ and Cl⁻ always alternating. The Na⁺ in the middle has 6 Cl⁻ as neighbours.");

  return (
    <figure className={`l3 l3-${view}`}>
      <div ref={box} className="l3-stage" tabIndex={0} role="group"
        aria-label={tr("Gitter drehen: ziehen oder Pfeiltasten", "Turn the lattice: drag or arrow keys")}
        onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} onLostPointerCapture={up} onKeyDown={key}>
        <svg className="l3-svg" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label}>
          <defs>
            {/* Licht von links oben, zum Rand hin Schatten – gleich für alle Kugeln (über der Grundfarbe) */}
            <radialGradient id={`${gid}-lit`} cx="40%" cy="36%" r="66%" fx="33%" fy="27%">
              <stop offset="0" stopColor="#ffffff" stopOpacity=".72" />
              <stop offset=".4" stopColor="#ffffff" stopOpacity="0" />
              <stop offset=".66" stopColor="#000000" stopOpacity="0" />
              <stop offset="1" stopColor="#000000" stopOpacity=".34" />
            </radialGradient>
          </defs>
          {items.map(it => {
            if (it.k === "sheet") return <polygon key={it.key} className="l3-sheet" points={it.pts.map(([x, y]) => `${X(x)},${Y(y)}`).join(" ")} />;
            if (it.k === "seg") {
              const w = (it.cls === "strong" ? 3 : it.cls === "lat" ? 1.8 : 1.2) * it.s * Math.min(1.25, Math.max(0.7, unit / 80));
              return <line key={it.key} className={`l3-line ${it.cls}`} x1={X(it.x1)} y1={Y(it.y1)} x2={X(it.x2)} y2={Y(it.y2)}
                style={{ strokeWidth: w, "--f": it.fog } as CSSProperties} />;
            }
            const r = it.r * unit, cat = it.ion.q > 0, sym = symbols[cat ? 0 : 1];
            const t = sym ? ionText(it.ion) : cat ? "+" : "−", f = sym ? labelSize(r, cat) : Math.min(20, Math.max(10, r * 1.5));
            return (
              <g key={it.key} className={`l3-ion ${cat ? "cat" : "an"}${it.hot ? " hot" : ""}`} transform={`translate(${X(it.x)} ${Y(it.y)})`}>
                <circle className="l3-ball" r={r} />
                <circle className="l3-lit" r={r} fill={`url(#${gid}-lit)`} />
                {it.fog > 0.01 && <circle className="l3-fog" r={r} style={{ "--f": it.fog } as CSSProperties} />}
                {r >= 5 && <text className="l3-lbl" dy=".35em" style={{ fontSize: f }}>{t}</text>}
              </g>
            );
          })}
        </svg>
      </div>
      <div className="l3-ctl">
        <Segmented label={tr("Ansicht", "View")} value={view} onChange={v => setView(v)}
          options={[{ value: "nb", label: tr("Nachbarn", "Neighbours") }, { value: "cut", label: tr("Gitter\u00ADausschnitt", "Lattice section") }]} />
        <IconButton icon="reset" label={tr("Startansicht", "Start view")} onClick={reset} />
      </div>
      <figcaption>
        {view === "nb"
          ? tr("Natriumchlorid NaCl: Na⁺ in der Mitte, 4 Cl⁻ in der Schicht, 1 davor, 1 dahinter", "Sodium chloride NaCl: Na⁺ in the middle, 4 Cl⁻ in the layer, 1 in front, 1 behind")
          : tr("Modell mit kleineren Kugeln: 27 Ionen aus dem Gitter von Natriumchlorid NaCl", "Model with smaller balls: 27 ions from the lattice of sodium chloride NaCl")}
      </figcaption>
    </figure>
  );
}
