"use strict";
/**
 * Mission — Convex Functions
 *
 * Mission statement management and reverse prompting for autonomous task generation.
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
exports.reversePrompt = exports.setMission = exports.getMission = void 0;
var values_1 = require("convex/values");
var server_1 = require("./_generated/server");
var api_1 = require("./_generated/api");
var getActiveTenant_1 = require("./lib/getActiveTenant");
// ============================================================================
// QUERIES
// ============================================================================
/**
 * Get the mission statement for the active tenant
 */
exports.getMission = (0, server_1.query)({
    args: {
        tenantId: values_1.v.optional(values_1.v.id("tenants")),
        projectId: values_1.v.optional(values_1.v.id("projects")),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var tenantId, tenant;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, (0, getActiveTenant_1.resolveActiveTenantId)(ctx, {
                        tenantId: args.tenantId,
                        projectId: args.projectId,
                        createDefaultIfMissing: true,
                    })];
                case 1:
                    tenantId = _b.sent();
                    if (!tenantId) {
                        return [2 /*return*/, { missionStatement: null, tenantId: null }];
                    }
                    return [4 /*yield*/, ctx.db.get(tenantId)];
                case 2:
                    tenant = _b.sent();
                    if (!tenant) {
                        return [2 /*return*/, { missionStatement: null, tenantId: tenantId }];
                    }
                    return [2 /*return*/, {
                            missionStatement: (_a = tenant.missionStatement) !== null && _a !== void 0 ? _a : null,
                            tenantId: tenantId,
                        }];
            }
        });
    }); },
});
// ============================================================================
// MUTATIONS
// ============================================================================
/**
 * Set the mission statement for the active tenant
 */
exports.setMission = (0, server_1.mutation)({
    args: {
        missionStatement: values_1.v.string(),
        tenantId: values_1.v.optional(values_1.v.id("tenants")),
        projectId: values_1.v.optional(values_1.v.id("projects")),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var tenantId;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, getActiveTenant_1.resolveActiveTenantId)(ctx, {
                        tenantId: args.tenantId,
                        projectId: args.projectId,
                        createDefaultIfMissing: true,
                    })];
                case 1:
                    tenantId = _a.sent();
                    if (!tenantId) {
                        throw new Error("No active tenant found");
                    }
                    return [4 /*yield*/, ctx.db.patch(tenantId, {
                            missionStatement: args.missionStatement,
                        })];
                case 2:
                    _a.sent();
                    // Log activity
                    return [4 /*yield*/, ctx.db.insert("activities", {
                            tenantId: tenantId,
                            projectId: args.projectId,
                            actorType: "HUMAN",
                            action: "MISSION_STATEMENT_UPDATED",
                            description: "Mission statement updated: \"".concat(args.missionStatement.substring(0, 100)).concat(args.missionStatement.length > 100 ? "..." : "", "\""),
                            targetType: "TENANT",
                            targetId: tenantId,
                            metadata: {
                                missionStatement: args.missionStatement,
                            },
                        })];
                case 3:
                    // Log activity
                    _a.sent();
                    return [2 /*return*/, { success: true, tenantId: tenantId }];
            }
        });
    }); },
});
/**
 * Reverse prompt: AI suggests tasks to advance the mission
 */
