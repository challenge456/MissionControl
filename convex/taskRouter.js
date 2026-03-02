"use strict";
/**
 * Task Router — Smart Task Assignment
 *
 * Automatically assigns tasks to the best available agent based on:
 * - Skill matching (agent's allowedTaskTypes)
 * - Availability (agent status)
 * - Workload (current task count)
 * - Priority (agent role weight)
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
exports.autoAssign = exports.getRecommendations = exports.findBestAgent = void 0;
var values_1 = require("convex/values");
var server_1 = require("./_generated/server");
/**
 * Calculate assignment score for an agent
 *
 * Score = (skill_match * 0.3) + (availability * 0.2) + (workload * 0.2) + (performance * 0.2) + (role_weight * 0.1)
 *
 * Performance factor (new): success rate from agentPerformance table
 */
function calculateScore(agent, taskType, agentWorkloads, maxWorkload, performanceData) {
    // Skill match (0-1)
    var skillMatch = agent.allowedTaskTypes.includes(taskType) ? 1.0 : 0.0;
    // Availability (0-1)
    var availability = agent.status === "ACTIVE" ? 1.0 : 0.0;
    // Workload (0-1, inverse - lower workload = higher score)
    var currentWorkload = agentWorkloads.get(agent._id) || 0;
    var workloadScore = maxWorkload > 0 ? 1 - (currentWorkload / maxWorkload) : 1.0;
    // Role weight (0-1)
    var roleWeights = {
        LEAD: 1.0,
        SPECIALIST: 0.8,
        REVIEWER: 0.6,
        CHALLENGER: 0.6,
        INTERN: 0.4,
    };
    var roleWeight = roleWeights[agent.role] || 0.5;
    // Performance factor (0-1): based on success rate and refute count
    var performanceScore = 0.5; // default for agents with no history
    if (performanceData && performanceData.totalTasks > 0) {
        // Success rate (70% weight of performance)
        var successWeight = performanceData.successRate * 0.7;
        // Refute penalty (30% weight of performance) — lower refutes = higher score
        var refutePenalty = Math.max(0, 1 - performanceData.refuteCount * 0.1) * 0.3;
        performanceScore = successWeight + refutePenalty;
    }
    // Calculate weighted score (updated weights)
    var score = (skillMatch * 0.3 +
        availability * 0.2 +
        workloadScore * 0.2 +
        performanceScore * 0.2 +
        roleWeight * 0.1);
    return score;
}
/**
 * Find the best agent for a task
 */
