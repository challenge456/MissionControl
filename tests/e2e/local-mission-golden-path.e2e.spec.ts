import { expect, test, type Page } from "@playwright/test";

const appUrl = process.env.MISSION_CONTROL_URL ?? "";
const workspaceId = process.env.MISSION_GOLDEN_PATH_WORKSPACE_ID ?? "";
const missionId = process.env.MISSION_GOLDEN_PATH_MISSION_ID ?? "";
const workOrderId = process.env.MISSION_GOLDEN_PATH_WORK_ORDER_ID ?? "";
const liveProofConfigured = Boolean(appUrl && workspaceId && missionId && workOrderId);

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

test("local Mission golden path exposes its authoritative governance gate after refresh", async ({ page }) => {
  test.skip(!liveProofConfigured, "Set the live local golden-path IDs to run the real-backend browser proof.");
  const capture = watchPage(page);

  await page.goto(`${appUrl}/v2/missions/${missionId}?workspace=${workspaceId}`);
  await expect(page.getByRole("heading", { name: "Local Mission-to-PR V1 golden path", exact: true })).toBeVisible();
  await page.getByRole("tab", { name: "Execution", exact: true }).click();
  await expect(page.getByText("Not dispatched", { exact: true })).toBeVisible();
  await expect(page.getByText("Not frozen", { exact: true })).toBeVisible();
  await expect(page.getByText("Not created", { exact: true })).toBeVisible();
  await expect(page.getByText(/INCOMPLETE · blocked/i)).toBeVisible();
  await expect(page.getByText(/Factory review package is unavailable/i)).toBeVisible();

  await page.reload();
  await page.getByRole("tab", { name: "Execution", exact: true }).click();
  await expect(page.getByText("Not dispatched", { exact: true })).toBeVisible();

  await page.goto(`${appUrl}/v2/control-work-orders?project=${workspaceId}&workOrder=${workOrderId}`);
  await expect(page.getByRole("heading", { name: "Work Orders", exact: true })).toBeVisible();
  await expect(page.getByText(/feature-dev/i).first()).toBeVisible();
  await expect(page.getByText("node --test scripts/local-golden-path-candidate.test.mjs", { exact: true })).toBeVisible();
  await expect(page.getByText("APPROVED", { exact: true }).first()).toBeVisible();
  await expect(page.getByRole("combobox", { name: "Factory version for this Attempt" })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Dispatch", exact: true })).toBeDisabled();

  expect(capture.pageErrors).toEqual([]);
  expect(capture.failedRequests).toEqual([]);
});
