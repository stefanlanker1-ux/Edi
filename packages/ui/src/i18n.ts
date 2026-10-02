// Sprache: Kern in @lern/i18n (auch für Pakete ohne React); hier der React-Hook.
import { useSyncExternalStore } from "react";
import { getLang, onLang, type Lang } from "@lern/i18n";

export * from "@lern/i18n";

/** React-Hook: aktuelle Sprache (Komponente zeichnet bei Wechsel neu) */
export function useLang(): Lang {
  return useSyncExternalStore(onLang, getLang, getLang);
}
