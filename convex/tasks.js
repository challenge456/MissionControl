"use strict";
/**
 * Tasks — Convex Functions
 *
 * Core task operations with state machine enforcement.
 * task.status can ONLY change through the transition function.
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
exports.update = exports.assign = exports.transition = exports.create = exports.simulateExecutionPlan = exports.simulateTransition = exports.getUnifiedTimeline = exports.getWithTimeline = exports.exportIncidentReport = exports.search = exports.updateThreadRef = exports.getAllowedTransitionsForHuman = exports.listByAgent = exports.listAll = exports.listByStatus = exports.list = exports.get = void 0;
var values_1 = require("convex/values");
var server_1 = require("./_generated/server");
var api_1 = require("./_generated/api");
var taskEvents_1 = require("./lib/taskEvents");
var operatorControls_1 = require("./lib/operatorControls");
var sanitize_1 = require("./lib/sanitize");
var agentResolver_1 = require("./lib/agentResolver");
var armAudit_1 = require("./lib/armAudit");
var armCompat_1 = require("./lib/armCompat");
var taskStatusValidator = values_1.v.union(values_1.v.literal("INBOX"), values_1.v.literal("ASSIGNED"), values_1.v.literal("IN_PROGRESS"), values_1.v.literal("REVIEW"), values_1.v.literal("NEEDS_APPROVAL"), values_1.v.literal("BLOCKED"), values_1.v.literal("FAILED"), values_1.v.literal("DONE"), values_1.v.literal("CANCELED"));
var taskTypeValidator = values_1.v.union(values_1.v.literal("CONTENT"), values_1.v.literal("SOCIAL"), values_1.v.literal("EMAIL_MARKETING"), values_1.v.literal("CUSTOMER_RESEARCH"), values_1.v.literal("SEO_RESEARCH"), values_1.v.literal("ENGINEERING"), values_1.v.literal("DOCS"), values_1.v.literal("OPS"));
var TRANSITION_RULES = [
    // FROM INBOX
    { from: "INBOX", to: "ASSIGNED", allowedActors: ["AGENT", "HUMAN", "SYSTEM"] },
    { from: "INBOX", to: "CANCELED", allowedActors: ["HUMAN"] },
    // FROM ASSIGNED
    { from: "ASSIGNED", to: "IN_PROGRESS", allowedActors: ["AGENT", "HUMAN"], requiresWorkPlan: true },
    { from: "ASSIGNED", to: "INBOX", allowedActors: ["HUMAN"] },
    { from: "ASSIGNED", to: "CANCELED", allowedActors: ["HUMAN"] },
    // FROM IN_PROGRESS
    { from: "IN_PROGRESS", to: "REVIEW", allowedActors: ["AGENT", "HUMAN"], requiresDeliverable: true, requiresChecklist: true },
    { from: "IN_PROGRESS", to: "BLOCKED", allowedActors: ["AGENT", "HUMAN", "SYSTEM"] },
    { from: "IN_PROGRESS", to: "NEEDS_APPROVAL", allowedActors: ["SYSTEM"] },
    { from: "IN_PROGRESS", to: "CANCELED", allowedActors: ["HUMAN"] },
    // FROM REVIEW
    { from: "REVIEW", to: "IN_PROGRESS", allowedActors: ["AGENT", "HUMAN"] }, // Revisions
    { from: "REVIEW", to: "DONE", allowedActors: ["HUMAN"], humanOnly: true },
    { from: "REVIEW", to: "BLOCKED", allowedActors: ["HUMAN", "SYSTEM"] },
    { from: "REVIEW", to: "NEEDS_APPROVAL", allowedActors: ["HUMAN", "SYSTEM"] },
    { from: "REVIEW", to: "CANCELED", allowedActors: ["HUMAN"] },
    // FROM NEEDS_APPROVAL
    { from: "NEEDS_APPROVAL", to: "INBOX", allowedActors: ["HUMAN"] },
    { from: "NEEDS_APPROVAL", to: "ASSIGNED", allowedActors: ["HUMAN"] },
    { from: "NEEDS_APPROVAL", to: "IN_PROGRESS", allowedActors: ["HUMAN"] },
    { from: "NEEDS_APPROVAL", to: "REVIEW", allowedActors: ["HUMAN"] },
    { from: "NEEDS_APPROVAL", to: "BLOCKED", allowedActors: ["HUMAN", "SYSTEM"] },
    { from: "NEEDS_APPROVAL", to: "DONE", allowedActors: ["HUMAN"] },
    { from: "NEEDS_APPROVAL", to: "CANCELED", allowedActors: ["HUMAN"] },
    // FROM BLOCKED
    { from: "BLOCKED", to: "ASSIGNED", allowedActors: ["HUMAN"] },
    { from: "BLOCKED", to: "IN_PROGRESS", allowedActors: ["HUMAN"] },
    { from: "BLOCKED", to: "NEEDS_APPROVAL", allowedActors: ["HUMAN", "SYSTEM"] },
    { from: "BLOCKED", to: "CANCELED", allowedActors: ["HUMAN"] },
    // FROM IN_PROGRESS to FAILED (agent or system detects unrecoverable failure)
    { from: "IN_PROGRESS", to: "FAILED", allowedActors: ["AGENT", "SYSTEM"] },
    // FROM FAILED — human can retry or cancel
    { from: "FAILED", to: "INBOX", allowedActors: ["HUMAN"] },
    { from: "FAILED", to: "ASSIGNED", allowedActors: ["HUMAN"] },
    { from: "FAILED", to: "CANCELED", allowedActors: ["HUMAN"] },
    // DONE, CANCELED are terminal — no transitions out
];
function findTransitionRule(from, to) {
    return TRANSITION_RULES.find(function (r) { return r.from === from && r.to === to; });
}
function resolveAssigneeInstanceIds(ctx, assigneeIds) {
    return __awaiter(this, void 0, void 0, function () {
        var resolved;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, Promise.all(assigneeIds.map(function (agentId) {
                        return (0, agentResolver_1.resolveAgentRef)({ db: ctx.db }, { agentId: agentId, createIfMissing: true });
                    }))];
                case 1:
                    resolved = _a.sent();
                    return [2 /*return*/, resolved
                            .filter(function (entry) { return entry !== null; })
                            .map(function (entry) { return entry.instanceId; })];
            }
        });
    });
}
// ============================================================================
// QUERIES
// ============================================================================
exports.get = (0, server_1.query)({
    args: { taskId: values_1.v.id("tasks") },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, ctx.db.get(args.taskId)];
                case 1: return [2 /*return*/, _a.sent()];
            }
        });
    }); },
});
/** List tasks, optionally filtered by project */
exports.list = (0, server_1.query)({
    args: {
        projectId: values_1.v.optional(values_1.v.id("projects")),
        limit: values_1.v.optional(values_1.v.number()),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var limit;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    limit = (_a = args.limit) !== null && _a !== void 0 ? _a : 200;
                    if (!args.projectId) return [3 /*break*/, 2];
                    return [4 /*yield*/, ctx.db
                            .query("tasks")
                            .withIndex("by_project", function (q) { return q.eq("projectId", args.projectId); })
                            .order("desc")
                            .take(limit)];
                case 1: return [2 /*return*/, _b.sent()];
                case 2: return [4 /*yield*/, ctx.db.query("tasks").order("desc").take(limit)];
                case 3: return [2 /*return*/, _b.sent()];
            }
        });
    }); },
});
exports.listByStatus = (0, server_1.query)({
    args: {
        projectId: values_1.v.optional(values_1.v.id("projects")),
        status: values_1.v.optional(taskStatusValidator),
        limit: values_1.v.optional(values_1.v.number()),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var limit;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    limit = (_a = args.limit) !== null && _a !== void 0 ? _a : 100;
                    if (!args.projectId) return [3 /*break*/, 4];
                    if (!args.status) return [3 /*break*/, 2];
                    return [4 /*yield*/, ctx.db
                            .query("tasks")
                            .withIndex("by_project_status", function (q) {
                            return q.eq("projectId", args.projectId).eq("status", args.status);
                        })
                            .order("desc")
                            .take(limit)];
                case 1: return [2 /*return*/, _b.sent()];
                case 2: return [4 /*yield*/, ctx.db
                        .query("tasks")
                        .withIndex("by_project", function (q) { return q.eq("projectId", args.projectId); })
                        .order("desc")
                        .take(limit)];
                case 3: return [2 /*return*/, _b.sent()];
                case 4:
                    if (!args.status) return [3 /*break*/, 6];
                    return [4 /*yield*/, ctx.db
                            .query("tasks")
                            .withIndex("by_status", function (q) { return q.eq("status", args.status); })
                            .order("desc")
                            .take(limit)];
                case 5: return [2 /*return*/, _b.sent()];
                case 6: return [4 /*yield*/, ctx.db.query("tasks").order("desc").take(limit)];
                case 7: return [2 /*return*/, _b.sent()];
            }
        });
    }); },
});
var LIST_ALL_CAP = 3000;
exports.listAll = (0, server_1.query)({
    args: {
        projectId: values_1.v.optional(values_1.v.id("projects")),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!args.projectId) return [3 /*break*/, 2];
                    return [4 /*yield*/, ctx.db
                            .query("tasks")
                            .withIndex("by_project", function (q) { return q.eq("projectId", args.projectId); })
                            .order("desc")
                            .take(LIST_ALL_CAP)];
                case 1: return [2 /*return*/, _a.sent()];
                case 2: return [4 /*yield*/, ctx.db
                        .query("tasks")
                        .order("desc")
                        .take(LIST_ALL_CAP)];
                case 3: return [2 /*return*/, _a.sent()];
            }
        });
    }); },
});
/** List tasks assigned to a specific agent */
exports.listByAgent = (0, server_1.query)({
    args: {
        agentId: values_1.v.id("agents"),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var tasks, resolved_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, ctx.db.query("tasks").take(500)];
                case 1:
                    tasks = _a.sent();
                    if (!(0, armCompat_1.preferInstanceRefs)()) return [3 /*break*/, 3];
                    return [4 /*yield*/, (0, agentResolver_1.resolveAgentRef)({ db: ctx.db }, { agentId: args.agentId, createIfMissing: false })];
                case 2:
                    resolved_1 = _a.sent();
                    if (resolved_1) {
                        return [2 /*return*/, tasks.filter(function (task) { var _a; return ((_a = task.assigneeInstanceIds) !== null && _a !== void 0 ? _a : []).includes(resolved_1.instanceId); })];
                    }
                    _a.label = 3;
                case 3: return [2 /*return*/, tasks.filter(function (task) { return task.assigneeIds && task.assigneeIds.includes(args.agentId); })];
            }
        });
    }); },
});
/** Allowed toStatus values for actor HUMAN per fromStatus (for UI "Move to" menu) */
exports.getAllowedTransitionsForHuman = (0, server_1.query)({
    args: {},
    handler: function () { return __awaiter(void 0, void 0, void 0, function () {
        var map, _i, TRANSITION_RULES_1, r;
        return __generator(this, function (_a) {
            map = {};
            for (_i = 0, TRANSITION_RULES_1 = TRANSITION_RULES; _i < TRANSITION_RULES_1.length; _i++) {
                r = TRANSITION_RULES_1[_i];
                if (r.allowedActors.includes("HUMAN")) {
                    if (!map[r.from])
                        map[r.from] = [];
                    map[r.from].push(r.to);
                }
            }
            return [2 /*return*/, map];
        });
    }); },
});
/** Update task threadRef (for Telegram thread-per-task) */
exports.updateThreadRef = (0, server_1.mutation)({
    args: {
        taskId: values_1.v.id("tasks"),
        chatId: values_1.v.string(),
        threadId: values_1.v.string(),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, ctx.db.patch(args.taskId, {
                        threadRef: { chatId: args.chatId, threadId: args.threadId },
                    })];
                case 1:
                    _a.sent();
                    return [2 /*return*/, { success: true }];
            }
        });
    }); },
});
/** Search tasks by title and description */
exports.search = (0, server_1.query)({
    args: {
        projectId: values_1.v.optional(values_1.v.id("projects")),
        query: values_1.v.string(),
        limit: values_1.v.optional(values_1.v.number()),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var limit, tasks, query, filtered;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    limit = (_a = args.limit) !== null && _a !== void 0 ? _a : 50;
                    if (!args.projectId) return [3 /*break*/, 2];
                    return [4 /*yield*/, ctx.db
                            .query("tasks")
                            .withIndex("by_project", function (q) { return q.eq("projectId", args.projectId); })
                            .collect()];
                case 1:
                    tasks = _b.sent();
                    return [3 /*break*/, 4];
                case 2: return [4 /*yield*/, ctx.db.query("tasks").collect()];
                case 3:
                    tasks = _b.sent();
                    _b.label = 4;
                case 4:
                    query = args.query.toLowerCase();
                    filtered = tasks.filter(function (t) {
                        return t.title.toLowerCase().includes(query) ||
                            (t.description && t.description.toLowerCase().includes(query)) ||
                            (t.labels && t.labels.some(function (l) { return l.toLowerCase().includes(query); }));
                    });
                    // Sort by relevance (title match first, then description)
                    filtered.sort(function (a, b) {
                        var aTitle = a.title.toLowerCase().includes(query);
                        var bTitle = b.title.toLowerCase().includes(query);
                        if (aTitle && !bTitle)
                            return -1;
                        if (!aTitle && bTitle)
                            return 1;
                        return 0;
                    });
                    return [2 /*return*/, filtered.slice(0, limit)];
            }
        });
    }); },
});
/** Export task as incident report (markdown) */
exports.exportIncidentReport = (0, server_1.query)({
    args: { taskId: values_1.v.id("tasks") },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var task, transitions, messages, runs, approvals, toolCalls, _loop_1, _i, runs_1, run, agentIds, agents, agentMap, report, _a, _b, id, agent, events, _c, transitions_1, t, _d, messages_1, m, _e, runs_2, r, _f, toolCalls_1, tc, _g, approvals_1, a, _h, events_1, event_1, time, author, agent, _j, _k, id, _l, runs_3, run, agent;
        var _m;
        return __generator(this, function (_o) {
            switch (_o.label) {
                case 0: return [4 /*yield*/, ctx.db.get(args.taskId)];
                case 1:
                    task = _o.sent();
                    if (!task)
                        return [2 /*return*/, null];
                    return [4 /*yield*/, ctx.db
                            .query("taskTransitions")
                            .withIndex("by_task", function (q) { return q.eq("taskId", args.taskId); })
                            .order("asc")
                            .collect()];
                case 2:
                    transitions = _o.sent();
                    return [4 /*yield*/, ctx.db
                            .query("messages")
                            .withIndex("by_task", function (q) { return q.eq("taskId", args.taskId); })
                            .order("asc")
                            .collect()];
                case 3:
                    messages = _o.sent();
                    return [4 /*yield*/, ctx.db
                            .query("runs")
                            .withIndex("by_task", function (q) { return q.eq("taskId", args.taskId); })
                            .order("asc")
                            .collect()];
                case 4:
                    runs = _o.sent();
                    return [4 /*yield*/, ctx.db
                            .query("approvals")
                            .withIndex("by_task", function (q) { return q.eq("taskId", args.taskId); })
                            .order("asc")
                            .collect()];
                case 5:
                    approvals = _o.sent();
                    toolCalls = [];
                    _loop_1 = function (run) {
                        var calls;
                        return __generator(this, function (_p) {
                            switch (_p.label) {
                                case 0: return [4 /*yield*/, ctx.db
                                        .query("toolCalls")
                                        .withIndex("by_run", function (q) { return q.eq("runId", run._id); })
                                        .collect()];
                                case 1:
                                    calls = _p.sent();
                                    toolCalls.push.apply(toolCalls, calls);
                                    return [2 /*return*/];
                            }
                        });
                    };
                    _i = 0, runs_1 = runs;
                    _o.label = 6;
                case 6:
                    if (!(_i < runs_1.length)) return [3 /*break*/, 9];
                    run = runs_1[_i];
                    return [5 /*yield**/, _loop_1(run)];
                case 7:
                    _o.sent();
                    _o.label = 8;
                case 8:
                    _i++;
                    return [3 /*break*/, 6];
                case 9:
                    agentIds = new Set(__spreadArray(__spreadArray(__spreadArray([], task.assigneeIds, true), messages.map(function (m) { return m.authorAgentId; }).filter(Boolean), true), runs.map(function (r) { return r.agentId; }), true));
                    return [4 /*yield*/, Promise.all(Array.from(agentIds).map(function (id) { return ctx.db.get(id); }))];
                case 10:
                    agents = _o.sent();
                    agentMap = new Map(agents.filter(function (a) { return a !== null; }).map(function (a) { return [a._id, a]; }));
                    report = "# Incident Report: ".concat(task.title, "\n\n");
                    report += "**Task ID:** ".concat(task._id, "\n");
                    report += "**Status:** ".concat(task.status, "\n");
                    report += "**Priority:** ".concat(task.priority, "\n");
                    report += "**Type:** ".concat(task.type, "\n");
                    report += "**Created:** ".concat(new Date(task._creationTime).toISOString(), "\n");
                    report += "**Cost:** $".concat(task.actualCost.toFixed(2));
                    if (task.budgetAllocated) {
                        report += " / $".concat(task.budgetAllocated.toFixed(2), " budget");
                    }
                    report += "\n\n";
                    // Description
                    if (task.description) {
                        report += "## Description\n\n".concat(task.description, "\n\n");
                    }
                    // Assignees
                    if (task.assigneeIds.length > 0) {
                        report += "## Assignees\n\n";
                        for (_a = 0, _b = task.assigneeIds; _a < _b.length; _a++) {
                            id = _b[_a];
                            agent = agentMap.get(id);
                            report += "- ".concat((agent === null || agent === void 0 ? void 0 : agent.emoji) || "🤖", " ").concat((agent === null || agent === void 0 ? void 0 : agent.name) || "Unknown", " (").concat(agent === null || agent === void 0 ? void 0 : agent.role, ")\n");
                        }
                        report += "\n";
                    }
                    // Timeline
                    report += "## Timeline\n\n";
                    events = [];
                    for (_c = 0, transitions_1 = transitions; _c < transitions_1.length; _c++) {
                        t = transitions_1[_c];
                        events.push({ ts: t._creationTime, type: "transition", data: t });
                    }
                    for (_d = 0, messages_1 = messages; _d < messages_1.length; _d++) {
                        m = messages_1[_d];
                        events.push({ ts: m._creationTime, type: "message", data: m });
                    }
                    for (_e = 0, runs_2 = runs; _e < runs_2.length; _e++) {
                        r = runs_2[_e];
                        events.push({ ts: r.startedAt, type: "run", data: r });
                    }
                    for (_f = 0, toolCalls_1 = toolCalls; _f < toolCalls_1.length; _f++) {
                        tc = toolCalls_1[_f];
                        events.push({ ts: tc.startedAt, type: "toolCall", data: tc });
                    }
                    for (_g = 0, approvals_1 = approvals; _g < approvals_1.length; _g++) {
                        a = approvals_1[_g];
                        events.push({ ts: a._creationTime, type: "approval", data: a });
                    }
                    // Sort chronologically
                    events.sort(function (a, b) { return a.ts - b.ts; });
                    // Format events
                    for (_h = 0, events_1 = events; _h < events_1.length; _h++) {
                        event_1 = events_1[_h];
                        time = new Date(event_1.ts).toISOString();
                        switch (event_1.type) {
                            case "transition":
                                report += "### ".concat(time, " \u2014 Transition\n");
                                report += "**".concat(event_1.data.fromStatus, "** \u2192 **").concat(event_1.data.toStatus, "**\n");
                                if (event_1.data.reason) {
                                    report += "Reason: ".concat(event_1.data.reason, "\n");
                                }
                                report += "\n";
                                break;
                            case "message":
                                author = event_1.data.authorUserId ||
                                    (event_1.data.authorAgentId ? (_m = agentMap.get(event_1.data.authorAgentId)) === null || _m === void 0 ? void 0 : _m.name : null) ||
                                    "Unknown";
                                report += "### ".concat(time, " \u2014 ").concat(event_1.data.type, "\n");
                                report += "**Author:** ".concat(author, "\n\n");
                                report += "".concat(event_1.data.content, "\n\n");
                                break;
                            case "run":
                                agent = agentMap.get(event_1.data.agentId);
                                report += "### ".concat(time, " \u2014 Run\n");
                                report += "**Agent:** ".concat((agent === null || agent === void 0 ? void 0 : agent.name) || "Unknown", "\n");
                                report += "**Model:** ".concat(event_1.data.model, "\n");
                                report += "**Status:** ".concat(event_1.data.status, "\n");
                                report += "**Cost:** $".concat(event_1.data.costUsd.toFixed(3), "\n");
                                if (event_1.data.durationMs) {
                                    report += "**Duration:** ".concat((event_1.data.durationMs / 1000).toFixed(1), "s\n");
                                }
                                report += "\n";
                                break;
                            case "toolCall":
                                report += "### ".concat(time, " \u2014 Tool Call\n");
                                report += "**Tool:** ".concat(event_1.data.toolName, "\n");
                                report += "**Risk:** ".concat(event_1.data.riskLevel, "\n");
                                report += "**Status:** ".concat(event_1.data.status, "\n");
                                if (event_1.data.inputPreview) {
                                    report += "**Input:** ".concat(event_1.data.inputPreview.slice(0, 100), "...\n");
                                }
                                report += "\n";
                                break;
                            case "approval":
                                report += "### ".concat(time, " \u2014 Approval\n");
                                report += "**Action:** ".concat(event_1.data.actionSummary, "\n");
                                report += "**Risk:** ".concat(event_1.data.riskLevel, "\n");
                                report += "**Status:** ".concat(event_1.data.status, "\n");
                                if (event_1.data.decisionReason) {
                                    report += "**Decision:** ".concat(event_1.data.decisionReason, "\n");
                                }
                                report += "\n";
                                break;
                        }
                    }
                    // Deliverable
                    if (task.deliverable) {
                        report += "## Deliverable\n\n";
                        if (task.deliverable.summary) {
                            report += "".concat(task.deliverable.summary, "\n\n");
                        }
                        if (task.deliverable.artifactIds && task.deliverable.artifactIds.length > 0) {
                            report += "**Artifacts:**\n";
                            for (_j = 0, _k = task.deliverable.artifactIds; _j < _k.length; _j++) {
                                id = _k[_j];
                                report += "- ".concat(id, "\n");
                            }
                            report += "\n";
                        }
                    }
                    // Blocked reason
                    if (task.blockedReason) {
                        report += "## Blocked\n\n";
                        report += "**Reason:** ".concat(task.blockedReason, "\n\n");
                    }
                    // Cost breakdown
                    report += "## Cost Breakdown\n\n";
                    report += "**Total Cost:** $".concat(task.actualCost.toFixed(2), "\n");
                    if (task.budgetAllocated) {
                        report += "**Budget:** $".concat(task.budgetAllocated.toFixed(2), "\n");
                        report += "**Remaining:** $".concat((task.budgetRemaining || 0).toFixed(2), "\n");
                    }
                    report += "**Runs:** ".concat(runs.length, "\n");
                    report += "**Review Cycles:** ".concat(task.reviewCycles, "\n\n");
                    // Run details
                    if (runs.length > 0) {
                        report += "### Runs\n\n";
                        for (_l = 0, runs_3 = runs; _l < runs_3.length; _l++) {
                            run = runs_3[_l];
                            agent = agentMap.get(run.agentId);
                            report += "- ".concat((agent === null || agent === void 0 ? void 0 : agent.name) || "Agent", " \u00B7 ").concat(run.model, " \u00B7 ");
                            report += "$".concat(run.costUsd.toFixed(3), " \u00B7 ");
                            report += "".concat(run.status);
                            if (run.durationMs) {
                                report += " \u00B7 ".concat((run.durationMs / 1000).toFixed(1), "s");
                            }
                            report += "\n";
                        }
                        report += "\n";
                    }
                    // Footer
                    report += "---\n\n";
                    report += "**Report Generated:** ".concat(new Date().toISOString(), "\n");
                    report += "**Generated by:** Mission Control\n";
                    return [2 /*return*/, report];
            }
        });
    }); },
});
exports.getWithTimeline = (0, server_1.query)({
    args: { taskId: values_1.v.id("tasks") },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var task, transitions, messages, runs, approvals, activities, taskEvents, toolCalls, _loop_2, _i, runs_4, run;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, ctx.db.get(args.taskId)];
                case 1:
                    task = _a.sent();
                    if (!task)
                        return [2 /*return*/, null];
                    return [4 /*yield*/, ctx.db
                            .query("taskTransitions")
                            .withIndex("by_task", function (q) { return q.eq("taskId", args.taskId); })
                            .order("asc")
                            .collect()];
                case 2:
                    transitions = _a.sent();
                    return [4 /*yield*/, ctx.db
                            .query("messages")
                            .withIndex("by_task", function (q) { return q.eq("taskId", args.taskId); })
                            .order("asc")
                            .collect()];
                case 3:
                    messages = _a.sent();
                    return [4 /*yield*/, ctx.db
                            .query("runs")
                            .withIndex("by_task", function (q) { return q.eq("taskId", args.taskId); })
                            .order("asc")
                            .collect()];
                case 4:
                    runs = _a.sent();
                    return [4 /*yield*/, ctx.db
                            .query("approvals")
                            .withIndex("by_task", function (q) { return q.eq("taskId", args.taskId); })
                            .order("asc")
                            .collect()];
                case 5:
                    approvals = _a.sent();
                    return [4 /*yield*/, ctx.db
                            .query("activities")
                            .withIndex("by_task", function (q) { return q.eq("taskId", args.taskId); })
                            .order("asc")
                            .collect()];
                case 6:
                    activities = _a.sent();
                    return [4 /*yield*/, ctx.db
                            .query("taskEvents")
                            .withIndex("by_task", function (q) { return q.eq("taskId", args.taskId); })
                            .order("asc")
                            .collect()];
                case 7:
                    taskEvents = _a.sent();
                    toolCalls = [];
                    _loop_2 = function (run) {
                        var calls;
                        return __generator(this, function (_b) {
                            switch (_b.label) {
                                case 0: return [4 /*yield*/, ctx.db
                                        .query("toolCalls")
                                        .withIndex("by_run", function (q) { return q.eq("runId", run._id); })
                                        .collect()];
                                case 1:
                                    calls = _b.sent();
                                    toolCalls.push.apply(toolCalls, calls);
                                    return [2 /*return*/];
                            }
                        });
                    };
                    _i = 0, runs_4 = runs;
                    _a.label = 8;
                case 8:
                    if (!(_i < runs_4.length)) return [3 /*break*/, 11];
                    run = runs_4[_i];
                    return [5 /*yield**/, _loop_2(run)];
                case 9:
                    _a.sent();
                    _a.label = 10;
                case 10:
                    _i++;
                    return [3 /*break*/, 8];
                case 11: return [2 /*return*/, {
                        task: task,
                        transitions: transitions,
                        messages: messages,
                        runs: runs,
                        toolCalls: toolCalls,
                        approvals: approvals,
                        activities: activities,
                        taskEvents: taskEvents,
                    }];
            }
        });
    }); },
});
exports.getUnifiedTimeline = (0, server_1.query)({
    args: { taskId: values_1.v.id("tasks") },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, ctx.db
                        .query("taskEvents")
                        .withIndex("by_task", function (q) { return q.eq("taskId", args.taskId); })
                        .order("asc")
                        .collect()];
                case 1: return [2 /*return*/, _a.sent()];
            }
        });
    }); },
});
/**
 * Dry-run transition simulation.
 * Validates transition rules and requirements without mutating task state.
 */
