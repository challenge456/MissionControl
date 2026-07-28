import { expect, test, type Page } from "@playwright/test";

function watchPage(page: Page) {
  const pageErrors: string[] = [];
  const requestFailures: string[] = [];

  const onPageError = (error: Error) => pageErrors.push(error.message);
  const onRequestFailed = (request: { method(): string; url(): string; failure(): { errorText?: string } | null }) => {
    const errorText = request.failure()?.errorText;
    const url = request.url();
    if (errorText === "net::ERR_ABORTED") return;
    if (url.includes("/gateway/status")) return;
    requestFailures.push(`${request.method()} ${url} :: ${errorText}`);
  };

  page.on("pageerror", onPageError);
  page.on("requestfailed", onRequestFailed);

  return {
    pageErrors,
    requestFailures,
    dispose() {
      page.off("pageerror", onPageError);
      page.off("requestfailed", onRequestFailed);
    },
  };
}

test("control work orders happy path creates and dispatches a work order", async ({ page }) => {
  const title = `Dogfood verification work order ${Date.now()}`;
  const capture = watchPage(page);

  try {
    await page.goto("/v2/control-work-orders");
    await expect(page.getByRole("main")).toHaveCount(1);
    await expect(page.getByRole("heading", { name: "Work Orders", exact: true })).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole("button", { name: "New WorkOrder", exact: true })).toBeVisible({ timeout: 15000 });

    await page.getByRole("button", { name: "New WorkOrder", exact: true }).click();
    const dialog = page.getByRole("dialog");

    await dialog.getByPlaceholder("Work order title").fill(title);
    await dialog
      .getByPlaceholder("What value should be delivered?")
      .fill("Verify MissionControl happy path from UI creation through queue visibility.");
    await dialog
      .getByPlaceholder("Business or engineering context")
      .fill("Created during Pi continuation of Hermes dogfood pass against local seeded demo data.");
    await dialog
      .getByPlaceholder(/One criterion per line/)
      .fill("WorkOrder appears in queue\nDispatch creates linked run");

    await dialog.getByRole("button", { name: "Create WorkOrder", exact: true }).click();
    await expect(dialog).toBeHidden({ timeout: 15_000 });
    await expect(page.getByText(title, { exact: false }).first()).toBeVisible({ timeout: 15_000 });

    const dispatchButton = page.getByRole("button", { name: "Dispatch", exact: true });
    await expect(dispatchButton).toBeEnabled();
    await dispatchButton.click();

    await expect(page.getByRole("button", { name: "Inspect run", exact: true })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(title, { exact: false }).first()).toBeVisible();

    expect(capture.pageErrors).toEqual([]);
    expect(capture.requestFailures).toEqual([]);
  } finally {
    capture.dispose();
  }
});

test("work orders quick filters surface operator actions", async ({ page }) => {
  const capture = watchPage(page);

  try {
    await page.goto("/v2/control-work-orders");
    await expect(page.getByRole("button", { name: /Needs attention/i })).toBeVisible();
    await expect(page.getByText(/Next action:/i).first()).toBeVisible();

    await page.getByRole("button", { name: /Blocked/i }).click();
    await expect(page.getByText(/No work orders match the current filters.|BLOCKED/i).first()).toBeVisible();

    await page.getByRole("button", { name: /Awaiting approval/i }).click();
    await expect(page.getByText(/Review approval|No work orders match the current filters./i).first()).toBeVisible();

    expect(capture.pageErrors).toEqual([]);
    expect(capture.requestFailures).toEqual([]);
  } finally {
    capture.dispose();
  }
});

test("live chat shows explicit degraded state when orchestration is unavailable", async ({ page }) => {
  const capture = watchPage(page);

  try {
    await page.route("**/gateway/status", async (route) => {
      await route.fulfill({ status: 503, body: JSON.stringify({ error: "gateway unavailable in e2e" }) });
    });

    await page.goto("/v2/live-chat");
    await expect(page.getByRole("heading", { name: "Live Agent Chat", exact: true })).toBeVisible();
    await expect(page.getByText(/Degraded mode/i)).toBeVisible();
    await expect(page.getByText(/showing demo data/i)).toBeVisible();
    await expect(page.getByPlaceholder(/Connect to orchestration server to send messages/i)).toBeVisible();

    expect(capture.pageErrors).toEqual([]);
    expect(capture.requestFailures).toEqual([]);
  } finally {
    capture.dispose();
  }
});
