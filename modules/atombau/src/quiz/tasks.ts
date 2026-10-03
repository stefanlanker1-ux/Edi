// Aufgabengeneratoren. Aufgaben sind reine Daten (JSON-fähig), damit ein laufendes Quiz
// gespeichert und nach einem Neustart fortgesetzt werden kann.
// Texte: **fett** und `Code` werden von <RichText> formatiert.

import {
  BY_Z, STABLE_N, GROUP_NAMES, standardNeutrons, configuration, configString, shortConfigString, shells,
  unpairedElectrons, blockOf, valenceElectrons, typicalIonCharge, commonCharges, ionName, chargeSup, signed, minus, groupLabel,
  MADELUNG, SHELL_NAMES, ROMAN, mainGroupNumber, sup, type Occupied,
} from "@lern/chem";
import { mc, d, dis, validTraps, type Trap } from "@lern/quiz";
import { tr } from "@lern/i18n";

export type Stufe = "us" | "os";

export type Visual =
  | { kind: "nuclide"; Z: number; N: number; E: number; blank?: boolean }
  | { kind: "bohr"; Z: number; N: number; E: number; labels?: boolean }
  /** Kästchenschema zum Selbst-Befüllen neben Konfigurationsaufgaben */
  | { kind: "fill"; Z: number; E: number };

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
const P = (n: number) => tr(cnt(n, "Proton", "Protonen"), cnt(n, "proton", "protons"));
const Nn = (n: number) => tr(cnt(n, "Neutron", "Neutronen"), cnt(n, "neutron", "neutrons"));
const El = (n: number) => tr(cnt(n, "Elektron", "Elektronen"), cnt(n, "electron", "electrons"));
const Ae = (n: number) => tr(cnt(n, "Außenelektron", "Außenelektronen"), cnt(n, "outer electron", "outer electrons"));
/** „2 Elektronen weniger“ / „1 Elektron mehr“ als Protonen (Ladung q) */
const fewerMore = (q: number) => q > 0
  ? tr(`${q} Elektron${q > 1 ? "en" : ""} weniger`, `${cnt(q, "electron", "electrons")} fewer`)
  : tr(`${-q} Elektron${q < -1 ? "en" : ""} mehr`, `${cnt(-q, "electron", "electrons")} more`);
/** „3. Periode“ / „period 3“ */
const per = (n: number) => tr(`${n}. Periode`, `period ${n}`);
const el = (Z: number) => BY_Z[Z];
/** Ordnungszahl des Edelgaskerns in der Kurzschreibweise (Edelgas der vorherigen Periode) */
const coreOf = (Z: number) => [0, 2, 10, 18, 36, 54, 86].filter(g => g < Z).pop()!;
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
    prompt: tr("Wie viele Protonen, Neutronen und Elektronen hat dieses Teilchen?", "How many protons, neutrons and electrons does this particle have?"),
    visual: { kind: "nuclide", Z, N, E },
    fields: [
      { id: "p", label: tr("Protonen", "Protons"), answer: Z },
      { id: "n", label: tr("Neutronen", "Neutrons"), answer: N },
      { id: "e", label: tr("Elektronen", "Electrons"), answer: E },
    ],
    traps: validTraps([
      { field: "e", value: Z + N, miss: "massenzahl-elektronen", why: tr(`**${Z + N}** ist die Massenzahl (Protonen + Neutronen). Elektronen sind so leicht, dass sie dort nicht mitzählen – ihre Zahl ergibt sich aus den Protonen${q ? " und der Ladung" : ""}.`,
        `**${Z + N}** is the mass number (protons + neutrons). Electrons are so light that they do not count there – their number comes from the protons${q ? " and the charge" : ""}.`) },
      ...(q ? [
        { field: "e", value: Z, miss: "ion-ladung-ignoriert", why: tr(`Das Teilchen ist geladen (${chargeLabel(q)}), also hat es **nicht** gleich viele Elektronen wie Protonen.`, `The particle is charged (${chargeLabel(q)}), so it does **not** have as many electrons as protons.`) },
        { field: "e", value: Z + q, miss: "ladung-vorzeichen", why: tr(`Ladung ${chargeLabel(q)} heißt ${q > 0 ? `${q} Elektron${q > 1 ? "en" : ""} **weniger**` : `${-q} Elektron${q < -1 ? "en" : ""} **mehr**`} als Protonen – Elektronen sind negativ.`,
          `Charge ${chargeLabel(q)} means ${q > 0 ? `${cnt(q, "electron", "electrons")} **fewer**` : `${cnt(-q, "electron", "electrons")} **more**`} than protons – electrons are negative.`) },
      ] : []),
      { field: "n", value: Z + N, miss: "neutronen-massenzahl", why: tr(`**${Z + N}** ist die Massenzahl. Die Neutronen bekommst du, wenn du die Protonen abziehst: ${Z + N} − ${Z}.`, `**${Z + N}** is the mass number. You get the neutrons by subtracting the protons: ${Z + N} − ${Z}.`) },
      { field: "n", value: Z, miss: "neutronen-protonen", why: tr(`Neutronen und Protonen sind nicht automatisch gleich viele. Rechne Massenzahl − Ordnungszahl.`, `Neutrons and protons are not automatically equal in number. Work out mass number − atomic number.`) },
      { field: "p", value: Z + N, miss: "massenzahl-ordnungszahl", why: tr(`**${Z + N}** ist die Massenzahl. Die Protonen stehen unten als Ordnungszahl.`, `**${Z + N}** is the mass number. The protons are at the bottom as the atomic number.`) },
    ], { p: Z, n: N, e: E }),
    hint: tr(`Unten steht die Ordnungszahl, oben die Massenzahl (Protonen + Neutronen)${q ? ", rechts oben die Ladung" : ""}.`,
      `Bottom: atomic number. Top: mass number (protons + neutrons)${q ? ". Top right: charge" : ""}.`),
    explain: tr(`Protonen = Ordnungszahl = **${Z}**. Neutronen = Massenzahl − Ordnungszahl = ${Z + N} − ${Z} = **${N}**. `,
      `Protons = atomic number = **${Z}**. Neutrons = mass number − atomic number = ${Z + N} − ${Z} = **${N}**. `)
      + (q ? tr(`Ladung ${chargeLabel(q)}: ${fewerMore(q)} als Protonen → **${E}** Elektronen.`, `Charge ${chargeLabel(q)}: ${fewerMore(q)} than protons → **${E}** electrons.`)
        : tr(`Im neutralen Atom gibt es gleich viele Elektronen wie Protonen: **${E}**.`, `A neutral atom has as many electrons as protons: **${E}**.`)),
  };
}

