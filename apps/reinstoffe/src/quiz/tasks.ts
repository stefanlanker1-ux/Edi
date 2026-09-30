// Quiz „Reinstoffe und Gemische“ (reine Daten). Aufgabentyp = Fertigkeit.
// Antwortformen: "mc" (Auswahl), "map" (in der Einteilung antippen), "count" (Phasen / Elemente / Verbindungen zählen; Stoffe zählen, nicht Atome).
// Falsche Antworten stehen für Fehlvorstellungen (Katalog misconceptions.ts): d(text, miss, why) bzw. Fallen bei map/count.

import { EVERYDAY, MIX_TYPES, STOFF, STOFFE, alloyName, heat, isElement, mix, parseFormula, separate, toSubscript, METHODS, type Everyday, type Item, type Method, type MixType } from "@lern/chem";
import { buildRound, d, mc, pick, shuffle, weakTypes, type BaseTask, type LevelKey, type McTask, type QuizLevel, type Trap, type TypeStats } from "@lern/quiz";
import { NODE_NAMES, type Node } from "../components/ConceptMap.tsx";

/** item: Name groß über der Frage; beaker: Teilchenbild (particle) bzw. Becher + Teilchen */
export type Visual = { item?: string; beaker?: { items: Item[]; shaken?: boolean; view: "particle" | "pair" } };
export type MapTask = BaseTask & Visual & { kind: "map"; answer: Node; part: "top" | "gemische"; hideStates?: boolean };
export type CountTask = BaseTask & Visual & { kind: "count"; answer: { p: number; e: number; c: number } };
export type Task = (McTask & Visual) | MapTask | CountTask;

/** Reihenfolge der Knoten (Index = Wert der map-Antwort) */
export const NODES: Node[] = ["element", "verbindung", "homogen", "heterogen", "loesung", "legierung", "gasgemisch", "emulsion", "suspension", "gemenge", "schaum", "rauch", "nebel"];
const idx = (n: Node) => NODES.indexOf(n);

const sub = (f: string) => toSubscript(f);
const kindOf = (e: Everyday): "element" | "verbindung" | "homogen" | "heterogen" =>
  e.kind === "element" || e.kind === "verbindung" ? e.kind : MIX_TYPES[e.kind].homogen ? "homogen" : "heterogen";
const WORD: Record<"element" | "verbindung" | "homogen" | "heterogen", string> = {
  element: "Reinstoff – Element", verbindung: "Reinstoff – Verbindung", homogen: "homogenes Gemisch", heterogen: "heterogenes Gemisch",
};
const pureWhy = (e: Everyday) => `${e.name}: ${e.why}.`;

/** Diagnose, wenn für das Beispiel `e` fälschlich `chosen` gewählt wird */
function diagnoseKind(e: Everyday, chosen: "element" | "verbindung" | "homogen" | "heterogen"): { miss: string; why: string } {
  const right = kindOf(e);
  const f = e.formula ? sub(e.formula) : "";
  if (right === "element" && chosen === "verbindung") return { miss: "element-molekuel", why: `${f} besteht nur aus einer Atomsorte – auch wenn zwei Atome verbunden sind, ist es ein Element.` };
  if (right === "verbindung" && chosen === "element") return { miss: "verbindung-element", why: `${f} enthält ${Object.keys(parseFormula(e.formula!)).length} Atomsorten fest verbunden – eine Verbindung.` };
  if ((right === "element" || right === "verbindung") && (chosen === "homogen" || chosen === "heterogen")) {
    return { miss: "verbindung-gemisch", why: `${e.name} besteht nur aus ${f}-Teilchen – ein Reinstoff, kein Gemisch.` };
  }
  if (chosen === "element" || chosen === "verbindung") {
    const miss = e.trap === "natuerlich-rein" || e.trap === "ein-name-ein-stoff" ? e.trap : "klar-rein";
    const lead = miss === "natuerlich-rein" ? `${e.name} ist natürlich, aber nicht rein` : miss === "ein-name-ein-stoff" ? `${e.name} hat einen eigenen Namen, ist aber gemischt` : `${e.name} sieht einheitlich aus, ist aber nicht rein`;
    return { miss, why: `${lead}: ${e.why} – ein Gemisch.` };
  }
  if (right === "homogen") return { miss: e.trap === "farbe-heterogen" ? "farbe-heterogen" : "loesung-suspension", why: `${e.name}: ${e.why} – überall gleich, auch unter dem Mikroskop: homogen.` };
  return { miss: "einheitlich-aussehend", why: `${e.name}: ${e.why} – unter dem Mikroskop erkennbar: heterogen.` };
}

