// Moleküle bauen: Baufeld als Bühne, darunter (breit: links) ein Panel mit Formel | Molekül | Bau.

import { lazy, Suspense, useState } from "react";
import { FitDown, Segmented, Switch, Sheet, Tag, Workbench, type WorkbenchTool } from "@lern/ui";
import { Formula, pseTool } from "@lern/chem-ui";
import {
  BY_SYMBOL, KNOWN, electronsOf, isComplete, connected, identify, sumFormula, shapeAt, isPolar, isWeaklyPolar, polarBonds, elementName, bondName, geometryName,
  target,
  type AngleMode,
} from "@lern/chem";
import { useApp } from "../store.ts";
import { empty, loadKnown } from "../edit.ts";
import { Builder } from "../components/Builder.tsx";
import { StructureSvg } from "../components/StructureSvg.tsx";
import { WedgeSvg } from "../components/WedgeSvg.tsx";
import { tr } from "@lern/i18n";

export const US_ELEMENTS = ["H", "C", "N", "O", "F", "Cl"];
export const OS_ELEMENTS = [...US_ELEMENTS, "S", "P", "Br", "I"];

// 3D-Ansicht (three.js) wird erst beim ersten Öffnen geladen
const Molecule3D = lazy(() => import("@lern/chem-ui/3d"));

