// Zeichenfläche: Atom antippen = Stift anhängen (bzw. tauschen/löschen), Bindung antippen = Einfach → Doppel → Dreifach,
// vom Atom wegziehen = neues Atom in 30°-Schritten, auf ein anderes Atom ziehen = Bindung (Ring schließen).
// Leere Fläche: erstes Atom oder Ring. Tastatur: Atome und Bindungen per Tab, Enter wie Antippen.

import { useRef, useState } from "react";
import { buzz } from "@lern/ui";
import { addRing, append, appendAt, atomAt, connect, cycleBond, removeAtom, removeBond, replace, start, type RingKind } from "../chem/edit.ts";
import { ELEMENTS, elLabel, type El, type Mol } from "../chem/mol.ts";
import type { NameResult } from "../chem/naming.ts";
import { useApp, type Pen } from "../store.ts";
import { MolSvg, U } from "./MolSvg.tsx";

const isEl = (p: Pen): p is El => (ELEMENTS as string[]).includes(p);
const RAD = Math.PI / 180;

interface Drag { from: number; x: number; y: number; moved: boolean; id: number }

export function Editor({ res }: { res: NameResult }) {
  const { mol, setMol, pen, mode, view, shown } = useApp();
  const svg = useRef<SVGSVGElement>(null);
  const [drag, setDrag] = useState<Drag | null>(null);
  const [no, setNo] = useState<number | null>(null);

  const refuse = (id: number | null) => { buzz([20, 40, 20]); setNo(id); window.setTimeout(() => setNo(null), 420); };
  const apply = (m: Mol | null, id: number | null = null) => (m ? setMol(m) : refuse(id));
  const point = (e: { clientX: number; clientY: number }) => {
    const s = svg.current!, ctm = s.getScreenCTM();
    if (!ctm) return { x: 0, y: 0 };
    const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(ctm.inverse());
    return { x: p.x / U, y: p.y / U };
  };

  const tapAtom = (id: number) => {
    if (mode === "erase") return setMol(removeAtom(mol, id));
    if (mode === "swap") return isEl(pen) ? apply(replace(mol, id, pen), id) : refuse(id);
    apply(isEl(pen) ? append(mol, id, pen) : addRing(mol, id, pen as RingKind), id);
  };
  const tapBond = (a: number, b: number) => (mode === "erase" ? setMol(removeBond(mol, a, b)) : apply(cycleBond(mol, a, b)));
  const tapEmpty = () => { if (!mol.atoms.length) setMol(isEl(pen) ? start(pen) : addRing(mol, null, pen as RingKind)!); };

  /** Ziel beim Ziehen: Atom unter dem Finger oder neue Stelle (30°-Schritte, Bindungslänge 1) */
  const target = (d: Drag) => {
    const hit = atomAt(mol, d.x, d.y, 0.45);
    if (hit !== undefined && hit !== d.from) return { atom: hit, x: mol.atoms.find(a => a.id === hit)!.x, y: mol.atoms.find(a => a.id === hit)!.y };
    const a = mol.atoms.find(x => x.id === d.from)!;
    const deg = Math.round(Math.atan2(d.y - a.y, d.x - a.x) / RAD / 30) * 30;
    return { atom: undefined, x: a.x + Math.cos(deg * RAD), y: a.y + Math.sin(deg * RAD) };
  };

  const onDown = (e: React.PointerEvent<SVGSVGElement>) => {
    const el = (e.target as Element).closest("[data-atom],[data-bond]");
    if (!el) { tapEmpty(); return; }
    if (el.hasAttribute("data-bond")) return; // Bindung: beim Loslassen
    const id = Number(el.getAttribute("data-atom"));
    const p = point(e);
    svg.current!.setPointerCapture(e.pointerId);
    setDrag({ from: id, x: p.x, y: p.y, moved: false, id: e.pointerId });
  };
  const onMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!drag || e.pointerId !== drag.id) return;
    const p = point(e), a = mol.atoms.find(x => x.id === drag.from)!;
    const moved = drag.moved || Math.hypot(p.x - a.x, p.y - a.y) > 0.45;
    setDrag({ ...drag, x: p.x, y: p.y, moved });
  };
  const onUp = (e: React.PointerEvent<SVGSVGElement>) => {
    if (drag && e.pointerId === drag.id) {
      const d = drag;
      setDrag(null);
      if (!d.moved || mode !== "add" || !isEl(pen)) { tapAtom(d.from); return; }
      const t = target(d);
      if (t.atom !== undefined) apply(connect(mol, d.from, t.atom), d.from);
      else if (atomAt(mol, t.x, t.y, 0.35) !== undefined) refuse(d.from);
      else apply(appendAt(mol, d.from, pen, t.x, t.y), d.from);
      return;
    }
    const b = (e.target as Element).closest("[data-bond]");
    if (b) { const [x, y] = b.getAttribute("data-bond")!.split("-").map(Number); tapBond(x, y); }
  };

  const key = (fn: () => void) => (e: React.KeyboardEvent) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); fn(); } };
  const ok = shown && res.ok ? res : null;
  const preview = drag?.moved && mode === "add" && isEl(pen) ? target(drag) : null;
  const from = drag ? mol.atoms.find(a => a.id === drag.from) : undefined;
  const elName = (e: Pen) => (isEl(e) ? elLabel(e) : e === "benzol" ? "Benzolring" : e === "ring6" ? "Sechsring" : "Fünfring");

  return (
    <div className={`og-editor mode-${mode}`}>
      <MolSvg mol={mol} view={view} svgRef={svg} label={ok ? `Strukturformel: ${ok.name}` : `Zeichnung mit ${mol.atoms.length} Atomen`}
        parent={ok?.parent.atoms} parentRing={ok?.parent.kind === "ring"} numbers={!!ok && ok.parent.size > 1}
        group={ok?.principalAtoms} minW={6} minH={4.2}
        onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={() => setDrag(null)}>
        <g className="og-hits">
          {mol.bonds.map(b => {
            const p = mol.atoms.find(a => a.id === b.a)!, q = mol.atoms.find(a => a.id === b.b)!;
            const order = ["Einfach", "Doppel", "Dreifach"][b.order - 1];
            return (
              <line key={`${b.a}-${b.b}`} data-bond={`${b.a}-${b.b}`} className="og-hit-bond" x1={p.x * U} y1={p.y * U} x2={q.x * U} y2={q.y * U}
                tabIndex={0} role="button" aria-label={`${order}bindung ${p.el}–${q.el}`} onKeyDown={key(() => tapBond(b.a, b.b))} />
            );
          })}
          {mol.atoms.map(a => (
            <circle key={a.id} data-atom={a.id} className={`og-hit-atom${no === a.id ? " no" : ""}${drag?.from === a.id ? " from" : ""}`}
              cx={a.x * U} cy={a.y * U} r={0.4 * U} tabIndex={0} role="button" aria-label={`Atom ${elLabel(a.el)}`} onKeyDown={key(() => tapAtom(a.id))} />
          ))}
          {preview && from && (
            <g className="og-preview" aria-hidden="true">
              <line x1={from.x * U} y1={from.y * U} x2={preview.x * U} y2={preview.y * U} />
              {preview.atom === undefined && <circle cx={preview.x * U} cy={preview.y * U} r={0.26 * U} />}
              {preview.atom === undefined && <text x={preview.x * U} y={preview.y * U} dominantBaseline="central" textAnchor="middle">{elName(pen)}</text>}
            </g>
          )}
          {!mol.atoms.length && (
            <g className="og-start" role="button" tabIndex={0} aria-label={`${elName(pen)} setzen`} onKeyDown={key(tapEmpty)}>
              <circle cx={0} cy={0} r={0.55 * U} />
              <text x={0} y={0} dominantBaseline="central" textAnchor="middle">{isEl(pen) ? elLabel(pen) : "⬡"}</text>
            </g>
          )}
        </g>
      </MolSvg>
      {no !== null && <span className="sr-only" role="status">Geht nicht – Wertigkeit voll</span>}
    </div>
  );
}
