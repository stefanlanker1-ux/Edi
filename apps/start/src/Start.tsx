// Startseite: Übersicht aller Lern-Apps.

import type { ReactNode } from "react";
import { Icon } from "@lern/ui";
import { Bohr } from "@lern/chem-ui";

interface AppCard { href: string; name: string; desc: string; art: ReactNode; offline: string }

const APPS: AppCard[] = [
  {
    href: "reinstoffe/", name: "Reinstoffe und Gemische", offline: "reinstoffe/reinstoffe-offline.html",
    desc: "Stoffe mischen, schütteln, trennen und erhitzen – im Becherglas und im Teilchenmodell: homogen oder heterogen, Phasen, Elemente, Verbindungen.",
    art: (
      <svg className="art-mix" viewBox="0 0 300 130" aria-hidden="true">
        {/* Becherglas mit Öl über Wasser und Sand als Bodensatz, daneben die Lupe mit Teilchen */}
        <rect x="42" y="44" width="76" height="24" style={{ fill: "var(--hue-yellow)" }} />
        <rect x="42" y="68" width="76" height="36" style={{ fill: "var(--hue-blue-light)" }} />
        <rect x="42" y="104" width="76" height="12" fill="#dcc79d" />
        <path d="M34 14l8 6v92a6 6 0 0 0 6 6h64a6 6 0 0 0 6-6V20l9-9" fill="none" stroke="#111111" strokeWidth="3" strokeLinejoin="round" />
        <circle cx="222" cy="65" r="52" fill="#ffffff" stroke="#111111" strokeWidth="3" />
        {[[196, 44], [222, 36], [248, 48], [206, 70], [236, 72], [222, 96], [196, 92], [250, 94]].map(([x, y], i) => (
          <g key={i}>
            <circle cx={x} cy={y} r="7" style={{ fill: "var(--hue-red)" }} stroke="#111111" strokeWidth="1" />
            <circle cx={x - 7} cy={y + 5} r="4.5" fill="#f5f4f0" stroke="#111111" strokeWidth="1" />
            <circle cx={x + 7} cy={y + 5} r="4.5" fill="#f5f4f0" stroke="#111111" strokeWidth="1" />
          </g>
        ))}
        <path d="M118 65h44" stroke="#111111" strokeWidth="2" strokeDasharray="4 3" />
      </svg>
    ),
  },
  {
    href: "atombau/", name: "Atombau", offline: "atombau/atombau-offline.html",
    desc: "Atome aus Protonen, Neutronen und Elektronen bauen, das Periodensystem entdecken und im Quiz üben.",
    art: <div className="art-bohr"><Bohr Z={6} N={6} E={6} labels={false} /></div>,
  },
  {
    href: "ionenbindung/", name: "Ionenbindung", offline: "ionenbindung/ionenbindung-offline.html",
    desc: "Ionenformeln mit Bausteinen aufstellen: Ladungen ausgleichen, vom Atom zum Ion, Namen von Salzen.",
    art: (
      <div className="art-tiles" aria-hidden="true">
        <span className="tile c"><span>Ca<sup>2+</sup></span></span>
        <span className="tile a"><span>Cl<sup>−</sup></span></span><span className="tile a"><span>Cl<sup>−</sup></span></span>
      </div>
    ),
  },
  {
    href: "elektronenpaarbindung/", name: "Elektronenpaarbindung", offline: "elektronenpaarbindung/elektronenpaarbindung-offline.html",
    desc: "Moleküle per Drag & Drop aus Lewis-Atomen bauen: gemeinsame Elektronenpaare, Oktettregel, Valenzstrichformel.",
    art: (
      <svg className="art-lewis" viewBox="0 0 320 170" aria-hidden="true">
        {/* Wasser gewinkelt (104,5°) – nie linear zeichnen */}
        <rect x="28.3" y="73.1" width="170" height="54" rx="27" transform="rotate(142.2 113.3 100.1)" fill="#e9eef3" stroke="#a9b3bd" strokeWidth="3" />
        <rect x="121.7" y="73.1" width="170" height="54" rx="27" transform="rotate(37.8 206.7 100.1)" fill="#e9eef3" stroke="#a9b3bd" strokeWidth="3" />
        <circle cx="160" cy="64" r="30" fill="#e9eef3" />
        <circle cx="160" cy="64" r="56" fill="none" style={{ stroke: "var(--hue-red)" }} strokeWidth="4" />
        <text x="160" y="78" fontSize="40" fontWeight="800" textAnchor="middle" fill="#25271f">O</text>
        <text x="66.7" y="150.2" fontSize="40" fontWeight="800" textAnchor="middle" fill="#25271f">H</text>
        <text x="253.3" y="150.2" fontSize="40" fontWeight="800" textAnchor="middle" fill="#25271f">H</text>
        <circle cx="120.3" cy="84.6" r="6" style={{ fill: "var(--hue-blue)" }} /><circle cx="130.1" cy="97.3" r="6" style={{ fill: "var(--hue-blue)" }} />
        <circle cx="189.9" cy="97.3" r="6" style={{ fill: "var(--hue-blue)" }} /><circle cx="199.7" cy="84.6" r="6" style={{ fill: "var(--hue-blue)" }} />
        <circle cx="136.4" cy="35.6" r="6" style={{ fill: "var(--hue-blue)" }} /><circle cx="126.6" cy="48.3" r="6" style={{ fill: "var(--hue-blue)" }} />
        <circle cx="193.4" cy="48.3" r="6" style={{ fill: "var(--hue-blue)" }} /><circle cx="183.6" cy="35.6" r="6" style={{ fill: "var(--hue-blue)" }} />
      </svg>
    ),
  },
  {
    href: "reaktionsgleichungen/", name: "Reaktions\u00ADgleichungen", offline: "reaktionsgleichungen/reaktionsgleichungen-offline.html",
    desc: "Gleichungen ausgleichen mit der Atombilanz: Kästchen je Atom links und rechts, Koeffizienten setzen, bis jedes Element ✓ zeigt.",
    art: (
      <svg className="art-balance" viewBox="0 0 300 130" aria-hidden="true">
        {/* Atombilanz 2 H₂ + O₂ → 2 H₂O: H 4 | 4, O 2 | 2 */}
        <text x="24" y="52" fontSize="26" fontWeight="800" fill="#111111">H</text>
        {[0, 1, 2, 3].map(i => <rect key={i} x={60 + i * 22} y={32} width="18" height="18" rx="2" fill="#111111" />)}
        <text x="160" y="50" fontSize="24" fontWeight="800" textAnchor="middle" fill="#1a7f37">✓</text>
        {[0, 1, 2, 3].map(i => <rect key={i} x={182 + i * 22} y={32} width="18" height="18" rx="2" fill="#ffffff" stroke="#111111" strokeWidth="2" />)}
        <text x="24" y="96" fontSize="26" fontWeight="800" fill="#111111">O</text>
        {[0, 1].map(i => <rect key={i} x={104 + i * 22} y={76} width="18" height="18" rx="2" fill="#111111" />)}
        <text x="160" y="94" fontSize="24" fontWeight="800" textAnchor="middle" fill="#1a7f37">✓</text>
        {[0, 1].map(i => <rect key={i} x={182 + i * 22} y={76} width="18" height="18" rx="2" fill="#ffffff" stroke="#111111" strokeWidth="2" />)}
        <text x="150" y="124" fontSize="14" textAnchor="middle" fill="#e30613" fontWeight="800">2 H₂ + O₂ → 2 H₂O</text>
      </svg>
    ),
  },
  {
    href: "saeuren-basen/", name: "Säuren und Basen", offline: "saeuren-basen/saeuren-basen-offline.html",
    desc: "pH-Skala mit Indikatorfarben ausprobieren, Alltagsstoffe einordnen, Säuren und Laugen erkennen, Neutralisation im Quiz üben.",
    art: (
      <svg className="art-ph" viewBox="0 0 300 130" aria-hidden="true">
        {/* pH-Skala 0–14 mit Universalindikator-Farben, Markierung bei 3 */}
        {["#d7263d", "#d7263d", "#d7263d", "#ef7d1a", "#ef7d1a", "#f2c500", "#a9c93a", "#3aa655", "#3aa655", "#2a9d8f", "#2f6fd6", "#2f6fd6", "#7b3fbf", "#7b3fbf", "#7b3fbf"].map((c, i) => (
          <rect key={i} x={12 + i * 18.5} y={50} width="16" height="30" rx="2" fill={c} stroke={i === 3 ? "#111111" : "none"} strokeWidth="3" />
        ))}
        <text x="20" y="38" fontSize="16" fontWeight="800" fill="#111111">sauer</text>
        <text x="150" y="38" fontSize="16" fontWeight="800" textAnchor="middle" fill="#111111">neutral</text>
        <text x="280" y="38" fontSize="16" fontWeight="800" textAnchor="end" fill="#111111">basisch</text>
        <text x="75.5" y="110" fontSize="22" fontWeight="800" textAnchor="middle" fill="#e30613">pH 3</text>
      </svg>
    ),
  },
  {
    href: "neutralisation/", name: "Neutralisation", offline: "neutralisation/neutralisation-offline.html",
    desc: "Lauge + Säure → Salz + Wasser mit Ionen-Bausteinen: jedes H⁺ trifft ein OH⁻, der Rest ist das Salz – mit allen Säuren der Tabelle.",
    art: (
      <svg className="art-neut" viewBox="0 0 300 130" aria-hidden="true">
        {/* Ba(OH)₂ + H₂SO₄: Ba²⁺ mit 2 OH⁻, darunter 2 H⁺ mit SO₄²⁻ → BaSO₄ + 2 H₂O */}
        <rect x="20" y="8" width="120" height="26" rx="3" style={{ fill: "var(--hue-yellow)" }} stroke="#111111" strokeWidth="2" />
        <text x="80" y="27" fontSize="16" fontWeight="800" textAnchor="middle" fill="#111111">Ba²⁺</text>
        {[0, 1].map(i => <g key={`o${i}`}><rect x={20 + i * 62} y="38" width="58" height="22" rx="3" style={{ fill: "var(--hue-blue-light)" }} stroke="#111111" strokeWidth="2" /><text x={49 + i * 62} y="54" fontSize="14" fontWeight="800" textAnchor="middle" fill="#111111">OH⁻</text></g>)}
        {[0, 1].map(i => <g key={`h${i}`}><rect x={20 + i * 62} y="70" width="58" height="22" rx="3" style={{ fill: "var(--hue-blue-light)" }} stroke="#111111" strokeWidth="2" strokeDasharray="4 3" /><text x={49 + i * 62} y="86" fontSize="14" fontWeight="800" textAnchor="middle" fill="#111111">H⁺</text></g>)}
        <rect x="20" y="96" width="120" height="26" rx="3" style={{ fill: "var(--hue-green)" }} stroke="#111111" strokeWidth="2" />
        <text x="80" y="115" fontSize="16" fontWeight="800" textAnchor="middle" fill="#111111">SO₄²⁻</text>
        <path d="M158 65h30m-10-9 10 9-10 9" stroke="#111111" strokeWidth="3" fill="none" />
        <text x="244" y="58" fontSize="20" fontWeight="800" textAnchor="middle" fill="#111111">BaSO₄</text>
        <text x="244" y="86" fontSize="18" fontWeight="800" textAnchor="middle" fill="#e30613">+ 2 H₂O</text>
      </svg>
    ),
  },
  {
    href: "stoffmenge/", name: "Stoffmenge", offline: "stoffmenge/stoffmenge-offline.html",
    desc: "Molare Masse aus dem PSE, n = m / M Schritt für Schritt, Teilchenzahl und Gasvolumen – rechnen und im Quiz üben.",
    art: (
      <svg className="art-mol" viewBox="0 0 340 130" aria-hidden="true">
        <text x="12" y="48" fontSize="25" fontWeight="800" fill="#111111">M(H₂O) = 2 · 1 + 16 = <tspan fill="#e30613">18</tspan></text>
        <text x="12" y="100" fontSize="25" fontWeight="800" fill="#111111">n = 36 g / 18 g/mol = <tspan fill="#e30613">2 mol</tspan></text>
      </svg>
    ),
  },
  {
    href: "einheiten/", name: "Einheiten umrechnen", offline: "einheiten/einheiten-offline.html",
    desc: "Länge, Fläche, Volumen, Masse, Zeit bis km/h, g/cm³ und kWh – immer mit demselben Rechenweg an der Tafel und Stellenwerttafel.",
    art: (
      <svg className="art-ruler" viewBox="0 0 300 130" aria-hidden="true">
        <rect x="20" y="10" width="260" height="34" rx="2" fill="#ffffff" stroke="#111111" strokeWidth="2" />
        <rect x="30" y="10" width="48" height="34" fill="rgba(227,6,19,.14)" />
        {Array.from({ length: 51 }, (_, i) => <line key={i} x1={30 + i * 4.8} x2={30 + i * 4.8} y1={10} y2={i % 10 === 0 ? 26 : i % 5 === 0 ? 21 : 16} stroke="#111111" strokeWidth={i % 10 === 0 ? 1.6 : 0.9} />)}
        {[0, 1, 2, 3, 4, 5].map(i => <text key={i} x={30 + i * 48} y={40} fontSize="10" textAnchor="middle" fill="#111111" fontWeight="700">{i}</text>)}
        <path d="M30 44 L30 74 M78 44 L270 74" stroke="#e30613" strokeWidth="1.5" strokeDasharray="4 3" fill="none" />
        <rect x="20" y="74" width="260" height="34" rx="2" fill="#ffffff" stroke="#111111" strokeWidth="2" />
        {Array.from({ length: 11 }, (_, i) => <line key={i} x1={30 + i * 24} x2={30 + i * 24} y1={74} y2={90} stroke="#111111" strokeWidth="1.4" />)}
        <text x="150" y="126" fontSize="14" textAnchor="middle" fill="#e30613" fontWeight="800">1 cm = 10 mm</text>
      </svg>
    ),
  },
];

