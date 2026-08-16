import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { lstatSync, readFileSync, realpathSync } from "node:fs";
import { basename, dirname, relative, resolve, sep } from "node:path";

export const AGENT_CONFIG_SCAN_LIMITS = Object.freeze({
  maximumFiles: 200,
  maximumBytesPerFile: 262_144,
});

const SECRET_PATTERNS = [
  /\b(?:sk|pk)-(?:live|test|proj)-[A-Za-z0-9_-]{12,}\b/g,
  /\bgh[opusr]_[A-Za-z0-9]{20,}\b/g,
  /\b(?:api[_-]?key|token|secret|password)\s*[:=]\s*[^\s,;]+/gi,
  /-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?-----END [A-Z ]*PRIVATE KEY-----/g,
];

const COMMAND_KEYS = [
  ["typecheck", /\b(?:typecheck|tsc\b)/i],
  ["lint", /\b(?:lint|eslint|rubocop)\b/i],
  ["test", /\b(?:test|vitest|jest|rspec|pytest)\b/i],
  ["build", /\b(?:build|compile)\b/i],
  ["format", /\b(?:format|prettier|biome)\b/i],
  ["browser-verification", /\b(?:browser|playwright|screenshot|visual verification)\b/i],
  ["worktree", /\bworktree\b/i],
  ["git-commit", /\b(?:git commits?|commit changes|create (?:git )?commits?)\b/i],
  ["secrets", /\b(?:secret|credential|api key|password|token)\b/i],
  ["acceptance-authority", /\b(?:acceptance authority|acceptance decision|approve acceptance)\b/i],
  ["subagents", /\b(?:subagent|sub-agent|delegate|parallel agent)\b/i],
];

function digest(value) {
  return `sha256:${createHash("sha256").update(value).digest("hex")}`;
}

export function redactConfigurationText(value) {
  return SECRET_PATTERNS.reduce(
    (text, pattern) => text.replace(pattern, "[REDACTED]"),
    String(value ?? ""),
  );
}

