// Englischer IUPAC-Name aus dem deutschen Namen (in Teilen) – nur für die Prüfung mit OPSIN (Name → Struktur).
// Deutsch → Englisch: Halogene mit -o (Chlor → chloro), Stamm -an/-en/-in → -ane/-ene/-yne, Endungen (säure → oic acid,
// on → one, amin → amine …), das End-e des Stamms fällt vor einem Vokal weg (propan-2-ol), Ester als „Alkyl Säure-oat“,
// Heterocyclen mit -e (pyridine). Weitere Namen (cis/trans, ältere Schreibweise, Schulnamen, Trivialnamen) über `altEnglish`.

import type { NameOk, Sub } from "../naming.ts";

const HETERO: Record<string, string> = {
  pyridin: "pyridine", piperidin: "piperidine", pyrrolidin: "pyrrolidine", aziridin: "aziridine", azetidin: "azetidine",
  oxolan: "oxolane", thiolan: "thiolane", oxan: "oxane", thian: "thiane", oxiran: "oxirane", thiiran: "thiirane",
  oxetan: "oxetane", thietan: "thietane", furan: "furan", thiophen: "thiophene", pyrrol: "pyrrole", benzen: "benzene",
};
const RETAINED: Record<string, string> = {
  phenol: "phenol", anilin: "aniline", benzoesäure: "benzoic acid", benzaldehyd: "benzaldehyde", benzonitril: "benzonitrile", benzamid: "benzamide",
};
const SUFFIX: Record<string, string> = {
  säure: "oic acid", carbonsäure: "carboxylic acid", carbaldehyd: "carbaldehyde", carboxamid: "carboxamide", carbonitril: "carbonitrile",
  al: "al", on: "one", ol: "ol", thiol: "thiol", amin: "amine", nitril: "nitrile", amid: "amide",
};
const ESTER_SUFFIX: Record<string, string> = { säure: "oate", carbonsäure: "carboxylate" };
const SUF_RE = /^(-[\d,]+-)?(di|tri|tetra|penta|hexa)?(carbonsäure|carbaldehyd|carboxamid|carbonitril|säure|thiol|nitril|amin|amid|al|on|ol)$/;
const MULT = ["", "", "di", "tri", "tetra", "penta", "hexa"];
const MULT_X = ["", "", "bis", "tris", "tetrakis", "pentakis", "hexakis"];

/** Kleinschreibung außer Lokanten (N, N′, N″) und E/Z */
const lower = (s: string) => s.replace(/[A-ZÄÖÜ](?=[a-zäöü])/g, c => c.toLowerCase()).replace(/‴/g, "'''").replace(/″/g, "''").replace(/′/g, "'");

/** Vorsilben (auch verschachtelt): chlor → chloro (auch vor o: chlorooxetan), ethinyl → ethynyl, yliden → ylidene */
export const prefixEn = (t: string) => lower(t)
  .replace(/(fluor|chlor|brom|iod)/g, "$1o")
  .replace(/in(?=yl|oyl)/g, "yn")
  .replace(/yliden(?!e)/g, "ylidene")
  .replace(/ylidin(?!e)/g, "ylidyne");

/** Stammsystem: butan → butane, but-2-en → but-2-ene, pent-1-en-4-in → pent-1-en-4-yne, pyridin → pyridine */
function parentEn(t: string): string {
  const s = lower(t);
  return HETERO[s] ?? s.replace(/an$/, "ane").replace(/en$/, "ene").replace(/in$/, "yne");
}

/** Endung anhängen; das End-e des Stamms fällt vor einem Vokal weg (propane + -2-ol → propan-2-ol) */
function attach(parent: string, suffix: string): string {
  const bare = suffix.replace(/^-[\d,]+-/, "");
  return (/^[aeiouy]/.test(bare) && parent.endsWith("e") ? parent.slice(0, -1) : parent) + suffix;
}

function suffixOf(t: string, table: Record<string, string>): string {
  const m = SUF_RE.exec(lower(t));
  if (!m || !table[m[3]]) throw new Error(`Endung unbekannt: ${t}`);
  return (m[1] ?? "") + (m[2] ?? "") + table[m[3]];
}

const text = (ps: { text: string }[]) => ps.map(p => p.text).join("");

