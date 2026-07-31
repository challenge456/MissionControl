---
date: 2026-07-28
topic: context-activation-receipts
---

# Context Activation Receipts

## What We're Building

A narrow executor-facing activation contract: given a stored repository lock and a scheduled context workflow run, resolve the lock to immutable published package content and persist a receipt naming every exact package version and content hash delivered.

## Why This Approach

The Registry already stores immutable package versions, locks, and workflow runs. Adding a separate activation/receipt boundary provides runtime evidence without creating a second executor or attempting to infer context usage from a proxy eval.

## Key Decisions

- Activation reads the stored `mc-context.lock`, never a mutable package head.
- Every lock entry must match a published Registry version and its SHA-256 hash.
- The returned payload includes the inline package content for the executor; the receipt stores only identifiers, versions, and hashes.
- The receipt is idempotent by an explicit key and attaches to `contextWorkflowRuns`.
- A missing lock, unpublished version, mismatched hash, or unavailable inline content fails closed.

## Open Questions

- The external executor still needs to call this activation endpoint before dispatch. This change defines that contract; it does not change a third-party executor configuration.

## Next Steps

Implement the activation mutation, receipt schema, focused tests, and a disposable end-to-end verification.
