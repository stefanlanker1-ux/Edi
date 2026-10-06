// Modaler Dialog – auf schmalen Bildschirmen als Bottom-Sheet.

import { tr } from "./i18n.ts";
import { useEffect, useRef, type ReactNode } from "react";
import { IconButton } from "./components.tsx";
import { NoTerms } from "./termCtx.tsx";

export function Sheet({ open, title, onClose, wide, children }: { open: boolean; title: ReactNode; onClose: () => void; wide?: boolean; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  const openedAt = useRef(0);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) { d.showModal(); openedAt.current = performance.now(); }
    if (!open && d.open) d.close();
  }, [open]);
  // Zurück-Taste (Android, Browser) schließt das Blatt statt die App zu verlassen
  const close = useRef(onClose);
  close.current = onClose;
  useEffect(() => {
    if (!open) return;
    history.pushState({ uiSheet: true }, "");
    let popped = false;
    const onPop = () => { popped = true; close.current(); };
    addEventListener("popstate", onPop);
    return () => { removeEventListener("popstate", onPop); if (!popped && history.state?.uiSheet) history.back(); };
  }, [open]);
  return (
    <dialog ref={ref} className={`ui-sheet${wide ? " wide" : ""}`} onClose={e => { e.stopPropagation(); onClose(); }}
      // Tipp auf den Hintergrund schließt – nicht aber der Klick, der beim Antippen (Touch) gleich nach dem Öffnen nachkommt
      onClick={e => { if (e.target === ref.current && performance.now() - openedAt.current > 400) onClose(); }}>
      {open && (
        <div className="ui-sheet-inner">
          <header className="ui-sheet-head">
            <h2>{title}</h2>
            <IconButton icon="close" label={tr("Schließen", "Close")} onClick={onClose} />
          </header>
          <div className="ui-sheet-body"><NoTerms>{children}</NoTerms></div>
        </div>
      )}
    </dialog>
  );
}
