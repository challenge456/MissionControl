import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

const workspaceId = "sn71gskbdemgf4z1trt9zdmm5h8bde69";
const workOrderId = "yh72sn2jp02by6b2zr23pr01dh8bd4nb";
const workOrderTitle =
  "Run an evidence-backed accessibility audit of the Software Factory critical j…";
const evidenceDir = "docs/testing/evidence/task-attempt-scheduler";

test("operator schedules and retries one governed Task Attempt", async ({
  page,
}) => {
  test.setTimeout(120_000);
  const convex = new ConvexHttpClient("http://127.0.0.1:3210");
  const suffix = Date.now().toString(36);
  const taskTitle = `Scheduler browser evidence ${suffix}`;
  const pageErrors: string[] = [];
  const consoleErrors: string[] = [];
  const relevantRequestFailures: string[] = [];

  const activeRuns = (
    await Promise.all(
      ["PENDING", "RUNNING", "PAUSED"].map((status) =>
        convex.query(api.workflowRuns.list, {
          projectId: workspaceId as Id<"projects">,
          status,
          limit: 100,
        }),
      ),
    )
  )
    .flat()
    .filter((run) => run.workOrderId === workOrderId);
  for (const run of activeRuns) {
    await convex.mutation(api.workflowRuns.updateStatus, {
      runId: run.runId,
      status: "FAILED",
      failureReason: "Closed by the deterministic scheduler browser fixture.",
    });
  }

  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("requestfailed", (request) => {
    if (
      !request.url().includes("/gateway/status") &&
      !request.url().includes("fonts.gstatic.com")
    ) {
      relevantRequestFailures.push(
        `${request.method()} ${request.url()} ${request.failure()?.errorText ?? ""}`,
      );
    }
  });

  await page.goto(
    `/v2/control-work-orders?workspace=${workspaceId}&workOrder=${workOrderId}`,
  );
  await expect(page.getByRole("heading", { name: "Work Orders" })).toBeVisible({
    timeout: 30_000,
  });
  await expect(page.getByText(workOrderTitle).first()).toBeVisible();

  await page.getByRole("button", { name: "New Task" }).first().click();
  const createDialog = page.getByRole("dialog", { name: "Create Task" });
  await expect(createDialog).toBeVisible();
  await createDialog.getByRole("textbox", { name: "Title" }).fill(taskTitle);
  await createDialog
    .getByRole("textbox", { name: "Description" })
    .fill("Verify explicit Task Attempt scheduling and reasoned retry.");
  await createDialog.getByRole("button", { name: "Create Task" }).click();
  await expect(createDialog).toBeHidden();
  await expect(page.getByText(taskTitle)).toBeVisible();

  await page.getByRole("button", { name: /^Tasks \d+$/ }).click();
  const taskCard = page.getByRole("button", {
    name: `Open task ${taskTitle}`,
  });
  await expect(taskCard).toHaveCount(1);
  await taskCard.click();
  await expect(
    page.getByText("Assign this Task before starting an Attempt."),
  ).toBeVisible();
  await page.getByRole("button", { name: "Assign", exact: true }).click();
  await expect(
    page.getByText("ASSIGNED", { exact: true }).first(),
  ).toBeVisible();

  const tasks = await convex.query(api.tasks.list, {
    projectId: workspaceId as Id<"projects">,
  });
  const createdTask = tasks.find((task) => task.title === taskTitle);
  expect(createdTask).toBeTruthy();
  const taskId = createdTask!._id;

  await page.getByRole("button", { name: workOrderTitle }).click();
  const dispatchButton = page.getByRole("button", {
    name: "Dispatch",
    exact: true,
  });
  await expect(dispatchButton).toBeDisabled();
  await page.getByLabel("Task to execute").click();
  await page.getByRole("option", { name: new RegExp(taskTitle) }).click();
  await expect(dispatchButton).toBeEnabled();
  await page.screenshot({
    path: `${evidenceDir}/01-explicit-task-selection.png`,
    fullPage: true,
  });
  await dispatchButton.click();
  await expect(page.getByText(`Task: ${taskTitle}`)).toBeVisible();

  await page.getByRole("button", { name: /^Tasks \d+$/ }).click();
  const oneCardAfterStart = page.getByRole("button", {
    name: `Open task ${taskTitle}`,
  });
  await expect(oneCardAfterStart).toHaveCount(1);
  await oneCardAfterStart.click();
  const taskDrawer = page.getByLabel(taskTitle, { exact: true });
  const firstAttemptLabel = taskDrawer.getByText(/Attempt 1 · PENDING/);
  await expect(firstAttemptLabel).toBeVisible();
  await firstAttemptLabel.scrollIntoViewIfNeeded();
  await page.screenshot({
    path: `${evidenceDir}/02-first-attempt.png`,
    fullPage: true,
  });

  const firstDetail = await convex.query(api.tasks.getWithTimeline, { taskId });
  const firstAttempts = firstDetail?.workflowAttempts ?? [];
  const firstAttempt = firstAttempts[firstAttempts.length - 1];
  expect(firstAttempt?.parentTaskId).toBe(taskId);
  await convex.mutation(api.workflowRuns.updateStatus, {
    runId: firstAttempt!.runId,
    status: "FAILED",
    failureReason:
      "Deterministic browser fixture failure before governed retry.",
  });
  await expect(taskDrawer.getByText(/Attempt 1 · FAILED/)).toBeVisible();

  const retryReason = taskDrawer.getByLabel("Recovery reason");
  await retryReason.fill("The deterministic fixture failure was corrected.");
  const retryButton = taskDrawer.getByRole("button", {
    name: "Retry Attempt",
  });
  await expect(retryButton).toBeEnabled();
  await retryButton.click();
  await expect(taskDrawer.getByText(/Attempt 2 · PENDING/)).toBeVisible();
  await expect(taskDrawer.getByText("2 total · 1 retries")).toBeVisible();
  await expect(
    taskDrawer.getByRole("button", { name: "Retry Attempt" }),
  ).toHaveCount(0);
  await page.screenshot({
    path: `${evidenceDir}/03-retry-preserves-history.png`,
    fullPage: true,
  });

  const secondDetail = await convex.query(api.tasks.getWithTimeline, {
    taskId,
  });
  expect(secondDetail?.workflowAttempts).toHaveLength(2);
  expect(secondDetail?.workflowAttempts[0]._id).toBe(firstAttempt?._id);
  expect(secondDetail?.workflowAttempts[1].parentTaskId).toBe(taskId);

  const accessibility = await new AxeBuilder({ page })
    .exclude('[data-sonner-toaster="true"]')
    .analyze();
  expect(
    accessibility.violations.filter(
      (violation) => violation.impact === "critical",
    ),
  ).toEqual([]);

  await page.reload();
  const persistedCard = page.getByRole("button", {
    name: `Open task ${taskTitle}`,
  });
  await expect(persistedCard).toHaveCount(1);
  await persistedCard.click();
  const reloadedDrawer = page.getByLabel(taskTitle, { exact: true });
  await expect(reloadedDrawer.getByText(/Attempt 2 · PENDING/)).toBeVisible();
  await reloadedDrawer.getByRole("button", { name: "Close" }).click();
  await expect(persistedCard).toHaveCount(1);
  await expect(persistedCard.locator("..")).toContainText("Attempt 2");
  await expect(persistedCard.locator("..")).toContainText("1 retry");

  await persistedCard.click();
  await page.getByRole("button", { name: workOrderTitle }).click();
  await expect(page).toHaveURL(new RegExp(`workOrder=${workOrderId}`));
  await page.goBack();
  await expect(page.getByRole("heading", { name: "Tasks" })).toBeVisible();
  await page.goForward();
  await expect(
    page.getByRole("heading", { name: "Work Orders" }),
  ).toBeVisible();

  expect(pageErrors).toEqual([]);
  expect(consoleErrors).toEqual([]);
  expect(relevantRequestFailures).toEqual([]);
});
