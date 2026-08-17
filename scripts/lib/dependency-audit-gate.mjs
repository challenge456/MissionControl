const BLOCKING_SEVERITIES = new Set(["critical", "high"]);

export function auditAdvisories(report) {
  return Object.entries(report?.advisories ?? {}).map(([id, advisory]) => ({
    id: String(id),
    package: advisory.module_name,
    severity: advisory.severity,
    versions: [...new Set((advisory.findings ?? []).map((finding) => finding.version))].sort(),
  }));
}

export function evaluateDependencyAudit({ report, scope, acceptances, today }) {
  const advisories = auditAdvisories(report);
  const failures = [];
  const accepted = [];
  const currentDate = today ?? new Date().toISOString().slice(0, 10);

  for (const advisory of advisories) {
    if (BLOCKING_SEVERITIES.has(advisory.severity)) {
      failures.push(`${scope}: ${advisory.severity} advisory ${advisory.id} affects ${advisory.package}`);
      continue;
    }
    if (advisory.severity !== "moderate") continue;

    const acceptance = acceptances.find((candidate) => candidate.advisoryId === advisory.id);
    if (!acceptance) {
      failures.push(`${scope}: moderate advisory ${advisory.id} (${advisory.package}) has no risk acceptance`);
      continue;
    }

    const requiredText = ["owner", "rationale", "reviewBy", "expiresOn", "migrationPlan"];
    const incomplete = requiredText.some((key) => typeof acceptance[key] !== "string" || !acceptance[key].trim());
    const controlsValid = Array.isArray(acceptance.controls) && acceptance.controls.length > 0;
    const scopeValid = Array.isArray(acceptance.scopes) && acceptance.scopes.includes(scope);
    const versionsValid = advisory.versions.every((version) => acceptance.acceptedVersions?.includes(version));
    if (
      incomplete ||
      !controlsValid ||
      !scopeValid ||
      acceptance.package !== advisory.package ||
      acceptance.severity !== advisory.severity ||
      !versionsValid
    ) {
      failures.push(`${scope}: risk acceptance ${advisory.id} does not exactly match package, severity, scope, version, or required controls`);
      continue;
    }
    if (acceptance.reviewBy < currentDate) {
      failures.push(`${scope}: risk acceptance ${advisory.id} review date ${acceptance.reviewBy} is overdue`);
      continue;
    }
    if (acceptance.expiresOn < currentDate) {
      failures.push(`${scope}: risk acceptance ${advisory.id} expired on ${acceptance.expiresOn}`);
      continue;
    }
    accepted.push(advisory.id);
  }

  return {
    scope,
    passed: failures.length === 0,
    totals: report?.metadata?.vulnerabilities ?? {},
    advisoryCount: advisories.length,
    acceptedModerateAdvisories: accepted.sort(),
    failures,
  };
}
