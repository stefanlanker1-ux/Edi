// Quiz-Aufgaben zu Säuren und Basen (reine Daten). Aufgabentyp = Fertigkeit.
// Antwortformen: "mc" (Auswahl), "num" (Zahl eintippen), "swatch" (Farbe wählen).

import {
  ACIDS, BASES, SUBSTANCES, INDICATORS, ACID_BY_ID, acidDissociation, baseDissociation, indicatorColor, neutralize, phClass, phLabel, dilute,
  equationText, toSubscript, type Acid, type Base,
} from "@lern/chem";
import { buildRound, dis, mc, pick, shuffle, weakTypes, type BaseTask, type LevelKey, type McTask, type QuizLevel, type TypeStats } from "@lern/quiz";

/** ph: Skala mit Markierung über der Frage (renderVisual); eq: Gleichung groß über der Frage */
type Visual = { ph?: number; eq?: string };
export type Task =
  | (McTask & Visual)
  | (BaseTask & Visual & { kind: "num"; answer: number })
  | (BaseTask & Visual & { kind: "swatch"; options: string[]; answer: number; why?: Record<number, string> });

const CLASSES = ["sauer", "neutral", "basisch"] as const;
const wrongNums = (right: number, cands: number[]) => cands.filter(x => x !== right && x >= 0).map(String);

// ── Fertigkeiten ────────────────────────────────────────────────────────────

/** pH-Wert einordnen: sauer, neutral, basisch (Auswahl) – oder pH von Wasser / Grenze (Zahl) */
function klasse(): Task {
  const ph = pick([0, 1, 2, 3, 4, 5, 6, 7, 7, 8, 9, 10, 11, 12, 13, 14]);
  const c = phClass(ph);
  if (Math.random() < 0.25) {
    return {
      kind: "num", answer: 7,
      prompt: pick(["Welchen **pH-Wert** hat reines Wasser?", "Bei welchem **pH-Wert** ist eine Lösung **neutral**?"]),
      hint: "In der Mitte der Skala 0–14.",
      explain: "Neutral ist **pH 7**: gleich viele H⁺ wie OH⁻. Darunter sauer, darüber basisch.",
      praise: "pH 7 als Mitte der Skala erkannt – genau so geht's.",
    };
  }
  return {
    ...mc(c, [
      c !== "sauer" ? dis("sauer", ph === 7 ? "pH 7 ist genau die Mitte: gleich viele H⁺ und OH⁻ – **neutral**, nicht sauer." : "Sauer sind nur die **kleinen** Zahlen (0–6). Große Zahlen bedeuten viel OH⁻ – basisch.") : null,
      c !== "basisch" ? dis("basisch", ph === 7 ? "pH 7 ist genau die Mitte: gleich viele H⁺ und OH⁻ – **neutral**, nicht basisch." : "Basisch sind nur die **großen** Zahlen (8–14). Kleine Zahlen bedeuten viel H⁺ – sauer.") : null,
      c !== "neutral" ? dis("neutral", "Neutral ist **nur pH 7**. Alles andere ist sauer (darunter) oder basisch (darüber).") : null,
    ]),
    ph,
    prompt: `Eine Lösung hat **pH ${ph}**. Ist sie sauer, neutral oder basisch?`,
    hint: "0–6 sauer, 7 neutral, 8–14 basisch.",
    explain: `pH ${ph} → **${phLabel(ph)}**${c === "sauer" ? " (mehr H⁺ als OH⁻)" : c === "basisch" ? " (mehr OH⁻ als H⁺)" : " (H⁺ = OH⁻)"}.`,
    praise: "Auf der Skala richtig eingeordnet – genau so geht's.",
  };
}

