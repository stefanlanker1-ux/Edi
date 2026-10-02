import { getLang, tr } from "@lern/i18n";
// Exakte Bruchzahlen (BigInt) – damit 0,1 · 100 genau 10 ergibt und 1 : 3,6 als Bruch erhalten bleibt.
// Anzeige immer deutsch: Dezimalkomma, Tausender mit schmalem Leerzeichen (10 000), 4-stellige Zahlen ohne (3450).

export interface Q { n: bigint; d: bigint }

const abs = (x: bigint) => (x < 0n ? -x : x);
const gcd = (a: bigint, b: bigint): bigint => { a = abs(a); b = abs(b); while (b) [a, b] = [b, a % b]; return a || 1n; };

export function q(n: bigint | number, d: bigint | number = 1n): Q {
  let N = BigInt(n), D = BigInt(d);
  if (D === 0n) throw new Error("Division durch 0");
  if (D < 0n) { N = -N; D = -D; }
  const g = gcd(N, D);
  return { n: N / g, d: D / g };
}
export const ZERO = q(0), ONE = q(1);
export const mul = (a: Q, b: Q) => q(a.n * b.n, a.d * b.d);
export const div = (a: Q, b: Q) => q(a.n * b.d, a.d * b.n);
export const add = (a: Q, b: Q) => q(a.n * b.d + b.n * a.d, a.d * b.d);
export const sub = (a: Q, b: Q) => q(a.n * b.d - b.n * a.d, a.d * b.d);
export const inv = (a: Q) => q(a.d, a.n);
export const eq = (a: Q, b: Q) => a.n === b.n && a.d === b.d;
export const cmp = (a: Q, b: Q) => { const x = a.n * b.d - b.n * a.d; return x < 0n ? -1 : x > 0n ? 1 : 0; };
export const isInt = (a: Q) => a.d === 1n;
export function pow(a: Q, e: number): Q {
  let r = ONE;
  for (let i = 0; i < Math.abs(e); i++) r = mul(r, a);
  return e < 0 ? inv(r) : r;
}
/** 10^k als Bruch */
export const pow10 = (k: number) => (k >= 0 ? q(10n ** BigInt(k)) : q(1n, 10n ** BigInt(-k)));
export const toNumber = (a: Q) => Number(a.n) / Number(a.d);

/** Ist a eine Zehnerpotenz? Liefert den Exponenten k (a = 10^k), sonst null */
export function log10Exact(a: Q): number | null {
  if (a.n <= 0n) return null;
  const isP = (x: bigint) => { let k = 0; while (x > 1n && x % 10n === 0n) { x /= 10n; k++; } return x === 1n ? k : null; };
  if (a.d === 1n) return isP(a.n);
  if (a.n === 1n) { const k = isP(a.d); return k === null ? null : -k; }
  return null;
}

/** Endet die Dezimaldarstellung? (Nenner nur aus 2 und 5) */
export function isTerminating(a: Q): boolean {
  let d = a.d;
  while (d % 2n === 0n) d /= 2n;
  while (d % 5n === 0n) d /= 5n;
  return d === 1n;
}

/**
 * Zahl aus Schülereingabe oder Daten: "0,1", "1.5", "10 000", "-3,45", "1,4·10^-4", "1,4 · 10⁻⁴", "2e3", "3/4".
 * Gibt null zurück, wenn die Eingabe keine Zahl ist.
 */
