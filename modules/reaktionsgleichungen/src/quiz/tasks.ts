// Quiz-Aufgaben zu Reaktionsgleichungen (reine Daten). Aufgabentyp = Fertigkeit.
// Antwortformen: "mc" (Auswahl), "num" (Zahl eintippen), "balance" (Koeffizienten setzen).
// Je Stufe vier Level = Niveau 1–4 (Reaktionen tragen ihr Niveau, siehe REACTIONS in @lern/chem).

import { REACTION_BY_ID, REACTIONS as REACTIONS_ALL, balance, reactionsFor, parseFormula, sideCounts, elementsOf, equationText, isBalanced, unbalancedElements, speciesName, toSubscript, elementName, type Niveau, type Reaction } from "@lern/chem";
import { buildRound, dis, mc, pick, shuffle, weakTypes, type BaseTask, type LevelKey, type McTask, type QuizLevel, type TypeStats } from "@lern/quiz";
import { tr } from "@lern/i18n";

/** eq: Gleichung, die groß über der Frage steht (renderVisual); species: ihre Stoffe (Hilfsmittel „Stoffe“) */
type WithEq = { eq?: string; species?: string[] };
export type Task =
  | (McTask & WithEq)
  | (BaseTask & WithEq & { kind: "num"; answer: number })
  | (BaseTask & { kind: "balance"; reaction: string });

