// Zahlen und Rechenzeilen darstellen: Dezimalkomma, Brüche für nicht endende Zahlen (1/3600), Bruchstriche.

import { Fragment } from "react";
import { fmt, fmtSci, isTerminating, toNumber, eq, ONE, type Q, type Row, type Term } from "@lern/units";
import { tr } from "@lern/i18n";

/** Kehrwert, wenn die Zahl positiv ist und der Kehrwert endet (250/9 → 0,036) – sonst null */
export const invTerm = (v: Q): Q | null => {
  if (v.n <= 0n) return null;
  const inv = { n: v.d, d: v.n };
  return isTerminating(inv) ? inv : null;
};
/** Wird die Zahl exakt gezeigt (endend oder „1/x“)? Sonst steht sie gerundet mit „≈“. */
export const shownExact = (v: Q) => isTerminating(v) || !!invTerm(v);

/**
 * Zahl: endende Dezimalzahl; sonst „1/x“, wenn der Kehrwert endet (1/60, 1/3,6, 1/0,036 – wie im Quiztext, auch über 1);
 * sonst gerundet mit „≈“ (sign = false, wenn der Aufrufer das ≈ selbst setzt).
 */
export function Num({ v, className, sign = true }: { v: Q; className?: string; sign?: boolean }) {
  if (isTerminating(v)) return <span className={className}>{fmt(v).text}</span>;
  const inv = invTerm(v);
  if (inv) return <span className={`frac${className ? " " + className : ""}`}><span>1</span><span>{fmt(inv).text}</span></span>;
  return <span className={className}>{sign ? "≈ " : ""}{fmt(v).text}</span>;
}

/** Text einer Zahl (für aria-Label und einfache Stellen) */
export const numText = (v: Q) => {
  if (isTerminating(v)) return fmt(v).text;
  const inv = invTerm(v);
  return inv ? `1/${fmt(inv).text}` : `≈ ${fmt(v).text}`;
};

/** Geteilt-Zeichen: „:“ (deutsch), „÷“ (englisch) */
export const DIV = tr(":", "÷");

/** Große/kleine Zahlen zusätzlich als Zehnerpotenz (Oberstufe) */
export function sciNeeded(v: Q) {
  const x = Math.abs(toNumber(v));
  return x !== 0 && (x >= 1e6 || x < 1e-3);
}
export const sci = fmtSci;

function TermView({ t }: { t: Term }) {
  const p = t.pow ?? 1;
  if (!t.v) return <span className="t-unit">{t.sym}</span>;
  const inner = <><Num v={t.v} /> <span className="t-unit">{t.sym}</span></>;
  return p > 1 ? <span className="t-pow">({inner})<sup>{p}</sup></span> : <span className="t-term">{inner}</span>;
}

function Product({ terms }: { terms: Term[] }) {
  return <>{terms.map((t, i) => <Fragment key={i}>{i > 0 && <span className="op"> · </span>}<TermView t={t} /></Fragment>)}</>;
}

/** Eine Zeile der Herleitung (ohne führendes „=“; `sign = false`, wenn davor schon „≈“ steht) */
export function RowView({ row, sign = true }: { row: Row; sign?: boolean }) {
  if (row.unit !== undefined) return <span className="row-u"><Num v={row.coef} sign={sign} /> <span className="t-unit">{row.unit}</span></span>;
  const num = row.num ?? [], den = row.den ?? [];
  return (
    <span className="row-t">
      {!eq(row.coef, ONE) && <><Num v={row.coef} /><span className="op"> · </span></>}
      {den.length
        ? <span className="bfrac"><span className="bf-num"><Product terms={num.length ? num : [{ sym: "1" }]} /></span><span className="bf-den"><Product terms={den} /></span></span>
        : <Product terms={num} />}
    </span>
  );
}

/** Kette „1 km = 1000 m = 10 000 dm“ – jedes Glied bleibt beim Umbrechen zusammen */
export function RowChain({ rows, lead }: { rows: Row[]; lead?: React.ReactNode }) {
  return (
    <span className="chain">
      {lead}
      {rows.map((r, i) => {
        // gerundete Zeile: „≈ x“ statt „= ≈ x“
        const exact = r.unit === undefined || shownExact(r.coef);
        return <span key={i} className="chain-part">{i > 0 && <span className="eq">{exact ? "=" : "≈"}</span>}<RowView row={r} sign={i === 0 || exact} /></span>;
      })}
    </span>
  );
}

/** Zeit in gemischter Schreibweise: 100 s → „1 min 40 s“ */
export function timeMixed(seconds: Q): string | null {
  const s = toNumber(seconds);
  if (!Number.isFinite(s) || s <= 0 || Math.abs(s - Math.round(s)) > 1e-9 || s < 60) return null;
  let r = Math.round(s);
  const parts: string[] = [];
  for (const [u, k] of [["d", 86400], ["h", 3600], ["min", 60], ["s", 1]] as const) {
    const n = Math.floor(r / k);
    if (n) { parts.push(`${n} ${u}`); r -= n * k; }
  }
  return parts.length > 1 ? parts.join(" ") : null;
}
