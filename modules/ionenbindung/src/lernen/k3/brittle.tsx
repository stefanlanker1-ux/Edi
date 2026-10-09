// Kapitel 3, „Hart und spröde“: vom Salzkristall (Stoff) zu den Ionen (Teilchen) und zurück. Ein Hammer schlägt seitlich gegen die obere Hälfte
// des Kristalls; eine Lupe auf der Spaltebene zeigt den Ausschnitt vergrößert (gleiche Bildsprache wie die Lupe beim Strom leiten): Die oberen
// Schichten gleiten weiter – halb verschoben halten die Gegen-Ionen sie schwächer, um einen ganzen Platz verschoben stehen gleiche Ladungen gegenüber
// und stoßen sich ab (rot gestrichelt, ↑↓). Dann bricht der Kristall entlang der glatten Ebene in würfelige Stücke, die auseinanderfliegen und liegen bleiben.
// Vorgemacht läuft die ganze Folge ab („Nochmal abspielen“); frei ändert jede Wahl das Bild sofort. Reduzierte Bewegung: gleich das ruhige Endbild.

import { useEffect, useId, useLayoutEffect, useRef, useState, type RefObject } from "react";
import { IconButton, Segmented, Tag, useReducedMotion, type GuideCtx } from "@lern/ui";
import { tr } from "@lern/i18n";
import { ModelFrame, useModel } from "../model.tsx";
import { Arrow, Ball, ionText, type Ion } from "./draw.tsx";
import "./brittle.css";

export const holds = () => tr("Anziehung", "attraction");
export const halfway = () => tr("halb verschoben", "half shifted");
export const repels = () => tr("Abstoßung", "repulsion");

/** Ergebnis für „Prüfen“: Verschiebung der oberen Schichten in Viertel-Plätzen (0 … 4) */
export const shiftResult = (s: number) => (s === 0 ? holds() : s === 4 ? repels() : halfway());
export const SHIFTS = ["0", "¼", "½", "¾", "1"];

/** Zustand des Bildes: z = Lupe aufgezoomt (0 … 1), a = Hammer ausgeholt (Grad, 0 = am Kristall), f = Verschiebung (Plätze), b = Bruch (0 … 1, Flugzeit) */
export interface Pose { z: number; a: number; f: number; b: number }
export const RAISED = 42;

/** Zielbild zu einer Wahl: ausgeholt (0), am Kristall (¼ … ¾), gebrochen (1 Platz – der Hammer schwingt zurück) */
export const goalOf = (s: number): Pose => ({ z: 1, a: s === 0 || s === 4 ? RAISED : 0, f: s / 4, b: s === 4 ? 1 : 0 });

const clamp = (v: number) => Math.max(0, Math.min(1, v));
const ease = (v: number) => v * v * (3 - 2 * v);

/** Ablauf der vorgemachten Folie (Sekunden): Lupe zoomt hinein, Hammer schlägt, Schichten gleiten (Halt bei ½), Abstoßung, Bruch */
export const DEMO_T = 6.2;
export function demoPose(t: number): Pose {
  const seg = (t0: number, t1: number) => clamp((t - t0) / (t1 - t0));
  const hit = seg(1.5, 1.9), back = ease(seg(4.3, 4.9));
  return {
    z: ease(seg(0.3, 1.3)),
    a: RAISED * (1 - hit * hit) + RAISED * back,
    f: 0.5 * ease(seg(1.9, 2.8)) + 0.5 * ease(seg(3.3, 4.1)),
    b: seg(4.3, 5.4),
  };
}

/** ein Schritt zum Ziel (frei bedientes Modell): erst wieder zusammensetzen, dann schlägt der Hammer und die Schichten gleiten,
 *  zuletzt bricht der Kristall und der Hammer schwingt zurück */
export function stepPose(p: Pose, g: Pose, dt: number): Pose {
  const to = (v: number, goal: number, rate: number) => (v < goal ? Math.min(goal, v + rate * dt) : Math.max(goal, v - rate * dt));
  let { a, f, b } = p;
  if (b > g.b) b = to(b, g.b, 2.5);
  else if (f !== g.f) {
    if (a > 0 && g.f > 0) a = to(a, 0, 160);
    else { f = to(f, g.f, 1.6); if (g.f === 0) a = to(a, g.a, 160); }
  } else if (b < g.b) { b = to(b, g.b, 0.9); a = to(a, g.a, 120); }
  else a = to(a, g.a, 160);
  return { z: to(p.z, g.z, 2), a, f, b };
}
const same = (p: Pose, g: Pose) => p.z === g.z && p.a === g.a && p.f === g.f && p.b === g.b;

