"use strict";
/**
 * Meeting Orchestration Functions
 *
 * Schedule meetings, generate agendas/notes, convert action items to tasks.
 * Supports Manual provider (markdown) and future Zoom integration.
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
exports.convertActionItems = exports.cancel = exports.complete = exports.start = exports.schedule = exports.getUpcoming = exports.get = exports.list = void 0;
var values_1 = require("convex/values");
var server_1 = require("./_generated/server");
var meetingStatusValidator = values_1.v.union(values_1.v.literal("SCHEDULED"), values_1.v.literal("IN_PROGRESS"), values_1.v.literal("COMPLETED"), values_1.v.literal("CANCELLED"));
var meetingProviderValidator = values_1.v.union(values_1.v.literal("MANUAL"), values_1.v.literal("ZOOM"));
var participantValidator = values_1.v.object({
    agentId: values_1.v.string(),
    orgPosition: values_1.v.optional(values_1.v.string()),
    role: values_1.v.optional(values_1.v.string()),
});
var actionItemValidator = values_1.v.object({
    description: values_1.v.string(),
    assigneeAgentId: values_1.v.optional(values_1.v.string()),
    taskId: values_1.v.optional(values_1.v.id("tasks")),
    dueAt: values_1.v.optional(values_1.v.number()),
    completed: values_1.v.boolean(),
});
// ============================================================================
// QUERIES
// ============================================================================
/**
 * List meetings for a project.
 */
exports.list = (0, server_1.query)({
    args: {
        projectId: values_1.v.optional(values_1.v.id("projects")),
        status: values_1.v.optional(meetingStatusValidator),
        limit: values_1.v.optional(values_1.v.number()),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var limit, meetings;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    limit = (_a = args.limit) !== null && _a !== void 0 ? _a : 50;
                    if (!args.projectId) return [3 /*break*/, 2];
                    return [4 /*yield*/, ctx.db
                            .query("meetings")
                            .withIndex("by_project", function (q) { return q.eq("projectId", args.projectId); })
                            .order("desc")
                            .take(limit)];
                case 1:
                    meetings = _b.sent();
                    return [3 /*break*/, 4];
                case 2: return [4 /*yield*/, ctx.db
                        .query("meetings")
                        .order("desc")
                        .take(limit)];
                case 3:
                    meetings = _b.sent();
                    _b.label = 4;
                case 4:
                    if (args.status) {
                        meetings = meetings.filter(function (m) { return m.status === args.status; });
                    }
                    return [2 /*return*/, meetings];
            }
        });
    }); },
});
/**
 * Get a single meeting with full details.
 */
exports.get = (0, server_1.query)({
    args: {
        meetingId: values_1.v.id("meetings"),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, ctx.db.get(args.meetingId)];
                case 1: return [2 /*return*/, _a.sent()];
            }
        });
    }); },
});
/**
 * Get upcoming meetings (scheduled, not yet completed/cancelled).
 */
exports.getUpcoming = (0, server_1.query)({
    args: {
        projectId: values_1.v.optional(values_1.v.id("projects")),
        limit: values_1.v.optional(values_1.v.number()),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var limit, now, meetings;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    limit = (_a = args.limit) !== null && _a !== void 0 ? _a : 20;
                    now = Date.now();
                    if (!args.projectId) return [3 /*break*/, 2];
                    return [4 /*yield*/, ctx.db
                            .query("meetings")
                            .withIndex("by_project", function (q) { return q.eq("projectId", args.projectId); })
                            .collect()];
                case 1:
                    meetings = _b.sent();
                    return [3 /*break*/, 4];
                case 2: return [4 /*yield*/, ctx.db.query("meetings").collect()];
                case 3:
                    meetings = _b.sent();
                    _b.label = 4;
                case 4: return [2 /*return*/, meetings
                        .filter(function (m) { return m.status === "SCHEDULED" && m.scheduledAt >= now; })
                        .sort(function (a, b) { return a.scheduledAt - b.scheduledAt; })
                        .slice(0, limit)];
            }
        });
    }); },
});
// ============================================================================
// MUTATIONS
// ============================================================================
/**
 * Schedule a new meeting.
 */
