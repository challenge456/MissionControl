export type WorkflowTopology = "LINEAR" | "DAG";
export type WorkflowNodeKind = "AGENT" | "REDUCE" | "ROUTER" | "VERIFY" | "GATE";
export type WorkflowFailurePolicy = "RETRY" | "CONTINUE" | "BLOCK";
export type WorkflowNodeStatus =
  | "PENDING"
  | "RUNNING"
  | "DONE"
  | "FAILED"
  | "SKIPPED"
  | "BLOCKED";

export interface WorkflowCondition {
  path: string;
  operator: "EQ" | "NEQ" | "IN" | "EXISTS";
  value?: unknown;
}

export interface GraphStepDefinition {
  id: string;
  dependsOn?: string[];
  failurePolicy?: WorkflowFailurePolicy;
  condition?: WorkflowCondition;
}

export interface GraphStepState {
  stepId: string;
  status: WorkflowNodeStatus;
}

export interface CompiledGraphStep<T extends GraphStepDefinition = GraphStepDefinition> {
  index: number;
  definition: T;
  dependsOn: string[];
}

export interface CompiledWorkflowGraph<T extends GraphStepDefinition = GraphStepDefinition> {
  topology: WorkflowTopology;
  nodes: Array<CompiledGraphStep<T>>;
  layers: string[][];
  maxConcurrency: number;
}

export interface GraphValidationError {
  field: string;
  message: string;
}

export interface JsonContract {
  type?: "object" | "array" | "string" | "number" | "boolean";
  required?: string[];
  properties?: Record<string, JsonContract>;
  items?: JsonContract;
}

function resolvedDependencies(
  steps: GraphStepDefinition[],
  topology: WorkflowTopology
): string[][] {
  return steps.map((step, index) => {
    if (step.dependsOn !== undefined) return [...new Set(step.dependsOn)];
    return topology === "LINEAR" && index > 0 ? [steps[index - 1].id] : [];
  });
}

export function validateGraphDefinition(
  steps: GraphStepDefinition[],
  topology: WorkflowTopology = "LINEAR"
): GraphValidationError[] {
  const errors: GraphValidationError[] = [];
  const ids = new Set<string>();

  steps.forEach((step, index) => {
    if (ids.has(step.id)) {
      errors.push({
        field: `steps[${index}].id`,
        message: `Duplicate step id "${step.id}"`,
      });
    }
    ids.add(step.id);
  });

  const dependencies = resolvedDependencies(steps, topology);
  dependencies.forEach((stepDependencies, index) => {
    for (const dependency of stepDependencies) {
      if (dependency === steps[index].id) {
        errors.push({
          field: `steps[${index}].dependsOn`,
          message: `Step "${steps[index].id}" cannot depend on itself`,
        });
      } else if (!ids.has(dependency)) {
        errors.push({
          field: `steps[${index}].dependsOn`,
          message: `Unknown dependency "${dependency}"`,
        });
      }
    }
  });

  if (errors.length > 0) return errors;

  const indegree = new Map(steps.map((step, index) => [step.id, dependencies[index].length]));
  const dependents = new Map(steps.map((step) => [step.id, [] as string[]]));
  steps.forEach((step, index) => {
    for (const dependency of dependencies[index]) {
      dependents.get(dependency)?.push(step.id);
    }
  });
  const queue = steps.filter((step) => indegree.get(step.id) === 0).map((step) => step.id);
  let visited = 0;
  while (queue.length > 0) {
    const current = queue.shift()!;
    visited += 1;
    for (const dependent of dependents.get(current) ?? []) {
      const nextDegree = (indegree.get(dependent) ?? 0) - 1;
      indegree.set(dependent, nextDegree);
      if (nextDegree === 0) queue.push(dependent);
    }
  }
  if (visited !== steps.length) {
    errors.push({
      field: "steps",
      message: "Workflow graph contains a cycle",
    });
  }

  return errors;
}

export function compileWorkflowGraph<T extends GraphStepDefinition>(
  steps: T[],
  options: { topology?: WorkflowTopology; maxConcurrency?: number } = {}
): CompiledWorkflowGraph<T> {
  const topology = options.topology ?? "LINEAR";
  const errors = validateGraphDefinition(steps, topology);
  if (errors.length > 0) {
    throw new Error(errors.map((error) => `${error.field}: ${error.message}`).join("\n"));
  }

  const dependencies = resolvedDependencies(steps, topology);
  const nodes = steps.map((definition, index) => ({
    index,
    definition,
    dependsOn: dependencies[index],
  }));
  const remaining = new Set(steps.map((step) => step.id));
  const resolved = new Set<string>();
  const layers: string[][] = [];

  while (remaining.size > 0) {
    const layer = nodes
      .filter((node) => remaining.has(node.definition.id))
      .filter((node) => node.dependsOn.every((dependency) => resolved.has(dependency)))
      .map((node) => node.definition.id);
    if (layer.length === 0) {
      throw new Error("Workflow graph contains an unresolved cycle");
    }
    layers.push(layer);
    layer.forEach((id) => {
      remaining.delete(id);
      resolved.add(id);
    });
  }

  return {
    topology,
    nodes,
    layers,
    maxConcurrency: Math.max(1, Math.floor(options.maxConcurrency ?? 1)),
  };
}

