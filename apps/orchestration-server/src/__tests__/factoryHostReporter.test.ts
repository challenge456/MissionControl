import { execFile } from "node:child_process";
import { mkdtemp, realpath, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { afterEach, describe, expect, it } from "vitest";
import { canonicalRepositoryFromRemote, inspectFactoryCheckout } from "../factoryHostReporter.js";

const execFileAsync = promisify(execFile);
const cleanup: string[] = [];

afterEach(async () => {
  await Promise.all(cleanup.splice(0).map((directory) => rm(directory, { recursive: true, force: true })));
});

describe("Factory host reporting", () => {
  it.each([
    ["git@github.com:jaydubya818/MissionControl.git", "jaydubya818/MissionControl"],
    ["https://github.com/jaydubya818/MissionControl.git", "jaydubya818/MissionControl"],
    ["ssh://git@github.com/jaydubya818/MissionControl", "jaydubya818/MissionControl"],
  ])("normalizes %s", (remote, expected) => {
    expect(canonicalRepositoryFromRemote(remote)).toBe(expected);
  });

  it("reports the real root, identity, revision, and dirty state", async () => {
    const repository = await mkdtemp(path.join(os.tmpdir(), "mc-host-report-"));
    cleanup.push(repository);
    await git(repository, ["init", "-b", "main"]);
    await git(repository, ["config", "user.name", "Mission Control Test"]);
    await git(repository, ["config", "user.email", "factory@example.test"]);
    await git(repository, ["remote", "add", "origin", "git@github.com:jaydubya818/MissionControl.git"]);
    await writeFile(path.join(repository, "README.md"), "ready\n");
    await git(repository, ["add", "README.md"]);
    await git(repository, ["commit", "-m", "fixture"]);

    const clean = await inspectFactoryCheckout(repository);
    expect(clean).toMatchObject({
      repository: "jaydubya818/MissionControl",
      checkoutRoot: await realpath(repository),
      observedBranch: "main",
      baseBranch: "main",
      dirty: false,
    });
    expect(clean.observedCommit).toMatch(/^[0-9a-f]{40}$/);
    expect(clean.baseCommit).toBe(clean.observedCommit);

    await writeFile(path.join(repository, "README.md"), "dirty\n");
    expect((await inspectFactoryCheckout(repository)).dirty).toBe(true);
  });
});

async function git(cwd: string, args: string[]) {
  await execFileAsync("git", args, { cwd, env: process.env });
}
