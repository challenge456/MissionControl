"use strict";
/**
 * Agents — Convex Functions
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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
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
exports.resetAll = exports.detectStaleAgents = exports.recordSpend = exports.update = exports.resumeAll = exports.pauseAll = exports.updateStatus = exports.heartbeat = exports.register = exports.listActive = exports.listByStatus = exports.listAll = exports.list = exports.getByName = exports.get = void 0;
var values_1 = require("convex/values");
var server_1 = require("./_generated/server");
var agentResolver_1 = require("./lib/agentResolver");
var armAudit_1 = require("./lib/armAudit");
// ============================================================================
// QUERIES
// ============================================================================
exports.get = (0, server_1.query)({
    args: { agentId: values_1.v.id("agents") },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, ctx.db.get(args.agentId)];
                case 1: return [2 /*return*/, _a.sent()];
            }
        });
    }); },
});
exports.getByName = (0, server_1.query)({
    args: { name: values_1.v.string() },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, ctx.db
                        .query("agents")
                        .withIndex("by_name", function (q) { return q.eq("name", args.name); })
                        .first()];
                case 1: return [2 /*return*/, _a.sent()];
            }
        });
    }); },
});
exports.list = (0, server_1.query)({
    args: {
        projectId: values_1.v.optional(values_1.v.id("projects")),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!args.projectId) return [3 /*break*/, 2];
                    return [4 /*yield*/, ctx.db
                            .query("agents")
                            .withIndex("by_project", function (q) { return q.eq("projectId", args.projectId); })
                            .collect()];
                case 1: return [2 /*return*/, _a.sent()];
                case 2: return [4 /*yield*/, ctx.db.query("agents").take(1000)];
                case 3: return [2 /*return*/, _a.sent()];
            }
        });
    }); },
});
/** Alias for backwards compatibility -- enriched with org position info */
exports.listAll = (0, server_1.query)({
    args: {
        projectId: values_1.v.optional(values_1.v.id("projects")),
        includeOrgPositions: values_1.v.optional(values_1.v.boolean()),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var agents;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!args.projectId) return [3 /*break*/, 2];
                    return [4 /*yield*/, ctx.db
                            .query("agents")
                            .withIndex("by_project", function (q) { return q.eq("projectId", args.projectId); })
                            .collect()];
                case 1:
                    agents = _a.sent();
                    return [3 /*break*/, 4];
                case 2: return [4 /*yield*/, ctx.db.query("agents").take(1000)];
                case 3:
                    agents = _a.sent();
                    _a.label = 4;
                case 4:
                    if (!args.includeOrgPositions)
                        return [2 /*return*/, agents];
                    return [4 /*yield*/, Promise.all(agents.map(function (agent) { return __awaiter(void 0, void 0, void 0, function () {
                            var positions;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, ctx.db
                                            .query("orgAssignments")
                                            .withIndex("by_agent", function (q) { return q.eq("agentId", agent._id); })
                                            .collect()];
                                    case 1:
                                        positions = _a.sent();
                                        return [2 /*return*/, __assign(__assign({}, agent), { orgPositions: positions })];
                                }
                            });
                        }); }))];
                case 5: 
                // Enrich with org positions
                return [2 /*return*/, _a.sent()];
            }
        });
    }); },
});
exports.listByStatus = (0, server_1.query)({
    args: {
        projectId: values_1.v.optional(values_1.v.id("projects")),
        status: values_1.v.string(),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!args.projectId) return [3 /*break*/, 2];
                    return [4 /*yield*/, ctx.db
                            .query("agents")
                            .withIndex("by_project_status", function (q) {
                            return q.eq("projectId", args.projectId).eq("status", args.status);
                        })
                            .collect()];
                case 1: return [2 /*return*/, _a.sent()];
                case 2: return [4 /*yield*/, ctx.db
                        .query("agents")
                        .withIndex("by_status", function (q) { return q.eq("status", args.status); })
                        .collect()];
                case 3: return [2 /*return*/, _a.sent()];
            }
        });
    }); },
});
exports.listActive = (0, server_1.query)({
    args: {
        projectId: values_1.v.optional(values_1.v.id("projects")),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!args.projectId) return [3 /*break*/, 2];
                    return [4 /*yield*/, ctx.db
                            .query("agents")
                            .withIndex("by_project_status", function (q) {
                            return q.eq("projectId", args.projectId).eq("status", "ACTIVE");
                        })
                            .collect()];
                case 1: return [2 /*return*/, _a.sent()];
                case 2: return [4 /*yield*/, ctx.db
                        .query("agents")
                        .withIndex("by_status", function (q) { return q.eq("status", "ACTIVE"); })
                        .collect()];
                case 3: return [2 /*return*/, _a.sent()];
            }
        });
    }); },
});
// ============================================================================
// MUTATIONS
// ============================================================================
exports.register = (0, server_1.mutation)({
    args: {
        projectId: values_1.v.optional(values_1.v.id("projects")),
        name: values_1.v.string(),
        emoji: values_1.v.optional(values_1.v.string()),
        role: values_1.v.string(),
        workspacePath: values_1.v.string(),
        soulVersionHash: values_1.v.optional(values_1.v.string()),
        allowedTaskTypes: values_1.v.optional(values_1.v.array(values_1.v.string())),
        allowedTools: values_1.v.optional(values_1.v.array(values_1.v.string())),
        budgetDaily: values_1.v.optional(values_1.v.number()),
        budgetPerRun: values_1.v.optional(values_1.v.number()),
        canSpawn: values_1.v.optional(values_1.v.boolean()),
        maxSubAgents: values_1.v.optional(values_1.v.number()),
        parentAgentId: values_1.v.optional(values_1.v.id("agents")),
        metadata: values_1.v.optional(values_1.v.any()),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var existing, existingRef, resolved_1, budgetDefaults, roleDefaults, project, _a, agentId, resolved, _b, _c;
        var _d, _e, _f;
        var _g, _h, _j, _k, _l, _m, _o, _p, _q, _r;
        return __generator(this, function (_s) {
            switch (_s.label) {
                case 0: return [4 /*yield*/, ctx.db
                        .query("agents")
                        .withIndex("by_name", function (q) { return q.eq("name", args.name); })
                        .first()];
                case 1:
                    existing = _s.sent();
                    if (!existing) return [3 /*break*/, 8];
                    return [4 /*yield*/, (0, agentResolver_1.resolveAgentRef)({ db: ctx.db }, { agentId: existing._id, createIfMissing: false })];
                case 2:
                    existingRef = _s.sent();
                    if (!!existingRef) return [3 /*break*/, 5];
                    return [4 /*yield*/, (0, agentResolver_1.ensureInstanceForLegacyAgent)({ db: ctx.db }, existing._id)];
                case 3:
                    resolved_1 = _s.sent();
                    return [4 /*yield*/, (0, armAudit_1.appendChangeRecord)(ctx.db, {
                            tenantId: existing.tenantId,
                            projectId: existing.projectId,
                            templateId: resolved_1.templateId,
                            versionId: resolved_1.versionId,
                            instanceId: resolved_1.instanceId,
                            legacyAgentId: existing._id,
                            type: "INSTANCE_CREATED",
                            summary: "Created ARM instance for legacy agent ".concat(existing.name),
                            relatedTable: "agents",
                            relatedId: existing._id,
                        })];
                case 4:
                    _s.sent();
                    _s.label = 5;
                case 5: 
                // Update existing agent
                return [4 /*yield*/, ctx.db.patch(existing._id, {
                        emoji: (_g = args.emoji) !== null && _g !== void 0 ? _g : existing.emoji,
                        soulVersionHash: args.soulVersionHash,
                        allowedTaskTypes: (_h = args.allowedTaskTypes) !== null && _h !== void 0 ? _h : existing.allowedTaskTypes,
                        allowedTools: (_j = args.allowedTools) !== null && _j !== void 0 ? _j : existing.allowedTools,
                        status: "ACTIVE",
                        lastHeartbeatAt: Date.now(),
                    })];
                case 6:
                    // Update existing agent
                    _s.sent();
                    _d = {};
                    return [4 /*yield*/, ctx.db.get(existing._id)];
                case 7: return [2 /*return*/, (_d.agent = _s.sent(), _d.created = false, _d)];
                case 8:
                    budgetDefaults = {
                        INTERN: { daily: 2.00, perRun: 0.25 },
                        SPECIALIST: { daily: 5.00, perRun: 0.75 },
                        LEAD: { daily: 12.00, perRun: 1.50 },
                    };
                    roleDefaults = (_k = budgetDefaults[args.role]) !== null && _k !== void 0 ? _k : budgetDefaults.INTERN;
                    if (!args.projectId) return [3 /*break*/, 10];
                    return [4 /*yield*/, ctx.db.get(args.projectId)];
                case 9:
                    _a = _s.sent();
                    return [3 /*break*/, 11];
                case 10:
                    _a = null;
                    _s.label = 11;
                case 11:
                    project = _a;
                    return [4 /*yield*/, ctx.db.insert("agents", {
                            tenantId: project === null || project === void 0 ? void 0 : project.tenantId,
                            projectId: args.projectId,
                            name: args.name,
                            emoji: args.emoji,
                            role: args.role,
                            status: "ACTIVE",
                            workspacePath: args.workspacePath,
                            soulVersionHash: args.soulVersionHash,
                            allowedTaskTypes: (_l = args.allowedTaskTypes) !== null && _l !== void 0 ? _l : [],
                            allowedTools: args.allowedTools,
                            budgetDaily: (_m = args.budgetDaily) !== null && _m !== void 0 ? _m : roleDefaults.daily,
                            budgetPerRun: (_o = args.budgetPerRun) !== null && _o !== void 0 ? _o : roleDefaults.perRun,
                            spendToday: 0,
                            canSpawn: (_p = args.canSpawn) !== null && _p !== void 0 ? _p : false,
                            maxSubAgents: (_q = args.maxSubAgents) !== null && _q !== void 0 ? _q : 0,
                            parentAgentId: args.parentAgentId,
                            errorStreak: 0,
                            lastHeartbeatAt: Date.now(),
                            metadata: args.metadata,
                        })];
                case 12:
                    agentId = _s.sent();
                    // Log activity
                    return [4 /*yield*/, ctx.db.insert("activities", {
                            projectId: args.projectId,
                            actorType: "SYSTEM",
                            action: "AGENT_REGISTERED",
                            description: "Agent \"".concat(args.name, "\" registered"),
                            targetType: "AGENT",
                            targetId: agentId,
                            agentId: agentId,
                        })];
                case 13:
                    // Log activity
                    _s.sent();
                    return [4 /*yield*/, (0, agentResolver_1.ensureInstanceForLegacyAgent)({ db: ctx.db }, agentId)];
                case 14:
                    resolved = _s.sent();
                    _b = armAudit_1.appendChangeRecord;
                    _c = [ctx.db];
                    _e = {};
                    return [4 /*yield*/, ctx.db.get(agentId)];
                case 15: return [4 /*yield*/, _b.apply(void 0, _c.concat([(_e.tenantId = (_r = (_s.sent())) === null || _r === void 0 ? void 0 : _r.tenantId,
                            _e.projectId = args.projectId,
                            _e.templateId = resolved.templateId,
                            _e.versionId = resolved.versionId,
                            _e.instanceId = resolved.instanceId,
                            _e.legacyAgentId = agentId,
                            _e.type = "INSTANCE_CREATED",
                            _e.summary = "Created ARM instance for agent ".concat(args.name),
                            _e.relatedTable = "agents",
                            _e.relatedId = agentId,
                            _e)]))];
                case 16:
                    _s.sent();
                    _f = {};
                    return [4 /*yield*/, ctx.db.get(agentId)];
                case 17: return [2 /*return*/, (_f.agent = _s.sent(), _f.created = true, _f)];
            }
        });
    }); },
});
exports.heartbeat = (0, server_1.mutation)({
    args: {
        agentId: values_1.v.id("agents"),
        sessionKey: values_1.v.optional(values_1.v.string()),
        currentTaskId: values_1.v.optional(values_1.v.id("tasks")),
        spendSinceLastHeartbeat: values_1.v.optional(values_1.v.number()),
        soulVersionHash: values_1.v.optional(values_1.v.string()),
        status: values_1.v.optional(values_1.v.string()),
        errorMessage: values_1.v.optional(values_1.v.string()),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var agent, now, resetHour, today, todayMs, spendToday, spendResetAt, errorStreak, budgetRemaining, budgetExceeded, pendingTasks, myPendingTasks, inboxTasks, claimableTasks, pendingApprovals, allNotifications, pendingNotifications;
        var _a;
        var _b, _c, _d, _e;
        return __generator(this, function (_f) {
            switch (_f.label) {
                case 0: return [4 /*yield*/, ctx.db.get(args.agentId)];
                case 1:
                    agent = _f.sent();
                    if (!agent) {
                        return [2 /*return*/, { success: false, error: "Agent not found" }];
                    }
                    now = Date.now();
                    resetHour = 0;
                    today = new Date();
                    today.setHours(resetHour, 0, 0, 0);
                    todayMs = today.getTime();
                    spendToday = agent.spendToday;
                    spendResetAt = agent.spendResetAt;
                    if (!spendResetAt || spendResetAt < todayMs) {
                        spendToday = 0;
                        spendResetAt = todayMs + 24 * 60 * 60 * 1000;
                    }
                    // Add new spend
                    if (args.spendSinceLastHeartbeat) {
                        spendToday += args.spendSinceLastHeartbeat;
                    }
                    errorStreak = agent.errorStreak;
                    if (args.errorMessage) {
                        errorStreak++;
                    }
                    else {
                        errorStreak = 0;
                    }
                    // Update agent
                    return [4 /*yield*/, ctx.db.patch(args.agentId, {
                            lastHeartbeatAt: now,
                            currentTaskId: (_b = args.currentTaskId) !== null && _b !== void 0 ? _b : agent.currentTaskId,
                            spendToday: spendToday,
                            spendResetAt: spendResetAt,
                            soulVersionHash: (_c = args.soulVersionHash) !== null && _c !== void 0 ? _c : agent.soulVersionHash,
                            errorStreak: errorStreak,
                            lastError: (_d = args.errorMessage) !== null && _d !== void 0 ? _d : undefined,
                            status: (_e = args.status) !== null && _e !== void 0 ? _e : agent.status,
                        })];
                case 2:
                    // Update agent
                    _f.sent();
                    budgetRemaining = agent.budgetDaily - spendToday;
                    budgetExceeded = budgetRemaining <= 0;
                    return [4 /*yield*/, ctx.db
                            .query("tasks")
                            .withIndex("by_status", function (q) { return q.eq("status", "ASSIGNED"); })
                            .take(200)];
                case 3:
                    pendingTasks = _f.sent();
                    myPendingTasks = pendingTasks.filter(function (t) {
                        return t.assigneeIds.includes(args.agentId);
                    });
                    return [4 /*yield*/, ctx.db
                            .query("tasks")
                            .withIndex("by_status", function (q) { return q.eq("status", "INBOX"); })
                            .take(200)];
                case 4:
                    inboxTasks = _f.sent();
                    claimableTasks = inboxTasks.filter(function (t) {
                        return agent.allowedTaskTypes.length === 0 ||
                            agent.allowedTaskTypes.includes(t.type);
                    });
                    return [4 /*yield*/, ctx.db
                            .query("approvals")
                            .withIndex("by_requestor", function (q) { return q.eq("requestorAgentId", args.agentId); })
                            .filter(function (q) { return q.eq(q.field("status"), "PENDING"); })
                            .collect()];
                case 5:
                    pendingApprovals = _f.sent();
                    return [4 /*yield*/, ctx.db
                            .query("notifications")
                            .withIndex("by_agent", function (q) { return q.eq("agentId", args.agentId); })
                            .order("desc")
                            .take(60)];
                case 6:
                    allNotifications = _f.sent();
                    pendingNotifications = allNotifications
                        .filter(function (n) { return n.readAt === undefined; })
                        .slice(0, 30);
                    _a = {
                        success: true
                    };
                    return [4 /*yield*/, ctx.db.get(args.agentId)];
                case 7: return [2 /*return*/, (_a.agent = _f.sent(),
                        _a.budgetRemaining = budgetRemaining,
                        _a.budgetExceeded = budgetExceeded,
                        _a.pendingTasks = myPendingTasks,
                        _a.claimableTasks = claimableTasks,
                        _a.pendingApprovals = pendingApprovals,
                        _a.pendingNotifications = pendingNotifications,
                        _a.errorQuarantineWarning = errorStreak >= 3,
                        _a)];
            }
        });
    }); },
});
exports.updateStatus = (0, server_1.mutation)({
    args: {
        agentId: values_1.v.id("agents"),
        status: values_1.v.string(),
        reason: values_1.v.optional(values_1.v.string()),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var agent, oldStatus;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, ctx.db.get(args.agentId)];
                case 1:
                    agent = _b.sent();
                    if (!agent) {
                        return [2 /*return*/, { success: false, error: "Agent not found" }];
                    }
                    oldStatus = agent.status;
                    return [4 /*yield*/, ctx.db.patch(args.agentId, {
                            status: args.status,
                        })];
                case 2:
                    _b.sent();
                    // Log activity
                    return [4 /*yield*/, ctx.db.insert("activities", {
                            actorType: "SYSTEM",
                            actorId: undefined,
                            action: "AGENT_STATUS_CHANGED",
                            description: "Agent \"".concat(agent.name, "\" status: ").concat(oldStatus, " \u2192 ").concat(args.status),
                            targetType: "AGENT",
                            targetId: args.agentId,
                            agentId: args.agentId,
                            beforeState: { status: oldStatus },
                            afterState: { status: args.status },
                            metadata: { reason: args.reason },
                        })];
                case 3:
                    // Log activity
                    _b.sent();
                    _a = { success: true };
                    return [4 /*yield*/, ctx.db.get(args.agentId)];
                case 4: return [2 /*return*/, (_a.agent = _b.sent(), _a)];
            }
        });
    }); },
});
/** Pause all ACTIVE agents (emergency "Pause squad") */
exports.pauseAll = (0, server_1.mutation)({
    args: {
        projectId: values_1.v.optional(values_1.v.id("projects")),
        reason: values_1.v.optional(values_1.v.string()),
        userId: values_1.v.optional(values_1.v.string()),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var active, _i, active_1, agent;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    if (!args.projectId) return [3 /*break*/, 2];
                    return [4 /*yield*/, ctx.db
                            .query("agents")
                            .withIndex("by_project_status", function (q) {
                            return q.eq("projectId", args.projectId).eq("status", "ACTIVE");
                        })
                            .collect()];
                case 1:
                    active = _b.sent();
                    return [3 /*break*/, 4];
                case 2: return [4 /*yield*/, ctx.db
                        .query("agents")
                        .withIndex("by_status", function (q) { return q.eq("status", "ACTIVE"); })
                        .collect()];
                case 3:
                    active = _b.sent();
                    _b.label = 4;
                case 4:
                    _i = 0, active_1 = active;
                    _b.label = 5;
                case 5:
                    if (!(_i < active_1.length)) return [3 /*break*/, 9];
                    agent = active_1[_i];
                    return [4 /*yield*/, ctx.db.patch(agent._id, { status: "PAUSED" })];
                case 6:
                    _b.sent();
                    return [4 /*yield*/, ctx.db.insert("activities", {
                            projectId: agent.projectId,
                            actorType: "HUMAN",
                            actorId: (_a = args.userId) !== null && _a !== void 0 ? _a : "operator",
                            action: "AGENT_PAUSED",
                            description: "Agent \"".concat(agent.name, "\" paused (Pause squad)"),
                            targetType: "AGENT",
                            targetId: agent._id,
                            agentId: agent._id,
                            metadata: { reason: args.reason },
                        })];
                case 7:
                    _b.sent();
                    _b.label = 8;
                case 8:
                    _i++;
                    return [3 /*break*/, 5];
                case 9: return [2 /*return*/, { paused: active.length, agentIds: active.map(function (a) { return a._id; }) }];
            }
        });
    }); },
});
/** Resume all PAUSED agents */
exports.resumeAll = (0, server_1.mutation)({
    args: {
        projectId: values_1.v.optional(values_1.v.id("projects")),
        reason: values_1.v.optional(values_1.v.string()),
        userId: values_1.v.optional(values_1.v.string()),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var paused, _i, paused_1, agent;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    if (!args.projectId) return [3 /*break*/, 2];
                    return [4 /*yield*/, ctx.db
                            .query("agents")
                            .withIndex("by_project_status", function (q) {
                            return q.eq("projectId", args.projectId).eq("status", "PAUSED");
                        })
                            .collect()];
                case 1:
                    paused = _b.sent();
                    return [3 /*break*/, 4];
                case 2: return [4 /*yield*/, ctx.db
                        .query("agents")
                        .withIndex("by_status", function (q) { return q.eq("status", "PAUSED"); })
                        .collect()];
                case 3:
                    paused = _b.sent();
                    _b.label = 4;
                case 4:
                    _i = 0, paused_1 = paused;
                    _b.label = 5;
                case 5:
                    if (!(_i < paused_1.length)) return [3 /*break*/, 9];
                    agent = paused_1[_i];
                    return [4 /*yield*/, ctx.db.patch(agent._id, { status: "ACTIVE" })];
                case 6:
                    _b.sent();
                    return [4 /*yield*/, ctx.db.insert("activities", {
                            projectId: agent.projectId,
                            actorType: "HUMAN",
                            actorId: (_a = args.userId) !== null && _a !== void 0 ? _a : "operator",
                            action: "AGENT_RESUMED",
                            description: "Agent \"".concat(agent.name, "\" resumed"),
                            targetType: "AGENT",
                            targetId: agent._id,
                            agentId: agent._id,
                            metadata: { reason: args.reason },
                        })];
                case 7:
                    _b.sent();
                    _b.label = 8;
                case 8:
                    _i++;
                    return [3 /*break*/, 5];
                case 9: return [2 /*return*/, { resumed: paused.length, agentIds: paused.map(function (a) { return a._id; }) }];
            }
        });
    }); },
});
/** Update agent fields (name, emoji, budget, metadata, etc.) */
exports.update = (0, server_1.mutation)({
    args: {
        agentId: values_1.v.id("agents"),
        name: values_1.v.optional(values_1.v.string()),
        emoji: values_1.v.optional(values_1.v.string()),
        allowedTaskTypes: values_1.v.optional(values_1.v.array(values_1.v.string())),
        allowedTools: values_1.v.optional(values_1.v.array(values_1.v.string())),
        budgetDaily: values_1.v.optional(values_1.v.number()),
        budgetPerRun: values_1.v.optional(values_1.v.number()),
        metadata: values_1.v.optional(values_1.v.any()),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var agentId, updates, agent, nameConflict, filtered, _i, _a, _b, key, value;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    agentId = args.agentId, updates = __rest(args, ["agentId"]);
                    return [4 /*yield*/, ctx.db.get(agentId)];
                case 1:
                    agent = _c.sent();
                    if (!agent)
                        throw new Error("Agent not found");
                    if (!(args.name !== undefined && args.name !== agent.name)) return [3 /*break*/, 3];
                    return [4 /*yield*/, ctx.db
                            .query("agents")
                            .withIndex("by_name", function (q) { return q.eq("name", args.name); })
                            .first()];
                case 2:
                    nameConflict = _c.sent();
                    if (nameConflict && nameConflict._id !== agentId) {
                        throw new Error("An agent with the name \"".concat(args.name, "\" already exists"));
                    }
                    _c.label = 3;
                case 3:
                    filtered = {};
                    for (_i = 0, _a = Object.entries(updates); _i < _a.length; _i++) {
                        _b = _a[_i], key = _b[0], value = _b[1];
                        if (value !== undefined) {
                            filtered[key] = value;
                        }
                    }
                    if (Object.keys(filtered).length === 0) {
                        return [2 /*return*/, agent];
                    }
                    return [4 /*yield*/, ctx.db.patch(agentId, filtered)];
                case 4:
                    _c.sent();
                    return [4 /*yield*/, ctx.db.insert("activities", {
                            projectId: agent.projectId,
                            actorType: "HUMAN",
                            actorId: "operator",
                            action: "AGENT_UPDATED",
                            description: "Agent \"".concat(agent.name, "\" updated"),
                            targetType: "AGENT",
                            targetId: agentId,
                            agentId: agentId,
                            metadata: { updatedFields: Object.keys(filtered) },
                        })];
                case 5:
                    _c.sent();
                    return [4 /*yield*/, ctx.db.get(agentId)];
                case 6: return [2 /*return*/, _c.sent()];
            }
        });
    }); },
});
exports.recordSpend = (0, server_1.mutation)({
    args: {
        agentId: values_1.v.id("agents"),
        amount: values_1.v.number(),
        runId: values_1.v.optional(values_1.v.id("runs")),
        description: values_1.v.optional(values_1.v.string()),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var agent, newSpend, budgetExceeded;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, ctx.db.get(args.agentId)];
                case 1:
                    agent = _a.sent();
                    if (!agent) {
                        return [2 /*return*/, { success: false, error: "Agent not found" }];
                    }
                    newSpend = agent.spendToday + args.amount;
                    budgetExceeded = newSpend > agent.budgetDaily;
                    return [4 /*yield*/, ctx.db.patch(args.agentId, {
                            spendToday: newSpend,
                        })];
                case 2:
                    _a.sent();
                    return [2 /*return*/, {
                            success: true,
                            spendToday: newSpend,
                            budgetRemaining: agent.budgetDaily - newSpend,
                            budgetExceeded: budgetExceeded,
                        }];
            }
        });
    }); },
});
// ============================================================================
// HEARTBEAT RECOVERY (Internal — called by cron)
// ============================================================================
/**
 * Detect stale agents that haven't sent a heartbeat within the threshold.
 * Recovery flow:
 *   1. Detect: Check lastHeartbeatAt against staleThresholdMs (env: HEARTBEAT_STALE_MINUTES, default 5)
 *   2. Alert: Create a CRITICAL alert in the alerts table
 *   3. Quarantine: Set agent status to QUARANTINED
 *   4. Reassign: Move agent's in-progress tasks to BLOCKED
 *
 * Enable via Convex env: HEARTBEAT_RECOVERY_ENABLED=true.
 * Optionally set HEARTBEAT_IGNORE_NEVER=true to skip agents that have never sent a heartbeat (e.g. seeded only).
 */
