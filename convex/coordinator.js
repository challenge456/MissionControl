"use strict";
/**
 * Coordinator — Convex Integration
 *
 * Bridges the packages/coordinator logic into Convex mutations/queries.
 * Provides:
 *   - decomposeTask: break an INBOX task into subtasks
 *   - getSubtasks: list subtasks for a parent
 *   - getTaskDependencies: query the dependency graph
 *   - getDependencyGraph: full DAG for a parent task
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
exports.decomposeTask = exports.getDependencyGraph = exports.getTaskDependencies = exports.getSubtasks = void 0;
var values_1 = require("convex/values");
var server_1 = require("./_generated/server");
// ============================================================================
// QUERIES
// ============================================================================
/**
 * Get all subtasks for a parent task.
 */
exports.getSubtasks = (0, server_1.query)({
    args: { parentTaskId: values_1.v.id("tasks") },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var tasks;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, ctx.db.query("tasks").collect()];
                case 1:
                    tasks = _a.sent();
                    return [2 /*return*/, tasks.filter(function (t) { return t.parentTaskId === args.parentTaskId; })];
            }
        });
    }); },
});
/**
 * Get the task dependency graph for a parent task.
 */
exports.getTaskDependencies = (0, server_1.query)({
    args: { parentTaskId: values_1.v.id("tasks") },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, ctx.db
                        .query("taskDependencies")
                        .withIndex("by_parent", function (q) { return q.eq("parentTaskId", args.parentTaskId); })
                        .collect()];
                case 1: return [2 /*return*/, _a.sent()];
            }
        });
    }); },
});
/**
 * Get the full dependency graph for visualization (DAG view).
 * Returns nodes (tasks) and edges (dependencies).
 */
exports.getDependencyGraph = (0, server_1.query)({
    args: { parentTaskId: values_1.v.optional(values_1.v.id("tasks")) },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var tasks, deps, allTasks, nodes, edges;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!args.parentTaskId) return [3 /*break*/, 3];
                    return [4 /*yield*/, ctx.db.query("tasks").collect()];
                case 1:
                    allTasks = _a.sent();
                    tasks = allTasks.filter(function (t) { return t.parentTaskId === args.parentTaskId || t._id === args.parentTaskId; });
                    return [4 /*yield*/, ctx.db
                            .query("taskDependencies")
                            .withIndex("by_parent", function (q) { return q.eq("parentTaskId", args.parentTaskId); })
                            .collect()];
                case 2:
                    deps = _a.sent();
                    return [3 /*break*/, 6];
                case 3: return [4 /*yield*/, ctx.db.query("tasks").collect()];
                case 4:
                    // Get all top-level tasks and their subtasks
                    tasks = _a.sent();
                    return [4 /*yield*/, ctx.db.query("taskDependencies").collect()];
                case 5:
                    deps = _a.sent();
                    _a.label = 6;
                case 6:
                    nodes = tasks.map(function (t) { return ({
                        id: t._id,
                        title: t.title,
                        status: t.status,
                        type: t.type,
                        priority: t.priority,
                        assigneeIds: t.assigneeIds,
                        parentTaskId: t.parentTaskId,
                    }); });
                    edges = deps.map(function (d) { return ({
                        id: d._id,
                        from: d.taskId,
                        to: d.dependsOnTaskId,
                        parentTaskId: d.parentTaskId,
                    }); });
                    return [2 /*return*/, { nodes: nodes, edges: edges }];
            }
        });
    }); },
});
// ============================================================================
// MUTATIONS
// ============================================================================
/**
 * Decompose an INBOX task into subtasks using strategy-based decomposition.
 *
 * Uses the same decomposition strategies as packages/coordinator/src/decomposer.ts
 * but runs inside Convex for transactional safety.
 */