export const massNumber: Gen = pool => {
  const Z = pick(nuclidePool(pool)), N = isotopeN(Z), A = Z + N;
  return {
    ...mc(String(A), [
      d(String(Z), "massenzahl-ordnungszahl", tr(`**${Z}** ist die Ordnungszahl (nur die Protonen). Die Massenzahl zählt Protonen **und** Neutronen.`, `**${Z}** is the atomic number (only the protons). The mass number counts protons **and** neutrons.`)),
      d(String(N), "massenzahl-neutronen", tr(`**${N}** sind nur die Neutronen. Dazu kommen die ${P(Z)}.`, `**${N}** are only the neutrons. Add the ${P(Z)}.`)),
      d(String(2 * Z + N), "elektronen-mitgezaehlt", tr(`Du hast die Elektronen mitgezählt. Sie sind rund 2000-mal leichter als ein Proton und zählen nicht zur Massenzahl.`, `You counted the electrons too. They are about 2000 times lighter than a proton. They do not count towards the mass number.`)),
      ...nums(nearNums(A, 1)),
    ], 4, tr(`Genau: ${Z} + ${N} = ${A}.`, `Exactly: ${Z} + ${N} = ${A}.`)),
    prompt: tr(`Ein Atom hat **${P(Z)}** und **${Nn(N)}**. Wie groß ist seine Massenzahl?`, `An atom has **${P(Z)}** and **${Nn(N)}**. What is its mass number?`),
    visual: { kind: "bohr", Z, N, E: Z, labels: false },
    hint: tr("Die Massenzahl zählt alle Teilchen im Atomkern.", "The mass number counts all particles in the nucleus."),
    explain: tr(`Massenzahl A = Protonen + Neutronen = ${Z} + ${N} = **${A}**. Elektronen sind so leicht, dass sie nicht mitgezählt werden.`, `Mass number A = protons + neutrons = ${Z} + ${N} = **${A}**. Electrons are so light that they are not counted.`),
  };
};

export const elementFromProtons: Gen = pool => {
  const Z = pick(pool);
  return {
    ...mc(el(Z).name, [
      // Protonenzahl mit der Massenzahl verwechselt: 12 Protonen → Kohlenstoff (C-12)
      ...pool.filter(z => z !== Z && z + standardNeutrons(z) === Z).slice(0, 1).map(z => d(el(z).name, "protonen-massenzahl",
        tr(`${el(z).name} hat die **Massenzahl** ${Z}. Das Element bestimmt die **Protonenzahl**: ${Z} = Ordnungszahl → ${el(Z).name}.`,
          `${el(z).name} has the **mass number** ${Z}. The **proton number** decides the element: ${Z} = atomic number → ${el(Z).name}.`))),
      ...neighbors(Z, maxOf(pool)).map(z => dis(el(z).name, tr(`${el(z).name} hat ${P(z)}. Ordnungszahl ${Z} → ${el(Z).name}.`, `${el(z).name} has ${P(z)}. Atomic number ${Z} → ${el(Z).name}.`))),
    ]),
    prompt: tr(`Ein Atom hat **${P(Z)}**. Um welches Element handelt es sich?`, `An atom has **${P(Z)}**. Which element is it?`),
    hint: tr("Die Protonenzahl ist gleich der Ordnungszahl im Periodensystem.", "The proton number equals the atomic number in the periodic table."),
    explain: tr(`Ordnungszahl ${Z} = **${el(Z).name} (${el(Z).symbol})**. Die Protonenzahl legt das Element eindeutig fest.`, `Atomic number ${Z} = **${el(Z).name} (${el(Z).symbol})**. The proton number determines the element.`),
  };
};

/** Element im PSE finden. `groups`: auch nach Periode und Gruppe fragen (Unterstufe erst ab Level 2, römische Hauptgruppe; Oberstufe Gruppe 1–18) */
export const pseFind = (os: boolean, groups: boolean): Gen => pool => {
  const Z = pick(pool), e = el(Z), mg = mainGroupNumber(Z);
  const v = groups && (os ? e.group !== null : mg !== null) ? rnd(0, 2) : rnd(0, 1);
  let prompt: string;
  if (v === 0) prompt = tr(`Tippe im Periodensystem auf **${e.name}**.`, `Tap **${e.name}** in the periodic table.`);
  else if (v === 1) prompt = tr(`Tippe auf das Element mit der Ordnungszahl **${Z}**.`, `Tap the element with atomic number **${Z}**.`);
  else prompt = tr(`Tippe auf das Element in der **${e.period}. Periode** und **${groupLabel(Z, os)}**.`, `Tap the element in **period ${e.period}** and **${groupLabel(Z, os)}**.`);
  return {
    kind: "pse", answer: Z, prompt,
    hint: v === 2 ? tr("Perioden sind die Zeilen, Gruppen die Spalten.", "Periods are the rows, groups the columns.") : tr(`Das Symbol beginnt mit „${e.symbol[0]}“.`, `The symbol starts with “${e.symbol[0]}”.`),
    explain: tr(`Gesucht war **${e.name} (${e.symbol})**: Ordnungszahl ${Z}`, `The answer was **${e.name} (${e.symbol})**: atomic number ${Z}`) + (groups ? `, ${per(e.period)}, ${groupLabel(Z, os)}` : "") + ".",
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
    prompt: q ? tr("Baue das Ion:", "Build the ion:") : tr("Baue ein Atom:", "Build an atom:"),
    visual: { kind: "nuclide", Z, N, E },
    traps: validTraps([
      { field: "E", value: Z + N, miss: "massenzahl-elektronen", why: tr(`${Z + N} ist die Massenzahl, nicht die Elektronenzahl. Elektronen richten sich nach den Protonen${q ? " und der Ladung" : ""}.`, `${Z + N} is the mass number, not the number of electrons. Electrons follow the protons${q ? " and the charge" : ""}.`) },
      { field: "N", value: Z + N, miss: "neutronen-massenzahl", why: tr(`${Z + N} ist die Massenzahl. Neutronen = ${Z + N} − ${P(Z)}.`, `${Z + N} is the mass number. Neutrons = ${Z + N} − ${P(Z)}.`) },
      ...(q ? [
        { field: "E", value: Z, miss: "ion-ladung-ignoriert", why: tr(`Das Ion ist geladen (${chargeLabel(q)}) – es hat nicht gleich viele Elektronen wie Protonen.`, `The ion is charged (${chargeLabel(q)}) – it does not have as many electrons as protons.`) },
        { field: "E", value: Z + q, miss: "ladung-vorzeichen", why: tr(`${chargeLabel(q)} heißt ${q > 0 ? "Elektronen **fehlen**" : "Elektronen sind **zu viel**"}, denn Elektronen sind negativ.`, `${chargeLabel(q)} means electrons are ${q > 0 ? "**missing**" : "**extra**"}, because electrons are negative.`) },
      ] : []),
    ], { Z, N, E }),
    hint: tr(`Protonen = ${Z}. Neutronen = Massenzahl − Protonen.${q ? " Die Ladung sagt, wie viele Elektronen fehlen (+) oder zu viel sind (−)." : ""}`,
      `Protons = ${Z}. Neutrons = mass number − protons.${q ? " The charge tells you how many electrons are missing (+) or extra (−)." : ""}`),
    explain: `${q ? `${ionName(Z, q)} ${el(Z).symbol}${chargeSup(q)}` : el(Z).name}: `
      + tr(`**${Z}** ${Z === 1 ? "Proton" : "Protonen"}, **${N}** ${N === 1 ? "Neutron" : "Neutronen"} (${Z + N} − ${Z}), **${E}** ${E === 1 ? "Elektron" : "Elektronen"}.`,
        `**${Z}** ${Z === 1 ? "proton" : "protons"}, **${N}** ${N === 1 ? "neutron" : "neutrons"} (${Z + N} − ${Z}), **${E}** ${E === 1 ? "electron" : "electrons"}.`),
  };
}

