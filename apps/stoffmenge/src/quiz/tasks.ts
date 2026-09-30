// Quiz-Aufgaben zur Stoffmenge (reine Daten). Aufgabentyp = Fertigkeit.
// Antwortformen: "mc" (Auswahl), "num" (Zahl eintippen), "steps" (Rechenweg in zwei Schritten ausfüllen).

import {
  MOLE_SUBSTANCES, BY_SYMBOL, schoolMass, molarMass, molarMassText, molarMassSteps, massOf, particles, gasVolume, fmt, fmtParticles, round, toSubscript,
  MOLAR_VOLUME, type MoleSubstance,
} from "@lern/chem";
import { buildRound, dis, mc, pick, weakTypes, type BaseTask, type Distractor, type LevelKey, type McTask, type QuizLevel, type TypeStats } from "@lern/quiz";

export interface StepField { id: string; label: string; unit: string; answer: number }
export type Task =
  | (McTask & { mark?: string })
  | (BaseTask & { kind: "num"; answer: number; unit: string; mark?: string })
  | (BaseTask & { kind: "steps"; fields: StepField[]; mark?: string });

const NICE_N = [0.5, 1, 2, 2, 3, 4, 5, 10];
const ELS = ["H", "C", "N", "O", "Na", "Mg", "Al", "S", "Cl", "K", "Ca", "Fe", "Cu", "Zn"];
const g = (x: number) => `${fmt(x)} g`;
const molL = (x: number) => `${fmt(x)} g/mol`;
const nums = (right: number, cands: number[], unit: (x: number) => string): Distractor[] =>
  [...new Set(cands.filter(x => x > 0 && round(x) !== round(right)))].map(x => unit(x));
const sub = (s: MoleSubstance) => toSubscript(s.formula);

// ── Fertigkeiten ────────────────────────────────────────────────────────────

/** Atommasse aus dem PSE ablesen (Auswahl oder Zahl) – ohne PSE-Hilfsmittel, sonst wäre es abgelesen */
function atommasse(): Task {
  const sym = pick(ELS);
  const e = BY_SYMBOL[sym], A = schoolMass(sym);
  const base = {
    prompt: `Welche **Atommasse** hat **${e.name}** (${sym}) laut Periodensystem?`,
    hint: "Die Atommasse steht im PSE meist unter dem Symbol – sie ist größer als die Ordnungszahl (Protonen + Neutronen).",
    explain: `${e.name}: Ordnungszahl ${e.Z}, **Atommasse ${fmt(A)}** (u bzw. g/mol).`,
  };
  if (Math.random() < 0.4) return { kind: "num", answer: A, unit: "u", ...base };
  return {
    ...mc(fmt(A), [
      e.Z !== A ? dis(fmt(e.Z), `${fmt(e.Z)} ist die **Ordnungszahl** (Protonen). Die Atommasse ist größer, weil die Neutronen dazukommen.`) : null,
      dis(fmt(2 * e.Z), "Die Atommasse ist nicht einfach das Doppelte der Ordnungszahl – nachschauen, nicht schätzen."),
      ...nums(A, [A + 1, A - 1, A + 2, A * 2, A / 2], fmt),
    ]),
    ...base,
  };
}

/** Molare Masse einer Verbindung berechnen (Zahl oder Auswahl) */
function molmasse(): Task {
  const s = pick(MOLE_SUBSTANCES.filter(x => molarMassSteps(x.formula).length >= 2 || Math.random() < 0.3));
  const M = molarMass(s.formula);
  const steps = molarMassSteps(s.formula);
  const noIndex = round(steps.reduce((a, st) => a + st.mass, 0), 1);
  const base = {
    mark: s.formula,
    prompt: `Berechne die **molare Masse** von **${s.name}** (${sub(s)}).`,
    hint: `Atommassen aus dem PSE, jedes Atom so oft wie sein Index: ${steps.map(st => `${st.n} × ${st.el}`).join(", ")}.`,
    explain: `**${molarMassText(s.formula)}**.`,
    praise: "Index mal Atommasse, dann addiert – genau so geht's.",
  };
  if (Math.random() < 0.5) return { kind: "num", answer: M, unit: "g/mol", ...base };
  return {
    ...mc(molL(M), [
      noIndex !== M ? dis(molL(noIndex), "Der **Index** zählt: jedes Atom so oft, wie es in der Formel vorkommt (H₂O: 2 · H).") : null,
      dis(molL(round(steps.reduce((a, st) => a + st.n * BY_SYMBOL[st.el].Z, 0), 1)), "Das sind die **Ordnungszahlen** addiert – für M braucht man die **Atommassen**."),
      ...nums(M, [M + 2, M - 2, M * 2, M + 10], molL),
    ]),
    ...base,
  };
}

