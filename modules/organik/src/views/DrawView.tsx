// Zeichnen und benennen: Zeichenfläche als Bühne, darunter Stifte (Elemente, Ringe), Modus und Namensleiste.
// Werkzeuge: Beispiele | Lösungsweg | Gruppen (Prioritäten) | Ansicht Lewis/Gerüst | Rückgängig | Neu.

import { useMemo, useState } from "react";
import { Button, RichText, Segmented, Sheet, Tag, Workbench, type WorkbenchTool } from "@lern/ui";
import { ELEMENTS, elLabel, type El } from "../chem/mol.ts";
import { name, KIND_INFO, RANK } from "../chem/naming.ts";
import { EXAMPLES, exampleMol } from "../chem/examples.ts";
import type { RingKind } from "../chem/edit.ts";
import { Editor } from "../components/Editor.tsx";
import { MolSvg } from "../components/MolSvg.tsx";
import { useApp, type Mode, type Pen } from "../store.ts";

const MAIN: Pen[] = ["C", "O", "N", "S"];
const MORE: Pen[] = ["F", "Cl", "Br", "I", "NO2", "benzol", "ring6", "ring5"];
const RING_LABEL: Record<RingKind, string> = { benzol: "Benzolring", ring6: "Sechsring", ring5: "Fünfring" };
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
    <div className="og-pens" role="toolbar" aria-label="Stifte">
      {pens.map(p => (
        <button key={p} type="button" className={`og-pen${pen === p ? " on" : ""}`} aria-pressed={pen === p} aria-label={penLabel(p)} onClick={() => setPen(p)}>
          <PenFace p={p} />
        </button>
      ))}
      <button type="button" className="og-pen more" aria-haspopup="dialog" onClick={() => setMore(true)}>Mehr</button>
      <Sheet open={more} title="Stifte" onClose={() => setMore(false)}>
        <div className="og-more">
          {MORE.map(p => (
            <button key={p} type="button" className={`og-pen big${pen === p ? " on" : ""}`} aria-pressed={pen === p} onClick={() => { setPen(p); setMore(false); }}>
              <PenFace p={p} /><small>{isEl(p) ? (p === "NO2" ? "Nitro" : { F: "Fluor", Cl: "Chlor", Br: "Brom", I: "Iod" }[p as string]) : RING_LABEL[p as RingKind]}</small>
            </button>
          ))}
        </div>
      </Sheet>
    </div>
  );
}

function NameBar({ res }: { res: ReturnType<typeof name> }) {
  const { mol, shown, show } = useApp();
  if (!mol.atoms.length) return <div className="og-name empty" aria-hidden="true" />;
  if (!shown) return <div className="og-name"><Button variant="primary" icon="text" onClick={() => show(true)}>Benennen</Button></div>;
  if (!res.ok) return <div className="og-name" role="status"><Tag tone="signal">{res.reason}</Tag></div>;
  const sub = res.formula.replace(/\d+/g, d => d.replace(/\d/g, c => "₀₁₂₃₄₅₆₇₈₉"[+c]));
  return (
    <div className="og-name" role="status" aria-live="polite">
      <p className="og-iupac">{res.name}</p>
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
        <span>Stoffklasse</span>
        <select value={group} onChange={e => setGroup(Number(e.target.value))}>
          {EXAMPLES.map((g, i) => <option key={g.title} value={i}>{g.title}</option>)}
        </select>
      </label>
      <div className="og-ex-items">
        {EXAMPLES[group].items.map(s => {
          const m = exampleMol(s), r = name(m);
          return (
            <button key={s} type="button" className="og-ex-item" onClick={() => { load(m); onPick(); }}>
              <MolSvg mol={m} view="skelett" label={`Beispiel ${r.formula}`} minW={2} minH={1.4} className="mini" />
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Steps({ res }: { res: ReturnType<typeof name> }) {
  const { mol, shown, show } = useApp();
  if (!mol.atoms.length) return <p className="og-muted">Noch nichts gezeichnet.</p>;
  if (!res.ok) return <p className="og-muted">{res.reason}</p>;
  if (!shown) return <Button variant="primary" icon="text" onClick={() => show(true)}>Benennen</Button>;
  return <ol className="og-steps">{res.steps.map((s, i) => <li key={i}><RichText text={s} /></li>)}</ol>;
}

export function Groups() {
  return (
    <div className="og-groups">
      <table>
        <thead><tr><th scope="col">Rang</th><th scope="col">Gruppe</th><th scope="col">Endung</th><th scope="col">Vorsilbe</th></tr></thead>
        <tbody>
          {RANK.map((k, i) => (
            <tr key={k}><td>{i + 1}</td><td><b>{KIND_INFO[k].label}</b> <span className="og-muted">{KIND_INFO[k].group}</span></td><td>{KIND_INFO[k].suffix}</td><td>{KIND_INFO[k].prefix}</td></tr>
          ))}
          <tr><td>–</td><td><b>Ether</b> <span className="og-muted">R–O–R</span></td><td>–</td><td>Methoxy-, Ethoxy-</td></tr>
          <tr><td>–</td><td><b>Halogen</b> <span className="og-muted">–Cl</span></td><td>–</td><td>Fluor-, Chlor-, Brom-, Iod-</td></tr>
          <tr><td>–</td><td><b>Nitro</b> <span className="og-muted">–NO₂</span></td><td>–</td><td>Nitro-</td></tr>
        </tbody>
      </table>
    </div>
  );
}

export function DrawView() {
  const { mol, mode, setMode, view, setView, undo, clear, past } = useApp();
  const res = useMemo(() => name(mol), [mol]);
  const [active, setActive] = useState<string | null>(null);
  const tools: WorkbenchTool[] = [
    { id: "beispiele", label: "Beispiele", icon: "molecule", wide: true, content: <Examples onPick={() => setActive(null)} /> },
    { id: "weg", label: "Schritte", title: "Benennen Schritt für Schritt", icon: "book", content: <Steps res={res} /> },
    { id: "gruppen", label: "Gruppen", title: "Funktionelle Gruppen nach Rang", icon: "table", wide: true, content: <Groups /> },
    { id: "ansicht", label: view === "lewis" ? "Lewis" : "Gerüst", icon: "bond", onClick: () => setView(view === "lewis" ? "skelett" : "lewis") },
    { id: "zurueck", label: "Zurück", icon: "back", onClick: undo, disabled: !past.length },
    { id: "neu", label: "Neu", icon: "reset", onClick: clear, disabled: !mol.atoms.length },
  ];
  return (
    <Workbench className="og-wb" stage={<Editor res={res} />} tools={tools} active={active} onActive={setActive}
      controls={(
        <div className="og-controls">
          <Palette />
          <Segmented<Mode> label="Antippen" value={mode} onChange={setMode}
            options={[{ value: "add", label: "Anfügen" }, { value: "swap", label: "Tauschen" }, { value: "erase", label: "Löschen" }]} />
          <NameBar res={res} />
        </div>
      )} />
  );
}