exports.simulateTransition = (0, server_1.query)({
    args: {
        taskId: values_1.v.id("tasks"),
        toStatus: taskStatusValidator,
        actorType: values_1.v.optional(values_1.v.union(values_1.v.literal("AGENT"), values_1.v.literal("HUMAN"), values_1.v.literal("SYSTEM"))),
        hasWorkPlan: values_1.v.optional(values_1.v.boolean()),
        hasDeliverable: values_1.v.optional(values_1.v.boolean()),
        hasChecklist: values_1.v.optional(values_1.v.boolean()),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var task, fromStatus, toStatus, actorType, rule, errors;
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, ctx.db.get(args.taskId)];
                case 1:
                    task = _c.sent();
                    if (!task) {
                        return [2 /*return*/, {
                                valid: false,
                                fromStatus: null,
                                toStatus: args.toStatus,
                                actorType: (_a = args.actorType) !== null && _a !== void 0 ? _a : "HUMAN",
                                errors: [{ field: "taskId", message: "Task not found" }],
                                allowedTransitions: [],
                            }];
                    }
                    fromStatus = task.status;
                    toStatus = args.toStatus;
                    actorType = ((_b = args.actorType) !== null && _b !== void 0 ? _b : "HUMAN");
                    rule = findTransitionRule(fromStatus, toStatus);
                    if (!rule) {
                        return [2 /*return*/, {
                                valid: false,
                                fromStatus: fromStatus,
                                toStatus: toStatus,
                                actorType: actorType,
                                errors: [{
                                        field: "toStatus",
                                        message: "Invalid transition: ".concat(fromStatus, " -> ").concat(toStatus),
                                    }],
                                allowedTransitions: TRANSITION_RULES
                                    .filter(function (r) { return r.from === fromStatus; })
                                    .map(function (r) { return r.to; }),
                            }];
                    }
                    errors = [];
                    if (!rule.allowedActors.includes(actorType)) {
                        errors.push({
                            field: "actorType",
                            message: "Actor type '".concat(actorType, "' cannot perform ").concat(fromStatus, " -> ").concat(toStatus),
                        });
                    }
                    if (rule.humanOnly && actorType !== "HUMAN") {
                        errors.push({
                            field: "actorType",
                            message: "Transition ".concat(fromStatus, " -> ").concat(toStatus, " requires human approval"),
                        });
                    }
                    if (rule.requiresWorkPlan && !args.hasWorkPlan) {
                        errors.push({
                            field: "workPlan",
                            message: "Work plan required",
                        });
                    }
                    if (rule.requiresDeliverable && !args.hasDeliverable) {
                        errors.push({
                            field: "deliverable",
                            message: "Deliverable required",
                        });
                    }
                    if (rule.requiresChecklist && !args.hasChecklist) {
                        errors.push({
                            field: "reviewChecklist",
                            message: "Review checklist required",
                        });
                    }
                    return [2 /*return*/, {
                            valid: errors.length === 0,
                            fromStatus: fromStatus,
                            toStatus: toStatus,
                            actorType: actorType,
                            requirements: {
                                requiresWorkPlan: !!rule.requiresWorkPlan,
                                requiresDeliverable: !!rule.requiresDeliverable,
                                requiresChecklist: !!rule.requiresChecklist,
                                humanOnly: !!rule.humanOnly,
                            },
                            errors: errors,
                            allowedTransitions: TRANSITION_RULES
                                .filter(function (r) { return r.from === fromStatus && r.allowedActors.includes(actorType); })
                                .map(function (r) { return r.to; }),
                        }];
            }
        });
    }); },
});
/**
 * Dry-run planner: transition validation + policy decision preview with no side effects.
 */
