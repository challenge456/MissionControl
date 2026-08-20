# Minimal runtime toolchain root cause

## Frozen post-inner-sandbox cohort

After selecting Codex `danger-full-access` only inside the authoritative outer sandbox, a fresh exact-image cohort produced:

- bug fix: first-pass completed, scoped candidate, independently verified, acceptance eligible;
- security/policy: first-pass completed, scoped candidate, independently verified, acceptance eligible;
- data/schema migration: executor timed out at the frozen 300-second bound before editing;
- retries: 0;
- final container inventory: 0.

Raw evidence is preserved in `local-3-workload-gate-pre-minimal-toolchain-remediation.json`.

## Root cause

The final image inherits standard BusyBox symlinks such as `/bin/ls` and `/usr/bin/find` from the Alpine Node base, then replaces `/bin/busybox` with a source-built allowlisted binary. The replacement omitted the `ls`, `find`, and `sed` applets. The paths therefore existed but every invocation failed with `applet not found`.

The Codex traces show repeated attempts to run `ls`, `/bin/ls`, `/usr/bin/ls`, `busybox ls`, `find`, and `busybox find`, followed by slower Node/glob workarounds. The bug-fix Attempt consumed 207,936 input tokens before completing. The migration Attempt made 27 discovery commands and reached the timeout immediately before its first edit. This is a runtime/toolchain mismatch, not an inference, supervisor, privilege, network, credential, or teardown failure.

## Minimal remediation

Compile only the basic local discovery/text applets needed by a coding workload: `dirname`, `find` (bounded name/type/depth/path predicates), `ls`, `mktemp`, `sed`, `sort`, `uniq`, `wc`, and `xargs`. Do not add a package manager, downloader, `awk`, Python, npm, npx, or any new privilege/capability.

The resulting BusyBox binary and toolchain-input digest must be frozen again. The rebuilt image must receive a fresh SBOM and unsuppressed 0 Critical / 0 High scan before any further workload qualification.