/** n = m / M – als Rechenweg (M, dann n) oder Zahl oder Auswahl */
function stoffmenge(): Task {
  const s = pick(MOLE_SUBSTANCES);
  const M = molarMass(s.formula);
  const n = pick(NICE_N);
  const m = round(massOf(n, M), 1);
  const base = {
    mark: s.formula,
    prompt: `Welche **Stoffmenge** sind **${g(m)} ${s.name}** (${sub(s)})?`,
    hint: `Zuerst M aus dem PSE (${molarMassText(s.formula)}), dann n = m / M.`,
    explain: `${molarMassText(s.formula)}. n = m / M = ${g(m)} / ${molL(M)} = **${fmt(n)} mol**.`,
    praise: "Erst M, dann m durch M – genau so geht's.",
  };
  const r = Math.random();
  if (r < 0.4) return { kind: "steps", fields: [{ id: "M", label: "M", unit: "g/mol", answer: M }, { id: "n", label: "n = m / M", unit: "mol", answer: n }], ...base };
  if (r < 0.7) return { kind: "num", answer: n, unit: "mol", ...base };
  return {
    ...mc(`${fmt(n)} mol`, [
      dis(`${fmt(round(m * M))} mol`, "m **mal** M ergibt keine Stoffmenge. Die Masse wird durch die molare Masse **geteilt**: n = m / M."),
      n !== 1 ? dis(`${fmt(round(M / m))} mol`, "Verkehrt herum geteilt: n = **m / M**, also Masse durch molare Masse.") : null,
      ...nums(n, [n * 2, n / 2, n + 1, n + 0.5], x => `${fmt(x)} mol`),
    ]),
    ...base,
  };
}

/** m = n · M */
function masse(): Task {
  const s = pick(MOLE_SUBSTANCES);
  const M = molarMass(s.formula);
  const n = pick(NICE_N);
  const m = round(massOf(n, M), 1);
  const base = {
    mark: s.formula,
    prompt: `Wie viel **wiegen ${fmt(n)} mol ${s.name}** (${sub(s)})?`,
    hint: `M aus dem PSE, dann m = n · M.`,
    explain: `${molarMassText(s.formula)}. m = n · M = ${fmt(n)} mol · ${molL(M)} = **${g(m)}**.`,
    praise: "n mal M gerechnet – genau so geht's.",
  };
  if (Math.random() < 0.5) return { kind: "num", answer: m, unit: "g", ...base };
  return {
    ...mc(g(m), [
      n !== 1 ? dis(g(round(M / n, 1)), "M **durch** n ergibt keine Masse. Stoffmenge **mal** molare Masse: m = n · M.") : null,
      n !== 1 ? dis(g(M), `${g(M)} wäre nur **1 mol**. Hier sind es ${fmt(n)} mol → mal ${fmt(n)}.`) : null,
      ...nums(m, [m * 2, m / 2, m + M, m - M], g),
    ]),
    ...base,
  };
}

