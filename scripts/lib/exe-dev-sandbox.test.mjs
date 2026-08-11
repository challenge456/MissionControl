import { describe, expect, it, vi } from "vitest";
import {
  assertExpectedHostFingerprint,
  assertLiveCanaryAllowed,
  buildCreateVmCommand,
  buildRemoveVmCommand,
  buildSshArguments,
  EXE_DEV_HOST_FINGERPRINT,
  findAutoAllIntegrations,
  generateCanaryVmName,
  inventoryHasVm,
  readExeDevReadiness,
  redactProviderText,
  runLifecycleCanary,
  summarizeReadiness,
} from "./exe-dev-sandbox.mjs";

const CANARY_NAME = "mc-sbx-doctor-20260810t120000z-a1b2c3d4";

describe("exe.dev sandbox doctor contracts", () => {
  it("accepts only the provider-published SSH fingerprint", () => {
    expect(
      assertExpectedHostFingerprint(
        `2048 ${EXE_DEV_HOST_FINGERPRINT} exe.dev (RSA)`,
      ),
    ).toBe(EXE_DEV_HOST_FINGERPRINT);

    expect(() =>
      assertExpectedHostFingerprint(
        "2048 SHA256:AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA exe.dev (RSA)",
      ),
    ).toThrow("fingerprint mismatch");
  });

  it("builds batch-only SSH arguments with strict host checking", () => {
    const args = buildSshArguments({
      knownHostsFile: "/tmp/mc-known-hosts",
      identityFile: "/tmp/mc-exedev-key",
      remoteCommand: ["ls", "--json"],
    });

    expect(args).toContain("BatchMode=yes");
    expect(args).toContain("StrictHostKeyChecking=yes");
    expect(args).toContain("UserKnownHostsFile=/tmp/mc-known-hosts");
    expect(args).toContain("IdentitiesOnly=yes");
    expect(args.slice(-3)).toEqual(["exe.dev", "ls", "--json"]);
    expect(args).not.toContain("StrictHostKeyChecking=no");
  });

  it("creates only a credential-free, exactly named canary", () => {
    const command = buildCreateVmCommand(CANARY_NAME);

    expect(command).toContain(`--name=${CANARY_NAME}`);
    expect(command).toContain("--tag=mission-control-sandbox-doctor");
    expect(command).toContain("--no-email");
    expect(command.some((part) => part.startsWith("--env"))).toBe(false);
    expect(command.some((part) => part.startsWith("--integration"))).toBe(false);
    expect(buildRemoveVmCommand(CANARY_NAME)).toEqual([
      "rm",
      CANARY_NAME,
      "--json",
    ]);
    expect(() => buildRemoveVmCommand("*")).toThrow("exact Mission Control doctor namespace");
  });

  it("generates a stable provider-safe canary namespace", () => {
    expect(
      generateCanaryVmName({
        now: new Date("2026-08-10T12:00:00.000Z"),
        randomSuffix: "A1B2C3D4",
      }),
    ).toBe(CANARY_NAME);
  });

  it("detects automatic integration attachments without returning secrets", () => {
    const matches = findAutoAllIntegrations({
      integrations: [
        {
          name: "llm",
          type: "llm",
          attachments: ["auto:all"],
          secret: "sk-or-v1-must-not-surface",
        },
        {
          name: "github-readonly",
          type: "github",
          attachments: ["vm:safe"],
        },
      ],
    });

    expect(matches).toEqual([{ name: "llm", type: "llm" }]);
    expect(JSON.stringify(matches)).not.toContain("must-not-surface");
  });

  it("requires the CLI flag and environment opt-in for live allocation", () => {
    expect(
      assertLiveCanaryAllowed({ lifecycleCanary: false, env: {} }),
    ).toBe(false);
    expect(() =>
      assertLiveCanaryAllowed({ lifecycleCanary: true, env: {} }),
    ).toThrow("Live allocation is disabled");
    expect(
      assertLiveCanaryAllowed({
        lifecycleCanary: true,
        env: { MISSION_CONTROL_SANDBOX_LIVE: "1" },
      }),
    ).toBe(true);
  });

  it("redacts provider, model, GitHub, and authorization credentials", () => {
    const redacted = redactProviderText(
      "exe0.payload.signature sk-or-v1-secret ghp_secret Authorization:BearerSecret",
    );

    expect(redacted).not.toContain("payload.signature");
    expect(redacted).not.toContain("sk-or-v1-secret");
    expect(redacted).not.toContain("ghp_secret");
    expect(redacted).not.toContain("BearerSecret");
  });

  it("recognizes exact VM inventory records", () => {
    expect(
      inventoryHasVm({ vms: [{ vm_name: CANARY_NAME }] }, CANARY_NAME),
    ).toBe(true);
    expect(
      inventoryHasVm({ vms: [{ vm_name: `${CANARY_NAME}-other` }] }, CANARY_NAME),
    ).toBe(false);
  });

  it("runs only the approved read-only provider inventory commands", async () => {
    const commands = [];
    const client = {
      verifyAndTrustHost: vi.fn(),
      lobbyJson(command) {
        commands.push(command);
        if (command[0] === "ls") return { vms: [] };
        if (command[0] === "integrations") return { integrations: [] };
        if (command[0] === "billing" && command[1] === "plan") {
          return { max_vms: 2 };
        }
        return {};
      },
    };

    await expect(readExeDevReadiness(client)).resolves.toMatchObject({
      authenticated: true,
      vmCount: 0,
      liveAllocationAllowed: true,
    });
    expect(commands).toEqual([
      ["whoami", "--json"],
      ["ls", "--json"],
      ["billing", "plan", "--json"],
      ["billing", "usage", "--range=24h", "--json"],
      ["integrations", "list", "--json", "--usage"],
    ]);
  });

  it("blocks allocation when the provider plan has no VM capacity", () => {
    expect(
      summarizeReadiness({
        vms: { vms: [] },
        plan: { max_vms: 0 },
        usage: {},
        integrations: { integrations: [] },
      }),
    ).toMatchObject({
      maxVms: 0,
      providerCapacityAvailable: false,
      liveAllocationAllowed: false,
    });
  });

  it("removes and verifies the exact VM even when the canary workload fails", async () => {
    const commands = [];
    let removed = false;
    const client = {
      lobbyJson(command) {
        commands.push(command);
        if (command[0] === "new") return { vm_name: CANARY_NAME };
        if (command[0] === "rm") {
          removed = true;
          return { removed: [CANARY_NAME] };
        }
        if (command[0] === "ls" && command[1] === CANARY_NAME) {
          return { vms: [{ vm_name: CANARY_NAME, status: "running" }] };
        }
        if (command[0] === "ls") {
          return {
            vms: removed ? [] : [{ vm_name: CANARY_NAME, status: "running" }],
          };
        }
        throw new Error(`Unexpected command ${command.join(" ")}`);
      },
      vmJson: vi.fn(() => {
        throw new Error("workload failed");
      }),
    };

    await expect(
      runLifecycleCanary({ client, name: CANARY_NAME }),
    ).rejects.toThrow("workload failed");

    expect(commands).toContainEqual(["rm", CANARY_NAME, "--json"]);
    expect(commands.at(-1)).toEqual(["ls", "--json"]);
  });

  it("returns cleanup evidence for a successful canary", async () => {
    let removed = false;
    const client = {
      lobbyJson(command) {
        if (command[0] === "new") return { vm_name: CANARY_NAME };
        if (command[0] === "rm") {
          removed = true;
          return { removed: [CANARY_NAME] };
        }
        if (command[0] === "ls" && command[1] === CANARY_NAME) {
          return { vms: [{ vm_name: CANARY_NAME, status: "running" }] };
        }
        return {
          vms: removed ? [] : [{ vm_name: CANARY_NAME, status: "running" }],
        };
      },
      vmJson: vi.fn(() => ({ uid: 1000, passwordlessSudo: "no" })),
    };

    await expect(
      runLifecycleCanary({ client, name: CANARY_NAME }),
    ).resolves.toEqual({
      name: CANARY_NAME,
      workload: { uid: 1000, passwordlessSudo: "no" },
      cleanupVerified: true,
    });
  });
});
