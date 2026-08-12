import { spawn } from "node:child_process";
import { access } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const artifact = path.join(
  repositoryRoot,
  "apps/orchestration-server/dist/apps/orchestration-server/src/index.js",
);

await access(artifact);

const child = spawn(process.execPath, [artifact], {
  cwd: repositoryRoot,
  env: {
    ...process.env,
    CONVEX_URL: process.env.CONVEX_URL ?? "http://127.0.0.1:3210",
    ORCHESTRATION_DISABLE_STARTUP: "1",
  },
  stdio: ["ignore", "pipe", "pipe"],
});

let stdout = "";
let stderr = "";
child.stdout.setEncoding("utf8");
child.stderr.setEncoding("utf8");
child.stdout.on("data", (chunk) => { stdout += chunk; });
child.stderr.on("data", (chunk) => { stderr += chunk; });

const timeout = setTimeout(() => {
  child.kill("SIGKILL");
}, 15_000);

const exitCode = await new Promise((resolve, reject) => {
  child.once("error", reject);
  child.once("exit", (code, signal) => {
    if (signal) reject(new Error(`Built orchestration artifact was terminated by ${signal}.`));
    else resolve(code);
  });
}).finally(() => clearTimeout(timeout));

if (exitCode !== 0) {
  throw new Error([
    `Built orchestration artifact exited with code ${exitCode}.`,
    stdout.trim(),
    stderr.trim(),
  ].filter(Boolean).join("\n"));
}

console.log("Built orchestration artifact loaded successfully under Node ESM.");
