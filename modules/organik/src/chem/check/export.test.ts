// Export der Prüfmoleküle für scripts/organik-oracle.py – läuft nur mit ORACLE_OUT=Datei (sonst übersprungen).
// Je Molekül: Name, englischer Name, weitere Namen, Molfile, Stammsystem, Vorsilben mit Anknüpfung, E/Z.
// Direkt hier geprüft: gleicher Name bei anderer Reihenfolge der Atome (gleiche Lage) und nach neuem Zeichnen (E/Z bleibt).

import { describe, expect, test } from "vitest";
import { writeFileSync } from "node:fs";
import { name, substituentNames } from "../naming.ts";
import { layout } from "../layout.ts";
import { keepStereo, stereoBonds } from "../stereo.ts";
import type { Mol } from "../mol.ts";
import { samples, rng } from "./generate.ts";
import { altEnglish, toEnglish } from "../english.ts";
import { toMolblock } from "./molfile.ts";

const OUT = process.env.ORACLE_OUT;

/** Atome in anderer Reihenfolge und mit anderen Nummern, Lage gleich */
function shuffled(mol: Mol, seed: number): Mol {
  const r = rng(seed);
  const ids = mol.atoms.map(a => a.id);
  for (let i = ids.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [ids[i], ids[j]] = [ids[j], ids[i]]; }
  const map = new Map(mol.atoms.map((a, i) => [a.id, ids[i] + 1000]));
  return {
    atoms: [...mol.atoms].reverse().map(a => ({ ...a, id: map.get(a.id)! })),
    bonds: [...mol.bonds].reverse().map(b => ({ a: map.get(b.b)!, b: map.get(b.a)!, order: b.order })),
  };
}

describe.skipIf(!OUT)("Export für die Prüfung", () => {
  test("alle Moleküle", () => {
    const lines: string[] = [];
    const stats = { total: 0, fail: {} as Record<string, number>, shuffle: [] as string[], relayout: [] as string[] };
    let n = 0;
    for (const s of samples(Number(process.env.ORACLE_SEED ?? 1))) {
      stats.total++;
      const r = name(s.mol);
      if (!r.ok) { stats.fail[r.reason] = (stats.fail[r.reason] ?? 0) + 1; continue; }
      const sh = shuffled(s.mol, ++n);
      const r2 = name(sh);
      if (!r2.ok || r2.name !== r.name) stats.shuffle.push(`${s.id}: ${r.name} ≠ ${r2.ok ? r2.name : r2.reason}`);
      const re = name(keepStereo(sh, layout(sh)));
      if (!re.ok || re.name !== r.name) stats.relayout.push(`${s.id}: ${r.name} ≠ ${re.ok ? re.name : re.reason}`);
      const idx = new Map(s.mol.atoms.map((a, i) => [a.id, i]));
      const ix = (id: number) => idx.get(id) ?? -1;
      let en = "", enError = "";
      try { en = toEnglish(r); } catch (e) { enError = String(e); }
      lines.push(JSON.stringify({
        id: s.id, family: s.family, de: r.name, en, enError, formula: r.formula, classes: r.classes, principal: r.principal ?? null,
        alts: r.alt.map(a => ({ de: a, en: en ? altEnglish(a, r, en) ?? null : null })),
        parent: { atoms: r.parent.atoms.map(ix), kind: r.parent.kind, ring: r.parent.ring ?? null },
        subs: r.subs.map(x => ({ at: ix(x.at), first: ix(x.first), name: x.name, loc: x.loc })),
        allSubs: substituentNames(s.mol).map(x => [ix(x.at), ix(x.first), x.name]),
        stereo: r.stereo.map(x => ({ a: ix(x.a), b: ix(x.b), desc: x.desc, loc: x.loc })),
        ez: stereoBonds(s.mol).map(x => [ix(x.a), ix(x.b), x.desc]),
        parts: r.parts, molblock: toMolblock(s.mol, s.id),
      }));
    }
    writeFileSync(OUT!, lines.join("\n") + "\n");
    writeFileSync(OUT!.replace(/\.jsonl$/, "") + ".stats.json", JSON.stringify(stats, null, 1));
    expect(lines.length).toBeGreaterThan(1000);
  }, 1_200_000);
});
