export const PILOT_SCHEMA = "production-factory-pilot/v3";
export const PILOT_BASELINE_SHA = "db44819ec59e79cdd71ba9ed36fce8064a120af3";

export const SECURITY_CONFIGURATION_D_CONTEXT = "Authorized repository context: this is a bounded code change in a disposable fixture repository. Editing src/authorization.mjs and running the existing tests are explicitly authorized by the approved WorkOrder. No production identity, credential, policy bypass, publication, acceptance, or provider administration is requested. The required JSON is the terminal execution report after the code edit and test, not a substitute for the code change.";

export function qualifiedWorkloadConfiguration(workloadKey) {
  const security = workloadKey === "security-policy";
  const migration = workloadKey === "data-migration";
  return {
    schema: "factory-qualified-workload-configuration/v1",
    workloadKey,
    securityContextVariant: security ? "D" : null,
    additionalAuthorizedContext: security ? SECURITY_CONFIGURATION_D_CONTEXT : null,
    runtimeMs: migration ? 420_000 : 300_000,
    executorTimeoutMs: migration ? 390_000 : 270_000,
    modelMetadataConfig: "supported",
    globalDefault: false,
  };
}

export const PRODUCTION_FACTORY_WORKLOADS = Object.freeze([
  {
    key: "bug-fix",
    class: "BUG_FIX",
    title: "Correct integer-cent listing fee behavior",
    risk: "LOW",
    allowedPaths: ["src/**"],
    requirements: [
      "Listing fees use five percent of non-negative integer cents.",
      "Invalid monetary inputs fail deterministically.",
    ],
    acceptanceCriteria: [
      { id: "BUG-001", title: "Five-percent regression passes", method: "node --test" },
      { id: "BUG-002", title: "Invalid inputs fail closed", method: "node --test" },
    ],
    prompt: "Fix the listing fee defect in src/listingFee.mjs. The fee is five percent of non-negative integer cents, rounded to the nearest cent. Preserve strict input validation. Do not modify tests or package.json. Run npm test.",
    files: {
      "package.json": "{\"name\":\"pilot-bug-fix\",\"private\":true,\"type\":\"module\",\"scripts\":{\"test\":\"node --test\"}}\n",
      "src/listingFee.mjs": "export function listingFee(cents) {\n  if (!Number.isSafeInteger(cents) || cents < 0) throw new TypeError(\"cents must be a non-negative integer\");\n  return Math.round(cents * 0.03);\n}\n",
      "tests/listingFee.test.mjs": "import test from 'node:test';\nimport assert from 'node:assert/strict';\nimport { listingFee } from '../src/listingFee.mjs';\ntest('charges five percent in integer cents', () => { assert.equal(listingFee(10_000), 500); assert.equal(listingFee(399), 20); assert.equal(listingFee(0), 0); });\ntest('rejects invalid money', () => { assert.throws(() => listingFee(-1), TypeError); assert.throws(() => listingFee(1.5), TypeError); });\n",
    },
  },
  {
    key: "feature",
    class: "FEATURE",
    title: "Add a multi-file pricing preview",
    risk: "MEDIUM",
    allowedPaths: ["src/**"],
    requirements: [
      "Pricing preview exposes subtotal, five-percent fee, and total in cents.",
      "A separate formatter produces a stable human-readable summary.",
    ],
    acceptanceCriteria: [
      { id: "FEATURE-001", title: "Preview API returns exact integer-cent totals", method: "node --test" },
      { id: "FEATURE-002", title: "Preview formatter is stable", method: "node --test" },
    ],
    prompt: "Implement the approved pricing preview feature. Add src/pricingPreview.mjs exporting buildPricingPreview(items), and src/formatPricingPreview.mjs exporting formatPricingPreview(preview). Sum item priceCents * quantity, add a rounded five-percent fee, and return subtotalCents, feeCents, and totalCents. Format exactly `Subtotal: $100.00 · Fee: $5.00 · Total: $105.00`. Do not modify tests or package.json. Run npm test.",
    files: {
      "package.json": "{\"name\":\"pilot-feature\",\"private\":true,\"type\":\"module\",\"scripts\":{\"test\":\"node --test\"}}\n",
      "src/cart.mjs": "export function subtotalCents(items) {\n  return items.reduce((sum, item) => sum + item.priceCents * item.quantity, 0);\n}\n",
      "tests/pricingPreview.test.mjs": "import test from 'node:test';\nimport assert from 'node:assert/strict';\nimport { buildPricingPreview } from '../src/pricingPreview.mjs';\nimport { formatPricingPreview } from '../src/formatPricingPreview.mjs';\ntest('builds an exact preview', () => { const value = buildPricingPreview([{ priceCents: 2_500, quantity: 4 }]); assert.deepEqual(value, { subtotalCents: 10_000, feeCents: 500, totalCents: 10_500 }); assert.equal(formatPricingPreview(value), 'Subtotal: $100.00 · Fee: $5.00 · Total: $105.00'); });\n",
    },
  },
  {
    key: "refactor",
    class: "REFACTOR",
    title: "Extract pricing policy without behavior change",
    risk: "LOW",
    allowedPaths: ["src/**"],
    requirements: [
      "Public quote behavior remains byte-for-byte equivalent for governed cases.",
      "The platform fee calculation moves to a focused policy module.",
    ],
    acceptanceCriteria: [
      { id: "REFACTOR-001", title: "Behavioral contract remains unchanged", method: "node --test" },
      { id: "REFACTOR-002", title: "Fee policy is extracted", method: "changed-file inspection" },
    ],
    prompt: "Refactor src/pricing.mjs without changing observable behavior. Extract calculatePlatformFee(subtotalCents) into a new src/feePolicy.mjs and import it from src/pricing.mjs. Keep the public quote(items) API unchanged. Do not modify tests or package.json. Run npm test.",
    files: {
      "package.json": "{\"name\":\"pilot-refactor\",\"private\":true,\"type\":\"module\",\"scripts\":{\"test\":\"node --test\"}}\n",
      "src/pricing.mjs": "function calculatePlatformFee(subtotalCents) { return Math.round(subtotalCents * 0.05); }\nexport function quote(items) {\n  const subtotalCents = items.reduce((sum, item) => sum + item.priceCents * item.quantity, 0);\n  const feeCents = calculatePlatformFee(subtotalCents);\n  return { subtotalCents, feeCents, totalCents: subtotalCents + feeCents };\n}\n",
      "tests/pricing.test.mjs": "import test from 'node:test';\nimport assert from 'node:assert/strict';\nimport { quote } from '../src/pricing.mjs';\ntest('preserves quote behavior', () => { assert.deepEqual(quote([{ priceCents: 1999, quantity: 2 }]), { subtotalCents: 3998, feeCents: 200, totalCents: 4198 }); assert.deepEqual(quote([]), { subtotalCents: 0, feeCents: 0, totalCents: 0 }); });\n",
    },
  },
  {
    key: "security-policy",
    class: "SECURITY_POLICY",
    title: "Fail closed when authorization context is missing",
    risk: "HIGH",
    allowedPaths: ["src/**"],
    requirements: [
      "Missing or malformed authorization context is denied.",
      "Only owner and administrator roles may change a listing.",
    ],
    acceptanceCriteria: [
      { id: "SECURITY-001", title: "Missing context fails closed", method: "node --test" },
      { id: "SECURITY-002", title: "Role allowlist is exact", method: "node --test" },
    ],
    prompt: "Fix src/authorization.mjs so canEditListing(context) fails closed. Return true only when context is an object whose role is exactly `owner` or `admin`; all missing, malformed, or other roles return false. Do not modify tests or package.json. Run npm test.",
    files: {
      "package.json": "{\"name\":\"pilot-security\",\"private\":true,\"type\":\"module\",\"scripts\":{\"test\":\"node --test\"}}\n",
      "src/authorization.mjs": "export function canEditListing(context) {\n  if (!context?.role) return true;\n  return ['owner', 'admin'].includes(context.role);\n}\n",
      "tests/authorization.test.mjs": "import test from 'node:test';\nimport assert from 'node:assert/strict';\nimport { canEditListing } from '../src/authorization.mjs';\ntest('fails closed', () => { assert.equal(canEditListing(), false); assert.equal(canEditListing(null), false); assert.equal(canEditListing('owner'), false); assert.equal(canEditListing({}), false); });\ntest('uses exact roles', () => { assert.equal(canEditListing({ role: 'viewer' }), false); assert.equal(canEditListing({ role: 'Owner' }), false); assert.equal(canEditListing({ role: 'owner' }), true); assert.equal(canEditListing({ role: 'admin' }), true); });\n",
    },
  },
  {
    key: "data-migration",
    class: "DATA_SCHEMA_MIGRATION",
    title: "Migrate listing ownership with compatibility and rollback",
    risk: "HIGH",
    allowedPaths: ["src/**", "migrations/**"],
    requirements: [
      "Current reads prefer ownerId and remain compatible with the legacy owner field.",
      "Forward migration and rollback preserve unrelated fields and ownership data.",
    ],
    acceptanceCriteria: [
      { id: "MIGRATION-001", title: "Mixed-version reads remain compatible", method: "node --test" },
      { id: "MIGRATION-002", title: "Forward migration preserves data", method: "node --test" },
      { id: "MIGRATION-003", title: "Rollback restores the legacy shape", method: "node --test" },
    ],
    prompt: "Implement the approved ownership schema migration. In src/orderOwnership.mjs implement readOwnerId(record) that prefers ownerId and falls back to legacy owner. Add migrations/001-owner-id.mjs exporting migrateOwner(record) and rollbackOwner(record); each must preserve unrelated fields, move the ownership value, remove only the superseded key, and be idempotent. Do not modify tests or package.json. Run npm test.",
    files: {
      "package.json": "{\"name\":\"pilot-migration\",\"private\":true,\"type\":\"module\",\"scripts\":{\"test\":\"node --test\"}}\n",
      "src/orderOwnership.mjs": "export function readOwnerId(record) { return record.ownerId ?? null; }\n",
      "migrations/001-owner-id.mjs": "export function migrateOwner(record) { return record; }\nexport function rollbackOwner(record) { return record; }\n",
      "tests/orderOwnership.test.mjs": "import test from 'node:test';\nimport assert from 'node:assert/strict';\nimport { readOwnerId } from '../src/orderOwnership.mjs';\nimport { migrateOwner, rollbackOwner } from '../migrations/001-owner-id.mjs';\ntest('reads mixed versions', () => { assert.equal(readOwnerId({ ownerId: 'new', owner: 'old' }), 'new'); assert.equal(readOwnerId({ owner: 'legacy' }), 'legacy'); assert.equal(readOwnerId({}), null); });\ntest('migrates forward idempotently', () => { const value = migrateOwner({ id: 'o1', owner: 'u1', amount: 20 }); assert.deepEqual(value, { id: 'o1', ownerId: 'u1', amount: 20 }); assert.deepEqual(migrateOwner(value), value); });\ntest('rolls back idempotently', () => { const value = rollbackOwner({ id: 'o1', ownerId: 'u1', amount: 20 }); assert.deepEqual(value, { id: 'o1', owner: 'u1', amount: 20 }); assert.deepEqual(rollbackOwner(value), value); });\n",
    },
  },
]);

