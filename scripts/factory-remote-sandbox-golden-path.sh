#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
repo_root="$(cd "${script_dir}/.." && pwd)"

cd "${repo_root}"

echo "Remote Sandbox N=1 deterministic golden path"
echo "Provider: FakeSandboxProvider (no external allocation or spend)"

pnpm --filter @mission-control/shared build
pnpm --filter @mission-control/orchestration-server exec vitest run src/__tests__/factoryAttemptWorkerRemote.test.ts

echo "PASS: canonical worker lease, sandbox identity, host verification, credential revocation, resource absence, publication permit, one PR handoff, and owned-worktree cleanup were proven."
