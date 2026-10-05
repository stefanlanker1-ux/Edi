// Fachdaten der Polymere: Monomere für die Kettenpolymerisation (Zweifachbindung C=C) und für das Stufenwachstum
// (Polykondensation, Polyaddition: Moleküle mit funktionellen Gruppen), Starter und Katalysatoren der Polymerisation.
// Welche Kombination funktioniert und warum, steht in rules.ts.

import { tr } from "@lern/i18n";

export type Art = "poly" | "kond" | "add";
/** Farbe der Kügelchen (Palette in tokens.css; light = sehr hell, sky = helles Blau) */
export type Hue = "red" | "blue" | "yellow" | "green" | "grey" | "violet" | "teal" | "orange" | "light" | "sky";
export const HUES: Hue[] = ["violet", "orange", "blue", "red", "green", "teal", "yellow", "grey", "sky", "light"];

export const ART_NAME: Record<Art, string> = tr(
  { poly: "Polymerisation", kond: "Polykondensation", add: "Polyaddition" },
  { poly: "Polymerisation", kond: "Polycondensation", add: "Polyaddition" },
);

// ── Kettenpolymerisation ────────────────────────────────────────────────────────

/** Gruppe an einem C‑Atom der Zweifachbindung */
export type Grp = "H" | "CH3" | "Cl" | "F" | "Ph" | "CN" | "COOMe" | "OAc";

export type VinylId = "ethen" | "propen" | "styrol" | "vinylchlorid" | "mma" | "acrylnitril" | "tfe" | "isobuten" | "butadien" | "vinylacetat";

/** Eigenschaft des Kunststoffs: Thermoplast (schmilzt), Elastomer (gummiartig, schwach vernetzt), Duroplast (stark vernetzt) */
export type Klasse = "thermo" | "elast" | "duro";

export interface Vinyl {
  id: VinylId;
  /** Buchstabe auf dem Kügelchen */
  letter: string;
  hue: Hue;
  name: string;
  /** weiterer Name (Trivialname bzw. systematischer Name) */
  alt: string;
  /** Summenformel (Hill) */
  formula: string;
  /** Halbstrukturformel; {…} = reagierender Teil */
  struct: string;
  /** Gruppen am CH₂-Ende (a) und am anderen C‑Atom (b): [oben, unten] */
  a: [Grp, Grp];
  b: [Grp, Grp];
  /** Buta-1,3-dien: zwei Zweifachbindungen, Einbau 1,4 (–CH₂–CH=CH–CH₂–) */
  diene?: boolean;
  polymer: string;
  abbr: string;
  uses: string;
  klasse: Klasse;
}

