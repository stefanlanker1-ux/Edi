import { LernApp, type ShellTab } from "@lern/ui";
import { useApp, type Tab } from "./store.ts";
import { MixView } from "./views/MixView.tsx";
import { QuizView } from "./quiz/QuizView.tsx";

const TABS: ShellTab<Tab>[] = [
  { id: "mix", label: "Mischen", icon: "beaker" },
  { id: "quiz", label: "Quiz", icon: "quiz" },
];

// Logo: Becherglas mit zwei Schichten (heterogen) – unten Teilchen
const Logo = () => (
  <span className="logo" aria-hidden="true">
    <svg viewBox="0 0 32 32" width="34" height="34">
      <rect width="32" height="32" rx="3" fill="var(--accent)" />
      <path d="M9 7v16.5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7" fill="none" stroke="var(--on-accent)" strokeWidth="2" />
      <rect x="10" y="13" width="12" height="5" fill="var(--hue-yellow)" />
      <rect x="10" y="18" width="12" height="6.5" fill="var(--hue-blue-light)" />
      <circle cx="13.5" cy="21.2" r="1.3" fill="var(--hue-red)" /><circle cx="18" cy="22" r="1.3" fill="var(--hue-red)" />
    </svg>
  </span>
);

export function App() {
  const { tab, setTab } = useApp();
  return (
    <LernApp name="Reinstoffe und Gemische" logo={<Logo />} tabs={TABS} tab={tab} onTab={setTab} storage={["reinstoffe-v1", "reinstoffe-quiz"]}>
      {tab === "mix" && <MixView />}
      {tab === "quiz" && <QuizView />}
    </LernApp>
  );
}