export const elementFromBohr: Gen = pool => {
  const Z = pick(pool);
  const outer = shells(Z)[shells(Z).length - 1];
  return {
    ...mc(el(Z).name, [
      ...(shells(Z).length > 1 && outer !== Z ? [d(el(outer).name, "nur-aussenschale", tr(`Du hast nur die äußerste Schale gezählt (${outer}). Für die Ordnungszahl zählen **alle** Elektronen: ${shells(Z).join(" + ")} = ${Z}.`, `You only counted the outer shell (${outer}). For the atomic number **all** electrons count: ${shells(Z).join(" + ")} = ${Z}.`))] : []),
      ...(shells(Z).length !== Z && shells(Z).length !== outer ? [d(el(shells(Z).length).name, "schalen-statt-elektronen", tr(`${shells(Z).length} ist die Zahl der **Schalen**. Für die Ordnungszahl zählen die Elektronen: ${shells(Z).join(" + ")} = ${Z}.`, `${shells(Z).length} is the number of **shells**. For the atomic number the electrons count: ${shells(Z).join(" + ")} = ${Z}.`))] : []),
      ...neighbors(Z, maxOf(pool)).map(z => dis(el(z).name, tr(`${el(z).name} hätte ${El(z)}. Hier: ${shells(Z).join(" + ")} = ${Z}.`, `${el(z).name} would have ${El(z)}. Here: ${shells(Z).join(" + ")} = ${Z}.`))),
    ]),
    prompt: tr("Welches Element zeigt dieses Bohrmodell? (neutrales Atom)", "Which element does this Bohr model show? (neutral atom)"),
    visual: { kind: "bohr", Z, N: standardNeutrons(Z), E: Z, labels: true },
    hint: tr("Zähle die Elektronen auf allen Schalen – im neutralen Atom ist das die Ordnungszahl.", "Count the electrons on all shells – in a neutral atom that is the atomic number."),
    explain: tr(`${shells(Z).length > 1 ? `Die Schalen enthalten ${shells(Z).join(" + ")} = **${Z}** Elektronen` : `Die Schale enthält **${El(Z)}**`} → Ordnungszahl ${Z} = **${el(Z).name}**.`,
      `${shells(Z).length > 1 ? `The shells contain ${shells(Z).join(" + ")} = **${Z}** electrons` : `The shell contains **${El(Z)}**`} → atomic number ${Z} = **${el(Z).name}**.`),
  };
};

export const fillShells: Gen = pool => {
  const Z = pick(pool.filter(z => z >= 3));
  const target = shells(Z);
  return {
    kind: "shells", target, shellCount: Math.max(3, target.length),
    prompt: tr(`Verteile die **${Z} Elektronen** von **${el(Z).name}** auf die Schalen.`, `Arrange the **${Z} electrons** of **${el(Z).name}** in the shells.`),
    traps: [
      { field: "s0", min: 3, miss: "k-schale-ueberfuellt", why: tr("Die K-Schale fasst höchstens **2** Elektronen. Erst wenn sie voll ist, geht es auf der L-Schale weiter.", "The K shell holds at most **2** electrons. Only when it is full do you continue on the L shell.") },
      { field: "s1", min: 9, miss: "l-schale-ueberfuellt", why: tr("Die L-Schale fasst höchstens **8** Elektronen. Der Rest kommt auf die M-Schale.", "The L shell holds at most **8** electrons. The rest go on the M shell.") },
    ],
    hint: tr("Von innen nach außen füllen: K fasst 2, L fasst 8, M zunächst 8 Elektronen.", "Fill from the inside out: K holds 2, L holds 8, M first 8 electrons."),
    explain: `${tr("Von innen nach außen", "From the inside out")}: ${target.map((c, i) => `${SHELL_NAMES[i]} = ${c}`).join(", ")}.`
      + (Z > 18 ? tr(" Ab Kalium kommt die N-Schale dran, bevor die M-Schale mehr als 8 Elektronen bekommt.", " From potassium on, the N shell fills before the M shell has more than 8.") : ""),
  };
};

export const outerElectrons: Gen = pool => {
  const Z = pick(pool.filter(mainGroup));
  const v = valenceElectrons(Z)!, nper = shells(Z).length;
  return {
    ...mc(String(v), [
      ...(nper !== v ? [d(String(nper), "aussen-periode", tr(`**${nper}** ist die Zahl der Schalen (Periode). Die Außenelektronen sitzen nur auf der äußersten Schale – ihre Zahl ist die Hauptgruppe.`, `**${nper}** is the number of shells (period). Outer electrons are only on the outer shell – their number is the main group.`))] : []),
      ...(Z !== v && Z <= 12 ? [d(String(Z), "aussen-ordnungszahl", tr(`**${Z}** sind alle Elektronen. Gefragt sind nur die auf der äußersten Schale.`, `**${Z}** are all the electrons. Only those on the outer shell are asked for.`))] : []),
      ...(8 - v !== v && v < 8 ? [d(String(8 - v), "aussen-fehlend", Z > 2
        ? tr(`**${8 - v}** fehlen bis zur vollen Schale. Gefragt ist, wie viele **da** sind.`, `**${8 - v}** are missing for a full shell. The question is how many are **there**.`)
        : tr(`${el(Z).name} hat nur die K-Schale, und die ist schon mit 2 voll. Gefragt ist, wie viele Außenelektronen **da** sind: ${v}.`, `${el(Z).name} only has the K shell, which is already full with 2. The question is how many outer electrons are **there**: ${v}.`))] : []),
      ...nums(nearNums(v, 1)),
    ]),
    prompt: tr(`Wie viele **Außenelektronen** hat ein **${el(Z).name}**-Atom?`, `How many **outer electrons** does a **${el(Z).name}** atom have?`),
    hint: tr("Schau, in welcher Hauptgruppe das Element steht.", "Look at which main group the element is in."),
    explain: Z === 2
      ? tr("Helium hat nur die K-Schale mit **2** Elektronen – sie ist damit voll (Edelgas).", "Helium only has the K shell with **2** electrons – so it is full (noble gas).")
      : tr(`${el(Z).name} steht in der ${ROMAN[v]}. Hauptgruppe → **${v}** ${v === 1 ? "Außenelektron" : "Außenelektronen"} (Schalen: ${shells(Z).join(", ")}).`,
        `${el(Z).name} is in main group ${ROMAN[v]} → **${v}** ${v === 1 ? "outer electron" : "outer electrons"} (shells: ${shells(Z).join(", ")}).`),
  };
};