export const VINYLS: Vinyl[] = [
  {
    id: "ethen", struct: "{H₂C=CH₂}", letter: "E", hue: "grey", formula: "C2H4", a: ["H", "H"], b: ["H", "H"], abbr: "PE", klasse: "thermo",
    ...tr({ name: "Ethen", alt: "Ethylen", polymer: "Polyethen", uses: "Folien, Tüten, Flaschen, Rohre" },
      { name: "Ethene", alt: "ethylene", polymer: "Polyethene", uses: "films, bags, bottles, pipes" }),
  },
  {
    id: "propen", struct: "{H₂C=CH}–CH₃", letter: "P", hue: "blue", formula: "C3H6", a: ["H", "H"], b: ["CH3", "H"], abbr: "PP", klasse: "thermo",
    ...tr({ name: "Propen", alt: "Propylen", polymer: "Polypropen", uses: "Verschlüsse, Autoteile, Fasern, Dosen für Lebensmittel" },
      { name: "Propene", alt: "propylene", polymer: "Polypropene", uses: "caps, car parts, fibres, food boxes" }),
  },
  {
    id: "styrol", struct: "{H₂C=CH}–C₆H₅", letter: "S", hue: "violet", formula: "C8H8", a: ["H", "H"], b: ["Ph", "H"], abbr: "PS", klasse: "thermo",
    ...tr({ name: "Styrol", alt: "Phenylethen", polymer: "Polystyrol", uses: "Becher, CD-Hüllen, geschäumt als Dämmplatten" },
      { name: "Styrene", alt: "phenylethene", polymer: "Polystyrene", uses: "cups, CD cases, foamed as insulation boards" }),
  },
  {
    id: "vinylchlorid", struct: "{H₂C=CH}–Cl", letter: "C", hue: "green", formula: "C2H3Cl", a: ["H", "H"], b: ["Cl", "H"], abbr: "PVC", klasse: "thermo",
    ...tr({ name: "Vinylchlorid", alt: "Chlorethen", polymer: "Polyvinylchlorid", uses: "Rohre, Fensterrahmen, Kabelhüllen, Bodenbeläge" },
      { name: "Vinyl chloride", alt: "chloroethene", polymer: "Poly(vinyl chloride)", uses: "pipes, window frames, cable sheaths, floorings" }),
  },
  {
    id: "mma", struct: "{H₂C=C}(CH₃)–COOCH₃", letter: "M", hue: "red", formula: "C5H8O2", a: ["H", "H"], b: ["COOMe", "CH3"], abbr: "PMMA", klasse: "thermo",
    ...tr({ name: "Methylmethacrylat", alt: "2-Methylpropensäuremethylester", polymer: "Polymethylmethacrylat", uses: "Acrylglas für Scheiben, Rücklichter, Leuchten" },
      { name: "Methyl methacrylate", alt: "methyl 2-methylpropenoate", polymer: "Poly(methyl methacrylate)", uses: "acrylic glass for panes, rear lights, lamps" }),
  },
  {
    id: "acrylnitril", struct: "{H₂C=CH}–C≡N", letter: "A", hue: "teal", formula: "C3H3N", a: ["H", "H"], b: ["CN", "H"], abbr: "PAN", klasse: "thermo",
    ...tr({ name: "Acrylnitril", alt: "Propennitril", polymer: "Polyacrylnitril", uses: "Acrylfasern für Pullover und Decken, Ausgangsstoff für Kohlenstofffasern" },
      { name: "Acrylonitrile", alt: "propenenitrile", polymer: "Polyacrylonitrile", uses: "acrylic fibres for jumpers and blankets, raw material for carbon fibres" }),
  },
  {
    id: "tfe", struct: "{F₂C=CF₂}", letter: "T", hue: "light", formula: "C2F4", a: ["F", "F"], b: ["F", "F"], abbr: "PTFE", klasse: "thermo",
    ...tr({ name: "Tetrafluorethen", alt: "Tetrafluorethylen", polymer: "Polytetrafluorethen", uses: "Antihaftbeschichtung von Pfannen, Dichtungen, Membranen in Regenjacken" },
      { name: "Tetrafluoroethene", alt: "tetrafluoroethylene", polymer: "Polytetrafluoroethene", uses: "non-stick coating of pans, seals, membranes in rain jackets" }),
  },
  {
    id: "isobuten", struct: "{H₂C=C}(CH₃)₂", letter: "I", hue: "yellow", formula: "C4H8", a: ["H", "H"], b: ["CH3", "CH3"], abbr: "PIB", klasse: "elast",
    ...tr({ name: "Isobuten", alt: "2-Methylpropen", polymer: "Polyisobuten", uses: "Kaugummimasse, Dichtmassen; mit wenig Isopren: Butylkautschuk für Schläuche" },
      { name: "Isobutene", alt: "2-methylpropene", polymer: "Polyisobutene", uses: "chewing gum base, sealants; with a little isoprene: butyl rubber for inner tubes" }),
  },
  {
    id: "butadien", struct: "{H₂C=CH–CH=CH₂}", letter: "B", hue: "orange", formula: "C4H6", a: ["H", "H"], b: ["H", "H"], diene: true, abbr: "BR", klasse: "elast",
    ...tr({ name: "Butadien", alt: "Buta-1,3-dien", polymer: "Polybutadien", uses: "Autoreifen, Golfbälle, Schuhsohlen" },
      { name: "Butadiene", alt: "buta-1,3-diene", polymer: "Polybutadiene", uses: "car tyres, golf balls, shoe soles" }),
  },
  {
    id: "vinylacetat", struct: "{H₂C=CH}–O–CO–CH₃", letter: "V", hue: "sky", formula: "C4H6O2", a: ["H", "H"], b: ["OAc", "H"], abbr: "PVAc", klasse: "thermo",
    ...tr({ name: "Vinylacetat", alt: "Ethenylethanoat", polymer: "Polyvinylacetat", uses: "Holzleim (Weißleim), Kaugummimasse" },
      { name: "Vinyl acetate", alt: "ethenyl ethanoate", polymer: "Poly(vinyl acetate)", uses: "wood glue (white glue), chewing gum base" }),
  },
];
export const vinyl = (id: string): Vinyl => VINYLS.find(m => m.id === id) ?? VINYLS[0];
export const isVinyl = (id: string): id is VinylId => VINYLS.some(m => m.id === id);

