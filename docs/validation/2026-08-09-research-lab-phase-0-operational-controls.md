# Research Lab Phase 0 Operational-Control Evidence

Date: 2026-08-10
Status: `complete / isolated-canary-and-browser-proven`

## Scope

This packet covers one read-only Automation execution path and the Research Lab
operator evidence required for the Phase 0 exit gate. It does not enable the
Research Lab scheduler, start the Codex Factory worker, modify repository
content, or change any of the 159 canonical Tasks.

## Implemented Runtime Contract

| Control | Fail-closed behavior |
| --- | --- |
| Atomic claim | An unexpired claim rejects every other worker. |
| Heartbeat | Only the matching owner and claim can renew an unexpired lease. |
| Pause | Workspace `PAUSED` blocks new claims and stops active execution at the next heartbeat. |
| Drain | Workspace `DRAINING` blocks new claims while matching active claims may heartbeat to a terminal checkpoint. |
| Cancel | A governed cancel request persists on the run and aborts the local adapter immediately; a remote worker observes it on heartbeat. |
| Timeout | Admission rechecks the frozen 1-3,600 second limit and the adapter terminates the whole child process group at the deadline. |
| Retry | A later attempt requires the prior claim ID and a non-empty retry reason, and cannot exceed `maxRetries + 1`. |
| Stale recovery | One expired claim may be reclaimed without changing the attempt number; another stale recovery quarantines the Definition. |
| Budget | Estimated cost and accumulated run spend are checked against the frozen Definition budget before claim and before terminal evidence. |
| Concurrency | Active claims for the same Definition are counted again at claim time. |
| Verification | A passing executor result stops at `AWAITING_VERIFICATION`; a failed independent receipt suspends the Definition. |

The immutable binding digest covers Definition version and limits, approved
artifact identity/hash, WorkOrder revision, and WorkflowRun identity. A binding
change blocks heartbeat or terminal evidence and quarantines the Definition.

## Isolated Mutation Canary

A fresh local Convex deployment, `local-jaydubya818-missioncontrol_df0fe-3`,
was built from the current backend and seeded only with three Phase 0 fixtures.
The canary flag and temporary anonymous company context were enabled only on
that isolated deployment. The preserved Research Lab database was never used
as a mutation target.

The live canary proved this sequence:

1. `PAUSED` rejected a new claim; `NORMAL` restored admission.
2. Budget exhaustion rejected admission.
3. An initial claim succeeded and a duplicate claim was rejected.
4. A matching heartbeat renewed in both `NORMAL` and `DRAINING`; draining
   rejected a second WorkOrder claim.
5. An expired lease was reclaimed by a different owner without changing
   attempt number and incremented the stale-recovery count.
6. Attempt 1 timed out and produced a reasoned `RETRY` disposition.
7. Attempt 2 completed and stopped at `AWAITING_VERIFICATION`.
8. A zero-write TEST_OUTPUT artifact was recorded. Independent verifier
   `phase-zero-independent-verifier` passed receipt
   `jx7jebyn99e5gkzn347x6w8b098c9r1f`; only then did human acceptance move the
   WorkOrder to `DONE` with verification `PASS`.
9. A separately claimed run observed governed cancellation at heartbeat and
   persisted run and WorkOrder state `CANCELED`.
10. A second stale recovery exceeded the allowed ceiling and durably persisted
    run `FAILED`, WorkOrder `BLOCKED`, and Definition `SUSPENDED`.

Final canary state retained continuous scheduling as `false`. The passed
canary database is recoverably archived at
`.convex/local/phase0-canary-passed-20260810`. The earlier failed legacy
transfer is separately retained at
`.convex/local/phase0-failed-transfer-20260809` and is not part of the proof.

## Browser Evidence

- [Governed canary WorkOrder and independent verification](../testing/evidence/governed-continuous-learning/2026-08-10-phase-zero-canary-workorder.png)
- [Research Lab canonical Task statuses](../testing/evidence/governed-continuous-learning/2026-08-10-research-lab-canonical-task-kpis.png)
- [Research Lab Task totals and presentation grouping](../testing/evidence/governed-continuous-learning/2026-08-10-research-lab-task-kpi-totals.png)

The preserved Research Lab was restarted through `pnpm run dev:research-lab`
and browser-verified at `http://localhost:5199`. The selected workspace is
`Software Factory Research Lab` (`sn71gskbdemgf4z1trt9zdmm5h8bde69`). The
canonical board contains 159 Tasks: 48 Inbox, 5 Ready, 20 Assigned, 2 In
progress, 35 Review, 0 Needs approval, 0 Blocked, 0 Failed, 15 Done, and 34
Canceled. The UI now labels those values as canonical statuses and separately
labels the 62-task display grouping as `Presentation active`.

## Automated Verification

- Convex authority, manifest, workflow, operational-control, Automation,
  operator-control, Factory lease, and skill-Automation tests: **43 passed**.
- Orchestration Automation, Codex adapter, git runtime, and path-scope tests:
  **20 passed**.
- Research Lab launcher/profile tests: **9 passed**.
- Task KPI semantic tests: **2 passed**.
- Convex TypeScript: **passed**.
- Orchestration server TypeScript: **passed**.
- Mission Control UI TypeScript: **passed**.
- `git diff --check`: **passed**.

The adapter tests exposed and fixed a cancellation defect: terminating a shell
wrapper did not terminate its child process. The adapter now creates a process
group, sends `SIGTERM` to the group, and escalates to `SIGKILL` after a bounded
grace period. The live canary exposed two additional durable-state defects:
completion left the run `RUNNING`, and quarantine left stale ownership. Both
terminal projections now persist before the mutation returns.

The final durable-state review also closed three edge cases: a cancellation of
an unclaimed run now becomes terminal immediately instead of leaving an
unclaimable pending run; a binding-mismatch quarantine returns normally so the
Convex transaction is committed instead of rolled back by an exception; and a
budget-overrun quarantine preserves the accumulated spend on the run.

## Safety State

- Continuous Research Lab scheduler: **OFF**
- Factory execution worker: **OFF**
- Repository writes in canary: **0**
- Canonical Research Lab queue mutations: **none**
- Preserved Research Lab server: **running at `http://localhost:5199`**

## Exit-Gate Result

Phase 0 is complete. Atomic ownership, operator controls, recovery, retry,
quarantine, independent verification, truthful Task status reporting, and
browser-visible evidence all passed on an isolated current backend. This does
not authorize continuous scheduling. Phase 1 must establish the governed source
registry and ingestion policy before a supervised recurring research pilot can
be enabled.
