"use strict";
/**
 * Messages — Convex Functions
 *
 * Task thread messages with types and artifacts.
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
exports.postReview = exports.postProgress = exports.postWorkPlan = exports.post = exports.listRecent = exports.get = exports.listByTask = void 0;
var values_1 = require("convex/values");
var server_1 = require("./_generated/server");
var sanitize_1 = require("./lib/sanitize");
var agentResolver_1 = require("./lib/agentResolver");
var armAudit_1 = require("./lib/armAudit");
// ============================================================================
// QUERIES
// ============================================================================
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
                        .query("messages")
                        .withIndex("by_task", function (q) { return q.eq("taskId", args.taskId); })
                        .order("asc")
                        .take((_a = args.limit) !== null && _a !== void 0 ? _a : 100)];
                case 1: return [2 /*return*/, _b.sent()];
            }
        });
    }); },
});
exports.get = (0, server_1.query)({
    args: { messageId: values_1.v.id("messages") },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, ctx.db.get(args.messageId)];
                case 1: return [2 /*return*/, _a.sent()];
            }
        });
    }); },
});
/** Recent messages across all tasks (for Live Feed). */
exports.listRecent = (0, server_1.query)({
    args: {
        projectId: values_1.v.optional(values_1.v.id("projects")),
        limit: values_1.v.optional(values_1.v.number()),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    if (!args.projectId) return [3 /*break*/, 2];
                    return [4 /*yield*/, ctx.db
                            .query("messages")
                            .withIndex("by_project", function (q) { return q.eq("projectId", args.projectId); })
                            .order("desc")
                            .take((_a = args.limit) !== null && _a !== void 0 ? _a : 50)];
                case 1: return [2 /*return*/, _c.sent()];
                case 2: return [4 /*yield*/, ctx.db
                        .query("messages")
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
// Internal function for posting messages (shared by multiple mutations)
function postMessageInternal(ctx, args) {
    return __awaiter(this, void 0, void 0, function () {
        var existing, task, content, authorRef, _a, messageId, authorName, _loop_1, _i, _b, mention, message;
        var _c, _d, _e, _f;
        return __generator(this, function (_g) {
            switch (_g.label) {
                case 0:
                    if (!args.idempotencyKey) return [3 /*break*/, 2];
                    return [4 /*yield*/, ctx.db
                            .query("messages")
                            .withIndex("by_idempotency", function (q) { return q.eq("idempotencyKey", args.idempotencyKey); })
                            .first()];
                case 1:
                    existing = _g.sent();
                    if (existing) {
                        return [2 /*return*/, { message: existing, created: false }];
                    }
                    _g.label = 2;
                case 2: return [4 /*yield*/, ctx.db.get(args.taskId)];
                case 3:
                    task = _g.sent();
                    if (!task) {
                        throw new Error("Task not found");
                    }
                    content = (0, sanitize_1.sanitizeMessageContent)(args.content);
                    if (!args.authorAgentId) return [3 /*break*/, 5];
                    return [4 /*yield*/, (0, agentResolver_1.resolveAgentRef)({ db: ctx.db }, { agentId: args.authorAgentId, createIfMissing: true })];
                case 4:
                    _a = _g.sent();
                    return [3 /*break*/, 6];
                case 5:
                    _a = null;
                    _g.label = 6;
                case 6:
                    authorRef = _a;
                    return [4 /*yield*/, ctx.db.insert("messages", {
                            tenantId: task.tenantId,
                            projectId: task.projectId,
                            taskId: args.taskId,
                            authorType: args.authorType,
                            authorAgentId: args.authorAgentId,
                            authorInstanceId: authorRef === null || authorRef === void 0 ? void 0 : authorRef.instanceId,
                            authorUserId: args.authorUserId,
                            type: args.type,
                            content: content,
                            artifacts: args.artifacts,
                            mentions: args.mentions,
                            replyToId: args.replyToId,
                            redactedFields: args.redactedFields,
                            idempotencyKey: args.idempotencyKey,
                            metadata: args.metadata,
                        })];
                case 7:
                    messageId = _g.sent();
                    authorName = (_e = (_c = args.authorUserId) !== null && _c !== void 0 ? _c : (_d = args.authorAgentId) === null || _d === void 0 ? void 0 : _d.toString()) !== null && _e !== void 0 ? _e : "Unknown";
                    return [4 /*yield*/, ctx.db.insert("activities", {
                            projectId: task.projectId,
                            actorType: args.authorType,
                            actorId: authorName,
                            action: "MESSAGE_POSTED",
                            description: "".concat(args.type, " message posted on task \"").concat(task.title, "\""),
                            targetType: "MESSAGE",
                            targetId: messageId,
                            taskId: args.taskId,
                            agentId: args.authorAgentId,
                        })];
                case 8:
                    _g.sent();
                    _loop_1 = function (mention) {
                        var name_1, agent;
                        return __generator(this, function (_h) {
                            switch (_h.label) {
                                case 0:
                                    name_1 = String(mention).replace(/^@/, "").trim();
                                    if (!name_1)
                                        return [2 /*return*/, "continue"];
                                    return [4 /*yield*/, ctx.db
                                            .query("agents")
                                            .withIndex("by_name", function (q) { return q.eq("name", name_1); })
                                            .first()];
                                case 1:
                                    agent = _h.sent();
                                    if (!(agent && agent._id !== args.authorAgentId)) return [3 /*break*/, 3];
                                    return [4 /*yield*/, ctx.db.insert("notifications", {
                                            projectId: task.projectId,
                                            agentId: agent._id,
                                            type: "MENTION",
                                            title: "@".concat(name_1, " mentioned you"),
                                            body: args.content.slice(0, 200),
                                            taskId: args.taskId,
                                            messageId: messageId,
                                            fromAgentId: args.authorAgentId,
                                            fromUserId: args.authorUserId,
                                        })];
                                case 2:
                                    _h.sent();
                                    _h.label = 3;
                                case 3: return [2 /*return*/];
                            }
                        });
                    };
                    _i = 0, _b = (_f = args.mentions) !== null && _f !== void 0 ? _f : [];
                    _g.label = 9;
                case 9:
                    if (!(_i < _b.length)) return [3 /*break*/, 12];
                    mention = _b[_i];
                    return [5 /*yield**/, _loop_1(mention)];
                case 10:
                    _g.sent();
                    _g.label = 11;
                case 11:
                    _i++;
                    return [3 /*break*/, 9];
                case 12: return [4 /*yield*/, ctx.db.get(messageId)];
                case 13:
                    message = _g.sent();
                    if (!message) return [3 /*break*/, 15];
                    return [4 /*yield*/, (0, armAudit_1.appendOpEvent)(ctx.db, {
                            tenantId: message.tenantId,
                            projectId: message.projectId,
                            instanceId: message.authorInstanceId,
                            taskId: message.taskId,
                            type: "MESSAGE_SENT",
                            payload: {
                                messageId: messageId,
                                messageType: message.type,
                            },
                        })];
                case 14:
                    _g.sent();
                    _g.label = 15;
                case 15: return [2 /*return*/, { message: message, created: true }];
            }
        });
    });
}
exports.post = (0, server_1.mutation)({
    args: {
        taskId: values_1.v.id("tasks"),
        authorType: values_1.v.string(),
        authorAgentId: values_1.v.optional(values_1.v.id("agents")),
        authorUserId: values_1.v.optional(values_1.v.string()),
        type: values_1.v.string(),
        content: values_1.v.string(),
        artifacts: values_1.v.optional(values_1.v.array(values_1.v.object({
            name: values_1.v.string(),
            type: values_1.v.string(),
            url: values_1.v.optional(values_1.v.string()),
            content: values_1.v.optional(values_1.v.string()),
        }))),
        mentions: values_1.v.optional(values_1.v.array(values_1.v.string())),
        replyToId: values_1.v.optional(values_1.v.id("messages")),
        redactedFields: values_1.v.optional(values_1.v.array(values_1.v.string())),
        idempotencyKey: values_1.v.optional(values_1.v.string()),
        metadata: values_1.v.optional(values_1.v.any()),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, postMessageInternal(ctx, args)];
                case 1: return [2 /*return*/, _a.sent()];
            }
        });
    }); },
});
exports.postWorkPlan = (0, server_1.mutation)({
    args: {
        taskId: values_1.v.id("tasks"),
        agentId: values_1.v.id("agents"),
        bullets: values_1.v.array(values_1.v.string()),
        estimatedCost: values_1.v.optional(values_1.v.number()),
        estimatedDuration: values_1.v.optional(values_1.v.string()),
        idempotencyKey: values_1.v.optional(values_1.v.string()),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var content;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    content = __spreadArray([
                        "## Work Plan",
                        ""
                    ], args.bullets.map(function (b, i) { return "".concat(i + 1, ". ").concat(b); }), true);
                    if (args.estimatedCost) {
                        content.push("", "**Estimated Cost:** $".concat(args.estimatedCost.toFixed(2)));
                    }
                    if (args.estimatedDuration) {
                        content.push("**Estimated Duration:** ".concat(args.estimatedDuration));
                    }
                    return [4 /*yield*/, postMessageInternal(ctx, {
                            taskId: args.taskId,
                            authorType: "AGENT",
                            authorAgentId: args.agentId,
                            type: "WORK_PLAN",
                            content: content.join("\n"),
                            idempotencyKey: args.idempotencyKey,
                        })];
                case 1: return [2 /*return*/, _a.sent()];
            }
        });
    }); },
});
exports.postProgress = (0, server_1.mutation)({
    args: {
        taskId: values_1.v.id("tasks"),
        agentId: values_1.v.id("agents"),
        content: values_1.v.string(),
        percentComplete: values_1.v.optional(values_1.v.number()),
        artifacts: values_1.v.optional(values_1.v.array(values_1.v.object({
            name: values_1.v.string(),
            type: values_1.v.string(),
            url: values_1.v.optional(values_1.v.string()),
            content: values_1.v.optional(values_1.v.string()),
        }))),
        idempotencyKey: values_1.v.optional(values_1.v.string()),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var content;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    content = args.content;
                    if (args.percentComplete !== undefined) {
                        content = "**Progress: ".concat(args.percentComplete, "%**\n\n").concat(content);
                    }
                    return [4 /*yield*/, postMessageInternal(ctx, {
                            taskId: args.taskId,
                            authorType: "AGENT",
                            authorAgentId: args.agentId,
                            type: "PROGRESS",
                            content: content,
                            artifacts: args.artifacts,
                            idempotencyKey: args.idempotencyKey,
                        })];
                case 1: return [2 /*return*/, _a.sent()];
            }
        });
    }); },
});
exports.postReview = (0, server_1.mutation)({
    args: {
        taskId: values_1.v.id("tasks"),
        authorType: values_1.v.string(),
        authorAgentId: values_1.v.optional(values_1.v.id("agents")),
        authorUserId: values_1.v.optional(values_1.v.string()),
        reviewType: values_1.v.union(values_1.v.literal("PRAISE"), values_1.v.literal("REFUTE"), values_1.v.literal("CHANGESET"), values_1.v.literal("APPROVE"), values_1.v.literal("REQUEST_CHANGES"), // Legacy support
        values_1.v.literal("REJECT") // Legacy support
        ),
        comments: values_1.v.string(),
        changeset: values_1.v.optional(values_1.v.array(values_1.v.object({
            file: values_1.v.string(),
            change: values_1.v.string(),
            lineNumber: values_1.v.optional(values_1.v.number()),
        }))),
        checklist: values_1.v.optional(values_1.v.array(values_1.v.object({
            label: values_1.v.string(),
            checked: values_1.v.boolean(),
            note: values_1.v.optional(values_1.v.string()),
        }))),
        idempotencyKey: values_1.v.optional(values_1.v.string()),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var task, reviewTypeEmoji, content, _i, _a, change, _b, _c, item, messageId;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0: return [4 /*yield*/, ctx.db.get(args.taskId)];
                case 1:
                    task = _d.sent();
                    if (!task) {
                        throw new Error("Task not found");
                    }
                    reviewTypeEmoji = {
                        PRAISE: "🌟",
                        REFUTE: "🤔",
                        CHANGESET: "📝",
                        APPROVE: "✅",
                        REQUEST_CHANGES: "🔄",
                        REJECT: "❌",
                    };
                    content = "## Review: ".concat(reviewTypeEmoji[args.reviewType] || "📝", " ").concat(args.reviewType, "\n\n").concat(args.comments);
                    // Add changeset if provided
                    if (args.changeset && args.changeset.length > 0) {
                        content += "\n\n### Requested Changes\n";
                        for (_i = 0, _a = args.changeset; _i < _a.length; _i++) {
                            change = _a[_i];
                            content += "\n\uD83D\uDCDD **".concat(change.file, "**");
                            if (change.lineNumber) {
                                content += " (line ".concat(change.lineNumber, ")");
                            }
                            content += "\n   ".concat(change.change, "\n");
                        }
                    }
                    // Add checklist if provided
                    if (args.checklist) {
                        content += "\n\n### Checklist\n";
                        for (_b = 0, _c = args.checklist; _b < _c.length; _b++) {
                            item = _c[_b];
                            content += "\n- [".concat(item.checked ? "x" : " ", "] ").concat(item.label);
                            if (item.note)
                                content += " \u2014 ".concat(item.note);
                        }
                    }
                    return [4 /*yield*/, postMessageInternal(ctx, {
                            taskId: args.taskId,
                            authorType: args.authorType,
                            authorAgentId: args.authorAgentId,
                            authorUserId: args.authorUserId,
                            type: "REVIEW",
                            content: content,
                            idempotencyKey: args.idempotencyKey,
                            metadata: {
                                reviewType: args.reviewType,
                                changeset: args.changeset,
                            },
                        })];
                case 2:
                    messageId = _d.sent();
                    if (!(args.reviewType === "CHANGESET" || args.reviewType === "REQUEST_CHANGES")) return [3 /*break*/, 5];
                    // Move task back to IN_PROGRESS for revisions
                    return [4 /*yield*/, ctx.db.patch(args.taskId, {
                            status: "IN_PROGRESS",
                            reviewCycles: task.reviewCycles + 1,
                        })];
                case 3:
                    // Move task back to IN_PROGRESS for revisions
                    _d.sent();
                    // Create transition record
                    return [4 /*yield*/, ctx.db.insert("taskTransitions", {
                            projectId: task.projectId,
                            idempotencyKey: args.idempotencyKey || "review-changeset-".concat(args.taskId, "-").concat(Date.now()),
                            taskId: args.taskId,
                            fromStatus: task.status,
                            toStatus: "IN_PROGRESS",
                            actorType: args.authorType,
                            actorAgentId: args.authorAgentId,
                            actorUserId: args.authorUserId,
                            reason: "Changes requested in review",
                        })];
                case 4:
                    // Create transition record
                    _d.sent();
                    return [3 /*break*/, 10];
                case 5:
                    if (!(args.reviewType === "APPROVE" && args.authorAgentId)) return [3 /*break*/, 7];
                    // Create approval record for REVIEW → DONE
                    return [4 /*yield*/, ctx.db.insert("approvals", {
                            tenantId: task.tenantId,
                            projectId: task.projectId,
                            taskId: args.taskId,
                            requestorAgentId: args.authorAgentId,
                            actionType: "COMPLETE_TASK",
                            actionSummary: "Complete task after review approval",
                            riskLevel: "YELLOW",
                            status: "PENDING",
                            estimatedCost: 0,
                            justification: "Reviewer approved deliverable",
                            expiresAt: Date.now() + 1440 * 60 * 1000, // 24 hours
                        })];
                case 6:
                    // Create approval record for REVIEW → DONE
                    _d.sent();
                    return [3 /*break*/, 10];
                case 7:
                    if (!(args.reviewType === "REFUTE")) return [3 /*break*/, 9];
                    // Increment review cycles for loop detection
                    return [4 /*yield*/, ctx.db.patch(args.taskId, {
                            reviewCycles: task.reviewCycles + 1,
                        })];
                case 8:
                    // Increment review cycles for loop detection
                    _d.sent();
                    return [3 /*break*/, 10];
                case 9:
                    if (args.reviewType === "PRAISE") {
                        // Just record the praise, no state change
                        // Could increment a "praise count" metric if desired
                    }
                    _d.label = 10;
                case 10: return [2 /*return*/, messageId];
            }
        });
    }); },
});