// ── Starter und Katalysatoren der Polymerisation ──────────────────────────────

export type MethodId = "dbpo" | "aibn" | "zn" | "buli" | "bf3";
export type MechKind = "radikal" | "koord" | "anion" | "kation";

export interface Method {
  id: MethodId;
  kind: MechKind;
  name: string;
  /** kurzer Name für Knöpfe */
  short: string;
  /** Formel bzw. Zusammensetzung */
  formula: string;
  /** Initiator (wird verbraucht, steckt danach am Kettenanfang) oder Katalysator (arbeitet weiter) */
  role: "init" | "kat";
  /** Bedingung (Temperatur, Druck) */
  cond: string;
  /** was am Anfang der Kette sitzt (Endgruppe) */
  endGroup: string;
}

export const METHODS: Method[] = [
  {
    id: "dbpo", kind: "radikal", formula: "(C₆H₅COO)₂", role: "init", short: "DBPO",
    ...tr({ name: "Dibenzoylperoxid", cond: "Erwärmen auf etwa 80 °C", endGroup: "C₆H₅– (Phenylgruppe)" },
      { name: "Dibenzoyl peroxide", cond: "heating to about 80 °C", endGroup: "C₆H₅– (phenyl group)" }),
  },
  {
    id: "aibn", kind: "radikal", formula: "(CH₃)₂C(CN)–N=N–C(CN)(CH₃)₂", role: "init", short: "AIBN",
    ...tr({ name: "Azobisisobutyronitril", cond: "Erwärmen auf etwa 70 °C oder UV-Licht", endGroup: "(CH₃)₂C(CN)–" },
      { name: "Azobisisobutyronitrile", cond: "heating to about 70 °C or UV light", endGroup: "(CH₃)₂C(CN)–" }),
  },
  {
    id: "zn", kind: "koord", formula: "TiCl₄ + Al(C₂H₅)₃", role: "kat", short: tr("Ziegler-Natta", "Ziegler–Natta"),
    ...tr({ name: "Ziegler-Natta-Katalysator", cond: "Niederdruck, etwa 70 °C", endGroup: "C₂H₅– (erste Kette), danach H–" },
      { name: "Ziegler–Natta catalyst", cond: "low pressure, about 70 °C", endGroup: "C₂H₅– (first chain), then H–" }),
  },
  {
    id: "buli", kind: "anion", formula: "C₄H₉Li", role: "init", short: "BuLi",
    ...tr({ name: "Butyllithium", cond: "ohne Wasser und Luft, Raumtemperatur", endGroup: "C₄H₉– (Butylgruppe)" },
      { name: "Butyllithium", cond: "without water and air, room temperature", endGroup: "C₄H₉– (butyl group)" }),
  },
  {
    id: "bf3", kind: "kation", formula: "BF₃ + H₂O", role: "init", short: "BF₃",
    ...tr({ name: "Bortrifluorid mit Wasser", cond: "Kühlen auf etwa −100 °C", endGroup: "H–" },
      { name: "Boron trifluoride with water", cond: "cooling to about −100 °C", endGroup: "H–" }),
  },
];
export const method = (id: string): Method => METHODS.find(m => m.id === id) ?? METHODS[0];

