import { test, assert, describe, it, expect } from "vitest";
import { recordAnswer, stageOf, dueSkills, stageCounts, daysUntilDue, weeklyDone, weekStart, intervalDays, examDays, effectiveDue, dayStart, addDays, type Exam, type Skills } from "../src/skills.ts";

const DAY = 86_400_000;
const T0 = new Date(2026, 8, 7, 10).getTime(); // Montag

test("Stufen: neu → geübt → sicher → gemeistert", () => {
  assert.strictEqual(stageOf(undefined), "neu");
  let sk = recordAnswer(undefined, true, T0);
  assert.strictEqual(stageOf(sk), "geübt");
  sk = recordAnswer(sk, true, T0 + DAY);
  assert.strictEqual(stageOf(sk), "sicher");
  // Wiederholung nach 3 Tagen (fällig), aber noch keine 7 Tage seit dem letzten Treffer → bleibt sicher
  sk = recordAnswer(sk, true, T0 + 4 * DAY);
  assert.strictEqual(stageOf(sk), "sicher");
  // Wiederholung nach 8 Tagen Abstand → gemeistert
  sk = recordAnswer(sk, true, T0 + 12 * DAY);
  assert.strictEqual(stageOf(sk), "gemeistert");
  assert.strictEqual(sk.s, 4);
});

test("Fehler setzt die Serie zurück, morgen wieder fällig; zwei Fehler hintereinander nehmen die Meisterschaft", () => {
  let sk = recordAnswer(undefined, true, T0);
  sk = recordAnswer(sk, true, T0 + DAY);
  sk = recordAnswer(sk, true, T0 + 9 * DAY);
  assert.strictEqual(stageOf(sk), "gemeistert");
  sk = recordAnswer(sk, false, T0 + 10 * DAY);
  assert.strictEqual(sk.s, 0);
  assert.strictEqual(sk.due, dayStart(T0 + 11 * DAY));
  assert.strictEqual(stageOf(sk), "geübt", "ein Fehler: gemeistert ruht, zählt als geübt");
  sk = recordAnswer(sk, true, T0 + 11 * DAY);
  assert.strictEqual(stageOf(sk), "gemeistert", "ein Treffer bringt die Meisterschaft zurück");
  sk = recordAnswer(sk, false, T0 + 12 * DAY);
  sk = recordAnswer(sk, false, T0 + 13 * DAY);
  assert.strictEqual(sk.mastered, undefined);
  assert.strictEqual(stageOf(sk), "geübt");
});

test("Abstände wachsen 1 → 3 → 7 → 14 → 30 Tage", () => {
  assert.deepEqual([1, 2, 3, 4, 5, 9].map(intervalDays), [1, 3, 7, 14, 30, 30]);
  let sk = recordAnswer(undefined, true, T0);
  assert.strictEqual(sk.due, dayStart(T0 + DAY));
  sk = recordAnswer(sk, true, T0 + DAY);
  assert.strictEqual(sk.due, dayStart(T0 + 4 * DAY));
  assert.strictEqual(daysUntilDue(sk, T0 + DAY), 3);
  assert.strictEqual(daysUntilDue(sk, T0 + 6 * DAY), -2);
  assert.strictEqual(daysUntilDue(undefined), null);
});

test("fällig: nur geübte Fertigkeiten, überfälligste zuerst", () => {
  const skills: Skills = {
    a: recordAnswer(undefined, true, T0),            // fällig T0+1
    b: recordAnswer(recordAnswer(undefined, true, T0 - 5 * DAY), true, T0 - 4 * DAY), // fällig T0-1
    c: recordAnswer(undefined, true, T0 + DAY),      // fällig T0+2
  };
  assert.deepEqual(dueSkills(skills, ["a", "b", "c", "d"], T0 + DAY), ["b", "a"]);
  assert.deepEqual(dueSkills(skills, ["c"], T0), []);
  assert.deepEqual(stageCounts(skills, ["a", "b", "c", "d"]), { neu: 1, geübt: 2, sicher: 1, gemeistert: 0 });
});

