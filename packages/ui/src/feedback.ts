// Dezente Rückmeldung: kurzer Ton (WebAudio, leise) und Vibration. Klang ist standardmäßig aus (im Unterricht stumm),
// der Schalter sitzt in der Kopfzeile (AppShell) und gilt für alle Apps (localStorage "lern-sound").

import { useSyncExternalStore } from "react";

const KEY = "lern-sound";
const listeners = new Set<() => void>();

export function soundOn(): boolean {
  try { return localStorage.getItem(KEY) === "on"; } catch { return false; }
}
export function setSound(on: boolean) {
  try { localStorage.setItem(KEY, on ? "on" : "off"); } catch { /* egal */ }
  listeners.forEach(l => l());
}
/** React-Hook: aktueller Klang-Schalter */
export function useSound(): boolean {
  return useSyncExternalStore(cb => { listeners.add(cb); return () => { listeners.delete(cb); }; }, soundOn, () => false);
}

let ctx: AudioContext | undefined;
/** Kurzer Ton: Treffer = zwei Töne aufwärts, Noch nicht = ein tiefer Ton. Nur wenn Klang eingeschaltet ist. */
export function ding(ok: boolean) {
  if (!soundOn()) return;
  try {
    ctx ??= new AudioContext();
    if (ctx.state === "suspended") void ctx.resume();
    const t0 = ctx.currentTime;
    const notes = ok ? [[660, 0, 0.09], [880, 0.09, 0.14]] : [[330, 0, 0.16]];
    for (const [f, at, dur] of notes) {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = "sine"; o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, t0 + at);
      g.gain.exponentialRampToValueAtTime(0.06, t0 + at + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + at + dur);
      o.connect(g).connect(ctx.destination);
      o.start(t0 + at); o.stop(t0 + at + dur + 0.02);
    }
  } catch { /* kein Audio */ }
}
