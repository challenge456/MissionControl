"use strict";
/**
 * Policy — Convex Functions
 *
 * Policy evaluation for tool calls and transitions.
 * Uses centralized risk classifier from convex/lib/riskClassifier.ts
 * (mirrors @mission-control/policy-engine logic).
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.create = exports.evaluateWithARM = exports.evaluate = exports.explainTaskPolicy = exports.listAll = exports.getActive = void 0;
var values_1 = require("convex/values");
var server_1 = require("./_generated/server");
var riskClassifier_1 = require("./lib/riskClassifier");
var operatorControls_1 = require("./lib/operatorControls");
var armAudit_1 = require("./lib/armAudit");
var agentResolver_1 = require("./lib/agentResolver");
var armPolicy_1 = require("./lib/armPolicy");
var legacyToolPolicy_1 = require("./lib/legacyToolPolicy");
// ============================================================================
// ALLOWLIST HELPERS
// ============================================================================
function checkAllowlists(toolName, toolArgs, policy) {
    // Shell command validation
    if (toolName === "shell" || toolName === "exec" || toolName === "bash") {
        var command = toolArgs.command || toolArgs.cmd || "";
        return checkShellAllowlist(command, policy);
    }
    // Network validation
    if (toolName === "web_fetch" || toolName === "http" || toolName === "fetch") {
        var url = toolArgs.url || "";
        return checkNetworkAllowlist(url, policy);
    }
    // File read validation
    if (toolName === "read" || toolName === "read_file") {
        var path = toolArgs.path || "";
        return checkFileReadAllowlist(path, policy);
    }
    // File write validation
    if (toolName === "write" || toolName === "write_file" || toolName === "edit") {
        var path = toolArgs.path || "";
        return checkFileWriteAllowlist(path, policy);
    }
    // No allowlist check needed for this tool
    return { allowed: true };
}
function checkShellAllowlist(command, policy) {
    var cmd = command.trim().toLowerCase();
    var blocklist = policy.shellBlocklist || [];
    var allowlist = policy.shellAllowlist || [];
    // Check blocklist first
    for (var _i = 0, blocklist_1 = blocklist; _i < blocklist_1.length; _i++) {
        var blocked = blocklist_1[_i];
        if (cmd.includes(blocked.toLowerCase())) {
            return {
                allowed: false,
                reason: "Command contains blocked pattern: ".concat(blocked),
            };
        }
    }
    // If allowlist is empty, allow all (permissive mode)
    if (allowlist.length === 0) {
        return { allowed: true };
    }
    // Check allowlist
    for (var _a = 0, allowlist_1 = allowlist; _a < allowlist_1.length; _a++) {
        var allowed = allowlist_1[_a];
        if (cmd.startsWith(allowed.toLowerCase())) {
            return { allowed: true };
        }
    }
    return {
        allowed: false,
        reason: "Command not in allowlist",
    };
}
function checkNetworkAllowlist(url, policy) {
    try {
        var urlObj = new URL(url);
        var hostname = urlObj.hostname.toLowerCase();
        var allowlist = policy.networkAllowlist || [];
        // If allowlist is empty, allow all (permissive mode)
        if (allowlist.length === 0) {
            return { allowed: true };
        }
        // Check allowlist
        for (var _i = 0, allowlist_2 = allowlist; _i < allowlist_2.length; _i++) {
            var allowed = allowlist_2[_i];
            if (hostname === allowed.toLowerCase() || hostname.endsWith(".".concat(allowed.toLowerCase()))) {
                return { allowed: true };
            }
        }
        return {
            allowed: false,
            reason: "Domain ".concat(hostname, " not in allowlist"),
        };
    }
    catch (error) {
        return {
            allowed: false,
            reason: "Invalid URL",
        };
    }
}
function checkFileReadAllowlist(path, policy) {
    var normalizedPath = path.trim().toLowerCase();
    var allowlist = policy.fileReadPaths || [];
    // If allowlist is empty, allow all (permissive mode)
    if (allowlist.length === 0) {
        return { allowed: true };
    }
    // Check allowlist (glob patterns)
    for (var _i = 0, allowlist_3 = allowlist; _i < allowlist_3.length; _i++) {
        var pattern = allowlist_3[_i];
        if (matchesGlob(normalizedPath, pattern.toLowerCase())) {
            return { allowed: true };
        }
    }
    return {
        allowed: false,
        reason: "Path ".concat(path, " not in read allowlist"),
    };
}
function checkFileWriteAllowlist(path, policy) {
    var normalizedPath = path.trim().toLowerCase();
    var allowlist = policy.fileWritePaths || [];
    // If allowlist is empty, allow all (permissive mode)
    if (allowlist.length === 0) {
        return { allowed: true };
    }
    // Check allowlist (glob patterns)
    for (var _i = 0, allowlist_4 = allowlist; _i < allowlist_4.length; _i++) {
        var pattern = allowlist_4[_i];
        if (matchesGlob(normalizedPath, pattern.toLowerCase())) {
            return { allowed: true };
        }
    }
    return {
        allowed: false,
        reason: "Path ".concat(path, " not in write allowlist"),
    };
}
function matchesGlob(path, pattern) {
    // Convert glob pattern to regex
    var regexPattern = pattern
        .replace(/\*\*/g, ".*") // ** matches any path
        .replace(/\*/g, "[^/]*") // * matches any filename
        .replace(/\./g, "\\."); // Escape dots
    var regex = new RegExp("^".concat(regexPattern, "$"));
    return regex.test(path);
}
function getTaskTypeRiskLevel(taskType) {
    // Conservative defaults for task-level preview when no specific tool call is provided.
    if (taskType === "SOCIAL" || taskType === "EMAIL_MARKETING") {
        return "RED";
    }
    if (taskType === "OPS" || taskType === "ENGINEERING") {
        return "YELLOW";
    }
    return "GREEN";
}
// ============================================================================
// QUERIES
// ============================================================================
exports.getActive = (0, server_1.query)({
    args: {},
    handler: function (ctx) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, ctx.db
                        .query("policies")
                        .withIndex("by_active", function (q) { return q.eq("active", true); })
                        .first()];
                case 1: return [2 /*return*/, _a.sent()];
            }
        });
    }); },
});
exports.listAll = (0, server_1.query)({
    args: {},
    handler: function (ctx) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, ctx.db.query("policies").order("desc").collect()];
                case 1: return [2 /*return*/, _a.sent()];
            }
        });
    }); },
});
/**
 * Explain policy outcome for a task without executing anything.
 * Used by the "Why" panel and dry-run flows.
 */
