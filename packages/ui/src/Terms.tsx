// Begriffe im Text antippbar: RichText markiert das erste Vorkommen eines Begriffs (gepunktet unterstrichen),
// Antippen öffnet ein Blatt mit kurzer Erklärung. Welche Begriffe gelten, legt `TermScope` fest (z. B. je Aufgabe).
// In Blättern und Antwortknöpfen sind Begriffe aus (`NoTerms`): kein Blatt über dem Blatt, kein Knopf im Knopf.

import { useMemo, useState, type ReactNode } from "react";
import { Sheet } from "./Sheet.tsx";
import { TermCtx, useTerms, type TermCtxValue } from "./termCtx.tsx";

export { NoTerms, useTerms } from "./termCtx.tsx";

export interface TermDef {
  /** Wort im Text (Groß-/Kleinschreibung egal) */
  term: string;
  /** weitere Schreibweisen (anderer Name, Kurzzeichen) */
  also?: string[];
  /** Überschrift des Blatts */
  title: string;
  body: ReactNode;
}

const wordChar = (c: string | undefined) => !!c && /[\p{L}\p{N}]/u.test(c);

/** Fundstelle eines Worts als ganzes Wort (auch mit Genitiv-s: „Styrols“) */
function findWord(low: string, w: string, from = 0): number {
  for (let at = low.indexOf(w, from); at >= 0; at = low.indexOf(w, at + 1)) {
    let end = at + w.length;
    if (low[end] === "s" && !wordChar(low[end + 1])) end++;
    if (!wordChar(low[at - 1]) && !wordChar(low[end])) return at;
  }
  return -1;
}

/** Begriffe, die im Text vorkommen */
export function termsIn(text: string, terms: TermDef[]): TermDef[] {
  const low = text.toLowerCase();
  return terms.filter(t => [t.term, ...(t.also ?? [])].some(w => findWord(low, w.toLowerCase()) >= 0));
}

/** Text in Stücke: [Text, Begriff-Nr. oder −1]; jeder Begriff nur einmal (`seen`) */
export function splitTerms(text: string, words: { w: string; i: number }[], seen: Set<number>): [string, number][] {
  const low = text.toLowerCase();
  const out: [string, number][] = [];
  let pos = 0;
  for (;;) {
    let best: { at: number; len: number; i: number } | null = null;
    for (const { w, i } of words) {
      if (seen.has(i)) continue;
      const at = findWord(low, w, pos);
      if (at >= 0 && (!best || at < best.at || (at === best.at && w.length > best.len))) best = { at, len: w.length, i };
    }
    if (!best) break;
    if (best.at > pos) out.push([text.slice(pos, best.at), -1]);
    out.push([text.slice(best.at, best.at + best.len), best.i]);
    seen.add(best.i);
    pos = best.at + best.len;
  }
  if (pos < text.length) out.push([text.slice(pos), -1]);
  return out;
}

/** Begriffe für den Inhalt; ein gemeinsames Blatt zeigt die Erklärung */
export function TermScope({ terms, children }: { terms: TermDef[]; children: ReactNode }) {
  const [open, setOpen] = useState(-1);
  const ctx = useMemo<TermCtxValue | null>(() => (terms.length
    ? { words: terms.flatMap((t, i) => [t.term, ...(t.also ?? [])].map(w => ({ w: w.toLowerCase(), i }))), open: setOpen } : null), [terms]);
  const t = terms[open];
  return (
    <TermCtx.Provider value={ctx}>
      {children}
      <Sheet open={!!t} title={t?.title ?? ""} onClose={() => setOpen(-1)}>{t?.body}</Sheet>
    </TermCtx.Provider>
  );
}

/** antippbarer Begriff im Fließtext – Inline-Element mit Knopf-Rolle (ein echter Knopf ließe das folgende Satzzeichen allein umbrechen) */
export function TermLink({ text, i }: { text: string; i: number }) {
  const ctx = useTerms();
  if (!ctx) return <>{text}</>;
  const open = (e: { stopPropagation: () => void; preventDefault: () => void }) => { e.preventDefault(); e.stopPropagation(); ctx.open(i); };
  return <span role="button" tabIndex={0} className="ui-term" onClick={open} onKeyDown={e => { if (e.key === "Enter" || e.key === " ") open(e); }}>{text}</span>;
}