const ELEMENT_NAMES: Record<string, string> = {
  H: "Wasserstoff", O: "Sauerstoff", N: "Stickstoff", C: "Kohlenstoff", Cl: "Chlor", S: "Schwefel", Na: "Natrium", K: "Kalium",
  Mg: "Magnesium", Ca: "Calcium", Al: "Aluminium", Fe: "Eisen", Cu: "Kupfer", Zn: "Zink", Hg: "Quecksilber", Ag: "Silber", P: "Phosphor", Li: "Lithium",
  Ba: "Barium", Pb: "Blei", I: "Iod", Mn: "Mangan", Cr: "Chrom",
};
const elName = (el: string) => tr(ELEMENT_NAMES[el] ?? el, elementName(el).toLowerCase());
/** „X und Y“ / „X and Y“ */
const AND = () => tr(" und ", " and ");
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
    praise: n === 1 ? tr("Index richtig gelesen – genau so geht's.", "Subscript read correctly – that's the way.") : tr("Große Zahl mal kleine Zahl gerechnet – genau so geht's.", "Big number times small number – that's the way."),
    prompt: tr(`Wie viele **${elName(el)}-Atome** (${el}) stecken in \`${text}\`?`, `How many **${elName(el)} atoms** (${el}) are there in \`${text}\`?`),
    hint: inner
      ? tr("Die Zahl hinter der Klammer gilt für alles in der Klammer; die große Zahl vorne für den ganzen Stoff.", "The number after the bracket applies to everything in the bracket; the big number in front to the whole substance.")
      : tr(`Die kleine Zahl (Index) gehört zum Atom davor. Die große Zahl vorne zählt für den ganzen Stoff: ${n} · ${per}.`, `The small number (subscript) belongs to the atom before it. The big number in front counts for the whole substance: ${n} · ${per}.`),
    explain: tr(`In ${toSubscript(f)} ${per === 1 ? "steckt 1 " + el + "-Atom" : `stecken ${per} ${el}-Atome`}. ${n === 1 ? "" : `${n} Teilchen → ${n} · ${per} = `}**${total}**.`,
      `${toSubscript(f)} contains ${per === 1 ? "1 " + el + " atom" : `${per} ${el} atoms`}. ${n === 1 ? "" : `${n} particles → ${n} · ${per} = `}**${total}**.`),
  };
  if (Math.random() < 0.5) return { kind: "num", answer: total, ...base };
  const plain = inner ? parseFormula(f.replace(/\)\d+/g, ")"))[el] : 0;
  return {
    ...mc(String(total), [
      n > 1 && per > 1 ? dis(String(n + per), tr(`${n} + ${per} addiert – Koeffizient und Index werden multipliziert: ${n} · ${per} = ${total}.`, `${n} + ${per} added – coefficient and subscript are multiplied: ${n} · ${per} = ${total}.`)) : null,
      n > 1 ? dis(String(per), tr(`Nur im Teilchen gezählt – vorne stehen ${n} Teilchen: ${n} · ${per} = ${total}.`, `Only counted inside one particle – there are ${n} particles: ${n} · ${per} = ${total}.`)) : null,
      per > 1 ? dis(String(n), tr(`Nur die große Zahl gezählt – jedes Teilchen hat ${per} ${el}-Atome: ${n} · ${per} = ${total}.`, `Only the big number counted – each particle has ${per} ${el} atoms: ${n} · ${per} = ${total}.`)) : null,
      inner && plain && plain !== per ? dis(String(n * plain), tr(`Die Zahl hinter der Klammer vergessen – sie gilt für alles darin: ${per} ${el} je Teilchen.`, `The number after the bracket was forgotten – it applies to everything inside: ${per} ${el} per particle.`)) : null,
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
  const list = (xs: string[]) => (xs.length === 1 ? xs[0] : `${xs.slice(0, -1).join(", ")}${AND()}${xs[xs.length - 1]}`);
  const YES = tr("Ja, ausgeglichen", "Yes, balanced");
  const no = (xs: string[]) => tr(`Nein – ${list(xs)} ${xs.length === 1 ? "stimmt" : "stimmen"} nicht`, `No – ${list(xs)} ${xs.length === 1 ? "does" : "do"} not match`);
  const right = ok ? YES : no(wrong);
  const wrongs = [
    ok ? null : YES,
    ...els.filter(e => !wrong.includes(e)).map(e => no([e])),
    ...(wrong.length > 1 ? wrong.map(e => no([e])) : []),
  ];
  const l = sideCounts(r.left, coeffs.slice(0, r.left.length)), rr = sideCounts(r.right, coeffs.slice(r.left.length));
  return {
    ...mc(right, wrongs),
    eq: equationText(r, coeffs),
    species: [...r.left, ...r.right],
    praise: tr("Jedes Element einzeln gezählt – genau so geht's.", "Every element counted separately – that's the way."),
    prompt: tr("Ist diese Gleichung ausgeglichen?", "Is this equation balanced?"),
    hint: tr("Zähle jedes Element links und rechts einzeln. Große Zahl vorne · kleine Zahl im Stoff.", "Count each element on the left and right separately. Big number in front · small number in the substance."),
    explain: els.map(e => `${e}: ${l[e] ?? 0} | ${rr[e] ?? 0}`).join(", ") + (ok ? tr(" → **ausgeglichen** ✓", " → **balanced** ✓") : tr(` → **${wrong.join(", ")}** ungleich. Richtig: ${eqBal(r)}`, ` → **${wrong.join(", ")}** unequal. Correct: ${eqBal(r)}`)),
  };
}

/** Ein Koeffizient fehlt (Auswahl oder Zahl eintippen) */
function koeffizient(rs: Reaction[]): Task {
  const r = pick(rs.filter(x => x.coeffs.some(c => c > 1)));
  const idx = shuffle(r.coeffs.map((_, i) => i).filter(i => r.coeffs[i] > 1 || Math.random() < 0.3))[0];
  const shown: (number | null)[] = r.coeffs.map((c, i) => (i === idx ? null : c));
  const f = [...r.left, ...r.right][idx];
  const ans = r.coeffs[idx];
  const counts = parseFormula(f);
  // ein Element des Stoffs, am liebsten eines, das auf seiner Seite nur in diesem Stoff steckt
  const side = idx < r.left.length ? r.left : r.right;
  const els = Object.keys(counts);
  const el = els.find(e => side.filter(x => parseFormula(x)[e]).length === 1) ?? els[0];
  const per = counts[el], need = ans * per;
  const elementOnly = els.length === 1;
  const base = {
    eq: equationText(r, shown),
    species: [...r.left, ...r.right],
    prompt: tr(`Welche Zahl gehört vor \`${toSubscript(f)}\`?`, `Which number goes in front of \`${toSubscript(f)}\`?`),
    hint: elementOnly
      ? tr(`Zähle die ${el}-Atome auf der anderen Seite.${per > 1 ? ` Ein ${toSubscript(f)} bringt ${per} davon.` : ""}`, `Count the ${el} atoms on the other side.${per > 1 ? ` One ${toSubscript(f)} brings ${per} of them.` : ""}`)
      : tr(`Zähle die ${el}-Atome auf der anderen Seite. Ein ${toSubscript(f)} bringt ${per} davon.`, `Count the ${el} atoms on the other side. One ${toSubscript(f)} brings ${per} of them.`),
    explain: tr(`${eqBal(r)} → ${need} ${el}-Atom${need === 1 ? "" : "e"}${per > 1 ? ` : ${per} je ${toSubscript(f)}` : ""} → vor ${toSubscript(f)} steht **${ans === 1 ? "1 (wird nicht geschrieben)" : ans}**.`,
      `${eqBal(r)} → ${need} ${el} atom${need === 1 ? "" : "s"}${per > 1 ? ` ÷ ${per} per ${toSubscript(f)}` : ""} → in front of ${toSubscript(f)} goes **${ans === 1 ? "1 (not written)" : ans}**.`),
  };
  if (Math.random() < 0.4) return { kind: "num", answer: ans, ...base };
  return {
    ...mc(String(ans), [
      per > 1 && need !== ans ? dis(String(need), tr(`${need} ${el}-Atome braucht es – in einem ${toSubscript(f)} stecken schon ${per}: ${need} : ${per} = ${ans}.`, `${need} ${el} atoms are needed – one ${toSubscript(f)} already has ${per}: ${need} ÷ ${per} = ${ans}.`)) : null,
      per > 1 && per !== ans && per !== need ? dis(String(per), tr(`${per} ist der Index in ${toSubscript(f)}. Davor steht, wie viele ${toSubscript(f)} es braucht: ${ans}.`, `${per} is the subscript in ${toSubscript(f)}. In front goes how many ${toSubscript(f)} are needed: ${ans}.`)) : null,
      ans > 1 ? dis("1", tr(`Mit 1 ${toSubscript(f)} stimmen die ${el}-Atome nicht: es braucht ${need}, also ${ans} · ${toSubscript(f)}.`, `With 1 ${toSubscript(f)} the ${el} atoms do not match: ${need} are needed, so ${ans} · ${toSubscript(f)}.`)) : null,
      ...wrongNums(ans, shuffle([ans - 1, ans + 1, ans + 2, ans + 3, ans * 2])),
    ]),
    ...base,
  };
}

const METALS = new Set(["Li", "Na", "K", "Mg", "Ca", "Ba", "Al", "Fe", "Cu", "Zn", "Hg", "Ag", "Pb", "Mn", "Cr"]);
const single = (f: string) => Object.keys(parseFormula(f)).length === 1;

/** Vorgehen passend zur Reaktion: Verbrennung, Sauerstoff wechselt den Partner – sonst null */
function strategy(r: Reaction): string | null {
  const fuel = r.left.find(f => f !== "O2" && !single(f) && (parseFormula(f).C || parseFormula(f).H) && !Object.keys(parseFormula(f)).some(e => METALS.has(e)));
  if (r.left.includes("O2") && fuel && r.right.some(f => ["CO2", "H2O", "SO2", "N2"].includes(f)))
    return tr("Verbrennung: zuerst die Elemente außer O (C → CO₂, H → H₂O …), zuletzt O₂ – das enthält nur Sauerstoff.", "Combustion: first the elements other than O (C → CO₂, H → H₂O …), O₂ last – it only contains oxygen.");
  const oxide = r.left.find(f => !single(f) && parseFormula(f).O && Object.keys(parseFormula(f)).some(e => METALS.has(e)));
  const metal = oxide && Object.keys(parseFormula(oxide)).find(e => METALS.has(e) && r.right.includes(e));
  if (oxide && metal) {
    const partner = r.right.find(f => f !== metal && parseFormula(f).O);
    return tr(`Sauerstoff wechselt den Partner: zuerst ${metal} einstellen, dann die O-Atome aus ${toSubscript(oxide)} zählen${partner ? ` – so viele brauchen die ${toSubscript(partner)}` : ""}.`,
      `Oxygen changes partner: first set ${metal}, then count the O atoms from ${toSubscript(oxide)}${partner ? ` – the ${toSubscript(partner)} need that many` : ""}.`);
  }
  return null;
}

const HINTS_DE: Record<Stufe, string[]> = {
  us: [
    "Zähle jedes Element links und rechts. Fehlt eines, die Zahl vor dem Stoff erhöhen – nie die Formel ändern.",
    "Beginne mit dem Element, das nur in je einem Stoff links und rechts vorkommt. Sauerstoff meist zuletzt. Am Ende kleinste ganze Zahlen.",
    "Zuerst ein Element, das links und rechts nur in je einem Stoff steckt; reine Elemente (O₂, Fe …) zuletzt.",
    "Brauchst du eine halbe Zahl (z. B. 3½ O₂)? Dann alle Zahlen verdoppeln.",
  ],
  os: [
    "SO₄, NO₃, PO₄ … bleiben erhalten – zähle sie wie ein Atom. Dann Metall, zuletzt H und O (Wasser).",
    "Zuerst das Element, das nur in je einem Stoff steht; H und O zuletzt. Ionen als Block zählen.",
    "Metall bzw. Nichtmetall zuerst, dann Cl bzw. N, dann H (→ H₂O), zuletzt O₂ oder Cl₂ – sie enthalten nur ein Element.",
    "Reine Elemente (O₂, Cl₂) zuletzt einstellen. Halbe Zahl nötig? Alles verdoppeln. Bei HNO₃/HCl: nicht jedes N bzw. Cl landet im Salz.",
  ],
};
const HINTS_EN: Record<Stufe, string[]> = {
  us: [
    "Count each element on the left and right. If one is missing, increase the number in front of the substance – never change the formula.",
    "Start with the element that appears in only one substance on each side. Oxygen usually last. At the end smallest whole numbers.",
    "First an element that is in only one substance on each side; pure elements (O₂, Fe …) last.",
    "Do you need a half number (e.g. 3½ O₂)? Then double all numbers.",
  ],
  os: [
    "SO₄, NO₃, PO₄ … stay intact – count them like one atom. Then the metal, H and O (water) last.",
    "First the element that is in only one substance; H and O last. Count ions as a block.",
    "Metal or non-metal first, then Cl or N, then H (→ H₂O), O₂ or Cl₂ last – they contain only one element.",
    "Set pure elements (O₂, Cl₂) last. Need a half number? Double everything. With HNO₃/HCl: not every N or Cl ends up in the salt.",
  ],
};
const HINTS = tr(HINTS_DE, HINTS_EN);

/** Tipp: passendes Vorgehen für die Reaktion, auf Niveau 4 dazu „verdoppeln“ */
function hintFor(r: Reaction, s: Stufe, nv: Niveau): string {
  const st = strategy(r);
  if (!st) return HINTS[s][nv - 1];
  return nv === 4 ? `${st} ${tr("Halbe Zahl nötig? Alles verdoppeln.", "Need a half number? Double everything.")}` : st;
}

/** Ganze Gleichung ausgleichen (Koeffizienten setzen) auf einem Niveau */
function ausgleichen(s: Stufe, nv: Niveau): Task {
  const r = pick(pool(s, nv).filter(x => x.coeffs.some(c => c > 1)));
  return {
    kind: "balance", reaction: r.id,
    praise: nv >= 3 ? tr("Schwierige Gleichung ausgeglichen und gekürzt – stark.", "Hard equation balanced and simplified – great.") : tr("Element für Element ausgeglichen und gekürzt – genau so geht's.", "Balanced element by element and simplified – that's the way."),
    prompt: `${tr("Gleiche die Gleichung aus", "Balance the equation")}: **${r.title}**`,
    hint: hintFor(r, s, nv),
    explain: `**${eqBal(r)}** – ${elementsOf(r).map(e => `${e}: ${sideCounts(r.left, r.coeffs.slice(0, r.left.length))[e]}`).join(", ")} ${tr("auf beiden Seiten", "on both sides")}.`,
  };
}

const DIATOMIC: Record<string, string> = { H2: "H", O2: "O", N2: "N", Cl2: "Cl" };
/** Stoff mit Namen ohne doppelte Klammern: „HCl – Chlorwasserstoff (Salzsäure)“ */
const withName = (f: string) => `${toSubscript(f)} – ${speciesName(f)}`;

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
    // Elemente, die als Moleküle vorkommen, fälschlich als einzelne Atome geschrieben (O statt O₂)
    const di = [...r.left, ...r.right].find(f => DIATOMIC[f]);
    let atoms: string | null = null;
    if (di) {
      const eq = { left: r.left.map(f => DIATOMIC[f] ?? f), right: r.right.map(f => DIATOMIC[f] ?? f) };
      const co = balance(eq);
      if (co) atoms = equationText(eq, co);
    }
    return {
      ...mc(eqBal(r), [
        unbalanced === eqBal(r) ? null : dis(unbalanced, tr("Die Stoffe stimmen, aber die Atome sind nicht ausgeglichen – die Zahlen davor fehlen.", "The substances are right, but the atoms are not balanced – the numbers in front are missing.")),
        dis(swapped, tr("Seiten vertauscht: Edukte stehen links vom Pfeil, Produkte rechts.", "Sides swapped: reactants go on the left of the arrow, products on the right.")),
        atoms && di ? dis(atoms, tr(`${speciesName(di)} kommt als Molekül ${toSubscript(di)} vor – nicht als einzelnes ${DIATOMIC[di]}-Atom.`, `${speciesName(di)} occurs as the molecule ${toSubscript(di)} – not as a single ${DIATOMIC[di]} atom.`)) : null,
        ...others,
      ]),
      eq: words,
      prompt: tr("Welche Gleichung passt zur Wortgleichung?", "Which equation matches the word equation?"),
      hint: tr("Links stehen die Edukte, rechts die Produkte – und die Atome müssen ausgeglichen sein.", "Reactants on the left, products on the right – and the atoms must be balanced."),
      explain: `**${eqBal(r)}**`,
    };
  }
  // Welcher Stoff ist Produkt / Edukt?
  const askProduct = Math.random() < 0.6;
  const inPool = askProduct ? r.right : r.left, otherPool = askProduct ? r.left : r.right;
  const right = pick(inPool);
  const side = askProduct ? tr("links – das ist ein Edukt", "on the left – it is a reactant") : tr("rechts – das ist ein Produkt", "on the right – it is a product");
  const els = new Set(elementsOf(r));
  // Stoffe aus denselben Elementen, die in dieser Reaktion nicht vorkommen (z. B. CO statt CO₂)
  const lookalikes = shuffle([...new Set(REACTIONS_ALL.flatMap(x => [...x.left, ...x.right]))])
    .filter(f => !inPool.includes(f) && !otherPool.includes(f) && Object.keys(parseFormula(f)).every(e => els.has(e)));
  const wrongs = [
    ...otherPool.filter(f => !inPool.includes(f)).map(f => dis(toSubscript(f), tr(`${toSubscript(f)} steht ${side}.`, `${toSubscript(f)} is ${side}.`))),
    ...lookalikes.slice(0, 2).map(f => dis(toSubscript(f), tr(`${toSubscript(f)} kommt in dieser Gleichung nicht vor – ${askProduct ? "die Produkte stehen rechts vom Pfeil" : "die Edukte stehen links vom Pfeil"}.`, `${toSubscript(f)} does not appear in this equation – ${askProduct ? "the products are on the right of the arrow" : "the reactants are on the left of the arrow"}.`))),
    ...shuffle(rs.flatMap(x => [...x.left, ...x.right])).filter(f => !inPool.includes(f) && !otherPool.includes(f)).slice(0, 3).map(toSubscript),
  ];
  return {
    ...mc(toSubscript(right), wrongs),
    eq: eqBal(r),
    prompt: tr(`**${r.title}:** Welcher Stoff ist ein **${askProduct ? "Produkt" : "Edukt"}**?`, `**${r.title}:** Which substance is a **${askProduct ? "product" : "reactant"}**?`),
    hint: tr("Edukte stehen links vom Pfeil, Produkte rechts.", "Reactants are on the left of the arrow, products on the right."),
    explain: `${askProduct ? tr("Produkte (rechts)", "Products (right)") : tr("Edukte (links)", "Reactants (left)")}: ${inPool.map(withName).join(", ")} → **${toSubscript(right)}**.`,
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

export const TYPE_NAMES: Record<string, string> = tr({
  zaehlen: "Atome zählen", pruefen: "Bilanz prüfen", koeffizient: "Fehlende Zahl", "koeff-4": "Fehlende Zahl · knifflig", wort: "Wortgleichungen",
  "aus-1": "Ausgleichen · Niveau 1", ausgleichen: "Ausgleichen · Niveau 2", "aus-3": "Ausgleichen · Niveau 3", "aus-4": "Ausgleichen · Niveau 4",
}, {
  zaehlen: "Counting atoms", pruefen: "Checking the balance", koeffizient: "Missing number", "koeff-4": "Missing number · tricky", wort: "Word equations",
  "aus-1": "Balancing · stage 1", ausgleichen: "Balancing · stage 2", "aus-3": "Balancing · stage 3", "aus-4": "Balancing · stage 4",
});

interface Level extends QuizLevel { types: string[] }
export const LEVELS: Record<Stufe, Level[]> = {
  us: [
    { id: "us-1", name: tr("Niveau 1", "Stage 1"), desc: tr("Atome zählen, eine Zahl setzen", "Counting atoms, setting one number"), types: ["zaehlen", "pruefen", "aus-1"] },
    { id: "us-2", name: tr("Niveau 2", "Stage 2"), desc: tr("Fehlende Zahl, mehrere Zahlen setzen", "Missing number, setting several numbers"), types: ["koeffizient", "ausgleichen", "pruefen"] },
    { id: "us-3", name: tr("Niveau 3", "Stage 3"), desc: tr("Wortgleichungen, Verbrennungen", "Word equations, combustion"), types: ["wort", "aus-3", "koeffizient"] },
    { id: "us-4", name: tr("Niveau 4", "Stage 4"), desc: tr("Knifflig: halbe Zahlen verdoppeln", "Tricky: doubling half numbers"), types: ["aus-4", "koeff-4"] },
  ],
  os: [
    { id: "os-1", name: tr("Niveau 1", "Stage 1"), desc: tr("Klammern zählen, Salze und Säuren", "Counting brackets, salts and acids"), types: ["zaehlen", "pruefen", "aus-1"] },
    { id: "os-2", name: tr("Niveau 2", "Stage 2"), desc: tr("Zerfall, Fällung, Neutralisation", "Decomposition, precipitation, neutralisation"), types: ["koeffizient", "ausgleichen", "wort"] },
    { id: "os-3", name: tr("Niveau 3", "Stage 3"), desc: tr("Mehrere Produkte, Ionen als Block", "Several products, ions as a block"), types: ["aus-3", "wort", "koeffizient"] },
    { id: "os-4", name: tr("Niveau 4", "Stage 4"), desc: tr("Redox und große Zahlen", "Redox and large numbers"), types: ["aus-4", "koeff-4"] },
  ],
};

const st = (stufe: string): Stufe => (stufe === "os" ? "os" : "us");
export const levelId = (stufe: string, level: LevelKey) => (typeof level === "number" ? LEVELS[st(stufe)][level].id : `${st(stufe)}-${level}`);
export const levelName = (stufe: string, level: LevelKey) =>
  level === "mix" ? tr("Alles gemischt", "Everything mixed") : level === "weak" ? tr("Schwächen üben", "Practise weak spots") : level === "due" ? tr("Heute fällig", "Due today") : LEVELS[st(stufe)][level].name;

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

/** Stoffe einer Aufgabe für das Hilfsmittel „Stoffe“ – nicht bei Wortgleichungen und Atome zählen (dort verriete die Info die Lösung) */
export function speciesOf(t: Task): string[] {
  if (t.type === "wort" || t.type === "zaehlen") return [];
  const fs = t.kind === "balance" ? [...reactionOf(t).left, ...reactionOf(t).right] : t.species ?? [];
  // nach Namen sortiert: die Liste verrät nicht, was links oder rechts steht
  return [...new Set(fs)].sort((a, b) => speciesName(a).localeCompare(speciesName(b), tr("de", "en")));
}
/** nur für Tests */
export const GENERATORS = GENS;
