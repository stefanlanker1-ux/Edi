// Kapitel 3, Teil 3–4: Temperatur-Schieber (Ionen schwingen stärker, ab der Schmelztemperatur verlassen sie ihre Plätze und bewegen sich
// ungeordnet weiter), Schicht verschieben (gleiche Ladungen gegenüber → Abstoßung → Bruch), Leitfähigkeit (Becherglas mit Stromkreis und Lupe:
// fest schwingen die Ionen nur, in Schmelze und Lösung wandern sie bei geschlossenem Schalter langsam zu ihrem Pol).
// Bewegung: kleine Teilchensimulation (sim.ts) im Takt des Bildschirms. Reduzierte Bewegung: ruhige Endbilder
// (fest: Gitter mit gestricheltem Schwingungsring; beweglich: ungeordnete Momentaufnahme).

import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type RefObject } from "react";
import { Button, Segmented, Tag, useReducedMotion, type GuideCtx } from "@lern/ui";
import { tr } from "@lern/i18n";
import { ModelFrame, useModel } from "../model.tsx";
import { Arrow, Ball, CL, MG, NA, O, bondCls, ionText, rad, type Ion } from "./draw.tsx";
import { advance, bondAlpha, grid, makeWorld, warm, type Drive, type Site, type World } from "./sim.ts";

const isCat = (i: number, j: number) => (i + j) % 2 === 0;

/** Ionen einer Simulation: Kugeln (Kation gold, Anion grün), im Gefäß dazu Linien zu nahen Gegen-Ionen (Anziehung, weich ein- und ausgeblendet).
 *  Bewegt wird ohne React-Neuzeichnen: jedes Bild schreibt nur die Lage der Kugeln und Linien. */
