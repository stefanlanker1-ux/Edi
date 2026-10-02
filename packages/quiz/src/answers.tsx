// Gemeinsame Antwortformen für Quiz-Aufgaben aller Apps.

import { useState } from "react";
import { Button } from "@lern/ui";
import { tr } from "@lern/ui";
import type { Answered, Submit } from "./types.ts";

/** Zahl als Eingabe: ganze Zahl (Standard) oder Dezimalzahl mit Komma oder Punkt, optional mit Einheit dahinter.
 *  Meldet `values.n` – Fallen (`traps`) der Aufgabe prüfen dieses Feld. */
export function NumberAnswer({ answer, answered, submit, unit, decimal = false, max = 999, equal = (a, b) => a === b, format = String }: {
  answer: number; answered: Answered | null; submit: Submit;
  unit?: string;
  /** Dezimalzahl erlaubt (Komma oder Punkt) */
  decimal?: boolean;
  max?: number;
  /** Vergleich mit der Lösung, z. B. mit Rundungstoleranz */
  equal?: (given: number, answer: number) => boolean;
  /** Anzeige der gemeldeten Zahl nach dem Prüfen */
  format?: (n: number) => string;
}) {
  const [v, setV] = useState("");
  const shown = answered?.values ? format(answered.values.n) : v;
  const parse = (s: string) => Number(s.trim().replace(",", "."));
  const ready = v.trim() !== "" && !Number.isNaN(parse(v));
  return (
    <form className="num-answer" onSubmit={e => {
      e.preventDefault();
      if (!ready || answered) return;
      const n = parse(v);
      submit({ ok: equal(n, answer), values: { n } });
    }}>
      {decimal
        ? <input type="text" inputMode="decimal" value={shown} disabled={!!answered} aria-label={unit ? tr(`Antwort in ${unit}`, `Answer in ${unit}`) : tr("Antwort", "Answer")} onChange={e => setV(e.target.value)} autoFocus />
        : <input type="number" inputMode="numeric" min={0} max={max} value={shown} disabled={!!answered} aria-label={tr("Antwort", "Answer")} onChange={e => setV(e.target.value)} autoFocus />}
      {unit && <span className="num-unit">{unit}</span>}
      {!answered && <Button variant="primary" icon="check" type="submit" disabled={!ready}>{tr("Prüfen", "Check")}</Button>}
    </form>
  );
}
