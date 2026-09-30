// Quiz-Aufgaben zu Reaktionsgleichungen (reine Daten). Aufgabentyp = Fertigkeit.
// Antwortformen: "mc" (Auswahl), "num" (Zahl eintippen), "balance" (Koeffizienten setzen).
// Je Stufe vier Level = Niveau 1–4 (Reaktionen tragen ihr Niveau, siehe REACTIONS in @lern/chem).

import { REACTION_BY_ID, reactionsFor, parseFormula, sideCounts, elementsOf, equationText, isBalanced, unbalancedElements, speciesName, toSubscript, type Niveau, type Reaction } from "@lern/chem";
import { buildRound, dis, mc, pick, shuffle, weakTypes, type BaseTask, type LevelKey, type McTask, type QuizLevel, type TypeStats } from "@lern/quiz";

/** eq: Gleichung, die groß über der Frage steht (renderVisual) */
type WithEq = { eq?: string };
export type Task =
  | (McTask & WithEq)
  | (BaseTask & WithEq & { kind: "num"; answer: number })
  | (BaseTask & { kind: "balance"; reaction: string });

const ELEMENT_NAMES: Record<string, string> = {
  H: "Wasserstoff", O: "Sauerstoff", N: "Stickstoff", C: "Kohlenstoff", Cl: "Chlor", S: "Schwefel", Na: "Natrium", K: "Kalium",
  Mg: "Magnesium", Ca: "Calcium", Al: "Aluminium", Fe: "Eisen", Cu: "Kupfer", Zn: "Zink", Hg: "Quecksilber", Ag: "Silber", P: "Phosphor", Li: "Lithium",
  Ba: "Barium", Pb: "Blei", I: "Iod", Mn: "Mangan", Cr: "Chrom",
};
const elName = (el: string) => ELEMENT_NAMES[el] ?? el;
const eqBal = (r: Reaction) => equationText(r, r.coeffs);
const wrongNums = (right: number, cands: number[]) => cands.filter(x => x !== right && x > 0).map(String);

// ── Fertigkeiten ────────────────────────────────────────────────────────────

type Stufe = "us" | "os";
const pool = (s: Stufe, ...nv: Niveau[]) => reactionsFor(s, ...nv);

/** Atome zählen: Wie viele X-Atome stecken in 3 H₂O? Oberstufe bevorzugt Formeln mit Klammern (Ca(OH)₂, Al₂(SO₄)₃). */
function zaehlen(s: Stufe): Task {
  const rs = pool(s, 1, 2, 3);
  const all = [...new Set(rs.flatMap(r => [...r.left, ...r.right]))].filter(f => Object.values(parseFormula(f)).some(n => n > 1) || f.includes("("));
  const brackets = all.filter(f => f.includes("("));
  const f = s === "os" && brackets.length && Math.random() < 0.6 ? pick(brackets) : pick(all);
  const counts = parseFormula(f);
  const el = pick(Object.keys(counts));
  const n = pick([1, 2, 2, 3, 3, 4, 5]);
  const per = counts[el], total = n * per;
  const text = `${n === 1 ? "" : `${n} `}${toSubscript(f)}`;
  const inner = f.includes("(") && new RegExp(`\\([^)]*${el}(?![a-z])`).test(f);
  const base = {
    praise: n === 1 ? "Index richtig gelesen – genau so geht's." : "Große Zahl mal kleine Zahl gerechnet – genau so geht's.",
    prompt: `Wie viele **${elName(el)}-Atome** (${el}) stecken in \`${text}\`?`,
    hint: inner
      ? "Die Zahl hinter der Klammer gilt für alles in der Klammer; die große Zahl vorne für den ganzen Stoff."
      : `Die kleine Zahl (Index) gehört zum Atom davor. Die große Zahl vorne zählt für den ganzen Stoff: ${n} · ${per}.`,
    explain: `In ${toSubscript(f)} ${per === 1 ? "steckt 1 " + el + "-Atom" : `stecken ${per} ${el}-Atome`}. ${n === 1 ? "" : `${n} Teilchen → ${n} · ${per} = `}**${total}**.`,
  };
  if (Math.random() < 0.5) return { kind: "num", answer: total, ...base };
  const plain = inner ? parseFormula(f.replace(/\)\d+/g, ")"))[el] : 0;
  return {
    ...mc(String(total), [
      n > 1 && per > 1 ? dis(String(n + per), `${n} + ${per} addiert – Koeffizient und Index werden multipliziert: ${n} · ${per} = ${total}.`) : null,
      n > 1 ? dis(String(per), `Nur im Teilchen gezählt – vorne stehen ${n} Teilchen: ${n} · ${per} = ${total}.`) : null,
      per > 1 ? dis(String(n), `Nur die große Zahl gezählt – jedes Teilchen hat ${per} ${el}-Atome: ${n} · ${per} = ${total}.`) : null,
      inner && plain && plain !== per ? dis(String(n * plain), `Die Zahl hinter der Klammer vergessen – sie gilt für alles darin: ${per} ${el} je Teilchen.`) : null,
      ...wrongNums(total, [total * 2, total + 1, total - 1, total + 2, total + 3]),
    ]),
    ...base,
  };
}

