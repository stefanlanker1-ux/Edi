// Auffangnetz: stürzt eine Ansicht ab (z. B. gespeicherter Stand einer alten Version passt nicht mehr),
// bleibt die App bedienbar. „Neu starten“ setzt zuerst nur laufende Runden und den Baukasten zurück (Fortschritt bleibt),
// beim zweiten Mal in derselben Sitzung alles dieser App.

import { Component, type ReactNode } from "react";
import { Button } from "./components.tsx";

const TRIED = "lern-rescue";

export function resetStorage(keys: string[], all: boolean) {
  for (const k of keys) {
    try {
      const raw = localStorage.getItem(k);
      if (raw === null) continue;
      let data: { state?: Record<string, unknown> } | null = null;
      try { data = JSON.parse(raw); } catch { /* kaputt → löschen */ }
      if (!all && data?.state && typeof data.state === "object" && "progress" in data.state) {
        delete data.state.games;
        localStorage.setItem(k, JSON.stringify(data));
      } else localStorage.removeItem(k);
    } catch { /* Speicher gesperrt */ }
  }
}

export class Rescue extends Component<{ storage?: string[]; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(error: unknown) { console.error(error); }
  restart = () => {
    let tried = false;
    try { tried = sessionStorage.getItem(TRIED) === "1"; sessionStorage.setItem(TRIED, "1"); } catch { /* egal */ }
    resetStorage(this.props.storage ?? [], tried);
    location.reload();
  };
  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div className="ui-rescue ui-card" role="alert">
        <h2>Hier hakt etwas.</h2>
        <div className="ui-rescue-btns">
          <Button onClick={() => this.setState({ failed: false })}>Nochmal</Button>
          <Button variant="primary" onClick={this.restart}>Neu starten</Button>
        </div>
      </div>
    );
  }
}
