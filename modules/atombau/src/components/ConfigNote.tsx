// Kennzeichen „Ausnahme“: die gemessene Konfiguration weicht vom Aufbauprinzip ab (Cr, Cu, Pd …); bei Ionen: Ion selbst (V⁺) oder nur das Atom (Cu⁺).

import { Tag } from "@lern/ui";
import { configException, type ConfigException } from "@lern/chem";
import { tr } from "@lern/i18n";

const LABEL: Record<ConfigException, () => string> = {
  d5: () => tr("Ausnahme: halb besetzte d-Unterschale", "Exception: half-filled d subshell"),
  d10: () => tr("Ausnahme: voll besetzte d-Unterschale", "Exception: filled d subshell"),
  f7: () => tr("Ausnahme: halb besetzte f-Unterschale", "Exception: half-filled f subshell"),
  other: () => tr("Ausnahme vom Aufbauprinzip (gemessen)", "Exception to the Aufbau principle (measured)"),
  ion: () => tr("Ausnahme: Ion gemessen anders besetzt", "Exception: measured configuration of the ion differs"),
  atom: () => tr("Atom ist Ausnahme, Ion nach Regel", "Atom is an exception, ion follows the rule"),
};

export function ExceptionTag({ Z, E = Z }: { Z: number; E?: number }) {
  const exc = configException(Z, E);
  return exc ? <Tag>{LABEL[exc]()}</Tag> : null;
}
