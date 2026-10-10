// App-Rahmen: Kopfzeile, Navigation oben (breit) bzw. unten (Handy), Inhalt.

import type { ReactNode } from "react";
import { Icon, type IconName } from "./icons.tsx";
import { setSound, useSound } from "./feedback.ts";
import { setReadable, useReadable } from "./readable.ts";
import { Rescue } from "./Rescue.tsx";
import { setLang, tr, useLang } from "./i18n.ts";

export interface ShellTab<T extends string> { id: T; label: string; short?: string; icon: IconName }

/** Sprache umschalten (DE/EN, die aktive hervorgehoben) – in der Übersicht und in jeder Kopfzeile */
export function LangButton() {
  const lang = useLang();
  const other = lang === "de" ? "en" : "de";
  return (
    <button type="button" className="ui-icon-btn ui-lang" lang={other} onClick={() => setLang(other)}
      aria-label={other === "en" ? "Switch to English" : "Deutsch – switch to German"} title={other === "en" ? "Switch to English" : "Deutsch – switch to German"}>
      {/* EN vor DE (international); die Sprache selbst kommt beim ersten Start aus der Gerätesprache */}
      <span className={lang === "en" ? "on" : undefined}>EN</span><span className={lang === "de" ? "on" : undefined}>DE</span>
    </button>
  );
}

export function AppShell<T extends string>({ name, logo, homeHref, tabs, active, onTab, actions, guide, storage, children }: {
  name: string; logo?: ReactNode;
  /** Link zur Übersicht aller Apps (Logo wird klickbar) */
  homeHref?: string; tabs: ShellTab<T>[]; active: T; onTab: (t: T) => void; actions?: ReactNode;
  /** „Erklärung“ als erster Eintrag der Bereichsleiste (gleich gestaltet wie die Bereiche); `fresh` = noch nie durchlaufen (roter Ring) */
  guide?: { fresh: boolean; open: () => void };
  /** localStorage-Schlüssel der App: „Neu starten“ nach einem Absturz setzt sie zurück */
  storage?: string[]; children: ReactNode;
}) {
  const sound = useSound();
  const readable = useReadable();
  const lang = useLang();
  const nav = (cls: string) => [guide && (
    <button key="guide" type="button" className={`${cls} ui-guide-tab${guide.fresh ? " fresh" : ""}`} onClick={guide.open}
      title={tr("Schritt für Schritt erklärt – zum Mitmachen", "Explained step by step – try it yourself")}>
      <span className="ui-guide-tab-ic"><Icon name="play" size={cls === "ui-bn-tab" ? 24 : 20} /></span>
      <span className="ui-long">{tr("Erklärung", "Explanation")}</span>
      <span className="ui-short">{tr("Erklärung", "Explanation")}</span>
    </button>
  ), ...tabs.map(t => (
    <button key={t.id} type="button" className={`${cls}${t.id === active ? " active" : ""}`} aria-current={t.id === active ? "page" : undefined} onClick={() => onTab(t.id)}>
      <Icon name={t.icon} size={cls === "ui-bn-tab" ? 24 : 20} />
      <span className="ui-long">{t.label}</span>
      <span className="ui-short">{t.short ?? t.label}</span>
    </button>
  ))];
  return (
    <>
      {/* Fokus direkt auf den Inhalt: die Adresse (#/<modul>) bleibt – „#main“ als Adresse wäre für die Hülle ein unbekanntes Modul (→ Übersicht) */}
      <a className="ui-skip" href="#main" onClick={e => { e.preventDefault(); document.getElementById("main")?.focus(); }}>{tr("Zum Inhalt springen", "Skip to content")}</a>
      <header className="ui-topbar">
        {/* in der Gesamt-App: Home-Knopf statt Modul-Symbol (zurück zur Übersicht); allein gebaut: Symbol */}
        <div className="ui-brand">
          {homeHref
            ? <a className="ui-icon-btn ui-home" href={homeHref} aria-label={tr("Zur Übersicht", "Overview")} title={tr("Zur Übersicht aller Apps", "All apps")}><Icon name="home" /></a>
            : logo}
          <h1 className="ui-brand-name">{name}</h1>
        </div>
        <nav className="ui-top-tabs" aria-label={tr("Bereiche", "Sections")}>{nav("ui-top-tab")}</nav>
        <div className="ui-top-actions">
          {actions}
          <LangButton />
          {/* „Lesbar“: am Handy ausgeblendet (zu wenig Platz in der Kopfzeile) – eingeschaltet bleibt er sichtbar, damit man ihn ausschalten kann */}
          <button type="button" className={`ui-icon-btn ui-readable${readable ? " pressed" : ""}`} aria-pressed={readable} aria-label={readable ? tr("Lesbar ausschalten", "Readable mode off") : tr("Lesbar: mehr Abstand", "Readable: more spacing")}
            title={readable ? tr("Lesbar ausschalten", "Readable mode off") : tr("Lesbar: mehr Abstand zwischen Buchstaben, Wörtern und Zeilen", "Readable: more space between letters, words and lines")} onClick={() => setReadable(!readable)}>
            <Icon name="text" />
          </button>
          <button type="button" className={`ui-icon-btn${sound ? " pressed" : ""}`} aria-pressed={sound} aria-label={sound ? tr("Klang ausschalten", "Sound off") : tr("Klang einschalten", "Sound on")}
            title={sound ? tr("Klang ausschalten", "Sound off") : tr("Klang einschalten", "Sound on")} onClick={() => setSound(!sound)}>
            <Icon name={sound ? "sound" : "mute"} />
          </button>
        </div>
      </header>
      <main id="main" className="ui-main" tabIndex={-1}><Rescue key={`${active}-${lang}`} storage={storage}>{children}</Rescue></main>
      <nav className="ui-bottom-nav" aria-label={tr("Bereiche", "Sections")}>{nav("ui-bn-tab")}</nav>
    </>
  );
}

/** Bereich „Üben“ – einheitlich in allen Modulen (Name, englischer Name, Zeichen an einer Stelle). Der Inhalt bleibt je Modul eigen. */
export const uebenLabel = () => tr("Üben", "Practise");
export const uebenTab = <T extends string>(id: T): ShellTab<T> => ({ id, label: uebenLabel(), icon: "target" });
