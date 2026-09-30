// Vom Atom zum Ion: Bohrmodell des Atoms und des Ions nebeneinander (bei einatomigen Ionen).

import { Chip, Icon, Sheet, Tag } from "@lern/ui";
import { Bohr, Nuclide } from "@lern/chem-ui";
import { BY_Z, shells, SHELL_NAMES, standardNeutrons, composition, ionText, type Ion } from "@lern/chem";

const NOBLE = new Set([2, 10, 18, 36, 54, 86]);

function AtomBox({ Z, E, title }: { Z: number; E: number; title: string }) {
  const N = standardNeutrons(Z);
  const sh = shells(Z, E);
  return (
    <figure className="ia-box">
      <figcaption>{title}</figcaption>
      <div className="ia-bohr"><Bohr Z={Z} N={N} E={E} labels={false} /></div>
      <Nuclide Z={Z} N={N} E={E} size="md" />
      <div className="shell-chips">{sh.map((c, i) => <Chip key={i}><b>{SHELL_NAMES[i]}</b>{c}</Chip>)}</div>
    </figure>
  );
}

export function IonSheet({ ion, onClose }: { ion: Ion | null; onClose: () => void }) {
  return (
    <Sheet open={!!ion} title={ion ? `${ion.name} ${ionText(ion)}` : ""} onClose={onClose}>
      {ion && (ion.Z ? <Mono ion={ion} Z={ion.Z} /> : <Poly ion={ion} />)}
    </Sheet>
  );
}

function Mono({ ion, Z }: { ion: Ion; Z: number }) {
  const el = BY_Z[Z];
  const E = Z - ion.charge;
  const n = Math.abs(ion.charge);
  const give = ion.charge > 0;
  const outer = shells(Z)[shells(Z).length - 1];
  return (
    <>
      <div className="ion-atom">
        <AtomBox Z={Z} E={Z} title={`${el.name}-Atom`} />
        <div className="ia-arrow">
          <Icon name="arrow" size={28} />
          <span>{give ? "gibt" : "nimmt"} {n} e⁻ {give ? "ab" : "auf"}</span>
        </div>
        <AtomBox Z={Z} E={E} title={ion.name} />
      </div>
      <div className="ui-tags ion-tags">
        <Tag>{outer} Außenelektron{outer === 1 ? "" : "en"}</Tag>
        <Tag tone="signal">{give ? "gibt" : "nimmt"} {n} e⁻ {give ? "ab" : "auf"}</Tag>
        <Tag>{Z} p⁺ − {E} e⁻ = {give ? "+" : "−"}{n}</Tag>
        {NOBLE.has(E) ? <Tag tone="ok">✓ Edelgaskonfiguration wie {BY_Z[E].name}</Tag> : <Tag>keine Edelgaskonfiguration{ion.part.endsWith(")") ? " · römische Zahl = Ladung" : ""}</Tag>}
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
        <Tag tone="signal">Ladung {ion.charge > 0 ? "+" : "−"}{Math.abs(ion.charge)}</Tag>
        <Tag>mehrere → Klammer: Ca(OH)₂</Tag>
      </div>
    </>
  );
}
