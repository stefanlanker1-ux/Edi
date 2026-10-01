// Aufgabengeneratoren. Aufgaben sind reine Daten (JSON-fähig), damit ein laufendes Quiz
// gespeichert und nach einem Neustart fortgesetzt werden kann.
// Texte: **fett** und `Code` werden von <RichText> formatiert.

import {
  BY_Z, STABLE_N, GROUP_NAMES, standardNeutrons, configuration, configString, shortConfigString, shells,
  unpairedElectrons, blockOf, valenceElectrons, typicalIonCharge, commonCharges, ionName, chargeSup, signed, minus, groupLabel,
  MADELUNG, SHELL_NAMES, ROMAN, mainGroupNumber, sup, type Occupied,
} from "@lern/chem";
import { mc, d, dis, validTraps, type Trap } from "@lern/quiz";

export type Stufe = "us" | "os";

export type Visual =
  | { kind: "nuclide"; Z: number; N: number; E: number; blank?: boolean }
  | { kind: "bohr"; Z: number; N: number; E: number; labels?: boolean };

export interface NumberField { id: string; label: string; answer: number; select?: number[] }

interface Base {
  prompt: string; hint: string; explain: string; visual?: Visual;
  /** Aufgabentyp (für „Schwächen üben“), wird von makeRound gesetzt */
  type?: string;
  /** Fallen bei Eingaben: typischer Fehlwert → Fehlvorstellung und Rückmeldung */
  traps?: Trap[];
}
export type Task = Base & (
  | { kind: "mc"; options: string[]; answer: number; why?: Record<number, string>; miss?: Record<number, string> }
  | { kind: "pse"; answer: number }
  | { kind: "numbers"; fields: NumberField[] }
  | { kind: "shells"; target: number[]; shellCount: number }
  | { kind: "boxes"; Z: number; lastIndex: number }
  | { kind: "build"; target: { Z: number; N: number; E: number } }
);
export type Gen = (pool: number[]) => Task;

