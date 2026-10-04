// Zeichnung einer Szene der Atom-Ansicht (Valenzstrichformel): Hinterlegung je Baustein („Kügelchen“-Farbe),
// Bindungen (Zweifachbindung: zweite Linie daneben – so wird beim Einbau einfach eine Linie ausgeblendet),
// Atome, freie Elektronenpaare (Striche), Ladungen, Elektronen (Punkte), Pfeile (Elektronenfluss) und kurze Beschriftungen.

import type { ReactNode } from "react";
import { anchorPt, dirOf, labelHalf, type Atom, type Box, type PBond, type Pose, type Pt } from "../chem/scene.ts";

export const U = 50;

const EL_CLASS: Record<string, string> = { O: "el-o", N: "el-n", Cl: "el-cl", F: "el-f", Ti: "el-ti", Al: "el-al", Li: "el-li", B: "el-b" };

/** Strecke von a nach b, an beschrifteten Atomen gekürzt (Ellipse um die Beschriftung) */
function trim(a: Atom, b: Atom): [Pt, Pt] | null {
  const dx = b.x - a.x, dy = b.y - a.y, l = Math.hypot(dx, dy);
  if (l < 1e-6) return null;
  const ux = dx / l, uy = dy / l;
  const cut = (x: Atom) => {
    const t = x.text ?? x.el;
    if (!t || x.vac) return 0;
    const rx = labelHalf(x) + 0.08, ry = x.el === "H" && !x.text ? 0.21 : 0.25;
    return 1 / Math.sqrt((ux / rx) ** 2 + (uy / ry) ** 2);
  };
  const c0 = cut(a), c1 = cut(b);
  if (c0 + c1 >= l - 0.05) return null;
  return [{ x: a.x + ux * c0, y: a.y + uy * c0 }, { x: b.x - ux * c1, y: b.y - uy * c1 }];
}

function ringCenter(rings: Record<string, string[]>, id: string | undefined, at: Map<string, Atom>): Pt | null {
  if (!id || !rings[id]) return null;
  const ps = rings[id].map(i => at.get(i)).filter((x): x is Atom => !!x);
  if (!ps.length) return null;
  return { x: ps.reduce((s, p) => s + p.x, 0) / ps.length, y: ps.reduce((s, p) => s + p.y, 0) / ps.length };
}

function BondLines({ b, at, rings }: { b: PBond; at: Map<string, Atom>; rings: Record<string, string[]> }) {
  const A = at.get(b.a), B = at.get(b.b);
  if (!A || !B) return null;
  const seg = trim(A, B);
  if (!seg) return null;
  const [p, q] = seg;
  const op = b.op * Math.min(A.op ?? 1, B.op ?? 1);
  if (op < 0.02) return null;
  const dx = q.x - p.x, dy = q.y - p.y, l = Math.hypot(dx, dy) || 1;
  let nx = -dy / l, ny = dx / l;
  // zweite Linie: im Ring nach innen, sonst nach oben (bzw. rechts)
  const rc = ringCenter(rings, b.ring, at);
  if (rc) { const s = Math.sign((rc.x - p.x) * nx + (rc.y - p.y) * ny) || 1; nx *= s; ny *= s; }
  else if (ny > 0.2 || (Math.abs(ny) <= 0.2 && nx < 0)) { nx = -nx; ny = -ny; }
  const line = (o: number, alpha: number, k: number, cls = "") => {
    const sh = rc && o !== 0 ? 0.16 * l : 0; // im Ring kürzer
    const ux = dx / l, uy = dy / l;
    return <line key={k} className={`mb-line${cls}`} x1={(p.x + nx * o + ux * sh) * U} y1={(p.y + ny * o + uy * sh) * U} x2={(q.x + nx * o - ux * sh) * U} y2={(q.y + ny * o - uy * sh) * U} opacity={alpha} />;
  };
  if (b.k === "wedge") {
    const w = 0.13;
    return <polygon className="mb-wedge" opacity={op} points={`${p.x * U},${p.y * U} ${(q.x + nx * w) * U},${(q.y + ny * w) * U} ${(q.x - nx * w) * U},${(q.y - ny * w) * U}`} />;
  }
  if (b.k === "hash") {
    const n = 6, out: ReactNode[] = [];
    for (let i = 1; i <= n; i++) {
      const f = i / n, w = 0.13 * f, x = p.x + dx * f, y = p.y + dy * f;
      out.push(<line key={i} className="mb-hash" x1={(x + nx * w) * U} y1={(y + ny * w) * U} x2={(x - nx * w) * U} y2={(y - ny * w) * U} opacity={op} />);
    }
    return <g>{out}</g>;
  }
  if (b.k === "coord" || b.k === "ts") return <g className={b.k === "coord" ? "mb-coord" : "mb-ts"}>{line(0, op, 0)}</g>;
  const offs = [0, 0.15, -0.15];
  const out: ReactNode[] = [];
  for (let i = 0; i < Math.max(b.o2, 1); i++) out.push(line(offs[i], i < b.o ? op : op * b.ex, i));
  return <g className="mb-bond">{out}</g>;
}