test("Wochenziel zählt Runden ab Montag", () => {
  const monday = weekStart(T0);
  assert.strictEqual(new Date(monday).getDay(), 1);
  assert.strictEqual(new Date(monday).getHours(), 0);
  const rounds = [monday - DAY, monday + 1000, T0, T0 + 2 * DAY];
  assert.strictEqual(weeklyDone(rounds, T0), 2, "gestern (Sonntag) und die Zukunft zählen nicht");
  assert.strictEqual(weeklyDone(rounds, T0 + 3 * DAY), 3);
  assert.strictEqual(weeklyDone([], T0), 0);
});

test("Prüfungstermin: Abstand höchstens halbe Restzeit, neue Fertigkeiten zuerst, danach wieder normal", () => {
  const exam: Exam = { date: new Date(2026, 8, 12).getTime() }; // Samstag – von Montag T0 aus in 5 Tagen
  assert.strictEqual(examDays(exam, T0), 5);
  assert.strictEqual(examDays(exam, exam.date + 3600e3), 0);
  assert.strictEqual(examDays(exam, exam.date + DAY), -1);
  // sicher (Abstand 7 Tage), zuletzt vor 3 Tagen geübt: normal erst in 4 Tagen fällig – vor der Prüfung (halbe Restzeit = 2 Tage) heute
  const sk = recordAnswer(recordAnswer(recordAnswer(undefined, true, T0 - 10 * DAY), true, T0 - 9 * DAY), true, T0 - 3 * DAY);
  assert.strictEqual(daysUntilDue(sk, T0), 4);
  assert.strictEqual(daysUntilDue(sk, T0, exam, "a"), -1);
  assert.ok(effectiveDue(sk, "a", T0, exam) <= T0);
  // heute geübt → nicht schon wieder heute
  const today = recordAnswer(sk, true, T0);
  assert.ok(effectiveDue(today, "a", T0 + 3600e3, exam) > T0 + 3600e3);
  // neue Fertigkeit ist vor der Prüfung fällig und steht vorn; ohne Termin nicht
  assert.deepEqual(dueSkills({ a: sk }, ["a", "neu"], T0, exam), ["neu", "a"]);
  assert.deepEqual(dueSkills({ a: sk }, ["a", "neu"], T0), []);
  // Termin nur für bestimmte Fertigkeiten
  assert.deepEqual(dueSkills({ a: sk }, ["a", "neu"], T0, { ...exam, types: ["neu"] }), ["neu"]);
  // am Prüfungstag kommt gestern Geübtes noch einmal; danach gelten wieder die normalen Abstände
  assert.deepEqual(dueSkills({ a: today }, ["a"], exam.date + 8 * 3600e3, exam), ["a"]);
  assert.deepEqual(dueSkills({ a: today }, ["a"], exam.date + DAY, exam), []);
});

test("Treffer am selben Tag verlängern den Abstand nicht (eine Runde mit 4 gleichen Aufgaben → morgen wieder)", () => {
  let sk = recordAnswer(undefined, true, T0);
  for (let i = 1; i <= 3; i++) sk = recordAnswer(sk, true, T0 + i * 60e3);
  assert.strictEqual(stageOf(sk), "sicher");
  assert.strictEqual(daysUntilDue(sk, T0), 1);
  sk = recordAnswer(sk, true, T0 + DAY);                    // Wiederholung am nächsten Tag
  assert.strictEqual(daysUntilDue(sk, T0 + DAY), 3);
  sk = recordAnswer(sk, true, T0 + 4 * DAY);
  assert.strictEqual(daysUntilDue(sk, T0 + 4 * DAY), 7);
  // Fehler und danach am selben Tag richtig: morgen wieder
  sk = recordAnswer(recordAnswer(sk, false, T0 + 11 * DAY), true, T0 + 11 * DAY + 60e3);
  assert.strictEqual(daysUntilDue(sk, T0 + 11 * DAY), 1);
  // alter Stand ohne k: wie bisher ab s weiter
  const old = { s: 2, n: 2, right: 2, last: T0, due: T0 + 3 * DAY };
  assert.strictEqual(daysUntilDue(recordAnswer(old, true, T0 + 3 * DAY), T0 + 3 * DAY), 7);
});

