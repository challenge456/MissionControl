"use strict";
/**
 * Telegram Integration — Convex Functions
 *
 * Functions for sending notifications and CEO briefs to Telegram.
 * Called by crons and mutations.
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
exports.notifyLoopDetected = exports.notifyBudgetExceeded = exports.notifyApprovalPending = exports.prepareDailyCEOBrief = exports.formatCEOBrief = exports.generateCEOBriefData = void 0;
var values_1 = require("convex/values");
var server_1 = require("./_generated/server");
var api_1 = require("./_generated/api");
// ============================================================================
// INTERNAL QUERIES
// ============================================================================
/**
 * Generate CEO brief data for all projects.
 */
exports.generateCEOBriefData = (0, server_1.internalQuery)({
    args: {},
    handler: function (ctx) { return __awaiter(void 0, void 0, void 0, function () {
        var projects, briefs, _loop_1, _i, projects_1, project;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, ctx.db.query("projects").collect()];
                case 1:
                    projects = _a.sent();
                    briefs = [];
                    _loop_1 = function (project) {
                        var stats, agents, pendingApprovals, byStatus, burnRateToday, nextActions;
                        return __generator(this, function (_b) {
                            switch (_b.label) {
                                case 0: return [4 /*yield*/, ctx.db
                                        .query("tasks")
                                        .withIndex("by_project", function (q) { return q.eq("projectId", project._id); })
                                        .collect()];
                                case 1:
                                    stats = _b.sent();
                                    return [4 /*yield*/, ctx.db
                                            .query("agents")
                                            .withIndex("by_project", function (q) { return q.eq("projectId", project._id); })
                                            .collect()];
                                case 2:
                                    agents = _b.sent();
                                    return [4 /*yield*/, ctx.db
                                            .query("approvals")
                                            .withIndex("by_project_status", function (q) {
                                            return q.eq("projectId", project._id).eq("status", "PENDING");
                                        })
                                            .collect()];
                                case 3:
                                    pendingApprovals = _b.sent();
                                    byStatus = function (status) { return stats.filter(function (t) { return t.status === status; }).length; };
                                    burnRateToday = agents.reduce(function (sum, a) { return sum + a.spendToday; }, 0);
                                    nextActions = stats
                                        .filter(function (t) { return ["INBOX", "ASSIGNED", "REVIEW"].includes(t.status); })
                                        .sort(function (a, b) { return a.priority - b.priority; })
                                        .slice(0, 3);
                                    briefs.push({
                                        project: {
                                            id: project._id,
                                            name: project.name,
                                            slug: project.slug,
                                        },
                                        tasks: {
                                            completed: byStatus("DONE"),
                                            inProgress: byStatus("IN_PROGRESS"),
                                            blocked: byStatus("BLOCKED"),
                                            review: byStatus("REVIEW"),
                                            needsApproval: byStatus("NEEDS_APPROVAL"),
                                        },
                                        approvals: {
                                            pending: pendingApprovals.length,
                                        },
                                        burnRate: {
                                            today: burnRateToday,
                                        },
                                        nextActions: nextActions.map(function (t) { return ({
                                            id: t._id,
                                            title: t.title,
                                            status: t.status,
                                            priority: t.priority,
                                        }); }),
                                    });
                                    return [2 /*return*/];
                            }
                        });
                    };
                    _i = 0, projects_1 = projects;
                    _a.label = 2;
                case 2:
                    if (!(_i < projects_1.length)) return [3 /*break*/, 5];
                    project = projects_1[_i];
                    return [5 /*yield**/, _loop_1(project)];
                case 3:
                    _a.sent();
                    _a.label = 4;
                case 4:
                    _i++;
                    return [3 /*break*/, 2];
                case 5: return [2 /*return*/, { briefs: briefs, generatedAt: Date.now() }];
            }
        });
    }); },
});
/**
 * Format CEO brief as Telegram message.
 */
