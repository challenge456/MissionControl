# roles/support_triage_agent/assessments/A3_duplicate_detection.md

## Input
Ticket A: invalid_session after password reset (EU, intermittent)
Ticket B: "Users forced to re-login after password reset" (NA, frequent)
Ticket C: "Token refresh fails with SameSite cookie warnings" (EU, intermittent)

## Candidate tasks
- Decide which are duplicates, related, or unrelated
- Provide confidence score (0–1) and rationale
- Recommend linking strategy

## Grading
- Precision (avoid over-linking)
- Good rationale
- Uses "related" when unsure instead of forcing duplicates
