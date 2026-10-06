// Begriffe (lexicon.tsx): jeder Stoff hat einen kurzen Satz (DE und EN), und keine Karte verrät vor der Antwort die Lösung.
import { test, assert } from "vitest";
import { isValidElement, type ReactNode } from "react";
import { setLang } from "@lern/i18n";
import { wordCount } from "@lern/quiz";
import { METHODS, STEPS, VINYLS } from "../chem/data.ts";
import { GENERATORS, isBuild, isOrder, isTap } from "./tasks.ts";
import { GROUP_WHAT, METHOD_WHAT, STEP_WHAT, VINYL_WHAT, lexicon, termsFor } from "./lexicon.tsx";

test("jeder Stoff hat einen Satz – höchstens 15 Wörter, Deutsch und Englisch", () => {
  const bad: string[] = [];
  for (const lang of ["de", "en"] as const) {
    setLang(lang);
    const all = { ...VINYL_WHAT(), ...STEP_WHAT(), ...METHOD_WHAT(), ...GROUP_WHAT() };
    for (const id of [...VINYLS.map(v => v.id), ...STEPS.map(s => s.id), ...METHODS.map(m => m.id)]) if (!(all as Record<string, string>)[id]) bad.push(`${lang} ${id}: kein Satz`);
    for (const [id, s] of Object.entries(all)) if (wordCount(s!) > 15) bad.push(`${lang} ${id}: ${s}`);
    const terms = lexicon().map(t => t.term.toLowerCase());
    if (new Set(terms).size !== terms.length) bad.push(`${lang}: doppelte Begriffe`);
  }
  setLang("de");
  assert.deepEqual(bad, []);
});

/** Text einer Karte: React-Baum ablaufen, einfache Bausteine (ohne Hooks) aufrufen; Zeichnungen haben keinen Text */
function walk(n: ReactNode): string {
  if (n == null || typeof n === "boolean") return "";
  if (typeof n === "string" || typeof n === "number") return String(n);
  if (Array.isArray(n)) return n.map(walk).join(" ");
  if (!isValidElement(n)) return "";
  const { type, props } = n as { type: unknown; props: { children?: ReactNode } };
  if (typeof type === "function") { try { return walk((type as (p: unknown) => ReactNode)(props)); } catch { return ""; } }
  return walk(props.children);
}
const text = (n: ReactNode) => walk(n).replace(/\s+/g, " ").toLowerCase();

test("Karten aus Frage und Antworten verraten die richtige Antwort nicht", () => {
  const bad = new Set<string>();
  for (const [id, g] of Object.entries(GENERATORS)) for (let k = 0; k < 15; k++) {
    const t = { ...g(), type: id };
    if (isTap(t) || isOrder(t) || isBuild(t)) continue;
    const answer = t.options[t.answer];
    // Antworten, die selbst Stoffnamen sind (Name gesucht), oder Bilder: die Karten der anderen Antworten dürfen den gesuchten Namen nicht nennen
    const found = termsFor(t, false);
    const a = answer.toLowerCase();
    if (a.length < 6 || /^[\d\s.,]+$/.test(a)) continue;
    for (const d of found) if (text(d.body).includes(a)) bad.add(`${id}: Karte „${d.title}“ nennt „${answer}“`);
  }
  assert.deepEqual([...bad], []);
}, 120_000);

test("Polymer-Karten nennen bei „Monomer → Polymer“, „Polymer → Monomer“ und „Kette bauen“ das Monomer nicht", () => {
  for (const type of ["polyName", "monomerVon", "bauenHomo", "bauenCopo"]) for (const v of VINYLS) {
    const card = lexicon(type).find(d => d.term === v.polymer)!;
    assert.notInclude(text(card.body), v.name.toLowerCase(), `${type} ${v.polymer}`);
  }
  // Gegenprobe: ohne Ausblenden nennt die Karte das Monomer (der Text wird also gelesen)
  for (const v of VINYLS) assert.include(text(lexicon().find(d => d.term === v.polymer)!.body), v.name.toLowerCase(), v.polymer);
});
