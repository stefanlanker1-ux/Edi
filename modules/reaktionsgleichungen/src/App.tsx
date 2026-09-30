import { LernApp, type ShellTab } from "@lern/ui";
import { useApp, type Tab } from "./store.ts";
import { StartView } from "./views/StartView.tsx";
import { PracticeView } from "./views/PracticeView.tsx";
import { QuizView } from "./quiz/QuizView.tsx";

const TABS: ShellTab<Tab>[] = [
  { id: "start", label: "Start", icon: "play" },
  { id: "ueben", label: "Üben", icon: "swap" },
  { id: "quiz", label: "Quiz", icon: "quiz" },
];

const Logo = () => (
  <span className="logo" aria-hidden="true">
    <svg viewBox="0 0 64 64" width="34" height="34">
      <rect width="64" height="64" rx="8" fill="var(--accent)" />
      <path d="M14 36h36M32 18v18" stroke="var(--on-accent)" strokeWidth="4" strokeLinecap="round" />
      <rect x="10" y="40" width="16" height="6" rx="1.5" fill="var(--signal)" />
      <rect x="38" y="40" width="16" height="6" rx="1.5" fill="var(--on-accent)" />
      <circle cx="32" cy="15" r="4" fill="var(--signal)" />
    </svg>
  </span>
);

export function App() {
  const { tab, setTab, stufe, setStufe } = useApp();
  return (
    <LernApp name="Reaktionsgleichungen" logo={<Logo />} tabs={TABS} tab={tab} onTab={setTab} storage={["reaktionsgleichungen-v2", "reaktionsgleichungen-quiz"]} stufe={{ value: stufe, onChange: setStufe }}>
      {tab === "start" && <StartView />}
      {tab === "ueben" && <PracticeView />}
      {tab === "quiz" && <QuizView />}
    </LernApp>
  );
}
