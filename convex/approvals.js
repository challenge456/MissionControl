"use strict";
/**
 * Approvals — Convex Functions
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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.escalateOverdue = exports.expireStale = exports.cancel = exports.deny = exports.approve = exports.request = exports.getDecisionChain = exports.get = exports.listByRequestor = exports.listByTask = exports.listByStatus = exports.listEscalated = exports.listPending = exports.list = void 0;
var values_1 = require("convex/values");
var server_1 = require("./_generated/server");
var taskEvents_1 = require("./lib/taskEvents");
var armAudit_1 = require("./lib/armAudit");
var agentResolver_1 = require("./lib/agentResolver");
var approvalStatusValidator = values_1.v.union(values_1.v.literal("PENDING"), values_1.v.literal("ESCALATED"), values_1.v.literal("APPROVED"), values_1.v.literal("DENIED"), values_1.v.literal("EXPIRED"), values_1.v.literal("CANCELED"));
function sortByCreationDesc(rows) {
    return __spreadArray([], rows, true).sort(function (a, b) { return b._creationTime - a._creationTime; });
}
function queryPendingLike(ctx, args) {
    return __awaiter(this, void 0, void 0, function () {
        var _a, pending_1, escalated_1, _b, pending, escalated;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    if (!args.projectId) return [3 /*break*/, 2];
                    return [4 /*yield*/, Promise.all([
                            ctx.db
                                .query("approvals")
                                .withIndex("by_project_status", function (q) { return q.eq("projectId", args.projectId).eq("status", "PENDING"); })
                                .collect(),
                            ctx.db
                                .query("approvals")
                                .withIndex("by_project_status", function (q) { return q.eq("projectId", args.projectId).eq("status", "ESCALATED"); })
                                .collect(),
                        ])];
                case 1:
                    _a = _c.sent(), pending_1 = _a[0], escalated_1 = _a[1];
                    return [2 /*return*/, sortByCreationDesc(__spreadArray(__spreadArray([], pending_1, true), escalated_1, true)).slice(0, args.limit)];
                case 2: return [4 /*yield*/, Promise.all([
                        ctx.db
                            .query("approvals")
                            .withIndex("by_status", function (q) { return q.eq("status", "PENDING"); })
                            .collect(),
                        ctx.db
                            .query("approvals")
                            .withIndex("by_status", function (q) { return q.eq("status", "ESCALATED"); })
                            .collect(),
                    ])];
                case 3:
                    _b = _c.sent(), pending = _b[0], escalated = _b[1];
                    return [2 /*return*/, sortByCreationDesc(__spreadArray(__spreadArray([], pending, true), escalated, true)).slice(0, args.limit)];
            }
        });
    });
}
// ============================================================================
// QUERIES
// ============================================================================
exports.list = (0, server_1.query)({
    args: {
        projectId: values_1.v.optional(values_1.v.id("projects")),
        limit: values_1.v.optional(values_1.v.number()),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    if (!args.projectId) return [3 /*break*/, 2];
                    return [4 /*yield*/, ctx.db
                            .query("approvals")
                            .withIndex("by_project", function (q) { return q.eq("projectId", args.projectId); })
                            .order("desc")
                            .take((_a = args.limit) !== null && _a !== void 0 ? _a : 100)];
                case 1: return [2 /*return*/, _c.sent()];
                case 2: return [4 /*yield*/, ctx.db
                        .query("approvals")
                        .order("desc")
                        .take((_b = args.limit) !== null && _b !== void 0 ? _b : 100)];
                case 3: return [2 /*return*/, _c.sent()];
            }
        });
    }); },
});
exports.listPending = (0, server_1.query)({
    args: {
        projectId: values_1.v.optional(values_1.v.id("projects")),
        limit: values_1.v.optional(values_1.v.number()),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, queryPendingLike(ctx, {
                        projectId: args.projectId,
                        limit: (_a = args.limit) !== null && _a !== void 0 ? _a : 50,
                    })];
                case 1: return [2 /*return*/, _b.sent()];
            }
        });
    }); },
});
exports.listEscalated = (0, server_1.query)({
    args: {
        projectId: values_1.v.optional(values_1.v.id("projects")),
        limit: values_1.v.optional(values_1.v.number()),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    if (!args.projectId) return [3 /*break*/, 2];
                    return [4 /*yield*/, ctx.db
                            .query("approvals")
                            .withIndex("by_project_status", function (q) {
                            return q.eq("projectId", args.projectId).eq("status", "ESCALATED");
                        })
                            .order("desc")
                            .take((_a = args.limit) !== null && _a !== void 0 ? _a : 50)];
                case 1: return [2 /*return*/, _c.sent()];
                case 2: return [4 /*yield*/, ctx.db
                        .query("approvals")
                        .withIndex("by_status", function (q) { return q.eq("status", "ESCALATED"); })
                        .order("desc")
                        .take((_b = args.limit) !== null && _b !== void 0 ? _b : 50)];
                case 3: return [2 /*return*/, _c.sent()];
            }
        });
    }); },
});
/**
 * List approvals by status for Approvals Center tabs.
 */