// ── 1. Reinstoff oder Gemisch? ───────────────────────────────────────────────

function rein(): Task {
  const e = pick(EVERYDAY);
  const right = kindOf(e);
  const base = {
    item: e.name,
    praise: "Auf die Teilchen geschaut, nicht aufs Aussehen – genau so geht's.",
    prompt: `Was ist **${e.name}**?`,
    hint: "Reinstoff: nur eine Sorte Teilchen. Element: nur eine Atomsorte. Gemisch: mehrere Stoffe – homogen, wenn überall gleich.",
    explain: `${pureWhy(e)} → **${WORD[right]}**.`,
  };
  if (Math.random() < 0.35) {
    const ans = right as Node;
    return {
      kind: "map", answer: ans, part: "top", ...base,
      traps: (["element", "verbindung", "homogen", "heterogen"] as const).filter(k => k !== right).map(k => ({ field: "n", value: idx(k), ...diagnoseKind(e, k) })),
    };
  }
  return {
    ...mc(WORD[right], (["element", "verbindung", "homogen", "heterogen"] as const).filter(k => k !== right).map(k => { const g = diagnoseKind(e, k); return d(WORD[k], g.miss, g.why); }), 4),
    ...base,
  };
}

// ── 2. Element oder Verbindung? ──────────────────────────────────────────────

const PURE = [...STOFFE.map(s => ({ name: s.name, formula: s.formula })), { name: "Gold", formula: "Au" }, { name: "Silber", formula: "Ag" },
  { name: "Ammoniak", formula: "NH3" }, { name: "Methan", formula: "CH4" }, { name: "Chlor", formula: "Cl2" }, { name: "Ozon", formula: "O3" },
  { name: "Wasserstoffperoxid", formula: "H2O2" }, { name: "Stickstoffdioxid", formula: "NO2" }].filter(s => s.formula !== "C57H104O6");

function element(): Task {
  const s = pick(PURE);
  const els = Object.keys(parseFormula(s.formula));
  const el = els.length === 1;
  const f = sub(s.formula);
  const right = el ? "Element" : "Verbindung";
  const wrongs = [
    el ? d("Verbindung", "element-molekuel", `${f}: nur ${els[0]}-Atome – eine Atomsorte ist ein Element, auch wenn mehrere Atome verbunden sind.`)
      : d("Element", "verbindung-element", `${f} enthält ${els.length} Atomsorten (${els.join(", ")}) – fest verbunden: Verbindung.`),
    el ? d("Gemisch", "verbindung-gemisch", `${f} ist nur eine Sorte Teilchen – ein Reinstoff, kein Gemisch.`)
      : d("Gemisch", "verbindung-gemisch", `In ${f} sind die Atome fest verbunden, jedes Teilchen ist gleich – kein Gemisch, sondern ein Reinstoff.`),
  ];
  return {
    ...mc(right, wrongs, 3),
    item: `${s.name} · ${f}`,
    praise: "Atomsorten in der Formel gezählt – genau so geht's.",
    prompt: `Ist **${s.name}** (\`${f}\`) ein Element oder eine Verbindung?`,
    hint: "Zähle die verschiedenen Elementsymbole in der Formel: eines → Element, mehrere → Verbindung.",
    explain: `\`${f}\`: ${els.length === 1 ? `nur ${els[0]}` : `${els.join(" und ")}`} → **${right}**.`,
  };
}

// ── Teilchenbilder ───────────────────────────────────────────────────────────

const PARTICLE_POOL = ["h2o", "o2", "n2", "h2", "he", "co2", "nacl", "fe", "s", "cu", "sand", "ethanol", "oel", "zucker"];
/** zufälliger Becherinhalt fürs Teilchenbild: 1–3 Stoffe, keine Legierung */
function randomMix(): string[] {
  const n = pick([1, 1, 2, 2, 2, 3]);
  let items: string[];
  do items = shuffle(PARTICLE_POOL).slice(0, n); while (n > 1 && items.every(id => STOFF[id].state === "s") && items.length > 2);
  return items;
}