/** Die richtige Formel bzw. Bedeutung von mol (Auswahl) */
function formel(): Task {
  const mode = pick(["n", "m", "M", "mol", "einheit", "gas"]);
  if (mode === "einheit") {
    const q = pick([
      { what: "Stoffmenge n", unit: "mol", why: { g: "Gramm ist die Einheit der **Masse** m.", "g/mol": "g/mol ist die Einheit der **molaren Masse** M." } },
      { what: "molare Masse M", unit: "g/mol", why: { g: "Gramm allein ist die Masse m. M sagt, wie viel **1 mol** wiegt → g **pro mol**.", mol: "mol ist die Einheit der **Stoffmenge** n." } },
      { what: "Masse m", unit: "g", why: { mol: "mol zählt Teilchen (Stoffmenge n), wiegt aber nichts.", "g/mol": "g/mol ist die molare Masse M – Masse **pro mol**." } },
    ]);
    return {
      ...mc(q.unit, [...Object.entries(q.why).map(([u, w]) => dis(u, w)), "l", "u"].filter(x => (typeof x === "string" ? x !== q.unit : true))),
      prompt: `Welche **Einheit** hat die **${q.what}**?`,
      hint: "m in g · n in mol · M in g/mol (Masse pro mol).",
      explain: `${q.what}: **${q.unit}**.`,
    };
  }
  if (mode === "gas") {
    const s = pick(MOLE_SUBSTANCES.filter(x => x.gas));
    return {
      ...mc("22,4 l", [
        dis(`${fmt(molarMass(s.formula))} l`, `${fmt(molarMass(s.formula))} ist die molare Masse in **g/mol** – das Volumen von 1 mol Gas ist immer 22,4 l.`),
        dis("1 l", "1 mol Gas füllt bei Normbedingungen 22,4 l – mehr als ein Kübel."),
        dis("6,022 · 10²³ l", "6,022 · 10²³ ist die **Teilchenzahl** in 1 mol, kein Volumen."),
      ]),
      prompt: `Welches **Volumen** hat **1 mol ${s.name}** (${sub(s)}) bei Normbedingungen?`,
      hint: "Für alle Gase gilt derselbe Wert.",
      explain: `1 mol Gas = **22,4 l** (Normbedingungen), egal ob ${s.name} oder ein anderes Gas.`,
    };
  }
  if (mode === "mol") {
    return {
      ...mc("6,022 · 10²³ Teilchen", [
        dis("1 Gramm eines Stoffs", "1 mol ist eine **Teilchenzahl**, keine Masse. Wie viel 1 mol wiegt, hängt vom Stoff ab (M)."),
        dis("1 Liter eines Stoffs", "1 mol ist eine **Teilchenzahl**. Nur bei Gasen sind es immer 22,4 l."),
        dis("100 Teilchen", "Teilchen sind winzig – 1 mol sind 602 Trilliarden (6,022 · 10²³)."),
      ]),
      prompt: "Was ist **1 mol**?",
      hint: "Wie „ein Dutzend“ = 12 Stück, nur eine riesige Zahl.",
      explain: "**1 mol = 6,022 · 10²³ Teilchen** (Avogadro-Zahl) – eine Packungseinheit für Atome und Moleküle.",
    };
  }
  const want = mode === "n" ? "n" : mode === "m" ? "m" : "M";
  const s = pick(MOLE_SUBSTANCES);
  const M = molarMass(s.formula), n = pick(NICE_N), m = round(massOf(n, M), 1);
  const given = want === "n" ? `${g(m)} ${s.name}, M = ${molL(M)}` : want === "m" ? `${fmt(n)} mol ${s.name}, M = ${molL(M)}` : `${g(m)} ${s.name} sind ${fmt(n)} mol`;
  const right = want === "n" ? "n = m / M" : want === "m" ? "m = n · M" : "M = m / n";
  const wrongs: Distractor[] = want === "n"
    ? [dis("n = m · M", "Mal gerechnet käme eine riesige Zahl heraus. Die Masse wird durch die molare Masse **geteilt**."), dis("n = M / m", "Verkehrt herum: die **Masse** wird durch M geteilt, nicht M durch die Masse."), "n = m − M"]
    : want === "m"
      ? [dis("m = n / M", "Geteilt käme fast nichts heraus. Jedes mol wiegt M Gramm → **mal**."), dis("m = M / n", "Verkehrt herum: mehr mol wiegen **mehr**, also mal n."), "m = n + M"]
      : [dis("M = m · n", "M ist die Masse **pro mol** → Masse geteilt durch mol."), dis("M = n / m", "Verkehrt herum: Masse durch Stoffmenge, nicht umgekehrt."), "M = m − n"];
  return {
    ...mc(right, wrongs),
    prompt: `Gegeben: ${given}. Gesucht ist die **${want === "n" ? "Stoffmenge n" : want === "m" ? "Masse m" : "molare Masse M"}**. Welche Formel passt?`,
    hint: "M ist die Masse von 1 mol (g/mol). Einheiten mitdenken: g / (g/mol) = mol.",
    explain: `**${right}** – ${want === "n" ? "Masse durch molare Masse." : want === "m" ? "Stoffmenge mal molare Masse." : "Masse durch Stoffmenge (Masse von 1 mol)."}`,
  };
}

