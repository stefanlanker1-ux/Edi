// Zeichnung einer Szene der Atom-Ansicht (Valenzstrichformel): Hinterlegung je Baustein („Kügelchen“-Farbe),
// Bindungen (Zweifachbindung: zweite Linie daneben – so wird beim Einbau einfach eine Linie ausgeblendet),
// Atome, freie Elektronenpaare (Striche), Ladungen, Elektronen (Punkte), Pfeile (Elektronenfluss) und kurze Beschriftungen.

import type { ReactNode } from "react";
import { CurlyArrow } from "@lern/chem-ui";
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

export function MechSvg({ pose, box, label, className, onPick, halos = true, lp = true, mark, pickable, marks, hitR }: {
  pose: Pose; box: Box; label: string; className?: string;
  /** Antippen eines Atoms (Kennung) */
  onPick?: (id: string) => void;
  /** Bausteine farbig hinterlegen */
  halos?: boolean;
  /** freie Elektronenpaare zeigen */
  lp?: boolean;
  /** Atom gestrichelt einkreisen */
  mark?: string;
  /** nur diese Atome sind antippbar (Trefferkreise auch für unbeschriftete Ring-Ecken und die freie Stelle) */
  pickable?: string[];
  /** Markierungen beim Antippen: gewählt, richtig (gestrichelt grün), noch nicht (gestrichelt, ✗) */
  marks?: { id: string; kind: "can" | "sel" | "ok" | "no" }[];
  /** Radius der Trefferkreise (Bindungslängen), mindestens 44 px am Bildschirm */
  hitR?: number;
}) {
  // beschriftete, sichtbare Atome: Pfeilbögen laufen nicht durch ihre Symbole
  const avoid = pose.atoms.filter(a => (a.text ?? a.el) !== "" && (a.op ?? 1) > 0.5).map(a => ({ x: a.x, y: a.y, r: 0.27 }));
  const at = new Map(pose.atoms.map(a => [a.id, a]));
  // Atome am Bildrand: ganz drin (1) … draußen (0) – was hinausragt, wird ausgeblendet statt abgeschnitten
  const vis0 = (a: Atom) => {
    const w = labelHalf(a) + 0.12, hy = 0.3;
    const d = Math.min(a.x - w - box.x0, box.x1 - a.x - w, a.y - hy - box.y0, box.y1 - a.y - hy);
    return Math.max(0, Math.min(1, (d + 0.15) / 0.25));
  };
  // Ringe am Rand verschwinden ganz (nie ein halber Ring), ihre kleinen Anhängsel (–OH, –H) mit ihnen
  const vmap = new Map(pose.atoms.map(a => [a.id, vis0(a)]));
  for (const ids of Object.values(pose.rings)) {
    const m = Math.min(...ids.map(i => vmap.get(i) ?? 1));
    if (m < 1) for (const i of ids) vmap.set(i, m < 0.5 ? 0 : m);
  }
  const nbs = new Map<string, string[]>();
  for (const b of pose.bonds) { nbs.set(b.a, [...(nbs.get(b.a) ?? []), b.b]); nbs.set(b.b, [...(nbs.get(b.b) ?? []), b.a]); }
  const isH = (id: string) => at.get(id)?.el === "H" && !at.get(id)?.text;
  for (let pass = 0; pass < 2; pass++) for (const a of pose.atoms) {
    const n = nbs.get(a.id) ?? [], heavy = n.filter(x => !isH(x));
    if (heavy.length === 1 && (isH(a.id) || n.length <= 2)) vmap.set(a.id, Math.min(vmap.get(a.id) ?? 1, vmap.get(heavy[0]) ?? 1));
  }
  // antippbare Atome bleiben sichtbar, solange sie im Bild liegen (auch wenn ihr Nachbar am Rand ausgeblendet ist)
  for (const p of pickable ?? []) for (const id of p.split("|")) { const a = at.get(id); if (a) vmap.set(id, vis0(a)); }
  // Atome, an denen ein Elektronenpfeil ansetzt (und ihre H‑Atome), ebenso – sonst zeigte der Pfeil ins Leere
  const apts = pose.arrows.flatMap(ar => [anchorPt(pose, ar.arrow.from), anchorPt(pose, ar.arrow.to)]).filter((q): q is Pt => !!q);
  // Ringe nicht: ein Ring am Rand bleibt ganz weg (nie ein halber Ring)
  const inRing = new Set(Object.values(pose.rings).flat());
  for (const a of pose.atoms) if (!inRing.has(a.id) && apts.some(q => Math.hypot(a.x - q.x, a.y - q.y) < 0.7)) {
    vmap.set(a.id, vis0(a));
    for (const h of nbs.get(a.id) ?? []) { const x = at.get(h); if (x && isH(h)) vmap.set(h, vis0(x)); }
  }
  const vis = (a: Atom) => vmap.get(a.id) ?? vis0(a);
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
      {onPick && pose.atoms.map(a => ((a.op ?? 1) * vis(a) > 0.5 && (pickable ? pickable.includes(a.id) : (a.text ?? a.el))
        ? <circle key={`hit${a.id}`} className="pm-hit" cx={a.x * U} cy={a.y * U} r={(hitR ?? (a.el === "H" && !a.text ? 0.38 : 0.46)) * U} data-atom={a.id} />
        : null))}
      {/* Bindungen antippen: Kennung „a|b“, breite unsichtbare Trefferlinie */}
      {onPick && pickable?.filter(id => id.includes("|")).map(id => {
        const [A, B] = id.split("|").map(x => at.get(x));
        return A && B ? <line key={`hb${id}`} className="pm-hit-bond" x1={A.x * U} y1={A.y * U} x2={B.x * U} y2={B.y * U} data-atom={id} /> : null;
      })}
      {marks?.map(m => {
        if (m.id.includes("|")) {
          const [A, B] = m.id.split("|").map(x => at.get(x));
          if (!A || !B) return null;
          const mx = (A.x + B.x) / 2, my = (A.y + B.y) / 2;
          // Bindung als Kapsel zwischen den Atomzeichen (wie die Kreise um Atome), nicht über den Buchstaben
          const len = Math.max(0.3, Math.hypot(B.x - A.x, B.y - A.y) - 0.4), ang = (Math.atan2(B.y - A.y, B.x - A.x) * 180) / Math.PI;
          return (
            <g key={`mk${m.id}`} className={`mb-pick bond ${m.kind}`} pointerEvents="none">
              <rect x={(mx - len / 2) * U} y={(my - 0.17) * U} width={len * U} height={0.34 * U} rx={0.17 * U} transform={`rotate(${ang} ${mx * U} ${my * U})`} />
              {(m.kind === "ok" || m.kind === "no") && <text x={mx * U} y={(my - 0.38) * U} dominantBaseline="central" textAnchor="middle">{m.kind === "ok" ? "✓" : "✗"}</text>}
            </g>
          );
        }
        const a = at.get(m.id);
        if (!a) return null;
        const r = (a.el === "H" && !a.text ? 0.34 : 0.44) * U;
        return (
          <g key={`mk${m.id}`} className={`mb-pick ${m.kind}`} pointerEvents="none">
            <circle cx={a.x * U} cy={a.y * U} r={r} />
            {(m.kind === "ok" || m.kind === "no") && <text x={(a.x + 0.42) * U} y={(a.y - 0.42) * U} dominantBaseline="central" textAnchor="middle">{m.kind === "ok" ? "✓" : "✗"}</text>}
          </g>
        );
      })}
      {mark && at.get(mark) && <circle className="mb-mark" cx={at.get(mark)!.x * U} cy={at.get(mark)!.y * U} r={0.62 * U} />}
      {pose.dots.map(d => (d.op ?? 1) > 0.02 && <circle key={d.id} className="mb-e" cx={d.x * U} cy={d.y * U} r={0.075 * U} opacity={d.op ?? 1} />)}
      {pose.notes.map(n => {
        if ((n.op ?? 1) <= 0.02) return null;
        if (n.bracket) {
          // eckige Klammer so hoch wie der Baustein
          const h = n.bracket / 2, w = n.text === "[" ? 0.16 : -0.16;
          return <path key={n.id} className="mb-bracket" d={`M${(n.x + w) * U} ${(n.y - h) * U}H${n.x * U}V${(n.y + h) * U}H${(n.x + w) * U}`} opacity={n.op ?? 1} />;
        }
        // mehrzeilig mit „\n“, als Block um n.y zentriert
        const lines = n.text.split("\n");
        return <text key={n.id} className={`mb-note tone-${n.tone ?? "plain"}`} x={n.x * U} y={n.y * U} dominantBaseline="central" textAnchor="middle" opacity={n.op ?? 1}>
          {lines.length === 1 ? n.text : lines.map((l, k) => <tspan key={k} x={n.x * U} dy={k ? "1.15em" : `${-(lines.length - 1) * 0.575}em`}>{l}</tspan>)}
        </text>;
      })}
      {pose.arrows.map((ar, i) => {
        const p = anchorPt(pose, ar.arrow.from), q = anchorPt(pose, ar.arrow.to);
        // Elektronenpfeile zentral (@lern/chem-ui): Bogen weicht beschrifteten Atomen aus
        return p && q && ar.op > 0.02 ? <CurlyArrow key={i} from={p} to={q} half={ar.arrow.half} bend={ar.arrow.bend} opacity={ar.op} scale={U} avoid={avoid} /> : null;
      })}
    </svg>
  );
}