// ── Zufall ───────────────────────────────────────────────────────────────────
export const rnd = (a: number, b: number) => a + Math.floor(Math.random() * (b - a + 1));
export const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(Math.random() * arr.length)];
export function shuffle<T>(arr: readonly T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

function nearNums(correct: number, min = 0, spread = 3): number[] {
  const out = new Set<number>();
  for (let d = 1; out.size < 8 && d < 20; d++) {
    if (correct + d >= min) out.add(correct + d);
    if (correct - d >= min) out.add(correct - d);
    if (d >= spread && out.size >= 3) break;
  }
  return [...out];
}
const nums = (a: number[]) => a.map(String);
const chargeLabel = (q: number) => (q === 0 ? "neutral" : `${Math.abs(q)}${q > 0 ? "+" : "−"}`);
/** Anzahl mit Einzahl/Mehrzahl: 1 Proton, 2 Protonen */
const cnt = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
const el = (Z: number) => BY_Z[Z];
const neighbors = (Z: number, maxZ: number) => [Z - 1, Z + 1, Z - 2, Z + 2, Z + 8, Z - 8].filter(z => z >= 1 && z <= maxZ);
/** Elemente, deren gemessene Konfiguration vom Aufbauprinzip abweicht (Cr, Cu, Pd, Au …): die App rechnet nach der Regel, das Quiz fragt sie nicht ab */
const DEVIATING = new Set([24, 29, 41, 42, 44, 45, 46, 47, 57, 58, 64, 78, 79]);
const noExc = (Z: number) => !DEVIATING.has(Z);
const mainGroup = (Z: number) => mainGroupNumber(Z) !== null;
const maxOf = (pool: number[]) => Math.max(...pool);
/** Aufgaben mit Massen- und Neutronenzahlen nur bis Calcium: geübt wird das Prinzip, nicht Rechnen mit großen Zahlen (kein ¹²⁷I) */
export const NUCLIDE_MAX_Z = 20;
const nuclidePool = (pool: number[]) => pool.filter(z => z <= NUCLIDE_MAX_Z);

function isotopeN(Z: number): number {
  if (STABLE_N[Z] && Math.random() < 0.7) return pick(STABLE_N[Z]);
  // nie weniger als 0 Neutronen (Wasserstoff-1 hat 0)
  return Math.max(0, standardNeutrons(Z) + (Math.random() < 0.6 ? 0 : pick([-1, 1, 2])));
}
/** Eine Ladung, die es für dieses Element wirklich gibt (Na⁺, Fe³⁺ …), sonst 0 (neutrales Atom) */
const realCharge = (Z: number) => { const c = commonCharges(Z); return c.length ? pick(c) : 0; };
/** Typischer Fehler: nach Hauptquantenzahl statt nach Energie gefüllt (3d vor 4s) */
function naiveConfig(E: number): Occupied[] {
  const order = MADELUNG.slice().sort((a, b) => a.n - b.n || a.l - b.l);
  const out: Occupied[] = [];
  let left = E;
  for (const o of order) { if (left <= 0) break; const c = Math.min(o.max, left); out.push({ ...o, count: c }); left -= c; }
  return out;
}
/** Plausibler Fehler: ein Elektron vom vorletzten ins letzte Orbital verschoben */
function shiftedConfig(cfg: Occupied[]): Occupied[] | null {
  if (cfg.length < 2) return null;
  const c = cfg.map(o => ({ ...o }));
  const a = c[c.length - 2], b = c[c.length - 1];
  if (b.count >= b.max || a.count <= 1) return null;
  a.count--; b.count++;
  return c;
}

// ── Unterstufe ───────────────────────────────────────────────────────────────

export function readParticles(pool: number[], ions = false): Task {
  const Z = pick(nuclidePool(pool)), N = isotopeN(Z);
  const q = ions ? realCharge(Z) : 0;
  const E = Z - q;
  return {
    kind: "numbers",
    prompt: "Wie viele Protonen, Neutronen und Elektronen hat dieses Teilchen?",
    visual: { kind: "nuclide", Z, N, E },
    fields: [
      { id: "p", label: "Protonen", answer: Z },
      { id: "n", label: "Neutronen", answer: N },
      { id: "e", label: "Elektronen", answer: E },
    ],
    traps: validTraps([
      { field: "e", value: Z + N, miss: "massenzahl-elektronen", why: `**${Z + N}** ist die Massenzahl (Protonen + Neutronen). Elektronen sind so leicht, dass sie dort nicht mitzählen – ihre Zahl ergibt sich aus den Protonen${q ? " und der Ladung" : ""}.` },
      ...(q ? [
        { field: "e", value: Z, miss: "ion-ladung-ignoriert", why: `Das Teilchen ist geladen (${chargeLabel(q)}), also hat es **nicht** gleich viele Elektronen wie Protonen.` },
        { field: "e", value: Z + q, miss: "ladung-vorzeichen", why: `Ladung ${chargeLabel(q)} heißt ${q > 0 ? `${q} Elektron${q > 1 ? "en" : ""} **weniger**` : `${-q} Elektron${q < -1 ? "en" : ""} **mehr**`} als Protonen – Elektronen sind negativ.` },
      ] : []),
      { field: "n", value: Z + N, miss: "neutronen-massenzahl", why: `**${Z + N}** ist die Massenzahl. Die Neutronen bekommst du, wenn du die Protonen abziehst: ${Z + N} − ${Z}.` },
      { field: "n", value: Z, miss: "neutronen-protonen", why: `Neutronen und Protonen sind nicht automatisch gleich viele. Rechne Massenzahl − Ordnungszahl.` },
      { field: "p", value: Z + N, miss: "massenzahl-ordnungszahl", why: `**${Z + N}** ist die Massenzahl. Die Protonen stehen unten als Ordnungszahl.` },
    ], { p: Z, n: N, e: E }),
    hint: `Unten steht die Ordnungszahl, oben die Massenzahl (Protonen + Neutronen)${q ? ", rechts oben die Ladung" : ""}.`,
    explain: `Protonen = Ordnungszahl = **${Z}**. Neutronen = Massenzahl − Ordnungszahl = ${Z + N} − ${Z} = **${N}**. `
      + (q ? `Ladung ${chargeLabel(q)}: ${q > 0 ? `${q} Elektron${q > 1 ? "en" : ""} weniger` : `${-q} Elektron${q < -1 ? "en" : ""} mehr`} als Protonen → **${E}** Elektronen.`
        : `Im neutralen Atom gibt es gleich viele Elektronen wie Protonen: **${E}**.`),
  };
}

export const massNumber: Gen = pool => {
  const Z = pick(nuclidePool(pool)), N = isotopeN(Z), A = Z + N;
  return {
    ...mc(String(A), [
      d(String(Z), "massenzahl-ordnungszahl", `**${Z}** ist die Ordnungszahl (nur die Protonen). Die Massenzahl zählt Protonen **und** Neutronen.`),
      d(String(N), "massenzahl-neutronen", `**${N}** sind nur die Neutronen. Dazu kommen die ${cnt(Z, "Proton", "Protonen")}.`),
      d(String(2 * Z + N), "elektronen-mitgezaehlt", `Du hast die Elektronen mitgezählt. Sie sind rund 2000-mal leichter als ein Proton und zählen nicht zur Massenzahl.`),
      ...nums(nearNums(A, 1)),
    ], 4, `Genau: ${Z} + ${N} = ${A}.`),
    prompt: `Ein Atom hat **${cnt(Z, "Proton", "Protonen")}** und **${cnt(N, "Neutron", "Neutronen")}**. Wie groß ist seine Massenzahl?`,
    visual: { kind: "bohr", Z, N, E: Z, labels: false },
    hint: "Die Massenzahl zählt alle Teilchen im Atomkern.",
    explain: `Massenzahl A = Protonen + Neutronen = ${Z} + ${N} = **${A}**. Elektronen sind so leicht, dass sie nicht mitgezählt werden.`,
  };
};

export const elementFromProtons: Gen = pool => {
  const Z = pick(pool);
  return {
    ...mc(el(Z).name, neighbors(Z, maxOf(pool)).map(z => el(z).name)),
    prompt: `Ein Atom hat **${cnt(Z, "Proton", "Protonen")}**. Um welches Element handelt es sich?`,
    hint: "Die Protonenzahl ist gleich der Ordnungszahl im Periodensystem.",
    explain: `Ordnungszahl ${Z} = **${el(Z).name} (${el(Z).symbol})**. Die Protonenzahl legt das Element eindeutig fest.`,
  };
};

/** Element im PSE finden. `groups`: auch nach Periode und Gruppe fragen (Unterstufe erst ab Level 2, römische Hauptgruppe; Oberstufe Gruppe 1–18) */
export const pseFind = (os: boolean, groups: boolean): Gen => pool => {
  const Z = pick(pool), e = el(Z), mg = mainGroupNumber(Z);
  const v = groups && (os ? e.group !== null : mg !== null) ? rnd(0, 2) : rnd(0, 1);
  let prompt: string;
  if (v === 0) prompt = `Tippe im Periodensystem auf **${e.name}**.`;
  else if (v === 1) prompt = `Tippe auf das Element mit der Ordnungszahl **${Z}**.`;
  else prompt = `Tippe auf das Element in der **${e.period}. Periode** und **${groupLabel(Z, os)}**.`;
  return {
    kind: "pse", answer: Z, prompt,
    hint: v === 2 ? "Perioden sind die Zeilen, Gruppen die Spalten." : `Das Symbol beginnt mit „${e.symbol[0]}“.`,
    explain: `Gesucht war **${e.name} (${e.symbol})**: Ordnungszahl ${Z}${groups ? `, ${e.period}. Periode, ${groupLabel(Z, os)}` : ""}.`,
  };
};

export function buildAtom(pool: number[], ion = false): Task {
  const small = pool.filter(z => z <= 12 && (!ion || typicalIonCharge(z)));
  const Z = pick(small.length ? small : [3, 8, 11]);
  const N = STABLE_N[Z] ? pick(STABLE_N[Z]) : standardNeutrons(Z);
  const q = ion ? typicalIonCharge(Z) ?? 0 : 0;
  const E = Z - q;
  return {
    kind: "build", target: { Z, N, E },
    prompt: `Baue ${q ? "das Ion" : "ein Atom"}:`,
    visual: { kind: "nuclide", Z, N, E },
    traps: validTraps([
      { field: "E", value: Z + N, miss: "massenzahl-elektronen", why: `${Z + N} ist die Massenzahl, nicht die Elektronenzahl. Elektronen richten sich nach den Protonen${q ? " und der Ladung" : ""}.` },
      { field: "N", value: Z + N, miss: "neutronen-massenzahl", why: `${Z + N} ist die Massenzahl. Neutronen = ${Z + N} − ${cnt(Z, "Proton", "Protonen")}.` },
      ...(q ? [
        { field: "E", value: Z, miss: "ion-ladung-ignoriert", why: `Das Ion ist geladen (${chargeLabel(q)}) – es hat nicht gleich viele Elektronen wie Protonen.` },
        { field: "E", value: Z + q, miss: "ladung-vorzeichen", why: `${chargeLabel(q)} heißt ${q > 0 ? "Elektronen **fehlen**" : "Elektronen sind **zu viel**"}, denn Elektronen sind negativ.` },
      ] : []),
    ], { Z, N, E }),
    hint: `Protonen = ${Z}. Neutronen = Massenzahl − Protonen.${q ? " Die Ladung sagt, wie viele Elektronen fehlen (+) oder zu viel sind (−)." : ""}`,
    explain: `${q ? `${ionName(Z, q)} ${el(Z).symbol}${chargeSup(q)}` : el(Z).name}: **${Z}** ${Z === 1 ? "Proton" : "Protonen"}, **${N}** ${N === 1 ? "Neutron" : "Neutronen"} (${Z + N} − ${Z}), **${E}** ${E === 1 ? "Elektron" : "Elektronen"}.`,
  };
}

export const elementFromBohr: Gen = pool => {
  const Z = pick(pool);
  const outer = shells(Z)[shells(Z).length - 1];
  return {
    ...mc(el(Z).name, [
      ...(shells(Z).length > 1 && outer !== Z ? [d(el(outer).name, "nur-aussenschale", `Du hast nur die äußerste Schale gezählt (${outer}). Für die Ordnungszahl zählen **alle** Elektronen: ${shells(Z).join(" + ")} = ${Z}.`)] : []),
      ...neighbors(Z, maxOf(pool)).map(z => el(z).name),
    ]),
    prompt: "Welches Element zeigt dieses Bohrmodell? (neutrales Atom)",
    visual: { kind: "bohr", Z, N: standardNeutrons(Z), E: Z, labels: true },
    hint: "Zähle die Elektronen auf allen Schalen – im neutralen Atom ist das die Ordnungszahl.",
    explain: `${shells(Z).length > 1 ? `Die Schalen enthalten ${shells(Z).join(" + ")} = **${Z}** Elektronen` : `Die Schale enthält **${cnt(Z, "Elektron", "Elektronen")}**`} → Ordnungszahl ${Z} = **${el(Z).name}**.`,
  };
};

export const fillShells: Gen = pool => {
  const Z = pick(pool.filter(z => z >= 3));
  const target = shells(Z);
  return {
    kind: "shells", target, shellCount: Math.max(3, target.length),
    prompt: `Verteile die **${Z} Elektronen** von **${el(Z).name}** auf die Schalen.`,
    traps: [
      { field: "s0", min: 3, miss: "k-schale-ueberfuellt", why: "Die K-Schale fasst höchstens **2** Elektronen. Erst wenn sie voll ist, geht es auf der L-Schale weiter." },
      { field: "s1", min: 9, miss: "l-schale-ueberfuellt", why: "Die L-Schale fasst höchstens **8** Elektronen. Der Rest kommt auf die M-Schale." },
    ],
    hint: "Von innen nach außen füllen: K fasst 2, L fasst 8, M zunächst 8 Elektronen.",
    explain: `Von innen nach außen: ${target.map((c, i) => `${SHELL_NAMES[i]} = ${c}`).join(", ")}.`
      + (Z > 18 ? " Ab Kalium kommt die N-Schale dran, bevor die M-Schale mehr als 8 Elektronen bekommt." : ""),
  };
};

export const outerElectrons: Gen = pool => {
  const Z = pick(pool.filter(mainGroup));
  const v = valenceElectrons(Z)!, per = shells(Z).length;
  return {
    ...mc(String(v), [
      ...(per !== v ? [d(String(per), "aussen-periode", `**${per}** ist die Zahl der Schalen (Periode). Die Außenelektronen sitzen nur auf der äußersten Schale – ihre Zahl ist die Hauptgruppe.`)] : []),
      ...(Z !== v && Z <= 12 ? [d(String(Z), "aussen-ordnungszahl", `**${Z}** sind alle Elektronen. Gefragt sind nur die auf der äußersten Schale.`)] : []),
      ...(8 - v !== v && v < 8 ? [d(String(8 - v), "aussen-fehlend", Z > 2
        ? `**${8 - v}** fehlen bis zur vollen Schale. Gefragt ist, wie viele **da** sind.`
        : `${el(Z).name} hat nur die K-Schale, und die ist schon mit 2 voll. Gefragt ist, wie viele Außenelektronen **da** sind: ${v}.`)] : []),
      ...nums(nearNums(v, 1)),
    ]),
    prompt: `Wie viele **Außenelektronen** hat ein **${el(Z).name}**-Atom?`,
    hint: "Schau, in welcher Hauptgruppe das Element steht.",
    explain: Z === 2
      ? "Helium hat nur die K-Schale mit **2** Elektronen – sie ist damit voll (Edelgas)."
      : `${el(Z).name} steht in der ${ROMAN[v]}. Hauptgruppe → **${v}** ${v === 1 ? "Außenelektron" : "Außenelektronen"} (Schalen: ${shells(Z).join(", ")}).`,
  };
};

export const periodFromShells: Gen = pool => {
  const Z = pick(pool), n = shells(Z).length, mg = mainGroupNumber(Z);
  return {
    ...mc(String(n), [
      ...(mg && mg !== n ? [d(String(mg), "schalen-gruppe", `**${mg}** ist die Hauptgruppe (Außenelektronen). Die Zahl der Schalen ist die **Periode**.`)] : []),
      ...(Math.ceil(Z / 8) !== n ? [d(String(Math.ceil(Z / 8)), "schalen-je-8", "Nicht jede Schale fasst 8: Die K-Schale nur 2, ab der 4. Periode mehr. Die Zahl der Schalen ist die **Periode**.")] : []),
      ...(n !== 1 ? [d("1", "k-schale-ueberfuellt", `Alle ${Z} Elektronen passen nicht auf eine Schale: Die K-Schale fasst nur 2, die L-Schale 8.`)]
        : [d("2", "leere-schale-gezaehlt", `${el(Z).name} steht in der 1. Periode: ${Z === 1 ? "sein 1 Elektron passt" : "beide Elektronen passen"} auf die K-Schale, eine zweite Schale wird nicht gebraucht.`)]),
      "1", "2", "3", "4", "5", "6",
    ]),
    prompt: `Auf wie vielen **Schalen** verteilen sich die Elektronen von **${el(Z).name}**?`,
    hint: "Die Nummer der Periode verrät die Anzahl der Schalen.",
    explain: `${el(Z).name} steht in der **${el(Z).period}. Periode** → **${n}** besetzte Schalen (${shells(Z).map((c, i) => SHELL_NAMES[i] + " " + c).join(", ")}).`,
  };
};

export const ionCharge: Gen = pool => {
  // nur Ionen, die es wirklich gibt (kein Ne³⁺ oder C⁻)
  const Z = pick(pool.filter(z => z >= 3 && commonCharges(z).length));
  const q = realCharge(Z);
  const E = Z - q;
  return {
    ...mc(chargeLabel(q), [
      d(chargeLabel(-q), "ladung-vorzeichen", Z > E
        ? `${cnt(Z, "Proton", "Protonen")} (+) und nur ${cnt(E, "Elektron", "Elektronen")} (−): Es gibt mehr positive Ladungen → **positiv**.`
        : `${cnt(E, "Elektron", "Elektronen")} (−) und nur ${cnt(Z, "Proton", "Protonen")} (+): Es gibt mehr negative Ladungen → **negativ**.`),
      d("neutral", "ladung-neutral", `Neutral wäre es nur mit gleich vielen Protonen und Elektronen. Hier: ${cnt(Z, "Proton", "Protonen")}, ${cnt(E, "Elektron", "Elektronen")}.`),
      dis(chargeLabel(q + (q > 0 ? 1 : -1)), `${Z} − ${E} = ${minus(q)} – noch einmal genau rechnen: **${chargeLabel(q)}**.`),
      dis(chargeLabel(q > 0 ? (q - 1 || 2) : (q + 1 || -2)), `${Z} − ${E} = ${minus(q)} – noch einmal genau rechnen: **${chargeLabel(q)}**.`),
    ]),
    prompt: `Ein Teilchen hat **${cnt(Z, "Proton", "Protonen")}** und **${cnt(E, "Elektron", "Elektronen")}**. Welche Ladung hat es?`,
    hint: "Protonen sind positiv, Elektronen negativ. Rechne Protonen − Elektronen.",
    explain: `Ladung = Protonen − Elektronen = ${Z} − ${E} = ${minus(q)} → **${signed(q)}** → ${q > 0 ? "Kation" : "Anion"} ${el(Z).symbol}${chargeSup(q)}.`,
  };
};

export const isotopeNeutrons: Gen = pool => {
  const Z = pick(nuclidePool(pool).filter(z => z > 1));
  const N = isotopeN(Z), A = Z + N;
  return {
    ...mc(String(N), [
      d(String(A), "neutronen-massenzahl", `**${A}** ist die Massenzahl (Protonen + Neutronen). Zieh die ${cnt(Z, "Proton", "Protonen")} ab.`),
      d(String(Z), "neutronen-protonen", `**${Z}** ist die Protonenzahl (Ordnungszahl). Neutronen = ${A} − ${Z}.`),
      ...nums(nearNums(N, 0)),
    ]),
    prompt: `Wie viele Neutronen hat das Isotop **${el(Z).name}-${A}**?`,
    visual: { kind: "nuclide", Z, N, E: Z },
    hint: `Die Zahl hinter dem Namen ist die Massenzahl. ${el(Z).name} hat die Ordnungszahl ${Z}.`,
    explain: `Neutronen = Massenzahl − Protonen = ${A} − ${Z} = **${N}**.`,
  };
};

export const typicalIon: Gen = pool => {
  const Z = pick(pool.filter(z => typicalIonCharge(z)));
  const q = typicalIonCharge(Z)!, s = el(Z).symbol;
  const opt = (c: number) => s + chargeSup(c);
  const v = valenceElectrons(Z)!;
  return {
    ...mc(opt(q), [
      d(opt(-q), "ion-gegenteil", q > 0
        ? `${el(Z).name} ist ein Metall und **gibt** seine ${cnt(v, "Außenelektron", "Außenelektronen")} ab – dann fehlen negative Ladungen, das Ion ist **positiv**.`
        : `${el(Z).name} ist ein Nichtmetall und **nimmt** Elektronen auf – zusätzliche negative Ladungen machen das Ion **negativ**.`),
      q > 0
        ? d(opt(-(8 - v)), "auffuellen-statt-abgeben", `Metalle nehmen keine Elektronen auf. ${el(Z).name} gibt ${v === 1 ? "sein" : "seine"} ${cnt(v, "Außenelektron", "Außenelektronen")} ab → ${opt(q)}.`)
        : d(opt(v), "abgeben-statt-aufnehmen", `Nichtmetalle geben ihre Außenelektronen nicht ab. ${el(Z).name} nimmt ${cnt(8 - v, "Elektron", "Elektronen")} auf → ${opt(q)}.`),
      opt(q > 0 ? q + 1 : q - 1), opt(q > 0 ? (q === 1 ? 2 : q - 1) : (q === -1 ? -2 : q + 1)),
    ]),
    prompt: `Welches Ion bildet **${el(Z).name}** meist?`,
    hint: "Metalle geben ihre Außenelektronen ab, Nichtmetalle nehmen bis 8 auf. Das Ion hat dann Edelgaskonfiguration.",
    explain: `${el(Z).name} hat ${cnt(valenceElectrons(Z)!, "Außenelektron", "Außenelektronen")}. ${q > 0 ? `Es gibt ${q} ab` : `Es nimmt ${-q} auf`}. Dann hat das Ion dieselbe Elektronenanordnung wie ein Edelgas → **${opt(q)}**.`,
  };
};

export const isotopeCompare: Gen = pool => {
  const Z = pick(nuclidePool(pool).filter(z => (STABLE_N[z]?.length ?? 0) >= 2 || z === 6));
  const Ns = Z === 6 ? [6, 8] : shuffle(STABLE_N[Z]).slice(0, 2).sort((a, b) => a - b);
  const [a, b] = Ns.map(n => `${el(Z).name}-${Z + n}`);
  const same = Math.random() < 0.5;
  return {
    ...(same
      ? mc("die Protonenzahl", [
          d("die Neutronenzahl", "isotop-neutronen-gleich", `Gerade die Neutronen sind verschieden (${Ns[0]} und ${Ns[1]}). Gleich ist die Protonenzahl ${Z}.`),
          d("die Massenzahl", "isotop-massenzahl-gleich", `Die Massenzahlen ${Z + Ns[0]} und ${Z + Ns[1]} sind verschieden – deshalb heißen die Isotope ja anders.`),
          d("gar nichts", "isotop-element", `Isotope sind **dasselbe Element** – sie haben dieselbe Protonenzahl (${Z}).`),
        ])
      : mc("die Neutronenzahl", [
          d("die Protonenzahl", "isotop-element", `Wäre die Protonenzahl anders, wäre es ein anderes Element. Isotope haben beide ${cnt(Z, "Proton", "Protonen")}.`),
          d("die Elektronenzahl", "isotop-elektronen", `Als neutrale Atome haben beide ${cnt(Z, "Elektron", "Elektronen")}. Der Unterschied liegt im Kern: ${Ns[0]} bzw. ${cnt(Ns[1], "Neutron", "Neutronen")}.`),
          d("die Ordnungszahl", "isotop-element", `Die Ordnungszahl ist die Protonenzahl – und die ist bei Isotopen gleich (${Z}).`),
        ])),
    prompt: `**${a}** und **${b}** sind Isotope. ${same ? "Was haben sie gemeinsam?" : "Worin unterscheiden sie sich?"}`,
    hint: "Isotope gehören zum selben Element.",
    explain: `Isotope haben die **gleiche Protonenzahl** (${Z}, deshalb dasselbe Element), aber eine **andere Neutronenzahl** (${Ns[0]} bzw. ${Ns[1]}) und damit eine andere Massenzahl.`,
  };
};

// ── Oberstufe ────────────────────────────────────────────────────────────────

export const nuclideInput: Gen = pool => {
  const Z = pick(nuclidePool(pool)), N = Math.max(0, standardNeutrons(Z) + pick([0, 0, 1, 2, -1]));
  const q = Math.random() < 0.3 ? 0 : realCharge(Z);
  const E = Z - q;
  return {
    kind: "numbers",
    prompt: `Ergänze das Atomsymbol für ein Teilchen mit **${cnt(Z, "Proton", "Protonen")}**, **${cnt(N, "Neutron", "Neutronen")}** und **${cnt(E, "Elektron", "Elektronen")}**.`,
    visual: { kind: "nuclide", Z, N, E, blank: true },
    fields: [
      { id: "z", label: "Ordnungszahl Z", answer: Z },
      { id: "a", label: "Massenzahl A", answer: Z + N },
      { id: "q", label: "Ladung", answer: q, select: [-3, -2, -1, 0, 1, 2, 3, 4] },
    ],
    traps: validTraps([
      { field: "a", value: Z, miss: "massenzahl-ordnungszahl", why: `Die Massenzahl zählt Protonen **und** Neutronen: ${Z} + ${N} = ${Z + N}.` },
      { field: "a", value: N, miss: "massenzahl-neutronen", why: `${N} sind nur die Neutronen. Massenzahl = ${Z} + ${N}.` },
      { field: "a", value: Z + N + E, miss: "elektronen-mitgezaehlt", why: "Elektronen zählen nicht zur Massenzahl – nur Protonen und Neutronen." },
      ...(q ? [{ field: "q", value: -q, miss: "ladung-vorzeichen", why: `${cnt(Z, "Proton", "Protonen")} und ${cnt(E, "Elektron", "Elektronen")} → ${Z > E ? "mehr positive" : "mehr negative"} Ladungen → **${signed(q)}**.` }] : []),
      ...(q ? [{ field: "q", value: 0, miss: "ladung-neutral", why: `${cnt(Z, "Proton", "Protonen")} und ${cnt(E, "Elektron", "Elektronen")} sind nicht gleich viele – das Teilchen ist geladen.` }] : []),
    ], { z: Z, a: Z + N, q }),
    hint: "A = Protonen + Neutronen. Ladung = Protonen − Elektronen.",
    explain: `Z = **${Z}**, A = ${Z} + ${N} = **${Z + N}**, Ladung = ${Z} − ${E} = ${minus(q)} → **${signed(q)}**.`,
  };
};

const cfgOK = (Z: number) => noExc(Z) && el(Z).group !== null;

export const configMC: Gen = pool => {
  const Z = pick(pool.filter(z => z >= 3 && z <= 36 && noExc(z)));
  const right = configString(configuration(Z));
  // nur wirklich andere Besetzungen – [Ar] 3d¹⁰ 4s² 4p³ ist dieselbe Konfiguration wie 4s² 3d¹⁰ 4p³, nur anders geordnet
  const occ = (c: Occupied[]) => c.filter(o => o.count).map(o => o.key + o.count).sort().join();
  const same = occ(configuration(Z));
  const naive = naiveConfig(Z);
  const wrongs = [
    ...(occ(naive) !== same ? [d(configString(naive), "3d-vor-4s", "Hier wurde nach der Schalennummer gefüllt (3d vor 4s). Befüllt wird nach **Energie**: 4s liegt unter 3d.")] : []),
    ...[configuration(Z + 1), configuration(Z - 1)].filter(c => occ(c) !== same).map(c => d(configString(c), "elektronen-verzaehlt", `Die Hochzahlen müssen zusammen **${Z}** ergeben – zähl nach.`)),
    ...[shiftedConfig(configuration(Z))].filter((c): c is Occupied[] => !!c && occ(c) !== same).map(configString),
  ];
  return {
    ...mc(right, wrongs),
    prompt: `Welche Elektronenkonfiguration hat **${el(Z).name}** (Z = ${Z})?`,
    hint: "Reihenfolge nach Energie: 1s 2s 2p 3s 3p 4s 3d 4p … – und die Summe der Hochzahlen muss Z ergeben.",
    explain: `${el(Z).name} hat ${Z} Elektronen: \`${right}\`. Unterschalen werden nach steigender Energie gefüllt (4s vor 3d).`,
  };
};

export const shortConfigMC: Gen = pool => {
  const Z = pick(pool.filter(z => z >= 11 && cfgOK(z)));
  const right = shortConfigString(Z);
  const nob = ["He", "Ne", "Ar", "Kr", "Xe"];
  const wrongCore = right.replace(/^\[(\w+)\]/, (_m, s: string) => { const i = nob.indexOf(s); return `[${nob[i > 0 ? i - 1 : i + 1]}]`; });
  return {
    ...mc(right, [
      d(wrongCore, "edelgaskern-falsch", `Als Kern nimmt man das Edelgas der **vorherigen** Periode – ${el(Z).name} steht in der ${el(Z).period}. Periode.`),
      ...[Z + 1, Z - 1, Z + 2].map(z => d(shortConfigString(z), "elektronen-verzaehlt", `Kern plus Hochzahlen müssen **${Z}** Elektronen ergeben.`)),
    ]),
    prompt: `Welche Kurzschreibweise (Edelgaskern) gehört zu **${el(Z).name}**?`,
    hint: "Nimm das Edelgas der vorherigen Periode als Kern und schreibe nur die restlichen Elektronen dazu.",
    explain: `${el(Z).name} (Z = ${Z}) steht in der ${el(Z).period}. Periode: \`${right}\`.`,
  };
};

export const fillBoxes: Gen = pool => {
  const Z = pick(pool.filter(z => z >= 3 && z <= 30 && noExc(z)));
  const cfg = configuration(Z);
  const lastIndex = MADELUNG.findIndex(o => o.key === cfg[cfg.length - 1].key);
  return {
    kind: "boxes", Z, lastIndex,
    prompt: `Fülle das Energieniveau-Schema für **${el(Z).name}** (${Z} Elektronen). Tippe auf ein Kästchen: leer → ↑ → ↑↓.`,
    hint: "Pauli: höchstens 2 Elektronen pro Kästchen mit entgegengesetztem Spin. Hund: Kästchen gleicher Energie erst einzeln besetzen.",
    explain: `Konfiguration \`${configString(cfg)}\`. Nach der Hund'schen Regel werden p- und d-Kästchen zuerst einfach besetzt → ${cnt(unpairedElectrons(cfg), "ungepaartes Elektron", "ungepaarte Elektronen")}.`,
  };
};

export const blockMC: Gen = pool => {
  // Lutetium ausgenommen: steht hier bei den Lanthanoiden, wird aber zuletzt in 5d befüllt (Zuordnung umstritten)
  const Z = pick(pool.filter(z => z > 2 && z !== 71));
  const b = blockOf(Z);
  const cfg = configuration(Z, Z);
  return {
    ...mc(`${b}-Block`, ["s-Block", "p-Block", "d-Block", "f-Block"]),
    prompt: `In welchem **Block** des Periodensystems steht **${el(Z).name}**?`,
    hint: "Der Block ist die Unterschale, die nach dem Aufbauprinzip zuletzt befüllt wird.",
    explain: `Nach dem Aufbauprinzip wird bei ${el(Z).name} zuletzt die **${cfg[cfg.length - 1].key}**-Unterschale befüllt → **${b}-Block**.`,
  };
};

export const unpairedMC: Gen = pool => {
  const Z = pick(pool.filter(z => z <= 36 && noExc(z)));
  const cfg = configuration(Z);
  const u = unpairedElectrons(cfg);
  const last = cfg[cfg.length - 1];
  return {
    ...mc(String(u), [
      ...(last.count !== u && last.count <= 7 ? [d(String(last.count), "hund-alle-einzeln", `In ${last.key} sitzen ${last.count} Elektronen, aber nur ${last.max / 2} Kästchen. Nach Hund werden erst alle Kästchen einzeln besetzt, dann wird gepaart.`)] : []),
      ...(u !== 0 ? [d("0", "hund-alle-gepaart", `Nach der Hund'schen Regel werden Kästchen gleicher Energie zuerst **einzeln** besetzt – in ${last.key}${sup(last.count)} bleiben Elektronen ungepaart.`)] : []),
      ...nums(nearNums(u, 0)),
    ]),
    prompt: `Wie viele **ungepaarte Elektronen** hat ein **${el(Z).name}**-Atom im Grundzustand?`,
    hint: "Zeichne die äußerste, nicht volle Unterschale als Kästchen und besetze nach der Hund'schen Regel.",
    explain: `${el(Z).name}: \`${shortConfigString(Z)}\`. In ${last.key}${sup(last.count)} ${u ? `${u === 1 ? "bleibt" : "bleiben"} **${u}** ${u === 1 ? "Elektron" : "Elektronen"} ungepaart (Hund'sche Regel).` : "sind alle Elektronen gepaart → **0**."}`,
  };
};

const ION_SET: [number, number][] = [[26, 2], [26, 3], [29, 2], [30, 2], [25, 2], [27, 2], [28, 2], [24, 3], [11, 1], [12, 2], [13, 3], [8, -2], [17, -1], [16, -2], [7, -3], [20, 2], [35, -1]];
export const ionConfigMC: Gen = () => {
  const [Z, q] = pick(ION_SET);
  const E = Z - q;
  const right = shortConfigString(Z, E);
  const tm = q > 0 && Z > 20;
  const wrong1 = tm ? shortConfigString(E, E) : null;
  return {
    ...mc(right, [
      ...(wrong1 && wrong1 !== right ? [d(wrong1, "ion-3d-zuerst", "Kationen der Übergangsmetalle geben zuerst die **4s**-Elektronen ab (äußerste Schale), nicht die 3d-Elektronen.")] : []),
      d(shortConfigString(Z), "ion-ladung-ignoriert", `Das ist das neutrale Atom. Das Ion ${el(Z).symbol}${chargeSup(q)} hat ${q > 0 ? `${q} Elektron${q > 1 ? "en" : ""} weniger` : `${-q} Elektron${q < -1 ? "en" : ""} mehr`}.`),
      d(shortConfigString(Z, Z + q), "ladung-vorzeichen", `${q > 0 ? "Positiv heißt Elektronen **abgegeben**" : "Negativ heißt Elektronen **aufgenommen**"} – das Ion hat ${E} Elektronen.`),
      shortConfigString(Z, E - 1), shortConfigString(Z, E + 1),
    ]),
    prompt: `Welche Elektronenkonfiguration hat das Ion **${el(Z).symbol}${chargeSup(q)}**?`,
    hint: tm ? "Bei Übergangsmetall-Kationen werden zuerst die 4s-Elektronen abgegeben!" : `Das Ion hat ${q > 0 ? "weniger" : "mehr"} Elektronen als das Atom.`,
    explain: `${el(Z).symbol}${chargeSup(q)} hat ${E} Elektronen: \`${right}\`.`
      + (tm ? ` Elektronen werden zuerst aus der äußersten Schale (4s) entfernt, nicht aus 3d – daher nicht \`${wrong1}\`.` : ""),
  };
};

const ISO: Record<number, [number, number][]> = {
  2: [[3, 1], [4, 2], [1, -1]],
  10: [[11, 1], [12, 2], [13, 3], [9, -1], [8, -2], [7, -3]],
  18: [[19, 1], [20, 2], [17, -1], [16, -2], [15, -3]],
  36: [[37, 1], [38, 2], [35, -1], [34, -2]],
};
export const isoelectronic: Gen = () => {
  const g = pick([10, 18, 18, 10, 36, 2]);
  const [Z, q] = pick(ISO[g]);
  const lbl = ([z, c]: [number, number]) => el(z).symbol + chargeSup(c);
  const wrongs = Object.entries(ISO).filter(([k]) => Number(k) !== g).flatMap(([, v]) => v).map(lbl);
  return {
    ...mc(lbl([Z, q]), [
      d(lbl([Z, -q]), "ladung-vorzeichen", `${lbl([Z, -q])} hätte ${Z + q} Elektronen. Für ${g} Elektronen muss ${el(Z).name} ${q > 0 ? `${q} abgeben` : `${-q} aufnehmen`} → ${lbl([Z, q])}.`),
      ...wrongs,
    ]),
    prompt: `Welches Teilchen hat dieselbe Elektronenkonfiguration wie das Edelgas **${el(g).name}**?`,
    hint: `${el(g).name} hat ${g} Elektronen. Berechne die Elektronenzahl jedes Ions (Protonen − Ladung).`,
    explain: `${lbl([Z, q])}: ${cnt(Z, "Proton", "Protonen")}, Ladung ${chargeLabel(q)} → ${g} Elektronen = **isoelektronisch** mit ${el(g).name} (\`${shortConfigString(g)}\`).`,
  };
};

export const elementFromConfig: Gen = pool => {
  const Z = pick(pool.filter(z => z >= 3 && cfgOK(z)));
  const s = Math.random() < 0.5 || Z > 36 ? shortConfigString(Z) : configString(configuration(Z));
  return {
    ...mc(el(Z).name, neighbors(Z, maxOf(pool)).map(z => el(z).name)),
    prompt: `Welches Element hat die Konfiguration \`${s}\`?`,
    hint: "Zähle alle Elektronen zusammen (bei [Edelgas] dessen Ordnungszahl dazurechnen).",
    explain: `Summe der Elektronen = **${Z}** → **${el(Z).name}**.`,
  };
};

export const periodGroupFromConfig: Gen = pool => {
  const Z = pick(pool.filter(z => z >= 3 && mainGroup(z) && noExc(z)));
  const e = el(Z), g = e.group!;
  const lbl = (p: number, gr: number) => `${p}. Periode, Gruppe ${gr}`;
  return {
    ...mc(lbl(e.period, g), [
      d(lbl(e.period, g >= 13 ? g - 10 : g + 12), "hauptgruppe-vs-gruppe", `Im Langperiodensystem zählen die Gruppen 1–18. ${cnt(valenceElectrons(Z)!, "Außenelektron", "Außenelektronen")} ${g >= 13 ? `bei p-Elementen heißt Gruppe ${g} (10 + ${valenceElectrons(Z)})` : `heißt Gruppe ${g}`}.`),
      d(lbl(e.period + 1, g), "periode-n", `Die Periode ist die **höchste Hauptquantenzahl** n in der Konfiguration – hier ${e.period}.`),
      lbl(e.period, g <= 2 ? g + 1 : g - 1), lbl(e.period - 1 || 2, g),
    ]),
    prompt: `Ein Element hat die Konfiguration \`${shortConfigString(Z)}\`. Wo steht es im Periodensystem?`,
    hint: "Höchste Hauptquantenzahl n = Periode. Anzahl der Außenelektronen (s + p) → Hauptgruppe.",
    explain: `Höchstes n = ${e.period} → ${e.period}. Periode. ${cnt(valenceElectrons(Z)!, "Außenelektron", "Außenelektronen")} → Gruppe ${g}${GROUP_NAMES[g] ? ` (${GROUP_NAMES[g]})` : ""}: **${e.name}**.`,
  };
};

// ── Level ────────────────────────────────────────────────────────────────────

const range = (a: number, b: number) => Array.from({ length: b - a + 1 }, (_, i) => a + i);
export const POOLS: Record<Stufe, number[]> = { us: range(1, 20), os: range(1, 86) };

/** Aufgabentyp: eindeutige id, Name für die Statistik, Generator */
export interface TaskType { id: string; name: string; gen: Gen }
const T = (id: string, name: string, gen: Gen): TaskType => ({ id, name, gen });
const byId = (list: TaskType[]) => Object.fromEntries(list.map(t => [t.id, t]));

export const TYPES: Record<Stufe, Record<string, TaskType>> = {
  us: byId([
    T("particles", "Teilchen aus dem Atomsymbol", p => readParticles(p)),
    T("mass", "Massenzahl", massNumber),
    T("fromProtons", "Element aus der Protonenzahl", elementFromProtons),
    T("pse", "Elemente im PSE finden", pseFind(false, false)),
    T("pseGroup", "Periode und Hauptgruppe im PSE", pseFind(false, true)),
    T("buildAtom", "Atome bauen", p => buildAtom(p)),
    T("fromBohr", "Bohrmodell lesen", elementFromBohr),
    T("shells", "Schalen füllen", fillShells),
    T("outer", "Außenelektronen", outerElectrons),
    T("period", "Schalen und Perioden", periodFromShells),
    T("ionCharge", "Ionenladung", ionCharge),
    T("isotope", "Isotope", isotopeNeutrons),
    T("typicalIon", "Typische Ionen", typicalIon),
    T("buildIon", "Ionen bauen", p => buildAtom(p, true)),
    T("isoCompare", "Isotope vergleichen", isotopeCompare),
  ]),
  os: byId([
    T("particles", "Teilchen aus dem Atomsymbol", p => readParticles(p, true)),
    T("nuclide", "Atomsymbol schreiben", nuclideInput),
    T("isotope", "Isotope", isotopeNeutrons),
    T("fromProtons", "Element aus der Protonenzahl", elementFromProtons),
    T("pse", "Elemente im PSE finden", pseFind(true, true)),
    T("config", "Elektronenkonfiguration", configMC),
    T("short", "Kurzschreibweise", shortConfigMC),
    T("boxes", "Kästchenschema", fillBoxes),
    T("block", "Blöcke im PSE", blockMC),
    T("unpaired", "Ungepaarte Elektronen", unpairedMC),
    T("ionConfig", "Konfiguration von Ionen", ionConfigMC),
    T("isoelectronic", "Isoelektronische Teilchen", isoelectronic),
    T("fromConfig", "Element aus der Konfiguration", elementFromConfig),
    T("periodGroup", "Periode und Gruppe", periodGroupFromConfig),
    T("typicalIon", "Typische Ionen", typicalIon),
  ]),
};

export interface Level { id: string; name: string; desc: string; types: string[] }
export const LEVELS: Record<Stufe, Level[]> = {
  us: [
    { id: "us-1", name: "Teilchen im Atom", desc: "Protonen, Neutronen, Elektronen und Massenzahl",
      types: ["particles", "mass", "fromProtons", "pse", "buildAtom"] },
    { id: "us-2", name: "Schalenmodell", desc: "Bohrmodell lesen, Schalen füllen, Außenelektronen",
      types: ["fromBohr", "shells", "outer", "period", "pseGroup"] },
    { id: "us-3", name: "Ionen & Isotope", desc: "Ladungen, Isotope und Edelgasregel",
      types: ["ionCharge", "isotope", "typicalIon", "buildIon", "isoCompare"] },
  ],
  os: [
    { id: "os-1", name: "Atombau & Nuklide", desc: "Atomsymbole lesen und schreiben, Ionen, Isotope",
      types: ["particles", "nuclide", "isotope", "fromProtons", "pse"] },
    { id: "os-2", name: "Elektronenkonfiguration", desc: "Aufbauprinzip, Kästchenschema, Hund'sche Regel",
      types: ["config", "short", "boxes", "block", "unpaired"] },
    { id: "os-3", name: "Ionen & Periodensystem", desc: "Ionenkonfigurationen, isoelektronische Teilchen",
      types: ["ionConfig", "isoelectronic", "fromConfig", "periodGroup", "typicalIon"] },
  ],
};

/** Zahl = Level, "mix" = alle Level gemischt, "weak" = die schwächsten Aufgabentypen, "due" = heute fällige Wiederholungen */
export type LevelKey = number | "mix" | "weak" | "due";
export const levelId = (stufe: Stufe, level: LevelKey) => (typeof level === "number" ? LEVELS[stufe][level].id : `${stufe}-${level}`);
export const levelName = (stufe: Stufe, level: LevelKey) =>
  level === "mix" ? "Alles gemischt" : level === "weak" ? "Schwächen üben" : level === "due" ? "Heute fällig" : LEVELS[stufe][level].name;

/** Statistik je Aufgabentyp */
export type TypeStats = Record<string, { right: number; wrong: number }>;

/** Die bis zu drei Aufgabentypen mit der höchsten (geglätteten) Fehlerquote – nur Typen mit Fehlern */
export function weakTypes(stufe: Stufe, stats: TypeStats = {}): string[] {
  return Object.entries(stats)
    .filter(([id, s]) => TYPES[stufe][id] && s.wrong > 0)
    .map(([id, s]) => ({ id, rate: (s.wrong + 1) / (s.right + s.wrong + 2) }))
    .sort((a, b) => b.rate - a.rate)
    .slice(0, 3)
    .map(x => x.id);
}

/** Aufgabenserie: jeder Typ etwa gleich oft, keine doppelten Aufgaben */
export function makeRound(stufe: Stufe, level: LevelKey, count = 10, stats?: TypeStats, due: string[] = []): Task[] {
  const pool = POOLS[stufe];
  let ids: string[];
  if (level === "mix") ids = [...new Set(LEVELS[stufe].flatMap(l => l.types))];
  else if (level === "weak") ids = weakTypes(stufe, stats);
  else if (level === "due") ids = due.filter(id => TYPES[stufe][id]);
  else ids = LEVELS[stufe][level].types;
  if (!ids.length) ids = LEVELS[stufe][0].types;
  let order: string[] = [];
  while (order.length < count) order = order.concat(shuffle(ids));
  const seen = new Set<string>();
  return order.slice(0, count).map(id => {
    const gen = TYPES[stufe][id].gen;
    let t = gen(pool);
    for (let tries = 0; tries < 12; tries++) {
      const sig = t.prompt + JSON.stringify(t.visual ?? "");
      if (!seen.has(sig)) { seen.add(sig); break; }
      t = gen(pool);
    }
    return { ...t, type: id };
  });
}
