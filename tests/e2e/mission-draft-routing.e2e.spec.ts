import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const WORKSPACE_ID = "sn71gskbdemgf4z1trt9zdmm5h8bde69";
const TITLE = "PR1 Browser Validation — Disposable Mission";
const APP_URL = process.env.MISSION_CONTROL_URL ?? "";
const EVIDENCE_DIR = path.resolve(
  "docs/testing/evidence/mission-draft-routing"
);

test.use({ trace: "off" });

test("Mission draft routing, persistence, scope, and accessibility", async ({
  page,
  context,
}, testInfo) => {
  test.setTimeout(120_000);
  await mkdir(EVIDENCE_DIR, { recursive: true });
  await context.tracing.start({ screenshots: true, snapshots: true, sources: true });
  const pageErrors: string[] = [];
  const failedRequests: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("requestfailed", (request) => {
    const failure = request.failure()?.errorText;
    if (failure !== "net::ERR_ABORTED" && !request.url().includes("/gateway/status")) {
      failedRequests.push(`${request.method()} ${request.url()} :: ${failure}`);
    }
  });

  try {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto(`${APP_URL}/v2/missions?workspace=${WORKSPACE_ID}`);
    await expect(page.getByRole("heading", { name: "Missions", exact: true })).toBeVisible({
      timeout: 20_000,
    });
    await page.screenshot({
      path: path.join(EVIDENCE_DIR, "01-portfolio-before-creation.png"),
      fullPage: true,
    });

    let missionCard = page.getByRole("button", { name: new RegExp(TITLE) });
    if (await missionCard.count() === 0) {
      await page.getByRole("button", { name: "Define mission" }).first().click();
      const dialog = page.getByRole("dialog", { name: "Define a Mission" });
      await dialog.getByLabel("Title").fill(TITLE);
      await dialog.getByLabel("Objective").fill(
        "Prove trustworthy Mission draft routing, persistence, and authorship."
      );
      await dialog.getByRole("button", { name: "Create draft" }).click();
      missionCard = page.getByRole("button", { name: new RegExp(TITLE) });
      await expect(missionCard).toBeVisible();
    }

    await expect(missionCard).toContainText("Draft");
    await expect(missionCard).toContainText("Planning not started");
    await expect(missionCard).not.toContainText("In progress");
    await page.screenshot({
      path: path.join(EVIDENCE_DIR, "02-truthful-draft-card.png"),
      fullPage: true,
    });

    await missionCard.click();
    await expect(page).toHaveURL(
      new RegExp(`/v2/missions/[^?]+\\?workspace=${WORKSPACE_ID}`)
    );
    const canonicalUrl = page.url();
    await expect(page.getByRole("heading", { name: TITLE, exact: true })).toBeVisible();

    const form = page.getByRole("form", { name: "Mission draft" });
    await form.getByLabel("Context").fill("Bounded PR 1 browser validation.");
    await form.getByLabel("Owner").fill("Mission Control Platform");
    if (await form.getByLabel("Constraint 1").count() === 0) {
      await form.getByRole("button", { name: "Add constraint" }).click();
    }
    await form.getByLabel("Constraint 1").fill("Do not change the Mission state machine.");
    if (await form.getByLabel("Source 1 kind").count() === 0) {
      await form.getByRole("button", { name: "Add source" }).click();
    }
    await form.getByLabel("Source 1 kind").selectOption("PRD");
    await form.getByLabel("Source 1 label").fill("PR 1 specification");
    await form.getByLabel("Source 1 location").fill(
      "docs/plans/2026-07-28-software-factory-enhancement-master-plan.md"
    );
    await form.getByLabel("Budget (USD)").fill("25");
    await form.getByLabel("Read-only concurrency").fill("3");
    await form.getByLabel("Corrective iterations").fill("1");
    await form.getByLabel("Stop condition").fill(
      "Stop when the focused Mission browser journey passes."
    );
    const saveDraft = form.getByRole("button", { name: "Save draft" });
    if (await saveDraft.isEnabled()) {
      await expect(form.getByText("Unsaved changes")).toBeVisible();
      await saveDraft.click();
      await expect(form.getByRole("status")).toContainText("Saved");
    } else {
      await expect(form.getByRole("status")).toContainText("No unsaved changes");
    }
    await page.screenshot({
      path: path.join(EVIDENCE_DIR, "03-canonical-completed-draft.png"),
      fullPage: true,
    });

    await page.reload();
    await expect(page.getByRole("heading", { name: TITLE, exact: true })).toBeVisible({
      timeout: 20_000,
    });
    await expect(page.getByLabel("Context")).toHaveValue(
      "Bounded PR 1 browser validation."
    );
    await expect(page.getByLabel("Budget (USD)")).toHaveValue("25");
    await expect(page.getByLabel("Read-only concurrency")).toHaveValue("3");
    await page.screenshot({
      path: path.join(EVIDENCE_DIR, "04-persisted-after-refresh.png"),
      fullPage: true,
    });

    await page.goBack();
    await expect(page.getByRole("heading", { name: "Missions", exact: true })).toBeVisible();
    await page.goForward();
    await expect(page.getByRole("heading", { name: TITLE, exact: true })).toBeVisible();
    await page.goto(canonicalUrl);
    await expect(page.getByRole("heading", { name: TITLE, exact: true })).toBeVisible();

    const budget = page.getByLabel("Budget (USD)");
    await budget.fill("-1");
    await form.getByRole("button", { name: "Save draft" }).click();
    await expect(page.getByRole("alert")).toContainText(
      "Budget must be zero or greater."
    );
    await expect(budget).toHaveAttribute("aria-invalid", "true");
    await budget.fill("25");
    await expect(form.getByRole("status")).toContainText("No unsaved changes");

    await page.getByRole("tab", { name: "Activity" }).click();
    await expect(page.getByText("MISSION_DRAFT_UPDATED")).toHaveCount(1);

    const workspace = page.getByRole("combobox", { name: "Workspace" }).first();
    const alternateWorkspace = await workspace.locator("option").evaluateAll(
      (options, active) =>
        options.map((option) => (option as HTMLOptionElement).value)
          .find((value) => value && value !== active),
      WORKSPACE_ID
    );
    expect(alternateWorkspace, "A second workspace is required for scope validation").toBeTruthy();
    await workspace.selectOption(alternateWorkspace!);
    await expect(
      page.getByText("Mission outside active workspace", { exact: true })
    ).toBeVisible();
    await page.screenshot({
      path: path.join(EVIDENCE_DIR, "05-workspace-scope-mismatch.png"),
      fullPage: true,
    });

    await page.goto(canonicalUrl);
    await page.setViewportSize({ width: 390, height: 844 });
    await expect(page.getByRole("heading", { name: TITLE, exact: true })).toBeVisible();
    await page.screenshot({
      path: path.join(EVIDENCE_DIR, "06-narrow-viewport.png"),
      fullPage: true,
    });

    const axeResults = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
      .analyze();
    await testInfo.attach("mission-draft-axe-results", {
      body: JSON.stringify(axeResults, null, 2),
      contentType: "application/json",
    });
    expect(
      axeResults.violations.filter((violation) => violation.impact === "critical")
    ).toEqual([]);
    expect(pageErrors).toEqual([]);
    expect(failedRequests).toEqual([]);
  } finally {
    await context.tracing.stop({
      path: path.join(EVIDENCE_DIR, "mission-draft-routing-trace.zip"),
    });
  }
});
