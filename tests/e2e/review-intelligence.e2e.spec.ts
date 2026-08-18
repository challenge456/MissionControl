import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Locator, type Page, type TestInfo } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const APP_URL = process.env.MISSION_CONTROL_URL ?? "";
const WORKSPACE_ID = process.env.REVIEW_INTELLIGENCE_WORKSPACE_ID ?? "";
const WORK_ORDER_ID = process.env.REVIEW_INTELLIGENCE_WORK_ORDER_ID ?? "";
const EVIDENCE_DIR = path.resolve("docs/testing/evidence/review-intelligence-v1");
const SCREENSHOT_DIR = path.join(EVIDENCE_DIR, "screenshots");
const WCAG_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

type BrowserEvidence = {
  appUrl: string;
  workspaceId: string;
  workOrderId: string;
  surfaces: string[];
  screenshots: string[];
  accessibility: Array<{
    surface: string;
    passes: number;
    incomplete: number;
    violations: Array<{ id: string; impact: string | null; nodes: number }>;
  }>;
  consoleErrors: string[];
  pageErrors: string[];
  failedRequests: string[];
  matrix: {
    viewports: string[];
    themes: string[];
    experienceLevels: string[];
    navigation: string[];
  };
};

function watchPage(page: Page) {
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];
  const failedRequests: string[] = [];

  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("requestfailed", (request) => {
    const failure = request.failure()?.errorText;
    if (failure !== "net::ERR_ABORTED" && !request.url().includes("/gateway/status")) {
      failedRequests.push(`${request.method()} ${request.url()} :: ${failure}`);
    }
  });

  return { consoleErrors, pageErrors, failedRequests };
}

async function setTheme(page: Page, theme: "dark" | "light") {
  await page.evaluate((nextTheme) => window.localStorage.setItem("mc.theme", nextTheme), theme);
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
}

async function expectNoHorizontalOverflow(page: Page, packageElement: Locator) {
  const pageOverflow = await page.evaluate(() => ({
    viewport: window.innerWidth,
    document: document.documentElement.scrollWidth,
  }));
  expect(pageOverflow.document, `Page overflow: ${JSON.stringify(pageOverflow)}`).toBeLessThanOrEqual(pageOverflow.viewport + 1);

  const packageOverflow = await packageElement.evaluate((element) => ({
    client: element.clientWidth,
    scroll: element.scrollWidth,
  }));
  expect(packageOverflow.scroll, `Review Package overflow: ${JSON.stringify(packageOverflow)}`).toBeLessThanOrEqual(packageOverflow.client + 1);
}

async function capture(page: Page, evidence: BrowserEvidence, name: string) {
  const fileName = `${name}.png`;
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, fileName) });
  evidence.screenshots.push(`screenshots/${fileName}`);
}

async function auditPackage(page: Page, testInfo: TestInfo, evidence: BrowserEvidence, surface: string) {
  const results = await new AxeBuilder({ page })
    .include("#run-review-package")
    .withTags(WCAG_TAGS)
    .analyze();
  await testInfo.attach(`${surface}-axe-results`, {
    body: JSON.stringify(results, null, 2),
    contentType: "application/json",
  });
  evidence.accessibility.push({
    surface,
    passes: results.passes.length,
    incomplete: results.incomplete.length,
    violations: results.violations.map((violation) => ({
      id: violation.id,
      impact: violation.impact,
      nodes: violation.nodes.length,
    })),
  });
  expect(
    results.violations.filter((violation) => violation.impact === "critical" || violation.impact === "serious"),
    `${surface} has serious or critical WCAG A/AA violations`
  ).toEqual([]);
}