export function parseQ(input: string): Q | null {
  const SUP: Record<string, string> = { "⁰": "0", "¹": "1", "²": "2", "³": "3", "⁴": "4", "⁵": "5", "⁶": "6", "⁷": "7", "⁸": "8", "⁹": "9", "⁻": "-", "⁺": "" };
  let s = input.trim().replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹⁻⁺]+/g, run => "^" + [...run].map(c => SUP[c]).join(""));
  s = s.replace(/[\s  '()]/g, "").replace(/[−–]/g, "-").replace(/[x×*⋅]/g, "·");
  if (!s) return null;
  if (/^-?\d+\/\d+$/.test(s)) { const [a, b] = s.split("/"); return b === "0" ? null : q(BigInt(a), BigInt(b)); }
  // Zehnerpotenz: a·10^k oder aek
  let exp = 0;
  const m = s.match(/^(.*?)(?:·10\^(-?\d+)|e(-?\d+))$/i);
  if (m) { s = m[1]; exp = Number(m[2] ?? m[3]); if (s === "") s = "1"; }
  else if (/^10\^-?\d+$/.test(s)) { return pow10(Number(s.slice(3))); }
  // Tausenderpunkte (übliche Schreibweise): 40.000.000 oder 1.250,5 (mehrere Punkte bzw. Punkt und Komma)
  if (/^-?\d{1,3}(\.\d{3})+(,\d*)?$/.test(s) && (/\..*\./.test(s) || s.includes(","))) s = s.replace(/\./g, "");
  s = s.replace(",", ".");
  if (!/^-?(\d+\.?\d*|\.\d+)$/.test(s)) return null;
  const neg = s.startsWith("-");
  if (neg) s = s.slice(1);
  const [ip, fp = ""] = s.split(".");
  const v = q(BigInt((ip || "0") + fp), 10n ** BigInt(fp.length));
  const r = mul(v, pow10(exp));
  return neg ? q(-r.n, r.d) : r;
}

/**
 * Mögliche Werte einer Schülereingabe: die Einheit darf dahinter stehen („0,06 m“), und „48.000“ ist mehrdeutig
 * (Dezimalpunkt oder Tausenderpunkt) – dann zählen beide Lesarten.
 */
export function parseAnswer(input: string, unit?: string): Q[] {
  let s = input.trim();
  if (unit) {
    const esc = unit.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&");
    s = s.replace(new RegExp(`\\s*${esc}\\s*$`), "").trim();
  }
  const out: Q[] = [];
  const v = parseQ(s);
  if (v) out.push(v);
  if (/^-?\d{1,3}\.\d{3}$/.test(s)) { const t = parseQ(s.replace(".", "")); if (t) out.push(t); }
  // Englisch: „48,000“ kann Tausenderkomma sein
  if (getLang() === "en" && /^-?\d{1,3}(,\d{3})+$/.test(s)) { const t = parseQ(s.replace(/,/g, "")); if (t) out.push(t); }
  return out;
}

/** Gruppiert Ziffern in Dreiergruppen (ab 5 Stellen), z. B. 10 000, 3450 */
function groupInt(digits: string): string {
  if (digits.length <= 4) return digits;
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}
/** Nachkommastellen ab 5 Stellen in Dreiergruppen: 0,000 01 */
function groupFrac(digits: string): string {
  if (digits.length <= 4) return digits;
  return digits.replace(/(\d{3})(?=\d)/g, "$1 ");
}

/** Exakte Dezimaldarstellung (nur wenn endlich) */
function exactDecimal(a: Q): { int: string; frac: string; neg: boolean } {
  const neg = a.n < 0n;
  let n = abs(a.n), d = a.d, k = 0;
  // auf Zehnerpotenz im Nenner erweitern
  while (10n ** BigInt(k) % d !== 0n) k++;
  n = n * (10n ** BigInt(k) / d);
  const s = n.toString().padStart(k + 1, "0");
  return { int: s.slice(0, s.length - k), frac: s.slice(s.length - k).replace(/0+$/, ""), neg };
}

export interface FormatOptions {
  /** Nachkommastellen beim Runden nicht endender Zahlen (Standard 4) */
  digits?: number;
  /** Tausender-Gruppierung (Standard true) */
  group?: boolean;
}

/** Deutsche Schreibweise. Nicht endende Dezimalzahlen werden gerundet (approx = true). */
export function fmt(a: Q, opts: FormatOptions = {}): { text: string; approx: boolean } {
  const group = opts.group ?? true;
  let approx = false, parts: { int: string; frac: string; neg: boolean };
  if (isTerminating(a)) parts = exactDecimal(a);
  else {
    approx = true;
    const digits = opts.digits ?? 4;
    // signifikante Stellen bei sehr kleinen Zahlen erhalten
    const mag = Math.floor(Math.log10(Math.abs(toNumber(a)) || 1));
    const dd = mag < 0 ? Math.max(digits, -mag + 2) : digits;
    const scaled = a.n * 10n ** BigInt(dd);
    let r = scaled / a.d;
    const rem = abs(scaled % a.d) * 2n;
    if (rem >= a.d) r += a.n < 0n ? -1n : 1n;
    parts = exactDecimal(q(r, 10n ** BigInt(dd)));
  }
  const intS = group ? groupInt(parts.int) : parts.int;
  const fracS = group ? groupFrac(parts.frac) : parts.frac;
  return { text: (parts.neg ? "−" : "") + intS + (fracS ? tr(",", ".") + fracS : ""), approx };
}
/** Kurzform: Text mit „≈“-Präfix bei gerundeten Werten wird vom Aufrufer gesetzt */
export const fmtText = (a: Q, opts?: FormatOptions) => fmt(a, opts).text;

const SUPD: Record<string, string> = { "-": "⁻", 0: "⁰", 1: "¹", 2: "²", 3: "³", 4: "⁴", 5: "⁵", 6: "⁶", 7: "⁷", 8: "⁸", 9: "⁹" };
export const supNum = (k: number) => String(k).split("").map(c => SUPD[c] ?? c).join("");

/** Wissenschaftliche Schreibweise a · 10^k mit 1 ≤ a < 10, z. B. „1,4 · 10⁻⁴“ */
export function fmtSci(a: Q, digits = 4): string {
  if (a.n === 0n) return "0";
  const x = Math.abs(toNumber(a));
  let k = Math.floor(Math.log10(x));
  let m = div(a, pow10(k));
  if (cmp(q(abs(m.n), m.d), q(10)) >= 0) { k++; m = div(a, pow10(k)); }
  if (cmp(q(abs(m.n), m.d), ONE) < 0) { k--; m = div(a, pow10(k)); }
  const f = fmt(m, { digits, group: false });
  return `${f.text} · 10${supNum(k)}`;
}
