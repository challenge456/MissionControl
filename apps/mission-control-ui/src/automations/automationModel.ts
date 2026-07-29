export const AUTOMATION_TABS = [
  "overview",
  "definitions",
  "runs",
  "schedule",
  "candidates",
  "receipts",
] as const;

export type AutomationTab = typeof AUTOMATION_TABS[number];

export function normalizeAutomationTab(value: string | null): AutomationTab {
  return AUTOMATION_TABS.includes(value as AutomationTab) ? value as AutomationTab : "overview";
}

export function formatDate(value?: number): string {
  return value ? new Date(value).toLocaleString() : "Not yet";
}

export function formatPercent(value: number): string {
  return `${Math.round(value * 100)}%`;
}

export function statusTone(status: string): string {
  if (["ACTIVE", "HEALTHY", "PASSED", "PASS", "DONE"].includes(status)) {
    return "border-emerald-500/30 text-emerald-300";
  }
  if (["PAUSED", "ATTENTION", "PENDING", "AWAITING_APPROVAL"].includes(status)) {
    return "border-amber-500/30 text-amber-200";
  }
  if (["SUSPENDED", "DEGRADED", "FAILED", "FAIL"].includes(status)) {
    return "border-red-500/30 text-red-200";
  }
  return "border-border text-muted-foreground";
}
