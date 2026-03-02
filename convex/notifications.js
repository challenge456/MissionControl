"use strict";
/**
 * Notifications — @mentions, task assignments, approval events.
 * Delivered to agents via heartbeat (pendingNotifications).
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
exports.listRecent = exports.listPendingForAgent = exports.markAllReadForAgent = exports.markRead = exports.listByAgent = exports.createForAgents = exports.create = void 0;
var values_1 = require("convex/values");
var server_1 = require("./_generated/server");
exports.create = (0, server_1.mutation)({
    args: {
        agentId: values_1.v.id("agents"),
        type: values_1.v.union(values_1.v.literal("MENTION"), values_1.v.literal("TASK_ASSIGNED"), values_1.v.literal("TASK_TRANSITION"), values_1.v.literal("APPROVAL_REQUESTED"), values_1.v.literal("APPROVAL_DECIDED"), values_1.v.literal("SYSTEM")),
        title: values_1.v.string(),
        body: values_1.v.optional(values_1.v.string()),
        taskId: values_1.v.optional(values_1.v.id("tasks")),
        messageId: values_1.v.optional(values_1.v.id("messages")),
        approvalId: values_1.v.optional(values_1.v.id("approvals")),
        fromAgentId: values_1.v.optional(values_1.v.id("agents")),
        fromUserId: values_1.v.optional(values_1.v.string()),
        metadata: values_1.v.optional(values_1.v.any()),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var id;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, ctx.db.insert("notifications", {
                        agentId: args.agentId,
                        type: args.type,
                        title: args.title,
                        body: args.body,
                        taskId: args.taskId,
                        messageId: args.messageId,
                        approvalId: args.approvalId,
                        fromAgentId: args.fromAgentId,
                        fromUserId: args.fromUserId,
                        metadata: args.metadata,
                    })];
                case 1:
                    id = _a.sent();
                    return [2 /*return*/, id];
            }
        });
    }); },
});
/** Create notifications for multiple agents (e.g. assignees or @mentions). */
exports.createForAgents = (0, server_1.mutation)({
    args: {
        agentIds: values_1.v.array(values_1.v.id("agents")),
        type: values_1.v.union(values_1.v.literal("MENTION"), values_1.v.literal("TASK_ASSIGNED"), values_1.v.literal("TASK_TRANSITION"), values_1.v.literal("APPROVAL_REQUESTED"), values_1.v.literal("APPROVAL_DECIDED"), values_1.v.literal("SYSTEM")),
        title: values_1.v.string(),
        body: values_1.v.optional(values_1.v.string()),
        taskId: values_1.v.optional(values_1.v.id("tasks")),
        messageId: values_1.v.optional(values_1.v.id("messages")),
        approvalId: values_1.v.optional(values_1.v.id("approvals")),
        fromAgentId: values_1.v.optional(values_1.v.id("agents")),
        fromUserId: values_1.v.optional(values_1.v.string()),
        metadata: values_1.v.optional(values_1.v.any()),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var ids, _i, _a, agentId, id;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    ids = [];
                    _i = 0, _a = args.agentIds;
                    _b.label = 1;
                case 1:
                    if (!(_i < _a.length)) return [3 /*break*/, 4];
                    agentId = _a[_i];
                    return [4 /*yield*/, ctx.db.insert("notifications", {
                            agentId: agentId,
                            type: args.type,
                            title: args.title,
                            body: args.body,
                            taskId: args.taskId,
                            messageId: args.messageId,
                            approvalId: args.approvalId,
                            fromAgentId: args.fromAgentId,
                            fromUserId: args.fromUserId,
                            metadata: args.metadata,
                        })];
                case 2:
                    id = _b.sent();
                    ids.push(id);
                    _b.label = 3;
                case 3:
                    _i++;
                    return [3 /*break*/, 1];
                case 4: return [2 /*return*/, ids];
            }
        });
    }); },
});
exports.listByAgent = (0, server_1.query)({
    args: {
        agentId: values_1.v.id("agents"),
        unreadOnly: values_1.v.optional(values_1.v.boolean()),
        limit: values_1.v.optional(values_1.v.number()),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var limit, list, filtered;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    limit = (_a = args.limit) !== null && _a !== void 0 ? _a : 50;
                    return [4 /*yield*/, ctx.db
                            .query("notifications")
                            .withIndex("by_agent", function (q) { return q.eq("agentId", args.agentId); })
                            .order("desc")
                            .take(limit * 2)];
                case 1:
                    list = _b.sent();
                    filtered = args.unreadOnly ? list.filter(function (n) { return n.readAt === undefined; }) : list;
                    return [2 /*return*/, filtered.slice(0, limit)];
            }
        });
    }); },
});
exports.markRead = (0, server_1.mutation)({
    args: {
        notificationId: values_1.v.id("notifications"),
        agentId: values_1.v.id("agents"),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var n;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, ctx.db.get(args.notificationId)];
                case 1:
                    n = _a.sent();
                    if (!n || n.agentId !== args.agentId)
                        return [2 /*return*/, { success: false }];
                    return [4 /*yield*/, ctx.db.patch(args.notificationId, { readAt: Date.now() })];
                case 2:
                    _a.sent();
                    return [2 /*return*/, { success: true }];
            }
        });
    }); },
});
exports.markAllReadForAgent = (0, server_1.mutation)({
    args: { agentId: values_1.v.id("agents") },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var list, unread, now, _i, unread_1, n;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, ctx.db
                        .query("notifications")
                        .withIndex("by_agent", function (q) { return q.eq("agentId", args.agentId); })
                        .collect()];
                case 1:
                    list = _a.sent();
                    unread = list.filter(function (n) { return n.readAt === undefined; });
                    now = Date.now();
                    _i = 0, unread_1 = unread;
                    _a.label = 2;
                case 2:
                    if (!(_i < unread_1.length)) return [3 /*break*/, 5];
                    n = unread_1[_i];
                    return [4 /*yield*/, ctx.db.patch(n._id, { readAt: now })];
                case 3:
                    _a.sent();
                    _a.label = 4;
                case 4:
                    _i++;
                    return [3 /*break*/, 2];
                case 5: return [2 /*return*/, { marked: unread.length }];
            }
        });
    }); },
});
/** Pending (unread) notifications for an agent — used by heartbeat. */
exports.listPendingForAgent = (0, server_1.query)({
    args: { agentId: values_1.v.id("agents"), limit: values_1.v.optional(values_1.v.number()) },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var limit, list;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    limit = (_a = args.limit) !== null && _a !== void 0 ? _a : 30;
                    return [4 /*yield*/, ctx.db
                            .query("notifications")
                            .withIndex("by_agent", function (q) { return q.eq("agentId", args.agentId); })
                            .order("desc")
                            .take(limit * 2)];
                case 1:
                    list = _b.sent();
                    return [2 /*return*/, list.filter(function (n) { return n.readAt === undefined; }).slice(0, limit)];
            }
        });
    }); },
});
/** Recent notifications across all agents (admin/operator view). */
exports.listRecent = (0, server_1.query)({
    args: { limit: values_1.v.optional(values_1.v.number()) },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var limit;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    limit = (_a = args.limit) !== null && _a !== void 0 ? _a : 50;
                    return [4 /*yield*/, ctx.db.query("notifications").order("desc").take(limit)];
                case 1: return [2 /*return*/, _b.sent()];
            }
        });
    }); },
});
