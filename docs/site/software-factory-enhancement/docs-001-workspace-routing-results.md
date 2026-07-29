# DOCS-001 Workspace Routing Results

| Field | Value |
| --- | --- |
| Status | VERIFIED |
| Owner | Mission Control Platform |
| Workspace | Software Factory Research Lab (`sn71gskbdemgf4z1trt9zdmm5h8bde69`) |
| Branch | `codex/fix-docs-workspace-routing` |
| Updated | 2026-07-28 |

## Result

Mission Control now treats workspace URL and local-storage values as untrusted.
It loads the accessible workspace list before selecting an ID, fails closed,
and never sends an unvalidated string to a Convex ID validator.

Selection order is exact accessible request, previously valid stored workspace,
preferred Mission Control workspace, then first accessible active workspace.
Unavailable requests are replaced in the URL without removing `doc`, `mission`,
`task`, `workOrder`, `tab`, `filters`, `view`, `automation`, or `definition`.

## Operator behavior

The application announces:

> The requested workspace was unavailable. Mission Control opened an accessible
> workspace instead.

The warning is a dedicated nonblocking `role="status"` notice. It is
dismissible and does not reappear during the same resolved navigation. A
different explicitly requested invalid workspace produces a new warning.

## Verification

- eight selection-policy unit tests passed;
- direct invalid Docs route recovered;
- all nine unrelated route parameters were preserved;
- Back, Forward, and refresh remained stable;
- warning status, dismissal, and different-invalid reannouncement passed;
- accessible workspace isolation passed;
- zero browser page or console errors;
- zero relevant failed network requests;
- zero critical Axe violations.
- complete root preparation, typecheck, lint, 941 tests, and build passed.

The network result excludes only expected `fonts.gstatic.com` `ERR_ABORTED`
events caused by intentional browser navigation and the optional gateway health
probe.

## Evidence

- Repository record: `docs/testing/docs-workspace-routing-results.md`
- Screenshot: `docs/testing/evidence/docs-workspace-routing/docs-001-recovered.png`
- Dismissed state:
  `docs/testing/evidence/docs-workspace-routing/docs-001-dismissed.png`
- Trace:
  `docs/testing/evidence/docs-workspace-routing/docs-001-workspace-routing-trace.zip`

## Limitations

This is published operator-facing documentation. Dynamic Docs authoring,
revision history, and approval are not implemented.
