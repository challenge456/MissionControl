# Loop Engineering authority and lineage browser verification

- Date: 2026-08-02
- Route: `http://localhost:5199/v2/harness-loops?company=wx74rg6ftfvzpq8hhtcjh4qve58b64w8&workspace=wh7dqkd4h1hm7k4psxrkv0x9c58bj89r`
- Workspace: Software Factory Demo
- Runtime: local Convex deployment with explicit anonymous demo mode; EOS and preview navigation flags enabled

## Assertions

- The direct route opens Loop Engineering and remains on the supplied company/workspace scope.
- The route and navigation visibly display `Preview`.
- The diagram displays Inner -> `Drives autonomy`, Outer -> `Drives automation`, and Meta -> `Drives quality`.
- The empty cycle state remains operable and does not imply that the workspace PR belongs to a cycle.
- The outer panel labels the evidence `Workspace latest PR — not linked to the selected cycle` and the link `workspace latest PR (unscoped)`.
- Five evidence-backed meta improvement proposals and improvement history load within the selected workspace.
- A fresh browser session reports no page errors and no application console errors.

The optional `/gateway/status` Vite proxy logs `ECONNREFUSED` when the separate channel gateway is not running. That dependency is outside the Loop/Convex journey and does not prevent this page from loading.

## Screenshots

- `loop-engineering-workspace.png` — route, Preview state, navigation, and canonical loop terminology.
- `loop-engineering-outer-meta.png` — explicit unscoped workspace-latest PR treatment and five merge gates.
