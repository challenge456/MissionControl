"use strict";
/**
 * Executor Router — Automated Multi-Executor Routing
 *
 * Automatically routes execution requests to appropriate executors
 * and handles callbacks.
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
exports.claimExecution = exports.getQueueForExecutor = exports.onExecutionComplete = exports.onExecutionStart = exports.autoRoute = void 0;
var values_1 = require("convex/values");
var server_1 = require("./_generated/server");
// ============================================================================
// ROUTING RULES
// ============================================================================
var ROUTING_RULES = {
    CODE_CHANGE: "CURSOR",
    RESEARCH: "OPENCLAW_AGENT",
    CONTENT: "OPENCLAW_AGENT",
    EMAIL: "OPENCLAW_AGENT",
    SOCIAL: "OPENCLAW_AGENT",
    OPS: "OPENCLAW_AGENT",
};
// ============================================================================
// AUTO-ROUTE EXECUTION REQUESTS
// ============================================================================
/**
 * Automatically route pending execution requests.
 * Called by cron every 5 minutes.
 */
exports.autoRoute = (0, server_1.internalMutation)({
    args: {},
    handler: function (ctx) { return __awaiter(void 0, void 0, void 0, function () {
        var requests, routed, _i, requests_1, request, executor;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, ctx.db
                        .query("executionRequests")
                        .withIndex("by_status", function (q) { return q.eq("status", "PENDING"); })
                        .collect()];
                case 1:
                    requests = _a.sent();
                    routed = 0;
                    _i = 0, requests_1 = requests;
                    _a.label = 2;
                case 2:
                    if (!(_i < requests_1.length)) return [3 /*break*/, 8];
                    request = requests_1[_i];
                    executor = ROUTING_RULES[request.type] || "OPENCLAW_AGENT";
                    // Update status to ASSIGNED
                    return [4 /*yield*/, ctx.db.patch(request._id, {
                            status: "ASSIGNED",
                            assignedTo: executor,
                            assignedAt: Date.now(),
                        })];
                case 3:
                    // Update status to ASSIGNED
                    _a.sent();
                    // Log activity
                    return [4 /*yield*/, ctx.db.insert("activities", {
                            projectId: request.projectId,
                            actorType: "SYSTEM",
                            action: "EXECUTION_ROUTED",
                            description: "Routed ".concat(request.type, " to ").concat(executor),
                            targetType: "EXECUTION_REQUEST",
                            targetId: request._id,
                            taskId: request.taskId,
                        })];
                case 4:
                    // Log activity
                    _a.sent();
                    if (!(executor === "OPENCLAW_AGENT")) return [3 /*break*/, 6];
                    // Notify agent via Mission Control
                    return [4 /*yield*/, ctx.db.insert("notifications", {
                            agentId: request.requestedBy,
                            type: "SYSTEM",
                            title: "Execution request assigned",
                            body: "Your ".concat(request.type, " request has been assigned. Check execution queue."),
                            metadata: { requestId: request._id, notificationType: "EXECUTION_ASSIGNED" },
                        })];
                case 5:
                    // Notify agent via Mission Control
                    _a.sent();
                    _a.label = 6;
                case 6:
                    routed++;
                    _a.label = 7;
                case 7:
                    _i++;
                    return [3 /*break*/, 2];
                case 8: return [2 /*return*/, { routed: routed }];
            }
        });
    }); },
});
// ============================================================================
// EXECUTOR CALLBACKS
// ============================================================================
/**
 * Callback from executor when execution starts.
 */
exports.onExecutionStart = (0, server_1.mutation)({
    args: {
        requestId: values_1.v.id("executionRequests"),
        executorId: values_1.v.string(),
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
                    return [4 /*yield*/, ctx.db.patch(args.requestId, {
                            status: "IN_PROGRESS",
                            metadata: __assign(__assign({}, request.metadata), { startedAt: Date.now(), executorId: args.executorId }),
                        })];
                case 2:
                    _a.sent();
                    return [2 /*return*/, { success: true }];
            }
        });
    }); },
});
/**
 * Callback from executor when execution completes.
 */
