// Zeichnung eines Moleküls: Lewis-Formel (alle Atome, H und freie Elektronenpaare als Striche) oder Gerüstformel
// (C als Ecken, nur Heteroatome beschriftet). Optional: Hauptkette hinterlegt, Hauptgruppe markiert, Nummern der Kette.
// Lage der Atome aus dem Molekül (Bindungslänge 1); das Bild passt sich per viewBox dem Platz an.

import type { ReactNode } from "react";
import { graph, hCount, usedValence, type El, type Graph, type Mol } from "../chem/mol.ts";
import { findRings } from "../chem/rings.ts";

export const U = 50;
export type View = "lewis" | "skelett";

const VE: Record<El, number> = { C: 4, N: 5, O: 6, S: 6, F: 7, Cl: 7, Br: 7, I: 7, NO2: 0 };
const RAD = Math.PI / 180;

export interface Deco { atom: number; kind: "H" | "LP"; angle: number }

/** Winkel (Grad) der Bindungen eines Atoms */
function bondAngles(mol: Mol, g: Graph, id: number): number[] {
  const a = mol.atoms.find(x => x.id === id)!;
  return g.nb.get(id)!.map(n => {
    const b = mol.atoms.find(x => x.id === n.to)!;
    return Math.atan2(b.y - a.y, b.x - a.x) / RAD;
  });
}

/** k Richtungen in die Lücken zwischen den belegten Winkeln verteilen (größte Lücke zuerst) */
export function spread(taken: number[], k: number, start = 0): number[] {
  if (!k) return [];
  if (!taken.length) return Array.from({ length: k }, (_, i) => start + (360 * i) / k);
  const s = taken.map(t => ((t % 360) + 360) % 360).sort((a, b) => a - b);
  const gaps = s.map((v, i) => ({ from: v, size: i + 1 < s.length ? s[i + 1] - v : s[0] + 360 - v, n: 0 }));
  for (let i = 0; i < k; i++) {
    let best = gaps[0];
    for (const gp of gaps) if (gp.size / (gp.n + 1) > best.size / (best.n + 1) + 1e-6) best = gp;
    best.n++;
  }
  return gaps.flatMap(gp => Array.from({ length: gp.n }, (_, i) => gp.from + (gp.size * (i + 1)) / (gp.n + 1)));
}

/** Wasserstoffatome und freie Elektronenpaare der Lewis-Formel */
export function decorations(mol: Mol): Deco[] {
  const g = graph(mol), out: Deco[] = [];
  for (const a of mol.atoms) {
    const h = hCount(g, a.id);
    const lp = a.el === "NO2" ? 0 : Math.max(0, (VE[a.el] - usedValence(g, a.id) - h) / 2);
    const taken = bondAngles(mol, g, a.id);
    const dirs = spread(taken, h + lp, taken.length ? 0 : a.el === "C" ? 0 : 90);
    // H an die freiesten Stellen (weit weg von Bindungen), die Paare auf die übrigen
    const free = (d: number) => (taken.length ? Math.min(...taken.map(t => Math.abs(((d - t + 540) % 360) - 180))) : 0);
    const order = dirs.map((d, i) => ({ d, i, f: free(d) })).sort((x, y) => y.f - x.f || x.i - y.i);
    order.forEach((o, j) => out.push({ atom: a.id, kind: j < h ? "H" : "LP", angle: o.d }));
  }
  return out;
}

const EL_CLASS: Partial<Record<El, string>> = { O: "el-o", N: "el-n", S: "el-s", F: "el-x", Cl: "el-x", Br: "el-x", I: "el-x", NO2: "el-n" };
const sub2 = (n: number) => (n > 1 ? String(n).replace(/\d/g, d => "₀₁₂₃₄₅₆₇₈₉"[+d]) : "");

