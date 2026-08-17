#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { evaluateDependencyAudit } from "./lib/dependency-audit-gate.mjs";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const acceptanceDocument = JSON.parse(
  readFileSync(path.join(repositoryRoot, "docs/security/dependency-risk-acceptances.json"), "utf8")
);

function runAudit(args) {
  const result = spawnSync("pnpm", ["audit", ...args, "--json"], {
    cwd: repositoryRoot,
    encoding: "utf8",
    maxBuffer: 20 * 1024 * 1024,
  });
  if (!result.stdout.trim()) {
    throw new Error(`pnpm audit ${args.join(" ")} returned no JSON: ${result.stderr.trim() || "unknown failure"}`);
  }
  return JSON.parse(result.stdout);
}

const checks = [
  evaluateDependencyAudit({
    report: runAudit(["--prod"]),
    scope: "production",
    acceptances: acceptanceDocument.acceptances,
  }),
  evaluateDependencyAudit({
    report: runAudit([]),
    scope: "all",
    acceptances: acceptanceDocument.acceptances,
  }),
];

for (const check of checks) {
  const totals = check.totals;
  console.log(
    `${check.passed ? "PASS" : "FAIL"} ${check.scope} dependency audit: ` +
    `critical=${totals.critical ?? 0} high=${totals.high ?? 0} moderate=${totals.moderate ?? 0} low=${totals.low ?? 0}; ` +
    `accepted-moderate=${check.acceptedModerateAdvisories.join(",") || "none"}`
  );
  for (const failure of check.failures) console.error(`- ${failure}`);
}

if (checks.some((check) => !check.passed)) process.exit(1);
