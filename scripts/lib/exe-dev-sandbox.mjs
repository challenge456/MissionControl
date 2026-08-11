import { spawnSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import {
  appendFileSync,
  existsSync,
  mkdtempSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

export const EXE_DEV_HOST = "exe.dev";
export const EXE_DEV_HOST_FINGERPRINT =
  "SHA256:JJOP/lwiBGOMilfONPWZCXUrfK154cnJFXcqlsi6lPo";
export const SANDBOX_DOCTOR_TAG = "mission-control-sandbox-doctor";

const CANARY_NAME_PATTERN =
  /^mc-sbx-doctor-[0-9]{8}t[0-9]{6}z-[a-f0-9]{8}$/;
const LIVE_ENV_NAME = "MISSION_CONTROL_SANDBOX_LIVE";
const VM_READY_STATUSES = new Set(["ready", "running"]);

export class SandboxDoctorError extends Error {
  constructor(message, code = "SANDBOX_DOCTOR_FAILED") {
    super(message);
    this.name = "SandboxDoctorError";
    this.code = code;
  }
}

export function redactProviderText(value) {
  return String(value ?? "")
    .replace(/\bexe[01]\.[A-Za-z0-9._-]+/g, "[REDACTED_EXE_TOKEN]")
    .replace(/\bsk-or-v1-[A-Za-z0-9_-]+/g, "[REDACTED_OPENROUTER_KEY]")
    .replace(/\bgh[pousr]_[A-Za-z0-9_]+/g, "[REDACTED_GITHUB_TOKEN]")
    .replace(/(authorization\s*[:=]\s*)([^\s,;]+)/gi, "$1[REDACTED]")
    .slice(0, 1_000);
}

export function parseFingerprint(output) {
  const match = String(output).match(/SHA256:[A-Za-z0-9+/=]+/);
  if (!match) {
    throw new SandboxDoctorError(
      "Could not parse the exe.dev SSH host fingerprint.",
      "HOST_FINGERPRINT_UNREADABLE",
    );
  }
  return match[0];
}

export function assertExpectedHostFingerprint(output) {
  const observed = parseFingerprint(output);
  if (observed !== EXE_DEV_HOST_FINGERPRINT) {
    throw new SandboxDoctorError(
      `exe.dev SSH host fingerprint mismatch. Expected ${EXE_DEV_HOST_FINGERPRINT}; observed ${observed}.`,
      "HOST_FINGERPRINT_MISMATCH",
    );
  }
  return observed;
}

export function buildSshArguments({
  host = EXE_DEV_HOST,
  knownHostsFile,
  identityFile,
  remoteCommand,
}) {
  if (!knownHostsFile) {
    throw new SandboxDoctorError(
      "A verified known-hosts file is required.",
      "KNOWN_HOSTS_REQUIRED",
    );
  }
  if (!Array.isArray(remoteCommand) || remoteCommand.length === 0) {
    throw new SandboxDoctorError(
      "A non-empty remote command is required.",
      "REMOTE_COMMAND_REQUIRED",
    );
  }

  const args = [
    "-o",
    "BatchMode=yes",
    "-o",
    "ConnectTimeout=10",
    "-o",
    "StrictHostKeyChecking=yes",
    "-o",
    `UserKnownHostsFile=${knownHostsFile}`,
    "-o",
    "LogLevel=ERROR",
  ];

  if (identityFile) {
    args.push("-o", "IdentitiesOnly=yes", "-i", identityFile);
  }

  args.push(host, ...remoteCommand);
  return args;
}

export function generateCanaryVmName({
  now = new Date(),
  randomSuffix = randomBytes(4).toString("hex"),
} = {}) {
  const timestamp = now
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(".", "")
    .slice(0, 15)
    .toLowerCase();
  const name = `mc-sbx-doctor-${timestamp}z-${randomSuffix.toLowerCase()}`;
  assertSafeCanaryVmName(name);
  return name;
}

export function assertSafeCanaryVmName(name) {
  if (!CANARY_NAME_PATTERN.test(String(name))) {
    throw new SandboxDoctorError(
      "Refusing provider mutation because the canary VM name is outside the exact Mission Control doctor namespace.",
      "UNSAFE_CANARY_NAME",
    );
  }
  return name;
}

export function buildCreateVmCommand(name) {
  assertSafeCanaryVmName(name);
  return [
    "new",
    `--name=${name}`,
    "--cpu=2",
    "--memory=2GB",
    "--disk=10GB",
    `--tag=${SANDBOX_DOCTOR_TAG}`,
    "--comment=Mission Control read-only lifecycle canary; delete immediately",
    "--no-email",
    "--json",
  ];
}

export function buildRemoveVmCommand(name) {
  assertSafeCanaryVmName(name);
  return ["rm", name, "--json"];
}

export function assertLiveCanaryAllowed({
  lifecycleCanary,
  env = process.env,
}) {
  if (!lifecycleCanary) return false;
  if (env[LIVE_ENV_NAME] !== "1") {
    throw new SandboxDoctorError(
      `Live allocation is disabled. Set ${LIVE_ENV_NAME}=1 in the same command only after reviewing the read-only doctor output.`,
      "LIVE_OPT_IN_REQUIRED",
    );
  }
  return true;
}

function walkProviderPayload(value, visitor, pathParts = []) {
  visitor(value, pathParts);
  if (Array.isArray(value)) {
    value.forEach((entry, index) =>
      walkProviderPayload(entry, visitor, [...pathParts, String(index)]),
    );
    return;
  }
  if (!value || typeof value !== "object") return;
  for (const [key, entry] of Object.entries(value)) {
    walkProviderPayload(entry, visitor, [...pathParts, key]);
  }
}

export function findAutoAllIntegrations(payload) {
  const matches = new Map();
  walkProviderPayload(payload, (value, pathParts) => {
    if (value !== "auto:all") return;

    let cursor = payload;
    let owner = payload;
    for (const part of pathParts.slice(0, -1)) {
      cursor = cursor?.[part];
      if (cursor && typeof cursor === "object" && !Array.isArray(cursor)) {
        owner = cursor;
      }
    }
    const name = String(owner?.name ?? owner?.integration_name ?? "unknown");
    const type = String(owner?.type ?? owner?.integration_type ?? "unknown");
    matches.set(`${name}:${type}`, { name, type });
  });
  return [...matches.values()].sort((left, right) =>
    `${left.name}:${left.type}`.localeCompare(`${right.name}:${right.type}`),
  );
}

export function extractVmRecords(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.vms)) return payload.vms;
  if (Array.isArray(payload?.boxes)) return payload.boxes;
  if (payload && typeof payload === "object") {
    const directRecord = payload.vm_name || payload.ssh_dest || payload.status;
    if (directRecord) return [payload];
  }
  return [];
}

