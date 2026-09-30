import { test, assert } from "vitest";
import {
  ACIDS, BASES, SUBSTANCES, INDICATORS, acidDissociation, baseDissociation, neutralize, neutralizationWords, phClass, phLabel, indicatorColor, dilute, ionsAtPh,
} from "../src/acids.ts";
import { equationText, isBalanced, parseFormula } from "../src/reactions.ts";

test("Dissoziation: Säuren geben H⁺ ab, Laugen enthalten OH⁻", () => {
  const d = Object.fromEntries(ACIDS.map(a => [a.id, acidDissociation(a)]));
  assert.strictEqual(d.hcl, "HCl → H⁺ + Cl⁻");
  assert.strictEqual(d.h2so4, "H₂SO₄ → 2 H⁺ + SO₄²⁻");
  assert.strictEqual(d.h3po4, "H₃PO₄ → 3 H⁺ + PO₄³⁻");
  assert.strictEqual(d.ch3cooh, "CH₃COOH → H⁺ + CH₃COO⁻");
  const b = Object.fromEntries(BASES.map(x => [x.id, baseDissociation(x)]));
  assert.strictEqual(b.naoh, "NaOH → Na⁺ + OH⁻");
  assert.strictEqual(b.caoh2, "Ca(OH)₂ → Ca²⁺ + 2 OH⁻");
  // Zahl der H im Formel-Anfang stimmt mit protons überein (CH3COOH: nur das H am Ende zählt)
  for (const a of ACIDS) assert.ok(parseFormula(a.formula).H >= a.protons, a.id);
  for (const x of BASES) assert.strictEqual(parseFormula(x.formula).O, x.hydroxides, x.id);
});

test("Neutralisation: jede Säure mit jeder Lauge, ausgeglichen mit kleinsten ganzen Zahlen", () => {
  for (const a of ACIDS) for (const b of BASES) {
    const n = neutralize(a, b);
    assert.ok(isBalanced(n.eq, n.coeffs), `${a.id} + ${b.id}`);
    assert.strictEqual(n.water, n.coeffs[0] * a.protons);
    assert.strictEqual(n.water, n.coeffs[1] * b.hydroxides);
    assert.ok(n.coeffs.every(c => c >= 1 && Number.isInteger(c)));
    assert.ok(n.saltName.length > 3);
  }
  const s = neutralize(ACIDS[0], BASES[0]);
  assert.strictEqual(equationText(s.eq, s.coeffs), "HCl + NaOH → NaCl + H₂O");
  assert.strictEqual(neutralizationWords(s), "Salzsäure + Natronlauge → Natriumchlorid + Wasser");
  const t = neutralize(ACIDS.find(a => a.id === "h2so4")!, BASES.find(b => b.id === "naoh")!);
  assert.strictEqual(equationText(t.eq, t.coeffs), "H₂SO₄ + 2 NaOH → Na₂SO₄ + 2 H₂O");
  assert.strictEqual(t.saltName, "Natriumsulfat");
  const u = neutralize(ACIDS.find(a => a.id === "hcl")!, BASES.find(b => b.id === "caoh2")!);
  assert.strictEqual(equationText(u.eq, u.coeffs), "2 HCl + Ca(OH)₂ → CaCl₂ + 2 H₂O");
  const v = neutralize(ACIDS.find(a => a.id === "h3po4")!, BASES.find(b => b.id === "caoh2")!);
  assert.strictEqual(equationText(v.eq, v.coeffs), "2 H₃PO₄ + 3 Ca(OH)₂ → Ca₃(PO₄)₂ + 6 H₂O");
  const w = neutralize(ACIDS.find(a => a.id === "ch3cooh")!, BASES.find(b => b.id === "naoh")!);
  assert.strictEqual(equationText(w.eq, w.coeffs), "CH₃COOH + NaOH → NaCH₃COO + H₂O");
  assert.strictEqual(w.saltName, "Natriumacetat");
});

test("pH-Skala: Einteilung, Alltagsstoffe, Verdünnen", () => {
  assert.strictEqual(phClass(1), "sauer"); assert.strictEqual(phClass(7), "neutral"); assert.strictEqual(phClass(13), "basisch");
  assert.strictEqual(phLabel(1), "stark sauer"); assert.strictEqual(phLabel(5), "schwach sauer");
  assert.strictEqual(phLabel(7), "neutral"); assert.strictEqual(phLabel(9), "schwach basisch"); assert.strictEqual(phLabel(13), "stark basisch");
  for (const s of SUBSTANCES) assert.ok(s.ph >= 0 && s.ph <= 14 && Number.isInteger(s.ph), s.name);
  assert.strictEqual(SUBSTANCES.find(s => s.name === "Reines Wasser")!.ph, 7);
  assert.ok(SUBSTANCES.find(s => s.name === "Magensäure")!.ph < SUBSTANCES.find(s => s.name === "Essig")!.ph);
  assert.strictEqual(ionsAtPh(2).more, "H⁺"); assert.strictEqual(ionsAtPh(12).more, "OH⁻"); assert.strictEqual(ionsAtPh(7).more, null);
  assert.strictEqual(dilute(2, 1), 3); assert.strictEqual(dilute(2, 10), 6); assert.strictEqual(dilute(12, 1), 11); assert.strictEqual(dilute(12, 10), 8); assert.strictEqual(dilute(7, 3), 7);
});

test("Indikatoren: Farben in sauer, neutral, basisch", () => {
  assert.strictEqual(indicatorColor("universal", 1), "rot"); assert.strictEqual(indicatorColor("universal", 7), "grün"); assert.strictEqual(indicatorColor("universal", 14), "violett");
  assert.strictEqual(indicatorColor("lackmus", 3), "rot"); assert.strictEqual(indicatorColor("lackmus", 11), "blau");
  assert.strictEqual(indicatorColor("phenolphthalein", 3), "farblos"); assert.strictEqual(indicatorColor("phenolphthalein", 12), "pink");
  assert.strictEqual(indicatorColor("rotkohl", 1), "rot"); assert.strictEqual(indicatorColor("rotkohl", 7), "violett"); assert.strictEqual(indicatorColor("rotkohl", 13), "grün");
  for (const i of INDICATORS) for (let ph = 0; ph <= 14; ph++) assert.ok(indicatorColor(i.id, ph), `${i.id} ${ph}`);
});