exports.simulateExecutionPlan = (0, server_1.query)({
    args: {
        taskId: values_1.v.id("tasks"),
        toStatus: values_1.v.optional(taskStatusValidator),
        actorType: values_1.v.optional(values_1.v.union(values_1.v.literal("AGENT"), values_1.v.literal("HUMAN"), values_1.v.literal("SYSTEM"))),
        plannedToolName: values_1.v.optional(values_1.v.string()),
        plannedToolArgs: values_1.v.optional(values_1.v.any()),
        estimatedCost: values_1.v.optional(values_1.v.number()),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var task, actorType, transitionPreview, activePolicy, primaryAssigneeId, assignee, _a, triggeredRules, remediationHints, requiredApprovals, policyDecision, policyReason, riskLevel, estimatedCost, budgetRemaining, operatorControl, operatorGate, rules, policyPreview;
        var _b, _c, _d, _e;
        return __generator(this, function (_f) {
            switch (_f.label) {
                case 0: return [4 /*yield*/, ctx.db.get(args.taskId)];
                case 1:
                    task = _f.sent();
                    if (!task) {
                        return [2 /*return*/, {
                                ok: false,
                                error: "Task not found",
                            }];
                    }
                    actorType = ((_b = args.actorType) !== null && _b !== void 0 ? _b : "HUMAN");
                    transitionPreview = (function () {
                        if (!args.toStatus)
                            return null;
                        var fromStatus = task.status;
                        var toStatus = args.toStatus;
                        var rule = findTransitionRule(fromStatus, toStatus);
                        if (!rule) {
                            return {
                                valid: false,
                                fromStatus: fromStatus,
                                toStatus: toStatus,
                                actorType: actorType,
                                errors: [{ field: "toStatus", message: "Invalid transition: ".concat(fromStatus, " -> ").concat(toStatus) }],
                                allowedTransitions: TRANSITION_RULES
                                    .filter(function (r) { return r.from === fromStatus; })
                                    .map(function (r) { return r.to; }),
                            };
                        }
                        var errors = [];
                        if (!rule.allowedActors.includes(actorType)) {
                            errors.push({
                                field: "actorType",
                                message: "Actor type '".concat(actorType, "' cannot perform ").concat(fromStatus, " -> ").concat(toStatus),
                            });
                        }
                        if (rule.humanOnly && actorType !== "HUMAN") {
                            errors.push({
                                field: "actorType",
                                message: "Transition ".concat(fromStatus, " -> ").concat(toStatus, " requires human approval"),
                            });
                        }
                        if (rule.requiresWorkPlan && !task.workPlan) {
                            errors.push({ field: "workPlan", message: "Work plan required" });
                        }
                        if (rule.requiresDeliverable && !task.deliverable) {
                            errors.push({ field: "deliverable", message: "Deliverable required" });
                        }
                        if (rule.requiresChecklist && !task.reviewChecklist) {
                            errors.push({ field: "reviewChecklist", message: "Review checklist required" });
                        }
                        return {
                            valid: errors.length === 0,
                            fromStatus: fromStatus,
                            toStatus: toStatus,
                            actorType: actorType,
                            requirements: {
                                requiresWorkPlan: !!rule.requiresWorkPlan,
                                requiresDeliverable: !!rule.requiresDeliverable,
                                requiresChecklist: !!rule.requiresChecklist,
                                humanOnly: !!rule.humanOnly,
                            },
                            errors: errors,
                        };
                    })();
                    return [4 /*yield*/, ctx.db
                            .query("policies")
                            .withIndex("by_active", function (q) { return q.eq("active", true); })
                            .first()];
                case 2:
                    activePolicy = _f.sent();
                    primaryAssigneeId = (_c = task.assigneeIds) === null || _c === void 0 ? void 0 : _c[0];
                    if (!primaryAssigneeId) return [3 /*break*/, 4];
                    return [4 /*yield*/, ctx.db.get(primaryAssigneeId)];
                case 3:
                    _a = _f.sent();
                    return [3 /*break*/, 5];
                case 4:
                    _a = null;
                    _f.label = 5;
                case 5:
                    assignee = _a;
                    triggeredRules = [];
                    remediationHints = [];
                    requiredApprovals = [];
                    policyDecision = "ALLOW";
                    policyReason = "No blocking policy rules triggered";
                    riskLevel = task.type === "SOCIAL" || task.type === "EMAIL_MARKETING"
                        ? "RED"
                        : task.type === "OPS" || task.type === "ENGINEERING"
                            ? "YELLOW"
                            : "GREEN";
                    if (!assignee) {
                        policyDecision = "NEEDS_APPROVAL";
                        policyReason = "Task has no assignee; operator confirmation required before execution";
                        triggeredRules.push("task_unassigned");
                        remediationHints.push("Assign an active agent and re-run simulation.");
                    }
                    else if (assignee.status !== "ACTIVE") {
                        policyDecision = "DENY";
                        policyReason = "Assignee ".concat(assignee.name, " is ").concat(assignee.status.toLowerCase());
                        triggeredRules.push("assignee_not_active:".concat(assignee.status));
                        remediationHints.push("Activate the assignee or reassign this task.");
                    }
                    else {
                        estimatedCost = (_e = (_d = args.estimatedCost) !== null && _d !== void 0 ? _d : task.estimatedCost) !== null && _e !== void 0 ? _e : 0;
                        budgetRemaining = assignee.budgetDaily - assignee.spendToday;
                        if (estimatedCost > budgetRemaining) {
                            policyDecision = "NEEDS_APPROVAL";
                            policyReason = "Estimated cost ($".concat(estimatedCost.toFixed(2), ") exceeds remaining daily budget ($").concat(budgetRemaining.toFixed(2), ")");
                            triggeredRules.push("budget_exceeded");
                            requiredApprovals.push({
                                type: "BUDGET_EXCEEDED",
                                reason: "Budget overrun requires human approval",
                            });
                            remediationHints.push("Reduce scope or increase budget authorization.");
                        }
                    }
                    return [4 /*yield*/, (0, operatorControls_1.getEffectiveOperatorControl)(ctx.db, task.projectId)];
                case 6:
                    operatorControl = _f.sent();
                    operatorGate = (0, operatorControls_1.evaluateOperatorGate)({
                        mode: operatorControl.mode,
                        actorType: actorType,
                        operation: "TRANSITION",
                    });
                    if (operatorGate.decision === "DENY") {
                        policyDecision = "DENY";
                        policyReason = operatorGate.reason;
                        triggeredRules.push("operator_control:".concat(operatorControl.mode));
                        remediationHints.push("Return operator mode to NORMAL or use explicit human override.");
                    }
                    if (operatorGate.decision === "NEEDS_APPROVAL" && policyDecision !== "DENY") {
                        policyDecision = "NEEDS_APPROVAL";
                        policyReason = operatorGate.reason;
                        triggeredRules.push("operator_control:".concat(operatorControl.mode));
                        requiredApprovals.push({
                            type: "OPERATOR_OVERRIDE",
                            reason: operatorGate.reason,
                        });
                    }
                    if (activePolicy && args.toStatus === "DONE") {
                        rules = activePolicy.rules;
                        if ((rules === null || rules === void 0 ? void 0 : rules.reviewToDoneRequiresHuman) === true && policyDecision !== "DENY") {
                            policyDecision = "NEEDS_APPROVAL";
                            policyReason = "REVIEW -> DONE requires human approval by policy";
                            triggeredRules.push("review_to_done_requires_human");
                            requiredApprovals.push({
                                type: "TRANSITION_TO_DONE",
                                reason: "Policy requires human review before completion",
                            });
                        }
                    }
                    if (triggeredRules.length === 0) {
                        triggeredRules.push("no_policy_blockers");
                    }
                    if (remediationHints.length === 0 && policyDecision === "ALLOW") {
                        remediationHints.push("No remediation needed. Safe to proceed.");
                    }
                    policyPreview = {
                        taskId: task._id,
                        taskStatus: task.status,
                        decision: policyDecision,
                        riskLevel: riskLevel,
                        reason: policyReason,
                        triggeredRules: triggeredRules,
                        requiredApprovals: requiredApprovals,
                        remediationHints: remediationHints,
                        evaluatedAt: Date.now(),
                    };
                    return [2 /*return*/, {
                            ok: true,
                            transitionPreview: transitionPreview,
                            policyPreview: policyPreview,
                            summary: {
                                transitionValid: transitionPreview ? transitionPreview.valid : true,
                                policyDecision: policyPreview.decision,
                                riskLevel: policyPreview.riskLevel,
                                needsApproval: policyPreview.decision === "NEEDS_APPROVAL",
                            },
                            evaluatedAt: Date.now(),
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
        projectId: values_1.v.optional(values_1.v.id("projects")),
        title: values_1.v.string(),
        description: values_1.v.optional(values_1.v.string()),
        type: values_1.v.string(),
        priority: values_1.v.optional(values_1.v.number()),
        assigneeIds: values_1.v.optional(values_1.v.array(values_1.v.id("agents"))),
        labels: values_1.v.optional(values_1.v.array(values_1.v.string())),
        estimatedCost: values_1.v.optional(values_1.v.number()),
        idempotencyKey: values_1.v.optional(values_1.v.string()),
        // Provenance — where the task came from
        source: values_1.v.optional(values_1.v.string()), // "DASHBOARD" | "TELEGRAM" | "GITHUB" | "AGENT" | "API"
        sourceRef: values_1.v.optional(values_1.v.string()), // e.g. "owner/repo#42", telegram msg id
        createdBy: values_1.v.optional(values_1.v.string()), // "HUMAN" | "AGENT" | "SYSTEM"
        createdByRef: values_1.v.optional(values_1.v.string()), // agent id, user email, etc.
        metadata: values_1.v.optional(values_1.v.any()),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var existing, RATE_LIMIT_PER_MINUTE, WINDOW_MS, key_1, now, windowStart, entry, externalSources, isUntrusted, title, description, project, _a, assigneeIds, assigneeInstanceIds, _b, taskId, task, sourceLabel;
        var _c, _d, _e, _f, _g, _h, _j, _k;
        return __generator(this, function (_l) {
            switch (_l.label) {
                case 0:
                    if (!args.idempotencyKey) return [3 /*break*/, 2];
                    return [4 /*yield*/, ctx.db
                            .query("tasks")
                            .withIndex("by_idempotency", function (q) { return q.eq("idempotencyKey", args.idempotencyKey); })
                            .first()];
                case 1:
                    existing = _l.sent();
                    if (existing) {
                        return [2 /*return*/, { task: existing, created: false }];
                    }
                    _l.label = 2;
                case 2:
                    RATE_LIMIT_PER_MINUTE = 30;
                    WINDOW_MS = 60 * 1000;
                    if (!(args.source === "TELEGRAM" && args.sourceRef)) return [3 /*break*/, 9];
                    key_1 = "telegram:".concat((_c = args.sourceRef.split(":")[1]) !== null && _c !== void 0 ? _c : "unknown");
                    now = Date.now();
                    windowStart = Math.floor(now / WINDOW_MS) * WINDOW_MS;
                    return [4 /*yield*/, ctx.db
                            .query("rateLimitEntries")
                            .withIndex("by_key", function (q) { return q.eq("key", key_1); })
                            .first()];
                case 3:
                    entry = _l.sent();
                    if (!(!entry || entry.windowStart < windowStart)) return [3 /*break*/, 7];
                    if (!entry) return [3 /*break*/, 5];
                    return [4 /*yield*/, ctx.db.delete(entry._id)];
                case 4:
                    _l.sent();
                    _l.label = 5;
                case 5: return [4 /*yield*/, ctx.db.insert("rateLimitEntries", { key: key_1, windowStart: windowStart, count: 1 })];
                case 6:
                    _l.sent();
                    return [3 /*break*/, 9];
                case 7:
                    if (entry.count >= RATE_LIMIT_PER_MINUTE) {
                        throw new Error("Rate limit exceeded. Please try again in a minute.");
                    }
                    return [4 /*yield*/, ctx.db.patch(entry._id, { count: entry.count + 1 })];
                case 8:
                    _l.sent();
                    _l.label = 9;
                case 9:
                    externalSources = ["TELEGRAM", "GITHUB", "API"];
                    isUntrusted = args.source && externalSources.includes(args.source);
                    title = isUntrusted ? (0, sanitize_1.sanitizeTaskTitle)(args.title) : args.title;
                    description = isUntrusted
                        ? (0, sanitize_1.sanitizeTaskDescription)(args.description)
                        : args.description;
                    if (!args.projectId) return [3 /*break*/, 11];
                    return [4 /*yield*/, ctx.db.get(args.projectId)];
                case 10:
                    _a = _l.sent();
                    return [3 /*break*/, 12];
                case 11:
                    _a = null;
                    _l.label = 12;
                case 12:
                    project = _a;
                    assigneeIds = (_d = args.assigneeIds) !== null && _d !== void 0 ? _d : [];
                    if (!(assigneeIds.length > 0)) return [3 /*break*/, 14];
                    return [4 /*yield*/, resolveAssigneeInstanceIds(ctx, assigneeIds)];
                case 13:
                    _b = _l.sent();
                    return [3 /*break*/, 15];
                case 14:
                    _b = undefined;
                    _l.label = 15;
                case 15:
                    assigneeInstanceIds = _b;
                    return [4 /*yield*/, ctx.db.insert("tasks", {
                            tenantId: project === null || project === void 0 ? void 0 : project.tenantId,
                            projectId: args.projectId,
                            title: title,
                            description: description,
                            type: args.type,
                            status: "INBOX", // INVARIANT: always INBOX at creation
                            priority: ((_e = args.priority) !== null && _e !== void 0 ? _e : 3),
                            assigneeIds: assigneeIds,
                            assigneeInstanceIds: assigneeInstanceIds,
                            reviewCycles: 0,
                            actualCost: 0,
                            labels: args.labels,
                            estimatedCost: args.estimatedCost,
                            idempotencyKey: args.idempotencyKey,
                            // Provenance
                            source: (_f = args.source) !== null && _f !== void 0 ? _f : undefined,
                            sourceRef: args.sourceRef,
                            createdBy: (_g = args.createdBy) !== null && _g !== void 0 ? _g : undefined,
                            createdByRef: args.createdByRef,
                            metadata: args.metadata,
                        })];
                case 16:
                    taskId = _l.sent();
                    return [4 /*yield*/, ctx.db.get(taskId)];
                case 17:
                    task = _l.sent();
                    sourceLabel = args.source ? " via ".concat(args.source) : "";
                    return [4 /*yield*/, ctx.db.insert("activities", {
                            projectId: args.projectId,
                            actorType: (_h = args.createdBy) !== null && _h !== void 0 ? _h : "SYSTEM",
                            action: "TASK_CREATED",
                            description: "Task \"".concat(title, "\" created").concat(sourceLabel),
                            targetType: "TASK",
                            targetId: taskId,
                            taskId: taskId,
                        })];
                case 18:
                    _l.sent();
                    return [4 /*yield*/, (0, taskEvents_1.logTaskEvent)(ctx, {
                            taskId: taskId,
                            projectId: args.projectId,
                            eventType: "TASK_CREATED",
                            actorType: (_j = args.createdBy) !== null && _j !== void 0 ? _j : "SYSTEM",
                            actorId: args.createdByRef,
                            relatedId: taskId,
                            afterState: {
                                status: "INBOX",
                                title: title,
                                type: args.type,
                                priority: (_k = args.priority) !== null && _k !== void 0 ? _k : 3,
                            },
                            metadata: {
                                source: args.source,
                                sourceRef: args.sourceRef,
                            },
                        })];
                case 19:
                    _l.sent();
                    return [2 /*return*/, { task: task, created: true }];
            }
        });
    }); },
});
exports.transition = (0, server_1.mutation)({
    args: {
        taskId: values_1.v.id("tasks"),
        toStatus: taskStatusValidator,
        actorType: values_1.v.union(values_1.v.literal("AGENT"), values_1.v.literal("HUMAN"), values_1.v.literal("SYSTEM")),
        actorAgentId: values_1.v.optional(values_1.v.id("agents")),
        actorUserId: values_1.v.optional(values_1.v.string()),
        reason: values_1.v.optional(values_1.v.string()),
        sessionKey: values_1.v.optional(values_1.v.string()),
        idempotencyKey: values_1.v.string(),
        // Artifacts for transition requirements
        workPlan: values_1.v.optional(values_1.v.object({
            bullets: values_1.v.array(values_1.v.string()),
            estimatedCost: values_1.v.optional(values_1.v.number()),
            estimatedDuration: values_1.v.optional(values_1.v.string()),
        })),
        deliverable: values_1.v.optional(values_1.v.object({
            summary: values_1.v.optional(values_1.v.string()),
            content: values_1.v.optional(values_1.v.string()),
            artifactIds: values_1.v.optional(values_1.v.array(values_1.v.string())),
        })),
        reviewChecklist: values_1.v.optional(values_1.v.object({
            type: values_1.v.string(),
            items: values_1.v.array(values_1.v.object({
                label: values_1.v.string(),
                checked: values_1.v.boolean(),
                note: values_1.v.optional(values_1.v.string()),
            })),
        })),
        blockedReason: values_1.v.optional(values_1.v.string()),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var existingTransition, task_1, task, fromStatus, toStatus, actorType, operatorControl, operatorGate, rule, errors, policy, approvals, now, taskUpdate, transitionId, updatedTask, transition, taskWatchers, _i, _a, agentId;
        var _b, _c, _d, _e, _f, _g;
        return __generator(this, function (_h) {
            switch (_h.label) {
                case 0: return [4 /*yield*/, ctx.db
                        .query("taskTransitions")
                        .withIndex("by_idempotency", function (q) { return q.eq("idempotencyKey", args.idempotencyKey); })
                        .first()];
                case 1:
                    existingTransition = _h.sent();
                    if (!existingTransition) return [3 /*break*/, 3];
                    return [4 /*yield*/, ctx.db.get(args.taskId)];
                case 2:
                    task_1 = _h.sent();
                    return [2 /*return*/, {
                            success: true,
                            task: task_1,
                            transition: existingTransition,
                            idempotencyHit: true,
                        }];
                case 3: return [4 /*yield*/, ctx.db.get(args.taskId)];
                case 4:
                    task = _h.sent();
                    if (!task) {
                        return [2 /*return*/, {
                                success: false,
                                errors: [{ field: "taskId", message: "Task not found" }],
                            }];
                    }
                    fromStatus = task.status;
                    toStatus = args.toStatus;
                    actorType = args.actorType;
                    return [4 /*yield*/, (0, operatorControls_1.getEffectiveOperatorControl)(ctx.db, task.projectId)];
                case 5:
                    operatorControl = _h.sent();
                    operatorGate = (0, operatorControls_1.evaluateOperatorGate)({
                        mode: operatorControl.mode,
                        actorType: actorType,
                        operation: "TRANSITION",
                    });
                    if (operatorGate.decision === "DENY") {
                        return [2 /*return*/, {
                                success: false,
                                errors: [{
                                        field: "operatorControl",
                                        message: operatorGate.reason,
                                    }],
                            }];
                    }
                    if (operatorGate.decision === "NEEDS_APPROVAL" && actorType !== "HUMAN") {
                        return [2 /*return*/, {
                                success: false,
                                errors: [{
                                        field: "operatorControl",
                                        message: operatorGate.reason,
                                    }],
                            }];
                    }
                    rule = findTransitionRule(fromStatus, toStatus);
                    if (!rule) {
                        return [2 /*return*/, {
                                success: false,
                                errors: [{
                                        field: "toStatus",
                                        message: "Invalid transition: ".concat(fromStatus, " \u2192 ").concat(toStatus, " is not allowed")
                                    }],
                                allowedTransitions: TRANSITION_RULES
                                    .filter(function (r) { return r.from === fromStatus; })
                                    .map(function (r) { return r.to; }),
                            }];
                    }
                    // 4. Check actor permission
                    if (!rule.allowedActors.includes(actorType)) {
                        return [2 /*return*/, {
                                success: false,
                                errors: [{
                                        field: "actorType",
                                        message: "Actor type '".concat(actorType, "' cannot perform ").concat(fromStatus, " \u2192 ").concat(toStatus, ". Allowed: ").concat(rule.allowedActors.join(", "))
                                    }],
                            }];
                    }
                    // 5. Check human-only transitions
                    if (rule.humanOnly && actorType !== "HUMAN") {
                        return [2 /*return*/, {
                                success: false,
                                errors: [{
                                        field: "actorType",
                                        message: "Transition ".concat(fromStatus, " \u2192 ").concat(toStatus, " requires human approval")
                                    }],
                            }];
                    }
                    errors = [];
                    if (rule.requiresWorkPlan && !args.workPlan) {
                        errors.push({ field: "workPlan", message: "Work plan required for IN_PROGRESS" });
                    }
                    if (rule.requiresWorkPlan && args.workPlan) {
                        if (args.workPlan.bullets.length < 3 || args.workPlan.bullets.length > 6) {
                            errors.push({ field: "workPlan.bullets", message: "Work plan must have 3-6 bullets" });
                        }
                    }
                    if (rule.requiresDeliverable && !args.deliverable) {
                        errors.push({ field: "deliverable", message: "Deliverable required for REVIEW" });
                    }
                    if (rule.requiresChecklist && !args.reviewChecklist) {
                        errors.push({ field: "reviewChecklist", message: "Review checklist required for REVIEW" });
                    }
                    // Check assignees for IN_PROGRESS
                    if (toStatus === "IN_PROGRESS" && task.assigneeIds.length === 0) {
                        errors.push({ field: "assigneeIds", message: "Task must have at least one assignee" });
                    }
                    if (!(fromStatus === "REVIEW" && toStatus === "DONE")) return [3 /*break*/, 8];
                    return [4 /*yield*/, ctx.db
                            .query("policies")
                            .withIndex("by_active", function (q) { return q.eq("active", true); })
                            .first()];
                case 6:
                    policy = _h.sent();
                    if (!(policy && ((_b = policy.rules) === null || _b === void 0 ? void 0 : _b.reviewToDoneRequiresApproval))) return [3 /*break*/, 8];
                    return [4 /*yield*/, ctx.db
                            .query("approvals")
                            .withIndex("by_task", function (q) { return q.eq("taskId", args.taskId); })
                            .filter(function (q) { return q.eq(q.field("status"), "APPROVED"); })
                            .collect()];
                case 7:
                    approvals = _h.sent();
                    if (approvals.length === 0) {
                        errors.push({
                            field: "status",
                            message: "REVIEW → DONE requires an approved approval record. Request approval first.",
                        });
                    }
                    _h.label = 8;
                case 8:
                    if (errors.length > 0) {
                        return [2 /*return*/, { success: false, errors: errors }];
                    }
                    now = Date.now();
                    taskUpdate = {
                        status: toStatus,
                    };
                    if (args.workPlan)
                        taskUpdate.workPlan = args.workPlan;
                    if (args.deliverable)
                        taskUpdate.deliverable = args.deliverable;
                    if (args.reviewChecklist)
                        taskUpdate.reviewChecklist = args.reviewChecklist;
                    if (args.blockedReason)
                        taskUpdate.blockedReason = args.blockedReason;
                    // Set timestamps
                    if (toStatus === "IN_PROGRESS" && !task.startedAt) {
                        taskUpdate.startedAt = now;
                    }
                    if (toStatus === "REVIEW") {
                        taskUpdate.submittedAt = now;
                    }
                    if (toStatus === "DONE" || toStatus === "CANCELED") {
                        taskUpdate.completedAt = now;
                    }
                    // Increment review cycles on revision
                    if (fromStatus === "REVIEW" && toStatus === "IN_PROGRESS") {
                        taskUpdate.reviewCycles = task.reviewCycles + 1;
                    }
                    // 8. Update task
                    return [4 /*yield*/, ctx.db.patch(args.taskId, taskUpdate)];
                case 9:
                    // 8. Update task
                    _h.sent();
                    return [4 /*yield*/, ctx.db.insert("taskTransitions", {
                            projectId: task.projectId,
                            idempotencyKey: args.idempotencyKey,
                            taskId: args.taskId,
                            fromStatus: fromStatus,
                            toStatus: toStatus,
                            actorType: actorType,
                            actorAgentId: args.actorAgentId,
                            actorUserId: args.actorUserId,
                            reason: args.reason,
                            sessionKey: args.sessionKey,
                            validationResult: { valid: true },
                            artifactsSnapshot: {
                                workPlan: args.workPlan,
                                deliverable: args.deliverable,
                                reviewChecklist: args.reviewChecklist,
                            },
                        })];
                case 10:
                    transitionId = _h.sent();
                    return [4 /*yield*/, (0, armAudit_1.appendChangeRecord)(ctx.db, {
                            tenantId: task.tenantId,
                            projectId: task.projectId,
                            legacyAgentId: args.actorAgentId,
                            type: "TASK_TRANSITIONED",
                            summary: "Task ".concat(args.taskId, " transitioned ").concat(fromStatus, " -> ").concat(toStatus),
                            payload: {
                                taskId: args.taskId,
                                fromStatus: fromStatus,
                                toStatus: toStatus,
                                actorType: actorType,
                                actorAgentId: args.actorAgentId,
                                actorUserId: args.actorUserId,
                            },
                            relatedTable: "tasks",
                            relatedId: args.taskId,
                        })];
                case 11:
                    _h.sent();
                    // 10. Log activity
                    return [4 /*yield*/, ctx.db.insert("activities", {
                            projectId: task.projectId,
                            actorType: actorType,
                            actorId: (_d = (_c = args.actorAgentId) === null || _c === void 0 ? void 0 : _c.toString()) !== null && _d !== void 0 ? _d : args.actorUserId,
                            action: "TASK_TRANSITION",
                            description: "Task transitioned: ".concat(fromStatus, " \u2192 ").concat(toStatus),
                            targetType: "TASK",
                            targetId: args.taskId,
                            taskId: args.taskId,
                            agentId: args.actorAgentId,
                            beforeState: { status: fromStatus },
                            afterState: { status: toStatus },
                        })];
                case 12:
                    // 10. Log activity
                    _h.sent();
                    return [4 /*yield*/, (0, taskEvents_1.logTaskEvent)(ctx, {
                            taskId: args.taskId,
                            projectId: task.projectId,
                            eventType: "TASK_TRANSITION",
                            actorType: actorType,
                            actorId: (_f = (_e = args.actorAgentId) === null || _e === void 0 ? void 0 : _e.toString()) !== null && _f !== void 0 ? _f : args.actorUserId,
                            relatedId: transitionId,
                            beforeState: { status: fromStatus },
                            afterState: { status: toStatus },
                            metadata: {
                                reason: args.reason,
                                sessionKey: args.sessionKey,
                                operatorMode: operatorControl.mode,
                            },
                        })];
                case 13:
                    _h.sent();
                    return [4 /*yield*/, ctx.db.get(args.taskId)];
                case 14:
                    updatedTask = _h.sent();
                    return [4 /*yield*/, ctx.db.get(transitionId)];
                case 15:
                    transition = _h.sent();
                    return [4 /*yield*/, ctx.db
                            .query("watchSubscriptions")
                            .withIndex("by_entity", function (q) {
                            return q.eq("entityType", "TASK").eq("entityId", args.taskId);
                        })
                            .collect()];
                case 16:
                    taskWatchers = _h.sent();
                    if (!(taskWatchers.length > 0)) return [3 /*break*/, 18];
                    return [4 /*yield*/, ctx.db.insert("activities", {
                            projectId: task.projectId,
                            actorType: "SYSTEM",
                            action: "TASK_WATCHERS_NOTIFIED",
                            description: "".concat(taskWatchers.length, " watcher(s) notified for task transition"),
                            targetType: "TASK",
                            targetId: args.taskId,
                            taskId: args.taskId,
                            metadata: {
                                fromStatus: fromStatus,
                                toStatus: toStatus,
                                watchers: taskWatchers.map(function (watcher) { return watcher.userId; }),
                            },
                        })];
                case 17:
                    _h.sent();
                    _h.label = 18;
                case 18:
                    if (!(toStatus === "ASSIGNED" && updatedTask && updatedTask.assigneeIds.length > 0)) return [3 /*break*/, 22];
                    _i = 0, _a = updatedTask.assigneeIds;
                    _h.label = 19;
                case 19:
                    if (!(_i < _a.length)) return [3 /*break*/, 22];
                    agentId = _a[_i];
                    return [4 /*yield*/, ctx.db.insert("notifications", {
                            projectId: updatedTask.projectId,
                            agentId: agentId,
                            type: "TASK_ASSIGNED",
                            title: "Task assigned: ".concat(updatedTask.title),
                            body: (_g = updatedTask.description) !== null && _g !== void 0 ? _g : undefined,
                            taskId: args.taskId,
                            fromAgentId: args.actorAgentId,
                            fromUserId: args.actorUserId,
                        })];
                case 20:
                    _h.sent();
                    _h.label = 21;
                case 21:
                    _i++;
                    return [3 /*break*/, 19];
                case 22: return [2 /*return*/, {
                        success: true,
                        task: updatedTask,
                        transition: transition,
                        idempotencyHit: false,
                    }];
            }
        });
    }); },
});
exports.assign = (0, server_1.mutation)({
    args: {
        taskId: values_1.v.id("tasks"),
        agentIds: values_1.v.array(values_1.v.id("agents")),
        actorType: values_1.v.union(values_1.v.literal("AGENT"), values_1.v.literal("HUMAN"), values_1.v.literal("SYSTEM")),
        actorUserId: values_1.v.optional(values_1.v.string()),
        idempotencyKey: values_1.v.string(),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var task, assigneeInstanceIds, updatedTask;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, ctx.db.get(args.taskId)];
                case 1:
                    task = _a.sent();
                    if (!task) {
                        return [2 /*return*/, { success: false, error: "Task not found" }];
                    }
                    return [4 /*yield*/, resolveAssigneeInstanceIds(ctx, args.agentIds)];
                case 2:
                    assigneeInstanceIds = _a.sent();
                    return [4 /*yield*/, ctx.db.patch(args.taskId, {
                            assigneeIds: args.agentIds,
                            assigneeInstanceIds: assigneeInstanceIds,
                        })];
                case 3:
                    _a.sent();
                    if (!(task.status === "INBOX")) return [3 /*break*/, 5];
                    return [4 /*yield*/, ctx.runMutation(api_1.api.tasks.transition, {
                            taskId: args.taskId,
                            toStatus: "ASSIGNED",
                            actorType: args.actorType,
                            actorUserId: args.actorUserId,
                            idempotencyKey: args.idempotencyKey,
                            reason: "Assigned to ".concat(args.agentIds.length, " agent(s)"),
                        })];
                case 4: return [2 /*return*/, _a.sent()];
                case 5: return [4 /*yield*/, ctx.db.get(args.taskId)];
                case 6:
                    updatedTask = _a.sent();
                    return [2 /*return*/, { success: true, task: updatedTask }];
            }
        });
    }); },
});
/**
 * Update editable task fields.
 * Status changes are routed through the state-machine transition mutation.
 */
