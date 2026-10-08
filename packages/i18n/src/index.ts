// Sprache der Oberfläche: Deutsch oder Englisch. Beim ersten Start aus der Gerätesprache (navigator.languages:
// Deutsch, wenn eine der bevorzugten Sprachen Deutsch ist, sonst Englisch); danach die Wahl über den Knopf DE/EN
// (gespeichert in localStorage "lern-sprache"). Texte im Code als Paar: tr("Deutsch", "English") – auch in festen Daten
// (Konstanten beim Laden): ein Wechsel lädt die Seite neu, gespeicherte Stände bleiben. Tests (ohne Browser) laufen auf Deutsch.

export type Lang = "de" | "en";
const KEY = "lern-sprache";
const listeners = new Set<() => void>();

/** Sprache aus der Liste bevorzugter Sprachen des Geräts (erste passende; sonst Englisch) */
export function detectLang(prefs: readonly string[]): Lang {
  for (const p of prefs) {
    const l = p.toLowerCase();
    if (l.startsWith("de")) return "de";
    if (l.startsWith("en")) return "en";
  }
  return "en";
}

function initial(): Lang {
  try {
    const s = localStorage.getItem(KEY);
    if (s === "de" || s === "en") return s;
  } catch { /* egal */ }
  if (typeof document === "undefined" || typeof navigator === "undefined") return "de";
  return detectLang(navigator.languages?.length ? navigator.languages : [navigator.language ?? ""]);
}

let lang: Lang = initial();

function apply() {
  if (typeof document !== "undefined") document.documentElement.lang = lang;
}

export const getLang = (): Lang => lang;

/** Sprache wählen; `reload` (Standard): Seite neu laden, damit auch feste Texte der Module neu entstehen */
export function setLang(l: Lang, reload = true) {
  lang = l;
  try { localStorage.setItem(KEY, l); } catch { /* egal */ }
  apply();
  listeners.forEach(f => f());
  if (reload && typeof location !== "undefined") location.reload();
}

/** bei Wechsel benachrichtigen (für React: useLang in @lern/ui) */
export function onLang(cb: () => void): () => void {
  listeners.add(cb);
  return () => { listeners.delete(cb); };
}

/** Text in der aktuellen Sprache */
export const tr = <T,>(de: T, en: T): T => (lang === "en" ? en : de);

/** Zahl im Format der Sprache (Komma bzw. Punkt) */
export const num = (s: string | number) => (lang === "en" ? String(s).replace(",", ".") : String(s).replace(".", ","));

/**
 * Eingetippte Zahl lesen (NaN, wenn es keine ist) – Trennzeichen wie in der Sprache der Oberfläche, gleiche Regel wie `parseAnswer` in @lern/units:
 * Deutsch „.“ = Tausenderpunkt, „,“ = Dezimalkomma („1.000“ = 1000, nie 1); Englisch umgekehrt („1,000“ = 1000, „1.5“ = 1,5);
 * Leerzeichen-Gruppen („10 000“) gehen immer. Eindeutige andere Schreibweisen gelten weiter („0.5“, „1.250,5“, „0,25“).
 */
export function readNumber(input: string, l: Lang = lang): number {
  let s = input.trim().replace(/[\s   ']/g, "").replace(/[−–]/g, "-");
  // Tausender-Gruppen der Sprache: erste Gruppe 1–3 Ziffern ohne führende 0, dann je genau drei Ziffern
  const groups = (sep: string, dec: string) => new RegExp(`^-?[1-9]\\d{0,2}(\\${sep}\\d{3})+(\\${dec}\\d*)?$`);
  if (l === "en") { if (groups(",", ".").test(s)) s = s.replace(/,/g, ""); }
  else if (groups(".", ",").test(s)) s = s.replace(/\./g, "");
  // Tausenderpunkte in eindeutiger Form (mehrere Punkte oder Punkt und Komma): 40.000.000, 1.250,5
  if (/^-?\d{1,3}(\.\d{3})+(,\d*)?$/.test(s) && (/\..*\./.test(s) || s.includes(","))) s = s.replace(/\./g, "");
  s = s.replace(",", ".");
  return /^-?(\d+\.?\d*|\.\d+)$/.test(s) ? Number(s) : NaN;
}

apply();

/** Eigennamen und Wörter, die im Englischen auch mitten im Satz groß bleiben */
const KEEP_CAPS = new Set(["Bohr", "Hund", "Pauli", "Lewis", "Aufbau", "Avogadro", "Celsius", "Kelvin", "Fahrenheit", "English", "German",
  "Roman", "Latin", "Greek", "Hill", "Edi", "Newton", "Joule", "Watt", "Pascal", "Ziegler"]);
/**
 * Englische Schreibweise: Namen mitten im Satz klein („Tap **argon**“, „formula of **sodium nitride**“) – die Daten schreiben
 * Element- und Stoffnamen groß wie im Deutschen. Satzanfänge, Eigennamen, Abkürzungen und Elementsymbole bleiben unverändert.
 */
export function midCase(s: string): string {
  // ohne Lookbehind (ältere Safari-Versionen kennen ihn nicht): das Wort davor wird mitgenommen und unverändert zurückgegeben
  return s.replace(/((?:[a-z→=]|[a-z0-9)][,;:]) (?:\*\*)?)([A-Z][a-z]{2,})(?![A-Za-z])/g, (_, pre: string, w: string) => pre + (KEEP_CAPS.has(w) ? w : w.toLowerCase()));
}

/** englischer unbestimmter Artikel vor einem Wort: „an oxygen atom“, „a carbon atom“, „an octet“, „a duet“ */
export const article = (word: string) => (/^(?:[aeio]|u(?!ni|s[eu]|r[ae]))/i.test(word.replace(/^\*+/, "")) ? "an" : "a");
