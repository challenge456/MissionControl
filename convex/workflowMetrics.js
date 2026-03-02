"use strict";
/**
 * Workflow Metrics — Convex Functions
 *
 * Track and analyze workflow performance over time.
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
exports.refreshAll = exports.updateMetrics = exports.getSummary = exports.getAllMetrics = exports.getWorkflowMetrics = void 0;
var values_1 = require("convex/values");
var server_1 = require("./_generated/server");
var api_1 = require("./_generated/api");
// ============================================================================
// QUERIES
// ============================================================================
/**
 * Get metrics for a specific workflow
 */
exports.getWorkflowMetrics = (0, server_1.query)({
    args: {
        workflowId: values_1.v.string(),
        projectId: values_1.v.optional(values_1.v.id("projects")),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var query, metrics;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    query = ctx.db
                        .query("workflowMetrics")
                        .withIndex("by_workflow", function (q) { return q.eq("workflowId", args.workflowId); });
                    return [4 /*yield*/, query.order("desc").first()];
                case 1:
                    metrics = _a.sent();
                    return [2 /*return*/, metrics];
            }
        });
    }); },
});
/**
 * Get metrics for all workflows
 */
exports.getAllMetrics = (0, server_1.query)({
    args: {
        projectId: values_1.v.optional(values_1.v.id("projects")),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var allMetrics, _a, latestByWorkflow, _i, allMetrics_1, metric, existing;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    if (!args.projectId) return [3 /*break*/, 2];
                    return [4 /*yield*/, ctx.db
                            .query("workflowMetrics")
                            .withIndex("by_project", function (q) { return q.eq("projectId", args.projectId); })
                            .collect()];
                case 1:
                    _a = _b.sent();
                    return [3 /*break*/, 4];
                case 2: return [4 /*yield*/, ctx.db.query("workflowMetrics").collect()];
                case 3:
                    _a = _b.sent();
                    _b.label = 4;
                case 4:
                    allMetrics = _a;
                    latestByWorkflow = new Map();
                    for (_i = 0, allMetrics_1 = allMetrics; _i < allMetrics_1.length; _i++) {
                        metric = allMetrics_1[_i];
                        existing = latestByWorkflow.get(metric.workflowId);
                        if (!existing || metric.lastUpdated > existing.lastUpdated) {
                            latestByWorkflow.set(metric.workflowId, metric);
                        }
                    }
                    return [2 /*return*/, Array.from(latestByWorkflow.values())];
            }
        });
    }); },
});
/**
 * Get workflow performance summary
 */
exports.getSummary = (0, server_1.query)({
    args: {
        projectId: values_1.v.optional(values_1.v.id("projects")),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var runs, _a, total, completed, failed, running, paused, successRate, completedRuns, avgDuration, totalRetries, totalEscalations;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    if (!args.projectId) return [3 /*break*/, 2];
                    return [4 /*yield*/, ctx.db
                            .query("workflowRuns")
                            .withIndex("by_project", function (q) { return q.eq("projectId", args.projectId); })
                            .collect()];
                case 1:
                    _a = _b.sent();
                    return [3 /*break*/, 4];
                case 2: return [4 /*yield*/, ctx.db.query("workflowRuns").collect()];
                case 3:
                    _a = _b.sent();
                    _b.label = 4;
                case 4:
                    runs = _a;
                    total = runs.length;
                    completed = runs.filter(function (r) { return r.status === "COMPLETED"; }).length;
                    failed = runs.filter(function (r) { return r.status === "FAILED"; }).length;
                    running = runs.filter(function (r) { return r.status === "RUNNING"; }).length;
                    paused = runs.filter(function (r) { return r.status === "PAUSED"; }).length;
                    successRate = total > 0 ? completed / total : 0;
                    completedRuns = runs.filter(function (r) { return r.completedAt; });
                    avgDuration = completedRuns.length > 0
                        ? completedRuns.reduce(function (sum, r) { return sum + (r.completedAt - r.startedAt); }, 0) /
                            completedRuns.length
                        : 0;
                    totalRetries = runs.reduce(function (sum, r) { return sum + r.steps.reduce(function (s, step) { return s + step.retryCount; }, 0); }, 0);
                    totalEscalations = paused;
                    return [2 /*return*/, {
                            total: total,
                            completed: completed,
                            failed: failed,
                            running: running,
                            paused: paused,
                            successRate: successRate,
                            avgDurationMs: avgDuration,
                            totalRetries: totalRetries,
                            totalEscalations: totalEscalations,
                        }];
            }
        });
    }); },
});
// ============================================================================
// MUTATIONS
// ============================================================================
/**
 * Update metrics for a workflow (called when a run completes)
 */
