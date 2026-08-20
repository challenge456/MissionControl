# Preview versus hardened differential

## Evidence compared

This comparison was frozen before importing or modifying the hardened candidate
in this worktree.

- last known working Preview cohort:
  `docs/testing/evidence/production-factory-pilot-v3/execution-results.json`
  and `remote-reliability.json`
- Preview implementation: exact `origin/main`
  `11a51cac1e446488cddf34781cc9663b922c7684`
- committed hardened candidate: PR #126 head
  `f67ac9975a61cd78ed4529a127f21efbe3ace64f`
- final preserved hardened qualification source and evidence:
  `/Users/jaywest/MissionControl/.worktrees/codex/remote-sandbox-hardening-blockers-v1-20260819`
- hardened qualification artifact SHA-256:
  `e810af0265fbe40817bb62ddfb682caa5810013235faa6cb0aab2f6c4f548029`
- exact hardened registry image, freshly pulled and inspected:
  `ghcr.io/jaydubya818/mission-control-remote-sandbox@sha256:ce142e3f1782d921e54203c748db590dd0f2650cc12cf801002729f07bb0f4ec`

The working Preview sample is the three-workload remote subset from Production
Factory Pilot V3: bug fix, security/policy, and data/schema migration. It passed
3/3 first-pass, used no retries, emitted canonical output files, reached
independent exact-candidate verification and acceptance eligibility, revoked
all three Attempt keys, and ended with zero VMs. The corresponding hardened
cohort failed 0/3 before a result bundle.

## Deterministic field comparison

| Boundary | Working Preview | Hardened candidate | Materiality to 0/3 startup failure |
| --- | --- | --- | --- |
| Image | Mutable provider image name `node:24-bookworm` | Immutable GHCR digest `sha256:ce142e3…0f4ec`, linux/amd64, login user `root` | High: changes the complete userspace and available commands. |
| Node | Provider image Node 24 line; not attested by the Preview packet | Pinned `v26.7.0` at `/usr/local/bin/node` | Medium: runtime changed, though the supervisor passes syntax and executes locally. |
| Codex | `npx -y @openai/codex@0.146.0 …`; Attempt-time npm download/install | Preinstalled `codex-cli 0.146.0` at `/usr/local/bin/codex`, native binary digest-bound; no Attempt-time install | High: same CLI version but a different launcher, libc package, and runtime dependency surface. |
| Package/test tools | `npm`/`npx` present; workload prompt and reported verification use `npm test` | `npm`, `npx`, Corepack, pnpm, yarn, apk, and wget absent | High for workload equivalence after Codex starts. The hardened prompt still asks for `npm test`, so the actual requested command is unavailable. This alone does not explain an empty supervisor log before the first Codex event. |
| Git | Provider image Git; supervisor calls it as root | Pinned custom Git `2.55.0` at `/usr/local/bin/git`; final candidate calls repository Git through the same non-root confinement as Codex | High during repository validation and result finalization. An earlier root/non-root ownership mismatch was corrected in the preserved candidate, but the failing 0/3 run already used the corrected source. |
| BusyBox/core utilities | Debian/coreutils userspace | Patched minimal static BusyBox `1.37.0`; only 38 applets | High: `nohup`, `setsid`, `sh`, and required transport applets exist, but common tools such as `hostname`, `sed`, `uname`, `dirname`, `mktemp`, and `find` are absent. A login `sh` emits `hostname: applet not found`. Hidden Codex/shell dependencies require exact-process testing. |
| Supervisor identity | Root | Root | None: unchanged. Root still owns manifest validation, firewall policy, evidence, and terminal result publication. |
| Codex identity | Root, inherited provider groups/capabilities | UID/GID `10001:10001` via `setpriv`; no supplementary groups, `no_new_privs=1`, all capability sets zero | High and intentional. Exact constrained `codex --version` passes. |
| Process group | Child attached to supervisor; timeout signals child | Child launched detached under `setpriv`; supervisor signals the child process group and escalates from TERM to KILL | Medium. Failure occurs before any observed cancellation, but spawn/process-group setup is a changed boundary. |
| Child command | `npx -y @openai/codex@0.146.0` | `setpriv … -- codex` | High. The outer supervisor launch remains identical; the inner executor launch changes. |
| PATH | Supervisor/provider `PATH` passed through | Exact `/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin` | Medium. Required pinned binaries resolve in the exact image. |
| HOME | Inherited supervisor `HOME`, normally `/root` | `/var/lib/mission-control/attempt/home`, owner `10001:10001`, mode `0700` | High: Codex state and shell discovery move to an empty dedicated home. |
| TMPDIR | Not explicitly set | `/var/lib/mission-control/attempt/tmp`, owner `10001:10001`, mode `0700` | Medium: writable and dedicated, but all temporary-file behavior changes. |
| Shell account | Root's normal shell | `mc-attempt` account has passwd home `/home/mc-attempt` and shell `/sbin/nologin`; the process environment overrides HOME but not SHELL | High hypothesis: Codex command execution may consult passwd/SHELL independently of HOME. `/sbin/nologin` points to the reduced BusyBox binary and its applet is absent. |
| Child environment | `PATH`, `HOME`, `OPENAI_API_KEY`, `OPENAI_BASE_URL` | Exact `PATH`, `HOME`, `TMPDIR`, `OPENAI_API_KEY`, `OPENAI_BASE_URL`; nothing else | High: deliberate authority reduction can expose undocumented CLI dependencies. |
| Root Attempt directory | Created by upload with root-only umask; no explicit final mode | `/var/lib/mission-control/attempt` root-owned mode `0711` | Medium: root supervisor can read/write; confined child can traverse but not create arbitrary siblings. |
| Repository | Root-created/root-owned clone | Recursively `lchown`ed without following links to `10001:10001` | High and intentional. Exact repository stat/ownership must be captured at launch. |
| Output schema | Uploaded root-owned mode `0600` | Uploaded root-owned then changed to mode `0444` | Medium: non-root Codex can read but cannot modify it. |
| Executor output | Absent until Codex writes it in root-writable directory | Pre-created mode `0600`, owner `10001:10001` | High: this is the only bounded non-root executor output path. |
| Supervisor config/source | Root-owned mode `0600` | Root-owned mode `0600`; bootstrap source changed to `0444` | Low: supervisor remains root and exact outer launch can read both files. |
| Result/diagnostics/log | `/var/lib/mission-control/attempt/result.json`, `diagnostics.json`, `supervisor.log`; root-owned | Same paths, same root authority | None in path identity; high in observability because fatal pre-executor exceptions were not atomically recorded. |
| Outer launch | `nohup setsid node …/supervisor.mjs …/config.json >…/supervisor.log 2>&1 &` | Exact same command | Low. A direct exact-image probe confirmed `nohup`, `setsid`, and Node launch correctly and a root child wrote an output file. |
| Egress | Unrestricted | nftables rejects all UID 10001 traffic except resolved public IPs for `openrouter.ai:443`; DNS blocked after `/etc/hosts` pinning | High after spawn. Provider enforcement remains unavailable; this is guest defense in depth. |
| Model route | OpenRouter Responses API, model `openai/gpt-5.1-codex-mini` | Same host/API/model and same two secret-bearing environment variable names | Low in intended identity. Actual destination/connection evidence still must be captured. |
| Structured output | Same `factory-result.schema.json`, `executor-result.json`, `result.json` contract | Same | Low. No hardened Attempt reached this boundary. |
| Timing/result | 3/3; execution 68,629 ms / 68,886 ms / 210,716 ms | 0/3; supervisor absent 1.6–1.8 s after `SANDBOX_STARTED`; no Codex event/result/diagnostics | Strongly localizes the defect to supervisor repository validation or executor startup, not workload-specific model behavior. |