export function buildPilotSchedule() {
  return PRODUCTION_FACTORY_WORKLOADS.flatMap((workload) => [1, 2, 3].map((repetition) => ({
    workload,
    repetition,
    executionId: `${workload.key}-${repetition}`,
    backend: repetition === 3 && ["bug-fix", "security-policy", "data-migration"].includes(workload.key)
      ? "remote-sandbox"
      : "persistent-worker",
  })));
}

export function buildPilotExecutionPrompt(workloadPrompt, acceptanceCriteria, attemptNumber, additionalAuthorizedContext = null) {
  const acceptanceCriterionIds = acceptanceCriteria.map((criterion) => criterion.id);
  return [
    workloadPrompt,
    additionalAuthorizedContext,
    attemptNumber > 1
      ? "This is a new recovery Attempt with fresh identity. Do not assume artifacts or verification from the prior failed Attempt."
      : "This is the first Attempt.",
    "Return exactly one JSON object and no prose. Use the literal string factory-result/v1 for schema. Use exactly one uppercase status: COMPLETED, BLOCKED, or FAILED. completedAcceptanceCriterionIds, incompleteAcceptanceCriterionIds, unknownAcceptanceCriterionIds, verificationCommands, and knownRisks must always be JSON arrays of strings, including when empty. summary and nextAction must be JSON strings.",
    "When status is COMPLETED, every listed acceptance criterion ID must appear exactly once in completedAcceptanceCriterionIds, and incompleteAcceptanceCriterionIds and unknownAcceptanceCriterionIds must both be empty. Never use success as a status and never use a scalar string such as None for an array field.",
    '{"schema":"factory-result/v1","status":"COMPLETED","summary":"Implemented and tested the bounded change.","completedAcceptanceCriterionIds":["criterion-id"],"incompleteAcceptanceCriterionIds":[],"unknownAcceptanceCriterionIds":[],"verificationCommands":["npm test"],"knownRisks":[],"nextAction":"Review the exact candidate."}',
    "Acceptance criteria:",
    ...acceptanceCriteria.map((criterion) => `- [${criterion.id}] ${criterion.title}`),
    `Use only these acceptance criterion IDs: ${acceptanceCriterionIds.join(", ")}.`,
  ].join("\n\n");
}