exports.update = (0, server_1.mutation)({
    args: {
        taskId: values_1.v.id("tasks"),
        title: values_1.v.optional(values_1.v.string()),
        description: values_1.v.optional(values_1.v.string()),
        priority: values_1.v.optional(values_1.v.union(values_1.v.literal(1), values_1.v.literal(2), values_1.v.literal(3), values_1.v.literal(4))),
        status: values_1.v.optional(taskStatusValidator),
        type: values_1.v.optional(taskTypeValidator),
        estimatedCost: values_1.v.optional(values_1.v.number()),
        assigneeIds: values_1.v.optional(values_1.v.array(values_1.v.id("agents"))),
        actorUserId: values_1.v.optional(values_1.v.string()),
        idempotencyKey: values_1.v.optional(values_1.v.string()),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var task, transition_1, patch, _a;
        var _b, _c, _d, _e, _f, _g;
        return __generator(this, function (_h) {
            switch (_h.label) {
                case 0: return [4 /*yield*/, ctx.db.get(args.taskId)];
                case 1:
                    task = _h.sent();
                    if (!task) {
                        throw new Error("Task not found");
                    }
                    if (!(args.status && args.status !== task.status)) return [3 /*break*/, 3];
                    return [4 /*yield*/, ctx.runMutation(api_1.api.tasks.transition, {
                            taskId: args.taskId,
                            toStatus: args.status,
                            actorType: "HUMAN",
                            actorUserId: (_b = args.actorUserId) !== null && _b !== void 0 ? _b : "operator",
                            idempotencyKey: (_c = args.idempotencyKey) !== null && _c !== void 0 ? _c : "update-status:".concat(args.taskId, ":").concat(args.status, ":").concat((_d = args.actorUserId) !== null && _d !== void 0 ? _d : "operator"),
                            reason: "Task updated from editor",
                            workPlan: task.workPlan,
                            deliverable: task.deliverable,
                            reviewChecklist: task.reviewChecklist,
                            blockedReason: task.blockedReason,
                        })];
                case 2:
                    transition_1 = _h.sent();
                    if (!transition_1.success) {
                        throw new Error(((_e = transition_1.errors) === null || _e === void 0 ? void 0 : _e.map(function (e) { return e.message; }).join(", ")) ||
                            "Status transition failed");
                    }
                    _h.label = 3;
                case 3:
                    patch = {};
                    if (args.title !== undefined)
                        patch.title = args.title.trim();
                    if (args.description !== undefined)
                        patch.description = args.description.trim() || undefined;
                    if (args.priority !== undefined)
                        patch.priority = args.priority;
                    if (args.type !== undefined)
                        patch.type = args.type;
                    if (args.estimatedCost !== undefined)
                        patch.estimatedCost = args.estimatedCost;
                    if (!(args.assigneeIds !== undefined)) return [3 /*break*/, 5];
                    patch.assigneeIds = args.assigneeIds;
                    _a = patch;
                    return [4 /*yield*/, resolveAssigneeInstanceIds(ctx, args.assigneeIds)];
                case 4:
                    _a.assigneeInstanceIds = _h.sent();
                    _h.label = 5;
                case 5:
                    if (!(Object.keys(patch).length > 0)) return [3 /*break*/, 8];
                    return [4 /*yield*/, ctx.db.patch(args.taskId, patch)];
                case 6:
                    _h.sent();
                    return [4 /*yield*/, ctx.db.insert("activities", {
                            projectId: task.projectId,
                            actorType: "HUMAN",
                            actorId: (_f = args.actorUserId) !== null && _f !== void 0 ? _f : "operator",
                            action: "TASK_UPDATED",
                            description: "Task \"".concat((_g = args.title) !== null && _g !== void 0 ? _g : task.title, "\" updated"),
                            targetType: "TASK",
                            targetId: args.taskId,
                            taskId: args.taskId,
                            metadata: { updatedFields: Object.keys(patch) },
                        })];
                case 7:
                    _h.sent();
                    _h.label = 8;
                case 8: return [4 /*yield*/, ctx.db.get(args.taskId)];
                case 9: return [2 /*return*/, _h.sent()];
            }
        });
    }); },
});
