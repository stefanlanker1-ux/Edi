// Begriffe: Jedes Fachwort, das eine Aufgabe eines Kapitels nennt (Frage, Antworten, Rückmeldungen, Tipp, Erklärung),
// steht vorher fett in einer Lektion oder Erklärkarte dieses oder eines früheren Kapitels (bzw. in `known`). Merksätze zählen nicht als Einführung.
import { test, assert } from "vitest";
import { GENERATORS, LEVELS, makeRound, isTap, isOrder, isBuild, type Task } from "./tasks.ts";
import { LESSONS } from "../lessons.tsx";
import { CARDS } from "./explain.tsx";
import { STEPS, VINYLS } from "../chem/data.ts";

/** Fachwörter (Wortstamm; gefunden wird jedes Wort, das den Stamm enthält) */
export const GLOSSARY = [
  "Seitengruppe", "gesättigt", "Hauptkette", "Benzolring", "Acrylnitril", "Tetrafluorethen", "Methylmethacrylat", "Vinylacetat", "Nitrilgruppe", "Acetatgruppe",
  "Katalysator", "DBPO", "Endgruppe", "Azobisisobutyronitril", "AIBN",
  "syndiotaktisch", "isotaktisch", "ataktisch", "PE-HD", "PE-LD", "Äste", "verzweigt", "statistisch", "Aluminium", "Ethylgruppe", "Elektronenpaar", "Nebenreaktion", "Blockcopolymer",
  "Polyester", "Aminogruppe", "Milchsäure", "Aminohexansäure", "PLA", "PBT", "PA 6", "Urethan", "Disäure", "Kettenstopper", "Hydrolyse",
  "Isocyanat", "Harnstoff", "Epoxid", "Diepoxid",
  "Thermoplast", "Duroplast", "Elastomer", "Recycling", "Melaminharz", "Phenoplast", "Kautschuk", "Copolymer", "Umsatz", "Stufenwachstum",
  "Acrylglas", "Polyamid", "Säurechlorid", "Diamin", "Diol", "Hochdruck",
];
/** Stoffnamen (Monomere und ihre gesättigten Gegenstücke): eingeführt, sobald sie in einer Lektion bzw. Erklärkarte 1…k vorkommen (auch ohne Fettdruck) */
const NAMES = [...new Set([...VINYLS.map(v => v.name), ...STEPS.map(s => s.name), "Ethan", "Propan", "Chlorethan", "Ethylbenzol", "Propannitril", "Tetrafluorethan"])];
const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
// Kürzel (nur Großbuchstaben) genau und mit Groß-/Kleinschreibung, Wörter als Teil eines Wortes
const has = (text: string, g: string) => /^[A-Z-]+$/.test(g) ? new RegExp(`(^|[^\\p{L}])${esc(g)}([^\\p{L}]|$)`, "u").test(text) : new RegExp(`(^|[^\\p{L}])\\p{L}*${esc(g)}`, "iu").test(text);
const bold = (t: string) => [...t.matchAll(/\*\*([^*]+)\*\*/g)].map(m => m[1]);

/** ganzer Text der Lektionen und Erklärkarten 1…k (für Stoffnamen) */
function lessonText(k: number): string {
  const out: string[] = [];
  for (let i = 0; i <= k; i++) {
    const l = LESSONS[i];
    out.push(...(l.known ?? []));
    for (const s of l.steps) out.push(s.say ?? "", s.ask, s.ok, ...(s.lines ?? []), ...(s.options ?? []), ...Object.values(s.why ?? {}));
    out.push(...(CARDS[`k${i + 1}`]?.points ?? []));
  }
  return out.join(" | ");
}

/** eingeführt bis Kapitel k: fett in Lektionen und Erklärkarten 1…k, dazu `known` */
function introduced(k: number): string[] {
  const out: string[] = [];
  for (let i = 0; i <= k; i++) {
    const l = LESSONS[i];
    out.push(...(l.known ?? []));
    for (const s of l.steps) for (const t of [s.say ?? "", s.ask, s.ok, ...(s.lines ?? [])]) out.push(...bold(t));
    for (const p of CARDS[`k${i + 1}`]?.points ?? []) out.push(...bold(p));
  }
  return out;
}

const texts = (t: Task): string[] => {
  const base = [t.prompt, t.hint, t.explain, (t as { tip?: string }).tip ?? ""];
  if (isTap(t) || isOrder(t) || isBuild(t)) return [...base, t.sol, ...(t.traps ?? []).map(x => x.why), ...(isOrder(t) ? t.names : []), ...(isBuild(t) ? t.pool.map(p => p.name) : [])];
  return [...base, ...t.options, ...Object.values(t.why ?? {})];
};

test("Kapitel fragen nur eingeführte Fachwörter ab", () => {
  const out = new Set<string>();
  for (let k = 0; k < LEVELS.length; k++) {
    const intro = introduced(k).join(" | ");
    // Kapitel-Ablauf und alle Typen des Kapitels (auch die aus „Alles gemischt“, „Heute fällig“, „Schwächen üben“)
    const tasks = [...Array.from({ length: 120 }, () => makeRound("us", k)).flat(), ...LEVELS[k].types.flatMap(id => Array.from({ length: 40 }, () => ({ ...GENERATORS[id](), type: id })))];
    const plain = lessonText(k);
    // Stoffnamen als ganze Wörter (Propen ≠ Polypropen)
    const word = (text: string, n: string) => new RegExp(`(^|[^\\p{L}])${esc(n)}([^\\p{L}]|$)`, "u").test(text);
    for (const t of tasks) for (const x of texts(t)) for (const n of NAMES)
      if (word(x, n) && !word(plain, n)) out.add(`K${k + 1} ${t.type}: Stoff „${n}“ in „${x.replace(/\*\*/g, "").slice(0, 90)}“`);
    for (const t of tasks) for (const x of texts(t)) for (const g of GLOSSARY)
      if (has(x, g) && !has(intro, g)) out.add(`K${k + 1} ${t.type}: „${g}“ in „${x.replace(/\*\*/g, "").slice(0, 90)}“`);
  }
  assert.deepEqual([...out].sort(), []);
}, 120_000);
