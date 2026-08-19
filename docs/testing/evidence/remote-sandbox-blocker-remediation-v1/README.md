# Remote Sandbox Hardening V1 blocker remediation

## Decision

`HOLD`

The remediation fixes the seven High image findings without suppression and publishes an attested, publicly pullable, digest-pinned image with an unsuppressed 0 Critical / 0 High Grype gate. Two fresh local linux/amd64 instances prove the intended non-root, zero-capability, firewall, egress, credential, filesystem, and isolation controls.

The required live gate does not pass. Three unique exe.dev Attempts ran serially, once each, with no retries. The provider allocated the intended custom runtime (the failure stack reports Node v26.7.0), but its reported image identity did not exactly equal the requested digest-qualified GHCR reference. The trusted bootstrap correctly failed closed before producing a security proof or starting Codex. All three Attempt keys were revoked and rejected with `401`; all three exact resources were deleted; final provider inventory is zero.

provider-enforced egress unavailable

Guest nftables remains qualification-only defense in depth. This work does not claim RED-ready isolation, enable Guarded Auto, change acceptance/publication authority, or promote Remote Sandbox globally.

## Evidence index

- `vulnerability-audit.md`: root-cause and disposition for all seven PR #125 High findings.
- `vulnerability-gate.json` and `vulnerability-scan-grype.json`: local unsuppressed 0 Critical / 0 High admission and raw scan.
- `registry-image-provenance.json`: immutable public GHCR digest, registry SBOM, scan, and attestation identities.
- `local-runtime-qualification.json`: two fresh-instance security and isolation proof.
- `provider-capability.json` and `provider-cli-help.txt`: current exe.dev capability audit.
- `network-policy.md` and `threat-model.md`: enforced boundary and residual risk.
- `live-3-workload-gate.json`: authoritative live first-pass lifecycle and failure evidence.
- `live-negative-matrix.md`: passed cleanup/credential negatives and unreached live security probes.
- `performance-comparison.md`: phase timings with unreached values preserved as `null`.
- `validation-summary.json`: requested local validation and external-check status.
- `final-decision.json`: machine-readable terminal decision and PR relationship.

PR #126 is the additive replacement/remediation draft for PR #125. PR #125 remains unchanged and on hold; neither PR should merge until a fresh gate can prove exact published-image identity through exe.dev and then achieve 3/3 first-pass live workloads.
