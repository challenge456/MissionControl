import { expect, test } from "@playwright/test";

/**
 * Deterministic implementation artifact for the seeded Factory Health skill.
 * This is intentionally read-only: it observes the operator shell, records
 * screenshot evidence, and never mutates Mission Control state.
 */
test("Factory Health Monitor", async ({ page }) => {
  await page.goto(process.env.AUTOMATION_BASE_URL ?? "http://127.0.0.1:5199");
  await expect(page).toHaveTitle(/Mission Control/i);
  await expect(page.getByRole("navigation", { name: "Primary" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Command Center" })).toBeVisible();
  await page.screenshot({
    path: "test-results/automation-evidence/factory-health.png",
    fullPage: true,
  });
});
