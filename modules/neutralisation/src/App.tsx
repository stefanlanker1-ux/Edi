import { LernApp, type ShellTab } from "@lern/ui";
import { useApp, type Tab } from "./store.ts";
import { BuildView } from "./views/BuildView.tsx";
import { QuizView } from "./quiz/QuizView.tsx";

const TABS: ShellTab<Tab>[] = [
  { id: "build", label: "Neutralisieren", short: "Bauen", icon: "grid" },
  { id: "quiz", label: "Quiz", icon: "quiz" },
];

// Logo: Kation (gold) mit OH⁻, darunter H⁺ mit Säurerest (grün) – H⁺ und OH⁻ blau, weil sie zu Wasser werden
const Logo = () => (
  <span className="logo" aria-hidden="true">
    <svg viewBox="0 0 32 32" width="34" height="34">
      <rect width="32" height="32" rx="3" fill="var(--accent)" />
      <rect x="5" y="5" width="22" height="5" rx="1.5" fill="var(--cat-tile-a)" />
      <rect x="5" y="11.5" width="10.5" height="4" rx="1.2" fill="var(--w-tile-a)" />
      <rect x="16.5" y="11.5" width="10.5" height="4" rx="1.2" fill="var(--w-tile-a)" />
      <rect x="5" y="16.5" width="10.5" height="4" rx="1.2" fill="var(--w-tile-a)" />
      <rect x="16.5" y="16.5" width="10.5" height="4" rx="1.2" fill="var(--w-tile-a)" />
      <rect x="5" y="22" width="22" height="5" rx="1.5" fill="var(--an-tile-a)" />
    </svg>
  </span>
);

export function App() {
  const { tab, setTab, stufe, setStufe } = useApp();
  return (
    <LernApp name="Neutralisation" logo={<Logo />} tabs={TABS} tab={tab} onTab={setTab} storage={["neutralisation-v1", "neutralisation-quiz"]} stufe={{ value: stufe, onChange: setStufe }}>
      {tab === "build" && <BuildView />}
      {tab === "quiz" && <QuizView />}
    </LernApp>
  );
}
