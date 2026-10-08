import { useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore, type RefObject } from "react";

/**
 * Zurück-Taste (Android, Browser) schließt ein offenes Blatt bzw. die Erklärung, statt die App zu verlassen: eigener Verlaufseintrag je Öffnen
 * (`kind` = Name im Verlaufszustand). Steht der Verlauf nach „Zurück“ wieder auf dem eigenen Eintrag (ein Blatt darüber wurde geschlossen), bleibt es offen.
 * Die Kennung ist je Öffnen neu: ein Eintrag, der nach dem Neuladen stehen blieb, gehört zu keinem Blatt mehr.
 */
export function useBackClose(open: boolean, onClose: () => void, kind: string) {
  const close = useRef(onClose);
  close.current = onClose;
  useEffect(() => {
    if (!open) return;
    const id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
    history.pushState({ [kind]: id }, "");
    let popped = false;
    const mine = () => (history.state as Record<string, unknown> | null)?.[kind] === id;
    const onPop = () => { if (mine()) return; popped = true; close.current(); };
    addEventListener("popstate", onPop);
    return () => { removeEventListener("popstate", onPop); if (!popped && mine()) history.back(); };
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
