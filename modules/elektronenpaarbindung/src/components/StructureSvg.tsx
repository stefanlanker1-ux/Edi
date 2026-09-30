// Valenzstrichformel (automatisch aus dem gebauten Molekül): Bindungen als Striche, freie Elektronenpaare als kurze Striche.
// Lage aus strichLayout: wie im Baufeld, gewinkelte Moleküle (H₂O …) gebogen.

import { useMemo } from "react";
import { polarBonds, type Molecule } from "@lern/chem";
import { strichLayout } from "../strich.ts";

const U = 70;
const GAP = 17; // Abstand der Striche vom Atomsymbol

export function StructureSvg({ mol, lonePairs = true, deltas = false }: { mol: Molecule; lonePairs?: boolean; deltas?: boolean }) {
  const l = useMemo(() => strichLayout(mol), [mol]);
  if (!mol.atoms.length) return null;
  const at = new Map(mol.atoms.map(a => { const [x, y] = l.pos.get(a.id)!; return [a.id, { ...a, x: x * U + U / 2, y: y * U + U / 2 }]; }));
  const pts = [...at.values()];
  const pad = 16 + U / 2;
  const x0 = Math.min(...pts.map(p => p.x)) - pad, y0 = Math.min(...pts.map(p => p.y)) - pad;
  const vb = `${x0} ${y0} ${Math.max(...pts.map(p => p.x)) + pad - x0} ${Math.max(...pts.map(p => p.y)) + pad - y0}`;
  const sign = new Map<number, string>();
  if (deltas) for (const p of polarBonds(mol)) { sign.set(p.plus, "δ+"); sign.set(p.minus, "δ−"); }
  return (
    <svg className="structure" viewBox={vb} role="img" aria-label="Valenzstrichformel">
      {mol.bonds.map(b => {
        const p = at.get(b.a)!, q = at.get(b.b)!;
        const L = Math.hypot(q.x - p.x, q.y - p.y) || 1;
        const ux = (q.x - p.x) / L, uy = (q.y - p.y) / L, nx = -uy, ny = ux;
        const offs = b.order === 1 ? [0] : b.order === 2 ? [-4, 4] : [-7, 0, 7];
        return offs.map((o, i) => (
          <line key={`${b.a}-${b.b}-${i}`} x1={p.x + ux * GAP + nx * o} y1={p.y + uy * GAP + ny * o} x2={q.x - ux * GAP + nx * o} y2={q.y - uy * GAP + ny * o} className="st-bond" />
        ));
      })}
      {pts.map(a => (
        <g key={a.id}>
          <text x={a.x} y={a.y} dy=".35em" className="st-sym">{a.el}</text>
          {lonePairs && l.lone.get(a.id)!.map(g => {
            const r = (g.angle * Math.PI) / 180, dx = Math.cos(r), dy = Math.sin(r);
            // schräge Paare etwas weiter außen, damit der Strich die Buchstaben nicht berührt; zweibuchstabige Symbole sind breiter
            const d = 17 + 6 * Math.abs(dx * dy) + (a.el.length > 1 ? 7 * Math.abs(dx) : 0);
            const px = a.x + dx * d, py = a.y + dy * d;
            return g.n === 2
              ? <line key={g.angle} x1={px - dy * 8} x2={px + dy * 8} y1={py + dx * 8} y2={py - dx * 8} className="st-lone" />
              : <circle key={g.angle} cx={px} cy={py} r={3} className="st-single" />;
          })}
          {sign.has(a.id) && <text x={a.x + 15} y={a.y - 14} className="st-delta">{sign.get(a.id)}</text>}
        </g>
      ))}
    </svg>
  );
}
