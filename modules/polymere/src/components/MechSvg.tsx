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

/** Bindung, die aus dem Bild hinausführt: halbe Bindung vom sichtbaren Atom aus, dann eine Wellenlinie (die Kette geht dort weiter) */
function CutBond({ A, B, op }: { A: Atom; B: Atom; op: number }) {
  const seg = trim(A, B);
  if (!seg) return null;
  const p = seg[0], dx = B.x - A.x, dy = B.y - A.y, l = Math.hypot(dx, dy) || 1, ux = dx / l, uy = dy / l;
  const m = { x: A.x + ux * 0.62, y: A.y + uy * 0.62 };
  const nx = -uy, ny = ux, h = 0.2;
  // Wellenlinie quer zur Bindung (zwei Bögen)
  const w0 = { x: m.x - nx * h, y: m.y - ny * h }, w1 = { x: m.x + nx * h, y: m.y + ny * h };
  const c1 = { x: m.x - nx * h / 2 + ux * 0.12, y: m.y - ny * h / 2 + uy * 0.12 }, c2 = { x: m.x + nx * h / 2 - ux * 0.12, y: m.y + ny * h / 2 - uy * 0.12 };
  return (
    <g className="mb-bond mb-cut" opacity={op}>
      <line className="mb-line" x1={p.x * U} y1={p.y * U} x2={m.x * U} y2={m.y * U} />
      <path className="mb-wave" d={`M${w0.x * U} ${w0.y * U} Q${c1.x * U} ${c1.y * U} ${m.x * U} ${m.y * U} Q${c2.x * U} ${c2.y * U} ${w1.x * U} ${w1.y * U}`} />
    </g>
  );
}

function BondLines({ b, at, rings, vis }: { b: PBond; at: Map<string, Atom>; rings: Record<string, string[]>; vis: (a: Atom) => number }) {
  const A0 = at.get(b.a), B0 = at.get(b.b);
  if (!A0 || !B0) return null;
  const va = vis(A0), vb = vis(B0);
  // eine Seite außerhalb des Bilds: Wellenlinie statt abgeschnittener Atome
  const cut = Math.abs(va - vb) * b.op * Math.min(A0.op ?? 1, B0.op ?? 1);
  const cutEl = cut > 0.02 && b.k !== "coord" && b.k !== "ts" ? (va > vb ? <CutBond A={A0} B={B0} op={cut} /> : <CutBond A={B0} B={A0} op={cut} />) : null;
  const fade = Math.min(va, vb);
  if (fade < 0.02) return cutEl;
  const A = fade < 1 ? { ...A0, op: (A0.op ?? 1) * fade } : A0, B = B0;
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
  return <>{cutEl}<g className="mb-bond">{out}</g></>;
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

export function MechSvg({ pose, box, label, className, onPick, halos = true, lp = true, mark }: {
  pose: Pose; box: Box; label: string; className?: string;
  /** Antippen eines Atoms (Kennung) */
  onPick?: (id: string) => void;
  /** Bausteine farbig hinterlegen */
  halos?: boolean;
  /** freie Elektronenpaare zeigen */
  lp?: boolean;
  /** Atom gestrichelt einkreisen */
  mark?: string;
}) {
  const at = new Map(pose.atoms.map(a => [a.id, a]));
  // Atome am Bildrand: ganz drin (1) … draußen (0) – was hinausragt, wird ausgeblendet statt abgeschnitten
  const vis = (a: Atom) => {
    const w = labelHalf(a) + 0.12, hy = 0.3;
    const d = Math.min(a.x - w - box.x0, box.x1 - a.x - w, a.y - hy - box.y0, box.y1 - a.y - hy);
    return Math.max(0, Math.min(1, (d + 0.15) / 0.25));
  };
  const vb = [box.x0 * U, box.y0 * U, (box.x1 - box.x0) * U, (box.y1 - box.y0) * U].join(" ");
  // Hinterlegung je Baustein
  const halo: ReactNode[] = [];
  if (halos) {
    for (const b of pose.bonds) {
      const A = at.get(b.a), B = at.get(b.b);
      if (!A || !B || A.unit === undefined || A.unit !== B.unit || !A.hue || b.k === "coord" || b.k === "ts") continue;
      const op = Math.min((A.op ?? 1) * vis(A), (B.op ?? 1) * vis(B)) * b.op;
      if (op < 0.02) continue;
      halo.push(<line key={`hb${halo.length}`} className={`mb-halo-l hue-${A.hue}`} x1={A.x * U} y1={A.y * U} x2={B.x * U} y2={B.y * U} opacity={op} />);
    }
    // Ringe ganz hinterlegen (sonst bliebe innen ein helles Sechseck, das wie ein zweiter Ring aussieht)
    for (const [rid, ids] of Object.entries(pose.rings)) {
      const ps = ids.map(i => at.get(i)).filter((x): x is Atom => !!x);
      const h = ps[0];
      if (ps.length < 3 || !h?.hue || h.unit === undefined || ps.some(p => p.unit !== h.unit)) continue;
      const op = Math.min(...ps.map(p => (p.op ?? 1) * vis(p)));
      if (op < 0.02) continue;
      halo.push(<polygon key={`hr${rid}`} className={`mb-halo hue-${h.hue}`} points={ps.map(p => `${p.x * U},${p.y * U}`).join(" ")} opacity={op} />);
    }
    for (const a of pose.atoms) if (a.hue && a.unit !== undefined && (a.op ?? 1) * vis(a) > 0.02 && !a.vac) halo.push(<circle key={`ha${a.id}`} className={`mb-halo hue-${a.hue}`} cx={a.x * U} cy={a.y * U} r={(a.el === "H" && !a.text ? 0.3 : 0.4) * U} opacity={(a.op ?? 1) * vis(a)} />);
  }
  return (
    <svg className={`mb-svg${className ? " " + className : ""}`} viewBox={vb} role="img" aria-label={label} preserveAspectRatio="xMidYMid meet"
      onClick={onPick ? e => { const id = (e.target as Element).closest("[data-atom]")?.getAttribute("data-atom"); if (id) onPick(id); } : undefined}>
      <g className="mb-halos">{halo}</g>
      {pose.bonds.map((b, i) => <BondLines key={`${b.a}|${b.b}|${i}`} b={b} at={at} rings={pose.rings} vis={vis} />)}
      {pose.atoms.map(a => {
        const op = (a.op ?? 1) * vis(a);
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
      {/* Antippen: unsichtbare Trefferkreise je Atom (größer als die Schrift) */}
      {onPick && pose.atoms.map(a => ((a.op ?? 1) * vis(a) > 0.5 && (a.text ?? a.el)
        ? <circle key={`hit${a.id}`} className="pm-hit" cx={a.x * U} cy={a.y * U} r={(a.el === "H" && !a.text ? 0.38 : 0.46) * U} data-atom={a.id} />
        : null))}
      {mark && at.get(mark) && <circle className="mb-mark" cx={at.get(mark)!.x * U} cy={at.get(mark)!.y * U} r={0.62 * U} />}
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
