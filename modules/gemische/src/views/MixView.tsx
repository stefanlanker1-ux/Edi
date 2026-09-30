// Probieren: zehn fertige Beispiele (kein Baukasten) – Gefäß mit allen Teilchen und verschiebbarer Lupe (flow.ts, FlowView).
// Die Teilchen bewegen sich ständig und fließend. „Mischen“ zeigt, wie das Gemisch entsteht: vorher liegen die Reinstoffe getrennt
// (Zuckerkristall, Alkohol-Schicht, Gas über dem Wasser, Gase hinter Trennwänden, Metallblöcke), danach verteilen sie sich –
// die Teilchen bleiben dieselben und gleich viele. Öl und Wasser: „Schütteln“, danach entmischen sie sich wieder.
// Teilchen antippen = Stoff-Info mit 3D-Modell. Werkzeuge: Stoffe, Zählen, Farben, Einteilung, Beispiele.

import { useEffect, useId, useRef, useState } from "react";
import { Button, Icon, IconButton, Tag, Workbench, buzz, useReducedMotion } from "@lern/ui";
import { Kalotte, KalotteShades, SubstanceSheet, kalotteBox, kalotteElements } from "@lern/chem-ui";
import { toSubscript } from "@lern/chem";
import { EXAMPLES, MIX_LABEL, analyse, elementName, mixKind, nameOf, type Example, type MixKind } from "../mixtures.ts";
import { seedOf } from "../mixing.ts";
import { makeWorld, separatedFlow, settledFlow, shakeWorld, startMixing, stepFlow, type World } from "../flow.ts";
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
    </div>
  );
}

function Counts({ ex }: { ex: Example }) {
  const a = analyse(ex.items);
  const rows: [string, number][] = [["Teilchen", a.teilchen], ["Reinstoffe", a.stoffe.length], ["davon Verbindungen", a.verbindungen.length],
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

type Phase = "ruhe" | "vorher" | "laeuft";
const MIN_FRAMES = 240; // so lange läuft ein Vorgang mindestens (etwa 4 s)

function Mix({ ex, index, temp, setTemp }: { ex: Example; index: number; temp: number; setTemp: (t: number) => void }) {
  const setEx = useApp(s => s.setEx);
  const reduced = useReducedMotion();
  const seed = seedOf(ex.id);
  const [world, setWorld] = useState<World>(() => ({ ...makeWorld(ex, seed), temp }));
  world.temp = temp;
  const [phase, setPhase] = useState<Phase>("ruhe");
  const [version, setVersion] = useState(0);
  const [sep, setSep] = useState(true);
  const [pick, setPick] = useState<string | null>(null);
  const [tool, setTool] = useState<string | null>(null);
  const worldRef = useRef(world), phaseRef = useRef(phase);
  worldRef.current = world; phaseRef.current = phase;
  const time = useRef(0), runs = useRef(0);
  const timers = useRef<number[]>([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const later = (fn: () => void, ms: number) => { timers.current.push(window.setTimeout(fn, ms)); };

  /** nach jedem Zeitschritt: Ende des Vorgangs erkennen, Anzeige ab und zu auffrischen */
  const onFrame = () => {
    const w = worldRef.current;
    if (phaseRef.current === "laeuft") {
      time.current++;
      if ((settledFlow(w) && time.current >= MIN_FRAMES) || time.current > 2400) setPhase("ruhe");
    }
    if (w.t % 15 === 0) setSep(separatedFlow(w));
  };
  /** ohne Bewegung: gleich das Ergebnis */
  const finish = (w: World) => {
    for (let k = 0; k < 3000 && (!settledFlow(w) || k < MIN_FRAMES); k++) stepFlow(w);
    setSep(separatedFlow(w)); setVersion(v => v + 1);
  };

  const doMix = () => {
    buzz();
    time.current = 0;
    if (!ex.before) {
      // Reinstoff oder Öl und Wasser: schütteln
      shakeWorld(world);
      if (reduced) finish(world); else setPhase("laeuft");
      return;
    }
    // vorher: Reinstoffe getrennt – kurz zeigen, dann mischen
    const w = makeWorld(ex, seed + ++runs.current, "vorher");
    w.temp = temp;
    setWorld(w);
    setPhase("vorher");
    later(() => {
      startMixing(w);
      time.current = 0;
      if (reduced) { finish(w); setPhase("ruhe"); } else setPhase("laeuft");
    }, reduced ? 1600 : 1400);
  };

  const a = analyse(ex.items);
  const kind = mixKind(ex);
  const type = ex.floats?.length ? (sep ? "2 Schichten" : "Emulsion") : ex.type;
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
        status={<>
          {phase === "vorher" && ex.before ? <Tag>vorher</Tag> : MIX_LABEL[kind].map(l => <Tag key={l}>{l}</Tag>)}
          {phase !== "vorher" && type && <Tag>{type}</Tag>}
          <Tag>{a.teilchen} Teilchen</Tag>
        </>}
        controls={
          <div className="gm-controls">
            <IconButton icon="back" label="Voriges Beispiel" onClick={() => goTo(index - 1)} />
            <Button variant="primary" icon="shake" onClick={doMix} disabled={phase !== "ruhe"}>{ex.before ? "Mischen" : "Schütteln"}</Button>
            <IconButton icon="arrow" label="Nächstes Beispiel" onClick={() => goTo(index + 1)} />
            <label className="gm-temp">
              <Icon name="fire" size={18} />
              <input type="range" min={0} max={100} step={10} value={temp} aria-label="Temperatur"
                onChange={e => { setTemp(Number(e.target.value)); if (reduced) setVersion(v => v + 1); }} />
              <output>{temp} °C</output>
            </label>
          </div>
        }
        tools={[
          { id: "stoffe", label: "Stoffe", icon: "molecule", content: <Substances ex={ex} onPick={f => setPick(f)} /> },
          { id: "zaehlen", label: "Zählen", icon: "table", content: <Counts ex={ex} /> },
          { id: "farben", label: "Farben", icon: "atom", content: <Legend els={a.atomsorten} /> },
          { id: "einteilung", label: "Einteilung", icon: "layers", content: <Einteilung current={index} onPick={i => goTo(i)} /> },
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
