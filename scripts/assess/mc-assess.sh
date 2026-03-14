#!/usr/bin/env bash
#
# mc assess — Competency Assessment System (CAS) CLI
# Usage: mc assess run | grade | compare | report [options]
#
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MC_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
EVALS_DIR="$MC_DIR/roles/support_triage_agent/evals"
SUITE_DIR="$EVALS_DIR"
CASES="$EVALS_DIR/eval_cases.jsonl"
RUBRIC="$EVALS_DIR/rubric.yaml"
SCHEMAS_DIR="$EVALS_DIR/schemas"

log_info() { echo "[mc assess] $1"; }
log_error() { echo "[mc assess] ERROR: $1" >&2; }

usage() {
    cat << EOF
mc assess — Competency Assessment System (CAS)

  mc assess run     --suite <name> --candidates <glob|list> --out <dir>
  mc assess grade   --suite <name> --run <run.jsonl> [--candidate-id <id>] --out <file>
  mc assess compare --suite <name> --runs <graded.json ...> [--run-dir <dir>] [--out <file>]
  mc assess report  --suite <name> --comparison <comparison.json> --out <dir>

Suite (default: support_triage):
  --suite support_triage   Uses $EVALS_DIR (cases, rubric, schemas)

Examples:
  mc assess run --suite support_triage --candidates examples/*.json --out runs/
  mc assess grade --suite support_triage --run runs/baseline.jsonl --candidate-id baseline --out runs/baseline.graded.json
  mc assess compare --suite support_triage --runs runs/*.graded.json --run-dir runs/ --out runs/comparison.json
  mc assess report --suite support_triage --comparison runs/comparison.json --out decision_packet/
EOF
}

cmd_run() {
    local out_dir=""
    local candidates=()
    local suite="support_triage"
    while [[ $# -gt 0 ]]; do
        case "$1" in
            --suite) suite="$2"; shift 2 ;;
            --candidates) shift; while [[ $# -gt 0 && "${1:0:1}" != "-" ]]; do candidates+=("$1"); shift; done ;;
            --out) out_dir="$2"; shift 2 ;;
            *) shift ;;
        esac
    done
    if [[ -z "$out_dir" ]]; then
        log_error "run requires --out <dir>"
        return 1
    fi
    if [[ ${#candidates[@]} -eq 0 ]]; then
        log_error "run requires --candidates <file> [file ...]"
        return 1
    fi
    mkdir -p "$out_dir"
    for c in "${candidates[@]}"; do
        cand_path="$c"
        if [[ ! -f "$cand_path" ]]; then
            [[ -f "$EVALS_DIR/$c" ]] && cand_path="$EVALS_DIR/$c"
            [[ -f "$EVALS_DIR/examples/$c" ]] && cand_path="$EVALS_DIR/examples/$c"
        fi
        if [[ ! -f "$cand_path" ]]; then
            log_error "Candidate file not found: $c"
            return 1
        fi
        base=$(basename "$cand_path" .json)
        log_info "Running candidate: $cand_path -> $out_dir/$base.jsonl"
        python3 "$EVALS_DIR/candidate_runner.py" \
            --candidate "$cand_path" \
            --cases "$CASES" \
            --suite-dir "$SUITE_DIR" \
            --out "$out_dir/$base.jsonl"
    done
    log_info "Run complete. Outputs in $out_dir/"
}

cmd_grade() {
    local run_file="" out_file="" candidate_id="" suite="support_triage"
    while [[ $# -gt 0 ]]; do
        case "$1" in
            --suite) suite="$2"; shift 2 ;;
            --run) run_file="$2"; shift 2 ;;
            --candidate-id) candidate_id="$2"; shift 2 ;;
            --out) out_file="$2"; shift 2 ;;
            *) shift ;;
        esac
    done
    if [[ -z "$run_file" ]]; then
        log_error "grade requires --run <run.jsonl>"
        return 1
    fi
    if [[ -z "$out_file" ]]; then
        out_file="${run_file%.jsonl}.graded.json"
    fi
    local extra=()
    [[ -n "$candidate_id" ]] && extra+=(--candidate-id "$candidate_id")
    log_info "Grading $run_file -> $out_file"
    python3 "$EVALS_DIR/grade_eval.py" \
        --cases "$CASES" \
        --run "$run_file" \
        --rubric "$RUBRIC" \
        --schemas-dir "$SCHEMAS_DIR" \
        --out "$out_file" \
        "${extra[@]}"
}

cmd_compare() {
    local run_dir="" out_file="" suite="support_triage"
    local runs=()
    while [[ $# -gt 0 ]]; do
        case "$1" in
            --suite) suite="$2"; shift 2 ;;
            --runs) shift; while [[ $# -gt 0 && "${1:0:1}" != "-" ]]; do runs+=("$1"); shift; done ;;
            --run-dir) run_dir="$2"; shift 2 ;;
            --out) out_file="$2"; shift 2 ;;
            *) shift ;;
        esac
    done
    if [[ ${#runs[@]} -eq 0 ]]; then
        log_error "compare requires --runs <graded.json ...>"
        return 1
    fi
    local extra=()
    [[ -n "$run_dir" ]] && extra+=(--run-dir "$run_dir")
    [[ -n "$out_file" ]] && extra+=(--out "$out_file")
    python3 "$EVALS_DIR/compare.py" "${runs[@]}" "${extra[@]}"
}

cmd_report() {
    local comparison="" out_dir="" suite="support_triage"
    local graded=()
    while [[ $# -gt 0 ]]; do
        case "$1" in
            --suite) suite="$2"; shift 2 ;;
            --comparison) comparison="$2"; shift 2 ;;
            --runs) shift; while [[ $# -gt 0 && "${1:0:1}" != "-" ]]; do graded+=("$1"); shift; done ;;
            --out) out_dir="$2"; shift 2 ;;
            *) shift ;;
        esac
    done
    if [[ -z "$out_dir" ]]; then
        log_error "report requires --out <dir>"
        return 1
    fi
    if [[ -z "$comparison" ]]; then
        log_error "report requires --comparison <comparison.json>"
        return 1
    fi
    python3 "$EVALS_DIR/decision_packet.py" \
        --comparison "$comparison" \
        --rubric "$RUBRIC" \
        --out "$out_dir"
    log_info "Decision packet written to $out_dir/"
}

case "${1:-help}" in
    run)
        shift
        cmd_run "$@"
        ;;
    grade)
        shift
        cmd_grade "$@"
        ;;
    compare)
        shift
        cmd_compare "$@"
        ;;
    report)
        shift
        cmd_report "$@"
        ;;
    help|--help|-h|"")
        usage
        ;;
    *)
        log_error "Unknown subcommand: $1"
        usage
        exit 1
        ;;
esac
