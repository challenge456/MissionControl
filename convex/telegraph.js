"use strict";
/**
 * Telegraph Communications Functions
 *
 * Async messaging system for agent-org communications.
 * Supports internal (Convex-native) and external (Telegram) channels.
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
exports.markRead = exports.sendMessage = exports.linkToEntity = exports.createThread = exports.getThreadsByTask = exports.getThread = exports.listThreads = void 0;
var values_1 = require("convex/values");
var server_1 = require("./_generated/server");
var channelValidator = values_1.v.union(values_1.v.literal("INTERNAL"), values_1.v.literal("TELEGRAM"));
var senderTypeValidator = values_1.v.union(values_1.v.literal("AGENT"), values_1.v.literal("HUMAN"), values_1.v.literal("SYSTEM"));
var messageStatusValidator = values_1.v.union(values_1.v.literal("DRAFT"), values_1.v.literal("SENT"), values_1.v.literal("DELIVERED"), values_1.v.literal("READ"), values_1.v.literal("FAILED"));
// ============================================================================
// THREAD QUERIES
// ============================================================================
/**
 * List threads for a project, ordered by last activity.
 */
exports.listThreads = (0, server_1.query)({
    args: {
        projectId: values_1.v.optional(values_1.v.id("projects")),
        channel: values_1.v.optional(channelValidator),
        limit: values_1.v.optional(values_1.v.number()),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var limit, threads;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    limit = (_a = args.limit) !== null && _a !== void 0 ? _a : 50;
                    if (!args.projectId) return [3 /*break*/, 2];
                    return [4 /*yield*/, ctx.db
                            .query("telegraphThreads")
                            .withIndex("by_project", function (q) { return q.eq("projectId", args.projectId); })
                            .order("desc")
                            .take(limit)];
                case 1:
                    threads = _b.sent();
                    return [3 /*break*/, 4];
                case 2: return [4 /*yield*/, ctx.db
                        .query("telegraphThreads")
                        .order("desc")
                        .take(limit)];
                case 3:
                    threads = _b.sent();
                    _b.label = 4;
                case 4:
                    if (args.channel) {
                        threads = threads.filter(function (t) { return t.channel === args.channel; });
                    }
                    return [2 /*return*/, threads];
            }
        });
    }); },
});
/**
 * Get a thread with its messages.
 */
exports.getThread = (0, server_1.query)({
    args: {
        threadId: values_1.v.id("telegraphThreads"),
        messageLimit: values_1.v.optional(values_1.v.number()),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var thread, messages;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, ctx.db.get(args.threadId)];
                case 1:
                    thread = _b.sent();
                    if (!thread)
                        return [2 /*return*/, null];
                    return [4 /*yield*/, ctx.db
                            .query("telegraphMessages")
                            .withIndex("by_thread", function (q) { return q.eq("threadId", args.threadId); })
                            .order("asc")
                            .take((_a = args.messageLimit) !== null && _a !== void 0 ? _a : 100)];
                case 2:
                    messages = _b.sent();
                    return [2 /*return*/, __assign(__assign({}, thread), { messages: messages })];
            }
        });
    }); },
});
/**
 * Get threads linked to a specific task.
 */
exports.getThreadsByTask = (0, server_1.query)({
    args: {
        taskId: values_1.v.id("tasks"),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, ctx.db
                        .query("telegraphThreads")
                        .withIndex("by_linked_task", function (q) { return q.eq("linkedTaskId", args.taskId); })
                        .collect()];
                case 1: return [2 /*return*/, _a.sent()];
            }
        });
    }); },
});
// ============================================================================
// THREAD MUTATIONS
// ============================================================================
/**
 * Create a new telegraph thread.
 */
