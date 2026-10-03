// Prüfung des Kraftfelds gegen Referenzdaten aus RDKit (scripts/mmff-reference.py):
// Atomtypen, Partialladungen, Energie je Term und Gradient an den Startkoordinaten.
//   python3 scripts/mmff-reference.py 100000 ref.jsonl
//   MMFF_REF=ref.jsonl MMFF_EMBED=2 MMFF_OUT=bericht.txt npx vitest run test/mmff-reference.test.ts
import { expect, test } from "vitest";
import { readFileSync, writeFileSync } from "node:fs";
import { setup, energy, minimize, embed } from "../src/mmff/index.ts";

// ohne MMFF_REF: Stichprobe im Repo (120 Moleküle, darunter alle der App), 3D mit einem Versuch
const SAMPLE = new URL("./mmff-sample.jsonl", import.meta.url).pathname;
const FILE = process.env.MMFF_REF ?? SAMPLE;
const EMBED = Number(process.env.MMFF_EMBED ?? (process.env.MMFF_REF ? 0 : 1));
const LIMIT = Number(process.env.LIMIT ?? 1e9);

test("MMFF94 wie RDKit: Typen, Ladungen, Energie, Gradient, Minimum, 3D mit Stereo", () => {
  const lines = readFileSync(FILE, "utf8").split("\n").filter(Boolean).slice(0, LIMIT);
  const st = { n: 0, embStereo: 0, embHigh: 0, embLower: 0, embMs: 0, embDiff: [] as number[], minBad: 0, minWorse: 0, minBetter: 0, ms: 0, noType: 0, typeBad: 0, chgBad: 0, eBad: 0, gBad: 0, termBad: {} as Record<string, number> };
  const bad: string[] = [];
  const termMap: Record<string, keyof ReturnType<typeof energy>> = { Bond: "bond", Angle: "angle", StretchBend: "stbn", Oop: "oop", Torsion: "tors", VdW: "vdw", Ele: "ele" };
  for (const line of lines) {
    const d = JSON.parse(line);
    st.n++;
    let s;
    try { s = setup({ el: d.el, q: d.q, b: d.b }); } catch (e) { bad.push(`ERR ${d.smi} ${e}`); continue; }
    if (!s) { st.noType++; bad.push(`NOTYPE ${d.smi}`); continue; }
    const t = s.typed.types;
    if (t.some((x: number, i: number) => x !== d.t[i])) {
      st.typeBad++;
      const diff = t.map((x: number, i: number) => (x !== d.t[i] ? `${i}${d.el[i]}:${x}≠${d.t[i]}` : "")).filter(Boolean).join(" ");
      bad.push(`TYPE ${d.smi} ${diff}`);
      continue;
    }
    if (s.typed.charge.some((q: number, i: number) => Math.abs(q - d.pq[i]) > 2e-4)) {
      st.chgBad++;
      bad.push(`CHG ${d.smi} ${s.typed.charge.map((q: number, i: number) => Math.abs(q - d.pq[i]) > 2e-4 ? `${i}${d.el[i]}:${q.toFixed(4)}≠${d.pq[i]}` : "").filter(Boolean).join(" ")}`);
      continue;
    }
    const g = new Float64Array(3 * d.el.length);
    const E = energy(s.ff, d.x0, g);
    const tol = (r: number) => Math.max(1e-3, Math.abs(r) * 1e-5);
    if (Math.abs(E.total - d.e0) > tol(d.e0)) {
      st.eBad++;
      const tb = Object.entries(termMap).filter(([k, v]) => Math.abs((E as any)[v] - d.terms0[k]) > tol(d.terms0[k])).map(([k, v]) => { st.termBad[k] = (st.termBad[k] ?? 0) + 1; return `${k} ${(E as any)[v].toFixed(4)}≠${d.terms0[k]}`; });
      bad.push(`E ${d.smi} ${tb.join("; ")}`);
      continue;
    }
    let gmax = 0;
    for (let i = 0; i < g.length; i++) gmax = Math.max(gmax, Math.abs(g[i] - d.g0[i]) / Math.max(1, Math.abs(d.g0[i])));
    if (gmax > 1e-3) { st.gBad++; bad.push(`G ${d.smi} ${gmax.toExponential(2)}`); continue; }
    // Optimierung ab x0: gleiches Minimum wie RDKit (Energie auf 0,01 kcal/mol oder 0,1 ‰)
    const t0 = performance.now();
    const r = minimize(s.ff, d.x0, 5000);
    st.ms += performance.now() - t0;
    const e1 = energy(s.ff, r.x.map(v => Math.round(v * 1e4) / 1e4)).total;
    const diff = e1 - d.e1;
    if (Math.abs(diff) > Math.max(0.01, Math.abs(d.e1) * 1e-4)) {
      if (diff > 0) { st.minWorse++; bad.push(`MIN ${d.smi} ${e1.toFixed(4)}≠${d.e1} (${r.iterations} Schritte)`); }
      else st.minBetter++;
    }
    // 3D allein aus der Strukturformel (mit Stereo aus der Referenz), dann MMFF94
    if (EMBED) {
      const t1 = performance.now();
      const em = embed(s.typed, s.ff, d.st, EMBED);
      st.embMs += performance.now() - t1;
      const ediff = em.energy - d.e1;
      st.embDiff.push(ediff);
      if (!em.stereoOk) { st.embStereo++; bad.push(`EMB-STEREO ${d.smi}`); }
      else if (ediff > Math.max(25, Math.abs(d.e1) * 0.25)) { st.embHigh++; bad.push(`EMB-HIGH ${d.smi} ${em.energy.toFixed(2)} vs ${d.e1}`); }
      else if (ediff < -0.01) st.embLower++;
    }
  }
  if (process.env.MMFF_OUT) {
    const ds = [...st.embDiff].sort((a, b) => a - b), q = (p: number) => ds.length ? ds[Math.floor(p * (ds.length - 1))].toFixed(2) : "-";
    const { embDiff, ...rest } = st;
    writeFileSync(process.env.MMFF_OUT, JSON.stringify({ ...rest, embDiffQuantile: { p5: q(0.05), p50: q(0.5), p95: q(0.95), max: q(1) } }) + "\n" + bad.join("\n"));
  }
  expect(bad.slice(0, 20)).toEqual([]);
}, 6 * 3600_000);
