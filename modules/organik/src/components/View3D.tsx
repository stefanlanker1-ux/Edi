// 3D-Ansicht des gezeichneten Moleküls: hinterlegte Struktur (gemessene Werte), sonst in der App mit dem Kraftfeld MMFF94 berechnet;
// Kugel-Stab oder Kalotte.

import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { Segmented, Sheet, Tag, tr } from "@lern/ui";
import { computeMol3D, storedFor } from "@lern/chem-ui";
import type { Mol3D } from "@lern/chem";
import type { Mol } from "../chem/mol.ts";
import { ffInput } from "../chem/forcefield.ts";

const Molecule3D = lazy(() => import("@lern/chem-ui/3d"));

export function View3D({ mol, title, onClose }: { mol: Mol; title: string; onClose: () => void }) {
  const stored = useMemo(() => storedFor(ffInput(mol)), [mol]);
  const [calc, setData] = useState<Mol3D | null | "busy">("busy");
  const [look, setLook] = useState<"ball" | "fill">("ball");
  const data = stored ?? calc;
  useEffect(() => {
    if (stored) return;
    let live = true;
    setData("busy");
    const t = window.setTimeout(() => computeMol3D(ffInput(mol)).then(d => { if (live) setData(d); }, () => { if (live) setData(null); }), 30);
    return () => { live = false; window.clearTimeout(t); };
  }, [mol, stored]);
  return (
    <Sheet open wide title={`${tr("3D-Ansicht", "3D view")}: ${title}`} onClose={onClose}>
      {data && data !== "busy" ? (
        <Suspense fallback={<div className="m3d m3d-loading">{tr("3D-Ansicht wird geladen …", "Loading 3D view …")}</div>}>
          <Molecule3D data={data} look={look} />
        </Suspense>
      ) : (
        <div className="m3d m3d-loading">{data === "busy" ? tr("Wird berechnet …", "Calculating …") : tr("Keine Kraftfeld-Daten für dieses Molekül", "No force-field data for this molecule")}</div>
      )}
      <div className="m3d-controls">
        {!stored && data && data !== "busy" && <Tag>{tr("berechnet (MMFF94)", "calculated (MMFF94)")}</Tag>}
        <Segmented<"ball" | "fill"> label={tr("Modell", "Model")} value={look} onChange={setLook}
          options={[{ value: "ball", label: tr("Kugel-Stab", "Ball and stick") }, { value: "fill", label: tr("Kalotte", "Space-filling") }]} />
      </div>
    </Sheet>
  );
}
