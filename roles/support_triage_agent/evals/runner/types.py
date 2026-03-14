"""
Types for Competency Assessment runner.
RunResult format is identical regardless of backend.
"""

from typing import Any, TypedDict


class EvalCase(TypedDict, total=False):
    """One row from eval_cases.jsonl."""
    case_id: str
    type: str
    scenario: str
    max_questions: int
    allowed_evidence_patterns: list[str]


class RunResult(TypedDict, total=False):
    """
    Standard run output per case. Emitted by every backend.
    If a backend cannot provide cost/tokens/tool_trace, set null/[].
    """
    case_id: str
    triage_report: dict[str, Any]
    escalation_packet_md: str
    customer_update_draft_md: str
    tool_trace: list[dict[str, Any]]
    timing_ms: int
    cost_usd: float | None
    tokens: dict[str, int | None]  # {"in": null, "out": null}
    backend: str  # "cli" | "http" | "openclaw"

# Alias for grader compatibility: grader expects "escalation_packet" and "questions_for_reporter"
# Runner emits RunResult; when writing JSONL we add escalation_packet = escalation_packet_md
# and questions_for_reporter from triage_report.questions_for_reporter


def run_result_to_row(result: RunResult) -> dict[str, Any]:
    """Convert RunResult to JSONL row shape expected by grade_eval.py."""
    row: dict[str, Any] = {
        "case_id": result.get("case_id", ""),
        "triage_report": result.get("triage_report") or {},
        "escalation_packet": result.get("escalation_packet_md") or "",
        "questions_for_reporter": (result.get("triage_report") or {}).get("questions_for_reporter", []),
        "tool_trace": result.get("tool_trace") or [],
        "timing_ms": result.get("timing_ms", 0),
        "cost_usd": result.get("cost_usd"),
        "tokens": result.get("tokens") or {"in": None, "out": None},
    }
    if result.get("backend") is not None:
        row["backend"] = result["backend"]
    return row


# Required keys for valid RunResult (validation)
RUN_RESULT_REQUIRED = {"case_id", "triage_report", "escalation_packet_md", "backend"}
RUN_RESULT_OPTIONAL = {"customer_update_draft_md", "tool_trace", "timing_ms", "cost_usd", "tokens"}


def validate_run_result(data: dict[str, Any]) -> tuple[bool, list[str]]:
    """Return (ok, list of error messages)."""
    errs: list[str] = []
    for k in RUN_RESULT_REQUIRED:
        if k not in data:
            errs.append(f"missing required key: {k}")
    if data.get("backend") not in ("cli", "http", "openclaw"):
        errs.append("backend must be one of: cli, http, openclaw")
    tr = data.get("triage_report")
    if tr is not None and not isinstance(tr, dict):
        errs.append("triage_report must be an object")
    if data.get("escalation_packet_md") is not None and not isinstance(data.get("escalation_packet_md"), str):
        errs.append("escalation_packet_md must be a string")
    return len(errs) == 0, errs