/** Ausgeglichen? Gleichung mit gesetzten Koeffizienten prüfen (Auswahl) */
function pruefen(s: Stufe): Task {
  const r = pick(pool(s, 1, 2, 3));
  const els = elementsOf(r);
  let coeffs = [...r.coeffs];
  const ok = Math.random() < 0.4;
  if (!ok) {
    // eine Zahl verändern, sodass die Bilanz nicht mehr stimmt
    do {
      coeffs = [...r.coeffs];
      const k = Math.floor(Math.random() * coeffs.length);
      coeffs[k] = coeffs[k] === 1 ? 2 : Math.random() < 0.5 ? coeffs[k] - 1 : coeffs[k] + 1;
    } while (isBalanced(r, coeffs));
  }
  const wrong = unbalancedElements(r, coeffs);
  // Elementsymbole statt Namen: kurz, damit alle Antworten auch auf schmalen Handys Platz haben
  const list = (xs: string[]) => (xs.length === 1 ? xs[0] : `${xs.slice(0, -1).join(", ")} und ${xs[xs.length - 1]}`);
  const right = ok ? "Ja, ausgeglichen" : `Nein – ${list(wrong)} ${wrong.length === 1 ? "stimmt" : "stimmen"} nicht`;
  const wrongs = [
    ok ? null : "Ja, ausgeglichen",
    ...els.filter(e => !wrong.includes(e)).map(e => `Nein – ${e} stimmt nicht`),
    ...(wrong.length > 1 ? wrong.map(e => `Nein – ${e} stimmt nicht`) : []),
  ];
  const l = sideCounts(r.left, coeffs.slice(0, r.left.length)), rr = sideCounts(r.right, coeffs.slice(r.left.length));
  return {
    ...mc(right, wrongs),
    eq: equationText(r, coeffs),
    praise: "Jedes Element einzeln gezählt – genau so geht's.",
    prompt: "Ist diese Gleichung ausgeglichen?",
    hint: "Zähle jedes Element links und rechts einzeln. Große Zahl vorne · kleine Zahl im Stoff.",
    explain: els.map(e => `${e}: ${l[e] ?? 0} | ${rr[e] ?? 0}`).join(", ") + (ok ? " → **ausgeglichen** ✓" : ` → **${wrong.join(", ")}** ungleich. Richtig: ${eqBal(r)}`),
  };
}

/** Ein Koeffizient fehlt (Auswahl oder Zahl eintippen) */
function koeffizient(rs: Reaction[]): Task {
  const r = pick(rs.filter(x => x.coeffs.some(c => c > 1)));
  const idx = shuffle(r.coeffs.map((_, i) => i).filter(i => r.coeffs[i] > 1 || Math.random() < 0.3))[0];
  const shown: (number | null)[] = r.coeffs.map((c, i) => (i === idx ? null : c));
  const f = [...r.left, ...r.right][idx];
  const ans = r.coeffs[idx];
  const base = {
    eq: equationText(r, shown),
    prompt: `Welche Zahl gehört vor \`${toSubscript(f)}\`?`,
    hint: `Zähle ein Element, das in ${toSubscript(f)} steckt, auf der anderen Seite – so viele Atome brauchst du auch hier.`,
    explain: `${eqBal(r)} → vor ${toSubscript(f)} steht **${ans === 1 ? "1 (wird nicht geschrieben)" : ans}**.`,
  };
  if (Math.random() < 0.4) return { kind: "num", answer: ans, ...base };
  return { ...mc(String(ans), wrongNums(ans, shuffle([1, 2, 3, 4, 5, 6, ans - 1, ans + 1, ans + 2, ans * 2]))), ...base };
}

