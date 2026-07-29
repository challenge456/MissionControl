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
Unavailable requests are replaced in the URL without removing other query
parameters.

## Operator behavior

The application announces:

> The requested workspace was unavailable. Mission Control opened an accessible
> workspace instead.

The warning is dismissible and non-blocking. Once the corrected URL is active,
refresh does not reannounce the warning.

## Verification

- five selection-policy unit tests passed;
- direct invalid Docs route recovered;
- `doc`, `mission`, `task`, `workOrder`, `tab`, and `filters` were preserved;
- Back, Forward, and refresh remained stable;
- accessible workspace isolation passed;
- zero browser page or console errors;
- zero relevant failed network requests;
- zero critical Axe violations.
- complete root preparation, typecheck, lint, tests, and build passed.

The network result excludes only expected `fonts.gstatic.com` `ERR_ABORTED`
events caused by intentional browser navigation and the optional gateway health
probe.

## Evidence

- Repository record: `docs/testing/docs-workspace-routing-results.md`
- Screenshot: `docs/testing/evidence/docs-workspace-routing/docs-001-recovered.png`
- Trace:
  `docs/testing/evidence/docs-workspace-routing/docs-001-workspace-routing-trace.zip`

## Limitations

This is published operator-facing documentation. Dynamic Docs authoring,
revision history, and approval are not implemented.