// ── Makrobild: Kristall 52 × 52 (schräg nach hinten oben), Boden, Hammer links ─────────────────────────
const MW = 172, MH = 104;
const GROUND = 96, EDGE = 52, HALF = EDGE / 2, CX = 54;
const PLANE = GROUND - HALF;          // Spaltebene, waagrecht durch die Mitte (dort sitzt die Lupe)
const D = { x: 18, y: -12 };         // Tiefe
const HAM = { x: CX - 14, y: PLANE - HALF / 2 - 40 }; // Drehpunkt des Hammers (Hand)

/** Bruchstücke mit glatten Flächen: die untere Hälfte bleibt liegen, die obere zerfällt in zwei Würfel, die im Bogen auseinanderfliegen und daneben landen */
export interface Piece { x: number; y: number; w: number; dx: number; dy: number; arc: number; rot: number }
export const PIECES: Piece[] = [
  { x: CX, y: PLANE, w: EDGE, dx: 0, dy: 0, arc: 0, rot: 0 },
  { x: CX, y: PLANE - HALF, w: HALF, dx: -40, dy: HALF, arc: 18, rot: -28 },
  { x: CX + HALF, y: PLANE - HALF, w: HALF, dx: 49, dy: HALF, arc: 24, rot: 36 },
];
/** Lage eines Stücks bei Flugzeit b (0 = ganz, 1 = gelandet) */
export function piecePose(p: Piece, b: number) {
  if (!p.arc) return { x: p.x + p.dx * (1 - (1 - b) ** 3), y: p.y, rot: 0 };
  return { x: p.x + p.dx * b, y: p.y + p.dy * b * b - 4 * p.arc * b * (1 - b), rot: p.rot * Math.sin(Math.PI * b) };
}
/** Lupe auf der Spaltebene (Oberseite des liegen bleibenden Stücks, rechte Hälfte) */
const spotAt = (b: number) => ({ x: piecePose(PIECES[0], b).x + EDGE * 0.72, y: PLANE, r: 6 });

function Block({ x, y, w, h, rot = 0 }: { x: number; y: number; w: number; h: number; rot?: number }) {
  const cx = x + (w + D.x) / 2, cy = y + (h + D.y) / 2;
  return (
    <g className="k3-xtal" transform={rot ? `rotate(${rot.toFixed(1)} ${cx} ${cy})` : undefined}>
      <path className="hid" d={`M${x + D.x} ${y + D.y} V${y + h + D.y} H${x + w + D.x} M${x + D.x} ${y + h + D.y} L${x} ${y + h}`} />
      <path className="side" d={`M${x + w} ${y} L${x + w + D.x} ${y + D.y} V${y + h + D.y} L${x + w} ${y + h} Z`} />
      <path className="top" d={`M${x} ${y} L${x + D.x} ${y + D.y} H${x + w + D.x} L${x + w} ${y} Z`} />
      <rect className="front" x={x} y={y} width={w} height={h} />
    </g>
  );
}

function Hammer({ a }: { a: number }) {
  const hy = PLANE - HALF / 2;
  return (
    <g className="k3-hammer" transform={`rotate(${a.toFixed(1)} ${HAM.x} ${HAM.y})`}>
      <line className="handle" x1={HAM.x} y1={HAM.y} x2={HAM.x} y2={hy - 7} />
      <rect className="head" x={CX - 27} y={hy - 7} width={26} height={14} rx={2} />
    </g>
  );
}

/** Kristall auf dem Boden mit Hammer; ab b > 0 in Stücken (Reihenfolge so, dass vordere Flächen vorn liegen) */
function Macro({ a, b }: { a: number; b: number }) {
  const parts = PIECES.map((p, k) => ({ k, ...piecePose(p, b) }));
  const order = b > 0.5 ? [...parts].sort((p, q) => p.x - q.x) : parts;
  return (
    <g className="k3-macro">
      <line className="k3-ground" x1={4} y1={GROUND + 1} x2={MW - 4} y2={GROUND + 1} />
      {b <= 0 ? <Block x={CX} y={PLANE - HALF} w={EDGE} h={EDGE} /> : order.map(p => <Block key={p.k} x={p.x} y={p.y} w={PIECES[p.k].w} h={HALF} rot={p.rot} />)}
      <Hammer a={a} />
    </g>
  );
}

