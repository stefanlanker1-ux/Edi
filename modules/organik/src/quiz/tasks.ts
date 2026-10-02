// Quiz-Aufgaben zur Benennung (reine Daten: Moleküle mit Lage der Atome, damit Runden gespeichert werden können).
// Moleküle entstehen zufällig aus Bausteinen (Kurzschreibweise), den richtigen Namen liefert naming.ts.
// Falsche Antworten kommen ebenfalls aus der Benennung – jede steht für einen typischen Fehler (misconceptions.ts):
// andere Seite nummeriert, kürzere Kette, nicht alphabetisch, ohne di/tri, falsche Rangfolge, falsche Endung, verzählt.

import { buildRound, d, mc, pick, rnd, shuffle, weakTypes, type BaseTask, type Distractor, type LevelKey, type McTask, type QuizLevel, type TypeStats } from "@lern/quiz";
import { layout } from "../chem/layout.ts";
import { parseSmiles } from "../chem/smiles.ts";
import { name, KIND_INFO, type Kind, type NameOk, type NameOptions } from "../chem/naming.ts";
import { STEM } from "../chem/rings.ts";
import type { Mol } from "../chem/mol.ts";
import { flipBond } from "../chem/stereo.ts";

type Extra = { mol?: Mol; mols?: Record<string, Mol> };
export type Task = (McTask & Extra) | (BaseTask & Extra & { kind: "num"; answer: number });

const mol = (s: string) => layout(parseSmiles(s));
const ok = (m: Mol, opt?: NameOptions): NameOk | undefined => { const r = name(m, opt); return r.ok ? r : undefined; };
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** Kette als Kurzschreibweise: Äste je Position (0-basiert), Bindung zwischen i und i+1 */
function chain(n: number, branches: Record<number, string[]> = {}, bonds: Record<number, string> = {}, ends: { first?: string; last?: string } = {}): string {
  let s = "";
  for (let i = 0; i < n; i++) {
    const atom = i === 0 && ends.first ? ends.first : i === n - 1 && ends.last ? ends.last : "C";
    s += (i > 0 ? bonds[i - 1] ?? "" : "") + atom + (branches[i] ?? []).map(b => `(${b})`).join("");
  }
  return s;
}
const addBranch = (br: Record<number, string[]>, i: number, b: string) => { (br[i] ??= []).push(b); };

/** Name mit verzählter Hauptkette (Stamm ± delta) */
function restem(nm: string, size: number, delta: number): string | undefined {
  const from = STEM[size], to = STEM[size + delta];
  if (!from || !to) return;
  const low = nm.toLowerCase();
  for (let i = low.length - from.length; i >= 0; i--) {
    if (low.startsWith(from, i) && /^(an|en|in|a-|-\d)/.test(low.slice(i + from.length))) {
      const rep = i === 0 ? cap(to) : to;
      return nm.slice(0, i) + rep + nm.slice(i + from.length);
    }
  }
}

/** falsche Namen aus der Benennung selbst – je ein typischer Fehler */
function nameDistractors(m: Mol, right: NameOk, extra: Distractor[] = []): Distractor[] {
  const out: Distractor[] = [...extra];
  const bad = new Set([right.name, ...right.alt]);
  const add = (nm: string | undefined, miss: string, why: string) => { if (nm && !bad.has(nm)) { bad.add(nm); out.push(d(nm, miss, why)); } };
  const v = (opt: NameOptions) => ok(m, opt)?.name;
  add(v({ pick: "reverse" }), "nummer", "Von der anderen Seite zählen: Dann sind die Nummern kleiner.");
  add(v({ pick: "otherChain" }), "kette-kurz", `Die längste Kette hat ${right.parent.size} C. Sie muss nicht gerade gezeichnet sein.`);
  add(v({ noAlpha: true }), "alphabet", "Vorsilben alphabetisch ordnen. Di und tri zählen dabei nicht.");
  add(v({ noMult: true }), "multi", "Gleiche Reste zusammenfassen: dimethyl statt methyl und methyl.");
  if (right.parent.kind === "chain") {
    add(restem(right.name, right.parent.size, 1), "zaehlen", `Die Hauptkette hat ${right.parent.size} C, nicht ${right.parent.size + 1}.`);
    add(restem(right.name, right.parent.size, -1), "zaehlen", `Die Hauptkette hat ${right.parent.size} C, nicht ${right.parent.size - 1}.`);
  }
  return out;
}