## Exact-image checks completed during the differential

- Docker resolved the requested digest exactly and reported `linux/amd64`, user
  `root`, and the frozen PATH.
- `node --version`, `codex --version`, `git --version`, `setpriv --version`, and
  BusyBox identity matched the frozen toolchain.
- `npm`, `npx`, `apk`, and `wget` were absent.
- `setpriv` with UID/GID 10001, `no_new_privs`, and all capability sets dropped
  successfully executed `codex --version` under the exact HOME/TMPDIR/PATH.
- The unchanged outer `nohup setsid node … &` pattern successfully launched a
  root Node probe and wrote its result.
- A constrained `codex exec --json --ephemeral` against a local bounded HTTP
  rejection endpoint emitted `thread.started`, `turn.started`, retry events,
  and `turn.failed`. This proves the baked CLI can enter its event loop under
  the constrained identity; it does not prove a real model workload, workspace
  command execution, or terminal process exit.

## Ranked hypotheses entering lifecycle tracing

1. **Constrained shell/runtime equivalence:** the hardened account uses
   `/sbin/nologin`, omits `SHELL`, and the minimal BusyBox omits common commands.
   `codex --version` is insufficient proof of a real Codex workload.
2. **Repository validation or permission transition:** the first supervisor
   action is confined `git rev-parse`. The repository and HOME/TMPDIR are newly
   owned by UID 10001, while supervisor/config/result publication stay root.
3. **Executor spawn/startup:** `setpriv` plus detached process-group creation is
   new. A spawn error currently escapes before diagnostics are atomically
   persisted.
4. **Network admission after first request:** only `openrouter.ai:443` is
   permitted. This is less consistent with the absence of every Codex event,
   but actual destination attempts have not yet been observed.
5. **Workload command mismatch:** `npm test` is unavailable. It must be corrected
   or replaced with an equivalent baked command before a hardened workload can
   honestly pass, but it occurs later than the observed supervisor exit.

Tracing must distinguish these hypotheses without widening egress, restoring
root execution, reinstalling packages at Attempt time, or changing the Remote
Sandbox architecture.