exports.schedule = (0, server_1.mutation)({
    args: {
        projectId: values_1.v.optional(values_1.v.id("projects")),
        title: values_1.v.string(),
        scheduledAt: values_1.v.number(),
        duration: values_1.v.number(),
        hostAgentId: values_1.v.optional(values_1.v.string()),
        participants: values_1.v.array(participantValidator),
        provider: values_1.v.optional(meetingProviderValidator),
        agendaTopics: values_1.v.optional(values_1.v.array(values_1.v.string())),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var topics, agenda, start, end, calendarPayload;
        var _a, _b, _c;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    topics = (_a = args.agendaTopics) !== null && _a !== void 0 ? _a : [
                        "Opening remarks and status check",
                        "Key discussion items",
                        "Blockers and escalations",
                        "Action items and next steps",
                    ];
                    agenda = topics.map(function (t, i) { return "".concat(i + 1, ". ").concat(t); }).join("\n");
                    start = new Date(args.scheduledAt);
                    end = new Date(args.scheduledAt + args.duration * 60000);
                    calendarPayload = JSON.stringify({
                        summary: args.title,
                        dtstart: start.toISOString(),
                        dtend: end.toISOString(),
                        organizer: (_b = args.hostAgentId) !== null && _b !== void 0 ? _b : "Mission Control",
                        attendees: args.participants.map(function (p) {
                            var _a;
                            return ({
                                id: p.agentId,
                                role: (_a = p.role) !== null && _a !== void 0 ? _a : "attendee",
                                orgPosition: p.orgPosition,
                            });
                        }),
                        description: "Mission Control Meeting: ".concat(args.title),
                        location: "Mission Control Platform",
                        uid: "mc-meeting-".concat(Date.now(), "@missioncontrol"),
                    }, null, 2);
                    return [4 /*yield*/, ctx.db.insert("meetings", {
                            projectId: args.projectId,
                            title: args.title,
                            agenda: agenda,
                            scheduledAt: args.scheduledAt,
                            duration: args.duration,
                            status: "SCHEDULED",
                            hostAgentId: args.hostAgentId,
                            participants: args.participants,
                            provider: (_c = args.provider) !== null && _c !== void 0 ? _c : "MANUAL",
                            calendarPayload: calendarPayload,
                        })];
                case 1: return [2 /*return*/, _d.sent()];
            }
        });
    }); },
});
/**
 * Start a meeting (transition to IN_PROGRESS).
 */
exports.start = (0, server_1.mutation)({
    args: {
        meetingId: values_1.v.id("meetings"),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var meeting;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, ctx.db.get(args.meetingId)];
                case 1:
                    meeting = _a.sent();
                    if (!meeting)
                        throw new Error("Meeting not found");
                    if (meeting.status !== "SCHEDULED") {
                        throw new Error("Cannot start meeting in status ".concat(meeting.status));
                    }
                    return [4 /*yield*/, ctx.db.patch(args.meetingId, { status: "IN_PROGRESS" })];
                case 2:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); },
});
/**
 * Complete a meeting with notes and action items.
 */
exports.complete = (0, server_1.mutation)({
    args: {
        meetingId: values_1.v.id("meetings"),
        notes: values_1.v.optional(values_1.v.string()),
        actionItems: values_1.v.optional(values_1.v.array(actionItemValidator)),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var meeting;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, ctx.db.get(args.meetingId)];
                case 1:
                    meeting = _a.sent();
                    if (!meeting)
                        throw new Error("Meeting not found");
                    return [4 /*yield*/, ctx.db.patch(args.meetingId, {
                            status: "COMPLETED",
                            notes: args.notes,
                            actionItems: args.actionItems,
                        })];
                case 2:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); },
});
/**
 * Cancel a meeting.
 */
exports.cancel = (0, server_1.mutation)({
    args: {
        meetingId: values_1.v.id("meetings"),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var meeting;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, ctx.db.get(args.meetingId)];
                case 1:
                    meeting = _a.sent();
                    if (!meeting)
                        throw new Error("Meeting not found");
                    return [4 /*yield*/, ctx.db.patch(args.meetingId, { status: "CANCELLED" })];
                case 2:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); },
});
/**
 * Convert meeting action items to tasks with owners and due dates.
 */
exports.convertActionItems = (0, server_1.mutation)({
    args: {
        meetingId: values_1.v.id("meetings"),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var meeting, taskIds, updatedItems, i, item, taskId;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, ctx.db.get(args.meetingId)];
                case 1:
                    meeting = _a.sent();
                    if (!meeting)
                        throw new Error("Meeting not found");
                    if (!meeting.actionItems || meeting.actionItems.length === 0) {
                        return [2 /*return*/, { created: 0, taskIds: [] }];
                    }
                    taskIds = [];
                    updatedItems = __spreadArray([], meeting.actionItems, true);
                    i = 0;
                    _a.label = 2;
                case 2:
                    if (!(i < updatedItems.length)) return [3 /*break*/, 5];
                    item = updatedItems[i];
                    if (item.completed || item.taskId)
                        return [3 /*break*/, 4];
                    return [4 /*yield*/, ctx.db.insert("tasks", {
                            tenantId: meeting.tenantId,
                            projectId: meeting.projectId,
                            title: item.description,
                            description: "Action item from meeting: ".concat(meeting.title),
                            type: "OPS",
                            status: "INBOX",
                            priority: 3,
                            assigneeIds: [],
                            assigneeInstanceIds: [],
                            reviewCycles: 0,
                            actualCost: 0,
                            dueAt: item.dueAt,
                            source: "DASHBOARD",
                            createdBy: "SYSTEM",
                            createdByRef: "meeting:".concat(meeting._id),
                        })];
                case 3:
                    taskId = _a.sent();
                    taskIds.push(taskId);
                    updatedItems[i] = __assign(__assign({}, item), { taskId: taskId });
                    _a.label = 4;
                case 4:
                    i++;
                    return [3 /*break*/, 2];
                case 5: 
                // Update meeting with task IDs
                return [4 /*yield*/, ctx.db.patch(args.meetingId, { actionItems: updatedItems })];
                case 6:
                    // Update meeting with task IDs
                    _a.sent();
                    return [2 /*return*/, { created: taskIds.length, taskIds: taskIds }];
            }
        });
    }); },
});
