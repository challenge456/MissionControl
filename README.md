# Mission Control

Mission Control is the operating system for human-directed, agent-executed
software development. Humans define intent, approve plans, and make judgment
calls. Agents execute bounded work, validate results, recover from failures,
and collect evidence.

The product coordinates the delivery lifecycle around one authoritative model:

`Mission → WorkOrder → Task → Attempt → evidence → pull request → release`

Mission Control is under active V1 development. The governed control-plane
foundation and local operator demo are implemented; the next ship gate is a
complete real-repository journey from approved Mission to review-ready GitHub
pull request. See the [V1 program plan](docs/plans/2026-08-02-feat-ai-software-factory-v1-program-plan.md)
and [Product North Star](docs/product/mission-control-north-star.md).

## Product principles

- **Intent over activity:** outcomes and acceptance criteria are primary; agent
  sessions and token counts are supporting detail.
- **Exceptions over feeds:** operators see blockers, decisions, risk, and stale
  or missing evidence before routine activity.
- **Evidence over assertions:** completion requires independently verifiable
  receipts and source-linked artifacts.
- **Policy before autonomy:** identity, authority, repository scope, tools,
  budget, risk, and recovery limits are resolved before execution.
- **Durable state over conversation:** work survives refreshes, restarts,
  handoffs, and model changes.

## Current capabilities

| Area | What is implemented |
|---|---|
| Operator control plane | EOS-style V2 shell with Command Center, WorkOrders, Tasks, approvals, QC, run inspection, and evidence-oriented exception handling |
| Company boundaries | Company account → workspace → repository → code scope hierarchy with role-aware authorization |
| Governed work | Mission, WorkOrder, Task, Attempt, approval, evidence, and release records with explicit state transitions |
| Factory configuration | Versioned repository, workflow, executor, policy, verifier, environment, host, budget, recovery, branch, and tool configuration with readiness assessment and activation |
| GitHub integration | GitHub App installation readiness, least-privilege checks, signed and replay-safe webhook ingress, and repository-scoped connection records |
| Execution | Workflow graph executor, authenticated service commands, Codex executor adapter, idempotent dispatch, retries, and recovery controls |
| Context and learning | Context registry, manifest locking, skills, knowledge graph, Graph Engineering, and governed improvement loops |
| Trust and evidence | Human/service authorization boundaries, audit activity, criterion-level receipts, risk policies, verifiers, and PR evidence correlation |

These capabilities do not yet constitute a production-ready release. V1 is
ready only after the real GitHub golden path passes authorization, restart,
failure-recovery, independent-validation, and browser evidence gates without
direct database intervention.

## Quick start

### Prerequisites

- Node.js 18 or newer
- pnpm 9 or newer
- A Convex account and development deployment

### Install and configure

```bash
git clone https://github.com/jaydubya818/MissionControl.git
cd MissionControl
pnpm install
cp .env.example .env.local
npx convex dev
```

On first run, Convex creates or connects a deployment and writes its local
configuration. Ensure `.env.local` contains both values below, using the same
deployment URL:

```dotenv
CONVEX_URL=https://your-deployment.convex.cloud
VITE_CONVEX_URL=https://your-deployment.convex.cloud
```

### Run normal development

```bash
pnpm run dev
```