/** Alltagsstoffe: welcher ist sauer/basisch, welcher ist am stärksten sauer, pH-Wert schätzen */
function stoff(): Task {
  const mode = pick(["klasse", "klasse", "staerkste", "ph"]);
  if (mode === "ph") {
    const s = pick(SUBSTANCES.filter(x => x.contains || x.ph === 7));
    return {
      ...mc(String(s.ph), wrongNums(s.ph, [14 - s.ph, s.ph + 4, s.ph - 4, 7, s.ph + 2, s.ph - 2])),
      prompt: `Welchen **pH-Wert** hat etwa **${s.name}**?`,
      hint: s.ph < 7 ? `${s.name} ist sauer – also eine kleine Zahl.` : s.ph > 7 ? `${s.name} ist basisch – also eine große Zahl.` : "Neutral heißt genau in der Mitte.",
      explain: `${s.name}: **pH ${s.ph}** (${phLabel(s.ph)})${s.contains ? ` – enthält ${ACID_BY_ID[s.contains]?.name ?? BASES.find(b => b.id === s.contains)?.name}` : ""}.`,
    };
  }
  if (mode === "staerkste") {
    const set = shuffle(SUBSTANCES).slice(0, 4);
    const want = Math.random() < 0.5 ? "sauer" : "basisch";
    const best = [...set].sort((a, b) => (want === "sauer" ? a.ph - b.ph : b.ph - a.ph))[0];
    if (set.filter(s => s.ph === best.ph).length > 1) return stoff();
    return {
      ...mc(best.name, set.filter(s => s !== best).map(s => dis(s.name, s.ph === 7 ? `${s.name} ist neutral (pH 7).`
        : want === "sauer" ? (s.ph > 7 ? `${s.name} ist basisch (pH ${s.ph}) – gar nicht sauer.` : `${s.name} hat pH ${s.ph} – je **kleiner** die Zahl, desto saurer.`)
          : (s.ph < 7 ? `${s.name} ist sauer (pH ${s.ph}) – gar nicht basisch.` : `${s.name} hat pH ${s.ph} – je **größer** die Zahl, desto basischer.`)))),
      prompt: `Welcher Stoff ist **am stärksten ${want}**?`,
      hint: want === "sauer" ? "Am stärksten sauer = kleinster pH-Wert." : "Am stärksten basisch = größter pH-Wert.",
      explain: set.map(s => `${s.name} pH ${s.ph}`).join(" · ") + ` → **${best.name}**.`,
      praise: "pH-Werte verglichen – genau so geht's.",
    };
  }
  const want = pick(CLASSES);
  const right = pick(SUBSTANCES.filter(s => phClass(s.ph) === want));
  const wrongs = shuffle(SUBSTANCES.filter(s => phClass(s.ph) !== want)).slice(0, 4)
    .map(s => dis(s.name, `${s.name} hat pH ${s.ph} → ${phLabel(s.ph)}.`));
  return {
    ...mc(right.name, wrongs),
    prompt: `Welcher dieser Stoffe ist **${want}**?`,
    hint: want === "sauer" ? "Sauer schmeckt sauer: Zitrone, Essig, Cola … pH unter 7." : want === "basisch" ? "Laugen fühlen sich seifig an: Seife, Rohrreiniger, Kalkwasser … pH über 7." : "Neutral = pH 7, z. B. reines Wasser.",
    explain: `${right.name}: pH ${right.ph} → **${phLabel(right.ph)}**.`,
  };
}

