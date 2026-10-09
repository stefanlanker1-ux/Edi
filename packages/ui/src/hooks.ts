import { useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore, type RefObject } from "react";

// ── Zurück schließt Blätter ────────────────────────────────────────────────────
// Jedes offene Blatt bzw. die Erklärung hat einen eigenen Verlaufseintrag `{ [kind]: Kennung, overlay: true }`. Im Browser (auch am Handy
// und mit der Zurück-Geste) geht „Zurück“ dorthin zurück und schließt so das Blatt; in der Android-App leitet `apps/edi/src/native.ts` die
// Zurück-Taste in denselben Verlauf (siehe docs/entwicklung.md, „Android-Zurück-Taste“).

/** Kennung des Eintrags, dessen Blatt gerade geschlossen wurde und dessen `history.back()` noch aussteht */
let closing: string | null = null;
const stateOf = () => (typeof history === "undefined" ? null : (history.state as Record<string, unknown> | null));

/** Eintrag für ein geöffnetes Blatt: neu – oder der eben geschlossene wird übernommen (Schließen und Öffnen im selben Durchlauf, z. B. Blatt-Wechsel,
 *  Neuaufbau in React StrictMode); sonst nähme das nachlaufende `back()` dem neuen Blatt seinen Eintrag und schlösse es sofort */
export function openBackEntry(kind: string): string {
  const id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
  const st = stateOf();
  if (closing && st?.overlay && Object.values(st).includes(closing)) { closing = null; history.replaceState({ [kind]: id, overlay: true }, ""); }
  else history.pushState({ [kind]: id, overlay: true }, "");
  return id;
}

/** Blatt ohne „Zurück“ geschlossen (Schließen-Knopf, Ende): den eigenen Eintrag wieder entfernen – erst nach dem laufenden Durchlauf,
 *  damit ein gleich danach geöffnetes Blatt ihn übernehmen kann */
export function closeBackEntry(kind: string, id: string) {
  if (stateOf()?.[kind] !== id) return;
  closing = id;
  queueMicrotask(() => {
    if (closing !== id) return;
    closing = null;
    if (stateOf()?.[kind] === id) history.back();
  });
}

/** Beim Start: Eintrag eines Blatts, das vor dem Neuladen offen war, gehört zu keinem Blatt mehr – einmal zurück, sonst bräuchte „Zurück“ später einen Schritt mehr */
export function dropStaleBackEntry() {
  const st = stateOf();
  if (st && (st.overlay || "uiSheet" in st || "uiGuide" in st)) history.back();
}
dropStaleBackEntry();

/**
 * Zurück schließt ein offenes Blatt bzw. die Erklärung, statt die Seite zu verlassen: eigener Verlaufseintrag je Öffnen
 * (`kind` = Name im Verlaufszustand). Steht der Verlauf nach „Zurück“ wieder auf dem eigenen Eintrag (ein Blatt darüber wurde geschlossen), bleibt es offen.
 * Die Kennung ist je Öffnen neu: ein Eintrag, der nach dem Neuladen stehen blieb, gehört zu keinem Blatt mehr.
 */
export function useBackClose(open: boolean, onClose: () => void, kind: string) {
  const close = useRef(onClose);
  close.current = onClose;
  useEffect(() => {
    if (!open) return;
    const id = openBackEntry(kind);
    let popped = false;
    const onPop = () => { if (stateOf()?.[kind] === id) return; popped = true; close.current(); };
    addEventListener("popstate", onPop);
    return () => { removeEventListener("popstate", onPop); if (!popped) closeBackEntry(kind, id); };
  }, [open, kind]);
}

/** Reagiert live auf eine CSS-Media-Query, z. B. useMediaQuery("(max-width: 899px)") */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    cb => { const m = matchMedia(query); m.addEventListener("change", cb); return () => m.removeEventListener("change", cb); },
    () => matchMedia(query).matches,
    () => false,
  );
}

export const useNarrow = () => useMediaQuery("(max-width: 899px)");
export const useReducedMotion = () => useMediaQuery("(prefers-reduced-motion: reduce)");

/** Breite eines Elements in Pixeln (live, per ResizeObserver) – für Zeichnungen, die sich an den Platz anpassen */
export function useWidth(ref: RefObject<HTMLElement | null>, fallback = 360): number {
  const [w, setW] = useState(fallback);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    setW(el.clientWidth || fallback);
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => setW(el.clientWidth || fallback));
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref, fallback]);
  return w;
}

/** Kurzes Vibrieren auf Handys als Rückmeldung */
export function buzz(pattern: number | number[] = 12) {
  try { navigator.vibrate?.(pattern); } catch { /* nicht unterstützt */ }
}

/** Farbschema setzen (hell/dunkel) inkl. Browser-Leistenfarbe */
export function applyTheme(theme: "light" | "dark") {
  document.documentElement.dataset.theme = theme;
  const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
  if (meta) meta.content = getComputedStyle(document.documentElement).getPropertyValue("--bg").trim() || (theme === "dark" ? "#0d0d0d" : "#ffffff");
}
