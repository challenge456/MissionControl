export const SKILL_AUTOMATION_POLICY_VERSION = "skill-automation-v1";

export const ADAPTER_TYPES = [
  "PLAYWRIGHT",
  "API",
  "TYPESCRIPT",
  "PYTHON",
  "SHELL",
  "WORKFLOW",
  "SKILL_PIPELINE",
] as const;

export type SkillAutomationAdapter = typeof ADAPTER_TYPES[number];

export interface SkillAutomationProfile {
  deterministic: boolean;
  category?: string;
  inputSchema?: unknown;
  outputSchema?: unknown;
  preconditions?: string[];
  successCriteria?: string[];
  failureConditions?: string[];
  runtimeRequirements?: string[];
  requiredPermissions?: string[];
  secretReferences?: string[];
  recommendedAdapter?: SkillAutomationAdapter;
  verificationMethod?: string;
  existingImplementation?: string;
  existingTests?: string[];
  deterministicSteps?: string[];
  unrestrictedReasoning?: boolean;
  requiresMutation?: boolean;
}

export interface SkillEligibilityInput {
  skillId?: string;
  version?: string;
  status?: string;
  profile?: SkillAutomationProfile | null;
}

export interface SkillEligibilityResult {
  status: "ELIGIBLE" | "POTENTIALLY_ELIGIBLE" | "INELIGIBLE";
  deterministic: boolean;
  missing: string[];
  blockers: string[];
  recommendedAdapter: SkillAutomationAdapter | null;
  verificationReady: boolean;
  safetyClassification: "LEVEL_1" | "UNSUPPORTED";
  complexity: "LOW" | "MEDIUM" | "HIGH";
}

const REQUIRED_PROFILE_FIELDS: Array<[keyof SkillAutomationProfile, string]> = [
  ["inputSchema", "Deterministic input schema"],
  ["outputSchema", "Defined outputs"],
  ["preconditions", "Explicit preconditions"],
  ["successCriteria", "Expected success condition"],
  ["failureConditions", "Clear failure conditions"],
  ["runtimeRequirements", "Runtime requirements"],
  ["requiredPermissions", "Declared permissions"],
  ["secretReferences", "Declared secrets or environment dependencies"],
  ["verificationMethod", "Independent verification method"],
];

function populated(value: unknown): boolean {
  if (value == null) return false;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "string") return value.trim().length > 0;
  if (typeof value === "object") return Object.keys(value as object).length > 0;
  return true;
}

export function recommendAdapter(profile: SkillAutomationProfile | null | undefined): SkillAutomationAdapter | null {
  if (!profile) return null;
  if (profile.recommendedAdapter && ADAPTER_TYPES.includes(profile.recommendedAdapter)) {
    return profile.recommendedAdapter;
  }
  const category = profile.category?.toLowerCase() ?? "";
  const requirements = (profile.runtimeRequirements ?? []).join(" ").toLowerCase();
  const implementation = profile.existingImplementation?.toLowerCase() ?? "";
  if (/browser|ui|form|accessibility|playwright/.test(`${category} ${requirements} ${implementation}`)) return "PLAYWRIGHT";
  if (/api|rest|graphql|mcp|health/.test(`${category} ${requirements} ${implementation}`)) return "API";
  if (/python|machine learning|data|report/.test(`${category} ${requirements} ${implementation}`)) return "PYTHON";
  if (/shell|cli|build|infrastructure|devops/.test(`${category} ${requirements} ${implementation}`)) return "SHELL";
  if (/workflow|ya?ml/.test(`${requirements} ${implementation}`)) return "WORKFLOW";
  if ((profile.deterministicSteps?.length ?? 0) > 1) return "SKILL_PIPELINE";
  return "TYPESCRIPT";
}