// ── Lupe: Ausschnitt an der Spaltebene, vergrößert ─────────────────────────────────────────────────────
const LR = 90, LU = 42;               // Radius der Lupe, Gitterabstand
const LW = 2 * LR + 28, LH = 2 * LR + 36, LCY = LR + 30; // darüber die Überschrift
const LEG = 32;                       // Legende: breit unter dem Kristall, hoch unter der Lupe
const GAP = 8;

const isCat = (i: number, j: number) => (((i + j) % 2) + 2) % 2 === 0;

/** Linien über die Spaltebene: jedes Ion der unteren Reihe der oberen Schichten zu den nächsten Ionen darunter (höchstens ½ Platz seitlich) –
 *  Anziehung bei Gegen-Ionen, Abstoßung bei gleicher Ladung; genau ½ verschoben: zu beiden (schwächer gehalten) */
export function crossPairs(f: number, from = -4, to = 3) {
  const out: { i: number; k: number; dx: number; att: boolean }[] = [];
  for (let i = from; i <= to; i++) for (let k = from; k <= to; k++) {
    const dx = k - (i + f);
    if (Math.abs(dx) <= 0.5 + 1e-6) out.push({ i, k, dx, att: isCat(i, 1) !== isCat(k, 2) });
  }
  return out;
}

function Close({ cat, an, f, b, clip }: { cat: Ion; an: Ion; f: number; b: number; clip: string }) {
  const rC = 11.5, rA = (rC * an.pm) / cat.pm;
  const e = 1 - (1 - b) ** 2, up = -30 * e, down = 6 * e;
  const y = (j: number) => (j - 1.5) * LU + (j < 2 ? up : down);
  const x = (i: number, j: number) => (i + (j < 2 ? f : 0)) * LU;
  const ion = (i: number, j: number) => (isCat(i, j) ? cat : an);
  const cols = (j: number) => Array.from({ length: j < 2 ? 8 : 7 }, (_, n) => n - (j < 2 ? 4 : 3));
  const W = 4.5 * LU;
  const rep = Math.abs(f - 1) < 1e-6 && b > 0.15;
  const ym = (y(1) + y(2)) / 2;
  return (
    <g>
      <circle className="k3-lens-bg" r={LR} />
      <g clipPath={`url(#${clip})`}>
        {/* Anziehung in den Schichten */}
        {[0, 1, 2, 3].map(j => <line key={j} className="k3-bond att" x1={-W} y1={y(j)} x2={W} y2={y(j)} />)}
        {[[0, 1], [2, 3]].map(([j0, j1]) => cols(j0).map(i => <line key={`${j0}${i}`} className="k3-bond att" x1={x(i, j0)} y1={y(j0)} x2={x(i, j1)} y2={y(j1)} />))}
        {/* über die Spaltebene */}
        {crossPairs(f).filter(p => Math.abs(x(p.i, 1)) < LR - 12).map(p => (
          <line key={`${p.i}|${p.k}`} className={`k3-bond ${p.att ? "att" : "rep"}${Math.abs(p.dx) < 1e-6 ? " strong" : ""}`}
            x1={x(p.i, 1)} y1={y(1)} x2={x(p.k, 2)} y2={y(2)} />
        ))}
        {[0, 1, 2, 3].map(j => cols(j).map(i => <Ball key={`${i}|${j}`} ion={ion(i, j)} x={x(i, j)} y={y(j)} r={isCat(i, j) ? rC : rA} sign />))}
        {rep && [-0.5, 0.5].map(k => (
          <g key={k} className="k3-force rep" opacity={clamp((b - 0.15) / 0.3)}>
            <Arrow x1={k * LU} y1={ym - 3} x2={k * LU} y2={ym - 15} />
            <Arrow x1={k * LU} y1={ym + 3} x2={k * LU} y2={ym + 15} />
          </g>
        ))}
      </g>
      {/* Spaltebene am Rand der Lupe */}
      {b <= 0 && [-1, 1].map(s => <line key={s} className="k3-plane" x1={s * (LR - 4)} y1={0} x2={s * (LR + 13)} y2={0} />)}
      <circle className="k3-lens" r={LR} />
    </g>
  );
}

