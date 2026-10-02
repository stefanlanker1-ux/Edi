// Farben für „Farbe“: jeder Teil des Namens (Stamm, Endung, jede Vorsilbe) hat eine Farbe aus der Palette –
// dieselbe im Namen und in der Formel. Stamm gelb (wie die hinterlegte Hauptkette), Hauptgruppe rot, Vorsilben der Reihe nach.

import type { NameOk } from "../chem/naming.ts";

export type Hue = "red" | "yellow" | "blue" | "green" | "violet" | "teal" | "orange" | "grey";
const PREFIX_HUES: Hue[] = ["blue", "green", "violet", "teal", "orange", "grey"];

export interface Coloring { hueOf: Record<string, Hue>; atomHue: Map<number, Hue> }

export function coloring(r: NameOk): Coloring {
  const hueOf: Record<string, Hue> = { parent: "yellow", principal: "red", alkyl: "teal" };
  let i = 0;
  for (const p of r.parts) if (p.key && !hueOf[p.key]) hueOf[p.key] = PREFIX_HUES[i++ % PREFIX_HUES.length];
  // Vorrang: Hauptgruppe vor Vorsilben vor Stamm (das C der COOH-Gruppe gehört zur Kette und zur Gruppe)
  const atomHue = new Map<number, Hue>();
  const set = (key: string) => { for (const a of r.groupsByKey[key] ?? []) atomHue.set(a, hueOf[key]); };
  set("parent");
  for (const k of Object.keys(r.groupsByKey)) if (k !== "parent" && k !== "principal") set(k);
  set("principal");
  return { hueOf, atomHue };
}
