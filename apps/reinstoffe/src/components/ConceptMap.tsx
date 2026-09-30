// Einteilung der Stoffe als Baum (wie im Heft): Stoffe → Reinstoffe (Elemente, Verbindungen) | Gemische → homogen | heterogen
// mit den Gemischtypen und ihren Aggregatzuständen. Markiert den Weg des aktuellen Inhalts; im Quiz antippbar (Antwortform „map“).

import { HETEROGEN_TYPES, HOMOGEN_TYPES, MIX_TYPES, type MixInfo, type MixType } from "@lern/chem";

export type Node = "rein" | "gemisch" | "element" | "verbindung" | "homogen" | "heterogen" | MixType;
export const NODE_NAMES: Record<Node, string> = {
  rein: "Reinstoffe", gemisch: "Gemische", element: "Elemente", verbindung: "Verbindungen", homogen: "homogen", heterogen: "heterogen",
  ...Object.fromEntries(Object.entries(MIX_TYPES).map(([k, v]) => [k, v.name])) as Record<MixType, string>,
};

/** Welche Knoten gehören zum Inhalt des Bechers? */
export function pathOf(m: MixInfo | null): Set<Node> {
  const out = new Set<Node>();
  if (!m || !m.items.length) return out;
  if (m.pure) { out.add("rein"); out.add(m.pureKind!); return out; }
  out.add("gemisch");
  out.add(m.homogen ? "homogen" : "heterogen");
  m.types.forEach(t => out.add(t.type));
  return out;
}

export function ConceptMap({ on = new Set<Node>(), onPick, pickable, hideStates = false, result, part = "all" }: {
  on?: Set<Node>;
  /** Antippen (Quiz) – nur diese Knoten sind wählbar */
  onPick?: (n: Node) => void;
  pickable?: Node[];
  /** Aggregatzustände ausblenden (wenn danach gefragt wird) */
  hideStates?: boolean;
  /** nach dem Antworten: richtig/falsch markieren */
  result?: { right: Node; chosen?: Node };
  /** nur ein Teil: „top“ = bis homogen/heterogen, „gemische“ = nur die Gemischtypen */
  part?: "all" | "top" | "gemische";
}) {
  const node = (n: Node, leaf = false) => {
    const can = !!onPick && (!pickable || pickable.includes(n));
    const bad = result?.chosen === n && result.chosen !== result.right;
    const cls = `cm-node${leaf ? " leaf" : ""}${on.has(n) ? " on" : ""}${result?.right === n ? " right" : ""}${bad ? " wrong" : ""}`;
    const body = (
      <>
        <b>{result?.right === n && "✓ "}{bad && "✗ "}{NODE_NAMES[n].replace("Verbindungen", "Verbin\u00ADdungen").replace("Reinstoffe", "Rein\u00ADstoffe")}</b>
        {leaf && !hideStates && <small>{MIX_TYPES[n as MixType].states}</small>}
      </>
    );
    return can
      ? <button key={n} type="button" className={cls} onClick={() => onPick!(n)} disabled={!!result}>{body}</button>
      : <span key={n} className={cls}>{body}</span>;
  };
  const row = (head: Node, kids: React.ReactNode, sub = false) => (
    <div className={`cm-row${sub ? " sub" : ""}`}>{node(head)}<div className="cm-kids">{kids}</div></div>
  );
  return (
    <div className="cm" role="group" aria-label="Einteilung der Stoffe">
      {part === "all" && <div className="cm-root">Stoffe</div>}
      {part !== "gemische" && row("rein", <>{node("element")}{node("verbindung")}</>)}
      {part === "top" && row("gemisch", <>{node("homogen")}{node("heterogen")}</>)}
      {part === "all" && <div className="cm-row"><span className={`cm-node${on.has("gemisch") ? " on" : ""}`}><b>Gemische</b></span></div>}
      {part !== "top" && row("homogen", HOMOGEN_TYPES.map(t => node(t, true)), part === "all")}
      {part !== "top" && row("heterogen", HETEROGEN_TYPES.map(t => node(t, true)), part === "all")}
    </div>
  );
}
