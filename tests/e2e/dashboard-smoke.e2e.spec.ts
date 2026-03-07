import { expect, test } from "@playwright/test";

/**
 * Smoke E2E: Dashboard and home load with Convex (dev or deployed).
 * webServer in playwright.config.ts runs UI with VITE_CONVEX_URL so Convex dev can back the test.
 */
test("home dashboard loads and shows main sections", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("Mission Control").first()).toBeVisible({ timeout: 15000 });

  // Home section: quick navigation or status
  await expect(
    page.getByText(/Quick|System status|All Systems|INBOX|Agents/i).first()
  ).toBeVisible({ timeout: 10000 });
});

test("navigate to Tasks and back to Home", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("Mission Control").first()).toBeVisible({ timeout: 15000 });

  const opsNav = page.getByRole("button", { name: "Ops" });
  await opsNav.click();
  await expect(
    page.getByText(/Tasks|Kanban|INBOX|Board/i).first()
  ).toBeVisible({ timeout: 8000 });

  const homeNav = page.getByRole("button", { name: "Home" });
  await homeNav.click();
  await expect(
    page.getByText(/Quick|System status|INBOX/i).first()
  ).toBeVisible({ timeout: 8000 });
});