export const KIND_NAME: Record<MechKind, string> = tr(
  { radikal: "radikalisch", koord: "am Titan", anion: "anionisch", kation: "kationisch" },
  { radikal: "radical", koord: "at titanium", anion: "anionic", kation: "cationic" },
);

// ── Stufenwachstum: Monomere mit funktionellen Gruppen ─────────────────────────

/** Funktionelle Gruppe: Carboxygruppe, Säurechlorid, Hydroxygruppe, Aminogruppe, Isocyanatgruppe, Epoxidring,
 *  reaktive Stelle am Phenol-Ring, Methanal (verbrückt zwei Phenolringe) */
export type FG = "COOH" | "COCl" | "OH" | "NH2" | "NCO" | "EPOX" | "ArH" | "CHO";

/** Gerüst zwischen den Gruppen (gezeichnet): Benzolring (para), CH₂-Kette, Glycerin, Phenol, Methanal, Bisphenol-A-Gerüst */
export type Core =
  | { k: "ring" }
  | { k: "chain"; n: number }
  | { k: "chiral" }          // Milchsäure: –CH(CH₃)–
  | { k: "glycerin" }
  | { k: "phenol" }
  | { k: "methanal" }
  | { k: "mdi" }
  | { k: "badge" };

export type StepId =
  | "terephthalsaeure" | "adipinsaeure" | "adipoylchlorid" | "terephthaloylchlorid" | "essigsaeure"
  | "ethandiol" | "butandiol" | "glycerin" | "ethanol"
  | "hexandiamin" | "phenylendiamin"
  | "milchsaeure" | "aminohexansaeure"
  | "phenol" | "methanal"
  | "hdi" | "mdi" | "badge";

export interface StepMono {
  id: StepId;
  letter: string;
  hue: Hue;
  name: string;
  alt: string;
  formula: string;
  /** Halbstrukturformel; {…} = reaktive Gruppe */
  struct: string;
  /** Gruppen (Anzahl = Funktionalität): links, rechts, (dritte) */
  groups: FG[];
  core: Core;
  /** in welcher Auswahl das Monomer erscheint */
  arts: Art[];
}