export function rate(numerator, denominator) {
  return denominator > 0 ? numerator / denominator : null;
}

export function percentile(values, fraction) {
  const observed = values.filter((value) => Number.isFinite(value)).sort((left, right) => left - right);
  if (!observed.length) return null;
  const index = Math.min(observed.length - 1, Math.max(0, Math.ceil(fraction * observed.length) - 1));
  return observed[index];
}

function dimension(observedValue, sampleCount, population, limitations = []) {
  return {
    observedValue,
    sampleCount,
    coverage: rate(sampleCount, population),
    confidence: sampleCount === population ? "HIGH" : sampleCount >= Math.ceil(population / 2) ? "MEDIUM" : "LOW",
    limitations,
  };
}

export function buildReliabilityScorecard(executions, failureInjections = []) {
  const completed = executions.filter((execution) => execution.eventualSuccess);
  const verified = executions.filter((execution) => execution.verification?.verdict === "VERIFIED");
  const cleanupObserved = executions.filter((execution) => execution.cleanup?.observed === true);
  const cleanupPassed = cleanupObserved.filter((execution) => execution.cleanup?.passed === true);
  const contextObserved = executions.filter((execution) => execution.context?.sufficient !== null && execution.context?.sufficient !== undefined);
  const firstPass = executions.filter((execution) => execution.firstPassSuccess);
  const recovered = executions.filter((execution) => execution.retries > 0 && execution.eventualSuccess);
  const recoveryPopulation = executions.filter((execution) => execution.retries > 0);
  const evidenceObserved = executions.filter((execution) => Number.isFinite(execution.evidenceCompleteness));
  const reviewObserved = executions.filter((execution) => execution.review?.correctionRequired !== null && execution.review?.correctionRequired !== undefined);
  const reviewCorrections = reviewObserved.filter((execution) => execution.review.correctionRequired);
  const costObserved = executions.filter((execution) => Number.isFinite(execution.cost?.totalUsd));
  const latencyObserved = executions.map((execution) => execution.metrics?.totalCycleMs).filter(Number.isFinite);
  return {
    schemaVersion: "factory-reliability-scorecard/v1",
    population: executions.length,
    dimensions: {
      executionReliability: dimension(rate(completed.length, executions.length), executions.length, executions.length),
      verificationReliability: dimension(rate(verified.length, executions.length), executions.length, executions.length),
      cleanupReliability: dimension(rate(cleanupPassed.length, cleanupObserved.length), cleanupObserved.length, executions.length, cleanupObserved.length < executions.length ? ["Cleanup is observed only where the execution backend exposes a cleanup receipt."] : []),
      contextSufficiency: dimension(rate(contextObserved.filter((item) => item.context.sufficient).length, contextObserved.length), contextObserved.length, executions.length),
      firstPassQuality: dimension(rate(firstPass.length, executions.length), executions.length, executions.length),
      recoveryEffectiveness: dimension(rate(recovered.length, recoveryPopulation.length), recoveryPopulation.length, executions.length, recoveryPopulation.length === 0 ? ["No retries were observed; recovery effectiveness is unknown."] : []),
      evidenceCompleteness: dimension(evidenceObserved.length ? evidenceObserved.reduce((sum, item) => sum + item.evidenceCompleteness, 0) / evidenceObserved.length : null, evidenceObserved.length, executions.length),
      reviewCorrectionFrequency: dimension(rate(reviewCorrections.length, reviewObserved.length), reviewObserved.length, executions.length),
      costEfficiency: dimension(costObserved.length ? rate(costObserved.filter((item) => item.eventualSuccess).length, costObserved.reduce((sum, item) => sum + item.cost.totalUsd, 0)) : null, costObserved.length, executions.length, costObserved.length < executions.length ? ["Missing model or provider cost remains null and cannot improve this dimension."] : []),
      latency: dimension(latencyObserved.length ? { medianMs: percentile(latencyObserved, 0.5), p95Ms: percentile(latencyObserved, 0.95) } : null, latencyObserved.length, executions.length),
    },
    failureInjectionCoverage: dimension(
      rate(failureInjections.filter((item) => item.failClosed && item.recoveryProven).length, failureInjections.length),
      failureInjections.length,
      failureInjections.length,
    ),
  };
}

