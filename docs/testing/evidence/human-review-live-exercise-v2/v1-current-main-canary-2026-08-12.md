# V1 Current-Main Governed Canary

Date: 2026-08-12

## Governed Attempt lineage

This evidence document is the current-main canary change. The candidate remains bound to the same Attempt throughout release qualification; no replacement Attempt may inherit its verification, approval, permit, or publication state.

The same Attempt resumes only after independent verification succeeds and human approval is recorded. Both gates apply to the exact candidate represented by this change.

## Publication and rollback

Publication is control-plane owned. GitHub pull-request publication may proceed only when the control plane consumes a publication permit for that same Attempt; the implementing agent does not publish the branch or pull request.

The review remains rollback-ready: revert this canary change to roll back the published candidate without transferring any evidence or approval to a different Attempt.
