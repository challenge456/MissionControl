"""
CLI execution adapter: spawn process, substitute placeholders, enforce timeout.
Process must emit RunResult JSON to stdout OR write file at OUT_PATH.
"""

import json
import os
import subprocess
import tempfile
import time
from pathlib import Path
from typing import Any

from ..types import RunResult, validate_run_result


PLACEHOLDERS = ("CASE_PATH", "OUT_PATH", "CANDIDATE_ID", "CASE_ID")


def _substitute(s: str, subs: dict[str, str]) -> str:
    for k, v in subs.items():
        s = s.replace("${" + k + "}", str(v))
    return s


def _substitute_list(arr: list[str], subs: dict[str, str]) -> list[str]:
    return [_substitute(x, subs) for x in arr]


def _substitute_env(env: dict[str, str], subs: dict[str, str]) -> dict[str, str]:
    return {k: _substitute(v, subs) for k, v in env.items()}


def run_cli(
    candidate: dict,
    case: dict,
    suite_dir: Path,
    *,
    case_path: Path | None = None,
    out_path: Path | None = None,
    timeout_ms: int = 120_000,
) -> RunResult:
    """
    Run candidate via CLI. execution.cli must have cmd and args.
    Substitutes ${CASE_PATH}, ${OUT_PATH}, ${CANDIDATE_ID}, ${CASE_ID} in args, env, cwd.
    Process may emit RunResult to stdout or write to OUT_PATH file.
    """
    exec_cfg = (candidate.get("execution") or {}).get("cli") or {}
    cmd = exec_cfg.get("cmd")
    args_list = exec_cfg.get("args") or []
    if not cmd:
        raise ValueError("execution.cli.cmd is required for backend=cli")

    candidate_id = candidate.get("id", "candidate")
    case_id = case.get("case_id", "unknown")

    if case_path is None:
        fd, case_path = tempfile.mkstemp(suffix=".json", prefix="case_")
        os.close(fd)
        case_path = Path(case_path)
        case_path.write_text(json.dumps(case, ensure_ascii=False), encoding="utf-8")
        cleanup_case = True
    else:
        cleanup_case = False

    if out_path is None:
        fd, out_path_str = tempfile.mkstemp(suffix=".json", prefix="out_")
        os.close(fd)
        out_path = Path(out_path_str)
        cleanup_out = True
    else:
        cleanup_out = False

    subs = {
        "CASE_PATH": str(case_path.resolve()),
        "OUT_PATH": str(out_path.resolve()),
        "CANDIDATE_ID": candidate_id,
        "CASE_ID": case_id,
    }

    argv = [cmd] + _substitute_list(args_list, subs)
    cwd = exec_cfg.get("cwd")
    if cwd:
        cwd = _substitute(cwd, subs)
    env = os.environ.copy()
    env_extra = exec_cfg.get("env") or {}
    env.update(_substitute_env(env_extra, subs))

    timeout_sec = (exec_cfg.get("timeout_ms") or timeout_ms) / 1000.0
    t0 = time.perf_counter()
    try:
        proc = subprocess.run(
            argv,
            cwd=cwd or suite_dir,
            env=env,
            capture_output=True,
            text=True,
            timeout=timeout_sec,
        )
    except subprocess.TimeoutExpired as e:
        elapsed_ms = int((time.perf_counter() - t0) * 1000)
        if cleanup_case:
            try:
                case_path.unlink(missing_ok=True)
            except OSError:
                pass
        if cleanup_out:
            try:
                out_path.unlink(missing_ok=True)
            except OSError:
                pass
        raise RuntimeError(
            f"CLI adapter timeout after {timeout_sec}s: {' '.join(argv[:3])}... stderr: {(e.stderr or '')[:500]}"
        ) from e

    elapsed_ms = int((time.perf_counter() - t0) * 1000)

    raw: dict[str, Any] | None = None
    if out_path.exists():
        raw = json.loads(out_path.read_text(encoding="utf-8"))
    if raw is None and proc.stdout:
        try:
            raw = json.loads(proc.stdout)
        except json.JSONDecodeError:
            pass
    if raw is None:
        if cleanup_case:
            try:
                case_path.unlink(missing_ok=True)
            except OSError:
                pass
        if cleanup_out:
            try:
                out_path.unlink(missing_ok=True)
            except OSError:
                pass
        raise RuntimeError(
            f"CLI adapter: no RunResult (stdout or {out_path}). stderr: {(proc.stderr or '')[:500]}"
        )

    if cleanup_case:
        try:
            case_path.unlink(missing_ok=True)
        except OSError:
            pass
    if cleanup_out:
        try:
            out_path.unlink(missing_ok=True)
        except OSError:
            pass

    ok, errs = validate_run_result(raw)
    if not ok:
        raise RuntimeError(f"CLI adapter returned invalid RunResult: {errs}")

    result = dict(raw)
    result.setdefault("backend", "cli")
    result.setdefault("timing_ms", elapsed_ms)
    if result.get("cost_usd") is None and "cost_usd" not in result:
        result["cost_usd"] = None
    if result.get("tokens") is None:
        result["tokens"] = {"in": None, "out": None}
    return result
