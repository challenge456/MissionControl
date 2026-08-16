# Remote Sandbox N=1 browser evidence

Validated 2026-08-15 against the reconciled branch at `http://localhost:5201` with the v2 shell, Context Registry, and EOS Command Center flags enabled.

Port 5199 was already owned by another preserved worktree, so it was not stopped or modified. That worktree also owned the repository's default local Convex process. Browser validation therefore used its read-only seeded Software Factory Demo data and the development-only runtime compatibility bypass while rendering this branch's UI. No mutation was submitted. The reconciled backend contract is covered separately by code generation, focused Convex suites, the full repository suite, and the runtime-contract guard. The initial evidence below covered v24 on the post-#102 baseline; the post-#95 reconciliation advances the final candidate to v25 and is recorded separately in this file.

## Results

- Basic exposes only Local and Isolated Sandbox beneath the shared Factory experience level.
- Intermediate exposes profile, executor/model, cost/runtime, independent verification, retry, preview, and teardown summaries.
- Advanced exposes provider/image/resources, network, credential descriptors, teardown/reconciliation, identity, readiness, and diagnostics.
- The configuration path visibly remains **Preview / Not Live Certified** and provides no control for self-asserting live certification.
- Keyboard ArrowRight changed the execution-boundary radio group from Local to Isolated Sandbox.
- Keyboard Enter expanded the Advanced profile disclosure. Its focused state rendered the configured focus ring.
- Accessibility snapshots exposed named regions, radios, selects, inputs, checkboxes, and the expandable disclosure.
- A clean browser session reported no page errors. Console output contained only Vite connection and React development messages.
- No profile was created, no Factory version was saved or activated, and no exe.dev/OpenRouter/GitHub provider operation occurred.

## Captures

- `factory-basic-dark.png`
- `factory-intermediate-dark.png`
- `factory-advanced-dark.png`
- `factory-advanced-light.png`
- `factory-profile-dark.png`
- `factory-profile-light.png`

The profile captures show the fail-closed certification copy, disabled create action without evidence, mandatory credential revocation and resource-absence language, and the existing readiness projection.

## Post-#95 v25 verification

Validated 2026-08-16 against the post-#95 reconciliation at `http://localhost:5199`, backed by the local Convex development deployment at `http://127.0.0.1:3214`. The development-only runtime compatibility bypass was enabled for browser rendering because the local backend remained at its development contract; the v24-to-v25 public contract was verified independently by the runtime extractor and guard.

- Basic retained only Local and Isolated Sandbox as execution-boundary choices.
- Intermediate retained the shared Factory controls for profile, executor/model, cost/runtime, verification, retry, and preview.
- Advanced composed #95 workflow, live policy-v2, verifier, and frozen-agent-version controls with the Remote Sandbox profile in the same Factory region.
- Keyboard ArrowRight selected Isolated Sandbox and Enter expanded the sandbox profile with a visible focus ring.
- The expanded profile remained fail closed: zero automatic provider credentials, missing readiness evidence, and a disabled create action.
- The #95 Missions list, governed Mission detail, and Mission execution lifecycle rendered without mutation.
- Light and dark themes rendered without horizontal overflow at a 1440-pixel viewport.
- The browser reported no page errors; console output contained only Vite connection and React development messages.
- No seed, Factory save/activation, WorkOrder acceptance, live provider call, capacity purchase, VM allocation, account/payment mutation, or credential change occurred.

Post-#95 captures:

- `post-95-basic-dark.png`
- `post-95-intermediate-dark.png`
- `post-95-advanced-dark.png`
- `post-95-advanced-light.png`
- `post-95-profile-dark.png`
- `post-95-missions-light.png`
- `post-95-mission-detail-light.png`
- `post-95-mission-execution-light.png`
