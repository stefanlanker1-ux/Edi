// Welche Darstellung passt zu einer Umrechnung? Seltene Vorsilben (µ, n, M, G …) direkt als Zehnerpotenz (Vorsilben-Skala),
// sonst Pfeilkette über die Nachbareinheiten.

import { parseUnit } from "@lern/units";

/** kommt eine Einheit mit seltener Vorsilbe vor (µm, ms, MHz, kJ …)? */
export function rare(...units: string[]): boolean {
  return units.some(u => { try { return parseUnit(u).factors.some(f => !!f.a.os); } catch { return false; } });
}
