// Veranschaulichungen: Lineal (Länge), Raster (Fläche), Würfel (Volumen), Messbecher (Hohlmaße),
// Uhr (Zeit), Streifen (Masse) und Einsetz-Kette für zusammengesetzte Einheiten. (Die Pfeilkette steht in ArrowChain.tsx.)

import { Fragment, type CSSProperties, type ReactElement } from "react";
import { ATOM, div, unitSi, toNumber, ladderFor, fmt, q, type Solution, type Row } from "@lern/units";
import { RowView, numText } from "../format.tsx";

const ratio = (a: string, b: string) => Math.round(toNumber(div(unitSi(a), unitSi(b))));
const nf = (n: number) => fmt(q(n)).text;

/** Nachbarstufen zwischen from und to (immer groß → klein) */
export function steps(units: string[], from: string, to: string): [string, string][] {
  const alias: Record<string, string> = { l: "dm³", ml: "cm³" };
  const i = units.indexOf(units.includes(from) ? from : alias[from]), j = units.indexOf(units.includes(to) ? to : alias[to]);
  if (i < 0 || j < 0 || i === j) return [];
  const [a, b] = i < j ? [i, j] : [j, i];
  return units.slice(a, b).map((u, k) => [u, units[a + k + 1]]);
}

// ── Lineal / Streifen ───────────────────────────────────────────────────────
export function Ruler({ big, small, k, tone = "ruler" }: { big: string; small: string; k: number; tone?: "ruler" | "bar" }) {
  const X0 = 18, W = 300, u = W / 5;
  const topMinor = Math.min(k, 10);
  const n = k <= 60 ? k : 100;            // Striche im Zoom
  const every = k === 10 ? 1 : k === 24 ? 6 : k === 60 ? 10 : 10;
  return (
    <figure className={`viz viz-ruler ${tone}`}>
      <svg viewBox="0 0 356 168" role="img" aria-label={`1 ${big} = ${nf(k)} ${small}`}>
        <rect x={X0 - 8} y={8} width={W + 16} height={36} rx={5} className="rl-body" />
        <rect x={X0} y={8} width={u} height={36} className="rl-hl" />
        {Array.from({ length: 6 }, (_, i) => (
          <Fragment key={i}>
            <line x1={X0 + i * u} x2={X0 + i * u} y1={8} y2={24} className="rl-tick" />
            <text x={X0 + i * u} y={38} className="rl-num">{i}</text>
            {i < 5 && Array.from({ length: topMinor - 1 }, (_, j) => (
              <line key={j} x1={X0 + i * u + ((j + 1) * u) / topMinor} x2={X0 + i * u + ((j + 1) * u) / topMinor} y1={8} y2={topMinor === 10 && j === 4 ? 19 : 15} className="rl-tick minor" />
            ))}
          </Fragment>
        ))}
        <text x={X0 + W + 12} y={30} className="rl-unit">{big}</text>
        <line x1={X0} y1={44} x2={X0} y2={84} className="rl-zoom" />
        <line x1={X0 + u} y1={44} x2={X0 + W} y2={84} className="rl-zoom" />
        <rect x={X0 - 8} y={84} width={W + 16} height={40} rx={5} className="rl-body zoom" />
        {Array.from({ length: n + 1 }, (_, i) => {
          const x = X0 + (i * W) / n, lab = i % (k <= 60 ? every : 10) === 0;
          const half = k <= 60 ? false : i % 5 === 0;
          return (
            <Fragment key={i}>
              <line x1={x} x2={x} y1={84} y2={lab ? 102 : half ? 96 : 92} className={`rl-tick${lab ? "" : " minor"}`} />
              {lab && <text x={x} y={117} className="rl-num sm">{nf(Math.round((i * k) / n))}</text>}
            </Fragment>
          );
        })}
        <text x={X0 + W + 12} y={108} className="rl-unit">{small}</text>
        <path d={`M${X0} 132 v6 H${X0 + W} v-6`} className="rl-brace" />
        <text x={X0 + W / 2} y={158} className="rl-cap">1 {big} = {nf(k)} {small}</text>
      </svg>
      <figcaption>1 {big} = {nf(k)} {small} → <b className="fx">· {nf(k)}</b></figcaption>
    </figure>
  );
}

