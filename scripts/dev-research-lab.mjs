#!/usr/bin/env node

import { spawn } from "node:child_process";
import net from "node:net";
import { ConvexHttpClient } from "convex/browser";
import { makeFunctionReference } from "convex/server";
import {
  buildBackendArguments,
  buildResearchLabUiEnvironment,
  RESEARCH_LAB_UI_PORT,
  resolveResearchLabRuntime,
  waitForResearchLabWorkspace,
} from "./lib/research-lab-runtime.mjs";

function portIsListening(port) {
  return new Promise((resolve) => {
    const socket = net.createConnection({ host: "127.0.0.1", port });
    socket.setTimeout(500);
    socket.once("connect", () => {
      socket.destroy();
      resolve(true);
    });
    const unavailable = () => {
      socket.destroy();
      resolve(false);
    };
    socket.once("error", unavailable);
    socket.once("timeout", unavailable);
  });
}

async function waitForBackend(runtime, timeoutMs = 4 * 60 * 60_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`${runtime.convexUrl}/instance_name`);
      if (response.ok && (await response.text()).trim() === runtime.deploymentName) return;
    } catch {
      // The preserved backend is still starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  throw new Error(`Research Lab backend did not become ready at ${runtime.convexUrl}.`);
}

async function main() {
  const runtime = resolveResearchLabRuntime();
  if (await portIsListening(RESEARCH_LAB_UI_PORT)) {
    throw new Error(
      `Port ${RESEARCH_LAB_UI_PORT} is already in use. Stop the current demo server, then run pnpm run dev:research-lab again.`,
    );
  }

  const children = [];
  let shuttingDown = false;
  const shutdown = (signal = "SIGTERM") => {
    if (shuttingDown) return;
    shuttingDown = true;
    for (const child of [...children].reverse()) {
      if (!child.killed) child.kill(signal);
    }
  };

  process.once("SIGINT", () => shutdown("SIGINT"));
  process.once("SIGTERM", () => shutdown("SIGTERM"));

  const backendAlreadyRunning = await portIsListening(runtime.cloudPort);
  if (!backendAlreadyRunning) {
    console.log("Starting the preserved Research Lab backend; local indexes may take several minutes to rebuild.");
    const backend = spawn(runtime.backendBinary, buildBackendArguments(runtime), {
      stdio: "inherit",
    });
    children.push(backend);
  }
  try {
    await waitForBackend(runtime);

    const convexClient = new ConvexHttpClient(runtime.convexUrl);
    const listProjects = makeFunctionReference("projects:list");
    await waitForResearchLabWorkspace({
      queryProjects: () => convexClient.query(listProjects, {}),
    });

    const ui = spawn(
      "pnpm",
      ["--filter", "mission-control-ui", "exec", "vite", "--port", String(RESEARCH_LAB_UI_PORT), "--strictPort"],
      {
        cwd: runtime.uiRoot,
        env: buildResearchLabUiEnvironment(runtime),
        stdio: "inherit",
      },
    );
    children.push(ui);

    console.log("\nSoftware Factory Research Lab runtime is starting.");
    console.log(`Open: ${runtime.workspaceUrl}`);
    console.log(`UI checkout: ${runtime.uiRoot}`);
    console.log("This profile does not seed data or start autonomous executors.\n");
  } catch (error) {
    shutdown();
    throw error;
  }

  for (const child of children) {
    child.once("exit", (code, signal) => {
      if (shuttingDown) return;
      shutdown();
      if (code !== 0) {
        console.error(`Research Lab runtime process exited (${signal ?? code}).`);
        process.exitCode = code ?? 1;
      }
    });
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
