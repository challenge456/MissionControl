# Policy-v2 Mission-to-PR reconciliation proof

Date: 2026-08-15 (America/Los_Angeles)

Status: COMPLETE

This is the authoritative post-reconciliation live proof for PR #95. The
earlier policy-v2 proof remains immutable historical evidence; it was not
relabeled. A fresh proof was required because current `main` added the v23
worker lease, ownership, and recovery boundary after that proof was recorded.

## Reconciliation boundary

- `origin/main`: `c97b31d59911543c6f95b2cd35fded957b2eddc6`
- PR #95 runtime contract: `v24`
- Current `main` runtime contract: `v23`
- Public delta: `missions:savePlanDraft` changed plus the three canonical
  verification worker service commands.
- Factory Memory exact Attempt/Context Package integration and the Progressive
  Factory Basic/Intermediate/Advanced experience remained enabled.
- No second verification model, acceptance helper, trace store, memory path,
  or workflow engine was introduced.

## GitHub App boundary

- App: `mission-control-factory-jaywest`
- App ID: `4543062`
- Installation ID: `152563527`
- Provider repository ID: `1147499978`
- Repository: `jaydubya818/MissionControl`
- Authentication used the existing owner-only private-key file boundary.
  Credential contents and installation tokens were not printed, persisted in
  Convex, attached as evidence, placed in fixtures, or committed.

## Governed records