exports.createThread = (0, server_1.mutation)({
    args: {
        projectId: values_1.v.optional(values_1.v.id("projects")),
        title: values_1.v.string(),
        participants: values_1.v.array(values_1.v.string()),
        channel: channelValidator,
        externalThreadRef: values_1.v.optional(values_1.v.string()),
        linkedTaskId: values_1.v.optional(values_1.v.id("tasks")),
        linkedApprovalId: values_1.v.optional(values_1.v.id("approvals")),
        linkedIncidentId: values_1.v.optional(values_1.v.string()),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, ctx.db.insert("telegraphThreads", {
                        projectId: args.projectId,
                        title: args.title,
                        participants: args.participants,
                        channel: args.channel,
                        externalThreadRef: args.externalThreadRef,
                        linkedTaskId: args.linkedTaskId,
                        linkedApprovalId: args.linkedApprovalId,
                        linkedIncidentId: args.linkedIncidentId,
                        lastMessageAt: undefined,
                        messageCount: 0,
                    })];
                case 1: return [2 /*return*/, _a.sent()];
            }
        });
    }); },
});
/**
 * Link a thread to a task, approval, or incident.
 */
exports.linkToEntity = (0, server_1.mutation)({
    args: {
        threadId: values_1.v.id("telegraphThreads"),
        linkedTaskId: values_1.v.optional(values_1.v.id("tasks")),
        linkedApprovalId: values_1.v.optional(values_1.v.id("approvals")),
        linkedIncidentId: values_1.v.optional(values_1.v.string()),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var thread, updates;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, ctx.db.get(args.threadId)];
                case 1:
                    thread = _a.sent();
                    if (!thread)
                        throw new Error("Thread not found");
                    updates = {};
                    if (args.linkedTaskId !== undefined)
                        updates.linkedTaskId = args.linkedTaskId;
                    if (args.linkedApprovalId !== undefined)
                        updates.linkedApprovalId = args.linkedApprovalId;
                    if (args.linkedIncidentId !== undefined)
                        updates.linkedIncidentId = args.linkedIncidentId;
                    return [4 /*yield*/, ctx.db.patch(args.threadId, updates)];
                case 2:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); },
});
// ============================================================================
// MESSAGE MUTATIONS
// ============================================================================
/**
 * Send a message to a thread.
 * Enforces "final replies only" safety rule for TELEGRAM channel.
 */
exports.sendMessage = (0, server_1.mutation)({
    args: {
        threadId: values_1.v.id("telegraphThreads"),
        senderId: values_1.v.string(),
        senderType: senderTypeValidator,
        content: values_1.v.string(),
        channel: channelValidator,
        replyToId: values_1.v.optional(values_1.v.id("telegraphMessages")),
        externalRef: values_1.v.optional(values_1.v.string()),
        projectId: values_1.v.optional(values_1.v.id("projects")),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var messageId, thread;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    // SAFETY: Reject streaming/partial content for external channels
                    if (args.channel === "TELEGRAM") {
                        if (!args.content || args.content.trim().length === 0) {
                            throw new Error("SAFETY: Cannot send empty message to external channel");
                        }
                        if (args.content.includes("[STREAMING]") || args.content.includes("[PARTIAL]")) {
                            throw new Error("SAFETY: Cannot send streaming/partial content to Telegram. Final replies only.");
                        }
                    }
                    return [4 /*yield*/, ctx.db.insert("telegraphMessages", {
                            projectId: args.projectId,
                            threadId: args.threadId,
                            senderId: args.senderId,
                            senderType: args.senderType,
                            content: args.content,
                            replyToId: args.replyToId,
                            channel: args.channel,
                            externalRef: args.externalRef,
                            status: "SENT",
                        })];
                case 1:
                    messageId = _a.sent();
                    return [4 /*yield*/, ctx.db.get(args.threadId)];
                case 2:
                    thread = _a.sent();
                    if (!thread) return [3 /*break*/, 5];
                    return [4 /*yield*/, ctx.db.patch(args.threadId, {
                            lastMessageAt: Date.now(),
                            messageCount: thread.messageCount + 1,
                        })];
                case 3:
                    _a.sent();
                    if (!!thread.participants.includes(args.senderId)) return [3 /*break*/, 5];
                    return [4 /*yield*/, ctx.db.patch(args.threadId, {
                            participants: __spreadArray(__spreadArray([], thread.participants, true), [args.senderId], false),
                        })];
                case 4:
                    _a.sent();
                    _a.label = 5;
                case 5: return [2 /*return*/, messageId];
            }
        });
    }); },
});
/**
 * Mark a message as read.
 */
exports.markRead = (0, server_1.mutation)({
    args: {
        messageId: values_1.v.id("telegraphMessages"),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, ctx.db.patch(args.messageId, { status: "READ" })];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); },
});