export function evaluateSkillEligibility(input: SkillEligibilityInput): SkillEligibilityResult {
  const profile = input.profile;
  const missing: string[] = [];
  const blockers: string[] = [];
  if (!input.skillId) missing.push("Stable skill identifier");
  if (!input.version) missing.push("Published skill version");
  if (input.status && input.status !== "PUBLISHED") blockers.push("Skill version is not published");
  if (!profile) {
    missing.push("Automation metadata profile");
  } else {
    for (const [field, label] of REQUIRED_PROFILE_FIELDS) {
      // An explicit empty list is a valid declaration for secrets: it means
      // the adapter has no secret dependency, not that analysis was omitted.
      if (field === "secretReferences" && Array.isArray(profile[field])) continue;
      if (!populated(profile[field])) missing.push(label);
    }
    if (!recommendAdapter(profile)) missing.push("Runtime adapter");
    if (!profile.deterministic) blockers.push("Capability is not declared deterministic");
    if (profile.unrestrictedReasoning) blockers.push("Requires unrestricted autonomous reasoning");
    if (profile.requiresMutation) blockers.push("Requires write operations outside LEVEL_1");
  }
  const deterministic = !!profile?.deterministic && !profile.unrestrictedReasoning;
  const status = blockers.length > 0
    ? "INELIGIBLE"
    : missing.length === 0
      ? "ELIGIBLE"
      : deterministic
        ? "POTENTIALLY_ELIGIBLE"
        : "INELIGIBLE";
  return {
    status,
    deterministic,
    missing,
    blockers,
    recommendedAdapter: recommendAdapter(profile),
    verificationReady: populated(profile?.verificationMethod),
    safetyClassification: profile?.requiresMutation ? "UNSUPPORTED" : "LEVEL_1",
    complexity: missing.length > 3 ? "HIGH" : missing.length > 0 ? "MEDIUM" : "LOW",
  };
}

export function validateSecretReferences(values: string[]): string[] {
  return values.flatMap((value) => {
    if (!/^[A-Z][A-Z0-9_]{2,}$/.test(value)) return [`Invalid secret reference: ${value}`];
    if (/[=:]/.test(value)) return [`Secret values must not be stored inline: ${value}`];
    return [];
  });
}

export function validateArtifactPath(path: string): string[] {
  if (!path.trim()) return ["Artifact path is required"];
  if (path.startsWith("/") || path.includes("..") || path.includes("\\") || path.includes("\0")) {
    return ["Artifact path must remain inside the approved repository"];
  }
  if (!/^[A-Za-z0-9._/-]+$/.test(path)) return ["Artifact path contains unsupported characters"];
  return [];
}

export function validateCron(cron?: string): string[] {
  if (!cron) return [];
  const parts = cron.trim().split(/\s+/);
  if (parts.length !== 5) return ["Cron must contain exactly five fields"];
  if (parts.some((part) => !/^[\d*/?,\-]+$/.test(part))) return ["Cron contains unsupported syntax"];
  return [];
}

export function validateArtifactConfiguration(input: {
  adapterType: SkillAutomationAdapter;
  path: string;
  command?: string;
  secretReferences?: string[];
  isMutating?: boolean;
  automaticDispatch?: boolean;
  approvalRequired?: boolean;
  receiptRequired?: boolean;
  cron?: string;
  content?: string;
  steps?: unknown[];
}): string[] {
  const findings = [
    ...validateArtifactPath(input.path),
    ...validateSecretReferences(input.secretReferences ?? []),
    ...validateCron(input.cron),
  ];
  if (input.isMutating) findings.push("LEVEL_1 Automations cannot request write operations");
  if (input.automaticDispatch) findings.push("Automatic dispatch is not supported");
  if (input.approvalRequired === false) findings.push("Operator approval is required");
  if (input.receiptRequired === false) findings.push("Independent receipt is required");
  if (input.adapterType === "SHELL" && (!input.command || !/^(pnpm|npm|yarn|node|python3?|pytest|git|gh|curl)\s+[A-Za-z0-9@%_+.,:/=\- ]+$/.test(input.command))) {
    findings.push("Shell command is missing or outside the deterministic allowlist");
  }
  if (input.adapterType === "WORKFLOW" && (!input.command || /[;&|`$<>]|\.\./.test(input.command))) {
    findings.push("Workflow command is missing or contains unsupported shell syntax");
  }
  if (input.adapterType === "SKILL_PIPELINE") {
    if (!Array.isArray(input.steps) || input.steps.length === 0) {
      findings.push("Skill pipeline requires at least one ordered deterministic step");
    } else {
      for (const [index, step] of input.steps.entries()) {
        const value = step as Record<string, unknown>;
        const command = String(value?.command ?? "");
        const type = String(value?.adapterType ?? "SHELL").toUpperCase();
        if (!["API", "SHELL", "TYPESCRIPT", "PYTHON"].includes(type)) findings.push(`Pipeline step ${index + 1} uses an unsupported adapter`);
        if (type !== "API" && (!command || /[;&|`$<>]|\.\./.test(command))) findings.push(`Pipeline step ${index + 1} command is unsafe`);
      }
    }
  }
  if (input.content && /\$\{[^}]+\}|\beval\s*\(|\bFunction\s*\(/.test(input.content)) {
    findings.push("Artifact contains unsafe dynamic interpolation or evaluation");
  }
  if (input.content && ["API", "SKILL_PIPELINE"].includes(input.adapterType)) {
    try { JSON.parse(input.content); } catch { findings.push("Artifact JSON syntax is invalid"); }
  }
  if (input.content && input.adapterType === "SHELL" && /(^|\n)\s*(sudo|rm\s+-rf|chmod\s+777|curl.+\|\s*(sh|bash))\b/.test(input.content)) {
    findings.push("Shell artifact contains a prohibited operation");
  }
  return findings;
}

