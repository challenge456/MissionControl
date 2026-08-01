# Feature flags

Mission Control gates major surfaces behind feature flags stored in Convex and env overrides.

## UI flags (Vite)

| Env var | Flag key |
| --- | --- |
| `VITE_FLAG_UI_SHELL_V2` | `ui.shell.v2` |
| `VITE_FLAG_EOS_COMMAND_CENTER_PREVIEW` | `eos.command-center-preview` |
| `VITE_FLAG_CONTEXT_REGISTRY` | `context.registry` |
| `VITE_FLAG_COMPANY_CONTEXT` | `company.context` |

## Backend flags

| Flag | Effect |
| --- | --- |
| `context.registry` | Registry mutations and import pipeline |
| `eval.framework` | Eval gate on publish; banner on Registry Evals tab |
| `delivery.workorders` | WorkOrder read models and control plane |
| `executor.pi-bridge` | Pi runtime dispatch envelope |
| `company.context` | Company selector and company-scoped workspace administration |

## Demo mode

`pnpm dev:demo` enables shell v2, EOS preview, and context registry in one command.

Company-context local testing additionally requires
`MC_ALLOW_ANONYMOUS_COMPANY_CONTEXT=1` on the Convex backend. This is an
explicit demo adapter and must remain disabled in production.

## Documentation

Full list: `docs/FEATURE_FLAGS.md` in repo root.

Query flags in UI via `useFlag()` hook from `convex/lib/flags.ts` projections.
