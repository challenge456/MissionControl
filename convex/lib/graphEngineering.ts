export const GRAPH_ENGINEERING_PERSONAS = [
  {
    name: "Research Scout",
    emoji: "🔎",
    role: "SPECIALIST",
    allowedTaskTypes: ["CUSTOMER_RESEARCH", "DOCS", "OPS"],
    budgetDaily: 5,
    budgetPerRun: 0.75,
  },
  {
    name: "Evidence Reviewer",
    emoji: "🛡️",
    role: "LEAD",
    allowedTaskTypes: ["CUSTOMER_RESEARCH", "DOCS", "OPS"],
    budgetDaily: 12,
    budgetPerRun: 1.5,
  },
] as const;
