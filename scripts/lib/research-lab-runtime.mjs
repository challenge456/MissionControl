import { existsSync, readFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";

export const RESEARCH_LAB_PROJECT_ID = "sn71gskbdemgf4z1trt9zdmm5h8bde69";
export const RESEARCH_LAB_UI_PORT = 5199;

export async function waitForResearchLabWorkspace({
  queryProjects,
  timeoutMs = 15_000,
  pollIntervalMs = 200,
  now = Date.now,
  sleep = (durationMs) => new Promise((resolve) => setTimeout(resolve, durationMs)),
}) {
  const deadline = now() + timeoutMs;

  while (now() < deadline) {
    try {
      const projects = await queryProjects();
      if (projects.some((project) => String(project._id) === RESEARCH_LAB_PROJECT_ID)) {
        return;
      }
    } catch {
      // The local function runtime can briefly lag behind the HTTP endpoint.
    }
    await sleep(pollIntervalMs);
  }

  throw new Error(
    "Research Lab canonical workspace did not become ready before the startup deadline.",
  );
}

function requiredPath(targetPath, label) {
  if (!existsSync(targetPath)) {
    throw new Error(`${label} is missing at ${targetPath}`);
  }
  return targetPath;
}

export function readEnvValue(source, key) {
  const line = source
    .split(/\r?\n/)
    .find((candidate) => candidate.trimStart().startsWith(`${key}=`));
  if (!line) return undefined;

  let value = line.slice(line.indexOf("=") + 1).trim();
  const commentIndex = value.indexOf(" #");
  if (commentIndex >= 0) value = value.slice(0, commentIndex).trim();
  if (
    value.length >= 2 &&
    ((value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'")))
  ) {
    value = value.slice(1, -1);
  }
  return value || undefined;
}

export function resolveResearchLabRuntime({
  cwd = process.cwd(),
  homeDir = os.homedir(),
  env = process.env,
} = {}) {
  const envFile = path.join(cwd, ".env.local");
  const envSource = existsSync(envFile) ? readFileSync(envFile, "utf8") : "";
  const configuredDeployment =
    env.MISSION_CONTROL_RESEARCH_LAB_DEPLOYMENT ??
    readEnvValue(envSource, "CONVEX_DEPLOYMENT");
  const deploymentName = configuredDeployment?.replace(/^local:/, "");

  if (!deploymentName && !env.MISSION_CONTROL_RESEARCH_LAB_STATE_DIR) {
    throw new Error(
      "Research Lab deployment is not configured. Set CONVEX_DEPLOYMENT in .env.local or MISSION_CONTROL_RESEARCH_LAB_STATE_DIR.",
    );
  }

  const stateDir = path.resolve(
    env.MISSION_CONTROL_RESEARCH_LAB_STATE_DIR ??
      path.join(homeDir, ".convex", "convex-backend-state", deploymentName),
  );
  const compatibleStateDir =
    !env.MISSION_CONTROL_RESEARCH_LAB_STATE_DIR
    && !existsSync(path.join(stateDir, "config.json"))
    && deploymentName?.match(/-\d+$/)
      ? path.join(
          homeDir,
          ".convex",
          "convex-backend-state",
          deploymentName.replace(/-\d+$/, ""),
        )
      : stateDir;
  const configPath = requiredPath(
    path.join(compatibleStateDir, "config.json"),
    "Research Lab backend config",
  );
  const config = JSON.parse(readFileSync(configPath, "utf8"));
  const cloudPort = Number(config.ports?.cloud);
  const sitePort = Number(config.ports?.site);

  if (!Number.isInteger(cloudPort) || !Number.isInteger(sitePort)) {
    throw new Error("Research Lab backend config must define numeric cloud and site ports.");
  }
  if (!config.backendVersion || !config.deploymentName || !config.instanceSecret) {
    throw new Error("Research Lab backend config is incomplete.");
  }

  const backendBinary = requiredPath(
    path.join(homeDir, ".cache", "convex", "binaries", config.backendVersion, "convex-local-backend"),
    "Research Lab Convex backend binary",
  );
  const databasePath = requiredPath(
    path.join(compatibleStateDir, "convex_local_backend.sqlite3"),
    "Research Lab database",
  );
  const storagePath = requiredPath(
    path.join(compatibleStateDir, "convex_local_storage"),
    "Research Lab file storage",
  );
  const convexUrl = `http://127.0.0.1:${cloudPort}`;
  const uiRoot = path.resolve(
    env.MISSION_CONTROL_RESEARCH_LAB_UI_ROOT ??
      readEnvValue(envSource, "MISSION_CONTROL_RESEARCH_LAB_UI_ROOT") ??
      cwd,
  );
  requiredPath(path.join(uiRoot, "apps", "mission-control-ui", "package.json"), "Research Lab UI checkout");

  return {
    backendBinary,
    cloudPort,
    convexUrl,
    databasePath,
    deploymentName: config.deploymentName,
    instanceSecret: config.instanceSecret,
    sitePort,
    stateDir: compatibleStateDir,
    storagePath,
    uiRoot,
    workspaceUrl: `http://localhost:${RESEARCH_LAB_UI_PORT}/v2/tasks?workspace=${RESEARCH_LAB_PROJECT_ID}`,
  };
}

export function buildBackendArguments(runtime) {
  return [
    "--port",
    String(runtime.cloudPort),
    "--site-proxy-port",
    String(runtime.sitePort),
    "--convex-origin",
    runtime.convexUrl,
    "--convex-site",
    `http://127.0.0.1:${runtime.sitePort}`,
    "--instance-name",
    runtime.deploymentName,
    "--instance-secret",
    runtime.instanceSecret,
    "--local-storage",
    runtime.storagePath,
    "--disable-beacon",
    runtime.databasePath,
  ];
}

export function buildResearchLabUiEnvironment(runtime, env = process.env) {
  return {
    ...env,
    VITE_CONVEX_URL: runtime.convexUrl,
    VITE_FLAG_COMPANY_CONTEXT: "false",
    VITE_FLAG_CONTEXT_REGISTRY: "true",
    VITE_FLAG_EOS_COMMAND_CENTER_PREVIEW: "true",
    VITE_FLAG_UI_SHELL_V2: "true",
  };
}