This starts Convex and the React UI together. Open
[http://localhost:5173](http://localhost:5173), or the next port printed by
Vite if 5173 is occupied.

Useful alternatives:

```bash
pnpm run dev:ui                 # UI only
pnpm run dev:orchestration      # orchestration service on port 4100
pnpm run dev:workflow-executor  # workflow graph executor
```

See [Run Commands](docs/guides/RUN.md) for detailed setup and troubleshooting.

## Software Factory demo

The canonical demo runs entirely from the main repository. It starts Convex,
the workflow executor, and the V2 operator UI:

```bash
pnpm run dev:demo
```

In another terminal, seed or refresh the Atlas Checkout demo workspace:

```bash
pnpm run convex:seed:demo
# Or refresh an existing seed after schema or narrative changes:
pnpm run convex:seed:demo:force
```

Open [http://localhost:5199/v2/command-center](http://localhost:5199/v2/command-center)
and select **Software Factory Demo** (`sf-demo`). If a dispatched graph remains
queued, confirm that the workflow executor started successfully.

Optional knowledge graph import:

```bash
pnpm run import:knowledge-graph:demo
```

This requires an Agentic-KB clone at `~/Agentic-KB`, or an
`AGENTIC_KB_PATH` override. The graph appears under **Knowledge → Memory →
Graph**.

### Demo routes

| Route | Purpose |
|---|---|
| `/v2/command-center` | Operator attention queue, KPIs, dispatch gate, and delivery overview |
| `/v2/control-work-orders` | Governed WorkOrders and dispatch state |
| `/v2/tasks` | Tasks and Attempts across the delivery lifecycle |
| `/v2/audit` | Human decisions, approval evidence, and audit history |
| `/v2/qc-dashboard` | Independent quality-control results and findings |
| `/v2/memory` | Durable context and knowledge graph |

The old two-worktree demo procedure is retired. Worktrees remain useful for
branch isolation, but they are not required to run the Software Factory demo.

## Architecture

- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS 4, and shadcn/ui
- **Backend:** Convex queries, mutations, actions, HTTP actions, and database
- **Orchestration:** Hono service with coordinator and agent-runtime integration
- **Execution:** Versioned workflow engine plus Codex executor adapter
- **CLI:** `mc` commands in `scripts/mc`
- **Repository:** pnpm workspace monorepo containing `apps/`, `packages/`,
  `convex/`, `scripts/`, and `docs/`

The orchestration service does not own product state. Convex is the
authoritative backend and persistence layer.

## Governed delivery flow

1. A human defines an outcome, constraints, risk, and acceptance criteria.
2. An agent researches the repository and proposes a versioned plan.
3. A human approves or rejects the plan.
4. Mission Control releases bounded WorkOrders and Tasks.
5. Preflight resolves repository, factory version, executor, tools, policy,
   budget, environment, and recovery controls.
6. Agents implement, test, review, recover, and collect evidence.
7. Independent gates evaluate acceptance criteria and quality policy.
8. A human reviews the evidence package and decides whether work can proceed.
9. Pull request, deployment, rollback, and production verification retain
   distinct governed states.

## Development checks

```bash
pnpm run typecheck
pnpm run test
pnpm run lint
pnpm run build
```

Critical browser checks:

```bash
pnpm run test:e2e:critical
```

## CLI examples

```bash
./scripts/mc doctor
./scripts/mc status
./scripts/mc run feature-dev
./scripts/mc tasks INBOX
./scripts/mc claim
./scripts/mc flags list
./scripts/mc skill lint
```

## Built-in workflows

- **feature-dev:** Plan → Implement → Test → PR
- **bug-fix:** Triage → Fix → Verify → PR
- **security-audit:** Scan → Prioritize → Fix → Verify
- **code-review:** Analyze → Security → Style → Approve

## Documentation

- [Product North Star](docs/product/mission-control-north-star.md) — product doctrine and V1 ship gate
- [V1 Product Strategy](docs/product/mission-control-v1-product-strategy.md) — prioritized product direction
- [AI Software Factory V1 Program Plan](docs/plans/2026-08-02-feat-ai-software-factory-v1-program-plan.md) — implementation sequence and acceptance gates
- [Run Commands](docs/guides/RUN.md) — local development and seeding
- [Troubleshooting](docs/guides/TROUBLESHOOTING.md) — diagnostics and common failures
- [Company Control Plane](docs/architecture/company-workspace-repository-control-plane.md) — account, workspace, repository, and code-scope model
- [Executor Adapter Contract](docs/architecture/executor-adapter-contract.md) — executor boundary and lifecycle
- [GitHub App Connection](docs/security/github-app-connection.md) — installation and signed ingress model
- [Service Command Authentication](docs/security/service-command-authentication.md) — trusted service boundary
- [Graph Engineering](docs/software-factory/GRAPH_ENGINEERING.md) — governed graph lifecycle and evidence
- [Feature Flags](docs/FEATURE_FLAGS.md) — flag keys and environment overrides
- [Operations Runbook](docs/MISSION_CONTROL_RUNBOOK.md) — operational and CI procedures

## License

MIT