export interface MolSvgProps {
  mol: Mol;
  view: View;
  /** Hauptkette/Ring (Atome in Reihenfolge) – hinterlegt */
  parent?: number[];
  parentRing?: boolean;
  /** Nummern an den Atomen der Hauptkette */
  numbers?: boolean;
  /** Atome der Hauptgruppe – markiert */
  group?: number[];
  /** „Farbe“: Farbe je Atom (Teil des Namens) – ersetzt Hinterlegung und Markierung */
  tint?: Map<number, string>;
  /** E/Z: Achse der Doppelbindung gestrichelt, vorrangige Gruppe an jedem C mit „1“ */
  ez?: { a: number; b: number; pa: number; pb: number; desc: "E" | "Z" | null }[];
  label: string;
  className?: string;
  /** Mindestgröße des Ausschnitts in Bindungslängen (kleine Moleküle nicht riesig) */
  minW?: number; minH?: number;
  /** Beschriftung und Striche größer im Verhältnis zur Bindung (kleine Bilder im Quiz: Atome bleiben lesbar); 1 = normal */
  labelScale?: number;
  /** fester Ausschnitt (Zeichenfläche: Maßstab bleibt beim Zeichnen gleich) */
  viewBox?: [number, number, number, number];
  /** interaktive Ebene (Treffer, Vorschau) – liegt über der Zeichnung */
  children?: ReactNode;
  svgRef?: React.Ref<SVGSVGElement>;
  onPointerDown?: React.PointerEventHandler<SVGSVGElement>;
  onPointerMove?: React.PointerEventHandler<SVGSVGElement>;
  onPointerUp?: React.PointerEventHandler<SVGSVGElement>;
  onPointerCancel?: React.PointerEventHandler<SVGSVGElement>;
}

/** Ausschnitt in SVG-Einheiten */
export function viewBoxOf(mol: Mol, view: View, minW = 4, minH = 3): [number, number, number, number] {
  const pad = view === "lewis" ? 0.95 : 0.7;
  if (!mol.atoms.length) return [-minW / 2 * U, -minH / 2 * U, minW * U, minH * U];
  const xs = mol.atoms.map(a => a.x), ys = mol.atoms.map(a => a.y);
  let x0 = Math.min(...xs) - pad, x1 = Math.max(...xs) + pad, y0 = Math.min(...ys) - pad, y1 = Math.max(...ys) + pad;
  if (x1 - x0 < minW) { const c = (x0 + x1) / 2; x0 = c - minW / 2; x1 = c + minW / 2; }
  if (y1 - y0 < minH) { const c = (y0 + y1) / 2; y0 = c - minH / 2; y1 = c + minH / 2; }
  return [x0 * U, y0 * U, (x1 - x0) * U, (y1 - y0) * U];
}