| Record | Exact identity |
| --- | --- |
| Mission | `ws7ekf81k0n7mx3xqk88dfsrmx8ckmck` |
| WorkOrder | `p17yd5hjb0kd7zk87pwtv1132s8ckq9t` (revision 1) |
| Software Factory Definition | `rx7bm32k03kr34hzwaapkj2emx8cg73a` |
| Software Factory Version | `rs7ff8vp3acdg12tt7f3j79kw98cgfqj` |
| Verification Factory Definition | `rx7aekmg1x6fhm2x9g2rs753f98chj57` |
| Verification Factory Version | `rs7bhp4k6k6wrz91vx0jvjqa8x8cg0qz` |
| Executor | `codex/v1` |
| Host | `local-macos-dev` |
| Product PR | [#108](https://github.com/jaydubya818/MissionControl/pull/108) |

The WorkOrder was compiled, approved, Factory-bound, dispatched, retried, and
GitHub-CI-synchronized from the browser. The product PR is distinct from PR
#95 and remains open and draft. `workOrders.accept` was not invoked.

## Initial verified candidate

- Source Attempt: `pd7wg3g3148mbdj3hw76k78dzd8ckxzf` (`9bgsa7w0`)
- Verification Attempt: `pd7hqqmr7p8ds3pefmz1e21cf98cjce1`
  (`hefj89b6`)
- Candidate: `08e62ba49179b4a207a96bca3dd9073a9315980c`
- Tree: `d37dfdef3689959b7577126bee3fc39ecb28525d`
- Verification Result: `n17k9ystj7xjgbdzx0wsf31sr98cjp1a`,
  `VERIFIED`, server-derived independence passed
- Verification Subject:
  `verification-subject:dc58b0978849779275a840c3b568b5c85b0e47da3d701c5ddaaef102041036e8`
- Frozen Verification Plan:
  `verification-plan:0bc8aa2dedbae07ea5f984499aa3fcac8fd86dae28bcfd7384451687073bebd6`
- Receipts: `mx7spvjbq5xj9sxsprcnhe0ynd8cj0ty`,
  `mx7haxfp3axhahcps8yjew9jvd8cj03d`
- Evidence: `r179mezk5db09xcj1tvt74jcy98cjcxg`,
  `r17d4c8xb2f0n0pk2rvvjtg9qs8ckmvg`,
  `r17a6hpd5gvep1js4cf10xtjnd8cjknq`
- Evidence-set digest:
  `sha256:924980cb063e6b2fc95d311c36e0e2ce846f6f887071d3513ab0afbdd651137b`
- Initial eligible Quality Gate Decision:
  `g17k9e2k7b4fbx47jjwzhd2c6n8cj4sc`

## Mismatch and fail-closed behavior

The product branch was advanced to the deliberate mismatch commit
`0d810fc5d28a86f8c8a90f64dc7c1990cd001df9`. Browser synchronization then
proved:

- exact-current eligibility became `false`;
- `Accept WorkOrder` became disabled;
- `VERIFICATION_STALE` was recorded;
- stale Quality Gate Decision `g17jsfzgpg0cjsvqf2yzbtcwss8ck6y5`
  was persisted;
- the two historical receipts remained `PASSED` with no `invalidatedAt` or
  invalidation reason;
- all historical evidence IDs and the command evidence content hash
  `sha256:8e277f5f0ea6524aab27a5c35fb9d248e2483ea6c42de5bb04a62aeba477a812`
  remained unchanged.

The recovery path also exposed two legitimate fail-closed boundaries:

1. Attempt `pd7p29jz8nbpeadsqxjn1j5wds8cjk4m` (`imimijs0`) preserved the
   branch when a temporary operator mismatch worktree still owned it.
2. Attempt `pd7yxxy5h8q5x66hvqqkxv69hx8ck4hc` (`5p43jcz3`) produced the
   corrected candidate but failed when GitHub's pull-request head read lagged
   the just-pushed branch. Commit `973f8353837d7e5baaa9e90ea239a3b046e23c6e`
   adds a bounded, fail-closed re-read and deterministic coverage.
3. Attempt `pd7wtm1v769hfb71cd2fz3ryfx8ckd8d` (`esse1b4h`) preserved the
   unpublished workspace because a new Attempt could not inherit another
   Attempt's ownership manifest. The operator verified the exact protected
   manifest, terminated executor PID, clean branch, local and remote
   `f52ff6c...` head, and base ancestry, then used non-force
   `git worktree remove` on only that exact worktree. The branch and pushed
   candidate remained intact. That intervention is retained in the governed
   retry reason.

No failed Attempt was rewritten or reused as verification authority.

## Corrected recovery lineage

- Source Attempt: `pd7mvmck1d631aha9hrekmrgnn8cjq7g` (`jrdbace4`)
- Verification Attempt: `pd7mdp97w9pk8jjfva48jrejh18cj8vq`
  (`ncst3yrr`)
- Candidate: `f52ff6c8c4944924012f2ca19ba0e9d679a13863`
- Tree: `d37dfdef3689959b7577126bee3fc39ecb28525d`
- Product PR: #108, branch `mc/v1132s8ckq9t`, App-authored, open, draft
- Verification Result: `n17sjh5bnwtsa95bzdndac9was8ckq9j`,
  `COMPLETED` / `VERIFIED`
- Verification Subject:
  `verification-subject:0a3ab98270d62e936383fccd0f0dd0b2b15da142e4581bca0edab384bc090bec`
- Subject digest:
  `sha256:0a3ab98270d62e936383fccd0f0dd0b2b15da142e4581bca0edab384bc090bec`
- Frozen Verification Plan:
  `verification-plan:0e1b5eb38d6528c4e7ace7b938b6fcb3abcf922e6b1808da2d842ad4853d2388`
- Plan digest:
  `sha256:0e1b5eb38d6528c4e7ace7b938b6fcb3abcf922e6b1808da2d842ad4853d2388`
- Verification contract digest:
  `sha256:c3090b90508c46b749218402d1da54d978bc474114eacf74c725dff82d415f4b`
- Server-derived independence: passed across separate source/verification
  Attempts, Factory Versions, invocations, leases, capabilities, and isolated
  detached worktrees
- Receipts: `mx7tjk7ma1495n7xvydtnnsd8h8cjqw9`,
  `mx7s71x749v4p3zq2bw0mnvg558ckff3`
- Evidence: `r177nksths4rgchrjakswbp3k58ckn7w`,
  `r17efptgzzj2cvt1vcep6d3j8n8cje1g`,
  `r1729mkbzwd9d617fa8mra92h98cj8qd`
- Command evidence content hash:
  `sha256:a21bce4354c9866bebcce4ecfeab5c882f9816d9d6a48b2307d3112f040fb63c`
- Evidence-set digest:
  `sha256:fe03458a989d7d80f898ae06c11de469107244d6ea1b7602c49d3d28b64e361d`
- Final eligible Quality Gate Decision:
  `g17hpm7j4p5xcjb48hfh6jz7dx8ckky4`
- Exact-current state: `current=true`, `eligible=true`
- WorkOrder projection: `AWAITING_VERIFICATION`, required action
  `Ready for explicit acceptance.`
- State-sync event: `nn7medgtzwg0pt4tfvvgy0x5hn8ck4ck`

The first recovery sync revealed that historical policy-v2 receipts could
incorrectly keep the WorkOrder's presentation state blocked after the
canonical evaluator returned eligible. Commit
`d86f5ee43f65adbe72eafde0228c0094697c69a8` makes the canonical evaluator the
source for this non-authoritative state projection and preserves every
historical receipt.

## GitHub and browser result

Product PR #108 head `f52ff6c...` passed all six GitHub CI jobs and both Vercel
previews:

- `mission-control-mission-control-ui`:
  `6VWZBGMNXUsive47a1wLdFKjSFvD`
- `mission-control-ui`: `J9B3Ch43911NtHbQuqnLcA4vGJ8B`

The focused Playwright test
`tests/e2e/local-mission-golden-path.e2e.spec.ts` passed against the exact
records above. It refreshed the Mission, inspected the real execution and
verification lineage, opened the WorkOrder, observed the historical candidate
and failed run, confirmed PR #108 and exact-current eligibility, and confirmed
that `Accept WorkOrder` was enabled. It did not click acceptance.

## Safety assertions

- `workOrders.accept` was not invoked.
- Product PR #108 was not merged and remains draft.
- PR #95 was not merged.
- No exe.dev API, provider VM, paid capacity, model-provider credential,
  account upgrade, public port, production provider integration, or remote
  deployment was used.
- Remote sandbox execution remains gated at `max_vms: 0` with zero live VMs.
- The unrelated stash object
  `1cbb8062ecce8f9eb891a73cb60777ca84be41c8` was not modified or dropped.
