// Englische Elementnamen mitten im Satz klein, am Satzanfang groß; deutsche Texte bleiben unverändert.
import { test, assert } from "vitest";
import { setLang } from "@lern/i18n";
import { namesInSentence } from "../src/elements.ts";

test("englisch: Elementnamen mitten im Satz klein", () => {
  setLang("en", false);
  try {
    assert.strictEqual(namesInSentence("Which ion does **Sodium** form?"), "Which ion does **sodium** form?");
    assert.strictEqual(namesInSentence("What is the formula of **Iron(III) oxide**?"), "What is the formula of **iron(III) oxide**?");
    assert.strictEqual(namesInSentence("**Sodium** has 11 protons. Like Neon, not like Argon."), "**Sodium** has 11 protons. Like neon, not like argon.");
    assert.strictEqual(namesInSentence("Name: Copper(I) sulfide."), "Name: copper(I) sulfide.");
    assert.strictEqual(namesInSentence("Ionic bonds lead to lattices."), "Ionic bonds lead to lattices.");
  } finally { setLang("de", false); }
  assert.strictEqual(namesInSentence("Welches Ion bildet **Natrium**?"), "Welches Ion bildet **Natrium**?");
});