export function vmRecordName(record) {
  return String(record?.vm_name ?? record?.name ?? record?.box_name ?? "");
}

export function inventoryHasVm(payload, name) {
  return extractVmRecords(payload).some(
    (record) => vmRecordName(record) === name,
  );
}

export function vmStatus(payload, name) {
  const record = extractVmRecords(payload).find(
    (candidate) => vmRecordName(candidate) === name,
  );
  return String(record?.status ?? "").toLowerCase();
}

export function summarizeReadiness({ vms, plan, usage, integrations }) {
  const automaticIntegrations = findAutoAllIntegrations(integrations);
  const vmCount = extractVmRecords(vms).length;
  const rawMaxVms = plan?.max_vms ?? plan?.limits?.max_vms;
  const parsedMaxVms = Number(rawMaxVms);
  const maxVms = Number.isFinite(parsedMaxVms) ? parsedMaxVms : null;
  const providerCapacityAvailable = maxVms !== null && maxVms > vmCount;
  return {
    authenticated: true,
    vmCount,
    maxVms,
    providerCapacityAvailable,
    billingPlanReadable: Boolean(plan && typeof plan === "object"),
    billingUsageReadable: Boolean(usage && typeof usage === "object"),
    automaticIntegrations,
    liveAllocationAllowed:
      automaticIntegrations.length === 0 && providerCapacityAvailable,
  };
}