exports.listByStatus = (0, server_1.query)({
    args: {
        status: approvalStatusValidator,
        projectId: values_1.v.optional(values_1.v.id("projects")),
        limit: values_1.v.optional(values_1.v.number()),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var limit;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    limit = (_a = args.limit) !== null && _a !== void 0 ? _a : 100;
                    if (!args.projectId) return [3 /*break*/, 2];
                    return [4 /*yield*/, ctx.db
                            .query("approvals")
                            .withIndex("by_project_status", function (q) {
                            return q.eq("projectId", args.projectId).eq("status", args.status);
                        })
                            .order("desc")
                            .take(limit)];
                case 1: return [2 /*return*/, _b.sent()];
                case 2: return [4 /*yield*/, ctx.db
                        .query("approvals")
                        .withIndex("by_status", function (q) { return q.eq("status", args.status); })
                        .order("desc")
                        .take(limit)];
                case 3: return [2 /*return*/, _b.sent()];
            }
        });
    }); },
});
exports.listByTask = (0, server_1.query)({
    args: {
        taskId: values_1.v.id("tasks"),
        limit: values_1.v.optional(values_1.v.number()),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, ctx.db
                        .query("approvals")
                        .withIndex("by_task", function (q) { return q.eq("taskId", args.taskId); })
                        .order("desc")
                        .take((_a = args.limit) !== null && _a !== void 0 ? _a : 50)];
                case 1: return [2 /*return*/, _b.sent()];
            }
        });
    }); },
});
exports.listByRequestor = (0, server_1.query)({
    args: {
        agentId: values_1.v.id("agents"),
        limit: values_1.v.optional(values_1.v.number()),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, ctx.db
                        .query("approvals")
                        .withIndex("by_requestor", function (q) { return q.eq("requestorAgentId", args.agentId); })
                        .order("desc")
                        .take((_a = args.limit) !== null && _a !== void 0 ? _a : 50)];
                case 1: return [2 /*return*/, _b.sent()];
            }
        });
    }); },
});
exports.get = (0, server_1.query)({
    args: { approvalId: values_1.v.id("approvals") },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, ctx.db.get(args.approvalId)];
                case 1: return [2 /*return*/, _a.sent()];
            }
        });
    }); },
});
exports.getDecisionChain = (0, server_1.query)({
    args: {
        approvalId: values_1.v.id("approvals"),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var approval, activities, taskEvents, _a, approvalEvents;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, ctx.db.get(args.approvalId)];
                case 1:
                    approval = _b.sent();
                    if (!approval) {
                        return [2 /*return*/, null];
                    }
                    return [4 /*yield*/, ctx.db
                            .query("activities")
                            .filter(function (q) { return q.eq(q.field("targetId"), args.approvalId); })
                            .collect()];
                case 2:
                    activities = _b.sent();
                    if (!approval.taskId) return [3 /*break*/, 4];
                    return [4 /*yield*/, ctx.db
                            .query("taskEvents")
                            .withIndex("by_task", function (q) { return q.eq("taskId", approval.taskId); })
                            .collect()];
                case 3:
                    _a = _b.sent();
                    return [3 /*break*/, 5];
                case 4:
                    _a = [];
                    _b.label = 5;
                case 5:
                    taskEvents = _a;
                    approvalEvents = taskEvents.filter(function (event) {
                        return [
                            "APPROVAL_REQUESTED",
                            "APPROVAL_ESCALATED",
                            "APPROVAL_APPROVED",
                            "APPROVAL_DENIED",
                            "APPROVAL_EXPIRED",
                        ].includes(event.eventType);
                    });
                    return [2 /*return*/, {
                            approval: approval,
                            activities: sortByCreationDesc(activities),
                            taskEvents: sortByCreationDesc(approvalEvents),
                        }];
            }
        });
    }); },
});
// ============================================================================
// MUTATIONS
// ============================================================================
exports.request = (0, server_1.mutation)({
    args: {
        projectId: values_1.v.optional(values_1.v.id("projects")),
        taskId: values_1.v.optional(values_1.v.id("tasks")),
        toolCallId: values_1.v.optional(values_1.v.id("toolCalls")),
        requestorAgentId: values_1.v.id("agents"),
        actionType: values_1.v.string(),
        actionSummary: values_1.v.string(),
        riskLevel: values_1.v.string(),
        actionPayload: values_1.v.optional(values_1.v.any()),
        estimatedCost: values_1.v.optional(values_1.v.number()),
        rollbackPlan: values_1.v.optional(values_1.v.string()),
        justification: values_1.v.string(),
        expiresInMinutes: values_1.v.optional(values_1.v.number()),
        idempotencyKey: values_1.v.optional(values_1.v.string()),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var existing, projectId, task, dualControlRequired, expiresAt, requestor, requestorRef, requestorInstance, _a, effectiveTenantId, isLowRisk, shouldAutoApprove, approvalId, changeRecordId, agent;
        var _b;
        var _c, _d;
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0:
                    if (!args.idempotencyKey) return [3 /*break*/, 2];
                    return [4 /*yield*/, ctx.db
                            .query("approvals")
                            .filter(function (q) { return q.eq(q.field("idempotencyKey"), args.idempotencyKey); })
                            .first()];
                case 1:
                    existing = _e.sent();
                    if (existing) {
                        return [2 /*return*/, { approval: existing, created: false }];
                    }
                    _e.label = 2;
                case 2:
                    projectId = args.projectId;
                    if (!(!projectId && args.taskId)) return [3 /*break*/, 4];
                    return [4 /*yield*/, ctx.db.get(args.taskId)];
                case 3:
                    task = _e.sent();
                    projectId = task === null || task === void 0 ? void 0 : task.projectId;
                    _e.label = 4;
                case 4:
                    dualControlRequired = args.riskLevel.toUpperCase() === "RED";
                    expiresAt = Date.now() + ((_c = args.expiresInMinutes) !== null && _c !== void 0 ? _c : 60) * 60 * 1000;
                    return [4 /*yield*/, ctx.db.get(args.requestorAgentId)];
                case 5:
                    requestor = _e.sent();
                    return [4 /*yield*/, (0, agentResolver_1.resolveAgentRef)({ db: ctx.db }, { agentId: args.requestorAgentId, createIfMissing: true })];
                case 6:
                    requestorRef = _e.sent();
                    if (!(requestorRef === null || requestorRef === void 0 ? void 0 : requestorRef.instanceId)) return [3 /*break*/, 8];
                    return [4 /*yield*/, ctx.db.get(requestorRef.instanceId)];
                case 7:
                    _a = _e.sent();
                    return [3 /*break*/, 9];
                case 8:
                    _a = null;
                    _e.label = 9;
                case 9:
                    requestorInstance = _a;
                    effectiveTenantId = (_d = requestor === null || requestor === void 0 ? void 0 : requestor.tenantId) !== null && _d !== void 0 ? _d : requestorInstance === null || requestorInstance === void 0 ? void 0 : requestorInstance.tenantId;
                    isLowRisk = args.riskLevel.toUpperCase() === "LOW" || args.riskLevel.toUpperCase() === "GREEN";
                    shouldAutoApprove = isLowRisk && !dualControlRequired;
                    return [4 /*yield*/, ctx.db.insert("approvals", {
                            projectId: projectId,
                            tenantId: effectiveTenantId,
                            idempotencyKey: args.idempotencyKey,
                            taskId: args.taskId,
                            toolCallId: args.toolCallId,
                            requestorAgentId: args.requestorAgentId,
                            actionType: args.actionType,
                            actionSummary: args.actionSummary,
                            riskLevel: args.riskLevel,
                            actionPayload: args.actionPayload,
                            estimatedCost: args.estimatedCost,
                            rollbackPlan: args.rollbackPlan,
                            justification: args.justification,
                            status: shouldAutoApprove ? "APPROVED" : "PENDING",
                            decidedAt: shouldAutoApprove ? Date.now() : undefined,
                            decidedByAgentId: shouldAutoApprove ? args.requestorAgentId : undefined,
                            decisionReason: shouldAutoApprove ? "Auto-approved (LOW risk)" : undefined,
                            expiresAt: expiresAt,
                            requiredDecisionCount: dualControlRequired ? 2 : 1,
                            decisionCount: shouldAutoApprove ? 1 : 0,
                            escalationLevel: 0,
                        })];
                case 10:
                    approvalId = _e.sent();
                    return [4 /*yield*/, ctx.db.insert("approvalRecords", {
                            tenantId: effectiveTenantId,
                            projectId: projectId,
                            instanceId: requestorRef === null || requestorRef === void 0 ? void 0 : requestorRef.instanceId,
                            versionId: requestorRef === null || requestorRef === void 0 ? void 0 : requestorRef.versionId,
                            legacyApprovalId: approvalId,
                            actionType: args.actionType,
                            riskLevel: args.riskLevel,
                            rollbackPlan: args.rollbackPlan,
                            justification: args.justification,
                            escalationLevel: 0,
                            status: "PENDING",
                            requestedAt: Date.now(),
                        })];
                case 11:
                    _e.sent();
                    return [4 /*yield*/, (0, armAudit_1.appendChangeRecord)(ctx.db, {
                            tenantId: effectiveTenantId,
                            projectId: projectId,
                            instanceId: requestorRef === null || requestorRef === void 0 ? void 0 : requestorRef.instanceId,
                            versionId: requestorRef === null || requestorRef === void 0 ? void 0 : requestorRef.versionId,
                            legacyAgentId: args.requestorAgentId,
                            type: "APPROVAL_REQUESTED",
                            summary: "Approval requested: ".concat(args.actionSummary),
                            payload: {
                                approvalId: approvalId,
                                actionType: args.actionType,
                                riskLevel: args.riskLevel,
                            },
                            relatedTable: "approvals",
                            relatedId: approvalId,
                        })];
                case 12:
                    changeRecordId = _e.sent();
                    return [4 /*yield*/, (0, armAudit_1.appendOpEvent)(ctx.db, {
                            tenantId: effectiveTenantId,
                            projectId: projectId,
                            instanceId: requestorRef === null || requestorRef === void 0 ? void 0 : requestorRef.instanceId,
                            versionId: requestorRef === null || requestorRef === void 0 ? void 0 : requestorRef.versionId,
                            taskId: args.taskId,
                            type: "DECISION_MADE",
                            changeRecordId: changeRecordId,
                            payload: {
                                stage: "REQUESTED",
                                approvalId: approvalId,
                                actionType: args.actionType,
                            },
                        })];
                case 13:
                    _e.sent();
                    agent = requestor;
                    return [4 /*yield*/, ctx.db.insert("activities", {
                            projectId: projectId,
                            actorType: "AGENT",
                            actorId: args.requestorAgentId.toString(),
                            action: "APPROVAL_REQUESTED",
                            description: "".concat((agent === null || agent === void 0 ? void 0 : agent.name) || "Agent", " requested approval for: ").concat(args.actionSummary),
                            targetType: "APPROVAL",
                            targetId: approvalId,
                            taskId: args.taskId,
                            agentId: args.requestorAgentId,
                            metadata: {
                                riskLevel: args.riskLevel,
                                dualControlRequired: dualControlRequired,
                            },
                        })];
                case 14:
                    _e.sent();
                    if (!args.taskId) return [3 /*break*/, 16];
                    return [4 /*yield*/, (0, taskEvents_1.logTaskEvent)(ctx, {
                            projectId: projectId,
                            taskId: args.taskId,
                            eventType: "APPROVAL_REQUESTED",
                            actorType: "AGENT",
                            actorId: args.requestorAgentId.toString(),
                            relatedId: approvalId,
                            metadata: {
                                actionType: args.actionType,
                                actionSummary: args.actionSummary,
                                riskLevel: args.riskLevel,
                                dualControlRequired: dualControlRequired,
                            },
                        })];
                case 15:
                    _e.sent();
                    _e.label = 16;
                case 16:
                    _b = {};
                    return [4 /*yield*/, ctx.db.get(approvalId)];
                case 17: return [2 /*return*/, (_b.approval = _e.sent(), _b.created = true, _b)];
            }
        });
    }); },
});
exports.approve = (0, server_1.mutation)({
    args: {
        approvalId: values_1.v.id("approvals"),
        decidedByAgentId: values_1.v.optional(values_1.v.id("agents")),
        decidedByUserId: values_1.v.optional(values_1.v.string()),
        reason: values_1.v.optional(values_1.v.string()),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var approval, now, decider, requiredDecisionCount, approvalRecord, requestorRef, requestorInstance, _a, effectiveTenantId, changeRecordId;
        var _b, _c;
        var _d, _e, _f, _g, _h;
        return __generator(this, function (_j) {
            switch (_j.label) {
                case 0: return [4 /*yield*/, ctx.db.get(args.approvalId)];
                case 1:
                    approval = _j.sent();
                    if (!approval) {
                        return [2 /*return*/, { success: false, error: "Approval not found" }];
                    }
                    if (!["PENDING", "ESCALATED"].includes(approval.status)) {
                        return [2 /*return*/, { success: false, error: "Approval already ".concat(approval.status) }];
                    }
                    now = Date.now();
                    if (!(now > approval.expiresAt)) return [3 /*break*/, 5];
                    return [4 /*yield*/, ctx.db.patch(args.approvalId, { status: "EXPIRED" })];
                case 2:
                    _j.sent();
                    if (!approval.taskId) return [3 /*break*/, 4];
                    return [4 /*yield*/, (0, taskEvents_1.logTaskEvent)(ctx, {
                            projectId: approval.projectId,
                            taskId: approval.taskId,
                            eventType: "APPROVAL_EXPIRED",
                            actorType: "SYSTEM",
                            relatedId: args.approvalId,
                            metadata: { reason: "expired_before_decision" },
                        })];
                case 3:
                    _j.sent();
                    _j.label = 4;
                case 4: return [2 /*return*/, { success: false, error: "Approval has expired" }];
                case 5:
                    decider = (_d = args.decidedByUserId) !== null && _d !== void 0 ? _d : (_e = args.decidedByAgentId) === null || _e === void 0 ? void 0 : _e.toString();
                    if (!decider) {
                        return [2 /*return*/, { success: false, error: "A deciding user or agent is required" }];
                    }
                    requiredDecisionCount = (_f = approval.requiredDecisionCount) !== null && _f !== void 0 ? _f : (approval.riskLevel === "RED" ? 2 : 1);
                    if (!(requiredDecisionCount > 1)) return [3 /*break*/, 12];
                    if (!!approval.firstDecisionAt) return [3 /*break*/, 11];
                    return [4 /*yield*/, ctx.db.patch(args.approvalId, {
                            firstDecisionByUserId: decider,
                            firstDecisionAt: now,
                            firstDecisionReason: args.reason,
                            decisionCount: 1,
                            status: approval.status,
                        })];
                case 6:
                    _j.sent();
                    return [4 /*yield*/, ctx.db.insert("activities", {
                            projectId: approval.projectId,
                            actorType: args.decidedByUserId ? "HUMAN" : "AGENT",
                            actorId: decider,
                            action: "APPROVAL_FIRST_APPROVAL",
                            description: "First approval recorded for: ".concat(approval.actionSummary),
                            targetType: "APPROVAL",
                            targetId: args.approvalId,
                            taskId: approval.taskId,
                            agentId: approval.requestorAgentId,
                            metadata: {
                                requiredDecisionCount: requiredDecisionCount,
                            },
                        })];
                case 7:
                    _j.sent();
                    if (!approval.taskId) return [3 /*break*/, 9];
                    return [4 /*yield*/, (0, taskEvents_1.logTaskEvent)(ctx, {
                            projectId: approval.projectId,
                            taskId: approval.taskId,
                            eventType: "APPROVAL_ESCALATED",
                            actorType: args.decidedByUserId ? "HUMAN" : "AGENT",
                            actorId: decider,
                            relatedId: args.approvalId,
                            metadata: {
                                phase: "first_approval",
                                requiredDecisionCount: requiredDecisionCount,
                            },
                        })];
                case 8:
                    _j.sent();
                    _j.label = 9;
                case 9:
                    _b = {
                        success: true,
                        pendingSecondDecision: true
                    };
                    return [4 /*yield*/, ctx.db.get(args.approvalId)];
                case 10: return [2 /*return*/, (_b.approval = _j.sent(),
                        _b)];
                case 11:
                    if (approval.firstDecisionByUserId === decider) {
                        return [2 /*return*/, {
                                success: false,
                                error: "Dual-control required: a different approver must provide the second decision",
                            }];
                    }
                    _j.label = 12;
                case 12: return [4 /*yield*/, ctx.db.patch(args.approvalId, {
                        status: "APPROVED",
                        decidedByAgentId: args.decidedByAgentId,
                        decidedByUserId: args.decidedByUserId,
                        decidedAt: now,
                        decisionReason: args.reason,
                        decisionCount: requiredDecisionCount > 1 ? 2 : 1,
                    })];
                case 13:
                    _j.sent();
                    return [4 /*yield*/, ctx.db
                            .query("approvalRecords")
                            .withIndex("by_legacy_approval", function (q) { return q.eq("legacyApprovalId", args.approvalId); })
                            .first()];
                case 14:
                    approvalRecord = _j.sent();
                    if (!approvalRecord) return [3 /*break*/, 16];
                    return [4 /*yield*/, ctx.db.patch(approvalRecord._id, {
                            status: "APPROVED",
                            decidedAt: now,
                            decisionReason: args.reason,
                        })];
                case 15:
                    _j.sent();
                    _j.label = 16;
                case 16: 
                // Log activity
                return [4 /*yield*/, ctx.db.insert("activities", {
                        projectId: approval.projectId,
                        actorType: args.decidedByUserId ? "HUMAN" : "AGENT",
                        actorId: decider,
                        action: "APPROVAL_APPROVED",
                        description: "Approval granted: ".concat(approval.actionSummary),
                        targetType: "APPROVAL",
                        targetId: args.approvalId,
                        taskId: approval.taskId,
                        agentId: approval.requestorAgentId,
                        metadata: {
                            requiredDecisionCount: requiredDecisionCount,
                        },
                    })];
                case 17:
                    // Log activity
                    _j.sent();
                    if (!approval.taskId) return [3 /*break*/, 19];
                    return [4 /*yield*/, (0, taskEvents_1.logTaskEvent)(ctx, {
                            projectId: approval.projectId,
                            taskId: approval.taskId,
                            eventType: "APPROVAL_APPROVED",
                            actorType: args.decidedByUserId ? "HUMAN" : "AGENT",
                            actorId: decider,
                            relatedId: args.approvalId,
                            metadata: {
                                requiredDecisionCount: requiredDecisionCount,
                                reason: args.reason,
                            },
                        })];
                case 18:
                    _j.sent();
                    _j.label = 19;
                case 19: return [4 /*yield*/, (0, agentResolver_1.resolveAgentRef)({ db: ctx.db }, { agentId: approval.requestorAgentId, createIfMissing: true })];
                case 20:
                    requestorRef = _j.sent();
                    if (!(requestorRef === null || requestorRef === void 0 ? void 0 : requestorRef.instanceId)) return [3 /*break*/, 22];
                    return [4 /*yield*/, ctx.db.get(requestorRef.instanceId)];
                case 21:
                    _a = _j.sent();
                    return [3 /*break*/, 23];
                case 22:
                    _a = null;
                    _j.label = 23;
                case 23:
                    requestorInstance = _a;
                    effectiveTenantId = (_g = approval.tenantId) !== null && _g !== void 0 ? _g : requestorInstance === null || requestorInstance === void 0 ? void 0 : requestorInstance.tenantId;
                    return [4 /*yield*/, (0, armAudit_1.appendChangeRecord)(ctx.db, {
                            tenantId: effectiveTenantId,
                            projectId: approval.projectId,
                            instanceId: requestorRef === null || requestorRef === void 0 ? void 0 : requestorRef.instanceId,
                            versionId: requestorRef === null || requestorRef === void 0 ? void 0 : requestorRef.versionId,
                            legacyAgentId: approval.requestorAgentId,
                            type: "APPROVAL_DECIDED",
                            summary: "Approval approved: ".concat(approval.actionSummary),
                            payload: {
                                approvalId: args.approvalId,
                                decision: "APPROVED",
                                decidedByUserId: args.decidedByUserId,
                                decidedByAgentId: args.decidedByAgentId,
                            },
                            relatedTable: "approvals",
                            relatedId: args.approvalId,
                        })];
                case 24:
                    changeRecordId = _j.sent();
                    return [4 /*yield*/, (0, armAudit_1.appendOpEvent)(ctx.db, {
                            tenantId: effectiveTenantId,
                            projectId: approval.projectId,
                            instanceId: requestorRef === null || requestorRef === void 0 ? void 0 : requestorRef.instanceId,
                            versionId: requestorRef === null || requestorRef === void 0 ? void 0 : requestorRef.versionId,
                            taskId: (_h = approval.taskId) !== null && _h !== void 0 ? _h : undefined,
                            type: "DECISION_MADE",
                            changeRecordId: changeRecordId,
                            payload: {
                                stage: "APPROVED",
                                approvalId: args.approvalId,
                            },
                        })];
                case 25:
                    _j.sent();
                    _c = { success: true };
                    return [4 /*yield*/, ctx.db.get(args.approvalId)];
                case 26: return [2 /*return*/, (_c.approval = _j.sent(), _c)];
            }
        });
    }); },
});
exports.deny = (0, server_1.mutation)({
    args: {
        approvalId: values_1.v.id("approvals"),
        decidedByAgentId: values_1.v.optional(values_1.v.id("agents")),
        decidedByUserId: values_1.v.optional(values_1.v.string()),
        reason: values_1.v.string(),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var approval, approvalRecord, requestorRef, requestorInstance, _a, effectiveTenantId, changeRecordId;
        var _b;
        var _c, _d, _e, _f, _g, _h, _j;
        return __generator(this, function (_k) {
            switch (_k.label) {
                case 0: return [4 /*yield*/, ctx.db.get(args.approvalId)];
                case 1:
                    approval = _k.sent();
                    if (!approval) {
                        return [2 /*return*/, { success: false, error: "Approval not found" }];
                    }
                    if (!["PENDING", "ESCALATED"].includes(approval.status)) {
                        return [2 /*return*/, { success: false, error: "Approval already ".concat(approval.status) }];
                    }
                    return [4 /*yield*/, ctx.db.patch(args.approvalId, {
                            status: "DENIED",
                            decidedByAgentId: args.decidedByAgentId,
                            decidedByUserId: args.decidedByUserId,
                            decidedAt: Date.now(),
                            decisionReason: args.reason,
                            decisionCount: ((_c = approval.decisionCount) !== null && _c !== void 0 ? _c : 0) + 1,
                        })];
                case 2:
                    _k.sent();
                    return [4 /*yield*/, ctx.db
                            .query("approvalRecords")
                            .withIndex("by_legacy_approval", function (q) { return q.eq("legacyApprovalId", args.approvalId); })
                            .first()];
                case 3:
                    approvalRecord = _k.sent();
                    if (!approvalRecord) return [3 /*break*/, 5];
                    return [4 /*yield*/, ctx.db.patch(approvalRecord._id, {
                            status: "DENIED",
                            decidedAt: Date.now(),
                            decisionReason: args.reason,
                        })];
                case 4:
                    _k.sent();
                    _k.label = 5;
                case 5: 
                // Log activity
                return [4 /*yield*/, ctx.db.insert("activities", {
                        projectId: approval.projectId,
                        actorType: args.decidedByUserId ? "HUMAN" : "AGENT",
                        actorId: (_d = args.decidedByUserId) !== null && _d !== void 0 ? _d : (_e = args.decidedByAgentId) === null || _e === void 0 ? void 0 : _e.toString(),
                        action: "APPROVAL_DENIED",
                        description: "Approval denied: ".concat(approval.actionSummary, " \u2014 ").concat(args.reason),
                        targetType: "APPROVAL",
                        targetId: args.approvalId,
                        taskId: approval.taskId,
                        agentId: approval.requestorAgentId,
                    })];
                case 6:
                    // Log activity
                    _k.sent();
                    if (!approval.taskId) return [3 /*break*/, 8];
                    return [4 /*yield*/, (0, taskEvents_1.logTaskEvent)(ctx, {
                            projectId: approval.projectId,
                            taskId: approval.taskId,
                            eventType: "APPROVAL_DENIED",
                            actorType: args.decidedByUserId ? "HUMAN" : "AGENT",
                            actorId: (_f = args.decidedByUserId) !== null && _f !== void 0 ? _f : (_g = args.decidedByAgentId) === null || _g === void 0 ? void 0 : _g.toString(),
                            relatedId: args.approvalId,
                            metadata: {
                                reason: args.reason,
                            },
                        })];
                case 7:
                    _k.sent();
                    _k.label = 8;
                case 8: return [4 /*yield*/, (0, agentResolver_1.resolveAgentRef)({ db: ctx.db }, { agentId: approval.requestorAgentId, createIfMissing: true })];
                case 9:
                    requestorRef = _k.sent();
                    if (!(requestorRef === null || requestorRef === void 0 ? void 0 : requestorRef.instanceId)) return [3 /*break*/, 11];
                    return [4 /*yield*/, ctx.db.get(requestorRef.instanceId)];
                case 10:
                    _a = _k.sent();
                    return [3 /*break*/, 12];
                case 11:
                    _a = null;
                    _k.label = 12;
                case 12:
                    requestorInstance = _a;
                    effectiveTenantId = (_h = approval.tenantId) !== null && _h !== void 0 ? _h : requestorInstance === null || requestorInstance === void 0 ? void 0 : requestorInstance.tenantId;
                    return [4 /*yield*/, (0, armAudit_1.appendChangeRecord)(ctx.db, {
                            tenantId: effectiveTenantId,
                            projectId: approval.projectId,
                            instanceId: requestorRef === null || requestorRef === void 0 ? void 0 : requestorRef.instanceId,
                            versionId: requestorRef === null || requestorRef === void 0 ? void 0 : requestorRef.versionId,
                            legacyAgentId: approval.requestorAgentId,
                            type: "APPROVAL_DECIDED",
                            summary: "Approval denied: ".concat(approval.actionSummary),
                            payload: {
                                approvalId: args.approvalId,
                                decision: "DENIED",
                                reason: args.reason,
                            },
                            relatedTable: "approvals",
                            relatedId: args.approvalId,
                        })];
                case 13:
                    changeRecordId = _k.sent();
                    return [4 /*yield*/, (0, armAudit_1.appendOpEvent)(ctx.db, {
                            tenantId: effectiveTenantId,
                            projectId: approval.projectId,
                            instanceId: requestorRef === null || requestorRef === void 0 ? void 0 : requestorRef.instanceId,
                            versionId: requestorRef === null || requestorRef === void 0 ? void 0 : requestorRef.versionId,
                            taskId: (_j = approval.taskId) !== null && _j !== void 0 ? _j : undefined,
                            type: "DECISION_MADE",
                            changeRecordId: changeRecordId,
                            payload: {
                                stage: "DENIED",
                                approvalId: args.approvalId,
                            },
                        })];
                case 14:
                    _k.sent();
                    _b = { success: true };
                    return [4 /*yield*/, ctx.db.get(args.approvalId)];
                case 15: return [2 /*return*/, (_b.approval = _k.sent(), _b)];
            }
        });
    }); },
});
exports.cancel = (0, server_1.mutation)({
    args: {
        approvalId: values_1.v.id("approvals"),
        reason: values_1.v.optional(values_1.v.string()),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var approval;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, ctx.db.get(args.approvalId)];
                case 1:
                    approval = _b.sent();
                    if (!approval) {
                        return [2 /*return*/, { success: false, error: "Approval not found" }];
                    }
                    if (!["PENDING", "ESCALATED"].includes(approval.status)) {
                        return [2 /*return*/, { success: false, error: "Approval already ".concat(approval.status) }];
                    }
                    return [4 /*yield*/, ctx.db.patch(args.approvalId, {
                            status: "CANCELED",
                            decisionReason: args.reason,
                        })];
                case 2:
                    _b.sent();
                    _a = { success: true };
                    return [4 /*yield*/, ctx.db.get(args.approvalId)];
                case 3: return [2 /*return*/, (_a.approval = _b.sent(), _a)];
            }
        });
    }); },
});
exports.expireStale = (0, server_1.mutation)({
    args: {},
    handler: function (ctx) { return __awaiter(void 0, void 0, void 0, function () {
        var now, pendingApprovals, expired, _i, pendingApprovals_1, approval;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    now = Date.now();
                    return [4 /*yield*/, queryPendingLike(ctx, {
                            limit: 10000,
                        })];
                case 1:
                    pendingApprovals = _a.sent();
                    expired = 0;
                    _i = 0, pendingApprovals_1 = pendingApprovals;
                    _a.label = 2;
                case 2:
                    if (!(_i < pendingApprovals_1.length)) return [3 /*break*/, 6];
                    approval = pendingApprovals_1[_i];
                    if (!(now > approval.expiresAt)) return [3 /*break*/, 5];
                    return [4 /*yield*/, ctx.db.patch(approval._id, { status: "EXPIRED" })];
                case 3:
                    _a.sent();
                    expired++;
                    if (!approval.taskId) return [3 /*break*/, 5];
                    return [4 /*yield*/, (0, taskEvents_1.logTaskEvent)(ctx, {
                            projectId: approval.projectId,
                            taskId: approval.taskId,
                            eventType: "APPROVAL_EXPIRED",
                            actorType: "SYSTEM",
                            relatedId: approval._id,
                            metadata: {
                                reason: "stale_expiration_cron",
                            },
                        })];
                case 4:
                    _a.sent();
                    _a.label = 5;
                case 5:
                    _i++;
                    return [3 /*break*/, 2];
                case 6: return [2 /*return*/, { expired: expired }];
            }
        });
    }); },
});
exports.escalateOverdue = (0, server_1.mutation)({
    args: {
        projectId: values_1.v.optional(values_1.v.id("projects")),
        slaMinutes: values_1.v.optional(values_1.v.number()),
        escalatedBy: values_1.v.optional(values_1.v.string()),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var now, slaMs, pending, _a, escalated, _i, pending_2, approval, ageMs, nextLevel;
        var _b, _c, _d, _e, _f, _g;
        return __generator(this, function (_h) {
            switch (_h.label) {
                case 0:
                    now = Date.now();
                    slaMs = ((_b = args.slaMinutes) !== null && _b !== void 0 ? _b : 30) * 60 * 1000;
                    if (!args.projectId) return [3 /*break*/, 2];
                    return [4 /*yield*/, ctx.db
                            .query("approvals")
                            .withIndex("by_project_status", function (q) { return q.eq("projectId", args.projectId).eq("status", "PENDING"); })
                            .collect()];
                case 1:
                    _a = _h.sent();
                    return [3 /*break*/, 4];
                case 2: return [4 /*yield*/, ctx.db
                        .query("approvals")
                        .withIndex("by_status", function (q) { return q.eq("status", "PENDING"); })
                        .collect()];
                case 3:
                    _a = _h.sent();
                    _h.label = 4;
                case 4:
                    pending = _a;
                    escalated = 0;
                    _i = 0, pending_2 = pending;
                    _h.label = 5;
                case 5:
                    if (!(_i < pending_2.length)) return [3 /*break*/, 11];
                    approval = pending_2[_i];
                    ageMs = now - approval._creationTime;
                    if (ageMs < slaMs || now > approval.expiresAt) {
                        return [3 /*break*/, 10];
                    }
                    nextLevel = ((_c = approval.escalationLevel) !== null && _c !== void 0 ? _c : 0) + 1;
                    return [4 /*yield*/, ctx.db.patch(approval._id, {
                            status: "ESCALATED",
                            escalatedAt: now,
                            escalatedBy: (_d = args.escalatedBy) !== null && _d !== void 0 ? _d : "system",
                            escalationReason: "Approval open for ".concat(Math.round(ageMs / 60000), " minutes"),
                            escalationLevel: nextLevel,
                        })];
                case 6:
                    _h.sent();
                    return [4 /*yield*/, ctx.db.insert("activities", {
                            projectId: approval.projectId,
                            actorType: "SYSTEM",
                            actorId: (_e = args.escalatedBy) !== null && _e !== void 0 ? _e : "system",
                            action: "APPROVAL_ESCALATED",
                            description: "Approval escalated (level ".concat(nextLevel, "): ").concat(approval.actionSummary),
                            targetType: "APPROVAL",
                            targetId: approval._id,
                            taskId: approval.taskId,
                            agentId: approval.requestorAgentId,
                            metadata: {
                                level: nextLevel,
                                ageMinutes: Math.round(ageMs / 60000),
                            },
                        })];
                case 7:
                    _h.sent();
                    if (!approval.taskId) return [3 /*break*/, 9];
                    return [4 /*yield*/, (0, taskEvents_1.logTaskEvent)(ctx, {
                            projectId: approval.projectId,
                            taskId: approval.taskId,
                            eventType: "APPROVAL_ESCALATED",
                            actorType: "SYSTEM",
                            actorId: (_f = args.escalatedBy) !== null && _f !== void 0 ? _f : "system",
                            relatedId: approval._id,
                            metadata: {
                                level: nextLevel,
                                ageMinutes: Math.round(ageMs / 60000),
                            },
                        })];
                case 8:
                    _h.sent();
                    _h.label = 9;
                case 9:
                    escalated += 1;
                    _h.label = 10;
                case 10:
                    _i++;
                    return [3 /*break*/, 5];
                case 11: return [2 /*return*/, { escalated: escalated, slaMinutes: (_g = args.slaMinutes) !== null && _g !== void 0 ? _g : 30 }];
            }
        });
    }); },
});
