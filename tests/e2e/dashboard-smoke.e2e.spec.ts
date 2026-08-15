import { expect, test, type Page } from "@playwright/test";

async function expectShellLoaded(page: Page) {
  await page.goto("/v2/home");
  await expect(page.getByRole("navigation", { name: "Primary" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Overview" })).toBeVisible();
}

/**
 * Smoke E2E: Dashboard and home load with Convex (dev or deployed).
 * webServer in playwright.config.ts runs UI with VITE_CONVEX_URL so Convex dev can back the test.
 */
test("home dashboard loads and shows main sections", async ({ page }) => {
  await expectShellLoaded(page);

  // Home section: quick navigation or status
  await expect(page.getByRole("heading", { name: "Overview" })).toBeVisible({ timeout: 10000 });
  await expect(page.getByRole("heading", { name: "Needs attention", exact: true }).first()).toBeVisible({ timeout: 10000 });
});

test("navigate to Tasks and back to Home", async ({ page }) => {
  await expectShellLoaded(page);

  await page.goto("/v2/tasks");
  await expect(page.getByRole("heading", { name: "Tasks" })).toBeVisible({ timeout: 8000 });

  await page.goto("/v2/home");
  await expect(page.getByRole("heading", { name: "Overview" })).toBeVisible({ timeout: 8000 });
});

test("mobile shell keeps navigation and chat off canvas", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/v2/control-work-orders");

  await expect(page.getByRole("heading", { name: "Work Orders", exact: true })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Primary" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Open navigation" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Open chat" })).toBeVisible();

  const firstWorkOrder = page.locator('button[aria-label*="next action"]').first();
  await expect(firstWorkOrder).toBeVisible();
  await firstWorkOrder.click();
  await expect(page.getByRole("button", { name: "Back to work orders" })).toBeVisible();
  await page.getByRole("button", { name: "Back to work orders" }).click();
  await expect(firstWorkOrder).toBeVisible();

  await page.getByRole("button", { name: "Open navigation" }).click();
  await expect(page.getByRole("navigation", { name: "Primary" })).toBeVisible();
  await page.getByRole("button", { name: /Tasks/ }).click();
  await expect(page).toHaveURL(/\/v2\/tasks(?:\?.*)?$/);
  await expect(page.getByRole("navigation", { name: "Primary" })).toHaveCount(0);

  await page.getByRole("button", { name: "Open chat" }).click();
  await expect(page.getByRole("complementary", { name: "Chat dock" })).toBeVisible();
  await page.getByRole("button", { name: "Collapse chat" }).click();
  await expect(page.getByRole("complementary", { name: "Chat dock" })).toHaveCount(0);

  const horizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth
  );
  expect(horizontalOverflow).toBe(false);
});