/** gebogener Pfeil mit Spitze (halber Pfeil = ein Elektron) */
function ArrowPath({ from, to, half, bend = 0.5, op }: { from: Pt; to: Pt; half?: boolean; bend?: number; op: number }) {
  const dx = to.x - from.x, dy = to.y - from.y, l = Math.hypot(dx, dy) || 1;
  const nx = -dy / l, ny = dx / l;
  // kurze Pfeile trotzdem sichtbar gebogen
  const off = Math.sign(bend || 1) * Math.max(Math.abs(bend) * l * 0.6, 0.32);
  const c = { x: (from.x + to.x) / 2 + nx * off, y: (from.y + to.y) / 2 + ny * off };
  // Richtung am Ende
  const tx = to.x - c.x, ty = to.y - c.y, tl = Math.hypot(tx, ty) || 1, ux = tx / tl, uy = ty / tl;
  const h = 0.24, w = 0.13;
  const p1 = { x: to.x - ux * h + -uy * w, y: to.y - uy * h + ux * w };
  const p2 = { x: to.x - ux * h - -uy * w, y: to.y - uy * h - ux * w };
  const side = bend >= 0 ? p2 : p1;
  return (
    <g className="mb-arrow" opacity={op}>
      <path className="mb-arrow-bg" d={`M${from.x * U} ${from.y * U} Q${c.x * U} ${c.y * U} ${to.x * U} ${to.y * U}`} />
      <path d={`M${from.x * U} ${from.y * U} Q${c.x * U} ${c.y * U} ${to.x * U} ${to.y * U}`} />
      {half
        ? <path className="mb-head" d={`M${to.x * U} ${to.y * U} L${side.x * U} ${side.y * U}`} />
        : <path className="mb-head-fill" d={`M${to.x * U} ${to.y * U} L${p1.x * U} ${p1.y * U} L${p2.x * U} ${p2.y * U} Z`} />}
    </g>
  );
}