function teilchenArt(): Task {
  const items = randomMix();
  const m = mix(items);
  const right = m.pure ? m.pureKind! : m.homogen ? "homogen" : "heterogen";
  const one = items.length === 1 ? STOFF[items[0]] : null;
  const f = one ? sub(one.formula) : "";
  const whyOf = (k: typeof right): { miss: string; why: string } => {
    if (right === "element" && k === "verbindung") return { miss: "element-molekuel", why: `Alle Teilchen sind gleich und bestehen aus einer Atomsorte (${f}) – Element.` };
    if (right === "verbindung" && k === "element") return { miss: "verbindung-element", why: `Jedes Teilchen enthält verschiedene Atome (${f}) – Verbindung.` };
    if (one && (k === "homogen" || k === "heterogen")) return { miss: "farben-gemisch", why: `Alle Teilchen sind gleich gebaut (${f}) – ein Reinstoff, auch wenn ${Object.keys(parseFormula(one.formula)).length > 1 ? "mehrere Atomfarben darin sind" : "viele Teilchen da sind"}.` };
    if (!one && (k === "element" || k === "verbindung")) return { miss: "verbindung-gemisch", why: `Es gibt ${items.length} verschiedene Teilchensorten – ein Gemisch.` };
    if (right === "homogen") return { miss: "loesung-suspension", why: `Die Teilchen sind gleichmäßig verteilt, keine Schichten oder Körner: ${m.counts.phases} Phase – homogen.` };
    return { miss: "einheitlich-aussehend", why: `Es gibt ${m.counts.phases} Bereiche (Phasen) – heterogen.` };
  };
  const others = (["element", "verbindung", "homogen", "heterogen"] as const).filter(k => k !== right);
  return {
    ...mc(WORD[right], others.map(k => { const g = whyOf(k); return d(WORD[k], g.miss, g.why); }), 4),
    beaker: { items, view: "particle" },
    praise: "Teilchensorten und Bereiche erkannt – genau so geht's.",
    prompt: "Was zeigt das **Teilchenbild**?",
    hint: "Wie viele Sorten Teilchen gibt es? Eine → Reinstoff. Mehrere → Gemisch: gleichmäßig verteilt = homogen, Schichten/Körner = heterogen.",
    explain: `${items.map(id => (id === "oel" ? "Öl" : `${STOFF[id].name} (${sub(STOFF[id].formula)})`)).join(", ")} → **${WORD[right]}**.`,
  };
}

/** Atomsorten im Bild (für die Falle „Atomsorten statt Stoffe gezählt“) */
const atomKinds = (items: Item[]) => new Set(items.flatMap(x => (typeof x === "string" ? Object.keys(parseFormula(STOFF[x].formula)) : x.alloy.map(id => STOFF[id].formula)))).size;

function teilchen(): Task {
  let items: string[];
  do items = randomMix(); while (items.length < 2 && Math.random() < 0.8);
  const m = mix(items);
  const ans = { p: m.counts.phases, e: m.counts.elements, c: m.counts.compounds };
  const traps: Trap[] = [];
  const kinds = atomKinds(items);
  if (kinds !== ans.e) traps.push({ field: "e", value: kinds, miss: "atome-statt-stoffe", why: `${kinds} Atomsorten sind im Bild – gezählt werden aber Stoffe: Elemente sind Stoffe aus nur einer Atomsorte (${ans.e}).` });
  if (items.length !== ans.p) traps.push({ field: "p", value: items.length, miss: "phasen-stoffe", why: `${items.length} Stoffe, aber ${ans.p} ${ans.p === 1 ? "Phase" : "Phasen"}: Gelöstes und Gasgemische bilden keine eigene Phase.` });
  const di = items.filter(id => isElement(STOFF[id]) && Object.values(parseFormula(STOFF[id].formula))[0] > 1).length;
  if (di) traps.push({ values: { e: ans.e - di, c: ans.c + di }, miss: "element-molekuel", why: `${items.filter(id => isElement(STOFF[id]) && Object.values(parseFormula(STOFF[id].formula))[0] > 1).map(id => sub(STOFF[id].formula)).join(", ")}: zwei gleiche Atome – Element, keine Verbindung.` });
  return {
    kind: "count", answer: ans, traps,
    beaker: { items, view: "particle" },
    praise: "Phasen, Elemente und Verbindungen sauber getrennt gezählt – genau so geht's.",
    prompt: "Zähle **Phasen**, **Elemente** und **Verbindungen**.",
    hint: "Phase = einheitlicher Bereich (Schicht, Bodensatz, Gasraum). Element = Teilchensorte aus einer Atomsorte, Verbindung = aus mehreren.",
    explain: `${items.map(id => `${id === "oel" ? "Öl" : sub(STOFF[id].formula)} (${isElement(STOFF[id]) ? "Element" : "Verbindung"})`).join(", ")}${m.phases.some(p => p.dissolved.length) ? " · Gelöstes bildet keine eigene Phase" : ""}.`,
  };
}

