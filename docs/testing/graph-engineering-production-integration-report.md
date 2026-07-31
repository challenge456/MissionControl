---
date: 2026-07-31
feature: graph-engineering-production-integration
status: passed
---

# Graph Engineering Production Integration Verification

## Result

Passed. The main-repo EOS UI exposes Graph Engineering as a live destination,
keeps graph dispatch explicit, shows the bounded DAG contract and node state,
opens the durable run inspector, and presents failures as recoverable WorkOrder
exceptions.

## Browser Journey

Verified at `http://localhost:5180/v2/harness-loops` using the Software Factory
Demo workspace. Port 5180 is the project's active-development endpoint; 5199
remains the canonical demo command endpoint.

1. Confirmed **Graph Engineering** is visible in the default Intelligence nav.
2. Created a bounded cycle and confirmed no graph was dispatched implicitly.
3. Confirmed the ready card explains the read-only graph and approval boundary.
4. Explicitly dispatched the root WorkOrder.
5. Confirmed the run was pinned as `loop-engineering@v1` with 8 DAG nodes,
   concurrency 3, and 3 independent verification nodes.
6. Opened the Execution Run Inspector and confirmed routing evidence, current
   node, retry count, blocking issue, and continuous evidence lineage.
7. Started and gracefully stopped the executor; confirmed retries, failure
   containment, blocked descendants, and the WorkOrder recovery action.

The first live pass exposed two fresh-deployment dependencies and they were
fixed in this change: built-in workflows are now installed idempotently before
the executor starts, and cycle creation provisions the required project-scoped
`Research Scout` and `Evidence Reviewer` identities.

## Automated Verification

- Full workspace typecheck: passed.
- Mission Control UI production build: passed.
- Workflow executor build: passed.
- Workflow engine: 64 tests passed.
- Graph UI and navigation: 14 tests passed.
- Convex workflow snapshot, persona, loop, and task guards: 12 tests passed.
- Browser reload after dispatch: no new JavaScript or page errors.

## Evidence

- `docs/testing/evidence/graph-engineering-production-integration/01-ready-to-dispatch.png`
- `docs/testing/evidence/graph-engineering-production-integration/02-run-inspector-queued.png`
- `docs/testing/evidence/graph-engineering-production-integration/03-queued-graph.png`
- `docs/testing/evidence/graph-engineering-production-integration/04-failure-containment.png`

## V1 Boundary

The workflow executor materializes dependency-ready Tasks; a configured agent
runtime must still claim those Tasks and submit contract-valid deliverables.
Graph Engineering does not fabricate agent output, auto-ingest evidence into the
cycle ledger, or bypass the terminal human approval gate.