export function toEnglish(r: NameOk): string {
  if (r.ester) return esterEn(r);
  const parts = r.parts;
  const pi = parts.findIndex(p => p.key === "parent"), qi = parts.findIndex(p => p.key === "principal");
  if (pi < 0) return prefixEn(text(parts.slice(0, qi))) + RETAINED[lower(parts[qi].text)];
  const pre = prefixEn(text(parts.slice(0, pi))), parent = parentEn(parts[pi].text);
  return pre + (qi < 0 ? parent : attach(parent, suffixOf(parts[qi].text, SUFFIX)));
}

/** Ester: Alkylreste (getrennt), dann das Anion: methyl (E)-but-2-enoate, diethyl butanedioate */
function esterEn(r: NameOk): string {
  const parts = r.parts;
  const acid = parts.slice(0, parts.findIndex(p => p.key === "alkyl"));
  const pi = acid.findIndex(p => p.key === "parent"), qi = acid.findIndex(p => p.key === "principal");
  const anion = pi < 0
    ? prefixEn(text(acid.slice(0, qi))) + "benzoate"
    : prefixEn(text(acid.slice(0, pi))) + attach(parentEn(acid[pi].text), suffixOf(acid[qi].text, ESTER_SUFFIX));
  return `${alkylsEn(r.ester!.alkyls, r.ester!.alkylLocs)} ${anion}`;
}

/** Alkylreste: gleiche zusammengefasst (diethyl, bis(1-methylethyl)), verschiedene mit Leerzeichen und Nummern (1-ethyl 4-methyl) */
export function alkylsEn(alkyls: Sub[], locs: number[] = []): string {
  const by = new Map<string, { s: Sub; locs: number[] }>();
  alkyls.forEach((a, i) => { const e = by.get(a.name) ?? { s: a, locs: [] }; e.locs.push(locs[i]); by.set(a.name, e); });
  return [...by.values()].map(({ s, locs: ls }) => {
    const n = prefixEn(s.name), k = ls.length;
    const loc = locs.length ? `${ls.sort((a, b) => a - b).join(",")}-` : "";
    if (k === 1) return loc + (loc && s.complex ? `(${n})` : n);
    return loc + (s.complex ? `${MULT_X[k]}(${n})` : MULT[k] + n);
  }).sort().join(" ");
}

const OLD_SUFFIX: Record<string, string> = { ol: "ol", on: "one", amin: "amine", thiol: "thiol", "": "" };
/** einzelnes Wort der älteren Schreibweise: Propanol → propanol, Butadien → butadiene, Butandiol → butanediol, Piperidinon → piperidinone */
function wordEn(w: string): string | undefined {
  const low = lower(w);
  const het = Object.keys(HETERO).find(h => low.startsWith(h) && /^((?:di|tri)?)(ol|on|amin|thiol|)$/.test(low.slice(h.length)));
  if (het) {
    const m = /^((?:di|tri)?)(ol|on|amin|thiol|)$/.exec(low.slice(het.length))!;
    return attach(HETERO[het], m[1] + OLD_SUFFIX[m[2]]);
  }
  const m = /^(.*?)(an|en|in)((?:di|tri|tetra)?)(ol|on|amin|thiol|)$/.exec(low);
  if (!m) return;
  const parent = m[1] + { an: "ane", en: "ene", in: "yne" }[m[2]]!;
  return attach(parent, m[3] + OLD_SUFFIX[m[4]]);
}

