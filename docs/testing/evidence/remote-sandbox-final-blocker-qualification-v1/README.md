# Remote Sandbox Final Blocker Qualification V1

## Outcome

The existing hardened candidate passed the local, published-artifact, and live exe.dev qualification gates. The release decision remains contingent on the current PR's fresh GitHub CI and Vercel checks.

The immutable qualified artifact is:

`ghcr.io/jaydubya818/mission-control-remote-sandbox@sha256:41a66f1d6f7b90618a6c58fb9a1a336ef69ab2794fc1322233e4a5d9788782b8`

The registry digest, locally qualified image ID, digest-pulled image ID, raw OCI index digest, linux/amd64 manifest, config, layers, and RootFS were compared. The content match passed. Public pull and the BuildKit SLSA provenance attestation also passed.

## Security result

- Vulnerability gate: 7 High findings reduced to 0 Critical / 0 High with no suppressions.
- Published-artifact rescan: 0 Critical / 0 High / 2 Medium with no suppressions.
- The two Medium records are duplicate BusyBox package metadata for CVE-2025-60876 (`busybox` and `busybox-binsh`). The affected `wget` applet and `/usr/bin/wget` are absent from the runtime image.
- Workload identity: UID/GID 10001, `no_new_privs`, and all capability sets empty.
- Package managers and package caches are absent; protected runtime paths are read-only.
- Guest nftables defaults to deny and allows only the resolved OpenRouter HTTPS endpoints required by the workload.
- Arbitrary public, RFC1918, link-local, metadata, and unauthorized DNS destinations were blocked. Firewall mutation was blocked.
- The Attempt workload received only an Attempt-scoped inference credential. OpenRouter management, exe.dev administration, GitHub, and Mission Control credentials were absent.
- Previous-Attempt artifacts were absent in fresh sequential containers and live VMs.

exe.dev exposes no demonstrated provider-enforced egress control. Guest nftables is defense in depth. This qualification proves the actual non-root, capability-empty Codex workload cannot bypass or mutate that guest policy; it does not claim a provider network boundary that exe.dev does not offer.

## Live qualification

The canary proved the complete path:

`VM -> immutable hardened image -> supervisor -> Codex -> factory-result/v1 -> candidate -> independent verification -> acceptance eligibility`

The canary passed on its first Attempt with zero retries. Its exact credential was rejected at the first post-revocation probe, its exact VM was absent, and the final inventory was zero.

The strict cohort then passed 3/3 first-pass with zero retries:

| Workload | Candidate | Verification | Acceptance eligible | Credential rejected | Exact VM absent | Total cycle |
| --- | --- | --- | --- | --- | --- | ---: |
| Bug fix | `9a57bb990158c92640a063e080765160f6da414c` | VERIFIED | Yes | +0 ms | Yes | 179,391 ms |
| Security/policy | `bb08c9b313e2a70c223b08821b79f79452301ad6` | VERIFIED | Yes | +0 ms | Yes | 106,514 ms |
| Data/schema migration | `04a692fc032cd4d4b01cc4191dbc3f7dc165ea74` | VERIFIED | Yes | +0 ms | Yes | 195,051 ms |

The separately qualified OpenRouter revocation bound remains conservative: a deleted credential authenticated through +15 seconds and was rejected by +30 seconds. Every live Attempt was rejected at +0 ms, within that bound.

Maximum concurrent VMs was one. Final exe.dev inventory was zero.

## Image and toolchain identity

| Component | Qualified identity |
| --- | --- |
| Base image | `node@sha256:ce3cc39fe3b8b2602d3b1c4d63d301e46b48c550ecb627869853ddcdda418b63` |
| Runtime image | `sha256:41a66f1d6f7b90618a6c58fb9a1a336ef69ab2794fc1322233e4a5d9788782b8` |
| Registry linux/amd64 manifest | `sha256:bbba462e1363dc456415e9b6ac762cf0d1cb82307aa2f663760506df1c42c004` |
| Registry config | `sha256:c317cbd8815aa54c6143d448ac5880c39ef9542d1690643be7e2c2a5f0383055` |
| Provenance attestation | `sha256:908eb2ba554fdcb0fdd0af77b38bfc5fb77b16d3c1f134acac4c4fe99cc1ff34` |
| Published SBOM | `sha256:7706d0e318cd9583a04d541ac06277d84c063eca149dd081f0bc34c78f9afbfd` |
| Published vulnerability scan | `sha256:9689bd3ef9530dd4803cabf4a40ee133c0c2f6bd28b6b6b5381a3eae595d1af6` |
| Node | `v26.7.0` |
| Codex CLI | `0.146.0` |
| Codex binary | `sha256:2e863156ed35ecc5253b1e2f907a9143077b9f7cb51942070c61996471ff6e04` |
| Git | `2.55.0`, binary `sha256:7127059b4ebea64f4a50fc3c64601b69a9694196f3ee0396efec6378a0b45078` |
| BusyBox | `1.37.0`, binary `sha256:6a925a6f54ad5263762a91c25cc0a14b8093a86c2b9c1d5f8fae09ccaaeac222` |
| Toolchain input digest | `sha256:76858cb0bebf67e0f9bac7ffed49e2bd83059095cf001466398b316b4b52b883` |

Attempt-time Codex/npm installation is disabled. Identity mismatches fail closed.

## Validation

`pnpm run qualify:factory` passed all 17 gates, including the full repository suites, TypeScript, lint, skill lint, runtime guard, production build, orchestration smoke, release secret scans, release security audit, and `git diff --check`. The complete machine-readable result is in `automated-checks.json`.

Key evidence:

- `registry-image-provenance.json`
- `published-image-security-qualification.json`
- `published-image-sbom.spdx.json`
- `published-vulnerability-scan-grype.json`
- `live-canary-gate.json`
- `live-3-workload-gate.json`
- `openrouter-revocation-timing.json`
- `vulnerability-audit.md`
- `automated-checks.json`

## Performance

The strict cohort averaged 160,319 ms end to end versus 136,436 ms in the prior preview (+17.5%). Individual cycle deltas were +101.8% for bug fix, +19.1% for security/policy, and -15.6% for migration. The current live startup phase was stable at 10.9-11.1 seconds; most variance was Codex execution time rather than VM allocation or teardown.

## Pull request reconciliation

- PR #125 must remain draft/HOLD and unmerged. Its original failed qualification evidence is historical truth and must not be rewritten.
- PR #126 appends the hardening remediation and final qualification evidence. Its earlier failed publication evidence is also retained.
- Neither pull request is authorized to merge by this qualification.
- Guarded Auto remains disabled and Remote Sandbox remains qualification-only; no global promotion is included.

## Post-deploy monitoring and validation

No deployment or global enablement is part of this change. If the qualified profile is later promoted through a separate authorized decision, monitor exact-image identity, guest firewall policy digest, credential-revocation latency, teardown receipts, residual VM inventory, retry rate, and first-pass acceptance rate. Fail closed and halt dispatch on an image/toolchain mismatch, a credential remaining valid after 30 seconds, a missing teardown confirmation, or any residual VM.
