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

export interface OutputContractInput {
  expects?: string;
  requiredFields?: string[];
}

const MIN_SUMMARY_LENGTH = 10;
const MAX_SUMMARY_LENGTH = 2000;
const MAX_CONTENT_LENGTH = 500_000;

export function outputContractFromMetadata(
  metadata: unknown
): OutputContractInput | undefined {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return undefined;
  }

  const candidate = (metadata as Record<string, unknown>).outputContract;
  if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) {
    return undefined;
  }

  const raw = candidate as Record<string, unknown>;
  const requiredFields = Array.isArray(raw.requiredFields)
    ? raw.requiredFields.filter(
        (field): field is string => typeof field === "string" && field.trim().length > 0
      )
    : [];
  const expects =
    typeof raw.expects === "string" && raw.expects.trim().length > 0
      ? raw.expects.trim()
      : undefined;

  if (requiredFields.length === 0 && !expects) {
    return undefined;
  }

  return {
    expects,
    requiredFields: [...new Set(requiredFields)],
  };
}

export function validateOutputContract(
  content: string | undefined,
  contract: OutputContractInput | null | undefined
): string[] {
  const requiredFields = contract?.requiredFields ?? [];
  if (requiredFields.length === 0) {
    return [];
  }

  if (!content?.trim()) {
    return [
      `Deliverable evidence must be JSON with required fields: ${requiredFields.join(", ")}.`,
    ];
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    return [
      `Deliverable evidence must be valid JSON with required fields: ${requiredFields.join(", ")}.`,
    ];
  }

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return ["Deliverable evidence must be a JSON object."];
  }

  const record = parsed as Record<string, unknown>;
  const missing = requiredFields.filter(
    (field) => !Object.prototype.hasOwnProperty.call(record, field)
  );
  return missing.length > 0
    ? [`Deliverable evidence is missing required fields: ${missing.join(", ")}.`]
    : [];
}

/**
 * Returns a list of human-readable validation errors. Empty array means valid.
 */
export function validateForReview(
  deliverable: DeliverableInput | null | undefined,
  reviewChecklist: ReviewChecklistInput | null | undefined,
  outputContract?: OutputContractInput | null
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
  errors.push(...validateOutputContract(deliverable.content, outputContract));

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
