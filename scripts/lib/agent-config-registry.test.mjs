import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import test from "node:test";
import {
  classifyAgentConfigurationPath,
  detectAgentConfigurationDrift,
  extractAgentConfigurationDirectives,
  redactConfigurationText,
  scanAgentConfiguration,
} from "./agent-config-registry.mjs";

test("classifies scoped instruction, skill, rule, hook, and ignore sources", () => {
  assert.deepEqual(classifyAgentConfigurationPath("AGENTS.md")?.kind, "INSTRUCTIONS");
  assert.deepEqual(classifyAgentConfigurationPath("apps/ui/AGENTS.md")?.scope, "apps/ui");
  assert.deepEqual(classifyAgentConfigurationPath(".codex/skills/review/SKILL.md")?.kind, "SKILL");
  assert.deepEqual(classifyAgentConfigurationPath(".cursor/rules/ui.mdc")?.harness, "CURSOR");
  assert.deepEqual(classifyAgentConfigurationPath(".husky/pre-commit")?.kind, "HOOK");
  assert.deepEqual(classifyAgentConfigurationPath(".gitignore")?.kind, "IGNORE");
  assert.equal(classifyAgentConfigurationPath("src/index.ts"), null);
});

test("extracts deterministic directive keys and polarity", () => {
  const directives = extractAgentConfigurationDirectives([
    "- Always run pnpm typecheck before shipping.",
    "- Never create git commits without approval.",
  ].join("\n"));
  assert.deepEqual(directives.map(({ key, polarity }) => ({ key, polarity })), [
    { key: "typecheck", polarity: "REQUIRE" },
    { key: "git-commit", polarity: "FORBID" },
  ]);
});

test("finds contradictions and precedence shadows without resolving them", () => {
  const findings = detectAgentConfigurationDrift([
    {
      sourcePath: "AGENTS.md", harness: "CROSS_HARNESS", effectivePrecedence: 100,
      directives: [{ key: "git-commit", polarity: "FORBID", statement: "Never create git commits.", line: 1 }],
    },
    {
      sourcePath: "apps/ui/AGENTS.md", harness: "CROSS_HARNESS", effectivePrecedence: 120,
      directives: [{ key: "git-commit", polarity: "REQUIRE", statement: "Always create git commits.", line: 1 }],
    },
  ]);
  assert.deepEqual(findings.map((finding) => finding.findingType), ["CONTRADICTION", "PRECEDENCE_SHADOW"]);
  assert.ok(findings.every((finding) => !Object.hasOwn(finding, "resolution")));
});

test("reports incomplete cross-harness projection only after two harnesses establish intent", () => {
  const directive = { key: "typecheck", polarity: "REQUIRE", statement: "Always run typecheck.", line: 1 };
  const findings = detectAgentConfigurationDrift([
    { sourcePath: "CLAUDE.md", harness: "CLAUDE", effectivePrecedence: 100, directives: [directive] },
    { sourcePath: ".cursor/rules/test.mdc", harness: "CURSOR", effectivePrecedence: 100, directives: [directive] },
    { sourcePath: ".codex/config.toml", harness: "CODEX", effectivePrecedence: 100, directives: [] },
  ]);
  expectFinding(findings, "COVERAGE_GAP", "configured CODEX");
});

test("redacts credential-shaped values from emitted statements", () => {
  const redacted = redactConfigurationText("api_key=super-secret-value ghp_123456789012345678901234567890");
  assert.equal(redacted.includes("super-secret-value"), false);
  assert.equal(redacted.includes("ghp_"), false);
});

test("scans only bounded tracked configuration files with repository lineage", () => {
  const root = mkdtempSync(join(tmpdir(), "mc-agent-config-"));
  try {
    execFileSync("git", ["init", "-q"], { cwd: root });
    execFileSync("git", ["config", "user.email", "test@example.com"], { cwd: root });
    execFileSync("git", ["config", "user.name", "Test"], { cwd: root });
    mkdirSync(join(root, "src"));
    writeFileSync(join(root, "AGENTS.md"), "Always run pnpm typecheck.\n");
    writeFileSync(join(root, "src", "index.ts"), "const secret = 'not scanned';\n");
    execFileSync("git", ["add", "AGENTS.md", "src/index.ts"], { cwd: root });
    execFileSync("git", ["commit", "-qm", "fixture"], { cwd: root });
    const result = scanAgentConfiguration(root, { maximumFiles: 10, maximumBytesPerFile: 10_000 });
    assert.deepEqual(result.entries.map((entry) => entry.sourcePath), ["AGENTS.md"]);
    assert.equal(result.entries[0].lastChangedCommit, result.commitSha);
    assert.match(result.scanDigest, /^sha256:/);
    assert.deepEqual(result.limits, { maximumFiles: 10, maximumBytesPerFile: 10_000 });
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

function expectFinding(findings, findingType, summaryFragment) {
  const finding = findings.find((item) => item.findingType === findingType);
  assert.ok(finding);
  assert.match(finding.summary, new RegExp(summaryFragment));
}
