"""
Main orchestration: resolve backend (precedence), run cases via adapters, optional parallelism.
"""

import time
from pathlib import Path
from typing import Any

from .types import RunResult, run_result_to_row, validate_run_result
from .adapters import run_cli, run_http, run_openclaw


BACKENDS = ("cli", "http", "openclaw")


def resolve_backend(
    candidate: dict,
    *,
    run_backend_override: str | None = None,
    run_backend_default: str = "cli",
) -> str:
    """
    Precedence: 1) per-candidate run_backend_override, 2) candidate execution.backend,
    3) run_backend_default, 4) fallback "cli".
    """
    if run_backend_override is not None and run_backend_override in BACKENDS:
        return run_backend_override
    exec_block = candidate.get("execution")
    if exec_block and exec_block.get("backend") in BACKENDS:
        return exec_block["backend"]
    if run_backend_default in BACKENDS:
        return run_backend_default
    return "cli"


def _run_stub(candidate: dict, case: dict) -> RunResult:
    """Legacy stub when backend=cli but execution.cli not configured."""
    max_q = case.get("max_questions", 3)
    scenario = case.get("scenario", "")
    title = (scenario[:80] + "...") if len(scenario) > 80 else scenario
    t0 = time.perf_counter()
    time.sleep(0.01)
    elapsed_ms = int((time.perf_counter() - t0) * 1000)
    escalation_md = """## Summary
Stub escalation packet for eval.

## Impact
- Who/what is impacted: unknown
- Severity recommendation: S3
- Regions/environments: unknown

## Evidence
- Links: (none)
- Timestamps: (none)
- Correlations: (none)

## Reproduction
- Status: unknown
- Steps: (none)
- Environment: (none)

## Hypotheses (labelled)
1) Stub hypothesis.

## Recommended next actions (top 3)
1) Verify repro.
2) Gather logs.
3) Escalate if needed.

## Escalation / approvals needed
- Requested action: none
- Why: stub
- Risk: low
"""
    return {
        "case_id": case.get("case_id", ""),
        "triage_report": {
            "title": title,
            "severity_recommendation": "S3",
            "suspected_component": "unknown",
            "impact": {"users_affected": "unknown", "regions": [], "workaround": ""},
            "repro": {"status": "unknown", "steps": [], "env": {}},
            "evidence": {"links": [], "timestamps": [], "notes": []},
            "facts": [],
            "hypotheses": [],
            "next_actions": [],
            "questions_for_reporter": ["[stub] Clarifying question 1"] if max_q > 0 else [],
            "policy_notes": [],
        },
        "escalation_packet_md": escalation_md,
        "customer_update_draft_md": "",
        "tool_trace": [{"tool": "kb.search", "input": "auth login", "output_ref": "kb:stub-1", "status": "ok"}],
        "timing_ms": elapsed_ms,
        "cost_usd": 0.001,
        "tokens": {"in": 500, "out": 300},
        "backend": "cli",
    }


def run_case(
    candidate: dict,
    case: dict,
    suite_dir: Path,
    *,
    backend_override: str | None = None,
    backend_default: str = "cli",
    timeout_ms: int = 120_000,
    runs_dir: Path | None = None,
) -> dict[str, Any]:
    """
    Execute one case. Returns JSONL row (grader-compatible) with backend set.
    """
    backend = resolve_backend(candidate, run_backend_override=backend_override, run_backend_default=backend_default)

    if backend == "cli":
        cli_cfg = (candidate.get("execution") or {}).get("cli")
        if not cli_cfg or not cli_cfg.get("cmd"):
            result = _run_stub(candidate, case)
        else:
            result = run_cli(candidate, case, suite_dir, timeout_ms=timeout_ms)
    elif backend == "http":
        result = run_http(candidate, case, suite_dir, timeout_ms=timeout_ms)
    elif backend == "openclaw":
        result = run_openclaw(
            candidate, case, suite_dir, runs_dir=runs_dir or suite_dir, timeout_ms=timeout_ms
        )
    else:
        result = _run_stub(candidate, case)

    return run_result_to_row(result)