// ── Fläche: 10 × 10-Raster ──────────────────────────────────────────────────
const SIDE: Record<string, string> = { "km²": "1 km", ha: "100 m", a: "10 m", "m²": "1 m", "dm²": "1 dm", "cm²": "1 cm", "mm²": "1 mm", "m³": "1 m", "dm³": "1 dm", "cm³": "1 cm", "mm³": "1 mm" };
export function AreaGrid({ big, small }: { big: string; small: string }) {
  const X = 44, Y = 34, S = 170, c = S / 10;
  return (
    <figure className="viz viz-area">
      <svg viewBox="0 0 340 236" role="img" aria-label={`1 ${big} = 100 ${small}`}>
        <text x={X + S / 2} y={20} className="ar-lab">10 · {SIDE[small]} = {SIDE[big]}</text>
        <text x={X - 12} y={Y + S / 2} className="ar-lab" transform={`rotate(-90 ${X - 12} ${Y + S / 2})`}>{SIDE[big]}</text>
        <rect x={X} y={Y} width={S} height={S} className="ar-sq" />
        <rect x={X} y={Y} width={S} height={c} className="ar-row" />
        <rect x={X} y={Y} width={c} height={c} className="ar-cell" />
        {Array.from({ length: 9 }, (_, i) => (
          <Fragment key={i}>
            <line x1={X + (i + 1) * c} x2={X + (i + 1) * c} y1={Y} y2={Y + S} className="ar-line" />
            <line x1={X} x2={X + S} y1={Y + (i + 1) * c} y2={Y + (i + 1) * c} className="ar-line" />
          </Fragment>
        ))}
        <path d={`M${X + S + 6} ${Y + c / 2} h14`} className="ar-arrow" />
        <text x={X + S + 24} y={Y + c / 2 + 4} className="ar-note strong">1 {small}</text>
        <text x={X + S + 24} y={Y + c + 12} className="ar-note">1 Reihe: 10 {small}</text>
        <path d={`M${X + S + 6} ${Y} v${S} h-4 M${X + S + 6} ${Y} h-4`} className="ar-brace" />
        <text x={X + S + 24} y={Y + S - 8} className="ar-note">10 Reihen:</text>
        <text x={X + S + 24} y={Y + S + 8} className="ar-note strong">100 {small}</text>
        <text x={X + S / 2} y={Y + S + 26} className="ar-cap">1 {big} = 100 {small}</text>
      </svg>
      <figcaption>{SIDE[big]} · {SIDE[big]} = 10 · {SIDE[small]} · 10 · {SIDE[small]} → <b className="fx">· 100</b></figcaption>
    </figure>
  );
}