/** Indikatorfarbe bei einem pH-Wert (Farbe wählen) – oder umgekehrt: aus der Farbe auf sauer/basisch schließen */
function indikator(): Task {
  const ind = pick(INDICATORS);
  const ph = pick([1, 2, 3, 5, 7, 9, 11, 13, 14]);
  const c = indicatorColor(ind.id, ph);
  if (Math.random() < 0.4) {
    // Rückschluss aus der Farbe
    const cls = phClass(ph);
    const seen = [1, 7, 13].map(p => indicatorColor(ind.id, p));
    if (ind.id === "phenolphthalein" && ph < 9) {
      return {
        ...mc("sauer oder neutral", [dis("basisch", "Phenolphthalein ist im Basischen **pink**. Farblos heißt: nicht basisch – sauer oder neutral."), "nur sauer", "nur neutral"]),
        prompt: `**${ind.name}** bleibt in einer Lösung **farblos**. Was weiß man über die Lösung?`,
        hint: "Phenolphthalein hat nur zwei Zustände: farblos oder pink.",
        explain: "Phenolphthalein wird erst im Basischen **pink**. Farblos → die Lösung ist **sauer oder neutral**.",
      };
    }
    if (new Set(seen).size < 3 && ind.id !== "phenolphthalein") return indikator();
    return {
      ...mc(cls, CLASSES.filter(x => x !== cls).map(x => dis(x, `${x === "sauer" ? "Sauer" : x === "basisch" ? "Basisch" : "Neutral"} wäre ${ind.name} **${indicatorColor(ind.id, x === "sauer" ? 2 : x === "basisch" ? 12 : 7)}**.`))),
      prompt: `**${ind.name}** färbt eine Lösung **${c}**. Ist die Lösung sauer, neutral oder basisch?`,
      hint: `${ind.name}: ${seen[0]} (sauer) · ${seen[1]} (neutral) · ${seen[2]} (basisch).`,
      explain: `${ind.name} ist im ${cls === "sauer" ? "Sauren" : cls === "basisch" ? "Basischen" : "Neutralen"} **${c}** → **${cls}**.`,
    };
  }
  const all = [...new Set([0, 2, 4, 6, 7, 8, 10, 12, 14].map(p => indicatorColor(ind.id, p)))];
  // Indikatoren mit wenigen Farben (Phenolphthalein): fremde Farben auffüllen
  const foreign = shuffle(["rot", "blau", "grün", "gelb"].filter(x => !all.includes(x))).slice(0, 4 - all.length);
  const options = shuffle([c, ...shuffle(all.filter(x => x !== c)).slice(0, 3), ...foreign]);
  const why: Record<number, string> = {};
  options.forEach((o, i) => {
    if (o === c) return;
    const at = [0, 2, 4, 6, 7, 8, 10, 12, 14].find(p => indicatorColor(ind.id, p) === o);
    why[i] = at === undefined
      ? `${ind.name} kennt nur die Farben ${all.join(" und ")} – ${o} gehört zu einem anderen Indikator.`
      : `${o[0].toUpperCase() + o.slice(1)} zeigt ${ind.name} bei pH ${at} (${phLabel(at)}). pH ${ph} ist ${phLabel(ph)}.`;
  });
  return {
    kind: "swatch", options, answer: options.indexOf(c), why, ph,
    prompt: `Welche Farbe zeigt **${ind.name}** bei **pH ${ph}**?`,
    hint: ph < 7 ? "pH unter 7 ist sauer – Indikatoren zeigen im Sauren meist rot/orange." : ph > 7 ? "pH über 7 ist basisch – Indikatoren zeigen im Basischen blau/violett/pink/grün." : "pH 7 ist neutral.",
    explain: `pH ${ph} ist ${phLabel(ph)} → ${ind.name} **${c}**.`,
  };
}

