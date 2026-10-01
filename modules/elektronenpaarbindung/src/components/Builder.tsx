// Baufeld: Atome aus der Leiste ziehen (oder antippen und dann ein Feld antippen), auf dem Raster verschieben,
// aus dem Feld ziehen zum Entfernen. Bindungen entstehen automatisch zwischen Nachbarn; Tipp auf eine Bindung ändert sie.

import { useRef, useState } from "react";
import { buzz } from "@lern/ui";
import { electronsOf, elementName, VALENCE, type Molecule } from "@lern/chem";
import { COLS, ROWS, atomAt, place, move, remove, cycleBond, addBond, bondOptions } from "../edit.ts";
import { LewisSvg } from "./LewisSvg.tsx";

/** Kleines Lewis-Symbol eines einzelnen Atoms (für die Leiste) */
export function AtomChip({ el }: { el: string }) {
  const m: Molecule = { atoms: [{ id: 1, el, x: 0, y: 0 }], bonds: [] };
  return <LewisSvg mol={m} cols={1} rows={1} showOctet={false} />;
}

export function Builder({ mol, onChange, elements, onInfo, lines, octet = true }: {
  mol: Molecule; onChange: (m: Molecule) => void; elements: string[]; onInfo?: (msg: string) => void; lines?: boolean; octet?: boolean;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [armed, setArmed] = useState<string | null>(null);
  const [drag, setDrag] = useState<{ el: string; x: number; y: number } | null>(null);
  const [hl, setHl] = useState<[number, number] | null>(null);

  const cellAt = (cx: number, cy: number): [number, number] | null => {
    const r = svgRef.current!.getBoundingClientRect();
    if (cx < r.left || cx > r.right || cy < r.top || cy > r.bottom) return null;
    return [Math.floor(((cx - r.left) / r.width) * COLS), Math.floor(((cy - r.top) / r.height) * ROWS)];
  };

  const startDrag = (e: React.PointerEvent, el: string, fromId?: number) => {
    if (e.button > 0) return;
    e.preventDefault();
    const x0 = e.clientX, y0 = e.clientY;
    let moved = false;
    const mv = (ev: PointerEvent) => {
      if (!moved && Math.hypot(ev.clientX - x0, ev.clientY - y0) > 6) moved = true;
      if (!moved) return;
      setDrag({ el, x: ev.clientX, y: ev.clientY });
      setHl(cellAt(ev.clientX, ev.clientY));
    };
    const up = (ev: PointerEvent) => {
      window.removeEventListener("pointermove", mv);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
      setDrag(null); setHl(null);
      if (ev.type === "pointercancel") return;
      if (!moved) { if (fromId === undefined) setArmed(el); return; }
      const cell = cellAt(ev.clientX, ev.clientY);
      if (fromId !== undefined) {
        if (!cell) { onChange(remove(mol, fromId)); buzz(20); onInfo?.(`${el} entfernt`); return; }
        const next = move(mol, fromId, cell[0], cell[1]);
        if (next !== mol) { buzz(); onChange(next); }
        return;
      }
      if (cell && !atomAt(mol, cell[0], cell[1])) { buzz(); onChange(place(mol, el, cell[0], cell[1])); setArmed(null); }
    };
    window.addEventListener("pointermove", mv);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
  };

  const onCell = (x: number, y: number) => {
    if (!armed || atomAt(mol, x, y)) return;
    buzz(); onChange(place(mol, armed, x, y));
  };
  const onBond = (a: number, b: number) => {
    const r = cycleBond(mol, a, b);
    buzz(); onChange(r.mol);
    if (r.action === "removed") onInfo?.("Bindung gelöst – ＋ bindet neu");
  };

  // Tastatur: Pfeile verschieben das Atom um ein Feld, Entf entfernt es
  const onAtomKey = (id: number, key: string) => {
    const a = mol.atoms.find(t => t.id === id);
    if (!a) return;
    if (key === "Delete" || key === "Backspace") { onChange(remove(mol, id)); buzz(20); onInfo?.(`${a.el} entfernt`); return; }
    const [dx, dy] = key === "ArrowLeft" ? [-1, 0] : key === "ArrowRight" ? [1, 0] : key === "ArrowUp" ? [0, -1] : [0, 1];
    const x = a.x + dx, y = a.y + dy;
    if (x < 0 || y < 0 || x >= COLS || y >= ROWS) return;
    const next = move(mol, id, x, y);
    if (next !== mol) { buzz(); onChange(next); }
  };

  return (
    <div className="builder">
      <div className="palette" role="toolbar" aria-label="Atome">
        {elements.map(el => {
          const e = electronsOf({ atoms: [{ id: 1, el, x: 0, y: 0 }], bonds: [] }, 1);
          return (
            <button key={el} type="button" className={`pal-atom${armed === el ? " armed" : ""}`} onPointerDown={ev => startDrag(ev, el)}
              onClick={ev => { if (ev.detail === 0) setArmed(el); }}
              aria-pressed={armed === el} aria-label={`${elementName(el)}: ${VALENCE[el]} Außenelektronen, ${e.singles} ungepaart`}>
              <span className="pal-svg"><AtomChip el={el} /></span>
              <span className="pal-name">{elementName(el)}</span>
            </button>
          );
        })}
      </div>
      <div className={`board${armed ? " armed" : ""}`}>
        {/* Ausgewähltes Atom: kleiner „Fertig“-Knopf in der Ecke – nichts verrutscht, kein Text */}
        {armed && (
          <button type="button" className="armed-done" onClick={() => setArmed(null)} aria-label={`${elementName(armed)} ablegen beenden`}>
            <b>{armed}</b> Fertig
          </button>
        )}
        <LewisSvg svgRef={svgRef} mol={mol} cols={COLS} rows={ROWS} grid highlightCell={hl}
          bondOptions={bondOptions(mol)} onBond={onBond} onAddBond={(a, b) => { buzz(); onChange(addBond(mol, a, b)); }}
          onAtomDown={(id, e) => startDrag(e, mol.atoms.find(a => a.id === id)!.el, id)} onCell={onCell}
          cellsFocusable={!!armed} onAtomKey={onAtomKey} lines={lines} rings={octet} />
        {!mol.atoms.length && !armed && <p className="board-empty">Atom hierher ziehen</p>}
      </div>
      {drag && <div className="atom-ghost" style={{ transform: `translate(${drag.x}px, ${drag.y}px)` }}>{drag.el}</div>}
    </div>
  );
}