const HINTS: Record<Stufe, string[]> = {
  us: [
    "Zähle jedes Element links und rechts. Fehlt eines, die Zahl vor dem Stoff erhöhen – nie die Formel ändern.",
    "Beginne mit dem Element, das nur in je einem Stoff links und rechts vorkommt. Sauerstoff meist zuletzt. Am Ende kleinste ganze Zahlen.",
    "Verbrennung: zuerst C (→ CO₂), dann H (→ H₂O), zuletzt O₂ – das enthält nur Sauerstoff.",
    "Brauchst du eine halbe Zahl (z. B. 3½ O₂)? Dann alle Zahlen verdoppeln.",
  ],
  os: [
    "SO₄, NO₃, PO₄ … bleiben erhalten – zähle sie wie ein Atom. Dann Metall, zuletzt H und O (Wasser).",
    "Zuerst das Element, das nur in je einem Stoff steht; H und O zuletzt. Ionen als Block zählen.",
    "Metall bzw. Nichtmetall zuerst, dann Cl bzw. N, dann H (→ H₂O), zuletzt O₂ oder Cl₂ – sie enthalten nur ein Element.",
    "Reine Elemente (O₂, Cl₂) zuletzt einstellen. Halbe Zahl nötig? Alles verdoppeln. Bei HNO₃/HCl: nicht jedes N bzw. Cl landet im Salz.",
  ],
};

/** Ganze Gleichung ausgleichen (Koeffizienten setzen) auf einem Niveau */
function ausgleichen(s: Stufe, nv: Niveau): Task {
  const r = pick(pool(s, nv).filter(x => x.coeffs.some(c => c > 1)));
  return {
    kind: "balance", reaction: r.id,
    praise: nv >= 3 ? "Schwierige Gleichung ausgeglichen und gekürzt – stark." : "Element für Element ausgeglichen und gekürzt – genau so geht's.",
    prompt: `Gleiche die Gleichung aus: **${r.title}**`,
    hint: HINTS[s][nv - 1],
    explain: `**${eqBal(r)}** – ${elementsOf(r).map(e => `${e}: ${sideCounts(r.left, r.coeffs.slice(0, r.left.length))[e]}`).join(", ")} auf beiden Seiten.`,
  };
}

/** Wortgleichung → Formelgleichung bzw. Produkt erkennen (Auswahl) */
function wort(s: Stufe): Task {
  const rs = pool(s, 1, 2, 3);
  const r = pick(rs);
  const words = `${r.left.map(speciesName).join(" + ")} → ${r.right.map(speciesName).join(" + ")}`;
  if (Math.random() < 0.5) {
    // Welche Gleichung passt zur Wortgleichung?
    const others = shuffle(rs.filter(x => x.id !== r.id)).slice(0, 2).map(eqBal);
    const unbalanced = equationText(r);
    const swapped = equationText({ left: r.right, right: r.left }, [...r.coeffs.slice(r.left.length), ...r.coeffs.slice(0, r.left.length)]);
    return {
      ...mc(eqBal(r), [
        unbalanced === eqBal(r) ? null : dis(unbalanced, "Die Stoffe stimmen, aber die Atome sind nicht ausgeglichen – die Zahlen davor fehlen."),
        dis(swapped, "Seiten vertauscht: Ausgangsstoffe stehen links vom Pfeil, Produkte rechts."),
        ...others,
      ]),
      eq: words,
      prompt: "Welche Gleichung passt zur Wortgleichung?",
      hint: "Links stehen die Ausgangsstoffe (Edukte), rechts die Produkte – und die Atome müssen ausgeglichen sein.",
      explain: `**${eqBal(r)}**`,
    };
  }
  // Welcher Stoff ist Produkt / Edukt?
  const askProduct = Math.random() < 0.6;
  const inPool = askProduct ? r.right : r.left, otherPool = askProduct ? r.left : r.right;
  const right = pick(inPool);
  const side = askProduct ? "links – das ist ein Ausgangsstoff" : "rechts – das ist ein Produkt";
  const wrongs = [
    ...otherPool.filter(f => !inPool.includes(f)).map(f => dis(toSubscript(f), `${toSubscript(f)} steht ${side}.`)),
    ...shuffle(rs.flatMap(x => [...x.left, ...x.right])).filter(f => !inPool.includes(f) && !otherPool.includes(f)).slice(0, 3).map(toSubscript),
  ];
  return {
    ...mc(toSubscript(right), wrongs),
    eq: eqBal(r),
    prompt: `**${r.title}:** Welcher Stoff ist ein **${askProduct ? "Produkt" : "Edukt (Ausgangsstoff)"}**?`,
    hint: "Edukte stehen links vom Pfeil, Produkte rechts.",
    explain: `${askProduct ? "Produkte (rechts)" : "Edukte (links)"}: ${inPool.map(f => `${toSubscript(f)} (${speciesName(f)})`).join(", ")} → **${toSubscript(right)}**.`,
  };
}