/** Teilchen: Was macht sauer, was entsteht beim Lösen einer Säure/Lauge, wie viele H⁺ */
function teilchen(): Task {
  const mode = pick(["hplus", "diss", "diss", "count"]);
  if (mode === "hplus") {
    const basic = Math.random() < 0.5;
    return {
      ...mc(basic ? "OH⁻" : "H⁺", [
        dis(basic ? "H⁺" : "OH⁻", basic ? "H⁺ macht **sauer**. Laugen enthalten **OH⁻** (Hydroxid-Ionen)." : "OH⁻ macht **basisch**. Säuren geben **H⁺** ab."),
        dis("Na⁺", "Na⁺ ist ein Metall-Ion – es macht weder sauer noch basisch. Entscheidend sind H⁺ und OH⁻."),
        dis("Cl⁻", "Cl⁻ ist nur der Säurerest – das Saure kommt vom **H⁺**, das die Säure abgibt."),
      ]),
      prompt: `Welches Teilchen macht eine Lösung **${basic ? "basisch" : "sauer"}**?`,
      hint: basic ? "Laugen enthalten Hydroxid-Ionen." : "Säuren geben in Wasser ein Ion ab, das nur aus einem Proton besteht.",
      explain: basic ? "Basisch: **mehr OH⁻** (Hydroxid-Ionen) als H⁺ in der Lösung." : "Sauer: **mehr H⁺** (Wasserstoff-Ionen) als OH⁻ in der Lösung.",
    };
  }
  if (mode === "count") {
    const a = pick(ACIDS);
    return {
      kind: "num", answer: a.protons,
      prompt: `Wie viele **H⁺** kann ein Teilchen **${a.name}** (${toSubscript(a.formula)}) abgeben?`,
      hint: a.id === "ch3cooh" ? "Bei Essigsäure zählt nur das H am Ende (–COOH); die H am Kohlenstoff bleiben." : "Zähle die H am Anfang der Formel.",
      explain: `${acidDissociation(a)} → **${a.protons}** H⁺.`,
      praise: "H-Atome in der Formel gezählt – genau so geht's.",
    };
  }
  const isAcid = Math.random() < 0.6;
  const x: Acid | Base = isAcid ? pick(ACIDS) : pick(BASES);
  const right = isAcid ? acidDissociation(x as Acid) : baseDissociation(x as Base);
  const f = toSubscript(x.formula);
  const ionOther = isAcid ? (x as Acid) : null;
  const wrongs = isAcid && ionOther
    ? [
      dis(right.replace("H⁺", "OH⁻"), "Säuren geben **H⁺** ab, nicht OH⁻. OH⁻ kommt aus Laugen."),
      ionOther.protons > 1 ? dis(right.replace(`${ionOther.protons} H⁺`, "H⁺"), `${x.name} hat ${ionOther.protons} abgebbare H – es entstehen **${ionOther.protons} H⁺**.`) : dis(right.replace("H⁺", "2 H⁺"), `${x.name} hat nur **1** abgebbares H.`),
      dis(`${f} → ${f}`, "In Wasser **zerfällt** die Säure in Ionen – nur so leitet die Lösung Strom und reagiert sauer."),
    ]
    : [
      dis(right.replace("OH⁻", "H⁺"), "Laugen enthalten **OH⁻** (Hydroxid-Ionen), nicht H⁺. H⁺ kommt aus Säuren."),
      (x as Base).hydroxides > 1 ? dis(right.replace(`${(x as Base).hydroxides} OH⁻`, "OH⁻"), `${f} enthält **${(x as Base).hydroxides} OH⁻** je Formeleinheit.`) : dis(right.replace("OH⁻", "2 OH⁻"), `${f} enthält nur **1** OH⁻.`),
      dis(`${f} → ${f}`, "In Wasser **zerfällt** die Lauge in Ionen – Metall-Ion und Hydroxid-Ionen."),
    ];
  return {
    ...mc(right, wrongs),
    prompt: `Was passiert, wenn **${x.name}** (${f}) in Wasser gelöst wird?`,
    hint: isAcid ? "Säuren geben H⁺ ab; der Rest ist der Säurerest (negativ)." : "Laugen zerfallen in Metall-Ion und Hydroxid-Ionen OH⁻.",
    explain: `**${right}**${isAcid ? " – das H⁺ macht die Lösung sauer." : " – das OH⁻ macht die Lösung basisch."}`,
  };
}