// ── Volumen: Würfel aus 10 · 10 · 10 kleinen Würfeln ───────────────────────
const LITER: Record<string, string> = { "dm³": "1 l", "cm³": "1 ml" };
export function Cube({ big, small }: { big: string; small: string }) {
  const X = 40, Y = 50, S = 140, dx = 62, dy = -40, c = S / 10; // Y so, dass die Zeile „1 dm³ = … = 1000 cm³“ (Y + S + 40) noch im Bild liegt
  const P = (x: number, y: number) => `${x},${y}`;
  const lines: ReactElement[] = [];
  for (let i = 1; i < 10; i++) {
    const t = i * c;
    lines.push(<line key={`fv${i}`} x1={X + t} y1={Y} x2={X + t} y2={Y + S} className="cb-line" />);
    lines.push(<line key={`fh${i}`} x1={X} y1={Y + t} x2={X + S} y2={Y + t} className="cb-line" />);
    lines.push(<line key={`tv${i}`} x1={X + t} y1={Y} x2={X + t + dx} y2={Y + dy} className="cb-line" />);
    lines.push(<line key={`th${i}`} x1={X + (dx * i) / 10} y1={Y + (dy * i) / 10} x2={X + S + (dx * i) / 10} y2={Y + (dy * i) / 10} className="cb-line" />);
    lines.push(<line key={`rv${i}`} x1={X + S + (dx * i) / 10} y1={Y + (dy * i) / 10} x2={X + S + (dx * i) / 10} y2={Y + S + (dy * i) / 10} className="cb-line" />);
    lines.push(<line key={`rh${i}`} x1={X + S} y1={Y + t} x2={X + S + dx} y2={Y + t + dy} className="cb-line" />);
  }
  const sdx = dx / 10, sdy = dy / 10;
  return (
    <figure className="viz viz-cube">
      <svg viewBox="0 0 340 236" role="img" aria-label={`1 ${big} = 1000 ${small}`}>
        <polygon points={[P(X, Y), P(X + S, Y), P(X + S, Y + S), P(X, Y + S)].join(" ")} className="cb-front" />
        <polygon points={[P(X, Y), P(X + dx, Y + dy), P(X + S + dx, Y + dy), P(X + S, Y)].join(" ")} className="cb-top" />
        <polygon points={[P(X + S, Y), P(X + S + dx, Y + dy), P(X + S + dx, Y + S + dy), P(X + S, Y + S)].join(" ")} className="cb-side" />
        {lines}
        {/* kleiner Würfel vorne oben links */}
        <polygon points={[P(X, Y), P(X + c, Y), P(X + c, Y + c), P(X, Y + c)].join(" ")} className="cb-small" />
        <polygon points={[P(X, Y), P(X + sdx, Y + sdy), P(X + c + sdx, Y + sdy), P(X + c, Y)].join(" ")} className="cb-small top" />
        <path d={`M${X + c / 2} ${Y + c + 2} L${X + 18} ${Y + 44}`} className="ar-arrow" />
        <text x={X + 22} y={Y + 58} className="ar-note strong on-cube">1 {small}{LITER[small] ? ` = ${LITER[small]}` : ""}</text>
        <text x={X + S / 2} y={Y + S + 18} className="ar-lab">10 · {SIDE[small]} = {SIDE[big]}</text>
        <text x={X + S / 2} y={Y + S + 40} className="ar-cap">1 {big}{LITER[big] ? ` = ${LITER[big]}` : ""} = 1000 {small}</text>
      </svg>
      <figcaption>10 · 10 · 10 = 1000 → <b className="fx">· 1000</b></figcaption>
    </figure>
  );
}

// ── Hohlmaße: Messbecher ────────────────────────────────────────────────────
export function Beaker({ big, small, k }: { big: string; small: string; k: number }) {
  const X = 110, Y = 22, W = 90, H = 170;
  return (
    <figure className="viz viz-beaker">
      <svg viewBox="0 0 340 236" role="img" aria-label={`1 ${big} = ${k} ${small}`}>
        <path d={`M${X} ${Y} v${H - 10} q0 10 10 10 h${W - 20} q10 0 10 -10 v-${H - 10}`} className="bk-glass" />
        <rect x={X + 3} y={Y + 14} width={W - 6} height={H - 17} rx={6} className="bk-water" />
        {Array.from({ length: 11 }, (_, i) => {
          const y = Y + H - (i * (H - 14)) / 10;
          return (
            <Fragment key={i}>
              <line x1={X + W - 22} x2={X + W} y1={y} y2={y} className="rl-tick" />
              {i > 0 && <text x={X + W + 8} y={y + 4} className="rl-num sm left">{nf((i * k) / 10)} {small}</text>}
            </Fragment>
          );
        })}
        <text x={X + W / 2} y={Y + H + 30} className="ar-cap">1 {big} = {nf(k)} {small}</text>
      </svg>
      <figcaption>1 {big} = {nf(k)} {small} → <b className="fx">· {nf(k)}</b></figcaption>
    </figure>
  );
}

// ── Zeit: Uhr (60 min bzw. 60 s) ───────────────────────────────────────────
export function Clock({ big, small }: { big: string; small: string }) {
  const C = 118, R = 84;
  return (
    <figure className="viz viz-clock">
      <svg viewBox="0 0 340 236" role="img" aria-label={`1 ${big} = 60 ${small}`}>
        <circle cx={C + 40} cy={C} r={R} className="ck-face" />
        <path d={`M${C + 40} ${C} L${C + 40} ${C - R + 6} A${R - 6} ${R - 6} 0 1 1 ${C + 39.9} ${C - R + 6} Z`} className="ck-sweep" />
        {Array.from({ length: 60 }, (_, i) => {
          const a = (i / 60) * Math.PI * 2, long = i % 5 === 0;
          const r1 = R - (long ? 12 : 6);
          return <line key={i} x1={C + 40 + Math.sin(a) * r1} y1={C - Math.cos(a) * r1} x2={C + 40 + Math.sin(a) * R} y2={C - Math.cos(a) * R} className={`rl-tick${long ? "" : " minor"}`} />;
        })}
        {[0, 15, 30, 45].map(m => {
          const a = (m / 60) * Math.PI * 2;
          return <text key={m} x={C + 40 + Math.sin(a) * (R - 26)} y={C - Math.cos(a) * (R - 26) + 5} className="rl-num">{m === 0 ? 60 : m}</text>;
        })}
        <text x={C + 40} y={C + 5} className="ck-center">1 {big}</text>
        <text x={C + 40} y={C + R + 24} className="ar-cap">1 {big} = 60 {small}</text>
      </svg>
      <figcaption>1 {big} = 60 {small} → <b className="fx">· 60</b></figcaption>
    </figure>
  );
}