export const periodFromShells: Gen = pool => {
  const Z = pick(pool), n = shells(Z).length, mg = mainGroupNumber(Z);
  return {
    ...mc(String(n), [
      ...(mg && mg !== n ? [d(String(mg), "schalen-gruppe", tr(`**${mg}** ist die Hauptgruppe (Außenelektronen). Die Zahl der Schalen ist die **Periode**.`, `**${mg}** is the main group (outer electrons). The number of shells is the **period**.`))] : []),
      ...(Math.ceil(Z / 8) !== n ? [d(String(Math.ceil(Z / 8)), "schalen-je-8", tr("Nicht jede Schale fasst 8: Die K-Schale nur 2, ab der 4. Periode mehr. Die Zahl der Schalen ist die **Periode**.", "Not every shell holds 8: the K shell only 2, from period 4 on more. The number of shells is the **period**."))] : []),
      ...(n !== 1 ? [d("1", "k-schale-ueberfuellt", tr(`Alle ${Z} Elektronen passen nicht auf eine Schale: Die K-Schale fasst nur 2, die L-Schale 8.`, `All ${Z} electrons do not fit on one shell: the K shell holds only 2, the L shell 8.`))]
        : [d("2", "leere-schale-gezaehlt", tr(`${el(Z).name} steht in der 1. Periode: ${Z === 1 ? "sein 1 Elektron passt" : "beide Elektronen passen"} auf die K-Schale, eine zweite Schale wird nicht gebraucht.`,
          `${el(Z).name} is in period 1: ${Z === 1 ? "its 1 electron fits" : "both electrons fit"} on the K shell, a second shell is not needed.`))]),
      "1", "2", "3", "4", "5", "6",
    ]),
    prompt: tr(`Auf wie vielen **Schalen** verteilen sich die Elektronen von **${el(Z).name}**?`, `On how many **shells** are the electrons of **${el(Z).name}** arranged?`),
    hint: tr("Die Nummer der Periode verrät die Anzahl der Schalen.", "The period number tells you the number of shells."),
    explain: tr(`${el(Z).name} steht in der **${el(Z).period}. Periode** → **${n}** besetzte Schalen`, `${el(Z).name} is in **period ${el(Z).period}** → **${n}** occupied shells`) + ` (${shells(Z).map((c, i) => SHELL_NAMES[i] + " " + c).join(", ")}).`,
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
        ? tr(`${P(Z)} (+) und nur ${El(E)} (−): Es gibt mehr positive Ladungen → **positiv**.`, `${P(Z)} (+) and only ${El(E)} (−): there are more positive charges → **positive**.`)
        : tr(`${El(E)} (−) und nur ${P(Z)} (+): Es gibt mehr negative Ladungen → **negativ**.`, `${El(E)} (−) and only ${P(Z)} (+): there are more negative charges → **negative**.`)),
      d("neutral", "ladung-neutral", tr(`Neutral wäre es nur mit gleich vielen Protonen und Elektronen. Hier: ${P(Z)}, ${El(E)}.`, `It would only be neutral with equal numbers of protons and electrons. Here: ${P(Z)}, ${El(E)}.`)),
      dis(chargeLabel(q + (q > 0 ? 1 : -1)), tr(`${Z} − ${E} = ${minus(q)} – noch einmal genau rechnen: **${chargeLabel(q)}**.`, `${Z} − ${E} = ${minus(q)} – calculate carefully again: **${chargeLabel(q)}**.`)),
      dis(chargeLabel(q > 0 ? (q - 1 || 2) : (q + 1 || -2)), tr(`${Z} − ${E} = ${minus(q)} – noch einmal genau rechnen: **${chargeLabel(q)}**.`, `${Z} − ${E} = ${minus(q)} – calculate carefully again: **${chargeLabel(q)}**.`)),
    ]),
    prompt: tr(`Ein Teilchen hat **${P(Z)}** und **${El(E)}**. Welche Ladung hat es?`, `A particle has **${P(Z)}** and **${El(E)}**. What is its charge?`),
    hint: tr("Protonen sind positiv, Elektronen negativ. Rechne Protonen − Elektronen.", "Protons are positive, electrons negative. Work out protons − electrons."),
    explain: tr(`Ladung = Protonen − Elektronen = ${Z} − ${E} = ${minus(q)} → **${signed(q)}** → ${q > 0 ? "Kation" : "Anion"} ${el(Z).symbol}${chargeSup(q)}.`,
      `Charge = protons − electrons = ${Z} − ${E} = ${minus(q)} → **${signed(q)}** → ${q > 0 ? "cation" : "anion"} ${el(Z).symbol}${chargeSup(q)}.`),
  };
};

export const isotopeNeutrons: Gen = pool => {
  const Z = pick(nuclidePool(pool).filter(z => z > 1));
  const N = isotopeN(Z), A = Z + N;
  return {
    ...mc(String(N), [
      d(String(A), "neutronen-massenzahl", tr(`**${A}** ist die Massenzahl (Protonen + Neutronen). Zieh die ${P(Z)} ab.`, `**${A}** is the mass number (protons + neutrons). Subtract the ${P(Z)}.`)),
      d(String(Z), "neutronen-protonen", tr(`**${Z}** ist die Protonenzahl (Ordnungszahl). Neutronen = ${A} − ${Z}.`, `**${Z}** is the proton number (atomic number). Neutrons = ${A} − ${Z}.`)),
      ...nearNums(N, 0).map(n => dis(String(n), tr(`Genau rechnen: Neutronen = ${A} − ${Z} = ${N}.`, `Calculate carefully: neutrons = ${A} − ${Z} = ${N}.`))),
    ]),
    prompt: tr(`Wie viele Neutronen hat das Isotop **${el(Z).name}-${A}**?`, `How many neutrons does the isotope **${el(Z).name}-${A}** have?`),
    visual: { kind: "nuclide", Z, N, E: Z },
    hint: tr(`Die Zahl hinter dem Namen ist die Massenzahl. ${el(Z).name} hat die Ordnungszahl ${Z}.`, `The number after the name is the mass number. ${el(Z).name} has atomic number ${Z}.`),
    explain: tr(`Neutronen = Massenzahl − Protonen = ${A} − ${Z} = **${N}**.`, `Neutrons = mass number − protons = ${A} − ${Z} = **${N}**.`),
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
        ? tr(`${el(Z).name} ist ein Metall und **gibt** seine ${Ae(v)} ab – dann fehlen negative Ladungen, das Ion ist **positiv**.`, `${el(Z).name} is a metal and **loses** its ${Ae(v)} – then negative charges are missing, the ion is **positive**.`)
        : tr(`${el(Z).name} ist ein Nichtmetall und **nimmt** Elektronen auf – zusätzliche negative Ladungen machen das Ion **negativ**.`, `${el(Z).name} is a non-metal and **gains** electrons – extra negative charges make the ion **negative**.`)),
      q > 0
        ? d(opt(-(8 - v)), "auffuellen-statt-abgeben", tr(`Metalle nehmen keine Elektronen auf. ${el(Z).name} gibt ${v === 1 ? "sein" : "seine"} ${Ae(v)} ab → ${opt(q)}.`, `Metals do not gain electrons. ${el(Z).name} loses its ${Ae(v)} → ${opt(q)}.`))
        : d(opt(v), "abgeben-statt-aufnehmen", tr(`Nichtmetalle geben ihre Außenelektronen nicht ab. ${el(Z).name} nimmt ${El(8 - v)} auf → ${opt(q)}.`, `Non-metals do not lose their outer electrons. ${el(Z).name} gains ${El(8 - v)} → ${opt(q)}.`)),
      opt(q > 0 ? q + 1 : q - 1), opt(q > 0 ? (q === 1 ? 2 : q - 1) : (q === -1 ? -2 : q + 1)),
    ]),
    prompt: tr(`Welches Ion bildet **${el(Z).name}** meist?`, `Which ion does **${el(Z).name}** usually form?`),
    hint: tr("Metalle geben ihre Außenelektronen ab, Nichtmetalle nehmen bis 8 auf. Das Ion hat dann Edelgaskonfiguration.", "Metals lose their outer electrons, non-metals gain up to 8. The ion then has a noble gas configuration."),
    explain: tr(`${el(Z).name} hat ${Ae(valenceElectrons(Z)!)}. ${q > 0 ? `Es gibt ${q} ab` : `Es nimmt ${-q} auf`}. Dann hat das Ion dieselbe Elektronenanordnung wie ein Edelgas → **${opt(q)}**.`,
      `${el(Z).name} has ${Ae(valenceElectrons(Z)!)}. ${q > 0 ? `It loses ${q}` : `It gains ${-q}`}. Then the ion has the same electron arrangement as a noble gas → **${opt(q)}**.`),
  };
};

