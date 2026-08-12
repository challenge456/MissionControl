---
status: complete
priority: p3
issue_id: "037"
tags: [software-factory, performance, events]
dependencies: []
---

# Bound Human-Review Event Sequencing

## Problem Statement

Human-review event insertion scans every prior run event to calculate the next sequence number.

## Findings

- The existing `by_run_sequence` index can return the last event directly.

## Proposed Solutions

### Option 1: Retain the full scan

**Pros:** No change.

**Cons:** Approval cost grows with Attempt history.

### Option 2: Read the indexed latest event

**Pros:** Bounded and simpler.

**Cons:** Small query change.

## Recommended Action

Use Option 2.

## Acceptance Criteria

- [x] Human-review event sequencing uses the existing index.
- [x] Existing event-order tests pass.

## Work Log

### 2026-08-11 - PR #72 review

**By:** Codex

**Actions:**

- Recorded the TypeScript/performance review finding.

### 2026-08-11 - Implemented

**By:** Codex

**Actions:**

- Replaced the full run-event scan with the existing `by_run_sequence` index ordered descending.
- Verified the full unit and contract suite remains green.
