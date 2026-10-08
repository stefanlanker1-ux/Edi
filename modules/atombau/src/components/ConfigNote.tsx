// Kennzeichen „Ausnahme“: die gemessene Konfiguration weicht vom Aufbauprinzip ab (Cr, Cu, Pd … und z. B. Cu⁺).

import { Tag } from "@lern/ui";
import { configException, type ConfigException } from "@lern/chem";
import { tr } from "@lern/i18n";

const LABEL: Record<ConfigException, () => string> = {
  d5: () => tr("Ausnahme: halb besetzte d-Unterschale", "Exception: half-filled d subshell"),
  d10: () => tr("Ausnahme: voll besetzte d-Unterschale", "Exception: filled d subshell"),
  f7: () => tr("Ausnahme: halb besetzte f-Unterschale", "Exception: half-filled f subshell"),
  other: () => tr("Ausnahme vom Aufbauprinzip (gemessen)", "Exception to the Aufbau principle (measured)"),
};

export function ExceptionTag({ Z, E = Z }: { Z: number; E?: number }) {
  const exc = configException(Z, E);
  return exc ? <Tag>{LABEL[exc]()}</Tag> : null;
}
