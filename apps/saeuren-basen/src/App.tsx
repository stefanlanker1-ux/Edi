import { LernApp, type ShellTab } from "@lern/ui";
import { useApp, type Tab } from "./store.ts";
import { PhView } from "./views/PhView.tsx";
import { QuizView } from "./quiz/QuizView.tsx";

const TABS: ShellTab<Tab>[] = [
  { id: "ph", label: "pH-Skala", icon: "sample" },
  { id: "quiz", label: "Quiz", icon: "quiz" },
];

const Logo = () => (
  <span className="logo" aria-hidden="true">
    <svg viewBox="0 0 64 64" width="34" height="34">
      <rect width="64" height="64" rx="8" fill="var(--accent)" />
      <path d="M24 12h16M27 12v22a5 5 0 1 0 10 0V12" fill="none" stroke="var(--on-accent)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M27 26h10v8a5 5 0 1 1-10 0z" fill="var(--signal)" />
      <rect x="12" y="48" width="40" height="6" rx="1.5" fill="var(--on-accent)" />
      <rect x="12" y="48" width="14" height="6" rx="1.5" fill="var(--signal)" />
    </svg>
  </span>
);

export function App() {
  const { tab, setTab } = useApp();
  return (
    <LernApp name="Säuren und Basen" logo={<Logo />} tabs={TABS} tab={tab} onTab={setTab} storage={["saeuren-basen-v1", "saeuren-basen-quiz"]}>
      {tab === "ph" && <PhView />}
      {tab === "quiz" && <QuizView />}
    </LernApp>
  );
}