function SimIons({ w, drive, still, ion, bonds, sign }: {
  w: World; drive: Drive; still: boolean; ion: (q: number) => Ion; bonds?: boolean; sign?: boolean;
}) {
  const balls = useRef<(SVGGElement | null)[]>([]);
  const lines = useRef<(SVGLineElement | null)[]>([]);
  const drv = useRef(drive);
  drv.current = drive;
  const pairs = useMemo(() => {
    const out: [number, number][] = [];
    if (bonds) w.b.forEach((a, i) => w.b.forEach((b, j) => { if (j > i && a.q * b.q < 0) out.push([i, j]); }));
    return out;
  }, [w, bonds]);
  useEffect(() => {
    if (still) return;
    let raf = 0, last = performance.now();
    const shown = pairs.map(() => -1);
    const frame = (now: number) => {
      advance(w, drv.current, (now - last) / 1000);
      last = now;
      w.b.forEach((p, k) => balls.current[k]?.setAttribute("transform", `translate(${p.x.toFixed(1)} ${p.y.toFixed(1)})`));
      pairs.forEach(([i, j], k) => {
        const el = lines.current[k], A = w.b[i], B = w.b[j];
        if (!el) return;
        const a = bondAlpha(Math.hypot(B.x - A.x, B.y - A.y), w.u);
        if (a === 0 && shown[k] === 0) return;
        shown[k] = a;
        el.setAttribute("opacity", a.toFixed(2));
        if (a > 0) { el.setAttribute("x1", A.x.toFixed(1)); el.setAttribute("y1", A.y.toFixed(1)); el.setAttribute("x2", B.x.toFixed(1)); el.setAttribute("y2", B.y.toFixed(1)); }
      });
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [w, still, pairs]);
  return (
    <>
      {bonds && <g>{pairs.map(([i, j], k) => {
        const A = w.b[i], B = w.b[j];
        return <line key={k} ref={el => { lines.current[k] = el; }} className="k3-bond att" x1={A.x.toFixed(1)} y1={A.y.toFixed(1)} x2={B.x.toFixed(1)} y2={B.y.toFixed(1)}
          opacity={bondAlpha(Math.hypot(B.x - A.x, B.y - A.y), w.u).toFixed(2)} />;
      })}</g>}
      {w.b.map((p, k) => {
        const i = ion(p.q), t = sign ? (p.q > 0 ? "+" : "−") : ionText(i);
        const fs = sign ? p.r * 1.3 : Math.min(18, p.r * (t.length > 3 ? 0.78 : 0.95));
        return (
          <g key={k} ref={el => { balls.current[k] = el; }} className={`k3-ion ${p.q > 0 ? "cat" : "an"}`} transform={`translate(${p.x.toFixed(1)} ${p.y.toFixed(1)})`}>
            <circle r={p.r} />
            <text dy={sign ? ".34em" : ".36em"} style={{ fontSize: fs }}>{t}</text>
          </g>
        );
      })}
    </>
  );
}

/** Kelvin-Verhältnis zur Schmelztemperatur (Wärmebewegung der Schmelze) */
const heatOf = (t: number, tm: number) => (t + 273) / (tm + 273);

/** Kristall im Tiegel bei der Temperatur t: fest schwingen die Ionen um ihre Plätze (Weite wächst mit t), ab der Schmelztemperatur verlassen sie
 *  die Plätze und bewegen sich ungeordnet weiter – dicht, Gegen-Ionen nah beieinander (Linie = Anziehung); darunter kehren sie ins Gitter zurück */
function HeatSim({ cat, an, tm, t, cols, rows, seed }: { cat: Ion; an: Ion; tm: number; t: number; cols: number; rows: number; seed: number }) {
  const still = useReducedMotion();
  const u = 60;
  // kleine Kationen (Mg²⁺) nicht unleserlich: das Kation hat mindestens r = 17
  const R = (x: Ion) => rad(x, an, Math.max(26, (17 * an.pm) / cat.pm));
  const rC = R(cat), rA = R(an);
  // Innenraum des Tiegels: etwas breiter als der Kristall; oben eine unsichtbare Decke knapp über der Schmelze
  const x0 = 16, x1 = x0 + (cols + 0.6) * u, y1 = 16 + (rows + 0.65) * u, y0 = y1 - (rows + 0.45) * u;
  const sites = useMemo(() => grid(cols, rows, u, x0 + 0.8 * u, y1 - 0.55 * u - (rows - 1) * u), [cols, rows]);
  const free = t >= tm;
  const amp = 1 + 6 * Math.min(t, tm) / tm;
  // Schmelze: je heißer, desto schneller – erst ab der Schmelztemperatur, je 200 °C darüber einmal so schnell (NaCl bei 1000 °C doppelt), höchstens 2,5-mal
  const speed = free ? Math.min(2.5, 1 + (t - tm) / 200) : 1;
  const drive: Drive = { free, heat: heatOf(t, tm), amp, gravity: true, speed };
  const make = () => makeWorld(sites, q => (q > 0 ? rC : rA), u, [x0, y0, x1, y1], false, seed);
  // beim Öffnen schon geschmolzen (gelöste Folie): gleich als Schmelze zeigen
  const [live] = useState(() => (free ? warm(make(), drive, 4) : make()));
  const shot = useMemo(() => (still ? (free ? warm(make(), { ...drive, heat: 1.05 }, 5) : make()) : null), [still, free, sites]);
  const w = shot ?? live;
  const wall = x0 - 2, floor = y1 + 2, top = y0 - 14, rc = 10;
  return (
    <svg className="k3-svg" viewBox={`0 ${top - 6} ${x1 + 16} ${floor - top + 10}`} role="img"
      aria-label={free ? tr("Schmelze: Die Ionen haben keine festen Plätze mehr, bewegen sich ungeordnet und ziehen sich weiter an.", "Melt: the ions no longer have fixed places, move about randomly and still attract each other.")
        : tr("Fest: Die Ionen schwingen um ihre Plätze im Gitter.", "Solid: the ions vibrate around their places in the lattice.")}>
      <path className="k3-vessel" d={`M${wall - 9} ${top} H${wall} V${floor - rc} Q${wall} ${floor} ${wall + rc} ${floor} H${x1 + 2 - rc} Q${x1 + 2} ${floor} ${x1 + 2} ${floor - rc} V${top} H${x1 + 11}`} />
      {still && !free && sites.map((s, k) => <circle key={k} className="k3-range-ring" cx={s.x} cy={s.y} r={(s.q > 0 ? rC : rA) + amp + 1.5} />)}
      <SimIons w={w} drive={drive} still={still} ion={q => (q > 0 ? cat : an)} bonds />
    </svg>
  );
}

function TempControl({ c, t, set, max, step }: { c: GuideCtx; t: number; set: (t: number) => void; max: number; step: number }) {
  return (
    <label className="k3-temp">
      <span>{tr("Temperatur", "Temperature")}</span>
      <input type="range" min={0} max={max} step={step} value={t} disabled={c.solved} onChange={e => set(Number(e.target.value))} />
      <output>{t} °C</output>
    </label>
  );
}

export const molten = () => tr("geschmolzen", "molten");
export const solid = () => tr("fest", "solid");

/** Kristall im Tiegel mit Temperatur-Schieber */
export function ThermoLattice({ c, cat, an, tm, max, step, start, sol, demo }: {
  c: GuideCtx; cat: Ion; an: Ion; tm: number; max: number; step: number; start: number; sol: number; demo?: boolean;
}) {
  const [t, set] = useModel(c, start, sol);
  return (
    <ModelFrame c={c} className="k3-m"
      stage={<HeatSim cat={cat} an={an} tm={tm} t={t} cols={5} rows={4} seed={3} />}
      controls={demo ? <Tag>{tr("Temperatur", "Temperature")} {t} °C</Tag> : <TempControl c={c} t={t} set={set} max={max} step={step} />}
      onCheck={() => c.pick(t >= tm ? molten() : solid())} />
  );
}

export const naclOnly = () => tr("NaCl flüssig, MgO fest", "NaCl liquid, MgO solid");
export const bothSolid = () => tr("beide fest", "both solid");
export const bothLiquid = () => tr("beide flüssig", "both liquid");

/** Natriumchlorid und Magnesiumoxid nebeneinander, eine Temperatur für beide */
export function ThermoPair({ c, start, sol }: { c: GuideCtx; start: number; sol: number }) {
  const [t, set] = useModel(c, start, sol);
  return (
    <ModelFrame c={c} className="k3-m"
      stage={
        <div className="k3-pair">
          <figure><HeatSim cat={NA} an={CL} tm={801} t={t} cols={4} rows={3} seed={5} /><figcaption>{tr("Natriumchlorid NaCl", "sodium chloride NaCl")}</figcaption></figure>
          <figure><HeatSim cat={MG} an={O} tm={2852} t={t} cols={4} rows={3} seed={9} /><figcaption>{tr("Magnesiumoxid MgO", "magnesium oxide MgO")}</figcaption></figure>
        </div>
      }
      controls={<TempControl c={c} t={t} set={set} max={3000} step={10} />}
      onCheck={() => c.pick(t < 801 ? bothSolid() : t < 2852 ? naclOnly() : bothLiquid())} />
  );
}

export const holds = () => tr("Anziehung", "attraction");
export const halfway = () => tr("halb verschoben", "half shifted");
export const repels = () => tr("Abstoßung", "repulsion");

/** Obere Schichten verschieben (in Viertel-Plätzen): gleiche Ladungen gegenüber → Abstoßung → der Kristall bricht */
export function ShiftLayers({ c, cat, an, start, sol, demo }: { c: GuideCtx; cat: Ion; an: Ion; start: number; sol: number; demo?: boolean }) {
  const [s, set] = useModel(c, start, sol);
  const cols = 6, rows = 4, u = 62, pad = 34, W = cols * u + 2 * pad, H = (rows - 1) * u + 2 * pad + 14;
  const f = s / 4, broken = s === 4;
  const at = (i: number) => pad + i * u, yt = (j: number) => pad + 14 + j * u;
  const R = (x: Ion) => rad(x, an, Math.max(24, (17 * an.pm) / cat.pm));
  const ion = (i: number, j: number) => (isCat(i, j) ? cat : an);
  const lift = broken ? -16 : 0;
  // Kräfte über die Trennlinie: Zeile 1 (oben, verschoben) zu Zeile 2 (unten, fest)
  const cross: { x1: number; x2: number; k: string }[] = [];
  for (let i = 0; i < cols; i++) {
    const xt = at(i) + f * u;
    if (!broken) cross.push({ x1: xt, x2: at(i), k: "att" });
    if (f >= 0.5 && i + 1 < cols) cross.push({ x1: xt, x2: at(i + 1), k: bondCls(ion(i, 1), ion(i + 1, 2)) });
  }
  const label = s === 0 ? tr("Gegen-Ionen gegenüber", "counter-ions opposite") : broken ? tr("gleiche Ladungen gegenüber", "like charges opposite") : tr("verschoben", "shifted");
  return (
    <ModelFrame c={c} className="k3-m"
      stage={
        <svg className="k3-svg" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label}>
          {/* untere Schichten (fest) */}
          <g>
            {[2, 3].map(j => <line key={j} className="k3-bond att" x1={at(0) - 20} y1={yt(j)} x2={at(cols - 1) + 20} y2={yt(j)} />)}
            {Array.from({ length: cols }, (_, i) => <line key={i} className="k3-bond att" x1={at(i)} y1={yt(2)} x2={at(i)} y2={yt(3)} />)}
          </g>
          <g key={s} className="k3-fade">
            {cross.map((l, k) => <line key={k} className={`k3-bond ${l.k}`} x1={l.x1} y1={yt(1) + lift} x2={l.x2} y2={yt(2)} />)}
            {broken && <path className="k3-crack" d={`M${at(0) - 24} ${(yt(1) + yt(2)) / 2 - 8} l18 -6 l16 8 l20 -8 l18 7 l22 -6 l18 6 l20 -7 l22 8 l18 -6 l20 6 l22 -7 l18 6 l20 -6 l16 6`} />}
          </g>
          {[2, 3].map(j => Array.from({ length: cols }, (_, i) => <Ball key={`${i}-${j}`} ion={ion(i, j)} x={at(i)} y={yt(j)} r={R(ion(i, j))} />))}
          {/* obere Schichten (verschiebbar) */}
          <g className="k3-slide" style={{ transform: `translate(${f * u}px, ${lift}px)` }}>
            {[0, 1].map(j => <line key={j} className="k3-bond att" x1={at(0) - 20} y1={yt(j)} x2={at(cols - 1) + 20} y2={yt(j)} />)}
            {Array.from({ length: cols }, (_, i) => <line key={i} className="k3-bond att" x1={at(i)} y1={yt(0)} x2={at(i)} y2={yt(1)} />)}
            {[0, 1].map(j => Array.from({ length: cols }, (_, i) => <Ball key={`${i}-${j}`} ion={ion(i, j)} x={at(i)} y={yt(j)} r={R(ion(i, j))} />))}
            <Arrow x1={at(cols - 1) - 50} y1={yt(0) - 30} x2={at(cols - 1) + 6} y2={yt(0) - 30} cls="push" />
          </g>
        </svg>
      }
      controls={demo ? <Tag>{tr(`um ${["0", "¼", "½", "¾", "1"][s]} Platz verschoben`, `shifted by ${["0", "¼", "½", "¾", "1"][s]} place`)}</Tag> :
        <fieldset className="k3-fs" disabled={c.solved}>
          <Segmented label={tr("Verschiebung der oberen Schichten in Plätzen", "Shift of the upper layers in places")} value={String(s)} onChange={v => set(Number(v))}
            options={["0", "¼", "½", "¾", "1"].map((l, k) => ({ value: String(k), label: l }))} />
          <Tag>{tr("Platz", "place")}</Tag>
        </fieldset>
      }
      onCheck={() => c.pick(s === 0 ? holds() : broken ? repels() : halfway())} />
  );
}


export type Zustand = "fest" | "schmelze" | "loesung";
export const lampOn = () => tr("Lampe an", "lamp on");
export const lampOff = () => tr("Lampe aus", "lamp off");
export const circuitOpen = () => tr("Schalter offen", "switch open");
export const leftPlus = () => tr("links Pluspol", "positive pole on the left");
export const leftMinus = () => tr("links Minuspol", "negative pole on the left");

export interface Leit { z: Zustand; on: boolean; minusLeft: boolean }

// Becherglas (links bzw. oben) und Lupe (rechts bzw. unten): Maße in Bild-Einheiten
const BW = 236, BH = 262;            // Becherglas mit Stromkreis
const EL = 58, ER = 178;             // Elektroden (Mitte)
const SURF = 132, FLOOR = 256;       // Oberfläche der Flüssigkeit, Boden
const SPOT = { x: (EL + ER) / 2, y: 222, r: 11 }; // Ausschnitt in der Mitte zwischen den Elektroden
const LR = 96;                       // Radius der Lupe
const LU = 40, LHALF = 3 * LU;       // Gitterabstand und halbe Breite des Ausschnitts (größer als die Lupe: was hinausgleitet, kommt außerhalb des Sichtbaren wieder herein)
const LENS_X = 124, LENS_TOP = 122, LENS_BOTTOM = 150; // Platz der Lupe samt Polen, Überschrift und Legende um ihre Mitte

/** Breite oder hohe Anordnung – je nachdem, was die Zeichnung größer zeigt */
function useWide(): [RefObject<HTMLDivElement | null>, boolean] {
  const ref = useRef<HTMLDivElement>(null);
  const [wide, setWide] = useState(true);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const m = () => {
      const w = el.clientWidth, h = el.clientHeight;
      if (!w || !h) return;
      const sw = Math.min(w / (BW + 8 + 2 * LENS_X), h / (LENS_TOP + LENS_BOTTOM + 4));
      const st = Math.min(w / Math.max(BW, 2 * LENS_X), h / (BH + 10 + LENS_TOP + LENS_BOTTOM));
      setWide(sw >= st);
    };
    m();
    const ro = new ResizeObserver(m);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, wide];
}