/** Teilchenzahl N = n · N_A (Auswahl mit Zehnerpotenzen) */
function teilchen(): Task {
  const s = pick(MOLE_SUBSTANCES);
  const n = pick([0.5, 1, 2, 3, 5, 10]);
  const N = particles(n);
  return {
    ...mc(fmtParticles(N), [
      n !== 1 ? dis(fmtParticles(particles(1)), `Das ist **1 mol**. Hier sind es ${fmt(n)} mol → mal ${fmt(n)}.`) : null,
      dis(fmtParticles(N * 10), "Zehnerpotenz um 1 zu hoch – N = n · 6,022 · 10²³."),
      dis(fmtParticles(N / 10), "Zehnerpotenz um 1 zu niedrig – N = n · 6,022 · 10²³."),
      fmtParticles(particles(n * 2)),
    ]),
    prompt: `Wie viele **Teilchen** sind **${fmt(n)} mol ${s.name}** (${sub(s)})?`,
    hint: "1 mol = 6,022 · 10²³ Teilchen. Mal der Stoffmenge.",
    explain: `N = n · Nₐ = ${fmt(n)} · 6,022 · 10²³ = **${fmtParticles(N)}**.`,
  };
}

/** Gasvolumen V = n · 22,4 l (Zahl) und zurück */
function volumen(): Task {
  const s = pick(MOLE_SUBSTANCES.filter(x => x.gas));
  const n = pick([0.5, 1, 2, 3, 5, 10]);
  const V = round(gasVolume(n), 1);
  if (Math.random() < 0.5) {
    return {
      kind: "num", answer: V, unit: "l", mark: s.formula,
      prompt: `Welches **Volumen** haben **${fmt(n)} mol ${s.name}** (${sub(s)}) bei Normbedingungen?`,
      hint: "1 mol Gas = 22,4 l – egal welches Gas.",
      explain: `V = n · ${fmt(MOLAR_VOLUME)} l/mol = ${fmt(n)} · 22,4 l = **${fmt(V)} l**.`,
      praise: "Mit 22,4 l pro mol gerechnet – genau so geht's.",
    };
  }
  return {
    ...mc(`${fmt(n)} mol`, [
      dis(`${fmt(round(V / molarMass(s.formula)))} mol`, "Bei **Gasvolumen** rechnest du mit 22,4 l/mol. Die molare Masse gilt nur für Gramm."),
      dis(`${fmt(round(V * MOLAR_VOLUME))} mol`, "Liter **durch** 22,4 l/mol – nicht mal."),
      ...nums(n, [n * 2, n / 2, n + 1], x => `${fmt(x)} mol`),
    ]),
    mark: s.formula,
    prompt: `**${fmt(V)} l ${s.name}** (${sub(s)}, Normbedingungen) – welche Stoffmenge ist das?`,
    hint: "n = V / 22,4 l/mol.",
    explain: `n = V / ${fmt(MOLAR_VOLUME)} l/mol = ${fmt(V)} / 22,4 = **${fmt(n)} mol**.`,
  };
}

// ── Level und Runden ────────────────────────────────────────────────────────

const GENS: Record<string, () => Task> = { atommasse, molmasse, formel, stoffmenge, masse, teilchen, volumen };

export const TYPE_NAMES: Record<string, string> = {
  atommasse: "Atommasse ablesen", molmasse: "Molare Masse", formel: "Die richtige Formel", stoffmenge: "n = m / M",
  masse: "m = n · M", teilchen: "Teilchenzahl", volumen: "Gasvolumen",
};

interface Level extends QuizLevel { types: string[] }
export const LEVELS: Level[] = [
  { id: "us-1", name: "Molare Masse", desc: "Atommassen aus dem PSE, M einer Verbindung", types: ["atommasse", "molmasse", "formel"] },
  { id: "us-2", name: "n = m / M", desc: "Von der Masse zur Stoffmenge und zurück", types: ["stoffmenge", "masse", "formel"] },
  { id: "us-3", name: "Teilchen und Gase", desc: "6,022 · 10²³ Teilchen, 22,4 l pro mol", types: ["teilchen", "volumen", "stoffmenge"] },
];

export const levelId = (_stufe: string, level: LevelKey) => (typeof level === "number" ? LEVELS[level].id : `us-${level}`);
export const levelName = (_stufe: string, level: LevelKey) =>
  level === "mix" ? "Alles gemischt" : level === "weak" ? "Schwächen üben" : level === "due" ? "Heute fällig" : LEVELS[level].name;

export function makeRound(_stufe: string, level: LevelKey, stats?: TypeStats, due: string[] = []): Task[] {
  let ids = level === "mix" ? [...new Set(LEVELS.flatMap(l => l.types))]
    : level === "weak" ? weakTypes(stats, id => LEVELS.some(l => l.types.includes(id)))
    : level === "due" ? due.filter(id => LEVELS.some(l => l.types.includes(id)))
    : LEVELS[level].types;
  if (!ids.length) ids = LEVELS[0].types;
  return buildRound(ids, GENS, 10);
}

/** nur für Tests */
export const GENERATORS = GENS;