test("evidence-first review stays exact, progressive, and readable", async ({ page }, testInfo) => {
  test.skip(!APP_URL || !WORKSPACE_ID || !WORK_ORDER_ID, "Set the local app URL and exact review fixture IDs.");
  test.setTimeout(180_000);
  await mkdir(SCREENSHOT_DIR, { recursive: true });

  const watch = watchPage(page);
  const evidence: BrowserEvidence = {
    appUrl: APP_URL,
    workspaceId: WORKSPACE_ID,
    workOrderId: WORK_ORDER_ID,
    surfaces: [],
    screenshots: [],
    accessibility: [],
    consoleErrors: watch.consoleErrors,
    pageErrors: watch.pageErrors,
    failedRequests: watch.failedRequests,
    matrix: {
      viewports: ["1440x900", "1024x768", "390x844"],
      themes: ["light", "dark"],
      experienceLevels: ["Basic", "Intermediate", "Advanced"],
      navigation: ["direct URL", "refresh", "back", "forward", "keyboard focus"],
    },
  };
  const reviewUrl = `${APP_URL}/v2/control-work-orders?workspace=${WORKSPACE_ID}&workOrder=${WORK_ORDER_ID}`;

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(reviewUrl);
  await setTheme(page, "light");
  const reviewPackage = page.locator("#run-review-package");
  await expect(reviewPackage).toBeVisible({ timeout: 30_000 });
  await expect(reviewPackage.getByText("Review evidence package", { exact: true })).toBeVisible();
  await expect(reviewPackage.getByRole("button", { name: "Basic", exact: true })).toHaveAttribute("aria-pressed", "true");
  await expect(reviewPackage.getByText("01 · Intent", { exact: true })).toBeVisible();
  await expect(reviewPackage.getByText("02 · Acceptance criteria and evidence", { exact: true })).toBeVisible();
  await expect(reviewPackage.getByText("Raw diff remains available", { exact: true })).toBeVisible();
  await expect(reviewPackage.getByText("Approval here is not WorkOrder acceptance.", { exact: false })).toBeVisible();
  await expect(reviewPackage.getByText("Server-owned WorkOrder verification evidence is stale.", { exact: true })).toBeVisible();
  await expect(reviewPackage.getByText("STALE", { exact: true }).first()).toBeVisible();
  await expect(reviewPackage.getByText("VERIFIED", { exact: true }).first()).toBeVisible();
  await expect(reviewPackage.getByRole("link", { name: "Open raw diff", exact: true })).toHaveAttribute(
    "href",
    "https://github.com/jaydubya818/MissionControl/pull/84/files"
  );
  await reviewPackage.getByRole("button", { name: "Inspect exact evidence", exact: true }).first().click();
  const runInspector = page.getByRole("dialog", { name: "Execution Run Inspector" });
  await expect(runInspector).toBeVisible();
  await expect(runInspector.getByText("Evidence drill-down", { exact: true })).toBeVisible();
  await runInspector.getByRole("button", { name: "Close" }).click();
  await expect(runInspector).not.toBeVisible();
  await expectNoHorizontalOverflow(page, reviewPackage);
  await reviewPackage.scrollIntoViewIfNeeded();
  await capture(page, evidence, "01-basic-1440-light");
  await auditPackage(page, testInfo, evidence, "basic-1440-light");
  evidence.surfaces.push("basic intent, criterion evidence drill-through, stale gate, raw diff");

  await reviewPackage.getByRole("button", { name: "Intermediate", exact: true }).click();
  await expect(reviewPackage.getByRole("button", { name: "Intermediate", exact: true })).toHaveAttribute("aria-pressed", "true");
  await expect(reviewPackage.getByRole("heading", { name: "Failed and recovered work", exact: true })).toBeVisible();
  await expect(reviewPackage.getByRole("heading", { name: "Implementation decisions", exact: true })).toBeVisible();
  await expect(reviewPackage.getByRole("heading", { name: "Semantic change groups", exact: true })).toBeVisible();
  await expect(reviewPackage.getByRole("heading", { name: "Residual risk and advisory findings", exact: true })).toBeVisible();
  await expectNoHorizontalOverflow(page, reviewPackage);
  await capture(page, evidence, "02-intermediate-1440-light");
  evidence.surfaces.push("intermediate recovery, decisions, semantic groups, advisory residuals");

  await page.setViewportSize({ width: 1024, height: 768 });
  await setTheme(page, "dark");
  await expect(reviewPackage).toBeVisible({ timeout: 30_000 });
  await reviewPackage.getByRole("button", { name: "Advanced", exact: true }).click();
  await expect(reviewPackage.getByRole("heading", { name: "Canonical IDs, digests, and currentness", exact: true })).toBeVisible();
  await expect(reviewPackage.getByText("workOrders.accept", { exact: true })).toBeVisible();
  await expect(reviewPackage.getByText("NOT CURRENT", { exact: true })).toBeVisible();
  await expectNoHorizontalOverflow(page, reviewPackage);
  await reviewPackage.scrollIntoViewIfNeeded();
  await capture(page, evidence, "03-advanced-1024-dark");
  await auditPackage(page, testInfo, evidence, "advanced-1024-dark");
  evidence.surfaces.push("advanced exact IDs, digests, currentness, authority");

  await page.reload();
  await expect(page.locator("#run-review-package")).toBeVisible({ timeout: 30_000 });
  await page.goto(`${APP_URL}/v2/control-work-orders?workspace=${WORKSPACE_ID}`);
  await page.goBack();
  await expect(page.locator("#run-review-package")).toBeVisible({ timeout: 30_000 });
  await page.goForward();
  await expect(page.getByRole("heading", { name: "Work Orders", exact: true })).toBeVisible();
  await page.goBack();
  await expect(page.locator("#run-review-package")).toBeVisible({ timeout: 30_000 });

  await page.setViewportSize({ width: 390, height: 844 });
  await setTheme(page, "light");
  const mobilePackage = page.locator("#run-review-package");
  await expect(mobilePackage).toBeVisible({ timeout: 30_000 });
  await mobilePackage.getByRole("button", { name: "Basic", exact: true }).focus();
  await expect(mobilePackage.getByRole("button", { name: "Basic", exact: true })).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(page.locator(":focus")).toBeVisible();
  await expectNoHorizontalOverflow(page, mobilePackage);
  await mobilePackage.scrollIntoViewIfNeeded();
  await capture(page, evidence, "04-basic-390-light");
  await auditPackage(page, testInfo, evidence, "basic-390-light");
  evidence.surfaces.push("mobile basic review and keyboard focus");

  expect(watch.consoleErrors).toEqual([]);
  expect(watch.pageErrors).toEqual([]);
  expect(watch.failedRequests).toEqual([]);

  await writeFile(path.join(EVIDENCE_DIR, "browser-evidence.json"), `${JSON.stringify(evidence, null, 2)}\n`, "utf8");
});
