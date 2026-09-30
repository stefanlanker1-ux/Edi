// Lewis-Darstellung auf dem Raster: Atomsymbole, Elektronen als Punkte (oder Paare als Striche), bindende Paare in einem gemeinsamen Oval.
// Großer Kreis um jedes vollständige Atom (Oktett, bei H Duett gestrichelt): Kreise benachbarter Atome überlappen, die bindenden Paare
// liegen in beiden Kreisen – so sieht man, dass sie zu beiden Atomen zählen. Jedes bindende Paar ist eine Reihe aus zwei Punkten
// entlang der Bindung (Dreifachbindung = drei Reihen), wie die Striche der Strichformel.

import { electronsOf, loneLayout, bondKey, target, type Molecule } from "@lern/chem";

export const U = 100; // Rasterzelle in SVG-Einheiten
const cx = (x: number) => x * U + U / 2;

interface Props {
  mol: Molecule;
  cols: number;
  rows: number;
  /** Ausschnitt statt ganzem Raster (für Beispiele) */
  crop?: boolean;
  showOctet?: boolean;
  grid?: boolean;
  highlightCell?: [number, number] | null;
  bondOptions?: [number, number][];
  onBond?: (a: number, b: number) => void;
  onAddBond?: (a: number, b: number) => void;
  onAtomDown?: (id: number, e: React.PointerEvent) => void;
  onCell?: (x: number, y: number) => void;
  /** Tastatur: leere Felder antippbar (wenn ein Atom ausgewählt ist) */
  cellsFocusable?: boolean;
  /** Tastatur auf einem Atom: Pfeile verschieben, Entf entfernen */
  onAtomKey?: (id: number, key: string) => void;
  /** Elektronenpaare als Striche statt als Punkte */
  lines?: boolean;
  svgRef?: React.Ref<SVGSVGElement>;
}

/** Radius der Oktett-Kreise: reicht über die bindenden Paare hinaus bis in den Kreis des Nachbarn */
const RING = 67;

/** Enter/Leertaste wie ein Klick (Tastatur) */
const onKey = (fn: () => void) => (e: React.KeyboardEvent) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); fn(); } };

function Dot({ x, y, single }: { x: number; y: number; single?: boolean }) {
  return <>
    {single && <circle cx={x} cy={y} r={11} className="e-halo" />}
    <circle cx={x} cy={y} r={6} className={`e${single ? " single" : ""}`} />
  </>;
}

/** Punkte für n Elektronen in Richtung angle (1 = einzeln, 2 = Paar quer zur Richtung; als Strich, wenn lines) */
function loneDots(x: number, y: number, angle: number, n: number, lines?: boolean) {
  const r = (angle * Math.PI) / 180, dx = Math.cos(r), dy = Math.sin(r);
  const px = x + dx * 31, py = y + dy * 31;
  if (n === 1) return <Dot x={px} y={py} single />;
  if (lines) return <line x1={px - dy * 11} y1={py + dx * 11} x2={px + dy * 11} y2={py - dx * 11} className="e-line" />;
  return <><Dot x={px - dy * 8} y={py + dx * 8} /><Dot x={px + dy * 8} y={py - dx * 8} /></>;
}