/** Formeln und Namen: Säure oder Lauge? Welche Formel? Wie heißt …? */
function formel(): Task {
  const mode = pick(["art", "formel", "name"]);
  const isAcid = Math.random() < 0.6;
  const x: Acid | Base = isAcid ? pick(ACIDS) : pick(BASES);
  const f = toSubscript(x.formula);
  if (mode === "art") {
    return {
      ...mc(isAcid ? "Säure" : "Lauge", [
        dis(isAcid ? "Lauge" : "Säure", isAcid ? `${f} beginnt mit **H** – dieses H gibt sie als H⁺ ab → Säure.` : `${f} enthält **OH** – Hydroxid-Ionen → Lauge.`),
        dis("Salz", "Salze bestehen aus Metall-Ion und Säurerest (NaCl, CaSO₄) – ohne abgebbares H und ohne OH."),
        dis("weder noch", isAcid ? `${f} gibt in Wasser H⁺ ab – das ist genau das Kennzeichen einer Säure.` : `${f} enthält OH⁻ – das ist genau das Kennzeichen einer Lauge.`),
      ]),
      prompt: `Ist **${f}** eine Säure oder eine Lauge?`,
      hint: "Säuren beginnen mit H (HCl, H₂SO₄ …), Laugen enden auf OH (NaOH, Ca(OH)₂).",
      explain: `${f} = **${x.name}** → **${isAcid ? "Säure" : "Lauge"}** (${isAcid ? acidDissociation(x as Acid) : baseDissociation(x as Base)}).`,
    };
  }
  if (mode === "formel") {
    const others = (isAcid ? ACIDS : BASES).filter(y => y.id !== x.id).map(y => toSubscript(y.formula));
    return {
      ...mc(f, [...others, ...(isAcid ? BASES : ACIDS).slice(0, 2).map(y => dis(toSubscript(y.formula), `${toSubscript(y.formula)} ist ${y.name} – eine ${isAcid ? "Lauge (OH)" : "Säure (H vorne)"}.`))]),
      prompt: `Welche Formel hat **${x.name}**?`,
      hint: isAcid ? "Säureformeln beginnen mit H." : "Laugen: Metall + OH.",
      explain: `${x.name} = **${f}**.`,
    };
  }
  const others = (isAcid ? ACIDS : BASES).filter(y => y.id !== x.id).map(y => y.name);
  return {
    ...mc(x.name, [...others, ...(isAcid ? BASES : ACIDS).slice(0, 2).map(y => dis(y.name, `${y.name} ist ${toSubscript(y.formula)} – eine ${isAcid ? "Lauge" : "Säure"}.`))]),
    prompt: `Wie heißt **${f}**?`,
    hint: isAcid ? "Der Säurerest verrät den Namen: Cl → Salz-, SO₄ → Schwefel-, NO₃ → Salpeter-, CO₃ → Kohlen-, PO₄ → Phosphor-." : "Natronlauge = Natrium…, Kalilauge = Kalium…, Kalkwasser = Calcium…",
    explain: `${f} = **${x.name}**.`,
  };
}

