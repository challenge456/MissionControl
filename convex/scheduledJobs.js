"use strict";
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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.executeDue = exports.runNow = exports.remove = exports.setEnabled = exports.evaluatePolicy = exports.update = exports.create = exports.list = void 0;
var values_1 = require("convex/values");
var server_1 = require("./_generated/server");
var api_1 = require("./_generated/api");
function buildJobId() {
    return "job_".concat(Math.random().toString(36).slice(2, 10));
}
function parseNextRun(cronExpression, from) {
    if (from === void 0) { from = Date.now(); }
    // Supported minimal format: "*/N * * * *" -> every N minutes
    var match = cronExpression.match(/^\*\/(\d+)\s+\*\s+\*\s+\*\s+\*$/);
    if (!match)
        return from + 5 * 60 * 1000;
    var minutes = Math.max(Number(match[1]), 1);
    return from + minutes * 60 * 1000;
}
/** Evaluate run policy using only db reads (for use in mutations or queries). */
function evaluateRunPolicy(ctx, job) {
    return __awaiter(this, void 0, void 0, function () {
        var now, policy, params, allJobs, durationMs, cutoff_1, conflicting, inProgress, assigned, periodSeconds, periodMs, lastRun, periodSeconds, minRuns, intervalMs, lastRun, debounceSeconds, debounceMs, lastRun;
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
        return __generator(this, function (_l) {
            switch (_l.label) {
                case 0:
                    now = Date.now();
                    policy = ((_a = job.runPolicy) !== null && _a !== void 0 ? _a : "standard");
                    params = ((_b = job.runPolicyParams) !== null && _b !== void 0 ? _b : {});
                    if (policy === "standard") {
                        return [2 /*return*/, { allowed: true, reason: "Standard cron" }];
                    }
                    if (!job.conflictGroup) return [3 /*break*/, 2];
                    return [4 /*yield*/, ctx.db.query("scheduledJobs").collect()];
                case 1:
                    allJobs = _l.sent();
                    durationMs = (_c = job.lastRunDuration) !== null && _c !== void 0 ? _c : 5 * 60 * 1000;
                    cutoff_1 = now - durationMs;
                    conflicting = allJobs.filter(function (j) {
                        return j._id !== job._id &&
                            j.conflictGroup === job.conflictGroup &&
                            j.lastRun != null &&
                            j.lastRun >= cutoff_1;
                    });
                    if (conflicting.length > 0) {
                        return [2 /*return*/, {
                                allowed: false,
                                reason: "Conflict group \"".concat(job.conflictGroup, "\": another job ran within last ").concat(Math.round(durationMs / 60000), "m"),
                            }];
                    }
                    _l.label = 2;
                case 2:
                    if (!(policy === "run_if_idle")) return [3 /*break*/, 5];
                    return [4 /*yield*/, ctx.db
                            .query("tasks")
                            .withIndex("by_status", function (q) { return q.eq("status", "IN_PROGRESS"); })
                            .take(1)];
                case 3:
                    inProgress = _l.sent();
                    return [4 /*yield*/, ctx.db
                            .query("tasks")
                            .withIndex("by_status", function (q) { return q.eq("status", "ASSIGNED"); })
                            .take(1)];
                case 4:
                    assigned = _l.sent();
                    if (inProgress !== null && inProgress !== void 0 ? inProgress : assigned) {
                        return [2 /*return*/, { allowed: false, reason: "Agents busy (tasks IN_PROGRESS or ASSIGNED)" }];
                    }
                    return [2 /*return*/, { allowed: true, reason: "System idle" }];
                case 5:
                    if (policy === "run_if_not_run_since") {
                        periodSeconds = (_d = params.periodSeconds) !== null && _d !== void 0 ? _d : 86400;
                        periodMs = periodSeconds * 1000;
                        lastRun = (_e = job.lastRun) !== null && _e !== void 0 ? _e : 0;
                        if (now - lastRun < periodMs) {
                            return [2 /*return*/, {
                                    allowed: false,
                                    reason: "Last run ".concat(Math.round((now - lastRun) / 60000), "m ago; need ").concat(periodSeconds / 3600, "h since last run"),
                                }];
                        }
                        return [2 /*return*/, { allowed: true, reason: "Not run in ".concat(periodSeconds / 3600, "h") }];
                    }
                    if (policy === "run_at_least_per_period") {
                        periodSeconds = (_f = params.periodSeconds) !== null && _f !== void 0 ? _f : 86400;
                        minRuns = (_g = params.minRuns) !== null && _g !== void 0 ? _g : 1;
                        intervalMs = (periodSeconds / minRuns) * 1000;
                        lastRun = (_h = job.lastRun) !== null && _h !== void 0 ? _h : 0;
                        if (now - lastRun < intervalMs) {
                            return [2 /*return*/, {
                                    allowed: false,
                                    reason: "SLA: need ".concat(minRuns, " runs per ").concat(periodSeconds / 3600, "h; last run ").concat(Math.round((now - lastRun) / 60000), "m ago"),
                                }];
                        }
                        return [2 /*return*/, { allowed: true, reason: "SLA window allows run" }];
                    }
                    if (policy === "skip_if_last_run_within") {
                        debounceSeconds = (_j = params.debounceSeconds) !== null && _j !== void 0 ? _j : 600;
                        debounceMs = debounceSeconds * 1000;
                        lastRun = (_k = job.lastRun) !== null && _k !== void 0 ? _k : 0;
                        if (lastRun > 0 && now - lastRun < debounceMs) {
                            return [2 /*return*/, {
                                    allowed: false,
                                    reason: "Debounce: last run ".concat(Math.round((now - lastRun) / 60), "s ago (min ").concat(debounceSeconds, "s)"),
                                }];
                        }
                        return [2 /*return*/, { allowed: true, reason: "Debounce window passed" }];
                    }
                    return [2 /*return*/, { allowed: true, reason: "Unknown policy, allow" }];
            }
        });
    });
}
exports.list = (0, server_1.query)({
    args: {
        projectId: values_1.v.optional(values_1.v.id("projects")),
        enabledOnly: values_1.v.optional(values_1.v.boolean()),
        limit: values_1.v.optional(values_1.v.number()),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var rows, _a;
        var _b, _c;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    if (!args.projectId) return [3 /*break*/, 2];
                    return [4 /*yield*/, ctx.db.query("scheduledJobs").withIndex("by_project", function (q) { return q.eq("projectId", args.projectId); }).order("desc").take((_b = args.limit) !== null && _b !== void 0 ? _b : 100)];
                case 1:
                    _a = _d.sent();
                    return [3 /*break*/, 4];
                case 2: return [4 /*yield*/, ctx.db.query("scheduledJobs").order("desc").take((_c = args.limit) !== null && _c !== void 0 ? _c : 100)];
                case 3:
                    _a = _d.sent();
                    _d.label = 4;
                case 4:
                    rows = _a;
                    return [2 /*return*/, args.enabledOnly ? rows.filter(function (row) { return row.enabled; }) : rows];
            }
        });
    }); },
});
var runPolicyValidator = values_1.v.optional(values_1.v.union(values_1.v.literal("standard"), values_1.v.literal("run_if_idle"), values_1.v.literal("run_if_not_run_since"), values_1.v.literal("run_at_least_per_period"), values_1.v.literal("skip_if_last_run_within")));
exports.create = (0, server_1.mutation)({
    args: {
        projectId: values_1.v.optional(values_1.v.id("projects")),
        name: values_1.v.string(),
        jobType: values_1.v.union(values_1.v.literal("test_suite"), values_1.v.literal("qc_run"), values_1.v.literal("workflow"), values_1.v.literal("hybrid"), values_1.v.literal("mission_prompt")),
        cronExpression: values_1.v.string(),
        targetId: values_1.v.optional(values_1.v.string()),
        autoRerunFlaky: values_1.v.optional(values_1.v.boolean()),
        enabled: values_1.v.optional(values_1.v.boolean()),
        createdBy: values_1.v.string(),
        runPolicy: runPolicyValidator,
        runPolicyParams: values_1.v.optional(values_1.v.any()),
        priority: values_1.v.optional(values_1.v.number()),
        conflictGroup: values_1.v.optional(values_1.v.string()),
        lastRunDuration: values_1.v.optional(values_1.v.number()),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var now, id;
        var _a, _b, _c;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    now = Date.now();
                    return [4 /*yield*/, ctx.db.insert("scheduledJobs", {
                            tenantId: undefined,
                            projectId: args.projectId,
                            jobId: buildJobId(),
                            name: args.name,
                            jobType: args.jobType,
                            cronExpression: args.cronExpression,
                            nextRun: parseNextRun(args.cronExpression, now),
                            targetId: (_a = args.targetId) !== null && _a !== void 0 ? _a : "",
                            autoRerunFlaky: (_b = args.autoRerunFlaky) !== null && _b !== void 0 ? _b : false,
                            enabled: (_c = args.enabled) !== null && _c !== void 0 ? _c : true,
                            createdBy: args.createdBy,
                            runPolicy: args.runPolicy,
                            runPolicyParams: args.runPolicyParams,
                            priority: args.priority,
                            conflictGroup: args.conflictGroup,
                            lastRunDuration: args.lastRunDuration,
                        })];
                case 1:
                    id = _d.sent();
                    return [2 /*return*/, { id: id }];
            }
        });
    }); },
});
exports.update = (0, server_1.mutation)({
    args: {
        id: values_1.v.id("scheduledJobs"),
        name: values_1.v.optional(values_1.v.string()),
        cronExpression: values_1.v.optional(values_1.v.string()),
        targetId: values_1.v.optional(values_1.v.string()),
        autoRerunFlaky: values_1.v.optional(values_1.v.boolean()),
        enabled: values_1.v.optional(values_1.v.boolean()),
        runPolicy: runPolicyValidator,
        runPolicyParams: values_1.v.optional(values_1.v.any()),
        priority: values_1.v.optional(values_1.v.number()),
        conflictGroup: values_1.v.optional(values_1.v.string()),
        lastRunDuration: values_1.v.optional(values_1.v.number()),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var id, updates, job, patch;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    id = args.id, updates = __rest(args, ["id"]);
                    return [4 /*yield*/, ctx.db.get(id)];
                case 1:
                    job = _a.sent();
                    if (!job)
                        throw new Error("Scheduled job not found");
                    patch = {};
                    if (updates.name !== undefined)
                        patch.name = updates.name;
                    if (updates.cronExpression !== undefined) {
                        patch.cronExpression = updates.cronExpression;
                        patch.nextRun = parseNextRun(updates.cronExpression, Date.now());
                    }
                    if (updates.targetId !== undefined)
                        patch.targetId = updates.targetId;
                    if (updates.autoRerunFlaky !== undefined)
                        patch.autoRerunFlaky = updates.autoRerunFlaky;
                    if (updates.enabled !== undefined)
                        patch.enabled = updates.enabled;
                    if (updates.runPolicy !== undefined)
                        patch.runPolicy = updates.runPolicy;
                    if (updates.runPolicyParams !== undefined)
                        patch.runPolicyParams = updates.runPolicyParams;
                    if (updates.priority !== undefined)
                        patch.priority = updates.priority;
                    if (updates.conflictGroup !== undefined)
                        patch.conflictGroup = updates.conflictGroup;
                    if (updates.lastRunDuration !== undefined)
                        patch.lastRunDuration = updates.lastRunDuration;
                    return [4 /*yield*/, ctx.db.patch(id, patch)];
                case 2:
                    _a.sent();
                    return [2 /*return*/, { success: true }];
            }
        });
    }); },
});
exports.evaluatePolicy = (0, server_1.query)({
    args: { id: values_1.v.id("scheduledJobs") },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var job;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, ctx.db.get(args.id)];
                case 1:
                    job = _a.sent();
                    if (!job)
                        return [2 /*return*/, { allowed: false, reason: "Job not found" }];
                    return [2 /*return*/, evaluateRunPolicy(ctx, job)];
            }
        });
    }); },
});
exports.setEnabled = (0, server_1.mutation)({
    args: { id: values_1.v.id("scheduledJobs"), enabled: values_1.v.boolean() },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, ctx.db.patch(args.id, { enabled: args.enabled })];
                case 1:
                    _a.sent();
                    return [2 /*return*/, { success: true }];
            }
        });
    }); },
});
exports.remove = (0, server_1.mutation)({
    args: { id: values_1.v.id("scheduledJobs") },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, ctx.db.delete(args.id)];
                case 1:
                    _a.sent();
                    return [2 /*return*/, { success: true }];
            }
        });
    }); },
});
exports.runNow = (0, server_1.mutation)({
    args: {
        id: values_1.v.id("scheduledJobs"),
        dryRun: values_1.v.optional(values_1.v.boolean()),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var job, evaluation, now;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, ctx.db.get(args.id)];
                case 1:
                    job = _b.sent();
                    if (!job)
                        throw new Error("Scheduled job not found");
                    return [4 /*yield*/, evaluateRunPolicy(ctx, job)];
                case 2:
                    evaluation = _b.sent();
                    if (!evaluation.allowed) {
                        if (args.dryRun) {
                            return [2 /*return*/, { success: false, skipped: true, reason: evaluation.reason }];
                        }
                        throw new Error("Run policy blocked: ".concat(evaluation.reason));
                    }
                    if (args.dryRun) {
                        return [2 /*return*/, { success: true, wouldRun: true, reason: evaluation.reason }];
                    }
                    now = Date.now();
                    return [4 /*yield*/, ctx.db.patch(args.id, {
                            lastRun: now,
                            nextRun: parseNextRun(job.cronExpression, now),
                        })];
                case 3:
                    _b.sent();
                    if (!(job.jobType === "mission_prompt")) return [3 /*break*/, 5];
                    return [4 /*yield*/, ctx.scheduler.runAfter(0, api_1.api.mission.reversePrompt, {
                            projectId: (_a = job.projectId) !== null && _a !== void 0 ? _a : undefined,
                            autoCreate: true,
                            maxSuggestions: 3,
                        })];
                case 4:
                    _b.sent();
                    _b.label = 5;
                case 5: return [4 /*yield*/, ctx.db.insert("activities", {
                        projectId: job.projectId,
                        actorType: "SYSTEM",
                        action: "SCHEDULED_JOB_RUN_NOW",
                        description: "Manually triggered scheduled job ".concat(job.name),
                        targetType: "SCHEDULED_JOB",
                        targetId: args.id,
                        metadata: { jobType: job.jobType, targetId: job.targetId },
                    })];
                case 6:
                    _b.sent();
                    return [2 /*return*/, { success: true }];
            }
        });
    }); },
});
exports.executeDue = (0, server_1.internalMutation)({
    args: {},
    handler: function (ctx) { return __awaiter(void 0, void 0, void 0, function () {
        var now, enabled, due, executed, _i, due_1, job, evaluation, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    now = Date.now();
                    return [4 /*yield*/, ctx.db
                            .query("scheduledJobs")
                            .withIndex("by_enabled", function (q) { return q.eq("enabled", true); })
                            .collect()];
                case 1:
                    enabled = _a.sent();
                    due = enabled
                        .filter(function (j) { return j.nextRun <= now; })
                        .sort(function (a, b) { var _a, _b; return ((_a = a.priority) !== null && _a !== void 0 ? _a : 3) - ((_b = b.priority) !== null && _b !== void 0 ? _b : 3) || a.nextRun - b.nextRun; });
                    executed = 0;
                    _i = 0, due_1 = due;
                    _a.label = 2;
                case 2:
                    if (!(_i < due_1.length)) return [3 /*break*/, 11];
                    job = due_1[_i];
                    return [4 /*yield*/, evaluateRunPolicy(ctx, job)];
                case 3:
                    evaluation = _a.sent();
                    if (!evaluation.allowed)
                        return [3 /*break*/, 10];
                    executed += 1;
                    return [4 /*yield*/, ctx.db.patch(job._id, {
                            lastRun: now,
                            nextRun: parseNextRun(job.cronExpression, now),
                        })];
                case 4:
                    _a.sent();
                    if (!(job.jobType === "mission_prompt")) return [3 /*break*/, 8];
                    _a.label = 5;
                case 5:
                    _a.trys.push([5, 7, , 8]);
                    return [4 /*yield*/, ctx.scheduler.runAfter(0, api_1.api.mission.reversePrompt, {
                            projectId: job.projectId,
                            autoCreate: true,
                            maxSuggestions: 3,
                        })];
                case 6:
                    _a.sent();
                    return [3 /*break*/, 8];
                case 7:
                    error_1 = _a.sent();
                    console.error("Failed to execute mission_prompt job:", error_1);
                    return [3 /*break*/, 8];
                case 8: return [4 /*yield*/, ctx.db.insert("activities", {
                        projectId: job.projectId,
                        actorType: "SYSTEM",
                        action: "SCHEDULED_JOB_EXECUTED",
                        description: "Executed scheduled job ".concat(job.name),
                        targetType: "SCHEDULED_JOB",
                        targetId: job._id,
                        metadata: {
                            jobType: job.jobType,
                            targetId: job.targetId,
                            autoRerunFlaky: job.autoRerunFlaky,
                        },
                    })];
                case 9:
                    _a.sent();
                    _a.label = 10;
                case 10:
                    _i++;
                    return [3 /*break*/, 2];
                case 11: return [2 /*return*/, { executed: executed }];
            }
        });
    }); },
});
