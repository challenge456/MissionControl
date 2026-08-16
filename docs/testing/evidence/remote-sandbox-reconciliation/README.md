# Remote Sandbox N=1 browser evidence

Validated 2026-08-15 against the reconciled branch at `http://localhost:5201` with the v2 shell, Context Registry, and EOS Command Center flags enabled.

Port 5199 was already owned by another preserved worktree, so it was not stopped or modified. That worktree also owned the repository's default local Convex process. Browser validation therefore used its read-only seeded Software Factory Demo data and the development-only runtime compatibility bypass while rendering this branch's UI. No mutation was submitted. The reconciled v24 backend contract is covered separately by code generation, focused Convex suites, the full repository suite, and the runtime-contract guard.

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