/** gemeinsame Tangenten zweier Kreise (Linien von der kleinen Markierung im Glas zur Lupe) */
function tangents(x1: number, y1: number, r1: number, x2: number, y2: number, r2: number) {
  const dx = x2 - x1, dy = y2 - y1, d = Math.hypot(dx, dy), base = Math.atan2(dy, dx), a = Math.acos((r1 - r2) / d);
  return [base + a, base - a].map(g => ({ x1: x1 + r1 * Math.cos(g), y1: y1 + r1 * Math.sin(g), x2: x2 + r2 * Math.cos(g), y2: y2 + r2 * Math.sin(g) }));
}

/** Kochsalz-Körner im Becherglas (fest) */
const GRAINS = (() => {
  const out: { x: number; y: number; a: number; s: number }[] = [];
  const rows = [[26, 210, 13], [32, 204, 12], [40, 196, 10], [52, 186, 8]];
  rows.forEach(([x0, x1, n], j) => {
    for (let k = 0; k < n; k++) {
      const v = Math.sin((j * 7 + k) * 12.9898) * 43758.5453, f = v - Math.floor(v);
      out.push({ x: x0 + ((x1 - x0) * (k + 0.5)) / n, y: FLOOR - 9 - j * 14, a: (f - 0.5) * 34, s: 13 - j * 0.5 });
    }
  });
  return out;
})();

