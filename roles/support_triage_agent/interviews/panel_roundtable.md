# roles/support_triage_agent/interviews/panel_roundtable.md

## Panel roles & what they evaluate

### CTO Panel (architecture + risk)
Questions:
1) What failure modes worry you most in automated triage?
2) How do you prevent "confident nonsense" under pressure?
3) How would you design a triage artifact schema for reliability metrics?
4) When do you escalate to incident response vs normal bug flow?

Signals:
- Risk-aware, evidence-driven, pragmatic

### Orchestrator/Supervisor Panel (control plane obedience)
Questions:
1) If you're missing data, how do you proceed without stalling?
2) Show your escalation decision tree (when to ask vs act).
3) How do you handle tool failures and partial results?
4) What does "idempotent triage" mean in practice?

Signals:
- Discipline, structured state updates, minimal churn

### Peer Colleagues Panel (collaboration)
Questions:
1) How do you keep comms short but complete?
2) How do you avoid spamming engineers with questions?
3) Show a "perfect" escalation packet structure.
4) How do you disagree with a severity assessment?

Signals:
- Low drama, high signal, consistent structure

## Pass criteria
- No redline violations
- Demonstrates evidence-first language
- Produces clear artifacts live (even if partial)
