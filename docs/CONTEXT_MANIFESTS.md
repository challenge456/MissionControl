# Context Manifests & Locks

Software Factory Epic 3 — declarative, versioned context dependencies per
repository. A repo declares which context packages it wants in
`mc-context.json`; `mc context lock` resolves those ranges against the
registry into an exact, reproducible `mc-context.lock`; installation state is
mirrored to Convex so Mission Control can see what every repo is running.

Parsing, serialization, and resolution live in
`packages/context-tools` (`@mission-control/context-tools`). Convex
persistence lives in `convex/context/manifests.ts` with pure logic in
`convex/lib/contextManifests.ts`.

## Manifest format — `mc-context.json`

```json
{
  "schemaVersion": "1.0",
  "repository": "jaydubya818/MissionControl",
  "contextPackages": {
    "software-factory/pr-delivery": "^1.3.0",
    "anthropic/skill-creator": "~2.1.0"
  }
}
```

| Field | Type | Rules |
|-------|------|-------|
| `schemaVersion` | string | Must be `"1.0"` |
| `repository` | string | Non-empty; `"owner/repo"` by convention |
| `contextPackages` | object | Keys are package slugs (`scope/name`, lowercase kebab-case); values are version ranges |

Supported range forms (only these four): exact `"1.2.3"`, caret `"^1.2.3"`,
tilde `"~1.2.3"`, and `">=1.2.3"`. Wildcards, hyphen ranges, unions,
prerelease tags, and build metadata are rejected.

Unknown top-level keys are rejected. Serialization is deterministic:
2-space indent, `schemaVersion` / `repository` / `contextPackages` order,
package slugs sorted.

## Lock format — `mc-context.lock`

```json
{
  "schemaVersion": "1.0",
  "resolved": {
    "software-factory/pr-delivery": {
      "version": "1.3.2",
      "contentHash": "sha256:6b86b273ff34fce19d6b804eff5a3f5747ada4eaa22f1d49c01e52ddb7875b4b",
      "sourceCommitSha": "abc123def456"
    }
  }
}
```

Each resolved entry pins an exact version, its content hash
(`sha256:` + 64 lowercase hex chars), and the source commit it was published
from (`"unknown"` when the registry has no provenance for that version).
Transitive dependencies appear in `resolved` even when they are not in the
manifest.

## Resolution semantics

Resolution runs client-side (in the CLI) against a registry snapshot fetched
from Convex:

- Each slug resolves to the **highest** published version satisfying **all**
  ranges requested for it (manifest entries plus every transitive requester).
- `missing` — the slug has no published versions in the snapshot.
- `conflict` — versions exist, but none satisfies every requester's range.
- `circular` — the resolved graph contains a cycle; resolution still
  terminates and the cycle is reported.
- Output is deterministic: resolved keys and issues are sorted.

Any issue fails `mc context lock` / `mc context verify` with exit code 1.

## CLI reference — `mc context`

All commands operate on `mc-context.json` / `mc-context.lock` in the current
directory, or in `--dir <path>`. Pass `--json` for machine-readable output.
Exit codes: 0 clean, 1 on errors, conflicts, or drift.

| Command | Behavior | Needs Convex |
|---------|----------|--------------|
| `mc context init` | Write a starter manifest (repository from the git remote, else the directory name). Errors if the file exists. | no |
| `mc context list` | Print manifest entries with lock resolution status. | no |
| `mc context add <slug> [range]` | Add/update an entry. Without a range, defaults to `^<latest published>` from the registry. | only without an explicit range |
| `mc context remove <slug>` | Remove an entry. | no |
| `mc context lock` | Fetch the registry snapshot, resolve, write `mc-context.lock`, then sync manifest + lock + installations to Convex. | yes |
| `mc context verify` | Re-resolve and compare with the lock; report drift and exit 1 on mismatch or resolution issues. | yes |
| `mc context diff` | Show what a fresh resolution would change vs the current lock (`+` added, `-` removed, `~` changed). | yes |
| `mc context outdated` | List locked packages with newer registry versions, noting the latest version that still satisfies the manifest range. | yes |

Registry-backed commands call `npx convex run` from the repo root and need a
configured deployment (`.env.local`). Without one they fail with a clear
error; offline commands (`init`, `list`, `remove`, `add` with an explicit
range) keep working.

The CLI requires the built context-tools dist and builds it automatically
when missing (`pnpm --filter @mission-control/context-tools build`).

## Convex sync behavior

`mc context lock` pushes three writes (all as actor `mc-cli`):

1. `context/manifests:saveManifest` — upserts the raw manifest JSON into
   `contextManifests` (one row per `repoSlug`).
2. `context/manifests:saveLock` — upserts the lock JSON into `contextLocks`
   with `manifestHash` (sha256 of the exact manifest bytes it was resolved
   from) and `resolvedCount`.
3. `context/manifests:syncInstallations` — reconciles `contextInstallations`
   rows for the repo: upserts an `INSTALLED` row per resolved package and
   deletes rows for packages no longer in the lock. Installation states are
   `INSTALLED` / `STALE` / `MISSING` / `INCOMPATIBLE` (the health sweep that
   sets non-INSTALLED states arrives in a later PR).

`context/manifests:registrySnapshot` is the read side: every PUBLISHED
version of every ACTIVE or DRAFT package, mapped to the resolver's
`AvailablePackage` shape (`dependencies` array converted to a record;
versions without a `contentHash` excluded).

Reads (`getManifest`, `getLock`, `listInstallations`,
`listInstallationsByPackage`, `registrySnapshot`) are open queries.

## Feature flag

All mutations are gated behind the `context.registry` feature flag
(`convex/lib/contextRegistryGate.ts`). Enable it before running
`mc context lock`:

```bash
mc flags set context.registry on
```

With the flag off, writes throw and `mc context lock` fails after writing the
local lock file; reads and offline commands are unaffected.