export const isotopeCompare: Gen = pool => {
  const Z = pick(nuclidePool(pool).filter(z => (STABLE_N[z]?.length ?? 0) >= 2 || z === 6));
  const Ns = Z === 6 ? [6, 8] : shuffle(STABLE_N[Z]).slice(0, 2).sort((a, b) => a - b);
  const [a, b] = Ns.map(n => `${el(Z).name}-${Z + n}`);
  const same = Math.random() < 0.5;
  return {
    ...(same
      ? mc(tr("die Protonenzahl", "the number of protons"), [
          d(tr("die Neutronenzahl", "the number of neutrons"), "isotop-neutronen-gleich", tr(`Gerade die Neutronen sind verschieden (${Ns[0]} und ${Ns[1]}). Gleich ist die Protonenzahl ${Z}.`, `It is the neutrons that differ (${Ns[0]} and ${Ns[1]}). The proton number ${Z} is the same.`)),
          d(tr("die Massenzahl", "the mass number"), "isotop-massenzahl-gleich", tr(`Die Massenzahlen ${Z + Ns[0]} und ${Z + Ns[1]} sind verschieden – deshalb heißen die Isotope ja anders.`, `The mass numbers ${Z + Ns[0]} and ${Z + Ns[1]} are different – that is why the isotopes have different names.`)),
          d(tr("gar nichts", "nothing at all"), "isotop-element", tr(`Isotope sind **dasselbe Element** – sie haben dieselbe Protonenzahl (${Z}).`, `Isotopes are **the same element** – they have the same proton number (${Z}).`)),
        ])
      : mc(tr("die Neutronenzahl", "the number of neutrons"), [
          d(tr("die Protonenzahl", "the number of protons"), "isotop-element", tr(`Wäre die Protonenzahl anders, wäre es ein anderes Element. Isotope haben beide ${P(Z)}.`, `If the proton number were different, it would be another element. Both isotopes have ${P(Z)}.`)),
          d(tr("die Elektronenzahl", "the number of electrons"), "isotop-elektronen", tr(`Als neutrale Atome haben beide ${El(Z)}. Der Unterschied liegt im Kern: ${Ns[0]} bzw. ${Nn(Ns[1])}.`, `As neutral atoms both have ${El(Z)}. The difference is in the nucleus: ${Ns[0]} and ${Nn(Ns[1])}.`)),
          d(tr("die Ordnungszahl", "the atomic number"), "isotop-element", tr(`Die Ordnungszahl ist die Protonenzahl – und die ist bei Isotopen gleich (${Z}).`, `The atomic number is the proton number – and that is the same for isotopes (${Z}).`)),
        ])),
    prompt: `**${a}** ${tr("und", "and")} **${b}** ${tr("sind Isotope.", "are isotopes.")} ${same ? tr("Was haben sie gemeinsam?", "What do they have in common?") : tr("Worin unterscheiden sie sich?", "How do they differ?")}`,
    hint: tr("Isotope gehören zum selben Element.", "Isotopes belong to the same element."),
    explain: tr(`Isotope haben die **gleiche Protonenzahl** (${Z}, deshalb dasselbe Element), aber eine **andere Neutronenzahl** (${Ns[0]} bzw. ${Ns[1]}) und damit eine andere Massenzahl.`,
      `Isotopes have the **same proton number** (${Z}, so the same element). They have a **different neutron number** (${Ns[0]} and ${Ns[1]}), so a different mass number.`),
  };
};

// ── Oberstufe ────────────────────────────────────────────────────────────────

export const nuclideInput: Gen = pool => {
  const Z = pick(nuclidePool(pool)), N = Math.max(0, standardNeutrons(Z) + pick([0, 0, 1, 2, -1]));
  const q = Math.random() < 0.3 ? 0 : realCharge(Z);
  const E = Z - q;
  return {
    kind: "numbers",
    prompt: tr(`Ergänze das Atomsymbol für ein Teilchen mit **${P(Z)}**, **${Nn(N)}** und **${El(E)}**.`, `Complete the nuclide symbol for a particle with **${P(Z)}**, **${Nn(N)}** and **${El(E)}**.`),
    visual: { kind: "nuclide", Z, N, E, blank: true },
    fields: [
      { id: "z", label: tr("Ordnungszahl Z", "Atomic number Z"), answer: Z },
      { id: "a", label: tr("Massenzahl A", "Mass number A"), answer: Z + N },
      { id: "q", label: tr("Ladung", "Charge"), answer: q, select: [-3, -2, -1, 0, 1, 2, 3, 4] },
    ],
    traps: validTraps([
      { field: "a", value: Z, miss: "massenzahl-ordnungszahl", why: tr(`Die Massenzahl zählt Protonen **und** Neutronen: ${Z} + ${N} = ${Z + N}.`, `The mass number counts protons **and** neutrons: ${Z} + ${N} = ${Z + N}.`) },
      { field: "a", value: N, miss: "massenzahl-neutronen", why: tr(`${N} sind nur die Neutronen. Massenzahl = ${Z} + ${N}.`, `${N} are only the neutrons. Mass number = ${Z} + ${N}.`) },
      { field: "a", value: Z + N + E, miss: "elektronen-mitgezaehlt", why: tr("Elektronen zählen nicht zur Massenzahl – nur Protonen und Neutronen.", "Electrons do not count towards the mass number – only protons and neutrons.") },
      ...(q ? [{ field: "q", value: -q, miss: "ladung-vorzeichen", why: tr(`${P(Z)} und ${El(E)} → ${Z > E ? "mehr positive" : "mehr negative"} Ladungen → **${signed(q)}**.`, `${P(Z)} and ${El(E)} → ${Z > E ? "more positive" : "more negative"} charges → **${signed(q)}**.`) }] : []),
      ...(q ? [{ field: "q", value: 0, miss: "ladung-neutral", why: tr(`${P(Z)} und ${El(E)} sind nicht gleich viele – das Teilchen ist geladen.`, `${P(Z)} and ${El(E)} are not equal in number – the particle is charged.`) }] : []),
    ], { z: Z, a: Z + N, q }),
    hint: tr("A = Protonen + Neutronen. Ladung = Protonen − Elektronen.", "A = protons + neutrons. Charge = protons − electrons."),
    explain: `Z = **${Z}**, A = ${Z} + ${N} = **${Z + N}**, ${tr("Ladung", "charge")} = ${Z} − ${E} = ${minus(q)} → **${signed(q)}**.`,
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
    ...(occ(naive) !== same ? [d(configString(naive), "3d-vor-4s", tr("Hier wurde nach der Schalennummer gefüllt (3d vor 4s). Befüllt wird nach **Energie**: 4s liegt unter 3d.", "This was filled by shell number (3d before 4s). Filling goes by **energy**: 4s is below 3d."))] : []),
    ...[configuration(Z + 1), configuration(Z - 1)].filter(c => occ(c) !== same).map(c => d(configString(c), "elektronen-verzaehlt", tr(`Die Hochzahlen müssen zusammen **${Z}** ergeben – zähl nach.`, `The superscripts must add up to **${Z}** – count again.`))),
    ...[shiftedConfig(configuration(Z))].filter((c): c is Occupied[] => !!c && occ(c) !== same).map(configString),
  ];
  return {
    ...mc(right, wrongs),
    prompt: tr(`Welche Elektronenkonfiguration hat **${el(Z).name}** (Z = ${Z})?`, `What is the electron configuration of **${el(Z).name}** (Z = ${Z})?`),
    visual: { kind: "fill", Z, E: Z },
    hint: tr("Reihenfolge nach Energie: 1s 2s 2p 3s 3p 4s 3d 4p … – und die Summe der Hochzahlen muss Z ergeben.", "Order by energy: 1s 2s 2p 3s 3p 4s 3d 4p … – and the superscripts must add up to Z."),
    explain: tr(`${el(Z).name} hat ${Z} Elektronen: \`${right}\`. Unterschalen werden nach steigender Energie gefüllt (4s vor 3d).`, `${el(Z).name} has ${Z} electrons: \`${right}\`. Subshells are filled in order of increasing energy (4s before 3d).`),
  };
};

