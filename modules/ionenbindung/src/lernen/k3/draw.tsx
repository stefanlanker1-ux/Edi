// Kapitel 3 – Zeichenbausteine: Ionen als Kugeln (Größen im Verhältnis der Ionenradien, Ladung in der Kugel), Kation gold, Anion grün;
// Anziehung = durchgezogene Linie, Abstoßung = rot gestrichelte Linie (nie nur über Farbe: Strich und Pfeilrichtung unterscheiden sich).

import { useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode, type RefObject } from "react";

/** Bühne hochkant? (Höhe > Breite) – für Zeichnungen, die quer oder hochkant stehen können */
export function useTall(): [RefObject<HTMLDivElement | null>, boolean] {
  const ref = useRef<HTMLDivElement>(null);
  const [tall, setTall] = useState(false);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const m = () => setTall(el.clientHeight > el.clientWidth * 1.05);
    m();
    const ro = new ResizeObserver(m);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, tall];
}

export interface Ion { s: string; q: number; pm: number }
// Ionenradien (pm, Koordinationszahl 6)
export const NA: Ion = { s: "Na", q: 1, pm: 102 };
export const CL: Ion = { s: "Cl", q: -1, pm: 181 };
export const K: Ion = { s: "K", q: 1, pm: 138 };
export const BR: Ion = { s: "Br", q: -1, pm: 196 };
export const MG: Ion = { s: "Mg", q: 2, pm: 72 };
export const O: Ion = { s: "O", q: -2, pm: 140 };
export const CA: Ion = { s: "Ca", q: 2, pm: 100 };

const SUP: Record<string, string> = { "1": "⁺", "2": "²⁺", "-1": "⁻", "-2": "²⁻" };
export const ionText = (i: Ion) => i.s + SUP[String(i.q)];
/** Radius im Bild: das größte Ion der Zeichnung (`ref`) hat `R` */
export const rad = (i: Ion, ref: Ion, R: number) => (R * i.pm) / ref.pm;

export function Ball({ ion, x, y, r, cls, sign, jit, children }: {
  ion: Ion; x: number; y: number; r: number; cls?: string;
  /** nur das Ladungszeichen (+ / −) statt des Symbols – für kleine Kugeln */
  sign?: boolean;
  /** Schwingen um den Platz: Weite (px), Dauer (s), Verzögerung (s) */
  jit?: { a: number; d: number; delay: number };
  children?: ReactNode;
}) {
  const t = sign ? (ion.q > 0 ? "+" : "−") : ionText(ion);
  const fs = sign ? r * 1.3 : Math.min(17, r * (t.length > 3 ? 0.7 : 0.84));
  const js = jit ? ({ "--a": `${jit.a}px`, animationDuration: `${jit.d}s`, animationDelay: `${jit.delay}s` } as CSSProperties) : undefined;
  return (
    <g className={`k3-ion ${ion.q > 0 ? "cat" : "an"}${cls ? ` ${cls}` : ""}`} style={{ transform: `translate(${x}px, ${y}px)` }}>
      <g className={jit ? "k3-jit" : undefined} style={js}>
        <circle r={r} />
        <text dy={sign ? ".34em" : ".36em"} style={{ fontSize: fs }}>{t}</text>
      </g>
      {children}
    </g>
  );
}

/** Pfeilspitze (offene Winkel-Linie) an (x, y) in Richtung `ang` */
export const head = (x: number, y: number, ang: number, s = 7) =>
  `M${x - s * Math.cos(ang - 0.5)} ${y - s * Math.sin(ang - 0.5)} L${x} ${y} L${x - s * Math.cos(ang + 0.5)} ${y - s * Math.sin(ang + 0.5)}`;

/** Pfeil von (x1, y1) nach (x2, y2) */
export function Arrow({ x1, y1, x2, y2, cls }: { x1: number; y1: number; x2: number; y2: number; cls?: string }) {
  const ang = Math.atan2(y2 - y1, x2 - x1);
  return <path className={`k3-arrow${cls ? ` ${cls}` : ""}`} d={`M${x1} ${y1} L${x2} ${y2} ${head(x2, y2, ang)}`} />;
}

/** Kraft zwischen zwei Ionen über der Mitte: Anziehung → ←, Abstoßung ← → (gestrichelt) */
export function ForceIcon({ x, y, att }: { x: number; y: number; att: boolean }) {
  return att
    ? <g className="k3-force att"><Arrow x1={x - 17} y1={y} x2={x - 3} y2={y} /><Arrow x1={x + 17} y1={y} x2={x + 3} y2={y} /></g>
    : <g className="k3-force rep"><Arrow x1={x - 3} y1={y} x2={x - 17} y2={y} /><Arrow x1={x + 3} y1={y} x2={x + 17} y2={y} /></g>;
}

/** Linie zwischen zwei Nachbarn: Anziehung (Gegen-Ionen) oder Abstoßung (gleiche Ladung) */
export const bondCls = (a: Ion, b: Ion) => (a.q * b.q < 0 ? "att" : "rep");