exports.onExecutionComplete = (0, server_1.mutation)({
    args: {
        requestId: values_1.v.id("executionRequests"),
        executorId: values_1.v.string(),
        result: values_1.v.any(),
        success: values_1.v.boolean(),
        error: values_1.v.optional(values_1.v.string()),
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
                    return [4 /*yield*/, ctx.db.patch(args.requestId, {
                            status: args.success ? "COMPLETED" : "FAILED",
                            result: args.result,
                            completedAt: Date.now(),
                            metadata: __assign(__assign({}, request.metadata), { error: args.error, completedBy: args.executorId }),
                        })];
                case 2:
                    _a.sent();
                    // Log activity
                    return [4 /*yield*/, ctx.db.insert("activities", {
                            projectId: request.projectId,
                            actorType: "SYSTEM",
                            action: args.success ? "EXECUTION_COMPLETED" : "EXECUTION_FAILED",
                            description: "".concat(request.type, " execution ").concat(args.success ? "completed" : "failed"),
                            targetType: "EXECUTION_REQUEST",
                            targetId: args.requestId,
                            taskId: request.taskId,
                            metadata: { result: args.result, error: args.error },
                        })];
                case 3:
                    // Log activity
                    _a.sent();
                    // Notify requestor
                    return [4 /*yield*/, ctx.db.insert("notifications", {
                            agentId: request.requestedBy,
                            type: "SYSTEM",
                            title: "Execution ".concat(args.success ? "completed" : "failed"),
                            body: args.success
                                ? "Your ".concat(request.type, " request completed successfully")
                                : "Your ".concat(request.type, " request failed: ").concat(args.error),
                            metadata: {
                                requestId: request._id,
                                result: args.result,
                                notificationType: args.success ? "EXECUTION_COMPLETED" : "EXECUTION_FAILED",
                            },
                        })];
                case 4:
                    // Notify requestor
                    _a.sent();
                    return [2 /*return*/, { success: true }];
            }
        });
    }); },
});
// ============================================================================
// EXECUTOR QUEUE QUERIES
// ============================================================================
/**
 * Get pending execution requests for a specific executor.
 */
exports.getQueueForExecutor = (0, server_1.query)({
    args: {
        executor: values_1.v.union(values_1.v.literal("CURSOR"), values_1.v.literal("CLAUDE_CODE"), values_1.v.literal("OPENCLAW_AGENT")),
        limit: values_1.v.optional(values_1.v.number()),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var requests;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, ctx.db
                        .query("executionRequests")
                        .withIndex("by_executor", function (q) { return q.eq("executor", args.executor); })
                        .filter(function (q) {
                        return q.or(q.eq(q.field("status"), "ASSIGNED"), q.eq(q.field("status"), "IN_PROGRESS"));
                    })
                        .order("desc")
                        .take((_a = args.limit) !== null && _a !== void 0 ? _a : 50)];
                case 1:
                    requests = _b.sent();
                    return [2 /*return*/, requests];
            }
        });
    }); },
});
/**
 * Claim an execution request (for executor polling).
 */
exports.claimExecution = (0, server_1.mutation)({
    args: {
        requestId: values_1.v.id("executionRequests"),
        executorId: values_1.v.string(),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var request;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, ctx.db.get(args.requestId)];
                case 1:
                    request = _b.sent();
                    if (!request) {
                        return [2 /*return*/, { success: false, error: "Request not found" }];
                    }
                    if (request.status !== "ASSIGNED") {
                        return [2 /*return*/, { success: false, error: "Request is ".concat(request.status, ", cannot claim") }];
                    }
                    return [4 /*yield*/, ctx.db.patch(args.requestId, {
                            status: "IN_PROGRESS",
                            assignedTo: args.executorId,
                            metadata: __assign(__assign({}, request.metadata), { claimedAt: Date.now(), claimedBy: args.executorId }),
                        })];
                case 2:
                    _b.sent();
                    _a = { success: true };
                    return [4 /*yield*/, ctx.db.get(args.requestId)];
                case 3: return [2 /*return*/, (_a.request = _b.sent(), _a)];
            }
        });
    }); },
});