// Ein Bildschirm, nie scrollen: Titel, neun Kacheln (2 × 5 am Handy, 3 × 3 breit), eine Zeile für Offline-Dateien.
export function Start() {
  return (
    <div className="start">
      <header className="st-head">
        <p className="st-kicker">Chemie · Einheiten</p>
        <h1>Lern-Apps</h1>
      </header>
      <main className="st-grid">
        {APPS.map((a, i) => (
          <a key={a.href} className="st-card" href={a.href} title={a.desc}>
            <span className="st-num">{String(i + 1).padStart(2, "0")}</span>
            <h2>{a.name.replace("Elektronenpaar", "Elektronen\u00ADpaar\u00AD")}</h2>
            <div className="st-art">{a.art}</div>
            <span className="st-open" aria-hidden="true"><Icon name="arrow" size={20} /></span>
          </a>
        ))}
      </main>
      <footer className="st-foot">
        <p className="st-dl"><b>Offline:</b> {APPS.map((a, i) => <span key={a.href}>{i > 0 && " · "}<a href={a.offline} download>{a.name.split(" ")[0]}</a></span>)}</p>
        {/* schmal: eine Zeile, die Liste klappt nach oben auf (schiebt nichts, scrollt nie) */}
        <details className="st-dl-m">
          <summary><b>Offline-Dateien</b></summary>
          <div className="st-dl-list">{APPS.map(a => <a key={a.href} href={a.offline} download>{a.name.replace("\u00AD", "")}</a>)}</div>
        </details>
        <a className="st-lic" href="lizenzen.txt">Lizenzen</a>
      </footer>
    </div>
  );
}