exports.detectStaleAgents = (0, server_1.internalMutation)({
    args: {},
    handler: function (ctx) { return __awaiter(void 0, void 0, void 0, function () {
        var now, staleMinutes, STALE_THRESHOLD_MS, ignoreNeverHeartbeat, activeAgents, drainedAgents, monitoredAgents, staleAgents, _loop_1, _i, monitoredAgents_1, agent;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    if (process.env.HEARTBEAT_RECOVERY_ENABLED !== "true") {
                        return [2 /*return*/, { checked: 0, staleCount: 0, staleAgents: [], skipped: "HEARTBEAT_RECOVERY_ENABLED not set" }];
                    }
                    now = Date.now();
                    staleMinutes = parseInt((_a = process.env.HEARTBEAT_STALE_MINUTES) !== null && _a !== void 0 ? _a : "5", 10) || 5;
                    STALE_THRESHOLD_MS = Math.min(Math.max(staleMinutes * 60 * 1000, 60000), 60 * 60 * 1000);
                    ignoreNeverHeartbeat = process.env.HEARTBEAT_IGNORE_NEVER === "true";
                    return [4 /*yield*/, ctx.db
                            .query("agents")
                            .withIndex("by_status", function (q) { return q.eq("status", "ACTIVE"); })
                            .collect()];
                case 1:
                    activeAgents = _b.sent();
                    return [4 /*yield*/, ctx.db
                            .query("agents")
                            .withIndex("by_status", function (q) { return q.eq("status", "DRAINED"); })
                            .collect()];
                case 2:
                    drainedAgents = _b.sent();
                    monitoredAgents = __spreadArray(__spreadArray([], activeAgents, true), drainedAgents, true);
                    staleAgents = [];
                    _loop_1 = function (agent) {
                        var lastHB, staleDuration, task, assignedTasks, agentAssignedTasks, _c, agentAssignedTasks_1, task;
                        return __generator(this, function (_d) {
                            switch (_d.label) {
                                case 0:
                                    lastHB = agent.lastHeartbeatAt;
                                    if (ignoreNeverHeartbeat && (lastHB == null || lastHB === 0))
                                        return [2 /*return*/, "continue"];
                                    if (!(!lastHB || now - lastHB > STALE_THRESHOLD_MS)) return [3 /*break*/, 14];
                                    staleDuration = lastHB ? now - lastHB : Infinity;
                                    // 1. QUARANTINE the agent
                                    return [4 /*yield*/, ctx.db.patch(agent._id, {
                                            status: "QUARANTINED",
                                        })];
                                case 1:
                                    // 1. QUARANTINE the agent
                                    _d.sent();
                                    // 2. CREATE ALERT
                                    return [4 /*yield*/, ctx.db.insert("alerts", {
                                            projectId: agent.projectId,
                                            severity: "CRITICAL",
                                            type: "AGENT_STALE_HEARTBEAT",
                                            title: "Agent \"".concat(agent.name, "\" is unresponsive"),
                                            description: lastHB
                                                ? "Agent \"".concat(agent.name, "\" last heartbeat was ").concat(Math.round((now - lastHB) / 1000), "s ago (threshold: ").concat(STALE_THRESHOLD_MS / 1000, "s). Agent has been quarantined.")
                                                : "Agent \"".concat(agent.name, "\" has never sent a heartbeat. Agent has been quarantined."),
                                            agentId: agent._id,
                                            status: "OPEN",
                                        })];
                                case 2:
                                    // 2. CREATE ALERT
                                    _d.sent();
                                    // 3. LOG ACTIVITY
                                    return [4 /*yield*/, ctx.db.insert("activities", {
                                            projectId: agent.projectId,
                                            actorType: "SYSTEM",
                                            action: "AGENT_QUARANTINED",
                                            description: "Agent \"".concat(agent.name, "\" quarantined: stale heartbeat"),
                                            targetType: "AGENT",
                                            targetId: agent._id,
                                            agentId: agent._id,
                                            metadata: {
                                                reason: "stale_heartbeat",
                                                lastHeartbeatAt: lastHB,
                                                staleDurationMs: staleDuration === Infinity ? null : staleDuration,
                                            },
                                        })];
                                case 3:
                                    // 3. LOG ACTIVITY
                                    _d.sent();
                                    if (!agent.currentTaskId) return [3 /*break*/, 8];
                                    return [4 /*yield*/, ctx.db.get(agent.currentTaskId)];
                                case 4:
                                    task = _d.sent();
                                    if (!(task && task.status === "IN_PROGRESS")) return [3 /*break*/, 8];
                                    return [4 /*yield*/, ctx.db.patch(task._id, {
                                            status: "BLOCKED",
                                            blockedReason: "Agent \"".concat(agent.name, "\" is unresponsive (stale heartbeat). Task needs reassignment."),
                                        })];
                                case 5:
                                    _d.sent();
                                    // Alert for the blocked task
                                    return [4 /*yield*/, ctx.db.insert("alerts", {
                                            projectId: task.projectId,
                                            severity: "WARNING",
                                            type: "TASK_BLOCKED_STALE_AGENT",
                                            title: "Task \"".concat(task.title, "\" blocked \u2014 agent unresponsive"),
                                            description: "Task was being worked on by \"".concat(agent.name, "\" who became unresponsive. Task has been moved to BLOCKED for reassignment."),
                                            agentId: agent._id,
                                            taskId: task._id,
                                            status: "OPEN",
                                        })];
                                case 6:
                                    // Alert for the blocked task
                                    _d.sent();
                                    return [4 /*yield*/, ctx.db.insert("activities", {
                                            projectId: task.projectId,
                                            actorType: "SYSTEM",
                                            action: "TASK_BLOCKED",
                                            description: "Task \"".concat(task.title, "\" blocked: agent \"").concat(agent.name, "\" unresponsive"),
                                            targetType: "TASK",
                                            targetId: task._id,
                                            agentId: agent._id,
                                            metadata: { reason: "agent_stale_heartbeat" },
                                        })];
                                case 7:
                                    _d.sent();
                                    _d.label = 8;
                                case 8: return [4 /*yield*/, ctx.db
                                        .query("tasks")
                                        .withIndex("by_status", function (q) { return q.eq("status", "ASSIGNED"); })
                                        .collect()];
                                case 9:
                                    assignedTasks = _d.sent();
                                    agentAssignedTasks = assignedTasks.filter(function (t) {
                                        return t.assigneeIds.includes(agent._id);
                                    });
                                    _c = 0, agentAssignedTasks_1 = agentAssignedTasks;
                                    _d.label = 10;
                                case 10:
                                    if (!(_c < agentAssignedTasks_1.length)) return [3 /*break*/, 13];
                                    task = agentAssignedTasks_1[_c];
                                    if (!(task.assigneeIds.length === 1)) return [3 /*break*/, 12];
                                    return [4 /*yield*/, ctx.db.patch(task._id, {
                                            status: "BLOCKED",
                                            blockedReason: "Sole assignee \"".concat(agent.name, "\" is unresponsive. Task needs reassignment."),
                                        })];
                                case 11:
                                    _d.sent();
                                    _d.label = 12;
                                case 12:
                                    _c++;
                                    return [3 /*break*/, 10];
                                case 13:
                                    staleAgents.push({
                                        id: agent._id,
                                        name: agent.name,
                                        staleDurationMs: staleDuration === Infinity ? -1 : staleDuration,
                                    });
                                    _d.label = 14;
                                case 14: return [2 /*return*/];
                            }
                        });
                    };
                    _i = 0, monitoredAgents_1 = monitoredAgents;
                    _b.label = 3;
                case 3:
                    if (!(_i < monitoredAgents_1.length)) return [3 /*break*/, 6];
                    agent = monitoredAgents_1[_i];
                    return [5 /*yield**/, _loop_1(agent)];
                case 4:
                    _b.sent();
                    _b.label = 5;
                case 5:
                    _i++;
                    return [3 /*break*/, 3];
                case 6: return [2 /*return*/, {
                        checked: monitoredAgents.length,
                        staleCount: staleAgents.length,
                        staleAgents: staleAgents,
                    }];
            }
        });
    }); },
});
// ============================================================================
// RESET ALL AGENTS (Dev convenience — reactivate quarantined/offline agents)
// ============================================================================
/**
 * Reset all quarantined/offline agents back to ACTIVE with a fresh heartbeat.
 * Useful during development when no agent runtime is sending heartbeats.
 */
