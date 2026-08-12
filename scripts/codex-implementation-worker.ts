#!/usr/bin/env tsx
/**
 * One-cycle launcher for the durable production worker.
 *
 * The worker no longer accepts a caller-supplied run/task/worktree tuple and
 * no longer writes through public Convex mutations. It claims the next exact
 * Factory-bound Attempt through signed service commands.
 */

import { ConvexHttpClient } from "convex/browser";
import { DurableCodexWorker } from "../apps/orchestration-server/src/durableCodexWorker";
import { GithubAppPublisher } from "../apps/orchestration-server/src/githubAppPublisher";

function required(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required`);
  return value;
}

async function main() {
  const client = new ConvexHttpClient(required("CONVEX_URL"));
  const serviceAuthToken = process.env.CONVEX_SERVICE_AUTH_TOKEN?.trim();
  if (serviceAuthToken) client.setAuth(serviceAuthToken);
  const worker = new DurableCodexWorker({
    client,
    projectId: required("CODEX_WORKER_PROJECT_ID"),
    repositoryId: required("CODEX_WORKER_REPOSITORY_ID"),
    repositoryRoot: required("CODEX_WORKER_REPOSITORY_ROOT"),
    workerId: process.env.CODEX_WORKER_ID ?? `codex-worker:manual:${process.pid}`,
    publisher: new GithubAppPublisher(
      required("GITHUB_APP_ID"),
      required("GITHUB_APP_PRIVATE_KEY")
    ),
  });
  const claimed = await worker.runOnce();
  console.log(claimed ? "Durable Attempt processed." : "No claimable governed Attempt found.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