// ── 3. Homogen, heterogen, Gemischtyp, Aggregatzustände ──────────────────────

const MIXES = EVERYDAY.filter(e => e.kind !== "element" && e.kind !== "verbindung");

function homogen(): Task {
  const e = pick(MIXES);
  const right = kindOf(e) as "homogen" | "heterogen";
  const other = right === "homogen" ? "heterogen" : "homogen";
  const g = diagnoseKind(e, other);
  const pureWrong = diagnoseKind(e, "verbindung");
  return {
    ...mc(right, [d(other, g.miss, g.why), d("Reinstoff", pureWrong.miss, pureWrong.why)], 3),
    item: e.name,
    praise: "Auf Tröpfchen, Körner und Schichten geachtet – genau so geht's.",
    prompt: `Ist **${e.name}** homogen oder heterogen?`,
    hint: "Homogen: überall gleich, auch unter dem Mikroskop (Lösungen, Legierungen, Gasgemische). Heterogen: Tröpfchen, Körner, Bläschen oder Schichten.",
    explain: `${e.why} → **${MIX_TYPES[e.kind as MixType].name}**, also **${right}**.`,
  };
}

/** Typische Verwechslungen der Gemischtypen */
const CONFUSE: Record<MixType, [MixType, string][]> = {
  loesung: [["suspension", "loesung-suspension"], ["emulsion", "loesung-suspension"], ["legierung", "legierung-gemenge"]],
  legierung: [["gemenge", "legierung-gemenge"], ["loesung", "zustand-vertauscht"], ["suspension", "loesung-suspension"]],
  gasgemisch: [["nebel", "zustand-vertauscht"], ["rauch", "zustand-vertauscht"], ["loesung", "zustand-vertauscht"]],
  emulsion: [["suspension", "suspension-emulsion"], ["loesung", "einheitlich-aussehend"], ["schaum", "zustand-vertauscht"]],
  suspension: [["emulsion", "suspension-emulsion"], ["loesung", "loesung-suspension"], ["gemenge", "zustand-vertauscht"]],
  gemenge: [["legierung", "legierung-gemenge"], ["suspension", "zustand-vertauscht"], ["loesung", "loesung-suspension"]],
  schaum: [["nebel", "zustand-vertauscht"], ["emulsion", "suspension-emulsion"], ["gasgemisch", "zustand-vertauscht"]],
  rauch: [["nebel", "zustand-vertauscht"], ["gasgemisch", "zustand-vertauscht"], ["suspension", "zustand-vertauscht"]],
  nebel: [["rauch", "zustand-vertauscht"], ["schaum", "zustand-vertauscht"], ["gasgemisch", "zustand-vertauscht"]],
};
const typeWhy = (e: Everyday, wrong: MixType) =>
  `${MIX_TYPES[wrong].name} wäre ${MIX_TYPES[wrong].states}${MIX_TYPES[wrong].homogen ? " und homogen" : ""} – ${e.name}: ${e.why} → ${MIX_TYPES[e.kind as MixType].name} (${MIX_TYPES[e.kind as MixType].states}).`;

function typ(): Task {
  const e = pick(MIXES);
  const t = e.kind as MixType;
  const base = {
    item: e.name,
    praise: "Aggregatzustände der Bestandteile bestimmt – genau so geht's.",
    prompt: `Welcher Gemischtyp ist **${e.name}**?`,
    hint: "Welche Bestandteile, in welchem Zustand? fest in flüssig ungelöst = Suspension, flüssig in flüssig (Tröpfchen) = Emulsion, gelöst = Lösung …",
    explain: `${e.why} → **${MIX_TYPES[t].name}** (${MIX_TYPES[t].states}${t === "loesung" ? "" : ""}).`,
  };
  if (Math.random() < 0.45) {
    return {
      kind: "map", answer: t, part: "gemische", ...base,
      traps: CONFUSE[t].map(([w, miss]) => ({ field: "n", value: idx(w), miss, why: typeWhy(e, w) })),
    };
  }
  return { ...mc(MIX_TYPES[t].name, CONFUSE[t].map(([w, miss]) => d(MIX_TYPES[w].name, miss, typeWhy(e, w))), 4), ...base };
}

