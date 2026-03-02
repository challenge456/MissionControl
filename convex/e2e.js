"use strict";
/**
 * E2E Testing — Convex Functions
 *
 * Deterministic seed data for end-to-end validation.
 * All objects created with E2E_<timestamp>_<shortid> prefix.
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
exports.validate = exports.cleanup = exports.seed = void 0;
var values_1 = require("convex/values");
var server_1 = require("./_generated/server");
/**
 * Seed E2E test data
 * Creates agents, tasks, content drops, and budget entries for validation.
 */
exports.seed = (0, server_1.mutation)({
    args: {
        runId: values_1.v.string(),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var runId, results, scoutAgentId, executorAgentId, inboxTaskId, contentTaskId, budgetTaskId, drop1Id, drop2Id, workflowRunId;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    runId = args.runId;
                    results = {
                        agents: [],
                        tasks: [],
                        contentDrops: [],
                        budgetEntries: [],
                        budgetTotal: 0,
                    };
                    return [4 /*yield*/, ctx.db.insert("agents", {
                            name: "e2e_scout_".concat(runId),
                            emoji: "🔍",
                            role: "SPECIALIST",
                            status: "ACTIVE",
                            workspacePath: "/work/mc-e2e",
                            allowedTaskTypes: ["ENGINEERING", "DOCS", "OPS"],
                            allowedTools: ["convex", "git", "github"],
                            budgetDaily: 10.00,
                            budgetPerRun: 2.00,
                            spendToday: 0,
                            canSpawn: false,
                            maxSubAgents: 0,
                            errorStreak: 0,
                            lastHeartbeatAt: Date.now(),
                            metadata: {
                                e2eRunId: runId,
                                capabilities: ["repo_scan", "workflow_boot", "reporting"],
                            },
                        })];
                case 1:
                    scoutAgentId = _a.sent();
                    results.agents.push({ id: scoutAgentId.toString(), name: "e2e_scout_".concat(runId) });
                    return [4 /*yield*/, ctx.db.insert("agents", {
                            name: "e2e_executor_".concat(runId),
                            emoji: "⚙️",
                            role: "SPECIALIST",
                            status: "ACTIVE",
                            workspacePath: "/work/mc-e2e",
                            allowedTaskTypes: ["ENGINEERING", "DOCS", "OPS"],
                            allowedTools: ["convex", "tasks", "content"],
                            budgetDaily: 10.00,
                            budgetPerRun: 2.00,
                            spendToday: 0,
                            canSpawn: false,
                            maxSubAgents: 0,
                            errorStreak: 0,
                            lastHeartbeatAt: Date.now(),
                            metadata: {
                                e2eRunId: runId,
                                capabilities: ["task_claim", "state_advance", "content_drop", "budget_write"],
                            },
                        })];
                case 2:
                    executorAgentId = _a.sent();
                    results.agents.push({ id: executorAgentId.toString(), name: "e2e_executor_".concat(runId) });
                    // Log activity
                    return [4 /*yield*/, ctx.db.insert("activities", {
                            actorType: "SYSTEM",
                            action: "E2E_SEED_AGENTS",
                            description: "Created 2 E2E agents for run ".concat(runId),
                            targetType: "SYSTEM",
                            metadata: { runId: runId, agentCount: 2 },
                        })];
                case 3:
                    // Log activity
                    _a.sent();
                    return [4 /*yield*/, ctx.db.insert("tasks", {
                            title: "E2E: Verify inbox claim/complete",
                            type: "ENGINEERING",
                            status: "INBOX",
                            priority: 2,
                            description: "Test task for E2E inbox roundtrip validation. Run: ".concat(runId),
                            assigneeIds: [],
                            createdBy: "SYSTEM",
                            source: "SEED",
                            reviewCycles: 0,
                            actualCost: 0,
                            metadata: {
                                e2eRunId: runId,
                                testType: "inbox_roundtrip",
                                expectedStates: ["INBOX", "ASSIGNED", "IN_PROGRESS", "DONE"],
                            },
                        })];
                case 4:
                    inboxTaskId = _a.sent();
                    results.tasks.push({
                        id: inboxTaskId.toString(),
                        title: "E2E: Verify inbox claim/complete",
                        status: "INBOX",
                        type: "e2e_inbox_roundtrip"
                    });
                    return [4 /*yield*/, ctx.db.insert("tasks", {
                            title: "E2E: Submit content drop",
                            type: "ENGINEERING",
                            status: "INBOX",
                            priority: 2,
                            description: "Test task for E2E content drop validation. Run: ".concat(runId),
                            assigneeIds: [],
                            createdBy: "SYSTEM",
                            source: "SEED",
                            reviewCycles: 0,
                            actualCost: 0,
                            metadata: {
                                e2eRunId: runId,
                                testType: "content_drop",
                                expected: "drop exists + retrievable",
                            },
                        })];
                case 5:
                    contentTaskId = _a.sent();
                    results.tasks.push({
                        id: contentTaskId.toString(),
                        title: "E2E: Submit content drop",
                        status: "INBOX",
                        type: "e2e_content_drop"
                    });
                    return [4 /*yield*/, ctx.db.insert("tasks", {
                            title: "E2E: Budget ledger write/read",
                            type: "ENGINEERING",
                            status: "INBOX",
                            priority: 2,
                            description: "Test task for E2E budget validation. Run: ".concat(runId),
                            assigneeIds: [],
                            createdBy: "SYSTEM",
                            source: "SEED",
                            reviewCycles: 0,
                            actualCost: 0,
                            metadata: {
                                e2eRunId: runId,
                                testType: "budget_roundtrip",
                                expected: "ledger entry exists + totals match",
                            },
                        })];
                case 6:
                    budgetTaskId = _a.sent();
                    results.tasks.push({
                        id: budgetTaskId.toString(),
                        title: "E2E: Budget ledger write/read",
                        status: "INBOX",
                        type: "e2e_budget_roundtrip"
                    });
                    return [4 /*yield*/, ctx.db.insert("contentDrops", {
                            agentId: executorAgentId,
                            title: "e2e-drop: hello",
                            contentType: "OTHER",
                            status: "DRAFT",
                            content: "Hello from E2E test",
                            metadata: {
                                e2eRunId: runId,
                                source: "doctor",
                                kind: "note",
                            },
                        })];
                case 7:
                    drop1Id = _a.sent();
                    results.contentDrops.push({ id: drop1Id.toString(), title: "e2e-drop: hello" });
                    return [4 /*yield*/, ctx.db.insert("contentDrops", {
                            agentId: executorAgentId,
                            title: "e2e-drop: structured",
                            contentType: "OTHER",
                            status: "DRAFT",
                            content: JSON.stringify({ a: 1, b: 2 }),
                            metadata: {
                                e2eRunId: runId,
                                source: "doctor",
                                kind: "json",
                                payload: { a: 1, b: 2 },
                            },
                        })];
                case 8:
                    drop2Id = _a.sent();
                    results.contentDrops.push({ id: drop2Id.toString(), title: "e2e-drop: structured" });
                    // ============================================================================
                    // D) Create E2E Budget Ledger Entries (2)
                    // ============================================================================
                    // Entry 1: +1.00 units
                    return [4 /*yield*/, ctx.db.insert("activities", {
                            actorType: "SYSTEM",
                            action: "E2E_BUDGET_CREDIT",
                            description: "E2E budget credit for run ".concat(runId),
                            targetType: "AGENT",
                            targetId: executorAgentId,
                            agentId: executorAgentId,
                            metadata: {
                                e2eRunId: runId,
                                category: "e2e",
                                amount: 1.00,
                                reason: "doctor seed",
                                type: "credit",
                            },
                        })];
                case 9:
                    // ============================================================================
                    // D) Create E2E Budget Ledger Entries (2)
                    // ============================================================================
                    // Entry 1: +1.00 units
                    _a.sent();
                    results.budgetEntries.push({ id: "credit_1", amount: 1.00 });
                    // Entry 2: -0.25 units
                    return [4 /*yield*/, ctx.db.insert("activities", {
                            actorType: "SYSTEM",
                            action: "E2E_BUDGET_DEBIT",
                            description: "E2E budget debit for run ".concat(runId),
                            targetType: "AGENT",
                            targetId: executorAgentId,
                            agentId: executorAgentId,
                            metadata: {
                                e2eRunId: runId,
                                category: "e2e",
                                amount: -0.25,
                                reason: "doctor seed",
                                type: "debit",
                            },
                        })];
                case 10:
                    // Entry 2: -0.25 units
                    _a.sent();
                    results.budgetEntries.push({ id: "debit_1", amount: -0.25 });
                    results.budgetTotal = 0.75; // +1.00 - 0.25
                    // Update agent spend to reflect budget entries
                    return [4 /*yield*/, ctx.db.patch(executorAgentId, {
                            spendToday: 0.25, // Only the debit counts as spend
                        })];
                case 11:
                    // Update agent spend to reflect budget entries
                    _a.sent();
                    return [4 /*yield*/, ctx.db.insert("workflowRuns", {
                            runId: "e2e-".concat(runId),
                            workflowId: "feature-dev",
                            status: "PENDING",
                            initialInput: "E2E test workflow run. Goal: Add a README line in toy repo. Run: ".concat(runId),
                            startedAt: Date.now(),
                            totalSteps: 3,
                            currentStepIndex: 0,
                            steps: [],
                            context: {
                                e2eRunId: runId,
                                testType: "minimal_workflow",
                                goal: "Add a README line in /work/mc-e2e/toy-repo",
                            },
                            metadata: {
                                e2eRunId: runId,
                                isE2E: true,
                            },
                        })];
                case 12:
                    workflowRunId = _a.sent();
                    // Log seed completion
                    return [4 /*yield*/, ctx.db.insert("activities", {
                            actorType: "SYSTEM",
                            action: "E2E_SEED_COMPLETE",
                            description: "E2E seed completed for run ".concat(runId),
                            targetType: "SYSTEM",
                            metadata: {
                                runId: runId,
                                agentsCreated: results.agents.length,
                                tasksCreated: results.tasks.length,
                                dropsCreated: results.contentDrops.length,
                                budgetEntries: results.budgetEntries.length,
                                workflowRunId: workflowRunId.toString(),
                            },
                        })];
                case 13:
                    // Log seed completion
                    _a.sent();
                    return [2 /*return*/, __assign(__assign({ success: true, runId: runId }, results), { workflowRunId: workflowRunId.toString() })];
            }
        });
    }); },
});
/**
 * Cleanup E2E test data
 * Deletes or archives all objects with matching runId.
 */