/** Lupe: Ausschnitt aus der Mitte – Ionen schwingen (fest) oder bewegen sich ungeordnet (Schmelze, Lösung); mit Strom wandern sie zusätzlich langsam:
 *  Kationen zum Minuspol, Anionen zum Pluspol (Pole am Rand der Lupe angedeutet, Richtung in der Legende) */
function Lens({ z, flow, minusLeft, still }: { z: Zustand; flow: boolean; minusLeft: boolean; still: boolean }) {
  const clip = `k3l${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const rA = 17.5, rC = rad(NA, CL, rA);
  const radius = (q: number) => (q > 0 ? rC : rA);
  const box: World["box"] = [-LHALF, -LHALF, LHALF, LHALF];
  // fest: Gitter, das den Ausschnitt lückenlos fortsetzt (6 × 6 Plätze)
  const sites = useMemo(() => grid(6, 6, LU, -LHALF + LU / 2, -LHALF + LU / 2), []);
  // Schmelze: etwas mehr Platz je Ion als im Gitter (28 statt 36 Ionen) – sonst klemmen die Ionen und können nicht aneinander vorbeigleiten
  const melted = useMemo(() => {
    const c = sites.filter(s => s.q > 0), a = sites.filter(s => s.q < 0);
    const keep = (l: Site[]) => l.filter((_, i) => i % 9 !== 4 && i % 9 !== 8);
    return [...keep(c), ...keep(a)];
  }, [sites]);
  // gelöst: wenige Ionen weit auseinander (dazwischen Wasser)
  const loose = useMemo<Site[]>(() => Array.from({ length: 12 }, (_, k) => {
    const i = k % 4, j = Math.floor(k / 4);
    return { x: -LHALF + 30 + i * 60 + (j % 2) * 26, y: -LHALF + 40 + j * 80, q: (i + j) % 2 === 0 ? 1 : -1 };
  }), []);
  // Strom: Kationen wandern zum Minuspol, Anionen zum Pluspol – deutlich sichtbar, aber gemischt und mit Wärmebewegung
  // (Wanderung mit Spannung: Schmelze 1,19 · LU, Lösung 0,51 · LU je Sekunde – 70 % schneller als die erste Fassung)
  const dir = minusLeft ? -1 : 1, FLOW = 1.7;
  const solidDrive: Drive = { free: false, heat: 0.3, amp: 1.6 };
  const meltDrive: Drive = { free: true, heat: 1.05, amp: 0, cohesion: 0.5, like: 1.15, drift: flow ? dir * FLOW * 0.7 * LU : 0 };
  const solDrive: Drive = { free: true, heat: 0.75, amp: 0, apart: true, drift: flow ? dir * FLOW * 0.3 * LU : 0 };
  const loosen = (list: Site[], seed: number, d: Drive) => { const w = makeWorld(list, radius, LU, box, true, seed); w.m = 1; w.free = true; return warm(w, { ...d, drift: 0 }, 4); };
  const make = (k: Zustand) => (k === "fest" ? makeWorld(sites, radius, LU, box, true, 11) : k === "schmelze" ? loosen(melted, 12, meltDrive) : loosen(loose, 13, solDrive));
  // jede Probe behält ihre Teilchen, solange die Folie offen ist (Wechsel = andere Probe, kurz eingeblendet)
  const worlds = useRef<Partial<Record<Zustand, World>>>({});
  const first = useRef(z); // beim Öffnen ohne Einblenden
  const live = (worlds.current[z] ??= make(z));
  const shot = useMemo(() => (still ? make(z) : null), [still, z]);
  const w = shot ?? live;
  const water = z === "loesung";
  const drive = z === "fest" ? solidDrive : z === "schmelze" ? meltDrive : solDrive;
  const ion = (q: number) => (q > 0 ? NA : CL);
  const rowY = [LR + 30, LR + 56];
  return (
    <g className="k3-lensg">
      <clipPath id={clip}><circle r={LR - 1.5} /></clipPath>
      <circle className={`k3-lens-bg${water ? " water" : ""}`} r={LR} />
      <g clipPath={`url(#${clip})`}>
        <g key={z} className={z !== first.current ? "k3-fade" : undefined}>
          <SimIons w={w} drive={drive} still={still} ion={ion} sign />
        </g>
      </g>
      <circle className="k3-lens" r={LR} />
      <text className="k3-note k3-halo" y={-LR - 10}>{water ? tr("Ausschnitt: gelöst in Wasser H₂O", "close-up: dissolved in water H₂O") : tr("Ausschnitt, vergrößert", "close-up, magnified")}</text>
      <text className="k3-lpole" x={-LR - 14} y={8}>{minusLeft ? "−" : "+"}</text>
      <text className="k3-lpole" x={LR + 14} y={8}>{minusLeft ? "+" : "−"}</text>
      {[1, -1].map((q, k) => {
        const toLeft = (q > 0) === minusLeft, y = rowY[k];
        return (
          <g key={q} className="k3-legend">
            <g className={`k3-ion ${q > 0 ? "cat" : "an"}`} transform={`translate(-96 ${y - 5})`}>
              <circle r={q > 0 ? 6 : 8} /><text dy=".34em" style={{ fontSize: 10 }}>{q > 0 ? "+" : "−"}</text>
            </g>
            <text className="k3-ltext" x={-82} y={y}>{q > 0 ? "Na⁺" : "Cl⁻"}</text>
            {flow && <>
              <Arrow x1={toLeft ? -16 : -46} y1={y - 5} x2={toLeft ? -46 : -16} y2={y - 5} cls={`tiny ${q > 0 ? "cat" : "an"}`} />
              <text className="k3-ltext" x={-8} y={y}>{q > 0 ? tr("zum Minuspol", "to negative pole") : tr("zum Pluspol", "to positive pole")}</text>
            </>}
          </g>
        );
      })}
    </g>
  );
}