/** Aggregatzustände: Beispiel aus dem Becher (mix) oder aus dem Alltag */
const STATE_CASES: { name: string; items?: Item[]; type: MixType; states: string }[] = [
  { name: "Salzwasser", items: ["h2o", "nacl"], type: "loesung", states: "s/l" },
  { name: "Zuckerwasser", items: ["h2o", "zucker"], type: "loesung", states: "s/l" },
  { name: "Sprudelwasser", items: ["h2o", "co2"], type: "loesung", states: "g/l" },
  { name: "Alkohol in Wasser", items: ["h2o", "ethanol"], type: "loesung", states: "l/l" },
  { name: "Luft", items: ["n2", "o2"], type: "gasgemisch", states: "g/g" },
  { name: "Messing", items: [{ alloy: ["cu", "zn"] }], type: "legierung", states: "s/s" },
  { name: "Öl in Wasser, geschüttelt", items: ["h2o", "oel"], type: "emulsion", states: "l/l" },
  { name: "Sand in Wasser, aufgewirbelt", items: ["h2o", "sand"], type: "suspension", states: "s/l" },
  { name: "Eisen-Schwefel-Gemenge", items: ["fe", "s"], type: "gemenge", states: "s/s" },
  { name: "Schlagobers", type: "schaum", states: "g/l" },
  { name: "Rauch", type: "rauch", states: "s/g" },
  { name: "Nebel", type: "nebel", states: "l/g" },
  { name: "Milch", type: "emulsion", states: "l/l" },
  { name: "Schlamm", type: "suspension", states: "s/l" },
];
const STATE_WORDS: Record<string, string> = { "s/l": "fest in flüssig", "l/l": "flüssig in flüssig", "g/l": "gasförmig in flüssig", "g/g": "gasförmig in gasförmig", "s/s": "fest in fest", "s/g": "fest in gasförmig", "l/g": "flüssig in gasförmig" };
const flip = (s: string) => s.split("/").reverse().join("/");
const STATE_NAME: Record<string, string> = { s: "fest", l: "flüssig", g: "gasförmig" };
/** „fest in flüssig“ – auch für vertauschte Angaben wie l/s, die nicht in STATE_WORDS stehen. */
const stateWords = (s: string) => STATE_WORDS[s] ?? s.split("/").map(x => STATE_NAME[x]).join(" in ");

function zustand(): Task {
  const c = pick(STATE_CASES);
  const [part, into] = stateWords(c.states).split(" in ");
  const type = MIX_TYPES[c.type].name;
  const what = c.name === type ? c.name : `${c.name} (${type})`;
  const wrong = [
    c.states !== flip(c.states) ? d(`${flip(c.states)} (${stateWords(flip(c.states))})`, "zustand-vertauscht", `Umgekehrt: zuerst der verteilte Stoff. ${what}: ${part} verteilt in ${into}, ${c.states}.`) : null,
    ...shuffle(Object.keys(STATE_WORDS).filter(s => s !== c.states && s !== flip(c.states))).slice(0, 3).map(s => d(`${s} (${STATE_WORDS[s]})`,
      c.type === "loesung" && s !== "g/g" ? "loesung-suspension" : "zustand-vertauscht",
      `${s} passt nicht – ${what}: ${part} verteilt in ${into}, ${c.states}.`)),
  ];
  return {
    ...mc(`${c.states} (${STATE_WORDS[c.states]})`, wrong, 4),
    item: c.name,
    beaker: c.items ? { items: c.items, shaken: /geschüttelt|aufgewirbelt/.test(c.name), view: "pair" } : undefined,
    praise: "Zustand der Bestandteile erkannt – genau so geht's.",
    prompt: `**${c.name}**: In welchen Aggregatzuständen sind die Bestandteile?`,
    hint: "Zuerst der verteilte Stoff, dann der, in dem er verteilt ist: s = fest, l = flüssig, g = gasförmig.",
    explain: `${what}: **${c.states}** – ${part} verteilt in ${into}.`,
  };
}

// ── 4. Trennen und Erhitzen ──────────────────────────────────────────────────

