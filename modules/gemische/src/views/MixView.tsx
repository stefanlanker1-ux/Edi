// Probieren: zehn fertige Beispiele (kein Baukasten) – Gefäß mit allen Teilchen und verschiebbarer Lupe (flow.ts, FlowView).
// Die Teilchen bewegen sich ständig und fließend. Jedes Beispiel beginnt „vorher“: Zuckerkristall im Wasser, Alkohol obenauf,
// CO₂ über dem Wasser, Gase hinter Trennwänden, Metallblöcke. Flüssigkeiten lösen und mischen sich von selbst (langsam; warm schneller),
// der Knopf sagt, was er tut: Umrühren, Schütteln, Trennwand weg, Schmelzen. „Von vorn“ stellt den Anfang wieder her.
// Öl und Wasser: „Schütteln“, danach entmischen sie sich wieder.
// Teilchen antippen = Stoff-Info mit 3D-Modell. Werkzeuge: Stoffe, Zählen, Farben, Einteilung, Arten (Gemischarten-Tabelle), Beispiele.

import { useId, useRef, useState } from "react";
import { Button, Icon, IconButton, Tag, Workbench, buzz, useReducedMotion } from "@lern/ui";
import { Kalotte, KalotteShades, SubstanceSheet, kalotteBox, kalotteElements } from "@lern/chem-ui";
import { toSubscript } from "@lern/chem";
import { EXAMPLES, MIX_LABEL, analyse, elementName, mixKind, nameOf, type Example, type MixKind } from "../mixtures.ts";
import { seedOf } from "../mixing.ts";
import { ACID, STIR, atEquilibrium, gasTarget, liquidLevel, makeWorld, openBottle, separatedFlow, settledFlow, shakeWorld, startMixing, stepFlow, type World } from "../flow.ts";
import { FlowView } from "../components/FlowView.tsx";
import { useApp } from "../store.ts";

/** kleines Bild eines Teilchens (Liste der Stoffe) */
export function MiniParticle({ f, size = 40 }: { f: string; size?: number }) {
  const gid = useId().replace(/:/g, "");
  const b = kalotteBox(f), e = Math.max(b.w, b.h) + .4;
  return (
    <svg className="gm-mini" viewBox={`${-e / 2} ${-e / 2} ${e} ${e}`} width={size} height={size} aria-hidden="true">
      <KalotteShades gid={gid} els={kalotteElements([f])} />
      <Kalotte f={f} cx={0} cy={0} gid={gid} />
    </svg>
  );
}

/** Farben der Atomsorten (nur im Modell – Atome selbst haben keine Farbe) */
export function Legend({ els }: { els: string[] }) {
  return (
    <div className="gm-legend-wrap">
      <ul className="gm-legend">
        {els.map(el => <li key={el}><MiniParticle f={el} size={30} /><span>{elementName(el)} <b>({el})</b></span></li>)}
      </ul>
      <p className="gm-small">Farben nur im Modell</p>
    </div>
  );
}

