# Restricted Remote Sandbox threat model

## Assets and authority

Protected assets are host/provider administration, OpenRouter management, GitHub App and publication authority, Mission Control service access, verification/acceptance authority, other Attempts, and host/provider metadata. The guest receives one Attempt-scoped inference credential only. It has no acceptance or publication mutation path.

Repository content, prompts, model output, shell commands, executor stdout/stderr, structured results, and returned bundles are adversarial. The Mission Control host, pinned image build workflow, exact exe.dev control plane, and trusted root bootstrap are inside the administrative trust boundary. The unprivileged executor is not.

## Boundaries and controls

| Boundary | Threat | Control | Residual risk |
| --- | --- | --- | --- |
| Supply chain → VM | Vulnerable or substituted runtime | Digest-pinned base/frontend, checksum-pinned Git/BusyBox sources and patches, exact package versions, binary digests, 0 Critical/High scan gate, SBOM and registry attestation | Scanner/advisory latency; build service trust |
| Root bootstrap → executor | Privilege escalation or firewall replacement | UID/GID 10001, no-new-privileges, all five capability sets zero, direct mutation proof, protected roots read-only | Kernel/root escape can bypass guest controls |
| Executor → network | Exfiltration or metadata/provider access | Guest nftables default drop, exact inference allowlist, no workload DNS, private/link-local/metadata blocks | Provider offers no external egress enforcement |
| Host → guest credentials | Management credential disclosure | Explicit environment allowlist; no automatic integrations; negative credential matrix | Inference credential remains usable until host revocation |
| Attempt → Attempt | Persisted artifacts or credential reuse | One disposable resource per Attempt, dedicated workspace, exact deletion/absence, two-instance local isolation | Must be reconfirmed live on the published image |
| Guest → result boundary | Forged or oversized results/diagnostics | Frozen manifest identity, typed result validation, bounded/redacted output, host-side verification | Adversarial content remains untrusted until verification |

This remediation does not enable Guarded Auto, global routing, merge, acceptance, deployment, or any new architecture.