export const STEPS: StepMono[] = [
  {
    id: "terephthalsaeure", struct: "{HOOC}–C₆H₄–{COOH}", letter: "T", hue: "red", formula: "C8H6O4", groups: ["COOH", "COOH"], core: { k: "ring" }, arts: ["kond"],
    ...tr({ name: "Terephthalsäure", alt: "Benzol-1,4-dicarbonsäure" }, { name: "Terephthalic acid", alt: "benzene-1,4-dicarboxylic acid" }),
  },
  {
    id: "adipinsaeure", struct: "{HOOC}–(CH₂)₄–{COOH}", letter: "A", hue: "orange", formula: "C6H10O4", groups: ["COOH", "COOH"], core: { k: "chain", n: 4 }, arts: ["kond"],
    ...tr({ name: "Adipinsäure", alt: "Hexandisäure" }, { name: "Adipic acid", alt: "hexanedioic acid" }),
  },
  {
    id: "adipoylchlorid", struct: "{ClOC}–(CH₂)₄–{COCl}", letter: "A", hue: "yellow", formula: "C6H8Cl2O2", groups: ["COCl", "COCl"], core: { k: "chain", n: 4 }, arts: ["kond"],
    ...tr({ name: "Adipinsäuredichlorid", alt: "Hexandisäuredichlorid" }, { name: "Adipoyl chloride", alt: "hexanedioyl dichloride" }),
  },
  {
    id: "terephthaloylchlorid", struct: "{ClOC}–C₆H₄–{COCl}", letter: "T", hue: "orange", formula: "C8H4Cl2O2", groups: ["COCl", "COCl"], core: { k: "ring" }, arts: ["kond"],
    ...tr({ name: "Terephthalsäuredichlorid", alt: "Benzol-1,4-dicarbonsäuredichlorid" }, { name: "Terephthaloyl chloride", alt: "benzene-1,4-dicarbonyl dichloride" }),
  },
  {
    id: "essigsaeure", struct: "CH₃–{COOH}", letter: "Es", hue: "light", formula: "C2H4O2", groups: ["COOH"], core: { k: "chain", n: 0 }, arts: ["kond"],
    ...tr({ name: "Essigsäure", alt: "Ethansäure" }, { name: "Acetic acid", alt: "ethanoic acid" }),
  },
  {
    id: "ethandiol", struct: "{HO}–CH₂–CH₂–{OH}", letter: "G", hue: "teal", formula: "C2H6O2", groups: ["OH", "OH"], core: { k: "chain", n: 2 }, arts: ["kond", "add"],
    ...tr({ name: "Ethandiol", alt: "Ethylenglykol" }, { name: "Ethane-1,2-diol", alt: "ethylene glycol" }),
  },
  {
    id: "butandiol", struct: "{HO}–(CH₂)₄–{OH}", letter: "B", hue: "green", formula: "C4H10O2", groups: ["OH", "OH"], core: { k: "chain", n: 4 }, arts: ["kond", "add"],
    ...tr({ name: "Butan-1,4-diol", alt: "1,4-Butandiol" }, { name: "Butane-1,4-diol", alt: "1,4-butanediol" }),
  },
  {
    id: "glycerin", struct: "{HO}–CH₂–CH{(OH)}–CH₂–{OH}", letter: "Gl", hue: "yellow", formula: "C3H8O3", groups: ["OH", "OH", "OH"], core: { k: "glycerin" }, arts: ["kond", "add"],
    ...tr({ name: "Glycerin", alt: "Propan-1,2,3-triol" }, { name: "Glycerol", alt: "propane-1,2,3-triol" }),
  },
  {
    id: "ethanol", struct: "CH₃–CH₂–{OH}", letter: "Et", hue: "light", formula: "C2H6O", groups: ["OH"], core: { k: "chain", n: 2 }, arts: ["kond", "add"],
    ...tr({ name: "Ethanol", alt: "Ethylalkohol" }, { name: "Ethanol", alt: "ethyl alcohol" }),
  },
  {
    id: "hexandiamin", struct: "{H₂N}–(CH₂)₆–{NH₂}", letter: "H", hue: "blue", formula: "C6H16N2", groups: ["NH2", "NH2"], core: { k: "chain", n: 6 }, arts: ["kond", "add"],
    ...tr({ name: "Hexan-1,6-diamin", alt: "Hexamethylendiamin" }, { name: "Hexane-1,6-diamine", alt: "hexamethylenediamine" }),
  },
  {
    id: "phenylendiamin", struct: "{H₂N}–C₆H₄–{NH₂}", letter: "P", hue: "violet", formula: "C6H8N2", groups: ["NH2", "NH2"], core: { k: "ring" }, arts: ["kond"],
    ...tr({ name: "Benzol-1,4-diamin", alt: "p-Phenylendiamin" }, { name: "Benzene-1,4-diamine", alt: "p-phenylenediamine" }),
  },
  {
    id: "milchsaeure", struct: "{HO}–CH(CH₃)–{COOH}", letter: "L", hue: "green", formula: "C3H6O3", groups: ["OH", "COOH"], core: { k: "chiral" }, arts: ["kond"],
    ...tr({ name: "Milchsäure", alt: "2-Hydroxypropansäure" }, { name: "Lactic acid", alt: "2-hydroxypropanoic acid" }),
  },
  {
    id: "aminohexansaeure", struct: "{H₂N}–(CH₂)₅–{COOH}", letter: "6", hue: "sky", formula: "C6H13NO2", groups: ["NH2", "COOH"], core: { k: "chain", n: 5 }, arts: ["kond"],
    ...tr({ name: "6-Aminohexansäure", alt: "ε-Aminocapronsäure" }, { name: "6-Aminohexanoic acid", alt: "ε-aminocaproic acid" }),
  },
  {
    id: "phenol", struct: "HO–C₆H₂{H₃}", letter: "Ph", hue: "orange", formula: "C6H6O", groups: ["ArH", "ArH", "ArH"], core: { k: "phenol" }, arts: ["kond"],
    ...tr({ name: "Phenol", alt: "Hydroxybenzol" }, { name: "Phenol", alt: "hydroxybenzene" }),
  },
  {
    id: "methanal", struct: "H₂{C=O}", letter: "F", hue: "grey", formula: "CH2O", groups: ["CHO", "CHO"], core: { k: "methanal" }, arts: ["kond"],
    ...tr({ name: "Methanal", alt: "Formaldehyd" }, { name: "Methanal", alt: "formaldehyde" }),
  },
  {
    id: "hdi", struct: "{OCN}–(CH₂)₆–{NCO}", letter: "D", hue: "violet", formula: "C8H12N2O2", groups: ["NCO", "NCO"], core: { k: "chain", n: 6 }, arts: ["add"],
    ...tr({ name: "Hexamethylendiisocyanat", alt: "HDI, 1,6-Diisocyanatohexan" }, { name: "Hexamethylene diisocyanate", alt: "HDI, 1,6-diisocyanatohexane" }),
  },
  {
    id: "mdi", struct: "{OCN}–C₆H₄–CH₂–C₆H₄–{NCO}", letter: "M", hue: "grey", formula: "C15H10N2O2", groups: ["NCO", "NCO"], core: { k: "mdi" }, arts: ["add"],
    ...tr({ name: "Diphenylmethandiisocyanat", alt: "MDI" }, { name: "Methylene diphenyl diisocyanate", alt: "MDI" }),
  },
  {
    id: "badge", letter: "Ep", hue: "red", formula: "C21H24O4", groups: ["EPOX", "EPOX"], core: { k: "badge" }, arts: ["add"],
    ...tr({ name: "Bisphenol-A-diglycidylether", alt: "Epoxidharz-Komponente", struct: "{Epoxid}–R–{Epoxid}" }, { name: "Bisphenol A diglycidyl ether", alt: "epoxy resin component", struct: "{epoxide}–R–{epoxide}" }),
  },
];
export const stepMono = (id: string): StepMono => STEPS.find(m => m.id === id) ?? STEPS[0];
export const isStep = (id: string): id is StepId => STEPS.some(m => m.id === id);

