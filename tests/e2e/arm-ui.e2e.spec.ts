import { expect, test, type Page } from "@playwright/test";

async function expectShellLoaded(page: Page) {
  await page.goto("/v2/home");
  await expect(page.getByRole("navigation", { name: "Primary" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Overview" })).toBeVisible();
}

test("retained operator surfaces render in Mission Control shell", async ({ page }) => {
  await expectShellLoaded(page);

  await page.goto("/v2/agents");
  await expect(page.getByRole("heading", { name: "Agent Registry" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Create agent" })).toBeVisible();

  await page.goto("/v2/model-routing");
  await expect(page.getByRole("heading", { name: "Model Routing" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Workspace policy" })).toBeVisible();

  await page.goto("/v2/audit");
  await expect(page.getByRole("heading", { name: "ARM Audit" })).toBeVisible();

  await page.goto("/v2/telemetry");
  await expect(page.getByRole("heading", { name: "ARM Telemetry" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Emit Test Event" })).toBeVisible();
});
