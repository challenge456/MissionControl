"use strict";
/**
 * Peer Review System
 *
 * Structured peer review workflows: PRAISE, REFUTE, CHANGESET, APPROVE
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
exports.remove = exports.supersede = exports.respond = exports.create = exports.getStats = exports.getPending = exports.listByAgent = exports.listByTask = void 0;
var values_1 = require("convex/values");
var server_1 = require("./_generated/server");
// ============================================================================
// QUERIES
// ============================================================================
exports.listByTask = (0, server_1.query)({
    args: { taskId: values_1.v.id("tasks") },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, ctx.db
                        .query("reviews")
                        .withIndex("by_task", function (q) { return q.eq("taskId", args.taskId); })
                        .order("desc")
                        .collect()];
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
        var reviews;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, ctx.db
                        .query("reviews")
                        .withIndex("by_reviewer", function (q) { return q.eq("reviewerAgentId", args.agentId); })
                        .order("desc")
                        .take(args.limit || 50)];
                case 1:
                    reviews = _a.sent();
                    return [2 /*return*/, reviews];
            }
        });
    }); },
});
exports.getPending = (0, server_1.query)({
    args: {
        projectId: values_1.v.optional(values_1.v.id("projects")),
        limit: values_1.v.optional(values_1.v.number()),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var query, reviews;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    query = ctx.db.query("reviews").withIndex("by_status", function (q) {
                        return q.eq("status", "PENDING");
                    });
                    return [4 /*yield*/, query.order("desc").take(args.limit || 50)];
                case 1:
                    reviews = _a.sent();
                    if (args.projectId) {
                        return [2 /*return*/, reviews.filter(function (r) { return r.projectId === args.projectId; })];
                    }
                    return [2 /*return*/, reviews];
            }
        });
    }); },
});
exports.getStats = (0, server_1.query)({
    args: {
        projectId: values_1.v.optional(values_1.v.id("projects")),
        agentId: values_1.v.optional(values_1.v.id("agents")),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var reviews, stats;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!args.agentId) return [3 /*break*/, 2];
                    return [4 /*yield*/, ctx.db
                            .query("reviews")
                            .withIndex("by_reviewer", function (q) { return q.eq("reviewerAgentId", args.agentId); })
                            .collect()];
                case 1:
                    reviews = _a.sent();
                    return [3 /*break*/, 6];
                case 2:
                    if (!args.projectId) return [3 /*break*/, 4];
                    return [4 /*yield*/, ctx.db
                            .query("reviews")
                            .withIndex("by_project", function (q) { return q.eq("projectId", args.projectId); })
                            .collect()];
                case 3:
                    reviews = _a.sent();
                    return [3 /*break*/, 6];
                case 4: return [4 /*yield*/, ctx.db.query("reviews").collect()];
                case 5:
                    reviews = _a.sent();
                    _a.label = 6;
                case 6:
                    stats = {
                        total: reviews.length,
                        byType: {
                            PRAISE: reviews.filter(function (r) { return r.type === "PRAISE"; }).length,
                            REFUTE: reviews.filter(function (r) { return r.type === "REFUTE"; }).length,
                            CHANGESET: reviews.filter(function (r) { return r.type === "CHANGESET"; }).length,
                            APPROVE: reviews.filter(function (r) { return r.type === "APPROVE"; }).length,
                        },
                        byStatus: {
                            PENDING: reviews.filter(function (r) { return r.status === "PENDING"; }).length,
                            ACCEPTED: reviews.filter(function (r) { return r.status === "ACCEPTED"; }).length,
                            REJECTED: reviews.filter(function (r) { return r.status === "REJECTED"; }).length,
                            SUPERSEDED: reviews.filter(function (r) { return r.status === "SUPERSEDED"; }).length,
                        },
                        avgScore: reviews
                            .filter(function (r) { return r.type === "PRAISE" && r.score; })
                            .reduce(function (sum, r) { return sum + (r.score || 0); }, 0) /
                            (reviews.filter(function (r) { return r.type === "PRAISE" && r.score; }).length || 1),
                    };
                    return [2 /*return*/, stats];
            }
        });
    }); },
});
// ============================================================================
// MUTATIONS
// ============================================================================
exports.create = (0, server_1.mutation)({
    args: {
        projectId: values_1.v.id("projects"),
        taskId: values_1.v.id("tasks"),
        type: values_1.v.union(values_1.v.literal("PRAISE"), values_1.v.literal("REFUTE"), values_1.v.literal("CHANGESET"), values_1.v.literal("APPROVE")),
        reviewerAgentId: values_1.v.optional(values_1.v.id("agents")),
        reviewerUserId: values_1.v.optional(values_1.v.string()),
        targetType: values_1.v.union(values_1.v.literal("TASK"), values_1.v.literal("DELIVERABLE"), values_1.v.literal("ARTIFACT"), values_1.v.literal("CODE_CHANGE")),
        targetId: values_1.v.optional(values_1.v.string()),
        summary: values_1.v.string(),
        details: values_1.v.optional(values_1.v.string()),
        score: values_1.v.optional(values_1.v.number()),
        severity: values_1.v.optional(values_1.v.union(values_1.v.literal("MINOR"), values_1.v.literal("MAJOR"), values_1.v.literal("CRITICAL"))),
        changeset: values_1.v.optional(values_1.v.object({
            files: values_1.v.array(values_1.v.object({
                path: values_1.v.string(),
                action: values_1.v.union(values_1.v.literal("ADD"), values_1.v.literal("MODIFY"), values_1.v.literal("DELETE")),
                diff: values_1.v.optional(values_1.v.string()),
            })),
            description: values_1.v.string(),
        })),
        metadata: values_1.v.optional(values_1.v.any()),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var task, reviewId;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, ctx.db.get(args.taskId)];
                case 1:
                    task = _a.sent();
                    if (!task) {
                        throw new Error("Task not found");
                    }
                    return [4 /*yield*/, ctx.db.insert("reviews", {
                            projectId: args.projectId,
                            taskId: args.taskId,
                            type: args.type,
                            status: "PENDING",
                            reviewerAgentId: args.reviewerAgentId,
                            reviewerUserId: args.reviewerUserId,
                            targetType: args.targetType,
                            targetId: args.targetId,
                            summary: args.summary,
                            details: args.details,
                            score: args.score,
                            severity: args.severity,
                            changeset: args.changeset,
                            metadata: args.metadata,
                        })];
                case 2:
                    reviewId = _a.sent();
                    // Log activity
                    return [4 /*yield*/, ctx.db.insert("activities", {
                            projectId: args.projectId,
                            action: "REVIEW_CREATED",
                            actorType: args.reviewerAgentId ? "AGENT" : "HUMAN",
                            actorId: args.reviewerAgentId || args.reviewerUserId,
                            targetType: "REVIEW",
                            targetId: reviewId,
                            description: "".concat(args.type, " review created: ").concat(args.summary),
                            metadata: { taskId: args.taskId, reviewType: args.type },
                        })];
                case 3:
                    // Log activity
                    _a.sent();
                    return [2 /*return*/, { reviewId: reviewId, success: true }];
            }
        });
    }); },
});
exports.respond = (0, server_1.mutation)({
    args: {
        reviewId: values_1.v.id("reviews"),
        responseBy: values_1.v.id("agents"),
        responseText: values_1.v.string(),
        accept: values_1.v.boolean(),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var review;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, ctx.db.get(args.reviewId)];
                case 1:
                    review = _a.sent();
                    if (!review) {
                        throw new Error("Review not found");
                    }
                    if (review.status !== "PENDING") {
                        throw new Error("Review already resolved");
                    }
                    return [4 /*yield*/, ctx.db.patch(args.reviewId, {
                            status: args.accept ? "ACCEPTED" : "REJECTED",
                            responseBy: args.responseBy,
                            responseText: args.responseText,
                            resolvedAt: Date.now(),
                        })];
                case 2:
                    _a.sent();
                    // Log activity
                    return [4 /*yield*/, ctx.db.insert("activities", {
                            projectId: review.projectId,
                            action: args.accept ? "REVIEW_ACCEPTED" : "REVIEW_REJECTED",
                            actorType: "AGENT",
                            actorId: args.responseBy,
                            targetType: "REVIEW",
                            targetId: args.reviewId,
                            description: "Review ".concat(args.accept ? "accepted" : "rejected", ": ").concat(args.responseText),
                            metadata: { taskId: review.taskId },
                        })];
                case 3:
                    // Log activity
                    _a.sent();
                    return [2 /*return*/, { success: true }];
            }
        });
    }); },
});
exports.supersede = (0, server_1.mutation)({
    args: {
        reviewId: values_1.v.id("reviews"),
        reason: values_1.v.string(),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var review;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, ctx.db.get(args.reviewId)];
                case 1:
                    review = _a.sent();
                    if (!review) {
                        throw new Error("Review not found");
                    }
                    return [4 /*yield*/, ctx.db.patch(args.reviewId, {
                            status: "SUPERSEDED",
                            resolvedAt: Date.now(),
                            metadata: __assign(__assign({}, review.metadata), { supersededReason: args.reason }),
                        })];
                case 2:
                    _a.sent();
                    // Log activity
                    return [4 /*yield*/, ctx.db.insert("activities", {
                            projectId: review.projectId,
                            action: "REVIEW_SUPERSEDED",
                            actorType: "SYSTEM",
                            targetType: "REVIEW",
                            targetId: args.reviewId,
                            description: "Review superseded: ".concat(args.reason),
                            metadata: { taskId: review.taskId },
                        })];
                case 3:
                    // Log activity
                    _a.sent();
                    return [2 /*return*/, { success: true }];
            }
        });
    }); },
});
exports.remove = (0, server_1.mutation)({
    args: { reviewId: values_1.v.id("reviews") },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var review;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, ctx.db.get(args.reviewId)];
                case 1:
                    review = _a.sent();
                    if (!review) {
                        throw new Error("Review not found");
                    }
                    return [4 /*yield*/, ctx.db.delete(args.reviewId)];
                case 2:
                    _a.sent();
                    // Log activity
                    return [4 /*yield*/, ctx.db.insert("activities", {
                            projectId: review.projectId,
                            action: "REVIEW_DELETED",
                            actorType: "SYSTEM",
                            targetType: "REVIEW",
                            targetId: args.reviewId,
                            description: "Review deleted: ".concat(review.summary),
                            metadata: { taskId: review.taskId },
                        })];
                case 3:
                    // Log activity
                    _a.sent();
                    return [2 /*return*/, { success: true }];
            }
        });
    }); },
});
