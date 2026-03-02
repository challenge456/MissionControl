"use strict";
/**
 * Health Check Endpoints
 *
 * Provides health and readiness checks for monitoring.
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
exports.status = exports.metrics = exports.ready = exports.check = void 0;
var server_1 = require("./_generated/server");
var values_1 = require("convex/values");
// ============================================================================
// HEALTH CHECK
// ============================================================================
/**
 * Basic health check - returns OK if database is accessible.
 */
exports.check = (0, server_1.query)({
    args: {},
    handler: function (ctx) { return __awaiter(void 0, void 0, void 0, function () {
        var now, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    now = Date.now();
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, ctx.db.query("projects").take(1)];
                case 2:
                    _a.sent();
                    return [2 /*return*/, {
                            status: "healthy",
                            timestamp: now,
                            database: "connected",
                            message: "Mission Control is operational",
                        }];
                case 3:
                    error_1 = _a.sent();
                    return [2 /*return*/, {
                            status: "unhealthy",
                            timestamp: now,
                            database: "error",
                            message: error_1 instanceof Error ? error_1.message : "Unknown error",
                        }];
                case 4: return [2 /*return*/];
            }
        });
    }); },
});
// ============================================================================
// READINESS CHECK
// ============================================================================
/**
 * Readiness check - returns OK if system is ready to serve traffic.
 * Checks:
 * - Database accessible
 * - At least one project exists
 * - At least one agent registered
 */
exports.ready = (0, server_1.query)({
    args: {},
    handler: function (ctx) { return __awaiter(void 0, void 0, void 0, function () {
        var now, checks, projects, agents, policies, allReady, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    now = Date.now();
                    checks = {};
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 5, , 6]);
                    // Check database
                    checks.database = true;
                    return [4 /*yield*/, ctx.db.query("projects").take(1)];
                case 2:
                    projects = _a.sent();
                    checks.projects = projects.length > 0;
                    return [4 /*yield*/, ctx.db.query("agents").take(1)];
                case 3:
                    agents = _a.sent();
                    checks.agents = agents.length > 0;
                    return [4 /*yield*/, ctx.db.query("policies").take(1)];
                case 4:
                    policies = _a.sent();
                    checks.policy = policies.length > 0;
                    allReady = Object.values(checks).every(function (v) { return v; });
                    return [2 /*return*/, {
                            status: allReady ? "ready" : "not_ready",
                            timestamp: now,
                            checks: checks,
                            message: allReady
                                ? "System is ready to serve traffic"
                                : "System is not fully initialized",
                        }];
                case 5:
                    error_2 = _a.sent();
                    return [2 /*return*/, {
                            status: "error",
                            timestamp: now,
                            checks: checks,
                            message: error_2 instanceof Error ? error_2.message : "Unknown error",
                        }];
                case 6: return [2 /*return*/];
            }
        });
    }); },
});
// ============================================================================
// METRICS
// ============================================================================
/**
 * System metrics for monitoring.
 */
