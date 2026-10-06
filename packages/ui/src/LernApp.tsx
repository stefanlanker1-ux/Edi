/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />
// Gemeinsamer Rahmen aller Module: Start der App (boot), Farbschema und Beamer-Modus, Stufen-Umschalter, Link zur Übersicht.
// Ein Modul gibt nur Name, Logo, Tabs und Inhalt an:
//   <LernApp name="…" logo={…} tabs={…} tab={tab} onTab={setTab} storage={[…]} stufe={{ value, onChange }}>…</LernApp>
// Den Link zur Übersicht liefert die App-Hülle über den Kontext HomeLink (modul.ts).
// Farbschema und Beamer werden bewusst nicht gespeichert: die App startet hell und ohne Beamer-Modus.

import { tr, useLang } from "./i18n.ts";
import { StrictMode, useContext, useEffect, useState, useSyncExternalStore, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { AppShell, type ShellTab } from "./AppShell.tsx";
import { IconButton, Segmented } from "./components.tsx";
import { applyTheme } from "./hooks.ts";
import { HomeLink } from "./modul.ts";
import { Guide, type GuideDef } from "./Guide.tsx";

/** läuft als Android/iOS-App (Capacitor) */
export const isNative: boolean = !!(globalThis as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor?.isNativePlatform?.();

/** Web-Version über http(s) (nicht Einzeldatei, nicht Handy-App): nur dort gibt es den Service Worker und Offline-Dateien */
export const isWeb: boolean = import.meta.env.MODE !== "single" && !isNative && typeof location !== "undefined" && location.protocol.startsWith("http");

/** App anzeigen und im Web den Service Worker (offline) registrieren */
export function boot(app: ReactNode) {
  createRoot(document.getElementById("root")!).render(<StrictMode>{app}</StrictMode>);
  if (import.meta.env.PROD && import.meta.env.MODE !== "single" && isWeb && "serviceWorker" in navigator) {
    import("virtual:pwa-register").then(({ registerSW }) => registerSW({ immediate: true }));
  }
}

// ---- Anzeige: Farbschema und Beamer (für alle Apps gleich, nicht gespeichert) ----

export type Theme = "light" | "dark";
interface Display { theme: Theme; beamer: boolean }
let display: Display = { theme: "light", beamer: false };
const listeners = new Set<() => void>();

export function setDisplay(p: Partial<Display>) {
  display = { ...display, ...p };
  listeners.forEach(l => l());
}

export function useDisplay(): Display {
  return useSyncExternalStore(cb => { listeners.add(cb); return () => { listeners.delete(cb); }; }, () => display, () => display);
}

export interface StufeSwitch<S extends string> {
  value: S;
  onChange: (s: S) => void;
  /** Standard: Level I / Level II */
  options?: { value: S; label: string; short?: string }[];
}

const US_OS = [{ value: "us", label: "Level I", short: "I" }, { value: "os", label: "Level II", short: "II" }];

export function LernApp<T extends string, S extends string = "us" | "os">({ name, logo, tabs, tab, onTab, storage, stufe, actions, guide, children }: {
  name: string;
  logo: ReactNode;
  tabs: ShellTab<T>[];
  tab: T;
  onTab: (t: T) => void;
  /** localStorage-Schlüssel der App (Baukasten + Quiz) für „Neu starten“ */
  storage: string[];
  /** Umschalter Schulstufe in der Kopfzeile; die Stufe steht zusätzlich als data-stufe am <body> */
  stufe?: StufeSwitch<S>;
  /** weitere Knöpfe vor den Standard-Schaltern */
  actions?: ReactNode;
  /** geführte Erklärung (je Stufe) – Knopf „Erklärung“ links in der Kopfzeile, am Ende geht es zum Üben */
  guide?: GuideDef;
  children: ReactNode;
}) {
  const { theme, beamer } = useDisplay();
  const lang = useLang();
  const homeHref = useContext(HomeLink);
  useEffect(() => applyTheme(theme), [theme]);
  useEffect(() => { document.documentElement.toggleAttribute("data-beamer", beamer); }, [beamer]);
  const stufeValue = stufe?.value;
  useEffect(() => {
    if (stufeValue) document.body.dataset.stufe = stufeValue;
    else delete document.body.dataset.stufe;
    return () => { delete document.body.dataset.stufe; };
  }, [stufeValue]);

  const [guideOpen, setGuideOpen] = useState(false);
  // Knopf hervorgehoben, bis die Erklärung einmal ganz durchlaufen ist (je App, nur auf diesem Gerät)
  const doneKey = `lern-erklaert-${name}`;
  const [fresh, setFresh] = useState(() => { try { return !localStorage.getItem(doneKey); } catch { return true; } });
  const quizTab = tabs.find(t => t.id === "quiz");
  const finish = () => {
    try { localStorage.setItem(doneKey, "1"); } catch { /* egal */ }
    setFresh(false); setGuideOpen(false);
    if (quizTab) onTab(quizTab.id);
  };
  return (
    <AppShell name={name} logo={logo} homeHref={homeHref} tabs={tabs} active={tab} storage={storage}
      guide={guide ? { fresh, open: () => setGuideOpen(true) } : undefined}
      onTab={t => { onTab(t); window.scrollTo({ top: 0 }); }}
      actions={<>
        {stufe && <Segmented<S> label="Level" value={stufe.value} onChange={stufe.onChange} options={stufe.options ?? (US_OS as StufeSwitch<S>["options"] & object)} />}
        {actions}
        <IconButton icon="screen" className={`only-wide${beamer ? " pressed" : ""}`} aria-pressed={beamer}
          label={beamer ? tr("Beamer-Modus beenden", "Projector mode off") : tr("Beamer-Modus: größere Schrift, stärkere Kontraste", "Projector mode: larger text, stronger contrast")} onClick={() => setDisplay({ beamer: !beamer })} />
        <IconButton icon={theme === "light" ? "moon" : "sun"} label={theme === "light" ? tr("Dunkles Farbschema", "Dark theme") : tr("Helles Farbschema", "Light theme")}
          onClick={() => setDisplay({ theme: theme === "light" ? "dark" : "light" })} />
      </>}>
      {children}
      {guide && <Guide key={`${guide.title}|${stufeValue ?? ""}|${lang}`} def={guide} open={guideOpen} onClose={() => setGuideOpen(false)} onFinish={finish}
        finishLabel={quizTab ? tr("Zum Üben", "To practice") : tr("Fertig", "Done")} />}
    </AppShell>
  );
}