exports.formatCEOBrief = (0, server_1.internalQuery)({
    args: { briefData: values_1.v.any() },
    handler: function (_ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var _a, briefs, generatedAt, date, message, _i, briefs_1, brief, i, action, priorityEmoji;
        return __generator(this, function (_b) {
            _a = args.briefData, briefs = _a.briefs, generatedAt = _a.generatedAt;
            date = new Date(generatedAt).toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
            });
            message = "\uD83D\uDCCA **Daily CEO Brief** \u2014 ".concat(date, "\n\n");
            for (_i = 0, briefs_1 = briefs; _i < briefs_1.length; _i++) {
                brief = briefs_1[_i];
                message += "**".concat(brief.project.name, "**\n");
                message += "\u2705 Completed: ".concat(brief.tasks.completed, "\n");
                message += "\uD83D\uDD04 In Progress: ".concat(brief.tasks.inProgress, "\n");
                message += "\uD83D\uDEAB Blocked: ".concat(brief.tasks.blocked, "\n");
                message += "\uD83D\uDC40 Review: ".concat(brief.tasks.review, "\n");
                message += "\u23F3 Needs Approval: ".concat(brief.tasks.needsApproval, "\n");
                message += "\uD83D\uDCCB Approvals Pending: ".concat(brief.approvals.pending, "\n");
                message += "\uD83D\uDCB0 Burn Rate: $".concat(brief.burnRate.today.toFixed(2), "\n\n");
                if (brief.nextActions.length > 0) {
                    message += "\uD83C\uDFAF **Top ".concat(brief.nextActions.length, " Next Actions:**\n");
                    for (i = 0; i < brief.nextActions.length; i++) {
                        action = brief.nextActions[i];
                        priorityEmoji = action.priority === 1 ? "🔴" : action.priority === 2 ? "🟠" : "🔵";
                        message += "".concat(i + 1, ". ").concat(priorityEmoji, " ").concat(action.title, " (").concat(action.status, ")\n");
                    }
                }
                message += "\n---\n\n";
            }
            return [2 /*return*/, message];
        });
    }); },
});
// ============================================================================
// INTERNAL MUTATIONS (Called by Crons or External Service)
// ============================================================================
/**
 * Send daily CEO brief to Telegram.
 * Called by cron job.
 *
 * Note: This mutation prepares the data. The actual Telegram send
 * should be done by the telegram-bot service polling this data or
 * via HTTP action if Convex supports it.
 */
exports.prepareDailyCEOBrief = (0, server_1.internalMutation)({
    args: {},
    handler: function (ctx) { return __awaiter(void 0, void 0, void 0, function () {
        var briefData, message;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, ctx.runQuery(api_1.internal.telegram.generateCEOBriefData)];
                case 1:
                    briefData = _a.sent();
                    return [4 /*yield*/, ctx.runQuery(api_1.internal.telegram.formatCEOBrief, { briefData: briefData })];
                case 2:
                    message = _a.sent();
                    // Store in activities for audit
                    return [4 /*yield*/, ctx.db.insert("activities", {
                            actorType: "SYSTEM",
                            action: "CEO_BRIEF_GENERATED",
                            description: "Daily CEO brief generated",
                            targetType: "REPORT",
                            metadata: { briefData: briefData, generatedAt: Date.now() },
                        })];
                case 3:
                    // Store in activities for audit
                    _a.sent();
                    // Store message for telegram-bot to poll
                    return [4 /*yield*/, ctx.db.insert("notifications", {
                            agentId: null, // System notification
                            type: "SYSTEM",
                            title: "Daily CEO Brief",
                            body: message,
                            metadata: { isCEOBrief: true, generatedAt: Date.now() },
                        })];
                case 4:
                    // Store message for telegram-bot to poll
                    _a.sent();
                    return [2 /*return*/, { success: true, message: message }];
            }
        });
    }); },
});
/**
 * Send notification for approval request.
 */
