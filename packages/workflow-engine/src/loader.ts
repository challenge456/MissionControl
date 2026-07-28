/**
 * Workflow Loader
 * 
 * Loads workflow definitions from YAML files and validates them.
 */

import * as fs from "fs";
import * as path from "path";
import * as yaml from "yaml";
import {
  validateGraphDefinition,
  type JsonContract,
  type WorkflowCondition,
  type WorkflowFailurePolicy,
  type WorkflowNodeKind,
  type WorkflowTopology,
} from "./graph";

export interface WorkflowStepDefinition {
  id: string;
  agent: string;
  input: string;
  expects: string;
  retryLimit: number;
  timeoutMinutes: number;
  dependsOn?: string[];
  kind?: WorkflowNodeKind;
  inputSchema?: JsonContract;
  outputSchema?: JsonContract;
  modelTier?: "FAST" | "BALANCED" | "POWERFUL";
  isolation?: "SHARED" | "WORKTREE" | "READ_ONLY";
  failurePolicy?: WorkflowFailurePolicy;
  condition?: WorkflowCondition;
}

export interface WorkflowDefinition {
  id: string;
  name: string;
  description: string;
  topology?: WorkflowTopology;
  maxConcurrency?: number;
  convergence?: {
    maxIterations: number;
    stopCondition: string;
  };
  agents: Array<{
    id: string;
    persona: string;
    workspace?: {
      files?: Record<string, string>;
    };
  }>;
  steps: WorkflowStepDefinition[];
}

export interface WorkflowValidationError {
  field: string;
  message: string;
}

/**
 * Load a workflow from a YAML file
 */
export function loadWorkflow(filePath: string): WorkflowDefinition {
  const absolutePath = path.resolve(filePath);
  
  if (!fs.existsSync(absolutePath)) {
    throw new Error(`Workflow file not found: ${absolutePath}`);
  }
  
  const content = fs.readFileSync(absolutePath, "utf-8");
  const parsed = yaml.parse(content);
  
  const errors = validateWorkflow(parsed);
  if (errors.length > 0) {
    const errorMessages = errors.map((e) => `  - ${e.field}: ${e.message}`).join("\n");
    throw new Error(`Invalid workflow file ${filePath}:\n${errorMessages}`);
  }
  
  return parsed as WorkflowDefinition;
}

/**
 * Load all workflows from a directory
 */
export function loadAllWorkflows(dirPath: string): Map<string, WorkflowDefinition> {
  const absoluteDir = path.resolve(dirPath);
  const workflows = new Map<string, WorkflowDefinition>();
  
  if (!fs.existsSync(absoluteDir)) {
    throw new Error(`Workflows directory not found: ${absoluteDir}`);
  }
  
  const files = fs.readdirSync(absoluteDir).filter(
    (f) => f.endsWith(".yaml") || f.endsWith(".yml")
  );
  
  for (const file of files) {
    try {
      const workflow = loadWorkflow(path.join(absoluteDir, file));
      workflows.set(workflow.id, workflow);
    } catch (error) {
      console.error(`Failed to load workflow ${file}:`, error);
    }
  }
  
  return workflows;
}

/**
 * Validate a parsed workflow object
 */
