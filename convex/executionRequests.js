"use strict";
/**
 * Execution Requests — Convex Functions
 *
 * Multi-executor routing for different types of work.
 * V1 stub: queue + routing + audit; execution is manual until v1.1.
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
exports.getRoutingRecommendation = exports.cancel = exports.updateStatus = exports.enqueue = exports.listByProject = exports.listByTask = exports.listPending = exports.get = void 0;
var values_1 = require("convex/values");
var server_1 = require("./_generated/server");
// ============================================================================
// QUERIES
// ============================================================================
exports.get = (0, server_1.query)({
    args: { requestId: values_1.v.id("executionRequests") },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, ctx.db.get(args.requestId)];
                case 1: return [2 /*return*/, _a.sent()];
            }
        });
    }); },
});
exports.listPending = (0, server_1.query)({
    args: {
        projectId: values_1.v.optional(values_1.v.id("projects")),
        executor: values_1.v.optional(values_1.v.string()),
        limit: values_1.v.optional(values_1.v.number()),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var query, requests;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    query = ctx.db
                        .query("executionRequests")
                        .withIndex("by_status", function (q) { return q.eq("status", "PENDING"); });
                    return [4 /*yield*/, query.order("desc").take((_a = args.limit) !== null && _a !== void 0 ? _a : 50)];
                case 1:
                    requests = _b.sent();
                    // Filter by project if provided
                    if (args.projectId) {
                        requests = requests.filter(function (r) { return r.projectId === args.projectId; });
                    }
                    // Filter by executor if provided
                    if (args.executor) {
                        requests = requests.filter(function (r) { return r.executor === args.executor; });
                    }
                    return [2 /*return*/, requests];
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
                        .query("executionRequests")
                        .withIndex("by_task", function (q) { return q.eq("taskId", args.taskId); })
                        .order("desc")
                        .take((_a = args.limit) !== null && _a !== void 0 ? _a : 50)];
                case 1: return [2 /*return*/, _b.sent()];
            }
        });
    }); },
});
exports.listByProject = (0, server_1.query)({
    args: {
        projectId: values_1.v.id("projects"),
        status: values_1.v.optional(values_1.v.string()),
        limit: values_1.v.optional(values_1.v.number()),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    if (!args.status) return [3 /*break*/, 2];
                    return [4 /*yield*/, ctx.db
                            .query("executionRequests")
                            .withIndex("by_project_status", function (q) {
                            return q.eq("projectId", args.projectId).eq("status", args.status);
                        })
                            .order("desc")
                            .take((_a = args.limit) !== null && _a !== void 0 ? _a : 50)];
                case 1: return [2 /*return*/, _c.sent()];
                case 2: return [4 /*yield*/, ctx.db
                        .query("executionRequests")
                        .withIndex("by_project", function (q) { return q.eq("projectId", args.projectId); })
                        .order("desc")
                        .take((_b = args.limit) !== null && _b !== void 0 ? _b : 50)];
                case 3: return [2 /*return*/, _c.sent()];
            }
        });
    }); },
});
// ============================================================================
// MUTATIONS
// ============================================================================
exports.enqueue = (0, server_1.mutation)({
    args: {
        projectId: values_1.v.optional(values_1.v.id("projects")),
        taskId: values_1.v.optional(values_1.v.id("tasks")),
        requestedBy: values_1.v.id("agents"),
        type: values_1.v.string(),
        executor: values_1.v.string(),
        payload: values_1.v.any(),
        metadata: values_1.v.optional(values_1.v.any()),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var requestId, agent;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, ctx.db.insert("executionRequests", {
                        projectId: args.projectId,
                        taskId: args.taskId,
                        requestedBy: args.requestedBy,
                        type: args.type,
                        executor: args.executor,
                        status: "PENDING",
                        payload: args.payload,
                        requestedAt: Date.now(),
                        metadata: args.metadata,
                    })];
                case 1:
                    requestId = _b.sent();
                    return [4 /*yield*/, ctx.db.get(args.requestedBy)];
                case 2:
                    agent = _b.sent();
                    return [4 /*yield*/, ctx.db.insert("activities", {
                            projectId: args.projectId,
                            actorType: "AGENT",
                            actorId: args.requestedBy.toString(),
                            action: "EXECUTION_REQUESTED",
                            description: "".concat((agent === null || agent === void 0 ? void 0 : agent.name) || "Agent", " requested ").concat(args.type, " execution via ").concat(args.executor),
                            targetType: "EXECUTION_REQUEST",
                            targetId: requestId,
                            taskId: args.taskId,
                            agentId: args.requestedBy,
                        })];
                case 3:
                    _b.sent();
                    _a = { requestId: requestId };
                    return [4 /*yield*/, ctx.db.get(requestId)];
                case 4: return [2 /*return*/, (_a.request = _b.sent(), _a)];
            }
        });
    }); },
});
exports.updateStatus = (0, server_1.mutation)({
    args: {
        requestId: values_1.v.id("executionRequests"),
        status: values_1.v.string(),
        assignedTo: values_1.v.optional(values_1.v.string()),
        result: values_1.v.optional(values_1.v.any()),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var request, now, updates;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, ctx.db.get(args.requestId)];
                case 1:
                    request = _b.sent();
                    if (!request) {
                        return [2 /*return*/, { success: false, error: "Request not found" }];
                    }
                    now = Date.now();
                    updates = {
                        status: args.status,
                    };
                    if (args.assignedTo) {
                        updates.assignedTo = args.assignedTo;
                        updates.assignedAt = now;
                    }
                    if (args.result) {
                        updates.result = args.result;
                    }
                    if (args.status === "COMPLETED" || args.status === "FAILED") {
                        updates.completedAt = now;
                    }
                    return [4 /*yield*/, ctx.db.patch(args.requestId, updates)];
                case 2:
                    _b.sent();
                    // Log activity
                    return [4 /*yield*/, ctx.db.insert("activities", {
                            projectId: request.projectId,
                            actorType: "SYSTEM",
                            action: "EXECUTION_STATUS_CHANGED",
                            description: "Execution request ".concat(request.type, " \u2192 ").concat(args.status),
                            targetType: "EXECUTION_REQUEST",
                            targetId: args.requestId,
                            taskId: request.taskId,
                            beforeState: { status: request.status },
                            afterState: { status: args.status },
                        })];
                case 3:
                    // Log activity
                    _b.sent();
                    _a = { success: true };
                    return [4 /*yield*/, ctx.db.get(args.requestId)];
                case 4: return [2 /*return*/, (_a.request = _b.sent(), _a)];
            }
        });
    }); },
});
exports.cancel = (0, server_1.mutation)({
    args: {
        requestId: values_1.v.id("executionRequests"),
        reason: values_1.v.optional(values_1.v.string()),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var request;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, ctx.db.get(args.requestId)];
                case 1:
                    request = _a.sent();
                    if (!request) {
                        return [2 /*return*/, { success: false, error: "Request not found" }];
                    }
                    if (request.status !== "PENDING") {
                        return [2 /*return*/, { success: false, error: "Request already ".concat(request.status) }];
                    }
                    return [4 /*yield*/, ctx.db.patch(args.requestId, {
                            status: "FAILED",
                            result: { canceled: true, reason: args.reason },
                            completedAt: Date.now(),
                        })];
                case 2:
                    _a.sent();
                    return [2 /*return*/, { success: true }];
            }
        });
    }); },
});
// ============================================================================
// ROUTING LOGIC (V1 Stub)
// ============================================================================
/**
 * Get routing recommendation for a task type.
 * V1: Returns recommendation only; execution is manual.
 * V1.1: Will automatically assign and execute.
 */
exports.getRoutingRecommendation = (0, server_1.query)({
    args: {
        type: values_1.v.string(),
        taskId: values_1.v.optional(values_1.v.id("tasks")),
    },
    handler: function (_ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var routing, executor;
        return __generator(this, function (_a) {
            routing = {
                CODE_CHANGE: "CURSOR",
                RESEARCH: "OPENCLAW_AGENT",
                CONTENT: "OPENCLAW_AGENT",
                EMAIL: "OPENCLAW_AGENT",
                SOCIAL: "OPENCLAW_AGENT",
                OPS: "OPENCLAW_AGENT",
            };
            executor = routing[args.type] || "OPENCLAW_AGENT";
            return [2 /*return*/, {
                    executor: executor,
                    reason: "".concat(args.type, " tasks are routed to ").concat(executor),
                }];
        });
    }); },
});