export const shortConfigMC: Gen = pool => {
  const Z = pick(pool.filter(z => z >= 11 && cfgOK(z)));
  const right = shortConfigString(Z);
  const nob = ["He", "Ne", "Ar", "Kr", "Xe"];
  const wrongCore = right.replace(/^\[(\w+)\]/, (_m, s: string) => { const i = nob.indexOf(s); return `[${nob[i > 0 ? i - 1 : i + 1]}]`; });
  return {
    ...mc(right, [
      d(wrongCore, "edelgaskern-falsch", tr(`Als Kern nimmt man das Edelgas der **vorherigen** Periode – ${el(Z).name} steht in der ${el(Z).period}. Periode.`, `The core is the noble gas of the **previous** period – ${el(Z).name} is in period ${el(Z).period}.`)),
      ...[Z + 1, Z - 1, Z + 2].map(z => d(shortConfigString(z), "elektronen-verzaehlt", tr(`Kern plus Hochzahlen müssen **${Z}** Elektronen ergeben.`, `Core plus superscripts must give **${Z}** electrons.`))),
    ]),
    prompt: tr(`Welche Kurzschreibweise (Edelgaskern) gehört zu **${el(Z).name}**?`, `Which short notation (noble gas core) belongs to **${el(Z).name}**?`),
    visual: { kind: "fill", Z, E: Z },
    hint: tr("Nimm das Edelgas der vorherigen Periode als Kern und schreibe nur die restlichen Elektronen dazu.", "Use the noble gas of the previous period as the core. Then add the remaining electrons."),
    explain: tr(`${el(Z).name} (Z = ${Z}) steht in der ${el(Z).period}. Periode: \`${right}\`.`, `${el(Z).name} (Z = ${Z}) is in period ${el(Z).period}: \`${right}\`.`),
  };
};

export const fillBoxes: Gen = pool => {
  const Z = pick(pool.filter(z => z >= 3 && z <= 30 && noExc(z)));
  const cfg = configuration(Z);
  const lastIndex = MADELUNG.findIndex(o => o.key === cfg[cfg.length - 1].key);
  return {
    kind: "boxes", Z, lastIndex,
    prompt: tr(`Fülle das Energieniveau-Schema für **${el(Z).name}** (${Z} Elektronen). Tippe auf ein Kästchen: leer → ↑ → ↑↓.`, `Fill in the energy level diagram for **${el(Z).name}** (${Z} electrons). Tap a box: empty → ↑ → ↑↓.`),
    hint: tr("Pauli: höchstens 2 Elektronen pro Kästchen mit entgegengesetztem Spin. Hund: Kästchen gleicher Energie erst einzeln besetzen.", "Pauli: at most 2 electrons per box with opposite spin. Hund: fill boxes of equal energy singly first."),
    explain: tr(`Konfiguration \`${configString(cfg)}\`. Nach der Hund'schen Regel werden p- und d-Kästchen zuerst einfach besetzt → ${cnt(unpairedElectrons(cfg), "ungepaartes Elektron", "ungepaarte Elektronen")}.`,
      `Configuration \`${configString(cfg)}\`. By Hund's rule, p and d boxes are first filled singly → ${cnt(unpairedElectrons(cfg), "unpaired electron", "unpaired electrons")}.`),
  };
};

const blk = (b: string) => tr(`${b}-Block`, `${b} block`);
export const blockMC: Gen = pool => {
  // Lutetium ausgenommen: steht hier bei den Lanthanoiden, wird aber zuletzt in 5d befüllt (Zuordnung umstritten)
  const Z = pick(pool.filter(z => z > 2 && z !== 71));
  const b = blockOf(Z);
  const cfg = configuration(Z, Z);
  return {
    ...mc(blk(b), [
      b === "d" ? d(blk("s"), "block-letzte-geschrieben", tr(`Nach Schalen geordnet steht ${el(Z).period}s² am Ende – befüllt wird aber zuletzt ${cfg[cfg.length - 1].key} → d-Block.`, `Ordered by shells, ${el(Z).period}s² comes last – but ${cfg[cfg.length - 1].key} is filled last → d block.`)) : null,
      b === "p" ? d(blk("s"), "block-letzte-geschrieben", tr(`Die s-Unterschale ist schon voll. Zuletzt befüllt wird ${cfg[cfg.length - 1].key} → p-Block.`, `The s subshell is already full. ${cfg[cfg.length - 1].key} is filled last → p block.`)) : null,
      ...["s", "p", "d", "f"].filter(x => x !== b).map(x => dis(blk(x), tr(`Zuletzt befüllt wird ${cfg[cfg.length - 1].key} → ${b}-Block, nicht ${x}-Block.`, `${cfg[cfg.length - 1].key} is filled last → ${b} block, not ${x} block.`))),
    ]),
    prompt: tr(`In welchem **Block** des Periodensystems steht **${el(Z).name}**?`, `In which **block** of the periodic table is **${el(Z).name}**?`),
    hint: tr("Der Block ist die Unterschale, die nach dem Aufbauprinzip zuletzt befüllt wird.", "The block is the subshell filled last according to the Aufbau principle."),
    explain: tr(`Nach dem Aufbauprinzip wird bei ${el(Z).name} zuletzt die **${cfg[cfg.length - 1].key}**-Unterschale befüllt → **${b}-Block**.`, `By the Aufbau principle, the **${cfg[cfg.length - 1].key}** subshell of ${el(Z).name} is filled last → **${b} block**.`),
  };
};

