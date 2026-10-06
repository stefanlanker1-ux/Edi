// Begriffe im Text (siehe Terms.tsx): gemeinsamer Zustand, eigene Datei, damit Sheet ihn ohne Kreisbezug abschalten kann.

import { createContext, useContext, type ReactNode } from "react";

export interface TermCtxValue { words: { w: string; i: number }[]; open: (i: number) => void }
export const TermCtx = createContext<TermCtxValue | null>(null);

export const useTerms = () => useContext(TermCtx);

/** schaltet Begriffe für den Inhalt ab */
export const NoTerms = ({ children }: { children: ReactNode }) => <TermCtx.Provider value={null}>{children}</TermCtx.Provider>;