exports.updateMetrics = (0, server_1.internalMutation)({
    args: {
        workflowId: values_1.v.string(),
        projectId: values_1.v.optional(values_1.v.id("projects")),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var now, periodStart, runs, totalRuns, successfulRuns, failedRuns, pausedRuns, successRate, completedRuns, durations, avgDurationMs, minDurationMs, maxDurationMs, totalSteps, completedSteps, avgStepsCompleted, totalRetries, totalEscalations, stepStats, _i, runs_1, run, _a, _b, step, stats, bottlenecks, existing, metricsData;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    now = Date.now();
                    periodStart = now - 30 * 24 * 60 * 60 * 1000;
                    return [4 /*yield*/, ctx.db
                            .query("workflowRuns")
                            .withIndex("by_workflow_id", function (q) { return q.eq("workflowId", args.workflowId); })
                            .filter(function (q) { return q.gte(q.field("startedAt"), periodStart); })
                            .collect()];
                case 1:
                    runs = _c.sent();
                    if (runs.length === 0) {
                        return [2 /*return*/, { success: true, message: "No runs to analyze" }];
                    }
                    totalRuns = runs.length;
                    successfulRuns = runs.filter(function (r) { return r.status === "COMPLETED"; }).length;
                    failedRuns = runs.filter(function (r) { return r.status === "FAILED"; }).length;
                    pausedRuns = runs.filter(function (r) { return r.status === "PAUSED"; }).length;
                    successRate = successfulRuns / totalRuns;
                    completedRuns = runs.filter(function (r) { return r.completedAt; });
                    durations = completedRuns.map(function (r) { return r.completedAt - r.startedAt; });
                    avgDurationMs = durations.length > 0 ? durations.reduce(function (a, b) { return a + b; }, 0) / durations.length : 0;
                    minDurationMs = durations.length > 0 ? Math.min.apply(Math, durations) : 0;
                    maxDurationMs = durations.length > 0 ? Math.max.apply(Math, durations) : 0;
                    totalSteps = runs.reduce(function (sum, r) { return sum + r.steps.length; }, 0);
                    completedSteps = runs.reduce(function (sum, r) { return sum + r.steps.filter(function (s) { return s.status === "DONE"; }).length; }, 0);
                    avgStepsCompleted = completedSteps / runs.length;
                    totalRetries = runs.reduce(function (sum, r) { return sum + r.steps.reduce(function (s, step) { return s + step.retryCount; }, 0); }, 0);
                    totalEscalations = pausedRuns;
                    stepStats = new Map();
                    for (_i = 0, runs_1 = runs; _i < runs_1.length; _i++) {
                        run = runs_1[_i];
                        for (_a = 0, _b = run.steps; _a < _b.length; _a++) {
                            step = _b[_a];
                            stats = stepStats.get(step.stepId) || { failures: 0, retries: 0, total: 0 };
                            stats.total++;
                            if (step.status === "FAILED")
                                stats.failures++;
                            stats.retries += step.retryCount;
                            stepStats.set(step.stepId, stats);
                        }
                    }
                    bottlenecks = Array.from(stepStats.entries())
                        .map(function (_a) {
                        var stepId = _a[0], stats = _a[1];
                        return ({
                            stepId: stepId,
                            failureRate: stats.failures / stats.total,
                            avgRetries: stats.retries / stats.total,
                        });
                    })
                        .filter(function (b) { return b.failureRate > 0.1 || b.avgRetries > 0.5; }) // Only significant bottlenecks
                        .sort(function (a, b) { return b.failureRate - a.failureRate; })
                        .slice(0, 5);
                    return [4 /*yield*/, ctx.db
                            .query("workflowMetrics")
                            .withIndex("by_workflow", function (q) { return q.eq("workflowId", args.workflowId); })
                            .filter(function (q) { return q.eq(q.field("periodStart"), periodStart); })
                            .first()];
                case 2:
                    existing = _c.sent();
                    metricsData = {
                        workflowId: args.workflowId,
                        projectId: args.projectId,
                        periodStart: periodStart,
                        periodEnd: now,
                        totalRuns: totalRuns,
                        successfulRuns: successfulRuns,
                        failedRuns: failedRuns,
                        pausedRuns: pausedRuns,
                        successRate: successRate,
                        avgDurationMs: avgDurationMs,
                        minDurationMs: minDurationMs,
                        maxDurationMs: maxDurationMs,
                        avgStepsCompleted: avgStepsCompleted,
                        totalRetries: totalRetries,
                        totalEscalations: totalEscalations,
                        bottlenecks: bottlenecks,
                        lastUpdated: now,
                    };
                    if (!existing) return [3 /*break*/, 4];
                    return [4 /*yield*/, ctx.db.patch(existing._id, metricsData)];
                case 3:
                    _c.sent();
                    return [3 /*break*/, 6];
                case 4: return [4 /*yield*/, ctx.db.insert("workflowMetrics", metricsData)];
                case 5:
                    _c.sent();
                    _c.label = 6;
                case 6: return [2 /*return*/, { success: true }];
            }
        });
    }); },
});
/**
 * Refresh metrics for all workflows
 */
exports.refreshAll = (0, server_1.mutation)({
    handler: function (ctx) { return __awaiter(void 0, void 0, void 0, function () {
        var workflows, _i, workflows_1, workflow;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, ctx.db.query("workflows").collect()];
                case 1:
                    workflows = _a.sent();
                    _i = 0, workflows_1 = workflows;
                    _a.label = 2;
                case 2:
                    if (!(_i < workflows_1.length)) return [3 /*break*/, 5];
                    workflow = workflows_1[_i];
                    return [4 /*yield*/, ctx.runMutation(api_1.internal.workflowMetrics.updateMetrics, {
                            workflowId: workflow.workflowId,
                        })];
                case 3:
                    _a.sent();
                    _a.label = 4;
                case 4:
                    _i++;
                    return [3 /*break*/, 2];
                case 5: return [2 /*return*/, { success: true, count: workflows.length }];
            }
        });
    }); },
});