exports.cleanup = (0, server_1.mutation)({
    args: {
        runId: values_1.v.string(),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var runId, results, allAgents, _i, allAgents_1, agent, tasks, _a, tasks_1, task, drops, _b, drops_1, drop, workflowRuns, _c, workflowRuns_1, wr, activities, _d, activities_1, activity;
        var _e, _f;
        return __generator(this, function (_g) {
            switch (_g.label) {
                case 0:
                    runId = args.runId;
                    results = {
                        agentsDeleted: 0,
                        tasksDeleted: 0,
                        dropsDeleted: 0,
                        activitiesDeleted: 0,
                        workflowRunsDeleted: 0,
                    };
                    return [4 /*yield*/, ctx.db
                            .query("agents")
                            .collect()];
                case 1:
                    allAgents = _g.sent();
                    _i = 0, allAgents_1 = allAgents;
                    _g.label = 2;
                case 2:
                    if (!(_i < allAgents_1.length)) return [3 /*break*/, 5];
                    agent = allAgents_1[_i];
                    if (!(((_e = agent.name) === null || _e === void 0 ? void 0 : _e.startsWith("e2e_scout_".concat(runId))) || ((_f = agent.name) === null || _f === void 0 ? void 0 : _f.startsWith("e2e_executor_".concat(runId))))) return [3 /*break*/, 4];
                    return [4 /*yield*/, ctx.db.delete(agent._id)];
                case 3:
                    _g.sent();
                    results.agentsDeleted++;
                    _g.label = 4;
                case 4:
                    _i++;
                    return [3 /*break*/, 2];
                case 5: return [4 /*yield*/, ctx.db
                        .query("tasks")
                        .filter(function (q) { return q.eq("metadata.e2eRunId", runId); })
                        .collect()];
                case 6:
                    tasks = _g.sent();
                    _a = 0, tasks_1 = tasks;
                    _g.label = 7;
                case 7:
                    if (!(_a < tasks_1.length)) return [3 /*break*/, 10];
                    task = tasks_1[_a];
                    return [4 /*yield*/, ctx.db.delete(task._id)];
                case 8:
                    _g.sent();
                    results.tasksDeleted++;
                    _g.label = 9;
                case 9:
                    _a++;
                    return [3 /*break*/, 7];
                case 10: return [4 /*yield*/, ctx.db
                        .query("contentDrops")
                        .filter(function (q) { return q.eq("metadata.e2eRunId", runId); })
                        .collect()];
                case 11:
                    drops = _g.sent();
                    _b = 0, drops_1 = drops;
                    _g.label = 12;
                case 12:
                    if (!(_b < drops_1.length)) return [3 /*break*/, 15];
                    drop = drops_1[_b];
                    return [4 /*yield*/, ctx.db.delete(drop._id)];
                case 13:
                    _g.sent();
                    results.dropsDeleted++;
                    _g.label = 14;
                case 14:
                    _b++;
                    return [3 /*break*/, 12];
                case 15: return [4 /*yield*/, ctx.db
                        .query("workflowRuns")
                        .filter(function (q) { return q.eq("metadata.e2eRunId", runId); })
                        .collect()];
                case 16:
                    workflowRuns = _g.sent();
                    _c = 0, workflowRuns_1 = workflowRuns;
                    _g.label = 17;
                case 17:
                    if (!(_c < workflowRuns_1.length)) return [3 /*break*/, 20];
                    wr = workflowRuns_1[_c];
                    return [4 /*yield*/, ctx.db.delete(wr._id)];
                case 18:
                    _g.sent();
                    results.workflowRunsDeleted++;
                    _g.label = 19;
                case 19:
                    _c++;
                    return [3 /*break*/, 17];
                case 20: return [4 /*yield*/, ctx.db
                        .query("activities")
                        .filter(function (q) { return q.eq("metadata.e2eRunId", runId); })
                        .collect()];
                case 21:
                    activities = _g.sent();
                    _d = 0, activities_1 = activities;
                    _g.label = 22;
                case 22:
                    if (!(_d < activities_1.length)) return [3 /*break*/, 25];
                    activity = activities_1[_d];
                    return [4 /*yield*/, ctx.db.delete(activity._id)];
                case 23:
                    _g.sent();
                    results.activitiesDeleted++;
                    _g.label = 24;
                case 24:
                    _d++;
                    return [3 /*break*/, 22];
                case 25: 
                // Log cleanup
                return [4 /*yield*/, ctx.db.insert("activities", {
                        actorType: "SYSTEM",
                        action: "E2E_CLEANUP_COMPLETE",
                        description: "E2E cleanup completed for run ".concat(runId),
                        targetType: "SYSTEM",
                        metadata: __assign({ runId: runId }, results),
                    })];
                case 26:
                    // Log cleanup
                    _g.sent();
                    return [2 /*return*/, __assign({ success: true, runId: runId }, results)];
            }
        });
    }); },
});
/**
 * Validate E2E seed data
 * Checks that all expected objects exist and are valid.
 */