/** Neutralisation: Salzname, Salzformel, Zahl der Wassermoleküle */
function neutralisation(): Task {
  const a = pick(ACIDS), b = pick(BASES);
  const n = neutralize(a, b);
  const eq = equationText(n.eq, n.coeffs);
  const mode = pick(["name", "formel", "wasser", "allgemein"]);
  if (mode === "allgemein") {
    return {
      ...mc("Salz + Wasser", [
        dis("nur Wasser", "H⁺ und OH⁻ werden zu Wasser – aber Metall-Ion und Säurerest bleiben als **Salz** übrig."),
        dis("Salz + Wasserstoff", "Wasserstoff-Gas entsteht, wenn **Metall** + Säure reagiert. Säure + Lauge gibt Wasser."),
        dis("eine stärkere Säure", "Säure und Lauge heben sich auf: H⁺ + OH⁻ → H₂O. Die Lösung wird **neutral**."),
      ]),
      prompt: "Was entsteht, wenn eine **Säure** mit einer **Lauge** reagiert (Neutralisation)?",
      hint: "H⁺ trifft OH⁻ – was gibt das? Und was bleibt von Säurerest und Metall-Ion übrig?",
      explain: `Säure + Lauge → **Salz + Wasser**. Beispiel: ${eq}.`,
    };
  }
  if (mode === "wasser") {
    return {
      kind: "num", answer: n.water, eq: equationText(n.eq, n.coeffs.map((c, i) => (i === 3 ? null : c))),
      prompt: `Wie viele **Wassermoleküle** entstehen? (Zahl vor H₂O)`,
      hint: `Jedes H⁺ trifft ein OH⁻: ${n.coeffs[0] === 1 ? "" : n.coeffs[0] + " · "}${a.protons} H⁺ und ${n.coeffs[1] === 1 ? "" : n.coeffs[1] + " · "}${b.hydroxides} OH⁻.`,
      explain: `${n.coeffs[0] * a.protons} H⁺ + ${n.coeffs[1] * b.hydroxides} OH⁻ → **${n.water}** H₂O: ${eq}.`,
      praise: "H⁺ und OH⁻ gezählt – genau so geht's.",
    };
  }
  const words = `${a.name} + ${b.name} → ? + Wasser`;
  if (mode === "formel") {
    const wrongs = [
      ...BASES.filter(y => y.id !== b.id).map(y => dis(toSubscript(neutralize(a, y).salt), `Das Metall-Ion kommt aus der **Lauge** – hier ${b.name} (${toSubscript(b.formula)}).`)),
      ...ACIDS.filter(y => y.id !== a.id).map(y => dis(toSubscript(neutralize(y, b).salt), `Der Säurerest kommt aus der **Säure** (${a.name}).`)),
    ];
    return {
      ...mc(toSubscript(n.salt), wrongs),
      prompt: `**${words}** – welche Formel hat das Salz?`,
      hint: `Metall-Ion aus der Lauge (${toSubscript(b.formula)}) + Säurerest aus der Säure (${toSubscript(a.formula)}), Ladungen ausgleichen.`,
      explain: `Salz = Metall-Ion + Säurerest → **${toSubscript(n.salt)}** (${n.saltName}): ${eq}.`,
    };
  }
  const wrongs = [
    ...BASES.filter(y => y.id !== b.id).map(y => dis(neutralize(a, y).saltName, `Das Metall im Salz kommt aus der **Lauge** – hier ${b.name}.`)),
    ...ACIDS.filter(y => y.id !== a.id).map(y => dis(neutralize(y, b).saltName, `Der Säurerest im Salz kommt aus der **Säure** – hier ${a.name} (${toSubscript(a.formula)}).`)),
  ];
  return {
    ...mc(n.saltName, wrongs),
    prompt: `**${words}** – wie heißt das Salz?`,
    hint: "Metall aus der Lauge + Säurerest aus der Säure: Salzsäure → -chlorid, Schwefelsäure → -sulfat, Salpetersäure → -nitrat, Kohlensäure → -carbonat, Phosphorsäure → -phosphat, Essigsäure → -acetat.",
    explain: `**${n.saltName}**: ${eq}.`,
  };
}

