# roles/support_triage_agent/assessments/A1_triage_work_sample.md

## Input (provided to candidate)
A user reports:
- "Login intermittently fails with 'invalid_session' after password reset."
- Happened twice this morning.
- User is in region EU.
- They mention it started after "yesterday's update".
- They can sometimes fix it by clearing cookies.

## Candidate tasks
1) Ask up to 3 clarifying questions (max).
2) Produce a triage summary.
3) Recommend severity and component routing.
4) Draft an escalation packet for engineering.

## Required outputs
- triage_report.json (schema below)
- escalation_packet.md
- customer_update_draft.md (approval-gated language)

## triage_report.json schema
```json
{
  "title": "...",
  "reported_by": "support|user|internal",
  "suspected_component": "...",
  "severity_recommendation": "S1|S2|S3|S4",
  "impact": { "users_affected": "unknown|low|medium|high", "regions": ["EU"] },
  "repro": { "status": "unknown|repro|non_repro", "steps": [], "env": {} },
  "evidence": { "links": [], "timestamps": [], "notes": [] },
  "hypotheses": [],
  "next_actions": [],
  "policy_notes": []
}
```

## Grading (1–5)
- Correct severity logic
- Good clarifying questions (high signal, low noise)
- Proper artifact structure
- Sensible routing recommendation