test("fällig ab Tagesbeginn: abends geübt → am nächsten Morgen fällig, auch über die Zeitumstellung", () => {
  const evening = new Date(2026, 8, 7, 20).getTime(), morning = new Date(2026, 8, 8, 8).getTime();
  const sk = recordAnswer(undefined, true, evening);
  assert.strictEqual(daysUntilDue(sk, evening), 1);          // „morgen“
  assert.strictEqual(daysUntilDue(sk, morning), 0);          // „fällig“
  assert.deepEqual(dueSkills({ a: sk }, ["a"], morning), ["a"]);
  assert.deepEqual(dueSkills({ a: sk }, ["a"], new Date(2026, 8, 7, 23, 59).getTime()), []);
  // alter Stand (fällig „jetzt + 24 h“) zählt ebenfalls ab Tagesbeginn
  assert.deepEqual(dueSkills({ a: { ...sk, due: evening + DAY } }, ["a"], morning), ["a"]);
  // Kalendertage bleiben Kalendertage, auch wenn ein Tag 23 oder 25 Stunden hat
  for (const [y, m, d] of [[2026, 2, 28], [2026, 9, 24]]) {
    const t = new Date(y, m, d, 22).getTime();
    const due = addDays(t, 1);
    assert.strictEqual(new Date(due).getDate(), d + 1);
    assert.strictEqual(new Date(due).getHours(), 0);
    assert.strictEqual(daysUntilDue(recordAnswer(undefined, true, t), t), 1);
  }
});

describe("Vorlesen", async () => {
  const { speakable } = await import("../src/QuizScreen.tsx");
  it("macht Formeln und Formatierung sprechbar", () => {
    expect(speakable("Wie viele **O-Atome** stecken in `2 H₂O`?")).toBe("Wie viele O-Atome stecken in 2 H 2 O?");
    expect(speakable("2 H₂ + O₂ → 2 H₂O")).toBe("2 H 2 plus O 2 reagiert zu 2 H 2 O");
    expect(speakable("CaCO₃")).toBe("Ca C O 3");
  });
  it("liest Ladungen, Hochzahlen, Einheiten und Zeichen als Wörter", () => {
    expect(speakable("A: O²⁻. B: Na⁺. C: Fe³⁺")).toBe("A: O 2 minus. B: Na plus. C: Fe 3 plus");
    expect(speakable("A: 1+. B: 3−.")).toBe("A: 1 plus. B: 3 minus.");
    expect(speakable("Welche Ladung hat das Phosphat-Ion (PO₄³⁻)?")).toBe("Welche Ladung hat das Phosphat-Ion (P O 4 3 minus)?");
    expect(speakable("[Ar] 4s² 3d⁶")).toBe("Ar 4s 2 3d 6");
    expect(speakable("Tippe auf ein Kästchen: leer → ↑ → ↑↓.")).toBe("Tippe auf ein Kästchen: leer dann Pfeil dann Paar.");
    expect(speakable("Mit welcher Zehnerpotenz rechnest du kHz in GHz um? A: · 10⁻⁶")).toBe("Mit welcher Zehnerpotenz rechnest du kHz in GHz um? A: mal 10 hoch minus 6");
    expect(speakable("Lies ab: 4 mm³ = ? dm³")).toBe("Lies ab: 4 Kubikmillimeter gleich wie viel Kubikdezimeter");
    expect(speakable("0,6 cm² in m² · B: : 100")).toBe("0,6 Quadratzentimeter in Quadratmeter mal B: geteilt durch 100");
    expect(speakable("Rechne um: 36 g/l = ? kg/m³")).toBe("Rechne um: 36 g/l gleich wie viel kg/Kubikmeter");
    expect(speakable("? Cu + O₂ → 2 CuO")).toBe("wie viel Cu plus O 2 reagiert zu 2 Cu O");
    expect(speakable("Eine Ameise ist etwa 5 ▢ lang. 120° ≈ 16,67 kΩ µm")).toBe("Eine Ameise ist etwa 5 … lang. 120 Grad ungefähr 16,67 kOhm mikrom");
  });
});

