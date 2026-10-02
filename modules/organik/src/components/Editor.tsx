// Zeichenfläche: Atom antippen = Stift anhängen (bzw. tauschen/löschen), Bindung antippen = Einfach → Doppel → Dreifach,
// vom Atom wegziehen = neues Atom in 30°-Schritten, auf ein anderes Atom ziehen = Bindung (Ring schließen).
// Leere Fläche: erstes Atom oder Ring. In der Lewis-Formel ein H antippen = Stift an dieser Stelle anhängen.
// Maßstab fest (eine Bindung ≈ 56 px, Tippziele ≥ 48 px): das Bild springt beim Zeichnen nicht, es wird nur verschoben
// oder verkleinert, wenn die Zeichnung nicht mehr passt. Tastatur: Atome und Bindungen per Tab, Enter wie Antippen.

import { useLayoutEffect, useRef, useState } from "react";
import { buzz, IconButton } from "@lern/ui";
import { layout } from "../chem/layout.ts";
import { flipBond, keepStereo, stereoBonds } from "../chem/stereo.ts";
import { freeValence, graph, usedValence, VALENCE } from "../chem/mol.ts";
import { addRing, append, appendAt, atomAt, connect, cycleBond, move, removeAtom, removeBond, replace, start, type RingKind } from "../chem/edit.ts";
import { ELEMENTS, elLabel, type El, type Mol } from "../chem/mol.ts";
import type { NameResult } from "../chem/naming.ts";
import { useApp, type Pen } from "../store.ts";
import { decorations, MolSvg, U } from "./MolSvg.tsx";
import { coloring } from "./colors.ts";
import { tr } from "@lern/i18n";

/** Ausschnitt der Zeichenfläche: Mitte (in Bindungslängen) und Maßstab (px je Bindung) */
interface Cam { cx: number; cy: number; s: number }

/** Ausschnitt nachführen: gleich lassen, wenn alles passt; sonst minimal verschieben; erst wenn das nicht reicht, verkleinern */
function follow(cam: Cam | null, mol: Mol, w: number, h: number, pad: number, sMax: number): Cam {
  if (!mol.atoms.length) return { cx: 0, cy: 0, s: sMax };
  const xs = mol.atoms.map(a => a.x), ys = mol.atoms.map(a => a.y);
  const x0 = Math.min(...xs) - pad, x1 = Math.max(...xs) + pad, y0 = Math.min(...ys) - pad, y1 = Math.max(...ys) + pad;
  const fit = Math.min(sMax, w / (x1 - x0), h / (y1 - y0));
  let c = cam ?? { cx: (x0 + x1) / 2, cy: (y0 + y1) / 2, s: Math.min(sMax, fit) };
  if (c.s > fit + 1e-6 || c.s < Math.min(sMax, fit) * 0.6) c = { cx: (x0 + x1) / 2, cy: (y0 + y1) / 2, s: Math.min(sMax, fit) };
  const hw = w / 2 / c.s, hh = h / 2 / c.s;
  let { cx, cy } = c;
  if (x0 < cx - hw) cx = x0 + hw; else if (x1 > cx + hw) cx = x1 - hw;
  if (y0 < cy - hh) cy = y0 + hh; else if (y1 > cy + hh) cy = y1 - hh;
  return { cx, cy, s: c.s };
}

const isEl = (p: Pen): p is El => (ELEMENTS as string[]).includes(p);
const RAD = Math.PI / 180;

interface Drag { from: number; x: number; y: number; moved: boolean; id: number }

