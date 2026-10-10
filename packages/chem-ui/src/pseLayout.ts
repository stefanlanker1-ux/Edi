// Lage der Zellen im Periodensystem (Gitter-Spalte und -Zeile) – ohne Darstellung, damit sie getestet werden kann.
// Unterstufe: Hauptgruppen I–VIII, Perioden 1–4 (bis Calcium). Oberstufe: Langperiodensystem, Gruppen 1–18, bis Radon;
// mit `period7` zusätzlich die 7. Periode bis Oganesson. Lanthanoide (und mit `period7` Actinoide) stehen als eigene Zeilen
// unter der Tabelle, an ihrem Platz in Gruppe 3 ein Platzhalter („57–71“, „89–103“).
// Gitter: Spalte 1 = Periodennummer, Spalten 2–19 = Gruppen 1–18; Zeile 1 = Gruppennummer, Zeile p + 1 = Periode p.

import { BY_Z, ELEMENTS, mainGroupNumber } from "@lern/chem";

export interface PseLayoutOpts { us: boolean; period7?: boolean }

/** f-Block-Reihen: erstes und letztes Element, Periode */
export const F_SERIES = [
  { first: 57, last: 71, period: 6, range: "57–71", label: "La–Lu" },
  { first: 89, last: 103, period: 7, range: "89–103", label: "Ac–Lr" },
] as const;

/** Ordnungszahlen, die das PSE zeigt */
export function pseElements({ us, period7 = false }: PseLayoutOpts): number[] {
  const max = us ? 20 : period7 ? 118 : 86;
  return ELEMENTS.filter(e => e.Z <= max).map(e => e.Z);
}

/** Anzahl der Perioden (Zeilen der Haupttabelle) */
export const psePeriods = ({ us, period7 = false }: PseLayoutOpts) => (us ? 4 : period7 ? 7 : 6);

/** die f-Block-Reihen, die das PSE zeigt (Unterstufe keine) */
export const pseSeries = ({ us, period7 = false }: PseLayoutOpts) => (us ? [] : period7 ? F_SERIES : F_SERIES.slice(0, 1));

/** Gitterzeile der f-Block-Reihe i (nach einer Lücke unter der letzten Periode) */
export const seriesRow = (opts: PseLayoutOpts, i: number) => psePeriods(opts) + 3 + i;

/** Zelle eines Elements: Gitterspalte und -zeile */
export function cellPosition(Z: number, opts: PseLayoutOpts): { col: number; row: number } {
  const e = BY_Z[Z];
  if (e.group === null) {
    const i = F_SERIES.findIndex(s => Z >= s.first && Z <= s.last);
    // La bzw. Ac stehen unter Gruppe 3 (Spalte 4)
    return { col: Z - F_SERIES[i].first + 4, row: seriesRow(opts, i) };
  }
  return { col: (opts.us ? mainGroupNumber(Z)! : e.group) + 1, row: e.period + 1 };
}

/** Platzhalter der f-Block-Reihen in Gruppe 3 */
export function placeholders(opts: PseLayoutOpts): { range: string; label: string; first: number; last: number; col: number; row: number; labelRow: number }[] {
  return pseSeries(opts).map((s, i) => ({ range: s.range, label: s.label, first: s.first, last: s.last, col: 4, row: s.period + 1, labelRow: seriesRow(opts, i) }));
}
