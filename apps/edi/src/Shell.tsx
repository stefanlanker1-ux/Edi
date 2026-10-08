// App-Hülle: Adresse (#/<modul>) → Übersicht oder Modul.
// Jedes Modul wird erst beim Öffnen geladen (eigene Datei im Build). Solange es offen ist, steht seine Kennung
// als <html data-modul="…"> am Dokument – nur dann gelten seine Stile (scripts/modul-scope.ts).

import { Component, Suspense, lazy, useLayoutEffect, useSyncExternalStore, type ComponentType, type LazyExoticComponent, type ReactNode } from "react";
import { CurrentModul, HomeLink, tr, useLang, type LernModule } from "@lern/ui";
import { MODULES, moduleById } from "./modules.ts";
import { Overview, modName } from "./Overview.tsx";

const subscribe = (cb: () => void) => { addEventListener("hashchange", cb); return () => removeEventListener("hashchange", cb); };
const getHash = () => location.hash;

/** Kennung des Moduls aus der Adresse: #/atombau, #/atombau/… → "atombau" */
export function routeOf(hash: string): string | undefined {
  const id = hash.replace(/^#\/?/, "").split(/[/?]/)[0];
  return id && moduleById(id) ? id : undefined;
}

export function Shell() {
  const hash = useSyncExternalStore(subscribe, getHash, () => "");
  const id = routeOf(hash);
  const m = id ? moduleById(id) : undefined;
  // key: beim Wechsel des Moduls alles neu aufbauen (kein Zustand wandert von einem Modul ins nächste)
  return m ? <ModuleView key={m.id} m={m} /> : <Overview />;
}

const views = new Map<string, LazyExoticComponent<ComponentType>>();
const viewOf = (m: LernModule) => {
  let v = views.get(m.id);
  if (!v) { v = lazy(m.load); views.set(m.id, v); }
  return v;
};

/** Module nach kurzer Zeit im Hintergrund vorladen, damit das Öffnen auch ohne Netz sofort geht */
export function preloadModules() {
  const run = () => MODULES.forEach(m => { m.load().catch(() => { /* später erneut beim Öffnen */ }); });
  if ("requestIdleCallback" in globalThis) requestIdleCallback(run, { timeout: 4000 });
  else setTimeout(run, 2000);
}

function ModuleView({ m }: { m: LernModule }) {
  const View = viewOf(m);
  const lang = useLang();
  useLayoutEffect(() => {
    const html = document.documentElement;
    html.dataset.modul = m.id;
    document.title = `${modName(m)} – Edi`;
    scrollTo(0, 0);
    return () => { delete html.dataset.modul; };
  }, [m, lang]);
  return (
    <HomeLink.Provider value="#/">
      <CurrentModul.Provider value={m}>
        <LoadError name={modName(m)}>
          <Suspense fallback={<div className="edi-loading" aria-busy="true" />}>
            <View />
          </Suspense>
        </LoadError>
      </CurrentModul.Provider>
    </HomeLink.Provider>
  );
}

/** Modul-Datei ließ sich nicht laden (offline vor dem ersten Laden, neue Version auf dem Server) */
class LoadError extends Component<{ name: string; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div className="edi-error" role="alert">
        <h1>{this.props.name}</h1>
        <p>{tr("Konnte nicht geladen werden.", "Could not be loaded.")}</p>
        <div className="edi-error-actions">
          <button type="button" className="ui-btn ui-btn-primary" onClick={() => location.reload()}>{tr("Neu laden", "Reload")}</button>
          <a className="ui-btn ui-btn-soft" href="#/">{tr("Übersicht", "All apps")}</a>
        </div>
      </div>
    );
  }
}
