// Auffangnetz: stürzt eine Ansicht ab (z. B. gespeicherter Stand einer alten Version passt nicht mehr),
// bleibt die App bedienbar. „Neu starten“ setzt zuerst nur laufende Runden und den Baukasten zurück (Fortschritt bleibt);
// stürzt dieselbe App danach bald wieder ab (zweites „Neu starten“ innerhalb von 10 Minuten), alles dieser App.

import { Component, type ReactNode } from "react";
import { Button } from "./components.tsx";
import { tr } from "./i18n.ts";

const TRIED = "lern-rescue";
/** so lange nach einem „Neu starten“ gilt ein weiterer Absturz derselben App als „noch nicht behoben“ */
const AGAIN_MS = 10 * 60_000;

/** Speicher-Schlüssel mit Fortschritt (Fertigkeiten, erledigte Lektionen …) – ausdrücklich gekennzeichnet, nicht erraten; `shared` = mehrere Module teilen ihn */
const PROGRESS = new Map<string, { shared: boolean }>();
/**
 * Schlüssel als Fortschritt kennzeichnen: das erste „Neu starten“ behält ihn (nur laufende Runden `state.games` fallen weg).
 * `shared` (z. B. erledigte Lektionen aller Module): bleibt auch beim Zurücksetzen von allem – sonst verlöre ein anderes Modul seinen Stand; nur ein kaputter Stand wird gelöscht.
 */
export function progressKey(key: string, shared = false): string {
  PROGRESS.set(key, { shared: shared || !!PROGRESS.get(key)?.shared });
  return key;
}

export function resetStorage(keys: string[], all: boolean) {
  for (const k of keys) {
    try {
      const raw = localStorage.getItem(k);
      if (raw === null) continue;
      let data: { state?: Record<string, unknown> } | null = null;
      try { data = JSON.parse(raw); } catch { /* kaputt → löschen */ }
      const mark = PROGRESS.get(k);
      if (mark && (!all || mark.shared) && data && typeof data === "object") {
        if (data.state && typeof data.state === "object" && "games" in data.state) {
          delete data.state.games;
          localStorage.setItem(k, JSON.stringify(data));
        }
      } else localStorage.removeItem(k);
    } catch { /* Speicher gesperrt */ }
  }
}

/** „Neu starten“: Merkzeichen je App (Schlüsselliste) mit Zeit – ein Absturz in einer anderen App oder viel später beginnt wieder sanft.
 *  Gibt zurück, ob alles zurückgesetzt wurde. */
export function rescueReset(keys: string[], now = Date.now()): boolean {
  const mark = `${TRIED}:${keys.join(",")}`;
  let all = false;
  try {
    const t = Number(sessionStorage.getItem(mark));
    all = t > 0 && now - t < AGAIN_MS;
    if (all) sessionStorage.removeItem(mark);
    else sessionStorage.setItem(mark, String(now));
  } catch { /* egal */ }
  resetStorage(keys, all);
  return all;
}

export class Rescue extends Component<{ storage?: string[]; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(error: unknown) { console.error(error); }
  restart = () => {
    rescueReset(this.props.storage ?? []);
    location.reload();
  };
  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div className="ui-rescue ui-card" role="alert">
        <h2>{tr("Hier hakt etwas.", "Something went wrong.")}</h2>
        <div className="ui-rescue-btns">
          <Button onClick={() => this.setState({ failed: false })}>{tr("Nochmal", "Try again")}</Button>
          <Button variant="primary" onClick={this.restart}>{tr("Neu starten", "Restart")}</Button>
        </div>
      </div>
    );
  }
}