interface Sep { items: Item[]; goal: string; target: string; right: Method; exclude?: Method[] }
const SEPS: Sep[] = [
  { items: ["h2o", "sand"], goal: "den Sand aus dem Wasser", target: "sand", right: "filtrieren", exclude: ["dekantieren"] },
  { items: ["h2o", "kalk"], goal: "den Kalk aus dem Wasser", target: "kalk", right: "filtrieren", exclude: ["dekantieren"] },
  { items: ["h2o", "nacl"], goal: "das Salz aus Salzwasser", target: "nacl", right: "eindampfen", exclude: ["destillieren"] },
  { items: ["h2o", "cuso4"], goal: "das Kupfersulfat aus der Lösung", target: "cuso4", right: "eindampfen", exclude: ["destillieren"] },
  { items: ["h2o", "nacl"], goal: "reines Wasser aus Salzwasser", target: "h2o", right: "destillieren" },
  { items: ["h2o", "zucker"], goal: "reines Wasser aus Zuckerwasser", target: "h2o", right: "destillieren" },
  { items: ["h2o", "oel"], goal: "das Öl vom Wasser", target: "oel", right: "scheidetrichter", exclude: ["dekantieren"] },
  { items: ["fe", "s"], goal: "das Eisen aus dem Eisen-Schwefel-Gemenge", target: "fe", right: "magnet" },
  { items: ["fe", "sand"], goal: "die Eisenspäne aus dem Sand", target: "fe", right: "magnet" },
  { items: ["h2o", "ethanol"], goal: "den Alkohol aus dem Alkohol-Wasser-Gemisch", target: "ethanol", right: "destillieren" },
  { items: ["fe", "cu"], goal: "das Eisen aus dem Eisen-Kupfer-Pulver", target: "fe", right: "magnet" },
  { items: ["h2o", "c"], goal: "die Holzkohle aus dem Wasser", target: "c", right: "filtrieren", exclude: ["dekantieren"] },
];
const SEP_WHY: Record<Method, { miss: string; why: (s: Sep) => string }> = {
  magnet: { miss: "magnet-alles", why: s => `${s.items.includes("fe") ? "" : "Kein Eisen dabei – "}nur Eisen (Nickel, Cobalt) ist magnetisch.` },
  filtrieren: { miss: "filter-geloest", why: s => (s.items.some(x => typeof x === "string" && STOFF[x].water === "loest") ? "Gelöstes geht mit der Flüssigkeit durch den Filter." : "Ohne Wasser bzw. mit zwei Flüssigkeiten trennt der Filter nichts.") },
  dekantieren: { miss: "filter-geloest", why: () => "Abgießen trennt nur, was sich absetzt – Gelöstes geht mit." },
  scheidetrichter: { miss: "mischbar-scheidetrichter", why: () => "Der Scheidetrichter trennt nur nicht mischbare Flüssigkeiten (Schichten)." },
  eindampfen: { miss: "eindampfen-weg", why: s => (s.target === "h2o" || s.target === "ethanol" ? "Beim Eindampfen verdampft die Flüssigkeit – sie ist dann weg, nur Gelöstes bleibt." : "Eindampfen hilft nur bei gelösten Feststoffen.") },
  destillieren: { miss: "eindampfen-weg", why: () => "Destillieren trennt nach Siedetemperatur – bei diesem Gemisch geht es einfacher." },
};

function trennen(): Task {
  if (Math.random() < 0.18) {
    return {
      ...mc("in Wasser lösen, filtrieren, eindampfen", [
        d("mit dem Magnet", "magnet-alles", "Weder Sand noch Salz ist magnetisch."),
        d("filtrieren", "filter-geloest", "Ohne Wasser läuft nichts durch den Filter – erst das Salz lösen."),
        d("eindampfen", "eindampfen-weg", "Es gibt noch keine Lösung zum Eindampfen – erst Wasser dazu."),
      ], 4),
      item: "Sand + Salz",
      praise: "Mehrere Schritte kombiniert – genau so geht's.",
      prompt: "Wie trennst du **Sand und Salz**?",
      hint: "Ein Stoff löst sich in Wasser, der andere nicht.",
      explain: "Salz löst sich, Sand nicht: **lösen → filtrieren** (Sand bleibt im Filter) **→ eindampfen** (Salz bleibt zurück).",
    };
  }
  const s = pick(SEPS);
  const others = (Object.keys(METHODS) as Method[]).filter(m => m !== s.right && !s.exclude?.includes(m));
  return {
    ...mc(METHODS[s.right].name, others.map(m => d(METHODS[m].name, SEP_WHY[m].miss, SEP_WHY[m].why(s))), 4),
    beaker: { items: s.items, view: "pair" },
    praise: "Die Eigenschaft gefunden, in der sich die Stoffe unterscheiden – genau so geht's.",
    prompt: `Wie gewinnst du **${s.goal}**?`,
    hint: "Worin unterscheiden sich die Stoffe? Magnetisch – Korngröße/gelöst – Dichte (Schichten) – Siedetemperatur.",
    explain: `**${METHODS[s.right].name}**: ${METHODS[s.right].idea}.`,
  };
}