// ── Zusammengesetzte Einheiten: Einsetz-Kette ──────────────────────────────
function stepLabel(prev: Row, row: Row, i: number, last: boolean): string {
  if (last) return "ausrechnen";
  if (i === 1 && row.num && (row.num.every(t => !t.v || t.v.n === t.v.d) && (row.den ?? []).every(t => !t.v || t.v.n === t.v.d))) return "zerlegen";
  if (row.unit !== undefined && prev.unit !== undefined) return "Definition";
  if (row.unit !== undefined) return "zusammenfassen";
  if ((row.num ?? []).some(t => t.pow && t.pow > 1) || (row.den ?? []).some(t => t.pow && t.pow > 1)) return "einsetzen";
  if (prev.num && (prev.num.some(t => t.pow && t.pow > 1) || (prev.den ?? []).some(t => t.pow && t.pow > 1))) return "Potenz ausrechnen";
  return "einsetzen";
}
export function SubstFlow({ s }: { s: Solution }) {
  const rows = s.rel.rows;
  return (
    <figure className="viz viz-subst">
      <ol className="sf-list">
        {rows.map((r, i) => (
          <li key={i} className={i === 0 || i === rows.length - 1 ? "sf-end" : ""}>
            {i > 0 && <span className="sf-arrow" aria-hidden="true"><em>{stepLabel(rows[i - 1], r, i, i === rows.length - 1)}</em>→</span>}
            <span className="sf-box"><RowView row={r} /></span>
          </li>
        ))}
      </ol>
      <figcaption>1 {s.from} = <b className="fx">{numText(s.rel.F)} {s.to}</b>{s.rel.notes.length ? <> <span className="muted">({s.rel.notes.join(", ")})</span></> : null}</figcaption>
    </figure>
  );
}

/** Passende Veranschaulichung für eine Umrechnung */
export function VisualFor({ s, os }: { s: Solution; os: boolean }) {
  const found = ladderFor(s.from, s.to);
  const ladder = found && { ...found, units: found.units.filter(u => os || !ATOM[u]?.os || u === s.from || u === s.to) };
  if (!ladder || s.from === s.to) return s.from === s.to ? null : <SubstFlow s={s} />;
  const all = steps(ladder.units, s.from, s.to);
  // höchstens 3 Bilder: bei langen Wegen die ersten beiden und die letzte Stufe
  const st = all.length > 3 ? [all[0], all[1], all[all.length - 1]] : all;
  const more = all.length > 3;
  const panel = ([big, small]: [string, string]) => {
    const k = ratio(big, small);
    switch (ladder.id) {
      case "len": return <Ruler big={big} small={small} k={k} />;
      case "mass": return <Ruler big={big} small={small} k={k} tone="bar" />;
      case "area": return <AreaGrid big={big} small={small} />;
      case "vol": return <Cube big={big} small={small} />;
      case "liter": return <Beaker big={big} small={small} k={k} />;
      case "time": return k === 60 ? <Clock big={big} small={small} /> : <Ruler big={big} small={small} k={k} tone="bar" />;
    }
    return null;
  };
  return (
    <div className="viz-wrap">
      <div className="viz-panels" style={{ "--n": st.length, "--n2": Math.ceil(st.length / 2) } as CSSProperties}>{st.map(p => <Fragment key={p.join()}>{panel(p)}</Fragment>)}</div>
      {more && <p className="muted small">{all.slice(2, -1).map(([a, b]) => `1 ${a} = ${nf(ratio(a, b))} ${b}`).join(", ")}</p>}
    </div>
  );
}
