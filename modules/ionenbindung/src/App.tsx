import { LernApp, type ShellTab } from "@lern/ui";
import { useApp, type Tab } from "./store.ts";
import { BuildView } from "./views/BuildView.tsx";
import { QuizView } from "./quiz/QuizView.tsx";
import { guideFor } from "./guide.tsx";
import { tr } from "@lern/i18n";

const TABS: ShellTab<Tab>[] = [
  { id: "build", label: tr("Formeln bauen", "Build formulas"), short: tr("Bauen", "Build"), icon: "grid" },
  { id: "quiz", label: "Quiz", icon: "quiz" },
];

const Logo = () => (
  <span className="logo" aria-hidden="true">
    <svg viewBox="0 0 32 32" width="34" height="34">
      <rect width="32" height="32" rx="3" fill="var(--accent)" />
      <rect x="6" y="8" width="20" height="7" rx="2" fill="var(--cat-tile-a)" />
      <rect x="6" y="17" width="9.5" height="7" rx="2" fill="var(--an-tile-a)" />
      <rect x="16.5" y="17" width="9.5" height="7" rx="2" fill="var(--an-tile-a)" />
    </svg>
  </span>
);

export function App() {
  const { tab, setTab, stufe, setStufe } = useApp();
  return (
    <LernApp name={tr("Ionenbindung", "Ionic Bonds")} logo={<Logo />} tabs={TABS} tab={tab} onTab={setTab} storage={["ionenbindung-v1", "ionenbindung-quiz"]} stufe={{ value: stufe, onChange: setStufe }} guide={guideFor(stufe)}>
      {tab === "build" && <BuildView />}
      {tab === "quiz" && <QuizView />}
    </LernApp>
  );
}
