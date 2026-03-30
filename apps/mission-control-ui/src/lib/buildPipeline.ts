export type BuildPipelineStageId =
  | "actors"
  | "prd"
  | "architecture"
  | "prototype"
  | "backend"
  | "launch";

export type BuildPipelineStageStatus = "todo" | "active" | "done";

export interface BuildPipelineStage {
  id: BuildPipelineStageId;
  label: string;
  eyebrow: string;
  description: string;
  artifact: string;
  view?: string;
  status: BuildPipelineStageStatus;
}

interface BuildPipelineInputs {
  hasMission: boolean;
  taskCount: number;
  activeAgents: number;
  gatewayConfigured: boolean | null;
  approvalsCount: number;
}

function getStageStatus(
  stageId: BuildPipelineStageId,
  inputs: BuildPipelineInputs
): BuildPipelineStageStatus {
  const { hasMission, taskCount, activeAgents, gatewayConfigured, approvalsCount } = inputs;

  switch (stageId) {
    case "actors":
      return hasMission ? "done" : "active";
    case "prd":
      if (taskCount > 0) return "done";
      return hasMission ? "active" : "todo";
    case "architecture":
      if (taskCount >= 3) return "done";
      if (taskCount > 0) return "active";
      return "todo";
    case "prototype":
      if (activeAgents > 0) return "done";
      if (taskCount > 0) return "active";
      return "todo";
    case "backend":
      if (gatewayConfigured) return "done";
      if (activeAgents > 0 || taskCount > 0) return "active";
      return "todo";
    case "launch":
      if (gatewayConfigured && approvalsCount === 0 && activeAgents > 0) return "done";
      if (gatewayConfigured && approvalsCount > 0) return "active";
      return "todo";
    default:
      return "todo";
  }
}

export function getBuildPipelineStages(inputs: BuildPipelineInputs): BuildPipelineStage[] {
  const baseStages: Omit<BuildPipelineStage, "status">[] = [
    {
      id: "actors",
      label: "Actors",
      eyebrow: "Who uses this",
      description: "Define the people, goals, first screen, and hard constraints before naming features.",
      artifact: "Actor brief",
      view: "home",
    },
    {
      id: "prd",
      label: "PRD",
      eyebrow: "What matters",
      description: "Capture the problem, scope, and non-negotiables in a concise markdown brief.",
      artifact: "PRD.md",
      view: "docs",
    },
    {
      id: "architecture",
      label: "Architecture",
      eyebrow: "How it breaks down",
      description: "Translate the PRD into pages, modals, and user flows before implementation expands.",
      artifact: "architecture.md",
      view: "docs",
    },
    {
      id: "prototype",
      label: "Prototype",
      eyebrow: "What the user sees",
      description: "Build the frontend with mock data first so approval happens before backend cost appears.",
      artifact: "Prototype review",
      view: "projects",
    },
    {
      id: "backend",
      label: "Backend",
      eyebrow: "What it needs",
      description: "Generate the API, schema, and integrations from the frontend and docs once the prototype is approved.",
      artifact: "API spec + schema",
      view: "pipeline",
    },
    {
      id: "launch",
      label: "Launch",
      eyebrow: "What is left",
      description: "Finish auth, billing, notifications, approvals, and readiness checks before opening the door to users.",
      artifact: "Launch checklist",
      view: "feedback",
    },
  ];

  return baseStages.map((stage) => ({
    ...stage,
    status: getStageStatus(stage.id, inputs),
  }));
}

export function getCurrentBuildStage(stages: BuildPipelineStage[]): BuildPipelineStage {
  return (
    stages.find((stage) => stage.status === "active") ??
    stages.find((stage) => stage.status === "todo") ??
    stages[stages.length - 1]
  );
}
