# Supervisor root-cause proof

## Finding

The hardened 0/3 result was caused by a false supervisor-death observation,
not by the three workloads, OpenRouter, repository ownership, or Codex output
validation.

The exact immutable candidate image contains a deliberately reduced BusyBox
binary. Its applet list includes `nohup`, `setsid`, `sh`, and the file-transfer
utilities, but omits `kill`. In this build, `ash` does not provide a separate
working `kill` builtin; it dispatches to the missing BusyBox applet.

The provider's result-poll health check was:

```sh
kill -0 "$(cat /var/lib/mission-control/attempt/pid)"
```

The exact image returned exit 127 and `kill: applet not found` for both the
current shell and a live child PID. The provider suppresses stderr for this
probe, interpreted the nonzero result as `supervisorProcessRunning=false`, and
raised `SUPERVISOR_EXITED_BEFORE_RESULT` at the first result poll.

## Exact-process reproduction

Image:

```text
ghcr.io/jaydubya818/mission-control-remote-sandbox@sha256:ce142e3f1782d921e54203c748db590dd0f2650cc12cf801002729f07bb0f4ec
```

Observed applet set: 38 entries, with `kill` absent.

A long-running process launched with the production pattern produced:

```text
captured=8
captured-running=no
observed=8 cmd=node … setTimeout(()=>{},10000)
```

The live `/proc/8` entry proves the process represented by the captured PID was
still running while `kill -0 8` reported failure. A direct control produced:

```text
kill0-self=127 err=kill: applet not found
kill0-child=127 err=kill: applet not found
proc-child=yes
```

This exactly explains all three shared observations:

- `SANDBOX_STARTED` succeeded;
- 1.6–1.8 seconds later the host reported the supervisor absent;
- the supervisor log was empty because the real supervisor was still running
  and had not yet emitted an error or terminal result when the VM was destroyed.

## Security consequence

The same missing applet affected cancellation. `ExeDevSandboxProvider.cancel`
used `kill -TERM` and `kill -KILL`; both commands were ineffective in the exact
candidate image. The VM teardown still removed the resource, but the claimed
process-group cancellation proof was not valid for this image.

The smallest correction is to include the BusyBox `kill` applet, retain the
existing process-group signals, remove the unrelated missing `seq` dependency
from the bounded grace loop, and regression-test both health observation and
TERM/KILL behavior in the exact final image.

## Separate workload-equivalence issue

The hardened image intentionally contains no npm, yet the qualification prompts
ask Codex to run `npm test`. This did not cause the 1.6–1.8-second false terminal
classification, but it would prevent an honest hardened workload pass after the
supervisor bug is fixed. The disposable fixtures use Node's built-in test runner,
so `node --test` is the existing-toolchain equivalent and requires no package
installation or additional runtime package.