exports.validate = (0, server_1.query)({
    args: {
        runId: values_1.v.string(),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var runId, results, agents, tasks, drops, budgetActivities, total, _i, budgetActivities_1, act, workflowRuns;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    runId = args.runId;
                    results = {
                        agents: { found: 0, expected: 2, valid: true },
                        tasks: { found: 0, expected: 3, valid: true },
                        contentDrops: { found: 0, expected: 2, valid: true },
                        budget: { total: 0, expected: 0.75, valid: true },
                        workflowRuns: { found: 0, expected: 1, valid: true },
                        allValid: true,
                    };
                    return [4 /*yield*/, ctx.db
                            .query("agents")
                            .filter(function (q) { return q.eq("metadata.e2eRunId", runId); })
                            .collect()];
                case 1:
                    agents = _b.sent();
                    results.agents.found = agents.length;
                    results.agents.valid = agents.length >= 2;
                    return [4 /*yield*/, ctx.db
                            .query("tasks")
                            .filter(function (q) { return q.eq("metadata.e2eRunId", runId); })
                            .collect()];
                case 2:
                    tasks = _b.sent();
                    results.tasks.found = tasks.length;
                    results.tasks.valid = tasks.length >= 3;
                    return [4 /*yield*/, ctx.db
                            .query("contentDrops")
                            .filter(function (q) { return q.eq("metadata.e2eRunId", runId); })
                            .collect()];
                case 3:
                    drops = _b.sent();
                    results.contentDrops.found = drops.length;
                    results.contentDrops.valid = drops.length >= 2;
                    return [4 /*yield*/, ctx.db
                            .query("activities")
                            .filter(function (q) {
                            return q.and(q.eq("metadata.e2eRunId", runId), q.or(q.eq("action", "E2E_BUDGET_CREDIT"), q.eq("action", "E2E_BUDGET_DEBIT")));
                        })
                            .collect()];
                case 4:
                    budgetActivities = _b.sent();
                    total = 0;
                    for (_i = 0, budgetActivities_1 = budgetActivities; _i < budgetActivities_1.length; _i++) {
                        act = budgetActivities_1[_i];
                        total += ((_a = act.metadata) === null || _a === void 0 ? void 0 : _a.amount) || 0;
                    }
                    results.budget.total = total;
                    results.budget.valid = Math.abs(total - 0.75) < 0.001;
                    return [4 /*yield*/, ctx.db
                            .query("workflowRuns")
                            .filter(function (q) { return q.eq("metadata.e2eRunId", runId); })
                            .collect()];
                case 5:
                    workflowRuns = _b.sent();
                    results.workflowRuns.found = workflowRuns.length;
                    results.workflowRuns.valid = workflowRuns.length >= 1;
                    // Overall validity
                    results.allValid =
                        results.agents.valid &&
                            results.tasks.valid &&
                            results.contentDrops.valid &&
                            results.budget.valid &&
                            results.workflowRuns.valid;
                    return [2 /*return*/, results];
            }
        });
    }); },
});