exports.findBestAgent = (0, server_1.query)({
    args: {
        projectId: values_1.v.id("projects"),
        taskType: values_1.v.string(),
        excludeAgentIds: values_1.v.optional(values_1.v.array(values_1.v.id("agents"))),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var agents, excludeSet, availableAgents, tasks, agentWorkloads, _i, tasks_1, task, _a, _b, agentId, maxWorkload, performanceMap, _loop_1, _c, availableAgents_1, agent, scoredAgents, best;
        var _d, _e;
        return __generator(this, function (_f) {
            switch (_f.label) {
                case 0: return [4 /*yield*/, ctx.db
                        .query("agents")
                        .withIndex("by_project", function (q) { return q.eq("projectId", args.projectId); })
                        .collect()];
                case 1:
                    agents = _f.sent();
                    excludeSet = new Set(args.excludeAgentIds || []);
                    availableAgents = agents.filter(function (a) { return !excludeSet.has(a._id); });
                    if (availableAgents.length === 0) {
                        return [2 /*return*/, null];
                    }
                    return [4 /*yield*/, ctx.db
                            .query("tasks")
                            .withIndex("by_project", function (q) { return q.eq("projectId", args.projectId); })
                            .filter(function (q) {
                            return q.or(q.eq(q.field("status"), "ASSIGNED"), q.eq(q.field("status"), "IN_PROGRESS"));
                        })
                            .collect()];
                case 2:
                    tasks = _f.sent();
                    agentWorkloads = new Map();
                    for (_i = 0, tasks_1 = tasks; _i < tasks_1.length; _i++) {
                        task = tasks_1[_i];
                        for (_a = 0, _b = task.assigneeIds; _a < _b.length; _a++) {
                            agentId = _b[_a];
                            agentWorkloads.set(agentId, (agentWorkloads.get(agentId) || 0) + 1);
                        }
                    }
                    maxWorkload = Math.max.apply(Math, __spreadArray(__spreadArray([], Array.from(agentWorkloads.values()), false), [1], false));
                    performanceMap = new Map();
                    _loop_1 = function (agent) {
                        var perfRecord, total;
                        return __generator(this, function (_g) {
                            switch (_g.label) {
                                case 0: return [4 /*yield*/, ctx.db
                                        .query("agentPerformance")
                                        .withIndex("by_agent_type", function (q) {
                                        return q.eq("agentId", agent._id).eq("taskType", args.taskType);
                                    })
                                        .first()];
                                case 1:
                                    perfRecord = _g.sent();
                                    if (perfRecord) {
                                        total = perfRecord.successCount + perfRecord.failureCount;
                                        performanceMap.set(agent._id, {
                                            successRate: total > 0 ? perfRecord.successCount / total : 0,
                                            refuteCount: perfRecord.failureCount,
                                            avgCostUsd: perfRecord.avgCostUsd,
                                            totalTasks: total,
                                        });
                                    }
                                    return [2 /*return*/];
                            }
                        });
                    };
                    _c = 0, availableAgents_1 = availableAgents;
                    _f.label = 3;
                case 3:
                    if (!(_c < availableAgents_1.length)) return [3 /*break*/, 6];
                    agent = availableAgents_1[_c];
                    return [5 /*yield**/, _loop_1(agent)];
                case 4:
                    _f.sent();
                    _f.label = 5;
                case 5:
                    _c++;
                    return [3 /*break*/, 3];
                case 6:
                    scoredAgents = availableAgents.map(function (agent) {
                        var perfData = performanceMap.get(agent._id);
                        return {
                            agent: agent,
                            score: calculateScore(agent, args.taskType, agentWorkloads, maxWorkload, perfData),
                            workload: agentWorkloads.get(agent._id) || 0,
                            performance: perfData,
                        };
                    });
                    // Sort by score (highest first)
                    scoredAgents.sort(function (a, b) { return b.score - a.score; });
                    best = scoredAgents[0];
                    if (!best || best.score === 0) {
                        return [2 /*return*/, null];
                    }
                    return [2 /*return*/, {
                            agent: best.agent,
                            score: best.score,
                            workload: best.workload,
                            performance: best.performance,
                            reasoning: {
                                skillMatch: best.agent.allowedTaskTypes.includes(args.taskType),
                                isActive: best.agent.status === "ACTIVE",
                                workload: best.workload,
                                role: best.agent.role,
                                successRate: (_d = best.performance) === null || _d === void 0 ? void 0 : _d.successRate,
                                totalTasks: (_e = best.performance) === null || _e === void 0 ? void 0 : _e.totalTasks,
                            },
                        }];
            }
        });
    }); },
});
/**
 * Get assignment recommendations for a task
 */
