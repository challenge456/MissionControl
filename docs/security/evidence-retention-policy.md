---
title: "V1 Evidence Retention and Outcome Policy"
date: 2026-08-02
status: approved
owner: Product Owner
related_decisions: [ASF-005, ASF-007]
---

# V1 Evidence Retention and Outcome Policy

## Retention classes

| Data class | Default retention | Examples | Required handling |
| --- | --- | --- | --- |
| Audit and decisions | 365 days | approval decisions, waivers, authorization denials, supersessions, acceptance, reconciliation | Append-only application behavior; exportable; deletion produces a retained tombstone |
| Execution evidence | 90 days | run events, command/test output, diff artifacts, screenshots, verification receipts | Preserve hashes and governing lineage; redact secrets before storage/export |
| Sensitive temporary data | 30 days maximum | transient provider payloads, diagnostic excerpts, temporary worktree metadata | Minimize collection; encrypt at rest through platform controls; delete as soon as no longer required |

The defaults apply until a stricter contractual or legal requirement is
approved. Legal hold suspends normal deletion for the explicitly scoped data
and records the authority, reason, start time, and release decision.

## Export, redaction, and deletion

- Company-authorized export must preserve record type, IDs, timestamps,
  governing versions, lineage, and content hashes without exposing secrets.
- Redaction must be represented as a retained action; it must not silently
  rewrite historical meaning.
- Deletion jobs must be idempotent, company-scoped, and auditable. A tombstone
  retains record ID, class, deletion authority, reason, and time without the
  deleted sensitive payload.
- Fixture, Demo, and synthetic evidence follow the same deletion mechanics but
  must remain visibly labeled and cannot enter production outcome analytics.

## V1 production outcome source

GitHub Issues are the authoritative V1 source for production defects,
incidents, and rollbacks. Mission Control may project those facts only when an
issue has:

- one governed label: `production-defect`, `incident`, or `rollback`;
- an exact authorized repository;
- an exact commit, pull request, deployment, or release reference;
- retained issue identity, state, opened/closed time, and source URL.

Unlabeled, ambiguous, deleted, or uncorrelated issues remain Unknown and do not
count in outcome metrics. Mission Control alerts, agent summaries, PR comments,
and inferred text are supporting evidence, not authoritative outcomes.

## Enforcement sequence

This document approves policy; it does not claim retention automation already
exists. Before external customer data is accepted, schema/data-class mapping,
export, redaction, legal hold, deletion, and verification tests must be
implemented and promoted through their own reviewed slice.
