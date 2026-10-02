// Beispielmoleküle nach Stoffklassen (Kurzschreibweise, siehe smiles.ts). Namen berechnet die App selbst (naming.ts).

import { layout } from "./layout.ts";
import { parseSmiles } from "./smiles.ts";
import type { Mol } from "./mol.ts";
import { tr } from "@lern/i18n";

export interface ExampleGroup { title: string; items: string[] }

export const EXAMPLES: ExampleGroup[] = [
  { title: tr("Alkane", "Alkanes"), items: ["CCCC", "CC(C)CC", "CC(C)(C)C", "CCC(CC)CC", "CC(C)C(C)CC(C)C", "CCC(C)C(CC)CCC", "C1CCCCC1", "CC1CCCCC1"] },
  { title: tr("Alkene und Alkine", "Alkenes and alkynes"), items: ["C=C", "C#C", "CC=CC", "C=CC=C", "CC(C)=CC", "C=CCC#C", "C1=CCCCC1"] },
  { title: tr("Halogene", "Halogens"), items: ["CCCl", "ClC(Cl)Cl", "CC(Cl)CBr", "CC(Cl)(Cl)C(F)(F)F"] },
  { title: tr("Alkohole und Ether", "Alcohols and ethers"), items: ["CCO", "CCCO", "CC(O)C", "CC(C)(O)C", "OCCO", "OCC(O)CO", "CCOCC", "COC(C)(C)C"] },
  { title: tr("Aldehyde und Ketone", "Aldehydes and ketones"), items: ["C=O", "CC=O", "CC(C)=O", "CCC(C)=O", "CC(C)=CCCC(C)CC=O", "O=C1CCCCC1", "CC(=O)CC(=O)C"] },
  { title: tr("Carbonsäuren", "Carboxylic acids"), items: ["OC(=O)C(C)C(=O)CCC", "OC=O", "CC(=O)O", "CCCC(=O)O", "OC(=O)C(C)(C)CCC", "OC(=O)CC(=O)O", "CC(O)C(=O)O", "OC(=O)CC(O)(CC(=O)O)C(=O)O"] },
  { title: tr("Ester", "Esters"), items: ["CCCC(=O)OCC", "CCCC(=O)OC", "O=COCC", "CCCCC(=O)OCCCCC", "COC(=O)CC", "CCCOC=O", "CCCOC(=O)CC"] },
  { title: tr("Amine und Aminosäuren", "Amines and amino acids"), items: ["CN", "CCN", "CCNCC", "NCC(=O)O", "CC(N)C(=O)O", "CC(C)C(N)C(=O)O", "OC(=O)C(N)CC1=CC=CC=C1"] },
  { title: tr("Aromaten", "Aromatics"), items: ["C1=CC=CC=C1", "CC1=CC=CC=C1", "OC1=CC=CC=C1", "NC1=CC=CC=C1", "OC(=O)C1=CC=CC=C1", "CC1=C(C=C(C=C1[NO2])[NO2])[NO2]", "CC(=O)OC1=CC=CC=C1C(=O)O"] },
  { title: tr("Ringe mit Heteroatom", "Rings with a heteroatom"), items: ["C1CCSC1", "C1CCOC1", "C1CCNC1", "C1=CC=NC=C1", "C1=CSC=C1", "O=C1CCCO1"] },
  { title: tr("Mehrere Gruppen", "Several groups"), items: [
    "OC(=O)C(C)C(=O)C(O)C(C)CC", "O=CC(N)C(=O)C(CC)C(CC)CCC", "OC(=O)C(C)(C)C(O)C(O)C(O)C", "CC(C)C(C)C(C)(CC)C(=O)CCC(N)C(N)C",
    "CC(=O)CC(O)C", "OC(=O)CC(=O)C(O)CN", "OC(=O)C(C)(O)C(C)(O)C=CC",
  ] },
];

const cache = new Map<string, Mol>();
/** Beispiel als Molekül mit Lage der Atome */
export function exampleMol(smiles: string): Mol {
  let m = cache.get(smiles);
  if (!m) { m = layout(parseSmiles(smiles)); cache.set(smiles, m); }
  return m;
}