function erhitzen(): Task {
  const v = pick(["fes", "alloy", "zucker", "fesmag", "legmag"] as const);
  if (v === "fes") {
    const r = heat(["fe", "s"]);
    return {
      ...mc("Eisensulfid – eine Verbindung", [
        d("ein Gemenge aus Eisen und Schwefel", "verbindung-gemisch", "Das Aufglühen zeigt: ein neuer Stoff entsteht – fest verbunden, nicht nur vermischt."),
        d("eine Legierung", "legierung-verbindung", "Legierungen entstehen nur aus Metallen – Schwefel ist ein Nichtmetall."),
        d("Eisen und Schwefel wie vorher", "verbindung-trennbar", "Das Aufglühen zeigt eine Reaktion – danach ist ein neuer Stoff da."),
      ], 4),
      praise: "Reaktion von Mischen unterschieden – genau so geht's.",
      prompt: "Eisen- und Schwefelpulver werden erhitzt und **glühen auf**. Was entsteht?",
      hint: "Glühen, neue Farbe, neue Eigenschaften → ein neuer Stoff (Reaktion).",
      explain: r.ok ? "**Eisensulfid FeS**: eine Verbindung – der Magnet zieht es nicht mehr an." : "",
    };
  }
  if (v === "fesmag") {
    return {
      ...mc("Nein – im Eisensulfid ist das Eisen gebunden", [
        d("Ja – Eisen ist immer magnetisch", "magnet-alles", "In der Verbindung FeS ist Eisen fest gebunden und verliert seine Eigenschaften."),
        d("Ja, nach dem Filtrieren", "verbindung-trennbar", "Eine Verbindung lässt sich mit Trennverfahren nicht zerlegen – nur durch eine Reaktion."),
      ], 3),
      praise: "Verbindung und Gemisch unterschieden – genau so geht's.",
      prompt: "Kann man aus **Eisensulfid** mit einem Magnet das Eisen herausholen?",
      hint: "Ist Eisensulfid ein Gemisch oder eine Verbindung?",
      explain: "Eisensulfid ist eine **Verbindung**: Eisen und Schwefel sind fest verbunden – Trennverfahren wie der Magnet helfen nicht.",
    };
  }
  if (v === "zucker") {
    return {
      ...mc("Zucker ist eine Verbindung – es bleibt Kohlenstoff", [
        d("Zucker ist ein Element", "verbindung-element", "Zucker C₁₂H₂₂O₁₁ enthält C, H und O – beim Erhitzen zerfällt er, Kohlenstoff bleibt: Verbindung."),
        d("Zucker war mit Kohle vermischt", "verbindung-gemisch", "Reiner Zucker ist weiß – das Schwarze entsteht erst: Zucker zerfällt in Kohlenstoff und Wasser."),
      ], 3),
      praise: "Aus dem Zerfall auf die Verbindung geschlossen – genau so geht's.",
      prompt: "Zucker wird stark erhitzt und **wird schwarz**, Wasserdampf entweicht. Was zeigt das?",
      hint: "Wenn aus einem Stoff zwei andere Stoffe werden – was war er dann?",
      explain: "Zucker zerfällt in **Kohlenstoff** (schwarz) und **Wasser**: er ist eine Verbindung aus C, H und O.",
    };
  }
  const pair = pick([["cu", "zn"], ["cu", "sn"], ["c", "fe"]] as const);
  const name = alloyName([...pair]);
  if (v === "legmag") {
    return {
      ...mc(`${name} – eine Legierung (homogen)`, [
        d(`${name} – eine Verbindung`, "legierung-verbindung", "Beim Zusammenschmelzen entstehen keine festen Bindungen zwischen bestimmten Atomen – die Metalle mischen sich gleichmäßig."),
        d(`ein Gemenge aus ${STOFF[pair[0]].name} und ${STOFF[pair[1]].name}`, "legierung-gemenge", "Zusammengeschmolzen gibt es keine Körner mehr – überall gleich: homogen."),
      ], 3),
      praise: "Legierung richtig eingeordnet – genau so geht's.",
      prompt: `${STOFF[pair[0]].name} und ${STOFF[pair[1]].name} werden **zusammengeschmolzen**. Was ist das Ergebnis?`,
      hint: "Metalle mischen sich im geschmolzenen Zustand gleichmäßig – wie eine Lösung, nur fest.",
      explain: `${name} ist eine **Legierung**: ein homogenes Gemisch (s/s).`,
    };
  }
  return {
    ...mc("homogen – überall gleich", [
      d("heterogen – man sieht die Metalle", "legierung-gemenge", `In ${name} sind die Atome gleichmäßig verteilt – keine Körner: homogen.`),
      d(`Reinstoff – ${name} hat einen Namen`, "ein-name-ein-stoff", `${name} hat einen eigenen Namen, besteht aber aus ${STOFF[pair[0]].name} und ${STOFF[pair[1]].name}.`),
    ], 3),
    item: name,
    beaker: { items: [{ alloy: [...pair] }], view: "pair" },
    praise: "Legierung als homogenes Gemisch erkannt – genau so geht's.",
    prompt: `Ist **${name}** homogen oder heterogen?`,
    hint: "Schau ins Teilchenmodell: sind die Atome gleichmäßig verteilt?",
    explain: `${name} = ${STOFF[pair[0]].name} + ${STOFF[pair[1]].name}, zusammengeschmolzen: **homogen** (Legierung).`,
  };
}