test("Schwächen üben verschwindet, sobald die Fertigkeit wieder sicher ist", async () => {
  const { recordStat, weakTypes } = await import("../src/types.ts");
  let sk = recordAnswer(undefined, false, T0);
  let st = recordStat(undefined, false, sk.s >= 2);
  assert.deepEqual(weakTypes({ a: st }), ["a"]);
  sk = recordAnswer(sk, true, T0 + DAY); st = recordStat(st, true, sk.s >= 2);
  assert.deepEqual(weakTypes({ a: st }), ["a"]); // ein Treffer reicht noch nicht
  sk = recordAnswer(sk, true, T0 + DAY); st = recordStat(st, true, sk.s >= 2);
  assert.deepEqual(weakTypes({ a: st }), []); // zwei in Folge → sicher → keine Schwäche mehr
  assert.strictEqual(st.right, 2);
  sk = recordAnswer(sk, false, T0 + 2 * DAY); st = recordStat(st, false, sk.s >= 2);
  assert.deepEqual(weakTypes({ a: st }), ["a"]); // neuer Fehler → wieder Schwäche
});

test("Stolperstein verschwindet, sobald alle Fertigkeiten, in denen er auftrat, wieder sicher sind (simulierte Uhr)", async () => {
  const { clearMisses } = await import("../src/skills.ts");
  let sk: Skills = {};
  sk.a = recordAnswer(undefined, false, T0); sk.b = recordAnswer(undefined, false, T0);
  const misses = { x: 2 }, missBy = { x: ["a", "b"] };
  sk.a = recordAnswer(sk.a, true, T0 + DAY); sk.a = recordAnswer(sk.a, true, T0 + DAY);
  let r = clearMisses(misses, missBy, sk);
  assert.deepEqual(r.misses, { x: 2 }); // b ist noch nicht sicher
  sk.b = recordAnswer(sk.b, true, T0 + DAY); sk.b = recordAnswer(sk.b, true, T0 + 2 * DAY);
  r = clearMisses(r.misses, r.missBy, sk);
  assert.deepEqual(r.misses, {}); assert.deepEqual(r.missBy, {});
  // ohne Zuordnung (alter Stand) bleibt der Stolperstein stehen
  assert.deepEqual(clearMisses({ y: 3 }, {}, sk).misses, { y: 3 });
});

test("Fällig-Runde (simulierte Uhr): Fehler heute → morgen fällig, Treffer morgen → in 3 Tagen, nicht sofort wieder fällig", () => {
  let s = recordAnswer(undefined, true, T0);
  s = recordAnswer(s, false, T0 + 60_000);
  assert.strictEqual(s.due, addDays(T0, 1));
  assert.deepEqual(dueSkills({ d: s }, ["d"], T0 + 120_000), []); // heute nicht mehr fällig
  assert.deepEqual(dueSkills({ d: s }, ["d"], addDays(T0, 1) + 8 * 3600_000), ["d"]);
  // in der Fällig-Runde morgen richtig → in 3 Tagen, und am selben Tag nicht noch einmal fällig
  const t1 = addDays(T0, 1) + 9 * 3600_000;
  s = recordAnswer(s, true, t1);
  assert.strictEqual(s.due, addDays(t1, 1)); // erster Treffer nach dem Fehler: Stufe 1
  s = recordAnswer(recordAnswer(s, true, addDays(t1, 1) + 3600_000), true, addDays(t1, 1) + 7200_000);
  assert.strictEqual(daysUntilDue(s, addDays(t1, 1) + 7200_000), 3);
  assert.deepEqual(dueSkills({ d: s }, ["d"], addDays(t1, 1) + 7300_000), []);
  // dieselbe Fertigkeit in der Runde erst richtig, dann falsch → morgen (richtig)
  let u = recordAnswer(recordAnswer(undefined, true, T0), true, T0 + 1000);
  u = recordAnswer(u, false, addDays(T0, 3) + 3600_000);
  assert.strictEqual(u.due, addDays(T0, 4));
});
