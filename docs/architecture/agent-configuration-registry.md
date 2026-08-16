# Agent Configuration Registry design

Date: 2026-08-16

## Problem

Mission Control can inventory context packages and local skills, but it cannot
currently answer which repository instructions govern Codex, Claude Code,
Cursor, Loom, hooks, or tool permissions, nor whether those files express
contradictory or duplicated intent.

## V1 design

Extend the existing `mc-context` repository scanner with an `agent-config`
command. It scans a bounded set of tracked files and optionally syncs a
read-only projection to the active Mission Control workspace/repository.

### Detected sources

- root and nested `AGENTS.md`;
- root and nested `CLAUDE.md`;
- `.cursor/rules/**` and Cursor ignore/config files;
- `.codex/**`, Codex skills, and Codex ignore/config files;
- `.claude/skills/**`, `.agents/skills/**`, and repository `skills/**`;
- `.loom/**` policy/config;
- `.husky/**`, `.githooks/**`, and declared hook configuration;
- `.gitignore` and harness-specific ignore files;
- tool-permission settings files.

The scanner uses `git ls-files`, rejects paths outside the repository, limits
the file count and bytes per file, and does not follow symlinks outside the
checkout.

### Entry projection

Each entry records:

- `projectId`, optional `repositoryId`, and canonical `repositoryKey`;
- source path, harness, kind, and directory scope;
- SHA-256 digest and last changed commit;
- effective precedence (root guidance before deeper scoped guidance);
- bounded normalized intent directives;
- scan ID/timestamp and `acceptanceAuthority: false`.

Raw credentials and unbounded file bodies are never stored.

### Deterministic drift findings

V1 recognizes explicit imperative intent, especially verification commands.
It produces:

- `CONTRADICTION`: one applicable source requires an action while another
  applicable source explicitly forbids/skips it;
- `COVERAGE_GAP`: a cross-harness requirement is present for one harness but
  absent from another configured harness;
- `DUPLICATE_INTENT`: equivalent intent is repeated across sources and may
  drift independently;
- `PRECEDENCE_SHADOW`: a deeper applicable file overrides an outer directive.

Every finding retains source paths, bounded excerpts, normalized key,
severity, and suggested remediation. It never overwrites a file.

## Canonical Agent Intent decision

A future human-owned Canonical Agent Intent model could project preview diffs
for multiple harnesses. V1 does not add that DSL because drift evidence is not
yet available to prove the abstraction would reduce real operator work.

The correct V1 sequence is:

1. inventory actual sources;
2. show effective precedence and deterministic drift;
3. measure repeated remediation;
4. only then decide whether canonical intent plus projection previews is worth
   adopting.

## Security and privacy

- Ignore secret-looking keys/values and redact bounded excerpts.
- Do not scan untracked `.env*`, credentials, SSH state, or user-global config.
- Sync is explicit and scoped; browsing requires the existing Factory VIEW
  permission.
- The projection is advisory and cannot grant tool permissions or change
  runtime policy.
