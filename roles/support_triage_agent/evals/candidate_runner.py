#!/usr/bin/env python3
"""
Thin CLI for Competency Assessment runner.
Supports: --config run_config.yaml (multi-candidate) or --candidate / --cases / --out (single).
"""

import argparse
import json
import sys
from pathlib import Path

# Ensure evals dir is on path so "runner" package is found when run from any cwd (e.g. mc assess)
_evals = Path(__file__).resolve().parent
if str(_evals) not in sys.path:
    sys.path.insert(0, str(_evals))

from runner import run_case
from runner.run_config import load_run_config


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


def main() -> int:
    ap = argparse.ArgumentParser(
        description="Run Support Triage Agent eval (single candidate or run_config)"
    )
    ap.add_argument("--config", type=Path, default=None, help="Run config YAML/JSON (multi-candidate)")
    ap.add_argument("--candidate", type=Path, default=None, help="Candidate manifest (single-run)")
    ap.add_argument("--cases", type=Path, default=None, help="eval_cases.jsonl (single-run)")
    ap.add_argument("--out", type=Path, default=None, help="Output run JSONL path (single) or dir (with --config)")
    ap.add_argument("--suite-dir", type=Path, default=None, help="Suite root (default: cases dir or config suite_paths)")
    ap.add_argument("--backend-default", type=str, default="cli", choices=["cli", "http", "openclaw"], help="Default backend when not in manifest")
    ap.add_argument("--timeout-ms", type=int, default=120_000, help="Per-case timeout ms")
    args = ap.parse_args()

    if args.config:
        return _run_config(args)
    if args.candidate and args.cases and args.out:
        return _run_single(args)
    ap.error("Use either --config <path> or (--candidate + --cases + --out)")


def _run_config(args: argparse.Namespace) -> int:
    config = load_run_config(args.config)
    config_dir = args.config.resolve().parent
    suite_paths = config.get("suite_paths", ["."])
    suite_dir = (config_dir / suite_paths[0]).resolve() if suite_paths else config_dir
    if args.suite_dir:
        suite_dir = args.suite_dir.resolve()
    cases_path = suite_dir / "eval_cases.jsonl"
    if not cases_path.exists():
        cases_path = Path(__file__).resolve().parent / "eval_cases.jsonl"
    cases = load_cases(cases_path)
    out_dir = args.out or Path("runs")
    out_dir = out_dir.resolve()
    out_dir.mkdir(parents=True, exist_ok=True)
    backend_default = config.get("backend_default", args.backend_default) or "cli"
    timeout_ms = config.get("timeout_ms", args.timeout_ms)
    concurrency = config.get("concurrency", 1)

    candidates_cfg = config.get("candidates", [])
    if not candidates_cfg:
        print("No candidates in run_config", file=sys.stderr)
        return 1

    for item in candidates_cfg:
        path = Path(item.get("path", ""))
        if not path.is_absolute():
            path = (config_dir / path).resolve()
        if not path.exists():
            print(f"Skip missing candidate: {path}", file=sys.stderr)
            continue
        candidate = load_candidate(path)
        candidate_id = candidate.get("id", path.stem)
        backend_override = item.get("backend_override")
        rows = []
        for case in cases:
            row = run_case(
                candidate,
                case,
                suite_dir,
                backend_override=backend_override,
                backend_default=backend_default,
                timeout_ms=timeout_ms,
                runs_dir=out_dir,
            )
            rows.append(row)
        out_file = out_dir / f"{candidate_id}.jsonl"
        with open(out_file, "w", encoding="utf-8") as f:
            for row in rows:
                f.write(json.dumps(row, ensure_ascii=False) + "\n")
        print(f"Wrote {len(rows)} rows to {out_file}", file=sys.stderr)

    return 0


def _run_single(args: argparse.Namespace) -> int:
    candidate = load_candidate(args.candidate)
    cases = load_cases(args.cases)
    suite_dir = args.suite_dir or args.cases.resolve().parent

    args.out.parent.mkdir(parents=True, exist_ok=True)
    rows = []
    for case in cases:
        row = run_case(
            candidate,
            case,
            suite_dir,
            backend_default=args.backend_default,
            timeout_ms=args.timeout_ms,
            runs_dir=args.out.parent,
        )
        rows.append(row)
    with open(args.out, "w", encoding="utf-8") as f:
        for row in rows:
            f.write(json.dumps(row, ensure_ascii=False) + "\n")
    print(f"Wrote {len(rows)} run rows to {args.out}", file=sys.stderr)
    return 0


if __name__ == "__main__":
    sys.exit(main())
