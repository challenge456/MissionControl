---
date: 2026-07-28
status: verified
source: Software Factory Research Lab PRD
---

# Software Factory Research Lab PRD Import E2E

## Goal

Import the supplied Software Factory Research Lab PRD through Mission Control's browser UI and verify that the import creates durable, structured work without bypassing user-facing controls.

## Current acceptance slice

| Requirement | Browser evidence |
|---|---|
| Create the target workspace | Create `Software Factory Research Lab` from Projects with all required fields |
| Reject duplicate workspace slugs | Submit the same slug and retain the form with an inline error |
| Persist workspace selection | Refresh after selection and retain the research workspace |
| Connect the research repository | Connect `research-agent-software-factories` with branch `main` and show status |
| Reject invalid repository configuration | Submit a malformed repository identifier and show an actionable inline error |
| Select or upload a PRD | Upload the supplied text file through the Import PRD dialog |
| Preview parsed work | Show at least one editable task row before creation |
| Approve or cancel | Exercise Back/Cancel and Create All |
| Link generated tasks to the PRD | Open an imported task and verify `PRD_IMPORT` provenance |
| Handle duplicate imports safely | Re-import the same content and create no duplicate tasks or dependency edges |
| Persist after refresh | Refresh Tasks and verify imported work remains scoped to the selected project |
| Update counts | Compare project/task counts before and after creation |
| Browser health | Capture screenshots, console errors, failed requests, and a trace |

## Confirmed and fixed baseline defect

The supplied PRD uses numbered plain-text sections and `FR-n:` requirement headings. The local fallback parser only recognizes Markdown `##` and `###` headings, so the preview contains zero tasks and `Create All (0)` is disabled.

The parser now recognizes those requirement blocks. The same uploaded source previews eight tasks, creates eight project-scoped tasks, and returns zero new tasks on an identical re-import.

## Scoped implementation

1. Add a deterministic parser for functional-requirement, Markdown, numbered, and uppercase headings.
2. Prefer `FR-n:` blocks when present so product-summary sections do not become implementation tasks.
3. Keep the preview on the input step with a useful error when no actionable sections are found.
4. Fingerprint stored PRDs and reuse the existing document on identical re-imports.
5. Count only newly created tasks and avoid duplicate dependency edges.
6. Add workspace creation and repository connection to the existing Project workspace boundary.
7. Persist the selected workspace after refresh.
8. Add parser and browser regression coverage.

## Explicitly separate release gaps

WorkOrder generation, governed review/rejection/resubmission, activity filtering and record links, persistent chat, graph execution, and a bounded Loop Engineering cycle were verified independently. External autonomous task execution remains paused pending explicit authorization to send scoped task and read-only repository context to the authenticated Codex service. Source freshness, evidence traceability, and final research-report acceptance remain incomplete until those research nodes run.

## Evidence location

`tmp/prd-e2e-evidence/`

See `software-factory-loop-engineering-e2e-report.md` for the full result matrix.
