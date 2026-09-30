// Elementauswahl im Dialog: Periodensystem + Suche.

import { useEffect, useRef, useState } from "react";
import { Icon, Sheet } from "@lern/ui";
import { searchElements } from "@lern/chem";
import { PeriodicTable } from "@lern/chem-ui";
import { maxZFor } from "../store.ts";
import type { Stufe } from "../quiz/tasks.ts";

export function ElementPicker({ open, stufe, selected, title, onPick, onClose }: {
  open: boolean; stufe: Stufe; selected: number; title: string; onPick: (Z: number) => void; onClose: () => void;
}) {
  const [q, setQ] = useState("");
  const hits = new Set(searchElements(q, maxZFor(stufe)).map(e => e.Z));
  const wrap = useRef<HTMLDivElement>(null);
  useEffect(() => { if (!open) setQ(""); }, [open]);
  useEffect(() => { wrap.current?.querySelector(".hit, .sel")?.scrollIntoView({ block: "nearest", inline: "center" }); }, [q, open]);
  const pick = (Z: number) => { onPick(Z); onClose(); };
  return (
    <Sheet open={open} title={title} onClose={onClose} wide={stufe === "os"}>
      <SearchBox value={q} onChange={setQ} onEnter={() => { const h = searchElements(q, maxZFor(stufe))[0]; if (h) pick(h.Z); }} />
      <div className="scroll-x" ref={wrap}>
        <PeriodicTable stufe={stufe} names={false} onPick={pick}
          cellState={Z => (hits.size ? (hits.has(Z) ? "hit" : "dim") : Z === selected ? "sel" : undefined)} />
      </div>
    </Sheet>
  );
}

export function SearchBox({ value, onChange, onEnter, placeholder = "Name, Symbol oder Ordnungszahl" }: {
  value: string; onChange: (v: string) => void; onEnter?: () => void; placeholder?: string;
}) {
  return (
    <label className="search">
      <Icon name="search" />
      <input type="search" value={value} placeholder={placeholder} aria-label="Element suchen" enterKeyHint="search"
        onChange={e => onChange(e.target.value)} onKeyDown={e => { if (e.key === "Enter") { onEnter?.(); (e.target as HTMLInputElement).blur(); } }} />
    </label>
  );
}
