import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const APP_URL = process.env.MISSION_CONTROL_URL ?? "http://127.0.0.1:5199";
const INVALID_WORKSPACE = "w17bnnjbwzws1rdyvg97s9cwxd8bfda8";
const RESEARCH_LAB = "sn71gskbdemgf4z1trt9zdmm5h8bde69";
const WARNING =
  "The requested workspace was unavailable. Mission Control opened an accessible workspace instead.";
const EVIDENCE = path.resolve("docs/testing/evidence/docs-workspace-routing");

test.use({ trace: "off" });

test("invalid Docs workspace fails closed, preserves route state, and remains stable", async ({
  page,
  context,
}) => {
  await mkdir(EVIDENCE, { recursive: true });
  await context.tracing.start({ screenshots: true, snapshots: true, sources: true });
  const pageErrors: string[] = [];
  const failedRequests: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("requestfailed", (request) => {
    if (!request.url().includes("/gateway/status")) {
      failedRequests.push(`${request.method()} ${request.url()} ${request.failure()?.errorText}`);
    }
  });

  try {
    await page.goto(`${APP_URL}/v2/docs?workspace=${RESEARCH_LAB}`);
    await expect(page.getByRole("heading", { name: "Documentation" })).toBeVisible();

    await page.goto(
      `${APP_URL}/v2/docs?workspace=${INVALID_WORKSPACE}` +
        "&doc=sfe-overview&mission=m1&task=t1&workOrder=w1&tab=evidence&filters=open"
    );
    await expect(page.getByText(WARNING, { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Close toast" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Documentation" })).toBeVisible();
    await expect(page).not.toHaveURL(new RegExp(INVALID_WORKSPACE));
    for (const parameter of [
      "doc=sfe-overview",
      "mission=m1",
      "task=t1",
      "workOrder=w1",
      "tab=evidence",
      "filters=open",
    ]) {
      await expect(page).toHaveURL(new RegExp(parameter));
    }

    await page.screenshot({
      path: path.join(EVIDENCE, "docs-001-recovered.png"),
      fullPage: true,
    });
    const accessibility = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
      .analyze();
    expect(accessibility.violations.filter((item) => item.impact === "critical")).toEqual([]);

    await page.getByRole("button", { name: "Close toast" }).click();
    await page.reload();
    await expect(page.getByText(WARNING, { exact: true })).toHaveCount(0);
    await expect(page.getByRole("heading", { name: "Documentation" })).toBeVisible();

    await page.goBack();
    await expect(page).toHaveURL(new RegExp(`workspace=${RESEARCH_LAB}`));
    await page.goForward();
    await expect(page).not.toHaveURL(new RegExp(INVALID_WORKSPACE));
    await expect(page.getByRole("heading", { name: "Documentation" })).toBeVisible();

    expect(pageErrors).toEqual([]);
    expect(failedRequests).toEqual([]);
  } finally {
    await context.tracing.stop({
      path: path.join(EVIDENCE, "docs-001-workspace-routing-trace.zip"),
    });
  }
});