export function generatedArtifactPath(adapter: SkillAutomationAdapter, slug: string): string {
  const safeSlug = slug.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  if (adapter === "PLAYWRIGHT") return `tests/automations/${safeSlug}/${safeSlug}.spec.ts`;
  if (adapter === "API") return `automations/${safeSlug}/${safeSlug}.api.json`;
  if (adapter === "PYTHON") return `automations/${safeSlug}/${safeSlug}.py`;
  if (adapter === "SHELL") return `automations/${safeSlug}/${safeSlug}.sh`;
  if (adapter === "WORKFLOW") return `workflows/${safeSlug}.yaml`;
  if (adapter === "SKILL_PIPELINE") return `automations/${safeSlug}/pipeline.json`;
  return `automations/${safeSlug}/${safeSlug}.ts`;
}

export function generateArtifact(input: {
  adapterType: SkillAutomationAdapter;
  name: string;
  description: string;
  path: string;
  configuration: Record<string, any>;
}): string {
  const title = JSON.stringify(input.name);
  const description = JSON.stringify(input.description);
  const config = input.configuration;
  if (input.adapterType === "PLAYWRIGHT") {
    return `import { test, expect } from "@playwright/test";

test(${title}, async ({ page }) => {
  await page.goto(process.env.AUTOMATION_BASE_URL ?? ${JSON.stringify(config.baseUrl ?? "http://127.0.0.1:5199")});
  await expect(page.getByRole("navigation", { name: "Primary" })).toBeVisible();
  await expect(page).toHaveTitle(/Mission Control/i);
  await page.screenshot({ path: "test-results/automation-evidence.png", fullPage: true });
});
`;
  }
  if (input.adapterType === "API") {
    return JSON.stringify({
      name: input.name,
      description: input.description,
      method: config.method ?? "GET",
      baseUrlEnv: "AUTOMATION_BASE_URL",
      endpoint: config.endpoint ?? "/health",
      expectedStatus: config.expectedStatus ?? 200,
      redactHeaders: ["authorization", "cookie", "x-api-key"],
    }, null, 2);
  }
  if (input.adapterType === "PYTHON") {
    return `"""${input.description.replace(/"""/g, "")}"""\nimport json\n\ndef main() -> int:\n    print(json.dumps({"status": "passed", "name": ${title}}))\n    return 0\n\nif __name__ == "__main__":\n    raise SystemExit(main())\n`;
  }
  if (input.adapterType === "SHELL") {
    return `#!/usr/bin/env bash\nset -euo pipefail\n${config.command ?? "pnpm run typecheck"}\n`;
  }
  if (input.adapterType === "WORKFLOW") {
    return `name: ${input.name}\nversion: 1\nreadOnly: true\nsteps:\n  - id: validate\n    type: deterministic\n    command: ${config.command ?? "pnpm run typecheck"}\n`;
  }
  if (input.adapterType === "SKILL_PIPELINE") {
    return JSON.stringify({
      name: input.name,
      description: input.description,
      failurePolicy: "STOP",
      steps: config.steps ?? [],
    }, null, 2);
  }
  return `export const automation = {\n  name: ${title},\n  description: ${description},\n  readOnly: true,\n  async run(input: unknown) {\n    return { status: "passed" as const, input };\n  },\n};\n`;
}

export function finalReceiptDecision(input: {
  runStatus: string;
  receiptStatus?: string;
}): "VERIFIED" | "REJECTED" | "AWAITING_VERIFICATION" {
  if (input.runStatus !== "COMPLETED") return input.runStatus === "FAILED" ? "REJECTED" : "AWAITING_VERIFICATION";
  if (input.receiptStatus === "PASSED") return "VERIFIED";
  if (input.receiptStatus === "FAILED") return "REJECTED";
  return "AWAITING_VERIFICATION";
}