export function validateWorkflow(data: any): WorkflowValidationError[] {
  const errors: WorkflowValidationError[] = [];
  
  if (!data || typeof data !== "object") {
    errors.push({ field: "root", message: "Workflow must be an object" });
    return errors;
  }
  
  // Required string fields
  if (!data.id || typeof data.id !== "string") {
    errors.push({ field: "id", message: "Required string field 'id' is missing" });
  }
  
  if (!data.name || typeof data.name !== "string") {
    errors.push({ field: "name", message: "Required string field 'name' is missing" });
  }
  
  if (!data.description || typeof data.description !== "string") {
    errors.push({ field: "description", message: "Required string field 'description' is missing" });
  }

  if (data.topology !== undefined && !["LINEAR", "DAG"].includes(data.topology)) {
    errors.push({ field: "topology", message: "Topology must be LINEAR or DAG" });
  }
  if (
    data.maxConcurrency !== undefined &&
    (!Number.isInteger(data.maxConcurrency) || data.maxConcurrency < 1 || data.maxConcurrency > 32)
  ) {
    errors.push({
      field: "maxConcurrency",
      message: "maxConcurrency must be an integer between 1 and 32",
    });
  }
  if (data.convergence !== undefined) {
    if (
      !Number.isInteger(data.convergence?.maxIterations) ||
      data.convergence.maxIterations < 1 ||
      data.convergence.maxIterations > 10
    ) {
      errors.push({
        field: "convergence.maxIterations",
        message: "maxIterations must be an integer between 1 and 10",
      });
    }
    if (!data.convergence?.stopCondition || typeof data.convergence.stopCondition !== "string") {
      errors.push({
        field: "convergence.stopCondition",
        message: "A bounded stop condition is required",
      });
    }
  }
  
  // Agents array
  if (!Array.isArray(data.agents)) {
    errors.push({ field: "agents", message: "Required array field 'agents' is missing" });
  } else {
    data.agents.forEach((agent: any, index: number) => {
      if (!agent.id || typeof agent.id !== "string") {
        errors.push({ field: `agents[${index}].id`, message: "Agent id is required" });
      }
      if (!agent.persona || typeof agent.persona !== "string") {
        errors.push({ field: `agents[${index}].persona`, message: "Agent persona is required" });
      }
    });
  }
  
  // Steps array
  if (!Array.isArray(data.steps)) {
    errors.push({ field: "steps", message: "Required array field 'steps' is missing" });
  } else {
    if (data.steps.length === 0) {
      errors.push({ field: "steps", message: "Workflow must have at least one step" });
    }
    
    data.steps.forEach((step: any, index: number) => {
      if (!step.id || typeof step.id !== "string") {
        errors.push({ field: `steps[${index}].id`, message: "Step id is required" });
      }
      if (!step.agent || typeof step.agent !== "string") {
        errors.push({ field: `steps[${index}].agent`, message: "Step agent is required" });
      }
      if (!step.input || typeof step.input !== "string") {
        errors.push({ field: `steps[${index}].input`, message: "Step input is required" });
      }
      if (!step.expects || typeof step.expects !== "string") {
        errors.push({ field: `steps[${index}].expects`, message: "Step expects is required" });
      }
      if (typeof step.retryLimit !== "number" || step.retryLimit < 0) {
        errors.push({ field: `steps[${index}].retryLimit`, message: "Step retryLimit must be a non-negative number" });
      }
      if (typeof step.timeoutMinutes !== "number" || step.timeoutMinutes <= 0) {
        errors.push({ field: `steps[${index}].timeoutMinutes`, message: "Step timeoutMinutes must be a positive number" });
      }
      if (
        step.dependsOn !== undefined &&
        (!Array.isArray(step.dependsOn) || step.dependsOn.some((value: unknown) => typeof value !== "string"))
      ) {
        errors.push({
          field: `steps[${index}].dependsOn`,
          message: "Step dependsOn must be an array of step ids",
        });
      }
      if (
        step.kind !== undefined &&
        !["AGENT", "REDUCE", "ROUTER", "VERIFY", "GATE"].includes(step.kind)
      ) {
        errors.push({ field: `steps[${index}].kind`, message: "Unknown node kind" });
      }
      if (
        step.modelTier !== undefined &&
        !["FAST", "BALANCED", "POWERFUL"].includes(step.modelTier)
      ) {
        errors.push({ field: `steps[${index}].modelTier`, message: "Unknown model tier" });
      }
      if (
        step.isolation !== undefined &&
        !["SHARED", "WORKTREE", "READ_ONLY"].includes(step.isolation)
      ) {
        errors.push({ field: `steps[${index}].isolation`, message: "Unknown isolation mode" });
      }
      if (
        step.failurePolicy !== undefined &&
        !["RETRY", "CONTINUE", "BLOCK"].includes(step.failurePolicy)
      ) {
        errors.push({ field: `steps[${index}].failurePolicy`, message: "Unknown failure policy" });
      }
      if (step.condition !== undefined) {
        if (!step.condition.path || typeof step.condition.path !== "string") {
          errors.push({
            field: `steps[${index}].condition.path`,
            message: "Condition path is required",
          });
        }
        if (!["EQ", "NEQ", "IN", "EXISTS"].includes(step.condition.operator)) {
          errors.push({
            field: `steps[${index}].condition.operator`,
            message: "Unknown condition operator",
          });
        }
      }
      
      // Validate agent reference
      if (Array.isArray(data.agents) && step.agent) {
        const agentExists = data.agents.some((a: any) => a.id === step.agent);
        if (!agentExists) {
          errors.push({ field: `steps[${index}].agent`, message: `Agent "${step.agent}" not defined in agents array` });
        }
      }
    });

    if (
      data.steps.every((step: any) => typeof step.id === "string") &&
      (data.topology === undefined || ["LINEAR", "DAG"].includes(data.topology))
    ) {
      errors.push(
        ...validateGraphDefinition(data.steps, data.topology ?? "LINEAR")
      );
    }
  }
  
  return errors;
}