export function LewisSvg({ mol, cols, rows, crop, showOctet = true, grid, highlightCell, bondOptions = [], onBond, onAddBond, onAtomDown, onCell, cellsFocusable, onAtomKey, lines, svgRef }: Props) {
  let vb = `0 0 ${cols * U} ${rows * U}`;
  if (crop && mol.atoms.length) {
    const xs = mol.atoms.map(a => a.x), ys = mol.atoms.map(a => a.y);
    const x0 = Math.min(...xs), y0 = Math.min(...ys);
    const p = showOctet && mol.bonds.length ? RING - U / 2 + 4 : 6; // Platz für die Kreise
    vb = `${x0 * U - p} ${y0 * U - p} ${(Math.max(...xs) - x0 + 1) * U + 2 * p} ${(Math.max(...ys) - y0 + 1) * U + 2 * p}`;
  }
  const byId = new Map(mol.atoms.map(a => [a.id, a]));
  const used = new Set(mol.atoms.map(a => `${a.x},${a.y}`));
  const interactive = !!(onCell || onBond || onAtomKey);
  return (
    <svg ref={svgRef} className="lewis" viewBox={vb} role={interactive ? "group" : "img"}
      aria-label={`Lewis-Formel mit ${mol.atoms.length} Atomen und ${mol.bonds.length} Bindungen`}>
      {grid && Array.from({ length: cols * rows }, (_, i) => {
        const x = i % cols, y = Math.floor(i / cols);
        const hl = highlightCell && highlightCell[0] === x && highlightCell[1] === y;
        const focus = !!onCell && cellsFocusable && !used.has(`${x},${y}`);
        return <rect key={i} x={x * U + 6} y={y * U + 6} width={U - 12} height={U - 12} rx={4}
          className={`cell${hl ? " hl" : ""}`} onClick={onCell ? () => onCell(x, y) : undefined}
          {...(focus ? { tabIndex: 0, role: "button", "aria-label": `Feld ${y + 1}-${x + 1}`, onKeyDown: onKey(() => onCell!(x, y)) } : {})} />;
      })}

      {/* Oktett-Kreise hinter allem */}
      {showOctet && mol.atoms.map(a => {
        const e = electronsOf(mol, a.id);
        // Kreis um jedes Atom mit Edelgaskonfiguration (H: Duett, gestrichelt)
        if (!e.complete || !mol.bonds.length) return null;
        return <circle key={`o${a.id}`} cx={cx(a.x)} cy={cx(a.y)} r={RING} className={`octet${a.el === "H" ? " duet" : ""}`} />;
      })}

      {/* Bindende Elektronenpaare im gemeinsamen Oval */}
      {mol.bonds.map(b => {
        const p = byId.get(b.a)!, q = byId.get(b.b)!;
        const horiz = p.y === q.y;
        const mx = (cx(p.x) + cx(q.x)) / 2, my = (cx(p.y) + cx(q.y)) / 2;
        const len = U + 56, th = 60;
        // je Paar eine Reihe entlang der Bindung, die Reihen nebeneinander quer dazu
        const offs = b.order === 1 ? [0] : b.order === 2 ? [-9, 9] : [-17, 0, 17];
        return (
          <g key={bondKey(b.a, b.b)} className={`bond${onBond ? " tappable" : ""}`} onClick={onBond ? () => onBond(b.a, b.b) : undefined}
            tabIndex={onBond ? 0 : undefined} onKeyDown={onBond ? onKey(() => onBond(b.a, b.b)) : undefined}
            role={onBond ? "button" : undefined} aria-label={onBond ? `${b.order}-fach-Bindung ${p.el}–${q.el}, tippen zum Ändern` : undefined}>
            <rect x={mx - (horiz ? len : th) / 2} y={my - (horiz ? th : len) / 2} width={horiz ? len : th} height={horiz ? th : len} rx={th / 2} className="pair-oval" />
            {offs.map((o, i) => lines
              ? (horiz ? <line key={i} x1={mx - 16} x2={mx + 16} y1={my + o} y2={my + o} className="e-line" />
                : <line key={i} y1={my - 16} y2={my + 16} x1={mx + o} x2={mx + o} className="e-line" />)
              : horiz
                ? <g key={i}><Dot x={mx - 8} y={my + o} /><Dot x={mx + 8} y={my + o} /></g>
                : <g key={i}><Dot x={mx + o} y={my - 8} /><Dot x={mx + o} y={my + 8} /></g>)}
          </g>
        );
      })}

      {/* Mögliche neue Bindungen */}
      {bondOptions.map(([a, b]) => {
        const p = byId.get(a)!, q = byId.get(b)!;
        const mx = (cx(p.x) + cx(q.x)) / 2, my = (cx(p.y) + cx(q.y)) / 2;
        return (
          <g key={`+${a}-${b}`} className="bond-add" onClick={() => onAddBond?.(a, b)} role="button" tabIndex={0} onKeyDown={onKey(() => onAddBond?.(a, b))} aria-label={`Bindung ${p.el}–${q.el} bilden`}>
            <circle cx={mx} cy={my} r={15} /><path d={`M${mx - 7} ${my}h14M${mx} ${my - 7}v14`} />
          </g>
        );
      })}

      {/* Atome mit freien Elektronen */}
      {mol.atoms.map(a => {
        const x = cx(a.x), y = cx(a.y);
        const lone = loneLayout(mol, a.id);
        const e = electronsOf(mol, a.id);
        return (
          <g key={a.id} className={`atom${onAtomDown ? " grab" : ""}`} onPointerDown={onAtomDown ? ev => onAtomDown(a.id, ev) : undefined}
            {...(onAtomKey ? { tabIndex: 0, role: "button", "aria-label": `${a.el} – Pfeiltasten verschieben, Entf entfernen`,
              onKeyDown: (ev: React.KeyboardEvent) => { if (/^(Arrow|Delete|Backspace)/.test(ev.key)) { ev.preventDefault(); onAtomKey(a.id, ev.key); } } } : {})}>
            <circle cx={x} cy={y} r={26} className="atom-bg" />
            <text x={x} y={y} className="sym" dy=".35em">{a.el}</text>
            {lone.map(g => <g key={g.angle}>{loneDots(x, y, g.angle, g.n, lines)}</g>)}
            {showOctet && mol.bonds.length > 0 && e.complete && <text x={x + 22} y={y - 22} className="ok-mark">✓</text>}
            {showOctet && !e.complete && mol.atoms.length > 1 && <text x={x + 30} y={y + 44} className="count">{e.around}/{target(a.el)}</text>}
          </g>
        );
      })}
    </svg>
  );
}
