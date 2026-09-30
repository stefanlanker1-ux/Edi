// Moleküle bauen: Baufeld als Bühne, darunter (breit: links) ein Panel mit Formel | Molekül | Bau.

import { lazy, Suspense, useState } from "react";
import { FitDown, Segmented, Switch, Sheet, Tag, Workbench, type WorkbenchTool } from "@lern/ui";
import { Formula, pseTool } from "@lern/chem-ui";
import {
  BY_SYMBOL, KNOWN, electronsOf, isComplete, connected, identify, sumFormula, shapeAt, isPolar, isWeaklyPolar, polarBonds, elementName, bondName,
  target,
  type AngleMode,
} from "@lern/chem";
import { useApp } from "../store.ts";
import { empty, loadKnown } from "../edit.ts";
import { Builder } from "../components/Builder.tsx";
import { StructureSvg } from "../components/StructureSvg.tsx";
import { WedgeSvg } from "../components/WedgeSvg.tsx";

export const US_ELEMENTS = ["H", "C", "N", "O", "F", "Cl"];
export const OS_ELEMENTS = [...US_ELEMENTS, "S", "P", "Br", "I"];

// 3D-Ansicht (three.js) wird erst beim ersten Öffnen geladen
const Molecule3D = lazy(() => import("@lern/chem-ui/3d"));

