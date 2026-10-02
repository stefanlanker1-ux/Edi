// Grundbausteine: Button, Card, Switch, Segmented, Stepper, Badge, Chip, Stars, ProgressBar, ResultBar.

import { tr } from "./i18n.ts";
import { useId, useState, type ButtonHTMLAttributes, type ReactNode, type Ref } from "react";
import { Icon, type IconName } from "./icons.tsx";

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "soft" | "ghost" | "quiet";
  icon?: IconName;
  iconRight?: IconName;
  size?: "md" | "lg";
  ref?: Ref<HTMLButtonElement>;
};
export function Button({ variant = "soft", icon, iconRight, size = "md", className, children, ...rest }: ButtonProps) {
  return (
    <button type="button" className={cx("ui-btn", `ui-btn-${variant}`, size === "lg" && "ui-btn-lg", className)} {...rest}>
      {icon && <Icon name={icon} />}
      {children && <span>{children}</span>}
      {iconRight && <Icon name={iconRight} />}
    </button>
  );
}

export function IconButton({ icon, label, className, ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { icon: IconName; label: string }) {
  return (
    <button type="button" className={cx("ui-icon-btn", className)} aria-label={label} title={label} {...rest}>
      <Icon name={icon} />
    </button>
  );
}

export function Card({ title, className, children, ...rest }: { title?: ReactNode; className?: string; children: ReactNode } & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cx("ui-card", className)} {...rest}>
      {title && <h3 className="ui-card-title">{title}</h3>}
      {children}
    </div>
  );
}

export function Switch({ checked, onChange, children }: { checked: boolean; onChange: (v: boolean) => void; children: ReactNode }) {
  return (
    <label className="ui-switch">
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} />
      <span className="ui-switch-track" aria-hidden="true" />
      <span className="ui-switch-label">{children}</span>
    </label>
  );
}

export interface SegmentOption<T extends string> { value: T; label: ReactNode; short?: ReactNode }
export function Segmented<T extends string>({ value, options, onChange, label }: { value: T; options: SegmentOption<T>[]; onChange: (v: T) => void; label: string }) {
  return (
    <div className="ui-seg" role="group" aria-label={label}>
      {options.map(o => (
        <button key={o.value} type="button" aria-pressed={o.value === value} onClick={() => onChange(o.value)}>
          <span className={o.short ? "ui-long" : undefined}>{o.label}</span>
          {o.short && <span className="ui-short">{o.short}</span>}
        </button>
      ))}
    </div>
  );
}

/** Zahlenfeld mit − / + (große Tippflächen). tone färbt das Label (z. B. "proton"). */
export function Stepper({ label, value, onChange, min = 0, max = 999, tone, editable = true, compact = false, stack = false }: {
  label: ReactNode; value: number; onChange: (v: number) => void; min?: number; max?: number; tone?: string; editable?: boolean; compact?: boolean;
  /** schmal: Beschriftung, darunter die Zahl, darunter − und + (für mehrere Zähler nebeneinander) */
  stack?: boolean;
}) {
  const id = useId();
  const set = (v: number) => onChange(Math.max(min, Math.min(max, v)));
  return (
    <div className={cx("ui-stepper", compact && !stack && "compact", stack && "stack", tone && `tone-${tone}`)}>
      <label htmlFor={id} className="ui-stepper-label">{tone && <i className="ui-dot" />}{label}</label>
      <div className="ui-stepper-ctl">
        <button type="button" onClick={() => set(value - 1)} disabled={value <= min} aria-label={tr("weniger", "less")}><Icon name="minus" /></button>
        {editable
          ? <input id={id} type="number" inputMode="numeric" value={value} min={min} max={max}
              onChange={e => set(Number(e.target.value) || 0)} onFocus={e => e.target.select()} />
          : <output id={id}>{value}</output>}
        <button type="button" onClick={() => set(value + 1)} disabled={value >= max} aria-label={tr("mehr", "more")}><Icon name="plus" /></button>
      </div>
    </div>
  );
}

export function Badge({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cx("ui-badge", className)}>{children}</span>;
}

export function Chip({ children, active, className }: { children: ReactNode; active?: boolean; className?: string }) {
  return <span className={cx("ui-chip", active && "active", className)}>{children}</span>;
}

export function Stars({ value, size = 18 }: { value: number; size?: number }) {
  return (
    <span className="ui-stars" aria-label={tr(`${value} von 3 Sternen`, `${value} of 3 stars`)}>
      {[1, 2, 3].map(i => <span key={i} className={cx("ui-star", i <= value && "on")}><Icon name="star" size={size} /></span>)}
    </span>
  );
}

export function ProgressBar({ value, max }: { value: number; max: number }) {
  return (
    <div className="ui-bar" role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={max}>
      <i style={{ width: `${(value / max) * 100}%` }} />
    </div>
  );
}

/** Fortschritt einer Runde: ein Abschnitt je Aufgabe – grün = richtig, rot = falsch, grau = noch offen */
export function ResultBar({ results }: { results: (boolean | null)[] }) {
  const right = results.filter(r => r === true).length;
  const wrong = results.filter(r => r === false).length;
  return (
    <div className="ui-result-bar" role="img" aria-label={tr(`${right} richtig, ${wrong} falsch, ${results.length - right - wrong} offen`, `${right} correct, ${wrong} wrong, ${results.length - right - wrong} open`)}>
      {results.map((r, i) => <i key={i} className={r === true ? "ok" : r === false ? "bad" : undefined} />)}
    </div>
  );
}

export function Note({ icon = "bulb", tone = "info", children }: { icon?: IconName; tone?: "info" | "ok" | "warn" | "bad"; children: ReactNode }) {
  return <div className={cx("ui-note", `tone-${tone}`)}><Icon name={icon} size={18} /><div>{children}</div></div>;
}

/** Eine Karte mit Registern: immer nur ein Bereich sichtbar (statt vieler Karten untereinander). */
export interface PanelTab { id: string; label: ReactNode; content: ReactNode }
export function Panel({ tabs, value, onChange, className, label }: {
  tabs: PanelTab[]; value?: string; onChange?: (id: string) => void; className?: string; label?: string;
}) {
  const [own, setOwn] = useState(tabs[0]?.id);
  const cur = value ?? own;
  const active = tabs.find(t => t.id === cur) ?? tabs[0];
  const pick = (id: string) => { setOwn(id); onChange?.(id); };
  if (!active) return null;
  return (
    <section className={cx("ui-card ui-panel", className)}>
      {tabs.length > 1 && (
        <div className="ui-panel-tabs" role="tablist" aria-label={label ?? tr("Bereiche", "Sections")}>
          {tabs.map(t => (
            <button key={t.id} type="button" role="tab" aria-selected={t.id === active.id} className={cx("ui-panel-tab", t.id === active.id && "active")} onClick={() => pick(t.id)}>{t.label}</button>
          ))}
        </div>
      )}
      <div className="ui-panel-body" role="tabpanel">{active.content}</div>
    </section>
  );
}

/** Kurze Statusmarke statt eines Satzes (✓ neutral, Kation 2+ …) */
export function Tag({ tone = "plain", children }: { tone?: "plain" | "ok" | "bad" | "signal"; children: ReactNode }) {
  return <span className={cx("ui-tag", `tone-${tone}`)}>{children}</span>;
}