exports.decomposeTask = (0, server_1.mutation)({
    args: {
        taskId: values_1.v.id("tasks"),
        maxSubtasks: values_1.v.optional(values_1.v.number()),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var task, existingSubtasks, strategy, maxSubtasks, phases, subtaskIds, i, phase, subtaskId, i, phase, _i, _a, depIdx;
        var _b, _c, _d;
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0: return [4 /*yield*/, ctx.db.get(args.taskId)];
                case 1:
                    task = _e.sent();
                    if (!task) {
                        return [2 /*return*/, { success: false, error: "Task not found" }];
                    }
                    if (task.status !== "INBOX") {
                        return [2 /*return*/, { success: false, error: "Task is ".concat(task.status, ", must be INBOX to decompose") }];
                    }
                    return [4 /*yield*/, ctx.db.query("tasks").collect()];
                case 2:
                    existingSubtasks = (_e.sent()).filter(function (t) { return t.parentTaskId === args.taskId; });
                    if (existingSubtasks.length > 0) {
                        return [2 /*return*/, {
                                success: false,
                                error: "Task already has ".concat(existingSubtasks.length, " subtasks"),
                            }];
                    }
                    strategy = getDecompositionStrategy(task.type);
                    maxSubtasks = (_b = args.maxSubtasks) !== null && _b !== void 0 ? _b : 7;
                    phases = strategy.phases.slice(0, maxSubtasks);
                    subtaskIds = [];
                    i = 0;
                    _e.label = 3;
                case 3:
                    if (!(i < phases.length)) return [3 /*break*/, 6];
                    phase = phases[i];
                    return [4 /*yield*/, ctx.db.insert("tasks", {
                            tenantId: task.tenantId,
                            projectId: task.projectId,
                            title: "".concat(phase.verb, " \u2014 ").concat(task.title),
                            description: "".concat(phase.description, " for: ").concat((_c = task.description) !== null && _c !== void 0 ? _c : task.title),
                            type: ((_d = phase.subtaskType) !== null && _d !== void 0 ? _d : task.type),
                            status: "INBOX",
                            priority: task.priority,
                            assigneeIds: [],
                            assigneeInstanceIds: [],
                            reviewCycles: 0,
                            actualCost: 0,
                            parentTaskId: args.taskId,
                            source: "AGENT",
                            createdBy: "SYSTEM",
                            idempotencyKey: "decompose-".concat(args.taskId, "-phase-").concat(i),
                            estimatedCost: phase.estimatedMinutes * 0.01, // Rough estimate
                            labels: ["phase:".concat(i), "strategy:".concat(strategy.name)],
                        })];
                case 4:
                    subtaskId = _e.sent();
                    subtaskIds.push(subtaskId);
                    _e.label = 5;
                case 5:
                    i++;
                    return [3 /*break*/, 3];
                case 6:
                    i = 0;
                    _e.label = 7;
                case 7:
                    if (!(i < phases.length)) return [3 /*break*/, 12];
                    phase = phases[i];
                    if (!phase.dependsOnPhaseIndex) return [3 /*break*/, 11];
                    _i = 0, _a = phase.dependsOnPhaseIndex;
                    _e.label = 8;
                case 8:
                    if (!(_i < _a.length)) return [3 /*break*/, 11];
                    depIdx = _a[_i];
                    if (!(depIdx >= 0 && depIdx < subtaskIds.length)) return [3 /*break*/, 10];
                    return [4 /*yield*/, ctx.db.insert("taskDependencies", {
                            parentTaskId: args.taskId,
                            taskId: subtaskIds[i],
                            dependsOnTaskId: subtaskIds[depIdx],
                        })];
                case 9:
                    _e.sent();
                    _e.label = 10;
                case 10:
                    _i++;
                    return [3 /*break*/, 8];
                case 11:
                    i++;
                    return [3 /*break*/, 7];
                case 12: 
                // Log activity
                return [4 /*yield*/, ctx.db.insert("activities", {
                        projectId: task.projectId,
                        actorType: "SYSTEM",
                        action: "TASK_DECOMPOSED",
                        description: "Decomposed \"".concat(task.title, "\" into ").concat(subtaskIds.length, " subtasks using ").concat(strategy.name, " strategy"),
                        targetType: "TASK",
                        targetId: args.taskId,
                        taskId: args.taskId,
                        metadata: {
                            strategy: strategy.name,
                            subtaskCount: subtaskIds.length,
                            subtaskIds: subtaskIds,
                        },
                    })];
                case 13:
                    // Log activity
                    _e.sent();
                    return [2 /*return*/, {
                            success: true,
                            subtaskIds: subtaskIds,
                            strategy: strategy.name,
                            subtaskCount: subtaskIds.length,
                        }];
            }
        });
    }); },
});
function getDecompositionStrategy(taskType) {
    var _a;
    var strategies = {
        ENGINEERING: {
            name: "engineering",
            phases: [
                {
                    verb: "Research",
                    description: "Investigate requirements and existing code",
                    subtaskType: "CUSTOMER_RESEARCH",
                    estimatedMinutes: 30,
                    requiredCapabilities: ["code_analysis", "research"],
                    deliverable: "Research summary with approach recommendation",
                },
                {
                    verb: "Implement",
                    description: "Write the core implementation",
                    estimatedMinutes: 60,
                    dependsOnPhaseIndex: [0],
                    requiredCapabilities: ["code_generation", "file_operations"],
                    deliverable: "Working implementation with inline comments",
                },
                {
                    verb: "Test",
                    description: "Write and run tests",
                    estimatedMinutes: 30,
                    dependsOnPhaseIndex: [1],
                    requiredCapabilities: ["testing", "code_generation"],
                    deliverable: "Test suite with passing results",
                },
                {
                    verb: "Document",
                    description: "Update documentation",
                    subtaskType: "DOCS",
                    estimatedMinutes: 15,
                    dependsOnPhaseIndex: [1],
                    requiredCapabilities: ["documentation"],
                    deliverable: "Updated docs reflecting the changes",
                },
            ],
        },
        CONTENT: {
            name: "content",
            phases: [
                {
                    verb: "Research",
                    description: "Research topic and gather sources",
                    subtaskType: "CUSTOMER_RESEARCH",
                    estimatedMinutes: 20,
                    requiredCapabilities: ["research", "web_search"],
                    deliverable: "Research brief with key points and sources",
                },
                {
                    verb: "Draft",
                    description: "Write the first draft",
                    estimatedMinutes: 40,
                    dependsOnPhaseIndex: [0],
                    requiredCapabilities: ["content_creation"],
                    deliverable: "Complete first draft",
                },
                {
                    verb: "Review",
                    description: "Review and revise for quality",
                    estimatedMinutes: 20,
                    dependsOnPhaseIndex: [1],
                    requiredCapabilities: ["content_review", "editing"],
                    deliverable: "Polished final draft",
                },
            ],
        },
        OPS: {
            name: "operations",
            phases: [
                {
                    verb: "Audit",
                    description: "Audit current state and identify gaps",
                    estimatedMinutes: 20,
                    requiredCapabilities: ["system_audit", "monitoring"],
                    deliverable: "Audit report with findings",
                },
                {
                    verb: "Plan",
                    description: "Create execution plan",
                    estimatedMinutes: 15,
                    dependsOnPhaseIndex: [0],
                    requiredCapabilities: ["planning"],
                    deliverable: "Step-by-step execution plan",
                },
                {
                    verb: "Execute",
                    description: "Execute the planned changes",
                    estimatedMinutes: 30,
                    dependsOnPhaseIndex: [1],
                    requiredCapabilities: ["system_operations"],
                    deliverable: "Completed operation with verification",
                },
            ],
        },
    };
    return (_a = strategies[taskType]) !== null && _a !== void 0 ? _a : {
        name: "generic",
        phases: [
            {
                verb: "Research",
                description: "Investigate and plan approach",
                estimatedMinutes: 20,
                requiredCapabilities: ["research"],
                deliverable: "Approach recommendation",
            },
            {
                verb: "Execute",
                description: "Perform the main work",
                estimatedMinutes: 45,
                dependsOnPhaseIndex: [0],
                requiredCapabilities: [],
                deliverable: "Completed deliverable",
            },
            {
                verb: "Review",
                description: "Quality check the output",
                estimatedMinutes: 15,
                dependsOnPhaseIndex: [1],
                requiredCapabilities: ["review"],
                deliverable: "Quality-verified output",
            },
        ],
    };
}