/** Name der funktionellen Gruppe */
export const FG_NAME: Record<FG, string> = tr(
  { COOH: "Carboxygruppe", COCl: "Säurechloridgruppe", OH: "Hydroxygruppe", NH2: "Aminogruppe", NCO: "Isocyanatgruppe", EPOX: "Epoxidgruppe", ArH: "H am Ring", CHO: "Aldehydgruppe" },
  { COOH: "carboxy group", COCl: "acyl chloride group", OH: "hydroxy group", NH2: "amino group", NCO: "isocyanate group", EPOX: "epoxide group", ArH: "H on the ring", CHO: "aldehyde group" },
);
/** Formel der Gruppe */
export const FG_FORMULA: Record<FG, string> = { COOH: "–COOH", COCl: "–COCl", OH: "–OH", NH2: "–NH₂", NCO: "–N=C=O", EPOX: "–CH(O)CH₂", ArH: "–H", CHO: "H–CHO" };

/** Name eines Monomers (Kette oder Stufe) */
export const monoName = (id: string) => (isVinyl(id) ? vinyl(id).name : stepMono(id).name);
export const monoHue = (id: string): Hue => (isVinyl(id) ? vinyl(id).hue : stepMono(id).hue);
export const monoLetter = (id: string) => (isVinyl(id) ? vinyl(id).letter : stepMono(id).letter);
export const monoFormula = (id: string) => (isVinyl(id) ? vinyl(id).formula : stepMono(id).formula);
export const monoStruct = (id: string) => (isVinyl(id) ? vinyl(id).struct : stepMono(id).struct);
