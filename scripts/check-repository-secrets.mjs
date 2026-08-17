#!/usr/bin/env node
import { lstatSync, readFileSync, readlinkSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { isSensitiveTrackedPath, scanTextForSecrets } from "./lib/repository-secret-scan.mjs";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const listed = spawnSync("git", ["ls-files", "-z"], {
  cwd: repositoryRoot,
  encoding: "utf8",
});
if (listed.status !== 0) throw new Error(`git ls-files failed: ${listed.stderr.trim()}`);

const trackedFiles = listed.stdout.split("\0").filter(Boolean);
const findings = [];
for (const filePath of trackedFiles) {
  if (isSensitiveTrackedPath(filePath)) {
    findings.push({ filePath, line: 1, rule: "sensitive-tracked-file" });
    continue;
  }

  const absolutePath = path.join(repositoryRoot, filePath);
  const stats = lstatSync(absolutePath);
  const content = stats.isSymbolicLink()
    ? Buffer.from(readlinkSync(absolutePath), "utf8")
    : readFileSync(absolutePath);
  if (content.byteLength > 2 * 1024 * 1024) continue;
  if (content.includes(0)) continue;
  for (const finding of scanTextForSecrets(content.toString("utf8"))) {
    findings.push({ filePath, ...finding });
  }
}

if (findings.length > 0) {
  console.error(`FAIL repository secret scan: ${findings.length} high-confidence finding(s)`);
  for (const finding of findings) {
    console.error(`- ${finding.rule} at ${finding.filePath}:${finding.line}`);
  }
  process.exit(1);
}

console.log(`PASS repository secret scan: ${trackedFiles.length} tracked files checked; no credential material found`);
