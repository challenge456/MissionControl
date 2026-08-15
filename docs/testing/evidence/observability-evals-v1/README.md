# Observability, Traces, and Evals V1 browser evidence

Validated on 2026-08-15 against the preserved local Research Lab at
`http://localhost:5199/v2/trace-inspector` using the headless Chromium browser.

## Coverage

- Opened the live route directly and from the Delivery navigation.
- Inspected both execution-tree and timeline presentations for a failed Attempt trace.
- Verified search matches WorkOrder title text and filters by status, purpose, executor, and model.
- Verified the explicit no-results state and empty Eval Library and Experiments states.
- Promoted one sanitized trace to `Observability V1 Browser Cases`, then repeated the action and received `This trace is already in that dataset.`
- Verified the dataset contained one case. The exact browser-created dataset, item, and promotion audit activity were removed afterward; no authoritative WorkOrder, Attempt, verification, trace, or observation data was changed.
- Verified 1440x1000 dark and light, 1024x900 dark, and 390x844 light layouts with zero horizontal overflow.
- Axe reported zero violations at the tested desktop, tablet, and mobile widths in both themes. Dark mode left one indeterminate contrast review for a one-character navigation count badge; light mode had no incomplete checks.
- Browser console contained only Vite/React development messages, with no console errors or page errors.

## Screenshots

- `1440-dark-traces.png`: trace list and execution tree.
- `1440-dark-timeline.png`: timeline presentation.
- `1440-dark-dataset.png`: one sanitized promoted regression case before cleanup.
- `1024-dark.png`: tablet-width dark layout.
- `390-light.png`: mobile-width light layout.
- `1440-light.png`: desktop-width light layout.