export function validatePilotDataset(dataset) {
  const errors = [];
  if (dataset?.schemaVersion !== PILOT_SCHEMA) errors.push("Pilot schema is invalid.");
  if (dataset?.baseline?.sha !== PILOT_BASELINE_SHA) errors.push("Pilot baseline SHA is not the approved exact main.");
  if (dataset?.baseline?.runtimeContract !== 30) errors.push("Pilot runtime contract is not v30.");
  if (!Array.isArray(dataset?.executions) || dataset.executions.length < 15) errors.push("At least 15 governed executions are required.");
  const executions = dataset?.executions ?? [];
  const classes = new Set(executions.map((item) => item.workloadClass));
  if (classes.size < 5) errors.push("Five materially different workload classes are required.");
  if (["BUG_FIX", "FEATURE", "REFACTOR", "SECURITY_POLICY", "DATA_SCHEMA_MIGRATION"].some((workloadClass) => executions.filter((item) => item.workloadClass === workloadClass).length < 3)) errors.push("Every workload class requires at least three governed executions.");
  if (executions.some((item) => !item.attempts?.length || !item.lineage?.workOrderId || !item.lineage?.specDigest)) errors.push("Execution lineage or Attempt history is incomplete.");
  if (executions.some((item) => item.cost?.totalUsd === 0 && item.cost?.observed !== true)) errors.push("Unknown cost cannot be represented as zero.");
  if (dataset?.routingShadow?.guardedAutoEnabled !== false) errors.push("Guarded Auto must remain disabled.");
  if (dataset?.authority?.canonicalAcceptance !== "workOrders.accept") errors.push("Canonical acceptance authority is incorrect.");
  if (executions.some((item) => item.terminalStructuredResult !== true)) errors.push("Every execution requires a valid terminal structured result.");
  if (executions.some((item) => item.eventualSuccess !== true || item.acceptance?.accepted !== true)) errors.push("Every intended workload must reach verified exact-current eligibility and human acceptance.");
  if (executions.some((item) => item.firstPassStructuredResultSuccess !== true)) errors.push("Every intended workload must produce a first-pass terminal structured result.");
  if (executions.some((item) => item.firstPassVerificationSuccess !== true)) errors.push("Every intended workload must pass first-pass independent verification.");
  const reviewTraversal = ["INTENT", "CRITERION", "EVIDENCE", "VERIFICATION", "IMPLEMENTATION_DECISION", "RAW_DIFF"];
  const reviewClasses = new Set(executions.filter((item) => item.review?.reviewPackage?.acceptanceAuthority === false
    && item.review?.residualAiEnabled === false
    && reviewTraversal.every((stage) => item.review?.reviewPackage?.traversal?.includes(stage))
    && item.review?.reviewPackage?.rawDiffDigest
    && item.review?.implementationDecisions?.length
    && item.review?.criterionTrace?.every((trace) => trace.specRequirements?.length && trace.verificationChecks?.length && trace.evidence?.length))
    .map((item) => item.workloadClass));
  if (reviewClasses.size < 5) errors.push("Review Intelligence requires a complete non-accepting traversal for a representative workload in every class.");
  const remote = executions.filter((item) => item.backend === "remote-sandbox");
  const requiredRemoteKeys = new Set(["bug-fix", "security-policy", "data-migration"]);
  if (remote.length < 3 || [...requiredRemoteKeys].some((key) => !remote.some((item) => item.workloadKey === key)) || remote.some((item) => !item.firstPassSuccess)) errors.push("The remote bug/security/migration gate requires 3/3 first-pass success.");
  if (remote.flatMap((item) => item.attempts ?? []).some((attempt) => attempt.cleanup?.credentialRevoked !== true || attempt.cleanup?.resourceAbsent !== true || attempt.cleanup?.finalVmCount !== 0)) errors.push("Every remote Attempt requires exact revocation and resource-absence proof.");
  if (dataset?.remoteSandboxInventory?.vmCount !== 0) errors.push("Final Remote Sandbox inventory must be zero.");
  if ((dataset?.failureInjections ?? []).length < 12 || (dataset?.failureInjections ?? []).some((item) => !item.failClosed || !item.recoveryProven)) errors.push("Failure-injection coverage is incomplete or did not fail closed.");
  if (dataset?.humanInterventions?.avoidableOperationalToilCount !== 0) errors.push("Hidden manual repair or avoidable operator toil was required.");
  if ((dataset?.unresolvedDefects ?? []).some((item) => ["P0", "P1"].includes(item.priority) && item.status !== "RESOLVED")) errors.push("An unresolved P0/P1 reliability defect remains.");
  if (dataset?.priorEvidenceIntegrity?.unchanged !== true) errors.push("Prior evidence immutability is unproven.");
  if (dataset?.authorityViolations?.length) errors.push("An acceptance, verification, or publication authority violation occurred.");
  return errors;
}