// ── Level und Runden ────────────────────────────────────────────────────────

const GENS: Record<string, () => Task> = { rein, element, teilchenArt, homogen, typ, zustand, teilchen, trennen, erhitzen };

export const TYPE_NAMES: Record<string, string> = {
  rein: "Reinstoff oder Gemisch", element: "Element oder Verbindung", teilchenArt: "Teilchenbild einordnen", homogen: "Homogen oder heterogen",
  typ: "Gemischtyp", zustand: "Aggregatzustände", teilchen: "Phasen, Elemente, Verbindungen zählen", trennen: "Trennverfahren", erhitzen: "Erhitzen: Reaktion oder Legierung",
};

interface Level extends QuizLevel { types: string[] }
export const LEVELS: Level[] = [
  { id: "rg-1", name: "Reinstoff oder Gemisch", desc: "Element, Verbindung, Gemisch", types: ["rein", "element", "teilchenArt"] },
  { id: "rg-2", name: "Gemischarten", desc: "homogen, heterogen, Lösung, Suspension …", types: ["homogen", "typ", "zustand"] },
  { id: "rg-3", name: "Teilchenbilder", desc: "Phasen, Elemente, Verbindungen zählen", types: ["teilchen", "teilchenArt"] },
  { id: "rg-4", name: "Trennen und Erhitzen", desc: "Filtrieren, Magnet, Destillieren …", types: ["trennen", "erhitzen"] },
];

export const levelId = (_stufe: string, level: LevelKey) => (typeof level === "number" ? LEVELS[level].id : `rg-${level}`);
export const levelName = (_stufe: string, level: LevelKey) =>
  level === "mix" ? "Alles gemischt" : level === "weak" ? "Schwächen üben" : level === "due" ? "Heute fällig" : LEVELS[level].name;

export function makeRound(_stufe: string, level: LevelKey, stats?: TypeStats, due: string[] = []): Task[] {
  const known = (id: string) => LEVELS.some(l => l.types.includes(id));
  let ids = level === "mix" ? [...new Set(LEVELS.flatMap(l => l.types))]
    : level === "weak" ? weakTypes(stats, known)
    : level === "due" ? due.filter(known)
    : LEVELS[level].types;
  if (!ids.length) ids = LEVELS[0].types;
  return buildRound(ids, GENS, 10);
}

export const nodeName = (n: Node) => NODE_NAMES[n];
/** nur für Tests */
export const GENERATORS = GENS;
export { separate };
export const SEPS_FOR_TEST = SEPS;