/** gemeinsame Tangenten zweier Kreise (Hinweislinien von der Markierung auf dem Kristall zur Lupe) */
function tangents(x1: number, y1: number, r1: number, x2: number, y2: number, r2: number) {
  const dx = x2 - x1, dy = y2 - y1, d = Math.hypot(dx, dy);
  if (d <= Math.abs(r2 - r1) + 1) return [];
  const base = Math.atan2(dy, dx), a = Math.acos((r1 - r2) / d);
  return [base + a, base - a].map(g => ({ x1: x1 + r1 * Math.cos(g), y1: y1 + r1 * Math.sin(g), x2: x2 + r2 * Math.cos(g), y2: y2 + r2 * Math.sin(g) }));
}

/** Anordnung: Kristall links, Lupe rechts (breit, Legende unter dem Kristall) oder Lupe darunter (hoch, Legende unter der Lupe) */
export function layout(wide: boolean) {
  const W = wide ? MW + GAP + LW : Math.max(MW, LW);
  const H = wide ? Math.max(MH + LEG, LH) : MH + 4 + LH + LEG;
  const mx = wide ? 0 : (W - MW) / 2, my = wide ? (H - MH - LEG) / 2 : 0;
  const lx = wide ? MW + GAP + LW / 2 : W / 2, ly = wide ? (H - LH) / 2 + LCY : MH + 4 + LCY;
  return { W, H, mx, my, lx, ly, gx: wide ? mx + MW / 2 : lx, gy: wide ? my + MH + 18 : ly + LR + 22 };
}

/** breit oder hoch – je nachdem, was die Zeichnung größer zeigt */
function useWide(): [RefObject<HTMLDivElement | null>, boolean] {
  const ref = useRef<HTMLDivElement>(null);
  const [wide, setWide] = useState(true);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const m = () => {
      const w = el.clientWidth, h = el.clientHeight;
      if (!w || !h) return;
      const a = layout(true), b = layout(false);
      setWide(Math.min(w / a.W, h / a.H) >= Math.min(w / b.W, h / b.H));
    };
    m();
    const ro = new ResizeObserver(m);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, wide];
}

