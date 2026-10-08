// Lizenzhinweise der ausgelieferten Open-Source-Pakete (MIT verlangt Copyright- und Lizenztext in jeder Kopie, die OFL der Schriften ebenso).
// Ermittelt alle Laufzeit-Abhängigkeiten der App (rekursiv, ohne eigene Pakete @lern/* und @edi/*) und legt die Lizenztexte bei:
//   Web-Build   → Datei lizenzen.txt neben index.html
//   Einzeldatei → als Kommentar am Ende der HTML-Datei

import { readFileSync, readdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { createRequire } from "node:module";
import type { Plugin } from "vite";

interface Pkg { name: string; version: string; license: string; text: string }

/** Laufzeit-Code des Service Workers (von vite-plugin-pwa eingebaut) */
const WORKBOX = ["workbox-window", "workbox-core", "workbox-precaching", "workbox-routing", "workbox-strategies"];

function pkgDir(name: string, from: string): string | null {
  try {
    return dirname(createRequire(join(from, "package.json")).resolve(`${name}/package.json`));
  } catch {
    // Pakete ohne exportiertes package.json: in den node_modules-Ordnern nach oben suchen
    for (let d = from; ; d = dirname(d)) {
      const p = join(d, "node_modules", name);
      if (existsSync(join(p, "package.json"))) return p;
      if (dirname(d) === d) return null;
    }
  }
}

function licenseText(dir: string): string {
  const f = readdirSync(dir).find(n => /^(licen[cs]e|copying|ofl)(\.(md|txt))?$/i.test(n));
  return f ? readFileSync(join(dir, f), "utf8").trim() : "";
}

export function collectLicenses(appDir: string, withWorkbox: boolean): Pkg[] {
  const seen = new Map<string, Pkg>();
  const visit = (name: string, from: string) => {
    // reine Typ-Pakete landen nicht im Build
    if (seen.has(name) || name.startsWith("@types/")) return;
    const dir = pkgDir(name, from);
    if (!dir) return;
    const pj = JSON.parse(readFileSync(join(dir, "package.json"), "utf8"));
    const own = name.startsWith("@lern/") || name.startsWith("@edi/");
    if (!own) seen.set(name, { name, version: pj.version, license: pj.license ?? "", text: licenseText(dir) });
    // eigene Pakete mit übernommenem Fremdcode: Hinweise aus NOTICE.txt
    else if (existsSync(join(dir, "NOTICE.txt"))) seen.set(name, { name, version: pj.version, license: "Hinweise", text: readFileSync(join(dir, "NOTICE.txt"), "utf8").trim() });
    for (const dep of Object.keys(pj.dependencies ?? {})) visit(dep, dir);
  };
  const app = JSON.parse(readFileSync(join(appDir, "package.json"), "utf8"));
  // Capacitor steckt nur in den Android/iOS-Projekten, nicht im Web-Build
  for (const dep of Object.keys(app.dependencies ?? {})) if (!dep.startsWith("@capacitor/")) visit(dep, appDir);
  if (withWorkbox) for (const w of WORKBOX) visit(w, appDir);
  return [...seen.values()].sort((a, b) => a.name.localeCompare(b.name));
}

export function licenseReport(pkgs: Pkg[]): string {
  const head = "Diese App verwendet folgende Open-Source-Bausteine. Vielen Dank an ihre Autorinnen und Autoren.\n";
  return head + pkgs.map(p => `\n==== ${p.name} ${p.version} (${p.license}) ====\n\n${p.text || `Lizenz: ${p.license}`}\n`).join("");
}

export function licensePlugin(): Plugin {
  let root = "";
  let single = false;
  return {
    name: "lern-licenses",
    configResolved(c) { root = c.root; single = c.mode === "single"; },
    generateBundle() {
      if (single) return;
      this.emitFile({ type: "asset", fileName: "lizenzen.txt", source: licenseReport(collectLicenses(root, true)) });
    },
    transformIndexHtml: {
      order: "post",
      handler(html) {
        if (!single) return html;
        // nur entschärfen, was in einem Kommentar nicht stehen darf („-->“, „--!>“, „<!--“) – sonst bleibt der Text wörtlich (die Übersicht zeigt ihn an)
        const text = licenseReport(collectLicenses(root, false)).replace(/--(!?>)/g, "- -$1").replace(/<!--/g, "<!- -");
        return html.replace(/<\/html>\s*$/, `</html>\n<!--\n${text}\n-->\n`);
      },
    },
  };
}
