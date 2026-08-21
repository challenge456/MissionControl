# Live negative matrix

The live gate is `HOLD`. Exactly three first Attempts were allocated serially with unique resources and zero retries. Every Attempt failed closed during trusted bootstrap before Codex started because exe.dev's reported image identity did not equal the requested digest-qualified GHCR reference.

| Check | Bug fix | Security policy | Migration | Result |
| --- | --- | --- | --- | --- |
| Initial inventory empty | Pass | Pass | Pass | Pass |
| Unique disposable resource | Pass | Pass | Pass | Pass |
| Attempt key revoked | Pass | Pass | Pass | Pass |
| Revoked key rejected by OpenRouter (`401`) | Pass | Pass | Pass | Pass |
| Exact resource deleted | Pass | Pass | Pass | Pass |
| Final inventory empty | Pass | Pass | Pass | Pass |
| Published image identity accepted by bootstrap | Fail closed | Fail closed | Fail closed | **Fail** |
| Workload non-root / all capabilities zero | Not reached | Not reached | Not reached | **Unproven live** |
| Firewall mutation blocked | Not reached | Not reached | Not reached | **Unproven live** |
| Allowed OpenRouter endpoint | Not reached | Not reached | Not reached | **Unproven live** |
| Unauthorized public egress blocked | Not reached | Not reached | Not reached | **Unproven live** |
| RFC1918/link-local/metadata blocked | Not reached | Not reached | Not reached | **Unproven live** |
| Unexpected DNS blocked | Not reached | Not reached | Not reached | **Unproven live** |
| Protected system paths / package caches | Not reached | Not reached | Not reached | **Unproven live** |
| Prior Attempt artifacts absent inside guest | Not reached | Not reached | Not reached | **Unproven live** |

The same security-proof matrix passed in two independent local linux/amd64 containers, but local proof is not substituted for the missing live proof. The raw lifecycle, typed failures, revocation statuses, resource names, and timings are in `live-3-workload-gate.json`.

No Attempt received GitHub, exe.dev administration, OpenRouter management, Mission Control service, acceptance, or publication credentials. The only issued secret was the Attempt-scoped OpenRouter key; all three keys were deleted and each stale-key probe returned `401`.
