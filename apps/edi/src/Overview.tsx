// Übersicht: alle Module als Kacheln. Die Liste kommt aus modules.ts – hier nichts pro Modul eintragen.

import { useEffect, useLayoutEffect, useState, type CSSProperties } from "react";
import { Icon, LangButton, Sheet, applyTheme, isWeb, tr, useLang, type LernModule } from "@lern/ui";
import { MODULES } from "./modules.ts";

/** Kachel-Überschrift: lange Namen mit weichen Trennstellen */
const title = (name: string) => name.replace("Elektronenpaar", "Elektronen\u00ADpaar\u00AD").replace("Reaktions", "Reaktions\u00AD");
/** Name und Satz in der gewählten Sprache */
export const modName = (m: LernModule) => tr(m.name, m.nameEn);
const modDesc = (m: LernModule) => tr(m.desc, m.descEn);

// Ein Bildschirm, nie scrollen: Titel, Kacheln (2 Spalten am Handy, 3–4 breit), Fußzeile mit Offline-Datei und Lizenzen.
// Reihen und Rahmenlinien ergeben sich aus der Zahl der Module (data-Attribute: zweite Spalte, letzte Reihe).
// Die Kachelbilder sind für helles Papier gezeichnet – die Übersicht ist deshalb immer hell (Module stellen ihr Farbschema wieder her).
/** Spalten breit: bis 6 Kacheln 3 × 2, darüber 4 Spalten (niedrige Fenster) */
const n = MODULES.length, colsW = n <= 6 ? 3 : 4;

export function Overview() {
  const lang = useLang();
  useLayoutEffect(() => {
    applyTheme("light");
    document.title = tr("Edi – Lern-Apps", "Edi – Learning apps");
    // Beschreibung der Seite in der gewählten Sprache (Teilen-Vorschau, Suche) – aus dem Register, damit kein Modul fehlt
    document.querySelector('meta[name="description"]')?.setAttribute("content",
      `${tr("Lern-Apps für Chemie und Einheiten", "Learning apps for chemistry and units")}: ${MODULES.map(modName).join(", ")}.`);
  }, [lang]);
  return (
    <div className="ov">
      <header className="ov-head">
        <p className="ov-kicker">{tr("Chemie · Einheiten", "Chemistry · Units")}</p>
        <h1>{tr("Lern-Apps", "Learning apps")}</h1>
        <div className="ov-lang"><LangButton /></div>
      </header>
      <main className="ov-grid" style={{ "--rows-m": Math.ceil(n / 2), "--cols-w": colsW, "--rows-w": Math.ceil(n / colsW) } as CSSProperties}>
        {MODULES.map((m, i) => (
          <a key={m.id} className="ov-card" href={`#/${m.id}`} title={modDesc(m)}
            data-m2={i % 2 === 1 || undefined} data-lastm={i >= n - (n % 2 || 2) || undefined}
            data-w0={i % colsW === 0 || undefined} data-lastw={i >= n - (n % colsW || colsW) || undefined}>
            <span className="ov-num">{String(i + 1).padStart(2, "0")}</span>
            <h2>{title(modName(m))}</h2>
            <div className="ov-art"><m.Card /></div>
            <span className="ov-open" aria-hidden="true"><Icon name="arrow" size={20} /></span>
          </a>
        ))}
      </main>
      <footer className="ov-foot">
        {/* Offline-Datei nur im Web (in der Handy-App und in der Datei selbst ergibt sie keinen Sinn) */}
        {isWeb ? <p className="ov-dl"><a href="edi-offline.html" download>{tr("Offline-Datei", "Offline file")}</a> <span>{tr("alle Module in einer Datei, per Doppelklick nutzbar", "all modules in one file, open with a double click")}</span></p> : <span />}
        <Licenses />
      </footer>
    </div>
  );
}

/** Lizenzhinweise der Open-Source-Bausteine (scripts/licenses.ts): Web und Handy-App als Datei lizenzen.txt neben der App,
 *  Einzeldatei als Kommentar am Dateiende (eine lizenzen.txt gibt es dort nicht) */
async function licenseText(): Promise<string> {
  if (import.meta.env.MODE === "single") {
    const c = [...document.childNodes].find(n => n.nodeType === Node.COMMENT_NODE)?.textContent?.trim();
    if (!c) throw new Error("keine Lizenzhinweise");
    return c;
  }
  const r = await fetch("lizenzen.txt");
  if (!r.ok) throw new Error(`lizenzen.txt: ${r.status}`);
  return r.text();
}

/** im Blatt statt als eigene Seite: die Handy-App hat keinen Zurück-Knopf, die Einzeldatei keine lizenzen.txt */
function Licenses() {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState<string | null>(null);
  useEffect(() => { if (open && text === null) licenseText().then(setText, () => setText("")); }, [open, text]);
  return (
    <>
      <button type="button" className="ov-lic" aria-haspopup="dialog" onClick={() => setOpen(true)}>{tr("Lizenzen", "Licences")}</button>
      <Sheet open={open} wide title={tr("Lizenzen", "Licences")} onClose={() => setOpen(false)}>
        {text ? <pre className="ov-lic-text">{text}</pre>
          : <p>{text === null ? "…" : tr("Die Lizenzhinweise ließen sich nicht laden.", "The licence notices could not be loaded.")}</p>}
      </Sheet>
    </>
  );
}