exports.getRecommendations = (0, server_1.query)({
    args: {
        projectId: values_1.v.id("projects"),
        taskType: values_1.v.string(),
        limit: values_1.v.optional(values_1.v.number()),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var limit, agents, tasks, agentWorkloads, _i, tasks_2, task, _a, _b, agentId, maxWorkload, performanceMap, _loop_2, _c, agents_1, agent, scoredAgents;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    limit = args.limit || 5;
                    return [4 /*yield*/, ctx.db
                            .query("agents")
                            .withIndex("by_project", function (q) { return q.eq("projectId", args.projectId); })
                            .collect()];
                case 1:
                    agents = _d.sent();
                    if (agents.length === 0) {
                        return [2 /*return*/, []];
                    }
                    return [4 /*yield*/, ctx.db
                            .query("tasks")
                            .withIndex("by_project", function (q) { return q.eq("projectId", args.projectId); })
                            .filter(function (q) {
                            return q.or(q.eq(q.field("status"), "ASSIGNED"), q.eq(q.field("status"), "IN_PROGRESS"));
                        })
                            .collect()];
                case 2:
                    tasks = _d.sent();
                    agentWorkloads = new Map();
                    for (_i = 0, tasks_2 = tasks; _i < tasks_2.length; _i++) {
                        task = tasks_2[_i];
                        for (_a = 0, _b = task.assigneeIds; _a < _b.length; _a++) {
                            agentId = _b[_a];
                            agentWorkloads.set(agentId, (agentWorkloads.get(agentId) || 0) + 1);
                        }
                    }
                    maxWorkload = Math.max.apply(Math, __spreadArray(__spreadArray([], Array.from(agentWorkloads.values()), false), [1], false));
                    performanceMap = new Map();
                    _loop_2 = function (agent) {
                        var perfRecord, total;
                        return __generator(this, function (_e) {
                            switch (_e.label) {
                                case 0: return [4 /*yield*/, ctx.db
                                        .query("agentPerformance")
                                        .withIndex("by_agent_type", function (q) {
                                        return q.eq("agentId", agent._id).eq("taskType", args.taskType);
                                    })
                                        .first()];
                                case 1:
                                    perfRecord = _e.sent();
                                    if (perfRecord) {
                                        total = perfRecord.successCount + perfRecord.failureCount;
                                        performanceMap.set(agent._id, {
                                            successRate: total > 0 ? perfRecord.successCount / total : 0,
                                            refuteCount: perfRecord.failureCount,
                                            avgCostUsd: perfRecord.avgCostUsd,
                                            totalTasks: total,
                                        });
                                    }
                                    return [2 /*return*/];
                            }
                        });
                    };
                    _c = 0, agents_1 = agents;
                    _d.label = 3;
                case 3:
                    if (!(_c < agents_1.length)) return [3 /*break*/, 6];
                    agent = agents_1[_c];
                    return [5 /*yield**/, _loop_2(agent)];
                case 4:
                    _d.sent();
                    _d.label = 5;
                case 5:
                    _c++;
                    return [3 /*break*/, 3];
                case 6:
                    scoredAgents = agents.map(function (agent) {
                        var perfData = performanceMap.get(agent._id);
                        return {
                            agent: agent,
                            score: calculateScore(agent, args.taskType, agentWorkloads, maxWorkload, perfData),
                            workload: agentWorkloads.get(agent._id) || 0,
                            performance: perfData,
                            reasoning: {
                                skillMatch: agent.allowedTaskTypes.includes(args.taskType),
                                isActive: agent.status === "ACTIVE",
                                workload: agentWorkloads.get(agent._id) || 0,
                                role: agent.role,
                                successRate: perfData === null || perfData === void 0 ? void 0 : perfData.successRate,
                                totalTasks: perfData === null || perfData === void 0 ? void 0 : perfData.totalTasks,
                            },
                        };
                    });
                    // Sort by score (highest first)
                    scoredAgents.sort(function (a, b) { return b.score - a.score; });
                    // Return top N
                    return [2 /*return*/, scoredAgents.slice(0, limit)];
            }
        });
    }); },
});
/**
 * Auto-assign a task to the best agent
 */