function parseProviderJson(value, commandLabel) {
  try {
    return JSON.parse(String(value).trim());
  } catch {
    throw new SandboxDoctorError(
      `exe.dev returned non-JSON output for ${commandLabel}.`,
      "PROVIDER_JSON_INVALID",
    );
  }
}

function defaultRunProcess(command, args, options = {}) {
  return spawnSync(command, args, {
    encoding: "utf8",
    timeout: options.timeoutMs ?? 30_000,
    input: options.input,
  });
}

function assertProcessSucceeded(result, action) {
  if (result.error) {
    throw new SandboxDoctorError(
      `${action} failed: ${redactProviderText(result.error.message)}`,
      "LOCAL_PROCESS_FAILED",
    );
  }
  if (result.status === 0) return;

  const stderr = redactProviderText(result.stderr).trim();
  const stdout = redactProviderText(result.stdout).trim();
  const authFailure =
    action === "account identity" ||
    /permission denied|keyboard-interactive|publickey/i.test(stderr);
  if (authFailure) {
    throw new SandboxDoctorError(
      "exe.dev authentication failed. Register a dedicated SSH public key, then set EXEDEV_IDENTITY_FILE to its private-key path if needed.",
      "PROVIDER_AUTH_FAILED",
    );
  }
  throw new SandboxDoctorError(
    `${action} failed with exit ${result.status}${
      stderr || stdout ? `: ${stderr || stdout}` : "."
    }`,
    "PROVIDER_COMMAND_FAILED",
  );
}

export class ExeDevSshClient {
  constructor({
    identityFile = process.env.EXEDEV_IDENTITY_FILE,
    runProcess = defaultRunProcess,
  } = {}) {
    if (identityFile && !existsSync(identityFile)) {
      throw new SandboxDoctorError(
        "EXEDEV_IDENTITY_FILE does not exist.",
        "IDENTITY_FILE_MISSING",
      );
    }
    this.identityFile = identityFile;
    this.runProcess = runProcess;
    this.tempDirectory = mkdtempSync(path.join(tmpdir(), "mc-exedev-doctor-"));
    this.knownHostsFile = path.join(this.tempDirectory, "known_hosts");
    this.trustedHosts = new Set();
  }

  verifyAndTrustHost(host = EXE_DEV_HOST) {
    if (this.trustedHosts.has(host)) return EXE_DEV_HOST_FINGERPRINT;

    const scan = this.runProcess("ssh-keyscan", ["-t", "rsa", host], {
      timeoutMs: 10_000,
    });
    assertProcessSucceeded(scan, `SSH host-key scan for ${host}`);
    const fingerprint = this.runProcess(
      "ssh-keygen",
      ["-lf", "-", "-E", "sha256"],
      { input: scan.stdout, timeoutMs: 10_000 },
    );
    assertProcessSucceeded(fingerprint, `SSH fingerprint calculation for ${host}`);
    const observed = assertExpectedHostFingerprint(fingerprint.stdout);

    if (this.trustedHosts.size === 0) {
      writeFileSync(this.knownHostsFile, scan.stdout, { mode: 0o600 });
    } else {
      appendFileSync(this.knownHostsFile, scan.stdout);
    }
    this.trustedHosts.add(host);
    return observed;
  }

  runSsh(host, remoteCommand, action) {
    this.verifyAndTrustHost(host);
    const args = buildSshArguments({
      host,
      knownHostsFile: this.knownHostsFile,
      identityFile: this.identityFile,
      remoteCommand,
    });
    const result = this.runProcess("ssh", args, { timeoutMs: 60_000 });
    assertProcessSucceeded(result, action);
    return result.stdout;
  }

  lobbyJson(command, action = `exe.dev ${command[0]}`) {
    return parseProviderJson(
      this.runSsh(EXE_DEV_HOST, command, action),
      action,
    );
  }

  vmJson(name, remoteCommand) {
    assertSafeCanaryVmName(name);
    const host = `${name}.exe.xyz`;
    return parseProviderJson(
      this.runSsh(host, [remoteCommand], `canary command on ${name}`),
      `canary command on ${name}`,
    );
  }