exports.metrics = (0, server_1.query)({
    args: {
        projectId: values_1.v.optional(values_1.v.id("projects")),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var now, projectsQuery, projects, agents, _a, tasksQuery, tasks, runsQuery, runs, approvals, _b, alertsQuery, alerts, activeAgents, pausedAgents, quarantinedAgents, tasksByStatus, totalCost, avgCostPerRun, pendingApprovals, openAlerts;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    now = Date.now();
                    projectsQuery = ctx.db.query("projects");
                    return [4 /*yield*/, projectsQuery.collect()];
                case 1:
                    projects = _c.sent();
                    if (!args.projectId) return [3 /*break*/, 3];
                    return [4 /*yield*/, ctx.db.query("agents").withIndex("by_project", function (q) { return q.eq("projectId", args.projectId); }).collect()];
                case 2:
                    _a = _c.sent();
                    return [3 /*break*/, 5];
                case 3: return [4 /*yield*/, ctx.db.query("agents").take(1000)];
                case 4:
                    _a = _c.sent();
                    _c.label = 5;
                case 5:
                    agents = _a;
                    tasksQuery = args.projectId
                        ? ctx.db.query("tasks").withIndex("by_project", function (q) { return q.eq("projectId", args.projectId); })
                        : ctx.db.query("tasks");
                    return [4 /*yield*/, tasksQuery.collect()];
                case 6:
                    tasks = _c.sent();
                    runsQuery = args.projectId
                        ? ctx.db.query("runs").filter(function (q) { return q.eq(q.field("projectId"), args.projectId); })
                        : ctx.db.query("runs");
                    return [4 /*yield*/, runsQuery.take(1000)];
                case 7:
                    runs = _c.sent();
                    if (!args.projectId) return [3 /*break*/, 9];
                    return [4 /*yield*/, ctx.db.query("approvals").withIndex("by_project", function (q) { return q.eq("projectId", args.projectId); }).collect()];
                case 8:
                    _b = _c.sent();
                    return [3 /*break*/, 11];
                case 9: return [4 /*yield*/, ctx.db.query("approvals").take(500)];
                case 10:
                    _b = _c.sent();
                    _c.label = 11;
                case 11:
                    approvals = _b;
                    alertsQuery = args.projectId
                        ? ctx.db.query("alerts").withIndex("by_project", function (q) { return q.eq("projectId", args.projectId); })
                        : ctx.db.query("alerts");
                    return [4 /*yield*/, alertsQuery.collect()];
                case 12:
                    alerts = _c.sent();
                    activeAgents = agents.filter(function (a) { return a.status === "ACTIVE"; }).length;
                    pausedAgents = agents.filter(function (a) { return a.status === "PAUSED"; }).length;
                    quarantinedAgents = agents.filter(function (a) { return a.status === "QUARANTINED"; }).length;
                    tasksByStatus = {
                        inbox: tasks.filter(function (t) { return t.status === "INBOX"; }).length,
                        assigned: tasks.filter(function (t) { return t.status === "ASSIGNED"; }).length,
                        inProgress: tasks.filter(function (t) { return t.status === "IN_PROGRESS"; }).length,
                        review: tasks.filter(function (t) { return t.status === "REVIEW"; }).length,
                        needsApproval: tasks.filter(function (t) { return t.status === "NEEDS_APPROVAL"; }).length,
                        blocked: tasks.filter(function (t) { return t.status === "BLOCKED"; }).length,
                        done: tasks.filter(function (t) { return t.status === "DONE"; }).length,
                        canceled: tasks.filter(function (t) { return t.status === "CANCELED"; }).length,
                    };
                    totalCost = runs.reduce(function (sum, r) { return sum + r.costUsd; }, 0);
                    avgCostPerRun = runs.length > 0 ? totalCost / runs.length : 0;
                    pendingApprovals = approvals.filter(function (a) { return a.status === "PENDING" || a.status === "ESCALATED"; }).length;
                    openAlerts = alerts.filter(function (a) { return a.status === "OPEN"; }).length;
                    return [2 /*return*/, {
                            timestamp: now,
                            projects: {
                                total: projects.length,
                            },
                            agents: {
                                total: agents.length,
                                active: activeAgents,
                                paused: pausedAgents,
                                quarantined: quarantinedAgents,
                                offline: agents.length - activeAgents - pausedAgents - quarantinedAgents,
                            },
                            tasks: {
                                total: tasks.length,
                                byStatus: tasksByStatus,
                            },
                            runs: {
                                total: runs.length,
                                totalCost: totalCost,
                                avgCostPerRun: avgCostPerRun,
                            },
                            approvals: {
                                total: approvals.length,
                                pending: pendingApprovals,
                            },
                            alerts: {
                                total: alerts.length,
                                open: openAlerts,
                            },
                        }];
            }
        });
    }); },
});
// ============================================================================
// STATUS
// ============================================================================
/**
 * Detailed system status.
 */
