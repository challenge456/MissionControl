export function factoryWorkflowContractIssues(workflow: any): string[] {
  if (!workflow?.active || !Array.isArray(workflow.steps) || workflow.steps.length === 0) {
    return ["workflow-unavailable"];
  }
  const issues: string[] = [];
  for (const step of workflow.steps) {
    const stepId = typeof step?.id === "string" ? step.id : "unknown-step";
    if (/STATUS\s*:\s*done/i.test(String(step?.expects ?? ""))) {
      issues.push(`${stepId}:heuristic-completion`);
    }
    if (step?.kind !== "GATE") {
      const required = Array.isArray(step?.outputSchema?.required) ? step.outputSchema.required : [];
      if (step?.outputSchema?.type !== "object" || !required.includes("status") || step?.outputSchema?.properties?.status?.type !== "string") {
        issues.push(`${stepId}:structured-status-required`);
      }
    }
    if (/\bgh\s+pr\s+(?:create|merge|review)\b|approve\s+for\s+merge|merge\s+(?:the\s+)?pull\s+request/i.test(String(step?.input ?? ""))) {
      issues.push(`${stepId}:provider-authority-forbidden`);
    }
  }
  return issues;
}
