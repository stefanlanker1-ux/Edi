import { chromium } from "/opt/node22/lib/node_modules/playwright/index.mjs";
const OUT = "/tmp/claude-0/-home-user-Edi/e1aeff83-16ec-5b84-8b5e-e9cea19d6f2c/scratchpad/p2/shots";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
const log = [];
async function open(k, lang) {
  await page.goto("http://localhost:5161/");
  await page.evaluate(([k, lang]) => {
    localStorage.setItem("ionenbindung-lernen", JSON.stringify({ state: { pos: { "formel-name": k }, best: {}, done: {} }, version: 1 }));
    localStorage.setItem("lern-sprache", lang);
  }, [k, lang]);
  await page.goto("http://localhost:5161/#/ionenbindung"); await page.reload();
  await page.waitForTimeout(300);
  await page.locator("button:visible").filter({ hasText: /^(Lernen|Learn)/ }).first().click();
  await page.click('[data-kapitel="formel-name"]');
  await page.waitForTimeout(500);
}
const msg = async () => (await page.locator(".ui-guide-msg").innerText().catch(() => "")).replace(/\n/g, " ");
const piece = t => page.locator(".k2-piece").filter({ hasText: new RegExp(`^${t}$`) }).first().click();
const check = async () => { await page.click(".lm-check"); await page.waitForTimeout(250); };
const name = async () => (await page.locator(".k2-nm-name").innerText());
// Name slides, both languages, correct path + a typical wrong path
for (const lang of ["de", "en"]) {
  const L = (de, en) => lang === "de" ? de : en;
  await open(15, lang); // slide 16 K2S
  await piece(L("Kalium","Potassium")); await piece("Sulf"); await piece(L("-it","-ite"));
  log.push(`${lang} S16 built "${await name()}"`); await check(); log.push(`  -> ${await msg()}`);
  await page.click(".k2-back"); await piece(L("-id","-ide")); log.push(`${lang} S16 built "${await name()}"`); await check(); log.push(`  -> ${await msg()}`);
  await page.screenshot({ path: `${OUT}/man-${lang}-s16-ok.png` });
  await open(16, lang); // slide 17 CaF2
  await piece("di"); await piece("Calcium"); await piece("Fluor"); await piece(L("-id","-ide"));
  log.push(`${lang} S17 built "${await name()}"`); await check(); log.push(`  -> ${await msg()}`);
  await page.screenshot({ path: `${OUT}/man-${lang}-s17-wrong.png` });
  for (let i = 0; i < 4; i++) await page.click(".k2-back");
  await piece("Calcium"); await piece("Fluor"); await piece(L("-id","-ide"));
  log.push(`${lang} S17 built "${await name()}"`); await check(); log.push(`  -> ${await msg()}`);
  await open(18, lang); // slide 19 Al2S3
  await piece("Aluminium"); await piece(L("Schwefel","Sulfur")); await piece(L("-id","-ide"));
  log.push(`${lang} S19 built "${await name()}"`); await check(); log.push(`  -> ${await msg()}`);
  await open(22, lang); // slide 23 Mg3N2
  await piece("Magnesium"); await piece(L("Stickstoff","Nitrogen"));
  log.push(`${lang} S23 built "${await name()}"`); await check(); log.push(`  -> ${await msg()}`);
  await page.click(".k2-back"); await page.click(".k2-back"); await piece("tri"); await piece("Magnesium"); await piece("Nitr"); await piece(L("-id","-ide"));
  log.push(`${lang} S23 built "${await name()}"`); await check(); log.push(`  -> ${await msg()}`);
  for (let i = 0; i < 4; i++) await page.click(".k2-back");
  await piece("Magnesium"); await piece("Nitr"); await piece(L("-id","-ide"));
  log.push(`${lang} S23 built "${await name()}"`); await check(); log.push(`  -> ${await msg()}`);
  await page.screenshot({ path: `${OUT}/man-${lang}-s23-ok.png` });
}
// Pick slides: wrong combos
await open(20, "de"); // slide 21 Ca/Br
const z = (grp, t) => page.locator(`.k2-z.${grp} .k2-key`).filter({ hasText: t }).first().click();
const cnt = async (col, which) => page.locator(".k2-pick .k2-col").nth(col).locator(".k2-key").nth(which === "+" ? 1 : 0).click();
await z("cation", "Ca²⁺"); await page.waitForTimeout(150);
await page.screenshot({ path: `${OUT}/man-de-s21-ca2.png` });
log.push(`de S21 Ca2+ Br- 1:1 formula shown? ${await page.locator(".iw-formula").innerText().catch(()=>"none")}`);
await check(); log.push(`  -> ${await msg()}`);
await cnt(1, "+"); await cnt(1, "+"); await cnt(1, "+"); await cnt(0, "+");
log.push(`de S21 Ca2+ 2 Br- 4: formula ${await page.locator(".iw-formula").innerText().catch(()=>"none")}`);
await check(); log.push(`  -> ${await msg()}`);
await cnt(0, "-"); await cnt(1, "-"); await cnt(1, "-");
await page.screenshot({ path: `${OUT}/man-de-s21-right.png` });
log.push(`de S21 1:2 formula ${await page.locator(".iw-formula").innerText().catch(()=>"none")}`);
await check(); log.push(`  -> ${await msg()}`);
// slide 22 Li/N: N2- etc
await open(21, "de");
await z("anion", "N³⁻"); await cnt(0, "+"); await cnt(0, "+");
log.push(`de S22 built: formula ${await page.locator(".iw-formula").innerText().catch(()=>"none")}`);
await check(); log.push(`  -> ${await msg()}`);
await z("cation", "Li³⁺"); await cnt(0, "-"); await cnt(0, "-");
log.push(`de S22 Li3+ N3- 1:1 balance: ${await page.locator(".iw-balance").innerText()}`);
await check(); log.push(`  -> ${await msg()}`);
await page.screenshot({ path: `${OUT}/man-de-s22-li3.png` });
// slide 10 swap
await open(9, "de");
await page.click(".k2-swap"); await page.waitForTimeout(150);
await page.locator(".k2-fm-ctl .k2-count").nth(1).locator(".k2-key").nth(1).click(); await page.locator(".k2-fm-ctl .k2-count").nth(1).locator(".k2-key").nth(1).click();
log.push(`de S10 swapped formula: ${await page.locator(".k2-fm-f").innerText()}`);
await page.screenshot({ path: `${OUT}/man-de-s10-swap.png` });
await check(); log.push(`  -> ${await msg()}`);
await browser.close();
console.log(log.join("\n"));
