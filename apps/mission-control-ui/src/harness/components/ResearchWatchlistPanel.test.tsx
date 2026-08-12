import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ResearchWatchlistPanel } from "./ResearchWatchlistPanel";

const mocks = vi.hoisted(() => ({
  sources: [] as any[] | undefined,
  events: [] as any[],
  preview: {
    valid: false,
    activatable: false,
    errors: ["Local, private, reserved, and non-routable hosts are not permitted."],
    warnings: [],
    networkPolicy: { exactHostAllowlist: [] },
  } as any,
  createDraft: vi.fn(),
  validate: vi.fn(),
  acknowledgePolicy: vi.fn(),
  activate: vi.fn(),
  pause: vi.fn(),
  retire: vi.fn(),
  toast: vi.fn(),
}));

vi.mock("../../../../../convex/_generated/api", () => ({
  api: {
    researchSources: {
      listByProject: "researchSources.listByProject",
      listEvents: "researchSources.listEvents",
      previewValidation: "researchSources.previewValidation",
      createDraft: "researchSources.createDraft",
      validate: "researchSources.validate",
      acknowledgePolicy: "researchSources.acknowledgePolicy",
      activate: "researchSources.activate",
      pause: "researchSources.pause",
      retire: "researchSources.retire",
    },
  },
}));

vi.mock("convex/react", () => ({
  useQuery: (query: string) => {
    if (query === "researchSources.listByProject") return mocks.sources;
    if (query === "researchSources.listEvents") return mocks.events;
    if (query === "researchSources.previewValidation") return mocks.preview;
    return undefined;
  },
  useMutation: (mutation: string) => {
    const handlers: Record<string, ReturnType<typeof vi.fn>> = {
      "researchSources.createDraft": mocks.createDraft,
      "researchSources.validate": mocks.validate,
      "researchSources.acknowledgePolicy": mocks.acknowledgePolicy,
      "researchSources.activate": mocks.activate,
      "researchSources.pause": mocks.pause,
      "researchSources.retire": mocks.retire,
    };
    const handler = handlers[mutation];
    if (!handler) throw new Error(`Unexpected mutation: ${mutation}`);
    return handler;
  },
}));

vi.mock("../../Toast", () => ({
  useToast: () => ({ toast: mocks.toast }),
}));

function source(overrides: Record<string, unknown> = {}) {
  return {
    _id: "source-1",
    _creationTime: 1,
    tenantId: "tenant-1",
    projectId: "project-1",
    kind: "RSS_ATOM",
    locator: "https://example.com/feed.xml",
    canonicalProviderId: "rss_atom:https://example.com/feed.xml",
    canonicalUrl: "https://example.com/feed.xml",
    displayName: "Example engineering feed",
    state: "DRAFT",
    version: 1,
    ownerId: "operator-1",
    adapter: { name: "web-rss", version: "policy-preview-v1", authenticationMode: "NONE" },
    schedule: { cadence: "DAILY", timezone: "America/Los_Angeles" },
    freshnessTargetMinutes: 1440,
    maxItemsPerRun: 20,
    monthlyCostCeilingUsd: 5,
    retentionDays: 90,
    allowedContentClasses: ["Public feed item"],
    exclusions: ["Paywalled content"],
    consecutiveFailureCount: 0,
    validationStatus: "PENDING",
    policyReviewState: "DRAFT",
    policyVersion: "research-source-policy-v1",
    idempotencyKey: "source-one",
    createdBy: "operator-1",
    updatedBy: "operator-1",
    createdAt: 1,
    updatedAt: 1,
    ...overrides,
  };
}

describe("ResearchWatchlistPanel", () => {
  beforeEach(() => {
    mocks.sources = [];
    mocks.events = [];
    mocks.preview = {
      valid: false,
      activatable: false,
      errors: ["Local, private, reserved, and non-routable hosts are not permitted."],
      warnings: [],
      networkPolicy: { exactHostAllowlist: [] },
    };
    for (const mutation of [
      mocks.createDraft,
      mocks.validate,
      mocks.acknowledgePolicy,
      mocks.activate,
      mocks.pause,
      mocks.retire,
    ]) mutation.mockReset().mockResolvedValue({});
    mocks.toast.mockReset();
  });

  it("explains the no-authority state and keeps collection disabled", () => {
    render(<ResearchWatchlistPanel projectId={"project-1" as any} />);

    expect(screen.getByText("No approved source authority")).toBeInTheDocument();
    expect(screen.getByText(/fetching and schedules are off/i)).toBeInTheDocument();
  });

  it("previews and rejects a private target before draft creation", () => {
    render(<ResearchWatchlistPanel projectId={"project-1" as any} />);
    fireEvent.click(screen.getByRole("button", { name: "Add source" }));
    fireEvent.change(screen.getByLabelText("Display name"), { target: { value: "Unsafe feed" } });
    fireEvent.change(screen.getByLabelText("Exact public URL or provider handle"), {
      target: { value: "https://127.0.0.1/feed" },
    });

    expect(screen.getByRole("alert")).toHaveTextContent("Target rejected");
    expect(screen.getByRole("button", { name: "Create governed draft" })).toBeDisabled();
    expect(mocks.createDraft).not.toHaveBeenCalled();
  });

  it("exposes the gated lifecycle and records operator actions", async () => {
    mocks.sources = [
      source(),
      source({
        _id: "source-2",
        displayName: "Verified source",
        state: "VERIFIED",
        validationStatus: "PASSED",
        policyReviewState: "DRAFT",
      }),
      source({
        _id: "source-3",
        displayName: "Approved source",
        state: "VERIFIED",
        validationStatus: "PASSED",
        policyReviewState: "APPROVED",
      }),
      source({
        _id: "source-4",
        displayName: "Active source",
        state: "ACTIVE",
        validationStatus: "PASSED",
        policyReviewState: "APPROVED",
      }),
    ];
    render(<ResearchWatchlistPanel projectId={"project-1" as any} />);

    fireEvent.click(screen.getByRole("button", { name: "Validate" }));
    fireEvent.click(screen.getByRole("button", { name: "Approve policy" }));
    fireEvent.click(screen.getByRole("button", { name: "Activate authority" }));
    fireEvent.click(screen.getByRole("button", { name: "Pause" }));

    await waitFor(() => {
      expect(mocks.validate).toHaveBeenCalledWith({ projectId: "project-1", sourceId: "source-1" });
      expect(mocks.acknowledgePolicy).toHaveBeenCalledWith(expect.objectContaining({
        projectId: "project-1",
        sourceId: "source-2",
      }));
      expect(mocks.activate).toHaveBeenCalledWith({ projectId: "project-1", sourceId: "source-3" });
      expect(mocks.pause).toHaveBeenCalledWith(expect.objectContaining({
        projectId: "project-1",
        sourceId: "source-4",
      }));
    });
  });

  it("shows immutable decision history for the selected source", () => {
    mocks.sources = [source()];
    mocks.events = [{
      _id: "event-1",
      eventType: "DRAFT_CREATED",
      reason: "Research source draft created; no network request was made.",
      createdAt: Date.UTC(2026, 7, 11),
    }];
    render(<ResearchWatchlistPanel projectId={"project-1" as any} />);
    fireEvent.click(screen.getByRole("button", { name: "Example engineering feed" }));

    expect(screen.getByText("Immutable decisions")).toBeInTheDocument();
    expect(screen.getByText("Draft Created")).toBeInTheDocument();
    expect(screen.getByText(/no network request was made/i)).toBeInTheDocument();
  });
});