/** Trivialnamen, die OPSIN kennt (englisch); fehlt einer, wird er nicht geprüft */
export const TRIVIAL_EN: Record<string, string> = {
  Ethylen: "ethylene", Acetylen: "acetylene", Propylen: "propylene", Methylalkohol: "methyl alcohol", Ethylalkohol: "ethyl alcohol",
  Isopropanol: "isopropanol", Ethylenglykol: "ethylene glycol", Glycerin: "glycerol", Formaldehyd: "formaldehyde", Acetaldehyd: "acetaldehyde",
  Aceton: "acetone", Methylethylketon: "ethyl methyl ketone", Ameisensäure: "formic acid", Essigsäure: "acetic acid", Propionsäure: "propionic acid",
  Buttersäure: "butyric acid", Palmitinsäure: "palmitic acid", Stearinsäure: "stearic acid", Oxalsäure: "oxalic acid", Malonsäure: "malonic acid",
  Bernsteinsäure: "succinic acid", Milchsäure: "lactic acid", Äpfelsäure: "malic acid", Weinsäure: "tartaric acid", Citronensäure: "citric acid",
  Acrylsäure: "acrylic acid", Brenztraubensäure: "pyruvic acid", Maleinsäure: "maleic acid", Fumarsäure: "fumaric acid", Crotonsäure: "crotonic acid",
  Isocrotonsäure: "isocrotonic acid", Ölsäure: "oleic acid", Elaidinsäure: "elaidic acid", Zimtsäure: "cinnamic acid", Sorbinsäure: "sorbic acid",
  "Geranial (Citral A)": "geranial", "Neral (Citral B)": "neral", Geraniol: "geraniol", Nerol: "nerol", Toluol: "toluene", "o-Xylol": "o-xylene",
  "p-Xylol": "p-xylene", Styrol: "styrene", Salicylsäure: "salicylic acid", Acetylsalicylsäure: "acetylsalicylic acid",
  "2,4,6-Trinitrotoluol": "2,4,6-trinitrotoluene", Pikrinsäure: "picric acid", Citronellal: "citronellal", "Methyl-tert-butylether": "methyl tert-butyl ether",
  Diethylether: "diethyl ether", Dimethylether: "dimethyl ether", Chloroform: "chloroform", Tetrachlorkohlenstoff: "carbon tetrachloride",
  Methylenchlorid: "methylene chloride", Methylamin: "methylamine", Ethylamin: "ethylamine", Dimethylamin: "dimethylamine", Diethylamin: "diethylamine",
  Trimethylamin: "trimethylamine", Glycin: "glycine", Alanin: "alanine", Valin: "valine", Leucin: "leucine", Isoleucin: "isoleucine", Serin: "serine",
  Cystein: "cysteine", Phenylalanin: "phenylalanine", Asparaginsäure: "aspartic acid", Glutaminsäure: "glutamic acid", Lysin: "lysine",
  Threonin: "threonine", Methionin: "methionine", Tyrosin: "tyrosine", Acetonitril: "acetonitrile", Blausäure: "hydrogen cyanide",
  Acetamid: "acetamide", Benzoesäure: "benzoic acid", Tetrahydrofuran: "tetrahydrofuran", Tetrahydropyran: "tetrahydropyran", Anilin: "aniline",
};
const TRIVIAL_ANION: Record<string, string> = { formiat: "formate", acetat: "acetate", propionat: "propionate", butyrat: "butyrate" };
const TRIVIAL_ACID: Record<string, string> = { Ameisensäure: "formate", Essigsäure: "acetate", Propionsäure: "propionate", Buttersäure: "butyrate" };

/** weiterer Name auf Englisch (undefined = nicht prüfbar oder gleich dem Hauptnamen) */
export function altEnglish(alt: string, r: NameOk, en: string): string | undefined {
  const ct = /^(cis|trans)-/.exec(alt);
  if (ct) return `${ct[1]}-${en.replace(/^\((?:\d*[EZ],?)+\)-/, "")}`;
  if (TRIVIAL_EN[alt]) return TRIVIAL_EN[alt];
  if (r.ester) {
    const acid = /^(Ameisensäure|Essigsäure|Propionsäure|Buttersäure)/.exec(alt);
    if (acid) return `${alkylsEn(r.ester.alkyls)} ${TRIVIAL_ACID[acid[1]]}`;
    const an = /(formiat|acetat|propionat|butyrat)$/.exec(alt);
    if (an) return `${alkylsEn(r.ester.alkyls)} ${TRIVIAL_ANION[an[1]]}`;
    return;
  }
  if (/benzol/i.test(alt)) return;
  const ether = /^(.+yl)ether$/.exec(alt);
  if (ether) return `${lower(ether[1]).replace(/yl(?=[a-z])/g, "yl ")} ether`;
  if (/^.+ylamin$/.test(alt)) return lower(alt) + "e";
  const old = /^([\d,]+)-([A-ZÄÖÜ][a-zäöü]+)$/.exec(alt);
  if (old) { const w = wordEn(old[2]); return w && `${old[1]}-${w}`; }
  return;
}
