"use strict";
/**
 * Thread Subscriptions — agents subscribed to task threads.
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
exports.getSubscribedTaskIds = exports.listByTask = exports.listByAgent = exports.unsubscribe = exports.subscribe = void 0;
var values_1 = require("convex/values");
var server_1 = require("./_generated/server");
exports.subscribe = (0, server_1.mutation)({
    args: {
        agentId: values_1.v.id("agents"),
        taskId: values_1.v.id("tasks"),
        metadata: values_1.v.optional(values_1.v.any()),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var existing, now, id;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, ctx.db
                        .query("threadSubscriptions")
                        .withIndex("by_agent_task", function (q) {
                        return q.eq("agentId", args.agentId).eq("taskId", args.taskId);
                    })
                        .first()];
                case 1:
                    existing = _a.sent();
                    if (existing)
                        return [2 /*return*/, { subscriptionId: existing._id, created: false }];
                    now = Date.now();
                    return [4 /*yield*/, ctx.db.insert("threadSubscriptions", {
                            agentId: args.agentId,
                            taskId: args.taskId,
                            subscribedAt: now,
                            metadata: args.metadata,
                        })];
                case 2:
                    id = _a.sent();
                    return [2 /*return*/, { subscriptionId: id, created: true }];
            }
        });
    }); },
});
exports.unsubscribe = (0, server_1.mutation)({
    args: {
        agentId: values_1.v.id("agents"),
        taskId: values_1.v.id("tasks"),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var sub;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, ctx.db
                        .query("threadSubscriptions")
                        .withIndex("by_agent_task", function (q) {
                        return q.eq("agentId", args.agentId).eq("taskId", args.taskId);
                    })
                        .first()];
                case 1:
                    sub = _a.sent();
                    if (!sub)
                        return [2 /*return*/, { removed: false }];
                    return [4 /*yield*/, ctx.db.delete(sub._id)];
                case 2:
                    _a.sent();
                    return [2 /*return*/, { removed: true }];
            }
        });
    }); },
});
exports.listByAgent = (0, server_1.query)({
    args: { agentId: values_1.v.id("agents"), limit: values_1.v.optional(values_1.v.number()) },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var limit;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    limit = (_a = args.limit) !== null && _a !== void 0 ? _a : 50;
                    return [4 /*yield*/, ctx.db
                            .query("threadSubscriptions")
                            .withIndex("by_agent", function (q) { return q.eq("agentId", args.agentId); })
                            .order("desc")
                            .take(limit)];
                case 1: return [2 /*return*/, _b.sent()];
            }
        });
    }); },
});
exports.listByTask = (0, server_1.query)({
    args: { taskId: values_1.v.id("tasks"), limit: values_1.v.optional(values_1.v.number()) },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var limit;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    limit = (_a = args.limit) !== null && _a !== void 0 ? _a : 50;
                    return [4 /*yield*/, ctx.db
                            .query("threadSubscriptions")
                            .withIndex("by_task", function (q) { return q.eq("taskId", args.taskId); })
                            .order("desc")
                            .take(limit)];
                case 1: return [2 /*return*/, _b.sent()];
            }
        });
    }); },
});
/** Subscribed task IDs for an agent — used by heartbeat / "threads with activity". */
exports.getSubscribedTaskIds = (0, server_1.query)({
    args: { agentId: values_1.v.id("agents") },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var subs;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, ctx.db
                        .query("threadSubscriptions")
                        .withIndex("by_agent", function (q) { return q.eq("agentId", args.agentId); })
                        .collect()];
                case 1:
                    subs = _a.sent();
                    return [2 /*return*/, subs.map(function (s) { return s.taskId; })];
            }
        });
    }); },
});
