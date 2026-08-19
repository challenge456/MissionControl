/**
 * Exact remote workload fixtures from Production Factory Pilot V1.
 * Keep these inputs frozen so the regression cannot be made easier by
 * changing the workload after observing a failure.
 */
export const REMOTE_CODEX_QUALIFICATION_WORKLOADS = Object.freeze([
  {
    key: "bug-fix",
    class: "BUG_FIX",
    title: "Correct integer-cent listing fee behavior",
    risk: "LOW",
    allowedPaths: ["src/**"],
    acceptanceCriteria: [
      { id: "BUG-001", title: "Five-percent regression passes" },
      { id: "BUG-002", title: "Invalid inputs fail closed" },
    ],
    prompt: "Fix the listing fee defect in src/listingFee.mjs. The fee is five percent of non-negative integer cents, rounded to the nearest cent. Preserve strict input validation. Do not modify tests or package.json. Run npm test.",
    files: {
      "package.json": "{\"name\":\"pilot-bug-fix\",\"private\":true,\"type\":\"module\",\"scripts\":{\"test\":\"node --test\"}}\n",
      "src/listingFee.mjs": "export function listingFee(cents) {\n  if (!Number.isSafeInteger(cents) || cents < 0) throw new TypeError(\"cents must be a non-negative integer\");\n  return Math.round(cents * 0.03);\n}\n",
      "tests/listingFee.test.mjs": "import test from 'node:test';\nimport assert from 'node:assert/strict';\nimport { listingFee } from '../src/listingFee.mjs';\ntest('charges five percent in integer cents', () => { assert.equal(listingFee(10_000), 500); assert.equal(listingFee(399), 20); assert.equal(listingFee(0), 0); });\ntest('rejects invalid money', () => { assert.throws(() => listingFee(-1), TypeError); assert.throws(() => listingFee(1.5), TypeError); });\n",
    },
  },
  {
    key: "security-policy",
    class: "SECURITY_POLICY",
    title: "Fail closed when authorization context is missing",
    risk: "HIGH",
    allowedPaths: ["src/**"],
    acceptanceCriteria: [
      { id: "SECURITY-001", title: "Missing context fails closed" },
      { id: "SECURITY-002", title: "Role allowlist is exact" },
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
    acceptanceCriteria: [
      { id: "MIGRATION-001", title: "Mixed-version reads remain compatible" },
      { id: "MIGRATION-002", title: "Forward migration preserves data" },
      { id: "MIGRATION-003", title: "Rollback restores the legacy shape" },
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

export const REMOTE_CODEX_QUALIFICATION_SCHEDULE = Object.freeze([
  { phase: "STRUCTURED_OUTPUT_QUALIFICATION", executionId: "qualification-bug-fix-1", workloadKey: "bug-fix" },
  { phase: "STRUCTURED_OUTPUT_QUALIFICATION", executionId: "qualification-data-migration-1", workloadKey: "data-migration" },
  { phase: "STRUCTURED_OUTPUT_QUALIFICATION", executionId: "qualification-bug-fix-2", workloadKey: "bug-fix" },
  { phase: "STRUCTURED_OUTPUT_QUALIFICATION", executionId: "qualification-data-migration-2", workloadKey: "data-migration" },
  { phase: "STRUCTURED_OUTPUT_QUALIFICATION", executionId: "qualification-bug-fix-3", workloadKey: "bug-fix" },
  { phase: "PILOT_REMOTE_REGRESSION", executionId: "pilot-regression-bug-fix-3", workloadKey: "bug-fix" },
  { phase: "PILOT_REMOTE_REGRESSION", executionId: "pilot-regression-security-policy-3", workloadKey: "security-policy" },
  { phase: "PILOT_REMOTE_REGRESSION", executionId: "pilot-regression-data-migration-3", workloadKey: "data-migration" },
]);

export function qualificationWorkload(key) {
  const workload = REMOTE_CODEX_QUALIFICATION_WORKLOADS.find((candidate) => candidate.key === key);
  if (!workload) throw new Error(`Unknown frozen remote qualification workload: ${key}`);
  return workload;
}
