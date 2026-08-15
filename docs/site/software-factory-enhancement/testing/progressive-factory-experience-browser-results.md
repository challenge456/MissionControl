# Progressive Factory Experience Browser Results

Validated on 2026-08-15 from branch
`codex/progressive-factory-experience-v1`, based on
`78a090b576810748676336a2afe5cdc19eccc42d`.

## Test fixture

The existing project-local Convex dataset contains an unrelated historical
`evalScores.metadata` schema-drift row, so it was not modified for this test.
Browser verification used a fresh anonymous local Convex backend, the standard
Software Factory demo seed, and two traces written through the existing
Observability mutations. The fixtures cover success and failure, a human
approval observation, an agent generation, a code tool call, independent
verification, cost, duration, a pull request, and acceptance posture.

## Responsive and theme matrix

| Viewport  | Theme | Mode         | Result                                                                                    | Evidence                                                                                              |
| --------- | ----- | ------------ | ----------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| 1440×1000 | Dark  | Basic        | Pass: guided launch, posture, metrics, run evidence, and Basic-only filters               | [Screenshot](../../../testing/evidence/progressive-factory-v1/factory-basic-desktop-dark.png)         |
| 1440×1000 | Light | Intermediate | Pass: recommendation, recipe catalog, composition details, and operator filters           | [Screenshot](../../../testing/evidence/progressive-factory-v1/factory-intermediate-desktop-light.png) |
| 1440×1000 | Light | Advanced     | Pass: full recipe data, raw observations, diagnostics, and existing control routes        | [Screenshot](../../../testing/evidence/progressive-factory-v1/factory-advanced-desktop-light.png)     |
| 1024×900  | Dark  | Intermediate | Pass: chat collapses, cards remain legible, no horizontal document overflow               | [Screenshot](../../../testing/evidence/progressive-factory-v1/factory-intermediate-tablet-dark.png)   |
| 1024×900  | Light | Intermediate | Pass: same responsive hierarchy and controls in light theme                               | [Screenshot](../../../testing/evidence/progressive-factory-v1/factory-intermediate-tablet-light.png)  |
| 390×844   | Light | Basic        | Pass: stacked posture and launch sections, compact shell, no horizontal document overflow | [Screenshot](../../../testing/evidence/progressive-factory-v1/factory-basic-mobile-light.png)         |
| 390×844   | Dark  | Basic        | Pass: compact run cards preserve PR, verification, approval, duration, and cost           | [Screenshot](../../../testing/evidence/progressive-factory-v1/factory-basic-mobile-dark-runs.png)     |

The Advanced Mission dialog also verified the recommended recipe, visible
override disclosure, model and executor intent, bounded corrective iterations,
and the explicit statement that draft creation does not dispatch, approve,
accept, or merge work. See the
[dialog screenshot](../../../testing/evidence/progressive-factory-v1/mission-draft-dialog-advanced-light.png).

## Interaction and accessibility

- Basic → `Tab` focused Intermediate; `Shift+Tab` returned focus to Basic.
- Basic, Intermediate, and Advanced persisted as one browser-local presentation
  preference and caused no delivery mutation.
- Recommendation enabled only after meaningful intent and returned
  Plan + Build + Test for the representative product request.
- Escape closed the Mission draft dialog without creating a record.
- A fresh-session WCAG 2 A/AA axe audit scoped to `.factory-page` reported
  19 passing rules, 0 violations, and 0 incomplete checks.
- The same fresh session completed Basic → Intermediate → Advanced → dialog →
  mobile Basic interactions with no page errors and no horizontal document
  overflow.

## Runtime boundary

The runtime-contract guard remains at baseline 21. No Convex schema, public
function contract, executor, acceptance mutation, trace store, or graph was
added. The new board projects existing Mission metadata, workflows, traces,
observations, verification facts, and protected routes.