export const unpairedMC: Gen = pool => {
  const Z = pick(pool.filter(z => z <= 36 && noExc(z)));
  const cfg = configuration(Z);
  const u = unpairedElectrons(cfg);
  const last = cfg[cfg.length - 1];
  return {
    ...mc(String(u), [
      ...(last.count !== u && last.count <= 7 ? [d(String(last.count), "hund-alle-einzeln", tr(`In ${last.key} sitzen ${last.count} Elektronen, aber nur ${last.max / 2} Kästchen. Nach Hund werden erst alle Kästchen einzeln besetzt, dann wird gepaart.`, `${last.key} has ${last.count} electrons but only ${last.max / 2} boxes. By Hund's rule all boxes are filled singly first, then paired.`))] : []),
      ...(u !== 0 ? [d("0", "hund-alle-gepaart", tr(`Nach der Hund'schen Regel werden Kästchen gleicher Energie zuerst **einzeln** besetzt – in ${last.key}${sup(last.count)} bleiben Elektronen ungepaart.`, `By Hund's rule boxes of equal energy are filled **singly** first – in ${last.key}${sup(last.count)} electrons stay unpaired.`))] : []),
      ...nearNums(u, 0).map(n => dis(String(n), tr(`Kästchen zeichnen: ${last.key}${sup(last.count)} → ${u} ungepaart.`, `Draw the boxes: ${last.key}${sup(last.count)} → ${u} unpaired.`))),
    ]),
    prompt: tr(`Wie viele **ungepaarte Elektronen** hat ein **${el(Z).name}**-Atom im Grundzustand?`, `How many **unpaired electrons** does a **${el(Z).name}** atom have in the ground state?`),
    hint: tr("Zeichne die äußerste, nicht volle Unterschale als Kästchen und besetze nach der Hund'schen Regel.", "Draw the outermost subshell that is not full as boxes and fill by Hund's rule."),
    explain: tr(`${el(Z).name}: \`${shortConfigString(Z)}\`. In ${last.key}${sup(last.count)} ${u ? `${u === 1 ? "bleibt" : "bleiben"} **${u}** ${u === 1 ? "Elektron" : "Elektronen"} ungepaart (Hund'sche Regel).` : "sind alle Elektronen gepaart → **0**."}`,
      `${el(Z).name}: \`${shortConfigString(Z)}\`. In ${last.key}${sup(last.count)} ${u ? `**${u}** ${u === 1 ? "electron stays" : "electrons stay"} unpaired (Hund's rule).` : "all electrons are paired → **0**."}`),
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
      ...(wrong1 && wrong1 !== right ? [d(wrong1, "ion-3d-zuerst", tr("Kationen der Übergangsmetalle geben zuerst die **4s**-Elektronen ab (äußerste Schale), nicht die 3d-Elektronen.", "Transition metal cations lose the **4s** electrons first (outer shell), not the 3d electrons."))] : []),
      d(shortConfigString(Z), "ion-ladung-ignoriert", tr(`Das ist das neutrale Atom. Das Ion ${el(Z).symbol}${chargeSup(q)} hat ${fewerMore(q)}.`, `That is the neutral atom. The ion ${el(Z).symbol}${chargeSup(q)} has ${fewerMore(q)}.`)),
      d(shortConfigString(Z, Z + q), "ladung-vorzeichen", tr(`${q > 0 ? "Positiv heißt Elektronen **abgegeben**" : "Negativ heißt Elektronen **aufgenommen**"} – das Ion hat ${E} Elektronen.`, `${q > 0 ? "Positive means electrons **lost**" : "Negative means electrons **gained**"} – the ion has ${E} electrons.`)),
      shortConfigString(Z, E - 1), shortConfigString(Z, E + 1),
    ]),
    prompt: tr(`Welche Elektronenkonfiguration hat das Ion **${el(Z).symbol}${chargeSup(q)}**?`, `What is the electron configuration of the ion **${el(Z).symbol}${chargeSup(q)}**?`),
    visual: { kind: "fill", Z, E },
    hint: tm ? tr("Bei Übergangsmetall-Kationen werden zuerst die 4s-Elektronen abgegeben!", "Transition metal cations lose the 4s electrons first!") : tr(`Das Ion hat ${q > 0 ? "weniger" : "mehr"} Elektronen als das Atom.`, `The ion has ${q > 0 ? "fewer" : "more"} electrons than the atom.`),
    explain: tr(`${el(Z).symbol}${chargeSup(q)} hat ${E} Elektronen: \`${right}\`.`, `${el(Z).symbol}${chargeSup(q)} has ${E} electrons: \`${right}\`.`)
      + (tm ? tr(` Elektronen werden zuerst aus der äußersten Schale (4s) entfernt, nicht aus 3d – daher nicht \`${wrong1}\`.`, ` Electrons are removed from the outer shell (4s) first, not from 3d – so not \`${wrong1}\`.`) : ""),
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
  const wrongs = Object.entries(ISO).filter(([k]) => Number(k) !== g).flatMap(([k, v]) => v.map(x =>
    dis(lbl(x), tr(`${lbl(x)} hat ${x[0] - x[1]} Elektronen – wie ${el(Number(k)).name}, nicht wie ${el(g).name} (${g}).`, `${lbl(x)} has ${x[0] - x[1]} electrons – like ${el(Number(k)).name}, not like ${el(g).name} (${g}).`))));
  return {
    ...mc(lbl([Z, q]), [
      d(lbl([Z, -q]), "ladung-vorzeichen", tr(`${lbl([Z, -q])} hätte ${Z + q} Elektronen. Für ${g} Elektronen muss ${el(Z).name} ${q > 0 ? `${q} abgeben` : `${-q} aufnehmen`} → ${lbl([Z, q])}.`, `${lbl([Z, -q])} would have ${Z + q} electrons. For ${g} electrons ${el(Z).name} must ${q > 0 ? `lose ${q}` : `gain ${-q}`} → ${lbl([Z, q])}.`)),
      ...wrongs,
    ]),
    prompt: tr(`Welches Teilchen hat dieselbe Elektronenkonfiguration wie das Edelgas **${el(g).name}**?`, `Which particle has the same electron configuration as the noble gas **${el(g).name}**?`),
    hint: tr(`${el(g).name} hat ${g} Elektronen. Berechne die Elektronenzahl jedes Ions (Protonen − Ladung).`, `${el(g).name} has ${g} electrons. Work out the number of electrons of each ion (protons − charge).`),
    explain: tr(`${lbl([Z, q])}: ${P(Z)}, Ladung ${chargeLabel(q)} → ${g} Elektronen = **isoelektronisch** mit ${el(g).name} (\`${shortConfigString(g)}\`).`, `${lbl([Z, q])}: ${P(Z)}, charge ${chargeLabel(q)} → ${g} electrons = **isoelectronic** with ${el(g).name} (\`${shortConfigString(g)}\`).`),
  };
};

export const elementFromConfig: Gen = pool => {
  const Z = pick(pool.filter(z => z >= 3 && cfgOK(z)));
  const s = Math.random() < 0.5 || Z > 36 ? shortConfigString(Z) : configString(configuration(Z));
  return {
    ...mc(el(Z).name, [
      // Edelgaskern nicht mitgezählt: [Ne] 3s² 3p³ → nur 5 Elektronen
      ...(s.startsWith("[") && Z - coreOf(Z) >= 1 ? [d(el(Z - coreOf(Z)).name, "edelgaskern-vergessen",
        tr(`[${el(coreOf(Z)).symbol}] steht für ${coreOf(Z)} Elektronen. Dazurechnen: ${coreOf(Z)} + ${Z - coreOf(Z)} = ${Z} → ${el(Z).name}.`, `[${el(coreOf(Z)).symbol}] stands for ${coreOf(Z)} electrons. Add them: ${coreOf(Z)} + ${Z - coreOf(Z)} = ${Z} → ${el(Z).name}.`))] : []),
      ...neighbors(Z, maxOf(pool)).map(z => dis(el(z).name, tr(`${el(z).name} hätte ${El(z)}. Alle Hochzahlen zusammen ergeben ${Z}.`, `${el(z).name} would have ${El(z)}. All superscripts together give ${Z}.`))),
    ]),
    prompt: tr(`Welches Element hat die Konfiguration \`${s}\`?`, `Which element has the configuration \`${s}\`?`),
    hint: tr("Zähle alle Elektronen zusammen (bei [Edelgas] dessen Ordnungszahl dazurechnen).", "Add up all the electrons (for [noble gas] add its atomic number)."),
    explain: tr(`Summe der Elektronen = **${Z}** → **${el(Z).name}**.`, `Total electrons = **${Z}** → **${el(Z).name}**.`),
  };
};

export const periodGroupFromConfig: Gen = pool => {
  const Z = pick(pool.filter(z => z >= 3 && mainGroup(z) && noExc(z)));
  const e = el(Z), g = e.group!;
  const lbl = (p: number, gr: number) => tr(`${p}. Periode, Gruppe ${gr}`, `Period ${p}, group ${gr}`);
  return {
    ...mc(lbl(e.period, g), [
      d(lbl(e.period, g >= 13 ? g - 10 : g + 12), "hauptgruppe-vs-gruppe", tr(`Im Langperiodensystem zählen die Gruppen 1–18. ${Ae(valenceElectrons(Z)!)} ${g >= 13 ? `bei p-Elementen heißt Gruppe ${g} (10 + ${valenceElectrons(Z)})` : `heißt Gruppe ${g}`}.`,
        `In the long periodic table groups count 1–18. ${Ae(valenceElectrons(Z)!)} ${g >= 13 ? `for p elements means group ${g} (10 + ${valenceElectrons(Z)})` : `means group ${g}`}.`)),
      d(lbl(e.period + 1, g), "periode-n", tr(`Die Periode ist die **höchste Hauptquantenzahl** n in der Konfiguration – hier ${e.period}.`, `The period is the **highest principal quantum number** n in the configuration – here ${e.period}.`)),
      lbl(e.period, g <= 2 ? g + 1 : g - 1), lbl(e.period - 1 || 2, g),
    ]),
    prompt: tr(`Ein Element hat die Konfiguration \`${shortConfigString(Z)}\`. Wo steht es im Periodensystem?`, `An element has the configuration \`${shortConfigString(Z)}\`. Where is it in the periodic table?`),
    hint: tr("Höchste Hauptquantenzahl n = Periode. Anzahl der Außenelektronen (s + p) → Hauptgruppe.", "Highest principal quantum number n = period. Number of outer electrons (s + p) → main group."),
    explain: tr(`Höchstes n = ${e.period} → ${e.period}. Periode. ${Ae(valenceElectrons(Z)!)} → Gruppe ${g}`, `Highest n = ${e.period} → period ${e.period}. ${Ae(valenceElectrons(Z)!)} → group ${g}`) + `${GROUP_NAMES[g] ? ` (${GROUP_NAMES[g]})` : ""}: **${e.name}**.`,
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
    T("particles", tr("Teilchen aus dem Atomsymbol", "Particles from the nuclide symbol"), p => readParticles(p)),
    T("mass", tr("Massenzahl", "Mass number"), massNumber),
    T("fromProtons", tr("Element aus der Protonenzahl", "Element from the proton number"), elementFromProtons),
    T("pse", tr("Elemente im PSE finden", "Finding elements in the PT"), pseFind(false, false)),
    T("pseGroup", tr("Periode und Hauptgruppe im PSE", "Period and main group in the PT"), pseFind(false, true)),
    T("buildAtom", tr("Atome bauen", "Building atoms"), p => buildAtom(p)),
    T("fromBohr", tr("Bohrmodell lesen", "Reading the Bohr model"), elementFromBohr),
    T("shells", tr("Schalen füllen", "Filling shells"), fillShells),
    T("outer", tr("Außenelektronen", "Outer electrons"), outerElectrons),
    T("period", tr("Schalen und Perioden", "Shells and periods"), periodFromShells),
    T("ionCharge", tr("Ionenladung", "Ion charge"), ionCharge),
    T("isotope", tr("Isotope", "Isotopes"), isotopeNeutrons),
    T("typicalIon", tr("Typische Ionen", "Typical ions"), typicalIon),
    T("buildIon", tr("Ionen bauen", "Building ions"), p => buildAtom(p, true)),
    T("isoCompare", tr("Isotope vergleichen", "Comparing isotopes"), isotopeCompare),
  ]),
  os: byId([
    T("particles", tr("Teilchen aus dem Atomsymbol", "Particles from the nuclide symbol"), p => readParticles(p, true)),
    T("nuclide", tr("Atomsymbol schreiben", "Writing nuclide symbols"), nuclideInput),
    T("isotope", tr("Isotope", "Isotopes"), isotopeNeutrons),
    T("fromProtons", tr("Element aus der Protonenzahl", "Element from the proton number"), elementFromProtons),
    T("pse", tr("Elemente im PSE finden", "Finding elements in the PT"), pseFind(true, true)),
    T("config", tr("Elektronenkonfiguration", "Electron configuration"), configMC),
    T("short", tr("Kurzschreibweise", "Short notation"), shortConfigMC),
    T("boxes", tr("Kästchenschema", "Box diagram"), fillBoxes),
    T("block", tr("Blöcke im PSE", "Blocks in the PT"), blockMC),
    T("unpaired", tr("Ungepaarte Elektronen", "Unpaired electrons"), unpairedMC),
    T("ionConfig", tr("Konfiguration von Ionen", "Configuration of ions"), ionConfigMC),
    T("isoelectronic", tr("Isoelektronische Teilchen", "Isoelectronic particles"), isoelectronic),
    T("fromConfig", tr("Element aus der Konfiguration", "Element from the configuration"), elementFromConfig),
    T("periodGroup", tr("Periode und Gruppe", "Period and group"), periodGroupFromConfig),
    T("typicalIon", tr("Typische Ionen", "Typical ions"), typicalIon),
  ]),
};

export interface Level { id: string; name: string; desc: string; types: string[] }
export const LEVELS: Record<Stufe, Level[]> = {
  us: [
    { id: "us-1", name: tr("Teilchen im Atom", "Particles in the atom"), desc: tr("Protonen, Neutronen, Elektronen und Massenzahl", "Protons, neutrons, electrons and mass number"),
      types: ["particles", "mass", "fromProtons", "pse", "buildAtom"] },
    { id: "us-2", name: tr("Schalenmodell", "Shell model"), desc: tr("Bohrmodell lesen, Schalen füllen, Außenelektronen", "Reading the Bohr model, filling shells, outer electrons"),
      types: ["fromBohr", "shells", "outer", "period", "pseGroup"] },
    { id: "us-3", name: tr("Ionen & Isotope", "Ions & isotopes"), desc: tr("Ladungen, Isotope und Edelgasregel", "Charges, isotopes and the noble gas rule"),
      types: ["ionCharge", "isotope", "typicalIon", "buildIon", "isoCompare"] },
  ],
  os: [
    { id: "os-1", name: tr("Atombau & Nuklide", "Atomic structure & nuclides"), desc: tr("Atomsymbole lesen und schreiben, Ionen, Isotope", "Reading and writing nuclide symbols, ions, isotopes"),
      types: ["particles", "nuclide", "isotope", "fromProtons", "pse"] },
    { id: "os-2", name: tr("Elektronenkonfiguration", "Electron configuration"), desc: tr("Aufbauprinzip, Kästchenschema, Hund'sche Regel", "Aufbau principle, box diagram, Hund's rule"),
      types: ["config", "short", "boxes", "block", "unpaired"] },
    { id: "os-3", name: tr("Ionen & Periodensystem", "Ions & periodic table"), desc: tr("Ionenkonfigurationen, isoelektronische Teilchen", "Ion configurations, isoelectronic particles"),
      types: ["ionConfig", "isoelectronic", "fromConfig", "periodGroup", "typicalIon"] },
  ],
};

/** Zahl = Level, "mix" = alle Level gemischt, "weak" = die schwächsten Aufgabentypen, "due" = heute fällige Wiederholungen */
export type LevelKey = number | "mix" | "weak" | "due";
export const levelId = (stufe: Stufe, level: LevelKey) => (typeof level === "number" ? LEVELS[stufe][level].id : `${stufe}-${level}`);
export const levelName = (stufe: Stufe, level: LevelKey) =>
  level === "mix" ? tr("Alles gemischt", "Everything mixed") : level === "weak" ? tr("Schwächen üben", "Practise weak spots") : level === "due" ? tr("Heute fällig", "Due today") : LEVELS[stufe][level].name;

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
