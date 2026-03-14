"""
Legacy runner adapter (deprecated). Prefer the runner package and execution backends:
  from runner import run_case
See README for execution.backend (cli, http, openclaw) and run_config.yaml.
"""

import json
import time
from pathlib import Path
from typing import Any


def run_case(candidate: dict, case: dict, suite_dir: Path | None = None) -> dict:
    """
    Execute one case for one candidate. Returns a run output row.

    Output shape:
      case_id, triage_report, escalation_packet, questions_for_reporter,
      tool_trace[], timing_ms, cost_usd, tokens { in, out }
    """
    adapter_type = _adapter_type(candidate)
    if adapter_type == "stub":
        return _run_stub(candidate, case)
    if adapter_type == "openai":
        return _run_openai_placeholder(candidate, case)
    if adapter_type == "anthropic":
        return _run_anthropic_placeholder(candidate, case)
    return _run_stub(candidate, case)


def _adapter_type(candidate: dict) -> str:
    adapter = candidate.get("adapter") or candidate.get("runner") or {}
    return adapter.get("type", "stub")


def _run_stub(candidate: dict, case: dict) -> dict:
    max_q = case.get("max_questions", 3)
    scenario = case.get("scenario", "")
    title = (scenario[:80] + "...") if len(scenario) > 80 else scenario
    t0 = time.perf_counter()
    # Simulate minimal work
    time.sleep(0.01)
    elapsed_ms = int((time.perf_counter() - t0) * 1000)
    return {
        "case_id": case["case_id"],
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
        "escalation_packet": _stub_escalation_packet(),
        "questions_for_reporter": ["[stub] Clarifying question 1"] if max_q > 0 else [],
        "tool_trace": [
            {"tool": "kb.search", "input": "auth login", "output_ref": "kb:stub-1", "status": "ok"}
        ],
        "timing_ms": elapsed_ms,
        "cost_usd": 0.001,
        "tokens": {"in": 500, "out": 300},
    }


def _stub_escalation_packet() -> str:
    return """## Summary
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


def _run_openai_placeholder(candidate: dict, case: dict) -> dict:
    """Placeholder: wire to OpenAI API when ready. Falls back to stub."""
    return _run_stub(candidate, case)


def _run_anthropic_placeholder(candidate: dict, case: dict) -> dict:
    """Placeholder: wire to Anthropic API when ready. Falls back to stub."""
    return _run_stub(candidate, case)


def load_candidate(path: Path) -> dict:
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def load_cases(path: Path) -> list[dict]:
    out = []
    with open(path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line:
                out.append(json.loads(line))
    return out
