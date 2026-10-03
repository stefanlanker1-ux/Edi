// Zeichnen und benennen: Zeichenfläche als Bühne, darunter Stifte (Elemente, Ringe), Modus und Namensleiste.
// Werkzeuge: Beispiele | Lösungsweg | Gruppen (Prioritäten) | Ansicht Lewis/Gerüst | 3D (nur App) | Rückgängig | Neu.

import { useMemo, useState } from "react";
import { Button, RichText, Segmented, Sheet, Tag, tr, Workbench, type WorkbenchTool } from "@lern/ui";
import { forceFieldAvailable, storedFor } from "@lern/chem-ui";
import { ffInput } from "../chem/forcefield.ts";
import { ELEMENTS, elLabel, type El } from "../chem/mol.ts";
import { name, KIND_INFO, RANK, type NameOk } from "../chem/naming.ts";
import { coloring } from "../components/colors.ts";
import { EXAMPLES, exampleMol } from "../chem/examples.ts";
import type { RingKind } from "../chem/edit.ts";
import { Editor } from "../components/Editor.tsx";
import { MolSvg } from "../components/MolSvg.tsx";
import { View3D } from "../components/View3D.tsx";
import { useApp, type Mode, type Pen } from "../store.ts";

const MAIN: Pen[] = ["C", "O", "N", "S"];
const MORE: Pen[] = ["F", "Cl", "Br", "I", "NO2", "benzol", "ring6", "ring5"];
const RING_LABEL: Record<RingKind, string> = tr({ benzol: "Benzolring", ring6: "Sechsring", ring5: "Fünfring" }, { benzol: "Benzene ring", ring6: "Six-membered ring", ring5: "Five-membered ring" });
const isEl = (p: Pen): p is El => (ELEMENTS as string[]).includes(p);
export const penLabel = (p: Pen) => (isEl(p) ? elLabel(p) : RING_LABEL[p as RingKind]);

/** kleines Ringsymbol für die Stifte */
function RingIcon({ kind }: { kind: RingKind }) {
  const n = kind === "ring5" ? 5 : 6, r = 9;
  const pts = Array.from({ length: n }, (_, i) => {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / n;
    return [12 + r * Math.cos(a), 12 + r * Math.sin(a)];
  });
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" className="og-ring-icon">
      <polygon points={pts.map(p => p.join(",")).join(" ")} />
      {kind === "benzol" && [0, 2, 4].map(i => {
        const [x1, y1] = pts[i], [x2, y2] = pts[(i + 1) % n];
        const k = 0.72, mx = 12, my = 12;
        return <line key={i} x1={mx + (x1 - mx) * k} y1={my + (y1 - my) * k} x2={mx + (x2 - mx) * k} y2={my + (y2 - my) * k} />;
      })}
    </svg>
  );
}
const PenFace = ({ p }: { p: Pen }) => (isEl(p) ? <span>{elLabel(p)}</span> : <RingIcon kind={p as RingKind} />);

function Palette() {
  const { pen, extra, setPen } = useApp();
  const [more, setMore] = useState(false);
  const pens = [...MAIN, extra];
  return (
    <div className="og-pens" role="toolbar" aria-label={tr("Stifte", "Pens")}>
      {pens.map(p => (
        <button key={p} type="button" className={`og-pen${pen === p ? " on" : ""}`} aria-pressed={pen === p} aria-label={penLabel(p)} onClick={() => setPen(p)}>
          <PenFace p={p} />
        </button>
      ))}
      <button type="button" className="og-pen more" aria-haspopup="dialog" onClick={() => setMore(true)}>{tr("Mehr", "More")}</button>
      <Sheet open={more} title={tr("Stifte", "Pens")} onClose={() => setMore(false)}>
        <div className="og-more">
          {MORE.map(p => (
            <button key={p} type="button" className={`og-pen big${pen === p ? " on" : ""}`} aria-pressed={pen === p} onClick={() => { setPen(p); setMore(false); }}>
              <PenFace p={p} /><small>{isEl(p) ? (p === "NO2" ? "Nitro" : tr<Record<string, string>>({ F: "Fluor", Cl: "Chlor", Br: "Brom", I: "Iod" }, { F: "Fluorine", Cl: "Chlorine", Br: "Bromine", I: "Iodine" })[p as string]) : RING_LABEL[p as RingKind]}</small>
            </button>
          ))}
        </div>
      </Sheet>
    </div>
  );
}