exports.resetAll = (0, server_1.mutation)({
    args: {
        projectId: values_1.v.optional(values_1.v.id("projects")),
    },
    handler: function (ctx, args) { return __awaiter(void 0, void 0, void 0, function () {
        var now, agents, _a, resetCount, _i, agents_1, agent, oldStatus;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    now = Date.now();
                    if (!args.projectId) return [3 /*break*/, 2];
                    return [4 /*yield*/, ctx.db
                            .query("agents")
                            .withIndex("by_project", function (q) { return q.eq("projectId", args.projectId); })
                            .collect()];
                case 1:
                    _a = _b.sent();
                    return [3 /*break*/, 4];
                case 2: return [4 /*yield*/, ctx.db.query("agents").collect()];
                case 3:
                    _a = _b.sent();
                    _b.label = 4;
                case 4:
                    agents = _a;
                    resetCount = 0;
                    _i = 0, agents_1 = agents;
                    _b.label = 5;
                case 5:
                    if (!(_i < agents_1.length)) return [3 /*break*/, 9];
                    agent = agents_1[_i];
                    if (!(agent.status === "QUARANTINED" || agent.status === "OFFLINE")) return [3 /*break*/, 8];
                    oldStatus = agent.status;
                    return [4 /*yield*/, ctx.db.patch(agent._id, {
                            status: "ACTIVE",
                            lastHeartbeatAt: now,
                            errorStreak: 0,
                            lastError: undefined,
                        })];
                case 6:
                    _b.sent();
                    // Log activity for each reset agent (consistent with updateStatus/pauseAll/resumeAll)
                    return [4 /*yield*/, ctx.db.insert("activities", {
                            projectId: agent.projectId,
                            actorType: "HUMAN",
                            actorId: "operator",
                            action: "AGENT_RESET",
                            description: "Agent \"".concat(agent.name, "\" reset: ").concat(oldStatus, " \u2192 ACTIVE"),
                            targetType: "AGENT",
                            targetId: agent._id,
                            agentId: agent._id,
                            beforeState: { status: oldStatus },
                            afterState: { status: "ACTIVE" },
                            metadata: { reason: "manual_reset" },
                        })];
                case 7:
                    // Log activity for each reset agent (consistent with updateStatus/pauseAll/resumeAll)
                    _b.sent();
                    resetCount++;
                    _b.label = 8;
                case 8:
                    _i++;
                    return [3 /*break*/, 5];
                case 9: return [2 /*return*/, { resetCount: resetCount, totalAgents: agents.length }];
            }
        });
    }); },
});
