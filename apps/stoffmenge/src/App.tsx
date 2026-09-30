import { LernApp, type ShellTab } from "@lern/ui";
import { useApp, type Tab } from "./store.ts";
import { CalcView } from "./views/CalcView.tsx";
import { QuizView } from "./quiz/QuizView.tsx";

const TABS: ShellTab<Tab>[] = [
  { id: "rechnen", label: "Rechnen", icon: "ruler" },
  { id: "quiz", label: "Quiz", icon: "quiz" },
];

const Logo = () => (
  <span className="logo" aria-hidden="true">
    <svg viewBox="0 0 64 64" width="34" height="34">
      <rect width="64" height="64" rx="8" fill="var(--accent)" />
      <path d="M12 22h40M32 22v24" stroke="var(--on-accent)" strokeWidth="4" strokeLinecap="round" />
      <path d="M12 22l-6 14h12zM52 22l-6 14h12z" fill="var(--on-accent)" />
      <rect x="24" y="46" width="16" height="6" rx="1.5" fill="var(--signal)" />
    </svg>
  </span>
);

export function App() {
  const { tab, setTab } = useApp();
  return (
    <LernApp name="Stoffmenge" logo={<Logo />} tabs={TABS} tab={tab} onTab={setTab} storage={["stoffmenge-v1", "stoffmenge-quiz"]}>
      {tab === "rechnen" && <CalcView />}
      {tab === "quiz" && <QuizView />}
    </LernApp>
  );
}