exports.reversePrompt = (0, server_1.action)({
    args: {
        tenantId: values_1.v.optional(values_1.v.id("tenants")),
        projectId: values_1.v.optional(values_1.v.id("projects")),
        autoCreate: values_1.v.optional(values_1.v.boolean()),
        maxSuggestions: values_1.v.optional(values_1.v.number()),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var missionData, tasks, agents, recentActivities, activeTasks, completedTasks, activeAgents, contextSummary, prompt, mockSuggestions, _loop_1, _i, mockSuggestions_1, suggestion, error_1;
        var _a, _b, _c, _d;
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0: return [4 /*yield*/, ctx.runQuery(api_1.api.mission.getMission, {
                        tenantId: args.tenantId,
                        projectId: args.projectId,
                    })];
                case 1:
                    missionData = _e.sent();
                    if (!missionData.missionStatement) {
                        throw new Error("No mission statement set. Please set a mission statement first.");
                    }
                    return [4 /*yield*/, ctx.runQuery(api_1.api.tasks.listAll, {
                            projectId: args.projectId,
                        })];
                case 2:
                    tasks = _e.sent();
                    return [4 /*yield*/, ctx.runQuery(api_1.api.agents.listAll, {
                            projectId: args.projectId,
                        })];
                case 3:
                    agents = _e.sent();
                    return [4 /*yield*/, ctx.runQuery(api_1.api.activities.listRecent, {
                            projectId: args.projectId,
                            limit: 20,
                        })];
                case 4:
                    recentActivities = _e.sent();
                    activeTasks = tasks.filter(function (t) {
                        return t.status === "IN_PROGRESS" || t.status === "ASSIGNED" || t.status === "REVIEW";
                    });
                    completedTasks = tasks.filter(function (t) { return t.status === "DONE"; });
                    activeAgents = agents.filter(function (a) { return a.status === "ACTIVE"; });
                    contextSummary = {
                        mission: missionData.missionStatement,
                        stats: {
                            totalTasks: tasks.length,
                            activeTasks: activeTasks.length,
                            completedTasks: completedTasks.length,
                            activeAgents: activeAgents.length,
                            totalAgents: agents.length,
                        },
                        recentTaskTitles: activeTasks.slice(0, 10).map(function (t) { return t.title; }),
                        completedTaskTitles: completedTasks.slice(-5).map(function (t) { return t.title; }),
                        agentRoles: activeAgents.map(function (a) { return ({ name: a.name, role: a.role }); }),
                        recentActivityDescriptions: recentActivities.slice(0, 10).map(function (a) { return a.description; }),
                    };
                    prompt = "You are a strategic AI assistant helping an autonomous organization achieve its mission.\n\nMISSION STATEMENT:\n\"".concat(missionData.missionStatement, "\"\n\nCURRENT STATE:\n- Total tasks: ").concat(contextSummary.stats.totalTasks, " (").concat(contextSummary.stats.activeTasks, " active, ").concat(contextSummary.stats.completedTasks, " completed)\n- Active agents: ").concat(contextSummary.stats.activeAgents, " of ").concat(contextSummary.stats.totalAgents, "\n\nACTIVE TASKS:\n").concat(contextSummary.recentTaskTitles.map(function (t, i) { return "".concat(i + 1, ". ").concat(t); }).join('\n'), "\n\nRECENTLY COMPLETED:\n").concat(contextSummary.completedTaskTitles.map(function (t, i) { return "".concat(i + 1, ". ").concat(t); }).join('\n'), "\n\nAVAILABLE AGENTS:\n").concat(contextSummary.agentRoles.map(function (a) { return "- ".concat(a.name, " (").concat(a.role, ")"); }).join('\n'), "\n\nRECENT ACTIVITY:\n").concat(contextSummary.recentActivityDescriptions.slice(0, 5).map(function (d, i) { return "".concat(i + 1, ". ").concat(d); }).join('\n'), "\n\nBased on the mission statement and current state, suggest ").concat((_a = args.maxSuggestions) !== null && _a !== void 0 ? _a : 3, " concrete, actionable tasks that would move the organization closer to achieving its mission. Focus on:\n1. Tasks that aren't already being worked on\n2. High-impact activities that align with the mission\n3. Tasks that leverage available agents effectively\n4. Strategic initiatives, not just maintenance work\n\nFor each task, provide:\n- title: Clear, actionable title (max 80 chars)\n- description: Detailed description with context and expected outcomes (2-3 sentences)\n- type: One of: CONTENT, SOCIAL, EMAIL_MARKETING, CUSTOMER_RESEARCH, SEO_RESEARCH, ENGINEERING, DOCS, OPS\n- priority: 1 (critical), 2 (high), 3 (normal), or 4 (low)\n- suggestedAssignee: Name of an agent from the list above (optional)\n- reasoning: Brief explanation of why this task advances the mission (1-2 sentences)\n\nRespond with valid JSON only, no markdown:\n{\n  \"suggestions\": [\n    {\n      \"title\": \"...\",\n      \"description\": \"...\",\n      \"type\": \"...\",\n      \"priority\": 1,\n      \"suggestedAssignee\": \"...\",\n      \"reasoning\": \"...\"\n    }\n  ]\n}");
                    _e.label = 5;
                case 5:
                    _e.trys.push([5, 10, , 11]);
                    mockSuggestions = [
                        {
                            title: "Analyze mission progress metrics and identify bottlenecks",
                            description: "Review the current task completion rate, agent utilization, and mission alignment scores. Identify 3-5 specific bottlenecks preventing faster progress toward the mission. Create a report with actionable recommendations for optimization.",
                            type: "OPS",
                            priority: 2,
                            suggestedAssignee: (_b = activeAgents[0]) === null || _b === void 0 ? void 0 : _b.name,
                            reasoning: "Understanding current performance is critical to accelerating mission progress. This meta-analysis will reveal systemic improvements.",
                        },
                        {
                            title: "Develop automated mission alignment scoring system",
                            description: "Create a system that automatically scores each completed task on how well it advances the mission statement. Use this to guide future task prioritization and agent assignments. Include a dashboard visualization.",
                            type: "ENGINEERING",
                            priority: 2,
                            suggestedAssignee: (_c = activeAgents.find(function (a) { return a.role === "SPECIALIST"; })) === null || _c === void 0 ? void 0 : _c.name,
                            reasoning: "Automated scoring ensures every task contributes meaningfully to the mission, preventing drift and busywork.",
                        },
                        {
                            title: "Research and document best practices for autonomous organizations",
                            description: "Survey existing autonomous AI organizations, multi-agent systems, and DAO governance models. Document 10-15 best practices that could be applied to improve our mission execution. Focus on coordination, decision-making, and value creation patterns.",
                            type: "DOCS",
                            priority: 3,
                            suggestedAssignee: (_d = activeAgents.find(function (a) { return a.role === "INTERN"; })) === null || _d === void 0 ? void 0 : _d.name,
                            reasoning: "Learning from other autonomous systems will accelerate our evolution and help us avoid common pitfalls.",
                        },
                    ];
                    if (!args.autoCreate) return [3 /*break*/, 9];
                    _loop_1 = function (suggestion) {
                        var agent;
                        return __generator(this, function (_f) {
                            switch (_f.label) {
                                case 0:
                                    agent = suggestion.suggestedAssignee
                                        ? agents.find(function (a) { return a.name === suggestion.suggestedAssignee; })
                                        : null;
                                    return [4 /*yield*/, ctx.runMutation(api_1.api.tasks.create, {
                                            projectId: args.projectId,
                                            title: suggestion.title,
                                            description: "".concat(suggestion.description, "\n\n**Mission Alignment:** ").concat(suggestion.reasoning),
                                            type: suggestion.type,
                                            priority: suggestion.priority,
                                            source: "MISSION_PROMPT",
                                            assigneeIds: agent ? [agent._id] : undefined,
                                        })];
                                case 1:
                                    _f.sent();
                                    return [2 /*return*/];
                            }
                        });
                    };
                    _i = 0, mockSuggestions_1 = mockSuggestions;
                    _e.label = 6;
                case 6:
                    if (!(_i < mockSuggestions_1.length)) return [3 /*break*/, 9];
                    suggestion = mockSuggestions_1[_i];
                    return [5 /*yield**/, _loop_1(suggestion)];
                case 7:
                    _e.sent();
                    _e.label = 8;
                case 8:
                    _i++;
                    return [3 /*break*/, 6];
                case 9: return [2 /*return*/, { suggestions: mockSuggestions }];
                case 10:
                    error_1 = _e.sent();
                    console.error("Error in reversePrompt:", error_1);
                    throw new Error("Failed to generate mission-aligned task suggestions: ".concat(error_1));
                case 11: return [2 /*return*/];
            }
        });
    }); },
});
