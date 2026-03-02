"use strict";
/**
 * Monitoring & Error Tracking
 *
 * Centralized error logging and monitoring utilities.
 */
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
exports.exportAuditLog = exports.getAuditLog = exports.getPerformanceStats = exports.logPerformance = exports.listRecentErrors = exports.logError = void 0;
var values_1 = require("convex/values");
var server_1 = require("./_generated/server");
// ============================================================================
// ERROR LOGGING
// ============================================================================
/**
 * Log an error for monitoring and debugging.
 */
exports.logError = (0, server_1.mutation)({
    args: {
        projectId: values_1.v.optional(values_1.v.id("projects")),
        source: values_1.v.string(), // e.g., "agent-runner", "telegram-bot", "ui"
        errorType: values_1.v.string(), // e.g., "API_ERROR", "VALIDATION_ERROR", "TIMEOUT"
        message: values_1.v.string(),
        stack: values_1.v.optional(values_1.v.string()),
        context: values_1.v.optional(values_1.v.any()),
        agentId: values_1.v.optional(values_1.v.id("agents")),
        taskId: values_1.v.optional(values_1.v.id("tasks")),
        runId: values_1.v.optional(values_1.v.id("runs")),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: 
                // Log as activity
                return [4 /*yield*/, ctx.db.insert("activities", {
                        projectId: args.projectId,
                        actorType: "SYSTEM",
                        action: "ERROR_LOGGED",
                        description: "".concat(args.source, ": ").concat(args.errorType, " - ").concat(args.message),
                        targetType: "ERROR",
                        agentId: args.agentId,
                        taskId: args.taskId,
                        metadata: {
                            errorType: args.errorType,
                            stack: args.stack,
                            context: args.context,
                            runId: args.runId,
                        },
                    })];
                case 1:
                    // Log as activity
                    _a.sent();
                    if (!["API_ERROR", "DATABASE_ERROR", "CRITICAL"].includes(args.errorType)) return [3 /*break*/, 3];
                    return [4 /*yield*/, ctx.db.insert("alerts", {
                            projectId: args.projectId,
                            severity: "CRITICAL",
                            type: "SYSTEM_ERROR",
                            title: "".concat(args.source, ": ").concat(args.errorType),
                            description: args.message,
                            agentId: args.agentId,
                            taskId: args.taskId,
                            status: "OPEN",
                            metadata: {
                                errorType: args.errorType,
                                stack: args.stack,
                                context: args.context,
                            },
                        })];
                case 2:
                    _a.sent();
                    _a.label = 3;
                case 3: return [2 /*return*/, { success: true }];
            }
        });
    }); },
});
/**
 * Get recent errors for debugging.
 */
exports.listRecentErrors = (0, server_1.query)({
    args: {
        projectId: values_1.v.optional(values_1.v.id("projects")),
        limit: values_1.v.optional(values_1.v.number()),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var activities, filtered;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, ctx.db
                        .query("activities")
                        .filter(function (q) { return q.eq(q.field("action"), "ERROR_LOGGED"); })
                        .order("desc")
                        .take((_a = args.limit) !== null && _a !== void 0 ? _a : 50)];
                case 1:
                    activities = _b.sent();
                    filtered = args.projectId
                        ? activities.filter(function (a) { return a.projectId === args.projectId; })
                        : activities;
                    return [2 /*return*/, filtered];
            }
        });
    }); },
});
// ============================================================================
// PERFORMANCE MONITORING
// ============================================================================
/**
 * Log performance metrics.
 */
exports.logPerformance = (0, server_1.mutation)({
    args: {
        projectId: values_1.v.optional(values_1.v.id("projects")),
        operation: values_1.v.string(),
        durationMs: values_1.v.number(),
        success: values_1.v.boolean(),
        metadata: values_1.v.optional(values_1.v.any()),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, ctx.db.insert("activities", {
                        projectId: args.projectId,
                        actorType: "SYSTEM",
                        action: "PERFORMANCE_LOG",
                        description: "".concat(args.operation, ": ").concat(args.durationMs, "ms (").concat(args.success ? "success" : "failed", ")"),
                        targetType: "PERFORMANCE",
                        metadata: __assign({ operation: args.operation, durationMs: args.durationMs, success: args.success }, args.metadata),
                    })];
                case 1:
                    _a.sent();
                    if (!(args.durationMs > 10000)) return [3 /*break*/, 3];
                    return [4 /*yield*/, ctx.db.insert("alerts", {
                            projectId: args.projectId,
                            severity: "WARNING",
                            type: "PERFORMANCE",
                            title: "Slow Operation",
                            description: "".concat(args.operation, " took ").concat((args.durationMs / 1000).toFixed(1), "s"),
                            status: "OPEN",
                            metadata: {
                                operation: args.operation,
                                durationMs: args.durationMs,
                            },
                        })];
                case 2:
                    _a.sent();
                    _a.label = 3;
                case 3: return [2 /*return*/, { success: true }];
            }
        });
    }); },
});
/**
 * Get performance stats.
 */