/** Leitfähigkeit: Becherglas mit zwei Elektroden, Batterie, Schalter, Lampe; die Lupe zeigt die Ionen. Beweglich (Schmelze, Lösung) + Schalter zu →
 *  Kationen wandern langsam zum Minuspol, Anionen zum Pluspol, die Lampe leuchtet. Was an den Elektroden passiert, bleibt offen (später). */
export function Conduct({ c, start, sol, states = ["fest", "schmelze", "loesung"], switchable = false, poles = false, result, demo }: {
  c: GuideCtx; start: Leit; sol: Leit; states?: Zustand[]; switchable?: boolean; poles?: boolean; demo?: boolean;
  /** Ergebnis des gebauten Zustands (Text für „Prüfen“) */
  result: (s: Leit) => string;
}) {
  const [s, set] = useModel<Leit>(c, start, sol);
  const still = useReducedMotion();
  const [ref, wide] = useWide();
  const mobile = s.z !== "fest", flow = mobile && s.on;
  const minusX = s.minusLeft ? EL : ER, plusX = s.minusLeft ? ER : EL;
  const zName = (z: Zustand) => (z === "fest" ? tr("fest", "solid") : z === "schmelze" ? tr("Schmelze", "melt") : tr("Lösung", "solution"));
  // Anordnung: Becherglas links, Lupe rechts (breit) bzw. Lupe darunter (hoch)
  const W = wide ? BW + 8 + 2 * LENS_X : Math.max(BW, 2 * LENS_X);
  const H = wide ? LENS_TOP + LENS_BOTTOM + 4 : BH + 10 + LENS_TOP + LENS_BOTTOM;
  const bx = wide ? 0 : (W - BW) / 2, by = wide ? (H - BH) / 2 : 0;
  const lx = wide ? BW + 8 + LENS_X : W / 2, ly = wide ? LENS_TOP + 2 : BH + 10 + LENS_TOP;
  const tan = tangents(bx + SPOT.x, by + SPOT.y, SPOT.r, lx, ly, LR);
  const battL = 84, battR = 92, sw0 = 112, sw1 = 136, lampX = 158, wireY = 26;
  const plate = (x: number, minus: boolean) => minus
    ? <line key={x} className="k3-batt thick" x1={x} y1={wireY - 7} x2={x} y2={wireY + 7} />
    : <line key={x} className="k3-batt" x1={x} y1={wireY - 15} x2={x} y2={wireY + 15} />;
  const drift = flow
    ? tr(` Im Ausschnitt wandern die Na⁺ langsam nach ${s.minusLeft ? "links" : "rechts"} zum Minuspol, die Cl⁻ nach ${s.minusLeft ? "rechts" : "links"} zum Pluspol.`,
      ` In the close-up, Na⁺ slowly moves ${s.minusLeft ? "left" : "right"} to the negative pole, Cl⁻ ${s.minusLeft ? "right" : "left"} to the positive pole.`)
    : mobile ? tr(" Im Ausschnitt bewegen sich die Ionen ungeordnet.", " In the close-up, the ions move about randomly.")
      : tr(" Im Ausschnitt schwingen die Ionen nur um ihre Plätze.", " In the close-up, the ions only vibrate around their places.");
  return (
    <ModelFrame c={c} className="k3-m"
      stage={
        <div ref={ref} className="k3-fill">
          <svg className="k3-svg k3-cond" viewBox={`0 0 ${W} ${H}`} role="img"
            aria-label={tr(`Natriumchlorid ${zName(s.z)}, Schalter ${s.on ? "zu" : "offen"}, Lampe ${flow ? "an" : "aus"}.`, `Sodium chloride ${zName(s.z)}, switch ${s.on ? "closed" : "open"}, lamp ${flow ? "on" : "off"}.`) + drift}>
            <g transform={`translate(${bx} ${by})`}>
              {/* Stromkreis: Elektroden → Drähte → Batterie (langer Strich = Pluspol, kurzer dicker = Minuspol), Schalter, Lampe */}
              <path className="k3-wire" d={`M${EL} 92 V${wireY} H${battL} M${battR} ${wireY} H${sw0} M${sw1} ${wireY} H${lampX - 11} M${lampX + 11} ${wireY} H${ER} V92`} />
              {plate(battL, s.minusLeft)}{plate(battR, !s.minusLeft)}
              <line className="k3-wire" x1={sw0} y1={wireY} x2={s.on ? sw1 : sw1 - 4} y2={s.on ? wireY : wireY - 15} />
              <circle className="k3-dot" cx={sw0} cy={wireY} r={3} /><circle className="k3-dot" cx={sw1} cy={wireY} r={3} />
              <g className={`k3-lamp${flow ? " on" : ""}`} transform={`translate(${lampX} ${wireY})`}>
                <circle r={11} />
                <path d="M-7.8 -7.8 L7.8 7.8 M7.8 -7.8 L-7.8 7.8" />
                {flow && <g className="k3-rays">{[0, 1, 2, 3, 4, 5, 6, 7].map(k => { const g = ((k + 0.5) * Math.PI) / 4; return <line key={k} x1={Math.cos(g) * 15} y1={Math.sin(g) * 15} x2={Math.cos(g) * 21} y2={Math.sin(g) * 21} />; })}</g>}
              </g>
              {/* Becherglas mit Inhalt */}
              {s.z === "fest"
                ? <g className="k3-grains">{GRAINS.map((g, k) => <rect key={k} x={-g.s / 2} y={-g.s / 2} width={g.s} height={g.s} transform={`translate(${g.x} ${g.y}) rotate(${g.a})`} />)}</g>
                : <path className={`k3-liquid${s.z === "loesung" ? " water" : ""}`} d={`M20 ${SURF} q12.5 -5 25 0 t25 0 t25 0 t25 0 t25 0 t25 0 t25 0 t21 0`} />}
              <path className="k3-beaker" d={`M14 98 Q20 98 20 106 V${FLOOR - 6} Q20 ${FLOOR} 26 ${FLOOR} H${BW - 26} Q${BW - 20} ${FLOOR} ${BW - 20} ${FLOOR - 6} V106 Q${BW - 20} 98 ${BW - 14} 98`} />
              {[EL, ER].map(x => <rect key={x} className="k3-electrode" x={x - 5} y={92} width={10} height={152} />)}
              <text className="k3-pole" x={minusX + (minusX === EL ? -16 : 16)} y={88}>−</text>
              <text className="k3-pole" x={plusX + (plusX === EL ? -16 : 16)} y={88}>+</text>
              <text className="k3-note" x={SPOT.x} y={118}>{s.z === "schmelze" ? "801 °C" : s.z === "loesung" ? tr("in Wasser H₂O", "in water H₂O") : ""}</text>
              <circle className="k3-spot" cx={SPOT.x} cy={SPOT.y} r={SPOT.r} />
            </g>
            {/* Hinweislinien vom Ausschnitt im Glas zur Lupe */}
            {tan.map((l, k) => <line key={k} className="k3-callout" x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} />)}
            <g transform={`translate(${lx} ${ly})`}>
              <Lens z={s.z} flow={flow} minusLeft={s.minusLeft} still={still} />
            </g>
          </svg>
        </div>
      }
      controls={demo ? <Tag>{tr("Natriumchlorid NaCl", "sodium chloride NaCl")}: {zName(s.z)}</Tag> :
        <fieldset className="k3-fs" disabled={c.solved}>
          {states.length > 1 && <Segmented label={tr("Zustand des Salzes", "State of the salt")} value={s.z} onChange={z => set({ ...s, z })}
            options={states.map(z => ({ value: z, label: zName(z) }))} />}
          {switchable && <Button variant={s.on ? "primary" : "soft"} onClick={() => set({ ...s, on: !s.on })} aria-pressed={s.on}>{s.on ? tr("Schalter zu", "Switch closed") : tr("Schalter offen", "Switch open")}</Button>}
          {poles && <Button icon="swap" onClick={() => set({ ...s, minusLeft: !s.minusLeft })}>{tr("Pole tauschen", "Swap poles")}</Button>}
        </fieldset>
      }
      onCheck={() => c.pick(result(s))} />
  );
}