// ── Level und Runden ────────────────────────────────────────────────────────

const gensFor = (s: Stufe): Record<string, () => Task> => ({
  zaehlen: () => zaehlen(s),
  pruefen: () => pruefen(s),
  koeffizient: () => koeffizient(pool(s, 1, 2)),
  "koeff-4": () => koeffizient(pool(s, 3, 4)),
  wort: () => wort(s),
  "aus-1": () => ausgleichen(s, 1),
  ausgleichen: () => ausgleichen(s, 2),
  "aus-3": () => ausgleichen(s, 3),
  "aus-4": () => ausgleichen(s, 4),
});
const GENS: Record<Stufe, Record<string, () => Task>> = { us: gensFor("us"), os: gensFor("os") };

export const TYPE_NAMES: Record<string, string> = {
  zaehlen: "Atome zählen", pruefen: "Bilanz prüfen", koeffizient: "Fehlende Zahl", "koeff-4": "Fehlende Zahl · knifflig", wort: "Wortgleichungen",
  "aus-1": "Ausgleichen · Niveau 1", ausgleichen: "Ausgleichen · Niveau 2", "aus-3": "Ausgleichen · Niveau 3", "aus-4": "Ausgleichen · Niveau 4",
};

interface Level extends QuizLevel { types: string[] }
export const LEVELS: Record<Stufe, Level[]> = {
  us: [
    { id: "us-1", name: "Niveau 1", desc: "Atome zählen, eine Zahl setzen", types: ["zaehlen", "pruefen", "aus-1"] },
    { id: "us-2", name: "Niveau 2", desc: "Fehlende Zahl, mehrere Zahlen setzen", types: ["koeffizient", "ausgleichen", "pruefen"] },
    { id: "us-3", name: "Niveau 3", desc: "Wortgleichungen, Verbrennungen", types: ["wort", "aus-3", "koeffizient"] },
    { id: "us-4", name: "Niveau 4", desc: "Knifflig: halbe Zahlen verdoppeln", types: ["aus-4", "koeff-4"] },
  ],
  os: [
    { id: "os-1", name: "Niveau 1", desc: "Klammern zählen, Salze und Säuren", types: ["zaehlen", "pruefen", "aus-1"] },
    { id: "os-2", name: "Niveau 2", desc: "Zerfall, Fällung, Neutralisation", types: ["koeffizient", "ausgleichen", "wort"] },
    { id: "os-3", name: "Niveau 3", desc: "Mehrere Produkte, Ionen als Block", types: ["aus-3", "wort", "koeffizient"] },
    { id: "os-4", name: "Niveau 4", desc: "Redox und große Zahlen", types: ["aus-4", "koeff-4"] },
  ],
};

const st = (stufe: string): Stufe => (stufe === "os" ? "os" : "us");
export const levelId = (stufe: string, level: LevelKey) => (typeof level === "number" ? LEVELS[st(stufe)][level].id : `${st(stufe)}-${level}`);
export const levelName = (stufe: string, level: LevelKey) =>
  level === "mix" ? "Alles gemischt" : level === "weak" ? "Schwächen üben" : level === "due" ? "Heute fällig" : LEVELS[st(stufe)][level].name;

export function makeRound(stufe: string, level: LevelKey, stats?: TypeStats, due: string[] = []): Task[] {
  const levels = LEVELS[st(stufe)];
  const known = (id: string) => levels.some(l => l.types.includes(id));
  let ids = level === "mix" ? [...new Set(levels.flatMap(l => l.types))]
    : level === "weak" ? weakTypes(stats, known)
    : level === "due" ? due.filter(known)
    : levels[level].types;
  if (!ids.length) ids = levels[0].types;
  return buildRound(ids, GENS[st(stufe)], 10);
}

export const reactionOf = (t: Extract<Task, { kind: "balance" }>) => REACTION_BY_ID[t.reaction];
/** nur für Tests */
export const GENERATORS = GENS;
