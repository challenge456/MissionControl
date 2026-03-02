"use strict";
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
exports.getAvailableFilters = exports.getSearchSuggestions = exports.quickSearch = exports.searchTasks = exports.searchAll = void 0;
var values_1 = require("convex/values");
var server_1 = require("./_generated/server");
/**
 * Advanced Search System
 *
 * Full-text search across tasks, comments, documents, and more
 * with filters, saved searches, and search history.
 */
// ============================================================================
// SEARCH QUERIES
// ============================================================================
exports.searchAll = (0, server_1.query)({
    args: {
        query: values_1.v.string(),
        projectId: values_1.v.optional(values_1.v.id("projects")),
        filters: values_1.v.optional(values_1.v.object({
            status: values_1.v.optional(values_1.v.array(values_1.v.string())),
            priority: values_1.v.optional(values_1.v.array(values_1.v.number())),
            type: values_1.v.optional(values_1.v.array(values_1.v.string())),
            assigneeIds: values_1.v.optional(values_1.v.array(values_1.v.id("agents"))),
            dateFrom: values_1.v.optional(values_1.v.number()),
            dateTo: values_1.v.optional(values_1.v.number()),
        })),
        limit: values_1.v.optional(values_1.v.number()),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var limit, searchQuery, tasks, _a, messages, _b, agents, _c, activities, _d, approvals, _e;
        return __generator(this, function (_f) {
            switch (_f.label) {
                case 0:
                    limit = args.limit || 50;
                    searchQuery = args.query.toLowerCase();
                    if (!args.projectId) return [3 /*break*/, 2];
                    return [4 /*yield*/, ctx.db.query("tasks")
                            .withIndex("by_project", function (q) { return q.eq("projectId", args.projectId); })
                            .collect()];
                case 1:
                    _a = _f.sent();
                    return [3 /*break*/, 4];
                case 2: return [4 /*yield*/, ctx.db.query("tasks").collect()];
                case 3:
                    _a = _f.sent();
                    _f.label = 4;
                case 4:
                    tasks = _a;
                    // Filter by text search
                    tasks = tasks.filter(function (t) {
                        var _a;
                        return t.title.toLowerCase().includes(searchQuery) ||
                            ((_a = t.description) === null || _a === void 0 ? void 0 : _a.toLowerCase().includes(searchQuery));
                    });
                    // Apply filters
                    if (args.filters) {
                        if (args.filters.status && args.filters.status.length > 0) {
                            tasks = tasks.filter(function (t) { return args.filters.status.includes(t.status); });
                        }
                        if (args.filters.priority && args.filters.priority.length > 0) {
                            tasks = tasks.filter(function (t) { return args.filters.priority.includes(t.priority); });
                        }
                        if (args.filters.type && args.filters.type.length > 0) {
                            tasks = tasks.filter(function (t) { return args.filters.type.includes(t.type); });
                        }
                        if (args.filters.assigneeIds && args.filters.assigneeIds.length > 0) {
                            tasks = tasks.filter(function (t) { var _a; return (_a = t.assigneeIds) === null || _a === void 0 ? void 0 : _a.some(function (id) { return args.filters.assigneeIds.includes(id); }); });
                        }
                        if (args.filters.dateFrom) {
                            tasks = tasks.filter(function (t) { return t._creationTime >= args.filters.dateFrom; });
                        }
                        if (args.filters.dateTo) {
                            tasks = tasks.filter(function (t) { return t._creationTime <= args.filters.dateTo; });
                        }
                    }
                    if (!args.projectId) return [3 /*break*/, 6];
                    return [4 /*yield*/, ctx.db.query("messages")
                            .withIndex("by_project", function (q) { return q.eq("projectId", args.projectId); })
                            .collect()];
                case 5:
                    _b = _f.sent();
                    return [3 /*break*/, 8];
                case 6: return [4 /*yield*/, ctx.db.query("messages").collect()];
                case 7:
                    _b = _f.sent();
                    _f.label = 8;
                case 8:
                    messages = _b;
                    messages = messages.filter(function (m) {
                        return m.content.toLowerCase().includes(searchQuery);
                    });
                    if (!args.projectId) return [3 /*break*/, 10];
                    return [4 /*yield*/, ctx.db.query("agents")
                            .withIndex("by_project", function (q) { return q.eq("projectId", args.projectId); })
                            .collect()];
                case 9:
                    _c = _f.sent();
                    return [3 /*break*/, 12];
                case 10: return [4 /*yield*/, ctx.db.query("agents").collect()];
                case 11:
                    _c = _f.sent();
                    _f.label = 12;
                case 12:
                    agents = _c;
                    agents = agents.filter(function (a) {
                        return a.name.toLowerCase().includes(searchQuery) ||
                            a.role.toLowerCase().includes(searchQuery);
                    });
                    if (!args.projectId) return [3 /*break*/, 14];
                    return [4 /*yield*/, ctx.db.query("activities")
                            .withIndex("by_project", function (q) { return q.eq("projectId", args.projectId); })
                            .collect()];
                case 13:
                    _d = _f.sent();
                    return [3 /*break*/, 16];
                case 14: return [4 /*yield*/, ctx.db.query("activities").collect()];
                case 15:
                    _d = _f.sent();
                    _f.label = 16;
                case 16:
                    activities = _d;
                    activities = activities.filter(function (a) {
                        return a.description.toLowerCase().includes(searchQuery);
                    });
                    if (!args.projectId) return [3 /*break*/, 18];
                    return [4 /*yield*/, ctx.db
                            .query("approvals")
                            .withIndex("by_project", function (q) { return q.eq("projectId", args.projectId); })
                            .collect()];
                case 17:
                    _e = _f.sent();
                    return [3 /*break*/, 20];
                case 18: return [4 /*yield*/, ctx.db.query("approvals").collect()];
                case 19:
                    _e = _f.sent();
                    _f.label = 20;
                case 20:
                    approvals = _e;
                    approvals = approvals.filter(function (approval) {
                        var _a, _b;
                        return approval.actionSummary.toLowerCase().includes(searchQuery) ||
                            approval.actionType.toLowerCase().includes(searchQuery) ||
                            approval.status.toLowerCase().includes(searchQuery) ||
                            approval.riskLevel.toLowerCase().includes(searchQuery) ||
                            approval.justification.toLowerCase().includes(searchQuery) ||
                            ((_b = (_a = approval.decisionReason) === null || _a === void 0 ? void 0 : _a.toLowerCase().includes(searchQuery)) !== null && _b !== void 0 ? _b : false);
                    });
                    return [2 /*return*/, {
                            tasks: tasks.slice(0, limit),
                            messages: messages.slice(0, 20),
                            agents: agents.slice(0, 10),
                            activities: activities.slice(0, 20),
                            approvals: approvals.slice(0, 20),
                            totalResults: tasks.length + messages.length + agents.length + activities.length + approvals.length,
                        }];
            }
        });
    }); },
});
exports.searchTasks = (0, server_1.query)({
    args: {
        query: values_1.v.string(),
        projectId: values_1.v.optional(values_1.v.id("projects")),
        filters: values_1.v.optional(values_1.v.object({
            status: values_1.v.optional(values_1.v.array(values_1.v.string())),
            priority: values_1.v.optional(values_1.v.array(values_1.v.number())),
            type: values_1.v.optional(values_1.v.array(values_1.v.string())),
            assigneeIds: values_1.v.optional(values_1.v.array(values_1.v.id("agents"))),
            dateFrom: values_1.v.optional(values_1.v.number()),
            dateTo: values_1.v.optional(values_1.v.number()),
        })),
        limit: values_1.v.optional(values_1.v.number()),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var limit, searchQuery, tasks, _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    limit = args.limit || 50;
                    searchQuery = args.query.toLowerCase();
                    if (!args.projectId) return [3 /*break*/, 2];
                    return [4 /*yield*/, ctx.db.query("tasks")
                            .withIndex("by_project", function (q) { return q.eq("projectId", args.projectId); })
                            .collect()];
                case 1:
                    _a = _b.sent();
                    return [3 /*break*/, 4];
                case 2: return [4 /*yield*/, ctx.db.query("tasks").collect()];
                case 3:
                    _a = _b.sent();
                    _b.label = 4;
                case 4:
                    tasks = _a;
                    // Text search
                    tasks = tasks.filter(function (t) {
                        var _a;
                        return t.title.toLowerCase().includes(searchQuery) ||
                            ((_a = t.description) === null || _a === void 0 ? void 0 : _a.toLowerCase().includes(searchQuery)) ||
                            t.type.toLowerCase().includes(searchQuery) ||
                            t.status.toLowerCase().includes(searchQuery);
                    });
                    // Apply filters (same as searchAll)
                    if (args.filters) {
                        if (args.filters.status && args.filters.status.length > 0) {
                            tasks = tasks.filter(function (t) { return args.filters.status.includes(t.status); });
                        }
                        if (args.filters.priority && args.filters.priority.length > 0) {
                            tasks = tasks.filter(function (t) { return args.filters.priority.includes(t.priority); });
                        }
                        if (args.filters.type && args.filters.type.length > 0) {
                            tasks = tasks.filter(function (t) { return args.filters.type.includes(t.type); });
                        }
                        if (args.filters.assigneeIds && args.filters.assigneeIds.length > 0) {
                            tasks = tasks.filter(function (t) { var _a; return (_a = t.assigneeIds) === null || _a === void 0 ? void 0 : _a.some(function (id) { return args.filters.assigneeIds.includes(id); }); });
                        }
                        if (args.filters.dateFrom) {
                            tasks = tasks.filter(function (t) { return t._creationTime >= args.filters.dateFrom; });
                        }
                        if (args.filters.dateTo) {
                            tasks = tasks.filter(function (t) { return t._creationTime <= args.filters.dateTo; });
                        }
                    }
                    // Sort by relevance (title matches first)
                    tasks.sort(function (a, b) {
                        var aTitle = a.title.toLowerCase().includes(searchQuery);
                        var bTitle = b.title.toLowerCase().includes(searchQuery);
                        if (aTitle && !bTitle)
                            return -1;
                        if (!aTitle && bTitle)
                            return 1;
                        return b._creationTime - a._creationTime;
                    });
                    return [2 /*return*/, tasks.slice(0, limit)];
            }
        });
    }); },
});
exports.quickSearch = (0, server_1.query)({
    args: {
        query: values_1.v.string(),
        projectId: values_1.v.optional(values_1.v.id("projects")),
        limit: values_1.v.optional(values_1.v.number()),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var limit, searchQuery, tasks, _a, agents, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    limit = args.limit || 10;
                    searchQuery = args.query.toLowerCase();
                    if (!args.projectId) return [3 /*break*/, 2];
                    return [4 /*yield*/, ctx.db.query("tasks")
                            .withIndex("by_project", function (q) { return q.eq("projectId", args.projectId); })
                            .collect()];
                case 1:
                    _a = _c.sent();
                    return [3 /*break*/, 4];
                case 2: return [4 /*yield*/, ctx.db.query("tasks").collect()];
                case 3:
                    _a = _c.sent();
                    _c.label = 4;
                case 4:
                    tasks = _a;
                    tasks = tasks.filter(function (t) {
                        return t.title.toLowerCase().includes(searchQuery);
                    }).slice(0, limit);
                    if (!args.projectId) return [3 /*break*/, 6];
                    return [4 /*yield*/, ctx.db.query("agents")
                            .withIndex("by_project", function (q) { return q.eq("projectId", args.projectId); })
                            .collect()];
                case 5:
                    _b = _c.sent();
                    return [3 /*break*/, 8];
                case 6: return [4 /*yield*/, ctx.db.query("agents").collect()];
                case 7:
                    _b = _c.sent();
                    _c.label = 8;
                case 8:
                    agents = _b;
                    agents = agents.filter(function (a) {
                        return a.name.toLowerCase().includes(searchQuery);
                    }).slice(0, 5);
                    return [2 /*return*/, { tasks: tasks, agents: agents }];
            }
        });
    }); },
});
// ============================================================================
// SEARCH SUGGESTIONS
// ============================================================================
exports.getSearchSuggestions = (0, server_1.query)({
    args: {
        query: values_1.v.string(),
        projectId: values_1.v.optional(values_1.v.id("projects")),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var searchQuery, suggestions, tasks, _a, words, types, statuses;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    searchQuery = args.query.toLowerCase();
                    suggestions = [];
                    if (!args.projectId) return [3 /*break*/, 2];
                    return [4 /*yield*/, ctx.db.query("tasks")
                            .withIndex("by_project", function (q) { return q.eq("projectId", args.projectId); })
                            .collect()];
                case 1:
                    _a = _b.sent();
                    return [3 /*break*/, 4];
                case 2: return [4 /*yield*/, ctx.db.query("tasks").collect()];
                case 3:
                    _a = _b.sent();
                    _b.label = 4;
                case 4:
                    tasks = _a;
                    words = new Set();
                    tasks.forEach(function (t) {
                        t.title.toLowerCase().split(/\s+/).forEach(function (word) {
                            if (word.length > 3 && word.startsWith(searchQuery)) {
                                words.add(word);
                            }
                        });
                    });
                    types = ["ENGINEERING", "CONTENT", "RESEARCH", "REVIEW", "PLANNING"];
                    types.forEach(function (type) {
                        if (type.toLowerCase().startsWith(searchQuery)) {
                            suggestions.push(type);
                        }
                    });
                    statuses = ["INBOX", "IN_PROGRESS", "REVIEW", "DONE", "BLOCKED"];
                    statuses.forEach(function (status) {
                        if (status.toLowerCase().startsWith(searchQuery)) {
                            suggestions.push(status);
                        }
                    });
                    return [2 /*return*/, __spreadArray(__spreadArray([], suggestions, true), Array.from(words), true).slice(0, 10)];
            }
        });
    }); },
});
// ============================================================================
// FILTERS
// ============================================================================
exports.getAvailableFilters = (0, server_1.query)({
    args: { projectId: values_1.v.optional(values_1.v.id("projects")) },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var tasks, _a, statuses, types, priorities, agents, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    if (!args.projectId) return [3 /*break*/, 2];
                    return [4 /*yield*/, ctx.db.query("tasks")
                            .withIndex("by_project", function (q) { return q.eq("projectId", args.projectId); })
                            .collect()];
                case 1:
                    _a = _c.sent();
                    return [3 /*break*/, 4];
                case 2: return [4 /*yield*/, ctx.db.query("tasks").collect()];
                case 3:
                    _a = _c.sent();
                    _c.label = 4;
                case 4:
                    tasks = _a;
                    statuses = __spreadArray([], new Set(tasks.map(function (t) { return t.status; })), true);
                    types = __spreadArray([], new Set(tasks.map(function (t) { return t.type; })), true);
                    priorities = __spreadArray([], new Set(tasks.map(function (t) { return t.priority; })), true);
                    if (!args.projectId) return [3 /*break*/, 6];
                    return [4 /*yield*/, ctx.db.query("agents")
                            .withIndex("by_project", function (q) { return q.eq("projectId", args.projectId); })
                            .collect()];
                case 5:
                    _b = _c.sent();
                    return [3 /*break*/, 8];
                case 6: return [4 /*yield*/, ctx.db.query("agents").collect()];
                case 7:
                    _b = _c.sent();
                    _c.label = 8;
                case 8:
                    agents = _b;
                    return [2 /*return*/, {
                            statuses: statuses,
                            types: types,
                            priorities: priorities.sort(),
                            agents: agents.map(function (a) { return ({ id: a._id, name: a.name }); }),
                        }];
            }
        });
    }); },
});
