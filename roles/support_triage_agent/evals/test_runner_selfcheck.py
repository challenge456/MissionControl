"""
Minimal self-test for runner: schema backward compat, precedence, CLI adapter with echo candidate.
Run from evals dir: python test_runner_selfcheck.py
No external deps beyond stdlib + jsonschema (already used by harness).
"""

import json
import sys
import tempfile
from pathlib import Path

EVALS_DIR = Path(__file__).resolve().parent
SCHEMA_PATH = EVALS_DIR / "schemas" / "candidate_manifest.schema.json"
BASELINE_MANIFEST = EVALS_DIR / "examples" / "baseline_candidate.json"
ECHO_MANIFEST = EVALS_DIR / "examples" / "echo_manifest.json"
ECHO_SCRIPT = EVALS_DIR / "examples" / "echo_candidate.py"
CASES_PATH = EVALS_DIR / "eval_cases.jsonl"


def load_json(path: Path) -> dict:
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def test_schema_backward_compat() -> None:
    """Manifest schema accepts old baseline_candidate.json (no execution block)."""
    try:
        import jsonschema
    except ImportError:
        print("SKIP test_schema_backward_compat (jsonschema not installed)")
        return
    schema = load_json(SCHEMA_PATH)
    baseline = load_json(BASELINE_MANIFEST)
    jsonschema.validate(instance=baseline, schema=schema)
    assert "execution" not in baseline or baseline.get("execution") is None or "backend" in baseline.get("execution", {})


def test_precedence() -> None:
    """Precedence: run override > manifest execution.backend > backend_default > cli."""
    from runner import resolve_backend

    # No execution -> backend_default
    c1 = {"id": "x"}
    assert resolve_backend(c1, run_backend_default="http") == "http"
    assert resolve_backend(c1, run_backend_default="cli") == "cli"

    # Manifest execution.backend
    c2 = {"id": "y", "execution": {"backend": "http"}}
    assert resolve_backend(c2, run_backend_default="cli") == "http"

    # Per-run override wins
    c3 = {"id": "z", "execution": {"backend": "openclaw"}}
    assert resolve_backend(c3, run_backend_override="cli", run_backend_default="http") == "cli"


def test_cli_adapter_echo() -> None:
    """CLI adapter runs echo_candidate.py and gets valid RunResult."""
    from runner import run_case

    # Use manifest that runs examples/echo_candidate.py; suite_dir = evals so cwd is evals
    manifest = load_json(ECHO_MANIFEST)
    # Resolve script path: when cwd is EVALS_DIR, "examples/echo_candidate.py" works
    cases = []
    with open(CASES_PATH, "r", encoding="utf-8") as f:
        for line in f:
            if line.strip():
                cases.append(json.loads(line))
    if not cases:
        raise RuntimeError("No cases in eval_cases.jsonl")
    case = cases[0]

    row = run_case(
        manifest,
        case,
        EVALS_DIR,
        backend_default="cli",
        timeout_ms=10000,
    )
    assert row.get("case_id") == case.get("case_id")
    assert "triage_report" in row
    assert row.get("escalation_packet") or row.get("escalation_packet_md") or row.get("triage_report")
    assert row.get("backend") == "cli"


def main() -> int:
    print("1. Schema backward compat...")
    test_schema_backward_compat()
    print("   OK")

    print("2. Precedence resolution...")
    test_precedence()
    print("   OK")

    print("3. CLI adapter (echo candidate)...")
    test_cli_adapter_echo()
    print("   OK")

    print("All self-checks passed.")
    return 0


if __name__ == "__main__":
    sys.path.insert(0, str(EVALS_DIR))
    sys.exit(main())
