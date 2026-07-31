import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const workspaceId = "sn71gskbdemgf4z1trt9zdmm5h8bde69";
const workOrderId = "yh720mxa1zg8bb1r23ye0twxzs8bdbx8";
const workOrderTitle = "Pi · Add governed-context bridge end-to-end test";
const evidenceDir = "docs/testing/evidence/task-workorder-linkage";

test("governed and Ungoverned Task delivery journey", async ({ page }) => {
  test.setTimeout(120_000);
  const suffix = Date.now().toString(36);
  const governedTitle = `PR1 governed browser evidence ${suffix}`;
  const ungovernedTitle = `PR1 ungoverned browser evidence ${suffix}`;
  const pageErrors: string[] = [];
  const consoleErrors: string[] = [];
  const relevantRequestFailures: string[] = [];

  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("requestfailed", (request) => {
    if (!request.url().includes("/gateway/status")) {
      relevantRequestFailures.push(
        `${request.method()} ${request.url()} ${request.failure()?.errorText ?? ""}`
      );
    }
  });

  await page.goto(
    `/v2/control-work-orders?workspace=${workspaceId}&workOrder=${workOrderId}`
  );
  await expect(page.getByRole("heading", { name: "Work Orders" })).toBeVisible();
  await expect(page.getByText(workOrderTitle).first()).toBeVisible();

  await page.getByRole("button", { name: "New Task" }).first().click();
  const createDialog = page.getByRole("dialog", { name: "Create Task" });
  await expect(createDialog).toBeVisible();
  await expect(
    createDialog.getByRole("combobox", { name: "Parent Work Order" })
  ).toContainText(workOrderTitle);
  await expect(createDialog.getByText("Mission", { exact: true })).toBeVisible();
  await page.screenshot({
    path: `${evidenceDir}/01-new-task-preselected.png`,
    fullPage: true,
  });

  await createDialog.getByRole("textbox", { name: "Title" }).fill(governedTitle);
  await createDialog
    .getByRole("textbox", { name: "Description" })
    .fill("Created through the governed Work Order detail journey.");
  await createDialog.getByRole("button", { name: "Create Task" }).click();
  await expect(createDialog).toBeHidden();
  await expect(page.getByText(governedTitle)).toBeVisible();
  await page.screenshot({
    path: `${evidenceDir}/02-work-order-child-task.png`,
    fullPage: true,
  });

  await page.getByRole("button", { name: /^Tasks \d+$/ }).click();
  const governedCard = page.getByRole("button", {
    name: `Open task ${governedTitle}`,
  });
  await expect(governedCard).toHaveCount(1);
  await expect(governedCard).toBeVisible();
  const governedCardContainer = governedCard.locator("..");
  await expect(governedCardContainer).toContainText(workOrderTitle);
  await expect(governedCardContainer).toContainText("GOVERNED");
  const retryTaskCard = page.getByRole("button", {
    name: /Open task Loop 1 · Increase critical UI journey pass rate/,
  });
  await expect(retryTaskCard).toHaveCount(1);
  await expect(retryTaskCard.locator("..")).toContainText("Attempt 2");
  await expect(retryTaskCard.locator("..")).toContainText("1 retry");
  await retryTaskCard.locator("..").screenshot({
    path: `${evidenceDir}/07-attempt-projection.png`,
  });
  await page.screenshot({
    path: `${evidenceDir}/03-governed-kanban-card.png`,
    fullPage: true,
  });

  await governedCard.click();
  await expect(page.getByText("Parent Delivery", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: workOrderTitle })).toBeVisible();
  await page.screenshot({
    path: `${evidenceDir}/04-task-parent-delivery.png`,
    fullPage: true,
  });
  await page.getByRole("button", { name: workOrderTitle }).click();
  await expect(page).toHaveURL(new RegExp(`workOrder=${workOrderId}`));
  await expect(page.getByText(governedTitle)).toBeVisible();

  await page.getByRole("button", { name: /^Tasks \d+$/ }).click();
  await page.getByRole("button", { name: "New task" }).click();
  const ungovernedDialog = page.getByRole("dialog", { name: "Create Task" });
  await ungovernedDialog
    .getByRole("combobox", { name: "Parent Work Order" })
    .click();
  await page
    .getByRole("option", { name: "Create as Ungoverned Inbox" })
    .click();
  await ungovernedDialog
    .getByRole("textbox", { name: "Title" })
    .fill(ungovernedTitle);
  await ungovernedDialog.getByRole("button", { name: "Create Task" }).click();
  await expect(ungovernedDialog).toBeHidden();

  const ungovernedCard = page.getByRole("button", {
    name: `Open task ${ungovernedTitle}`,
  });
  await expect(ungovernedCard).toHaveCount(1);
  const ungovernedCardContainer = ungovernedCard.locator("..");
  await expect(ungovernedCardContainer).toContainText("UNGOVERNED");
  await expect(ungovernedCardContainer).toContainText(
    "Work Order required before execution"
  );
  await page.screenshot({
    path: `${evidenceDir}/05-ungoverned-kanban-card.png`,
    fullPage: true,
  });

  await ungovernedCard.click();
  const blockedAlert = page.waitForEvent("dialog");
  await page.getByRole("button", { name: "Assign", exact: true }).click();
  const alert = await blockedAlert;
  expect(alert.message()).toContain(
    "Link this Task to a Work Order before execution."
  );
  await alert.dismiss();

  const linkSelector = page.getByLabel("Link to Work Order");
  await linkSelector.selectOption({ label: workOrderTitle });
  await page.getByRole("button", { name: "Link", exact: true }).click();
  await expect(page.getByText("GOVERNED", { exact: true }).first()).toBeVisible();
  await expect(page.getByRole("button", { name: workOrderTitle })).toBeVisible();
  await page.screenshot({
    path: `${evidenceDir}/06-linked-parent-delivery.png`,
    fullPage: true,
  });

  await page.getByRole("button", { name: "Assign", exact: true }).click();
  await expect(page.getByText("ASSIGNED", { exact: true }).first()).toBeVisible();
  await page.reload();
  const persistedCard = page.getByRole("button", {
    name: `Open task ${ungovernedTitle}`,
  });
  await expect(persistedCard).toHaveCount(1);
  await expect(persistedCard.locator("..")).toContainText(workOrderTitle);
  await expect(persistedCard.locator("..")).toContainText("GOVERNED");

  const accessibility = await new AxeBuilder({ page })
    .exclude('[data-sonner-toaster="true"]')
    .analyze();
  expect(
    accessibility.violations.filter((violation) => violation.impact === "critical")
  ).toEqual([]);

  await persistedCard.click();
  await page.getByRole("button", { name: workOrderTitle }).click();
  await expect(page.getByRole("heading", { name: "Work Orders" })).toBeVisible();
  await page.goBack();
  await expect(page.getByRole("heading", { name: "Tasks" })).toBeVisible();
  await page.goForward();
  await expect(page.getByRole("heading", { name: "Work Orders" })).toBeVisible();

  expect(pageErrors).toEqual([]);
  expect(consoleErrors).toEqual([]);
  expect(relevantRequestFailures).toEqual([]);
});
