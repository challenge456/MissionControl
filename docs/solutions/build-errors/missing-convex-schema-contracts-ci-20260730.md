---
module: Convex Schema and CI
date: 2026-07-30
problem_type: build_error
component: database
symptoms:
  - "CI TypeScript and lint gates failed because releaseGateEvaluations was not a Convex TableName"
  - "Automation definition code referenced enabled, sourcePattern, sourceSuggestionId, and lastDraftAt fields absent from generated types"
  - "Local Convex deployment rejected persisted contextEvalRuns.releaseDeploymentId as an extra field"
root_cause: incomplete_setup
resolution_type: code_fix
severity: high
tags: [convex, schema-drift, ci, release-gates, automations]
---

# Troubleshooting: Missing Convex schema contracts break CI

## Problem

Release-gate and review-only automation code was merged without the complete
Convex table and field contract. Generated data-model types therefore rejected
code that was already reading and writing those records.

## Environment

- Module: Convex Schema and CI
- Stage: post-implementation integration
- Affected component: `convex/schema.ts`, release gates, automation definitions
- Date: 2026-07-30

## Symptoms

- `Type '"releaseGateEvaluations"' does not satisfy the constraint 'TableNames'.`
- `Property 'enabled' does not exist on type ... automationDefinitions`.
- `Object contains extra field releaseDeploymentId that is not in the validator.`
- Both TypeScript and lint failed on `main`; build, unit, E2E, and smoke passed.

## What Didn't Work

**Temporary local validator shim:** Adding only
`contextEvalRuns.releaseDeploymentId` allowed browser evidence to run.

- **Why it failed:** It did not define the release-gate table or the
  automation-definition compatibility contract, and it was intentionally not
  committed.

**Treating the failure as a scheduler regression:** The failing PR did not
touch the reported modules.

- **Why it failed:** GitHub history showed the same errors on the preceding
  `main` push runs. Commit `3f367af` introduced the consumers and an incomplete
  schema in the same integration batch.

## Solution

Add the exact persisted/query contract used by the merged code:

```ts
releaseGateEvaluations: defineTable({
  deploymentId: v.id("deployments"),
  status: v.union(v.literal("PASS"), v.literal("WARN"), v.literal("FAIL")),
  mode: v.literal("SHADOW"),
  rationale: v.string(),
  evidenceRefs: v.array(v.string()),
  automationKey: v.optional(v.string()),
  createdAt: v.number(),
})
  .index("by_deployment", ["deploymentId"])
  .index("by_automation_key", ["automationKey"]);
```

Also add optional release linkage to QC, context-eval, and PR-check evidence;
add the compatibility fields and source-suggestion index consumed by the
review-only automation scheduler; and construct new automation definitions
with the required governed fields.

Narrow optional values before passing them to strict helpers:

```ts
definition.enabled === true &&
  !!definition.sourceSuggestionId &&
  !!definition.sourcePattern &&
  isAutomationDraftDue(
    { enabled: true, lastDraftAt: definition.lastDraftAt },
    now,
  );
```

Verification:

```bash
pnpm run ci:typecheck
pnpm exec vitest run convex/__tests__/automationDispatch.test.ts
pnpm run build
```

## Why This Works

Convex generates TypeScript table names, document shapes, and index names from
`convex/schema.ts`. Defining only consumers cannot make a table or field
available. Restoring the additive schema contract aligns compile-time types,
runtime validation, and the indexes used by queries. Populating all required
governed fields keeps newly accepted automation proposals valid without
loosening the established automation-definition model.

## Prevention

- Treat every new Convex query, inserted field, and index as one atomic schema
  change.
- Run `pnpm run ci:typecheck` after integration merges, not only feature-unit
  tests.
- Add a schema-contract test when a new table participates in multiple
  modules.
- Do not commit a local compatibility shim as the full fix.
- Check the latest `main` run before attributing a failure to a feature branch.

## Related Issues

No related issue was previously documented in `docs/solutions/`.
