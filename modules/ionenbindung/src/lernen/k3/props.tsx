// Kapitel 3, Teil 3–4: Temperatur-Schieber (Ionen schwingen stärker, bei der Schmelztemperatur verlassen sie ihre Plätze),
// Schicht verschieben (gleiche Ladungen gegenüber → Abstoßung → Bruch), Leitfähigkeit (fest / Schmelze / Lösung, Schalter, Pole).
// Reduzierte Bewegung: kein Schwingen und kein Wandern, gleich das Endbild (Schwingungsbereich als gestrichelter Ring).

import { useMemo, type CSSProperties } from "react";
import { Button, Segmented, Tag, useReducedMotion, type GuideCtx } from "@lern/ui";
import { tr } from "@lern/i18n";
import { ModelFrame, useModel } from "../model.tsx";
import { Arrow, Ball, CL, MG, NA, O, bondCls, rad, type Ion } from "./draw.tsx";

const isCat = (i: number, j: number) => (i + j) % 2 === 0;
/** feste Pseudo-Zufallszahl 0…1 je Index */
const rnd = (k: number) => { const x = Math.sin(k * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

/** Überlappungen auseinanderschieben (fest, ohne Zufall je Aufruf), innerhalb des Rahmens [x0, x1] × [y0, y1] */
function relax(pts: { x: number; y: number }[], r: (p: number) => number, x0: number, y0: number, x1: number, y1: number, gap: (a: number, b: number) => number = () => 3) {
  for (let it = 0; it < 80; it++) {
    for (let a = 0; a < pts.length; a++) for (let b = a + 1; b < pts.length; b++) {
      const dx = pts[b].x - pts[a].x, dy = pts[b].y - pts[a].y, d = Math.hypot(dx, dy) || 1, min = r(a) + r(b) + gap(a, b);
      if (d >= min) continue;
      const k = (min - d) / 2 / d;
      pts[a].x -= dx * k; pts[a].y -= dy * k; pts[b].x += dx * k; pts[b].y += dy * k;
    }
    pts.forEach((q, p) => { q.x = Math.min(x1 - r(p), Math.max(x0 + r(p), q.x)); q.y = Math.min(y1 - r(p), Math.max(y0 + r(p), q.y)); });
  }
  return pts;
}

/** ungeordnete Plätze der Schmelze: Gitterplätze zufällig verschoben, dann auseinandergeschoben */
function meltSpots(cols: number, rows: number, at: (i: number) => number, r: (p: number) => number, W: number, H: number, u: number) {
  const pts = Array.from({ length: cols * rows }, (_, p) => ({ x: at(p % cols) + (rnd(p) - 0.5) * u * 0.7, y: at(Math.floor(p / cols)) + (rnd(p + 50) - 0.5) * u * 0.7 }));
  const cat = (p: number) => isCat(p % cols, Math.floor(p / cols));
  return relax(pts, r, 2, 2, W - 2, H - 2, (a, b) => (cat(a) === cat(b) ? 12 : 3));
}

export const molten = () => tr("geschmolzen", "molten");
export const solid = () => tr("fest", "solid");

/** Gitter-Schicht mit Temperatur-Schieber: Schwingen wächst mit der Temperatur, ab der Schmelztemperatur ungeordnet und beweglich */
/** Gitter-Schicht bei der Temperatur t: Schwingen wächst mit t, ab der Schmelztemperatur ungeordnet, aber weiter zusammen (Linie zum nächsten Gegen-Ion) */
function HeatSvg({ cat, an, tm, t, cols, rows }: { cat: Ion; an: Ion; tm: number; t: number; cols: number; rows: number }) {
  const still = useReducedMotion();
  const u = 60, pad = 40, W = (cols - 1) * u + 2 * pad, H = (rows - 1) * u + 2 * pad;
  const at = (i: number) => pad + i * u;
  const melt = t >= tm;
  const a = melt ? 5 : 1 + 6 * Math.max(0, t) / tm;
  // kleine Kationen (Mg²⁺) nicht unleserlich: das Kation hat mindestens r = 17
  const R = (x: Ion) => rad(x, an, Math.max(26, (17 * an.pm) / cat.pm));
  const ionOf = (p: number) => (isCat(p % cols, Math.floor(p / cols)) ? cat : an);
  const spots = useMemo(() => meltSpots(cols, rows, at, p => R(ionOf(p)), W, H, u), [cat, an, cols, rows]);
  return (
    <svg className="k3-svg" viewBox={`0 0 ${W} ${H}`} role="img"
      aria-label={melt ? tr("Die Ionen haben keine festen Plätze mehr, ziehen sich aber weiter an.", "The ions no longer have fixed places but still attract each other.") : tr("Die Ionen schwingen um ihre Plätze im Gitter.", "The ions vibrate around their places in the lattice.")}>
      {melt && <g key="m" className="k3-fade">{spots.map((q, p) => {
        const mine = isCat(p % cols, Math.floor(p / cols));
        let best = -1, bd = Infinity;
        spots.forEach((o, k) => { if (isCat(k % cols, Math.floor(k / cols)) === mine) return; const d = Math.hypot(o.x - q.x, o.y - q.y); if (d < bd) { bd = d; best = k; } });
        return best >= 0 ? <line key={p} className="k3-bond att" x1={q.x} y1={q.y} x2={spots[best].x} y2={spots[best].y} /> : null;
      })}</g>}
      <g className={`k3-latlines${melt ? " gone" : ""}`}>
        {Array.from({ length: rows }, (_, j) => <line key={`r${j}`} className="k3-bond att" x1={at(0) - 26} y1={at(j)} x2={at(cols - 1) + 26} y2={at(j)} />)}
        {Array.from({ length: cols }, (_, i) => <line key={`c${i}`} className="k3-bond att" x1={at(i)} y1={at(0) - 26} x2={at(i)} y2={at(rows - 1) + 26} />)}
      </g>
      {Array.from({ length: rows * cols }, (_, p) => {
        const i = p % cols, j = Math.floor(p / cols), ion = isCat(i, j) ? cat : an;
        const x = melt ? spots[p].x : at(i), y = melt ? spots[p].y : at(j);
        return (
          <g key={p}>
            {still && !melt && <circle className="k3-range-ring" cx={x} cy={y} r={R(ion) + a} />}
            <Ball ion={ion} x={x} y={y} r={R(ion)} cls="k3-melt"
              jit={still ? undefined : { a, d: melt ? 0.9 + 0.6 * rnd(p + 9) : 0.42 + 0.2 * rnd(p + 7), delay: -rnd(p + 3) }} />
          </g>
        );
      })}
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

/** Gitter-Schicht mit Temperatur-Schieber */
export function ThermoLattice({ c, cat, an, tm, max, step, start, sol, demo }: {
  c: GuideCtx; cat: Ion; an: Ion; tm: number; max: number; step: number; start: number; sol: number; demo?: boolean;
}) {
  const [t, set] = useModel(c, start, sol);
  return (
    <ModelFrame c={c} className="k3-m"
      stage={<HeatSvg cat={cat} an={an} tm={tm} t={t} cols={5} rows={4} />}
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
          <figure><HeatSvg cat={NA} an={CL} tm={801} t={t} cols={3} rows={3} /><figcaption>{tr("Natriumchlorid NaCl", "sodium chloride NaCl")}</figcaption></figure>
          <figure><HeatSvg cat={MG} an={O} tm={2852} t={t} cols={3} rows={3} /><figcaption>{tr("Magnesiumoxid MgO", "magnesium oxide MgO")}</figcaption></figure>
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

/** Leitfähigkeit: Becherglas mit zwei Elektroden, Batterie, Lampe. Beweglich (Schmelze, Lösung) + Schalter zu → Kationen zum Minuspol, Anionen zum Pluspol */
export function Conduct({ c, start, sol, states = ["fest", "schmelze", "loesung"], switchable = false, poles = false, result, demo }: {
  c: GuideCtx; start: Leit; sol: Leit; states?: Zustand[]; switchable?: boolean; poles?: boolean; demo?: boolean;
  /** Ergebnis des gebauten Zustands (Text für „Prüfen“) */
  result: (s: Leit) => string;
}) {
  const [s, set] = useModel<Leit>(c, start, sol);
  const still = useReducedMotion();
  const mobile = s.z !== "fest", flow = mobile && s.on;
  const xL = 92, xR = 268, top = 150, bottom = 300;
  const minusX = s.minusLeft ? xL : xR, plusX = s.minusLeft ? xR : xL;
  const rA = 15, rC = rad(NA, CL, rA);
  const catOf = (k: number) => ((k % 6) + Math.floor(k / 6)) % 2 === 0;
  // verteilt in der Flüssigkeit, ohne Überlappung
  const spread = useMemo(() => relax(Array.from({ length: 18 }, (_, k) => ({ x: 130 + rnd(k + 20) * 100, y: top + 32 + rnd(k + 40) * (bottom - top - 50) })),
    k => (catOf(k) ? rC : rA), xL + 30, top + 22, xR - 30, bottom - 4, (a, b) => (catOf(a) === catOf(b) ? 8 : 3)), []);
  // 18 Ionen: fest = Gitterblock zwischen den Elektroden (6 × 3), beweglich = verteilt; Strom → Kationen zum Minuspol, Anionen zum Pluspol
  const ions = Array.from({ length: 18 }, (_, k) => {
    const i = k % 6, j = Math.floor(k / 6);
    const cat = (i + j) % 2 === 0;
    if (!mobile) return { cat, x: xL + 20 + i * 27, y: bottom - 20 - (2 - j) * 27 };
    const { x: x0, y: y0 } = spread[k];
    // Strom: die Ionen bleiben gemischt und wandern nur (Kationen zum Minuspol, Anionen zum Pluspol) – Endlosschleife, ruhig: kleiner Versatz
    if (!flow) return { cat, x: x0, y: y0 };
    const dir = (cat ? minusX : plusX) === xL ? -1 : 1;
    return { cat, x: x0 + (still ? dir * 8 : 0), y: y0, dir };
  });
  const liquid = mobile;
  const zName = (z: Zustand) => (z === "fest" ? tr("fest", "solid") : z === "schmelze" ? tr("Schmelze", "melt") : tr("Lösung", "solution"));
  return (
    <ModelFrame c={c} className="k3-m"
      stage={
        <svg className={`k3-svg k3-cond${still ? " still" : ""}`} viewBox="30 10 300 296" role="img"
          aria-label={tr(`Natriumchlorid ${zName(s.z)}, Schalter ${s.on ? "zu" : "offen"}, Lampe ${flow ? "an" : "aus"}`, `Sodium chloride ${zName(s.z)}, switch ${s.on ? "closed" : "open"}, lamp ${flow ? "on" : "off"}`)}>
          {/* Stromkreis: Elektroden → Drähte → Batterie (links oben) und Lampe (rechts oben) */}
          <path className="k3-wire" d={`M${xL} ${top - 6} V40 H130 M150 40 H${s.on ? 196 : 190} M216 40 H${xR} V${top - 6}`} />
          {!s.on && <line className="k3-wire" x1={190} y1={40} x2={210} y2={24} />}
          {s.on && <line className="k3-wire" x1={196} y1={40} x2={216} y2={40} />}
          <circle className="k3-dot" cx={190} cy={40} r={3} /><circle className="k3-dot" cx={216} cy={40} r={3} />
          {/* Batterie: langer Strich = Pluspol, kurzer dicker = Minuspol */}
          <line className="k3-batt" x1={s.minusLeft ? 144 : 136} y1={24} x2={s.minusLeft ? 144 : 136} y2={56} />
          <line className="k3-batt thick" x1={s.minusLeft ? 136 : 144} y1={32} x2={s.minusLeft ? 136 : 144} y2={48} />
          {/* Lampe */}
          <g className={`k3-lamp${flow ? " on" : ""}`} transform="translate(242 40)">
            <circle r={13} />
            <path d="M-9 -9 L9 9 M9 -9 L-9 9" />
            {flow && <g className="k3-rays">{[0, 1, 2, 3, 4, 5, 6, 7].map(k => { const w = (k * Math.PI) / 4; return <line key={k} x1={Math.cos(w) * 18} y1={Math.sin(w) * 18} x2={Math.cos(w) * 26} y2={Math.sin(w) * 26} />; })}</g>}
          </g>
          {/* Becherglas */}
          <path className="k3-beaker" d={`M40 ${top - 20} V${bottom} H320 V${top - 20}`} />
          {liquid && <path className={`k3-liquid${s.z === "loesung" ? " water" : ""}`} d={`M40 ${top + 12} q20 -6 40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0`} />}
          {/* Elektroden mit Polen */}
          {[xL, xR].map(x => <rect key={x} className="k3-electrode" x={x - 5} y={top - 6} width={10} height={bottom - top - 4} />)}
          <text className="k3-pole" x={minusX + (minusX === xL ? -22 : 22)} y={top + 14}>−</text>
          <text className="k3-pole" x={plusX + (plusX === xL ? -22 : 22)} y={top + 14}>+</text>
          <text className="k3-note" x={180} y={top - 4}>{s.z === "schmelze" ? "801 °C" : s.z === "loesung" ? tr("in Wasser H₂O", "in water H₂O") : ""}</text>
          {ions.map((p, k) => (
            <g key={k} className={"dir" in p && !still ? "k3-flow" : undefined}
              style={"dir" in p ? ({ "--dx": `${(p.dir ?? 0) * 26}px`, animationDelay: `${-rnd(k + 70) * 2.4}s` } as CSSProperties) : undefined}>
              <Ball ion={p.cat ? NA : CL} x={p.x} y={p.y} r={p.cat ? rC : rA} sign cls={`k3-drift${still ? " still" : ""}`}
                jit={still ? undefined : { a: mobile ? 2.5 : 1, d: 0.5 + 0.3 * rnd(k), delay: -rnd(k + 5) }}>
                {"dir" in p && <Arrow x1={(p.dir ?? 0) * ((p.cat ? rC : rA) + 2)} y1={0} x2={(p.dir ?? 0) * ((p.cat ? rC : rA) + 11)} y2={0} cls={`tiny ${p.cat ? "cat" : "an"}`} />}
              </Ball>
            </g>
          ))}
          {flow && (
            <g className="k3-dir">
              <Arrow x1={180} y1={bottom - 10} x2={minusX + (minusX === xL ? 40 : -40)} y2={bottom - 10} cls="cat" />
              <Arrow x1={180} y1={top + 22} x2={plusX + (plusX === xL ? 40 : -40)} y2={top + 22} cls="an" />
            </g>
          )}
        </svg>
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
