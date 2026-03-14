/**
 * Output validation for tasks transitioning to REVIEW.
 * Basic format and completeness checks; QA agent or LLM checks can be added later.
 */

export interface DeliverableInput {
  summary?: string;
  content?: string;
  artifactIds?: string[];
}

export interface ReviewChecklistInput {
  type: string;
  items: Array<{ label: string; checked: boolean; note?: string }>;
}

const MIN_SUMMARY_LENGTH = 10;
const MAX_SUMMARY_LENGTH = 2000;
const MAX_CONTENT_LENGTH = 500_000;

/**
 * Returns a list of human-readable validation errors. Empty array means valid.
 */
export function validateForReview(
  deliverable: DeliverableInput | null | undefined,
  reviewChecklist: ReviewChecklistInput | null | undefined
): string[] {
  const errors: string[] = [];

  if (!deliverable) {
    errors.push("Deliverable is required for REVIEW.");
    return errors;
  }

  const summary = deliverable.summary?.trim();
  if (!summary) {
    errors.push("Deliverable summary is required.");
  } else {
    if (summary.length < MIN_SUMMARY_LENGTH) {
      errors.push(`Deliverable summary must be at least ${MIN_SUMMARY_LENGTH} characters.`);
    }
    if (summary.length > MAX_SUMMARY_LENGTH) {
      errors.push(`Deliverable summary must be at most ${MAX_SUMMARY_LENGTH} characters.`);
    }
  }

  if (deliverable.content != null && deliverable.content.length > MAX_CONTENT_LENGTH) {
    errors.push(`Deliverable content exceeds maximum length (${MAX_CONTENT_LENGTH} characters).`);
  }

  if (!reviewChecklist) {
    errors.push("Review checklist is required for REVIEW.");
  } else if (reviewChecklist.items && reviewChecklist.items.length > 0) {
    const allChecked = reviewChecklist.items.every((i) => i.checked);
    if (!allChecked) {
      const unchecked = reviewChecklist.items.filter((i) => !i.checked).map((i) => i.label);
      errors.push(`Review checklist: not all items checked (${unchecked.slice(0, 3).join(", ")}${unchecked.length > 3 ? "…" : ""}).`);
    }
  }

  return errors;
}