exports.explainTaskPolicy = (0, server_1.query)({
    args: {
        taskId: values_1.v.id("tasks"),
        plannedTransitionTo: values_1.v.optional(values_1.v.string()),
        plannedToolName: values_1.v.optional(values_1.v.string()),
        plannedToolArgs: values_1.v.optional(values_1.v.any()),
        estimatedCost: values_1.v.optional(values_1.v.number()),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var task, policy, primaryAssigneeId, assignee, _a, triggeredRules, requiredApprovals, remediationHints, decision, reason, riskLevel, estimatedCost, budgetRemaining, approvalCheck, allowlistCheck, rules, operatorControl, operatorGate;
        var _b, _c, _d;
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0: return [4 /*yield*/, ctx.db.get(args.taskId)];
                case 1:
                    task = _e.sent();
                    if (!task) {
                        return [2 /*return*/, {
                                taskId: args.taskId,
                                taskStatus: "NOT_FOUND",
                                assignee: null,
                                decision: "DENY",
                                riskLevel: "RED",
                                reason: "Task not found",
                                triggeredRules: ["task_not_found"],
                                requiredApprovals: [],
                                remediationHints: ["Verify the task ID and retry."],
                                evaluatedAt: Date.now(),
                            }];
                    }
                    return [4 /*yield*/, ctx.db
                            .query("policies")
                            .withIndex("by_active", function (q) { return q.eq("active", true); })
                            .first()];
                case 2:
                    policy = _e.sent();
                    primaryAssigneeId = (_b = task.assigneeIds) === null || _b === void 0 ? void 0 : _b[0];
                    if (!primaryAssigneeId) return [3 /*break*/, 4];
                    return [4 /*yield*/, ctx.db.get(primaryAssigneeId)];
                case 3:
                    _a = _e.sent();
                    return [3 /*break*/, 5];
                case 4:
                    _a = null;
                    _e.label = 5;
                case 5:
                    assignee = _a;
                    triggeredRules = [];
                    requiredApprovals = [];
                    remediationHints = [];
                    decision = "ALLOW";
                    reason = "No blocking policy rules triggered";
                    riskLevel = args.plannedToolName
                        ? (0, riskClassifier_1.classifyRisk)(args.plannedToolName, args.plannedToolArgs)
                        : getTaskTypeRiskLevel(task.type);
                    if (args.plannedToolName) {
                        triggeredRules.push("tool_risk:".concat(args.plannedToolName, ":").concat(riskLevel));
                    }
                    else {
                        triggeredRules.push("task_type_risk:".concat(task.type, ":").concat(riskLevel));
                    }
                    if (!assignee) {
                        triggeredRules.push("task_unassigned");
                        decision = "NEEDS_APPROVAL";
                        reason = "Task has no assignee; operator confirmation required before execution";
                        remediationHints.push("Assign an active agent to the task.");
                        remediationHints.push("Use dry run again after assignment.");
                    }
                    else {
                        if (assignee.status !== "ACTIVE") {
                            triggeredRules.push("assignee_not_active:".concat(assignee.status));
                            decision = "DENY";
                            reason = "Assignee ".concat(assignee.name, " is ").concat(assignee.status.toLowerCase());
                            remediationHints.push("Activate the assignee or reassign this task.");
                        }
                        estimatedCost = (_d = (_c = args.estimatedCost) !== null && _c !== void 0 ? _c : task.estimatedCost) !== null && _d !== void 0 ? _d : 0;
                        budgetRemaining = assignee.budgetDaily - assignee.spendToday;
                        if (estimatedCost > budgetRemaining) {
                            triggeredRules.push("budget_exceeded");
                            // Only escalate to NEEDS_APPROVAL if we haven't already DENY'd
                            if (decision !== "DENY") {
                                decision = "NEEDS_APPROVAL";
                                reason = "Estimated cost ($".concat(estimatedCost.toFixed(2), ") exceeds remaining agent budget ($").concat(budgetRemaining.toFixed(2), ")");
                            }
                            requiredApprovals.push({
                                type: "BUDGET_EXCEEDED",
                                reason: "Budget overrun requires human approval",
                            });
                            remediationHints.push("Lower scope/cost or approve budget overrun.");
                        }
                        approvalCheck = (0, riskClassifier_1.requiresApproval)(riskLevel, assignee.role, estimatedCost, budgetRemaining);
                        if (approvalCheck.required) {
                            triggeredRules.push("approval_required:".concat(riskLevel));
                            decision = "NEEDS_APPROVAL";
                            reason = approvalCheck.reason;
                            requiredApprovals.push({
                                type: riskLevel === "RED" ? "RED_ACTION" : "RISK_ESCALATION",
                                reason: approvalCheck.reason,
                            });
                        }
                    }
                    if (policy && args.plannedToolName && args.plannedToolArgs) {
                        allowlistCheck = checkAllowlists(args.plannedToolName, args.plannedToolArgs, policy);
                        if (!allowlistCheck.allowed) {
                            triggeredRules.push("allowlist_block");
                            decision = "DENY";
                            reason = allowlistCheck.reason || "Blocked by allowlist";
                            riskLevel = "RED";
                            remediationHints.push("Adjust tool args to match policy allowlists.");
                        }
                    }
                    if (policy && args.plannedTransitionTo === "DONE") {
                        rules = policy.rules;
                        if ((rules === null || rules === void 0 ? void 0 : rules.reviewToDoneRequiresHuman) === true) {
                            triggeredRules.push("review_to_done_requires_human");
                            // Only escalate to NEEDS_APPROVAL if we haven't already DENY'd
                            if (decision !== "DENY") {
                                decision = "NEEDS_APPROVAL";
                                reason = "REVIEW -> DONE requires human approval by policy";
                            }
                            requiredApprovals.push({
                                type: "TRANSITION_TO_DONE",
                                reason: "Policy requires human review before completion",
                            });
                        }
                    }
                    return [4 /*yield*/, (0, operatorControls_1.getEffectiveOperatorControl)(ctx.db, task.projectId)];
                case 6:
                    operatorControl = _e.sent();
                    operatorGate = (0, operatorControls_1.evaluateOperatorGate)({
                        mode: operatorControl.mode,
                        actorType: "AGENT",
                        operation: args.plannedToolName ? "TOOL_CALL" : "TRANSITION",
                    });
                    if (operatorGate.decision === "DENY") {
                        decision = "DENY";
                        reason = operatorGate.reason;
                        triggeredRules.push("operator_control:".concat(operatorControl.mode));
                        remediationHints.push("Set operator mode to NORMAL or explicitly override as a human operator.");
                    }
                    else if (operatorGate.decision === "NEEDS_APPROVAL" && decision !== "DENY") {
                        decision = "NEEDS_APPROVAL";
                        reason = operatorGate.reason;
                        triggeredRules.push("operator_control:".concat(operatorControl.mode));
                        requiredApprovals.push({
                            type: "OPERATOR_OVERRIDE",
                            reason: operatorGate.reason,
                        });
                    }
                    if (decision === "ALLOW") {
                        remediationHints.push("No remediation needed. Safe to proceed.");
                    }
                    else if (decision === "NEEDS_APPROVAL" && requiredApprovals.length === 0) {
                        requiredApprovals.push({
                            type: "OPERATOR_CONFIRMATION",
                            reason: "Operator confirmation required",
                        });
                    }
                    return [2 /*return*/, {
                            taskId: task._id,
                            taskStatus: task.status,
                            assignee: assignee
                                ? { id: assignee._id, name: assignee.name, role: assignee.role, status: assignee.status }
                                : null,
                            decision: decision,
                            riskLevel: riskLevel,
                            reason: reason,
                            operatorMode: operatorControl.mode,
                            triggeredRules: triggeredRules,
                            requiredApprovals: requiredApprovals,
                            remediationHints: remediationHints,
                            evaluatedAt: Date.now(),
                        }];
            }
        });
    }); },
});
// ============================================================================
// POLICY EVALUATION
// ============================================================================
exports.evaluate = (0, server_1.query)({
    args: {
        agentId: values_1.v.id("agents"),
        actionType: values_1.v.string(), // "TOOL_CALL" | "TRANSITION" | "SPAWN"
        toolName: values_1.v.optional(values_1.v.string()),
        toolArgs: values_1.v.optional(values_1.v.any()),
        transitionTo: values_1.v.optional(values_1.v.string()),
        estimatedCost: values_1.v.optional(values_1.v.number()),
        metadata: values_1.v.optional(values_1.v.any()),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var policy, agent, riskForArm, armDecision, _a, _b, operatorControl, operatorGate, budgetRemaining, estimatedCost, risk, allowlistCheck, approvalCheck, rules, spawnLimits, activeAgents, childAgents;
        var _c;
        var _d, _e;
        return __generator(this, function (_f) {
            switch (_f.label) {
                case 0: return [4 /*yield*/, ctx.db
                        .query("policies")
                        .withIndex("by_active", function (q) { return q.eq("active", true); })
                        .first()];
                case 1:
                    policy = _f.sent();
                    if (!policy) {
                        return [2 /*return*/, {
                                decision: "ALLOW",
                                reason: "No active policy found, allowing by default"
                            }];
                    }
                    return [4 /*yield*/, ctx.db.get(args.agentId)];
                case 2:
                    agent = _f.sent();
                    if (!agent) {
                        return [2 /*return*/, {
                                decision: "DENY",
                                reason: "Agent not found"
                            }];
                    }
                    riskForArm = args.toolName
                        ? (0, riskClassifier_1.classifyRisk)(args.toolName, args.toolArgs)
                        : "GREEN";
                    _a = armPolicy_1.evaluatePolicyEnvelopes;
                    _b = [ctx.db];
                    _c = {
                        tenantId: agent.tenantId,
                        projectId: agent.projectId
                    };
                    return [4 /*yield*/, (0, agentResolver_1.resolveAgentRef)({ db: ctx.db }, { agentId: args.agentId, createIfMissing: true })];
                case 3: return [4 /*yield*/, _a.apply(void 0, _b.concat([(_c.versionId = (_d = (_f.sent())) === null || _d === void 0 ? void 0 : _d.versionId,
                            _c.toolName = args.toolName,
                            _c.riskLevel = riskForArm,
                            _c)]))];
                case 4:
                    armDecision = _f.sent();
                    if (armDecision) {
                        return [2 /*return*/, {
                                decision: armDecision.decision,
                                reason: armDecision.reason,
                                riskLevel: riskForArm,
                                source: "ARM_POLICY_ENVELOPE",
                            }];
                    }
                    return [4 /*yield*/, (0, operatorControls_1.getEffectiveOperatorControl)(ctx.db, agent.projectId)];
                case 5:
                    operatorControl = _f.sent();
                    operatorGate = (0, operatorControls_1.evaluateOperatorGate)({
                        mode: operatorControl.mode,
                        actorType: "AGENT",
                        operation: args.actionType === "TOOL_CALL" ? "TOOL_CALL" : "TRANSITION",
                    });
                    if (operatorGate.decision === "DENY") {
                        return [2 /*return*/, {
                                decision: "DENY",
                                reason: operatorGate.reason,
                                operatorMode: operatorControl.mode,
                            }];
                    }
                    if (operatorGate.decision === "NEEDS_APPROVAL") {
                        return [2 /*return*/, {
                                decision: "NEEDS_APPROVAL",
                                reason: operatorGate.reason,
                                operatorMode: operatorControl.mode,
                                approval: {
                                    type: "OPERATOR_OVERRIDE",
                                    mode: operatorControl.mode,
                                },
                            }];
                    }
                    // Check agent status
                    if (agent.status === "QUARANTINED") {
                        return [2 /*return*/, {
                                decision: "DENY",
                                reason: "Agent is quarantined"
                            }];
                    }
                    if (agent.status === "PAUSED" || agent.status === "DRAINED" || agent.status === "OFFLINE") {
                        return [2 /*return*/, {
                                decision: "DENY",
                                reason: "Agent is ".concat(agent.status.toLowerCase())
                            }];
                    }
                    budgetRemaining = agent.budgetDaily - agent.spendToday;
                    estimatedCost = (_e = args.estimatedCost) !== null && _e !== void 0 ? _e : 0;
                    if (estimatedCost > budgetRemaining) {
                        return [2 /*return*/, {
                                decision: "NEEDS_APPROVAL",
                                reason: "Budget exceeded: need $".concat(estimatedCost.toFixed(2), ", have $").concat(budgetRemaining.toFixed(2), " remaining"),
                                approval: {
                                    type: "BUDGET_EXCEEDED",
                                    estimatedCost: estimatedCost,
                                    budgetRemaining: budgetRemaining,
                                },
                            }];
                    }
                    // TOOL_CALL evaluation — uses centralized risk classifier
                    if (args.actionType === "TOOL_CALL" && args.toolName) {
                        risk = (0, riskClassifier_1.classifyRisk)(args.toolName, args.toolArgs);
                        // Check allowlists for specific tools
                        if (args.toolArgs) {
                            allowlistCheck = checkAllowlists(args.toolName, args.toolArgs, policy);
                            if (!allowlistCheck.allowed) {
                                return [2 /*return*/, {
                                        decision: "DENY",
                                        reason: allowlistCheck.reason || "Action blocked by allowlist",
                                        riskLevel: "RED",
                                    }];
                            }
                        }
                        approvalCheck = (0, riskClassifier_1.requiresApproval)(risk, agent.role, estimatedCost, budgetRemaining);
                        if (approvalCheck.required) {
                            return [2 /*return*/, {
                                    decision: "NEEDS_APPROVAL",
                                    reason: approvalCheck.reason,
                                    riskLevel: risk,
                                    approval: {
                                        type: risk === "RED" ? "RED_TOOL" : "YELLOW_TOOL_INTERN",
                                        toolName: args.toolName,
                                    },
                                }];
                        }
                        return [2 /*return*/, {
                                decision: "ALLOW",
                                reason: "Tool '".concat(args.toolName, "' is ").concat(risk, "-rated, allowed for ").concat(agent.role),
                                riskLevel: risk,
                            }];
                    }
                    // TRANSITION evaluation
                    if (args.actionType === "TRANSITION" && args.transitionTo === "DONE") {
                        rules = policy.rules;
                        if (rules === null || rules === void 0 ? void 0 : rules.reviewToDoneRequiresHuman) {
                            return [2 /*return*/, {
                                    decision: "NEEDS_APPROVAL",
                                    reason: "REVIEW → DONE requires human approval",
                                    approval: {
                                        type: "TRANSITION_TO_DONE",
                                    },
                                }];
                        }
                    }
                    if (!(args.actionType === "SPAWN")) return [3 /*break*/, 9];
                    if (!agent.canSpawn) {
                        return [2 /*return*/, {
                                decision: "DENY",
                                reason: "Agent is not allowed to spawn sub-agents",
                            }];
                    }
                    spawnLimits = policy.spawnLimits;
                    if (!spawnLimits) return [3 /*break*/, 8];
                    return [4 /*yield*/, ctx.db
                            .query("agents")
                            .withIndex("by_status", function (q) { return q.eq("status", "ACTIVE"); })
                            .collect()];
                case 6:
                    activeAgents = _f.sent();
                    if (activeAgents.length >= (spawnLimits.maxGlobalActive || 30)) {
                        return [2 /*return*/, {
                                decision: "DENY",
                                reason: "Global agent limit reached (".concat(activeAgents.length, "/").concat(spawnLimits.maxGlobalActive, ")"),
                            }];
                    }
                    return [4 /*yield*/, ctx.db
                            .query("agents")
                            .filter(function (q) { return q.eq(q.field("parentAgentId"), args.agentId); })
                            .collect()];
                case 7:
                    childAgents = _f.sent();
                    if (childAgents.length >= (agent.maxSubAgents || spawnLimits.maxPerParent || 3)) {
                        return [2 /*return*/, {
                                decision: "DENY",
                                reason: "Agent has reached sub-agent limit (".concat(childAgents.length, "/").concat(agent.maxSubAgents, ")"),
                            }];
                    }
                    _f.label = 8;
                case 8: return [2 /*return*/, {
                        decision: "ALLOW",
                        reason: "Spawn allowed",
                    }];
                case 9: 
                // Default allow
                return [2 /*return*/, {
                        decision: "ALLOW",
                        reason: "No policy rules triggered",
                    }];
            }
        });
    }); },
});
exports.evaluateWithARM = (0, server_1.mutation)({
    args: {
        agentId: values_1.v.optional(values_1.v.id("agents")),
        instanceId: values_1.v.optional(values_1.v.id("agentInstances")),
        actionType: values_1.v.string(),
        toolName: values_1.v.optional(values_1.v.string()),
        toolArgs: values_1.v.optional(values_1.v.any()),
        transitionTo: values_1.v.optional(values_1.v.string()),
        estimatedCost: values_1.v.optional(values_1.v.number()),
        context: values_1.v.optional(values_1.v.any()),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var resolved, _a, _b, legacyAgentId, legacyAgent, _c, resolvedInstance, _d, effectiveTenantId, risk, envelopeDecision, activeLegacyPolicy, _e, legacyDecision, fallback, decision, reason, changeRecordId;
        var _f, _g, _h, _j, _k, _l, _m;
        return __generator(this, function (_o) {
            switch (_o.label) {
                case 0:
                    if (!args.instanceId) return [3 /*break*/, 2];
                    return [4 /*yield*/, (0, agentResolver_1.resolveAgentRef)({ db: ctx.db }, { instanceId: args.instanceId, createIfMissing: false })];
                case 1:
                    _a = _o.sent();
                    return [3 /*break*/, 6];
                case 2:
                    if (!args.agentId) return [3 /*break*/, 4];
                    return [4 /*yield*/, (0, agentResolver_1.resolveAgentRef)({ db: ctx.db }, { agentId: args.agentId, createIfMissing: true })];
                case 3:
                    _b = _o.sent();
                    return [3 /*break*/, 5];
                case 4:
                    _b = null;
                    _o.label = 5;
                case 5:
                    _a = _b;
                    _o.label = 6;
                case 6:
                    resolved = _a;
                    legacyAgentId = (_f = args.agentId) !== null && _f !== void 0 ? _f : resolved === null || resolved === void 0 ? void 0 : resolved.legacyAgentId;
                    if (!legacyAgentId) return [3 /*break*/, 8];
                    return [4 /*yield*/, ctx.db.get(legacyAgentId)];
                case 7:
                    _c = _o.sent();
                    return [3 /*break*/, 9];
                case 8:
                    _c = null;
                    _o.label = 9;
                case 9:
                    legacyAgent = _c;
                    if (!(resolved === null || resolved === void 0 ? void 0 : resolved.instanceId)) return [3 /*break*/, 11];
                    return [4 /*yield*/, ctx.db.get(resolved.instanceId)];
                case 10:
                    _d = _o.sent();
                    return [3 /*break*/, 12];
                case 11:
                    _d = null;
                    _o.label = 12;
                case 12:
                    resolvedInstance = _d;
                    effectiveTenantId = (_g = legacyAgent === null || legacyAgent === void 0 ? void 0 : legacyAgent.tenantId) !== null && _g !== void 0 ? _g : resolvedInstance === null || resolvedInstance === void 0 ? void 0 : resolvedInstance.tenantId;
                    risk = args.toolName
                        ? (0, riskClassifier_1.classifyRisk)(args.toolName, args.toolArgs)
                        : "GREEN";
                    return [4 /*yield*/, (0, armPolicy_1.evaluatePolicyEnvelopes)(ctx.db, {
                            tenantId: effectiveTenantId,
                            projectId: legacyAgent === null || legacyAgent === void 0 ? void 0 : legacyAgent.projectId,
                            versionId: resolved === null || resolved === void 0 ? void 0 : resolved.versionId,
                            toolName: args.toolName,
                            riskLevel: risk,
                        })];
                case 13:
                    envelopeDecision = _o.sent();
                    if (!(!envelopeDecision && args.actionType === "TOOL_CALL" && args.toolName && legacyAgent)) return [3 /*break*/, 15];
                    return [4 /*yield*/, ctx.db
                            .query("policies")
                            .withIndex("by_active", function (q) { return q.eq("active", true); })
                            .first()];
                case 14:
                    _e = _o.sent();
                    return [3 /*break*/, 16];
                case 15:
                    _e = null;
                    _o.label = 16;
                case 16:
                    activeLegacyPolicy = _e;
                    legacyDecision = !envelopeDecision && args.actionType === "TOOL_CALL" && args.toolName && legacyAgent
                        ? (0, legacyToolPolicy_1.evaluateLegacyToolPolicy)({
                            policy: activeLegacyPolicy,
                            agentRole: legacyAgent.role,
                            budgetRemaining: Math.max(legacyAgent.budgetDaily - legacyAgent.spendToday, 0),
                            estimatedCost: (_h = args.estimatedCost) !== null && _h !== void 0 ? _h : 0,
                            toolName: args.toolName,
                            toolArgs: args.toolArgs,
                        })
                        : null;
                    fallback = {
                        decision: "ALLOW",
                        reason: "No matching ARM envelope; caller may run legacy policy evaluate()",
                    };
                    decision = (_k = (_j = envelopeDecision === null || envelopeDecision === void 0 ? void 0 : envelopeDecision.decision) !== null && _j !== void 0 ? _j : legacyDecision === null || legacyDecision === void 0 ? void 0 : legacyDecision.decision) !== null && _k !== void 0 ? _k : fallback.decision;
                    reason = (_m = (_l = envelopeDecision === null || envelopeDecision === void 0 ? void 0 : envelopeDecision.reason) !== null && _l !== void 0 ? _l : legacyDecision === null || legacyDecision === void 0 ? void 0 : legacyDecision.reason) !== null && _m !== void 0 ? _m : fallback.reason;
                    if (!(decision === "NEEDS_APPROVAL")) return [3 /*break*/, 18];
                    return [4 /*yield*/, ctx.db.insert("approvalRecords", {
                            tenantId: effectiveTenantId,
                            projectId: legacyAgent === null || legacyAgent === void 0 ? void 0 : legacyAgent.projectId,
                            instanceId: resolved === null || resolved === void 0 ? void 0 : resolved.instanceId,
                            versionId: resolved === null || resolved === void 0 ? void 0 : resolved.versionId,
                            actionType: args.actionType,
                            riskLevel: risk,
                            justification: reason,
                            status: "PENDING",
                            requestedAt: Date.now(),
                        })];
                case 17:
                    _o.sent();
                    _o.label = 18;
                case 18:
                    changeRecordId = undefined;
                    if (!(decision === "DENY")) return [3 /*break*/, 20];
                    return [4 /*yield*/, (0, armAudit_1.appendChangeRecord)(ctx.db, {
                            tenantId: effectiveTenantId,
                            projectId: legacyAgent === null || legacyAgent === void 0 ? void 0 : legacyAgent.projectId,
                            instanceId: resolved === null || resolved === void 0 ? void 0 : resolved.instanceId,
                            versionId: resolved === null || resolved === void 0 ? void 0 : resolved.versionId,
                            legacyAgentId: legacyAgentId,
                            type: "POLICY_DENIED",
                            summary: "Policy denied ".concat(args.actionType).concat(args.toolName ? " (".concat(args.toolName, ")") : ""),
                            payload: {
                                reason: reason,
                                actionType: args.actionType,
                                toolName: args.toolName,
                                risk: risk,
                            },
                        })];
                case 19:
                    changeRecordId = _o.sent();
                    _o.label = 20;
                case 20: return [4 /*yield*/, (0, armAudit_1.appendOpEvent)(ctx.db, {
                        tenantId: effectiveTenantId,
                        projectId: legacyAgent === null || legacyAgent === void 0 ? void 0 : legacyAgent.projectId,
                        instanceId: resolved === null || resolved === void 0 ? void 0 : resolved.instanceId,
                        versionId: resolved === null || resolved === void 0 ? void 0 : resolved.versionId,
                        type: decision === "DENY"
                            ? "TOOL_CALL_BLOCKED"
                            : decision === "ALLOW"
                                ? "TOOL_CALL_STARTED"
                                : "DECISION_MADE",
                        changeRecordId: changeRecordId,
                        payload: {
                            decision: decision,
                            reason: reason,
                            actionType: args.actionType,
                            toolName: args.toolName,
                            risk: risk,
                        },
                    })];
                case 21:
                    _o.sent();
                    return [2 /*return*/, {
                            decision: decision,
                            reason: reason,
                            riskLevel: risk,
                            source: envelopeDecision
                                ? "ARM_POLICY_ENVELOPE"
                                : legacyDecision
                                    ? "LEGACY_POLICY_FALLBACK"
                                    : "LEGACY_POLICY",
                        }];
            }
        });
    }); },
});
// ============================================================================
// MUTATIONS
// ============================================================================
exports.create = (0, server_1.mutation)({
    args: {
        name: values_1.v.string(),
        scopeType: values_1.v.string(),
        scopeId: values_1.v.optional(values_1.v.string()),
        rules: values_1.v.any(),
        toolRiskMap: values_1.v.optional(values_1.v.any()),
        budgetDefaults: values_1.v.optional(values_1.v.any()),
        spawnLimits: values_1.v.optional(values_1.v.any()),
        loopThresholds: values_1.v.optional(values_1.v.any()),
        notes: values_1.v.optional(values_1.v.string()),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var existing, version, policyId;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, ctx.db
                        .query("policies")
                        .withIndex("by_name", function (q) { return q.eq("name", args.name); })
                        .order("desc")
                        .first()];
                case 1:
                    existing = _b.sent();
                    version = existing ? existing.version + 1 : 1;
                    if (!existing) return [3 /*break*/, 3];
                    return [4 /*yield*/, ctx.db.patch(existing._id, { active: false })];
                case 2:
                    _b.sent();
                    _b.label = 3;
                case 3: return [4 /*yield*/, ctx.db.insert("policies", {
                        version: version,
                        name: args.name,
                        scopeType: args.scopeType,
                        scopeId: args.scopeId,
                        rules: args.rules,
                        toolRiskMap: args.toolRiskMap,
                        budgetDefaults: args.budgetDefaults,
                        spawnLimits: args.spawnLimits,
                        loopThresholds: args.loopThresholds,
                        active: true,
                        notes: args.notes,
                    })];
                case 4:
                    policyId = _b.sent();
                    _a = {};
                    return [4 /*yield*/, ctx.db.get(policyId)];
                case 5: return [2 /*return*/, (_a.policy = _b.sent(), _a)];
            }
        });
    }); },
});
exports.deactivate = (0, server_1.mutation)({
    args: { policyId: values_1.v.id("policies") },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, ctx.db.patch(args.policyId, { active: false })];
                case 1:
                    _a.sent();
                    return [2 /*return*/, { success: true }];
            }
        });
    }); },
});