/** Name mit gefärbten Teilen – dieselben Farben wie in der Formel */
function ColorName({ res }: { res: NameOk }) {
  const { hueOf } = coloring(res);
  return <>{res.parts.map((p, i) => (p.key ? <span key={i} className={`og-c h-${hueOf[p.key]}`}>{p.text}</span> : <span key={i}>{p.text}</span>))}</>;
}

function NameBar({ res }: { res: ReturnType<typeof name> }) {
  const { mol, shown, show, color } = useApp();
  if (!mol.atoms.length) return <div className="og-name empty" aria-hidden="true" />;
  if (!shown) return <div className="og-name"><Button variant="primary" icon="text" onClick={() => show(true)}>{tr("Benennen", "Name it")}</Button></div>;
  if (!res.ok) return <div className="og-name" role="status"><Tag tone="signal">{res.reason}</Tag></div>;
  const sub = res.formula.replace(/\d+/g, d => d.replace(/\d/g, c => "₀₁₂₃₄₅₆₇₈₉"[+c]));
  return (
    <div className="og-name" role="status" aria-live="polite">
      <p className="og-iupac">{color ? <ColorName res={res} /> : res.name}</p>
      <p className="og-meta">
        {res.alt.slice(0, 2).map(a => <span key={a} className="og-alt">{a}</span>)}
        <span className="og-formula">{sub}</span>
        {res.classes.slice(0, 3).map(c => <Tag key={c}>{c}</Tag>)}
      </p>
    </div>
  );
}

