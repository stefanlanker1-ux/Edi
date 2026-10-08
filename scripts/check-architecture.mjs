// Prüft die Regeln des modularen Monolithen (läuft vor den Tests: npm test):
//   modules/<id>  darf nur eigene Dateien (relativ, im eigenen Ordner), @lern/*, react, zustand, @fontsource/* importieren –
//                 nie ein anderes Modul (@edi/*) und nie die App-Hülle
//   packages/*    kennen weder Module noch App-Hülle
//   Register      apps/edi/src/modules.ts führt genau die Ordner unter modules/; Kennungen und Speicher-Schlüssel eindeutig
//   Quelltext     keine Regex-Lookbehinds (?<= (?<! – ältere Safari-Versionen (iOS < 16.4) brechen beim Laden ab
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, dirname, resolve, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

// fileURLToPath: Pfade mit Leerzeichen und unter Windows (URL.pathname wäre „%20“ bzw. „/C:/…“)
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const errors = [];
const err = (file, msg) => errors.push(`${relative(ROOT, file)}: ${msg}`);

function files(dir, out = []) {
  for (const n of readdirSync(dir)) {
    if (n === "node_modules" || n.startsWith("dist") || n === "android" || n === "ios") continue;
    const p = join(dir, n);
    if (statSync(p).isDirectory()) files(p, out);
    else if (/\.(ts|tsx|mjs)$/.test(n)) out.push(p);
  }
  return out;
}

const IMPORT = /(?:^|[\s;])(?:import|export)\s[^'"`;]*?from\s*["']([^"']+)["']|(?:^|[\s;(])import\s*\(?\s*["']([^"']+)["']/g;
const importsOf = src => [...src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "").matchAll(IMPORT)].map(m => m[1] ?? m[2]);

const MODULE_ALLOWED = [/^@lern\//, /^react(\/|$)/, /^zustand(\/|$)/, /^@fontsource\//, /^vitest$/, /^node:/];
const LOOKBEHIND = /\(\?<[=!]/;

const moduleIds = readdirSync(join(ROOT, "modules")).filter(n => statSync(join(ROOT, "modules", n)).isDirectory()).sort();

for (const id of moduleIds) {
  const base = join(ROOT, "modules", id);
  if (!existsSync(join(base, "src", "index.tsx"))) err(base, "src/index.tsx fehlt (export const modul)");
  const pj = JSON.parse(readFileSync(join(base, "package.json"), "utf8"));
  if (pj.name !== `@edi/${id}`) err(join(base, "package.json"), `Name muss @edi/${id} sein`);
  for (const f of files(base)) {
    for (const spec of importsOf(readFileSync(f, "utf8"))) {
      if (spec.startsWith(".")) {
        const target = resolve(dirname(f), spec);
        if (!target.startsWith(base + sep)) err(f, `Import „${spec}“ verlässt das Modul`);
      } else if (!MODULE_ALLOWED.some(r => r.test(spec))) err(f, `Import „${spec}“ ist in Modulen nicht erlaubt (nur @lern/*, react, zustand, @fontsource/*)`);
    }
  }
}

for (const f of files(join(ROOT, "packages"))) {
  for (const spec of importsOf(readFileSync(f, "utf8"))) {
    // Ziel relativ zum Repository: ein Ordner „apps“ oder „modules“ oberhalb des Repositorys (z. B. ~/apps/Edi) zählt nicht
    if (/^@edi\//.test(spec) || (spec.startsWith(".") && /^(modules|apps)[\\/]/.test(relative(ROOT, resolve(dirname(f), spec)) + sep)))
      err(f, `Paket importiert „${spec}“ – Pakete kennen weder Module noch App`);
  }
}

for (const dir of ["packages", "modules", "apps", "scripts"]) {
  for (const f of files(join(ROOT, dir))) {
    const src = readFileSync(f, "utf8");
    src.split("\n").forEach((line, i) => {
      if (LOOKBEHIND.test(line) && !/LOOKBEHIND|Lookbehind/.test(line)) err(f, `Zeile ${i + 1}: Regex-Lookbehind`);
    });
  }
}

// Register: Reihenfolge egal, Menge muss stimmen
const reg = readFileSync(join(ROOT, "apps/edi/src/modules.ts"), "utf8");
const registered = [...reg.matchAll(/from\s+"@edi\/([a-z0-9-]+)"/g)].map(m => m[1]).sort();
if (registered.join() !== moduleIds.join()) err(join(ROOT, "apps/edi/src/modules.ts"), `Register (${registered}) ≠ Ordner modules/ (${moduleIds})`);
const appDeps = Object.keys(JSON.parse(readFileSync(join(ROOT, "apps/edi/package.json"), "utf8")).dependencies ?? {})
  .filter(d => d.startsWith("@edi/")).map(d => d.slice(5)).sort();
if (appDeps.join() !== moduleIds.join()) err(join(ROOT, "apps/edi/package.json"), `Abhängigkeiten @edi/* (${appDeps}) ≠ Ordner modules/`);

// Kennung und Speicher-Schlüssel aus index.tsx (einfache Literale)
const seenKeys = new Map();
for (const id of moduleIds) {
  const f = join(ROOT, "modules", id, "src", "index.tsx");
  if (!existsSync(f)) continue;
  const src = readFileSync(f, "utf8");
  const mid = /\bid:\s*"([^"]+)"/.exec(src)?.[1];
  if (mid !== id) err(f, `id „${mid}“ muss dem Ordnernamen „${id}“ entsprechen`);
  const keys = [.../storage:\s*\[([^\]]*)\]/.exec(src)?.[1].matchAll(/"([^"]+)"/g) ?? []].map(m => m[1]);
  if (!keys.length) err(f, "storage fehlt");
  for (const k of keys) {
    if (seenKeys.has(k)) err(f, `Speicher-Schlüssel „${k}“ auch in ${seenKeys.get(k)}`);
    seenKeys.set(k, id);
  }
}

if (errors.length) {
  console.error("Architektur-Regeln verletzt:\n  " + errors.join("\n  "));
  process.exit(1);
}
console.log(`✓ Architektur: ${moduleIds.length} Module, Grenzen eingehalten`);
