import { LernApp, type ShellTab } from "@lern/ui";
import { useApp, type Tab } from "./store.ts";
import { ConvertView } from "./views/ConvertView.tsx";
import { QuizView } from "./quiz/QuizView.tsx";
import { guideFor } from "./guide.tsx";
import { tr } from "@lern/i18n";

const TABS: ShellTab<Tab>[] = [
  { id: "quiz", label: "Quiz", icon: "quiz" },
  { id: "convert", label: tr("Experimentieren", "Experiment"), icon: "beaker" },
];

const Logo = () => (
  <span className="logo" aria-hidden="true">
    <svg viewBox="0 0 32 32" width="34" height="34">
      <rect width="32" height="32" rx="3" fill="var(--accent)" />
      <rect x="5" y="11" width="22" height="10" rx="2" fill="var(--ruler-a)" />
      <path d="M8 11v4M11 11v2.5M14 11v4M17 11v2.5M20 11v4M23 11v2.5" stroke="var(--ruler-ink)" strokeWidth="1.3" />
    </svg>
  </span>
);

export function App() {
  const { tab, setTab, stufe, setStufe } = useApp();
  return (
    <LernApp name={tr("Einheiten", "Units")} logo={<Logo />} tabs={TABS} tab={tab} onTab={setTab} storage={["einheiten-v1", "einheiten-quiz"]} stufe={{ value: stufe, onChange: setStufe }} guide={guideFor(stufe)}>
      {tab === "convert" && <ConvertView />}
      {tab === "quiz" && <QuizView />}
    </LernApp>
  );
}