  dispose() {
    rmSync(this.tempDirectory, { recursive: true, force: true });
  }
}

export async function readExeDevReadiness(client) {
  client.verifyAndTrustHost(EXE_DEV_HOST);
  await Promise.resolve(client.lobbyJson(["whoami", "--json"], "account identity"));
  const vms = await Promise.resolve(
    client.lobbyJson(["ls", "--json"], "VM inventory"),
  );
  const plan = await Promise.resolve(
    client.lobbyJson(["billing", "plan", "--json"], "billing plan"),
  );
  const usage = await Promise.resolve(
    client.lobbyJson(
      ["billing", "usage", "--range=24h", "--json"],
      "billing usage",
    ),
  );
  const integrations = await Promise.resolve(
    client.lobbyJson(
      ["integrations", "list", "--json", "--usage"],
      "integration inventory",
    ),
  );
  return summarizeReadiness({ vms, plan, usage, integrations });
}

const REMOTE_CANARY_COMMAND = [
  "uid=$(id -u)",
  "if sudo -n true >/dev/null 2>&1; then sudo_state=yes; else sudo_state=no; fi",
  "printf '{\"uid\":%s,\"passwordlessSudo\":\"%s\"}\\n' \"$uid\" \"$sudo_state\"",
].join("; ");

export async function runLifecycleCanary({
  client,
  name = generateCanaryVmName(),
  timeoutMs = 45_000,
  pollIntervalMs = 1_000,
  now = Date.now,
  sleep = (durationMs) =>
    new Promise((resolve) => setTimeout(resolve, durationMs)),
}) {
  assertSafeCanaryVmName(name);
  const deadline = now() + timeoutMs;
  let result;
  let primaryError;
  let cleanupError;
  let creationAttempted = false;

  try {
    creationAttempted = true;
    await Promise.resolve(
      client.lobbyJson(buildCreateVmCommand(name), `create canary VM ${name}`),
    );

    let inventory;
    while (now() < deadline) {
      inventory = await Promise.resolve(
        client.lobbyJson(["ls", name, "--json"], `inspect canary VM ${name}`),
      );
      if (VM_READY_STATUSES.has(vmStatus(inventory, name))) break;
      await sleep(pollIntervalMs);
    }
    if (!inventory || !VM_READY_STATUSES.has(vmStatus(inventory, name))) {
      throw new SandboxDoctorError(
        `Canary VM ${name} did not become ready before the deadline.`,
        "CANARY_READY_TIMEOUT",
      );
    }

    result = await Promise.resolve(client.vmJson(name, REMOTE_CANARY_COMMAND));
  } catch (error) {
    primaryError = error;
  } finally {
    if (creationAttempted) {
      try {
        let inventory = await Promise.resolve(
          client.lobbyJson(["ls", "--json"], "inspect canary before cleanup"),
        );
        if (inventoryHasVm(inventory, name)) {
          await Promise.resolve(
            client.lobbyJson(buildRemoveVmCommand(name), `remove canary VM ${name}`),
          );
        }
        const cleanupDeadline = now() + 15_000;
        let cleanupVerified = false;
        while (now() < cleanupDeadline) {
          inventory = await Promise.resolve(
            client.lobbyJson(["ls", "--json"], "verify canary cleanup"),
          );
          if (!inventoryHasVm(inventory, name)) {
            cleanupVerified = true;
            break;
          }
          await sleep(pollIntervalMs);
        }
        if (!cleanupVerified) {
          throw new SandboxDoctorError(
            `Canary VM ${name} remains in provider inventory after removal.`,
            "CANARY_ORPHANED",
          );
        }
      } catch (error) {
        cleanupError = error;
      }
    }
  }

  if (cleanupError) {
    const errors = primaryError ? [primaryError, cleanupError] : [cleanupError];
    throw new AggregateError(
      errors,
      `Canary cleanup was not verified for exact VM ${name}.`,
    );
  }
  if (primaryError) throw primaryError;

  return {
    name,
    workload: result,
    cleanupVerified: true,
  };
}
