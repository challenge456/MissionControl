"use strict";
/**
 * Workflow Runs — Convex Functions
 *
 * Execution state and progress tracking for multi-agent workflows.
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
exports.incrementRetry = exports.updateContext = exports.updateStatus = exports.advance = exports.updateStep = exports.start = exports.search = exports.getById = exports.get = exports.list = void 0;
var values_1 = require("convex/values");
var server_1 = require("./_generated/server");
var armAudit_1 = require("./lib/armAudit");
var agentResolver_1 = require("./lib/agentResolver");
// ============================================================================
// HELPERS
// ============================================================================
function generateRunId() {
    // Generate short 8-character ID (similar to Antfarm's run IDs)
    return Math.random().toString(36).substring(2, 10);
}
// ============================================================================
// QUERIES
// ============================================================================
/**
 * List workflow runs
 */
exports.list = (0, server_1.query)({
    args: {
        projectId: values_1.v.optional(values_1.v.id("projects")),
        workflowId: values_1.v.optional(values_1.v.string()),
        status: values_1.v.optional(values_1.v.string()),
        limit: values_1.v.optional(values_1.v.number()),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var _a, _b, _c, _d, _e;
        return __generator(this, function (_f) {
            switch (_f.label) {
                case 0:
                    if (!(args.projectId && args.status)) return [3 /*break*/, 2];
                    return [4 /*yield*/, ctx.db
                            .query("workflowRuns")
                            .withIndex("by_project_status", function (q) {
                            return q.eq("projectId", args.projectId).eq("status", args.status);
                        })
                            .order("desc")
                            .take((_a = args.limit) !== null && _a !== void 0 ? _a : 100)];
                case 1: return [2 /*return*/, _f.sent()];
                case 2:
                    if (!args.projectId) return [3 /*break*/, 4];
                    return [4 /*yield*/, ctx.db
                            .query("workflowRuns")
                            .withIndex("by_project", function (q) { return q.eq("projectId", args.projectId); })
                            .order("desc")
                            .take((_b = args.limit) !== null && _b !== void 0 ? _b : 100)];
                case 3: return [2 /*return*/, _f.sent()];
                case 4:
                    if (!args.workflowId) return [3 /*break*/, 6];
                    return [4 /*yield*/, ctx.db
                            .query("workflowRuns")
                            .withIndex("by_workflow_id", function (q) { return q.eq("workflowId", args.workflowId); })
                            .order("desc")
                            .take((_c = args.limit) !== null && _c !== void 0 ? _c : 100)];
                case 5: return [2 /*return*/, _f.sent()];
                case 6:
                    if (!args.status) return [3 /*break*/, 8];
                    return [4 /*yield*/, ctx.db
                            .query("workflowRuns")
                            .withIndex("by_status", function (q) { return q.eq("status", args.status); })
                            .order("desc")
                            .take((_d = args.limit) !== null && _d !== void 0 ? _d : 100)];
                case 7: return [2 /*return*/, _f.sent()];
                case 8: return [4 /*yield*/, ctx.db
                        .query("workflowRuns")
                        .order("desc")
                        .take((_e = args.limit) !== null && _e !== void 0 ? _e : 100)];
                case 9: return [2 /*return*/, _f.sent()];
            }
        });
    }); },
});
/**
 * Get a workflow run by run ID
 */
exports.get = (0, server_1.query)({
    args: { runId: values_1.v.string() },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, ctx.db
                        .query("workflowRuns")
                        .withIndex("by_run_id", function (q) { return q.eq("runId", args.runId); })
                        .first()];
                case 1: return [2 /*return*/, _a.sent()];
            }
        });
    }); },
});
/**
 * Get workflow run by Convex _id
 */
exports.getById = (0, server_1.query)({
    args: { id: values_1.v.id("workflowRuns") },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, ctx.db.get(args.id)];
                case 1: return [2 /*return*/, _a.sent()];
            }
        });
    }); },
});
/**
 * Search workflow runs by query string (matches runId or initial input)
 */
