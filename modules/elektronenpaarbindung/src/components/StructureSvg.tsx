// Valenzstrichformel (automatisch aus dem gebauten Molekül): Bindungen als Striche, freie Elektronenpaare als kurze Striche.

import { loneLayout, polarBonds, type Molecule } from "@lern/chem";

const U = 70;
const c = (v: number) => v * U + U / 2;

export function StructureSvg({ mol, lonePairs = true, deltas = false }: { mol: Molecule; lonePairs?: boolean; deltas?: boolean }) {
  if (!mol.atoms.length) return null;
  const xs = mol.atoms.map(a => a.x), ys = mol.atoms.map(a => a.y);
  const x0 = Math.min(...xs), y0 = Math.min(...ys);
  const pad = 16;
  const vb = `${x0 * U - pad} ${y0 * U - pad} ${(Math.max(...xs) - x0 + 1) * U + 2 * pad} ${(Math.max(...ys) - y0 + 1) * U + 2 * pad}`;
  const byId = new Map(mol.atoms.map(a => [a.id, a]));
  const polar = deltas ? polarBonds(mol) : [];
  const sign = new Map<number, string>();
  for (const p of polar) { sign.set(p.plus, "δ+"); sign.set(p.minus, "δ−"); }
  return (
    <svg className="structure" viewBox={vb} role="img" aria-label="Valenzstrichformel">
      {mol.bonds.map(b => {
        const p = byId.get(b.a)!, q = byId.get(b.b)!;
        const horiz = p.y === q.y;
        const gap = 17;
        const offs = b.order === 1 ? [0] : b.order === 2 ? [-4, 4] : [-7, 0, 7];
        return offs.map((o, i) => horiz
          ? <line key={`${b.a}-${b.b}-${i}`} x1={Math.min(c(p.x), c(q.x)) + gap} x2={Math.max(c(p.x), c(q.x)) - gap} y1={c(p.y) + o} y2={c(p.y) + o} className="st-bond" />
          : <line key={`${b.a}-${b.b}-${i}`} y1={Math.min(c(p.y), c(q.y)) + gap} y2={Math.max(c(p.y), c(q.y)) - gap} x1={c(p.x) + o} x2={c(p.x) + o} className="st-bond" />);
      })}
      {mol.atoms.map(a => {
        const x = c(a.x), y = c(a.y);
        const lone = loneLayout(mol, a.id);
        return (
          <g key={a.id}>
            <text x={x} y={y} dy=".35em" className="st-sym">{a.el}</text>
            {lonePairs && lone.map(g => {
              const r = (g.angle * Math.PI) / 180, dx = Math.cos(r), dy = Math.sin(r);
              // Diagonale Paare etwas weiter außen, damit der Strich die Buchstaben nicht berührt
              const d = g.angle % 90 === 0 ? 17 : 20;
              const px = x + dx * d, py = y + dy * d;
              return g.n === 2
                ? <line key={g.angle} x1={px - dy * 8} x2={px + dy * 8} y1={py + dx * 8} y2={py - dx * 8} className="st-lone" />
                : <circle key={g.angle} cx={px} cy={py} r={3} className="st-single" />;
            })}
            {sign.has(a.id) && <text x={x + 15} y={y - 14} className="st-delta">{sign.get(a.id)}</text>}
          </g>
        );
      })}
    </svg>
  );
}