export function MolSvg({ mol, view, parent, parentRing, numbers, group, tint, ez, label, className, minW, minH, viewBox, labelScale = 1, children, svgRef, ...ptr }: MolSvgProps) {
  const g = graph(mol);
  const pos = new Map(mol.atoms.map(a => [a.id, { x: a.x * U, y: a.y * U }]));
  const lewis = view === "lewis";
  const decos = lewis ? decorations(mol) : [];
  // Gerüstformel: C ohne Beschriftung (außer allein stehend)
  const shown = (id: number) => lewis || g.el.get(id) !== "C" || g.nb.get(id)!.length === 0;
  const R = 0.22 * U * labelScale;
  const vb = viewBox ?? viewBoxOf(mol, view, minW, minH);
  // Mittelpunkt des Rings je Ringbindung: Doppelbindung als zweiter Strich innen (wie üblich gezeichnet)
  const ringCenter = new Map<string, { x: number; y: number }>();
  for (const r of findRings(g).rings) {
    const c = r.atoms.reduce((s, id) => ({ x: s.x + pos.get(id)!.x / r.atoms.length, y: s.y + pos.get(id)!.y / r.atoms.length }), { x: 0, y: 0 });
    r.atoms.forEach((a, i) => { const b = r.atoms[(i + 1) % r.atoms.length]; ringCenter.set(`${a}-${b}`, c); ringCenter.set(`${b}-${a}`, c); });
  }

  const bonds = mol.bonds.map((b, i) => {
    const p = pos.get(b.a)!, q = pos.get(b.b)!;
    const dx = q.x - p.x, dy = q.y - p.y, len = Math.hypot(dx, dy) || 1;
    const ux = dx / len, uy = dy / len, nx = -uy, ny = ux;
    const s0 = shown(b.a) ? R : 0, s1 = shown(b.b) ? R : 0;
    const x1 = p.x + ux * s0, y1 = p.y + uy * s0, x2 = q.x - ux * s1, y2 = q.y - uy * s1;
    const rc = b.order === 2 ? ringCenter.get(`${b.a}-${b.b}`) : undefined;
    if (rc) {
      // Ring: Hauptstrich auf der Bindung, zweiter Strich kürzer zur Ringmitte hin
      const side = Math.sign((rc.x - p.x) * nx + (rc.y - p.y) * ny) || 1, o = 0.16 * U * side, k = 0.16 * len;
      return (
        <g key={i} className="mol-bond">
          <line x1={x1} y1={y1} x2={x2} y2={y2} />
          <line x1={p.x + ux * Math.max(s0, k) + nx * o} y1={p.y + uy * Math.max(s0, k) + ny * o} x2={q.x - ux * Math.max(s1, k) + nx * o} y2={q.y - uy * Math.max(s1, k) + ny * o} />
        </g>
      );
    }
    const offs = b.order === 1 ? [0] : b.order === 2 ? [-0.075, 0.075] : [-0.12, 0, 0.12];
    return (
      <g key={i} className="mol-bond">
        {offs.map((o, j) => <line key={j} x1={x1 + nx * o * U} y1={y1 + ny * o * U} x2={x2 + nx * o * U} y2={y2 + ny * o * U} />)}
      </g>
    );
  });

  // Hauptkette hinterlegt
  const band: ReactNode[] = [];
  if (parent && parent.length > 1) {
    const pairs = parent.slice(1).map((a, i) => [parent[i], a]);
    if (parentRing) pairs.push([parent[parent.length - 1], parent[0]]);
    pairs.forEach(([a, b], i) => {
      const p = pos.get(a)!, q = pos.get(b)!;
      band.push(<line key={i} className="mol-band" x1={p.x} y1={p.y} x2={q.x} y2={q.y} />);
    });
  }
  if (parent && parent.length === 1) { const p = pos.get(parent[0])!; band.push(<circle key="b" className="mol-band-dot" cx={p.x} cy={p.y} r={0.3 * U} />); }

  // Nummern in der größten Lücke (Bindungen, H, Elektronenpaare)
  const nums: ReactNode[] = [];
  if (numbers && parent) parent.forEach((id, i) => {
    const taken = [...bondAngles(mol, g, id), ...decos.filter(d => d.atom === id).map(d => d.angle)];
    const [d] = spread(taken, 1, 45);
    const p = pos.get(id)!;
    const r = lewis ? 0.44 * U : 0.3 * U;
    nums.push(<text key={id} className="mol-num" x={p.x + Math.cos(d * RAD) * r} y={p.y + Math.sin(d * RAD) * r} dominantBaseline="central" textAnchor="middle">{i + 1}</text>);
  });

  return (
    <svg ref={svgRef} className={`mol-svg${className ? " " + className : ""}`} viewBox={vb.join(" ")} role="img" aria-label={label}
      style={labelScale !== 1 ? ({ "--k": labelScale } as React.CSSProperties) : undefined} {...ptr}>
      {!tint && band}
      {tint && mol.bonds.filter(b => tint.get(b.a) && tint.get(b.a) === tint.get(b.b)).map((b, i) => {
        const p = pos.get(b.a)!, q = pos.get(b.b)!;
        return <line key={`t${i}`} className={`mol-tint h-${tint.get(b.a)}`} x1={p.x} y1={p.y} x2={q.x} y2={q.y} />;
      })}
      {tint && [...tint].map(([id, h]) => { const p = pos.get(id); return p && <circle key={`tc${id}`} className={`mol-tint-dot h-${h}`} cx={p.x} cy={p.y} r={0.34 * U} />; })}
      {!tint && group?.map(id => { const p = pos.get(id)!; return p && <circle key={id} className="mol-group" cx={p.x} cy={p.y} r={0.34 * U} />; })}
      {bonds}
      {decos.map((d, i) => {
        const p = pos.get(d.atom)!, c = Math.cos(d.angle * RAD), s = Math.sin(d.angle * RAD);
        if (d.kind === "H") return (
          <g key={i} className={`mol-h${tint?.get(d.atom) ? ` h-${tint.get(d.atom)}` : ""}`}>
            <line x1={p.x + c * R} y1={p.y + s * R} x2={p.x + c * 0.47 * U} y2={p.y + s * 0.47 * U} />
            <text x={p.x + c * 0.66 * U} y={p.y + s * 0.66 * U} dominantBaseline="central" textAnchor="middle">H</text>
          </g>
        );
        const r = 0.33 * U, h = 0.12 * U, cx = p.x + c * r, cy = p.y + s * r;
        return <line key={i} className="mol-lp" x1={cx - s * h} y1={cy + c * h} x2={cx + s * h} y2={cy - c * h} />;
      })}
      {mol.atoms.map(a => {
        if (!shown(a.id)) return null;
        const p = pos.get(a.id)!;
        const h = lewis ? 0 : hCount(g, a.id);
        const text = a.el === "NO2" ? "NO₂" : a.el;
        let label = text, anchor: "middle" | "start" | "end" = "middle", dx = 0;
        if (h) {
          // Gerüstformel: H an das Heteroatom schreiben, auf der Seite ohne Bindung
          const ang = bondAngles(mol, g, a.id);
          const right = ang.reduce((s, t) => s + Math.cos(t * RAD), 0) > 0.3;
          label = right ? `H${sub2(h)}${text}` : `${text}H${sub2(h)}`;
          // das Symbol des Atoms bleibt an seiner Stelle, H steht daneben
          anchor = right ? "end" : "start"; dx = (right ? 1 : -1) * 0.17 * U;
          if (a.el === "C" && !ang.length) { label = `CH${sub2(h)}`; anchor = "middle"; dx = 0; }
        }
        return (
          <g key={a.id} className={`mol-atom ${EL_CLASS[a.el] ?? ""}${tint?.get(a.id) ? ` h-${tint.get(a.id)}` : ""}`} data-a={a.id}>
            <circle className="mol-atom-bg" cx={p.x} cy={p.y} r={R} />
            <text x={p.x + dx} y={p.y} dominantBaseline="central" textAnchor={anchor}>{label}</text>
          </g>
        );
      })}
      {ez?.map((z, i) => {
        const A = pos.get(z.a), B = pos.get(z.b);
        if (!A || !B) return null;
        const dx = B.x - A.x, dy = B.y - A.y, l = Math.hypot(dx, dy) || 1, ux = dx / l, uy = dy / l, ext = 1.1 * U;
        // vorrangige Gruppe: Bindung vom C der Doppelbindung zu ihr rot nachgezogen
        const mark = (p: number, at: { x: number; y: number }) => {
          const P = pos.get(p);
          if (!P) return null;
          const vx = P.x - at.x, vy = P.y - at.y, vl = Math.hypot(vx, vy) || 1, cut = 0.24 * U;
          return <line className="mol-ez-prio" x1={at.x + (vx / vl) * cut} y1={at.y + (vy / vl) * cut} x2={P.x - (vx / vl) * cut} y2={P.y - (vy / vl) * cut} />;
        };
        return (
          <g key={`ez${i}`} className="mol-ez" aria-hidden="true">
            <line className="mol-ez-axis" x1={A.x - ux * ext} y1={A.y - uy * ext} x2={B.x + ux * ext} y2={B.y + uy * ext} />
            {mark(z.pa, A)}{mark(z.pb, B)}
            <text className="mol-ez-desc" x={B.x + ux * (ext + 0.22 * U)} y={B.y + uy * (ext + 0.22 * U)} dominantBaseline="central" textAnchor="middle">{z.desc}</text>
          </g>
        );
      })}
      {nums}
      {children}
    </svg>
  );
}
