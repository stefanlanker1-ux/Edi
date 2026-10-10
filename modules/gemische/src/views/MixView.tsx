// Probieren: zehn fertige Beispiele im Teilchenmodell und Müsli (Gemenge aus sichtbaren Stücken, kein Baukasten) – Gefäß mit allen Teilchen und verschiebbarer Lupe (flow.ts, FlowView).
// Die Teilchen bewegen sich ständig und fließend. Jedes Beispiel beginnt „vorher“: Zuckerkristall im Wasser, Alkohol obenauf,
// CO₂ über dem Wasser, Gase hinter Trennwänden, Metallblöcke. Flüssigkeiten lösen und mischen sich von selbst (langsam; warm schneller),
// der Knopf sagt, was er tut: Umrühren, Schütteln, Trennwand weg, Schmelzen. „Von vorn“ stellt den Anfang wieder her.
// Öl und Wasser: „Schütteln“, danach entmischen sie sich wieder.
// Teilchen antippen = Stoff-Info mit 3D-Modell. Werkzeuge: Stoffe, Zählen, Farben, Einteilung, Arten (Gemischarten-Tabelle), Beispiele.

import { useId, useRef, useState } from "react";
import { Button, buzz, Icon, IconButton, Reserve, Tag, tr, useNarrow, useReducedMotion, Workbench } from "@lern/ui";
import { Kalotte, KalotteShades, SubstanceSheet, kalotteBox, kalotteElements } from "@lern/chem-ui";
import { toSubscript } from "@lern/chem";
import { EXAMPLES, EXAMPLE_COUNT, MIX_LABEL, MUESLI, analyse, elementName, mixKind, nameOf, type Example, type MixKind } from "../mixtures.ts";
import { seedOf } from "../mixing.ts";
import { ACID, STIR, atEquilibrium, gasTarget, liquidLevel, makeWorld, openBottle, separatedFlow, settledFlow, shakeWorld, startMixing, stepFlow, type World } from "../flow.ts";
import { FlowView } from "../components/FlowView.tsx";
import { MuesliBowl } from "../components/MuesliBowl.tsx";
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
      <p className="gm-small">{tr("Farben nur im Modell", "Colours only in the model")}</p>
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
          <span><b>{nameOf(f)}</b><small>{toSubscript(f)} · {n[f]} {tr("Teilchen", "particles")}</small></span>
        </button>
      )) : <p className="gm-none">–</p>}
    </div>
  );
  return (
    <div className="gm-subs">
      <p className="gm-cap">{tr("Reinstoffe", "Pure substances")}</p>
      <div className="gm-cols">{col(tr("Verbindungen", "Compounds"), a.verbindungen)}{col(tr("Elemente", "Elements"), a.elemente)}</div>
      {ex.forms && (
        <div className="gm-forms">
          <p className="gm-cap">{tr("Entsteht in kleiner Menge (Reaktion mit Wasser)", "Forms in small amounts (reaction with water)")}</p>
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

/** Markierung im Bild: Teilchen dieser Stoffe bleiben kräftig, alle anderen werden blass */
export interface Mark { key: string; label: string; fs: string[] }

/**
 * Zählen als Anzeige zum Nachprüfen (Experimentieren stellt keine Fragen): alle Zahlen stehen da; Stoffe, Verbindungen, Elemente
 * und Atomsorten lassen sich antippen – dann sind im Gefäß und in der Lupe nur deren Teilchen kräftig, so kann man selbst nachzählen.
 * Die Teilchenzahl steht immer da (bei über hundert Teilchen zählt niemand von Hand).
 */
function Counts({ ex, mark, onMark }: { ex: Example; mark: Mark | null; onMark: (m: Mark | null) => void }) {
  const a = analyse(ex.items);
  const toggle = (m: Mark) => { buzz(); onMark(mark?.key === m.key ? null : m); };
  const by = (key: string, label: string, fs: string[]): Mark => ({ key, label, fs });
  const stoff = (f: string) => by(`s:${f}`, toSubscript(f), [f]);
  const sorte = (el: string) => by(`a:${el}`, el, a.stoffe.filter(f => analyse([[f, 1]]).atomsorten.includes(el)));
  const chips = (ms: [Mark, string][]) => (
    <div className="gm-marks">
      {ms.map(([m, f]) => (
        <button key={m.key} type="button" className="gm-mark-chip" aria-pressed={mark?.key === m.key} onClick={() => toggle(m)}
          aria-label={tr(`${m.label} im Bild markieren`, `Mark ${m.label} in the picture`)}>
          <span className="gm-mark-ico" aria-hidden="true">◎</span><MiniParticle f={f} size={26} /><span>{m.label}</span>
        </button>
      ))}
    </div>
  );
  const row = (m: Mark, title: string, n: number) => (
    <button type="button" className="gm-count-row" aria-pressed={mark?.key === m.key} disabled={!n} onClick={() => toggle(m)}
      aria-label={`${title}: ${n}. ${tr(`${m.label} im Bild markieren`, `Mark ${m.label.toLowerCase()} in the picture`)}`}>
      <span>{title}</span><span className="gm-count-end"><span className="gm-mark-ico" aria-hidden="true">◎</span><b>{n}</b></span>
    </button>
  );
  return (
    <div className="gm-count-wrap">
      <dl className="gm-counts">
        <div><dt>{tr("Teilchen", "Particles")}</dt><dd>{a.teilchen}</dd></div>
        <div className="gm-count-multi"><dt>{tr("Stoffe", "Substances")}</dt><dd>{a.stoffe.length}</dd>{chips(a.stoffe.map(f => [stoff(f), f]))}</div>
      </dl>
      {row(by("v", tr("Verbindungen", "Compounds"), a.verbindungen), tr("davon Verbindungen", "of which compounds"), a.verbindungen.length)}
      {row(by("e", tr("Elemente", "Elements"), a.elemente), tr("davon Elemente", "of which elements"), a.elemente.length)}
      <dl className="gm-counts">
        <div className="gm-count-multi"><dt>{tr("Atomsorten", "Kinds of atoms")}</dt><dd>{a.atomsorten.length}</dd>{chips(a.atomsorten.map(el => [sorte(el), el]))}</div>
      </dl>
    </div>
  );
}

/** Einteilung der Stoffe mit allen Beispielen; das aktuelle ist hervorgehoben (antippen = dorthin wechseln) */
function Einteilung({ current, onPick }: { current: number; onPick: (i: number) => void }) {
  const M = EXAMPLES.length;
  const kind = current === M ? "heterogen" : mixKind(EXAMPLES[current]);
  const leaf = (k: MixKind, label: string) => (
    <div className={`gm-leaf${k === kind ? " on" : ""}`}>
      <b>{label}</b>
      <div className="gm-leaf-ex">
        {EXAMPLES.map((e, i) => mixKind(e) === k && (
          <button key={e.id} type="button" className="gm-chip" aria-pressed={i === current} onClick={() => { buzz(); onPick(i); }}>{e.title}</button>
        ))}
        {k === "heterogen" && <button type="button" className="gm-chip" aria-pressed={current === M} onClick={() => { buzz(); onPick(M); }}>{MUESLI.title}</button>}
      </div>
    </div>
  );
  const rein = kind === "element" || kind === "verbindung";
  return (
    <div className="gm-tree">
      <div className="gm-node root">{tr("Stoffe", "Substances")}</div>
      <div className="gm-branches">
        <div className={`gm-branch${rein ? " on" : ""}`}>
          <div className="gm-node">{tr("Reinstoffe", "Pure substances")}</div>
          {leaf("element", tr("Elemente", "Elements"))}
          {leaf("verbindung", tr("Verbindungen", "Compounds"))}
        </div>
        <div className={`gm-branch${!rein ? " on" : ""}`}>
          <div className="gm-node">{tr("Gemische", "Mixtures")}</div>
          {leaf("homogen", tr("homogen", "homogeneous"))}
          {leaf("heterogen", tr("heterogen", "heterogeneous"))}
        </div>
      </div>
    </div>
  );
}

type Z = "fest" | "flüssig" | "Gas";
const ZS: Z[] = ["fest", "flüssig", "Gas"];
const Z_NAME: Record<Z, string> = tr({ fest: "fest", flüssig: "flüssig", Gas: "Gas" }, { fest: "solid", flüssig: "liquid", Gas: "gas" });
/** Arten von Gemischen: verteilter Stoff (Zeile) in Hauptstoff (Spalte); homogen und heterogen mit Alltagsbeispiel */
const ARTEN: Partial<Record<`${Z}|${Z}`, [string, string, boolean][]>> = {
  "fest|fest": [[tr("Gemenge", "Coarse mixture"), tr("Müsli", "muesli"), false], [tr("Legierung", "Alloy"), tr("Messing", "brass"), true]],
  "fest|flüssig": [["Suspension", tr("Sand in Wasser", "sand in water"), false], [tr("Lösung", "Solution"), tr("Zuckerwasser", "sugar water"), true]],
  "fest|Gas": [[tr("Rauch", "Smoke"), tr("Ruß in Luft", "soot in air"), false]],
  "flüssig|flüssig": [["Emulsion", tr("Milch", "milk"), false], [tr("Lösung", "Solution"), tr("Alkohol in Wasser", "alcohol in water"), true]],
  "flüssig|Gas": [[tr("Nebel", "Fog"), tr("Morgennebel über dem Teich", "morning fog over a pond"), false]],
  "Gas|flüssig": [[tr("Schaum", "Foam"), tr("Eischnee", "whisked egg white"), false], [tr("Lösung", "Solution"), tr("Sprudelwasser", "sparkling water"), true]],
  "Gas|Gas": [[tr("Gasgemisch", "Gas mixture"), tr("Luft", "air"), true]],
};
/** Zelle des Beispiels in der Tabelle: [verteilter Stoff, Hauptstoff] */
const CELL: Record<string, `${Z}|${Z}`> = {
  zucker: "fest|flüssig", alkohol: "flüssig|flüssig", sprudel: "Gas|flüssig", oel: "flüssig|flüssig", messing: "fest|fest",
  erdgas: "Gas|Gas", schutzgas: "Gas|Gas", modell: "Gas|Gas", muesli: "fest|fest",
};

function Arten({ ex }: { ex: Pick<Example, "id" | "type"> }) {
  const cell = CELL[ex.id];
  return (
    <div className="gm-arten">
      <p className="gm-cap">{tr("verteilter Stoff in Hauptstoff", "dispersed substance in main substance")}</p>
      <dl>
        {ZS.flatMap(r => ZS.map(c => `${r}|${c}` as const)).filter(k => ARTEN[k]).map(k => {
          const [r, c] = k.split("|") as [Z, Z];
          return (
            <div key={k} className={k === cell ? "on" : undefined}>
              <dt>{Z_NAME[r]} in {Z_NAME[c]}</dt>
              <dd>{ARTEN[k]!.map(([n, e, hom], i) => (
                <span key={n} className={`gm-art${ex.type === n && k === cell ? " cur" : ""}`}>{i > 0 && " · "}<b>{n}</b> ({e}{hom ? tr(", homogen", ", homogeneous") : ""})</span>
              ))}</dd>
            </div>
          );
        })}
      </dl>
    </div>
  );
}

/** lange Namen in den schmalen Knöpfen der Beispiele: Trennstelle anbieten (am Handy mit Lesbar-Schrift sonst zu breit) */
const SOFT: Record<string, string> = { Modellgemisch: "Modell\u00adgemisch", Sprudelwasser: "Sprudel\u00adwasser", Zuckerwasser: "Zucker\u00adwasser" };
const soft = (title: string) => title.split(" ").map(w => SOFT[w] ?? w).join(" ");

function ExampleList({ current, onPick }: { current: number; onPick: (i: number) => void }) {
  return (
    <div className="gm-examples">
      {[...EXAMPLES, MUESLI].map((e, i) => (
        <button key={e.id} type="button" aria-pressed={i === current} className="gm-ex" onClick={() => { buzz(); onPick(i); }}>
          <span className="gm-ex-n">{i + 1}</span><span className="gm-ex-t">{soft(e.title)}</span>
        </button>
      ))}
    </div>
  );
}

/** Zustand für die Anzeige (alle 15 Schritte aus der Welt gelesen) */
export interface Info { bound: number; gas: number; eq: number; aq: number; opened: boolean; sep: boolean; walls: number; melt: boolean; busy: boolean; mixed: boolean; doneAt?: number; t: number }
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
const DISS = () => tr("gelöst", "dissolved"), MIXED = () => tr("gemischt", "mixed"), MIXING = () => tr("mischt sich", "mixing");
const SEP = () => tr("getrennt", "separate"), HET = () => tr("heterogen", "heterogeneous");
const secs = (steps: number) => `${Math.max(1, Math.round(steps / 60))} s`;

/** Hauptknopf je Beispiel: sagt, was passiert */
function actionOf(ex: Example, i?: Info): { label: string; icon: "shake" | "fire" | "up" } {
  // Sprudel: erst schütteln (CO₂ löst sich), im Gleichgewicht öffnen, dann wieder schütteln (CO₂ entweicht)
  if (ex.before === "gasraum" && i && !i.opened && i.doneAt !== undefined) return { label: tr("Öffnen", "Open"), icon: "up" };
  if (ex.state === "fest") return { label: tr("Schmelzen", "Melt"), icon: "fire" };
  if (ex.state !== "fluessig") return ex.before ? { label: ex.items.length > 2 ? tr("Wände weg", "Remove walls") : tr("Wand weg", "Remove wall"), icon: "up" } : { label: tr("Schütteln", "Shake"), icon: "shake" };
  return ex.before === "kristall" || ex.before === "schicht" ? { label: tr("Umrühren", "Stir"), icon: "shake" } : { label: tr("Schütteln", "Shake"), icon: "shake" };
}

/** Statuszeile: höchstens zwei kurze Kennzeichen (bleibt einzeilig, damit sich das Bild nie verschiebt) */
export function statusOf(ex: Example, i: Info, done: number | undefined): string[] {
  const k = ex.solute ? ex.items.find(([f]) => f === ex.solute)![1] : 0;
  const time = (verb: string) => (done !== undefined ? `${verb} in ${secs(done)}` : verb);
  if (ex.before === "kristall") return i.bound ? [tr("löst sich", "dissolving"), `${k - i.bound} / ${k} ${DISS()}`] : [tr("Lösung", "Solution"), time(DISS())];
  // geschlossene Flasche: CO₂ löst sich bzw. perlt aus, bis so viel gelöst ist, wie bei dieser Temperatur geht (kalt mehr, warm weniger)
  if (ex.before === "gasraum") {
    // offen: CO₂ entweicht, bis keins mehr gelöst ist (abgestanden)
    if (i.opened) return [i.aq ? tr("offen · perlt aus", "open · fizzing out") : tr("abgestanden", "flat"), `${i.aq} / ${k} ${DISS()}`];
    return [i.gas > i.eq + 1 ? tr("löst sich", "dissolving") : i.gas < i.eq - 1 ? tr("perlt aus", "fizzing out") : tr("Gleichgewicht", "Equilibrium"), `${i.aq} / ${k} ${DISS()}`];
  }
  // einmal gemischt bleibt gemischt (bis „Von vorn“) – zufällige Schwankungen der Verteilung lassen die Anzeige nicht zurückspringen
  if (ex.before === "schicht") return i.mixed || done !== undefined ? [tr("Lösung", "Solution"), time(MIXED())] : [MIXING()];
  if (ex.floats?.length) return [i.sep ? tr("2 Schichten", "2 layers") : "Emulsion", HET()];
  // Metalle schmelzen erst weit über der Raumtemperatur (Messing ab etwa 900 °C) – der Temperaturregler gilt hier nicht und ist ausgeblendet
  if (ex.state === "fest") return i.walls ? [SEP()] : i.melt ? [tr("geschmolzen", "molten"), tr("über 900 °C", "above 900 °C")] : [ex.type ?? tr("Legierung", "Alloy"), tr("homogen", "homogeneous")];
  if (ex.before) return i.walls ? [SEP()] : i.mixed || done !== undefined ? [ex.type ?? tr("Gasgemisch", "Gas mixture"), time(MIXED())] : [MIXING()];
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
  const [mark, setMark] = useState<Mark | null>(null);
  const narrow = useNarrow();
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
          <div className="gm-head" data-screen={ex.id}>
            <h2 className="gm-title">{ex.title}</h2>
            <span className="gm-num">{index + 1} / {EXAMPLE_COUNT}</span>
            {ex.note && <p className="gm-note">{ex.note}</p>}
          </div>
        }
        stage={<FlowView world={world} motion={!reduced} paused={!!pick} version={version} focus={focus} mark={mark?.fs} onFrame={onFrame} onPick={f => { buzz(); setPick(f); }}
          label={`${ex.title}: ${ex.items.map(([f, n]) => `${n} × ${nameOf(f)}`).join(", ")}`} />}
        status={
          <div className="gm-status">
            {(mark ? statusOf(ex, info, done).slice(0, 1) : statusOf(ex, info, done)).map(l => <Tag key={l}>{l}</Tag>)}
            {mark && (
              <button type="button" className="gm-mark-off" onClick={() => { buzz(); setMark(null); }} aria-label={`${tr("Markierung aufheben", "Clear marking")}: ${mark.label}`}>
                <span aria-hidden="true">◎</span> {mark.label} <span aria-hidden="true">✕</span>
              </button>
            )}
          </div>
        }
        controls={
          <div className="gm-controls">
            <div className="gm-row">
              <IconButton icon="back" label={tr("Voriges Beispiel", "Previous example")} onClick={() => goTo(index - 1)} />
              {/* Sprudel: „Schütteln“ wird zu „Öffnen“ – Platz für beide, die Pfeile daneben rücken nicht */}
              <Button variant="primary" icon={action.icon} onClick={act} disabled={!canAct}><Reserve alts={ex.before === "gasraum" ? [actionOf(ex).label, tr("Öffnen", "Open")] : []}>{action.label}</Reserve></Button>
              <IconButton icon="arrow" label={tr("Nächstes Beispiel", "Next example")} onClick={() => goTo(index + 1)} />
              {/* Messing: ohne Temperaturregler steht „Von vorn“ in derselben Zeile */}
              {ex.state === "fest" && <IconButton icon="reset" label={tr("Von vorn", "Start again")} onClick={again} />}
            </div>
            {ex.state !== "fest" && <div className="gm-row">
              {ex.before && <IconButton icon="reset" label={tr("Von vorn", "Start again")} onClick={again} />}
              <label className="gm-temp">
                <Icon name="fire" size={18} />
                <input type="range" min={0} max={100} step={10} value={temp} aria-label={tr("Temperatur", "Temperature")}
                  onChange={e => { setTemp(Number(e.target.value)); if (reduced) setVersion(v => v + 1); }} />
                <output>{temp} °C</output>
              </label>
            </div>}
          </div>
        }
        tools={[
          { id: "stoffe", label: tr("Stoffe", "Substances"), icon: "molecule", content: <Substances ex={ex} onPick={f => setPick(f)} /> },
          { id: "zaehlen", label: tr("Zählen", "Count"), icon: "table", content: <Counts ex={ex} mark={mark} onMark={m => { setMark(m); if (m && narrow) setTool(null); if (!reduced) return; setVersion(v => v + 1); }} /> },
          { id: "farben", label: tr("Farben", "Colours"), icon: "atom", content: <Legend els={a.atomsorten} /> },
          { id: "einteilung", label: tr("Einteilung", "Classification"), icon: "layers", content: <Einteilung current={index} onPick={i => goTo(i)} /> },
          { id: "arten", label: tr("Arten", "Types"), icon: "beaker", title: tr("Arten von Gemischen", "Types of mixtures"), content: <Arten ex={ex} /> },
          { id: "beispiele", label: tr("Beispiele", "Examples"), icon: "grid", content: <ExampleList current={index} onPick={i => goTo(i)} /> },
        ]} />
      <SubstanceSheet f={pick} onClose={() => setPick(null)} />
    </>
  );
}

/** Müsli: Gemenge aus sichtbaren Stücken – Mischen und wieder Auslesen (Trennen von Hand), kein Teilchenbild */
function Muesli({ index }: { index: number }) {
  const setEx = useApp(s => s.setEx);
  const reduced = useReducedMotion();
  // 0 = jede Sorte für sich, sonst Nummer des Mischens (jedes Mal eine neue Verteilung)
  const [mixed, setMixed] = useState(0);
  const [shaking, setShaking] = useState(false);
  const [tool, setTool] = useState<string | null>(null);
  const runs = useRef(0);
  const goTo = (i: number) => { buzz(); setEx(i); setTool(null); };
  const act = () => {
    buzz();
    setMixed(mixed ? 0 : ++runs.current);
    if (!mixed && !reduced) { setShaking(true); setTimeout(() => setShaking(false), 700); }
  };
  const parts = MUESLI.parts;
  return (
    <Workbench className="gm-wb" active={tool} onActive={setTool}
      head={
        <div className="gm-head" data-screen="muesli">
          <h2 className="gm-title">{MUESLI.title}</h2>
          <span className="gm-num">{index + 1} / {EXAMPLE_COUNT}</span>
          <p className="gm-note">{MUESLI.note}</p>
        </div>
      }
      stage={<MuesliBowl mixed={mixed} shaking={shaking} />}
      status={<div className="gm-status">{(mixed ? [MUESLI.type, HET()] : [SEP()]).map(l => <Tag key={l}>{l}</Tag>)}</div>}
      controls={
        <div className="gm-controls">
          <div className="gm-row">
            <IconButton icon="back" label={tr("Voriges Beispiel", "Previous example")} onClick={() => goTo(index - 1)} />
            {/* beide Beschriftungen reservieren: die Pfeile daneben rücken nicht */}
            <Button variant="primary" icon={mixed ? "grid" : "shake"} onClick={act}><Reserve alts={[tr("Auslesen", "Hand-pick"), tr("Mischen", "Mix")]}>{mixed ? tr("Auslesen", "Hand-pick") : tr("Mischen", "Mix")}</Reserve></Button>
            <IconButton icon="arrow" label={tr("Nächstes Beispiel", "Next example")} onClick={() => goTo(index + 1)} />
          </div>
        </div>
      }
      tools={[
        { id: "stoffe", label: tr("Zutaten", "Ingredients"), icon: "molecule", content: (
          <div className="gm-subs">
            <ul className="gm-parts">{parts.map(p => <li key={p.id}><b>{p.name}</b><span>{p.n} {tr("Stück", p.n === 1 ? "piece" : "pieces")}</span></li>)}</ul>
            <p className="gm-small">{tr("Jeder Bestandteil besteht selbst aus vielen Stoffen.", "Each component is itself made of many substances.")}</p>
          </div>
        ) },
        { id: "zaehlen", label: tr("Zählen", "Count"), icon: "table", content: (
          <dl className="gm-counts">
            <div><dt>{tr("Bestandteile", "Components")}</dt><dd>{parts.length}</dd></div>
            <div><dt>{tr("Stücke", "Pieces")}</dt><dd>{parts.reduce((s, p) => s + p.n, 0)}</dd></div>
          </dl>
        ) },
        { id: "einteilung", label: tr("Einteilung", "Classification"), icon: "layers", content: <Einteilung current={index} onPick={i => goTo(i)} /> },
        { id: "arten", label: tr("Arten", "Types"), icon: "beaker", title: tr("Arten von Gemischen", "Types of mixtures"), content: <Arten ex={MUESLI} /> },
        { id: "beispiele", label: tr("Beispiele", "Examples"), icon: "grid", content: <ExampleList current={index} onPick={i => goTo(i)} /> },
      ]} />
  );
}

export function MixView() {
  const ex = useApp(s => s.ex);
  // key: neues Beispiel → Anfangslage neu
  // Temperatur gilt für alle Beispiele (nicht gespeichert, Start bei 20 °C)
  const [temp, setTemp] = useState(20);
  if (ex === EXAMPLES.length) return <Muesli index={ex} />;
  return <Mix key={ex} ex={EXAMPLES[ex]} index={ex} temp={temp} setTemp={setTemp} />;
}
