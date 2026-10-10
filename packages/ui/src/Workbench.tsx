// Werkbank für freies Ausprobieren (Bauen, Umrechnen …) – nie scrollen:
//   Handy/Tablet: Bühne füllt den Bildschirm, darunter eine Werkzeugleiste; jedes Werkzeug öffnet ein Blatt.
//   Breit (≥ 900 px): Bühne links, die Werkzeuge als Register rechts daneben (immer sichtbar).
// Werkzeuge ohne `content` sind reine Aktionen (z. B. „Leeren“) und bleiben in der Leiste.
// Passt eine Beschriftung nicht in ihre Spalte, steht die Leiste in zwei Reihen (`data-wrap`) – nie abgeschnitten.

import { tr } from "./i18n.ts";
import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { Icon, type IconName } from "./icons.tsx";
import { Panel } from "./components.tsx";
import { Sheet } from "./Sheet.tsx";
import { useNarrow } from "./hooks.ts";

export interface WorkbenchTool {
  id: string;
  label: ReactNode;
  icon: IconName;
  /** Inhalt des Blatts bzw. Registers – fehlt er, ist das Werkzeug eine Aktion (`onClick`) */
  content?: ReactNode;
  onClick?: () => void;
  /** Titel des Blatts (sonst `label`) */
  title?: ReactNode;
  wide?: boolean;
  pressed?: boolean;
  disabled?: boolean;
}

export function Workbench({ head, stage, status, statusReserve, controls, tools, className, label, active, onActive, side = "right", wrapTools = false }: {
  head?: ReactNode; stage: ReactNode; status?: ReactNode; controls?: ReactNode; tools: WorkbenchTool[]; className?: string; label?: string;
  /** Statuszeile reserviert Platz für die größte dieser Fassungen (unsichtbar in derselben Zelle): wechseln die Kennzeichen, springt die Bühne nicht */
  statusReserve?: ReactNode[];
  /** gesteuert: offenes Werkzeug (Handy: Blatt, breit: Register); null = keines */
  active?: string | null; onActive?: (id: string | null) => void;
  /** breit: Register links oder rechts der Bühne */
  side?: "left" | "right";
  /** Werkzeugleiste immer in zwei Reihen (Beschriftungen wechseln, z. B. gewählte Stoffe): sonst spränge die Bühne, wenn ein langer Name die Leiste umbricht */
  wrapTools?: boolean;
}) {
  const narrow = useNarrow();
  const [ownOpen, setOwnOpen] = useState<string | null>(null);
  const [ownTab, setOwnTab] = useState<string>();
  const open = active !== undefined ? active : ownOpen;
  const tab = active ?? ownTab;
  const setOpen = (id: string | null) => { setOwnOpen(id); onActive?.(id); };
  const setTab = (id: string) => { setOwnTab(id); onActive?.(id); };
  const panels = tools.filter(t => t.content !== undefined);
  const bar = narrow ? tools : tools.filter(t => t.content === undefined);
  const sheet = narrow ? panels.find(t => t.id === open) : undefined;
  // Beschriftungen nie abgeschnitten: passt eine nicht in ihre Spalte (schmales Handy, Englisch, „Lesbar“), stehen die Werkzeuge in zwei Reihen
  const barRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const el = barRef.current;
    if (!el) return;
    const fit = () => {
      delete el.dataset.wrap;
      const cut = [...el.querySelectorAll<HTMLElement>(".ui-wb-tool > span")].some(s => s.scrollWidth > s.clientWidth + 1 || s.scrollHeight > s.clientHeight + 2);
      if (cut || (wrapTools && narrow)) { el.dataset.wrap = ""; el.style.setProperty("--wb-cols", String(Math.ceil(el.children.length / 2))); }
    };
    fit();
    addEventListener("resize", fit);
    return () => removeEventListener("resize", fit);
  });
  return (
    <div className={`ui-wb${side === "left" ? " side-left" : ""}${className ? " " + className : ""}`}>
      <section className="ui-card ui-wb-stage">
        {head && <div className="ui-wb-head">{head}</div>}
        <div className="ui-wb-view">{stage}</div>
        {statusReserve
          ? <div className="ui-wb-status reserve">
              <div className="ui-wb-status-now">{status}</div>
              {statusReserve.map((r, i) => <div key={i} className="ui-wb-status-alt" aria-hidden="true">{r}</div>)}
            </div>
          : status && <div className="ui-wb-status">{status}</div>}
        {controls && <div className="ui-wb-controls">{controls}</div>}
        {bar.length > 0 && (
          <div ref={barRef} className={`ui-wb-tools${bar.length >= 5 ? " many" : ""}`} role="toolbar" aria-label={label ?? tr("Werkzeuge", "Tools")}>
            {bar.map(t => (
              <button key={t.id} type="button" className={`ui-wb-tool${t.pressed ? " pressed" : ""}`} disabled={t.disabled}
                aria-pressed={t.pressed} aria-haspopup={t.content !== undefined ? "dialog" : undefined}
                onClick={() => (t.content !== undefined ? setOpen(t.id) : t.onClick?.())}>
                <Icon name={t.icon} size={22} />
                <span>{t.label}</span>
              </button>
            ))}
          </div>
        )}
      </section>
      {!narrow && panels.length > 0 && (
        <Panel className="ui-wb-side" label={label ?? tr("Werkzeuge", "Tools")} value={tab} onChange={setTab}
          tabs={panels.map(t => ({ id: t.id, label: t.label, content: t.content }))} />
      )}
      {narrow && (
        <Sheet open={!!sheet} wide={sheet?.wide} title={sheet?.title ?? sheet?.label ?? ""} onClose={() => setOpen(null)}>
          {sheet?.content}
        </Sheet>
      )}
    </div>
  );
}
