import { LernApp, tr, uebenTab, type ShellTab } from "@lern/ui";
import { LESSON_KEY } from "@lern/quiz";
import { useApp, type Tab } from "./store.ts";
import { ExperimentView } from "./views/ExperimentView.tsx";
import { QuizView } from "./quiz/QuizView.tsx";

const TABS: ShellTab<Tab>[] = [
  // Üben = Lektion und Aufgaben je Kapitel
  uebenTab("quiz"),
  { id: "bauen", label: tr("Experimentieren", "Experiment"), icon: "beaker" },
];

// Logo: Kette aus Kügelchen
const Logo = () => (
  <span className="logo" aria-hidden="true">
    <svg viewBox="0 0 32 32" width="34" height="34">
      <rect width="32" height="32" rx="3" fill="var(--accent)" />
      <polyline points="6,20 11,14 16,19 21,13 26,18" fill="none" stroke="var(--on-accent)" strokeWidth="1.6" />
      <circle cx="6" cy="20" r="2.8" fill="var(--hue-violet)" />
      <circle cx="11" cy="14" r="2.8" fill="var(--hue-violet)" />
      <circle cx="16" cy="19" r="2.8" fill="var(--hue-violet)" />
      <circle cx="21" cy="13" r="2.8" fill="var(--hue-orange)" />
      <circle cx="26" cy="18" r="2.8" fill="var(--hue-orange)" />
    </svg>
  </span>
);

export function App() {
  const { tab, setTab } = useApp();
  return (
    <LernApp name={tr("Polymere", "Polymers")} logo={<Logo />} tabs={TABS} tab={tab} onTab={setTab} storage={["polymere-v1", "polymere-quiz", LESSON_KEY]}>
      {tab === "bauen" && <ExperimentView />}
      {tab === "quiz" && <QuizView />}
    </LernApp>
  );
}