export function MechSvg({ pose, box, label, className, onPick, halos = true, lp = true }: {
  pose: Pose; box: Box; label: string; className?: string;
  /** Antippen eines Atoms (Kennung) */
  onPick?: (id: string) => void;
  /** Bausteine farbig hinterlegen */
  halos?: boolean;
  /** freie Elektronenpaare zeigen */
  lp?: boolean;
}) {
  const at = new Map(pose.atoms.map(a => [a.id, a]));
  const vb = [box.x0 * U, box.y0 * U, (box.x1 - box.x0) * U, (box.y1 - box.y0) * U].join(" ");
  // Hinterlegung je Baustein
  const halo: ReactNode[] = [];
  if (halos) {
    for (const b of pose.bonds) {
      const A = at.get(b.a), B = at.get(b.b);
      if (!A || !B || A.unit === undefined || A.unit !== B.unit || !A.hue || b.k === "coord" || b.k === "ts") continue;
      const op = Math.min(A.op ?? 1, B.op ?? 1) * b.op;
      if (op < 0.02) continue;
      halo.push(<line key={`hb${halo.length}`} className={`mb-halo-l hue-${A.hue}`} x1={A.x * U} y1={A.y * U} x2={B.x * U} y2={B.y * U} opacity={op} />);
    }
    for (const a of pose.atoms) if (a.hue && a.unit !== undefined && (a.op ?? 1) > 0.02 && !a.vac) halo.push(<circle key={`ha${a.id}`} className={`mb-halo hue-${a.hue}`} cx={a.x * U} cy={a.y * U} r={(a.el === "H" && !a.text ? 0.3 : 0.4) * U} opacity={a.op ?? 1} />);
  }
  return (
    <svg className={`mb-svg${className ? " " + className : ""}`} viewBox={vb} role="img" aria-label={label} preserveAspectRatio="xMidYMid meet"
      onClick={onPick ? e => { const id = (e.target as Element).closest("[data-atom]")?.getAttribute("data-atom"); if (id) onPick(id); } : undefined}>
      <g className="mb-halos">{halo}</g>
      {pose.bonds.map((b, i) => <BondLines key={`${b.a}|${b.b}|${i}`} b={b} at={at} rings={pose.rings} />)}
      {pose.atoms.map(a => {
        const op = a.op ?? 1;
        if (op < 0.02) return null;
        if (a.vac) return <circle key={a.id} className="mb-vac" cx={a.x * U} cy={a.y * U} r={0.27 * U} opacity={op} />;
        const t = a.text ?? a.el;
        const lps = lp && a.lp ? a.lp : [];
        const small = a.el === "H" && !a.text;
        const rx = (labelHalf(a) + 0.06) * U;
        return (
          <g key={a.id} className={`mb-atom ${EL_CLASS[a.el] ?? ""}${small ? " h" : ""}${a.hl ? " hl" : ""}`} opacity={op} data-atom={a.id}>
            {t && <ellipse className="mb-atom-bg" cx={a.x * U} cy={a.y * U} rx={rx} ry={0.25 * U} />}
            {t && <text x={a.x * U} y={a.y * U} dominantBaseline="central" textAnchor="middle">{t}</text>}
            {lps.map((l, i) => {
              const d = dirOf(l), r = 0.36 + (labelHalf(a) > 0.3 ? Math.abs(d.x) * (labelHalf(a) - 0.2) : 0), h = 0.13;
              const cx = a.x + d.x * r, cy = a.y + d.y * r;
              return <line key={i} className="mb-lp" x1={(cx - d.y * h) * U} y1={(cy + d.x * h) * U} x2={(cx + d.y * h) * U} y2={(cy - d.x * h) * U} />;
            })}
            {a.q ? (() => {
              const d = dirOf(a.qa ?? -45), r = 0.46 + Math.abs(d.x) * Math.max(0, labelHalf(a) - 0.2);
              const cx = (a.x + d.x * r) * U, cy = (a.y + d.y * r) * U;
              return (
                <g className="mb-charge">
                  <circle cx={cx} cy={cy} r={0.14 * U} />
                  <path d={a.q > 0 ? `M${cx - 4} ${cy}h8M${cx} ${cy - 4}v8` : `M${cx - 4} ${cy}h8`} />
                </g>
              );
            })() : null}
          </g>
        );
      })}
      {pose.dots.map(d => (d.op ?? 1) > 0.02 && <circle key={d.id} className="mb-e" cx={d.x * U} cy={d.y * U} r={0.075 * U} opacity={d.op ?? 1} />)}
      {pose.notes.map(n => {
        if ((n.op ?? 1) <= 0.02) return null;
        if (n.bracket) {
          // eckige Klammer so hoch wie der Baustein
          const h = n.bracket / 2, w = n.text === "[" ? 0.16 : -0.16;
          return <path key={n.id} className="mb-bracket" d={`M${(n.x + w) * U} ${(n.y - h) * U}H${n.x * U}V${(n.y + h) * U}H${(n.x + w) * U}`} opacity={n.op ?? 1} />;
        }
        return <text key={n.id} className={`mb-note tone-${n.tone ?? "plain"}`} x={n.x * U} y={n.y * U} dominantBaseline="central" textAnchor="middle" opacity={n.op ?? 1}>{n.text}</text>;
      })}
      {pose.arrows.map((ar, i) => {
        const p = anchorPt(pose, ar.arrow.from), q = anchorPt(pose, ar.arrow.to);
        return p && q && ar.op > 0.02 ? <ArrowPath key={i} from={p} to={q} half={ar.arrow.half} bend={ar.arrow.bend} op={ar.op} /> : null;
      })}
    </svg>
  );
}