exports.search = (0, server_1.query)({
    args: {
        query: values_1.v.string(),
        projectId: values_1.v.optional(values_1.v.id("projects")),
        limit: values_1.v.optional(values_1.v.number()),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var runs, lowerQuery;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, ctx.db
                        .query("workflowRuns")
                        .order("desc")
                        .take((_a = args.limit) !== null && _a !== void 0 ? _a : 100)];
                case 1:
                    runs = _b.sent();
                    if (args.projectId) {
                        runs = runs.filter(function (r) { return r.projectId === args.projectId; });
                    }
                    lowerQuery = args.query.toLowerCase();
                    return [2 /*return*/, runs.filter(function (r) {
                            return r.runId.toLowerCase().includes(lowerQuery) ||
                                r.initialInput.toLowerCase().includes(lowerQuery);
                        })];
            }
        });
    }); },
});
// ============================================================================
// MUTATIONS
// ============================================================================
/**
 * Start a new workflow run
 */
exports.start = (0, server_1.mutation)({
    args: {
        workflowId: values_1.v.string(),
        projectId: values_1.v.optional(values_1.v.id("projects")),
        parentTaskId: values_1.v.optional(values_1.v.id("tasks")),
        initialInput: values_1.v.string(),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var workflow, steps, now, runId, id;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, ctx.db
                        .query("workflows")
                        .withIndex("by_workflow_id", function (q) { return q.eq("workflowId", args.workflowId); })
                        .first()];
                case 1:
                    workflow = _a.sent();
                    if (!workflow) {
                        throw new Error("Workflow not found: ".concat(args.workflowId));
                    }
                    if (!workflow.active) {
                        throw new Error("Workflow is not active: ".concat(args.workflowId));
                    }
                    steps = workflow.steps.map(function (step) { return ({
                        stepId: step.id,
                        status: "PENDING",
                        taskId: undefined,
                        agentId: undefined,
                        startedAt: undefined,
                        completedAt: undefined,
                        retryCount: 0,
                        error: undefined,
                        output: undefined,
                    }); });
                    now = Date.now();
                    runId = generateRunId();
                    return [4 /*yield*/, ctx.db.insert("workflowRuns", {
                            runId: runId,
                            workflowId: args.workflowId,
                            projectId: args.projectId,
                            parentTaskId: args.parentTaskId,
                            status: "PENDING",
                            currentStepIndex: 0,
                            totalSteps: workflow.steps.length,
                            steps: steps,
                            context: { task: args.initialInput },
                            initialInput: args.initialInput,
                            startedAt: now,
                        })];
                case 2:
                    id = _a.sent();
                    return [4 /*yield*/, (0, armAudit_1.appendOpEvent)(ctx.db, {
                            tenantId: undefined,
                            projectId: args.projectId,
                            workflowRunId: id,
                            type: "WORKFLOW_STEP_STARTED",
                            payload: {
                                runId: runId,
                                workflowId: args.workflowId,
                                stepIndex: 0,
                            },
                        })];
                case 3:
                    _a.sent();
                    // Log activity
                    return [4 /*yield*/, ctx.db.insert("activities", {
                            projectId: args.projectId,
                            actorType: "SYSTEM",
                            action: "WORKFLOW_STARTED",
                            description: "Started workflow run ".concat(runId, " for ").concat(workflow.name),
                            targetType: "WORKFLOW_RUN",
                            targetId: id,
                            metadata: {
                                workflowId: args.workflowId,
                                runId: runId,
                                initialInput: args.initialInput,
                            },
                        })];
                case 4:
                    // Log activity
                    _a.sent();
                    return [2 /*return*/, { runId: runId, id: id }];
            }
        });
    }); },
});
/**
 * Update step status
 */
