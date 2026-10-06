import { LernApp, type ShellTab, uebenTab } from "@lern/ui";
import { useApp, type Tab } from "./store.ts";
import { BuildView } from "./views/BuildView.tsx";
import { QuizView } from "./quiz/QuizView.tsx";
import { guideFor } from "./guide.tsx";
import { tr } from "@lern/i18n";

const TABS: ShellTab<Tab>[] = [
  uebenTab("quiz"),
  { id: "build", label: tr("Experimentieren", "Experiment"), icon: "beaker" },
];

const Logo = () => (
  <span className="logo" aria-hidden="true">
    <svg viewBox="0 0 32 32" width="34" height="34">
      <rect width="32" height="32" rx="3" fill="var(--accent)" />
      <rect x="5" y="11" width="22" height="10" rx="5" fill="var(--pair-fill)" stroke="var(--pair-stroke)" />
      <circle cx="14" cy="16" r="2.2" fill="var(--electron)" /><circle cx="18" cy="16" r="2.2" fill="var(--electron)" />
      <circle cx="16" cy="16" r="11" fill="none" stroke="var(--octet)" strokeWidth="1.8" />
    </svg>
  </span>
);

export function App() {
  const { tab, setTab, stufe, setStufe } = useApp();
  return (
    <LernApp name={tr("Elektronenpaarbindung", "Covalent Bonds")} logo={<Logo />} tabs={TABS} tab={tab} onTab={setTab} storage={["elektronenpaar-v1", "elektronenpaar-quiz"]} stufe={{ value: stufe, onChange: setStufe }} guide={guideFor(stufe)}>
      {tab === "build" && <BuildView />}
      {tab === "quiz" && <QuizView />}
    </LernApp>
  );
}