exports.getPerformanceStats = (0, server_1.query)({
    args: {
        projectId: values_1.v.optional(values_1.v.id("projects")),
        operation: values_1.v.optional(values_1.v.string()),
        limit: values_1.v.optional(values_1.v.number()),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var activities, filtered, durations, avg, min, max;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, ctx.db
                        .query("activities")
                        .filter(function (q) { return q.eq(q.field("action"), "PERFORMANCE_LOG"); })
                        .order("desc")
                        .take((_a = args.limit) !== null && _a !== void 0 ? _a : 100)];
                case 1:
                    activities = _b.sent();
                    filtered = activities;
                    if (args.projectId) {
                        filtered = filtered.filter(function (a) { return a.projectId === args.projectId; });
                    }
                    if (args.operation) {
                        filtered = filtered.filter(function (a) { var _a; return ((_a = a.metadata) === null || _a === void 0 ? void 0 : _a.operation) === args.operation; });
                    }
                    durations = filtered.map(function (a) { var _a; return ((_a = a.metadata) === null || _a === void 0 ? void 0 : _a.durationMs) || 0; });
                    avg = durations.length > 0
                        ? durations.reduce(function (sum, d) { return sum + d; }, 0) / durations.length
                        : 0;
                    min = durations.length > 0 ? Math.min.apply(Math, durations) : 0;
                    max = durations.length > 0 ? Math.max.apply(Math, durations) : 0;
                    return [2 /*return*/, {
                            count: filtered.length,
                            avgDurationMs: avg,
                            minDurationMs: min,
                            maxDurationMs: max,
                            recentLogs: filtered.slice(0, 10),
                        }];
            }
        });
    }); },
});
// ============================================================================
// AUDIT LOG
// ============================================================================
/**
 * Get comprehensive audit log for compliance.
 */
exports.getAuditLog = (0, server_1.query)({
    args: {
        projectId: values_1.v.optional(values_1.v.id("projects")),
        startTime: values_1.v.optional(values_1.v.number()),
        endTime: values_1.v.optional(values_1.v.number()),
        actorType: values_1.v.optional(values_1.v.string()),
        action: values_1.v.optional(values_1.v.string()),
        limit: values_1.v.optional(values_1.v.number()),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var activities;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, ctx.db
                        .query("activities")
                        .order("desc")
                        .take((_a = args.limit) !== null && _a !== void 0 ? _a : 1000)];
                case 1:
                    activities = _b.sent();
                    // Apply filters
                    if (args.projectId) {
                        activities = activities.filter(function (a) { return a.projectId === args.projectId; });
                    }
                    if (args.startTime) {
                        activities = activities.filter(function (a) { return a._creationTime >= args.startTime; });
                    }
                    if (args.endTime) {
                        activities = activities.filter(function (a) { return a._creationTime <= args.endTime; });
                    }
                    if (args.actorType) {
                        activities = activities.filter(function (a) { return a.actorType === args.actorType; });
                    }
                    if (args.action) {
                        activities = activities.filter(function (a) { return a.action === args.action; });
                    }
                    return [2 /*return*/, activities];
            }
        });
    }); },
});
/**
 * Export audit log as markdown.
 */
exports.exportAuditLog = (0, server_1.query)({
    args: {
        projectId: values_1.v.optional(values_1.v.id("projects")),
        startTime: values_1.v.optional(values_1.v.number()),
        endTime: values_1.v.optional(values_1.v.number()),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var activities, activitiesToExport, report, byDate, _i, activities_1, activity, date, _a, _b, _c, date, dateActivities, _d, dateActivities_1, activity, time;
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0: return [4 /*yield*/, ctx.db
                        .query("activities")
                        .order("desc")
                        .take(10000)];
                case 1:
                    activities = _e.sent();
                    // Apply filters
                    if (args.projectId) {
                        activities = activities.filter(function (a) { return a.projectId === args.projectId; });
                    }
                    if (args.startTime) {
                        activities = activities.filter(function (a) { return a._creationTime >= args.startTime; });
                    }
                    if (args.endTime) {
                        activities = activities.filter(function (a) { return a._creationTime <= args.endTime; });
                    }
                    activitiesToExport = activities;
                    activities = activitiesToExport;
                    report = "# Mission Control Audit Log\n\n";
                    report += "**Generated:** ".concat(new Date().toISOString(), "\n");
                    if (args.startTime) {
                        report += "**Start:** ".concat(new Date(args.startTime).toISOString(), "\n");
                    }
                    if (args.endTime) {
                        report += "**End:** ".concat(new Date(args.endTime).toISOString(), "\n");
                    }
                    report += "**Total Events:** ".concat(activities.length, "\n\n");
                    report += "---\n\n";
                    byDate = {};
                    for (_i = 0, activities_1 = activities; _i < activities_1.length; _i++) {
                        activity = activities_1[_i];
                        date = new Date(activity._creationTime).toISOString().split("T")[0];
                        if (!byDate[date])
                            byDate[date] = [];
                        byDate[date].push(activity);
                    }
                    // Output by date
                    for (_a = 0, _b = Object.entries(byDate).sort(function (a, b) { return b[0].localeCompare(a[0]); }); _a < _b.length; _a++) {
                        _c = _b[_a], date = _c[0], dateActivities = _c[1];
                        report += "## ".concat(date, "\n\n");
                        report += "**Events:** ".concat(dateActivities.length, "\n\n");
                        for (_d = 0, dateActivities_1 = dateActivities; _d < dateActivities_1.length; _d++) {
                            activity = dateActivities_1[_d];
                            time = new Date(activity._creationTime).toLocaleTimeString();
                            report += "- **".concat(time, "** \u2014 ").concat(activity.actorType, " \u2014 ").concat(activity.action, "\n");
                            report += "  ".concat(activity.description, "\n");
                            if (activity.metadata) {
                                report += "  _Metadata: ".concat(JSON.stringify(activity.metadata).slice(0, 100), "_\n");
                            }
                            report += "\n";
                        }
                    }
                    return [2 /*return*/, report];
            }
        });
    }); },
});