function Substances({ ex, onPick }: { ex: Example; onPick: (f: string) => void }) {
  const a = analyse(ex.items);
  const n = Object.fromEntries(ex.items);
  const col = (title: string, fs: string[]) => (
    <div className="gm-col">
      <h3>{title} <span>{fs.length}</span></h3>
      {fs.length ? fs.map(f => (
        <button key={f} type="button" className="gm-sub" onClick={() => { buzz(); onPick(f); }}>
          <MiniParticle f={f} size={36} />
          <span><b>{nameOf(f)}</b><small>{toSubscript(f)} · {n[f]} Teilchen</small></span>
        </button>
      )) : <p className="gm-none">–</p>}
    </div>
  );
  return (
    <div className="gm-subs">
      <p className="gm-cap">Reinstoffe</p>
      <div className="gm-cols">{col("Verbindungen", a.verbindungen)}{col("Elemente", a.elemente)}</div>
      {ex.forms && (
        <div className="gm-forms">
          <p className="gm-cap">Entsteht in kleiner Menge (Reaktion mit Wasser)</p>
          {ex.forms.map(f => (
            <button key={f} type="button" className="gm-sub" onClick={() => { buzz(); onPick(f); }}>
              <MiniParticle f={f} size={36} />
              <span><b>{nameOf(f)}</b><small>{toSubscript(f)}</small></span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function Counts({ ex }: { ex: Example }) {
  const a = analyse(ex.items);
  const rows: [string, number][] = [["Teilchen", a.teilchen], ["Stoffe", a.stoffe.length], ["davon Verbindungen", a.verbindungen.length],
    ["davon Elemente", a.elemente.length], ["Atomsorten", a.atomsorten.length]];
  return (
    <dl className="gm-counts">
      {rows.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}
    </dl>
  );
}

/** Einteilung der Stoffe mit allen Beispielen; das aktuelle ist hervorgehoben (antippen = dorthin wechseln) */
function Einteilung({ current, onPick }: { current: number; onPick: (i: number) => void }) {
  const kind = mixKind(EXAMPLES[current]);
  const leaf = (k: MixKind, label: string) => (
    <div className={`gm-leaf${k === kind ? " on" : ""}`}>
      <b>{label}</b>
      <div className="gm-leaf-ex">
        {EXAMPLES.map((e, i) => mixKind(e) === k && (
          <button key={e.id} type="button" className="gm-chip" aria-pressed={i === current} onClick={() => { buzz(); onPick(i); }}>{e.title}</button>
        ))}
      </div>
    </div>
  );
  const rein = kind === "element" || kind === "verbindung";
  return (
    <div className="gm-tree">
      <div className="gm-node root">Stoffe</div>
      <div className="gm-branches">
        <div className={`gm-branch${rein ? " on" : ""}`}>
          <div className="gm-node">Reinstoffe</div>
          {leaf("element", "Elemente")}
          {leaf("verbindung", "Verbindungen")}
        </div>
        <div className={`gm-branch${!rein ? " on" : ""}`}>
          <div className="gm-node">Gemische</div>
          {leaf("homogen", "homogen")}
          {leaf("heterogen", "heterogen")}
        </div>
      </div>
    </div>
  );
}

type Z = "fest" | "flüssig" | "Gas";
const ZS: Z[] = ["fest", "flüssig", "Gas"];
/** Arten von Gemischen: verteilter Stoff (Zeile) in Hauptstoff (Spalte); homogen und heterogen mit Alltagsbeispiel */
const ARTEN: Partial<Record<`${Z}|${Z}`, [string, string, boolean][]>> = {
  "fest|fest": [["Gemenge", "Müsli", false], ["Legierung", "Messing", true]],
  "fest|flüssig": [["Suspension", "Sand in Wasser", false], ["Lösung", "Zuckerwasser", true]],
  "fest|Gas": [["Rauch", "Ruß in Luft", false]],
  "flüssig|flüssig": [["Emulsion", "Milch", false], ["Lösung", "Alkohol in Wasser", true]],
  "flüssig|Gas": [["Nebel", "Wolke", false]],
  "Gas|flüssig": [["Schaum", "Schlagsahne", false], ["Lösung", "Sprudelwasser", true]],
  "Gas|Gas": [["Gasgemisch", "Luft", true]],
};
/** Zelle des Beispiels in der Tabelle: [verteilter Stoff, Hauptstoff] */
const CELL: Record<string, `${Z}|${Z}`> = {
  zucker: "fest|flüssig", alkohol: "flüssig|flüssig", sprudel: "Gas|flüssig", oel: "flüssig|flüssig", messing: "fest|fest",
  erdgas: "Gas|Gas", schutzgas: "Gas|Gas", modell: "Gas|Gas",
};

function Arten({ ex }: { ex: Example }) {
  const cell = CELL[ex.id];
  return (
    <div className="gm-arten">
      <p className="gm-cap">verteilter Stoff in Hauptstoff</p>
      <dl>
        {ZS.flatMap(r => ZS.map(c => `${r}|${c}` as const)).filter(k => ARTEN[k]).map(k => {
          const [r, c] = k.split("|");
          return (
            <div key={k} className={k === cell ? "on" : undefined}>
              <dt>{r} in {c}</dt>
              <dd>{ARTEN[k]!.map(([n, e, hom], i) => (
                <span key={n} className={`gm-art${ex.type === n && k === cell ? " cur" : ""}`}>{i > 0 && " · "}<b>{n}</b> ({e}{hom ? ", homogen" : ""})</span>
              ))}</dd>
            </div>
          );
        })}
      </dl>
    </div>
  );
}

function ExampleList({ current, onPick }: { current: number; onPick: (i: number) => void }) {
  return (
    <div className="gm-examples">
      {EXAMPLES.map((e, i) => (
        <button key={e.id} type="button" aria-pressed={i === current} className="gm-ex" onClick={() => { buzz(); onPick(i); }}>
          <span className="gm-ex-n">{i + 1}</span><span>{e.title}</span>
        </button>
      ))}
    </div>
  );
}

/** Zustand für die Anzeige (alle 15 Schritte aus der Welt gelesen) */
interface Info { bound: number; gas: number; eq: number; aq: number; opened: boolean; sep: boolean; walls: number; melt: boolean; busy: boolean; mixed: boolean; doneAt?: number; t: number }
function readInfo(w: World, ex: Example): Info {
  let mixed = true;
  if (ex.before === "schicht" && ex.solute) {
    // in jedem Drittel der Höhe etwa so viel Alkohol wie im Ganzen
    const all = w.ps.filter(p => p.f === ex.solute).length / w.ps.length, hl = liquidLevel(w);
    for (let b = 0; b < 3; b++) {
      const band = w.ps.filter(p => Math.min(2, Math.floor((p.y - w.top) / hl * 3)) === b);
      const share = band.filter(p => p.f === ex.solute).length / Math.max(1, band.length);
      if (Math.abs(share - all) > all * .3) mixed = false;
    }
  } else if (ex.before === "getrennt" && w.state !== "fest") {
    // Gase: jeder Stoff ist im Mittel in der Mitte des Gefäßes
    const mx = (f: string) => { const xs = w.ps.filter(p => p.f === f).map(p => p.x); return xs.reduce((s, x) => s + x, 0) / xs.length; };
    mixed = !w.walls.length && ex.items.every(([f]) => Math.abs(mx(f) - w.W / 2) < w.W * .08);
  }
  return {
    bound: w.state === "fluessig" ? w.ps.filter(p => p.bound).length : 0, gas: w.ps.filter(p => p.gas).length, eq: gasTarget(w), sep: separatedFlow(w),
    // gelöst: CO₂ im Wasser und Kohlensäure
    aq: w.ps.filter(p => !p.gas && (p.f === ex.solute || p.f === ACID)).length, opened: !!w.opened,
    walls: w.walls.length, melt: w.melt > 0, busy: w.stir > 0 || w.shake > 0 || w.melt > 0 || w.wallEnd !== undefined, mixed, doneAt: w.doneAt, t: w.t,
  };
}
const secs = (steps: number) => `${Math.max(1, Math.round(steps / 60))} s`;

/** Hauptknopf je Beispiel: sagt, was passiert */
function actionOf(ex: Example, i?: Info): { label: string; icon: "shake" | "fire" | "up" } {
  // Sprudel: erst schütteln (CO₂ löst sich), im Gleichgewicht öffnen, dann wieder schütteln (CO₂ entweicht)
  if (ex.before === "gasraum" && i && !i.opened && i.doneAt !== undefined) return { label: "Öffnen", icon: "up" };
  if (ex.state === "fest") return { label: "Schmelzen", icon: "fire" };
  if (ex.state !== "fluessig") return ex.before ? { label: ex.items.length > 2 ? "Wände weg" : "Wand weg", icon: "up" } : { label: "Schütteln", icon: "shake" };
  return ex.before === "kristall" || ex.before === "schicht" ? { label: "Umrühren", icon: "shake" } : { label: "Schütteln", icon: "shake" };
}

/** Statuszeile: höchstens zwei kurze Kennzeichen (bleibt einzeilig, damit sich das Bild nie verschiebt) */
function statusOf(ex: Example, i: Info, done: number | undefined): string[] {
  const k = ex.solute ? ex.items.find(([f]) => f === ex.solute)![1] : 0;
  const time = (verb: string) => (done !== undefined ? `${verb} in ${secs(done)}` : verb);
  if (ex.before === "kristall") return i.bound ? ["löst sich", `${k - i.bound} / ${k} gelöst`] : ["Lösung", time("gelöst")];
  // geschlossene Flasche: CO₂ löst sich bzw. perlt aus, bis so viel gelöst ist, wie bei dieser Temperatur geht (kalt mehr, warm weniger)
  if (ex.before === "gasraum") {
    // offen: CO₂ entweicht, bis keins mehr gelöst ist (abgestanden)
    if (i.opened) return [i.aq ? "offen · perlt aus" : "abgestanden", `${i.aq} / ${k} gelöst`];
    return [i.gas > i.eq + 1 ? "löst sich" : i.gas < i.eq - 1 ? "perlt aus" : "Gleichgewicht", `${i.aq} / ${k} gelöst`];
  }
  if (ex.before === "schicht") return i.mixed ? ["Lösung", time("gemischt")] : ["mischt sich"];
  if (ex.floats?.length) return [i.sep ? "2 Schichten" : "Emulsion", "heterogen"];
  if (ex.state === "fest") return i.walls ? ["getrennt"] : i.melt ? ["geschmolzen"] : [ex.type ?? "Legierung", "homogen"];
  if (ex.before) return i.walls ? ["getrennt"] : i.mixed ? [ex.type ?? "Gasgemisch", time("gemischt")] : ["mischt sich"];
  return MIX_LABEL[mixKind(ex)];
}

function Mix({ ex, index, temp, setTemp }: { ex: Example; index: number; temp: number; setTemp: (t: number) => void }) {
  const setEx = useApp(s => s.setEx);
  const reduced = useReducedMotion();
  const seed = seedOf(ex.id);
  // jedes Beispiel beginnt vorher: Reinstoffe getrennt (Zuckerwürfel im Wasser, Alkohol obenauf, CO₂ über dem Wasser, Trennwände, Metallblöcke)
  const fresh = (s: number) => { const w = makeWorld(ex, s, ex.before ? "vorher" : "nachher"); w.temp = temp; return w; };
  const [world, setWorld] = useState<World>(() => fresh(seed));
  world.temp = temp;
  const [info, setInfo] = useState<Info>(() => readInfo(world, ex));
  const [version, setVersion] = useState(0);
  const [pick, setPick] = useState<string | null>(null);
  const [tool, setTool] = useState<string | null>(null);
  const worldRef = useRef(world);
  worldRef.current = world;
  const runs = useRef(0);
  // Alkohol und Gase: Zeit vom Beginn (bei Gasen: ab „Wand weg“) bis gleichmäßig gemischt
  const mixedAt = useRef<number | undefined>(undefined);
  const startAt = useRef(0);

  const refresh = (w: World) => {
    const i = readInfo(w, ex);
    if ((ex.before === "schicht" || (ex.before === "getrennt" && w.state !== "fest")) && i.mixed && mixedAt.current === undefined) mixedAt.current = w.t - startAt.current;
    setInfo(i);
  };
  /** nach jedem Zeitschritt: Anzeige ab und zu auffrischen */
  const onFrame = () => { const w = worldRef.current; if (w.t % 15 === 0) refresh(w); };
  /** ohne Bewegung: gleich das Ergebnis */
  const finish = (w: World) => {
    // bis zum Endzustand rechnen: gelöst bzw. gleichmäßig gemischt (Schütteln/Umrühren wird dabei fortgesetzt)
    for (let k = 0; k < 5000; k++) {
      if (k >= 60 && settledFlow(w) && readInfo(w, ex).mixed) break;
      if (w.state === "fluessig" && w.stir === 0 && w.shake === 0 && (w.ps.some(p => p.bound) || (w.closed ? !atEquilibrium(w) : !w.opened && w.ps.some(p => p.gas)))) {
        if (ex.before === "gasraum") shakeWorld(w); else w.stir = STIR;
      }
      stepFlow(w);
    }
    refresh(w); setVersion(v => v + 1);
  };

  const act = () => {
    buzz();
    const w = worldRef.current;
    if (ex.before === "gasraum" && !w.opened && w.doneAt !== undefined) {
      openBottle(w);
      // ohne Bewegung: 10 s später zeigen (CO₂ perlt langsam aus)
      if (reduced) { for (let k = 0; k < 600; k++) stepFlow(w); refresh(w); setVersion(v => v + 1); } else refresh(w);
      return;
    }
    if (w.state === "fluessig") { if (ex.before === "kristall" || ex.before === "schicht") w.stir = STIR; else shakeWorld(w); }
    else if (w.state === "fest") startMixing(w);
    else if (ex.before) { startMixing(w); startAt.current = w.t; }
    else shakeWorld(w);
    if (reduced) finish(w); else refresh(w);
  };
  const again = () => {
    buzz();
    mixedAt.current = undefined; startAt.current = 0;
    const w = fresh(seed + ++runs.current);
    setWorld(w); setInfo(readInfo(w, ex)); setVersion(v => v + 1);
  };

  const a = analyse(ex.items);
  const action = actionOf(ex, info);
  const done = ex.before === "schicht" || (ex.before === "getrennt" && ex.state !== "fest") ? mixedAt.current : info.doneAt;
  const canAct = !info.busy && !(ex.state !== "fluessig" && ex.state !== "fest" && ex.before && !info.walls);
  const goTo = (i: number) => { buzz(); setEx(i); setTool(null); };
  const focus = ex.before === "kristall" ? "unten" as const : ex.floats ? "grenze" as const : undefined;
  return (
    <>
      <Workbench className="gm-wb" active={tool} onActive={setTool}
        head={
          <div className="gm-head">
            <h2 className="gm-title">{ex.title}</h2>
            <span className="gm-num">{index + 1} / {EXAMPLES.length}</span>
            {ex.note && <p className="gm-note">{ex.note}</p>}
          </div>
        }
        stage={<FlowView world={world} motion={!reduced} version={version} focus={focus} onFrame={onFrame} onPick={f => { buzz(); setPick(f); }}
          label={`${ex.title}: ${ex.items.map(([f, n]) => `${n} × ${nameOf(f)}`).join(", ")}`} />}
        status={<div className="gm-status">{statusOf(ex, info, done).map(l => <Tag key={l}>{l}</Tag>)}</div>}
        controls={
          <div className="gm-controls">
            <div className="gm-row">
              <IconButton icon="back" label="Voriges Beispiel" onClick={() => goTo(index - 1)} />
              <Button variant="primary" icon={action.icon} onClick={act} disabled={!canAct}>{action.label}</Button>
              <IconButton icon="arrow" label="Nächstes Beispiel" onClick={() => goTo(index + 1)} />
            </div>
            <div className="gm-row">
              {ex.before && <IconButton icon="reset" label="Von vorn" onClick={again} />}
              <label className="gm-temp">
                <Icon name="fire" size={18} />
                <input type="range" min={0} max={100} step={10} value={temp} aria-label="Temperatur"
                  onChange={e => { setTemp(Number(e.target.value)); if (reduced) setVersion(v => v + 1); }} />
                <output>{temp} °C</output>
              </label>
            </div>
          </div>
        }
        tools={[
          { id: "stoffe", label: "Stoffe", icon: "molecule", content: <Substances ex={ex} onPick={f => setPick(f)} /> },
          { id: "zaehlen", label: "Zählen", icon: "table", content: <Counts ex={ex} /> },
          { id: "farben", label: "Farben", icon: "atom", content: <Legend els={a.atomsorten} /> },
          { id: "einteilung", label: "Einteilung", icon: "layers", content: <Einteilung current={index} onPick={i => goTo(i)} /> },
          { id: "arten", label: "Arten", icon: "beaker", title: "Arten von Gemischen", content: <Arten ex={ex} /> },
          { id: "beispiele", label: "Beispiele", icon: "grid", content: <ExampleList current={index} onPick={i => goTo(i)} /> },
        ]} />
      <SubstanceSheet f={pick} onClose={() => setPick(null)} />
    </>
  );
}

export function MixView() {
  const ex = useApp(s => s.ex);
  // key: neues Beispiel → Anfangslage neu
  // Temperatur gilt für alle Beispiele (nicht gespeichert, Start bei 20 °C)
  const [temp, setTemp] = useState(20);
  return <Mix key={ex} ex={EXAMPLES[ex]} index={ex} temp={temp} setTemp={setTemp} />;
}