function dependencySatisfied(
  dependencyId: string,
  stateById: Map<string, GraphStepState>,
  definitionById: Map<string, GraphStepDefinition>
): boolean {
  const dependencyState = stateById.get(dependencyId);
  if (!dependencyState) return false;
  if (dependencyState.status === "DONE" || dependencyState.status === "SKIPPED") return true;
  return (
    dependencyState.status === "FAILED" &&
    definitionById.get(dependencyId)?.failurePolicy === "CONTINUE"
  );
}

export function getRunnableNodeIndexes<T extends GraphStepDefinition>(
  graph: CompiledWorkflowGraph<T>,
  states: GraphStepState[]
): number[] {
  const runningCount = states.filter((state) => state.status === "RUNNING").length;
  const availableSlots = Math.max(graph.maxConcurrency - runningCount, 0);
  if (availableSlots === 0) return [];

  const stateById = new Map(states.map((state) => [state.stepId, state]));
  const definitionById = new Map(
    graph.nodes.map((node) => [node.definition.id, node.definition])
  );

  return graph.nodes
    .filter((node) => stateById.get(node.definition.id)?.status === "PENDING")
    .filter((node) =>
      node.dependsOn.every((dependency) =>
        dependencySatisfied(dependency, stateById, definitionById)
      )
    )
    .slice(0, availableSlots)
    .map((node) => node.index);
}

function valueAtPath(context: unknown, path: string): unknown {
  return path
    .split(".")
    .filter(Boolean)
    .reduce<unknown>((value, key) => {
      if (!value || typeof value !== "object") return undefined;
      return (value as Record<string, unknown>)[key];
    }, context);
}

export function evaluateWorkflowCondition(
  condition: WorkflowCondition | undefined,
  context: unknown
): boolean {
  if (!condition) return true;
  const actual = valueAtPath(context, condition.path);
  switch (condition.operator) {
    case "EQ":
      return actual === condition.value;
    case "NEQ":
      return actual !== condition.value;
    case "IN":
      return Array.isArray(condition.value) && condition.value.includes(actual);
    case "EXISTS":
      return condition.value === false ? actual === undefined : actual !== undefined;
  }
}

function matchesContract(value: unknown, contract: JsonContract, path: string): string[] {
  const errors: string[] = [];
  if (!contract.type) return errors;
  const actualType = Array.isArray(value) ? "array" : typeof value;
  if (actualType !== contract.type || value === null) {
    return [`${path} must be ${contract.type}`];
  }
  if (contract.type === "object") {
    const record = value as Record<string, unknown>;
    for (const required of contract.required ?? []) {
      if (!(required in record)) errors.push(`${path}.${required} is required`);
    }
    for (const [key, propertyContract] of Object.entries(contract.properties ?? {})) {
      if (key in record) errors.push(...matchesContract(record[key], propertyContract, `${path}.${key}`));
    }
  }
  if (contract.type === "array" && contract.items) {
    (value as unknown[]).forEach((item, index) => {
      errors.push(...matchesContract(item, contract.items!, `${path}[${index}]`));
    });
  }
  return errors;
}

export function validateStructuredOutput(
  output: string,
  contract: JsonContract | undefined
): { ok: true; value: unknown } | { ok: false; errors: string[] } {
  if (!contract) return { ok: true, value: output };
  let value: unknown;
  try {
    value = JSON.parse(output);
  } catch {
    return { ok: false, errors: ["Output must be valid JSON"] };
  }
  const errors = matchesContract(value, contract, "$");
  return errors.length === 0 ? { ok: true, value } : { ok: false, errors };
}

export function graphMetrics(graph: CompiledWorkflowGraph): {
  nodeCount: number;
  edgeCount: number;
  depth: number;
  maximumWidth: number;
  parallelizableNodes: number;
} {
  return {
    nodeCount: graph.nodes.length,
    edgeCount: graph.nodes.reduce((count, node) => count + node.dependsOn.length, 0),
    depth: graph.layers.length,
    maximumWidth: Math.max(...graph.layers.map((layer) => layer.length), 0),
    parallelizableNodes: graph.layers
      .filter((layer) => layer.length > 1)
      .reduce((count, layer) => count + layer.length, 0),
  };
}