/** Bild zum Zustand `pose` */
function Scene({ cat, an, pose, label }: { cat: Ion; an: Ion; pose: Pose; label: string }) {
  const [ref, wide] = useWide();
  const clip = `k3b${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const L = layout(wide);
  const sp = spotAt(pose.b), sx = L.mx + sp.x, sy = L.my + sp.y;
  const ez = ease(pose.z), sc = sp.r / LR + (1 - sp.r / LR) * ez;
  const cx = sx + (L.lx - sx) * ez, cy = sy + (L.ly - sy) * ez;
  const tan = pose.z > 0.05 ? tangents(sx, sy, sp.r, cx, cy, LR * sc) : [];
  const shown = clamp((pose.z - 0.6) / 0.4);
  return (
    <div ref={ref} className="k3-fill">
      <svg className="k3-svg k3-brittle" viewBox={`0 0 ${L.W} ${L.H}`} role="img" aria-label={label}>
        <defs><clipPath id={clip}><circle r={LR - 1.5} /></clipPath></defs>
        <g transform={`translate(${L.mx} ${L.my})`}><Macro a={pose.a} b={pose.b} /></g>
        {tan.map((l, k) => <line key={k} className="k3-callout" x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} />)}
        <circle className="k3-spot" cx={sx} cy={sy} r={sp.r} />
        {pose.z > 0 && (
          <g transform={`translate(${cx.toFixed(2)} ${cy.toFixed(2)}) scale(${sc.toFixed(4)})`}>
            <Close cat={cat} an={an} f={pose.f} b={pose.b} clip={clip} />
            <text className="k3-note k3-halo" y={-LR - 10} opacity={shown}>{tr("Ausschnitt, vergrößert", "close-up, magnified")}</text>
          </g>
        )}
        <g className="k3-legend" opacity={shown}>
          {[cat, an].map((ion, k) => (
            <g key={k}>
              <Ball ion={ion} x={L.gx - 50 + k * 66} y={L.gy} r={ion.q > 0 ? 8 : 10} sign />
              <text className="k3-ltext" x={L.gx - 36 + k * 66} y={L.gy + 6}>{ionText(ion)}</text>
            </g>
          ))}
        </g>
      </svg>
    </div>
  );
}

/** Zustand des Bildes über die Zeit: vorgemacht = Ablauf (`run` startet neu), frei = gleitet zum Ziel der Wahl; reduzierte Bewegung = gleich das Ziel */
function usePose(demo: boolean, goal: Pose, still: boolean, run: number): Pose {
  const end = demo ? demoPose(DEMO_T) : goal;
  const [p, setP] = useState<Pose>(() => (demo && !still ? demoPose(0) : end));
  const cur = useRef(p);
  cur.current = p;
  const g = useRef(goal);
  g.current = goal;
  const key = demo ? `run${run}` : `${goal.a}|${goal.f}|${goal.b}`;
  useEffect(() => {
    if (still) { setP(demo ? demoPose(DEMO_T) : g.current); return; }
    let raf = 0;
    const t0 = performance.now();
    let last = t0;
    const tick = (now: number) => {
      if (demo) {
        const t = Math.min(DEMO_T, (now - t0) / 1000);
        setP(demoPose(t));
        if (t < DEMO_T) raf = requestAnimationFrame(tick);
        return;
      }
      const next = stepPose(cur.current, g.current, Math.min(0.05, (now - last) / 1000));
      last = now;
      cur.current = next;
      setP(next);
      if (!same(next, g.current)) raf = requestAnimationFrame(tick);
    };
    if (demo) setP(demoPose(0));
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [key, still]);
  return p;
}

/** Beschreibung für Vorlesen (Endzustand der Wahl) */
function describe(s: number, cat: Ion, an: Ion) {
  const c = ionText(cat), a = ionText(an);
  return s === 0
    ? tr(`Salzkristall mit Hammer und Lupe. Im Ausschnitt stehen sich ${c} und ${a} gegenüber und ziehen sich an.`, `Salt crystal with a hammer and a magnifier. In the close-up, ${c} and ${a} face each other and attract.`)
    : s === 4
      ? tr(`Die oberen Schichten sind um einen Platz verschoben: ${c} über ${c}, ${a} über ${a}. Sie stoßen sich ab, der Kristall ist in würfelige Stücke zerbrochen.`,
        `The upper layers are shifted by one place: ${c} above ${c}, ${a} above ${a}. They repel each other; the crystal has broken into cube-shaped pieces.`)
      : tr(`Der Hammer hat die oberen Schichten um ${SHIFTS[s]} Platz verschoben. Die Gegen-Ionen halten sie noch, aber schwächer.`,
        `The hammer has shifted the upper layers by ${SHIFTS[s]} place. The counter-ions still hold them, but more weakly.`);
}

/** Salzkristall, Hammer, Lupe: obere Schichten in Viertel-Plätzen verschieben – bei einem ganzen Platz stoßen sich gleiche Ladungen ab, der Kristall bricht */
export function Brittle({ c, cat, an, start, sol, demo }: { c: GuideCtx; cat: Ion; an: Ion; start: number; sol: number; demo?: boolean }) {
  const [s, set] = useModel(c, start, sol);
  const still = useReducedMotion();
  const [run, setRun] = useState(0);
  const pose = usePose(!!demo, goalOf(s), still, run);
  const shown = demo ? Math.round(pose.f * 4) : s;
  return (
    <ModelFrame c={c} className="k3-m"
      stage={<Scene cat={cat} an={an} pose={pose} label={describe(demo ? 4 : s, cat, an)} />}
      controls={demo
        ? <>
          <Tag>{tr(`um ${SHIFTS[shown]} Platz verschoben`, `shifted by ${SHIFTS[shown]} place`)}</Tag>
          {!still && <IconButton icon="reset" label={tr("Nochmal abspielen", "Play again")} onClick={() => setRun(r => r + 1)} />}
        </>
        : <fieldset className="k3-fs" disabled={c.solved}>
          <Segmented label={tr("Verschiebung der oberen Schichten in Plätzen", "Shift of the upper layers in places")} value={String(s)} onChange={v => set(Number(v))}
            options={SHIFTS.map((l, k) => ({ value: String(k), label: l }))} />
          <Tag>{tr("Platz", "place")}</Tag>
        </fieldset>}
      onCheck={() => c.pick(shiftResult(s))} />
  );
}

/** Salzkristall mit ausgeholtem Hammer (Bild zur Frage, ohne Lupe) */
export function CrystalHammer() {
  return (
    <svg className="k3-svg k3-static" viewBox={`0 ${GROUND - 92} ${MW} 98`} role="img"
      aria-label={tr("Ein Hammer holt gegen einen Salzkristall aus.", "A hammer swings at a salt crystal.")}>
      <Macro a={RAISED} b={0} />
    </svg>
  );
}
