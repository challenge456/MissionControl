"use strict";
/**
 * Daily Standup Report — aggregates tasks, agents, approvals for human review.
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
exports.runDaily = exports.save = exports.generate = void 0;
var values_1 = require("convex/values");
var server_1 = require("./_generated/server");
/** Generate standup report (query — no side effects). */
exports.generate = (0, server_1.query)({
    args: {
        projectId: values_1.v.optional(values_1.v.id("projects")),
        at: values_1.v.optional(values_1.v.number()),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var now, agents, tasks, pendingApprovals, _a, pending, escalated, _b, pending, escalated, byStatus, activeAgents, pausedAgents, burnRateToday, report;
        var _c;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    now = (_c = args.at) !== null && _c !== void 0 ? _c : Date.now();
                    if (!args.projectId) return [3 /*break*/, 4];
                    return [4 /*yield*/, ctx.db
                            .query("agents")
                            .withIndex("by_project", function (q) { return q.eq("projectId", args.projectId); })
                            .collect()];
                case 1:
                    agents = _d.sent();
                    return [4 /*yield*/, ctx.db
                            .query("tasks")
                            .withIndex("by_project", function (q) { return q.eq("projectId", args.projectId); })
                            .collect()];
                case 2:
                    tasks = _d.sent();
                    return [4 /*yield*/, Promise.all([
                            ctx.db
                                .query("approvals")
                                .withIndex("by_project_status", function (q) {
                                return q.eq("projectId", args.projectId).eq("status", "PENDING");
                            })
                                .collect(),
                            ctx.db
                                .query("approvals")
                                .withIndex("by_project_status", function (q) {
                                return q.eq("projectId", args.projectId).eq("status", "ESCALATED");
                            })
                                .collect(),
                        ])];
                case 3:
                    _a = _d.sent(), pending = _a[0], escalated = _a[1];
                    pendingApprovals = __spreadArray(__spreadArray([], pending, true), escalated, true);
                    return [3 /*break*/, 8];
                case 4: return [4 /*yield*/, ctx.db.query("agents").collect()];
                case 5:
                    agents = _d.sent();
                    return [4 /*yield*/, ctx.db.query("tasks").collect()];
                case 6:
                    tasks = _d.sent();
                    return [4 /*yield*/, Promise.all([
                            ctx.db
                                .query("approvals")
                                .withIndex("by_status", function (q) { return q.eq("status", "PENDING"); })
                                .collect(),
                            ctx.db
                                .query("approvals")
                                .withIndex("by_status", function (q) { return q.eq("status", "ESCALATED"); })
                                .collect(),
                        ])];
                case 7:
                    _b = _d.sent(), pending = _b[0], escalated = _b[1];
                    pendingApprovals = __spreadArray(__spreadArray([], pending, true), escalated, true);
                    _d.label = 8;
                case 8:
                    byStatus = function (status) { return tasks.filter(function (t) { return t.status === status; }); };
                    activeAgents = agents.filter(function (a) { return a.status === "ACTIVE"; });
                    pausedAgents = agents.filter(function (a) { return a.status === "PAUSED"; });
                    burnRateToday = agents.reduce(function (sum, a) { return sum + a.spendToday; }, 0);
                    report = {
                        projectId: args.projectId,
                        generatedAt: now,
                        date: new Date(now).toISOString().slice(0, 10),
                        agents: {
                            total: agents.length,
                            active: activeAgents.length,
                            paused: pausedAgents.length,
                            list: agents.map(function (a) { return ({
                                id: a._id,
                                name: a.name,
                                role: a.role,
                                status: a.status,
                                spendToday: a.spendToday,
                                budgetDaily: a.budgetDaily,
                            }); }),
                        },
                        tasks: {
                            inbox: byStatus("INBOX").length,
                            assigned: byStatus("ASSIGNED").length,
                            inProgress: byStatus("IN_PROGRESS").length,
                            review: byStatus("REVIEW").length,
                            needsApproval: byStatus("NEEDS_APPROVAL").length,
                            blocked: byStatus("BLOCKED").length,
                            done: byStatus("DONE").length,
                            canceled: byStatus("CANCELED").length,
                            total: tasks.length,
                        },
                        approvals: {
                            pending: pendingApprovals.length,
                            items: pendingApprovals.slice(0, 20).map(function (a) { return ({
                                id: a._id,
                                actionSummary: a.actionSummary,
                                riskLevel: a.riskLevel,
                                requestorAgentId: a.requestorAgentId,
                                expiresAt: a.expiresAt,
                            }); }),
                        },
                        burnRate: {
                            today: burnRateToday,
                        },
                    };
                    return [2 /*return*/, report];
            }
        });
    }); },
});
/** Store standup report (mutation — for cron to save daily). */
exports.save = (0, server_1.mutation)({
    args: {
        report: values_1.v.any(),
        savedAt: values_1.v.number(),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, ctx.db.insert("activities", {
                        actorType: "SYSTEM",
                        action: "STANDUP_REPORT",
                        description: "Daily standup: ".concat(args.report.agents.active, " active agents, ").concat(args.report.tasks.total, " tasks, ").concat(args.report.approvals.pending, " pending approvals"),
                        targetType: "REPORT",
                        metadata: { report: args.report, savedAt: args.savedAt },
                    })];
                case 1:
                    _a.sent();
                    return [2 /*return*/, { success: true }];
            }
        });
    }); },
});
/** Run daily standup (mutation — for cron). Builds report and saves to activities. */
exports.runDaily = (0, server_1.mutation)({
    args: {},
    handler: function (ctx) { return __awaiter(void 0, void 0, void 0, function () {
        var now, agents, tasks, _a, pendingApprovals, escalatedApprovals, pendingLikeApprovals, byStatus, activeAgents, report;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    now = Date.now();
                    return [4 /*yield*/, ctx.db.query("agents").collect()];
                case 1:
                    agents = _b.sent();
                    return [4 /*yield*/, ctx.db.query("tasks").collect()];
                case 2:
                    tasks = _b.sent();
                    return [4 /*yield*/, Promise.all([
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
                    _a = _b.sent(), pendingApprovals = _a[0], escalatedApprovals = _a[1];
                    pendingLikeApprovals = __spreadArray(__spreadArray([], pendingApprovals, true), escalatedApprovals, true);
                    byStatus = function (status) { return tasks.filter(function (t) { return t.status === status; }); };
                    activeAgents = agents.filter(function (a) { return a.status === "ACTIVE"; });
                    report = {
                        generatedAt: now,
                        date: new Date(now).toISOString().slice(0, 10),
                        agents: { total: agents.length, active: activeAgents.length },
                        tasks: {
                            inbox: byStatus("INBOX").length,
                            assigned: byStatus("ASSIGNED").length,
                            inProgress: byStatus("IN_PROGRESS").length,
                            review: byStatus("REVIEW").length,
                            needsApproval: byStatus("NEEDS_APPROVAL").length,
                            blocked: byStatus("BLOCKED").length,
                            done: byStatus("DONE").length,
                            total: tasks.length,
                        },
                        approvals: { pending: pendingLikeApprovals.length },
                    };
                    return [4 /*yield*/, ctx.db.insert("activities", {
                            actorType: "SYSTEM",
                            action: "STANDUP_REPORT",
                            description: "Daily standup: ".concat(report.agents.active, " active agents, ").concat(report.tasks.total, " tasks, ").concat(report.approvals.pending, " pending approvals"),
                            targetType: "REPORT",
                            metadata: { report: report, savedAt: now },
                        })];
                case 4:
                    _b.sent();
                    return [2 /*return*/, { success: true, report: report }];
            }
        });
    }); },
});