exports.updateStep = (0, server_1.internalMutation)({
    args: {
        runId: values_1.v.string(),
        stepIndex: values_1.v.number(),
        status: values_1.v.string(),
        taskId: values_1.v.optional(values_1.v.id("tasks")),
        agentId: values_1.v.optional(values_1.v.id("agents")),
        error: values_1.v.optional(values_1.v.string()),
        output: values_1.v.optional(values_1.v.string()),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var run, steps, step, now, instanceRef, _a;
        var _b, _c, _d, _e;
        return __generator(this, function (_f) {
            switch (_f.label) {
                case 0: return [4 /*yield*/, ctx.db
                        .query("workflowRuns")
                        .withIndex("by_run_id", function (q) { return q.eq("runId", args.runId); })
                        .first()];
                case 1:
                    run = _f.sent();
                    if (!run) {
                        throw new Error("Workflow run not found: ".concat(args.runId));
                    }
                    steps = __spreadArray([], run.steps, true);
                    step = steps[args.stepIndex];
                    if (!step) {
                        throw new Error("Step index out of bounds: ".concat(args.stepIndex));
                    }
                    now = Date.now();
                    // Update step
                    steps[args.stepIndex] = __assign(__assign({}, step), { status: args.status, taskId: (_b = args.taskId) !== null && _b !== void 0 ? _b : step.taskId, agentId: (_c = args.agentId) !== null && _c !== void 0 ? _c : step.agentId, startedAt: args.status === "RUNNING" ? now : step.startedAt, completedAt: (args.status === "DONE" || args.status === "FAILED") ? now : step.completedAt, error: (_d = args.error) !== null && _d !== void 0 ? _d : step.error, output: (_e = args.output) !== null && _e !== void 0 ? _e : step.output });
                    return [4 /*yield*/, ctx.db.patch(run._id, { steps: steps })];
                case 2:
                    _f.sent();
                    if (!args.agentId) return [3 /*break*/, 4];
                    return [4 /*yield*/, (0, agentResolver_1.resolveAgentRef)({ db: ctx.db }, { agentId: args.agentId, createIfMissing: true })];
                case 3:
                    _a = _f.sent();
                    return [3 /*break*/, 5];
                case 4:
                    _a = null;
                    _f.label = 5;
                case 5:
                    instanceRef = _a;
                    if (!(args.status === "RUNNING")) return [3 /*break*/, 7];
                    return [4 /*yield*/, (0, armAudit_1.appendOpEvent)(ctx.db, {
                            tenantId: run.tenantId,
                            projectId: run.projectId,
                            workflowRunId: run._id,
                            taskId: args.taskId,
                            instanceId: instanceRef === null || instanceRef === void 0 ? void 0 : instanceRef.instanceId,
                            versionId: instanceRef === null || instanceRef === void 0 ? void 0 : instanceRef.versionId,
                            type: "WORKFLOW_STEP_STARTED",
                            payload: {
                                runId: args.runId,
                                stepIndex: args.stepIndex,
                                stepId: step.stepId,
                            },
                        })];
                case 6:
                    _f.sent();
                    return [3 /*break*/, 11];
                case 7:
                    if (!(args.status === "DONE")) return [3 /*break*/, 9];
                    return [4 /*yield*/, (0, armAudit_1.appendOpEvent)(ctx.db, {
                            tenantId: run.tenantId,
                            projectId: run.projectId,
                            workflowRunId: run._id,
                            taskId: args.taskId,
                            instanceId: instanceRef === null || instanceRef === void 0 ? void 0 : instanceRef.instanceId,
                            versionId: instanceRef === null || instanceRef === void 0 ? void 0 : instanceRef.versionId,
                            type: "WORKFLOW_STEP_COMPLETED",
                            payload: {
                                runId: args.runId,
                                stepIndex: args.stepIndex,
                                stepId: step.stepId,
                            },
                        })];
                case 8:
                    _f.sent();
                    return [3 /*break*/, 11];
                case 9:
                    if (!(args.status === "FAILED")) return [3 /*break*/, 11];
                    return [4 /*yield*/, (0, armAudit_1.appendOpEvent)(ctx.db, {
                            tenantId: run.tenantId,
                            projectId: run.projectId,
                            workflowRunId: run._id,
                            taskId: args.taskId,
                            instanceId: instanceRef === null || instanceRef === void 0 ? void 0 : instanceRef.instanceId,
                            versionId: instanceRef === null || instanceRef === void 0 ? void 0 : instanceRef.versionId,
                            type: "WORKFLOW_STEP_FAILED",
                            payload: {
                                runId: args.runId,
                                stepIndex: args.stepIndex,
                                stepId: step.stepId,
                                error: args.error,
                            },
                        })];
                case 10:
                    _f.sent();
                    _f.label = 11;
                case 11: return [2 /*return*/, { success: true }];
            }
        });
    }); },
});
/**
 * Advance workflow to next step
 */
