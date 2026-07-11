export function splitCurrentAndHistoricalRevisions<T extends { _id: string; revisionNumber: number }>(revisions: T[], currentRevisionId?: string | null) {
  const current = revisions.find((revision) => revision._id === currentRevisionId) ?? revisions[0] ?? null;
  const historical = revisions.filter((revision) => revision._id !== current?._id);
  return { current, historical };
}

export function summarizeRevisionEffects(revision: {
  materiality: string;
  changedFields: string[];
  impactedAcceptanceCriteria?: string[];
  impactedApprovals?: string[];
  impactedVerificationReceiptIds?: string[];
}) {
  return [
    revision.materiality,
    revision.changedFields.length ? `fields:${revision.changedFields.length}` : null,
    revision.impactedAcceptanceCriteria?.length ? `criteria:${revision.impactedAcceptanceCriteria.length}` : null,
    revision.impactedApprovals?.length ? `approvals:${revision.impactedApprovals.length}` : null,
    revision.impactedVerificationReceiptIds?.length ? `receipts:${revision.impactedVerificationReceiptIds.length}` : null,
  ].filter(Boolean).join(" · ");
}