export function BuildView() {
  const { stufe, mol, setMol, showLonePairs, setShowLonePairs, showDeltas, setShowDeltas, wedge, setWedge } = useApp();
  const [info, setInfo] = useState<string | null>(null);
  const [tool, setTool] = useState<string | null>(null);
  const [show3d, setShow3d] = useState(false);
  const [angles3d, setAngles3d] = useState(true);
  const [lone3d, setLone3d] = useState(false);
  const [mode3d, setMode3d] = useState<AngleMode>("real");
  const [look3d, setLook3d] = useState<"ball" | "fill">("ball");
  const os = stufe === "os";
  const done = isComplete(mol);
  const known = done ? identify(mol) : null;
  const center = mol.atoms.map(a => shapeAt(mol, a.id)).filter(Boolean);
  const missing = mol.atoms.map(a => ({ a, e: electronsOf(mol, a.id) })).filter(x => !x.e.complete);
  const bondPairs = mol.bonds.reduce((s, b) => s + b.order, 0);
  const lonePairs = mol.atoms.reduce((s, a) => s + electronsOf(mol, a.id).pairs, 0);
  // Dipolpfeil nur bei kleinen Molekülen (bis 5 Atome) – bei großen wäre die Richtung schwer nachvollziehbar
  const dipoleArrow = mol.atoms.length <= 5;
  const showWedge = wedge && done;

  const status = !mol.atoms.length ? null : done
    ? <Tag tone="ok">✓ alle Edelgaskonfiguration</Tag>
    : (
      <>
        {mol.atoms.length > 1 && !connected(mol) && <Tag tone="signal">nicht verbunden</Tag>}
        {mol.atoms.length > 1 && missing.map(({ a, e }) => <Tag key={a.id} tone="signal">{a.el} {e.around}/{target(a.el)} e⁻</Tag>)}
      </>
    );
  const polarity = isPolar(mol) ? "polar" : polarBonds(mol).length ? "unpolar (symmetrisch)" : isWeaklyPolar(mol) ? "schwach polar" : "unpolar";
  const tools: WorkbenchTool[] = [
    {
      id: "formel", label: "Formel", title: showWedge ? "Keilstrichformel" : "Strichformel", icon: "bond", content: (
        <>
          {done && mol.atoms.length > 1 && (
            <Segmented<"flat" | "wedge"> label="Darstellung" value={wedge ? "wedge" : "flat"} onChange={v => setWedge(v === "wedge")}
              options={[{ value: "flat", label: "Strichformel" }, { value: "wedge", label: "Keilstrichformel", short: "Keilstrich" }]} />
          )}
          {mol.atoms.length
            ? <div className="struct-box">{showWedge
              ? <WedgeSvg mol={mol} lonePairs={showLonePairs} deltas={os && showDeltas} />
              : <StructureSvg mol={mol} lonePairs={showLonePairs} deltas={os && done && showDeltas} />}</div>
            : <div className="struct-box empty" aria-hidden="true">–</div>}
          {showWedge && <WedgeLegend />}
          <Switch checked={showLonePairs} onChange={setShowLonePairs}>Freie Elektronenpaare</Switch>
          {os && <Switch checked={showDeltas} onChange={setShowDeltas}>{dipoleArrow ? "Teilladungen und Dipol" : "Teilladungen δ+ / δ−"}</Switch>}
        </>
      ),
    },
    {
      id: "molekuel", label: "Molekül", icon: "info", content: (
        <>
          <dl className="facts">
            <div><dt>Bindende Paare</dt><dd>{bondPairs}</dd></div>
            <div><dt>Freie Paare</dt><dd>{lonePairs}</dd></div>
            {[...new Set(mol.bonds.map(b => b.order))].sort().map(o => (
              <div key={o}><dt>{bondName(o)}en</dt><dd>{mol.bonds.filter(b => b.order === o).length}</dd></div>
            ))}
          </dl>
        </>
      ),
    },
    ...(os && done ? [{
      id: "bau", label: "Bau", icon: "molecule" as const, content: (
        <>
          <ul className="geo-list">
            {center.map(sh => {
              const at = mol.atoms.find(x => x.id === sh!.center)!;
              return <li key={sh!.center}><b>{at.el}</b><span>{sh!.geometry}</span><span>{sh!.angle}</span></li>;
            })}
            {!center.length && <li><b>–</b><span>linear</span><span>180°</span></li>}
          </ul>
          <div className="ui-tags">
            <Tag tone={isPolar(mol) ? "signal" : "plain"}>{polarity}</Tag>
            {[...new Set(polarBonds(mol).map(p => {
              const A = mol.atoms.find(x => x.id === p.plus)!, B = mol.atoms.find(x => x.id === p.minus)!;
              return `${A.el}–${B.el} ΔEN ${p.delta.toLocaleString("de-AT")}`;
            }))].map(t => <Tag key={t}>{t}</Tag>)}
          </div>
        </>
      ),
    }] : []),
    // 3D nur für bekannte Moleküle (Lage aus berechneten Daten, Kraftfeld MMFF94), nicht für frei gebaute
    { id: "3d", label: "3D", icon: "cube", disabled: !known, onClick: () => setShow3d(true) },
    {
      id: "beispiel", label: "Beispiel", icon: "sample", title: "Beispiel laden", content: (
        <FitDown><div className="examples">
          {KNOWN.filter(k => os || !k.os).map(k => (
            <button key={k.id} type="button" className="ex-chip" onClick={() => { setMol(loadKnown(k.id)); setInfo(null); setTool(null); }}>
              <Formula f={k.formula} /><span>{k.name}</span>
            </button>
          ))}
        </div></FitDown>
      ),
    },
    // PSE: Elemente des gebauten Moleküls markiert (Valenzelektronen = Hauptgruppe)
    pseTool({ stufe: os ? "os" : "us", mark: [...new Set(mol.atoms.map(a => BY_SYMBOL[a.el]?.Z).filter((z): z is number => !!z))] }),
    { id: "leeren", label: "Leeren", icon: "reset", disabled: !mol.atoms.length, onClick: () => { setMol(empty()); setInfo(null); } },
  ];

  return (
    <>
      <Workbench className="eb-wb" side="left" label="Darstellungen" active={tool} onActive={setTool} tools={tools}
        head={
          <div className="res-head">
            {mol.atoms.length > 0
              ? <>
                  <Formula f={known?.formula ?? sumFormula(mol)} className="res-formula" />
                  <span className="res-name">{known ? known.name : mol.atoms.length === 1 ? `${elementName(mol.atoms[0].el)}-Atom` : ""}</span>
                </>
              : <span className="res-name muted">Molekül bauen</span>}
          </div>
        }
        stage={<Builder mol={mol} onChange={m => { setMol(m); setInfo(null); }} elements={os ? OS_ELEMENTS : US_ELEMENTS} onInfo={setInfo} />}
        status={<>{status}{info && <Tag>{info}</Tag>}</>} />

      <Sheet open={show3d} wide title={`3D-Ansicht: ${known?.name ?? "Molekül"}`} onClose={() => setShow3d(false)}>
        {show3d && (
          <Suspense fallback={<div className="m3d m3d-loading">3D-Ansicht wird geladen …</div>}>
            <Molecule3D mol={mol} look={look3d} angleMode={mode3d} showAngles={angles3d} showLonePairs={lone3d} showDipole={os && showDeltas} dipoleArrow={dipoleArrow} />
          </Suspense>
        )}
        <div className="m3d-controls">
          <Segmented<"ball" | "fill"> label="Modell" value={look3d} onChange={setLook3d}
            options={[{ value: "ball", label: "Kugel-Stab" }, { value: "fill", label: "Kalotte" }]} />
          <Segmented<AngleMode> label="Bindungswinkel" value={mode3d} onChange={setMode3d}
            options={[{ value: "real", label: "Real (gemessen)", short: "Real" }, { value: "ideal", label: "Idealisiert (EPA)", short: "Idealisiert" }]} />
          {look3d === "ball" && <Switch checked={angles3d} onChange={setAngles3d}>Bindungswinkel</Switch>}
          {look3d === "ball" && <Switch checked={lone3d} onChange={setLone3d}>Freie Elektronenpaare</Switch>}
          {os && <Switch checked={showDeltas} onChange={setShowDeltas}>{dipoleArrow ? "Teilladungen und Dipol" : "Teilladungen"}</Switch>}
        </div>
      </Sheet>

    </>
  );
}

/** Zeichenerklärung der Keilstrichformel */
function WedgeLegend() {
  return (
    <ul className="wedge-legend">
      <li><svg viewBox="0 0 40 14" aria-hidden="true"><line x1="3" y1="7" x2="37" y2="7" className="lg-line" /></svg>in der Papierebene</li>
      <li><svg viewBox="0 0 40 14" aria-hidden="true"><polygon points="3,7 37,1.5 37,12.5" className="lg-wedge" /></svg>zeigt nach vorn (zu dir)</li>
      <li><svg viewBox="0 0 40 14" aria-hidden="true">{[0, 1, 2, 3, 4, 5].map(i => { const x = 5 + i * 6.2, h = 1 + i * 1.1; return <line key={i} x1={x} x2={x} y1={7 - h} y2={7 + h} className="lg-line thin" />; })}</svg>zeigt nach hinten</li>
    </ul>
  );
}
