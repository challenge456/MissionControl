/**
 * Typed Convex API surface used by the orchestration server.
 * Centralizes function paths so schema/API renames are updated in one place.
 */

export const ConvexQueries = {
  tasks: {
    listByStatus: "tasks:listByStatus",
    listAll: "tasks:listAll",
  },
  agents: {
    listAll: "agents:listAll",
  },
  gatewayConnection: {
    get: "gatewayConnection:get",
  },
  workflowRuns: {
    get: "workflowRuns:get",
    getInspector: "workflowRuns:getInspector",
    listEvents: "workflowRuns:listEvents",
    listArtifacts: "workflowRuns:listArtifacts",
  },
  workOrders: {
    revisionHistory: "workOrders:revisionHistory",
    governanceValidity: "workOrders:governanceValidity",
    listExpiredApprovals: "workOrders:listExpiredApprovals",
    listStaleEvidence: "workOrders:listStaleEvidence",
  },
  skillAutomations: {
    getExecutionManifest: "skillAutomations:getExecutionManifest",
  },
  missions: {
    get: "missions:get",
  },
} as const;

export const ConvexActions = {
  serviceCommands: {
    dispatchWorkOrder: "serviceCommands:dispatchWorkOrder",
    ingestReceiptPacket: "serviceCommands:ingestReceiptPacket",
  },
} as const;

export const ConvexMutations = {
  context: {
    activateForWorkflowRun: "context/activation:activateForWorkflowRun",
  },
  coordinator: {
    decomposeTask: "coordinator:decomposeTask",
  },
  workOrders: {
    requestApprovalDecision: "workOrders:requestApprovalDecision",
    decideApprovalDecision: "workOrders:decideApprovalDecision",
    recordVerificationReceipt: "workOrders:recordVerificationReceipt",
    accept: "workOrders:accept",
    requestWorkOrderRevision: "workOrders:requestWorkOrderRevision",
    approveWorkOrderRevision: "workOrders:approveWorkOrderRevision",
    reopenWorkOrder: "workOrders:reopenWorkOrder",
    supersedeWorkOrder: "workOrders:supersedeWorkOrder",
    expireGovernanceRecords: "workOrders:expireGovernanceRecords",
  },
  missions: {
    recordHandoff: "missions:recordHandoff",
    recordValidationResult: "missions:recordValidationResult",
    accept: "missions:accept",
  },
  workflowRuns: {
    recordEvent: "workflowRuns:recordEvent",
    createArtifact: "workflowRuns:createArtifact",
    linkArtifactToVerificationReceipt: "workflowRuns:linkArtifactToVerificationReceipt",
    updateStatus: "workflowRuns:updateStatus",
  },
  skillAutomations: {
    recordExecutionResult: "skillAutomations:recordExecutionResult",
    finalizeVerification: "skillAutomations:finalizeVerification",
  },
  taskRouter: {
    autoAssign: "taskRouter:autoAssign",
  },
  alerts: {
    create: "alerts:create",
  },
  modelCatalog: {
    syncLocalModels: "modelCatalog:syncLocalModels",
  },
} as const;
