import { LernApp, uebenTab, type ShellTab } from "@lern/ui";
import { useApp, type Tab } from "./store.ts";
import { MixView } from "./views/MixView.tsx";
import { QuizView } from "./quiz/QuizView.tsx";
import { LESSON_KEY } from "@lern/quiz";
import { tr } from "@lern/i18n";

const TABS: ShellTab<Tab>[] = [
  // Üben = Lektion und Aufgaben je Kapitel (statt Erklärung und Quiz getrennt)
  uebenTab("quiz"),
  { id: "probieren", label: tr("Experimentieren", "Experiment"), icon: "beaker" },
];

// Logo: Becher mit Teilchen (Wassermolekül und Atome)
const Logo = () => (
  <span className="logo" aria-hidden="true">
    <svg viewBox="0 0 32 32" width="34" height="34">
      <rect width="32" height="32" rx="3" fill="var(--accent)" />
      <path d="M8 7v17a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7" fill="none" stroke="var(--on-accent)" strokeWidth="1.8" />
      <circle cx="13" cy="19" r="2.6" fill="var(--hue-red)" />
      <circle cx="10.8" cy="21.4" r="1.6" fill="#f5f4f0" />
      <circle cx="15.2" cy="21.4" r="1.6" fill="#f5f4f0" />
      <circle cx="19.5" cy="14" r="2.2" fill="var(--hue-blue)" />
      <circle cx="21.3" cy="21" r="2.2" fill="#8a8a8a" />
    </svg>
  </span>
);

export function App() {
  const { tab, setTab } = useApp();
  return (
    <LernApp name={tr("Gemische", "Mixtures")} logo={<Logo />} tabs={TABS} tab={tab} onTab={setTab} storage={["gemische-v1", "gemische-quiz", LESSON_KEY]}>
      {tab === "probieren" && <MixView />}
      {tab === "quiz" && <QuizView />}
    </LernApp>
  );
}