function normalizedPath(value) {
  return value.replaceAll("\\", "/").replace(/^\.\//, "");
}

function isInstructionExtension(path) {
  return /\.(?:md|mdc|txt|json|jsonc|ya?ml|toml)$/i.test(path);
}

export function classifyAgentConfigurationPath(inputPath) {
  const path = normalizedPath(inputPath);
  const name = basename(path);
  const lower = path.toLowerCase();
  const depth = path.split("/").length - 1;
  if (name === "AGENTS.md") return { harness: "CROSS_HARNESS", kind: "INSTRUCTIONS", scope: dirname(path) === "." ? "." : dirname(path), precedence: 100 + depth * 10 };
  if (name === "CLAUDE.md") return { harness: "CLAUDE", kind: "INSTRUCTIONS", scope: dirname(path) === "." ? "." : dirname(path), precedence: 100 + depth * 10 };
  if (/(?:^|\/)SKILL\.md$/i.test(path) && /(?:^|\/)(?:\.agents|\.claude|\.codex|\.cursor|skills)\//i.test(path)) {
    const harness = lower.includes("/.codex/") || lower.startsWith(".codex/") ? "CODEX"
      : lower.includes("/.cursor/") || lower.startsWith(".cursor/") ? "CURSOR"
        : lower.includes("/.claude/") || lower.startsWith(".claude/") ? "CLAUDE"
          : "CROSS_HARNESS";
    return { harness, kind: "SKILL", scope: dirname(path), precedence: 60 + depth * 10 };
  }
  if ((lower.startsWith(".cursor/rules/") || lower === ".cursorrules") && isInstructionExtension(path)) {
    return { harness: "CURSOR", kind: "RULE", scope: dirname(path), precedence: 70 + depth * 10 };
  }
  if ((/^(?:.*\/)?\.codex\/(?:config\.|rules\/|permissions?\.)/.test(lower)) && isInstructionExtension(path)) {
    return { harness: "CODEX", kind: /permission/i.test(name) ? "PERMISSIONS" : "CONFIG", scope: dirname(path), precedence: 70 + depth * 10 };
  }
  if ((/^(?:.*\/)?\.claude\/(?:settings\.|rules\/|commands?\/|permissions?\.)/.test(lower)) && isInstructionExtension(path)) {
    return { harness: "CLAUDE", kind: /permission/i.test(name) ? "PERMISSIONS" : "CONFIG", scope: dirname(path), precedence: 70 + depth * 10 };
  }
  if ((lower.startsWith(".loom/") || lower.includes("/.loom/")) && isInstructionExtension(path)) {
    return { harness: "LOOM", kind: "CONFIG", scope: dirname(path), precedence: 60 + depth * 10 };
  }
  if (/^(?:\.husky|\.githooks)\//.test(lower)) {
    return { harness: "GIT", kind: "HOOK", scope: dirname(path), precedence: 80 + depth * 10 };
  }
  if (/^(?:\.gitignore|\.dockerignore|\.cursorignore|\.claudeignore|\.codexignore)$/.test(lower) || /(?:^|\/)\.gitignore$/.test(lower)) {
    return { harness: lower.includes("cursor") ? "CURSOR" : lower.includes("claude") ? "CLAUDE" : lower.includes("codex") ? "CODEX" : "GIT", kind: "IGNORE", scope: dirname(path) === "." ? "." : dirname(path), precedence: 40 + depth * 10 };
  }
  if (/permissions?\.(?:json|jsonc|ya?ml|toml)$/i.test(name)) {
    return { harness: "OTHER", kind: "PERMISSIONS", scope: dirname(path), precedence: 60 + depth * 10 };
  }
  if (/^mc-context\.(?:json|lock)$/.test(lower)) {
    return { harness: "CROSS_HARNESS", kind: "CONFIG", scope: ".", precedence: 50 };
  }
  return null;
}

function directiveKey(statement) {
  for (const [key, pattern] of COMMAND_KEYS) {
    if (pattern.test(statement)) return key;
  }
  return statement
    .toLowerCase()
    .replace(/\b(?:must|always|required|require|never|do not|don't|must not|forbid|should)\b/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .split(" ")
    .slice(0, 6)
    .join("-") || "unclassified-directive";
}

export function extractAgentConfigurationDirectives(content) {
  const directives = [];
  const lines = redactConfigurationText(content).split(/\r?\n/);
  for (let index = 0; index < lines.length; index += 1) {
    const statement = lines[index].replace(/^\s*(?:[-*+] |\d+[.)]\s+|#+\s*)/, "").trim();
    if (!statement || statement.length > 2_000) continue;
    const forbid = /\b(?:never|do not|don't|must not|forbid(?:den)?)\b/i.test(statement);
    const require = /\b(?:must|always|required|require(?:s|d)?)\b/i.test(statement);
    if (!forbid && !require) continue;
    directives.push({
      key: directiveKey(statement),
      polarity: forbid ? "FORBID" : "REQUIRE",
      statement: statement.slice(0, 500),
      line: index + 1,
    });
    if (directives.length >= 100) break;
  }
  return directives;
}

export function detectAgentConfigurationDrift(entries) {
  const byKey = new Map();
  const specificHarnesses = new Set(
    entries
      .map((entry) => entry.harness)
      .filter((harness) => ["CLAUDE", "CODEX", "CURSOR", "LOOM"].includes(harness)),
  );
  for (const entry of entries) {
    for (const directive of entry.directives) {
      const current = byKey.get(directive.key) ?? [];
      current.push({ entry, directive });
      byKey.set(directive.key, current);
    }
  }
  const findings = [];
  for (const [key, rows] of [...byKey.entries()].sort(([left], [right]) => left.localeCompare(right))) {
    if (rows.length < 2) continue;
    const sources = rows.slice(0, 20).map(({ entry, directive }) => ({
      path: entry.sourcePath,
      harness: entry.harness,
      statement: directive.statement,
    }));
    const polarities = new Set(rows.map(({ directive }) => directive.polarity));
    if (polarities.size > 1) {
      findings.push({
        findingType: "CONTRADICTION",
        severity: "HIGH",
        normalizedKey: key,
        summary: `Conflicting requirements detected for ${key}.`,
        sources,
        suggestedRemediation: "Choose one explicit rule through review, then remove or scope the conflicting directive.",
      });
      const precedence = new Set(rows.map(({ entry }) => entry.effectivePrecedence));
      if (precedence.size > 1) {
        findings.push({
          findingType: "PRECEDENCE_SHADOW",
          severity: "WARNING",
          normalizedKey: key,
          summary: `A higher-precedence instruction shadows a conflicting ${key} rule.`,
          sources,
          suggestedRemediation: "Keep the exception close to its scope and document why it overrides the broader rule.",
        });
      }
      continue;
    }
    const normalizedStatements = new Set(rows.map(({ directive }) => directive.statement.toLowerCase().replace(/\s+/g, " ")));
    if (normalizedStatements.size < rows.length) {
      findings.push({
        findingType: "DUPLICATE_INTENT",
        severity: "INFO",
        normalizedKey: key,
        summary: `The same ${key} instruction appears in multiple configuration sources.`,
        sources,
        suggestedRemediation: "Consolidate the shared rule at the narrowest common scope when practical.",
      });
    }
  }
  for (const [key, rows] of [...byKey.entries()].sort(([left], [right]) => left.localeCompare(right))) {
    const requiredHarnesses = new Set(rows
      .filter(({ entry, directive }) => specificHarnesses.has(entry.harness) && directive.polarity === "REQUIRE")
      .map(({ entry }) => entry.harness));
    if (requiredHarnesses.size < 2) continue;
    const missing = [...specificHarnesses].filter((harness) => !requiredHarnesses.has(harness));
    if (!missing.length) continue;
    findings.push({
      findingType: "COVERAGE_GAP",
      severity: "INFO",
      normalizedKey: key,
      summary: `${key} is required by ${[...requiredHarnesses].join(", ")} but absent from configured ${missing.join(", ")} sources.`,
      sources: rows.slice(0, 20).map(({ entry, directive }) => ({
        path: entry.sourcePath,
        harness: entry.harness,
        statement: directive.statement,
      })),
      suggestedRemediation: "Review whether the missing harness should inherit or explicitly project the shared requirement.",
    });
  }
  return findings.slice(0, 200);
}

function listTrackedFiles(root) {
  const output = execFileSync("git", ["ls-files", "-z"], {
    cwd: root,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  return output.split("\0").filter(Boolean).sort();
}

function lastChangedCommit(root, path) {
  try {
    return execFileSync("git", ["log", "-1", "--format=%H", "--", path], {
      cwd: root,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim() || undefined;
  } catch {
    return undefined;
  }
}

export function scanAgentConfiguration(rootDirectory, limits = AGENT_CONFIG_SCAN_LIMITS) {
  const root = realpathSync(resolve(rootDirectory));
  const maximumFiles = Math.min(AGENT_CONFIG_SCAN_LIMITS.maximumFiles, Math.max(1, Math.floor(limits.maximumFiles ?? AGENT_CONFIG_SCAN_LIMITS.maximumFiles)));
  const maximumBytesPerFile = Math.min(AGENT_CONFIG_SCAN_LIMITS.maximumBytesPerFile, Math.max(1, Math.floor(limits.maximumBytesPerFile ?? AGENT_CONFIG_SCAN_LIMITS.maximumBytesPerFile)));
  const candidates = listTrackedFiles(root)
    .map((path) => ({ path: normalizedPath(path), classification: classifyAgentConfigurationPath(path) }))
    .filter((item) => item.classification)
    .slice(0, maximumFiles);
  const entries = [];
  for (const candidate of candidates) {
    const absolute = resolve(root, candidate.path);
    if (relative(root, absolute).startsWith(`..${sep}`) || relative(root, absolute) === "..") continue;
    let stat;
    let content;
    try {
      stat = lstatSync(absolute);
      if (!stat.isFile() || stat.isSymbolicLink() || stat.size > maximumBytesPerFile) continue;
      content = readFileSync(absolute, "utf8");
    } catch {
      // A tracked file may disappear between inventory and read. The next scan
      // will reconcile it; partial advisory scans remain safe and bounded.
      continue;
    }
    const directives = extractAgentConfigurationDirectives(content);
    entries.push({
      sourcePath: candidate.path,
      harness: candidate.classification.harness,
      kind: candidate.classification.kind,
      scope: candidate.classification.scope,
      digest: digest(content),
      effectivePrecedence: candidate.classification.precedence,
      lastChangedCommit: lastChangedCommit(root, candidate.path),
      directives,
      overlapKeys: [],
    });
  }
  const keyCounts = new Map();
  for (const entry of entries) {
    for (const key of new Set(entry.directives.map((directive) => directive.key))) {
      keyCounts.set(key, (keyCounts.get(key) ?? 0) + 1);
    }
  }
  for (const entry of entries) {
    entry.overlapKeys = [...new Set(entry.directives.map((directive) => directive.key).filter((key) => keyCounts.get(key) > 1))].sort();
  }
  const findings = detectAgentConfigurationDrift(entries);
  const commitSha = execFileSync("git", ["rev-parse", "HEAD"], { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
  const scanDigest = digest(JSON.stringify({
    commitSha,
    entries: entries.map(({ sourcePath, digest: entryDigest, directives }) => ({ sourcePath, digest: entryDigest, directives })),
    findings,
  }));
  return {
    scannerVersion: "factory-learning-v1",
    commitSha,
    scanDigest,
    limits: { maximumFiles, maximumBytesPerFile },
    entries,
    findings,
  };
}
