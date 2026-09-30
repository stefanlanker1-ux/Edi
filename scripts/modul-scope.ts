// Stile eines Moduls gelten nur, solange das Modul offen ist: <html data-modul="<id>"> (gesetzt von der App-Hülle).
// PostCSS-Plugin für alle CSS-Dateien unter modules/<id>/src/ – Module können sich so nicht gegenseitig
// und die Übersicht nicht beeinflussen, auch wenn sie dieselben Klassennamen verwenden.
//   :root, :root[data-theme="dark"]  → :root:where([data-modul="id"]) …   (Farb-Tokens des Moduls)
//   html …                           → html:where([data-modul="id"]) …
//   .card, body .x                   → :where(:root[data-modul="id"]) .card …
// :where() zählt nicht zur Spezifität – innerhalb des Moduls bleibt die Rangfolge der Regeln unverändert.

import type { AtRule, Node, PluginCreator, Rule } from "postcss";

const MODULE_CSS = /[\\/]modules[\\/]([a-z0-9-]+)[\\/]src[\\/].*\.css$/;

/** Selektorliste an Kommas der obersten Ebene trennen (nicht in :is(…), :has(…), [a="b,c"]) */
export function splitSelectors(list: string): string[] {
  const out: string[] = [];
  let depth = 0, quote = "", cur = "";
  for (const ch of list) {
    if (quote) { if (ch === quote) quote = ""; }
    else if (ch === '"' || ch === "'") quote = ch;
    else if (ch === "(" || ch === "[") depth++;
    else if (ch === ")" || ch === "]") depth--;
    else if (ch === "," && depth === 0) { out.push(cur.trim()); cur = ""; continue; }
    cur += ch;
  }
  if (cur.trim()) out.push(cur.trim());
  return out;
}

export function scopeSelector(sel: string, id: string): string {
  const mark = `:where([data-modul="${id}"])`;
  const m = /^(:root|html)(?![\w-])/.exec(sel);
  if (m) return m[1] + mark + sel.slice(m[1].length);
  return `:where(:root[data-modul="${id}"]) ${sel}`;
}

const inKeyframes = (r: Rule) => {
  for (let p: Node | undefined = r.parent; p; p = p.parent) if (p.type === "atrule" && /keyframes$/i.test((p as AtRule).name)) return true;
  return false;
};

export const modulScope: PluginCreator<void> = () => ({
  postcssPlugin: "edi-modul-scope",
  Once(root) {
    const id = MODULE_CSS.exec(root.source?.input.file ?? "")?.[1];
    if (!id) return;
    root.walkRules(rule => {
      if (inKeyframes(rule)) return;
      rule.selector = splitSelectors(rule.selector).map(s => scopeSelector(s, id)).join(",\n");
    });
  },
});
modulScope.postcss = true;
