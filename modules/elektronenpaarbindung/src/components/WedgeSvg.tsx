// Keilstrichformel: räumlicher Bau auf dem Papier (Lage aus wedgeLayout).
//   Strich = in der Papierebene, Keil = zum Betrachter, gestrichelter Keil = nach hinten.

import { useMemo } from "react";
import { polarBonds, wedgeLayout, type Molecule } from "@lern/chem";

const BOND = 70; // mittlere Bindung in Pixel (wie ein Rasterschritt der Strichformel)
const GAP = 16; // Abstand der Striche vom Atomsymbol
const gap = (el: string, ux: number) => GAP + (el.length > 1 ? 8 * Math.abs(ux) : 0);

export function WedgeSvg({ mol, lonePairs = true, deltas = false }: { mol: Molecule; lonePairs?: boolean; deltas?: boolean }) {
  const w = useMemo(() => wedgeLayout(mol), [mol]);
  const S = BOND / w.unit;
  const at = new Map(w.atoms.map(a => [a.id, { ...a, x: a.x * S, y: a.y * S }]));
  const pts = [...at.values()];
  const pad = 44;
  const x0 = Math.min(...pts.map(p => p.x)) - pad, y0 = Math.min(...pts.map(p => p.y)) - pad;
  const vb = `${x0} ${y0} ${Math.max(...pts.map(p => p.x)) + pad - x0} ${Math.max(...pts.map(p => p.y)) + pad - y0}`;
  const sign = new Map<number, string>();
  if (deltas) for (const p of polarBonds(mol)) { sign.set(p.plus, "δ+"); sign.set(p.minus, "δ−"); }

  return (
    <svg className="structure wedge" viewBox={vb} role="img" aria-label="Geometrische Strukturformel">
      {w.bonds.map(b => {
        const p = at.get(b.from)!, q = at.get(b.to)!;
        const L = Math.hypot(q.x - p.x, q.y - p.y) || 1;
        const ux = (q.x - p.x) / L, uy = (q.y - p.y) / L, nx = -uy, ny = ux;
        // zweibuchstabige Symbole (Cl, Br) sind breiter: dort in waagrechter Richtung mehr Abstand
        const ga = gap(p.el, ux), gb = gap(q.el, ux);
        const ax = p.x + ux * ga, ay = p.y + uy * ga, bx = q.x - ux * gb, by = q.y - uy * gb;
        const key = `${b.a}-${b.b}`;
        if (b.kind === "wedge") {
          const h = 6;
          return <polygon key={key} points={`${ax},${ay} ${bx + nx * h},${by + ny * h} ${bx - nx * h},${by - ny * h}`} className="st-wedge" />;
        }
        if (b.kind === "dash") {
          const n = Math.max(4, Math.round((L - ga - gb) / 6));
          return (
            <g key={key}>
              {Array.from({ length: n }, (_, i) => {
                const t = (i + 0.5) / n, h = 1 + 5.5 * t;
                const cx = ax + (bx - ax) * t, cy = ay + (by - ay) * t;
                return <line key={i} x1={cx + nx * h} y1={cy + ny * h} x2={cx - nx * h} y2={cy - ny * h} className="st-dash" />;
              })}
            </g>
          );
        }
        const offs = b.order === 1 ? [0] : b.order === 2 ? [-4, 4] : [-7, 0, 7];
        return offs.map((o, i) => <line key={`${key}-${i}`} x1={ax + nx * o} y1={ay + ny * o} x2={bx + nx * o} y2={by + ny * o} className="st-bond" />);
      })}
      {pts.map(a => {
        const lone = w.lone.get(a.id) ?? [];
        const f = ((w.free.get(a.id) ?? 315) * Math.PI) / 180;
        return (
          <g key={a.id}>
            <text x={a.x} y={a.y} dy=".35em" className="st-sym">{a.el}</text>
            {lonePairs && lone.map(g => {
              const r = (g * Math.PI) / 180, dx = Math.cos(r), dy = Math.sin(r);
              // zweibuchstabige Symbole (Cl, Br) sind breiter
              const d = 19 + (a.el.length > 1 ? 7 * Math.abs(dx) : 0);
              const px = a.x + dx * d, py = a.y + dy * d;
              return <line key={g} x1={px - dy * 8} x2={px + dy * 8} y1={py + dx * 8} y2={py - dx * 8} className="st-lone" />;
            })}
            {sign.has(a.id) && <text x={a.x + Math.cos(f) * 24} y={a.y + Math.sin(f) * 24} dy=".35em" className="st-delta mid">{sign.get(a.id)}</text>}
          </g>
        );
      })}
    </svg>
  );
}