exports.status = (0, server_1.query)({
    args: {},
    handler: function (ctx) { return __awaiter(void 0, void 0, void 0, function () {
        var now, checks, startDb, error_3, projects, error_4, _a, activeAgents, quarantinedAgents, allAgents, activeCount, quarantinedCount, totalCount, error_5, _b, blockedTasks, inProgressTasks, blockedCount, inProgressCount, error_6, _c, pendingApprovals, escalatedApprovals, pendingCount, error_7, alerts, openAlerts, criticalAlerts, error_8, statuses, overallStatus, earliestProject, startedAt, uptimeSeconds, uptimeHours, uptimeMinutes, uptimeDisplay;
        var _d, _e;
        return __generator(this, function (_f) {
            switch (_f.label) {
                case 0:
                    now = Date.now();
                    checks = {};
                    _f.label = 1;
                case 1:
                    _f.trys.push([1, 3, , 4]);
                    startDb = Date.now();
                    return [4 /*yield*/, ctx.db.query("projects").take(1)];
                case 2:
                    _f.sent();
                    checks.database = {
                        status: "healthy",
                        message: "Database connection OK",
                        responseTime: Date.now() - startDb,
                    };
                    return [3 /*break*/, 4];
                case 3:
                    error_3 = _f.sent();
                    checks.database = {
                        status: "unhealthy",
                        message: error_3 instanceof Error ? error_3.message : "Database error",
                    };
                    return [3 /*break*/, 4];
                case 4:
                    _f.trys.push([4, 6, , 7]);
                    return [4 /*yield*/, ctx.db.query("projects").collect()];
                case 5:
                    projects = _f.sent();
                    checks.projects = {
                        status: projects.length > 0 ? "healthy" : "degraded",
                        message: "".concat(projects.length, " project").concat(projects.length !== 1 ? 's' : '', " configured"),
                    };
                    return [3 /*break*/, 7];
                case 6:
                    error_4 = _f.sent();
                    checks.projects = {
                        status: "unhealthy",
                        message: "Failed to query projects",
                    };
                    return [3 /*break*/, 7];
                case 7:
                    _f.trys.push([7, 9, , 10]);
                    return [4 /*yield*/, Promise.all([
                            ctx.db.query("agents").withIndex("by_status", function (q) { return q.eq("status", "ACTIVE"); }).collect(),
                            ctx.db.query("agents").withIndex("by_status", function (q) { return q.eq("status", "QUARANTINED"); }).collect(),
                            ctx.db.query("agents").take(1000), // cap for total count; not a full scan
                        ])];
                case 8:
                    _a = _f.sent(), activeAgents = _a[0], quarantinedAgents = _a[1], allAgents = _a[2];
                    activeCount = activeAgents.length;
                    quarantinedCount = quarantinedAgents.length;
                    totalCount = allAgents.length;
                    checks.agents = {
                        status: quarantinedCount > 0 ? "degraded" : totalCount > 0 ? "healthy" : "degraded",
                        message: "".concat(activeCount, " active, ").concat(totalCount, " total").concat(quarantinedCount > 0 ? ", ".concat(quarantinedCount, " quarantined") : ''),
                    };
                    return [3 /*break*/, 10];
                case 9:
                    error_5 = _f.sent();
                    checks.agents = {
                        status: "unhealthy",
                        message: "Failed to query agents",
                    };
                    return [3 /*break*/, 10];
                case 10:
                    _f.trys.push([10, 12, , 13]);
                    return [4 /*yield*/, Promise.all([
                            ctx.db.query("tasks").withIndex("by_status", function (q) { return q.eq("status", "BLOCKED"); }).take(100),
                            ctx.db.query("tasks").withIndex("by_status", function (q) { return q.eq("status", "IN_PROGRESS"); }).take(100),
                        ])];
                case 11:
                    _b = _f.sent(), blockedTasks = _b[0], inProgressTasks = _b[1];
                    blockedCount = blockedTasks.length;
                    inProgressCount = inProgressTasks.length;
                    checks.tasks = {
                        status: blockedCount > 5 ? "degraded" : "healthy",
                        message: "".concat(inProgressCount, " in progress, ").concat(blockedCount, " blocked"),
                    };
                    return [3 /*break*/, 13];
                case 12:
                    error_6 = _f.sent();
                    checks.tasks = {
                        status: "unhealthy",
                        message: "Failed to query tasks",
                    };
                    return [3 /*break*/, 13];
                case 13:
                    _f.trys.push([13, 15, , 16]);
                    return [4 /*yield*/, Promise.all([
                            ctx.db.query("approvals").withIndex("by_status", function (q) { return q.eq("status", "PENDING"); }).take(50),
                            ctx.db.query("approvals").withIndex("by_status", function (q) { return q.eq("status", "ESCALATED"); }).take(50),
                        ])];
                case 14:
                    _c = _f.sent(), pendingApprovals = _c[0], escalatedApprovals = _c[1];
                    pendingCount = pendingApprovals.length + escalatedApprovals.length;
                    checks.approvals = {
                        status: pendingCount > 10 ? "degraded" : "healthy",
                        message: "".concat(pendingCount, " pending approval").concat(pendingCount !== 1 ? 's' : ''),
                    };
                    return [3 /*break*/, 16];
                case 15:
                    error_7 = _f.sent();
                    checks.approvals = {
                        status: "unhealthy",
                        message: "Failed to query approvals",
                    };
                    return [3 /*break*/, 16];
                case 16:
                    _f.trys.push([16, 18, , 19]);
                    return [4 /*yield*/, ctx.db.query("alerts").take(500)];
                case 17:
                    alerts = _f.sent();
                    openAlerts = alerts.filter(function (a) { return a.status === "OPEN"; }).length;
                    criticalAlerts = alerts.filter(function (a) { return a.severity === "CRITICAL" && a.status === "OPEN"; }).length;
                    checks.alerts = {
                        status: criticalAlerts > 0 ? "unhealthy" : openAlerts > 5 ? "degraded" : "healthy",
                        message: "".concat(openAlerts, " open alert").concat(openAlerts !== 1 ? 's' : '').concat(criticalAlerts > 0 ? " (".concat(criticalAlerts, " critical)") : ''),
                    };
                    return [3 /*break*/, 19];
                case 18:
                    error_8 = _f.sent();
                    checks.alerts = {
                        status: "unhealthy",
                        message: "Failed to query alerts",
                    };
                    return [3 /*break*/, 19];
                case 19:
                    statuses = Object.values(checks).map(function (c) { return c.status; });
                    overallStatus = "healthy";
                    if (statuses.includes("unhealthy")) {
                        overallStatus = "unhealthy";
                    }
                    else if (statuses.includes("degraded")) {
                        overallStatus = "degraded";
                    }
                    return [4 /*yield*/, ctx.db.query("projects").order("asc").take(1)];
                case 20:
                    earliestProject = _f.sent();
                    startedAt = (_e = (_d = earliestProject[0]) === null || _d === void 0 ? void 0 : _d._creationTime) !== null && _e !== void 0 ? _e : now;
                    uptimeSeconds = Math.max(0, Math.floor((now - startedAt) / 1000));
                    uptimeHours = Math.floor(uptimeSeconds / 3600);
                    uptimeMinutes = Math.floor((uptimeSeconds % 3600) / 60);
                    uptimeDisplay = uptimeHours > 0
                        ? "".concat(uptimeHours, "h ").concat(uptimeMinutes, "m")
                        : "".concat(uptimeMinutes, "m");
                    return [2 /*return*/, {
                            timestamp: now,
                            status: overallStatus,
                            message: overallStatus === "healthy"
                                ? "All systems operational"
                                : overallStatus === "degraded"
                                    ? "Some systems degraded"
                                    : "System issues detected",
                            checks: checks,
                            uptime: uptimeDisplay,
                        }];
            }
        });
    }); },
});
