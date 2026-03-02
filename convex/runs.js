"use strict";
/**
 * Runs — Convex Functions
 *
 * Agent execution turn tracking and cost accounting.
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
exports.getStats = exports.complete = exports.start = exports.getUsageTimeSeries = exports.getTopRunsByTokens = exports.getUsageByModel = exports.listRecent = exports.listByTask = exports.listByAgent = exports.get = void 0;
var values_1 = require("convex/values");
var server_1 = require("./_generated/server");
var taskEvents_1 = require("./lib/taskEvents");
var operatorControls_1 = require("./lib/operatorControls");
var agentResolver_1 = require("./lib/agentResolver");
var armAudit_1 = require("./lib/armAudit");
var armCompat_1 = require("./lib/armCompat");
var riskClassifier_1 = require("./lib/riskClassifier");
var armPolicy_1 = require("./lib/armPolicy");
var legacyToolPolicy_1 = require("./lib/legacyToolPolicy");
function toPreview(value) {
    if (value === undefined || value === null)
        return undefined;
    try {
        var raw = typeof value === "string" ? value : JSON.stringify(value);
        return raw.length > 600 ? "".concat(raw.slice(0, 597), "...") : raw;
    }
    catch (_a) {
        return "[unserializable]";
    }
}
// ============================================================================
// QUERIES
// ============================================================================
exports.get = (0, server_1.query)({
    args: { runId: values_1.v.id("runs") },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, ctx.db.get(args.runId)];
                case 1: return [2 /*return*/, _a.sent()];
            }
        });
    }); },
});
exports.listByAgent = (0, server_1.query)({
    args: {
        agentId: values_1.v.id("agents"),
        limit: values_1.v.optional(values_1.v.number()),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var resolved_1;
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    if (!(0, armCompat_1.preferInstanceRefs)()) return [3 /*break*/, 3];
                    return [4 /*yield*/, (0, agentResolver_1.ensureInstanceForLegacyAgent)({ db: ctx.db }, args.agentId)];
                case 1:
                    resolved_1 = _c.sent();
                    return [4 /*yield*/, ctx.db
                            .query("runs")
                            .withIndex("by_instance", function (q) { return q.eq("instanceId", resolved_1.instanceId); })
                            .order("desc")
                            .take((_a = args.limit) !== null && _a !== void 0 ? _a : 50)];
                case 2: return [2 /*return*/, _c.sent()];
                case 3: return [4 /*yield*/, ctx.db
                        .query("runs")
                        .withIndex("by_agent", function (q) { return q.eq("agentId", args.agentId); })
                        .order("desc")
                        .take((_b = args.limit) !== null && _b !== void 0 ? _b : 50)];
                case 4: return [2 /*return*/, _c.sent()];
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
                        .query("runs")
                        .withIndex("by_task", function (q) { return q.eq("taskId", args.taskId); })
                        .order("desc")
                        .take((_a = args.limit) !== null && _a !== void 0 ? _a : 50)];
                case 1: return [2 /*return*/, _b.sent()];
            }
        });
    }); },
});
exports.listRecent = (0, server_1.query)({
    args: {
        projectId: values_1.v.optional(values_1.v.id("projects")),
        limit: values_1.v.optional(values_1.v.number()),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var runs;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, ctx.db
                        .query("runs")
                        .order("desc")
                        .take((_a = args.limit) !== null && _a !== void 0 ? _a : 100)];
                case 1:
                    runs = _b.sent();
                    // Filter by project if provided
                    if (args.projectId) {
                        runs = runs.filter(function (r) { return r.projectId === args.projectId; });
                    }
                    return [2 /*return*/, runs];
            }
        });
    }); },
});
/** Aggregated usage by model for a time window (e.g. 24h). For dashboard AI usage cards. */
exports.getUsageByModel = (0, server_1.query)({
    args: {
        projectId: values_1.v.optional(values_1.v.id("projects")),
        windowHours: values_1.v.optional(values_1.v.number()),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var windowMs, since, limit, runs, byModel, _i, runs_1, r, key;
        var _a, _b, _c, _d;
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0:
                    windowMs = ((_a = args.windowHours) !== null && _a !== void 0 ? _a : 24) * 60 * 60 * 1000;
                    since = Date.now() - windowMs;
                    limit = 5000;
                    return [4 /*yield*/, ctx.db
                            .query("runs")
                            .order("desc")
                            .take(limit)];
                case 1:
                    runs = _e.sent();
                    if (args.projectId) {
                        runs = runs.filter(function (r) { return r.projectId === args.projectId; });
                    }
                    runs = runs.filter(function (r) { return r.startedAt >= since; });
                    byModel = {};
                    for (_i = 0, runs_1 = runs; _i < runs_1.length; _i++) {
                        r = runs_1[_i];
                        key = r.model || "unknown";
                        if (!byModel[key]) {
                            byModel[key] = { inputTokens: 0, outputTokens: 0, costUsd: 0, runs: 0 };
                        }
                        byModel[key].inputTokens += (_b = r.inputTokens) !== null && _b !== void 0 ? _b : 0;
                        byModel[key].outputTokens += (_c = r.outputTokens) !== null && _c !== void 0 ? _c : 0;
                        byModel[key].costUsd += (_d = r.costUsd) !== null && _d !== void 0 ? _d : 0;
                        byModel[key].runs += 1;
                    }
                    return [2 /*return*/, Object.entries(byModel).map(function (_a) {
                            var model = _a[0], agg = _a[1];
                            return (__assign({ model: model }, agg));
                        })];
            }
        });
    }); },
});
/** Top runs by total tokens (input + output) for dashboard "Top runs by tokens" section. */
exports.getTopRunsByTokens = (0, server_1.query)({
    args: {
        projectId: values_1.v.optional(values_1.v.id("projects")),
        limit: values_1.v.optional(values_1.v.number()),
        windowHours: values_1.v.optional(values_1.v.number()),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var limit, windowMs, since, runs;
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    limit = (_a = args.limit) !== null && _a !== void 0 ? _a : 10;
                    windowMs = ((_b = args.windowHours) !== null && _b !== void 0 ? _b : 24) * 60 * 60 * 1000;
                    since = Date.now() - windowMs;
                    return [4 /*yield*/, ctx.db
                            .query("runs")
                            .order("desc")
                            .take(500)];
                case 1:
                    runs = _c.sent();
                    if (args.projectId) {
                        runs = runs.filter(function (r) { return r.projectId === args.projectId; });
                    }
                    runs = runs.filter(function (r) { return r.startedAt >= since; });
                    runs = __spreadArray([], runs, true).sort(function (a, b) {
                        return (b.inputTokens + b.outputTokens) - (a.inputTokens + a.outputTokens);
                    });
                    return [2 /*return*/, runs.slice(0, limit)];
            }
        });
    }); },
});
/** Time-series buckets for tokens and cost (e.g. last 24h by hour, 7d by day). For trend charts. */
exports.getUsageTimeSeries = (0, server_1.query)({
    args: {
        projectId: values_1.v.optional(values_1.v.id("projects")),
        windowHours: values_1.v.optional(values_1.v.number()),
        bucketHours: values_1.v.optional(values_1.v.number()),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var windowMs, bucketMs, since, limit, runs, buckets, _i, runs_2, r, bucketStart;
        var _a, _b, _c, _d, _e;
        return __generator(this, function (_f) {
            switch (_f.label) {
                case 0:
                    windowMs = ((_a = args.windowHours) !== null && _a !== void 0 ? _a : 24) * 60 * 60 * 1000;
                    bucketMs = ((_b = args.bucketHours) !== null && _b !== void 0 ? _b : 1) * 60 * 60 * 1000;
                    since = Date.now() - windowMs;
                    limit = 5000;
                    return [4 /*yield*/, ctx.db
                            .query("runs")
                            .order("desc")
                            .take(limit)];
                case 1:
                    runs = _f.sent();
                    if (args.projectId) {
                        runs = runs.filter(function (r) { return r.projectId === args.projectId; });
                    }
                    runs = runs.filter(function (r) { return r.startedAt >= since; });
                    buckets = {};
                    for (_i = 0, runs_2 = runs; _i < runs_2.length; _i++) {
                        r = runs_2[_i];
                        bucketStart = Math.floor(r.startedAt / bucketMs) * bucketMs;
                        if (!buckets[bucketStart]) {
                            buckets[bucketStart] = {
                                period: new Date(bucketStart).toISOString().slice(0, 13),
                                inputTokens: 0,
                                outputTokens: 0,
                                costUsd: 0,
                            };
                        }
                        buckets[bucketStart].inputTokens += (_c = r.inputTokens) !== null && _c !== void 0 ? _c : 0;
                        buckets[bucketStart].outputTokens += (_d = r.outputTokens) !== null && _d !== void 0 ? _d : 0;
                        buckets[bucketStart].costUsd += (_e = r.costUsd) !== null && _e !== void 0 ? _e : 0;
                    }
                    return [2 /*return*/, Object.entries(buckets)
                            .map(function (_a) {
                            var t = _a[0], v = _a[1];
                            return (__assign(__assign({}, v), { _t: Number(t) }));
                        })
                            .sort(function (a, b) { return a._t - b._t; })
                            .map(function (_a) {
                            var _t = _a._t, v = __rest(_a, ["_t"]);
                            return v;
                        })];
            }
        });
    }); },
});
// ============================================================================
// MUTATIONS
// ============================================================================
exports.start = (0, server_1.mutation)({
    args: {
        agentId: values_1.v.id("agents"),
        taskId: values_1.v.optional(values_1.v.id("tasks")),
        sessionKey: values_1.v.string(),
        model: values_1.v.string(),
        idempotencyKey: values_1.v.string(),
        estimatedCost: values_1.v.optional(values_1.v.number()),
        toolName: values_1.v.optional(values_1.v.string()),
        toolArgs: values_1.v.optional(values_1.v.any()),
        metadata: values_1.v.optional(values_1.v.any()),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var existing, agent, task, _a, operatorControl, operatorGate, estimatedCost, resolved, instance, effectiveTenantId, riskLevel, armDecision, budgetRemaining, activeLegacyPolicy, _b, legacyDecision, changeRecordId, changeRecordId, actionType_1, pending, existing_1, actionType_2, pending, existing_2, policySource, policyReason, missionStatement, tenant, runId, run, toolCallId;
        var _c, _d, _e, _f, _g, _h;
        return __generator(this, function (_j) {
            switch (_j.label) {
                case 0: return [4 /*yield*/, ctx.db
                        .query("runs")
                        .withIndex("by_idempotency", function (q) { return q.eq("idempotencyKey", args.idempotencyKey); })
                        .first()];
                case 1:
                    existing = _j.sent();
                    if (existing) {
                        return [2 /*return*/, { run: existing, created: false }];
                    }
                    return [4 /*yield*/, ctx.db.get(args.agentId)];
                case 2:
                    agent = _j.sent();
                    if (!agent) {
                        throw new Error("Agent not found");
                    }
                    if (!args.taskId) return [3 /*break*/, 4];
                    return [4 /*yield*/, ctx.db.get(args.taskId)];
                case 3:
                    _a = _j.sent();
                    return [3 /*break*/, 5];
                case 4:
                    _a = null;
                    _j.label = 5;
                case 5:
                    task = _a;
                    return [4 /*yield*/, (0, operatorControls_1.getEffectiveOperatorControl)(ctx.db, agent.projectId)];
                case 6:
                    operatorControl = _j.sent();
                    operatorGate = (0, operatorControls_1.evaluateOperatorGate)({
                        mode: operatorControl.mode,
                        actorType: "AGENT",
                        operation: "RUN_START",
                    });
                    if (operatorGate.decision !== "ALLOW") {
                        throw new Error(operatorGate.reason);
                    }
                    estimatedCost = (_c = args.estimatedCost) !== null && _c !== void 0 ? _c : 0;
                    if (estimatedCost > 0 && estimatedCost > agent.budgetPerRun) {
                        throw new Error("Estimated run cost ($".concat(estimatedCost.toFixed(2), ") exceeds per-run budget ($").concat(agent.budgetPerRun.toFixed(2), ")"));
                    }
                    if (!(agent.spendToday >= agent.budgetDaily)) return [3 /*break*/, 9];
                    return [4 /*yield*/, ctx.db.patch(args.agentId, { status: "PAUSED" })];
                case 7:
                    _j.sent();
                    // Create alert
                    return [4 /*yield*/, ctx.db.insert("alerts", {
                            projectId: agent.projectId,
                            severity: "WARNING",
                            type: "BUDGET_EXCEEDED",
                            title: "Agent daily budget exceeded",
                            description: "Agent ".concat(agent.name, " exceeded daily budget: $").concat(agent.spendToday.toFixed(2), " / $").concat(agent.budgetDaily.toFixed(2)),
                            agentId: args.agentId,
                            taskId: args.taskId,
                            status: "OPEN",
                        })];
                case 8:
                    // Create alert
                    _j.sent();
                    throw new Error("Agent daily budget exceeded");
                case 9:
                    if (!(task && task.budgetAllocated)) return [3 /*break*/, 13];
                    if (!(task.actualCost >= task.budgetAllocated)) return [3 /*break*/, 12];
                    // Move task to NEEDS_APPROVAL
                    return [4 /*yield*/, ctx.db.patch(task._id, { status: "NEEDS_APPROVAL" })];
                case 10:
                    // Move task to NEEDS_APPROVAL
                    _j.sent();
                    // Create alert
                    return [4 /*yield*/, ctx.db.insert("alerts", {
                            projectId: task.projectId,
                            severity: "WARNING",
                            type: "BUDGET_EXCEEDED",
                            title: "Task budget exceeded",
                            description: "Task \"".concat(task.title, "\" exceeded budget: $").concat(task.actualCost.toFixed(2), " / $").concat(task.budgetAllocated.toFixed(2)),
                            taskId: task._id,
                            status: "OPEN",
                        })];
                case 11:
                    // Create alert
                    _j.sent();
                    throw new Error("Task budget exceeded");
                case 12:
                    if (estimatedCost > 0 && task.actualCost + estimatedCost > task.budgetAllocated) {
                        throw new Error("Estimated run cost would exceed task budget ($".concat(task.actualCost.toFixed(2), " + $").concat(estimatedCost.toFixed(2), " > $").concat(task.budgetAllocated.toFixed(2), ")"));
                    }
                    _j.label = 13;
                case 13: return [4 /*yield*/, (0, agentResolver_1.ensureInstanceForLegacyAgent)({ db: ctx.db }, args.agentId)];
                case 14:
                    resolved = _j.sent();
                    return [4 /*yield*/, ctx.db.get(resolved.instanceId)];
                case 15:
                    instance = _j.sent();
                    effectiveTenantId = (_d = agent.tenantId) !== null && _d !== void 0 ? _d : instance === null || instance === void 0 ? void 0 : instance.tenantId;
                    riskLevel = args.toolName
                        ? (0, riskClassifier_1.classifyRisk)(args.toolName, args.toolArgs)
                        : "GREEN";
                    return [4 /*yield*/, (0, armPolicy_1.evaluatePolicyEnvelopes)(ctx.db, {
                            tenantId: effectiveTenantId,
                            projectId: agent.projectId,
                            versionId: resolved.versionId,
                            toolName: args.toolName,
                            riskLevel: riskLevel,
                        })];
                case 16:
                    armDecision = _j.sent();
                    budgetRemaining = Math.max(agent.budgetDaily - agent.spendToday, 0);
                    if (!(!armDecision && args.toolName)) return [3 /*break*/, 18];
                    return [4 /*yield*/, ctx.db
                            .query("policies")
                            .withIndex("by_active", function (q) { return q.eq("active", true); })
                            .first()];
                case 17:
                    _b = _j.sent();
                    return [3 /*break*/, 19];
                case 18:
                    _b = null;
                    _j.label = 19;
                case 19:
                    activeLegacyPolicy = _b;
                    legacyDecision = !armDecision && args.toolName
                        ? (0, legacyToolPolicy_1.evaluateLegacyToolPolicy)({
                            policy: activeLegacyPolicy,
                            agentRole: agent.role,
                            budgetRemaining: budgetRemaining,
                            estimatedCost: estimatedCost,
                            toolName: args.toolName,
                            toolArgs: args.toolArgs,
                        })
                        : null;
                    if (!((armDecision === null || armDecision === void 0 ? void 0 : armDecision.decision) === "DENY")) return [3 /*break*/, 22];
                    return [4 /*yield*/, (0, armAudit_1.appendChangeRecord)(ctx.db, {
                            tenantId: effectiveTenantId,
                            projectId: agent.projectId,
                            templateId: resolved.templateId,
                            versionId: resolved.versionId,
                            instanceId: resolved.instanceId,
                            legacyAgentId: args.agentId,
                            type: "POLICY_DENIED",
                            summary: armDecision.reason,
                            payload: {
                                toolName: args.toolName,
                                riskLevel: riskLevel,
                                actionType: args.toolName ? "TOOL_CALL" : "RUN_START",
                            },
                        })];
                case 20:
                    changeRecordId = _j.sent();
                    return [4 /*yield*/, (0, armAudit_1.appendOpEvent)(ctx.db, {
                            tenantId: effectiveTenantId,
                            projectId: agent.projectId,
                            instanceId: resolved.instanceId,
                            versionId: resolved.versionId,
                            taskId: args.taskId,
                            type: "TOOL_CALL_BLOCKED",
                            changeRecordId: changeRecordId,
                            payload: {
                                decision: "DENY",
                                reason: armDecision.reason,
                                toolName: args.toolName,
                                riskLevel: riskLevel,
                            },
                        })];
                case 21:
                    _j.sent();
                    throw new Error(armDecision.reason);
                case 22:
                    if (!(!armDecision && (legacyDecision === null || legacyDecision === void 0 ? void 0 : legacyDecision.decision) === "DENY")) return [3 /*break*/, 25];
                    return [4 /*yield*/, (0, armAudit_1.appendChangeRecord)(ctx.db, {
                            tenantId: effectiveTenantId,
                            projectId: agent.projectId,
                            templateId: resolved.templateId,
                            versionId: resolved.versionId,
                            instanceId: resolved.instanceId,
                            legacyAgentId: args.agentId,
                            type: "POLICY_DENIED",
                            summary: legacyDecision.reason,
                            payload: {
                                toolName: args.toolName,
                                riskLevel: riskLevel,
                                actionType: "TOOL_CALL",
                                source: "LEGACY_POLICY_FALLBACK",
                            },
                        })];
                case 23:
                    changeRecordId = _j.sent();
                    return [4 /*yield*/, (0, armAudit_1.appendOpEvent)(ctx.db, {
                            tenantId: effectiveTenantId,
                            projectId: agent.projectId,
                            instanceId: resolved.instanceId,
                            versionId: resolved.versionId,
                            taskId: args.taskId,
                            type: "TOOL_CALL_BLOCKED",
                            changeRecordId: changeRecordId,
                            payload: {
                                decision: "DENY",
                                reason: legacyDecision.reason,
                                toolName: args.toolName,
                                riskLevel: riskLevel,
                                source: "LEGACY_POLICY_FALLBACK",
                            },
                        })];
                case 24:
                    _j.sent();
                    throw new Error(legacyDecision.reason);
                case 25:
                    if (!((armDecision === null || armDecision === void 0 ? void 0 : armDecision.decision) === "NEEDS_APPROVAL")) return [3 /*break*/, 31];
                    actionType_1 = args.toolName ? "TOOL_CALL" : "RUN_START";
                    return [4 /*yield*/, ctx.db
                            .query("approvalRecords")
                            .withIndex("by_instance", function (q) { return q.eq("instanceId", resolved.instanceId); })
                            .collect()];
                case 26:
                    pending = _j.sent();
                    existing_1 = pending.find(function (row) {
                        var _a;
                        return row.status === "PENDING" &&
                            row.actionType === actionType_1 &&
                            ((_a = row.metadata) === null || _a === void 0 ? void 0 : _a.idempotencyKey) === args.idempotencyKey;
                    });
                    if (!!existing_1) return [3 /*break*/, 28];
                    return [4 /*yield*/, ctx.db.insert("approvalRecords", {
                            tenantId: effectiveTenantId,
                            projectId: agent.projectId,
                            instanceId: resolved.instanceId,
                            versionId: resolved.versionId,
                            actionType: actionType_1,
                            riskLevel: riskLevel,
                            justification: armDecision.reason,
                            escalationLevel: riskLevel === "RED" ? 2 : riskLevel === "YELLOW" ? 1 : 0,
                            status: "PENDING",
                            requestedAt: Date.now(),
                            metadata: {
                                source: "runs.start",
                                idempotencyKey: args.idempotencyKey,
                                toolName: args.toolName,
                            },
                        })];
                case 27:
                    _j.sent();
                    _j.label = 28;
                case 28: return [4 /*yield*/, (0, armAudit_1.appendChangeRecord)(ctx.db, {
                        tenantId: effectiveTenantId,
                        projectId: agent.projectId,
                        templateId: resolved.templateId,
                        versionId: resolved.versionId,
                        instanceId: resolved.instanceId,
                        legacyAgentId: args.agentId,
                        type: "APPROVAL_REQUESTED",
                        summary: "ARM policy requires approval: ".concat(actionType_1),
                        payload: {
                            reason: armDecision.reason,
                            toolName: args.toolName,
                            riskLevel: riskLevel,
                        },
                    })];
                case 29:
                    _j.sent();
                    return [4 /*yield*/, (0, armAudit_1.appendOpEvent)(ctx.db, {
                            tenantId: effectiveTenantId,
                            projectId: agent.projectId,
                            instanceId: resolved.instanceId,
                            versionId: resolved.versionId,
                            taskId: args.taskId,
                            type: "DECISION_MADE",
                            payload: {
                                decision: "NEEDS_APPROVAL",
                                reason: armDecision.reason,
                                toolName: args.toolName,
                                riskLevel: riskLevel,
                            },
                        })];
                case 30:
                    _j.sent();
                    throw new Error("ARM policy requires approval: ".concat(armDecision.reason));
                case 31:
                    if (!(!armDecision && (legacyDecision === null || legacyDecision === void 0 ? void 0 : legacyDecision.decision) === "NEEDS_APPROVAL")) return [3 /*break*/, 37];
                    actionType_2 = "TOOL_CALL";
                    return [4 /*yield*/, ctx.db
                            .query("approvalRecords")
                            .withIndex("by_instance", function (q) { return q.eq("instanceId", resolved.instanceId); })
                            .collect()];
                case 32:
                    pending = _j.sent();
                    existing_2 = pending.find(function (row) {
                        var _a;
                        return row.status === "PENDING" &&
                            row.actionType === actionType_2 &&
                            ((_a = row.metadata) === null || _a === void 0 ? void 0 : _a.idempotencyKey) === args.idempotencyKey;
                    });
                    if (!!existing_2) return [3 /*break*/, 34];
                    return [4 /*yield*/, ctx.db.insert("approvalRecords", {
                            tenantId: effectiveTenantId,
                            projectId: agent.projectId,
                            instanceId: resolved.instanceId,
                            versionId: resolved.versionId,
                            actionType: actionType_2,
                            riskLevel: riskLevel,
                            justification: legacyDecision.reason,
                            escalationLevel: riskLevel === "RED" ? 2 : riskLevel === "YELLOW" ? 1 : 0,
                            status: "PENDING",
                            requestedAt: Date.now(),
                            metadata: {
                                source: "runs.start.legacyFallback",
                                idempotencyKey: args.idempotencyKey,
                                toolName: args.toolName,
                            },
                        })];
                case 33:
                    _j.sent();
                    _j.label = 34;
                case 34: return [4 /*yield*/, (0, armAudit_1.appendChangeRecord)(ctx.db, {
                        tenantId: effectiveTenantId,
                        projectId: agent.projectId,
                        templateId: resolved.templateId,
                        versionId: resolved.versionId,
                        instanceId: resolved.instanceId,
                        legacyAgentId: args.agentId,
                        type: "APPROVAL_REQUESTED",
                        summary: "Legacy policy requires approval: ".concat(actionType_2),
                        payload: {
                            reason: legacyDecision.reason,
                            toolName: args.toolName,
                            riskLevel: riskLevel,
                            source: "LEGACY_POLICY_FALLBACK",
                        },
                    })];
                case 35:
                    _j.sent();
                    return [4 /*yield*/, (0, armAudit_1.appendOpEvent)(ctx.db, {
                            tenantId: effectiveTenantId,
                            projectId: agent.projectId,
                            instanceId: resolved.instanceId,
                            versionId: resolved.versionId,
                            taskId: args.taskId,
                            type: "DECISION_MADE",
                            payload: {
                                decision: "NEEDS_APPROVAL",
                                reason: legacyDecision.reason,
                                toolName: args.toolName,
                                riskLevel: riskLevel,
                                source: "LEGACY_POLICY_FALLBACK",
                            },
                        })];
                case 36:
                    _j.sent();
                    throw new Error("Legacy policy requires approval: ".concat(legacyDecision.reason));
                case 37:
                    policySource = armDecision ? "ARM_POLICY_ENVELOPE" : legacyDecision ? "LEGACY_POLICY_FALLBACK" : "NONE";
                    policyReason = (_f = (_e = armDecision === null || armDecision === void 0 ? void 0 : armDecision.reason) !== null && _e !== void 0 ? _e : legacyDecision === null || legacyDecision === void 0 ? void 0 : legacyDecision.reason) !== null && _f !== void 0 ? _f : "No policy gate applied";
                    missionStatement = null;
                    if (!effectiveTenantId) return [3 /*break*/, 39];
                    return [4 /*yield*/, ctx.db.get(effectiveTenantId)];
                case 38:
                    tenant = _j.sent();
                    missionStatement = (_g = tenant === null || tenant === void 0 ? void 0 : tenant.missionStatement) !== null && _g !== void 0 ? _g : null;
                    _j.label = 39;
                case 39: return [4 /*yield*/, ctx.db.insert("runs", {
                        tenantId: effectiveTenantId,
                        projectId: agent.projectId,
                        idempotencyKey: args.idempotencyKey,
                        agentId: args.agentId,
                        instanceId: resolved.instanceId,
                        versionId: resolved.versionId,
                        templateId: resolved.templateId,
                        taskId: args.taskId,
                        sessionKey: args.sessionKey,
                        startedAt: Date.now(),
                        model: args.model,
                        inputTokens: 0,
                        outputTokens: 0,
                        costUsd: 0,
                        budgetAllocated: agent.budgetPerRun,
                        status: "RUNNING",
                        metadata: __assign(__assign({}, args.metadata), { missionStatement: missionStatement }),
                    })];
                case 40:
                    runId = _j.sent();
                    return [4 /*yield*/, ctx.db.get(runId)];
                case 41:
                    run = _j.sent();
                    if (!run) {
                        throw new Error("Failed to create run");
                    }
                    return [4 /*yield*/, (0, armAudit_1.appendOpEvent)(ctx.db, {
                            tenantId: run.tenantId,
                            projectId: run.projectId,
                            instanceId: run.instanceId,
                            versionId: run.versionId,
                            taskId: run.taskId,
                            runId: run._id,
                            type: "RUN_STARTED",
                            payload: {
                                model: run.model,
                                sessionKey: run.sessionKey,
                            },
                        })];
                case 42:
                    _j.sent();
                    if (!args.toolName) return [3 /*break*/, 46];
                    return [4 /*yield*/, ctx.db.insert("toolCalls", {
                            tenantId: effectiveTenantId,
                            projectId: agent.projectId,
                            runId: runId,
                            agentId: args.agentId,
                            instanceId: resolved.instanceId,
                            versionId: resolved.versionId,
                            taskId: args.taskId,
                            toolName: args.toolName,
                            riskLevel: riskLevel,
                            policyResult: {
                                decision: "ALLOW",
                                reason: policyReason,
                            },
                            inputPreview: toPreview(args.toolArgs),
                            startedAt: Date.now(),
                            status: "RUNNING",
                            retryCount: 0,
                        })];
                case 43:
                    toolCallId = _j.sent();
                    return [4 /*yield*/, ctx.db.patch(runId, {
                            metadata: __assign(__assign({}, ((_h = run.metadata) !== null && _h !== void 0 ? _h : {})), { toolCallId: toolCallId, toolName: args.toolName }),
                        })];
                case 44:
                    _j.sent();
                    return [4 /*yield*/, (0, armAudit_1.appendOpEvent)(ctx.db, {
                            tenantId: effectiveTenantId,
                            projectId: agent.projectId,
                            instanceId: resolved.instanceId,
                            versionId: resolved.versionId,
                            taskId: args.taskId,
                            runId: runId,
                            toolCallId: toolCallId,
                            type: "TOOL_CALL_STARTED",
                            payload: {
                                toolName: args.toolName,
                                riskLevel: riskLevel,
                                source: policySource,
                            },
                        })];
                case 45:
                    _j.sent();
                    _j.label = 46;
                case 46:
                    if (!args.taskId) return [3 /*break*/, 48];
                    return [4 /*yield*/, (0, taskEvents_1.logTaskEvent)(ctx, {
                            projectId: agent.projectId,
                            taskId: args.taskId,
                            eventType: "RUN_STARTED",
                            actorType: "AGENT",
                            actorId: args.agentId.toString(),
                            relatedId: runId,
                            metadata: {
                                model: args.model,
                                sessionKey: args.sessionKey,
                                operatorMode: operatorControl.mode,
                                estimatedCost: estimatedCost,
                            },
                        })];
                case 47:
                    _j.sent();
                    _j.label = 48;
                case 48: return [2 /*return*/, { run: run, created: true }];
            }
        });
    }); },
});
exports.complete = (0, server_1.mutation)({
    args: {
        runId: values_1.v.id("runs"),
        inputTokens: values_1.v.number(),
        outputTokens: values_1.v.number(),
        cacheReadTokens: values_1.v.optional(values_1.v.number()),
        cacheWriteTokens: values_1.v.optional(values_1.v.number()),
        costUsd: values_1.v.number(),
        error: values_1.v.optional(values_1.v.string()),
        status: values_1.v.optional(values_1.v.string()),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var run, now, durationMs, metadata, toolCallId, updatedRun, toolCall, agent, newSpend, task, newCost;
        var _a;
        var _b, _c, _d, _e, _f;
        return __generator(this, function (_g) {
            switch (_g.label) {
                case 0: return [4 /*yield*/, ctx.db.get(args.runId)];
                case 1:
                    run = _g.sent();
                    if (!run) {
                        return [2 /*return*/, { success: false, error: "Run not found" }];
                    }
                    now = Date.now();
                    durationMs = now - run.startedAt;
                    metadata = ((_b = run.metadata) !== null && _b !== void 0 ? _b : {});
                    toolCallId = metadata.toolCallId;
                    if (!(run.budgetAllocated && args.costUsd > run.budgetAllocated)) return [3 /*break*/, 3];
                    // Create alert but allow completion
                    return [4 /*yield*/, ctx.db.insert("alerts", {
                            projectId: run.projectId,
                            severity: "WARNING",
                            type: "BUDGET_EXCEEDED",
                            title: "Run budget exceeded",
                            description: "Run exceeded budget: $".concat(args.costUsd.toFixed(2), " / $").concat(run.budgetAllocated.toFixed(2)),
                            agentId: run.agentId,
                            taskId: run.taskId,
                            runId: run._id,
                            status: "OPEN",
                        })];
                case 2:
                    // Create alert but allow completion
                    _g.sent();
                    _g.label = 3;
                case 3: return [4 /*yield*/, ctx.db.patch(args.runId, {
                        endedAt: now,
                        durationMs: durationMs,
                        inputTokens: args.inputTokens,
                        outputTokens: args.outputTokens,
                        cacheReadTokens: args.cacheReadTokens,
                        cacheWriteTokens: args.cacheWriteTokens,
                        costUsd: args.costUsd,
                        status: (args.error ? "FAILED" : (_c = args.status) !== null && _c !== void 0 ? _c : "COMPLETED"),
                        error: args.error,
                    })];
                case 4:
                    _g.sent();
                    return [4 /*yield*/, ctx.db.get(args.runId)];
                case 5:
                    updatedRun = _g.sent();
                    if (!updatedRun) return [3 /*break*/, 10];
                    return [4 /*yield*/, (0, armAudit_1.appendOpEvent)(ctx.db, {
                            tenantId: updatedRun.tenantId,
                            projectId: updatedRun.projectId,
                            instanceId: updatedRun.instanceId,
                            versionId: updatedRun.versionId,
                            taskId: updatedRun.taskId,
                            runId: updatedRun._id,
                            type: args.error ? "RUN_FAILED" : "RUN_COMPLETED",
                            payload: {
                                costUsd: args.costUsd,
                                durationMs: durationMs,
                                inputTokens: args.inputTokens,
                                outputTokens: args.outputTokens,
                                status: args.error ? "FAILED" : (_d = args.status) !== null && _d !== void 0 ? _d : "COMPLETED",
                            },
                        })];
                case 6:
                    _g.sent();
                    if (!toolCallId) return [3 /*break*/, 10];
                    return [4 /*yield*/, ctx.db.get(toolCallId)];
                case 7:
                    toolCall = _g.sent();
                    if (!toolCall) return [3 /*break*/, 10];
                    return [4 /*yield*/, ctx.db.patch(toolCallId, {
                            endedAt: now,
                            durationMs: durationMs,
                            outputPreview: toPreview(args.error ? { error: args.error } : { status: (_e = args.status) !== null && _e !== void 0 ? _e : "COMPLETED" }),
                            status: args.error ? "FAILED" : "SUCCESS",
                            error: args.error,
                        })];
                case 8:
                    _g.sent();
                    return [4 /*yield*/, (0, armAudit_1.appendOpEvent)(ctx.db, {
                            tenantId: updatedRun.tenantId,
                            projectId: updatedRun.projectId,
                            instanceId: updatedRun.instanceId,
                            versionId: updatedRun.versionId,
                            taskId: updatedRun.taskId,
                            runId: updatedRun._id,
                            toolCallId: toolCallId,
                            type: "TOOL_CALL_COMPLETED",
                            payload: {
                                toolName: toolCall.toolName,
                                status: args.error ? "FAILED" : "SUCCESS",
                                error: args.error,
                                durationMs: durationMs,
                            },
                        })];
                case 9:
                    _g.sent();
                    _g.label = 10;
                case 10:
                    if (!(args.costUsd > 0)) return [3 /*break*/, 15];
                    return [4 /*yield*/, ctx.db.get(run.agentId)];
                case 11:
                    agent = _g.sent();
                    if (!agent) return [3 /*break*/, 15];
                    newSpend = agent.spendToday + args.costUsd;
                    return [4 /*yield*/, ctx.db.patch(run.agentId, {
                            spendToday: newSpend,
                        })];
                case 12:
                    _g.sent();
                    if (!(newSpend >= agent.budgetDaily)) return [3 /*break*/, 15];
                    return [4 /*yield*/, ctx.db.patch(run.agentId, { status: "PAUSED" })];
                case 13:
                    _g.sent();
                    return [4 /*yield*/, ctx.db.insert("alerts", {
                            projectId: agent.projectId,
                            severity: "WARNING",
                            type: "BUDGET_EXCEEDED",
                            title: "Agent daily budget exceeded",
                            description: "Agent ".concat(agent.name, " exceeded daily budget: $").concat(newSpend.toFixed(2), " / $").concat(agent.budgetDaily.toFixed(2)),
                            agentId: run.agentId,
                            status: "OPEN",
                        })];
                case 14:
                    _g.sent();
                    _g.label = 15;
                case 15:
                    if (!(run.taskId && args.costUsd > 0)) return [3 /*break*/, 20];
                    return [4 /*yield*/, ctx.db.get(run.taskId)];
                case 16:
                    task = _g.sent();
                    if (!task) return [3 /*break*/, 20];
                    newCost = task.actualCost + args.costUsd;
                    return [4 /*yield*/, ctx.db.patch(run.taskId, {
                            actualCost: newCost,
                            budgetRemaining: task.budgetAllocated
                                ? task.budgetAllocated - newCost
                                : undefined,
                        })];
                case 17:
                    _g.sent();
                    if (!(task.budgetAllocated && newCost >= task.budgetAllocated)) return [3 /*break*/, 20];
                    return [4 /*yield*/, ctx.db.patch(run.taskId, { status: "NEEDS_APPROVAL" })];
                case 18:
                    _g.sent();
                    return [4 /*yield*/, ctx.db.insert("alerts", {
                            projectId: task.projectId,
                            severity: "WARNING",
                            type: "BUDGET_EXCEEDED",
                            title: "Task budget exceeded",
                            description: "Task \"".concat(task.title, "\" exceeded budget: $").concat(newCost.toFixed(2), " / $").concat(task.budgetAllocated.toFixed(2)),
                            taskId: run.taskId,
                            status: "OPEN",
                        })];
                case 19:
                    _g.sent();
                    _g.label = 20;
                case 20:
                    if (!run.taskId) return [3 /*break*/, 22];
                    return [4 /*yield*/, (0, taskEvents_1.logTaskEvent)(ctx, {
                            projectId: run.projectId,
                            taskId: run.taskId,
                            eventType: args.error ? "RUN_FAILED" : "RUN_COMPLETED",
                            actorType: "AGENT",
                            actorId: run.agentId.toString(),
                            relatedId: args.runId,
                            metadata: {
                                status: args.error ? "FAILED" : (_f = args.status) !== null && _f !== void 0 ? _f : "COMPLETED",
                                costUsd: args.costUsd,
                                durationMs: durationMs,
                                inputTokens: args.inputTokens,
                                outputTokens: args.outputTokens,
                            },
                            afterState: {
                                costUsd: args.costUsd,
                            },
                        })];
                case 21:
                    _g.sent();
                    _g.label = 22;
                case 22:
                    _a = { success: true };
                    return [4 /*yield*/, ctx.db.get(args.runId)];
                case 23: return [2 /*return*/, (_a.run = _g.sent(), _a)];
            }
        });
    }); },
});
exports.getStats = (0, server_1.query)({
    args: {
        agentId: values_1.v.optional(values_1.v.id("agents")),
        taskId: values_1.v.optional(values_1.v.id("tasks")),
        sinceDaysAgo: values_1.v.optional(values_1.v.number()),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var runs, agentId_1, taskId_1, cutoff_1, totalRuns, totalCost, totalInputTokens, totalOutputTokens, avgDuration, failedRuns;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!args.agentId) return [3 /*break*/, 2];
                    agentId_1 = args.agentId;
                    return [4 /*yield*/, ctx.db
                            .query("runs")
                            .withIndex("by_agent", function (q) { return q.eq("agentId", agentId_1); })
                            .collect()];
                case 1:
                    runs = _a.sent();
                    return [3 /*break*/, 6];
                case 2:
                    if (!args.taskId) return [3 /*break*/, 4];
                    taskId_1 = args.taskId;
                    return [4 /*yield*/, ctx.db
                            .query("runs")
                            .withIndex("by_task", function (q) { return q.eq("taskId", taskId_1); })
                            .collect()];
                case 3:
                    runs = _a.sent();
                    return [3 /*break*/, 6];
                case 4: return [4 /*yield*/, ctx.db.query("runs").take(1000)];
                case 5:
                    // No filter specified — cap at 1000 to prevent unbounded full-table scan
                    runs = _a.sent();
                    _a.label = 6;
                case 6:
                    // Filter by time if specified
                    if (args.sinceDaysAgo) {
                        cutoff_1 = Date.now() - args.sinceDaysAgo * 24 * 60 * 60 * 1000;
                        runs = runs.filter(function (r) { return r.startedAt >= cutoff_1; });
                    }
                    totalRuns = runs.length;
                    totalCost = runs.reduce(function (sum, r) { return sum + r.costUsd; }, 0);
                    totalInputTokens = runs.reduce(function (sum, r) { return sum + r.inputTokens; }, 0);
                    totalOutputTokens = runs.reduce(function (sum, r) { return sum + r.outputTokens; }, 0);
                    avgDuration = runs.length > 0
                        ? runs.reduce(function (sum, r) { var _a; return sum + ((_a = r.durationMs) !== null && _a !== void 0 ? _a : 0); }, 0) / runs.length
                        : 0;
                    failedRuns = runs.filter(function (r) { return r.status === "FAILED"; }).length;
                    return [2 /*return*/, {
                            totalRuns: totalRuns,
                            totalCost: totalCost,
                            totalInputTokens: totalInputTokens,
                            totalOutputTokens: totalOutputTokens,
                            avgDurationMs: Math.round(avgDuration),
                            failedRuns: failedRuns,
                            successRate: totalRuns > 0 ? ((totalRuns - failedRuns) / totalRuns * 100).toFixed(1) + "%" : "N/A",
                        }];
            }
        });
    }); },
});
