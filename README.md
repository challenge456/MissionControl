# Mission Control

**Agent orchestration platform for AI squads.**

Mission Control manages autonomous agents: task lifecycle, workflows, approvals, and team coordination.

## Quick Start

```bash
# 1. Clone and setup
git clone https://github.com/jaydubya818/MissionControl.git
cd MissionControl
pnpm install

# 2. Configure environment
cp .env.example .env.local
# Set CONVEX_URL and VITE_CONVEX_URL (run `npx convex dev` once to get the URL)

# 3. Start development
pnpm run dev                    # Convex + UI (http://localhost:5173)
pnpm run dev:orchestration      # Orchestration server (http://localhost:4100), optional
```

## Architecture

- **UI:** React 18 + Vite → http://localhost:5173
- **Backend:** Convex (serverless functions + database; no Express)
- **Orchestration:** Hono server (coordinator loop + agent runtime) → http://localhost:4100
- **CLI:** `mc` command (see `scripts/mc`). Diagnostics: `./scripts/mc-doctor.sh`

## CLI Usage

```bash
mc doctor              # Health check
mc status              # System status
mc run feature-dev     # Start workflow
mc tasks INBOX         # List tasks
mc claim               # Claim next task
```

## Workflows

- **feature-dev:** Plan → Implement → Test → PR
- **bug-fix:** Triage → Fix → Verify → PR
- **security-audit:** Scan → Prioritize → Fix → Verify
- **code-review:** Analyze → Security → Style → Approve

## Key Features

- ✅ Multi-agent workflows (YAML-defined)
- ✅ Task state machine (INBOX → ASSIGNED → IN_PROGRESS → REVIEW → DONE)
- ✅ Auto-approval for LOW risk tasks
- ✅ Structured logging with JSON output
- ✅ Exponential backoff + jitter for retries
- ✅ Idempotency keys for all creates

## Documentation

- [Runbook](docs/MISSION_CONTROL_RUNBOOK.md) — Operations, E2E, CI
- [Troubleshooting](docs/guides/TROUBLESHOOTING.md) — Diagnostics and common fixes
- [Setup Guide](docs/BOOT_CONTRACT.md)
- [Workflows](docs/WORKFLOWS.md)

## License

MIT