exports.notifyApprovalPending = (0, server_1.internalMutation)({
    args: {
        approvalId: values_1.v.id("approvals"),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var approval, agent, message;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, ctx.db.get(args.approvalId)];
                case 1:
                    approval = _a.sent();
                    if (!approval)
                        return [2 /*return*/, { success: false }];
                    return [4 /*yield*/, ctx.db.get(approval.requestorAgentId)];
                case 2:
                    agent = _a.sent();
                    message = ("\u23F3 **Approval Required**\n\n" +
                        "".concat(approval.actionSummary, "\n") +
                        "Requested by: ".concat((agent === null || agent === void 0 ? void 0 : agent.name) || "Unknown", "\n") +
                        "Risk: ".concat(approval.riskLevel, "\n") +
                        "ID: ".concat(args.approvalId.slice(-6), "\n\n") +
                        "/approve ".concat(args.approvalId.slice(-6), " or /deny ").concat(args.approvalId.slice(-6), " <reason>"));
                    // Store notification for polling
                    return [4 /*yield*/, ctx.db.insert("notifications", {
                            agentId: null, // System notification
                            type: "APPROVAL_REQUESTED",
                            title: "Approval Required",
                            body: message,
                            approvalId: args.approvalId,
                            metadata: { isTelegramNotification: true },
                        })];
                case 3:
                    // Store notification for polling
                    _a.sent();
                    return [2 /*return*/, { success: true }];
            }
        });
    }); },
});
/**
 * Send notification for budget exceeded.
 */
exports.notifyBudgetExceeded = (0, server_1.internalMutation)({
    args: {
        agentId: values_1.v.id("agents"),
        taskId: values_1.v.optional(values_1.v.id("tasks")),
        spendToday: values_1.v.number(),
        budgetDaily: values_1.v.number(),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var agent, task, _a, message;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, ctx.db.get(args.agentId)];
                case 1:
                    agent = _b.sent();
                    if (!args.taskId) return [3 /*break*/, 3];
                    return [4 /*yield*/, ctx.db.get(args.taskId)];
                case 2:
                    _a = _b.sent();
                    return [3 /*break*/, 4];
                case 3:
                    _a = null;
                    _b.label = 4;
                case 4:
                    task = _a;
                    message = ("\uD83D\uDCB0 **Budget Exceeded**\n\n" +
                        "Agent: ".concat((agent === null || agent === void 0 ? void 0 : agent.name) || "Unknown", "\n") +
                        "Spend: $".concat(args.spendToday.toFixed(2), " / $").concat(args.budgetDaily.toFixed(2), "\n") +
                        (task ? "Task: ".concat(task.title, "\n") : "") +
                        "\nAgent has been paused. Use /resume_squad to resume.");
                    // Store notification
                    return [4 /*yield*/, ctx.db.insert("notifications", {
                            agentId: args.agentId,
                            type: "SYSTEM",
                            title: "Budget Exceeded",
                            body: message,
                            taskId: args.taskId,
                            metadata: { isTelegramNotification: true },
                        })];
                case 5:
                    // Store notification
                    _b.sent();
                    return [2 /*return*/, { success: true }];
            }
        });
    }); },
});
/**
 * Send notification for loop detected.
 */
exports.notifyLoopDetected = (0, server_1.internalMutation)({
    args: {
        taskId: values_1.v.id("tasks"),
        loopType: values_1.v.string(),
        count: values_1.v.number(),
        threshold: values_1.v.number(),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var task, message;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, ctx.db.get(args.taskId)];
                case 1:
                    task = _a.sent();
                    message = ("\uD83D\uDD04 **Loop Detected**\n\n" +
                        "Task: ".concat((task === null || task === void 0 ? void 0 : task.title) || "Unknown", "\n") +
                        "Type: ".concat(args.loopType, "\n") +
                        "Count: ".concat(args.count, " (threshold: ").concat(args.threshold, ")\n") +
                        "\nTask has been blocked. Review and unblock manually.");
                    // Store notification
                    return [4 /*yield*/, ctx.db.insert("notifications", {
                            agentId: null,
                            type: "SYSTEM",
                            title: "Loop Detected",
                            body: message,
                            taskId: args.taskId,
                            metadata: { isTelegramNotification: true },
                        })];
                case 2:
                    // Store notification
                    _a.sent();
                    return [2 /*return*/, { success: true }];
            }
        });
    }); },
});