export function BuildView() {
  const { stufe, mol, setMol, showLonePairs, setShowLonePairs, showDeltas, setShowDeltas, wedge, setWedge, lines, setLines, octet, setOctet } = useApp();
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
    ? <Tag tone="ok">✓ {tr("alle Edelgaskonfiguration", "all noble gas configuration")}</Tag>
    : (
      <>
        {mol.atoms.length > 1 && !connected(mol) && <Tag tone="signal">{tr("nicht verbunden", "not connected")}</Tag>}
        {mol.atoms.length > 1 && missing.map(({ a, e }) => <Tag key={a.id} tone="signal">{a.el} {e.around}/{target(a.el)} e⁻</Tag>)}
      </>
    );
  const polarity = isPolar(mol) ? "polar" : polarBonds(mol).length ? tr("unpolar (symmetrisch)", "non-polar (symmetrical)") : isWeaklyPolar(mol) ? tr("schwach polar", "weakly polar") : tr("unpolar", "non-polar");
  const tools: WorkbenchTool[] = [
    {
      id: "formel", label: tr("Formel", "Formula"), title: showWedge ? tr("Geometrische Strukturformel", "Wedge-dash formula") : tr("Strukturformel", "Structural formula"), icon: "bond", content: (
        <>
          {done && mol.atoms.length > 1 && (
            <Segmented<"flat" | "wedge"> label={tr("Darstellung", "View")} value={wedge ? "wedge" : "flat"} onChange={v => setWedge(v === "wedge")}
              options={[{ value: "flat", label: tr("Strukturformel", "Structural formula") }, { value: "wedge", label: tr("Geometrische Strukturformel", "Wedge-dash formula"), short: tr("geometrisch", "3D") }]} />
          )}
          {mol.atoms.length
            ? <div className="struct-box">{showWedge
              ? <WedgeSvg mol={mol} lonePairs={showLonePairs} deltas={os && showDeltas} />
              : <StructureSvg mol={mol} lonePairs={showLonePairs} deltas={os && done && showDeltas} />}</div>
            : <div className="struct-box empty" aria-hidden="true">–</div>}
          {showWedge && <WedgeLegend />}
          <Switch checked={showLonePairs} onChange={setShowLonePairs}>{tr("Freie Elektronenpaare", "Lone pairs")}</Switch>
          {os && <Switch checked={showDeltas} onChange={setShowDeltas}>{dipoleArrow ? tr("Teilladungen und Dipol", "Partial charges and dipole") : tr("Teilladungen δ+ / δ−", "Partial charges δ+ / δ−")}</Switch>}
        </>
      ),
    },
    {
      id: "molekuel", label: tr("Molekül", "Molecule"), icon: "info", content: (
        <>
          <dl className="facts">
            <div><dt>{tr("Bindende Paare", "Bonding pairs")}</dt><dd>{bondPairs}</dd></div>
            <div><dt>{tr("Freie Paare", "Lone pairs")}</dt><dd>{lonePairs}</dd></div>
            {[...new Set(mol.bonds.map(b => b.order))].sort().map(o => (
              <div key={o}><dt>{tr(`${bondName(o)}en`, `${bondName(o)}s`)}</dt><dd>{mol.bonds.filter(b => b.order === o).length}</dd></div>
            ))}
          </dl>
        </>
      ),
    },
    ...(os && done ? [{
      id: "bau", label: tr("Bau", "Shape"), icon: "molecule" as const, content: (
        <>
          <ul className="geo-list">
            {center.map(sh => {
              const at = mol.atoms.find(x => x.id === sh!.center)!;
              return <li key={sh!.center}><b>{at.el}</b><span>{geometryName(sh!.geometry)}</span><span>{sh!.angle}</span></li>;
            })}
            {!center.length && <li><b>–</b><span>linear</span><span>180°</span></li>}
          </ul>
          <div className="ui-tags">
            <Tag tone={isPolar(mol) ? "signal" : "plain"}>{polarity}</Tag>
            {[...new Set(polarBonds(mol).map(p => {
              const A = mol.atoms.find(x => x.id === p.plus)!, B = mol.atoms.find(x => x.id === p.minus)!;
              return `${A.el}–${B.el} ΔEN ${p.delta.toLocaleString(tr("de-AT", "en-GB"))}`;
            }))].map(t => <Tag key={t}>{t}</Tag>)}
          </div>
        </>
      ),
    }] : []),
    // 3D nur für bekannte Moleküle (Lage aus berechneten Daten, Kraftfeld MMFF94), nicht für frei gebaute
    { id: "3d", label: "3D", icon: "cube", disabled: !known, onClick: () => setShow3d(true) },
    {
      id: "beispiel", label: tr("Beispiel", "Example"), icon: "sample", title: tr("Beispiel laden", "Load example"), content: (
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
    { id: "leeren", label: tr("Leeren", "Clear"), icon: "reset", disabled: !mol.atoms.length, onClick: () => { setMol(empty()); setInfo(null); } },
  ];

  return (
    <>
      <Workbench className="eb-wb" side="left" label={tr("Darstellungen", "Views")} active={tool} onActive={setTool} tools={tools}
        head={
          <div className="res-head">
            {mol.atoms.length > 0
              ? <>
                  <Formula f={known?.formula ?? sumFormula(mol)} className="res-formula" />
                  <span className="res-name">{known ? known.name : mol.atoms.length === 1 ? tr(`${elementName(mol.atoms[0].el)}-Atom`, `${elementName(mol.atoms[0].el)} atom`) : ""}</span>
                </>
              : <span className="res-name muted">{tr("Molekül bauen", "Build a molecule")}</span>}
          </div>
        }
        stage={<Builder mol={mol} onChange={m => { setMol(m); setInfo(null); }} elements={os ? OS_ELEMENTS : US_ELEMENTS} onInfo={setInfo} lines={lines} octet={octet} />}
        controls={
          <div className="build-controls">
            <Segmented<"dots" | "lines"> label={tr("Elektronenpaare", "Electron pairs")} value={lines ? "lines" : "dots"} onChange={v => setLines(v === "lines")}
              options={[{ value: "dots", label: tr("Punkte", "Dots") }, { value: "lines", label: tr("Striche", "Lines") }]} />
            <Switch checked={octet} onChange={setOctet}>{tr("Oktett", "Octet")}</Switch>
          </div>
        }
        status={<>{status}{info && <Tag>{info}</Tag>}</>} />

      <Sheet open={show3d} wide title={`${tr("3D-Ansicht", "3D view")}: ${known?.name ?? tr("Molekül", "Molecule")}`} onClose={() => setShow3d(false)}>
        {show3d && (
          <Suspense fallback={<div className="m3d m3d-loading">{tr("3D-Ansicht wird geladen …", "Loading 3D view …")}</div>}>
            <Molecule3D mol={mol} look={look3d} angleMode={mode3d} showAngles={angles3d} showLonePairs={lone3d} showDipole={os && showDeltas} dipoleArrow={dipoleArrow} />
          </Suspense>
        )}
        <div className="m3d-controls">
          <Segmented<"ball" | "fill"> label={tr("Modell", "Model")} value={look3d} onChange={setLook3d}
            options={[{ value: "ball", label: tr("Kugel-Stab", "Ball and stick") }, { value: "fill", label: tr("Kalotte", "Space-filling") }]} />
          <Segmented<AngleMode> label={tr("Bindungswinkel", "Bond angles")} value={mode3d} onChange={setMode3d}
            options={[{ value: "real", label: tr("Real (gemessen)", "Real (measured)"), short: "Real" }, { value: "ideal", label: tr("Idealisiert (EPA)", "Idealised (VSEPR)"), short: tr("Idealisiert", "Idealised") }]} />
          {look3d === "ball" && <Switch checked={angles3d} onChange={setAngles3d}>{tr("Bindungswinkel", "Bond angles")}</Switch>}
          {look3d === "ball" && <Switch checked={lone3d} onChange={setLone3d}>{tr("Freie Elektronenpaare", "Lone pairs")}</Switch>}
          {os && <Switch checked={showDeltas} onChange={setShowDeltas}>{dipoleArrow ? tr("Teilladungen und Dipol", "Partial charges and dipole") : tr("Teilladungen", "Partial charges")}</Switch>}
        </div>
      </Sheet>

    </>
  );
}

/** Zeichenerklärung der Keilstrichformel */
function WedgeLegend() {
  return (
    <ul className="wedge-legend">
      <li><svg viewBox="0 0 40 14" aria-hidden="true"><line x1="3" y1="7" x2="37" y2="7" className="lg-line" /></svg>{tr("in der Papierebene", "in the plane of the paper")}</li>
      <li><svg viewBox="0 0 40 14" aria-hidden="true"><polygon points="3,7 37,1.5 37,12.5" className="lg-wedge" /></svg>{tr("Keil: zeigt nach vorn (zu dir)", "Wedge: points forwards (towards you)")}</li>
      <li><svg viewBox="0 0 40 14" aria-hidden="true">{[0, 1, 2, 3, 4, 5].map(i => { const x = 5 + i * 6.2, h = 1 + i * 1.1; return <line key={i} x1={x} x2={x} y1={7 - h} y2={7 + h} className="lg-line thin" />; })}</svg>{tr("strichliert: zeigt nach hinten", "Dashed: points backwards")}</li>
    </ul>
  );
}
