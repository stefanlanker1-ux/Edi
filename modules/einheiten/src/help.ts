// Welche Darstellung passt zu einer Umrechnung? Seltene Vorsilben (µ, n, M, G …) direkt als Zehnerpotenz (Vorsilben-Skala),
// sonst Pfeilkette über die Nachbareinheiten.

import { parseUnit, prefixStep } from "@lern/units";

/**
 * Skala statt Pfeilkette? Oberstufe: jede Umrechnung über Vorsilben (km → m, m² → cm², ml → l) als Zehnerpotenz auf der Skala;
 * Unterstufe: Pfeilkette und Stellenwerttafel (seltene Vorsilben gibt es dort nicht).
 */
export const scaleMode = (oberstufe: boolean, from: string, to: string) => !!prefixStep(from, to) && (oberstufe || rare(from, to));

/** kommt eine Einheit mit seltener Vorsilbe vor (µm, ms, MHz, kJ …)? */
export function rare(...units: string[]): boolean {
  return units.some(u => { try { return parseUnit(u).factors.some(f => !!f.a.os); } catch { return false; } });
}