// ── Moleküle würfeln ────────────────────────────────────────────────────────

/** verzweigtes Alkan: Kette 4–8 C, 1–3 Äste (Methyl, Ethyl) */
function branchedAlkane(): string {
  const n = rnd(4, 8), k = rnd(1, n >= 6 ? 3 : 2), br: Record<number, string[]> = {};
  for (let j = 0; j < k; j++) {
    const ethyl = n >= 6 && Math.random() < 0.3;
    const i = ethyl ? rnd(2, n - 3) : rnd(1, n - 2);
    if ((br[i]?.length ?? 0) >= 2) continue;
    addBranch(br, i, ethyl ? "CC" : "C");
  }
  return chain(n, br);
}

/** Kette 3–7 C mit einer Doppel- oder Dreifachbindung, evtl. ein Methylast */
function unsaturated(): { s: string; triple: boolean } {
  const n = rnd(3, 7), triple = Math.random() < 0.35;
  const at = rnd(0, n - 2);
  const br: Record<number, string[]> = {};
  if (n >= 5 && Math.random() < 0.5) {
    const i = rnd(1, n - 2);
    // kein Ast an einem C der Dreifachbindung
    if (!triple || (i !== at && i !== at + 1)) addBranch(br, i, "C");
  }
  return { s: chain(n, br, { [at]: triple ? "#" : "=" }), triple };
}

type G = "ol" | "al" | "on" | "saeure" | "amin";
/** Kette mit einer Gruppe an Stelle `pos` (Aldehyd und Säure am Ende) */
function withGroup(n: number, g: G, pos: number, br: Record<number, string[]> = {}): string | undefined {
  const b: Record<number, string[]> = Object.fromEntries(Object.entries(br).map(([k, v]) => [k, [...v]]));
  if (g === "al") return chain(n, b, {}, { last: "C=O" });
  if (g === "saeure") return chain(n, b, {}, { last: "C(=O)O" });
  if (g === "on" && (pos === 0 || pos === n - 1)) return;
  addBranch(b, pos, g === "ol" ? "O" : g === "on" ? "=O" : "N");
  return chain(n, b);
}
const G_KIND: Record<G, Kind> = { ol: "ol", al: "al", on: "on", saeure: "saeure", amin: "amin" };

// ── Aufgaben ────────────────────────────────────────────────────────────────

/** Unverzweigtes Alkan benennen */
function stamm(): Task {
  const n = pick([1, 2, 3, 4, 5, 5, 6, 6, 7, 8, 9, 10]);
  const m = mol("C".repeat(n)), r = ok(m)!;
  const wrong = [n + 1, n - 1, n + 2, n - 2].filter(k => k >= 1 && k <= 10)
    .map(k => d(cap(STEM[k]) + "an", "zaehlen", `${cap(STEM[k])}an hätte ${k} C. Hier ${n === 1 ? "ist es 1 C" : `sind es ${n} C`}.`));
  return {
    ...mc(r.name, wrong, 4, `Genau: ${n} C → ${r.name}.`),
    mol: m,
    prompt: "Wie heißt dieses Alkan?",
    hint: "Zähle die C-Atome: Meth 1, Eth 2, Prop 3, But 4, Pent 5 …",
    explain: `Die Kette hat **${n} C** → **${r.name}**.`,
  };
}

/** Wie viele C hat die Hauptkette? */
function kette(): Task {
  let m: Mol, r: NameOk;
  do { m = mol(branchedAlkane()); r = ok(m)!; } while (r.parent.size === m.atoms.length);
  const other = ok(m, { pick: "otherChain" });
  const traps = [
    { field: "n", value: m.atoms.length, miss: "alle-c", why: `${m.atoms.length} sind alle C. Die Seitenketten zählen nicht zur Hauptkette.` },
    ...(other ? [{ field: "n", value: other.parent.size, miss: "kette-kurz", why: `Es gibt eine längere Kette mit ${r.parent.size} C.` }] : []),
  ].filter(t => t.value !== r.parent.size);
  return {
    kind: "num", answer: r.parent.size, mol: m, traps,
    prompt: "Wie viele C-Atome hat die **längste Kette**?",
    hint: "Fahre von einem Kettenende zum anderen. Probiere auch die Äste als Ende.",
    explain: `Die längste Kette hat **${r.parent.size} C** → Stamm **${cap(STEM[r.parent.size])}an**. Name: ${r.name}.`,
  };
}

