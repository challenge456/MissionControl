import { mkdirSync, writeFileSync } from "node:fs";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  buildBackendArguments,
  buildResearchLabUiEnvironment,
  readEnvValue,
  RESEARCH_LAB_PROJECT_ID,
  resolveResearchLabRuntime,
  waitForResearchLabWorkspace,
} from "./research-lab-runtime.mjs";

function createFixture() {
  const root = mkdtempSync(path.join(tmpdir(), "mc-research-lab-runtime-"));
  const homeDir = path.join(root, "home");
  const cwd = path.join(root, "repo");
  const deploymentName = "local-mission-control-test";
  const stateDir = path.join(homeDir, ".convex", "convex-backend-state", deploymentName);
  const binaryDir = path.join(homeDir, ".cache", "convex", "binaries", "test-backend");
  mkdirSync(path.join(stateDir, "convex_local_storage"), { recursive: true });
  mkdirSync(binaryDir, { recursive: true });
  mkdirSync(cwd, { recursive: true });
  mkdirSync(path.join(cwd, "apps", "mission-control-ui"), { recursive: true });
  writeFileSync(path.join(cwd, "apps", "mission-control-ui", "package.json"), "{}");
  writeFileSync(path.join(cwd, ".env.local"), `CONVEX_DEPLOYMENT=local:${deploymentName} # local\n`);
  writeFileSync(
    path.join(stateDir, "config.json"),
    JSON.stringify({
      ports: { cloud: 3210, site: 3211 },
      backendVersion: "test-backend",
      adminKey: "must-not-be-forwarded",
      deploymentName,
      instanceSecret: "test-instance-secret",
    }),
  );
  writeFileSync(path.join(stateDir, "convex_local_backend.sqlite3"), "fixture");
  writeFileSync(path.join(binaryDir, "convex-local-backend"), "fixture");
  return { cwd, deploymentName, homeDir, stateDir };
}

describe("Research Lab runtime profile", () => {
  it("parses a local deployment without retaining an inline comment", () => {
    expect(readEnvValue("CONVEX_DEPLOYMENT=local:research-lab # team: local", "CONVEX_DEPLOYMENT"))
      .toBe("local:research-lab");
  });

  it("resolves the preserved central backend and stable workspace URL", () => {
    const fixture = createFixture();
    const runtime = resolveResearchLabRuntime(fixture);

    expect(runtime.stateDir).toBe(fixture.stateDir);
    expect(runtime.uiRoot).toBe(fixture.cwd);
    expect(runtime.convexUrl).toBe("http://127.0.0.1:3210");
    expect(runtime.workspaceUrl).toBe(
      `http://localhost:5199/v2/tasks?workspace=${RESEARCH_LAB_PROJECT_ID}`,
    );
  });

  it("uses an explicitly configured compatible UI checkout", () => {
    const fixture = createFixture();
    const uiRoot = path.join(path.dirname(fixture.cwd), "compatible-ui");
    mkdirSync(path.join(uiRoot, "apps", "mission-control-ui"), { recursive: true });
    writeFileSync(path.join(uiRoot, "apps", "mission-control-ui", "package.json"), "{}");

    const runtime = resolveResearchLabRuntime({
      ...fixture,
      env: { MISSION_CONTROL_RESEARCH_LAB_UI_ROOT: uiRoot },
    });

    expect(runtime.uiRoot).toBe(uiRoot);
  });

  it("recovers the canonical state when a demo run left a missing numeric deployment suffix", () => {
    const fixture = createFixture();
    writeFileSync(
      path.join(fixture.cwd, ".env.local"),
      `CONVEX_DEPLOYMENT=local:${fixture.deploymentName}-1 # stale demo suffix\n`,
    );

    const runtime = resolveResearchLabRuntime(fixture);

    expect(runtime.stateDir).toBe(fixture.stateDir);
    expect(runtime.deploymentName).toBe(fixture.deploymentName);
  });

  it("starts the backend from preserved storage without forwarding the admin key", () => {
    const runtime = resolveResearchLabRuntime(createFixture());
    const args = buildBackendArguments(runtime);

    expect(args).toContain(runtime.databasePath);
    expect(args).toContain(runtime.storagePath);
    expect(args).toContain("test-instance-secret");
    expect(args).not.toContain("must-not-be-forwarded");
  });

  it("forces the local legacy visibility profile without changing other environments", () => {
    const runtime = resolveResearchLabRuntime(createFixture());
    const environment = buildResearchLabUiEnvironment(runtime, { PATH: "/test/bin" });

    expect(environment).toMatchObject({
      PATH: "/test/bin",
      VITE_CONVEX_URL: "http://127.0.0.1:3210",
      VITE_FLAG_COMPANY_CONTEXT: "false",
      VITE_FLAG_UI_SHELL_V2: "true",
    });
  });

  it("fails closed when the preserved state is unavailable", () => {
    const root = mkdtempSync(path.join(tmpdir(), "mc-research-lab-missing-"));
    expect(() => resolveResearchLabRuntime({
      cwd: root,
      homeDir: root,
      env: { MISSION_CONTROL_RESEARCH_LAB_DEPLOYMENT: "missing" },
    })).toThrow("Research Lab backend config is missing");
  });

  it("waits through a transient query failure until the canonical workspace is ready", async () => {
    let attempts = 0;
    let clock = 0;

    await waitForResearchLabWorkspace({
      queryProjects: async () => {
        attempts += 1;
        if (attempts === 1) throw new Error("Function execution timed out");
        return [{ _id: RESEARCH_LAB_PROJECT_ID }];
      },
      now: () => clock,
      sleep: async (durationMs) => {
        clock += durationMs;
      },
      timeoutMs: 1_000,
    });

    expect(attempts).toBe(2);
  });

  it("fails closed when the canonical workspace never becomes queryable", async () => {
    let clock = 0;

    await expect(waitForResearchLabWorkspace({
      queryProjects: async () => [],
      now: () => clock,
      sleep: async (durationMs) => {
        clock += durationMs;
      },
      timeoutMs: 400,
    })).rejects.toThrow("canonical workspace did not become ready");
  });
});