function Examples({ onPick }: { onPick: () => void }) {
  const { load } = useApp();
  const [group, setGroup] = useState(0);
  return (
    <div className="og-ex">
      <label className="og-ex-pick">
        <span>{tr("Stoffklasse", "Compound class")}</span>
        <select value={group} onChange={e => setGroup(Number(e.target.value))}>
          {EXAMPLES.map((g, i) => <option key={g.title} value={i}>{g.title}</option>)}
        </select>
      </label>
      <div className="og-ex-items">
        {EXAMPLES[group].items.map(s => {
          const m = exampleMol(s), r = name(m);
          return (
            <button key={s} type="button" className="og-ex-item" onClick={() => { load(m); onPick(); }}>
              <MolSvg mol={m} view="skelett" label={`${tr("Beispiel", "Example")} ${r.formula}`} minW={2} minH={1.4} className="mini" />
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Steps({ res }: { res: ReturnType<typeof name> }) {
  const { mol, shown, show } = useApp();
  if (!mol.atoms.length) return <p className="og-muted">{tr("Noch nichts gezeichnet.", "Nothing drawn yet.")}</p>;
  if (!res.ok) return <p className="og-muted">{res.reason}</p>;
  if (!shown) return <Button variant="primary" icon="text" onClick={() => show(true)}>{tr("Benennen", "Name it")}</Button>;
  return <ol className="og-steps">{res.steps.map((s, i) => <li key={i}><RichText text={s} /></li>)}</ol>;
}

export function Groups() {
  return (
    <div className="og-groups">
      <table>
        <thead><tr><th scope="col">{tr("Rang", "Rank")}</th><th scope="col">{tr("Gruppe", "Group")}</th><th scope="col">{tr("Endung", "Ending")}</th><th scope="col">{tr("Vorsilbe", "Prefix")}</th></tr></thead>
        <tbody>
          {RANK.map((k, i) => (
            <tr key={k}><td>{i + 1}</td><td><b>{KIND_INFO[k].label}</b> <span className="og-muted">{KIND_INFO[k].group}</span></td><td>{KIND_INFO[k].suffix}</td><td>{KIND_INFO[k].prefix}</td></tr>
          ))}
          <tr><td>–</td><td><b>Ether</b> <span className="og-muted">R–O–R</span></td><td>–</td><td>{tr("Methoxy-, Ethoxy-", "methoxy-, ethoxy-")}</td></tr>
          <tr><td>–</td><td><b>{tr("Halogen", "Halogen")}</b> <span className="og-muted">–Cl</span></td><td>–</td><td>{tr("Fluor-, Chlor-, Brom-, Iod-", "fluoro-, chloro-, bromo-, iodo-")}</td></tr>
          <tr><td>–</td><td><b>Nitro</b> <span className="og-muted">–NO₂</span></td><td>–</td><td>{tr("Nitro-", "nitro-")}</td></tr>
        </tbody>
      </table>
      <p className="og-rule">{tr(<><b>E/Z</b> an C=C: an jedem C die Gruppe mit größerer Ordnungszahl. Gleiche Seite = <b>Z</b>, verschiedene Seiten = <b>E</b>.</>,
        <><b>E/Z</b> at C=C: on each C the group with the higher atomic number. Same side = <b>Z</b>, opposite sides = <b>E</b>.</>)}</p>
    </div>
  );
}

export function DrawView() {
  const { mol, mode, setMode, view, setView, undo, clear, past } = useApp();
  const res = useMemo(() => name(mol), [mol]);
  const [active, setActive] = useState<string | null>(null);
  const [show3d, setShow3d] = useState(false);
  const stored = useMemo(() => (forceFieldAvailable || !mol.atoms.length ? null : storedFor(ffInput(mol))), [mol]);
  const tools: WorkbenchTool[] = [
    { id: "beispiele", label: tr("Beispiele", "Examples"), icon: "molecule", wide: true, content: <Examples onPick={() => setActive(null)} /> },
    { id: "weg", label: tr("Schritte", "Steps"), title: tr("Benennen Schritt für Schritt", "Naming step by step"), icon: "book", content: <Steps res={res} /> },
    { id: "gruppen", label: tr("Gruppen", "Groups"), title: tr("Funktionelle Gruppen nach Rang", "Functional groups by rank"), icon: "table", wide: true, content: <Groups /> },
    { id: "ansicht", label: view === "lewis" ? "Lewis" : tr("Gerüst", "Skeletal"), icon: "bond", onClick: () => setView(view === "lewis" ? "skelett" : "lewis") },
    // räumliche Lage: hinterlegte Moleküle überall, alle übrigen mit dem Kraftfeld (nur in der App)
    { id: "3d", label: "3D", icon: "cube", onClick: () => setShow3d(true), disabled: !mol.atoms.length || (!forceFieldAvailable && !stored) },
    { id: "zurueck", label: tr("Zurück", "Undo"), icon: "back", onClick: undo, disabled: !past.length },
    { id: "neu", label: tr("Neu", "New"), icon: "reset", onClick: clear, disabled: !mol.atoms.length },
  ];
  return (
    <>
    {show3d && mol.atoms.length > 0 && <View3D mol={mol} title={res.ok ? res.name : tr("Molekül", "Molecule")} onClose={() => setShow3d(false)} />}
    <Workbench className="og-wb" stage={<Editor res={res} />} tools={tools} active={active} onActive={setActive}
      controls={(
        <div className="og-controls">
          <Palette />
          <Segmented<Mode> label={tr("Antippen", "Tap")} value={mode} onChange={setMode}
            options={[{ value: "add", label: tr("Anfügen", "Add") }, { value: "swap", label: tr("Tauschen", "Swap") }, { value: "erase", label: tr("Löschen", "Erase") }]} />
          <NameBar res={res} />
        </div>
      )} />
    </>
  );
}
