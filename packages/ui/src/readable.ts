// „Lesbar“: größere Buchstaben- und Wortabstände, mehr Zeilenabstand, Text linksbündig (Legasthenie-freundlich).
// Gilt für alle Apps, Schalter in der Kopfzeile (AppShell), gespeichert in localStorage "lern-lesbar".
// Die Stile hängen am Attribut `data-lesbar` auf <html> (packages/ui/src/styles/tokens.css).

import { useSyncExternalStore } from "react";

const KEY = "lern-lesbar";
const listeners = new Set<() => void>();

export function readableOn(): boolean {
  try { return localStorage.getItem(KEY) === "on"; } catch { return false; }
}

function apply(on: boolean) {
  if (typeof document !== "undefined") document.documentElement.toggleAttribute("data-lesbar", on);
}

export function setReadable(on: boolean) {
  try { localStorage.setItem(KEY, on ? "on" : "off"); } catch { /* egal */ }
  apply(on);
  listeners.forEach(l => l());
}

/** React-Hook: aktueller Stand des Schalters „Lesbar“ */
export function useReadable(): boolean {
  return useSyncExternalStore(cb => { listeners.add(cb); return () => { listeners.delete(cb); }; }, readableOn, () => false);
}

// beim Laden der App den gespeicherten Stand anwenden (vor dem ersten Render, damit nichts springt)
apply(readableOn());
