"""
Comparator: rank candidates from graded JSON files, compute deltas (why A beat B).
Consumes graded output from grade_eval.py --out <file>.graded.json
"""

import argparse
import json
import sys
from pathlib import Path


def load_graded(path: Path) -> dict:
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def aggregate_run_costs(run_path: Path) -> tuple[float, float]:
    """Return (total_cost_usd, p95_latency_ms) from run JSONL."""
    costs = []
    latencies = []
    with open(run_path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            row = json.loads(line)
            if "cost_usd" in row and row["cost_usd"] is not None:
                costs.append(float(row["cost_usd"]))
            if "timing_ms" in row and row["timing_ms"] is not None:
                latencies.append(int(row["timing_ms"]))
    total_cost = sum(costs)
    p95_latency = 0
    if latencies:
        latencies.sort()
        idx = int(len(latencies) * 0.95) - 1
        p95_latency = latencies[max(0, idx)]
    return total_cost, p95_latency


def compare(graded_paths: list[Path], run_dir: Path | None = None) -> dict:
    """
    graded_paths: list of paths to .graded.json files (each has summary.candidate_id or filename used as id).
    run_dir: optional dir where run JSONL lives (runs/<candidate_id>.jsonl) for cost/latency.
    """
    leaderboard = []
    for p in graded_paths:
        data = load_graded(p)
        s = data.get("summary", {})
        cid = s.get("candidate_id") or p.stem.replace(".graded", "")
        total_cost = 0.0
        p95_latency_ms = 0
        if run_dir:
            run_file = run_dir / f"{cid}.jsonl"
            if not run_file.exists():
                run_file = run_dir / p.name.replace(".graded.json", ".jsonl")
            if run_file.exists():
                total_cost, p95_latency_ms = aggregate_run_costs(run_file)
        leaderboard.append({
            "candidate_id": cid,
            "weighted_score": s.get("weighted_score", 0),
            "gate_fail": s.get("gate_fail", True),
            "pass": s.get("pass", False),
            "total_cases": s.get("total_cases", 0),
            "score_category_avg": s.get("score_category_avg", {}),
            "cost_usd": round(total_cost, 4),
            "p95_latency_ms": p95_latency_ms,
        })

    leaderboard.sort(key=lambda x: (x["gate_fail"], -x["weighted_score"]))

    # Deltas: why A beat B (category deltas between rank 1 and others)
    if len(leaderboard) >= 2:
        first = leaderboard[0]
        first_scores = first.get("score_category_avg") or {}
        for i in range(1, len(leaderboard)):
            other = leaderboard[i]
            other_scores = other.get("score_category_avg") or {}
            deltas = {}
            for k in first_scores:
                a = first_scores.get(k, 0)
                b = other_scores.get(k, 0)
                deltas[k] = round(a - b, 2)
            other["deltas_vs_rank1"] = deltas

    return {
        "leaderboard": leaderboard,
        "ranked_candidate_ids": [x["candidate_id"] for x in leaderboard],
    }


def main() -> int:
    ap = argparse.ArgumentParser(description="Compare graded candidates (CAS)")
    ap.add_argument("runs", nargs="+", type=Path, help="Graded JSON files (.graded.json)")
    ap.add_argument("--run-dir", type=Path, default=None, help="Dir with run JSONL for cost/latency")
    ap.add_argument("--out", type=Path, default=None, help="Write comparison JSON here")
    args = ap.parse_args()

    out = compare(args.runs, args.run_dir)
    print(json.dumps(out, indent=2))
    if args.out:
        args.out.parent.mkdir(parents=True, exist_ok=True)
        with open(args.out, "w", encoding="utf-8") as f:
            json.dump(out, f, indent=2)
    return 0


if __name__ == "__main__":
    sys.exit(main())