/** Verdünnen: pH rückt Richtung 7 */
function verduennen(): Task {
  if (Math.random() < 0.5) {
    const acid = Math.random() < 0.5;
    return {
      ...mc(acid ? "Er steigt Richtung 7" : "Er sinkt Richtung 7", [
        dis(acid ? "Er sinkt" : "Er steigt", acid ? "Verdünnen macht die Säure **schwächer** – weniger H⁺ pro Liter → der pH-Wert wird **größer**." : "Verdünnen macht die Lauge **schwächer** – weniger OH⁻ pro Liter → der pH-Wert wird **kleiner**."),
        dis("Er bleibt gleich", "Wasser verdünnt die Ionen – pro Liter sind weniger H⁺ bzw. OH⁻ da, der pH-Wert ändert sich."),
        dis("Er wird sofort 7", "Verdünnen rückt den pH nur **Richtung** 7 – ganz neutral wird es nur mit sehr viel Wasser oder durch Neutralisation."),
      ]),
      prompt: `Zu einer **${acid ? "Säure" : "Lauge"}** gießt man viel Wasser. Was passiert mit dem **pH-Wert**?`,
      hint: "Weniger Ionen pro Liter = näher am neutralen Wasser.",
      explain: acid ? "Verdünnen: weniger H⁺ pro Liter → pH **steigt** Richtung 7 (bleibt aber unter 7)." : "Verdünnen: weniger OH⁻ pro Liter → pH **sinkt** Richtung 7 (bleibt aber über 7).",
    };
  }
  const ph = pick([1, 2, 3, 4, 10, 11, 12, 13]);
  const steps = pick([1, 1, 2]);
  const after = dilute(ph, steps);
  return {
    kind: "num", answer: after, ph,
    prompt: `Eine Lösung hat **pH ${ph}**. Man verdünnt sie mit der **${steps === 1 ? "10-fachen" : "100-fachen"}** Menge Wasser. Welchen pH-Wert hat sie etwa danach?`,
    hint: `10-mal so viel Wasser = ein Schritt Richtung 7${steps === 2 ? ", 100-mal = zwei Schritte" : ""}.`,
    explain: `pH ${ph} → ${steps} Schritt${steps > 1 ? "e" : ""} Richtung 7 → **pH ${after}**.`,
    praise: "Schritte Richtung 7 gezählt – genau so geht's.",
  };
}

// ── Level und Runden ────────────────────────────────────────────────────────

const GENS: Record<string, () => Task> = { klasse, stoff, indikator, teilchen, formel, neutralisation, verduennen };

export const TYPE_NAMES: Record<string, string> = {
  klasse: "pH-Wert einordnen", stoff: "Alltagsstoffe", indikator: "Indikatoren", teilchen: "H⁺ und OH⁻",
  formel: "Säuren und Laugen erkennen", neutralisation: "Neutralisation", verduennen: "Verdünnen",
};

interface Level extends QuizLevel { types: string[] }
export const LEVELS: Level[] = [
  { id: "us-1", name: "pH-Wert", desc: "Sauer, neutral, basisch – Skala, Alltagsstoffe, Indikatoren", types: ["klasse", "stoff", "indikator"] },
  { id: "us-2", name: "Säuren und Laugen", desc: "H⁺ und OH⁻, Formeln und Namen, Verdünnen", types: ["teilchen", "formel", "verduennen"] },
  { id: "us-3", name: "Neutralisation", desc: "Säure + Lauge → Salz + Wasser", types: ["neutralisation", "formel", "teilchen"] },
];

export const levelId = (_stufe: string, level: LevelKey) => (typeof level === "number" ? LEVELS[level].id : `us-${level}`);
export const levelName = (_stufe: string, level: LevelKey) =>
  level === "mix" ? "Alles gemischt" : level === "weak" ? "Schwächen üben" : level === "due" ? "Heute fällig" : LEVELS[level].name;

export function makeRound(_stufe: string, level: LevelKey, stats?: TypeStats, due: string[] = []): Task[] {
  let ids = level === "mix" ? [...new Set(LEVELS.flatMap(l => l.types))]
    : level === "weak" ? weakTypes(stats, id => LEVELS.some(l => l.types.includes(id)))
    : level === "due" ? due.filter(id => LEVELS.some(l => l.types.includes(id)))
    : LEVELS[level].types;
  if (!ids.length) ids = LEVELS[0].types;
  return buildRound(ids, GENS, 10);
}

/** nur für Tests */
export const GENERATORS = GENS;