export function Editor({ res }: { res: NameResult }) {
  const { mol, setMol, pen, mode, view, shown, color, setColor } = useApp();
  const svg = useRef<SVGSVGElement>(null);
  const [drag, setDrag] = useState<Drag | null>(null);
  const downOn = useRef<Element | null>(null);
  const [no, setNo] = useState<number | null>(null);
  const box = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  useLayoutEffect(() => {
    const el = box.current;
    if (!el) return;
    const upd = () => setSize({ w: el.clientWidth, h: el.clientHeight });
    upd();
    const ro = new ResizeObserver(upd);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  // Maßstab: höchstens ~56 px je Bindung (am Handy), auf großen Flächen etwas mehr
  const sMax = Math.max(48, Math.min(72, Math.min(size.w, size.h) / 5.5));
  const cam = useRef<Cam | null>(null);
  if (size.w > 0) cam.current = follow(cam.current, mol, size.w, size.h, view === "lewis" ? 1 : 0.7, sMax);
  const c = cam.current;
  const viewBox: [number, number, number, number] | undefined = c && size.w > 0
    ? [(c.cx - size.w / 2 / c.s) * U, (c.cy - size.h / 2 / c.s) * U, (size.w / c.s) * U, (size.h / c.s) * U] : undefined;
  /** Trefferradius in Bindungslängen: mindestens 24 px, damit jedes Tippziel ≥ 48 px ist */
  const hitR = Math.max(0.42, c ? 24 / c.s : 0.42);
  // zuletzt angefügtes Atom kurz hervorheben (sichtbare Rückmeldung zum Tippen)
  const prevIds = useRef(new Set<number>());
  const fresh = mol.atoms.filter(a => prevIds.current.size && !prevIds.current.has(a.id)).map(a => a.id);
  useLayoutEffect(() => { prevIds.current = new Set(mol.atoms.map(a => a.id)); }, [mol]);

  // kurze Meldung oben auf der Zeichenfläche: warum etwas nicht geht oder was zu tun ist
  const [msg, setMsg] = useState<{ text: string; bad: boolean } | null>(null);
  const msgTimer = useRef(0);
  const say = (text: string, bad = true) => {
    setMsg({ text, bad });
    window.clearTimeout(msgTimer.current);
    msgTimer.current = window.setTimeout(() => setMsg(null), 1800);
  };
  const elOf = (id: number) => mol.atoms.find(a => a.id === id)?.el;
  const refuse = (id: number | null, why?: string) => {
    buzz([20, 40, 20]); setNo(id); window.setTimeout(() => setNo(null), 420);
    const e = id !== null ? elOf(id) : undefined;
    say(why ?? (e ? tr(`${elLabel(e)} hat keine freie Bindung mehr`, `${elLabel(e)} has no free bond left`) : tr("Geht hier nicht", "Not possible here")));
  };
  /** gelungen: kurz vibrieren (fühlbare Bestätigung), Meldung weg */
  const apply = (m: Mol | null, id: number | null = null, why?: string) => {
    if (!m) return refuse(id, why);
    buzz(8); setMsg(null); setMol(m);
  };
  const point = (e: { clientX: number; clientY: number }) => {
    const s = svg.current!, ctm = s.getScreenCTM();
    if (!ctm) return { x: 0, y: 0 };
    const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(ctm.inverse());
    return { x: p.x / U, y: p.y / U };
  };

  const tapAtom = (id: number) => {
    if (mode === "erase") return apply(removeAtom(mol, id));
    if (mode === "swap") {
      if (!isEl(pen)) return refuse(id, tr("Tauschen geht nur mit einem Element", "Swapping only works with an element"));
      const used = usedValence(graph(mol), id);
      return apply(replace(mol, id, pen), id, elOf(id) === pen ? tr(`Das ist schon ${elLabel(pen)}`, `That is already ${elLabel(pen)}`) : tr(`${elLabel(pen)} hat nur ${VALENCE[pen]} Bindung${VALENCE[pen] > 1 ? "en" : ""} – hier sind es ${used}`, `${elLabel(pen)} has only ${VALENCE[pen]} bond${VALENCE[pen] > 1 ? "s" : ""} – here there are ${used}`));
    }
    apply(isEl(pen) ? append(mol, id, pen) : addRing(mol, id, pen as RingKind), id);
  };
  /** H antippen: Stift genau dort anhängen (H wird ersetzt) */
  const tapH = (id: number, angle: number) => {
    if (mode === "erase") return refuse(id, tr("H gehört zum Atom – das Atom antippen", "H belongs to the atom – tap the atom"));
    if (!isEl(pen)) return apply(addRing(mol, id, pen as RingKind), id);
    const deg = Math.round(angle / 30) * 30;
    const a = mol.atoms.find(x => x.id === id)!;
    const busy = atomAt(mol, a.x + Math.cos(deg * RAD), a.y + Math.sin(deg * RAD), 0.5) !== undefined;
    apply(append(mol, id, pen, busy ? angle : deg), id);
  };
  const tapBond = (a: number, b: number) => {
    if (mode === "erase") return apply(removeBond(mol, a, b));
    // Tauschen an einer C=C-Doppelbindung mit E/Z: eine Seite spiegeln (E ↔ Z)
    if (mode === "swap") {
      const st = stereoBonds(mol).find(x => (x.a === a && x.b === b) || (x.a === b && x.b === a));
      if (st) {
        const f = flipBond(mol, a, b);
        if (f) { apply(f); return say(st.desc ? `${st.desc} → ${st.desc === "E" ? "Z" : "E"}` : tr("Gespiegelt", "Mirrored"), false); }
      }
      return refuse(null, tr("Tauschen an Bindungen: nur C=C mit E/Z", "Swapping bonds: only C=C with E/Z"));
    }
    apply(cycleBond(mol, a, b), null, tr("Mehr Bindungen gehen hier nicht – beide Atome sind voll", "No more bonds possible here – both atoms are full"));
  };
  const tapEmpty = () => {
    if (!mol.atoms.length) return apply(isEl(pen) ? start(pen) : addRing(mol, null, pen as RingKind));
    say(mode === "erase" ? tr("Atom oder Bindung antippen", "Tap an atom or bond") : mode === "swap" ? tr("Atom antippen = tauschen, ziehen = verschieben", "Tap an atom = swap, drag = move") : tr("Atom antippen oder davon wegziehen", "Tap an atom or drag away from it"), false);
  };
  // neu zeichnen im Zickzack – E/Z bleibt erhalten
  const tidy = () => { cam.current = null; apply(keepStereo(mol, layout(mol))); };

  /** Ziel beim Ziehen: Atom unter dem Finger oder neue Stelle (30°-Schritte, Bindungslänge 1) */
  const target = (d: Drag) => {
    const hit = atomAt(mol, d.x, d.y, 0.45);
    if (hit !== undefined && hit !== d.from) return { atom: hit, x: mol.atoms.find(a => a.id === hit)!.x, y: mol.atoms.find(a => a.id === hit)!.y };
    const a = mol.atoms.find(x => x.id === d.from)!;
    const deg = Math.round(Math.atan2(d.y - a.y, d.x - a.x) / RAD / 30) * 30;
    return { atom: undefined, x: a.x + Math.cos(deg * RAD), y: a.y + Math.sin(deg * RAD) };
  };

  const onDown = (e: React.PointerEvent<SVGSVGElement>) => {
    const el = (e.target as Element).closest("[data-atom],[data-bond],[data-h]");
    downOn.current = null;
    if (!el) { tapEmpty(); return; }
    if (!el.hasAttribute("data-atom")) { downOn.current = el; return; } // Bindung, H: beim Loslassen auf demselben Ziel
    const id = Number(el.getAttribute("data-atom"));
    const p = point(e);
    try { svg.current!.setPointerCapture(e.pointerId); } catch { /* ältere Browser: ohne Festhalten */ }
    setDrag({ from: id, x: p.x, y: p.y, moved: false, id: e.pointerId });
  };
  const onMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!drag || e.pointerId !== drag.id) return;
    const p = point(e), a = mol.atoms.find(x => x.id === drag.from)!;
    // Zittern des Fingers ist noch kein Ziehen
    const moved = drag.moved || Math.hypot(p.x - a.x, p.y - a.y) > Math.max(0.5, hitR);
    setDrag({ ...drag, x: p.x, y: p.y, moved });
  };
  const onUp = (e: React.PointerEvent<SVGSVGElement>) => {
    if (drag && e.pointerId === drag.id) {
      const d = drag;
      setDrag(null);
      // Tauschen-Modus: Ziehen verschiebt das Atom (Raster ¼ Bindung)
      if (d.moved && mode === "swap") {
        const x = Math.round(d.x * 4) / 4, y = Math.round(d.y * 4) / 4;
        const hit = atomAt(mol, x, y, 0.5);
        return hit !== undefined && hit !== d.from ? refuse(d.from, tr("Dort ist schon ein Atom", "There is already an atom there")) : apply(move(mol, d.from, x, y));
      }
      if (!d.moved || mode !== "add" || !isEl(pen)) { tapAtom(d.from); return; }
      const t = target(d);
      if (t.atom !== undefined) apply(connect(mol, d.from, t.atom), d.from,
        freeValence(mol, d.from) < 1 ? undefined : `${elLabel(elOf(t.atom)!)} hat keine freie Bindung mehr`);
      else if (atomAt(mol, t.x, t.y, 0.35) !== undefined) refuse(d.from, tr("Dort ist schon ein Atom", "There is already an atom there"));
      else apply(appendAt(mol, d.from, pen, t.x, t.y), d.from);
      return;
    }
    // nur ein vollständiges Antippen zählt: Loslassen auf dem Ziel, auf dem der Finger aufgesetzt hat
    const was = downOn.current;
    downOn.current = null;
    if (!was || !was.contains(e.target as Node)) return;
    const b = (e.target as Element).closest("[data-bond]");
    if (b) { const [x, y] = b.getAttribute("data-bond")!.split("-").map(Number); tapBond(x, y); return; }
    const hh = (e.target as Element).closest("[data-h]");
    if (hh) { const [x, ang] = hh.getAttribute("data-h")!.split(":").map(Number); tapH(x, ang); }
  };

  const key = (fn: () => void) => (e: React.KeyboardEvent) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); fn(); } };
  const ok = shown && res.ok ? res : null;
  const tint = ok && color ? coloring(ok).atomHue : undefined;
  const preview = drag?.moved && mode === "add" && isEl(pen) ? target(drag) : null;
  const moving = drag?.moved && mode === "swap" ? { x: Math.round(drag.x * 4) / 4, y: Math.round(drag.y * 4) / 4 } : null;
  const from = drag ? mol.atoms.find(a => a.id === drag.from) : undefined;
  const elName = (e: Pen) => (isEl(e) ? elLabel(e) : e === "benzol" ? tr("Benzolring", "Benzene ring") : e === "ring6" ? tr("Sechsring", "Six-membered ring") : tr("Fünfring", "Five-membered ring"));

  return (
    <div className={`og-editor mode-${mode}`} ref={box}>
      <MolSvg mol={mol} view={view} svgRef={svg} viewBox={viewBox} label={ok ? `${tr("Strukturformel", "Structural formula")}: ${ok.name}` : tr(`Zeichnung mit ${mol.atoms.length} Atomen`, `Drawing with ${mol.atoms.length} atoms`)}
        parent={ok?.parent.atoms} parentRing={ok?.parent.kind === "ring"} numbers={!!ok && ok.parent.size > 1}
        group={ok?.principalAtoms} tint={tint} ez={ok?.stereo.filter(x => x.desc)} minW={6} minH={4.2}
        onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={() => setDrag(null)}>
        <g className="og-hits">
          {fresh.map(id => { const a = mol.atoms.find(x => x.id === id)!; return <circle key={`new${id}`} className="og-new" cx={a.x * U} cy={a.y * U} r={0.42 * U} aria-hidden="true" />; })}
          {view === "lewis" && mode !== "erase" && decorations(mol).filter(d => d.kind === "H").map((d, i) => {
            const a = mol.atoms.find(x => x.id === d.atom)!;
            const x = a.x + Math.cos(d.angle * RAD) * 0.66, y = a.y + Math.sin(d.angle * RAD) * 0.66;
            return <circle key={`h${i}`} data-h={`${d.atom}:${d.angle}`} className="og-hit-h" cx={x * U} cy={y * U} r={Math.min(0.3, hitR * 0.7) * U} aria-hidden="true" />;
          })}
          {mol.bonds.map(b => {
            const p = mol.atoms.find(a => a.id === b.a)!, q = mol.atoms.find(a => a.id === b.b)!;
            const order = tr(["Einfach", "Doppel", "Dreifach"], ["Single", "Double", "Triple"])[b.order - 1];
            return (
              <line key={`${b.a}-${b.b}`} data-bond={`${b.a}-${b.b}`} className="og-hit-bond" style={{ strokeWidth: Math.max(0.4, hitR * 0.9) * U }} x1={p.x * U} y1={p.y * U} x2={q.x * U} y2={q.y * U}
                tabIndex={0} role="button" aria-label={tr(`${order}bindung ${p.el}–${q.el}`, `${order} bond ${p.el}–${q.el}`)} onKeyDown={key(() => tapBond(b.a, b.b))} />
            );
          })}
          {mol.atoms.map(a => (
            <circle key={a.id} data-atom={a.id} className={`og-hit-atom${no === a.id ? " no" : ""}${drag?.from === a.id ? " from" : ""}`}
              cx={a.x * U} cy={a.y * U} r={hitR * U} tabIndex={0} role="button" aria-label={`Atom ${elLabel(a.el)}`} onKeyDown={key(() => tapAtom(a.id))} />
          ))}
          {moving && from && (
            <g className="og-preview" aria-hidden="true">
              <line x1={from.x * U} y1={from.y * U} x2={moving.x * U} y2={moving.y * U} />
              <circle cx={moving.x * U} cy={moving.y * U} r={0.3 * U} />
              <text x={moving.x * U} y={moving.y * U} dominantBaseline="central" textAnchor="middle">{elLabel(from.el)}</text>
            </g>
          )}
          {preview && from && (
            <g className="og-preview" aria-hidden="true">
              <line x1={from.x * U} y1={from.y * U} x2={preview.x * U} y2={preview.y * U} />
              {preview.atom !== undefined && <circle className="og-target" cx={preview.x * U} cy={preview.y * U} r={hitR * U} />}
              {preview.atom === undefined && <circle cx={preview.x * U} cy={preview.y * U} r={0.26 * U} />}
              {preview.atom === undefined && <text x={preview.x * U} y={preview.y * U} dominantBaseline="central" textAnchor="middle">{elName(pen)}</text>}
            </g>
          )}
          {!mol.atoms.length && (
            <g className="og-start" role="button" tabIndex={0} aria-label={tr(`${elName(pen)} setzen`, `Place ${elName(pen)}`)} onKeyDown={key(tapEmpty)}>
              <circle cx={0} cy={0} r={0.55 * U} />
              <text x={0} y={0} dominantBaseline="central" textAnchor="middle">{isEl(pen) ? elLabel(pen) : "⬡"}</text>
            </g>
          )}
        </g>
      </MolSvg>
      <p className={`og-msg${msg ? " on" : ""}${msg?.bad ? " bad" : ""}`} role="status" aria-live="polite">{msg?.text}</p>
      {mol.atoms.length >= 3 && <IconButton icon="grid" label={tr("Ordnen", "Tidy up")} className="og-tidy" onClick={tidy} />}
      {ok && (
        <button type="button" className={`og-color${color ? " on" : ""}`} aria-pressed={color} onClick={() => setColor(!color)}>
          <span className="og-color-dots" aria-hidden="true"><i className="h-blue" /><i className="h-red" /><i className="h-green" /></span>{tr("Farbe", "Colour")}
        </button>
      )}
    </div>
  );
}
