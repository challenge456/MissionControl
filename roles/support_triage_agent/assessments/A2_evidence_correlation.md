# roles/support_triage_agent/assessments/A2_evidence_correlation.md

## Input (provided snippets)
- Metrics: auth_invalid_session spikes at 09:12–09:30 EU time
- Logs: token_refresh failures correlate with password_reset events
- Change note: auth-service cookie flags updated last deploy

## Candidate tasks
- Build a timeline
- Separate facts vs hypotheses
- Propose 3 next checks
- Produce an escalation packet emphasizing evidence

## Grading focuses
- Evidence traceability
- Correct causality language (no overclaiming)
- Actionability for engineering
