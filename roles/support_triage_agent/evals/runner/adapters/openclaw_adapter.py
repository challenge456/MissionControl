"""
OpenClaw execution adapter: PTY-supervised worker, workdir per case, case.json in, run_result.json out.
Convention-based; adjust openclaw CLI flags in entrypoint/args as needed.
"""

import json
import os
import subprocess
import time
from pathlib import Path
from typing import Any

from ..types import RunResult, validate_run_result

try:
    import pty
    HAS_PTY = True
except ImportError:
    HAS_PTY = False


def run_openclaw(
    candidate: dict,
    case: dict,
    suite_dir: Path,
    *,
    runs_dir: Path | None = None,
    timeout_ms: int = 120_000,
) -> RunResult:
    """
    Create workdir from workdir_template (e.g. runs/workdir/${CANDIDATE_ID}/${CASE_ID}).
    Write case.json into workdir. Invoke openclaw entrypoint; expect run_result.json in workdir.
    Use PTY if execution.openclaw.pty is true and pty module available.
    """
    exec_cfg = (candidate.get("execution") or {}).get("openclaw") or {}
    entrypoint = exec_cfg.get("entrypoint", "openclaw")
    agent_path = exec_cfg.get("agent_path", "")
    workdir_template = exec_cfg.get("workdir_template", "runs/workdir/${CANDIDATE_ID}/${CASE_ID}")
    use_pty = exec_cfg.get("pty", True)
    timeout_sec = (exec_cfg.get("timeout_ms") or timeout_ms) / 1000.0

    candidate_id = candidate.get("id", "candidate")
    case_id = case.get("case_id", "unknown")

    subs = {
        "CANDIDATE_ID": candidate_id,
        "CASE_ID": case_id,
    }
    workdir_rel = workdir_template
    for k, v in subs.items():
        workdir_rel = workdir_rel.replace("${" + k + "}", str(v))
    workdir = (runs_dir or suite_dir).resolve() / workdir_rel
    workdir.mkdir(parents=True, exist_ok=True)

    case_path = workdir / "case.json"
    case_path.write_text(json.dumps(case, ensure_ascii=False), encoding="utf-8")
    result_path = workdir / "run_result.json"

    # Convention: entrypoint runs in workdir; reads CASE_PATH, writes RunResult to OUT_PATH.
    # Adjust argv for your openclaw CLI (e.g. add --agent, --session); see README.
    argv = [entrypoint]
    if agent_path:
        argv.extend(["--agent", agent_path])

    env = os.environ.copy()
    env["CASE_PATH"] = str(case_path)
    env["OUT_PATH"] = str(result_path)
    env["CANDIDATE_ID"] = candidate_id
    env["CASE_ID"] = case_id

    t0 = time.perf_counter()
    try:
        if use_pty and HAS_PTY:
            # Best-effort PTY: run in pty; result read from file after child exits
            pid, master_fd = pty.fork()
            if pid == 0:
                os.chdir(workdir)
                os.execvpe(entrypoint, argv, env)
            try:
                os.waitpid(pid, 0)
            finally:
                try:
                    os.close(master_fd)
                except OSError:
                    pass
        else:
            subprocess.run(
                argv,
                cwd=str(workdir),
                env=env,
                capture_output=True,
                timeout=timeout_sec,
                check=False,
            )
    except subprocess.TimeoutExpired as e:
        raise RuntimeError(
            f"OpenClaw adapter timeout after {timeout_sec}s: {' '.join(argv[:4])}..."
        ) from e
    except FileNotFoundError as e:
        raise RuntimeError(
            f"OpenClaw adapter: entrypoint not found: {entrypoint}. Install or set execution.openclaw.entrypoint."
        ) from e

    elapsed_ms = int((time.perf_counter() - t0) * 1000)

    if not result_path.exists():
        raise RuntimeError(
            f"OpenClaw adapter: run_result.json not found in {workdir}. "
            "Ensure entrypoint writes RunResult to --output path (convention)."
        )

    raw = json.loads(result_path.read_text(encoding="utf-8"))
    ok, errs = validate_run_result(raw)
    if not ok:
        raise RuntimeError(f"OpenClaw adapter returned invalid RunResult: {errs}")

    result = dict(raw)
    result.setdefault("backend", "openclaw")
    result.setdefault("timing_ms", elapsed_ms)
    if result.get("cost_usd") is None and "cost_usd" not in result:
        result["cost_usd"] = None
    if result.get("tokens") is None:
        result["tokens"] = {"in": None, "out": None}
    return result
