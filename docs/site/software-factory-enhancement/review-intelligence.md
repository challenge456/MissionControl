# Evidence-first human review

Review Intelligence helps a reviewer understand why a candidate exists and what
Mission Control actually proved before opening the full source diff. It is part
of the existing WorkOrder and Execution Run Inspector experience; it is not a
separate review product or verification engine.

## Review order

The package presents:

1. frozen Mission, Spec, Plan, Quality Contract, WorkOrder, and Definition of Done;
2. acceptance criteria mapped to exact checks and evidence;
3. failures, retries, and recovery history;
4. attributable implementation Decision Candidates;
5. deterministic changed-file groups;
6. optional residual findings labeled `ADVISORY`;
7. exact IDs, digests, currentness, worker/harness identity, and raw diff.

Basic emphasizes intent, evidence state, blockers, and next action. Intermediate
adds recovery, decisions, change groups, and residual risk. Advanced exposes
exact lineage and provenance. Disclosure never changes authority or record
selection.

## Interpreting evidence

`VERIFIED` is canonical only when the exact candidate and required independent
evidence are current. `UNKNOWN`, `MISSING`, `PENDING`, `FAILED`, and `STALE` are
not success. Requirements-quality checklist completion is planning evidence,
not implementation proof. An advisory model finding cannot create or revoke a
verification verdict.

Use **Inspect exact evidence** to open the Run Inspector at the bound receipt and
criterion. Use **Open raw diff** whenever source judgment is required.

## Decisions and corrections

A Decision Candidate records a bounded implementation observation. Accepting it
does not rewrite frozen intent; create a new Spec/Plan revision or explicit ADR
and link that governed artifact.

A review correction can enter Factory Learning as an advisory signal. Repeated
independent evidence may create an Improvement Candidate, then a human-approved
experiment and a submitted Plan. Separate human approval is still required.

## Authority boundary

Review-package approval only records that a human reviewed this exact package.
Canonical completion remains `workOrders.accept`. GitHub publication and merge
remain separate governed actions. Residual AI review is default-off and has no
acceptance, verification, publication, or merge authority.

## Recovery

If the candidate, PR head, WorkOrder revision, or evidence becomes stale, the
package moves to a blocked/non-current state and retains the historical review
records. Re-verify the exact new candidate, then review the newly projected
package. Never treat the previous package as current.
