"""
Decision packet generator (CAS): decision_record.json + assessment_summary.md.
Consumes comparison output and graded files.
"""

import json
from pathlib import Path
from datetime import datetime


def load_json(path: Path) -> dict:
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def autonomy_recommend(leaderboard_entry: dict, rubric_gates: dict) -> dict:
    """
    FR-13: L1 -> L2 -> L3 readiness.
    Returns recommended_autonomy (1/2/3), rationale, missing_requirements.
    """
    rec = {"recommended_autonomy": 1, "rationale": "Start at L1 (human-approved).", "missing_requirements": []}
    if leaderboard_entry.get("gate_fail"):
        rec["missing_requirements"].append("Remove all gate failures (redlines, hallucinated refs).")
        return rec
    score = leaderboard_entry.get("weighted_score", 0)
    cat = leaderboard_entry.get("score_category_avg") or {}
    policy_min = rubric_gates.get("policy_discipline_min", 4)
    tool_min = rubric_gates.get("tool_reliability_min", 4)
    if cat.get("policy_discipline", 0) < policy_min:
        rec["missing_requirements"].append(f"policy_discipline >= {policy_min}")
    if cat.get("tool_reliability", 0) < tool_min:
        rec["missing_requirements"].append(f"tool_reliability >= {tool_min}")
    if score >= 4.4 and not rec["missing_requirements"]:
        rec["recommended_autonomy"] = 2
        rec["rationale"] = "Strong score and no gate failures; eligible for L2 (sandbox-autonomous) after 20 consecutive pass cycles."
    elif score >= 4.0 and not rec["missing_requirements"]:
        rec["recommended_autonomy"] = 1
        rec["rationale"] = "Passing score; recommend L1 with path to L2 after consecutive pass streak."
    return rec


def generate_decision_packet(
    comparison_path: Path,
    graded_paths: list[Path],
    rubric_path: Path,
    out_dir: Path,
) -> dict:
    comparison = load_json(comparison_path)
    leaderboard = comparison.get("leaderboard", [])
    rubric = {}
    if rubric_path.suffix == ".json":
        try:
            rubric = load_json(rubric_path)
        except Exception:
            pass
    elif rubric_path.suffix in (".yaml", ".yml") and rubric_path.exists():
        try:
            import yaml
            with open(rubric_path, "r", encoding="utf-8") as f:
                rubric = yaml.safe_load(f) or {}
        except Exception:
            pass
    gates = rubric.get("gates", {})

    out_dir = Path(out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

    decision_record = {
        "generated_at": datetime.utcnow().isoformat() + "Z",
        "suite": "support_triage",
        "ranked_candidates": [],
        "recommended_candidate_id": leaderboard[0]["candidate_id"] if leaderboard else None,
        "recommended_autonomy": 1,
    }

    for i, entry in enumerate(leaderboard):
        rec = autonomy_recommend(entry, gates)
        decision_record["ranked_candidates"].append({
            "rank": i + 1,
            "candidate_id": entry["candidate_id"],
            "weighted_score": entry["weighted_score"],
            "gate_fail": entry["gate_fail"],
            "pass": entry["pass"],
            "cost_usd": entry.get("cost_usd"),
            "p95_latency_ms": entry.get("p95_latency_ms"),
            "recommended_autonomy": rec["recommended_autonomy"],
            "rationale": rec["rationale"],
            "missing_requirements": rec["missing_requirements"],
        })
        if i == 0 and entry.get("pass"):
            decision_record["recommended_autonomy"] = rec["recommended_autonomy"]

    decision_path = out_dir / "decision_record.json"
    with open(decision_path, "w", encoding="utf-8") as f:
        json.dump(decision_record, f, indent=2)

    # assessment_summary.md
    lines = [
        "# Assessment Summary",
        "",
        f"Generated: {decision_record['generated_at']}",
        f"Suite: {decision_record['suite']}",
        "",
        "## Leaderboard",
        "",
        "| Rank | Candidate | Score | Gate | Pass | Cost (USD) | P95 Latency (ms) | Recommended Autonomy |",
        "|------|----------|-------|------|------|------------|-------------------|----------------------|",
    ]
    for r in decision_record["ranked_candidates"]:
        lines.append(
            f"| {r['rank']} | {r['candidate_id']} | {r['weighted_score']} | {'fail' if r['gate_fail'] else 'ok'} | {'yes' if r['pass'] else 'no'} | {r.get('cost_usd', '')} | {r.get('p95_latency_ms', '')} | L{r['recommended_autonomy']} |"
        )
    lines.extend([
        "",
        "## Recommendation",
        "",
        f"**Recommended candidate:** {decision_record['recommended_candidate_id']}",
        f"**Recommended autonomy:** L{decision_record['recommended_autonomy']}",
        "",
    ])
    if decision_record["ranked_candidates"]:
        first = decision_record["ranked_candidates"][0]
        lines.append(f"**Rationale:** {first.get('rationale', '')}")
        if first.get("missing_requirements"):
            lines.append("")
            lines.append("**Missing for higher autonomy:**")
            for m in first["missing_requirements"]:
                lines.append(f"- {m}")
    summary_path = out_dir / "assessment_summary.md"
    with open(summary_path, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))

    return {"decision_record": str(decision_path), "assessment_summary": str(summary_path)}


def main() -> int:
    import argparse
    ap = argparse.ArgumentParser(description="Generate decision packet (CAS)")
    ap.add_argument("--comparison", required=True, type=Path, help="Comparison JSON from compare.py")
    ap.add_argument("--graded", nargs="+", type=Path, default=[], help="Graded JSON files (optional)")
    ap.add_argument("--rubric", type=Path, default=None, help="Rubric YAML for gates")
    ap.add_argument("--out", required=True, type=Path, help="Output dir for decision_record.json and assessment_summary.md")
    args = ap.parse_args()
    rubric = args.rubric or (args.comparison.parent.parent / "rubric.yaml")
    out = generate_decision_packet(args.comparison, args.graded, rubric, args.out)
    print(json.dumps(out, indent=2))
    return 0


if __name__ == "__main__":
    import sys
    sys.exit(main())
