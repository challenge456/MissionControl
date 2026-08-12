---
title: Remote Sandbox Provider Proof
date: 2026-08-10
status: blocked
provider: exe.dev
todo: "029"
---

# Remote Sandbox Provider Proof

## Scope

This evidence covers the first read-only execution of the Phase 0 provider
doctor. It does not authorize or claim a VM lifecycle, repository mount, model
call, or production-ready sandbox boundary.

## Commands

```bash
ssh-keyscan -t rsa exe.dev 2>/dev/null | ssh-keygen -lf - -E sha256
pnpm exec vitest run scripts/lib/exe-dev-sandbox.test.mjs
node scripts/sandbox-doctor.mjs --json
```

## Observed result

### Provider identity

The live host presented:

```text
SHA256:JJOP/lwiBGOMilfONPWZCXUrfK154cnJFXcqlsi6lPo
```

This matches exe.dev's published host fingerprint. The doctor pins this value
and refuses authentication on a mismatch.

### Authentication

The first batch-mode, strict-host authenticated inventory call failed closed:

```json
{
  "status": "blocked",
  "codes": ["PROVIDER_AUTH_FAILED"],
  "message": "exe.dev authentication failed. Register a dedicated SSH public key, then set EXEDEV_IDENTITY_FILE to its private-key path if needed."
}
```

No VM, integration, model key, repository token, payment method, or public port
was created or changed.

On operator authorization, a dedicated local Ed25519 identity was generated:

```text
Private key: /Users/jaywest/.ssh/id_ed25519_exe_mission_control
Public key:  /Users/jaywest/.ssh/id_ed25519_exe_mission_control.pub
Fingerprint: SHA256:L5itzmZwaxF52475kTRWu1EXBl6QtxlAmLyEHtLpLUk
```

The private key is mode `0600`; the public key is mode `0644`. The private key
contents were not printed, copied into the repository, or sent to the provider.

The public key was registered through exe.dev's Google-verified account flow.
The authenticated read-only doctor then reported zero VMs and readable billing
data. It also found three default `auto:all` attachments that currently block
live allocation:

- `llm` (`llm`)
- `notify` (`notify`)
- `reflection` (`reflection`)

### Contract tests

Twelve focused tests passed. They cover:

- published fingerprint acceptance and mismatch rejection;
- batch-only SSH with strict host verification;
- exact canary create/delete commands;
- no environment or integration attachment;
- safe generated VM namespace;
- automatic-integration detection without secret output;
- the exact read-only provider command allowlist;
- dual live-allocation opt-in;
- provider/model/GitHub token redaction;
- exact inventory matching;
- verified cleanup after both successful and failed remote workloads; and
- zero-capacity provider plans blocking live allocation.

## Exit assessment

| Phase 0 gate | State | Evidence |
| --- | --- | --- |
| Provider host identity | Passed | Live fingerprint matches published value |
| Local contract tests | Passed | 12/12 focused tests |
| Dedicated local identity | Passed | Ed25519 key generated with restrictive permissions |
| Provider account authentication | Passed | Dedicated public key registered through verified account flow |
| VM/billing/integration inventory | Passed | Zero VMs; billing and integration inventories readable |
| Automatic-integration policy | Passed | `llm`, `notify`, and `reflection` detached from `auto:all` with Product Owner approval |
| Provider capacity | Blocked | Active Basic plan reports `max_vms: 0` |
| Lifecycle canary 1/3 | Blocked before allocation | Provider rejected creation; inventory confirmed zero VMs afterward |
| Privilege/private-proxy posture | Not run | Requires canary VM |
| Zero-orphan teardown | Not proven live | Cleanup contract is unit tested only |

Phase 0 remains incomplete. The integration posture is clean, but the active
Basic plan has no VM capacity. A live canary was attempted after readiness; the
provider rejected creation and a direct inventory check confirmed zero VMs, so
no orphan remains. The next action requires a Product Owner billing-plan
decision.

## Product decision

On 2026-08-10 the Product Owner declined the exe.dev Personal upgrade. Mission
Control will not add payment details, purchase capacity, or retry VM allocation.
The exe.dev implementation remains safely blocked at provider capacity.
