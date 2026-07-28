# Graph Engineering

## Purpose

Mission Control models work as a graph, not a forced sequence. Nodes are bounded
jobs with explicit input/output contracts. Edges exist only when downstream work
consumes upstream output.

Graph Engineering is the execution shape inside Loop Engineering:

- research questions fan out when they are independent;
- deterministic code handles transforms such as flattening and deduplication;
- verification nodes gate evidence before it reaches recommendations;
- synthesis waits only for the results it genuinely consumes;
- approved implementations run in isolated worktrees when they can write in
  parallel;
- validation and measurement fan in before the next learning cycle.

## Backward-compatible workflow model

Existing workflows remain valid. A workflow without graph metadata is compiled
as a linear graph, preserving its current order. A graph workflow declares:

- `topology: DAG`
- `maxConcurrency`
- optional bounded `convergence` settings
- per-node `dependsOn`
- node `kind`: `AGENT`, `REDUCE`, `ROUTER`, `VERIFY`, or `GATE`
- optional JSON input/output contracts
- model tier, isolation, failure policy, and routing condition

The workflow engine calculates runnable nodes from dependency state. Independent
nodes can start together. A node is never started because it merely appears
next in the file.

## Runtime invariants

1. Node identifiers are unique.
2. Every dependency references an existing node.
3. Cycles in a workflow definition are rejected. Iteration happens through the
   bounded Loop Engineering cycle contract.
4. A node starts only after all of its consumed dependencies are satisfied.
5. A failed node is contained. Retry, continue, or block behavior is explicit.
6. Router decisions are persisted and deterministic for the same structured
   input.
7. Output contracts are validated before downstream nodes become runnable.
8. Completion is explicit: the linked task must complete through the canonical
   state machine with a deliverable and review evidence.
9. Parallel repository writers require isolated worktrees.
10. Maximum concurrency, retries, timeouts, and iterations are bounded.
11. Checkpoints and partial node state survive refresh and executor restart.
12. Costs and latency are measured per node and summarized for the graph.

## Loop Engineering topology

```text
scope
  ├─ research-landscape ─ verify-landscape ─┐
  ├─ research-architecture ─ verify-architecture ─┼─ synthesize ─ approval
  └─ research-governance ─ verify-governance ─┘

approval
  ├─ implement recommendation A (isolated)
  ├─ implement recommendation B (isolated)
  └─ implement recommendation N (isolated)
                     └─ validate ─ measure ─ next cycle or stop
```

## Agent-native capability map

| UI action | Agent/API capability | Shared state |
| --- | --- | --- |
| Create a loop cycle | `loopEngineering.create` | Convex cycle + Tasks + WorkOrders |
| Record a source | `loopEngineering.addSource` | Cycle evidence ledger |
| Accept/reject evidence | `loopEngineering.decideSource` | Cycle + activity |
| Add recommendation | `loopEngineering.addRecommendation` | Cycle recommendation ledger |
| Approve/reject recommendations | approval actions | Cycle + Tasks + WorkOrders |
| Record validation | `loopEngineering.recordValidation` | Cycle validation ledger |
| Record measurement | `loopEngineering.recordMeasurement` | Cycle measurement ledger |
| Create next cycle | `loopEngineering.createNextCycle` | Parent/child cycle graph |
| Inspect dependencies | dependency graph query | Canonical task dependencies |

The UI and agents use the same Convex functions and reactive records. There is
no agent-only shadow state.

## Deliberate first-slice limits

- Dynamic fan-out from an unbounded collection is compiled into concrete nodes
  before dispatch; it is not an infinite spawning primitive.
- Deterministic `REDUCE` nodes are supported by the graph contract, but only
  registered reducers may run without an agent.
- Self-routing may choose among declared edges. It may not invent a
  repository-changing route that bypasses approval.
- No automatic merge of parallel worktrees. Verification and merge remain
  explicit governed nodes.