/** Verzweigtes Alkan benennen */
function alkan(): Task {
  let m: Mol, r: NameOk;
  do { m = mol(branchedAlkane()); r = ok(m)!; } while (r.prefixes.length === 0);
  return {
    ...mc(r.name, nameDistractors(m, r), 4, `Genau: ${r.name}.`),
    mol: m,
    prompt: "Wie heißt dieses Alkan?",
    hint: "Längste Kette suchen. Dann so nummerieren, dass die Äste kleine Nummern haben.",
    explain: r.steps.slice(-3).join(" "),
  };
}

/** Alken oder Alkin benennen */
function alken(): Task {
  let u: ReturnType<typeof unsaturated>, m: Mol, r: NameOk;
  do { u = unsaturated(); m = maybeFlip(mol(u.s)); r = ok(m)!; } while (!r);
  const extra: Distractor[] = [];
  // E/Z vertauscht (nur wenn die Doppelbindung E/Z hat)
  const st = r.stereo.find(x => x.desc);
  const flipped = st && ok(flipBond(m, st.a, st.b) ?? m);
  if (st && flipped && flipped.name !== r.name) extra.push(d(flipped.name, "ez", st.desc === "Z"
    ? "Die vorrangigen Gruppen liegen auf derselben Seite → **Z**." : "Die vorrangigen Gruppen liegen auf verschiedenen Seiten → **E**."));
  const base = r.name.replace(/^\((?:\d*[EZ],?)+\)-/, "");
  const swap = base.replace(u.triple ? /in(?=$|-)/ : /en(?=$|-)/, u.triple ? "en" : "in");
  if (swap !== base) extra.push(d(cap(swap), "en-in", u.triple ? "Dreifachbindung → **-in**. Doppelbindung wäre -en." : "Doppelbindung → **-en**. Dreifachbindung wäre -in."));
  const sat = ok(mol(u.s.replace(/[=#]/, "")));
  if (sat) extra.push(d(sat.name, "mehrfach-vergessen", `${sat.name} hätte nur Einfachbindungen. Hier ist eine ${u.triple ? "Dreifach" : "Doppel"}bindung.`));
  return {
    ...mc(r.name, nameDistractors(m, r, extra), 4, `Genau: ${r.name}.`),
    mol: m,
    prompt: `Wie heißt dieses ${u.triple ? "Alkin" : "Alken"}?`,
    hint: "Die Mehrfachbindung bekommt die kleinste Nummer. Die Zahl steht vor -en bzw. -in.",
    explain: r.steps.slice(-3).join(" "),
  };
}

/** zufällig an der ersten Doppelbindung spiegeln – damit E und Z vorkommen */
function maybeFlip(m: Mol): Mol {
  const b = m.bonds.find(x => x.order === 2);
  return b && Math.random() < 0.5 ? flipBond(m, b.a, b.b) ?? m : m;
}

/** Gruppen an einer Doppelbindung: links a, b – rechts c, e ("" = H) */
const EZ_LEFT = ["C", "CC", "Cl", "Br", "CO", "C(C)C"];
const EZ_SECOND = ["", "", "C", "Cl", "F"];

/** E oder Z? */
function ez(): Task {
  for (;;) {
    const [a, b] = [pick(EZ_LEFT), pick(EZ_SECOND)], [c, e] = [pick(EZ_LEFT), pick(EZ_SECOND)];
    if (a === b || c === e) continue;
    const m = maybeFlip(mol(`${a}C${b ? `(${b})` : ""}=C${e ? `(${e})` : ""}${c}`));
    const r = ok(m);
    const st = r?.stereo[0];
    if (!r || !st?.desc || r.stereo.length !== 1) continue;
    const other = st.desc === "E" ? "Z" : "E";
    const sameH = st.qa === -1 && st.qb === -1;
    return {
      ...mc(st.desc, [d(other, "ez", st.desc === "Z"
        ? "Die vorrangigen Gruppen liegen auf **derselben** Seite der Doppelbindung → Z."
        : "Die vorrangigen Gruppen liegen auf **verschiedenen** Seiten der Doppelbindung → E.")], 2,
        `Genau: ${r.name}${sameH ? ` (${st.desc === "Z" ? "cis" : "trans"})` : ""}.`),
      mol: m,
      prompt: "Ist diese Doppelbindung **E** oder **Z**?",
      hint: "An jedem C der Doppelbindung: Gruppe mit größerer Ordnungszahl. Gleiche Seite = Z.",
      explain: r.steps.find(x => /Doppelbindung C\d+:/.test(x)) ?? r.steps.slice(-1).join(" "),
    };
  }
}

/** An welchem C beginnt die Doppelbindung? */
function lage(): Task {
  let u: ReturnType<typeof unsaturated>, m: Mol, r: NameOk;
  do { u = unsaturated(); m = mol(u.s); r = ok(m)!; } while (r.parent.size < 4);
  const ref = /-(\d+)-(?:di)?(?:en|in)/.exec(r.name);
  const loc = ref ? Number(ref[1]) : 1;
  const rev = r.parent.size - loc;
  return {
    kind: "num", answer: loc, mol: m,
    traps: rev !== loc ? [{ field: "n", value: rev, miss: "nummer", why: `Das ist von der anderen Seite gezählt. Von hier aus ist die Nummer kleiner.` }] : [],
    prompt: `Welche Nummer bekommt die ${u.triple ? "Dreifach" : "Doppel"}bindung?`,
    hint: "Von dem Ende zählen, das näher an der Mehrfachbindung liegt.",
    explain: `Die Mehrfachbindung beginnt bei **C${loc}** → **${r.name}**.`,
  };
}

const CLASS_OF: Record<string, string> = { ol: "Alkohol", al: "Aldehyd", on: "Keton", saeure: "Carbonsäure", amin: "Amin", ester: "Ester", ether: "Ether" };
const CLASS_WHY: Record<string, string> = {
  Alkohol: "Alkohol: –OH an einem C mit nur Einfachbindungen.",
  Aldehyd: "Aldehyd: C=O am Kettenende, also –CHO.",
  Keton: "Keton: C=O in der Kette, zwischen zwei C.",
  Carbonsäure: "Carbonsäure: C=O und –OH am selben C, also –COOH.",
  Amin: "Amin: –NH₂ am C.",
  Ester: "Ester: –COO– zwischen zwei Kohlenstoffteilen.",
  Ether: "Ether: ein O zwischen zwei C, ohne C=O.",
};

/** zufälliges Molekül einer Klasse */
function classMol(cls: string): string {
  const n = cls === "on" ? rnd(3, 5) : rnd(2, 5);
  if (cls === "ester") return chain(rnd(1, 4), {}, {}, { last: "C(=O)O" + "C".repeat(rnd(1, 3)) });
  if (cls === "ether") return "C".repeat(rnd(1, 3)) + "O" + "C".repeat(rnd(1, 3));
  const g = cls as G;
  return withGroup(n, g, g === "on" ? rnd(1, n - 2) : rnd(0, n - 1))!;
}

/** Zu welcher Stoffklasse gehört das Molekül? */
function klasse(): Task {
  const cls = pick(["ol", "al", "on", "saeure", "amin", "ester", "ether"]);
  const m = mol(classMol(cls)), right = CLASS_OF[cls];
  const near: Record<string, string[]> = {
    Alkohol: ["Carbonsäure", "Ether", "Aldehyd"], Aldehyd: ["Keton", "Alkohol", "Carbonsäure"], Keton: ["Aldehyd", "Ether", "Ester"],
    Carbonsäure: ["Alkohol", "Ester", "Aldehyd"], Amin: ["Alkohol", "Ether", "Aldehyd"], Ester: ["Ether", "Carbonsäure", "Keton"], Ether: ["Alkohol", "Ester", "Keton"],
  };
  const wrong = near[right].filter(w => CLASS_WHY[w]).map(w => d(w, "klasse", `${CLASS_WHY[w]} ${CLASS_WHY[right]}`));
  return {
    ...mc(right, wrong, 4, `Genau: ${CLASS_WHY[right]}`),
    mol: m,
    prompt: "Zu welcher Stoffklasse gehört dieses Molekül?",
    hint: "Suche die Atome außer C und H. Was hängt woran?",
    explain: CLASS_WHY[right],
  };
}

const SUFFIX: Record<G, string> = { ol: "-ol", al: "-al", on: "-on", saeure: "-säure", amin: "-amin" };
/** Welche Endung bekommt der Name? */
function endung(): Task {
  const g = pick<G>(["ol", "al", "on", "saeure", "amin"]);
  const n = rnd(3, 6);
  const s = withGroup(n, g, g === "on" ? rnd(1, n - 2) : rnd(0, n - 2))!;
  const m = mol(s);
  const wrong = (Object.keys(SUFFIX) as G[]).filter(x => x !== g)
    .map(x => d(SUFFIX[x], "endung", `${SUFFIX[x]} gehört zu ${KIND_INFO[G_KIND[x]].label} ${KIND_INFO[G_KIND[x]].group}. Hier ist ${KIND_INFO[G_KIND[g]].group}.`));
  return {
    ...mc(SUFFIX[g], wrong, 4, `Genau: ${KIND_INFO[G_KIND[g]].label} → ${SUFFIX[g]}.`),
    mol: m,
    prompt: "Welche Endung bekommt der Name?",
    hint: "OH → -ol, CHO → -al, C=O in der Kette → -on, COOH → -säure, NH₂ → -amin.",
    explain: `${KIND_INFO[G_KIND[g]].label} ${KIND_INFO[G_KIND[g]].group} → Endung **${SUFFIX[g]}**: ${ok(m)!.name}.`,
  };
}

/** Alkohol, Aldehyd, Keton, Säure oder Amin benennen (evtl. mit Methylast) */
function gruppen(): Task {
  for (;;) {
    const g = pick<G>(["ol", "ol", "al", "on", "saeure", "amin"]);
    const n = rnd(2, 6);
    const pos = g === "on" ? rnd(1, n - 2) : rnd(0, n - 1);
    const br: Record<number, string[]> = {};
    if (n >= 4 && Math.random() < 0.5) addBranch(br, rnd(1, n - 2), "C");
    const s = withGroup(n, g, pos, br);
    if (!s) continue;
    const m = mol(s), r = ok(m);
    if (!r || r.principal !== G_KIND[g]) continue;
    // andere Gruppe an derselben Stelle → echte Namen anderer Stoffe
    const extra: Distractor[] = [];
    for (const x of ["ol", "al", "on", "saeure"] as G[]) {
      if (x === g) continue;
      const alt = withGroup(n, x, pos, br);
      const ra = alt && ok(mol(alt));
      if (ra && ra.name !== r.name) extra.push(d(ra.name, "endung", `${SUFFIX[x]} steht für ${KIND_INFO[G_KIND[x]].label}. Hier ist ${KIND_INFO[G_KIND[g]].group}: ${SUFFIX[g]}.`));
    }
    if (g === "al" || g === "saeure") {
      const short = restem(r.name, r.parent.size, -1);
      if (short) extra.unshift(d(short, "c-gruppe", `Das C der ${KIND_INFO[G_KIND[g]].group}-Gruppe zählt mit. Die Kette hat ${r.parent.size} C.`));
    }
    return {
      ...mc(r.name, nameDistractors(m, r, shuffle(extra).slice(0, 2)), 4, `Genau: ${r.name}.`),
      mol: m,
      prompt: "Wie heißt diese Verbindung?",
      hint: g === "al" || g === "saeure" ? "Das C der Gruppe gehört zur Kette und ist C1." : "Die Gruppe bekommt die kleinste Nummer.",
      explain: r.steps.slice(-3).join(" "),
    };
  }
}

/** Ester benennen: Säureteil + Alkylteil + ester */
function ester(): Task {
  for (;;) {
    const a = rnd(1, 5), b = rnd(1, 5);
    if (a === b + 1) continue; // vertauschte Teile ergäben sonst denselben Stamm
    const m = mol(a === 1 ? "O=CO" + "C".repeat(b) : "C".repeat(a - 1) + "C(=O)O" + "C".repeat(b)), r = ok(m);
    if (!r || r.principal !== "ester") continue;
    const acidC = a, alkC = b;
    const extra: Distractor[] = [];
    const swapped = `${cap(STEM[alkC])}ansäure${STEM[acidC]}ylester`;
    if (swapped !== r.name) extra.push(d(swapped, "ester-teile", `Die Säure ist der Teil mit C=O. Er hat ${acidC} C: ${cap(STEM[acidC])}ansäure.`));
    if (acidC > 1) extra.push(d(`${cap(STEM[acidC - 1])}ansäure${STEM[alkC]}ylester`, "c-gruppe", `Das C der C=O-Gruppe gehört zur Säure. Sie hat ${acidC} C.`));
    extra.push(d(`${cap(STEM[acidC])}ansäure${STEM[alkC + 1]}ylester`, "zaehlen", `Der Alkylteil hinter dem O hat ${alkC} C.`));
    extra.push(d(`${cap(STEM[acidC + 1])}ansäure${STEM[alkC]}ylester`, "zaehlen", `Der Säureteil mit C=O hat ${acidC} C.`));
    return {
      ...mc(r.name, extra, 4, `Genau: ${r.name} (${r.alt[0]}).`),
      mol: m,
      prompt: "Wie heißt dieser Ester?",
      hint: "Säureteil mit C=O zuerst, dann der Rest am O, dann -ester.",
      explain: r.steps.slice(-1).join(" "),
    };
  }
}

/** Molekül mit Hauptgruppe und 2–3 Vorsilben (Kette 5–8 C) */
function multiMol(): { m: Mol; r: NameOk; g: G } {
  for (;;) {
    const g = pick<G>(["saeure", "al", "on", "ol"]);
    const n = rnd(5, 8);
    const pos = g === "on" ? rnd(1, n - 2) : rnd(0, n - 2);
    const br: Record<number, string[]> = {};
    const subs = shuffle(["C", "C", "CC", "O", "=O", "N", "Cl"]).slice(0, rnd(2, 3));
    for (const sb of subs) {
      const i = sb === "CC" ? rnd(2, n - 3) : rnd(1, n - 2);
      if (i === pos && g !== "saeure" && g !== "al") continue;
      if ((br[i]?.length ?? 0) >= (sb === "=O" ? 0 : 1)) continue;
      if (sb === "=O" && (g === "on" || br[i]?.length)) continue;
      addBranch(br, i, sb);
    }
    const s = withGroup(n, g, pos, br);
    if (!s) continue;
    const m = mol(s), r = ok(m);
    if (r && r.principal === G_KIND[g] && r.prefixes.length >= 2) return { m, r, g };
  }
}

/** Welche Gruppe gibt die Endung? */
function prio(): Task {
  let { m, r } = multiMol();
  while (!r.prefixes.some(p => ["hydroxy", "oxo", "amino"].includes(p.name))) ({ m, r } = multiMol());
  const kinds = [...new Set([r.principal!, ...r.prefixes.map(p => ({ hydroxy: "ol", oxo: "on", amino: "amin" } as Record<string, Kind>)[p.name]).filter(Boolean)])] as Kind[];
  const right = KIND_INFO[r.principal!];
  const wrong = kinds.filter(k => k !== r.principal).map(k => d(`${KIND_INFO[k].label} ${KIND_INFO[k].group}`, "prio",
    `${right.label} steht in der Rangfolge vor ${KIND_INFO[k].label}. ${KIND_INFO[k].label} wird Vorsilbe: ${KIND_INFO[k].prefix}`));
  // Teile der Hauptgruppe sehen aus wie andere Gruppen: OH und C=O der COOH-Gruppe, C=O der CHO-Gruppe
  const part = (k: Kind) => (r.principal === "saeure" && (k === "ol" || k === "on" || k === "al") ? `Das ${k === "ol" ? "–OH" : "C=O"} gehört zur COOH-Gruppe. Zusammen ist das eine Carbonsäure.`
    : r.principal === "al" && k === "on" ? "Das C=O am Kettenende ist eine Aldehydgruppe –CHO." : `Eine ${KIND_INFO[k].label}gruppe ${KIND_INFO[k].group} gibt es hier nicht.`);
  const fill = (["saeure", "al", "on", "ol", "amin"] as Kind[]).filter(k => k !== r.principal && !kinds.includes(k))
    .map(k => d(`${KIND_INFO[k].label} ${KIND_INFO[k].group}`, "klasse", part(k)));
  return {
    ...mc(`${right.label} ${right.group}`, [...wrong, ...fill], 4, `Genau: ${right.label} hat den höchsten Rang → ${right.suffix}.`),
    mol: m,
    prompt: "Welche Gruppe bestimmt die **Endung**?",
    hint: "Rangfolge: Säure vor Aldehyd vor Keton vor Alkohol vor Amin.",
    explain: `Höchster Rang: **${right.label}** → Endung **${right.suffix}**. Name: ${r.name}.`,
  };
}

/** Molekül mit mehreren Gruppen benennen */
function mehrere(): Task {
  const { m, r } = multiMol();
  const extra: Distractor[] = [];
  const kinds = new Set(r.prefixes.map(p => p.name));
  const lower: Kind[] = (["on", "ol", "amin"] as Kind[]).filter(k => kinds.has({ on: "oxo", ol: "hydroxy", amin: "amino" }[k as "on"]));
  for (const k of lower) {
    const w = ok(m, { principal: k });
    if (w && w.name !== r.name) extra.push(d(w.name, "prio", `${KIND_INFO[r.principal!].label} geht vor ${KIND_INFO[k].label}. Sie gibt die Endung ${KIND_INFO[r.principal!].suffix}.`));
  }
  return {
    ...mc(r.name, nameDistractors(m, r, extra.slice(0, 1)), 4, `Genau: ${r.name}.`),
    mol: m,
    prompt: "Wie heißt diese Verbindung?",
    hint: "Hauptgruppe → Endung. Längste Kette mit ihr, kleinste Nummern, alphabetisch.",
    explain: r.steps.slice(-3).join(" "),
  };
}

/** Name → richtige Formel wählen */
function struktur(): Task {
  for (;;) {
    const useMulti = Math.random() < 0.5;
    const base = useMulti ? multiMol() : (() => { let m: Mol, r: NameOk; do { m = mol(branchedAlkane()); r = ok(m)!; } while (!r.prefixes.length); return { m, r }; })();
    const { m, r } = base;
    // Fehlformeln: gleiche Bausteine, aber verschoben oder verzählt (echte andere Moleküle)
    const others: { m: Mol; miss: string; why: string }[] = [];
    const seen = new Set([r.name, ...r.alt]);
    const tryAdd = (mm: Mol, miss: string, why: (n: string) => string) => {
      const rr = ok(mm);
      if (rr && !seen.has(rr.name)) { seen.add(rr.name); others.push({ m: mm, miss, why: why(rr.name) }); }
    };
    for (let k = 0; k < 30 && others.length < 5; k++) {
      const mm = mutate(m);
      if (mm) tryAdd(mm.m, mm.miss, n => `Diese Formel heißt ${n}.`);
    }
    if (others.length < 3) continue;
    const opts = shuffle(others).slice(0, 3);
    const keys = [r.name, ...opts.map(o => ok(o.m)!.name)];
    return {
      ...mc(r.name, opts.map((o, i) => d(keys[i + 1], o.miss, o.why)), 4, `Genau: das ist ${r.name}.`),
      mols: Object.fromEntries(keys.map((k, i) => [k, i === 0 ? m : opts[i - 1].m])),
      prompt: `Welche Formel zeigt **${r.name}**?`,
      hint: "Stamm am Ende lesen, dann die Vorsilben mit ihren Nummern einzeichnen.",
      explain: r.steps.slice(-3).join(" "),
    };
  }
}

/** kleines Abändern: Ast an ein anderes C, Kette um 1 C länger/kürzer, Gruppe tauschen */
function mutate(m: Mol): { m: Mol; miss: string } | undefined {
  const atoms = m.atoms.map(a => ({ ...a })), bonds = m.bonds.map(b => ({ ...b }));
  const deg = (id: number) => bonds.filter(b => b.a === id || b.b === id).length;
  const kind = pick(["move", "move", "longer", "shorter", "swap"]);
  if (kind === "move") {
    // ein Endatom (Ast) an ein anderes C hängen
    const leaves = atoms.filter(a => deg(a.id) === 1);
    const leaf = pick(leaves);
    const bond = bonds.find(b => b.a === leaf.id || b.b === leaf.id)!;
    const targets = atoms.filter(a => a.el === "C" && a.id !== leaf.id && a.id !== bond.a && a.id !== bond.b);
    if (!targets.length) return;
    const t = pick(targets);
    const used = bonds.filter(b => b.a === t.id || b.b === t.id).reduce((s, b) => s + b.order, 0);
    if (used + bond.order > 4) return;
    if (bond.a === leaf.id) bond.b = t.id; else bond.a = t.id;
    return { m: layout({ atoms, bonds }), miss: "nummer" };
  }
  if (kind === "longer" || kind === "shorter") {
    const ends = atoms.filter(a => a.el === "C" && deg(a.id) === 1 && bonds.find(b => (b.a === a.id || b.b === a.id))!.order === 1);
    if (!ends.length) return;
    const e = pick(ends);
    if (kind === "shorter") {
      const nm = { atoms: atoms.filter(a => a.id !== e.id), bonds: bonds.filter(b => b.a !== e.id && b.b !== e.id) };
      return { m: layout(nm), miss: "zaehlen" };
    }
    const id = Math.max(...atoms.map(a => a.id)) + 1;
    return { m: layout({ atoms: [...atoms, { id, el: "C", x: 0, y: 0 }], bonds: [...bonds, { a: e.id, b: id, order: 1 }] }), miss: "zaehlen" };
  }
  // Gruppe tauschen: =O ↔ OH
  const o = atoms.find(a => a.el === "O" && deg(a.id) === 1);
  if (!o) return;
  const b = bonds.find(x => x.a === o.id || x.b === o.id)!;
  b.order = b.order === 2 ? 1 : 2;
  const c = b.a === o.id ? b.b : b.a;
  if (bonds.filter(x => x.a === c || x.b === c).reduce((s, x) => s + x.order, 0) > 4) return;
  return { m: layout({ atoms, bonds }), miss: "endung" };
}

// ── Level und Runden ─────────────────────────────────────────────────────────

const GENS: Record<string, () => Task> = { stamm, kette, alkan, alken, lage, ez, klasse, endung, gruppen, ester, prio, mehrere, struktur };

export const TYPE_NAMES: Record<string, string> = {
  stamm: "Stammnamen", kette: "Längste Kette", alkan: "Verzweigte Alkane", alken: "Alkene und Alkine", lage: "Lage der Mehrfachbindung", ez: "E/Z-Isomerie",
  klasse: "Stoffklassen", endung: "Endungen", gruppen: "Eine funktionelle Gruppe", ester: "Ester", prio: "Rangfolge der Gruppen",
  mehrere: "Mehrere Gruppen", struktur: "Name → Formel",
};

interface Level extends QuizLevel { types: string[]; seq: string[] }
const level = (n: number, name: string, desc: string, seq: string[]): Level => ({ id: `og-n${n}`, name, desc, seq, types: [...new Set(seq)] });
export const LEVELS: Level[] = [
  level(1, "Alkane", "Stammnamen, längste Kette, Äste mit Nummern", ["stamm", "stamm", "kette", "kette", "alkan", "kette", "alkan", "stamm", "alkan", "alkan"]),
  level(2, "Doppel- und Dreifachbindung", "-en und -in, Nummer der Mehrfachbindung, E/Z", ["alken", "lage", "ez", "alken", "lage", "ez", "alken", "alkan", "ez", "alken"]),
  level(3, "Funktionelle Gruppen", "Stoffklassen, Endungen, Alkohole bis Ester", ["klasse", "endung", "klasse", "gruppen", "endung", "gruppen", "klasse", "ester", "gruppen", "ester"]),
  level(4, "Mehrere Gruppen", "Rangfolge, Vorsilben, vom Namen zur Formel", ["prio", "mehrere", "prio", "struktur", "mehrere", "prio", "struktur", "mehrere", "struktur", "mehrere"]),
];

export const levelId = (_stufe: string, level: LevelKey) => (typeof level === "number" ? LEVELS[level].id : `og-${level}`);
export const levelName = (level: LevelKey) =>
  level === "mix" ? "Alles gemischt" : level === "weak" ? "Schwächen üben" : level === "due" ? "Heute fällig" : LEVELS[level].name;

/** Aufgaben in fester Reihenfolge, keine Frage doppelt */
function ordered(seq: string[]): Task[] {
  const seen = new Set<string>();
  const sig = (t: Task) => t.prompt + JSON.stringify(t.mol?.bonds ?? t.mols ?? null) + ("options" in t ? t.options.join() : "");
  return seq.map(id => {
    let t = GENS[id]();
    for (let k = 0; k < 40 && seen.has(sig(t)); k++) t = GENS[id]();
    seen.add(sig(t));
    return { ...t, type: id };
  });
}

export function makeRound(_stufe: string, level: LevelKey, stats?: TypeStats, due: string[] = []): Task[] {
  if (typeof level === "number") return ordered(LEVELS[level].seq);
  let ids = level === "mix" ? [...new Set(LEVELS.flatMap(l => l.types))]
    : level === "weak" ? weakTypes(stats, id => !!GENS[id])
    : level === "due" ? due.filter(id => GENS[id])
    : LEVELS[0].types;
  if (!ids.length) ids = LEVELS[0].types;
  return buildRound(ids, GENS, 10);
}

export { GENS };
