// Formatiert **fett** und `Code` in Aufgabentexten.
import { Fragment } from "react";
import { getLang, midCase } from "@lern/i18n";

export function RichText({ text }: { text: string }) {
  // Englisch: Namen mitten im Satz klein (die Daten schreiben sie groß wie im Deutschen)
  const parts = (getLang() === "en" ? midCase(text) : text).split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return (
    <>
      {parts.map((p, i) =>
        p.startsWith("**") ? <strong key={i}>{p.slice(2, -2)}</strong>
          : p.startsWith("`") ? <code key={i}>{p.slice(1, -1)}</code>
            : <Fragment key={i}>{p}</Fragment>)}
    </>
  );
}
