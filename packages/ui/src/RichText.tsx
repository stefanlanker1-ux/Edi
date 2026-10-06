// Formatiert **fett** und `Code` in Aufgabentexten; innerhalb von `TermScope` sind Begriffe antippbar (Terms.tsx).
import { Fragment, type ReactNode } from "react";
import { getLang, midCase } from "@lern/i18n";
import { useTerms } from "./termCtx.tsx";
import { TermLink, splitTerms } from "./Terms.tsx";

export function RichText({ text }: { text: string }) {
  const terms = useTerms();
  // Englisch: Namen mitten im Satz klein (die Daten schreiben sie groß wie im Deutschen)
  const parts = (getLang() === "en" ? midCase(text) : text).split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  // jeder Begriff nur beim ersten Vorkommen antippbar (ruhiges Schriftbild)
  const seen = new Set<number>();
  const marked = (s: string): ReactNode => (!terms ? s
    : splitTerms(s, terms.words, seen).map(([x, i], k) => (i < 0 ? <Fragment key={k}>{x}</Fragment> : <TermLink key={k} text={x} i={i} />)));
  return (
    <>
      {parts.map((p, i) =>
        p.startsWith("**") ? <strong key={i}>{marked(p.slice(2, -2))}</strong>
          : p.startsWith("`") ? <code key={i}>{p.slice(1, -1)}</code>
            : <Fragment key={i}>{marked(p)}</Fragment>)}
    </>
  );
}
