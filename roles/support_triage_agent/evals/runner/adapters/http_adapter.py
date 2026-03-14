"""
HTTP execution adapter: POST candidate + case to URL; response must be RunResult.
"""

import json
import time
import urllib.request
from pathlib import Path
from typing import Any

from ..types import RunResult, validate_run_result


def run_http(
    candidate: dict,
    case: dict,
    suite_dir: Path,
    *,
    timeout_ms: int = 120_000,
) -> RunResult:
    """
    POST body: { "candidate": <manifest>, "case": <case> }.
    Response JSON must be RunResult. Retries configurable via execution.http.retries.
    """
    exec_cfg = (candidate.get("execution") or {}).get("http") or {}
    url = exec_cfg.get("url")
    if not url:
        raise ValueError("execution.http.url is required for backend=http")

    headers = dict(exec_cfg.get("headers") or {})
    if "Content-Type" not in headers:
        headers["Content-Type"] = "application/json"
    timeout_sec = (exec_cfg.get("timeout_ms") or timeout_ms) / 1000.0
    retries = exec_cfg.get("retries", 0)

    body = json.dumps({"candidate": candidate, "case": case}, ensure_ascii=False).encode("utf-8")
    req = urllib.request.Request(url, data=body, headers=headers, method="POST")

    last_err: Exception | None = None
    for attempt in range(retries + 1):
        try:
            t0 = time.perf_counter()
            with urllib.request.urlopen(req, timeout=timeout_sec) as resp:
                raw = json.loads(resp.read().decode("utf-8"))
            elapsed_ms = int((time.perf_counter() - t0) * 1000)
            break
        except Exception as e:
            last_err = e
            if attempt == retries:
                raise RuntimeError(
                    f"HTTP adapter failed after {retries + 1} attempt(s): {e}"
                ) from e
            continue
    else:
        raise RuntimeError(f"HTTP adapter failed: {last_err}") from last_err

    ok, errs = validate_run_result(raw)
    if not ok:
        raise RuntimeError(f"HTTP adapter returned invalid RunResult: {errs}")

    result = dict(raw)
    result.setdefault("backend", "http")
    result.setdefault("timing_ms", elapsed_ms)
    if result.get("cost_usd") is None and "cost_usd" not in result:
        result["cost_usd"] = None
    if result.get("tokens") is None:
        result["tokens"] = {"in": None, "out": None}
    return result
