# Bounded Adapter Runtime

Canonical source: `apps/orchestration-server/src/automationAdapter.ts`

## Responsibility

The adapter runtime executes only the immutable artifact and configuration
returned by the governed backend for an already-approved and explicitly
dispatched WorkOrder. It cannot evaluate, approve, activate, or dispatch work.

## Supported adapters

| Adapter | Execution |
| --- | --- |
| Playwright | `pnpm exec playwright test` with the approved test path and JSON reporter |
| API | Read-only `GET`, `HEAD`, or `OPTIONS` request with expected status |
| TypeScript | `pnpm exec tsx` with the approved absolute artifact path |
| Python | `python3` with the approved absolute artifact path |
| Shell | `bash` with the approved absolute artifact path |
| Workflow | Approved, parsed, allowlisted process command |
| Skill pipeline | Ordered API or process steps with fail-fast behavior and per-step timeout |

## Execution manifest

```ts
interface ExecutionManifest {
  adapterType: AdapterType;
  repository: string;
  repositoryRoot: string;
  workingDirectory: string;
  artifactPath: string;
  artifactContent?: string;
  artifactContentHash: string;
  timeoutMs: number;
  secretReferences: string[];
  configuration: Record<string, unknown>;
}
```

The Convex backend issues this manifest only after checking Definition state,
validation, approval, activation, LEVEL_1 policy, read-only policy, artifact
validation, WorkOrder lineage, dispatch-created run state, and evaluation lineage.

## Normalized result

```ts
interface NormalizedAutomationResult {
  status: "passed" | "failed" | "timed_out" | "cancelled" | "infrastructure_error";
  exitCode: number | null;
  startedAt: string;
  completedAt: string;
  durationMs: number;
  tests: { total: number; passed: number; failed: number; skipped: number };
  artifacts: string[];
  evidence: string[];
  redactedLogs: string[];
  error: string | null;
}
```

## Safety controls

### Repository boundary

`safeRepositoryPath` rejects empty, absolute, null-containing, or escaping
paths. Both the artifact and working directory must resolve within the approved root.

### Immutable artifact

Artifact content is SHA-256 checked before use. New content is written with
exclusive-create semantics. An existing file whose hash differs from the
approved version causes execution to fail rather than overwrite it.

### Command construction

`parseAllowlistedCommand` rejects shell operators, interpolation, redirection,
path traversal, and null bytes. The allowed executables are:

```text
pnpm npm yarn node python python3 pytest git gh curl bash
```

Child processes use `spawn(executable, argv, { shell: false })`.

### Environment and secrets

Sensitive environment variables are excluded unless their names are declared
secret references. Logs redact common authorization, cookie, token, secret,
password, and API-key forms plus the resolved values of declared secrets.
Captured logs are bounded to 200,000 characters.

### Timeouts and cancellation

Process adapters receive `SIGTERM` on timeout or abort. API requests combine
the caller signal with `AbortSignal.timeout`. Pipeline steps cannot exceed the
overall manifest timeout.

### Read-only API policy

Only HTTP and HTTPS are accepted. API adapters reject all methods except
`GET`, `HEAD`, and `OPTIONS`, and redirects are not followed.

### Pipeline policy

Pipelines require at least one deterministic step. Steps execute in order,
produce structured per-step logs, and stop immediately on failure, timeout, or cancellation.

## Runtime flow

1. Resolve and validate the repository artifact path.
2. Verify immutable content hash and materialize only when absent.
3. Select a fixed adapter command or read-only API operation.
4. Filter environment variables and resolve declared secret references.
5. Execute with a bounded timeout and optional cancellation signal.
6. Redact logs and parse Playwright test totals when available.
7. Return one normalized result without marking the WorkOrder complete.
8. Persist execution result and wait for the separate verifier endpoint.

## Tests

`apps/orchestration-server/src/__tests__/automationAdapter.test.ts` covers:

- repository escape rejection;
- command-injection rejection;
- credential redaction;
- artifact hash verification;
- bounded Shell execution;
- immutable-file mismatch rejection;
- TypeScript and Python execution;
- read-only API status checking;
- sequential fail-fast skill pipelines.

Result: **9/9 passed**.
