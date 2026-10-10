// Vom Atom zum Ion: Bohrmodell des Atoms und des Ions nebeneinander (bei einatomigen Ionen).
// Feste Spalten: Bild, Pfeil und Beschriftung haben eine feste Breite, die Bilder stehen oben gleich auf – nichts rückt, wenn sich ein Text ändert.

import { Icon, Sheet, Tag } from "@lern/ui";
import { Bohr, Nuclide } from "@lern/chem-ui";
import { BY_Z, shells, shellName, electronsText, configuration, sup, signed, standardNeutrons, composition, ionText, chargeSup, type Ion } from "@lern/chem";
import { tr } from "@lern/i18n";

const NOBLE = new Set([2, 10, 18, 36, 54, 86]);

/** `slots`: gleicher Rahmen für Atom und Ion – jede Schale gleich groß, das Kation verliert sichtbar eine Schale */
function AtomBox({ Z, E, title, slots }: { Z: number; E: number; title: string; slots: number }) {
  const N = standardNeutrons(Z);
  return (
    <figure className="ia-box">
      <figcaption>{title}</figcaption>
      <div className="ia-bohr"><Bohr Z={Z} N={N} E={E} slots={slots} labels={false} /></div>
      <Nuclide Z={Z} N={N} E={E} size="md" />
    </figure>
  );
}

/** Schalen von Atom und Ion als Tabelle: je Schale eine Zeile („1. Schale | 2 Elektronen | 2 Elektronen“) – nie als Kette „2 · 8 · 1“ */
function ShellTable({ Z, E }: { Z: number; E: number }) {
  const a = shells(Z), b = shells(Z, E), n = Math.max(a.length, b.length);
  const cell = (c: number | undefined) => (c ? electronsText(c) : tr("leer", "empty"));
  return (
    <table className="ia-shells">
      <thead><tr><th /><th scope="col">{BY_Z[Z].symbol}</th><th scope="col">{BY_Z[Z].symbol + chargeSup(Z - E)}</th></tr></thead>
      <tbody>{Array.from({ length: n }, (_, i) => (
        <tr key={i}><th scope="row">{shellName(i + 1)}</th><td>{cell(a[i])}</td><td>{cell(b[i])}</td></tr>
      ))}</tbody>
    </table>
  );
}

export function IonSheet({ ion, os, onClose }: { ion: Ion | null; os: boolean; onClose: () => void }) {
  return (
    <Sheet open={!!ion} title={ion ? `${ion.name} ${ionText(ion)}` : ""} onClose={onClose}>
      {ion && (ion.Z ? <Mono ion={ion} Z={ion.Z} os={os} /> : <Poly ion={ion} />)}
    </Sheet>
  );
}

function Mono({ ion, Z, os }: { ion: Ion; Z: number; os: boolean }) {
  const el = BY_Z[Z];
  const E = Z - ion.charge;
  const n = Math.abs(ion.charge);
  const give = ion.charge > 0;
  const outer = shells(Z)[shells(Z).length - 1];
  // ohne Edelgaskonfiguration (Fe³⁺, Cu²⁺, Pb²⁺) passt „so viele Außenelektronen, wie abgegeben“ nicht –
  // Oberstufe: aus welchen Unterschalen die Elektronen kommen (Fe³⁺: 4s², 3d¹), Unterstufe: kein Außenelektronen-Kennzeichen
  const noble = NOBLE.has(E);
  const ionCfg = configuration(Z, E);
  const slots = Math.max(shells(Z).length, shells(Z, E).length);
  const lost = configuration(Z).map(o => ({ key: o.key, n: o.count - (ionCfg.find(c => c.key === o.key)?.count ?? 0) })).filter(x => x.n > 0);
  return (
    <>
      <div className="ion-atom">
        <AtomBox Z={Z} E={Z} slots={slots} title={tr(`${el.name}-Atom`, `${el.name} atom`)} />
        <div className="ia-arrow">
          <Icon name="arrow" size={28} />
          <span>{give ? tr(`gibt ${n} e⁻ ab`, `loses ${n} e⁻`) : tr(`nimmt ${n} e⁻ auf`, `gains ${n} e⁻`)}</span>
        </div>
        <AtomBox Z={Z} E={E} slots={slots} title={ion.name} />
      </div>
      <ShellTable Z={Z} E={E} />
      <div className="ui-tags ion-tags">
        {noble && <Tag>{outer} {tr(`Außenelektron${outer === 1 ? "" : "en"}`, `outer electron${outer === 1 ? "" : "s"}`)}</Tag>}
        <Tag tone="signal">{give ? tr(`gibt ${n} e⁻ ab`, `loses ${n} e⁻`) : tr(`nimmt ${n} e⁻ auf`, `gains ${n} e⁻`)}</Tag>
        {!noble && os && give && <Tag>{tr("aus", "from")} {lost.map(x => `${x.key}${sup(x.n)}`).join(", ")}</Tag>}
        <Tag>{Z} p⁺ − {E} e⁻ = {give ? "+" : "−"}{n}</Tag>
        {NOBLE.has(E) ? <Tag tone="ok">✓ {tr("Edelgaskonfiguration wie", "Noble gas configuration like")} {BY_Z[E].name}</Tag> : <Tag>{tr("keine Edelgaskonfiguration", "no noble gas configuration")}{ion.part.endsWith(")") ? tr(" · römische Zahl = Ladung", " · Roman numeral = charge") : ""}</Tag>}
      </div>
    </>
  );
}

function Poly({ ion }: { ion: Ion }) {
  const parts = composition(ion.formula);
  return (
    <>
      <div className="ion-poly"><span className="ip-formula">{ionText(ion)}</span></div>
      <div className="ui-tags ion-tags">
        {parts.map(([sym, c]) => <Tag key={sym}>{c} × {sym}</Tag>)}
        <Tag tone="signal">{tr("Ladung", "Charge")} {signed(ion.charge)}</Tag>
        <Tag>{tr("mehrere → Klammer: Ca(OH)₂", "several → brackets: Ca(OH)₂")}</Tag>
      </div>
    </>
  );
}
