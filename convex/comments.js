"use strict";
/**
 * Comments — Task comments with @mentions
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
exports.remove = exports.edit = exports.post = exports.listByTask = void 0;
var values_1 = require("convex/values");
var server_1 = require("./_generated/server");
var agentResolver_1 = require("./lib/agentResolver");
// ============================================================================
// QUERIES
// ============================================================================
exports.listByTask = (0, server_1.query)({
    args: { taskId: values_1.v.id("tasks") },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var comments, agentIds, agents, agentMap;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, ctx.db
                        .query("messages")
                        .withIndex("by_task", function (q) { return q.eq("taskId", args.taskId); })
                        .filter(function (q) { return q.eq(q.field("type"), "COMMENT"); })
                        .order("desc")
                        .collect()];
                case 1:
                    comments = _a.sent();
                    agentIds = __spreadArray([], new Set(comments.map(function (c) { return c.authorAgentId; }).filter(Boolean)), true);
                    return [4 /*yield*/, Promise.all(agentIds.map(function (id) { return id && ctx.db.get(id); }))];
                case 2:
                    agents = _a.sent();
                    agentMap = new Map(agents.filter(function (a) { return a !== null; }).map(function (a) { return [a._id, a]; }));
                    return [2 /*return*/, comments.map(function (comment) { return (__assign(__assign({}, comment), { author: comment.authorAgentId ? agentMap.get(comment.authorAgentId) : null })); })];
            }
        });
    }); },
});
// ============================================================================
// MUTATIONS
// ============================================================================
exports.post = (0, server_1.mutation)({
    args: {
        taskId: values_1.v.id("tasks"),
        content: values_1.v.string(),
        authorType: values_1.v.union(values_1.v.literal("AGENT"), values_1.v.literal("HUMAN"), values_1.v.literal("SYSTEM")),
        authorAgentId: values_1.v.optional(values_1.v.id("agents")),
        authorUserId: values_1.v.optional(values_1.v.string()),
        mentions: values_1.v.optional(values_1.v.array(values_1.v.id("agents"))),
        idempotencyKey: values_1.v.optional(values_1.v.string()),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var existing, task, mentionRegex, mentionedNames, mentionedAgents, _loop_1, _i, mentionedNames_1, name_1, authorRef, _a, commentId, _b, mentionedAgents_1, agentId;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    if (!args.idempotencyKey) return [3 /*break*/, 2];
                    return [4 /*yield*/, ctx.db
                            .query("messages")
                            .withIndex("by_idempotency", function (q) { return q.eq("idempotencyKey", args.idempotencyKey); })
                            .first()];
                case 1:
                    existing = _c.sent();
                    if (existing) {
                        return [2 /*return*/, { commentId: existing._id, created: false }];
                    }
                    _c.label = 2;
                case 2: return [4 /*yield*/, ctx.db.get(args.taskId)];
                case 3:
                    task = _c.sent();
                    if (!task) {
                        throw new Error("Task not found");
                    }
                    mentionRegex = /@(\w+)/g;
                    mentionedNames = __spreadArray([], args.content.matchAll(mentionRegex), true).map(function (m) { return m[1]; });
                    mentionedAgents = [];
                    _loop_1 = function (name_1) {
                        var agent;
                        return __generator(this, function (_d) {
                            switch (_d.label) {
                                case 0: return [4 /*yield*/, ctx.db
                                        .query("agents")
                                        .filter(function (q) { return q.eq(q.field("name"), name_1); })
                                        .first()];
                                case 1:
                                    agent = _d.sent();
                                    if (agent) {
                                        mentionedAgents.push(agent._id);
                                    }
                                    return [2 /*return*/];
                            }
                        });
                    };
                    _i = 0, mentionedNames_1 = mentionedNames;
                    _c.label = 4;
                case 4:
                    if (!(_i < mentionedNames_1.length)) return [3 /*break*/, 7];
                    name_1 = mentionedNames_1[_i];
                    return [5 /*yield**/, _loop_1(name_1)];
                case 5:
                    _c.sent();
                    _c.label = 6;
                case 6:
                    _i++;
                    return [3 /*break*/, 4];
                case 7:
                    if (!args.authorAgentId) return [3 /*break*/, 9];
                    return [4 /*yield*/, (0, agentResolver_1.resolveAgentRef)({ db: ctx.db }, { agentId: args.authorAgentId, createIfMissing: true })];
                case 8:
                    _a = _c.sent();
                    return [3 /*break*/, 10];
                case 9:
                    _a = null;
                    _c.label = 10;
                case 10:
                    authorRef = _a;
                    return [4 /*yield*/, ctx.db.insert("messages", {
                            tenantId: task.tenantId,
                            projectId: task.projectId,
                            idempotencyKey: args.idempotencyKey || "comment-".concat(args.taskId, "-").concat(Date.now()),
                            taskId: args.taskId,
                            type: "COMMENT",
                            authorType: args.authorType,
                            authorAgentId: args.authorAgentId,
                            authorInstanceId: authorRef === null || authorRef === void 0 ? void 0 : authorRef.instanceId,
                            authorUserId: args.authorUserId,
                            content: args.content,
                        })];
                case 11:
                    commentId = _c.sent();
                    _b = 0, mentionedAgents_1 = mentionedAgents;
                    _c.label = 12;
                case 12:
                    if (!(_b < mentionedAgents_1.length)) return [3 /*break*/, 15];
                    agentId = mentionedAgents_1[_b];
                    return [4 /*yield*/, ctx.db.insert("notifications", {
                            projectId: task.projectId,
                            agentId: agentId,
                            type: "MENTION",
                            title: "You were mentioned",
                            body: "".concat(args.authorAgentId ? "Agent" : "User", " mentioned you in task: ").concat(task.title),
                            taskId: args.taskId,
                            messageId: commentId,
                        })];
                case 13:
                    _c.sent();
                    _c.label = 14;
                case 14:
                    _b++;
                    return [3 /*break*/, 12];
                case 15: 
                // Create activity
                return [4 /*yield*/, ctx.db.insert("activities", {
                        projectId: task.projectId,
                        actorType: args.authorType,
                        actorId: args.authorUserId || args.authorAgentId,
                        action: "COMMENT_POSTED",
                        description: "Posted comment on task: ".concat(task.title),
                        taskId: args.taskId,
                        agentId: args.authorAgentId,
                        metadata: {
                            commentId: commentId,
                            mentions: mentionedAgents.length,
                        },
                    })];
                case 16:
                    // Create activity
                    _c.sent();
                    return [2 /*return*/, { commentId: commentId, created: true }];
            }
        });
    }); },
});
exports.edit = (0, server_1.mutation)({
    args: {
        commentId: values_1.v.id("messages"),
        content: values_1.v.string(),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var comment;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, ctx.db.get(args.commentId)];
                case 1:
                    comment = _a.sent();
                    if (!comment) {
                        throw new Error("Comment not found");
                    }
                    if (comment.type !== "COMMENT") {
                        throw new Error("Not a comment");
                    }
                    return [4 /*yield*/, ctx.db.patch(args.commentId, {
                            content: args.content,
                        })];
                case 2:
                    _a.sent();
                    return [2 /*return*/, { success: true }];
            }
        });
    }); },
});
exports.remove = (0, server_1.mutation)({
    args: {
        commentId: values_1.v.id("messages"),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var comment;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, ctx.db.get(args.commentId)];
                case 1:
                    comment = _a.sent();
                    if (!comment) {
                        throw new Error("Comment not found");
                    }
                    if (comment.type !== "COMMENT") {
                        throw new Error("Not a comment");
                    }
                    return [4 /*yield*/, ctx.db.delete(args.commentId)];
                case 2:
                    _a.sent();
                    return [2 /*return*/, { success: true }];
            }
        });
    }); },
});
