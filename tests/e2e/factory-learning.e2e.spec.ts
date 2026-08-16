import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

const APP_URL = process.env.MISSION_CONTROL_URL ?? "";
const WORKSPACE_ID = process.env.FACTORY_LEARNING_WORKSPACE_ID ?? "";

function watchPage(page: Page) {
  const pageErrors: string[] = [];
  const failedRequests: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("requestfailed", (request) => {
    const failure = request.failure()?.errorText;
    if (failure !== "net::ERR_ABORTED" && !request.url().includes("/gateway/status")) {
      failedRequests.push(`${request.method()} ${request.url()} :: ${failure}`);
    }
  });
  return { pageErrors, failedRequests };
}

test("Factory Learning is progressive, governed, responsive, and reachable from Factory Board", async ({ page }, testInfo) => {
  test.skip(!APP_URL || !WORKSPACE_ID, "Set the local Factory Learning URL and workspace ID for real-backend proof.");
  const capture = watchPage(page);

  await page.goto(`${APP_URL}/v2/factory?workspace=${WORKSPACE_ID}`);
  await expect(page.getByRole("heading", { name: "From intent to verified change", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Improvements", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Signals", exact: true })).toHaveCount(0);

  await page.getByRole("button", { name: "Improvements", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Evidence before change", exact: true })).toBeVisible();
  await expect(page.getByText("Factory Learning cannot accept work", { exact: false })).toBeVisible();
  await expect(page.getByRole("button", { name: "Refresh evidence", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Refresh evidence", exact: true }).click();
  await expect(page.getByText("Deterministic learning evidence refreshed.", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: "Intermediate", exact: true }).click();
  await expect(page.getByRole("button", { name: "Signals", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Experiments", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Signals", exact: true }).click();
  await expect(page.getByText(/No recurring signal clusters|Recurring clusters/).first()).toBeVisible();

  await page.getByRole("button", { name: "Advanced", exact: true }).click();
  await expect(page.getByRole("button", { name: "Agent setup", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Agent setup", exact: true }).click();
  await expect(page.getByText(/No agent configuration scan synced|Configuration registry/).first()).toBeVisible();
  await expect(page.getByText("node scripts/mc-context.mjs agent-config", { exact: false }).first()).toBeVisible();
  const accessibility = await new AxeBuilder({ page })
    .include("main")
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .analyze();
  await testInfo.attach("factory-learning-axe-results", {
    body: JSON.stringify(accessibility, null, 2),
    contentType: "application/json",
  });
  expect(accessibility.violations.filter((violation) => violation.impact === "critical")).toEqual([]);
  await page.screenshot({ path: "docs/validation/evidence/2026-08-16-factory-learning-agent-setup.png", fullPage: true });

  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByRole("heading", { name: "Evidence before change", exact: true })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Factory views" })).toBeVisible();
  await page.screenshot({ path: "docs/validation/evidence/2026-08-16-factory-learning-mobile.png", fullPage: true });

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.evaluate(() => window.localStorage.setItem("mc.theme", "light"));
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await expect(page.getByRole("heading", { name: "Evidence before change", exact: true })).toBeVisible();
  await page.screenshot({ path: "docs/validation/evidence/2026-08-16-factory-learning-light.png", fullPage: true });

  expect(capture.pageErrors).toEqual([]);
  expect(capture.failedRequests).toEqual([]);
});

test("Factory Learning operator guide is available in in-app Docs", async ({ page }) => {
  test.skip(!APP_URL || !WORKSPACE_ID, "Set the local Factory Learning URL and workspace ID for real-backend proof.");
  const capture = watchPage(page);
  await page.goto(`${APP_URL}/v2/docs?workspace=${WORKSPACE_ID}&doc=sfe-factory-learning`);
  await expect(page.getByRole("heading", { name: "Factory Learning and continuous improvement", exact: true })).toBeVisible();
  await expect(page.getByText("acceptanceAuthority: false", { exact: false }).first()).toBeVisible();
  await page.screenshot({ path: "docs/validation/evidence/2026-08-16-factory-learning-docs.png", fullPage: true });
  expect(capture.pageErrors).toEqual([]);
  expect(capture.failedRequests).toEqual([]);
});
