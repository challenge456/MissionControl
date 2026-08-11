#!/usr/bin/env node

import {
  assertLiveCanaryAllowed,
  ExeDevSshClient,
  readExeDevReadiness,
  redactProviderText,
  runLifecycleCanary,
  SandboxDoctorError,
} from "./lib/exe-dev-sandbox.mjs";

function parseArguments(argv) {
  const allowed = new Set(["--help", "--json", "--lifecycle-canary"]);
  const unknown = argv.filter((value) => !allowed.has(value));
  if (unknown.length > 0) {
    throw new SandboxDoctorError(
      `Unknown argument: ${unknown[0]}`,
      "UNKNOWN_ARGUMENT",
    );
  }
  return {
    help: argv.includes("--help"),
    json: argv.includes("--json"),
    lifecycleCanary: argv.includes("--lifecycle-canary"),
  };
}

function printHelp() {
  process.stdout.write(`Mission Control remote-sandbox doctor

Usage:
  node scripts/sandbox-doctor.mjs [--json]
  MISSION_CONTROL_SANDBOX_LIVE=1 node scripts/sandbox-doctor.mjs --lifecycle-canary [--json]

Environment:
  EXEDEV_IDENTITY_FILE              Optional dedicated registered SSH private key
  MISSION_CONTROL_SANDBOX_LIVE=1    Required second opt-in for VM creation

The default command is read-only. The lifecycle canary creates one exact,
credential-free VM and removes it immediately. It never clones a repository,
attaches an integration, invokes a model, or exposes a public port.
`);
}

function outputResult(value, json) {
  if (json) {
    process.stdout.write(`${JSON.stringify(value, null, 2)}\n`);
    return;
  }

  process.stdout.write("Remote sandbox provider doctor\n");
  process.stdout.write(`  Authenticated: ${value.readiness.authenticated ? "yes" : "no"}\n`);
  process.stdout.write(`  Existing VMs: ${value.readiness.vmCount}\n`);
  process.stdout.write(
    `  VM capacity: ${value.readiness.vmCount}/${
      value.readiness.maxVms ?? "unknown"
    }\n`,
  );
  process.stdout.write(
    `  Billing readable: ${
      value.readiness.billingPlanReadable && value.readiness.billingUsageReadable
        ? "yes"
        : "no"
    }\n`,
  );
  process.stdout.write(
    `  Automatic integrations: ${value.readiness.automaticIntegrations.length}\n`,
  );
  for (const integration of value.readiness.automaticIntegrations) {
    process.stdout.write(`    - ${integration.name} (${integration.type})\n`);
  }
  process.stdout.write(
    `  Live allocation readiness: ${
      value.readiness.liveAllocationAllowed ? "ready" : "blocked"
    }\n`,
  );
  if (value.canary) {
    process.stdout.write(`  Canary: ${value.canary.name}\n`);
    process.stdout.write(
      `  Cleanup verified: ${value.canary.cleanupVerified ? "yes" : "no"}\n`,
    );
    process.stdout.write(
      `  Passwordless sudo: ${value.canary.workload?.passwordlessSudo ?? "unknown"}\n`,
    );
  }
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  if (options.help) {
    printHelp();
    return;
  }

  const client = new ExeDevSshClient();
  try {
    const readiness = await readExeDevReadiness(client);
    let canary;

    if (options.lifecycleCanary) {
      assertLiveCanaryAllowed(options);
      if (!readiness.liveAllocationAllowed) {
        throw new SandboxDoctorError(
          "Live allocation is blocked because one or more integrations attach automatically. Remove or narrow those attachments before retrying.",
          "AUTOMATIC_INTEGRATION_BLOCKED",
        );
      }
      canary = await runLifecycleCanary({ client });
    }

    const blockers = [];
    if (readiness.automaticIntegrations.length > 0) {
      blockers.push("AUTOMATIC_INTEGRATION_BLOCKED");
    }
    if (!readiness.providerCapacityAvailable) {
      blockers.push("PROVIDER_CAPACITY_BLOCKED");
    }
    const status = blockers.length === 0 ? "ready" : "blocked";
    outputResult({ status, blockers, readiness, canary }, options.json);
    if (status === "blocked") process.exitCode = 1;
  } finally {
    client.dispose();
  }
}

main().catch((error) => {
  const nested = error instanceof AggregateError ? error.errors : [error];
  const codes = nested
    .map((candidate) => candidate?.code)
    .filter(Boolean);
  const message = redactProviderText(
    error instanceof AggregateError
      ? nested.map((candidate) => candidate?.message).filter(Boolean).join(" | ")
      : error.message || "Sandbox doctor failed.",
  );
  const payload = {
    status: "blocked",
    codes,
    message,
  };

  if (process.argv.includes("--json")) {
    process.stderr.write(`${JSON.stringify(payload, null, 2)}\n`);
  } else {
    process.stderr.write(`Remote sandbox provider doctor blocked: ${message}\n`);
    if (codes.length > 0) process.stderr.write(`Code: ${codes.join(", ")}\n`);
  }
  process.exitCode = 1;
});