exports.advance = (0, server_1.internalMutation)({
    args: {
        runId: values_1.v.string(),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var run, nextIndex;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, ctx.db
                        .query("workflowRuns")
                        .withIndex("by_run_id", function (q) { return q.eq("runId", args.runId); })
                        .first()];
                case 1:
                    run = _a.sent();
                    if (!run) {
                        throw new Error("Workflow run not found: ".concat(args.runId));
                    }
                    nextIndex = run.currentStepIndex + 1;
                    if (!(nextIndex >= run.totalSteps)) return [3 /*break*/, 3];
                    // Workflow complete
                    return [4 /*yield*/, ctx.db.patch(run._id, {
                            status: "COMPLETED",
                            completedAt: Date.now(),
                        })];
                case 2:
                    // Workflow complete
                    _a.sent();
                    return [2 /*return*/, { complete: true }];
                case 3: 
                // Move to next step
                return [4 /*yield*/, ctx.db.patch(run._id, {
                        currentStepIndex: nextIndex,
                    })];
                case 4:
                    // Move to next step
                    _a.sent();
                    return [2 /*return*/, { complete: false, nextIndex: nextIndex }];
            }
        });
    }); },
});
/**
 * Update workflow run status
 */
exports.updateStatus = (0, server_1.mutation)({
    args: {
        runId: values_1.v.string(),
        status: values_1.v.string(),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var run, updates;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, ctx.db
                        .query("workflowRuns")
                        .withIndex("by_run_id", function (q) { return q.eq("runId", args.runId); })
                        .first()];
                case 1:
                    run = _a.sent();
                    if (!run) {
                        throw new Error("Workflow run not found: ".concat(args.runId));
                    }
                    updates = {
                        status: args.status,
                    };
                    if (args.status === "COMPLETED" || args.status === "FAILED") {
                        updates.completedAt = Date.now();
                    }
                    return [4 /*yield*/, ctx.db.patch(run._id, updates)];
                case 2:
                    _a.sent();
                    return [2 /*return*/, { success: true }];
            }
        });
    }); },
});
/**
 * Update workflow context (variables passed between steps)
 */
exports.updateContext = (0, server_1.internalMutation)({
    args: {
        runId: values_1.v.string(),
        context: values_1.v.any(),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var run;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, ctx.db
                        .query("workflowRuns")
                        .withIndex("by_run_id", function (q) { return q.eq("runId", args.runId); })
                        .first()];
                case 1:
                    run = _a.sent();
                    if (!run) {
                        throw new Error("Workflow run not found: ".concat(args.runId));
                    }
                    return [4 /*yield*/, ctx.db.patch(run._id, {
                            context: __assign(__assign({}, run.context), args.context),
                        })];
                case 2:
                    _a.sent();
                    return [2 /*return*/, { success: true }];
            }
        });
    }); },
});
/**
 * Increment retry count for a step
 */
exports.incrementRetry = (0, server_1.internalMutation)({
    args: {
        runId: values_1.v.string(),
        stepIndex: values_1.v.number(),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var run, steps, step;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, ctx.db
                        .query("workflowRuns")
                        .withIndex("by_run_id", function (q) { return q.eq("runId", args.runId); })
                        .first()];
                case 1:
                    run = _a.sent();
                    if (!run) {
                        throw new Error("Workflow run not found: ".concat(args.runId));
                    }
                    steps = __spreadArray([], run.steps, true);
                    step = steps[args.stepIndex];
                    if (!step) {
                        throw new Error("Step index out of bounds: ".concat(args.stepIndex));
                    }
                    steps[args.stepIndex] = __assign(__assign({}, step), { retryCount: step.retryCount + 1 });
                    return [4 /*yield*/, ctx.db.patch(run._id, { steps: steps })];
                case 2:
                    _a.sent();
                    return [2 /*return*/, { retryCount: steps[args.stepIndex].retryCount }];
            }
        });
    }); },
});