exports.autoAssign = (0, server_1.mutation)({
    args: {
        taskId: values_1.v.id("tasks"),
        actorType: values_1.v.union(values_1.v.literal("AGENT"), values_1.v.literal("HUMAN"), values_1.v.literal("SYSTEM")),
        actorUserId: values_1.v.optional(values_1.v.string()),
        idempotencyKey: values_1.v.string(),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var task, agents, excludeSet, availableAgents, tasks, agentWorkloads, _i, tasks_3, t, _a, _b, agentId, maxWorkload, perfMap, _loop_3, _c, availableAgents_2, agent, scoredAgents, best, result;
        var _d;
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0: return [4 /*yield*/, ctx.db.get(args.taskId)];
                case 1:
                    task = _e.sent();
                    if (!task) {
                        throw new Error("Task not found");
                    }
                    return [4 /*yield*/, ctx.db
                            .query("agents")
                            .withIndex("by_project", function (q) { return q.eq("projectId", task.projectId); })
                            .collect()];
                case 2:
                    agents = _e.sent();
                    excludeSet = new Set(task.assigneeIds);
                    availableAgents = agents.filter(function (a) { return !excludeSet.has(a._id); });
                    if (availableAgents.length === 0) {
                        return [2 /*return*/, {
                                success: false,
                                error: "No suitable agent found",
                            }];
                    }
                    return [4 /*yield*/, ctx.db
                            .query("tasks")
                            .withIndex("by_project", function (q) { return q.eq("projectId", task.projectId); })
                            .filter(function (q) {
                            return q.or(q.eq(q.field("status"), "ASSIGNED"), q.eq(q.field("status"), "IN_PROGRESS"));
                        })
                            .collect()];
                case 3:
                    tasks = _e.sent();
                    agentWorkloads = new Map();
                    for (_i = 0, tasks_3 = tasks; _i < tasks_3.length; _i++) {
                        t = tasks_3[_i];
                        for (_a = 0, _b = t.assigneeIds; _a < _b.length; _a++) {
                            agentId = _b[_a];
                            agentWorkloads.set(agentId, (agentWorkloads.get(agentId) || 0) + 1);
                        }
                    }
                    maxWorkload = Math.max.apply(Math, __spreadArray(__spreadArray([], Array.from(agentWorkloads.values()), false), [1], false));
                    perfMap = new Map();
                    _loop_3 = function (agent) {
                        var perfRecord, total;
                        return __generator(this, function (_f) {
                            switch (_f.label) {
                                case 0: return [4 /*yield*/, ctx.db
                                        .query("agentPerformance")
                                        .withIndex("by_agent_type", function (q) {
                                        return q.eq("agentId", agent._id).eq("taskType", task.type);
                                    })
                                        .first()];
                                case 1:
                                    perfRecord = _f.sent();
                                    if (perfRecord) {
                                        total = perfRecord.successCount + perfRecord.failureCount;
                                        perfMap.set(agent._id, {
                                            successRate: total > 0 ? perfRecord.successCount / total : 0,
                                            refuteCount: perfRecord.failureCount,
                                            avgCostUsd: perfRecord.avgCostUsd,
                                            totalTasks: total,
                                        });
                                    }
                                    return [2 /*return*/];
                            }
                        });
                    };
                    _c = 0, availableAgents_2 = availableAgents;
                    _e.label = 4;
                case 4:
                    if (!(_c < availableAgents_2.length)) return [3 /*break*/, 7];
                    agent = availableAgents_2[_c];
                    return [5 /*yield**/, _loop_3(agent)];
                case 5:
                    _e.sent();
                    _e.label = 6;
                case 6:
                    _c++;
                    return [3 /*break*/, 4];
                case 7:
                    scoredAgents = availableAgents.map(function (agent) { return ({
                        agent: agent,
                        score: calculateScore(agent, task.type, agentWorkloads, maxWorkload, perfMap.get(agent._id)),
                        workload: agentWorkloads.get(agent._id) || 0,
                    }); });
                    scoredAgents.sort(function (a, b) { return b.score - a.score; });
                    best = scoredAgents[0];
                    if (!best || best.score === 0) {
                        return [2 /*return*/, {
                                success: false,
                                error: "No suitable agent found",
                            }];
                    }
                    result = {
                        agent: best.agent,
                        score: best.score,
                        workload: best.workload,
                        reasoning: {
                            skillMatch: best.agent.allowedTaskTypes.includes(task.type),
                            isActive: best.agent.status === "ACTIVE",
                            workload: best.workload,
                            role: best.agent.role,
                            successRate: (_d = perfMap.get(best.agent._id)) === null || _d === void 0 ? void 0 : _d.successRate,
                        },
                    };
                    // Assign task
                    return [4 /*yield*/, ctx.db.patch(args.taskId, {
                            assigneeIds: __spreadArray(__spreadArray([], task.assigneeIds, true), [result.agent._id], false),
                            status: "ASSIGNED",
                        })];
                case 8:
                    // Assign task
                    _e.sent();
                    // Create activity
                    return [4 /*yield*/, ctx.db.insert("activities", {
                            projectId: task.projectId,
                            actorType: args.actorType,
                            actorId: args.actorUserId,
                            action: "AUTO_ASSIGNED",
                            description: "Auto-assigned task to ".concat(result.agent.name, " (score: ").concat(result.score.toFixed(2), ")"),
                            taskId: args.taskId,
                            agentId: result.agent._id,
                            metadata: {
                                score: result.score,
                                reasoning: result.reasoning,
                            },
                        })];
                case 9:
                    // Create activity
                    _e.sent();
                    // Create notification for agent
                    return [4 /*yield*/, ctx.db.insert("notifications", {
                            projectId: task.projectId,
                            agentId: result.agent._id,
                            type: "TASK_ASSIGNED",
                            title: "Task auto-assigned to you",
                            body: "Task \"".concat(task.title, "\" was automatically assigned to you"),
                            taskId: args.taskId,
                        })];
                case 10:
                    // Create notification for agent
                    _e.sent();
                    return [2 /*return*/, {
                            success: true,
                            agent: result.agent,
                            score: result.score,
                            reasoning: result.reasoning,
                        }];
            }
        });
    }); },
});
