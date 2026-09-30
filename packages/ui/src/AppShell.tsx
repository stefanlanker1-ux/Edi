// App-Rahmen: Kopfzeile, Navigation oben (breit) bzw. unten (Handy), Inhalt.

import type { ReactNode } from "react";
import { Icon, type IconName } from "./icons.tsx";
import { setSound, useSound } from "./feedback.ts";
import { setReadable, useReadable } from "./readable.ts";
import { Rescue } from "./Rescue.tsx";

export interface ShellTab<T extends string> { id: T; label: string; short?: string; icon: IconName }

export function AppShell<T extends string>({ name, logo, homeHref, tabs, active, onTab, actions, storage, children }: {
  name: string; logo?: ReactNode;
  /** Link zur Übersicht aller Apps (Logo wird klickbar) */
  homeHref?: string; tabs: ShellTab<T>[]; active: T; onTab: (t: T) => void; actions?: ReactNode;
  /** localStorage-Schlüssel der App: „Neu starten“ nach einem Absturz setzt sie zurück */
  storage?: string[]; children: ReactNode;
}) {
  const sound = useSound();
  const readable = useReadable();
  const nav = (cls: string) => tabs.map(t => (
    <button key={t.id} type="button" className={`${cls}${t.id === active ? " active" : ""}`} aria-current={t.id === active ? "page" : undefined} onClick={() => onTab(t.id)}>
      <Icon name={t.icon} size={cls === "ui-bn-tab" ? 24 : 20} />
      <span className="ui-long">{t.label}</span>
      <span className="ui-short">{t.short ?? t.label}</span>
    </button>
  ));
  return (
    <>
      <a className="ui-skip" href="#main">Zum Inhalt springen</a>
      <header className="ui-topbar">
        {homeHref
          ? <a className="ui-brand" href={homeHref} title="Zur Übersicht aller Apps">{logo}<h1 className="ui-brand-name">{name}</h1></a>
          : <div className="ui-brand">{logo}<h1 className="ui-brand-name">{name}</h1></div>}
        <nav className="ui-top-tabs" aria-label="Bereiche">{nav("ui-top-tab")}</nav>
        <div className="ui-top-actions">
          {actions}
          <button type="button" className={`ui-icon-btn${readable ? " pressed" : ""}`} aria-pressed={readable} aria-label={readable ? "Lesbar ausschalten" : "Lesbar: mehr Abstand"}
            title={readable ? "Lesbar ausschalten" : "Lesbar: mehr Abstand zwischen Buchstaben, Wörtern und Zeilen"} onClick={() => setReadable(!readable)}>
            <Icon name="text" />
          </button>
          <button type="button" className={`ui-icon-btn${sound ? " pressed" : ""}`} aria-pressed={sound} aria-label={sound ? "Klang ausschalten" : "Klang einschalten"}
            title={sound ? "Klang ausschalten" : "Klang einschalten"} onClick={() => setSound(!sound)}>
            <Icon name={sound ? "sound" : "mute"} />
          </button>
        </div>
      </header>
      <main id="main" className="ui-main"><Rescue key={active} storage={storage}>{children}</Rescue></main>
      <nav className="ui-bottom-nav" aria-label="Bereiche">{nav("ui-bn-tab")}</nav>
    </>
  );
}
