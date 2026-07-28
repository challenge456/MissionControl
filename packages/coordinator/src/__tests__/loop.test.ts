import { describe, expect, it } from "vitest";
import { CoordinatorLoop, type CoordinatorState } from "../loop";

function buildState(overrides: Partial<CoordinatorState> = {}): CoordinatorState {
  return {
    inboxTasks: [],
    allTasks: [],
    availableAgents: [
      {
        id: "agent-1",
        name: "Engineer",
        role: "SPECIALIST",
        status: "ACTIVE",
        allowedTaskTypes: ["ENGINEERING"],
        capabilities: ["code_generation"],
        budgetRemaining: 10,
        activeTaskCount: 0,
        performanceScore: 0.9,
      },
    ],
    ...overrides,
  };
}

describe("CoordinatorLoop", () => {
  it("does not delegate a parent task during the tick that decomposes it", () => {
    const task = {
      id: "task-1",
      title: "Build checkout",
      description: "Implement the checkout flow",
      type: "ENGINEERING",
      status: "INBOX",
      priority: 2,
      dependsOn: [],
      assigneeIds: [],
    };
    const actions = new CoordinatorLoop().tick(
      buildState({ inboxTasks: [task], allTasks: [task] })
    );

    expect(actions.tasksToDecompose).toHaveLength(1);
    expect(actions.delegations).toHaveLength(0);
  });

  it("does not delegate an inbox parent that already has subtasks", () => {
    const actions = new CoordinatorLoop().tick(
      buildState({
        allTasks: [
          {
            id: "task-1",
            title: "Build checkout",
            description: "Implement the checkout flow",
            type: "ENGINEERING",
            status: "INBOX",
            priority: 2,
            dependsOn: [],
            assigneeIds: [],
            hasSubtasks: true,
          },
        ],
      })
    );

    expect(actions.tasksToDecompose).toHaveLength(0);
    expect(actions.delegations).toHaveLength(0);
  });
});
