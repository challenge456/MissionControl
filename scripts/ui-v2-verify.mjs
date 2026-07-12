// One-shot visual verification of the v2 shell across key views.
// Usage: node scripts/ui-v2-verify.mjs
import { chromium } from "/Users/jaywest/MissionControl/node_modules/.pnpm/playwright@1.59.1/node_modules/playwright/index.mjs";
import { mkdirSync } from "node:fs";

const BASE = "http://localhost:5180";
const OUT = "/tmp/ui-v2-shots";
const VIEWS = [
  "home",
  "goals",
  "tasks",
  "dag",
  "agents",
  "skills",
  "memory",
  "control-portfolio",
  "control-work-orders",
  "control-approvals",
  "telemetry",
  "metrics",
  "policies",
];

mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
const errors = [];
page.on("console", (msg) => {
  if (msg.type() === "error") errors.push(`[console] ${msg.text().slice(0, 300)}`);
});
page.on("pageerror", (err) => errors.push(`[pageerror] ${String(err).slice(0, 300)}`));

// Landing redirect check
await page.goto(BASE, { waitUntil: "networkidle", timeout: 30000 });
await page.waitForTimeout(2500);
console.log("landing URL:", page.url());
await page.screenshot({ path: `${OUT}/00-landing.png`, fullPage: false });

for (const view of VIEWS) {
  const before = errors.length;
  try {
    await page.goto(`${BASE}/v2/${view}`, { waitUntil: "networkidle", timeout: 30000 });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: `${OUT}/${view}.png`, fullPage: false });
    const newErrs = errors.length - before;
    console.log(`${view}: OK (${newErrs} new console errors)`);
  } catch (e) {
    console.log(`${view}: FAILED — ${String(e).slice(0, 200)}`);
  }
}

console.log("\n--- console errors (deduped) ---");
for (const e of [...new Set(errors)].slice(0, 25)) console.log(e);
await browser.close();
