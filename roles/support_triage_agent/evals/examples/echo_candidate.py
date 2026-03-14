#!/usr/bin/env python3
"""
Minimal script that reads a case JSON and emits a valid RunResult (to stdout or --out file).
Used for self-test of the CLI adapter. Invoke as:
  python3 echo_candidate.py <case_path> [--out <out_path>]
or with env: CASE_PATH, OUT_PATH (adapter substitutes these).
"""

import argparse
import json
import os
import sys
from pathlib import Path


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("case_path", nargs="?", default=os.environ.get("CASE_PATH"), help="Path to case JSON")
    ap.add_argument("--out", default=os.environ.get("OUT_PATH"), help="Write RunResult here (else stdout)")
    args = ap.parse_args()
    if not args.case_path or not Path(args.case_path).exists():
        print("echo_candidate: case path required", file=sys.stderr)
        return 1
    case = json.loads(Path(args.case_path).read_text(encoding="utf-8"))
    case_id = case.get("case_id", "unknown")
    scenario = case.get("scenario", "")[:80]
    result = {
        "case_id": case_id,
        "triage_report": {
            "title": scenario + ("..." if len(case.get("scenario", "")) > 80 else ""),
            "severity_recommendation": "S3",
            "suspected_component": "unknown",
            "impact": {"users_affected": "unknown", "regions": [], "workaround": ""},
            "repro": {"status": "unknown", "steps": [], "env": {}},
            "evidence": {"links": [], "timestamps": [], "notes": []},
            "facts": [],
            "hypotheses": [],
            "next_actions": [],
            "questions_for_reporter": [],
            "policy_notes": [],
        },
        "escalation_packet_md": "## Summary\nEcho stub.\n\n## Impact\n- Unknown\n\n## Evidence\n- None\n\n## Reproduction\n- None\n\n## Hypotheses\n- None\n\n## Recommended next actions\n- None\n\n## Escalation / approvals needed\n- None",
        "customer_update_draft_md": "",
        "tool_trace": [],
        "timing_ms": 1,
        "cost_usd": None,
        "tokens": {"in": None, "out": None},
        "backend": "cli",
    }
    out_json = json.dumps(result, ensure_ascii=False)
    if args.out:
        Path(args.out).write_text(out_json, encoding="utf-8")
    else:
        print(out_json)
    return 0


if __name__ == "__main__":
    sys.exit(main())
